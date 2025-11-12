import type { TransactionData, FraudAnalysis, RiskFactor } from '@/types/fraud';

// Transaction history for velocity and pattern analysis
let transactionHistory: Array<TransactionData & { timestamp: number }> = [];

// Enhanced Luhn algorithm for card validation with issuer detection
function validateCardNumber(cardNumber: string): { valid: boolean; issuer: string } {
  const digits = cardNumber.replace(/\D/g, '');
  
  // Check length
  if (digits.length < 13 || digits.length > 19) {
    return { valid: false, issuer: 'unknown' };
  }

  // Detect card issuer
  let issuer = 'unknown';
  if (/^4/.test(digits)) issuer = 'Visa';
  else if (/^5[1-5]/.test(digits)) issuer = 'Mastercard';
  else if (/^3[47]/.test(digits)) issuer = 'Amex';
  else if (/^6(?:011|5)/.test(digits)) issuer = 'Discover';
  else if (/^35/.test(digits)) issuer = 'JCB';
  else if (/^(?:2131|1800|35)/.test(digits)) issuer = 'JCB';
  else if (/^62/.test(digits)) issuer = 'RuPay';

  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i]);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return { valid: sum % 10 === 0, issuer };
}

export function analyzeTransaction(data: TransactionData): FraudAnalysis {
  const riskFactors: RiskFactor[] = [];
  let riskScore = 0;

  // Store transaction for velocity check
  const currentTime = new Date(data.time).getTime();
  transactionHistory.push({
    ...data,
    timestamp: currentTime,
  });

  // Keep only last 24 hours of transactions
  const oneDayAgo = currentTime - 24 * 60 * 60 * 1000;
  transactionHistory = transactionHistory.filter(t => t.timestamp > oneDayAgo);

  const transactionDate = new Date(data.time);

  // 1. Enhanced Card Number Validation
  const cardValidation = validateCardNumber(data.cardNumber);
  if (!cardValidation.valid) {
    riskFactors.push({
      name: 'Invalid Card Number',
      severity: 'critical',
      score: 30,
      description: 'Card number failed Luhn algorithm validation - potentially fake card',
    });
    riskScore += 30;
  } else if (cardValidation.issuer === 'unknown') {
    riskFactors.push({
      name: 'Unrecognized Card Issuer',
      severity: 'medium',
      score: 10,
      description: 'Card issuer could not be identified',
    });
    riskScore += 10;
  }

  // 2. Transaction Velocity Analysis
  const recentTransactions = transactionHistory.filter(
    t => currentTime - t.timestamp < 5 * 60 * 1000 // Last 5 minutes
  );
  
  if (recentTransactions.length > 5) {
    riskFactors.push({
      name: 'High Transaction Velocity',
      severity: 'critical',
      score: 25,
      description: `${recentTransactions.length} transactions in 5 minutes - possible card testing`,
    });
    riskScore += 25;
  } else if (recentTransactions.length > 3) {
    riskFactors.push({
      name: 'Elevated Transaction Velocity',
      severity: 'high',
      score: 15,
      description: `${recentTransactions.length} transactions in 5 minutes`,
    });
    riskScore += 15;
  }

  // 3. Enhanced Amount Analysis
  if (data.amount > 200000) {
    riskFactors.push({
      name: 'Very High Transaction Amount',
      severity: 'critical',
      score: 25,
      description: `Extremely large transaction: ₹${data.amount.toFixed(2)}`,
    });
    riskScore += 25;
  } else if (data.amount > 100000) {
    riskFactors.push({
      name: 'High Transaction Amount',
      severity: 'high',
      score: 20,
      description: `Large transaction: ₹${data.amount.toFixed(2)}`,
    });
    riskScore += 20;
  } else if (data.amount > 50000) {
    riskFactors.push({
      name: 'Elevated Transaction Amount',
      severity: 'medium',
      score: 12,
      description: `Above-average transaction: ₹${data.amount.toFixed(2)}`,
    });
    riskScore += 12;
  } else if (data.amount < 50) {
    riskFactors.push({
      name: 'Micro Transaction',
      severity: 'low',
      score: 8,
      description: 'Very small amounts often used for card testing by fraudsters',
    });
    riskScore += 8;
  } else if (data.amount < 100) {
    riskFactors.push({
      name: 'Small Amount',
      severity: 'low',
      score: 4,
      description: 'Small transactions can indicate initial fraud attempts',
    });
    riskScore += 4;
  }

  // 4. Enhanced Time-based Analysis
  const transactionHour = transactionDate.getHours();
  const transactionDay = transactionDate.getDay();
  
  if (transactionHour >= 2 && transactionHour < 5) {
    riskFactors.push({
      name: 'Very Late Night Transaction',
      severity: 'high',
      score: 15,
      description: 'Transaction between 2 AM - 5 AM - highest risk hours',
    });
    riskScore += 15;
  } else if (transactionHour >= 23 || transactionHour < 6) {
    riskFactors.push({
      name: 'Late Night Transaction',
      severity: 'medium',
      score: 10,
      description: 'Transaction during unusual hours (11 PM - 6 AM)',
    });
    riskScore += 10;
  }

  // Weekend analysis
  if (transactionDay === 0 || transactionDay === 6) {
    if (data.amount > 50000) {
      riskFactors.push({
        name: 'Large Weekend Transaction',
        severity: 'medium',
        score: 8,
        description: 'High-value transaction on weekend',
      });
      riskScore += 8;
    }
  }

  // 5. Enhanced Location Risk Assessment
  const highRiskLocations = ['russia', 'nigeria', 'ghana', 'pakistan', 'ukraine', 'belarus'];
  const mediumRiskLocations = ['china', 'vietnam', 'indonesia', 'romania', 'bulgaria'];
  const locationLower = data.location.toLowerCase();
  
  if (highRiskLocations.some(loc => locationLower.includes(loc))) {
    riskFactors.push({
      name: 'High-Risk Geographic Location',
      severity: 'critical',
      score: 25,
      description: `Transaction from high-fraud region: ${data.location}`,
    });
    riskScore += 25;
  } else if (mediumRiskLocations.some(loc => locationLower.includes(loc))) {
    riskFactors.push({
      name: 'Medium-Risk Geographic Location',
      severity: 'medium',
      score: 12,
      description: `Transaction from elevated-risk region: ${data.location}`,
    });
    riskScore += 12;
  }

  // Cross-border detection
  const previousLocation = transactionHistory.length > 1 
    ? transactionHistory[transactionHistory.length - 2].location 
    : null;
  
  if (previousLocation && previousLocation !== data.location) {
    const timeDiff = currentTime - (transactionHistory[transactionHistory.length - 2]?.timestamp || 0);
    const minutesDiff = timeDiff / (1000 * 60);
    
    if (minutesDiff < 60) {
      riskFactors.push({
        name: 'Impossible Travel Velocity',
        severity: 'critical',
        score: 30,
        description: `Location changed from ${previousLocation} to ${data.location} in ${Math.round(minutesDiff)} minutes`,
      });
      riskScore += 30;
    }
  }

  // 6. Enhanced Merchant Category Risk
  const merchantRisks: Record<string, { score: number; reason: string }> = {
    gas_station: { score: 18, reason: 'Gas stations are prime targets for card skimmers and cloned cards' },
    online_shopping: { score: 14, reason: 'CNP (Card Not Present) transactions have higher fraud rates' },
    travel: { score: 12, reason: 'Travel bookings are high-value and frequently targeted' },
    entertainment: { score: 8, reason: 'Digital goods and subscriptions enable anonymous fraud' },
    utilities: { score: 3, reason: 'Lower risk but still monitored' },
  };

  const merchantRisk = merchantRisks[data.merchantCategory];
  if (merchantRisk) {
    riskFactors.push({
      name: 'Merchant Category Risk',
      severity: merchantRisk.score > 12 ? 'high' : merchantRisk.score > 8 ? 'medium' : 'low',
      score: merchantRisk.score,
      description: merchantRisk.reason,
    });
    riskScore += merchantRisk.score;
  }

  // High-value + high-risk merchant combination
  if (data.amount > 50000 && (data.merchantCategory === 'gas_station' || data.merchantCategory === 'online_shopping')) {
    riskFactors.push({
      name: 'High-Value High-Risk Merchant',
      severity: 'critical',
      score: 15,
      description: 'Large transaction at merchant type commonly targeted by fraudsters',
    });
    riskScore += 15;
  }

  // 7. Cardholder Name Analysis
  const nameParts = data.cardholderName.trim().split(/\s+/);
  if (nameParts.length < 2) {
    riskFactors.push({
      name: 'Single Name Detected',
      severity: 'low',
      score: 5,
      description: 'Cardholder name appears incomplete - possible data entry error or fraud',
    });
    riskScore += 5;
  }

  // Check for suspicious patterns in name
  if (/test|fraud|admin|user/i.test(data.cardholderName)) {
    riskFactors.push({
      name: 'Suspicious Cardholder Name',
      severity: 'critical',
      score: 35,
      description: 'Name contains test/fraud keywords',
    });
    riskScore += 35;
  }

  // 8. Statistical Anomaly Detection
  if (transactionHistory.length > 5) {
    const amounts = transactionHistory.map(t => t.amount);
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const stdDev = Math.sqrt(
      amounts.map(x => Math.pow(x - avgAmount, 2)).reduce((a, b) => a + b, 0) / amounts.length
    );

    // Check if current transaction is more than 3 standard deviations from mean
    if (Math.abs(data.amount - avgAmount) > 3 * stdDev) {
      riskFactors.push({
        name: 'Statistical Anomaly',
        severity: 'high',
        score: 18,
        description: `Transaction amount significantly deviates from user's spending pattern`,
      });
      riskScore += 18;
    }
  }

  // Determine risk level and fraud status with enhanced thresholds
  let riskLevel: 'low' | 'medium' | 'high' | 'critical';
  let isFraudulent = false;

  if (riskScore >= 80) {
    riskLevel = 'critical';
    isFraudulent = true;
  } else if (riskScore >= 60) {
    riskLevel = 'high';
    isFraudulent = true;
  } else if (riskScore >= 35) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'low';
  }

  // Calculate confidence score based on number of factors and their severity
  const criticalFactors = riskFactors.filter(f => f.severity === 'critical').length;
  const highFactors = riskFactors.filter(f => f.severity === 'high').length;
  const baseConfidence = 65;
  const confidenceBoost = (criticalFactors * 8) + (highFactors * 5) + (riskFactors.length * 2);
  const confidence = Math.min(98, baseConfidence + confidenceBoost);

  // Generate comprehensive recommendations
  const recommendations: string[] = [];

  if (isFraudulent) {
    recommendations.push('🚫 DECLINE this transaction immediately - high fraud probability');
    recommendations.push('📞 Contact cardholder urgently via verified phone number');
    recommendations.push('🔒 Block card temporarily and issue fraud alert');
    recommendations.push('📊 Review all recent transactions on this card');
    recommendations.push('🔍 Check for related fraudulent patterns across accounts');
    recommendations.push('📝 File fraud report and notify payment network');
  } else if (riskLevel === 'high') {
    recommendations.push('⚠️ HOLD transaction for manual review');
    recommendations.push('🔐 Require step-up authentication (OTP + CVV)');
    recommendations.push('📞 Attempt to contact cardholder before approval');
    recommendations.push('👁️ Monitor next 3 transactions closely');
  } else if (riskLevel === 'medium') {
    recommendations.push('✋ Request additional verification (CVV/OTP)');
    recommendations.push('🔔 Set alert for similar transaction patterns');
    recommendations.push('📈 Monitor account activity for next 24 hours');
    recommendations.push('💳 Consider velocity limits for this card');
  } else {
    recommendations.push('✅ Transaction appears legitimate - proceed normally');
    recommendations.push('📊 Continue standard fraud monitoring');
    recommendations.push('💚 Low risk - minimal additional action required');
  }

  return {
    overallRiskScore: Math.min(100, riskScore),
    riskLevel,
    isFraudulent,
    confidence,
    riskFactors,
    recommendations,
    timestamp: new Date().toISOString(),
  };
}
