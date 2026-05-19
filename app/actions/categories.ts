"use server";

import { db } from "@/db";
import { categories, transactions } from "@/db/schema";
import { eq, and, isNull, count } from "drizzle-orm";

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
 * 取得指定類型的分類（支出或收入）
 */
export async function getCategoriesByType(type: "支出" | "收入") {
  const filteredCategories = await db
    .select()
    .from(categories)
    .where(eq(categories.type, type))
    .orderBy(categories.name);

  // 組織成主分類與子分類
  const mainCategories = filteredCategories.filter((c) => c.parentId === null);
  const subCategories = filteredCategories.filter((c) => c.parentId !== null);

  const result = mainCategories.map((main) => ({
    ...main,
    children: subCategories.filter((sub) => sub.parentId === main.id),
  }));

  return result;
}

/**
 * 取得所有主分類（無父分類）
 */
export async function getMainCategories() {
  const mainCategories = await db
    .select()
    .from(categories)
    .where(isNull(categories.parentId))
    .orderBy(categories.type, categories.name);

  return mainCategories;
}

/**
 * 取得指定主分類的所有子分類
 */
export async function getSubCategories(parentId: number) {
  const subCategories = await db
    .select()
    .from(categories)
    .where(eq(categories.parentId, parentId))
    .orderBy(categories.name);

  return subCategories;
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
    }

    const [result] = await db
      .insert(categories)
      .values({
        name: data.name,
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
    type?: "支出" | "收入";
  }
) {
  try {
    const [result] = await db
      .update(categories)
      .set({
        ...data,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(categories.id, id))
      .returning();

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
 * 刪除分類（需檢查是否有關聯交易）
 */
export async function deleteCategory(id: number) {
  try {
    // 檢查是否有子分類
    const childCategories = await db.select().from(categories).where(eq(categories.parentId, id));

    if (childCategories.length > 0) {
      return {
        success: false,
        error: "此分類有子分類，無法刪除。請先刪除或移動子分類。",
      };
    }

    // 檢查是否有關聯交易
    const [transactionCount] = await db
      .select({ count: count() })
      .from(transactions)
      .where(eq(transactions.categoryId, id));

    if (transactionCount.count > 0) {
      return {
        success: false,
        error: `此分類已有 ${transactionCount.count} 筆交易記錄，無法刪除。`,
        transactionCount: transactionCount.count,
      };
    }

    // 執行刪除
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
