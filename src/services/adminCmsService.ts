// Admin CMS Service - Handles all admin CRUD operations
const SUPABASE_URL = "https://xvwsqxfydvagfhfkwxdm.supabase.co";

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('autofloy_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// Generic CRUD functions
export async function fetchResource<T>(
  resource: string,
  options?: { page?: number; limit?: number; search?: string; id?: string }
): Promise<{ data: T | T[]; pagination?: { page: number; limit: number; total: number } }> {
  const params = new URLSearchParams();
  params.set('resource', resource);
  if (options?.id) params.set('id', options.id);
  if (options?.page) params.set('page', String(options.page));
  if (options?.limit) params.set('limit', String(options.limit));
  if (options?.search) params.set('search', options.search);

  const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-cms?${params}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to fetch resource');
  }

  return response.json();
}

export async function createResource<T>(resource: string, data: Partial<T>): Promise<T> {
  const params = new URLSearchParams();
  params.set('resource', resource);

  const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-cms?${params}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to create resource');
  }

  const result = await response.json();
  return result.data;
}

export async function updateResource<T>(resource: string, id: string, data: Partial<T>): Promise<T> {
  const params = new URLSearchParams();
  params.set('resource', resource);
  params.set('id', id);

  const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-cms?${params}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to update resource');
  }

  const result = await response.json();
  return result.data;
}

export async function updateSingletonResource<T>(resource: string, data: Partial<T>): Promise<T> {
  const params = new URLSearchParams();
  params.set('resource', resource);

  const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-cms?${params}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to update resource');
  }

  const result = await response.json();
  return result.data;
}

export async function deleteResource(resource: string, id: string): Promise<void> {
  const params = new URLSearchParams();
  params.set('resource', resource);
  params.set('id', id);

  const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-cms?${params}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to delete resource');
  }
}

// ============ TYPE DEFINITIONS ============

export interface CMSPage {
  id: string;
  slug: string;
  title: string;
  title_bn?: string;
  content?: string;
  content_bn?: string;
  meta_title?: string;
  meta_description?: string;
  og_image_url?: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  title_bn?: string;
  excerpt?: string;
  content?: string;
  content_bn?: string;
  featured_image_url?: string;
  category?: string;
  tags?: string[];
  author_name?: string;
  read_time_minutes: number;
  meta_title?: string;
  meta_description?: string;
  is_published: boolean;
  is_featured: boolean;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  name_bn?: string;
  badge?: string;
  badge_color?: string;
  price_numeric: number;
  currency: string;
  period?: string;
  description?: string;
  description_bn?: string;
  features: string[];
  cta_text?: string;
  cta_variant?: string;
  is_popular: boolean;
  is_active: boolean;
  original_price_numeric?: number;
  discount_percent?: number;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface AppearanceSettings {
  id: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  success_color: string;
  warning_color: string;
  destructive_color: string;
  heading_font: string;
  body_font: string;
  hero_title?: string;
  hero_title_bn?: string;
  hero_subtitle?: string;
  hero_image_url?: string;
  custom_css?: string;
  created_at: string;
  updated_at: string;
}

export interface SEOSettings {
  id: string;
  default_title?: string;
  default_description?: string;
  default_keywords?: string;
  og_image_url?: string;
  twitter_card_type: string;
  google_analytics_id?: string;
  google_tag_manager_id?: string;
  facebook_pixel_id?: string;
  robots_txt_content?: string;
  sitemap_enabled: boolean;
  google_verification_code?: string;
  bing_verification_code?: string;
  custom_head_scripts?: string;
  created_at: string;
  updated_at: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  subject_bn?: string;
  html_content: string;
  text_content?: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============ SPECIFIC RESOURCE FUNCTIONS ============

// CMS Pages
export const fetchCMSPages = (options?: { page?: number; limit?: number; search?: string }) =>
  fetchResource<CMSPage[]>('cms_pages', options);

export const fetchCMSPage = (id: string) =>
  fetchResource<CMSPage>('cms_pages', { id });

export const createCMSPage = (data: Partial<CMSPage>) =>
  createResource<CMSPage>('cms_pages', data);

export const updateCMSPage = (id: string, data: Partial<CMSPage>) =>
  updateResource<CMSPage>('cms_pages', id, data);

export const deleteCMSPage = (id: string) =>
  deleteResource('cms_pages', id);

// Blog Posts
export const fetchBlogPosts = (options?: { page?: number; limit?: number; search?: string }) =>
  fetchResource<BlogPost[]>('blog_posts', options);

export const fetchBlogPost = (id: string) =>
  fetchResource<BlogPost>('blog_posts', { id });

export const createBlogPost = (data: Partial<BlogPost>) =>
  createResource<BlogPost>('blog_posts', data);

export const updateBlogPost = (id: string, data: Partial<BlogPost>) =>
  updateResource<BlogPost>('blog_posts', id, data);

export const deleteBlogPost = (id: string) =>
  deleteResource('blog_posts', id);

// Pricing Plans
export const fetchPricingPlans = (options?: { page?: number; limit?: number; search?: string }) =>
  fetchResource<PricingPlan[]>('pricing_plans', options);

export const fetchPricingPlan = (id: string) =>
  fetchResource<PricingPlan>('pricing_plans', { id });

export const createPricingPlan = (data: Partial<PricingPlan>) =>
  createResource<PricingPlan>('pricing_plans', data);

export const updatePricingPlan = (id: string, data: Partial<PricingPlan>) =>
  updateResource<PricingPlan>('pricing_plans', id, data);

export const deletePricingPlan = (id: string) =>
  deleteResource('pricing_plans', id);

// Appearance Settings (singleton)
export const fetchAppearanceSettings = () =>
  fetchResource<AppearanceSettings>('appearance_settings');

export const updateAppearanceSettings = (data: Partial<AppearanceSettings>) =>
  updateSingletonResource<AppearanceSettings>('appearance_settings', data);

// SEO Settings (singleton)
export const fetchSEOSettings = () =>
  fetchResource<SEOSettings>('seo_settings');

export const updateSEOSettings = (data: Partial<SEOSettings>) =>
  updateSingletonResource<SEOSettings>('seo_settings', data);

// Email Templates
export const fetchEmailTemplates = (options?: { page?: number; limit?: number; search?: string }) =>
  fetchResource<EmailTemplate[]>('email_templates', options);

export const fetchEmailTemplate = (id: string) =>
  fetchResource<EmailTemplate>('email_templates', { id });

export const createEmailTemplate = (data: Partial<EmailTemplate>) =>
  createResource<EmailTemplate>('email_templates', data);

export const updateEmailTemplate = (id: string, data: Partial<EmailTemplate>) =>
  updateResource<EmailTemplate>('email_templates', id, data);

export const deleteEmailTemplate = (id: string) =>
  deleteResource('email_templates', id);

// Shop Products (admin can see all users' products)
export const fetchAllShopProducts = (options?: { page?: number; limit?: number; search?: string }) =>
  fetchResource<any[]>('shop_products', options);

export const updateShopProduct = (id: string, data: any) =>
  updateResource<any>('shop_products', id, data);
