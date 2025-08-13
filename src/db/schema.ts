import {
  pgTable,
  text,
  timestamp,
  uuid,
  json,
  pgEnum,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import type { UIMessage } from "ai";

const connectionString = process.env.DATABASE_URL!;
const useSSL = process.env.DATABASE_SSL !== "false"; // default true

const pool = new Pool({
  connectionString,
  ssl: useSSL ? { rejectUnauthorized: false } : undefined,
});

export const db = drizzle(pool);

export const appsTable = pgTable("apps", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().default("Unnamed App"),
  description: text("description").notNull().default("No description"),
  gitRepo: text("git_repo").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  baseId: text("base_id").notNull().default("nextjs-dkjfgdf"),
  previewDomain: text("preview_domain").unique(),
});

export const appPermissions = pgEnum("app_user_permission", [
  "read",
  "write",
  "admin",
]);

export const appUsers = pgTable("app_users", {
  userId: text("user_id").notNull(),
  appId: uuid("app_id")
    .notNull()
    .references(() => appsTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  permissions: appPermissions("permissions"),
  freestyleIdentity: text("freestyle_identity").notNull(),
  freestyleAccessToken: text("freestyle_access_token").notNull(),
  freestyleAccessTokenId: text("freestyle_access_token_id").notNull(),
});

export const messagesTable = pgTable("messages", {
  id: text("id").primaryKey(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  appId: uuid("app_id")
    .notNull()
    .references(() => appsTable.id),
  message: json("message").notNull().$type<UIMessage>(),
});

export const appDeployments = pgTable("app_deployments", {
  appId: uuid("app_id")
    .notNull()
    .references(() => appsTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deploymentId: text("deployment_id").notNull(),
  commit: text("commit").notNull(), // sha of the commit
});

// Billing and subscription tables
export const subscriptionPlans = pgEnum("subscription_plan", [
  "free",
  "pro",
]);

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  image: text("image"),
  credits: integer("credits").notNull().default(50), // Free users get 50 credits
  plan: subscriptionPlans("plan").notNull().default("free"),
  stripeCustomerId: text("stripe_customer_id").unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  stripePriceId: text("stripe_price_id").notNull(),
  status: text("status").notNull(), // active, canceled, past_due, etc.
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const creditTransactions = pgTable("credit_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(), // positive for credits added, negative for credits used
  description: text("description").notNull(),
  type: text("type").notNull(), // "purchase", "usage", "bonus", "refund"
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
