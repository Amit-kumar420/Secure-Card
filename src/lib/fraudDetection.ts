import type { TransactionData, FraudAnalysis, RiskFactor } from '@/types/fraud';

// Transaction history simulation (in real app, this would come from backend)
const transactionHistory: Array<{ amount: number; time: Date; location: string }> = [];

export function analyzeTransaction(data: TransactionData): FraudAnalysis {
  const riskFactors: RiskFactor[] = [];
  let totalRiskScore = 0;

  // 1. Amount Analysis
  const amountRisk = analyzeAmount(data.amount);
  if (amountRisk.score > 0) {
    riskFactors.push(amountRisk);
    totalRiskScore += amountRisk.score;
  }

  // 2. Time Pattern Analysis
  const timeRisk = analyzeTimePattern(data.time);
  if (timeRisk.score > 0) {
    riskFactors.push(timeRisk);
    totalRiskScore += timeRisk.score;
  }

  // 3. Location Analysis
  const locationRisk = analyzeLocation(data.location);
  if (locationRisk.score > 0) {
    riskFactors.push(locationRisk);
    totalRiskScore += locationRisk.score;
  }

  // 4. Merchant Category Risk
  const merchantRisk = analyzeMerchantCategory(data.merchantCategory);
  if (merchantRisk.score > 0) {
    riskFactors.push(merchantRisk);
    totalRiskScore += merchantRisk.score;
  }

  // 5. Card Number Validation
  const cardRisk = analyzeCardNumber(data.cardNumber);
  if (cardRisk.score > 0) {
    riskFactors.push(cardRisk);
    totalRiskScore += cardRisk.score;
  }

  // 6. Velocity Check (multiple transactions in short time)
  const velocityRisk = analyzeVelocity(data.amount, data.time);
  if (velocityRisk.score > 0) {
    riskFactors.push(velocityRisk);
    totalRiskScore += velocityRisk.score;
  }

  // Add transaction to history
  transactionHistory.push({
    amount: data.amount,
    time: new Date(data.time),
    location: data.location,
  });

  // Keep only last 10 transactions
  if (transactionHistory.length > 10) {
    transactionHistory.shift();
  }

  // Calculate overall risk score (0-100)
  const overallRiskScore = Math.min(100, totalRiskScore);

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' | 'critical';
  if (overallRiskScore < 25) riskLevel = 'low';
  else if (overallRiskScore < 50) riskLevel = 'medium';
  else if (overallRiskScore < 75) riskLevel = 'high';
  else riskLevel = 'critical';

  // Determine if fraudulent
  const isFraudulent = overallRiskScore >= 60;
  const confidence = calculateConfidence(riskFactors.length, overallRiskScore);

  // Generate recommendations
  const recommendations = generateRecommendations(riskFactors, isFraudulent);

  return {
    overallRiskScore,
    riskLevel,
    isFraudulent,
    confidence,
    riskFactors,
    recommendations,
    timestamp: new Date().toISOString(),
  };
}

function analyzeAmount(amount: number): RiskFactor {
  if (amount > 5000) {
    return {
      name: 'Unusual High Amount',
      score: 35,
      severity: 'critical',
      description: `Transaction amount of ₹${amount.toFixed(2)} is significantly higher than typical patterns.`,
    };
  } else if (amount > 2000) {
    return {
      name: 'High Amount',
      score: 20,
      severity: 'high',
      description: `Transaction amount of ₹${amount.toFixed(2)} is above average spending limit.`,
    };
  } else if (amount > 1000) {
    return {
      name: 'Elevated Amount',
      score: 10,
      severity: 'medium',
      description: `Transaction amount of ₹${amount.toFixed(2)} is moderately high.`,
    };
  }
  return { name: '', score: 0, severity: 'low', description: '' };
}

function analyzeTimePattern(timeString: string): RiskFactor {
  const time = new Date(timeString);
  const hours = time.getHours();

  // Unusual hours: 2 AM - 5 AM
  if (hours >= 2 && hours <= 5) {
    return {
      name: 'Unusual Time Pattern',
      score: 25,
      severity: 'high',
      description: 'Transaction occurred during unusual hours (2 AM - 5 AM), often associated with fraudulent activity.',
    };
  }

  // Late night: 11 PM - 2 AM
  if (hours >= 23 || hours <= 2) {
    return {
      name: 'Late Night Transaction',
      score: 12,
      severity: 'medium',
      description: 'Transaction occurred during late night hours, which may indicate higher risk.',
    };
  }

  return { name: '', score: 0, severity: 'low', description: '' };
}

function analyzeLocation(location: string): RiskFactor {
  const highRiskCountries = ['nigeria', 'russia', 'china', 'ukraine', 'romania'];
  const locationLower = location.toLowerCase();

  for (const country of highRiskCountries) {
    if (locationLower.includes(country)) {
      return {
        name: 'High-Risk Location',
        score: 30,
        severity: 'critical',
        description: `Transaction from ${location} is flagged as high-risk location for card fraud.`,
      };
    }
  }

  // International transaction (contains country that's not US)
  if (
    !locationLower.includes('usa') &&
    !locationLower.includes('united states') &&
    locationLower.match(/[a-z]{2,}/)
  ) {
    return {
      name: 'International Transaction',
      score: 15,
      severity: 'medium',
      description: `International transaction from ${location} requires additional verification.`,
    };
  }

  return { name: '', score: 0, severity: 'low', description: '' };
}

function analyzeMerchantCategory(category: string): RiskFactor {
  const highRiskCategories = ['online_shopping', 'entertainment', 'travel'];

  if (highRiskCategories.includes(category)) {
    return {
      name: 'High-Risk Merchant Category',
      score: 15,
      severity: 'medium',
      description: `${category.replace('_', ' ')} category has higher fraud rates and requires closer monitoring.`,
    };
  }

  return { name: '', score: 0, severity: 'low', description: '' };
}

function analyzeCardNumber(cardNumber: string): RiskFactor {
  // Remove spaces and dashes
  const cleaned = cardNumber.replace(/[\s-]/g, '');

  // Luhn algorithm check
  if (!isValidCardNumber(cleaned)) {
    return {
      name: 'Invalid Card Number',
      score: 50,
      severity: 'critical',
      description: 'Card number failed Luhn algorithm validation. This is likely a fraudulent or mistyped card.',
    };
  }

  return { name: '', score: 0, severity: 'low', description: '' };
}

function isValidCardNumber(cardNumber: string): boolean {
  if (!/^\d+$/.test(cardNumber)) return false;
  if (cardNumber.length < 13 || cardNumber.length > 19) return false;

  let sum = 0;
  let isEven = false;

  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber[i]);

    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

function analyzeVelocity(amount: number, timeString: string): RiskFactor {
  const currentTime = new Date(timeString);
  const recentTransactions = transactionHistory.filter((t) => {
    const timeDiff = (currentTime.getTime() - t.time.getTime()) / 1000 / 60; // minutes
    return timeDiff <= 30;
  });

  if (recentTransactions.length >= 3) {
    return {
      name: 'High Transaction Velocity',
      score: 35,
      severity: 'critical',
      description: `${recentTransactions.length} transactions detected in the last 30 minutes. This rapid succession is highly suspicious.`,
    };
  } else if (recentTransactions.length >= 2) {
    return {
      name: 'Multiple Recent Transactions',
      score: 20,
      severity: 'high',
      description: 'Multiple transactions detected in a short time period. Possible card testing or fraud.',
    };
  }

  // Check for rapid large amounts
  const recentTotal = recentTransactions.reduce((sum, t) => sum + t.amount, 0);
  if (recentTotal + amount > 3000) {
    return {
      name: 'High Velocity Amount',
      score: 25,
      severity: 'high',
      description: `Total transaction amount of ₹${(recentTotal + amount).toFixed(2)} in short time period exceeds normal patterns.`,
    };
  }

  return { name: '', score: 0, severity: 'low', description: '' };
}

function calculateConfidence(factorCount: number, riskScore: number): number {
  // More risk factors and higher scores = higher confidence
  const factorConfidence = Math.min(factorCount * 15, 50);
  const scoreConfidence = riskScore / 2;
  return Math.min(95, factorConfidence + scoreConfidence);
}

function generateRecommendations(
  riskFactors: RiskFactor[],
  isFraudulent: boolean
): string[] {
  const recommendations: string[] = [];

  if (isFraudulent) {
    recommendations.push('⛔ BLOCK TRANSACTION - High fraud probability detected');
    recommendations.push('Contact cardholder immediately via verified phone number');
    recommendations.push('Flag card for additional monitoring and verification');
  } else {
    const hasHighRisk = riskFactors.some((f) => f.severity === 'critical' || f.severity === 'high');

    if (hasHighRisk) {
      recommendations.push('⚠️ VERIFY TRANSACTION - Request additional authentication');
      recommendations.push('Send one-time password (OTP) to registered contact');
      recommendations.push('Consider 3D Secure verification');
    } else {
      recommendations.push('✅ APPROVE TRANSACTION - Risk levels within acceptable range');
      recommendations.push('Continue standard monitoring procedures');
    }
  }

  // Specific recommendations based on risk factors
  const factorNames = riskFactors.map((f) => f.name);

  if (factorNames.includes('Unusual High Amount')) {
    recommendations.push('Verify transaction with cardholder before processing');
  }

  if (factorNames.includes('High Transaction Velocity')) {
    recommendations.push('Implement velocity limits to prevent card testing');
  }

  if (factorNames.includes('High-Risk Location')) {
    recommendations.push('Require additional identity verification for international transactions');
  }

  if (factorNames.includes('Invalid Card Number')) {
    recommendations.push('Reject transaction immediately - invalid card data');
  }

  return recommendations;
}
