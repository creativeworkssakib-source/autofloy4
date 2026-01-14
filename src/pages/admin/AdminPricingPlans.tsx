import { useState, useEffect } from 'react';
import { Edit, Trash2, Loader2, Search, DollarSign, Plus, GripVertical, Check, Store } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  PricingPlan, 
  fetchPricingPlans, 
  createPricingPlan, 
  updatePricingPlan, 
  deletePricingPlan 
} from '@/services/adminCmsService';

interface ExtendedPricingPlan extends PricingPlan {
  max_shops?: number;
}

const AdminPricingPlans = () => {
  const { toast } = useToast();
  const [plans, setPlans] = useState<ExtendedPricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<ExtendedPricingPlan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<ExtendedPricingPlan>>({});
  const [featuresText, setFeaturesText] = useState('');

  const loadPlans = async () => {
    try {
      setLoading(true);
      const result = await fetchPricingPlans();
      setPlans(result.data as ExtendedPricingPlan[]);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleCreate = () => {
    setEditingPlan(null);
    setFormData({ 
      is_active: true, 
      is_popular: false, 
      currency: 'BDT',
      cta_variant: 'default',
      display_order: plans.length + 1,
      max_shops: 1,
    });
    setFeaturesText('');
    setIsModalOpen(true);
  };

  const handleEdit = (plan: ExtendedPricingPlan) => {
    setEditingPlan(plan);
    setFormData(plan);
    setFeaturesText(Array.isArray(plan.features) ? plan.features.join('\n') : '');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;
    try {
      await deletePricingPlan(id);
      toast({ title: 'Plan deleted' });
      loadPlans();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleSave = async () => {
    if (!formData.id || !formData.name) {
      toast({ title: 'Error', description: 'ID and name are required', variant: 'destructive' });
      return;
    }

    try {
      setIsSaving(true);
      const features = featuresText.split('\n').filter(f => f.trim());
      const dataToSave = { ...formData, features };

      if (editingPlan) {
        await updatePricingPlan(editingPlan.id, dataToSave);
        toast({ title: 'Plan updated' });
      } else {
        await createPricingPlan(dataToSave);
        toast({ title: 'Plan created' });
      }
      setIsModalOpen(false);
      loadPlans();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    if (price === 0) return 'Free';
    return `${currency === 'BDT' ? '৳' : '$'}${price.toLocaleString()}`;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <DollarSign className="w-6 h-6" />
              Pricing Plans
            </h1>
            <p className="text-muted-foreground">Manage subscription plans and pricing</p>
          </div>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            New Plan
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card key={plan.id} className={`relative ${!plan.is_active ? 'opacity-60' : ''}`}>
                {plan.is_popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary">Popular</Badge>
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {plan.name}
                        {!plan.is_active && <Badge variant="secondary">Inactive</Badge>}
                      </CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                    </div>
                    <Badge variant="outline" className={plan.badge_color}>
                      {plan.badge}
                    </Badge>
                  </div>
                  <div className="pt-4">
                    <span className="text-3xl font-bold">
                      {formatPrice(plan.price_numeric, plan.currency)}
                    </span>
                    {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                    {plan.original_price_numeric && (
                      <div className="text-sm text-muted-foreground line-through">
                        {formatPrice(plan.original_price_numeric, plan.currency)}
                        {plan.discount_percent && ` (-${plan.discount_percent}%)`}
                      </div>
                    )}
                    {/* Show max shops */}
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <Store className="w-3 h-3" />
                      <span>
                        {plan.max_shops === -1 ? 'Unlimited shops' : `Max ${plan.max_shops || 1} shop(s)`}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm mb-6">
                    {Array.isArray(plan.features) && plan.features.slice(0, 5).map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-success mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                    {Array.isArray(plan.features) && plan.features.length > 5 && (
                      <li className="text-muted-foreground">
                        +{plan.features.length - 5} more features
                      </li>
                    )}
                  </ul>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => handleEdit(plan)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(plan.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit/Create Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPlan ? 'Edit Plan' : 'Create New Plan'}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Plan ID *</Label>
                  <Input
                    value={formData.id || ''}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    placeholder="starter"
                    disabled={!!editingPlan}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Starter"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Price</Label>
                  <Input
                    type="number"
                    value={formData.price_numeric || 0}
                    onChange={(e) => setFormData({ ...formData, price_numeric: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <select
                    value={formData.currency || 'BDT'}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="BDT">BDT (৳)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Period</Label>
                  <Input
                    value={formData.period || ''}
                    onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                    placeholder="/month"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Original Price (for discount)</Label>
                  <Input
                    type="number"
                    value={formData.original_price_numeric || ''}
                    onChange={(e) => { const val = e.target.value; setFormData({ ...formData, original_price_numeric: val === "" ? undefined : parseFloat(val) || undefined }); }}
                    placeholder="1999"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Discount %</Label>
                  <Input
                    type="number"
                    value={formData.discount_percent || ''}
                    onChange={(e) => { const val = e.target.value; setFormData({ ...formData, discount_percent: val === "" ? undefined : parseInt(val) || undefined }); }}
                    placeholder="25"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Perfect for small businesses"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Badge Text</Label>
                  <Input
                    value={formData.badge || ''}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    placeholder="POPULAR"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Badge Color Class</Label>
                  <Input
                    value={formData.badge_color || ''}
                    onChange={(e) => setFormData({ ...formData, badge_color: e.target.value })}
                    placeholder="bg-primary/10 text-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>CTA Button Text</Label>
                  <Input
                    value={formData.cta_text || ''}
                    onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                    placeholder="Choose Plan"
                  />
                </div>
                <div className="space-y-2">
                  <Label>CTA Variant</Label>
                  <select
                    value={formData.cta_variant || 'default'}
                    onChange={(e) => setFormData({ ...formData, cta_variant: e.target.value })}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="default">Default</option>
                    <option value="gradient">Gradient</option>
                    <option value="success">Success</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Features (one per line)</Label>
                <Textarea
                  value={featuresText}
                  onChange={(e) => setFeaturesText(e.target.value)}
                  placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                  rows={8}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Display Order</Label>
                  <Input
                    type="number"
                    value={formData.display_order || 0}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Shops</Label>
                  <Input
                    type="number"
                    value={formData.max_shops ?? 1}
                    onChange={(e) => setFormData({ ...formData, max_shops: parseInt(e.target.value) })}
                    placeholder="1 = 1 shop, -1 = unlimited"
                  />
                  <p className="text-xs text-muted-foreground">-1 for unlimited shops</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_active !== false}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label>Active</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_popular || false}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_popular: checked })}
                  />
                  <Label>Popular</Label>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingPlan ? 'Update Plan' : 'Create Plan'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminPricingPlans;
