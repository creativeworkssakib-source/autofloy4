import { useState, useEffect } from 'react';
import { Save, Loader2, Palette, Type, Image, Code } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { AppearanceSettings, fetchAppearanceSettings, updateAppearanceSettings } from '@/services/adminCmsService';

const colorPresets = {
  primary: [
    { name: 'Blue', value: '217 100% 50%' },
    { name: 'Purple', value: '262 100% 50%' },
    { name: 'Green', value: '142 76% 36%' },
    { name: 'Orange', value: '24 95% 53%' },
    { name: 'Red', value: '0 84% 60%' },
    { name: 'Teal', value: '174 84% 32%' },
  ],
  fonts: [
    'Outfit', 'Inter', 'Poppins', 'Roboto', 'Montserrat', 
    'Open Sans', 'Lato', 'Nunito', 'Space Grotesk', 'Plus Jakarta Sans'
  ]
};

const AdminAppearance = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<AppearanceSettings>>({});

  const loadSettings = async () => {
    try {
      setLoading(true);
      const result = await fetchAppearanceSettings();
      if (result.data) {
        setFormData(result.data as AppearanceSettings);
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
      await updateAppearanceSettings(formData);
      toast({ title: 'Appearance settings saved' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const hslToHex = (hsl: string): string => {
    try {
      const [h, s, l] = hsl.split(' ').map((v) => parseFloat(v.replace('%', '')));
      const sNorm = s / 100;
      const lNorm = l / 100;
      const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
      const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
      const m = lNorm - c / 2;
      let r = 0, g = 0, b = 0;
      if (h < 60) { r = c; g = x; }
      else if (h < 120) { r = x; g = c; }
      else if (h < 180) { g = c; b = x; }
      else if (h < 240) { g = x; b = c; }
      else if (h < 300) { r = x; b = c; }
      else { r = c; b = x; }
      const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    } catch {
      return '#3b82f6';
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
              <Palette className="w-6 h-6" />
              Site Appearance
            </h1>
            <p className="text-muted-foreground">Customize colors, fonts, and visual elements</p>
          </div>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </Button>
        </div>

        <Tabs defaultValue="colors" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="fonts">Fonts</TabsTrigger>
            <TabsTrigger value="hero">Hero Section</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="colors">
            <Card>
              <CardHeader>
                <CardTitle>Brand Colors</CardTitle>
                <CardDescription>Define your site's color palette (HSL format)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Color inputs */}
                {[
                  { key: 'primary_color', label: 'Primary Color' },
                  { key: 'secondary_color', label: 'Secondary Color' },
                  { key: 'accent_color', label: 'Accent Color' },
                  { key: 'success_color', label: 'Success Color' },
                  { key: 'warning_color', label: 'Warning Color' },
                  { key: 'destructive_color', label: 'Destructive Color' },
                ].map(({ key, label }) => (
                  <div key={key} className="space-y-2">
                    <Label>{label}</Label>
                    <div className="flex gap-3">
                      <div
                        className="w-10 h-10 rounded-lg border shadow-sm"
                        style={{ backgroundColor: hslToHex(formData[key as keyof AppearanceSettings] as string || '') }}
                      />
                      <Input
                        value={(formData[key as keyof AppearanceSettings] as string) || ''}
                        onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                        placeholder="217 100% 50%"
                        className="flex-1"
                      />
                    </div>
                    {key === 'primary_color' && (
                      <div className="flex gap-2 mt-2">
                        {colorPresets.primary.map((preset) => (
                          <button
                            key={preset.name}
                            onClick={() => setFormData({ ...formData, primary_color: preset.value })}
                            className="w-8 h-8 rounded-md border hover:scale-110 transition-transform"
                            style={{ backgroundColor: hslToHex(preset.value) }}
                            title={preset.name}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fonts">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Type className="w-5 h-5" />
                  Typography
                </CardTitle>
                <CardDescription>Choose fonts for headings and body text</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Heading Font</Label>
                  <select
                    value={formData.heading_font || 'Outfit'}
                    onChange={(e) => setFormData({ ...formData, heading_font: e.target.value })}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {colorPresets.fonts.map((font) => (
                      <option key={font} value={font}>{font}</option>
                    ))}
                  </select>
                  <p className="text-2xl font-bold mt-2" style={{ fontFamily: formData.heading_font }}>
                    Preview Heading Text
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Body Font</Label>
                  <select
                    value={formData.body_font || 'Outfit'}
                    onChange={(e) => setFormData({ ...formData, body_font: e.target.value })}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {colorPresets.fonts.map((font) => (
                      <option key={font} value={font}>{font}</option>
                    ))}
                  </select>
                  <p className="mt-2" style={{ fontFamily: formData.body_font }}>
                    This is preview body text. The quick brown fox jumps over the lazy dog.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hero">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="w-5 h-5" />
                  Hero Section
                </CardTitle>
                <CardDescription>Customize the landing page hero section</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Hero Title (English)</Label>
                  <Input
                    value={formData.hero_title || ''}
                    onChange={(e) => setFormData({ ...formData, hero_title: e.target.value })}
                    placeholder="AI-Powered Business Automation"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hero Title (Bengali)</Label>
                  <Input
                    value={formData.hero_title_bn || ''}
                    onChange={(e) => setFormData({ ...formData, hero_title_bn: e.target.value })}
                    placeholder="AI-চালিত ব্যবসা অটোমেশন"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hero Subtitle</Label>
                  <Textarea
                    value={formData.hero_subtitle || ''}
                    onChange={(e) => setFormData({ ...formData, hero_subtitle: e.target.value })}
                    placeholder="Automate your business with AI..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hero Image URL</Label>
                  <Input
                    value={formData.hero_image_url || ''}
                    onChange={(e) => setFormData({ ...formData, hero_image_url: e.target.value })}
                    placeholder="https://example.com/hero.jpg"
                  />
                  {formData.hero_image_url && (
                    <div className="mt-2 p-4 border rounded-lg bg-muted/50">
                      <img 
                        src={formData.hero_image_url} 
                        alt="Hero preview" 
                        className="max-h-48 object-contain mx-auto"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  Custom CSS
                </CardTitle>
                <CardDescription>Add custom CSS styles (use with caution)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label>Custom CSS</Label>
                  <Textarea
                    value={formData.custom_css || ''}
                    onChange={(e) => setFormData({ ...formData, custom_css: e.target.value })}
                    placeholder=".custom-class {&#10;  color: red;&#10;}"
                    rows={12}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Custom CSS will be injected into all pages. Be careful not to break existing styles.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminAppearance;
