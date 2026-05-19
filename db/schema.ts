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
