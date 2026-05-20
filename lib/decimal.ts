import Decimal from "decimal.js";

/**
 * 財務計算工具函式（強制使用 Decimal.js，符合 PRD「浮點數零容忍」要求）
 */

/**
 * 建立 Decimal 實例
 */
export function decimal(value: string | number): Decimal {
  return new Decimal(value);
}

/**
 * 加法
 */
export function add(a: string | number, b: string | number): Decimal {
  return new Decimal(a).plus(b);
}

/**
 * 減法
 */
export function subtract(a: string | number, b: string | number): Decimal {
  return new Decimal(a).minus(b);
}

/**
 * 乘法
 */
export function multiply(a: string | number, b: string | number): Decimal {
  return new Decimal(a).times(b);
}

/**
 * 除法
 */
export function divide(a: string | number, b: string | number): Decimal {
  return new Decimal(a).dividedBy(b);
}

/**
 * 格式化金額為字串（兩位小數）
 */
export function formatAmount(value: string | number | Decimal): string {
  const decimalValue = value instanceof Decimal ? value : new Decimal(value);
  return decimalValue.toFixed(2);
}

/**
 * 格式化金額為顯示用字串（含千分位逗號）
 */
export function formatCurrency(value: string | number | Decimal, currency = "TWD"): string {
  const decimalValue = value instanceof Decimal ? value : new Decimal(value);
  const formatted = decimalValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  if (currency === "TWD") {
    return `NT$ ${formatted}`;
  }

  return `${currency} ${formatted}`;
}

/**
 * 計算總和
 */
export function sum(values: (string | number | Decimal)[]): Decimal {
  return values.reduce(
    (acc, val) => acc.plus(val instanceof Decimal ? val : new Decimal(val)),
    new Decimal(0)
  );
}
