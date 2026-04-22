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
} from '@/types';
// mock-data removed: use server APIs instead

// ─── Storage keys ─────────────────────────────────────────────────────────────

const KEYS = {
  leads: 'crm_leads',
  clients: 'crm_clients',
  appointments: 'crm_appointments',
  services: 'crm_services',
  forms: 'crm_forms',
  leadStatuses: 'crm_lead_statuses',
  users: 'crm_users',
  locations: 'crm_locations',
  webhooks: 'crm_webhooks',
  apiKeys: 'crm_api_keys',
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadFromStorage<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T[];
  } catch {
    // corrupted data — fall through to mock
  }
  return fallback;
}

function saveToStorage<T>(key: string, value: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or unavailable — ignore
  }
}

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function now(): string {
  return new Date().toISOString();
}

// ─── Context type ─────────────────────────────────────────────────────────────

interface CRMContextValue {
  // State
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

  // Lead operations
  addLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => Lead;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  deleteLead: (id: string) => void;

  // Client operations
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => Client;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;

  // Appointment operations
  addAppointment: (
    appt: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>,
  ) => Appointment;
  updateAppointment: (id: string, updates: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;

  // Service operations
  addService: (
    service: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>,
  ) => Service;
  updateService: (id: string, updates: Partial<Service>) => void;
  deleteService: (id: string) => void;

  // Form operations
  addForm: (form: Omit<Form, 'id' | 'createdAt' | 'updatedAt'>) => Form;
  updateForm: (id: string, updates: Partial<Form>) => void;
  deleteForm: (id: string) => void;

  // Lead status operations
  addLeadStatus: (
    status: Omit<LeadStatus, 'id' | 'createdAt' | 'updatedAt'>,
  ) => LeadStatus;
  updateLeadStatus: (id: string, updates: Partial<LeadStatus>) => void;
  deleteLeadStatus: (id: string) => void;

  // User operations
  addUser: (user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => User;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;

  // Location operations
  addLocation: (
    location: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>,
  ) => Location;
  updateLocation: (id: string, updates: Partial<Location>) => void;
  deleteLocation: (id: string) => void;

  // Webhook operations
  addWebhook: (
    webhook: Omit<Webhook, 'id' | 'createdAt' | 'updatedAt'>,
  ) => Webhook;
  updateWebhook: (id: string, updates: Partial<Webhook>) => void;
  deleteWebhook: (id: string) => void;

  // API key operations
  addApiKey: (key: Omit<ApiKey, 'id' | 'createdAt' | 'updatedAt'>) => ApiKey;
  updateApiKey: (id: string, updates: Partial<ApiKey>) => void;
  deleteApiKey: (id: string) => void;

  /** Wipe localStorage and reset to mock data */
  resetToMockData: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const CRMContext = createContext<CRMContextValue | null>(null);

// ─── Generic CRUD factory ─────────────────────────────────────────────────────

function useCRUDState<T extends { id: string; createdAt: string; updatedAt: string }>(
  storageKey: string,
  fallback: T[],
  idPrefix: string,
) {
  const [items, setItems] = useState<T[]>(() =>
    loadFromStorage<T>(storageKey, fallback),
  );

  const persist = useCallback(
    (next: T[]) => {
      setItems(next);
      saveToStorage(storageKey, next);
    },
    [storageKey],
  );

  const add = useCallback(
    (data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): T => {
      const ts = now();
      const item = { ...data, id: generateId(idPrefix), createdAt: ts, updatedAt: ts } as T;
      persist([...items, item]);
      return item;
    },
    [items, persist, idPrefix],
  );

  const update = useCallback(
    (id: string, updates: Partial<T>): void => {
      persist(
        items.map((i) =>
          i.id === id ? { ...i, ...updates, updatedAt: now() } : i,
        ),
      );
    },
    [items, persist],
  );

  const remove = useCallback(
    (id: string): void => {
      persist(items.filter((i) => i.id !== id));
    },
    [items, persist],
  );

  return { items, setItems: persist, add, update, remove };
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function CRMProvider({ children }: { children: React.ReactNode }) {
  const leads = useCRUDState<Lead>(KEYS.leads, [], 'lead');
  const clients = useCRUDState<Client>(KEYS.clients, [], 'client');
  const appointments = useCRUDState<Appointment>(KEYS.appointments, [], 'apt');
  const services = useCRUDState<Service>(KEYS.services, [], 'svc');
  const forms = useCRUDState<Form>(KEYS.forms, [], 'form');
  const leadStatuses = useCRUDState<LeadStatus>(KEYS.leadStatuses, [], 'status');
  const users = useCRUDState<User>(KEYS.users, [], 'user');
  const locations = useCRUDState<Location>(KEYS.locations, [], 'loc');
  const webhooks = useCRUDState<Webhook>(KEYS.webhooks, [], 'wh');
  const apiKeys = useCRUDState<ApiKey>(KEYS.apiKeys, [], 'key');

  const resetToMockData = useCallback(() => {
    Object.values(KEYS).forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch {
        // ignore
      }
    });
    // fall back to empty arrays when resetting to mock
    leads.setItems([]);
    clients.setItems([]);
    appointments.setItems([]);
    services.setItems([]);
    forms.setItems([]);
    leadStatuses.setItems([]);
    users.setItems([]);
    locations.setItems([]);
    webhooks.setItems([]);
    apiKeys.setItems([]);
  }, [leads, clients, appointments, services, forms, leadStatuses, users, locations, webhooks, apiKeys]);

  // Load initial data from server APIs
  useEffect(() => {
    let mounted = true;
    async function fetchAll() {
      try {
        const [leadsRes, clientsRes, apptsRes, servicesRes, formsRes, usersRes, locsRes] = await Promise.all([
          fetch('/api/v1/leads'),
          fetch('/api/v1/clients'),
          fetch('/api/v1/appointments'),
          fetch('/api/v1/services'),
          fetch('/api/v1/forms'),
          fetch('/api/v1/users'),
          fetch('/api/v1/locations'),
        ])

        if (!mounted) return

        if (leadsRes.ok) leads.setItems(await leadsRes.json())
        if (clientsRes.ok) clients.setItems(await clientsRes.json())
        if (apptsRes.ok) appointments.setItems(await apptsRes.json())
        if (servicesRes.ok) services.setItems(await servicesRes.json())
        if (formsRes.ok) forms.setItems(await formsRes.json())
        if (usersRes.ok) users.setItems(await usersRes.json())
        if (locsRes.ok) locations.setItems(await locsRes.json())
      } catch {
        // best-effort: leave local state as-is
      }
    }
    void fetchAll()
    return () => {
      mounted = false
    }
  }, [leads, clients, appointments, services, forms, users, locations]);

  const value: CRMContextValue = {
    // State
    leads: leads.items,
    clients: clients.items,
    appointments: appointments.items,
    services: services.items,
    forms: forms.items,
    leadStatuses: leadStatuses.items,
    users: users.items,
    locations: locations.items,
    webhooks: webhooks.items,
    apiKeys: apiKeys.items,

    // Leads
    addLead: leads.add,
    updateLead: leads.update,
    deleteLead: leads.remove,

    // Clients
    addClient: clients.add,
    updateClient: clients.update,
    deleteClient: clients.remove,

    // Appointments
    addAppointment: appointments.add,
    updateAppointment: appointments.update,
    deleteAppointment: appointments.remove,

    // Services
    addService: services.add,
    updateService: services.update,
    deleteService: services.remove,

    // Forms
    addForm: forms.add,
    updateForm: forms.update,
    deleteForm: forms.remove,

    // Lead statuses
    addLeadStatus: leadStatuses.add,
    updateLeadStatus: leadStatuses.update,
    deleteLeadStatus: leadStatuses.remove,

    // Users
    addUser: users.add,
    updateUser: users.update,
    deleteUser: users.remove,

    // Locations
    addLocation: locations.add,
    updateLocation: locations.update,
    deleteLocation: locations.remove,

    // Webhooks
    addWebhook: webhooks.add,
    updateWebhook: webhooks.update,
    deleteWebhook: webhooks.remove,

    // API keys
    addApiKey: apiKeys.add,
    updateApiKey: apiKeys.update,
    deleteApiKey: apiKeys.remove,

    resetToMockData,
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
