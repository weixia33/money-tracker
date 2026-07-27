import Dexie from 'dexie';
import type { Table } from 'dexie';
import type { Transaction, Account, Category } from '../types';
import { generateId } from '../utils/format';

export class MoneyTrackerDB extends Dexie {
  transactions!: Table<Transaction, number>;
  accounts!: Table<Account, string>;
  categories!: Table<Category, string>;

  constructor() {
    super('MoneyTrackerDB');
    this.version(2).stores({
      transactions: '++id, type, categoryId, accountId, date, amount',
      accounts: 'id, type',
      categories: 'id, type, scope',
    });
  }

  async seedData() {
    const catCount = await this.categories.count();
    if (catCount > 0) return;

    // 预设支出分类 — 公共
    const publicExpenseCategories: Category[] = [
      { id: 'cat-food', name: '餐饮', type: 'expense', icon: '🍔', scope: 'public', isDefault: true },
      { id: 'cat-housing', name: '住房', type: 'expense', icon: '🏠', scope: 'public', isDefault: true },
      { id: 'cat-transport', name: '交通', type: 'expense', icon: '🚗', scope: 'public', isDefault: true },
      { id: 'cat-communication', name: '通讯', type: 'expense', icon: '📱', scope: 'public', isDefault: true },
      { id: 'cat-medical', name: '医疗', type: 'expense', icon: '💊', scope: 'public', isDefault: true },
      { id: 'cat-education', name: '教育', type: 'expense', icon: '📚', scope: 'public', isDefault: true },
      { id: 'cat-other-public', name: '其他公共', type: 'expense', icon: '📦', scope: 'public', isDefault: true },
    ];

    // 预设支出分类 — 私用
    const privateExpenseCategories: Category[] = [
      { id: 'cat-shopping', name: '购物', type: 'expense', icon: '🛒', scope: 'private', isDefault: true },
      { id: 'cat-entertainment', name: '娱乐', type: 'expense', icon: '🎮', scope: 'private', isDefault: true },
      { id: 'cat-beauty', name: '美容', type: 'expense', icon: '💄', scope: 'private', isDefault: true },
      { id: 'cat-pet', name: '宠物', type: 'expense', icon: '🐾', scope: 'private', isDefault: true },
      { id: 'cat-other-private', name: '其他私用', type: 'expense', icon: '🎁', scope: 'private', isDefault: true },
    ];

    // 预设收入分类
    const incomeCategories: Category[] = [
      { id: 'cat-salary', name: '工资', type: 'income', icon: '💰', scope: 'public', isDefault: true },
      { id: 'cat-bonus', name: '奖金', type: 'income', icon: '🧧', scope: 'public', isDefault: true },
      { id: 'cat-investment', name: '投资', type: 'income', icon: '📈', scope: 'public', isDefault: true },
      { id: 'cat-parttime', name: '兼职', type: 'income', icon: '💼', scope: 'public', isDefault: true },
      { id: 'cat-refund', name: '退款', type: 'income', icon: '↩️', scope: 'public', isDefault: true },
      { id: 'cat-other-income', name: '其他收入', type: 'income', icon: '🎀', scope: 'public', isDefault: true },
    ];

    await this.categories.bulkAdd([...publicExpenseCategories, ...privateExpenseCategories, ...incomeCategories]);

    // 默认账户
    const defaultAccounts: Account[] = [
      { id: generateId(), name: '现金钱包', type: 'cash', initialBalance: 0, createdAt: new Date() },
      { id: generateId(), name: '工资卡', type: 'debit', initialBalance: 0, createdAt: new Date() },
    ];
    await this.accounts.bulkAdd(defaultAccounts);
  }

  async getAccountBalance(accountId: string): Promise<number> {
    const account = await this.accounts.get(accountId);
    if (!account) return 0;

    const transactions = await this.transactions
      .where('accountId')
      .equals(accountId)
      .toArray();

    let delta = 0;
    for (const t of transactions) {
      delta += t.type === 'income' ? t.amount : -t.amount;
    }

    return account.initialBalance + delta;
  }
}

export const db = new MoneyTrackerDB();
