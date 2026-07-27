// 账单类型
export type TransactionType = 'income' | 'expense';

// 账户类型
export type AccountType = 'cash' | 'debit' | 'credit' | 'alipay' | 'wechat';

// 支出范围（公共/私用）
export type CategoryScope = 'public' | 'private';

// 账单记录
export interface Transaction {
  id?: number;
  type: TransactionType;
  amount: number; // 单位：分
  categoryId: string;
  accountId: string;
  date: string; // YYYY-MM-DD
  note: string;
  createdAt: Date;
}

// 账户
export interface Account {
  id: string;
  name: string;
  type: AccountType;
  initialBalance: number; // 单位：分
  createdAt: Date;
}

// 分类
export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
  scope: CategoryScope; // 仅对支出分类有意义
  isDefault: boolean;
}

// 账户类型映射
export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  cash: '现金',
  debit: '储蓄卡',
  credit: '信用卡',
  alipay: '支付宝',
  wechat: '微信',
};

export const ACCOUNT_TYPE_ICONS: Record<AccountType, string> = {
  cash: '💵',
  debit: '💳',
  credit: '💳',
  alipay: '🔵',
  wechat: '🟢',
};

export const SCOPE_LABELS: Record<CategoryScope, string> = {
  public: '公共',
  private: '私用',
};

export const SCOPE_ICONS: Record<CategoryScope, string> = {
  public: '🏠',
  private: '👤',
};

export const SCOPE_COLORS: Record<CategoryScope, string> = {
  public: '#ff85c0',
  private: '#b37feb',
};

// 筛选条件
export interface BillFilter {
  type?: TransactionType | 'all';
  categoryId?: string;
  accountId?: string;
  scope?: CategoryScope | 'all';
  startDate?: string;
  endDate?: string;
}

// 统计数据类型
export interface MonthlySummary {
  month: string;
  income: number;
  expense: number;
}

export interface CategorySummary {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  amount: number;
  percentage: number;
}
