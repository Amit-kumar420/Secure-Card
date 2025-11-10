export interface TransactionData {
  cardNumber: string;
  cardholderName: string;
  amount: number;
  merchantName: string;
  merchantCategory: string;
  location: string;
  time: string;
  deviceId?: string;
}

export interface RiskFactor {
  name: string;
  score: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

export interface FraudAnalysis {
  overallRiskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  isFraudulent: boolean;
  confidence: number;
  riskFactors: RiskFactor[];
  recommendations: string[];
  timestamp: string;
}

export type MerchantCategory =
  | 'retail'
  | 'online_shopping'
  | 'gas_station'
  | 'restaurant'
  | 'travel'
  | 'entertainment'
  | 'utilities'
  | 'healthcare'
  | 'other';
