import { pgTable, serial, varchar, decimal, timestamp, integer, boolean, text, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// 帳戶類型 Enum
export const accountTypeEnum = pgEnum("account_type", ["銀行", "現金", "電子支付"]);

// 分類類型 Enum
export const categoryTypeEnum = pgEnum("category_type", ["支出", "收入"]);

// 交易類型 Enum
export const transactionTypeEnum = pgEnum("transaction_type", ["支出", "收入"]);

// 1. accounts (帳戶表)
export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  type: accountTypeEnum("type").notNull(),
  currency: varchar("currency", { length: 10 }).notNull().default("TWD"),
  // 初始餘額（預設為 0）
  initialBalance: decimal("initial_balance", { precision: 12, scale: 2 }).notNull().default("0"),
  // 是否計入總資產統計（預設 true）
  includeInTotal: boolean("include_in_total").notNull().default(true),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
});

// 2. categories (分類表 - 支援主子分類階層)
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  type: categoryTypeEnum("type").notNull(),
  parentId: integer("parent_id").references(() => categories.id, {
    onDelete: "cascade",
  }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
});

// 3. transactions (交易明細表)
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  transactionDate: timestamp("transaction_date", {
    withTimezone: true,
    mode: "string",
  }).notNull(),
  // 金額欄位使用 DECIMAL(12,2) - 符合 PRD「浮點數零容忍」要求
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  type: transactionTypeEnum("type").notNull(),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "restrict" }),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "restrict" }),
  // 備註欄位支援多行文字
  memo: text("memo"),
  // 是否計入收支統計（預設 true）- 可用於排除內部轉帳等不計入統計的交易
  includeInStats: boolean("include_in_stats").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
});

// Relations (關聯定義)
export const accountsRelations = relations(accounts, ({ many }) => ({
  transactions: many(transactions),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
  }),
  children: many(categories),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  account: one(accounts, {
    fields: [transactions.accountId],
    references: [accounts.id],
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
}));
