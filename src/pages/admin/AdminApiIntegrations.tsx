import { useState, useEffect } from 'react';
import { Save, Key, Loader2, Eye, EyeOff, CheckCircle, XCircle, RefreshCw, Zap, Power, Bot, Sparkles } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

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
  openai: { name: 'OpenAI', icon: openaiIcon, color: 'bg-green-500', isAI: true },
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

  const handleSave = async (provider: string) => {
    try {
      setSavingProvider(provider);
      const token = localStorage.getItem("autofloy_token");
      const data = formData[provider];

      const response = await fetch(`${SUPABASE_URL}/functions/v1/admin/api-integrations`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          provider,
          api_key: data.api_key || null,
          api_secret: data.api_secret || null,
          is_enabled: data.is_enabled,
        }),
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

        <div className="grid gap-6">
          {integrations.map((integration) => {
            const providerInfo = providerLabels[integration.provider] || {
              name: integration.provider,
              icon: '🔌',
              color: 'bg-gray-500',
            };
            const data = formData[integration.provider] || { api_key: '', api_secret: '', is_enabled: false };
            const hasApiKey = !!data.api_key && data.api_key.trim().length > 10;
            const isSaving = savingProvider === integration.provider;
            const isOpenAI = integration.provider === 'openai';

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
                          {isOpenAI && (
                            <Badge variant="outline" className="text-xs bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/30">
                              <Bot className="w-3 h-3 mr-1" />
                              AI Power
                            </Badge>
                          )}
                          {data.is_enabled && hasApiKey ? (
                            <Badge variant="default" className="bg-green-500 text-xs">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Active
                            </Badge>
                          ) : data.is_enabled && !hasApiKey && isOpenAI ? (
                            <Badge variant="default" className="bg-blue-500 text-xs">
                              <Sparkles className="w-3 h-3 mr-1" />
                              Using Lovable AI
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
                  {/* AI Power Toggle for OpenAI */}
                  {isOpenAI && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 border border-primary/20"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl ${data.is_enabled ? 'bg-green-500/20' : 'bg-muted'} transition-colors`}>
                            <Power className={`w-5 h-5 ${data.is_enabled ? 'text-green-500' : 'text-muted-foreground'}`} />
                          </div>
                          <div>
                            <h4 className="font-semibold flex items-center gap-2">
                              AI Power Switch
                              <AnimatePresence mode="wait">
                                {data.is_enabled ? (
                                  <motion.span
                                    key="on"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    className="text-xs text-green-500 font-medium"
                                  >
                                    ON
                                  </motion.span>
                                ) : (
                                  <motion.span
                                    key="off"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    className="text-xs text-muted-foreground font-medium"
                                  >
                                    OFF
                                  </motion.span>
                                )}
                              </AnimatePresence>
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {data.is_enabled 
                                ? hasApiKey 
                                  ? '✓ Using your OpenAI API key' 
                                  : '✓ Using Lovable AI (built-in)'
                                : 'AI features are currently disabled'}
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={data.is_enabled}
                          onCheckedChange={(checked) => handleChange(integration.provider, 'is_enabled', checked)}
                          className="data-[state=checked]:bg-green-500"
                        />
                      </div>
                      
                      {data.is_enabled && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-3 pt-3 border-t border-primary/10"
                        >
                          <p className="text-xs text-muted-foreground">
                            {hasApiKey 
                              ? '🔑 Custom OpenAI key active - AI will use your API key for all requests'
                              : '✨ No custom key - AI uses Lovable AI Gateway (free tier included)'}
                          </p>
                        </motion.div>
                      )}
                    </motion.div>
                  )}

                  {/* Regular Enable Toggle for non-OpenAI */}
                  {!isOpenAI && (
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
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`api-key-${integration.provider}`}>
                        API Key {isOpenAI && <span className="text-xs text-muted-foreground">(optional - uses Lovable AI if empty)</span>}
                      </Label>
                      <div className="relative">
                        <Input
                          id={`api-key-${integration.provider}`}
                          type={showSecrets[integration.provider] ? 'text' : 'password'}
                          value={data.api_key}
                          onChange={(e) => handleChange(integration.provider, 'api_key', e.target.value)}
                          placeholder={isOpenAI ? "sk-... (optional)" : "Enter API key..."}
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
                    
                    {!isOpenAI && (
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
                    )}
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

        {/* AI Status Info Card */}
        <Card className="mt-6 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium flex items-center gap-2">
                  AI Configuration Guide
                  <Badge variant="outline" className="text-xs">Real-time</Badge>
                </h3>
                <div className="text-sm text-muted-foreground mt-2 space-y-1">
                  <p>• <strong>Toggle ON:</strong> AI features work (comment replies, inbox automation, order taking)</p>
                  <p>• <strong>Toggle OFF:</strong> All AI features stop immediately</p>
                  <p>• <strong>With API Key:</strong> Uses your OpenAI account & credits</p>
                  <p>• <strong>Without API Key:</strong> Uses Lovable AI Gateway (free tier included)</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminApiIntegrations;
