import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Shield, AlertCircle } from 'lucide-react';
import LocationSelect from './LocationSelect';
import { analyzeTransaction } from '@/lib/fraudDetection';
import { supabase } from '@/lib/supabase';
import type { TransactionData, FraudAnalysis } from '@/types/fraud';

interface FraudDetectionFormProps {
  onAnalysisComplete: (analysis: FraudAnalysis) => void;
}

export default function FraudDetectionForm({ onAnalysisComplete }: FraudDetectionFormProps) {
  const [loading, setLoading] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [analysisAborted, setAnalysisAborted] = useState(false);
  const [formData, setFormData] = useState<TransactionData>({
    cardNumber: '',
    cardholderName: '',
    amount: 0,
    merchantName: '',
    merchantCategory: 'retail',
    location: '',
    time: new Date().toISOString().slice(0, 16),
  });
  const [errors, setErrors] = useState<Partial<Record<keyof TransactionData, string>>>({});

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted;
  };

  const handleCardNumberChange = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    if (cleaned.length <= 16 && /^\d*$/.test(cleaned)) {
      const formatted = formatCardNumber(cleaned);
      setFormData({ ...formData, cardNumber: formatted });
      
      // Validate card number
      if (cleaned.length > 0 && cleaned.length < 13) {
        setErrors({ ...errors, cardNumber: 'Card number must be 13-16 digits' });
      } else if (cleaned.length >= 13) {
        setErrors({ ...errors, cardNumber: '' });
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof TransactionData, string>> = {};

    const cleanedCard = formData.cardNumber.replace(/\s/g, '');
    if (!cleanedCard) {
      newErrors.cardNumber = 'Card number is required';
    } else if (cleanedCard.length < 13 || cleanedCard.length > 16) {
      newErrors.cardNumber = 'Card number must be 13-16 digits';
    } else if (!/^\d+$/.test(cleanedCard)) {
      newErrors.cardNumber = 'Card number must contain only digits';
    }

    if (!formData.cardholderName.trim()) {
      newErrors.cardholderName = 'Cardholder name is required';
    } else if (!/^[a-zA-Z\s]+$/.test(formData.cardholderName)) {
      newErrors.cardholderName = 'Name should contain only letters';
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than ₹0';
    } else if (formData.amount > 10000000) {
      newErrors.amount = 'Amount exceeds maximum limit (₹1 Crore)';
    }

    if (!formData.merchantName.trim()) {
      newErrors.merchantName = 'Merchant name is required';
    }

    if (!formData.location) {
      newErrors.location = 'Please select a location';
    }

    if (!formData.time) {
      newErrors.time = 'Transaction time is required';
    } else {
      const transactionDate = new Date(formData.time);
      const now = new Date();
      if (transactionDate > now) {
        newErrors.time = 'Transaction time cannot be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      toast.error('Please fix all errors before submitting');
      return;
    }

    setLoading(true);
    setLoadingTimeout(false);
    setAnalysisAborted(false);

    // Set 15-second timeout warning
    const timeoutId = setTimeout(() => {
      setLoadingTimeout(true);
    }, 15000);

    try {
      // Quick validation delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      // Check if user cancelled
      if (analysisAborted) {
        return;
      }

      // Perform fraud analysis with cleaned card number
      const cleanedData = {
        ...formData,
        cardNumber: formData.cardNumber.replace(/\s/g, ''),
      };
      const analysis = analyzeTransaction(cleanedData);

      // Save to database
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Mask card number (show only last 4 digits)
        const cleanedCard = formData.cardNumber.replace(/\s/g, '');
        const maskedCard = '**** **** **** ' + cleanedCard.slice(-4);
        
        const { error: saveError } = await supabase
          .from('fraud_analyses')
          .insert({
            user_id: user.id,
            card_number_masked: maskedCard,
            cardholder_name: formData.cardholderName,
            amount: formData.amount,
            merchant_name: formData.merchantName,
            merchant_category: formData.merchantCategory,
            location: formData.location,
            transaction_time: formData.time,
            overall_risk_score: analysis.overallRiskScore,
            risk_level: analysis.riskLevel,
            is_fraudulent: analysis.isFraudulent,
            confidence: analysis.confidence,
            risk_factors: analysis.riskFactors,
            recommendations: analysis.recommendations,
          });

        if (saveError) {
          console.error('Save error:', saveError);
          toast.error('Analysis complete but failed to save to history');
        } else {
          toast.success('Analysis complete and saved!');
        }
      }

      onAnalysisComplete(analysis);
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze transaction. Please try again.');
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
      setLoadingTimeout(false);
      setAnalysisAborted(false);
    }
  };

  const handleCancelAnalysis = () => {
    setAnalysisAborted(true);
    setLoading(false);
    setLoadingTimeout(false);
    toast.info('Analysis cancelled');
  };

  return (
    <Card className="border-border/50 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Transaction Details
        </CardTitle>
        <CardDescription>
          Enter transaction information to perform fraud risk analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cardNumber">Card Number *</Label>
              <Input
                id="cardNumber"
                placeholder="4532 1488 0343 6467"
                value={formData.cardNumber}
                onChange={(e) => handleCardNumberChange(e.target.value)}
                maxLength={19}
                className={errors.cardNumber ? 'border-destructive' : ''}
              />
              {errors.cardNumber ? (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.cardNumber}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Enter full 13-16 digit card number
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cardholderName">Cardholder Name *</Label>
              <Input
                id="cardholderName"
                placeholder="John Doe"
                value={formData.cardholderName}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({ ...formData, cardholderName: value });
                  if (value && !/^[a-zA-Z\s]+$/.test(value)) {
                    setErrors({ ...errors, cardholderName: 'Name should contain only letters' });
                  } else {
                    setErrors({ ...errors, cardholderName: '' });
                  }
                }}
                className={errors.cardholderName ? 'border-destructive' : ''}
              />
              {errors.cardholderName && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.cardholderName}
                </p>
              )}
            </div>
          </div>

          {/* Transaction Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount || ''}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  setFormData({ ...formData, amount: value });
                  if (value <= 0) {
                    setErrors({ ...errors, amount: 'Amount must be greater than ₹0' });
                  } else if (value > 10000000) {
                    setErrors({ ...errors, amount: 'Amount exceeds maximum limit' });
                  } else {
                    setErrors({ ...errors, amount: '' });
                  }
                }}
                className={errors.amount ? 'border-destructive' : ''}
              />
              {errors.amount && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.amount}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Transaction Time *</Label>
              <Input
                id="time"
                type="datetime-local"
                value={formData.time}
                max={new Date().toISOString().slice(0, 16)}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({ ...formData, time: value });
                  const transactionDate = new Date(value);
                  const now = new Date();
                  if (transactionDate > now) {
                    setErrors({ ...errors, time: 'Cannot be in the future' });
                  } else {
                    setErrors({ ...errors, time: '' });
                  }
                }}
                className={errors.time ? 'border-destructive' : ''}
              />
              {errors.time && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.time}
                </p>
              )}
            </div>
          </div>

          {/* Merchant Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="merchantName">Merchant Name *</Label>
              <Input
                id="merchantName"
                placeholder="Amazon Store"
                value={formData.merchantName}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({ ...formData, merchantName: value });
                  if (!value.trim()) {
                    setErrors({ ...errors, merchantName: 'Merchant name is required' });
                  } else {
                    setErrors({ ...errors, merchantName: '' });
                  }
                }}
                className={errors.merchantName ? 'border-destructive' : ''}
              />
              {errors.merchantName && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.merchantName}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="merchantCategory">Merchant Category *</Label>
              <Select
                value={formData.merchantCategory}
                onValueChange={(value) => setFormData({ ...formData, merchantCategory: value })}
              >
                <SelectTrigger id="merchantCategory">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="online_shopping">Online Shopping</SelectItem>
                  <SelectItem value="gas_station">Gas Station</SelectItem>
                  <SelectItem value="restaurant">Restaurant</SelectItem>
                  <SelectItem value="travel">Travel</SelectItem>
                  <SelectItem value="entertainment">Entertainment</SelectItem>
                  <SelectItem value="utilities">Utilities</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <LocationSelect
              value={formData.location}
              onChange={(value) => {
                setFormData({ ...formData, location: value });
                setErrors({ ...errors, location: '' });
              }}
              error={errors.location}
            />
          </div>

          {/* Submit Button */}
          {!loading ? (
            <Button
              type="submit"
              className="w-full"
              size="lg"
            >
              <Shield className="h-4 w-4 mr-2" />
              Analyze for Fraud
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  size="lg"
                  onClick={handleCancelAnalysis}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  size="lg"
                  disabled
                >
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {loadingTimeout ? 'Still Processing...' : 'Analyzing...'}
                </Button>
              </div>
              {loadingTimeout && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-sm text-yellow-700 dark:text-yellow-400 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Analysis is taking longer than expected. You can cancel and try again.
                  </p>
                </div>
              )}
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
