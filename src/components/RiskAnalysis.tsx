import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  ArrowLeft,
  Shield,
  AlertCircle,
} from 'lucide-react';
import type { FraudAnalysis, RiskFactor } from '@/types/fraud';

interface RiskAnalysisProps {
  analysis: FraudAnalysis;
  onNewAnalysis: () => void;
}

export default function RiskAnalysis({ analysis, onNewAnalysis }: RiskAnalysisProps) {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'text-success';
      case 'medium':
        return 'text-warning';
      case 'high':
        return 'text-destructive';
      case 'critical':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const getRiskBgColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'bg-success/10 border-success/20';
      case 'medium':
        return 'bg-warning/10 border-warning/20';
      case 'high':
        return 'bg-destructive/10 border-destructive/20';
      case 'critical':
        return 'bg-destructive/20 border-destructive/30';
      default:
        return 'bg-muted';
    }
  };

  const getRiskIcon = () => {
    if (analysis.isFraudulent) {
      return <XCircle className="h-16 w-16 text-destructive" />;
    } else if (analysis.riskLevel === 'low') {
      return <CheckCircle className="h-16 w-16 text-success" />;
    } else {
      return <AlertTriangle className="h-16 w-16 text-warning" />;
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case 'medium':
        return <AlertCircle className="h-5 w-5 text-warning" />;
      default:
        return <CheckCircle className="h-5 w-5 text-success" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onNewAnalysis}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          New Analysis
        </Button>
        <Badge variant="outline" className="text-sm">
          Analysis ID: {analysis.timestamp.slice(0, 10)}
        </Badge>
      </div>

      {/* Overall Result */}
      <Card
        className={`border-2 ${getRiskBgColor(analysis.riskLevel)}`}
      >
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            {getRiskIcon()}
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">
                {analysis.isFraudulent ? 'Fraud Detected' : 'Transaction Analyzed'}
              </h2>
              <p className="text-muted-foreground">
                {analysis.isFraudulent
                  ? 'This transaction has been flagged as fraudulent'
                  : 'Analysis complete - see details below'}
              </p>
            </div>

            {/* Risk Score */}
            <div className="w-full max-w-md space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Risk Score</span>
                <span className={`font-bold ${getRiskColor(analysis.riskLevel)}`}>
                  {analysis.overallRiskScore}/100
                </span>
              </div>
              <div className="h-3 bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    analysis.riskLevel === 'critical'
                      ? 'bg-destructive'
                      : analysis.riskLevel === 'high'
                      ? 'bg-destructive/80'
                      : analysis.riskLevel === 'medium'
                      ? 'bg-warning'
                      : 'bg-success'
                  }`}
                  style={{ width: `${analysis.overallRiskScore}%` }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 w-full max-w-md">
              <div className="text-center">
                <div className={`text-2xl font-bold ${getRiskColor(analysis.riskLevel)}`}>
                  {analysis.riskLevel.toUpperCase()}
                </div>
                <div className="text-xs text-muted-foreground">Risk Level</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{analysis.confidence}%</div>
                <div className="text-xs text-muted-foreground">Confidence</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {analysis.riskFactors.length}
                </div>
                <div className="text-xs text-muted-foreground">Risk Factors</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Factors */}
      {analysis.riskFactors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Detected Risk Factors
            </CardTitle>
            <CardDescription>
              {analysis.riskFactors.length} potential risk{' '}
              {analysis.riskFactors.length === 1 ? 'indicator' : 'indicators'} found
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysis.riskFactors.map((factor: RiskFactor, index: number) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getRiskBgColor(factor.severity)}`}
              >
                <div className="flex items-start gap-3">
                  {getSeverityIcon(factor.severity)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-foreground">{factor.name}</h4>
                      <Badge
                        variant="outline"
                        className={`${getRiskColor(factor.severity)} border-current`}
                      >
                        +{factor.score} points
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{factor.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Recommendations
          </CardTitle>
          <CardDescription>
            Suggested actions based on fraud analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {analysis.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="mt-0.5">
                  {recommendation.includes('✅') ? (
                    <CheckCircle className="h-5 w-5 text-success" />
                  ) : recommendation.includes('⛔') ? (
                    <XCircle className="h-5 w-5 text-destructive" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-warning" />
                  )}
                </div>
                <span className="text-sm text-foreground flex-1">
                  {recommendation.replace(/[⛔⚠️✅]/g, '').trim()}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Analysis Info */}
      <div className="text-center text-sm text-muted-foreground">
        <p>
          Analysis completed at {new Date(analysis.timestamp).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
