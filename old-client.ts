const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const getToken = () => localStorage.getItem('app_auth_token') || sessionStorage.getItem('app_auth_token');

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
  useCredits: () => handleApi(Promise.resolve({ success: true })),
  getSubscription: () => handleApi(Promise.resolve(null)),
  getCreditHistory: () => handleApi(Promise.resolve([])),
  deleteAccount: () => handleApi(Promise.resolve({ message: 'Deleted' })),
  getTransactions: () => handleApi(fetchApi('/api/transactions')),
  getInvoices: () => handleApi(fetchApi('/api/invoices')),
  exportData: () => handleApi(Promise.resolve({ exportedAt: new Date().toISOString() }))
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
  getBuilds: () => handleApi(fetchApi('/api/builds'))
};

export const buildApi = {
  startBuild: (config: any) => handleApi(fetchApi('/api/builds', { method: 'POST', body: JSON.stringify(config) })),
  startAndroidBuild: (config: any) => buildApi.startBuild({ ...config, platform: 'android' }),
  startIosBuild: (config: any) => buildApi.startBuild({ ...config, platform: 'ios' }),
  getBuildStatus: (id: string) => handleApi(fetchApi(`/api/builds/${id}/status`)),
  listBuilds: () => handleApi(fetchApi('/api/builds'))
};

export const automationApi = {
  list: () => handleApi(Promise.resolve([])),
  toggle: () => handleApi(Promise.resolve({})),
  getLogs: () => handleApi(Promise.resolve([])),
  create: () => handleApi(Promise.resolve({})),
  delete: () => handleApi(Promise.resolve({})),
  execute: () => handleApi(Promise.resolve({})),
  updateConfig: () => handleApi(Promise.resolve({}))
};

export const templatesApi = {
  list: () => handleApi(Promise.resolve([])),
  create: () => handleApi(Promise.resolve({})),
  delete: () => handleApi(Promise.resolve({}))
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
  getHistory: () => handleApi(Promise.resolve([])),
  saveMessage: () => handleApi(Promise.resolve({})),
  clearHistory: () => handleApi(Promise.resolve({}))
};

export const bankTransferApi = {
  create: () => handleApi(Promise.resolve({})),
  getStatus: () => handleApi(Promise.resolve({})),
  listAll: () => handleApi(Promise.resolve([])),
  approve: () => handleApi(Promise.resolve({})),
  reject: () => handleApi(Promise.resolve({}))
};

export const adminApi = {
  getStats: () => handleApi(fetchApi('/api/admin/stats')),
  getUsers: () => handleApi(fetchApi('/api/admin/users')),
  updateUserRole: () => handleApi(Promise.resolve({})),
  getTransactions: () => handleApi(fetchApi('/api/transactions')),
  getBuilds: () => handleApi(fetchApi('/api/builds')),
  getPlans: () => handleApi(fetchApi('/api/plans')),
  createPlan: () => handleApi(Promise.resolve({})),
  updatePlan: () => handleApi(Promise.resolve({})),
  getCreditPacks: () => handleApi(fetchApi('/api/credit-packs')),
  createCreditPack: () => handleApi(Promise.resolve({})),
  updateCreditPack: () => handleApi(Promise.resolve({})),
  deleteCreditPack: () => handleApi(Promise.resolve({})),
  getSettings: () => handleApi(fetchApi('/api/settings')),
  updateSetting: () => handleApi(Promise.resolve({})),
  upsertSetting: (key: string, value: any, category: string) => handleApi(fetchApi('/api/settings', { method: 'POST', body: JSON.stringify({ key, value, category }) })),
  getEmailTemplates: () => handleApi(fetchApi('/api/email-templates')),
  updateEmailTemplate: () => handleApi(Promise.resolve({})),
  getPlugins: () => handleApi(fetchApi('/api/plugins')),
  updatePlugin: () => handleApi(Promise.resolve({})),
  getApiConfigs: () => handleApi(Promise.resolve([])),
  createApiConfig: () => handleApi(Promise.resolve({})),
  updateApiConfig: () => handleApi(Promise.resolve({})),
  deleteApiConfig: () => handleApi(Promise.resolve({})),
  getInvoices: () => handleApi(fetchApi('/api/invoices')),
  createInvoice: () => handleApi(Promise.resolve({})),
  updateInvoice: () => handleApi(Promise.resolve({})),
  getSettingsAuditLog: () => handleApi(Promise.resolve([]))
};
