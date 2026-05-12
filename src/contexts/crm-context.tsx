'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import type {
  Lead,
  Client,
  Appointment,
  Service,
  Form,
  LeadStatus,
  User,
  Location,
  Webhook,
  ApiKey,
  SubscriptionPlan,
} from '@/types';

// ─── Context type ─────────────────────────────────────────────────────────────

interface CRMContextValue {
  leads: Lead[];
  clients: Client[];
  appointments: Appointment[];
  services: Service[];
  forms: Form[];
  leadStatuses: LeadStatus[];
  users: User[];
  locations: Location[];
  webhooks: Webhook[];
  apiKeys: ApiKey[];

  addLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Lead>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;

  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Client>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;

  addAppointment: (appt: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Appointment>;
  updateAppointment: (id: string, updates: Partial<Appointment>) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;

  addService: (service: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Service>;
  updateService: (id: string, updates: Partial<Service>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;

  addForm: (form: Omit<Form, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Form>;
  updateForm: (id: string, updates: Partial<Form>) => Promise<void>;
  deleteForm: (id: string) => Promise<void>;

  addLeadStatus: (status: Omit<LeadStatus, 'id' | 'createdAt' | 'updatedAt'>) => Promise<LeadStatus>;
  updateLeadStatus: (id: string, updates: Partial<LeadStatus>) => Promise<void>;
  deleteLeadStatus: (id: string) => Promise<void>;

  addUser: (user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => Promise<User>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;

  addLocation: (location: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Location>;
  updateLocation: (id: string, updates: Partial<Location>) => Promise<void>;
  deleteLocation: (id: string) => Promise<void>;

  addWebhook: (webhook: Omit<Webhook, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Webhook>;
  updateWebhook: (id: string, updates: Partial<Webhook>) => Promise<void>;
  deleteWebhook: (id: string) => Promise<void>;

  addApiKey: (key: Omit<ApiKey, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ApiKey>;
  updateApiKey: (id: string, updates: Partial<ApiKey>) => Promise<void>;
  deleteApiKey: (id: string) => Promise<void>;

  subscriptionPlans: SubscriptionPlan[];
  addSubscriptionPlan: (plan: Omit<SubscriptionPlan, 'id' | 'createdAt' | 'updatedAt'>) => Promise<SubscriptionPlan>;
  updateSubscriptionPlan: (id: string, updates: Partial<SubscriptionPlan>) => Promise<void>;
  deleteSubscriptionPlan: (id: string) => Promise<void>;

  /** Force a full reload from server */
  resetToMockData: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const CRMContext = createContext<CRMContextValue | null>(null);

// ─── API helpers ──────────────────────────────────────────────────────────────

/** Unwrap { success, data } envelope if present, otherwise return as-is */
function unwrap<T>(json: unknown): T {
  if (
    json !== null &&
    typeof json === 'object' &&
    'data' in (json as object) &&
    'success' in (json as object)
  ) {
    return (json as { data: T }).data;
  }
  return json as T;
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API error ${res.status}: ${text}`);
  }
  const json: unknown = await res.json();
  return unwrap<T>(json);
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function CRMProvider({ children }: { children: React.ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [forms, setForms] = useState<Form[]>([]);
  const [leadStatuses, setLeadStatuses] = useState<LeadStatus[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);

  const fetchAll = useCallback(async () => {
    try {
      const [
        leadsRes, clientsRes, apptsRes, servicesRes, formsRes,
        statusesRes, usersRes, locsRes, webhooksRes, apiKeysRes, plansRes,
      ] = await Promise.allSettled([
        fetch('/api/v1/leads'),
        fetch('/api/v1/clients'),
        fetch('/api/v1/appointments'),
        fetch('/api/v1/services'),
        fetch('/api/v1/forms'),
        fetch('/api/v1/lead-statuses'),
        fetch('/api/v1/users'),
        fetch('/api/v1/locations'),
        fetch('/api/v1/webhooks'),
        fetch('/api/v1/api-keys'),
        fetch('/api/v1/subscription-plans'),
      ]);

      async function safeJson<T>(result: PromiseSettledResult<Response>): Promise<T[]> {
        if (result.status === 'rejected') return [];
        const res = result.value;
        if (!res.ok) return [];
        try {
          const json: unknown = await res.json();
          return unwrap<T[]>(json);
        } catch { return []; }
      }

      const [
        leadsData, clientsData, apptsData, servicesData, formsData,
        statusesData, usersData, locsData, webhooksData, apiKeysData, plansData,
      ] = await Promise.all([
        safeJson<Lead>(leadsRes),
        safeJson<Client>(clientsRes),
        safeJson<Appointment>(apptsRes),
        safeJson<Service>(servicesRes),
        safeJson<Form>(formsRes),
        safeJson<LeadStatus>(statusesRes),
        safeJson<User>(usersRes),
        safeJson<Location>(locsRes),
        safeJson<Webhook>(webhooksRes),
        safeJson<ApiKey>(apiKeysRes),
        safeJson<SubscriptionPlan>(plansRes),
      ]);

      setLeads(leadsData);
      setClients(clientsData);
      setAppointments(apptsData);
      setServices(servicesData);
      setForms(formsData);
      setLeadStatuses(statusesData);
      setUsers(usersData);
      setLocations(locsData);
      setWebhooks(webhooksData);
      setApiKeys(apiKeysData);
      setSubscriptionPlans(plansData);
    } catch {
      // best-effort: leave state as-is
    }
  }, []);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  // ── Leads ──────────────────────────────────────────────────────────────────

  const addLead = useCallback(async (data: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Promise<Lead> => {
    const lead = await apiFetch<Lead>('/api/v1/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    setLeads((prev) => [lead, ...prev]);
    return lead;
  }, []);

  const updateLead = useCallback(async (id: string, updates: Partial<Lead>): Promise<void> => {
    const lead = await apiFetch<Lead>(`/api/v1/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    setLeads((prev) => prev.map((l) => (l.id === id ? lead : l)));
  }, []);

  const deleteLead = useCallback(async (id: string): Promise<void> => {
    await apiFetch(`/api/v1/leads/${id}`, { method: 'DELETE' });
    setLeads((prev) => prev.filter((l) => l.id !== id));
  }, []);

  // ── Clients ────────────────────────────────────────────────────────────────

  const addClient = useCallback(async (data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client> => {
    const client = await apiFetch<Client>('/api/v1/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    setClients((prev) => [client, ...prev]);
    return client;
  }, []);

  const updateClient = useCallback(async (id: string, updates: Partial<Client>): Promise<void> => {
    const client = await apiFetch<Client>(`/api/v1/clients/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    setClients((prev) => prev.map((c) => (c.id === id ? client : c)));
  }, []);

  const deleteClient = useCallback(async (id: string): Promise<void> => {
    await apiFetch(`/api/v1/clients/${id}`, { method: 'DELETE' });
    setClients((prev) => prev.filter((c) => c.id !== id));
  }, []);

  // ── Appointments ───────────────────────────────────────────────────────────

  const addAppointment = useCallback(async (data: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Appointment> => {
    const appt = await apiFetch<Appointment>('/api/v1/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    setAppointments((prev) => [appt, ...prev]);
    return appt;
  }, []);

  const updateAppointment = useCallback(async (id: string, updates: Partial<Appointment>): Promise<void> => {
    const appt = await apiFetch<Appointment>(`/api/v1/appointments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    setAppointments((prev) => prev.map((a) => (a.id === id ? appt : a)));
  }, []);

  const deleteAppointment = useCallback(async (id: string): Promise<void> => {
    await apiFetch(`/api/v1/appointments/${id}`, { method: 'DELETE' });
    setAppointments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // ── Services ───────────────────────────────────────────────────────────────

  const addService = useCallback(async (data: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>): Promise<Service> => {
    const service = await apiFetch<Service>('/api/v1/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    setServices((prev) => [service, ...prev]);
    return service;
  }, []);

  const updateService = useCallback(async (id: string, updates: Partial<Service>): Promise<void> => {
    const service = await apiFetch<Service>(`/api/v1/services/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    setServices((prev) => prev.map((s) => (s.id === id ? service : s)));
  }, []);

  const deleteService = useCallback(async (id: string): Promise<void> => {
    await apiFetch(`/api/v1/services/${id}`, { method: 'DELETE' });
    setServices((prev) => prev.filter((s) => s.id !== id));
  }, []);

  // ── Forms ──────────────────────────────────────────────────────────────────

  const addForm = useCallback(async (data: Omit<Form, 'id' | 'createdAt' | 'updatedAt'>): Promise<Form> => {
    const form = await apiFetch<Form>('/api/v1/forms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    setForms((prev) => [form, ...prev]);
    return form;
  }, []);

  const updateForm = useCallback(async (id: string, updates: Partial<Form>): Promise<void> => {
    const form = await apiFetch<Form>(`/api/v1/forms/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    setForms((prev) => prev.map((f) => (f.id === id ? form : f)));
  }, []);

  const deleteForm = useCallback(async (id: string): Promise<void> => {
    await apiFetch(`/api/v1/forms/${id}`, { method: 'DELETE' });
    setForms((prev) => prev.filter((f) => f.id !== id));
  }, []);

  // ── Lead Statuses ──────────────────────────────────────────────────────────

  const addLeadStatus = useCallback(async (data: Omit<LeadStatus, 'id' | 'createdAt' | 'updatedAt'>): Promise<LeadStatus> => {
    const status = await apiFetch<LeadStatus>('/api/v1/lead-statuses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    setLeadStatuses((prev) => [...prev, status]);
    return status;
  }, []);

  const updateLeadStatus = useCallback(async (id: string, updates: Partial<LeadStatus>): Promise<void> => {
    const status = await apiFetch<LeadStatus>(`/api/v1/lead-statuses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    setLeadStatuses((prev) => prev.map((s) => (s.id === id ? status : s)));
  }, []);

  const deleteLeadStatus = useCallback(async (id: string): Promise<void> => {
    await apiFetch(`/api/v1/lead-statuses/${id}`, { method: 'DELETE' });
    setLeadStatuses((prev) => prev.filter((s) => s.id !== id));
  }, []);

  // ── Users ──────────────────────────────────────────────────────────────────

  const addUser = useCallback(async (data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> => {
    const user = await apiFetch<User>('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: 'Password123!',
        organizationName: 'Personal',
      }),
    });
    setUsers((prev) => [...prev, user]);
    return user;
  }, []);

  const updateUser = useCallback(async (id: string, updates: Partial<User>): Promise<void> => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } : u)));
  }, []);

  const deleteUser = useCallback(async (id: string): Promise<void> => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }, []);

  // ── Locations ──────────────────────────────────────────────────────────────

  const addLocation = useCallback(async (data: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>): Promise<Location> => {
    const location = await apiFetch<Location>('/api/v1/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    setLocations((prev) => [...prev, location]);
    return location;
  }, []);

  const updateLocation = useCallback(async (id: string, updates: Partial<Location>): Promise<void> => {
    const location = await apiFetch<Location>(`/api/v1/locations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    setLocations((prev) => prev.map((l) => (l.id === id ? location : l)));
  }, []);

  const deleteLocation = useCallback(async (id: string): Promise<void> => {
    await apiFetch(`/api/v1/locations/${id}`, { method: 'DELETE' });
    setLocations((prev) => prev.filter((l) => l.id !== id));
  }, []);

  // ── Webhooks ───────────────────────────────────────────────────────────────

  const addWebhook = useCallback(async (data: Omit<Webhook, 'id' | 'createdAt' | 'updatedAt'>): Promise<Webhook> => {
    const webhook = await apiFetch<Webhook>('/api/v1/webhooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    setWebhooks((prev) => [webhook, ...prev]);
    return webhook;
  }, []);

  const updateWebhook = useCallback(async (id: string, updates: Partial<Webhook>): Promise<void> => {
    const webhook = await apiFetch<Webhook>(`/api/v1/webhooks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    setWebhooks((prev) => prev.map((w) => (w.id === id ? webhook : w)));
  }, []);

  const deleteWebhook = useCallback(async (id: string): Promise<void> => {
    await apiFetch(`/api/v1/webhooks/${id}`, { method: 'DELETE' });
    setWebhooks((prev) => prev.filter((w) => w.id !== id));
  }, []);

  // ── API Keys ───────────────────────────────────────────────────────────────

  const addApiKey = useCallback(async (data: Omit<ApiKey, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiKey> => {
    const key = await apiFetch<ApiKey>('/api/v1/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    setApiKeys((prev) => [key, ...prev]);
    return key;
  }, []);

  const updateApiKey = useCallback(async (id: string, updates: Partial<ApiKey>): Promise<void> => {
    setApiKeys((prev) => prev.map((k) => (k.id === id ? { ...k, ...updates } : k)));
  }, []);

  const deleteApiKey = useCallback(async (id: string): Promise<void> => {
    await apiFetch(`/api/v1/api-keys/${id}`, { method: 'DELETE' });
    setApiKeys((prev) => prev.filter((k) => k.id !== id));
  }, []);

  // ── Subscription Plans ───────────────────────────────────────────────────

  const addSubscriptionPlan = useCallback(async (data: Omit<SubscriptionPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<SubscriptionPlan> => {
    const plan = await apiFetch<SubscriptionPlan>('/api/v1/subscription-plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    setSubscriptionPlans((prev) => [plan, ...prev]);
    return plan;
  }, []);

  const updateSubscriptionPlan = useCallback(async (id: string, updates: Partial<SubscriptionPlan>): Promise<void> => {
    const plan = await apiFetch<SubscriptionPlan>(`/api/v1/subscription-plans/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    setSubscriptionPlans((prev) => prev.map((p) => (p.id === id ? plan : p)));
  }, []);

  const deleteSubscriptionPlan = useCallback(async (id: string): Promise<void> => {
    await apiFetch(`/api/v1/subscription-plans/${id}`, { method: 'DELETE' });
    setSubscriptionPlans((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const value: CRMContextValue = {
    leads, clients, appointments, services, forms,
    leadStatuses, users, locations, webhooks, apiKeys,
    subscriptionPlans,
    addLead, updateLead, deleteLead,
    addClient, updateClient, deleteClient,
    addAppointment, updateAppointment, deleteAppointment,
    addService, updateService, deleteService,
    addForm, updateForm, deleteForm,
    addLeadStatus, updateLeadStatus, deleteLeadStatus,
    addUser, updateUser, deleteUser,
    addLocation, updateLocation, deleteLocation,
    addWebhook, updateWebhook, deleteWebhook,
    addApiKey, updateApiKey, deleteApiKey,
    addSubscriptionPlan, updateSubscriptionPlan, deleteSubscriptionPlan,
    resetToMockData: () => void fetchAll(),
  };

  return <CRMContext.Provider value={value}>{children}</CRMContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCRM(): CRMContextValue {
  const ctx = useContext(CRMContext);
  if (!ctx) {
    throw new Error('useCRM must be used within a CRMProvider');
  }
  return ctx;
}
