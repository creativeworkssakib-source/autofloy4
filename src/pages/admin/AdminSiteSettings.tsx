import { useState, useEffect } from 'react';
import { Save, Upload, Building2, Mail, Phone, Globe, Share2, FileText, Loader2, MessageSquare, Send, CheckCircle, XCircle, Video, Youtube, PlayCircle, ToggleLeft, Store, ShoppingBag } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useSiteSettings, useUpdateSiteSettings, SiteSettings } from '@/contexts/SiteSettingsContext';
import { toast as sonnerToast } from 'sonner';

const SUPABASE_URL = "https://klkrzfwvrmffqkmkyqrh.supabase.co";

const AdminSiteSettings = () => {
  const { settings, isLoading, error } = useSiteSettings();
  const { updateSettings } = useUpdateSiteSettings();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<SiteSettings>>({});
  
  // SMS Testing state
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('This is a test SMS from AutoFloy platform.');
  const [isSendingTestSms, setIsSendingTestSms] = useState(false);
  const [smsTestResult, setSmsTestResult] = useState<{ success: boolean; message: string } | null>(null);
  
  // Video upload state
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  const sendTestSms = async () => {
    if (!testPhone.trim()) {
      sonnerToast.error('Please enter a phone number');
      return;
    }

    setIsSendingTestSms(true);
    setSmsTestResult(null);

    try {
      const token = localStorage.getItem("autofloy_token");
      const response = await fetch(`${SUPABASE_URL}/functions/v1/admin/test-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          phone: testPhone,
          message: testMessage,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSmsTestResult({ success: true, message: data.message || 'Test SMS sent successfully!' });
        sonnerToast.success('Test SMS sent successfully!');
      } else {
        setSmsTestResult({ success: false, message: data.error || 'Failed to send test SMS' });
        sonnerToast.error(data.error || 'Failed to send test SMS');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send test SMS';
      setSmsTestResult({ success: false, message: errorMessage });
      sonnerToast.error(errorMessage);
    } finally {
      setIsSendingTestSms(false);
    }
  };

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleChange = (field: keyof SiteSettings, value: string | boolean | number | null) => {
    if (typeof value === 'boolean') {
      setFormData(prev => ({ ...prev, [field]: value }));
    } else if (typeof value === 'number') {
      setFormData(prev => ({ ...prev, [field]: value }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value || null }));
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await updateSettings(formData);
      toast({
        title: 'Settings saved',
        description: 'Your site settings have been updated successfully.',
      });
    } catch (err: any) {
      toast({
        title: 'Error saving settings',
        description: err?.message || 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
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

  if (error) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
            Error loading settings: {error}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Site Settings</h1>
            <p className="text-muted-foreground">Manage your company branding and contact information</p>
          </div>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </Button>
        </div>

        <Tabs defaultValue="branding" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 md:grid-cols-7 h-auto gap-1">
            <TabsTrigger value="branding" className="text-xs sm:text-sm py-2">Branding</TabsTrigger>
            <TabsTrigger value="features" className="text-xs sm:text-sm py-2">Features</TabsTrigger>
            <TabsTrigger value="contact" className="text-xs sm:text-sm py-2">Contact</TabsTrigger>
            <TabsTrigger value="social" className="text-xs sm:text-sm py-2">Social</TabsTrigger>
            <TabsTrigger value="demo" className="text-xs sm:text-sm py-2">Demo Video</TabsTrigger>
            <TabsTrigger value="sms" className="text-xs sm:text-sm py-2">SMS</TabsTrigger>
            <TabsTrigger value="legal" className="text-xs sm:text-sm py-2">Legal</TabsTrigger>
          </TabsList>

          {/* Branding Tab */}
          <TabsContent value="branding">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Company Branding
                </CardTitle>
                <CardDescription>
                  Basic company information and branding assets
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="company_name">Company Name</Label>
                    <Input
                      id="company_name"
                      value={formData.company_name || ''}
                      onChange={(e) => handleChange('company_name', e.target.value)}
                      placeholder="AutoFloy"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tagline">Tagline</Label>
                    <Input
                      id="tagline"
                      value={formData.tagline || ''}
                      onChange={(e) => handleChange('tagline', e.target.value)}
                      placeholder="AI-powered automation"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="about_us">About Us</Label>
                  <Textarea
                    id="about_us"
                    value={formData.about_us || ''}
                    onChange={(e) => handleChange('about_us', e.target.value)}
                    placeholder="Tell visitors about your company..."
                    rows={4}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="logo_url">Logo URL</Label>
                    <div className="flex gap-2">
                      <Input
                        id="logo_url"
                        value={formData.logo_url || ''}
                        onChange={(e) => handleChange('logo_url', e.target.value)}
                        placeholder="https://example.com/logo.png"
                      />
                    </div>
                    {formData.logo_url && (
                      <div className="mt-2 p-4 border rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                        <img 
                          src={formData.logo_url} 
                          alt="Logo preview" 
                          className="max-h-16 object-contain"
                          onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="favicon_url">Favicon URL</Label>
                    <Input
                      id="favicon_url"
                      value={formData.favicon_url || ''}
                      onChange={(e) => handleChange('favicon_url', e.target.value)}
                      placeholder="https://example.com/favicon.ico"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website_url">Website URL</Label>
                  <Input
                    id="website_url"
                    value={formData.website_url || ''}
                    onChange={(e) => handleChange('website_url', e.target.value)}
                    placeholder="https://autofloy.online"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Contact Information
                </CardTitle>
                <CardDescription>
                  Email addresses, phone number, and physical address
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="support_email">Support Email</Label>
                    <Input
                      id="support_email"
                      type="email"
                      value={formData.support_email || ''}
                      onChange={(e) => handleChange('support_email', e.target.value)}
                      placeholder="support@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billing_email">Billing Email</Label>
                    <Input
                      id="billing_email"
                      type="email"
                      value={formData.billing_email || ''}
                      onChange={(e) => handleChange('billing_email', e.target.value)}
                      placeholder="billing@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone_number">Phone Number</Label>
                  <Input
                    id="phone_number"
                    value={formData.phone_number || ''}
                    onChange={(e) => handleChange('phone_number', e.target.value)}
                    placeholder="+1 234 567 890"
                  />
                </div>

                <div className="border-t pt-6">
                  <h4 className="font-medium mb-4">Address</h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="company_address">Street Address</Label>
                      <Input
                        id="company_address"
                        value={formData.company_address || ''}
                        onChange={(e) => handleChange('company_address', e.target.value)}
                        placeholder="123 Business Street"
                      />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={formData.city || ''}
                          onChange={(e) => handleChange('city', e.target.value)}
                          placeholder="New York"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State/Province</Label>
                        <Input
                          id="state"
                          value={formData.state || ''}
                          onChange={(e) => handleChange('state', e.target.value)}
                          placeholder="NY"
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          value={formData.country || ''}
                          onChange={(e) => handleChange('country', e.target.value)}
                          placeholder="United States"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="postal_code">Postal Code</Label>
                        <Input
                          id="postal_code"
                          value={formData.postal_code || ''}
                          onChange={(e) => handleChange('postal_code', e.target.value)}
                          placeholder="10001"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Social Links Tab */}
          <TabsContent value="social">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="w-5 h-5" />
                  Social Media Links
                </CardTitle>
                <CardDescription>
                  Connect your social media profiles
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="facebook_url">Facebook</Label>
                    <Input
                      id="facebook_url"
                      value={formData.facebook_url || ''}
                      onChange={(e) => handleChange('facebook_url', e.target.value)}
                      placeholder="https://facebook.com/yourpage"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twitter_url">Twitter / X</Label>
                    <Input
                      id="twitter_url"
                      value={formData.twitter_url || ''}
                      onChange={(e) => handleChange('twitter_url', e.target.value)}
                      placeholder="https://twitter.com/yourhandle"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instagram_url">Instagram</Label>
                    <Input
                      id="instagram_url"
                      value={formData.instagram_url || ''}
                      onChange={(e) => handleChange('instagram_url', e.target.value)}
                      placeholder="https://instagram.com/yourhandle"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="linkedin_url">LinkedIn</Label>
                    <Input
                      id="linkedin_url"
                      value={formData.linkedin_url || ''}
                      onChange={(e) => handleChange('linkedin_url', e.target.value)}
                      placeholder="https://linkedin.com/company/yourcompany"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="youtube_url">YouTube</Label>
                    <Input
                      id="youtube_url"
                      value={formData.youtube_url || ''}
                      onChange={(e) => handleChange('youtube_url', e.target.value)}
                      placeholder="https://youtube.com/@yourchannel"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Demo Video Tab */}
          <TabsContent value="demo">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-primary" />
                  Demo Video Settings
                </CardTitle>
                <CardDescription>
                  Configure the demo video shown on the landing page when users click "Watch Demo"
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Enable Demo Video */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label htmlFor="demo_video_enabled" className="text-base font-medium">Enable Demo Video</Label>
                    <p className="text-sm text-muted-foreground">Show the "Watch Demo" button on the landing page</p>
                  </div>
                  <Switch
                    id="demo_video_enabled"
                    checked={formData.demo_video_enabled || false}
                    onCheckedChange={(checked) => handleChange('demo_video_enabled', checked)}
                  />
                </div>

                {formData.demo_video_enabled && (
                  <>
                    {/* Video Type Selection */}
                    <div className="space-y-3">
                      <Label>Video Source</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            formData.demo_video_type === 'youtube' 
                              ? 'border-primary bg-primary/5' 
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => handleChange('demo_video_type', 'youtube')}
                        >
                          <div className="flex items-center gap-3">
                            <Youtube className="w-8 h-8 text-red-600" />
                            <div>
                              <p className="font-medium">YouTube</p>
                              <p className="text-xs text-muted-foreground">Paste a YouTube video URL</p>
                            </div>
                          </div>
                        </div>
                        <div
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            formData.demo_video_type === 'upload' 
                              ? 'border-primary bg-primary/5' 
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => handleChange('demo_video_type', 'upload')}
                        >
                          <div className="flex items-center gap-3">
                            <Upload className="w-8 h-8 text-primary" />
                            <div>
                              <p className="font-medium">Upload Video</p>
                              <p className="text-xs text-muted-foreground">Enter video file URL</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* YouTube URL Input */}
                    {formData.demo_video_type === 'youtube' && (
                      <div className="space-y-2">
                        <Label htmlFor="demo_video_youtube_url">YouTube Video URL</Label>
                        <Input
                          id="demo_video_youtube_url"
                          value={formData.demo_video_youtube_url || ''}
                          onChange={(e) => handleChange('demo_video_youtube_url', e.target.value)}
                          placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                        />
                        <p className="text-xs text-muted-foreground">
                          Supports youtube.com and youtu.be links
                        </p>
                        {formData.demo_video_youtube_url && (
                          <div className="mt-4 p-4 border rounded-lg bg-muted/50">
                            <p className="text-sm font-medium mb-2 flex items-center gap-2">
                              <PlayCircle className="w-4 h-4" />
                              Preview
                            </p>
                            <div className="aspect-video rounded-lg overflow-hidden bg-black">
                              <iframe
                                src={`https://www.youtube.com/embed/${
                                  formData.demo_video_youtube_url.match(/youtu\.be\/([^?&]+)/)?.[1] ||
                                  formData.demo_video_youtube_url.match(/youtube\.com\/watch\?v=([^&]+)/)?.[1] ||
                                  ''
                                }`}
                                title="Demo Video Preview"
                                className="w-full h-full"
                                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Upload Video */}
                    {formData.demo_video_type === 'upload' && (
                      <div className="space-y-4">
                        {/* File Upload */}
                        <div className="space-y-2">
                          <Label>Upload Video File</Label>
                          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                            <input
                              type="file"
                              accept="video/mp4,video/webm,video/ogg"
                              className="hidden"
                              id="video-upload"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                
                                // Check file size (max 100MB)
                                if (file.size > 100 * 1024 * 1024) {
                                  sonnerToast.error('File size too large. Maximum 100MB allowed.');
                                  return;
                                }
                                
                                setIsUploadingVideo(true);
                                try {
                                  const token = localStorage.getItem("autofloy_token");
                                  const formDataUpload = new FormData();
                                  formDataUpload.append('file', file);
                                  formDataUpload.append('bucket', 'demo-videos');
                                  formDataUpload.append('path', `demo-video-${Date.now()}.${file.name.split('.').pop()}`);
                                  
                                  const response = await fetch(`${SUPABASE_URL}/functions/v1/storage-upload`, {
                                    method: 'POST',
                                    headers: {
                                      ...(token && { Authorization: `Bearer ${token}` }),
                                    },
                                    body: formDataUpload,
                                  });
                                  
                                  const result = await response.json();
                                  
                                  if (response.ok && result.url) {
                                    handleChange('demo_video_upload_url', result.url);
                                    sonnerToast.success('Video uploaded successfully!');
                                  } else {
                                    throw new Error(result.error || 'Upload failed');
                                  }
                                } catch (err: unknown) {
                                  const errorMessage = err instanceof Error ? err.message : 'Failed to upload video';
                                  sonnerToast.error(errorMessage);
                                } finally {
                                  setIsUploadingVideo(false);
                                }
                              }}
                            />
                            <label htmlFor="video-upload" className="cursor-pointer">
                              {isUploadingVideo ? (
                                <div className="flex flex-col items-center gap-2">
                                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                                  <p className="text-sm text-muted-foreground">Uploading video...</p>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center gap-2">
                                  <Upload className="w-10 h-10 text-muted-foreground" />
                                  <p className="text-sm font-medium">Click to upload video</p>
                                  <p className="text-xs text-muted-foreground">MP4, WebM, OGG (max 100MB)</p>
                                </div>
                              )}
                            </label>
                          </div>
                        </div>
                        
                        {/* Or enter URL manually */}
                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">Or enter URL</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="demo_video_upload_url">Video File URL</Label>
                          <Input
                            id="demo_video_upload_url"
                            value={formData.demo_video_upload_url || ''}
                            onChange={(e) => handleChange('demo_video_upload_url', e.target.value)}
                            placeholder="https://storage.example.com/demo-video.mp4"
                          />
                        </div>
                        
                        {formData.demo_video_upload_url && (
                          <div className="mt-4 p-4 border rounded-lg bg-muted/50">
                            <p className="text-sm font-medium mb-2 flex items-center gap-2">
                              <PlayCircle className="w-4 h-4" />
                              Preview
                            </p>
                            <div className="aspect-video rounded-lg overflow-hidden bg-black">
                              <video
                                src={formData.demo_video_upload_url}
                                className="w-full h-full"
                                controls
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* SMS Settings Tab */}
          <TabsContent value="sms">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-green-600" />
                  Platform SMS Settings
                </CardTitle>
                <CardDescription>
                  Configure the default SMS provider for all platform users
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Enable Platform SMS */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label htmlFor="platform_sms_enabled" className="text-base font-medium">
                      Enable Platform SMS Service
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Allow users to send SMS using the platform's default SMS provider
                    </p>
                  </div>
                  <Switch
                    id="platform_sms_enabled"
                    checked={formData.platform_sms_enabled || false}
                    onCheckedChange={(checked) => handleChange('platform_sms_enabled', checked)}
                  />
                </div>

                {formData.platform_sms_enabled && (
                  <>
                    {/* SMS Provider Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="platform_sms_provider">SMS Provider</Label>
                      <select
                        id="platform_sms_provider"
                        value={formData.platform_sms_provider || 'ssl_wireless'}
                        onChange={(e) => handleChange('platform_sms_provider', e.target.value)}
                        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="ssl_wireless">SSL Wireless</option>
                        <option value="bulksms_bd">BulkSMS BD</option>
                        <option value="twilio">Twilio</option>
                        <option value="mim_sms">MIM SMS</option>
                        <option value="greenweb">Green Web BD</option>
                      </select>
                      <p className="text-xs text-muted-foreground">
                        Select the SMS provider for all platform users
                      </p>
                    </div>

                    <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
                      <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                        {formData.platform_sms_provider === "ssl_wireless" && "SSL Wireless Configuration"}
                        {formData.platform_sms_provider === "bulksms_bd" && "BulkSMS BD Configuration"}
                        {formData.platform_sms_provider === "twilio" && "Twilio Configuration"}
                        {formData.platform_sms_provider === "mim_sms" && "MIM SMS Configuration"}
                        {formData.platform_sms_provider === "greenweb" && "Green Web BD Configuration"}
                        {!formData.platform_sms_provider && "SSL Wireless Configuration"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Configure your API credentials. These will be used for all platform users who choose to use the platform SMS service.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="platform_sms_api_key">
                        {formData.platform_sms_provider === "twilio" ? "Account SID:Auth Token" : "SMS API Key"}
                      </Label>
                      <Input
                        id="platform_sms_api_key"
                        type="password"
                        value={formData.platform_sms_api_key || ''}
                        onChange={(e) => handleChange('platform_sms_api_key', e.target.value)}
                        placeholder={
                          formData.platform_sms_provider === "twilio" 
                            ? "ACxxxxx:auth_token" 
                            : "Enter your API key"
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        {formData.platform_sms_provider === "twilio" 
                          ? "Format: ACCOUNT_SID:AUTH_TOKEN"
                          : "Your API token from provider dashboard"}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="platform_sms_sender_id">Sender ID</Label>
                      <Input
                        id="platform_sms_sender_id"
                        value={formData.platform_sms_sender_id || ''}
                        onChange={(e) => handleChange('platform_sms_sender_id', e.target.value)}
                        placeholder="e.g., AUTOFLOY"
                      />
                      <p className="text-xs text-muted-foreground">
                        Your registered sender ID from the provider
                      </p>
                    </div>

                    {/* Show selected provider badge */}
                    <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                      <MessageSquare className="w-4 h-4 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-700 dark:text-green-400">
                          Active Provider: {
                            formData.platform_sms_provider === "ssl_wireless" ? "SSL Wireless" :
                            formData.platform_sms_provider === "bulksms_bd" ? "BulkSMS BD" :
                            formData.platform_sms_provider === "twilio" ? "Twilio" :
                            formData.platform_sms_provider === "mim_sms" ? "MIM SMS" :
                            formData.platform_sms_provider === "greenweb" ? "Green Web BD" :
                            "SSL Wireless"
                          }
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Users using "Platform SMS (Free)" will see this provider name
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* SMS Test Section */}
                {formData.platform_sms_enabled && formData.platform_sms_api_key && (
                  <Card className="mt-4 border-2 border-dashed border-primary/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Send className="w-4 h-4" />
                        Test SMS
                      </CardTitle>
                      <CardDescription>
                        Send a test SMS to verify your configuration
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="test_phone">Phone Number</Label>
                          <Input
                            id="test_phone"
                            value={testPhone}
                            onChange={(e) => setTestPhone(e.target.value)}
                            placeholder="+8801XXXXXXXXX"
                          />
                          <p className="text-xs text-muted-foreground">
                            Include country code (e.g., +880)
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="test_message">Test Message</Label>
                          <Input
                            id="test_message"
                            value={testMessage}
                            onChange={(e) => setTestMessage(e.target.value)}
                            placeholder="Test message..."
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Button 
                          onClick={sendTestSms} 
                          disabled={isSendingTestSms || !testPhone}
                          variant="outline"
                          className="gap-2"
                        >
                          {isSendingTestSms ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                          Send Test SMS
                        </Button>

                        {smsTestResult && (
                          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
                            smsTestResult.success 
                              ? 'bg-green-500/10 text-green-700 dark:text-green-400' 
                              : 'bg-destructive/10 text-destructive'
                          }`}>
                            {smsTestResult.success ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <XCircle className="w-4 h-4" />
                            )}
                            <span className="truncate max-w-[300px]">{smsTestResult.message}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* SMS Limits by Plan */}
                <Card className="border-2 border-primary/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      📊 প্ল্যান অনুযায়ী SMS Limits
                    </CardTitle>
                    <CardDescription>
                      প্রতিটি subscription plan এ দৈনিক কতটি SMS পাঠাতে পারবে সেটি নির্ধারণ করুন
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {/* Trial - Always 0 */}
                      <div className="space-y-2">
                        <Label htmlFor="sms_limit_trial" className="flex items-center gap-2">
                          Free Trial
                          <span className="text-xs text-muted-foreground">(Always Disabled)</span>
                        </Label>
                        <Input
                          id="sms_limit_trial"
                          type="number"
                          value={0}
                          disabled
                          className="bg-muted"
                        />
                        <p className="text-xs text-destructive">
                          Trial ইউজাররা Platform SMS ব্যবহার করতে পারবে না
                        </p>
                      </div>

                      {/* Starter */}
                      <div className="space-y-2">
                        <Label htmlFor="sms_limit_starter" className="flex items-center gap-2">
                          Starter Plan
                          <span className="text-xs text-green-600">/ দিন</span>
                        </Label>
                        <Input
                          id="sms_limit_starter"
                          type="number"
                          min={0}
                          value={formData.sms_limit_starter ?? 50}
                          onChange={(e) => { const val = e.target.value; handleChange('sms_limit_starter', val === "" ? 0 : parseInt(val) || 0); }}
                          placeholder="50"
                        />
                      </div>

                      {/* Professional */}
                      <div className="space-y-2">
                        <Label htmlFor="sms_limit_professional" className="flex items-center gap-2">
                          Professional Plan
                          <span className="text-xs text-green-600">/ দিন</span>
                        </Label>
                        <Input
                          id="sms_limit_professional"
                          type="number"
                          min={0}
                          value={formData.sms_limit_professional ?? 200}
                          onChange={(e) => { const val = e.target.value; handleChange('sms_limit_professional', val === "" ? 0 : parseInt(val) || 0); }}
                          placeholder="200"
                        />
                      </div>

                      {/* Business */}
                      <div className="space-y-2">
                        <Label htmlFor="sms_limit_business" className="flex items-center gap-2">
                          Business Plan
                          <span className="text-xs text-green-600">/ দিন</span>
                        </Label>
                        <Input
                          id="sms_limit_business"
                          type="number"
                          min={0}
                          value={formData.sms_limit_business ?? 1000}
                          onChange={(e) => { const val = e.target.value; handleChange('sms_limit_business', val === "" ? 0 : parseInt(val) || 0); }}
                          placeholder="1000"
                        />
                      </div>

                      {/* Lifetime */}
                      <div className="space-y-2">
                        <Label htmlFor="sms_limit_lifetime" className="flex items-center gap-2">
                          Lifetime Plan
                          <span className="text-xs text-primary font-medium">Unlimited</span>
                        </Label>
                        <Input
                          id="sms_limit_lifetime"
                          type="text"
                          value="Unlimited"
                          disabled
                          className="bg-primary/10 text-primary font-medium"
                        />
                        <p className="text-xs text-muted-foreground">
                          Lifetime ইউজাররা সীমাহীন SMS পাঠাতে পারবে
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20 mt-4">
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        ⚠️ এই limits পরিবর্তন করলে সাথে সাথে সব ইউজারের জন্য প্রযোজ্য হবে। দৈনিক limit মধ্যরাতে (00:00) রিসেট হয়।
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                    How it works
                  </p>
                  <ul className="text-xs text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                    <li>When enabled, users can send SMS without their own API key</li>
                    <li>Users can choose between platform SMS or their own API in settings</li>
                    <li>All SMS sent through platform service will use these credentials</li>
                    <li>Monitor usage through SSL Wireless dashboard</li>
                    <li><strong>Free Trial ইউজাররা Platform SMS ব্যবহার করতে পারবে না</strong></li>
                    <li>প্রতিটি plan এর দৈনিক SMS limit আলাদা (Starter: 50, Pro: 200, Business: 1000)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Legal Tab */}
          <TabsContent value="legal">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Legal & Copyright
                </CardTitle>
                <CardDescription>
                  Legal contact information and copyright settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="legal_contact_email">Legal Contact Email</Label>
                  <Input
                    id="legal_contact_email"
                    type="email"
                    value={formData.legal_contact_email || ''}
                    onChange={(e) => handleChange('legal_contact_email', e.target.value)}
                    placeholder="legal@example.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    Used in Privacy Policy, Terms of Service, and GDPR pages
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="copyright_text">Copyright Text</Label>
                  <Input
                    id="copyright_text"
                    value={formData.copyright_text || ''}
                    onChange={(e) => handleChange('copyright_text', e.target.value)}
                    placeholder="© {year} Company Name. All rights reserved."
                  />
                  <p className="text-xs text-muted-foreground">
                    Use {'{year}'} to automatically insert the current year
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Features Tab - Global Business Module Toggles */}
          <TabsContent value="features">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ToggleLeft className="w-5 h-5 text-primary" />
                  Business Module Controls
                </CardTitle>
                <CardDescription>
                  Enable or disable business modules globally. When disabled, users cannot access these features.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Online Business Toggle */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-blue-500/10">
                      <ShoppingBag className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="font-medium">Online Business</h4>
                      <p className="text-sm text-muted-foreground">
                        Facebook/WhatsApp automation, online orders, product sync
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-medium ${formData.online_business_enabled ? 'text-green-600' : 'text-red-500'}`}>
                      {formData.online_business_enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <Switch
                      checked={formData.online_business_enabled ?? true}
                      onCheckedChange={(checked) => handleChange('online_business_enabled', checked)}
                    />
                  </div>
                </div>

                {/* Offline Shop Toggle */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-orange-500/10">
                      <Store className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                      <h4 className="font-medium">Offline Shop System</h4>
                      <p className="text-sm text-muted-foreground">
                        POS, inventory, sales, purchases, expenses, customers
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-medium ${formData.offline_shop_enabled ? 'text-green-600' : 'text-red-500'}`}>
                      {formData.offline_shop_enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <Switch
                      checked={formData.offline_shop_enabled ?? true}
                      onCheckedChange={(checked) => handleChange('offline_shop_enabled', checked)}
                    />
                  </div>
                </div>

                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    <strong>⚠️ Warning:</strong> Disabling a module will immediately block all users from accessing it.
                    Changes take effect in real-time across the entire platform.
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

export default AdminSiteSettings;
