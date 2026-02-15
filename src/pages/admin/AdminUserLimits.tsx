import { useState, useEffect } from 'react';
import { BarChart3, Loader2, RefreshCw, Save, Users } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

const SUPABASE_URL = "https://klkrzfwvrmffqkmkyqrh.supabase.co";

function getAuthHeaders() {
  const token = localStorage.getItem('autofloy_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

interface UserLimit {
  id: string;
  user_id: string;
  daily_message_limit: number;
  daily_comment_limit: number;
  monthly_total_limit: number;
  is_automation_enabled: boolean;
  user_email?: string;
  user_name?: string;
}

const AdminUserLimits = () => {
  const { toast } = useToast();
  const [limits, setLimits] = useState<UserLimit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchLimits = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/admin/user-limits`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setLimits(data.limits || []);
    } catch (error) {
      console.error('Failed to fetch limits:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchLimits(); }, []);

  const handleUpdate = async (limit: UserLimit) => {
    setSavingId(limit.id);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/admin/user-limits/${limit.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          daily_message_limit: limit.daily_message_limit,
          daily_comment_limit: limit.daily_comment_limit,
          monthly_total_limit: limit.monthly_total_limit,
          is_automation_enabled: limit.is_automation_enabled,
        }),
      });

      if (!res.ok) throw new Error('Failed');
      toast({ title: 'Limits Updated', description: `Updated for ${limit.user_email}` });
    } catch {
      toast({ title: 'Failed', variant: 'destructive' });
    } finally {
      setSavingId(null);
    }
  };

  const updateLimit = (id: string, field: string, value: any) => {
    setLimits(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-primary" />
              User AI Limits
            </h1>
            <p className="text-muted-foreground">Configure daily/monthly automation limits per user</p>
          </div>
          <Button variant="outline" onClick={fetchLimits} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : limits.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No user limits configured yet</p>
                <p className="text-xs">Limits are created when users activate AI</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Daily Messages</TableHead>
                    <TableHead>Daily Comments</TableHead>
                    <TableHead>Monthly Total</TableHead>
                    <TableHead>Enabled</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {limits.map((limit) => (
                    <TableRow key={limit.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{limit.user_name || 'User'}</p>
                          <p className="text-xs text-muted-foreground">{limit.user_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={limit.daily_message_limit}
                          onChange={(e) => updateLimit(limit.id, 'daily_message_limit', parseInt(e.target.value) || 0)}
                          className="w-20 h-8 text-sm"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={limit.daily_comment_limit}
                          onChange={(e) => updateLimit(limit.id, 'daily_comment_limit', parseInt(e.target.value) || 0)}
                          className="w-20 h-8 text-sm"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={limit.monthly_total_limit}
                          onChange={(e) => updateLimit(limit.id, 'monthly_total_limit', parseInt(e.target.value) || 0)}
                          className="w-24 h-8 text-sm"
                        />
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={limit.is_automation_enabled}
                          onCheckedChange={(v) => updateLimit(limit.id, 'is_automation_enabled', v)}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => handleUpdate(limit)}
                          disabled={savingId === limit.id}
                          className="gap-1"
                        >
                          {savingId === limit.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                          Save
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminUserLimits;
