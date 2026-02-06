import { useState, useEffect } from 'react';
import { Save, Loader2, Eye, EyeOff, CheckCircle, XCircle, RefreshCw, Zap, Bot, Info } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import LovableAIPowerSection from '@/components/admin/LovableAIPowerSection';

// Import premium icons
import apifyIcon from '@/assets/icons/apify-icon.png';
import firecrawlIcon from '@/assets/icons/firecrawl-icon.png';
import googleMapsIcon from '@/assets/icons/google-maps-icon.png';
import openaiIcon from '@/assets/icons/openai-icon.png';

const SUPABASE_URL = "https://klkrzfwvrmffqkmkyqrh.supabase.co";

interface ApiIntegration {
  id: string;
  provider: string;
  api_key: string | null;
  api_secret: string | null;
  is_enabled: boolean;
  config: {
    description?: string;
    [key: string]: unknown;
  };
  updated_at: string;
}

const providerLabels: Record<string, { name: string; icon: string; color: string; isAI?: boolean }> = {
  apify: { name: 'Apify', icon: apifyIcon, color: 'bg-orange-500' },
  firecrawl: { name: 'Firecrawl', icon: firecrawlIcon, color: 'bg-red-500' },
  google_maps: { name: 'Google Maps', icon: googleMapsIcon, color: 'bg-blue-500' },
  openai: { name: 'AI Provider', icon: openaiIcon, color: 'bg-green-500', isAI: true },
};

const AdminApiIntegrations = () => {
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState<ApiIntegration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingProvider, setSavingProvider] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<Record<string, { api_key: string; api_secret: string; is_enabled: boolean }>>({});

  const fetchIntegrations = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("autofloy_token");
      const response = await fetch(`${SUPABASE_URL}/functions/v1/admin/api-integrations`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch integrations');
      }

      const data = await response.json();
      setIntegrations(data.integrations || []);
      
      // Initialize form data
      const initial: Record<string, { api_key: string; api_secret: string; is_enabled: boolean }> = {};
      (data.integrations || []).forEach((int: ApiIntegration) => {
        initial[int.provider] = {
          api_key: int.api_key || '',
          api_secret: int.api_secret || '',
          is_enabled: int.is_enabled,
        };
      });
      setFormData(initial);
    } catch (error) {
      console.error('Error fetching integrations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load API integrations',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const handleSave = async (provider: string, overrideData?: { is_enabled: boolean }) => {
    try {
      setSavingProvider(provider);
      const token = localStorage.getItem("autofloy_token");
      const data = formData[provider] || { api_key: '', api_secret: '', is_enabled: false };
      
      const payload = {
        provider,
        api_key: data.api_key || null,
        api_secret: data.api_secret || null,
        is_enabled: overrideData?.is_enabled ?? data.is_enabled,
      };

      const response = await fetch(`${SUPABASE_URL}/functions/v1/admin/api-integrations`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to save integration');
      }

      toast({
        title: 'Saved',
        description: `${providerLabels[provider]?.name || provider} settings saved successfully`,
      });

      await fetchIntegrations();
    } catch (error) {
      console.error('Error saving integration:', error);
      toast({
        title: 'Error',
        description: 'Failed to save API integration',
        variant: 'destructive',
      });
    } finally {
      setSavingProvider(null);
    }
  };

  const handleChange = (provider: string, field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [field]: value,
      },
    }));
  };

  const toggleShowSecret = (provider: string) => {
    setShowSecrets(prev => ({ ...prev, [provider]: !prev[provider] }));
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

  // Get OpenAI integration data for the power section
  const openaiData = formData['openai'] || { api_key: '', api_secret: '', is_enabled: false };
  const isSavingOpenAI = savingProvider === 'openai';

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Zap className="w-6 h-6 text-primary" />
              API Integrations
            </h1>
            <p className="text-muted-foreground">
              Configure third-party API keys for platform-wide features like lead scraping
            </p>
          </div>
          <Button variant="outline" onClick={fetchIntegrations} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        {/* Lovable AI Power Section - Master Toggle */}
        <LovableAIPowerSection
          isEnabled={openaiData.is_enabled}
          apiKey={openaiData.api_key}
          isLoading={isLoading || isSavingOpenAI}
          onToggle={async (enabled) => {
            handleChange('openai', 'is_enabled', enabled);
            await handleSave('openai', { is_enabled: enabled });
          }}
        />

        {/* AI API Key Configuration */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden shadow border border-border/50">
                  <img src={openaiIcon} alt="AI" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base">AI Provider API Key</CardTitle>
                  <CardDescription className="text-xs">
                    Add your OpenAI or Google AI Studio key for custom AI usage
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Info Box */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <Info className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Supported API Keys:</p>
                  <ul className="space-y-1">
                    <li>• <strong>OpenAI:</strong> Starts with <code className="px-1 py-0.5 rounded bg-muted">sk-...</code></li>
                    <li>• <strong>Google AI Studio:</strong> Starts with <code className="px-1 py-0.5 rounded bg-muted">AIza...</code></li>
                    <li>• <strong>Leave empty:</strong> Uses built-in Lovable AI (free tier included)</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="openai-key" className="text-sm">
                  API Key
                </Label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Input
                      id="openai-key"
                      type={showSecrets['openai'] ? 'text' : 'password'}
                      value={openaiData.api_key}
                      onChange={(e) => handleChange('openai', 'api_key', e.target.value)}
                      placeholder="sk-... or AIza... (optional)"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowSecret('openai')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showSecrets['openai'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <Button
                    onClick={() => handleSave('openai')}
                    disabled={isSavingOpenAI}
                    className="gap-2"
                  >
                    {isSavingOpenAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Other Integrations Header */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            Other Integrations
          </h2>
        </div>

        <div className="grid gap-6">
          {integrations.filter(i => i.provider !== 'openai').map((integration) => {
            const providerInfo = providerLabels[integration.provider] || {
              name: integration.provider,
              icon: '🔌',
              color: 'bg-gray-500',
            };
            const data = formData[integration.provider] || { api_key: '', api_secret: '', is_enabled: false };
            const hasApiKey = !!data.api_key && data.api_key.trim().length > 10;
            const isSaving = savingProvider === integration.provider;

            return (
              <Card key={integration.id} className="relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1 h-full ${data.is_enabled ? 'bg-green-500' : 'bg-muted'}`} />
                
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg border border-border/50">
                        <img 
                          src={providerInfo.icon} 
                          alt={providerInfo.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {providerInfo.name}
                          {data.is_enabled && hasApiKey ? (
                            <Badge variant="default" className="bg-green-500 text-xs">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              <XCircle className="w-3 h-3 mr-1" />
                              Inactive
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {integration.config?.description || 'Third-party API integration'}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <Label htmlFor={`enable-${integration.provider}`} className="text-sm">
                      Enable Integration
                    </Label>
                    <Switch
                      id={`enable-${integration.provider}`}
                      checked={data.is_enabled}
                      onCheckedChange={(checked) => handleChange(integration.provider, 'is_enabled', checked)}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`api-key-${integration.provider}`}>API Key</Label>
                      <div className="relative">
                        <Input
                          id={`api-key-${integration.provider}`}
                          type={showSecrets[integration.provider] ? 'text' : 'password'}
                          value={data.api_key}
                          onChange={(e) => handleChange(integration.provider, 'api_key', e.target.value)}
                          placeholder="Enter API key..."
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => toggleShowSecret(integration.provider)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showSecrets[integration.provider] ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`api-secret-${integration.provider}`}>API Secret (optional)</Label>
                      <div className="relative">
                        <Input
                          id={`api-secret-${integration.provider}`}
                          type={showSecrets[integration.provider] ? 'text' : 'password'}
                          value={data.api_secret}
                          onChange={(e) => handleChange(integration.provider, 'api_secret', e.target.value)}
                          placeholder="Enter API secret..."
                          className="pr-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      onClick={() => handleSave(integration.provider)}
                      disabled={isSaving}
                      className="gap-2"
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Save {providerInfo.name}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminApiIntegrations;
