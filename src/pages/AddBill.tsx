import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Toast, TextArea } from 'antd-mobile';
import { useAppContext } from '../context/AppContext';
import { db } from '../db';
import type { TransactionType, CategoryScope } from '../types';
import { SCOPE_LABELS } from '../types';
import { getToday, yuanToCents } from '../utils/format';
import { playSuccessSound, playClickSound, playSwitchSound } from '../utils/sound';

export default function AddBill() {
  const navigate = useNavigate();
  const { state } = useAppContext();

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedAccount, setSelectedAccount] = useState<string>(
    state.accounts[0]?.id || ''
  );
  const [date, setDate] = useState(getToday());
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // 支出时选 scope
  const [scopeFilter, setScopeFilter] = useState<CategoryScope>('public');

  const filteredCategories = state.categories.filter((c) => {
    if (c.type !== type) return false;
    if (type === 'expense') return c.scope === scopeFilter;
    return true;
  });

  const handleNumberClick = (num: string) => {
    playClickSound();
    if (num === '.') {
      if (amount.includes('.')) return;
      if (amount === '') {
        setAmount('0.');
        return;
      }
    }
    const newAmount = amount + num;
    const parts = newAmount.split('.');
    if (parts.length === 2 && parts[1].length > 2) return;
    setAmount(newAmount);
  };

  const handleDelete = () => {
    setAmount(amount.slice(0, -1));
  };

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Toast.show({ content: '请输入金额', position: 'top' });
      return;
    }
    if (!selectedCategory) {
      Toast.show({ content: '请选择分类', position: 'top' });
      return;
    }
    if (!selectedAccount) {
      Toast.show({ content: '请选择账户', position: 'top' });
      return;
    }

    setSubmitting(true);
    try {
      await db.transactions.add({
        type,
        amount: yuanToCents(numAmount),
        categoryId: selectedCategory,
        accountId: selectedAccount,
        date,
        note: note.trim(),
        createdAt: new Date(),
      });

      playSuccessSound();
      Toast.show({ content: '记账成功 ✨', position: 'top' });
      setAmount('');
      setNote('');
      setTimeout(() => navigate('/', { replace: true }), 300);
    } catch (err) {
      Toast.show({ content: '记账失败，请重试', position: 'top' });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDisplayAmount = () => {
    if (amount === '') return '0.00';
    const parts = amount.split('.');
    const intPart = parts[0] || '0';
    const decPart = parts[1] || '';
    return `${intPart}.${decPart.padEnd(2, '0')}`;
  };

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* 类型切换 */}
      <div className="type-switch">
        <button
          className={`type-switch-btn ${type === 'expense' ? 'active-expense' : ''}`}
          onClick={() => {
            playSwitchSound();
            setType('expense');
            setSelectedCategory('');
          }}
        >
          💸 支出
        </button>
        <button
          className={`type-switch-btn ${type === 'income' ? 'active-income' : ''}`}
          onClick={() => {
            playSwitchSound();
            setType('income');
            setSelectedCategory('');
          }}
        >
          💰 收入
        </button>
      </div>

      {/* 金额显示 */}
      <div className="amount-display" style={{ color: type === 'expense' ? '#ff6b81' : '#7bed9f' }}>
        <span style={{ fontSize: 24, marginRight: 8 }}>
          {type === 'income' ? '+' : '-'}
        </span>
        ¥{formatDisplayAmount()}
      </div>

      {/* scope 切换（仅支出） */}
      {type === 'expense' && (
        <div className="scope-switch">
          <button
            className={`scope-btn ${scopeFilter === 'public' ? 'active-public' : ''}`}
            onClick={() => {
              playSwitchSound();
              setScopeFilter('public');
              setSelectedCategory('');
            }}
          >
            🏠 公共
          </button>
          <button
            className={`scope-btn ${scopeFilter === 'private' ? 'active-private' : ''}`}
            onClick={() => {
              playSwitchSound();
              setScopeFilter('private');
              setSelectedCategory('');
            }}
          >
            👤 私用
          </button>
        </div>
      )}

      {/* 分类选择 */}
      <div className="card" style={{ margin: '0 12px 12px' }}>
        <div style={{ fontSize: 14, color: '#8e8e93', marginBottom: 8 }}>
          {type === 'expense' ? `${SCOPE_LABELS[scopeFilter]}分类` : '选择分类'}
        </div>
        <div className="category-grid">
          {filteredCategories.map((cat, idx) => (
            <div
              key={cat.id}
              className={`category-item ${selectedCategory === cat.id ? 'selected' : ''}`}
              style={{ animationDelay: `${idx * 0.04}s` }}
              onClick={() => {
                playClickSound();
                setSelectedCategory(cat.id);
              }}
            >
              <span className="cat-icon">{cat.icon}</span>
              <span className="cat-name">{cat.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 日期和账户 */}
      <div className="card" style={{ margin: '0 12px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ color: '#8e8e93' }}>📅 日期</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={getToday()}
            style={{
              border: '1px solid #ffe0ec',
              borderRadius: 8,
              padding: '6px 10px',
              fontSize: 14,
              color: '#4a4a4a',
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#8e8e93' }}>💳 账户</span>
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            style={{
              border: '1px solid #ffe0ec',
              borderRadius: 8,
              padding: '6px 10px',
              fontSize: 14,
              background: 'white',
              color: '#4a4a4a',
            }}
          >
            {state.accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 备注 */}
      <div className="card" style={{ margin: '0 12px 12px' }}>
        <TextArea
          placeholder="💬 添加备注（选填）"
          value={note}
          onChange={(val) => setNote(val)}
          rows={2}
          style={{ '--font-size': '14px' }}
        />
      </div>

      {/* 数字键盘 */}
      <div
        style={{
          position: 'fixed',
          bottom: 60,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 480,
          background: 'white',
          borderTop: '1px solid #ffe0ec',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
        }}
      >
        {['7', '8', '9', '4', '5', '6', '1', '2', '3', '.', '0', 'back'].map(
          (key) => (
            <button
              key={key}
              onClick={() => {
                if (key === 'back') handleDelete();
                else handleNumberClick(key);
              }}
              style={{
                height: 54,
                border: 'none',
                borderRight: '1px solid #fff5f9',
                borderBottom: '1px solid #fff5f9',
                background: 'white',
                fontSize: key === 'back' ? 16 : 24,
                fontWeight: key === 'back' ? 400 : 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: key === 'back' ? '#b0b0b0' : '#4a4a4a',
                transition: 'background 0.15s',
              }}
              onMouseDown={(e) => (e.currentTarget.style.background = '#fff5f9')}
              onMouseUp={(e) => (e.currentTarget.style.background = 'white')}
            >
              {key === 'back' ? '⌫' : key}
            </button>
          )
        )}
      </div>

      {/* 提交按钮 */}
      <div style={{
        padding: '12px',
        position: 'fixed',
        bottom: 300,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 480,
      }}>
        <Button
          block
          color="primary"
          size="large"
          loading={submitting}
          onClick={handleSubmit}
          style={{
            borderRadius: 14,
            height: 48,
            fontWeight: 700,
            fontSize: 16,
            '--background-color': 'linear-gradient(135deg, #ff85c0, #b37feb)',
            border: 'none',
            boxShadow: '0 4px 16px rgba(255, 133, 192, 0.3)',
          } as any}
        >
          💾 保存账单
        </Button>
      </div>
    </div>
  );
}
