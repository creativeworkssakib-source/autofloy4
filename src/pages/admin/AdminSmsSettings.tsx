import { useState, useEffect } from 'react';
import { Save, Loader2, Eye, EyeOff, CheckCircle, XCircle, MessageSquare, Send, Smartphone } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

interface SmsSettings {
  platform_sms_enabled: boolean;
  platform_sms_provider: string | null;
  platform_sms_api_key: string | null;
  platform_sms_sender_id: string | null;
  sms_limit_trial: number;
  sms_limit_starter: number;
  sms_limit_professional: number;
  sms_limit_business: number;
  sms_limit_lifetime: number;
}

const smsProviders = [
  { id: 'twilio', name: 'Twilio', icon: '📱' },
  { id: 'nexmo', name: 'Vonage (Nexmo)', icon: '📲' },
  { id: 'msg91', name: 'MSG91', icon: '💬' },
  { id: 'textlocal', name: 'Textlocal', icon: '📨' },
  { id: 'sslwireless', name: 'SSL Wireless', icon: '🇧🇩' },
  { id: 'bulksmsbd', name: 'BulkSMS BD', icon: '🇧🇩' },
  { id: 'greenweb', name: 'Green Web', icon: '🌐' },
  { id: 'custom', name: 'Custom API', icon: '⚙️' },
];

const AdminSmsSettings = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [settings, setSettings] = useState<SmsSettings>({
    platform_sms_enabled: false,
    platform_sms_provider: null,
    platform_sms_api_key: null,
    platform_sms_sender_id: null,
    sms_limit_trial: 5,
    sms_limit_starter: 20,
    sms_limit_professional: 100,
    sms_limit_business: 500,
    sms_limit_lifetime: 1000,
  });

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('site_settings')
        .select('platform_sms_enabled, platform_sms_provider, platform_sms_api_key, platform_sms_sender_id, sms_limit_trial, sms_limit_starter, sms_limit_professional, sms_limit_business, sms_limit_lifetime')
        .limit(1)
        .single();

      if (error) throw error;

      if (data) {
        setSettings({
          platform_sms_enabled: data.platform_sms_enabled || false,
          platform_sms_provider: data.platform_sms_provider || null,
          platform_sms_api_key: data.platform_sms_api_key || null,
          platform_sms_sender_id: data.platform_sms_sender_id || null,
          sms_limit_trial: data.sms_limit_trial || 5,
          sms_limit_starter: data.sms_limit_starter || 20,
          sms_limit_professional: data.sms_limit_professional || 100,
          sms_limit_business: data.sms_limit_business || 500,
          sms_limit_lifetime: data.sms_limit_lifetime || 1000,
        });
      }
    } catch (error) {
      console.error('Error fetching SMS settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load SMS settings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('site_settings')
        .update({
          platform_sms_enabled: settings.platform_sms_enabled,
          platform_sms_provider: settings.platform_sms_provider,
          platform_sms_api_key: settings.platform_sms_api_key,
          platform_sms_sender_id: settings.platform_sms_sender_id,
          sms_limit_trial: settings.sms_limit_trial,
          sms_limit_starter: settings.sms_limit_starter,
          sms_limit_professional: settings.sms_limit_professional,
          sms_limit_business: settings.sms_limit_business,
          sms_limit_lifetime: settings.sms_limit_lifetime,
        })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all rows

      if (error) throw error;

      toast({
        title: 'Saved',
        description: 'SMS settings saved successfully',
      });
    } catch (error) {
      console.error('Error saving SMS settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save SMS settings',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: keyof SmsSettings, value: string | boolean | number | null) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  const isConfigured = settings.platform_sms_enabled && settings.platform_sms_api_key && settings.platform_sms_provider;

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-primary" />
              SMS Provider Settings
            </h1>
            <p className="text-muted-foreground">
              Configure SMS API for sending verification codes and notifications
            </p>
          </div>
          <Badge variant={isConfigured ? "default" : "secondary"} className={isConfigured ? "bg-green-500" : ""}>
            {isConfigured ? (
              <><CheckCircle className="w-3 h-3 mr-1" /> Active</>
            ) : (
              <><XCircle className="w-3 h-3 mr-1" /> Inactive</>
            )}
          </Badge>
        </div>

        {/* Main SMS Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  SMS Provider Configuration
                </CardTitle>
                <CardDescription>
                  Connect your SMS provider to enable SMS features across the platform
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <Label htmlFor="sms-enabled" className="text-sm text-muted-foreground">
                  Enable SMS
                </Label>
                <Switch
                  id="sms-enabled"
                  checked={settings.platform_sms_enabled}
                  onCheckedChange={(checked) => handleChange('platform_sms_enabled', checked)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Provider Selection */}
            <div className="space-y-2">
              <Label>SMS Provider</Label>
              <Select
                value={settings.platform_sms_provider || ''}
                onValueChange={(value) => handleChange('platform_sms_provider', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select SMS Provider..." />
                </SelectTrigger>
                <SelectContent>
                  {smsProviders.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      <span className="flex items-center gap-2">
                        <span>{provider.icon}</span>
                        <span>{provider.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Select your SMS gateway provider
              </p>
            </div>

            {/* API Key */}
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key / Auth Token</Label>
              <div className="relative">
                <Input
                  id="api-key"
                  type={showApiKey ? 'text' : 'password'}
                  value={settings.platform_sms_api_key || ''}
                  onChange={(e) => handleChange('platform_sms_api_key', e.target.value)}
                  placeholder="Enter your SMS API key..."
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                The API key from your SMS provider dashboard
              </p>
            </div>

            {/* Sender ID */}
            <div className="space-y-2">
              <Label htmlFor="sender-id">Sender ID / From Number</Label>
              <Input
                id="sender-id"
                value={settings.platform_sms_sender_id || ''}
                onChange={(e) => handleChange('platform_sms_sender_id', e.target.value)}
                placeholder="e.g., AutoFloy or +8801XXXXXXXXX"
              />
              <p className="text-xs text-muted-foreground">
                The name or number that will appear as the sender
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Daily SMS Limits per Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Daily SMS Limits by Plan
            </CardTitle>
            <CardDescription>
              Set maximum number of SMS each plan can send per day
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="limit-trial">Trial</Label>
                <Input
                  id="limit-trial"
                  type="number"
                  min="0"
                  value={settings.sms_limit_trial}
                  onChange={(e) => { const val = e.target.value; handleChange('sms_limit_trial', val === "" ? 0 : parseInt(val) || 0); }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="limit-starter">Starter</Label>
                <Input
                  id="limit-starter"
                  type="number"
                  min="0"
                  value={settings.sms_limit_starter}
                  onChange={(e) => { const val = e.target.value; handleChange('sms_limit_starter', val === "" ? 0 : parseInt(val) || 0); }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="limit-professional">Professional</Label>
                <Input
                  id="limit-professional"
                  type="number"
                  min="0"
                  value={settings.sms_limit_professional}
                  onChange={(e) => { const val = e.target.value; handleChange('sms_limit_professional', val === "" ? 0 : parseInt(val) || 0); }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="limit-business">Business</Label>
                <Input
                  id="limit-business"
                  type="number"
                  min="0"
                  value={settings.sms_limit_business}
                  onChange={(e) => { const val = e.target.value; handleChange('sms_limit_business', val === "" ? 0 : parseInt(val) || 0); }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="limit-lifetime">Lifetime</Label>
                <Input
                  id="limit-lifetime"
                  type="number"
                  min="0"
                  value={settings.sms_limit_lifetime}
                  onChange={(e) => { const val = e.target.value; handleChange('sms_limit_lifetime', val === "" ? 0 : parseInt(val) || 0); }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Settings
          </Button>
        </div>

        {/* Info Card */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <MessageSquare className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-medium">How SMS Integration Works</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  When you configure an SMS provider, the platform will use it to send verification OTPs, 
                  loan reminders, due payment notifications, and follow-up messages. Make sure your API key 
                  is valid and has sufficient balance.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminSmsSettings;
