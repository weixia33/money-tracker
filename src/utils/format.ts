// 分 -> 元，带千分位
export function formatAmount(cents: number): string {
  const yuan = cents / 100;
  return yuan.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// 分 -> 元（纯数字）
export function centsToYuan(cents: number): number {
  return Math.round(cents) / 100;
}

// 元 -> 分
export function yuanToCents(yuan: number): number {
  return Math.round(yuan * 100);
}

// 获取月份标识 YYYY-MM
export function getMonthKey(dateStr: string): string {
  return dateStr.substring(0, 7);
}

// 获取当前月份 YYYY-MM
export function getCurrentMonth(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

// 获取今天日期 YYYY-MM-DD
export function getToday(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// 日期格式化显示
export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const w = weekDays[d.getDay()];
  return `${m}月${day}日 周${w}`;
}

// 月份格式化显示
export function formatMonth(monthKey: string): string {
  const [y, m] = monthKey.split('-');
  return `${y}年${parseInt(m)}月`;
}

// 生成 UUID
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// 导出 CSV
export function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvContent =
    '\uFEFF' +
    headers.join(',') +
    '\n' +
    data
      .map((row) =>
        headers
          .map((h) => {
            const val = String(row[h] ?? '');
            return val.includes(',') ? `"${val}"` : val;
          })
          .join(',')
      )
      .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
