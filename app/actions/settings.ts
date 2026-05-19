"use server";

/**
 * Settings Actions - 統一的設定管理 Actions
 * 整合帳戶與分類的 CRUD 操作
 */

import { db } from "@/db";
import { accounts, categories, transactions } from "@/db/schema";
import { eq, count, and, isNull } from "drizzle-orm";

// ============================================
// 帳戶管理 Actions
// ============================================

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
 * 新增帳戶
 */
export async function createAccount(data: {
  name: string;
  type: "銀行" | "現金" | "電子支付";
  currency?: string;
}) {
  try {
    if (!data.name.trim()) {
      return {
        success: false,
        error: "帳戶名稱不可為空",
      };
    }

    const [result] = await db
      .insert(accounts)
      .values({
        name: data.name.trim(),
        type: data.type,
        currency: data.currency || "TWD",
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
    isActive?: boolean;
  }
) {
  try {
    if (data.name !== undefined && !data.name.trim()) {
      return {
        success: false,
        error: "帳戶名稱不可為空",
      };
    }

    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.type !== undefined) updateData.type = data.type;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const [result] = await db
      .update(accounts)
      .set(updateData)
      .where(eq(accounts.id, id))
      .returning();

    if (!result) {
      return {
        success: false,
        error: "帳戶不存在",
      };
    }

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
 * 刪除帳戶（需檢查是否有關聯交易）
 */
export async function deleteAccount(id: number) {
  try {
    // 檢查是否有關聯交易
    const [transactionCount] = await db
      .select({ count: count() })
      .from(transactions)
      .where(eq(transactions.accountId, id));

    if (transactionCount.count > 0) {
      return {
        success: false,
        error: `此帳戶已有 ${transactionCount.count} 筆交易記錄，無法刪除。建議改用「停用」功能。`,
        transactionCount: transactionCount.count,
      };
    }

    // 執行刪除
    await db.delete(accounts).where(eq(accounts.id, id));

    return {
      success: true,
    };
  } catch (error) {
    console.error("deleteAccount error:", error);
    return {
      success: false,
      error: "刪除帳戶失敗",
    };
  }
}

/**
 * 切換帳戶啟用狀態
 */
export async function toggleAccountStatus(id: number) {
  try {
    // 先取得目前狀態
    const [account] = await db.select().from(accounts).where(eq(accounts.id, id)).limit(1);

    if (!account) {
      return {
        success: false,
        error: "帳戶不存在",
      };
    }

    // 切換狀態
    const [result] = await db
      .update(accounts)
      .set({
        isActive: !account.isActive,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(accounts.id, id))
      .returning();

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("toggleAccountStatus error:", error);
    return {
      success: false,
      error: "切換狀態失敗",
    };
  }
}

// ============================================
// 分類管理 Actions
// ============================================

/**
 * 取得所有分類（含階層結構）
 */
export async function getCategories() {
  const allCategories = await db.select().from(categories).orderBy(categories.type, categories.name);

  // 組織成主分類與子分類的階層結構
  const mainCategories = allCategories.filter((c) => c.parentId === null);
  const subCategories = allCategories.filter((c) => c.parentId !== null);

  const result = mainCategories.map((main) => ({
    ...main,
    children: subCategories.filter((sub) => sub.parentId === main.id),
  }));

  return result;
}

/**
 * 取得指定類型的分類
 */
export async function getCategoriesByType(type: "支出" | "收入") {
  const filteredCategories = await db
    .select()
    .from(categories)
    .where(eq(categories.type, type))
    .orderBy(categories.name);

  const mainCategories = filteredCategories.filter((c) => c.parentId === null);
  const subCategories = filteredCategories.filter((c) => c.parentId !== null);

  const result = mainCategories.map((main) => ({
    ...main,
    children: subCategories.filter((sub) => sub.parentId === main.id),
  }));

  return result;
}

/**
 * 新增分類
 */
export async function createCategory(data: {
  name: string;
  type: "支出" | "收入";
  parentId?: number | null;
}) {
  try {
    if (!data.name.trim()) {
      return {
        success: false,
        error: "分類名稱不可為空",
      };
    }

    // 如果有 parentId，驗證父分類是否存在且類型相同
    if (data.parentId) {
      const parentCategory = await db
        .select()
        .from(categories)
        .where(eq(categories.id, data.parentId))
        .limit(1);

      if (parentCategory.length === 0) {
        return {
          success: false,
          error: "父分類不存在",
        };
      }

      if (parentCategory[0].type !== data.type) {
        return {
          success: false,
          error: "子分類類型必須與父分類相同",
        };
      }

      // 檢查父分類是否本身就是子分類（不允許三層結構）
      if (parentCategory[0].parentId !== null) {
        return {
          success: false,
          error: "不支援三層以上的分類結構",
        };
      }
    }

    const [result] = await db
      .insert(categories)
      .values({
        name: data.name.trim(),
        type: data.type,
        parentId: data.parentId || null,
      })
      .returning();

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("createCategory error:", error);
    return {
      success: false,
      error: "新增分類失敗",
    };
  }
}

/**
 * 更新分類
 */
export async function updateCategory(
  id: number,
  data: {
    name?: string;
  }
) {
  try {
    if (data.name !== undefined && !data.name.trim()) {
      return {
        success: false,
        error: "分類名稱不可為空",
      };
    }

    const [result] = await db
      .update(categories)
      .set({
        name: data.name?.trim(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(categories.id, id))
      .returning();

    if (!result) {
      return {
        success: false,
        error: "分類不存在",
      };
    }

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("updateCategory error:", error);
    return {
      success: false,
      error: "更新分類失敗",
    };
  }
}

/**
 * 刪除分類（防呆機制：檢查子分類與關聯交易）
 */
export async function deleteCategory(id: number) {
  try {
    // 1. 檢查是否有子分類
    const childCategories = await db.select().from(categories).where(eq(categories.parentId, id));

    if (childCategories.length > 0) {
      return {
        success: false,
        error: `此分類有 ${childCategories.length} 個子分類，無法刪除。請先刪除或移動子分類。`,
        hasChildren: true,
        childrenCount: childCategories.length,
      };
    }

    // 2. 檢查是否有關聯交易
    const [transactionCount] = await db
      .select({ count: count() })
      .from(transactions)
      .where(eq(transactions.categoryId, id));

    if (transactionCount.count > 0) {
      return {
        success: false,
        error: `此分類已有 ${transactionCount.count} 筆交易記錄，無法刪除。`,
        hasTransactions: true,
        transactionCount: transactionCount.count,
      };
    }

    // 3. 執行刪除
    await db.delete(categories).where(eq(categories.id, id));

    return {
      success: true,
    };
  } catch (error) {
    console.error("deleteCategory error:", error);
    return {
      success: false,
      error: "刪除分類失敗",
    };
  }
}

/**
 * 取得分類的統計資訊（包含交易筆數）
 */
export async function getCategoryStats(categoryId: number) {
  try {
    const [stats] = await db
      .select({ count: count() })
      .from(transactions)
      .where(eq(transactions.categoryId, categoryId));

    const [childCount] = await db
      .select({ count: count() })
      .from(categories)
      .where(eq(categories.parentId, categoryId));

    return {
      success: true,
      data: {
        transactionCount: stats.count,
        childrenCount: childCount.count,
      },
    };
  } catch (error) {
    console.error("getCategoryStats error:", error);
    return {
      success: false,
      error: "取得統計資訊失敗",
    };
  }
}
