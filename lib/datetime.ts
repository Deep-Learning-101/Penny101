import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

// 載入 dayjs 插件
dayjs.extend(utc);
dayjs.extend(timezone);

// 台灣時區常數
export const TAIWAN_TIMEZONE = "Asia/Taipei";

/**
 * 取得當前台灣時間
 */
export function getTaiwanNow() {
  return dayjs().tz(TAIWAN_TIMEZONE);
}

/**
 * 取得今日（台灣時間）的起始時間（00:00:00）
 */
export function getTaiwanTodayStart() {
  return dayjs().tz(TAIWAN_TIMEZONE).startOf("day");
}

/**
 * 取得今日（台灣時間）的結束時間（23:59:59.999）
 */
export function getTaiwanTodayEnd() {
  return dayjs().tz(TAIWAN_TIMEZONE).endOf("day");
}

/**
 * 取得本月（台灣時間）的起始時間
 */
export function getTaiwanMonthStart() {
  return dayjs().tz(TAIWAN_TIMEZONE).startOf("month");
}

/**
 * 取得本月（台灣時間）的結束時間
 */
export function getTaiwanMonthEnd() {
  return dayjs().tz(TAIWAN_TIMEZONE).endOf("month");
}

/**
 * 將任意日期轉換為台灣時區
 */
export function toTaiwanTime(date: string | Date) {
  return dayjs(date).tz(TAIWAN_TIMEZONE);
}

/**
 * 格式化台灣時間為 ISO 8601 字串（供資料庫儲存）
 */
export function toISOString(date: dayjs.Dayjs) {
  return date.toISOString();
}

/**
 * 格式化台灣時間為顯示用字串
 */
export function formatTaiwanDate(date: string | Date, format = "YYYY-MM-DD HH:mm:ss") {
  return dayjs(date).tz(TAIWAN_TIMEZONE).format(format);
}
