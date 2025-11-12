import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, TrendingUp, AlertTriangle, CheckCircle, XCircle, Trash2, RefreshCcw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { FraudAnalysis } from '@/types/fraud';

interface StoredAnalysis extends FraudAnalysis {
  id: string;
  card_number_masked: string;
  cardholder_name: string;
  amount: number;
  merchant_name: string;
  merchant_category: string;
  location: string;
  transaction_time: string;
  created_at: string;
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    fraudulent: 0,
    suspicious: 0,
    safe: 0,
  });

  useEffect(() => {
    loadHistory();
    
    return () => {
      // Cleanup: abort any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    setLoadError(false);
    
    // Create abort controller for this request
    abortControllerRef.current = new AbortController();
    
    // Set 10-second timeout
    const timeoutId = setTimeout(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }, 10000);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        clearTimeout(timeoutId);
        return;
      }

      const { data, error } = await supabase
        .from('fraud_analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .abortSignal(abortControllerRef.current.signal);

      if (error) throw error;

      setAnalyses(data || []);
      clearTimeout(timeoutId);
      
      // Calculate stats
      const total = data?.length || 0;
      const fraudulent = data?.filter(a => a.is_fraudulent).length || 0;
      const suspicious = data?.filter(a => !a.is_fraudulent && a.risk_level === 'high').length || 0;
      const safe = total - fraudulent - suspicious;

      setStats({ total, fraudulent, suspicious, safe });
    } catch (error: any) {
      console.error('Load history error:', error);
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        toast.error('Request timed out. Please try again.');
        setLoadError(true);
      } else {
        toast.error('Failed to load transaction history');
        setLoadError(true);
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('fraud_analyses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Analysis deleted');
      loadHistory();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error('Failed to delete analysis');
    }
  };

  const getRiskBadge = (level: string) => {
    const variants: Record<string, any> = {
      low: { variant: 'default', icon: CheckCircle, className: 'bg-green-500/10 text-green-700 dark:text-green-400' },
      medium: { variant: 'secondary', icon: AlertTriangle, className: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400' },
      high: { variant: 'destructive', icon: AlertTriangle, className: 'bg-orange-500/10 text-orange-700 dark:text-orange-400' },
      critical: { variant: 'destructive', icon: XCircle, className: 'bg-red-500/10 text-red-700 dark:text-red-400' },
    };

    const { icon: Icon, className } = variants[level] || variants.medium;

    return (
      <Badge className={className}>
        <Icon className="h-3 w-3 mr-1" />
        {level.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Analyzer
            </Button>
            <h1 className="text-3xl font-bold">Transaction History</h1>
            <p className="text-muted-foreground">View all your fraud analysis results</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-muted-foreground">Loading history...</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (abortControllerRef.current) {
                    abortControllerRef.current.abort();
                  }
                  setLoading(false);
                  toast.info('Loading cancelled');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : loadError ? (
          <div className="flex items-center justify-center py-20">
            <Card className="max-w-md">
              <CardContent className="pt-6 text-center space-y-4">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">Failed to Load History</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Unable to fetch transaction history. This might be due to network issues or timeout.
                  </p>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button onClick={loadHistory} variant="default">
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                  <Button onClick={() => navigate('/')} variant="outline">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Home
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total Analyses</CardDescription>
                  <CardTitle className="text-3xl">{stats.total}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Fraudulent</CardDescription>
                  <CardTitle className="text-3xl text-red-600">{stats.fraudulent}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Suspicious</CardDescription>
                  <CardTitle className="text-3xl text-orange-600">{stats.suspicious}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Safe</CardDescription>
                  <CardTitle className="text-3xl text-green-600">{stats.safe}</CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* Transaction List */}
            {analyses.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No analyses yet</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Start analyzing transactions to see your history here
                  </p>
                  <Button onClick={() => navigate('/')}>Analyze Transaction</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {analyses.map((analysis) => (
                  <Card key={analysis.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">
                            {analysis.merchant_name}
                          </CardTitle>
                          <CardDescription>
                            Card: {analysis.card_number_masked} • {analysis.cardholder_name}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          {getRiskBadge(analysis.risk_level)}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(analysis.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Amount</p>
                          <p className="font-semibold">₹{analysis.amount.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Risk Score</p>
                          <p className="font-semibold">{analysis.overall_risk_score}/100</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Confidence</p>
                          <p className="font-semibold">{analysis.confidence.toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Date</p>
                          <p className="font-semibold">
                            {new Date(analysis.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {analysis.is_fraudulent && (
                        <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                          <p className="text-sm font-semibold text-destructive flex items-center gap-2">
                            <XCircle className="h-4 w-4" />
                            FRAUDULENT TRANSACTION DETECTED
                          </p>
                        </div>
                      )}

                      {analysis.risk_factors && (analysis.risk_factors as any[]).length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-semibold mb-2">Risk Factors:</p>
                          <div className="space-y-1">
                            {(analysis.risk_factors as any[]).map((factor: any, idx: number) => (
                              <p key={idx} className="text-sm text-muted-foreground">
                                • {factor.name}: {factor.description}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
