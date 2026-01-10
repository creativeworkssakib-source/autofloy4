import { useState, useEffect } from 'react';
import { Save, Key, Loader2, Eye, EyeOff, CheckCircle, XCircle, RefreshCw, Zap } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

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

const providerLabels: Record<string, { name: string; icon: string; color: string }> = {
  apify: { name: 'Apify', icon: '🤖', color: 'bg-orange-500' },
  firecrawl: { name: 'Firecrawl', icon: '🔥', color: 'bg-red-500' },
  google_maps: { name: 'Google Maps', icon: '🗺️', color: 'bg-blue-500' },
  openai: { name: 'OpenAI', icon: '🧠', color: 'bg-green-500' },
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
            const hasApiKey = !!data.api_key;
            const isSaving = savingProvider === integration.provider;

            return (
              <Card key={integration.id} className="relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1 h-full ${data.is_enabled ? 'bg-green-500' : 'bg-muted'}`} />
                
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${providerInfo.color} flex items-center justify-center text-xl`}>
                        {providerInfo.icon}
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
                    
                    <div className="flex items-center gap-3">
                      <Label htmlFor={`enable-${integration.provider}`} className="text-sm text-muted-foreground">
                        Enable
                      </Label>
                      <Switch
                        id={`enable-${integration.provider}`}
                        checked={data.is_enabled}
                        onCheckedChange={(checked) => handleChange(integration.provider, 'is_enabled', checked)}
                      />
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
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

        <Card className="mt-6 bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Key className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-medium">How API Integrations Work</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  When you enable and configure an API here, all users on your platform can use features 
                  powered by that API (like lead scraping with Apify or Firecrawl). API keys are securely 
                  stored and only used server-side.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminApiIntegrations;
