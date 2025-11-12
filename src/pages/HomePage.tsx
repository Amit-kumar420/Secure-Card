import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FraudDetectionForm from '@/components/FraudDetectionForm';
import RiskAnalysis from '@/components/RiskAnalysis';
import { Shield, History, LogOut, Mail, Zap } from 'lucide-react';
import FeatureExplanation from '@/components/FeatureExplanation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import type { FraudAnalysis } from '@/types/fraud';

export default function HomePage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [analysis, setAnalysis] = useState<FraudAnalysis | null>(null);
  const [showResults, setShowResults] = useState(false);

  const handleAnalysisComplete = (result: FraudAnalysis) => {
    setAnalysis(result);
    setShowResults(true);
  };

  const handleNewAnalysis = () => {
    setShowResults(false);
    setAnalysis(null);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      {/* Header */}
      <header className="border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-security flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">SecureCard</h1>
                <p className="text-xs text-muted-foreground">Fraud Detection System</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/history')}
              >
                <History className="h-4 w-4 mr-2" />
                History
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      {!showResults && (
        <section className="py-12 md:py-20 animate-fade-in">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Zap className="h-4 w-4" />
                Real-Time Fraud Detection
              </div>
              <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6 text-balance">
                Protect Your Transactions with{' '}
                <span className="text-transparent bg-clip-text bg-gradient-security">
                  Advanced Detection
                </span>
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                Analyze card transactions instantly using sophisticated algorithms to detect fraud
                patterns, anomalies, and suspicious activities.
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
              <FeatureExplanation type="pattern" />
              <FeatureExplanation type="risk" />
              <FeatureExplanation type="security" />
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          {!showResults ? (
            <div className="max-w-2xl mx-auto animate-slide-up">
              <div className="mb-8 text-center">
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  Analyze Transaction
                </h3>
                <p className="text-muted-foreground">
                  Enter transaction details below for instant fraud risk assessment
                </p>
              </div>
              <FraudDetectionForm onAnalysisComplete={handleAnalysisComplete} />
            </div>
          ) : (
            <div className="max-w-4xl mx-auto animate-slide-up">
              <RiskAnalysis analysis={analysis!} onNewAnalysis={handleNewAnalysis} />
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 mt-20 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center text-sm text-muted-foreground space-y-2">
            <p className="font-semibold text-foreground">
              SecureCard © 2025 - Advanced Fraud Detection System
            </p>
            <p className="flex items-center justify-center gap-2">
              <Mail className="h-4 w-4" />
              Contact: <a href="mailto:21BCS9056@cuchd.in" className="text-primary hover:underline">21BCS9056@cuchd.in</a>
            </p>
            <p className="text-xs">
              Production-grade fraud detection system using advanced machine learning algorithms
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
