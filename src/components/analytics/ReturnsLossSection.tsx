import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RotateCcw, 
  AlertTriangle, 
  Package, 
  Banknote,
  TrendingDown,
  PackageX,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ReturnItem {
  id: string;
  product_name: string;
  return_reason: string;
  refund_amount: number;
  return_date: string;
  original_sale_id?: string;
  customer_name?: string;
}

interface DamageItem {
  id: string;
  product_name: string;
  reason: string;
  loss_amount: number;
  damage_date: string;
  notes?: string;
}

const StatCard = ({ 
  title, 
  value, 
  prefix = '', 
  icon: Icon, 
  color, 
  delay = 0 
}: { 
  title: string; 
  value: number; 
  prefix?: string; 
  icon: any; 
  color: string; 
  delay?: number;
}) => {
  const animatedValue = useAnimatedCounter(value, { duration: 1500, decimals: 0 });
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
    >
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{title}</p>
              <p className="text-lg font-bold">{prefix}{animatedValue.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const ReturnsLossSection = () => {
  const [activeTab, setActiveTab] = useState('returns');
  const [returns, setReturns] = useState<ReturnItem[]>([]);
  const [damages, setDamages] = useState<DamageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      try {
        // Fetch returns
        const { data: returnsData } = await supabase
          .from('shop_returns')
          .select('*')
          .eq('user_id', user.id)
          .order('return_date', { ascending: false })
          .limit(50);
        
        setReturns(returnsData || []);

        // Fetch damages
        const { data: damagesData } = await supabase
          .from('shop_damages')
          .select('*')
          .eq('user_id', user.id)
          .order('damage_date', { ascending: false })
          .limit(50);
        
        setDamages(damagesData || []);
      } catch (error) {
        console.error('Error fetching returns/damages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  const totalReturns = returns.length;
  const totalRefundValue = returns.reduce((sum, r) => sum + Number(r.refund_amount || 0), 0);
  
  const totalDamages = damages.length;
  const totalLossValue = damages.reduce((sum, d) => sum + Number(d.loss_amount || 0), 0);

  const getLossReasonColor = (reason: string) => {
    const lowerReason = reason?.toLowerCase() || '';
    if (lowerReason.includes('damage')) return 'bg-destructive/10 text-destructive';
    if (lowerReason.includes('lost') || lowerReason.includes('হারিয়ে')) return 'bg-warning/10 text-warning';
    if (lowerReason.includes('broken') || lowerReason.includes('ভাঙ্গা')) return 'bg-accent/10 text-accent';
    return 'bg-muted text-muted-foreground';
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-BD', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading returns & damages...</span>
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="space-y-6"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Returns & Damages</h2>
              <p className="text-sm text-muted-foreground">Track product returns and damage management</p>
            </div>
          </div>
          <TabsList className="bg-muted/50">
            <TabsTrigger value="returns" className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Returns ({totalReturns})
            </TabsTrigger>
            <TabsTrigger value="damages" className="gap-2">
              <PackageX className="w-4 h-4" />
              Damages ({totalDamages})
            </TabsTrigger>
          </TabsList>
        </div>

        <AnimatePresence mode="wait">
          <TabsContent value="returns" key="returns" className="space-y-4">
            {/* Returns Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard
                title="Total Returns"
                value={totalReturns}
                icon={Package}
                color="bg-destructive/10 text-destructive"
                delay={0.1}
              />
              <StatCard
                title="Refund Value"
                value={totalRefundValue}
                prefix="৳"
                icon={Banknote}
                color="bg-warning/10 text-warning"
                delay={0.15}
              />
            </div>

            {/* Returns Table */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Return History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Refund</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {returns.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No returns recorded yet
                          </TableCell>
                        </TableRow>
                      ) : (
                        returns.map((item, index) => (
                          <motion.tr
                            key={item.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 + index * 0.05 }}
                            className="border-b hover:bg-muted/30"
                          >
                            <TableCell className="font-medium">{item.product_name}</TableCell>
                            <TableCell className="text-muted-foreground">{item.customer_name || '-'}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {item.return_reason}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-semibold text-destructive">
                              -৳{Number(item.refund_amount || 0).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {formatDate(item.return_date)}
                            </TableCell>
                          </motion.tr>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="damages" key="damages" className="space-y-4">
            {/* Damage Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard
                title="Total Damages"
                value={totalDamages}
                icon={PackageX}
                color="bg-destructive/10 text-destructive"
                delay={0.1}
              />
              <StatCard
                title="Loss Value"
                value={totalLossValue}
                prefix="৳"
                icon={TrendingDown}
                color="bg-warning/10 text-warning"
                delay={0.15}
              />
            </div>

            {/* Damage Table */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Damage History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Loss</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {damages.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No damages recorded yet
                          </TableCell>
                        </TableRow>
                      ) : (
                        damages.map((item, index) => (
                          <motion.tr
                            key={item.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.25 + index * 0.05 }}
                            className="border-b hover:bg-muted/30"
                          >
                            <TableCell className="font-medium">{item.product_name}</TableCell>
                            <TableCell>
                              <Badge className={getLossReasonColor(item.reason)}>
                                {item.reason || 'Damaged'}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-semibold text-destructive">
                              -৳{Number(item.loss_amount || 0).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {formatDate(item.damage_date)}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm max-w-[150px] truncate">
                              {item.notes || '-'}
                            </TableCell>
                          </motion.tr>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </AnimatePresence>
      </Tabs>
    </motion.div>
  );
};

export default ReturnsLossSection;
