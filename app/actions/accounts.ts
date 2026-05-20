"use server";

import { db } from "@/db";
import { accounts } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * 取得所有帳戶清單
 */
export async function getAccounts() {
  const allAccounts = await db
    .select()
    .from(accounts)
    .orderBy(accounts.isActive, accounts.name);

  return allAccounts;
}

/**
 * 取得所有啟用的帳戶
 */
export async function getActiveAccounts() {
  const activeAccounts = await db
    .select()
    .from(accounts)
    .where(eq(accounts.isActive, true))
    .orderBy(accounts.name);

  return activeAccounts;
}

/**
 * 新增帳戶
 */
export async function createAccount(data: {
  name: string;
  type: "銀行" | "現金" | "電子支付";
  currency?: string;
  initialBalance?: string;
  includeInTotal?: boolean;
}) {
  try {
    const [result] = await db
      .insert(accounts)
      .values({
        name: data.name,
        type: data.type,
        currency: data.currency || "TWD",
        initialBalance: data.initialBalance || "0",
        includeInTotal: data.includeInTotal ?? true,
        isActive: true,
      })
      .returning();

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("createAccount error:", error);
    return {
      success: false,
      error: "新增帳戶失敗",
    };
  }
}

/**
 * 更新帳戶
 */
export async function updateAccount(
  id: number,
  data: {
    name?: string;
    type?: "銀行" | "現金" | "電子支付";
    currency?: string;
    initialBalance?: string;
    includeInTotal?: boolean;
    isActive?: boolean;
  }
) {
  try {
    const [result] = await db
      .update(accounts)
      .set({
        ...data,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(accounts.id, id))
      .returning();

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("updateAccount error:", error);
    return {
      success: false,
      error: "更新帳戶失敗",
    };
  }
}

/**
 * 停用帳戶（軟刪除）
 */
export async function deactivateAccount(id: number) {
  return updateAccount(id, { isActive: false });
}
