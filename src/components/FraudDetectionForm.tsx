import { useState } from 'react';
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
import { Shield } from 'lucide-react';
import { analyzeTransaction } from '@/lib/fraudDetection';
import { supabase } from '@/lib/supabase';
import type { TransactionData, FraudAnalysis } from '@/types/fraud';

interface FraudDetectionFormProps {
  onAnalysisComplete: (analysis: FraudAnalysis) => void;
}

export default function FraudDetectionForm({ onAnalysisComplete }: FraudDetectionFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<TransactionData>({
    cardNumber: '',
    cardholderName: '',
    amount: 0,
    merchantName: '',
    merchantCategory: 'retail',
    location: '',
    time: new Date().toISOString().slice(0, 16),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form
      if (!formData.cardNumber || !formData.cardholderName || !formData.amount) {
        toast.error('Please fill in all required fields');
        setLoading(false);
        return;
      }

      if (formData.amount <= 0) {
        toast.error('Transaction amount must be greater than zero');
        setLoading(false);
        return;
      }

      // Simulate processing delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Perform fraud analysis
      const analysis = analyzeTransaction(formData);

      // Save to database
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Mask card number (show only last 4 digits)
        const maskedCard = '****' + formData.cardNumber.slice(-4);
        
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
      setLoading(false);
    }
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
                onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                maxLength={19}
              />
              <p className="text-xs text-muted-foreground">
                Enter full 16-digit card number
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cardholderName">Cardholder Name *</Label>
              <Input
                id="cardholderName"
                placeholder="John Doe"
                value={formData.cardholderName}
                onChange={(e) => setFormData({ ...formData, cardholderName: e.target.value })}
              />
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
                onChange={(e) =>
                  setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Transaction Time *</Label>
              <Input
                id="time"
                type="datetime-local"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
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
                onChange={(e) => setFormData({ ...formData, merchantName: e.target.value })}
              />
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

            <div className="space-y-2">
              <Label htmlFor="location">Transaction Location *</Label>
              <Input
                id="location"
                placeholder="New York, USA"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Enter city and country
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Analyzing Transaction...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Analyze for Fraud
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
