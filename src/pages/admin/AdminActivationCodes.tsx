import { useState, useEffect } from 'react';
import { Key, Plus, Trash2, Copy, Loader2, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

const SUPABASE_URL = "https://klkrzfwvrmffqkmkyqrh.supabase.co";

function getAuthHeaders() {
  const token = localStorage.getItem('autofloy_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

interface ActivationCode {
  id: string;
  code: string;
  assigned_user_id: string | null;
  max_uses: number;
  current_uses: number;
  daily_message_limit: number;
  daily_comment_limit: number;
  monthly_total_limit: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

function generateRandomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'AF-';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const AdminActivationCodes = () => {
  const { toast } = useToast();
  const [codes, setCodes] = useState<ActivationCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const [newCode, setNewCode] = useState({
    code: generateRandomCode(),
    max_uses: 1,
    daily_message_limit: 50,
    daily_comment_limit: 50,
    monthly_total_limit: 1000,
    expires_at: '',
  });

  const fetchCodes = async () => {
    setIsLoading(true);
    try {
      const headers = getAuthHeaders();
      if (!headers.Authorization) {
        console.error('No auth token available');
        toast({ title: 'Authentication Error', description: 'Please log in again', variant: 'destructive' });
        setIsLoading(false);
        return;
      }
      const res = await fetch(`${SUPABASE_URL}/functions/v1/admin/activation-codes`, {
        headers,
      });
      if (res.status === 401) {
        toast({ title: 'Session Expired', description: 'Please log in again', variant: 'destructive' });
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setCodes(data.codes || []);
    } catch (error) {
      console.error('Failed to fetch codes:', error);
      toast({ title: 'Failed to Load', description: 'Could not load activation codes', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchCodes(); }, []);

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/admin/activation-codes`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          code: newCode.code,
          max_uses: newCode.max_uses,
          daily_message_limit: newCode.daily_message_limit,
          daily_comment_limit: newCode.daily_comment_limit,
          monthly_total_limit: newCode.monthly_total_limit,
          expires_at: newCode.expires_at || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed');
      }

      toast({ title: '✅ Code Created', description: `Code: ${newCode.code}` });
      setShowCreateDialog(false);
      setNewCode({ ...newCode, code: generateRandomCode() });
      fetchCodes();
    } catch (error) {
      toast({
        title: 'Failed to Create',
        description: error instanceof Error ? error.message : 'Error',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/admin/activation-codes/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ is_active: !isActive }),
      });
      fetchCodes();
    } catch { /* ignore */ }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/admin/activation-codes/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      fetchCodes();
      toast({ title: 'Code Deleted' });
    } catch { /* ignore */ }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: 'Copied!', description: code });
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Key className="w-6 h-6 text-primary" />
              AI Activation Codes
            </h1>
            <p className="text-muted-foreground">Generate codes for users to activate Admin AI Power</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchCodes} className="gap-2">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Generate Code
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Generate Activation Code</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Code</Label>
                    <div className="flex gap-2">
                      <Input value={newCode.code} onChange={(e) => setNewCode(prev => ({ ...prev, code: e.target.value }))} />
                      <Button variant="outline" onClick={() => setNewCode(prev => ({ ...prev, code: generateRandomCode() }))}>
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Max Uses</Label>
                      <Input type="number" value={newCode.max_uses} onChange={(e) => setNewCode(prev => ({ ...prev, max_uses: parseInt(e.target.value) || 1 }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Expires At</Label>
                      <Input type="datetime-local" value={newCode.expires_at} onChange={(e) => setNewCode(prev => ({ ...prev, expires_at: e.target.value }))} />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Daily Messages</Label>
                      <Input type="number" value={newCode.daily_message_limit} onChange={(e) => setNewCode(prev => ({ ...prev, daily_message_limit: parseInt(e.target.value) || 0 }))} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Daily Comments</Label>
                      <Input type="number" value={newCode.daily_comment_limit} onChange={(e) => setNewCode(prev => ({ ...prev, daily_comment_limit: parseInt(e.target.value) || 0 }))} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Monthly Total</Label>
                      <Input type="number" value={newCode.monthly_total_limit} onChange={(e) => setNewCode(prev => ({ ...prev, monthly_total_limit: parseInt(e.target.value) || 0 }))} />
                    </div>
                  </div>

                  <Button onClick={handleCreate} disabled={isCreating} className="w-full gap-2">
                    {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Create Code
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : codes.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Key className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No activation codes yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Uses</TableHead>
                    <TableHead>Limits</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {codes.map((code) => (
                    <TableRow key={code.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono bg-muted px-2 py-1 rounded">{code.code}</code>
                          <Button variant="ghost" size="sm" onClick={() => copyCode(code.code)}>
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        {code.is_active ? (
                          <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>{code.current_uses}/{code.max_uses}</TableCell>
                      <TableCell>
                        <div className="text-xs space-y-0.5">
                          <p>📨 {code.daily_message_limit}/day</p>
                          <p>💬 {code.daily_comment_limit}/day</p>
                          <p>📊 {code.monthly_total_limit}/month</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {code.expires_at
                          ? new Date(code.expires_at).toLocaleDateString()
                          : <span className="text-muted-foreground">Never</span>
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleToggleActive(code.id, code.is_active)}>
                            {code.is_active ? <XCircle className="w-4 h-4 text-destructive" /> : <CheckCircle className="w-4 h-4 text-green-600" />}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(code.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
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

export default AdminActivationCodes;
