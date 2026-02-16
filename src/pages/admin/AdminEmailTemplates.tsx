import { useState, useEffect } from 'react';
import { Edit, Loader2, Search, Mail, Eye, Code, Plus, Trash2 } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  EmailTemplate, 
  fetchEmailTemplates, 
  createEmailTemplate, 
  updateEmailTemplate, 
  deleteEmailTemplate 
} from '@/services/adminCmsService';

const AdminEmailTemplates = () => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<EmailTemplate>>({});
  const [variablesText, setVariablesText] = useState('');

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const result = await fetchEmailTemplates({ search });
      setTemplates(result.data as EmailTemplate[]);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, [search]);

  const handleCreate = () => {
    setEditingTemplate(null);
    setFormData({ is_active: true });
    setVariablesText('');
    setIsModalOpen(true);
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormData(template);
    setVariablesText(Array.isArray(template.variables) ? template.variables.join(', ') : '');
    setIsModalOpen(true);
  };

  const handlePreview = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setIsPreviewOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      await deleteEmailTemplate(id);
      toast({ title: 'Template deleted' });
      loadTemplates();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleSave = async () => {
    if (!formData.id || !formData.name || !formData.subject || !formData.html_content) {
      toast({ title: 'Error', description: 'ID, name, subject, and HTML content are required', variant: 'destructive' });
      return;
    }

    try {
      setIsSaving(true);
      const variables = variablesText.split(',').map(v => v.trim()).filter(Boolean);
      const dataToSave = { ...formData, variables };

      if (editingTemplate) {
        await updateEmailTemplate(editingTemplate.id, dataToSave);
        toast({ title: 'Template updated' });
      } else {
        await createEmailTemplate(dataToSave);
        toast({ title: 'Template created' });
      }
      setIsModalOpen(false);
      loadTemplates();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const getPreviewHtml = (html: string, variables: string[]) => {
    let preview = html;
    variables.forEach(v => {
      preview = preview.replace(new RegExp(`{${v}}`, 'g'), `<strong>[${v}]</strong>`);
    });
    return preview;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Mail className="w-6 h-6" />
              Email Templates
            </h1>
            <p className="text-muted-foreground">Customize email notifications and messages</p>
          </div>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            New Template
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No templates found.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Variables</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{template.name}</p>
                          <p className="text-xs text-muted-foreground">{template.id}</p>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{template.subject}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {Array.isArray(template.variables) && template.variables.slice(0, 3).map((v) => (
                            <Badge key={v} variant="outline" className="text-xs">{`{${v}}`}</Badge>
                          ))}
                          {Array.isArray(template.variables) && template.variables.length > 3 && (
                            <Badge variant="secondary" className="text-xs">+{template.variables.length - 3}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={template.is_active ? 'default' : 'secondary'}>
                          {template.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handlePreview(template)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(template)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(template.id)}>
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

        {/* Edit/Create Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create New Template'}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Template ID *</Label>
                  <Input
                    value={formData.id || ''}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    placeholder="welcome_email"
                    disabled={!!editingTemplate}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Welcome Email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Subject *</Label>
                <Input
                  value={formData.subject || ''}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Welcome to {company_name}!"
                />
              </div>

              <div className="space-y-2">
                <Label>Subject (Bengali)</Label>
                <Input
                  value={formData.subject_bn || ''}
                  onChange={(e) => setFormData({ ...formData, subject_bn: e.target.value })}
                  placeholder="বাংলা বিষয়"
                />
              </div>

              <div className="space-y-2">
                <Label>Variables (comma separated)</Label>
                <Input
                  value={variablesText}
                  onChange={(e) => setVariablesText(e.target.value)}
                  placeholder="company_name, user_name, link"
                />
                <p className="text-xs text-muted-foreground">
                  Use {`{variable_name}`} in subject and content to insert dynamic values
                </p>
              </div>

              <div className="space-y-2">
                <Label>HTML Content *</Label>
                <Textarea
                  value={formData.html_content || ''}
                  onChange={(e) => setFormData({ ...formData, html_content: e.target.value })}
                  placeholder="<h1>Welcome!</h1><p>Hi {user_name}...</p>"
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label>Plain Text Content (optional)</Label>
                <Textarea
                  value={formData.text_content || ''}
                  onChange={(e) => setFormData({ ...formData, text_content: e.target.value })}
                  placeholder="Welcome! Hi {user_name}..."
                  rows={4}
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active !== false}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>Active</Label>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingTemplate ? 'Update Template' : 'Create Template'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Preview Modal */}
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Email Preview: {editingTemplate?.name}</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <div className="p-4 border rounded-lg bg-white">
                <p className="text-sm font-medium text-gray-600 mb-2">
                  Subject: {editingTemplate?.subject}
                </p>
                <hr className="my-3" />
                <iframe
                  sandbox="allow-same-origin"
                  className="w-full h-96 border rounded"
                  title="Email Preview"
                  srcDoc={getPreviewHtml(
                    editingTemplate?.html_content || '', 
                    editingTemplate?.variables || []
                  )}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminEmailTemplates;
