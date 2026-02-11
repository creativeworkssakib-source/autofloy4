import { useState, useEffect } from 'react';
import { Save, Loader2, Search, Globe, BarChart3, Code, CheckCircle, ExternalLink } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { SEOSettings, fetchSEOSettings, updateSEOSettings } from '@/services/adminCmsService';

const WORKER_BASE = import.meta.env.VITE_WORKER_API_URL || 'https://klkrzfwvrmffqkmkyqrh.supabase.co/functions/v1';
const SITEMAP_URL = `${WORKER_BASE}/sitemap`;
const ROBOTS_URL = `${WORKER_BASE}/robots`;

const AdminSEO = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<SEOSettings & {
    google_verification_code?: string;
    bing_verification_code?: string;
    custom_head_scripts?: string;
  }>>({});

  const loadSettings = async () => {
    try {
      setLoading(true);
      const result = await fetchSEOSettings();
      if (result.data) {
        setFormData(result.data as any);
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await updateSEOSettings(formData as any);
      toast({ title: 'SEO settings saved' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Search className="w-6 h-6" />
              SEO Settings
            </h1>
            <p className="text-muted-foreground">Optimize your site for search engines</p>
          </div>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </Button>
        </div>

        <Tabs defaultValue="meta" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="meta">Meta Tags</TabsTrigger>
            <TabsTrigger value="verification">Verification</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="meta">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Default Meta Tags
                </CardTitle>
                <CardDescription>
                  These will be used as fallbacks when pages don't have their own meta tags
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Default Title</Label>
                  <Input
                    value={formData.default_title || ''}
                    onChange={(e) => setFormData({ ...formData, default_title: e.target.value })}
                    placeholder="AutoFloy - AI Business Automation"
                  />
                  <p className="text-xs text-muted-foreground">
                    {(formData.default_title || '').length}/60 characters recommended
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Default Description</Label>
                  <Textarea
                    value={formData.default_description || ''}
                    onChange={(e) => setFormData({ ...formData, default_description: e.target.value })}
                    placeholder="AI-powered automation for Facebook, WhatsApp, and offline shop management."
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    {(formData.default_description || '').length}/160 characters recommended
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Default Keywords</Label>
                  <Input
                    value={formData.default_keywords || ''}
                    onChange={(e) => setFormData({ ...formData, default_keywords: e.target.value })}
                    placeholder="automation, AI, facebook, whatsapp, business"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Default OG Image URL</Label>
                  <Input
                    value={formData.og_image_url || ''}
                    onChange={(e) => setFormData({ ...formData, og_image_url: e.target.value })}
                    placeholder="https://example.com/og-image.jpg"
                  />
                  {formData.og_image_url && (
                    <div className="mt-2 p-4 border rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-2">Preview (1200x630 recommended):</p>
                      <img 
                        src={formData.og_image_url} 
                        alt="OG preview" 
                        className="max-h-32 object-contain"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Twitter Card Type</Label>
                  <select
                    value={formData.twitter_card_type || 'summary_large_image'}
                    onChange={(e) => setFormData({ ...formData, twitter_card_type: e.target.value })}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="summary">Summary</option>
                    <option value="summary_large_image">Summary Large Image</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="verification">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Search Console Verification
                  </CardTitle>
                  <CardDescription>
                    Add verification codes for Google Search Console and Bing Webmaster Tools
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Google Search Console Verification Code</Label>
                    <Input
                      value={formData.google_verification_code || ''}
                      onChange={(e) => setFormData({ ...formData, google_verification_code: e.target.value })}
                      placeholder="Enter verification code (without meta tag)"
                    />
                    <p className="text-xs text-muted-foreground">
                      Get this from{' '}
                      <a 
                        href="https://search.google.com/search-console" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Google Search Console
                      </a>
                      {' '}→ Settings → Ownership verification → HTML tag
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Bing Webmaster Verification Code</Label>
                    <Input
                      value={formData.bing_verification_code || ''}
                      onChange={(e) => setFormData({ ...formData, bing_verification_code: e.target.value })}
                      placeholder="Enter verification code (without meta tag)"
                    />
                    <p className="text-xs text-muted-foreground">
                      Get this from{' '}
                      <a 
                        href="https://www.bing.com/webmasters" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Bing Webmaster Tools
                      </a>
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Links</CardTitle>
                  <CardDescription>
                    Submit your sitemap to search engines for faster indexing
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                    <Label className="text-sm font-medium">Your Sitemap URL:</Label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 p-2 bg-background rounded border text-xs break-all">
                        {SITEMAP_URL}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(SITEMAP_URL);
                          toast({ title: 'Copied!' });
                        }}
                      >
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(SITEMAP_URL, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                    <Label className="text-sm font-medium">Your Robots.txt URL:</Label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 p-2 bg-background rounded border text-xs break-all">
                        {ROBOTS_URL}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(ROBOTS_URL);
                          toast({ title: 'Copied!' });
                        }}
                      >
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(ROBOTS_URL, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <a
                      href="https://search.google.com/search-console/sitemaps"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors text-center"
                    >
                      <p className="font-medium">Submit to Google</p>
                      <p className="text-xs text-muted-foreground">Search Console</p>
                    </a>
                    <a
                      href="https://www.bing.com/webmasters/sitemaps"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors text-center"
                    >
                      <p className="font-medium">Submit to Bing</p>
                      <p className="text-xs text-muted-foreground">Webmaster Tools</p>
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Analytics & Tracking
                </CardTitle>
                <CardDescription>
                  Connect analytics and tracking services
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Google Analytics ID</Label>
                  <Input
                    value={formData.google_analytics_id || ''}
                    onChange={(e) => setFormData({ ...formData, google_analytics_id: e.target.value })}
                    placeholder="G-XXXXXXXXXX"
                  />
                  <p className="text-xs text-muted-foreground">
                    Your Google Analytics 4 measurement ID
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Google Tag Manager ID</Label>
                  <Input
                    value={formData.google_tag_manager_id || ''}
                    onChange={(e) => setFormData({ ...formData, google_tag_manager_id: e.target.value })}
                    placeholder="GTM-XXXXXXX"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Facebook Pixel ID</Label>
                  <Input
                    value={formData.facebook_pixel_id || ''}
                    onChange={(e) => setFormData({ ...formData, facebook_pixel_id: e.target.value })}
                    placeholder="1234567890"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="w-5 h-5" />
                    Robots.txt Content
                  </CardTitle>
                  <CardDescription>
                    Custom robots.txt content for search engine crawlers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Textarea
                      value={formData.robots_txt_content || ''}
                      onChange={(e) => setFormData({ ...formData, robots_txt_content: e.target.value })}
                      placeholder="User-agent: *&#10;Allow: /&#10;Sitemap: https://example.com/sitemap.xml"
                      rows={8}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave empty to use default robots.txt. Sitemap URL will be added automatically.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sitemap</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={formData.sitemap_enabled !== false}
                      onCheckedChange={(checked) => setFormData({ ...formData, sitemap_enabled: checked })}
                    />
                    <div>
                      <Label>Enable Automatic Sitemap</Label>
                      <p className="text-xs text-muted-foreground">
                        Automatically generate sitemap.xml for search engines
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Custom Head Scripts</CardTitle>
                  <CardDescription>
                    Add custom scripts or meta tags to the &lt;head&gt; section
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.custom_head_scripts || ''}
                    onChange={(e) => setFormData({ ...formData, custom_head_scripts: e.target.value })}
                    placeholder='<script>// custom script</script>&#10;<meta name="custom" content="value" />'
                    rows={6}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    ⚠️ Be careful with custom scripts - only add trusted code
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminSEO;
