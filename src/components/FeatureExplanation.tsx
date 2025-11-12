import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { TrendingUp, AlertTriangle, Lock, ChevronRight } from 'lucide-react';

interface FeatureExplanationProps {
  type: 'pattern' | 'risk' | 'security';
}

const FEATURE_DATA = {
  pattern: {
    icon: TrendingUp,
    title: 'Pattern Analysis',
    description: 'How we detect unusual spending patterns',
    content: [
      {
        step: 'Transaction Velocity Check',
        details: 'We monitor the number of transactions in short time periods. Multiple transactions within minutes can indicate card theft.',
      },
      {
        step: 'Amount Anomaly Detection',
        details: 'Unusually large or small transactions are flagged. We compare against historical spending patterns and merchant categories.',
      },
      {
        step: 'Time-based Analysis',
        details: 'Transactions at unusual hours (late night/early morning) receive higher scrutiny, especially for high-value purchases.',
      },
      {
        step: 'Location Consistency',
        details: 'We track geographic patterns. Transactions in different cities within short timeframes indicate potential fraud.',
      },
      {
        step: 'Merchant Category Patterns',
        details: 'High-risk categories (gas stations, online shopping) are monitored more closely for suspicious behavior.',
      },
    ],
  },
  risk: {
    icon: AlertTriangle,
    title: 'Risk Scoring System',
    description: 'Multi-factor risk assessment methodology',
    content: [
      {
        step: 'Base Risk Calculation (0-100)',
        details: 'Each transaction starts with a base score. Multiple risk factors are weighted and combined to produce the final score.',
      },
      {
        step: 'Amount Risk (0-25 points)',
        details: 'Large transactions (>₹50,000) add 20-25 points. Small transactions (<₹100) add 5 points as they may be testing stolen cards.',
      },
      {
        step: 'Time Risk (0-15 points)',
        details: 'Transactions between 11 PM - 5 AM add 10-15 points. Weekend transactions may add 5 additional points.',
      },
      {
        step: 'Location Risk (0-20 points)',
        details: 'High-risk locations and cross-border transactions add 15-20 points to the risk score.',
      },
      {
        step: 'Merchant Category Risk (0-15 points)',
        details: 'Gas stations (+15), online shopping (+10), travel (+8) add category-specific risk points.',
      },
      {
        step: 'Card Validation (0-25 points)',
        details: 'Failed Luhn algorithm check adds 25 points immediately, indicating a potentially fake card number.',
      },
    ],
  },
  security: {
    icon: Lock,
    title: 'Secure Processing',
    description: 'Industry-standard security protocols',
    content: [
      {
        step: 'End-to-End Encryption',
        details: 'All transaction data is encrypted using TLS 1.3 during transmission. Card numbers are never stored in plain text.',
      },
      {
        step: 'Data Masking',
        details: 'Card numbers are immediately masked, storing only the last 4 digits. Full card numbers are never saved in our database.',
      },
      {
        step: 'Secure Authentication',
        details: 'Users authenticate via email OTP + password. Session tokens are encrypted and expire after inactivity.',
      },
      {
        step: 'Row-Level Security (RLS)',
        details: 'Database policies ensure users can only access their own transaction data. No cross-user data exposure.',
      },
      {
        step: 'Audit Logging',
        details: 'All analyses are timestamped and logged. This creates an immutable audit trail for compliance and investigation.',
      },
      {
        step: 'PCI DSS Compliance Ready',
        details: 'Our architecture follows Payment Card Industry Data Security Standards for handling sensitive card information.',
      },
    ],
  },
};

export default function FeatureExplanation({ type }: FeatureExplanationProps) {
  const [open, setOpen] = useState(false);
  const feature = FEATURE_DATA[type];
  const Icon = feature.icon;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all text-left w-full group">
          <div className={`h-12 w-12 rounded-lg flex items-center justify-center mb-4 ${
            type === 'pattern' ? 'bg-primary/10' : 
            type === 'risk' ? 'bg-accent/10' : 
            'bg-success/10'
          }`}>
            <Icon className={`h-6 w-6 ${
              type === 'pattern' ? 'text-primary' : 
              type === 'risk' ? 'text-accent' : 
              'text-success'
            }`} />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center justify-between">
            {feature.title}
            <ChevronRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </h3>
          <p className="text-sm text-muted-foreground">
            {feature.description}
          </p>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Icon className="h-6 w-6" />
            {feature.title}
          </DialogTitle>
          <DialogDescription>
            {feature.description}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          {feature.content.map((item, index) => (
            <div key={index} className="border-l-2 border-primary pl-4 py-2">
              <h4 className="font-semibold text-foreground mb-1">
                {index + 1}. {item.step}
              </h4>
              <p className="text-sm text-muted-foreground">
                {item.details}
              </p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
