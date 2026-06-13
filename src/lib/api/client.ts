const API_URL = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL || '');

const getToken = () => typeof window !== 'undefined' ? (localStorage.getItem('app_auth_token') || sessionStorage.getItem('app_auth_token')) : null;

const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers: { ...headers, ...options.headers } });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed with status ${res.status}`);
  }
  return res.json();
};

const handleApi = async (promise: Promise<any>) => {
  try {
    const data = await promise;
    if (Array.isArray(data)) {
      return { data: data.map(d => ({ ...d, id: d._id || d.id })), error: null };
    }
    if (data && data._id) data.id = data._id;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error : new Error('Unknown error') };
  }
};

export const userApi = {
  getProfile: () => handleApi(fetchApi('/api/auth/me')),
  updateProfile: (updates: any) => handleApi(fetchApi('/api/auth/me', { method: 'PUT', body: JSON.stringify(updates) })),
  getCredits: () => handleApi(fetchApi('/api/auth/me')),
  useCredits: (...args: any[]) => handleApi(Promise.resolve({ success: true })),
  getSubscription: (...args: any[]) => handleApi(Promise.resolve(null)),
  getCreditHistory: (...args: any[]) => handleApi(Promise.resolve([])),
  deleteAccount: (...args: any[]) => handleApi(Promise.resolve({ message: 'Deleted' })),
  getTransactions: (...args: any[]) => handleApi(fetchApi('/api/transactions')),
  getInvoices: (...args: any[]) => handleApi(fetchApi('/api/invoices')),
  exportData: (...args: any[]) => handleApi(Promise.resolve({ exportedAt: new Date().toISOString() }))
};

export const projectsApi = {
  list: () => handleApi(fetchApi('/api/projects')),
  get: async (id: string) => {
    const res = await handleApi(fetchApi('/api/projects'));
    if (res.data) {
      const project = res.data.find((p: any) => p.id === id);
      return { data: project || null, error: null };
    }
    return res;
  },
  create: (project: any) => handleApi(fetchApi('/api/projects', { method: 'POST', body: JSON.stringify(project) })),
  update: (id: string, updates: any) => handleApi(fetchApi(`/api/projects/${id}`, { method: 'PUT', body: JSON.stringify(updates) })),
  delete: (id: string) => handleApi(fetchApi(`/api/projects/${id}`, { method: 'DELETE' })),
  getBuilds: (projectId?: string) => handleApi(fetchApi('/api/builds'))
};

export const buildApi = {
  startBuild: (config: any) => handleApi(fetchApi('/api/builds', { method: 'POST', body: JSON.stringify(config) })),
  startAndroidBuild: (config: any) => buildApi.startBuild({ ...config, platform: 'android' }),
  startIosBuild: (config: any) => buildApi.startBuild({ ...config, platform: 'ios' }),
  getBuildStatus: (id: string) => handleApi(fetchApi(`/api/builds/${id}/status`)),
  listBuilds: (...args: any[]) => handleApi(fetchApi('/api/builds'))
};

export const automationApi = {
  list: () => handleApi(Promise.resolve([])),
  toggle: (...args: any[]) => handleApi(Promise.resolve({})),
  getLogs: () => handleApi(Promise.resolve([])),
  create: (...args: any[]) => handleApi(Promise.resolve({})),
  delete: (...args: any[]) => handleApi(Promise.resolve({})),
  execute: (...args: any[]) => handleApi(Promise.resolve({})),
  updateConfig: (...args: any[]) => handleApi(Promise.resolve({}))
};

export const templatesApi = {
  list: () => handleApi(Promise.resolve([])),
  create: (...args: any[]) => handleApi(Promise.resolve({})),
  delete: (...args: any[]) => handleApi(Promise.resolve({}))
};

export const plansApi = {
  list: () => handleApi(fetchApi('/api/plans')),
  get: async (id: string) => {
    const res = await handleApi(fetchApi('/api/plans'));
    return { data: res.data?.find((p: any) => p.id === id) || null, error: null };
  }
};

export const creditPacksApi = {
  list: () => handleApi(fetchApi('/api/credit-packs')),
  get: async (id: string) => {
    const res = await handleApi(fetchApi('/api/credit-packs'));
    return { data: res.data?.find((p: any) => p.id === id) || null, error: null };
  }
};

export const chatApi = {
  getHistory: (...args: any[]) => handleApi(Promise.resolve([])),
  saveMessage: (...args: any[]) => handleApi(Promise.resolve({})),
  clearHistory: (...args: any[]) => handleApi(Promise.resolve({}))
};

export const bankTransferApi = {
  create: (...args: any[]) => handleApi(Promise.resolve({})),
  getStatus: (...args: any[]) => handleApi(Promise.resolve({})),
  listAll: (...args: any[]) => handleApi(Promise.resolve([])),
  approve: (...args: any[]) => handleApi(Promise.resolve({})),
  reject: (...args: any[]) => handleApi(Promise.resolve({}))
};

export const adminApi = {
  getStats: () => handleApi(fetchApi('/api/admin/stats')),
  getUsers: () => handleApi(fetchApi('/api/admin/users')),
  updateUserRole: (userId: string, role: string | null) => handleApi(fetchApi(`/api/admin/users/${userId}/role`, { method: 'PUT', body: JSON.stringify({ role }) })),
  getTransactions: () => handleApi(fetchApi('/api/transactions')),
  getBuilds: () => handleApi(fetchApi('/api/builds')),
  getPlans: () => handleApi(fetchApi('/api/plans')),
  createPlan: (plan: any) => apiClient.from('subscription_plans').insert(plan) as unknown as Promise<{data: any, error: any}>,
  updatePlan: (id: string, plan: any) => apiClient.from('subscription_plans').update(plan).eq('id', id) as unknown as Promise<{data: any, error: any}>,
  getCreditPacks: () => handleApi(fetchApi('/api/credit-packs')),
  createCreditPack: (pack: any) => apiClient.from('credit_packs').insert(pack) as unknown as Promise<{data: any, error: any}>,
  updateCreditPack: (id: string, pack: any) => apiClient.from('credit_packs').update(pack).eq('id', id) as unknown as Promise<{data: any, error: any}>,
  deleteCreditPack: (id: string) => apiClient.from('credit_packs').delete().eq('id', id) as unknown as Promise<{data: any, error: any}>,
  getSettings: () => handleApi(fetchApi('/api/settings')),
  updateSetting: (key: string, value: string | number | boolean | Record<string, unknown>) => handleApi(fetchApi('/api/settings', { method: 'PUT', body: JSON.stringify({ key, value }) })),
  upsertSetting: (key: string, value: string | number | boolean | Record<string, unknown>, category: string) => handleApi(fetchApi('/api/settings', { method: 'POST', body: JSON.stringify({ key, value, category }) })),
  getEmailTemplates: () => handleApi(fetchApi('/api/email-templates')),
  updateEmailTemplate: (...args: any[]) => handleApi(Promise.resolve({})),
  getPlugins: () => handleApi(fetchApi('/api/plugins')),
  updatePlugin: (...args: any[]) => handleApi(Promise.resolve({})),
  getApiConfigs: () => handleApi(Promise.resolve([])),
  createApiConfig: (...args: any[]) => handleApi(Promise.resolve({})),
  updateApiConfig: (...args: any[]) => handleApi(Promise.resolve({})),
  deleteApiConfig: (...args: any[]) => handleApi(Promise.resolve({})),
  getInvoices: () => handleApi(fetchApi('/api/invoices')),
  createInvoice: (...args: any[]) => handleApi(Promise.resolve({})),
  updateInvoice: (...args: any[]) => handleApi(Promise.resolve({})),
  getSettingsAuditLog: () => handleApi(Promise.resolve([]))
};

class QueryBuilder {
  private collection: string;
  private query: any = {};
  private action: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select';
  private payload: any = null;

  constructor(collection: string) {
    this.collection = collection;
  }

  select(fields = '*') {
    this.action = 'select';
    this.query.select = fields;
    return this;
  }

  insert(data: any) {
    this.action = 'insert';
    this.payload = data;
    return this;
  }

  update(data: any) {
    this.action = 'update';
    this.payload = data;
    return this;
  }

  delete() {
    this.action = 'delete';
    return this;
  }

  upsert(data: any) {
    this.action = 'upsert';
    this.payload = data;
    return this;
  }

  eq(field: string, value: any) {
    this.query[field] = value;
    return this;
  }

  neq(field: string, value: any) {
    this.query[`${field}_neq`] = value;
    return this;
  }

  in(field: string, values: any[]) {
    this.query[`${field}_in`] = values.join(',');
    return this;
  }

  limit(count: number) {
    this.query.limit = count;
    return this;
  }

  single() {
    this.query.single = true;
    return this;
  }

  maybeSingle() {
    this.query.single = true;
    return this;
  }

  order(field: string, options?: { ascending?: boolean }) {
    this.query.order = field;
    if (options?.ascending !== undefined) {
      this.query.ascending = options.ascending;
    }
    return this;
  }

  async then(resolve: (value: any) => void, reject: (reason?: any) => void) {
    try {
      const url = new URL(`/api/collections/${this.collection}`, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
      if (this.action === 'select' || this.action === 'delete') {
        Object.keys(this.query).forEach(key => url.searchParams.append(key, String(this.query[key])));
      }

      const methodMap = {
        select: 'GET',
        insert: 'POST',
        update: 'PUT',
        delete: 'DELETE',
        upsert: 'PUT'
      };

      const options: RequestInit = {
        method: methodMap[this.action],
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken() || ''}`
        }
      };

      if (this.payload) {
        options.body = JSON.stringify({ payload: this.payload, query: this.query });
      }

      const res = await fetch(url.toString(), options);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'API Error');
      }

      resolve({ data, error: null });
    } catch (error: any) {
      resolve({ data: null, error });
    }
  }
}

export const apiClient = {
  from: (collection: string) => new QueryBuilder(collection),
  auth: {
    getSession: async () => {
      const token = getToken();
      if (!token) return { data: { session: null }, error: null };
      try {
        const res = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const user = await res.json();
          return { data: { session: { user, access_token: token } }, error: null };
        }
        return { data: { session: null }, error: null };
      } catch {
        return { data: { session: null }, error: null };
      }
    },
    getUser: async () => {
      const token = getToken();
      if (!token) return { data: { user: null }, error: null };
      try {
        const res = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const user = await res.json();
          return { data: { user }, error: null };
        }
        return { data: { user: null }, error: null };
      } catch {
        return { data: { user: null }, error: null };
      }
    }
  },
  functions: {
    invoke: async (functionName: string, options: any = {}) => {
      try {
        const res = await fetch(`/api/functions/${functionName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken() || ''}`
          },
          body: JSON.stringify(options.body || {})
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Function error');
        return { data, error: null };
      } catch (error) {
        return { data: null, error };
      }
    }
  },
  storage: {
    listBuckets: async () => {
      return { data: [], error: null };
    },
    from: (bucket: string) => ({
      createSignedUrl: async (...args: any[]) => ({ data: { signedUrl: 'mock-url' }, error: null })
    })
  }
};

export const stripeApi = {
  createCreditsCheckout: (priceId: string, returnUrl: string, cancelUrl?: string) => handleApi(fetchApi('/api/payments/checkout', {
    method: 'POST',
    body: JSON.stringify({ priceId, returnUrl, cancelUrl })
  })),
  createSubscriptionCheckout: (priceId: string, billingCycle: string, returnUrl: string, cancelUrl?: string) => handleApi(Promise.resolve({})),
  createPortalSession: (returnUrl: string) => handleApi(Promise.resolve({}))
};

export const aiApi = {
  analyzeWebsite: (url: string) => handleApi(fetchApi('/api/analyze-website', {
    method: 'POST',
    body: JSON.stringify({ url })
  }))
};

export const proxyApi = {
  fetchPreview: (url: string) => handleApi(Promise.resolve({}))
};

export const storageApi = {
  upload: (bucket: string, path: string, file: any) => handleApi(Promise.resolve({ url: `/uploads/${bucket}/${path}` })),
  getPublicUrl: (bucket: string, path: string) => `/uploads/${bucket}/${path}`
};

