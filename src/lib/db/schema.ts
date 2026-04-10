import {
  pgTable,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  decimal,
  jsonb,
  index,
  serial,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// ─── ENUMS ────────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum('user_role', ['admin', 'collaborator']);

export const subscriptionTierEnum = pgEnum('subscription_tier', [
  'free',
  'base',
  'pro',
  'studio',
]);

export const riskLevelEnum = pgEnum('risk_level', ['basso', 'medio', 'alto']);

export const deadlineCategoryEnum = pgEnum('deadline_category', [
  'formazione',
  'sorveglianza_sanitaria',
  'documenti_aziendali',
  'verifiche_impianti',
  'dpi',
  'altro',
]);

export const deadlineStatusEnum = pgEnum('deadline_status', [
  'pending',
  'expiring_soon',
  'overdue',
  'completed',
  'not_applicable',
]);

export const deadlinePriorityEnum = pgEnum('deadline_priority', [
  'low',
  'medium',
  'high',
  'critical',
]);

export const documentTypeEnum = pgEnum('document_type', [
  'attestato',
  'verbale',
  'certificato',
  'altro',
]);

export const notificationTypeEnum = pgEnum('notification_type', [
  'deadline_expiring',
  'deadline_overdue',
  'system',
  'welcome',
]);

export const notificationChannelEnum = pgEnum('notification_channel', [
  'push',
  'email',
  'in_app',
]);

export const notificationStatusEnum = pgEnum('notification_status', [
  'sent',
  'delivered',
  'read',
  'failed',
]);

export const activityActionEnum = pgEnum('activity_action', [
  'create',
  'update',
  'delete',
  'complete',
  'upload',
  'login',
  'export',
]);

export const activityEntityTypeEnum = pgEnum('activity_entity_type', [
  'company',
  'employee',
  'deadline',
  'document',
]);

export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active',
  'past_due',
  'canceled',
  'trialing',
]);

// ─── TABLES ───────────────────────────────────────────────────────────────────

// ── Users ─────────────────────────────────────────────────────────────────────
export const users = pgTable('users', {
  id: varchar('id', { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  // better-auth required fields
  name: varchar('name', { length: 255 }).notNull().default(''),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  // App fields
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  phone: varchar('phone', { length: 30 }),
  companyName: varchar('company_name', { length: 255 }),
  role: userRoleEnum('role').notNull().default('admin'),
  subscriptionTier: subscriptionTierEnum('subscription_tier')
    .notNull()
    .default('free'),
  subscriptionExpiresAt: timestamp('subscription_expires_at', {
    withTimezone: true,
  }),
  maxCompanies: integer('max_companies').notNull().default(3),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// ── Companies ─────────────────────────────────────────────────────────────────
export const companies = pgTable(
  'companies',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar('user_id', { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    fiscalCode: varchar('fiscal_code', { length: 16 }),
    atecoCode: varchar('ateco_code', { length: 20 }),
    address: varchar('address', { length: 500 }),
    city: varchar('city', { length: 100 }),
    province: varchar('province', { length: 5 }),
    cap: varchar('cap', { length: 5 }),
    legalRepresentative: varchar('legal_representative', { length: 255 }),
    contactEmail: varchar('contact_email', { length: 255 }),
    contactPhone: varchar('contact_phone', { length: 30 }),
    employeeCount: integer('employee_count').notNull().default(0),
    riskLevel: riskLevelEnum('risk_level').notNull().default('basso'),
    notes: text('notes'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('companies_user_id_is_active_idx').on(table.userId, table.isActive),
  ]
);

// ── Employees ─────────────────────────────────────────────────────────────────
export const employees = pgTable(
  'employees',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    companyId: varchar('company_id', { length: 36 })
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    userId: varchar('user_id', { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    fiscalCode: varchar('fiscal_code', { length: 16 }),
    role: varchar('role', { length: 100 }),
    jobTitle: varchar('job_title', { length: 255 }),
    hiringDate: timestamp('hiring_date', { withTimezone: true }),
    terminationDate: timestamp('termination_date', { withTimezone: true }),
    isPreposto: boolean('is_preposto').notNull().default(false),
    isDirigente: boolean('is_dirigente').notNull().default(false),
    isRls: boolean('is_rls').notNull().default(false),
    isAddettoAntincendio: boolean('is_addetto_antincendio')
      .notNull()
      .default(false),
    isAddettoPrimoSoccorso: boolean('is_addetto_primo_soccorso')
      .notNull()
      .default(false),
    medicalProtocol: text('medical_protocol'),
    isActive: boolean('is_active').notNull().default(true),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('employees_company_id_is_active_idx').on(
      table.companyId,
      table.isActive
    ),
    index('employees_user_id_idx').on(table.userId),
  ]
);

// ── Deadline Types (catalog) ──────────────────────────────────────────────────
export const deadlineTypes = pgTable('deadline_types', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  category: deadlineCategoryEnum('category').notNull(),
  legalReference: varchar('legal_reference', { length: 500 }),
  defaultPeriodicityMonths: integer('default_periodicity_months')
    .notNull()
    .default(0),
  appliesToAll: boolean('applies_to_all').notNull().default(false),
  appliesToRoles: jsonb('applies_to_roles').$type<string[]>(),
  riskLevels: jsonb('risk_levels').$type<string[]>(),
  durationHours: decimal('duration_hours', { precision: 5, scale: 1 }),
  sanctionInfo: text('sanction_info'),
  isSystem: boolean('is_system').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ── Deadlines (instances) ─────────────────────────────────────────────────────
export const deadlines = pgTable(
  'deadlines',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar('user_id', { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    companyId: varchar('company_id', { length: 36 })
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    employeeId: varchar('employee_id', { length: 36 }).references(
      () => employees.id,
      { onDelete: 'cascade' }
    ),
    deadlineTypeId: integer('deadline_type_id')
      .notNull()
      .references(() => deadlineTypes.id, { onDelete: 'restrict' }),
    dueDate: timestamp('due_date', { withTimezone: true }).notNull(),
    completedDate: timestamp('completed_date', { withTimezone: true }),
    status: deadlineStatusEnum('status').notNull().default('pending'),
    renewalDate: timestamp('renewal_date', { withTimezone: true }),
    notes: text('notes'),
    priority: deadlinePriorityEnum('priority').notNull().default('medium'),
    lastNotifiedAt: timestamp('last_notified_at', { withTimezone: true }),
    notificationsSnoozedUntil: timestamp('notifications_snoozed_until', {
      withTimezone: true,
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('deadlines_user_id_status_idx').on(table.userId, table.status),
    index('deadlines_user_id_due_date_idx').on(table.userId, table.dueDate),
    index('deadlines_company_id_status_idx').on(
      table.companyId,
      table.status
    ),
    index('deadlines_employee_id_idx').on(table.employeeId),
  ]
);

// ── Documents ─────────────────────────────────────────────────────────────────
export const documents = pgTable(
  'documents',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar('user_id', { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    deadlineId: varchar('deadline_id', { length: 36 }).references(
      () => deadlines.id,
      { onDelete: 'set null' }
    ),
    companyId: varchar('company_id', { length: 36 })
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    employeeId: varchar('employee_id', { length: 36 }).references(
      () => employees.id,
      { onDelete: 'set null' }
    ),
    fileName: varchar('file_name', { length: 500 }).notNull(),
    filePath: varchar('file_path', { length: 1000 }).notNull(),
    fileSize: integer('file_size').notNull(),
    mimeType: varchar('mime_type', { length: 100 }).notNull(),
    documentType: documentTypeEnum('document_type').notNull().default('altro'),
    title: varchar('title', { length: 500 }),
    issueDate: timestamp('issue_date', { withTimezone: true }),
    expiryDate: timestamp('expiry_date', { withTimezone: true }),
    issuingBody: varchar('issuing_body', { length: 255 }),
    aiExtracted: boolean('ai_extracted').notNull().default(false),
    aiConfidence: decimal('ai_confidence', { precision: 5, scale: 4 }),
    rawAiResponse: jsonb('raw_ai_response'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('documents_deadline_id_idx').on(table.deadlineId),
    index('documents_employee_id_idx').on(table.employeeId),
    index('documents_company_id_idx').on(table.companyId),
  ]
);

// ── Notifications ─────────────────────────────────────────────────────────────
export const notifications = pgTable(
  'notifications',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar('user_id', { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: notificationTypeEnum('type').notNull(),
    channel: notificationChannelEnum('channel').notNull(),
    title: varchar('title', { length: 500 }).notNull(),
    body: text('body').notNull(),
    relatedDeadlineId: varchar('related_deadline_id', { length: 36 }).references(
      () => deadlines.id,
      { onDelete: 'set null' }
    ),
    relatedCompanyId: varchar('related_company_id', { length: 36 }).references(
      () => companies.id,
      { onDelete: 'set null' }
    ),
    sentAt: timestamp('sent_at', { withTimezone: true }).notNull().defaultNow(),
    readAt: timestamp('read_at', { withTimezone: true }),
    status: notificationStatusEnum('status').notNull().default('sent'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('notifications_user_id_read_at_idx').on(table.userId, table.readAt),
  ]
);

// ── Push Subscriptions ────────────────────────────────────────────────────────
export const pushSubscriptions = pgTable('push_subscriptions', {
  id: varchar('id', { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar('user_id', { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  endpoint: text('endpoint').notNull(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  userAgent: text('user_agent'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ── Activity Log ──────────────────────────────────────────────────────────────
export const activityLog = pgTable(
  'activity_log',
  {
    id: varchar('id', { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar('user_id', { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    action: activityActionEnum('action').notNull(),
    entityType: activityEntityTypeEnum('entity_type').notNull(),
    entityId: varchar('entity_id', { length: 36 }).notNull(),
    details: jsonb('details'),
    ipAddress: varchar('ip_address', { length: 45 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('activity_log_user_id_created_at_idx').on(
      table.userId,
      table.createdAt
    ),
  ]
);

// ── Subscriptions (billing) ───────────────────────────────────────────────────
export const subscriptions = pgTable('subscriptions', {
  id: varchar('id', { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar('user_id', { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tier: subscriptionTierEnum('tier').notNull(),
  status: subscriptionStatusEnum('status').notNull().default('trialing'),
  startDate: timestamp('start_date', { withTimezone: true })
    .notNull()
    .defaultNow(),
  endDate: timestamp('end_date', { withTimezone: true }),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
  amount: decimal('amount', { precision: 10, scale: 2 }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// ─── RELATIONS ────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  companies: many(companies),
  employees: many(employees),
  deadlines: many(deadlines),
  documents: many(documents),
  notifications: many(notifications),
  pushSubscriptions: many(pushSubscriptions),
  activityLog: many(activityLog),
  subscriptions: many(subscriptions),
}));

export const companiesRelations = relations(companies, ({ one, many }) => ({
  user: one(users, {
    fields: [companies.userId],
    references: [users.id],
  }),
  employees: many(employees),
  deadlines: many(deadlines),
  documents: many(documents),
}));

export const employeesRelations = relations(employees, ({ one, many }) => ({
  company: one(companies, {
    fields: [employees.companyId],
    references: [companies.id],
  }),
  user: one(users, {
    fields: [employees.userId],
    references: [users.id],
  }),
  deadlines: many(deadlines),
  documents: many(documents),
}));

export const deadlineTypesRelations = relations(deadlineTypes, ({ many }) => ({
  deadlines: many(deadlines),
}));

export const deadlinesRelations = relations(deadlines, ({ one, many }) => ({
  user: one(users, {
    fields: [deadlines.userId],
    references: [users.id],
  }),
  company: one(companies, {
    fields: [deadlines.companyId],
    references: [companies.id],
  }),
  employee: one(employees, {
    fields: [deadlines.employeeId],
    references: [employees.id],
  }),
  deadlineType: one(deadlineTypes, {
    fields: [deadlines.deadlineTypeId],
    references: [deadlineTypes.id],
  }),
  documents: many(documents),
  notifications: many(notifications),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  user: one(users, {
    fields: [documents.userId],
    references: [users.id],
  }),
  deadline: one(deadlines, {
    fields: [documents.deadlineId],
    references: [deadlines.id],
  }),
  company: one(companies, {
    fields: [documents.companyId],
    references: [companies.id],
  }),
  employee: one(employees, {
    fields: [documents.employeeId],
    references: [employees.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  relatedDeadline: one(deadlines, {
    fields: [notifications.relatedDeadlineId],
    references: [deadlines.id],
  }),
  relatedCompany: one(companies, {
    fields: [notifications.relatedCompanyId],
    references: [companies.id],
  }),
}));

export const pushSubscriptionsRelations = relations(
  pushSubscriptions,
  ({ one }) => ({
    user: one(users, {
      fields: [pushSubscriptions.userId],
      references: [users.id],
    }),
  })
);

export const activityLogRelations = relations(activityLog, ({ one }) => ({
  user: one(users, {
    fields: [activityLog.userId],
    references: [users.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));

// ─── BETTER-AUTH REQUIRED TABLES ─────────────────────────────────────────────
// These tables are required by better-auth for session and account management.
// The `users` table above is extended with better-auth compatible fields.

export const sessions = pgTable('sessions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  token: varchar('token', { length: 500 }).notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  userId: varchar('user_id', { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
});

export const accounts = pgTable('accounts', {
  id: varchar('id', { length: 36 }).primaryKey(),
  accountId: varchar('account_id', { length: 255 }).notNull(),
  providerId: varchar('provider_id', { length: 100 }).notNull(),
  userId: varchar('user_id', { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', {
    withTimezone: true,
  }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', {
    withTimezone: true,
  }),
  scope: varchar('scope', { length: 500 }),
  password: text('password'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const verifications = pgTable('verifications', {
  id: varchar('id', { length: 36 }).primaryKey(),
  identifier: varchar('identifier', { length: 255 }).notNull(),
  value: varchar('value', { length: 500 }).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ─── TYPE EXPORTS ─────────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;

export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;

export type DeadlineType = typeof deadlineTypes.$inferSelect;
export type NewDeadlineType = typeof deadlineTypes.$inferInsert;

export type Deadline = typeof deadlines.$inferSelect;
export type NewDeadline = typeof deadlines.$inferInsert;

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type NewPushSubscription = typeof pushSubscriptions.$inferInsert;

export type ActivityLogEntry = typeof activityLog.$inferSelect;
export type NewActivityLogEntry = typeof activityLog.$inferInsert;

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;

export type Verification = typeof verifications.$inferSelect;
export type NewVerification = typeof verifications.$inferInsert;
