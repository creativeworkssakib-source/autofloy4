import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bot, Key, Eye, EyeOff, Save, Loader2, CheckCircle, XCircle, Sparkles, ShieldCheck, AlertTriangle, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const SUPABASE_URL = "https://klkrzfwvrmffqkmkyqrh.supabase.co";

function getAuthHeaders() {
  const token = localStorage.getItem('autofloy_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

interface AIProviderConfig {
  provider: string;
  api_key_encrypted: string;
  base_url: string;
  model_name: string;
  is_active: boolean;
  use_admin_ai: boolean;
  admin_code_id: string | null;
}

interface UsageLimits {
  daily_message_limit: number;
  daily_comment_limit: number;
  monthly_total_limit: number;
}

interface DailyUsage {
  message_count: number;
  comment_count: number;
  total_ai_calls: number;
  is_limit_reached: boolean;
}

const providerOptions = [
  { value: 'openai', label: 'OpenAI (GPT)', hint: 'sk-...' },
  { value: 'google', label: 'Google AI Studio (Gemini)', hint: 'AIza...' },
  { value: 'grok', label: 'Grok (xAI)', hint: 'xai-...' },
  { value: 'custom', label: 'Custom (OpenAI Compatible)', hint: 'Any key' },
];

const defaultModels: Record<string, string> = {
  openai: 'gpt-4o-mini',
  google: 'gemini-1.5-flash',
  grok: 'grok-2',
  custom: '',
};

const AIProviderSettings = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [activationCode, setActivationCode] = useState('');
  const [isValidatingCode, setIsValidatingCode] = useState(false);

  const [config, setConfig] = useState<AIProviderConfig>({
    provider: 'openai',
    api_key_encrypted: '',
    base_url: '',
    model_name: 'gpt-4o-mini',
    is_active: false,
    use_admin_ai: false,
    admin_code_id: null,
  });

  const [limits, setLimits] = useState<UsageLimits>({
    daily_message_limit: 50,
    daily_comment_limit: 50,
    monthly_total_limit: 1000,
  });

  const [usage, setUsage] = useState<DailyUsage>({
    message_count: 0,
    comment_count: 0,
    total_ai_calls: 0,
    is_limit_reached: false,
  });

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/user-settings/ai-config`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();

      if (data.ai_settings) {
        setConfig({
          provider: data.ai_settings.provider || 'openai',
          api_key_encrypted: data.ai_settings.api_key_encrypted || '',
          base_url: data.ai_settings.base_url || '',
          model_name: data.ai_settings.model_name || '',
          is_active: data.ai_settings.is_active || false,
          use_admin_ai: data.ai_settings.use_admin_ai || false,
          admin_code_id: data.ai_settings.admin_code_id || null,
        });
      }

      if (data.limits) {
        setLimits({
          daily_message_limit: data.limits.daily_message_limit,
          daily_comment_limit: data.limits.daily_comment_limit,
          monthly_total_limit: data.limits.monthly_total_limit,
        });
      }

      if (data.usage) {
        setUsage({
          message_count: data.usage.message_count,
          comment_count: data.usage.comment_count,
          total_ai_calls: data.usage.total_ai_calls,
          is_limit_reached: data.usage.is_limit_reached || false,
        });
      }
    } catch (error) {
      console.error('Failed to load AI settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/user-settings/ai-config`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          provider: config.provider,
          api_key_encrypted: config.api_key_encrypted || null,
          base_url: config.base_url || null,
          model_name: config.model_name || null,
          is_active: config.is_active,
          use_admin_ai: config.use_admin_ai,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to save');

      toast({
        title: '✅ AI Settings Saved',
        description: config.use_admin_ai 
          ? 'Using Admin AI Power' 
          : config.api_key_encrypted 
            ? `${providerOptions.find(p => p.value === config.provider)?.label} configured`
            : 'AI automation disabled (no API key)',
      });
    } catch (error) {
      toast({
        title: 'Failed to Save',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleActivateCode = async () => {
    if (!activationCode.trim() || !user?.id) return;
    setIsValidatingCode(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/user-settings/validate-code`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ code: activationCode.trim() }),
      });

      const result = await res.json();
      if (!res.ok && !result?.valid) throw new Error(result?.reason || 'Validation failed');

      if (result?.valid) {
        setConfig(prev => ({ ...prev, use_admin_ai: true, is_active: true }));
        setLimits({
          daily_message_limit: result.daily_message_limit,
          daily_comment_limit: result.daily_comment_limit,
          monthly_total_limit: result.monthly_total_limit,
        });
        setActivationCode('');
        toast({
          title: '🎉 Admin AI Activated!',
          description: `Daily limit: ${result.daily_message_limit} messages, ${result.daily_comment_limit} comments`,
        });
        loadSettings();
      } else {
        toast({
          title: 'Invalid Code',
          description: result?.reason || 'Code is invalid or expired',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Validation Failed',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsValidatingCode(false);
    }
  };

  const handleDeactivateAdminAI = async () => {
    if (!user?.id) return;
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/user-settings/deactivate-admin-ai`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      setConfig(prev => ({ ...prev, use_admin_ai: false, admin_code_id: null, is_active: false }));
      toast({ title: 'Admin AI Deactivated', description: 'You can now use your own API key' });
    } catch { /* ignore */ }
  };

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/50">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const hasApiKey = !config.use_admin_ai && config.api_key_encrypted?.trim().length > 5;
  const isAIReady = config.use_admin_ai || hasApiKey;
  const msgPercent = limits.daily_message_limit > 0 ? (usage.message_count / limits.daily_message_limit) * 100 : 0;
  const commentPercent = limits.daily_comment_limit > 0 ? (usage.comment_count / limits.daily_comment_limit) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* AI Status Banner */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className={`border-2 ${isAIReady ? 'border-green-500/30 bg-green-500/5' : 'border-destructive/30 bg-destructive/5'}`}>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isAIReady ? 'bg-green-500/20' : 'bg-destructive/20'}`}>
                {isAIReady ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-destructive" />}
              </div>
              <div>
                <p className="font-medium">
                  {isAIReady ? '✅ AI Automation Ready' : '⚠️ AI Not Configured'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {config.use_admin_ai 
                    ? 'Using Admin AI Power — your automation is running with admin-provided AI'
                    : isAIReady
                      ? `Using ${providerOptions.find(p => p.value === config.provider)?.label}`
                      : 'Automation will not work until you configure an AI API key or activate Admin AI'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Admin AI Toggle */}
      <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Admin AI Power
          </CardTitle>
          <CardDescription>Use admin-provided AI instead of your own API key</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
            <div>
              <p className="text-sm font-medium">Use Admin AI</p>
              <p className="text-xs text-muted-foreground">
                {config.use_admin_ai ? 'Active — using admin AI power' : 'Enter activation code to enable'}
              </p>
            </div>
            {config.use_admin_ai && (
              <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                <Sparkles className="w-3 h-3 mr-1" />
                Active
              </Badge>
            )}
          </div>

          {!config.use_admin_ai ? (
            <div className="flex gap-2">
              <Input
                placeholder="Enter activation code..."
                value={activationCode}
                onChange={(e) => setActivationCode(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleActivateCode} disabled={!activationCode.trim() || isValidatingCode} className="gap-2">
                {isValidatingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                Activate
              </Button>
            </div>
          ) : (
            <Button variant="outline" onClick={handleDeactivateAdminAI} className="gap-2 text-destructive">
              <XCircle className="w-4 h-4" />
              Deactivate Admin AI
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Own API Key Section */}
      <Card className={`border-border/50 ${config.use_admin_ai ? 'opacity-50 pointer-events-none' : ''}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bot className="w-5 h-5 text-primary" />
            AI Provider Configuration
          </CardTitle>
          <CardDescription>Configure your own AI API key for automation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>AI Provider</Label>
            <Select
              value={config.provider}
              onValueChange={(v) => setConfig(prev => ({ 
                ...prev, provider: v, 
                model_name: defaultModels[v] || '',
                base_url: v === 'custom' ? prev.base_url : '',
              }))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {providerOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex items-center gap-2">
                      <span>{opt.label}</span>
                      <span className="text-xs text-muted-foreground">({opt.hint})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>API Key</Label>
            <div className="relative">
              <Input
                type={showKey ? 'text' : 'password'}
                value={config.api_key_encrypted}
                onChange={(e) => setConfig(prev => ({ ...prev, api_key_encrypted: e.target.value }))}
                placeholder={providerOptions.find(p => p.value === config.provider)?.hint || 'Enter API key...'}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {config.provider === 'custom' && (
            <div className="space-y-2">
              <Label>Base URL</Label>
              <Input
                value={config.base_url}
                onChange={(e) => setConfig(prev => ({ ...prev, base_url: e.target.value }))}
                placeholder="https://api.example.com/v1"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Model Name</Label>
            <Input
              value={config.model_name}
              onChange={(e) => setConfig(prev => ({ ...prev, model_name: e.target.value }))}
              placeholder={defaultModels[config.provider] || 'Model name'}
            />
          </div>

          <Button onClick={handleSave} disabled={isSaving} className="gap-2 w-full sm:w-auto">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save AI Settings
          </Button>
        </CardContent>
      </Card>

      {/* Usage Dashboard */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="w-5 h-5 text-primary" />
            Today's AI Usage
          </CardTitle>
          <CardDescription>Your daily automation usage quota</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {usage.is_limit_reached && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <p className="text-sm text-destructive font-medium">Daily limit reached — automation paused until midnight</p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Messages</span>
                <span className="font-medium">{usage.message_count}/{limits.daily_message_limit}</span>
              </div>
              <Progress value={Math.min(msgPercent, 100)} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Comments</span>
                <span className="font-medium">{usage.comment_count}/{limits.daily_comment_limit}</span>
              </div>
              <Progress value={Math.min(commentPercent, 100)} className="h-2" />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <span className="text-sm">Total AI Calls Today</span>
            <Badge variant="secondary">{usage.total_ai_calls}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIProviderSettings;
