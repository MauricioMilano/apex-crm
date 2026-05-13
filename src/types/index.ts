// ─── Organization ───────────────────────────────────────────────────────────

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Location ────────────────────────────────────────────────────────────────

export interface Location {
  id: string;
  organizationId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone?: string;
  email?: string;
  timezone?: string;
  currency?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── User ────────────────────────────────────────────────────────────────────

export type UserRole = 'super_admin' | 'admin' | 'employee' | 'client';

export interface User {
  id: string;
  organizationId: string;
  locationId?: string;
  email: string;
  /** Stored as plain text for mock/demo purposes only */
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  isActive: boolean;
  resetToken?: string;
  resetTokenExpires?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Lead ────────────────────────────────────────────────────────────────────

export interface LeadStatus {
  id: string;
  organizationId: string;
  name: string;
  /** Tailwind color token, e.g. "blue", "yellow" */
  color: string;
  order: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Lead {
  id: string;
  organizationId: string;
  locationId?: string;
  statusId: string;
  assignedTo?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  source?: string;
  notes?: string;
  value?: number;
  tags: string[];
  convertedToClientId?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Client ──────────────────────────────────────────────────────────────────

export interface Client {
  id: string;
  organizationId: string;
  locationId?: string;
  assignedTo?: string;
  leadId?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  notes?: string;
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export interface Service {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  /** Duration in minutes */
  duration: number;
  price: number;
  color?: string;
  requiresPrepayment: boolean;
  interestRate?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeService {
  id: string;
  employeeId: string;
  serviceId: string;
  createdAt: string;
}

// ─── Subscription Plan ───────────────────────────────────────────────────────

export type BillingPeriod = 'monthly' | 'quarterly' | 'semiannual' | 'annual';

export interface SubscriptionPlan {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  price: number;
  billingPeriod: BillingPeriod;
  maxApptsPerPeriod?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPlanService {
  id: string;
  planId: string;
  serviceId: string;
  maxPerPeriod?: number;
}

export type SubscriptionStatus = 'active' | 'cancelled' | 'expired';

export interface ClientSubscription {
  id: string;
  clientId: string;
  planId: string;
  status: SubscriptionStatus;
  startDate: string;
  endDate?: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  appointmentsUsed: number;
  createdAt: string;
  updatedAt: string;

  /** Joined from relations */
  plan?: SubscriptionPlan;
}

// ─── Appointment ─────────────────────────────────────────────────────────────

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export interface Appointment {
  id: string;
  organizationId: string;
  locationId?: string;
  clientId?: string;
  leadId?: string;
  employeeId: string;
  serviceId: string;
  clientSubscriptionId?: string;
  status: AppointmentStatus;
  /** ISO date-time string */
  startTime: string;
  /** ISO date-time string */
  endTime: string;
  notes?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Payment Method ───────────────────────────────────────────────────────────

export interface PaymentMethod {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  requiresDocs: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Payment ──────────────────────────────────────────────────────────────────

export type PaymentStatus =
  | 'pending'
  | 'completed'
  | 'refunded'
  | 'failed'
  | 'adjusted';

export interface Payment {
  id: string;
  organizationId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  referenceType: string;
  referenceId: string;
  adjustedPaymentId?: string;
  paymentMethodId?: string;
  installments: number;
  cardLastFour?: string;
  description?: string;
  /** ISO date-time string */
  paidAt: string;
  createdAt: string;
  updatedAt: string;

  /** Joined from relations */
  paymentMethod?: PaymentMethod;
}

// ─── Form ─────────────────────────────────────────────────────────────────────

export type FormFieldType =
  | 'text'
  | 'email'
  | 'phone'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'date'
  | 'number'
  | 'file';

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  /** Used for select / radio fields */
  options?: string[];
  order: number;
  helpText?: string;
  /** 1 = half width, 2 = full width (default) */
  colSpan?: 1 | 2;
}

export interface FormStyling {
  primaryColor?: string;
  backgroundColor?: string;
  fontSize?: 'small' | 'medium' | 'large';
  buttonText?: string;
  title?: string;
  description?: string;
  borderRadius?: 'sharp' | 'rounded' | 'pill';
}

export interface Form {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  fields: FormField[];
  styling?: FormStyling;
  isPublished: boolean;
  submissionsCount: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Webhook ─────────────────────────────────────────────────────────────────

export interface Webhook {
  id: string;
  organizationId: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  secret?: string;
  lastTriggered?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Audit Log ───────────────────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  organizationId: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  changes?: Record<string, unknown>;
  createdAt: string;
}

// ─── API Key ─────────────────────────────────────────────────────────────────

export interface ApiKey {
  id: string;
  organizationId: string;
  name: string;
  /** Masked/partial key shown in UI */
  key: string;
  permissions: string[];
  isActive: boolean;
  lastUsed?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Employee Profile ────────────────────────────────────────────────────────

export interface DaySchedule {
  isWorking: boolean;
  /** 24-hour time, e.g. "09:00" */
  startTime: string;
  /** 24-hour time, e.g. "17:00" */
  endTime: string;
}

export interface WorkingHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface EmployeeProfile {
  id: string;
  userId: string;
  bio?: string;
  workingHours: WorkingHours;
  locationId?: string;
  /** serviceIds this employee is qualified to deliver */
  services: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── Blocked Slot ────────────────────────────────────────────────────────────

export interface BlockedSlot {
  id: string;
  employeeId: string;
  startTime: string;
  endTime: string;
  reason?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Recurring Pattern ───────────────────────────────────────────────────────

export type RecurrenceFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';

export interface RecurringPattern {
  id: string;
  appointmentId: string;
  frequency: RecurrenceFrequency;
  interval: number;
  /** Days of week (0 = Sunday … 6 = Saturday) */
  daysOfWeek?: number[];
  endDate?: string;
  occurrences?: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Client File ─────────────────────────────────────────────────────────────

export interface ClientFile {
  id: string;
  clientId: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedBy: string;
  createdAt: string;
}

// ─── Navigation ──────────────────────────────────────────────────────────────

export interface NavItem {
  title: string;
  href: string;
  icon?: string;
  badge?: number;
  children?: NavItem[];
  requiredRole?: UserRole[];
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

// ─── Organization Regional Settings ────────────────────────────────────────────

export interface OrgSettings {
  currency: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  locale: string | null;
  defaultInterestRate?: number;
}

// ─── Email / SMTP ──────────────────────────────────────────────────────────────

export interface OrganizationSetting {
  id: string;
  organizationId: string;
  smtpEnabled: boolean;
  smtpHost: string | null;
  smtpPort: number | null;
  smtpUser: string | null;
  /** Masked/"••••••" when returned to frontend */
  smtpPass: string | null;
  smtpFrom: string | null;
  smtpSecure: boolean;
  emailVerificationEnabled: boolean;

  // ── Interest / Installment settings ─────────────────────────────────────
  defaultInterestRate?: number;

  // ── Regional settings ──────────────────────────────────────────────────
  currency: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  locale: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface EmailTemplate {
  id: string;
  organizationId: string;
  name: string;
  subject: string;
  bodyHtml: string;
  category: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmailSchedule {
  id: string;
  organizationId: string;
  templateName: string;
  to: string;
  variables: Record<string, string>;
  scheduledFor: string;
  sentAt: string | null;
  referenceType: string | null;
  referenceId: string | null;
  createdAt: string;
}
