import { useState, useEffect } from 'react';
import { Button, Dialog, Input, Toast, SpinLoading } from 'antd-mobile';
import { useAppContext } from '../context/AppContext';
import { db } from '../db';
import type { AccountType } from '../types';
import { ACCOUNT_TYPE_LABELS, ACCOUNT_TYPE_ICONS } from '../types';
import { formatAmount, generateId } from '../utils/format';
import { playAddSound, playDeleteSound } from '../utils/sound';

const ACCOUNT_TYPES: AccountType[] = ['cash', 'debit', 'credit', 'alipay', 'wechat'];

export default function Accounts() {
  const { state, dispatch } = useAppContext();
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<AccountType>('cash');
  const [newBalance, setNewBalance] = useState('');

  useEffect(() => {
    loadBalances();
  }, [state.accounts]);

  const loadBalances = async () => {
    setLoading(true);
    const bal: Record<string, number> = {};
    for (const acc of state.accounts) {
      bal[acc.id] = await db.getAccountBalance(acc.id);
    }
    setBalances(bal);
    setLoading(false);
  };

  const handleAddAccount = async () => {
    if (!newName.trim()) {
      Toast.show({ content: '请输入账户名称', position: 'top' });
      return;
    }

    const initialBalance = parseFloat(newBalance) || 0;
    const account = {
      id: generateId(),
      name: newName.trim(),
      type: newType,
      initialBalance: Math.round(initialBalance * 100),
      createdAt: new Date(),
    };

    await db.accounts.add(account);
    dispatch({ type: 'ADD_ACCOUNT', payload: account });
    playAddSound();
    Toast.show({ content: '账户已添加 💖', position: 'top' });
    setShowAdd(false);
    setNewName('');
    setNewBalance('');
  };

  const handleDeleteAccount = async (id: string) => {
    const result = await Dialog.confirm({
      content: '删除账户将同时删除该账户下的所有账单，确定继续？',
      confirmText: '确定删除',
      cancelText: '取消',
    });

    if (result) {
      playDeleteSound();
      await db.transactions.where('accountId').equals(id).delete();
      await db.accounts.delete(id);
      dispatch({ type: 'DELETE_ACCOUNT', payload: id });
      Toast.show({ content: '已删除 🗑️', position: 'top' });
    }
  };

  const totalBalance = Object.values(balances).reduce((a, b) => a + b, 0);

  if (loading) {
    return (
      <div className="loading-container">
        <SpinLoading color="primary" />
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 20 }}>
      {/* 总资产 */}
      <div
        style={{
          background: 'linear-gradient(135deg, #7bed9f 0%, #26de81 50%, #20bf6b 100%)',
          color: 'white',
          padding: '28px 16px 24px',
          textAlign: 'center',
          borderRadius: '0 0 28px 28px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{
          position: 'absolute',
          top: -15, left: '10%',
          width: 80, height: 80,
          borderRadius: 40,
          background: 'rgba(255,255,255,0.08)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: -20, right: '5%',
          width: 50, height: 50,
          borderRadius: 25,
          background: 'rgba(255,255,255,0.1)',
        }} />
        <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 6 }}>💎 总资产</div>
        <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: 1 }}>
          ¥{formatAmount(totalBalance)}
        </div>
      </div>

      {/* 账户列表 */}
      <div style={{ padding: '16px 12px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 14,
          }}
        >
          <span style={{ fontSize: 17, fontWeight: 700 }}>💳 我的账户</span>
          <Button
            size="small"
            color="primary"
            onClick={() => setShowAdd(true)}
            style={{
              borderRadius: 20,
              '--background-color': '#ff85c0',
              borderColor: '#ff85c0',
            } as any}
          >
            ➕ 添加
          </Button>
        </div>

        {state.accounts.map((acc) => (
          <div
            key={acc.id}
            className="card"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              margin: '0 0 10px',
              animation: 'popIn 0.3s ease backwards',
            }}
          >
            <span style={{ fontSize: 36 }}>{ACCOUNT_TYPE_ICONS[acc.type]}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{acc.name}</div>
              <div style={{ fontSize: 12, color: '#b0b0b0', marginTop: 2 }}>
                {ACCOUNT_TYPE_LABELS[acc.type]}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: (balances[acc.id] || 0) >= 0 ? '#7bed9f' : '#ff6b81',
                }}
              >
                ¥{formatAmount(balances[acc.id] || 0)}
              </div>
            </div>
            <button
              onClick={() => handleDeleteAccount(acc.id)}
              style={{
                border: 'none',
                background: 'transparent',
                color: '#ffcdd2',
                fontSize: 20,
                cursor: 'pointer',
                padding: '4px 8px',
              }}
            >
              ✕
            </button>
          </div>
        ))}

        {state.accounts.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">💳</div>
            <div className="empty-text">还没有账户，点击上方按钮添加~</div>
          </div>
        )}
      </div>

      {/* 添加账户弹窗 */}
      <Dialog
        visible={showAdd}
        title="✨ 添加账户"
        content={
          <div style={{ padding: '12px 0' }}>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, color: '#8e8e93', marginBottom: 6 }}>账户名称</div>
              <Input
                placeholder="如：工资卡、零钱包"
                value={newName}
                onChange={setNewName}
                style={{ '--border-color': '#ffe0ec' } as any}
              />
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, color: '#8e8e93', marginBottom: 6 }}>账户类型</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {ACCOUNT_TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setNewType(t)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 18,
                      border: `2px solid ${newType === t ? '#ff85c0' : '#ffe0ec'}`,
                      background: newType === t ? '#fff0f5' : 'white',
                      color: newType === t ? '#ff85c0' : '#8e8e93',
                      fontSize: 13,
                      cursor: 'pointer',
                      fontWeight: 600,
                      transition: 'all 0.2s',
                    }}
                  >
                    {ACCOUNT_TYPE_ICONS[t]} {ACCOUNT_TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 13, color: '#8e8e93', marginBottom: 6 }}>初始余额（元）</div>
              <Input
                placeholder="0.00"
                value={newBalance}
                onChange={setNewBalance}
                type="number"
                style={{ '--border-color': '#ffe0ec' } as any}
              />
            </div>
          </div>
        }
        onClose={() => setShowAdd(false)}
        actions={[
          [
            { key: 'cancel', text: '取消', onClick: () => setShowAdd(false) },
            { key: 'confirm', text: '确定', style: { color: '#ff85c0' }, onClick: handleAddAccount },
          ],
        ]}
      />
    </div>
  );
}
