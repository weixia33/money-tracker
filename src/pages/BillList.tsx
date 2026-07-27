import { useState, useEffect } from 'react';
import { SpinLoading, SwipeAction, Popup, Toast } from 'antd-mobile';
import { useAppContext } from '../context/AppContext';
import { db } from '../db';
import type { Transaction, Category, TransactionType, CategoryScope, BillFilter } from '../types';
import { formatAmount, formatDate } from '../utils/format';
import { playDeleteSound, playClickSound } from '../utils/sound';

export default function BillList() {
  const { state } = useAppContext();
  const [bills, setBills] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<BillFilter>({ type: 'all', scope: 'all' });
  const [showFilter, setShowFilter] = useState(false);
  const [totalExpense, setTotalExpense] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);

  useEffect(() => {
    loadBills();
  }, [filter]);

  const loadBills = async () => {
    setLoading(true);
    const all = await db.transactions.orderBy('date').reverse().toArray();

    let filtered = all;

    if (filter.type && filter.type !== 'all') {
      filtered = filtered.filter((t) => t.type === filter.type);
    }
    if (filter.scope && filter.scope !== 'all') {
      filtered = filtered.filter((t) => {
        if (t.type !== 'expense') return false;
        const cat = state.categories.find((c) => c.id === t.categoryId);
        return cat?.scope === filter.scope;
      });
    }
    if (filter.categoryId) {
      filtered = filtered.filter((t) => t.categoryId === filter.categoryId);
    }
    if (filter.accountId) {
      filtered = filtered.filter((t) => t.accountId === filter.accountId);
    }
    if (filter.startDate) {
      filtered = filtered.filter((t) => t.date >= filter.startDate!);
    }
    if (filter.endDate) {
      filtered = filtered.filter((t) => t.date <= filter.endDate!);
    }

    setBills(filtered);

    let exp = 0, inc = 0;
    for (const t of filtered) {
      if (t.type === 'expense') exp += t.amount;
      else inc += t.amount;
    }
    setTotalExpense(exp);
    setTotalIncome(inc);
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    playDeleteSound();
    await db.transactions.delete(id);
    Toast.show({ content: '已删除 🗑️', position: 'top' });
    loadBills();
  };

  const getCategoryInfo = (categoryId: string): Category | undefined => {
    return state.categories.find((c) => c.id === categoryId);
  };

  const getAccountName = (accountId: string): string => {
    return state.accounts.find((a) => a.id === accountId)?.name || '';
  };

  const groupedBills: Record<string, Transaction[]> = {};
  for (const bill of bills) {
    if (!groupedBills[bill.date]) groupedBills[bill.date] = [];
    groupedBills[bill.date].push(bill);
  }

  if (loading) {
    return (
      <div className="loading-container">
        <SpinLoading color="primary" />
      </div>
    );
  }

  const scopeOptions: ('all' | CategoryScope)[] = ['all', 'public', 'private'];
  const scopeLabels: Record<string, string> = { all: '全部', public: '🏠 公共', private: '👤 私用' };

  return (
    <div>
      {/* 顶部汇总 */}
      <div
        style={{
          background: 'linear-gradient(135deg, #fff0f5, #f3edff)',
          padding: '16px',
          display: 'flex',
          justifyContent: 'space-around',
          borderRadius: '0 0 20px 20px',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#8e8e93' }}>💗 支出</div>
          <div className="amount-expense" style={{ fontSize: 18 }}>
            {formatAmount(totalExpense)}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#8e8e93' }}>💚 收入</div>
          <div className="amount-income" style={{ fontSize: 18 }}>
            {formatAmount(totalIncome)}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#8e8e93' }}>📝 笔数</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#ff85c0' }}>{bills.length}</div>
        </div>
      </div>

      {/* 筛选栏 */}
      <div
        style={{
          display: 'flex',
          padding: '8px 12px',
          gap: 8,
          background: 'white',
          borderBottom: '1px solid #ffe0ec',
        }}
      >
        <FilterChip
          label={filter.type === 'all' ? '全部' : filter.type === 'expense' ? '支出' : '收入'}
          active={filter.type !== 'all'}
          onClick={() => {
            playClickSound();
            const types: ('all' | TransactionType)[] = ['all', 'expense', 'income'];
            const idx = types.indexOf(filter.type || 'all');
            setFilter({ ...filter, type: types[(idx + 1) % 3] });
          }}
        />
        <FilterChip
          label={scopeLabels[filter.scope || 'all']}
          active={filter.scope !== 'all' && !!filter.scope}
          onClick={() => {
            playClickSound();
            const idx = scopeOptions.indexOf(filter.scope || 'all');
            setFilter({ ...filter, scope: scopeOptions[(idx + 1) % 3] });
          }}
        />
        <FilterChip
          label={filter.categoryId ? getCategoryInfo(filter.categoryId)?.name || '分类' : '分类'}
          active={!!filter.categoryId}
          onClick={() => { playClickSound(); setShowFilter(true); }}
        />
        <div style={{ flex: 1 }} />
        <FilterChip
          label="重置"
          active={false}
          onClick={() => setFilter({ type: 'all', scope: 'all' })}
        />
      </div>

      {/* 账单列表 */}
      {bills.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🌸</div>
          <div className="empty-text">暂无账单记录~</div>
        </div>
      ) : (
        Object.entries(groupedBills).map(([date, dayBills]) => (
          <div key={date}>
            <div className="date-header">{formatDate(date)}</div>
            <div style={{ background: 'white', margin: '0 8px', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(255,133,192,0.06)' }}>
              {dayBills.map((bill, idx) => {
                const cat = getCategoryInfo(bill.categoryId);
                return (
                  <SwipeAction
                    key={bill.id}
                    rightActions={[{
                      key: 'delete',
                      text: '删除',
                      color: 'danger',
                      onClick: () => handleDelete(bill.id!),
                    }]}
                  >
                    <div className="bill-item" style={{ borderBottom: idx < dayBills.length - 1 ? '1px solid #fff5f9' : 'none' }}>
                      <span className="bill-icon">{cat?.icon || '📦'}</span>
                      <div className="bill-info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className="bill-category">{cat?.name || '未知'}</span>
                          {bill.type === 'expense' && cat?.scope && (
                            <span className={`scope-tag scope-${cat.scope}`}>
                              {cat.scope === 'public' ? '🏠' : '👤'}
                            </span>
                          )}
                        </div>
                        <div className="bill-note">
                          {getAccountName(bill.accountId)}
                          {bill.note ? ` · ${bill.note}` : ''}
                        </div>
                      </div>
                      <div>
                        <div className={bill.type === 'income' ? 'amount-income' : 'amount-expense'}>
                          {bill.type === 'income' ? '+' : '-'}{formatAmount(bill.amount)}
                        </div>
                      </div>
                    </div>
                  </SwipeAction>
                );
              })}
            </div>
          </div>
        ))
      )}

      {/* 分类筛选弹窗 */}
      <Popup
        visible={showFilter}
        onMaskClick={() => setShowFilter(false)}
        bodyStyle={{ borderTopLeftRadius: 20, borderTopRightRadius: 20, minHeight: '40vh' }}
      >
        <div style={{ padding: 20 }}>
          <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>🗂️ 按分类筛选</div>
          <div className="category-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {state.categories.map((cat) => (
              <div
                key={cat.id}
                className={`category-item ${filter.categoryId === cat.id ? 'selected' : ''}`}
                onClick={() => {
                  playClickSound();
                  setFilter({
                    ...filter,
                    categoryId: filter.categoryId === cat.id ? undefined : cat.id,
                  });
                  setShowFilter(false);
                }}
              >
                <span className="cat-icon">{cat.icon}</span>
                <span className="cat-name">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      </Popup>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 12px',
        borderRadius: 16,
        border: `1px solid ${active ? '#ff85c0' : '#ffe0ec'}`,
        background: active ? '#fff0f5' : 'white',
        color: active ? '#ff85c0' : '#8e8e93',
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      {label}
    </button>
  );
}
