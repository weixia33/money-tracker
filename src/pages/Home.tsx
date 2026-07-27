import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SpinLoading } from 'antd-mobile';
import { useAppContext } from '../context/AppContext';
import { db } from '../db';
import type { Transaction, Category } from '../types';
import { formatAmount, getCurrentMonth, formatDate } from '../utils/format';
import { SCOPE_LABELS } from '../types';

export default function Home() {
  const navigate = useNavigate();
  const { state } = useAppContext();
  const [monthSummary, setMonthSummary] = useState({
    income: 0,
    expense: 0,
    publicExpense: 0,
    privateExpense: 0,
  });
  const [recentBills, setRecentBills] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const currentMonth = getCurrentMonth();
    const allTransactions = await db.transactions
      .orderBy('date')
      .reverse()
      .toArray();

    let income = 0;
    let expense = 0;
    let publicExpense = 0;
    let privateExpense = 0;

    for (const t of allTransactions) {
      if (!t.date.startsWith(currentMonth)) continue;
      if (t.type === 'income') {
        income += t.amount;
      } else {
        expense += t.amount;
        const cat = state.categories.find((c) => c.id === t.categoryId);
        if (cat?.scope === 'public') publicExpense += t.amount;
        else privateExpense += t.amount;
      }
    }

    setMonthSummary({ income, expense, publicExpense, privateExpense });
    setRecentBills(allTransactions.slice(0, 8));
    setLoading(false);
  };

  const getCategoryInfo = (categoryId: string): Category | undefined => {
    return state.categories.find((c) => c.id === categoryId);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <SpinLoading color="primary" />
      </div>
    );
  }

  const balance = monthSummary.income - monthSummary.expense;

  return (
    <div>
      {/* 可爱顶部卡片 */}
      <div
        style={{
          background: 'linear-gradient(135deg, #ffb3d9 0%, #ff85c0 40%, #b37feb 100%)',
          color: 'white',
          padding: '24px 20px 28px',
          borderRadius: '0 0 28px 28px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* 装饰圆点 */}
        <div style={{
          position: 'absolute',
          top: -20, right: -20,
          width: 100, height: 100,
          borderRadius: 50,
          background: 'rgba(255,255,255,0.1)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: -30, left: '40%',
          width: 60, height: 60,
          borderRadius: 30,
          background: 'rgba(255,255,255,0.08)',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>📅</span> {formatDate(new Date().toISOString().slice(0, 10))}
          </div>

          <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 12 }}>
            本月收支概览 ✨
          </div>

          <div style={{ fontSize: 34, fontWeight: 800, marginBottom: 20, letterSpacing: 1 }}>
            {balance >= 0 ? '+' : ''}{formatAmount(balance)}
          </div>

          <div style={{ display: 'flex', gap: 32 }}>
            <div>
              <div style={{ fontSize: 11, opacity: 0.75 }}>💚 收入</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#d4ffb7' }}>
                {formatAmount(monthSummary.income)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, opacity: 0.75 }}>💗 支出</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#ffe0e0' }}>
                {formatAmount(monthSummary.expense)}
              </div>
            </div>
          </div>

          {/* 公共/私用 小条 */}
          <div style={{
            display: 'flex',
            gap: 12,
            marginTop: 18,
            background: 'rgba(255,255,255,0.15)',
            borderRadius: 14,
            padding: '10px 14px',
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, opacity: 0.75, marginBottom: 2 }}>🏠 公共</div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{formatAmount(monthSummary.publicExpense)}</div>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.2)' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, opacity: 0.75, marginBottom: 2 }}>👤 私用</div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{formatAmount(monthSummary.privateExpense)}</div>
            </div>
          </div>
        </div>

        {/* 快速记账 FAB */}
        <button
          onClick={() => navigate('/add')}
          style={{
            position: 'absolute',
            right: 20,
            top: 110,
            width: 50,
            height: 50,
            borderRadius: 25,
            border: 'none',
            background: 'rgba(255,255,255,0.3)',
            color: 'white',
            fontSize: 26,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            transition: 'transform 0.2s',
            zIndex: 1,
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.9)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          ✨
        </button>
      </div>

      {/* 最近账单 */}
      <div className="card" style={{ marginTop: 16 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 700 }}>📝 最近账单</span>
          <span
            onClick={() => navigate('/bills')}
            style={{
              fontSize: 13,
              color: '#ff85c0',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            查看全部 →
          </span>
        </div>

        {recentBills.length === 0 ? (
          <div className="empty-state" style={{ padding: '30px 0' }}>
            <div className="empty-icon">🌸</div>
            <div className="empty-text">还没有账单哦，快来记一笔吧~</div>
          </div>
        ) : (
          recentBills.map((bill) => {
            const cat = getCategoryInfo(bill.categoryId);
            return (
              <div
                key={bill.id}
                className="bill-item"
                style={{ padding: '10px 0', animation: 'slideUp 0.3s ease backwards' }}
              >
                <span className="bill-icon">{cat?.icon || '📦'}</span>
                <div className="bill-info">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="bill-category">{cat?.name || '未知'}</span>
                    {bill.type === 'expense' && cat?.scope && (
                      <span className={`scope-tag scope-${cat.scope}`}>
                        {SCOPE_LABELS[cat.scope]}
                      </span>
                    )}
                  </div>
                  <div className="bill-note">
                    {bill.note || formatDate(bill.date)}
                  </div>
                </div>
                <div>
                  <div className={bill.type === 'income' ? 'amount-income' : 'amount-expense'}>
                    {bill.type === 'income' ? '+' : '-'}{formatAmount(bill.amount)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
