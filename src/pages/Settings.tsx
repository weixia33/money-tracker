import { useState } from 'react';
import { Dialog, Input, Toast, Button } from 'antd-mobile';
import { useAppContext } from '../context/AppContext';
import { db } from '../db';
import type { TransactionType, CategoryScope } from '../types';
import { formatAmount, generateId, exportToCSV } from '../utils/format';
import { playAddSound, playDeleteSound, playClickSound } from '../utils/sound';

export default function Settings() {
  const { state, dispatch } = useAppContext();

  const [showAddCat, setShowAddCat] = useState(false);
  const [catType, setCatType] = useState<TransactionType>('expense');
  const [catScope, setCatScope] = useState<CategoryScope>('public');
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('📦');

  const handleAddCategory = async () => {
    if (!catName.trim()) {
      Toast.show({ content: '请输入分类名称', position: 'top' });
      return;
    }

    const category = {
      id: generateId(),
      name: catName.trim(),
      type: catType,
      icon: catIcon,
      scope: catType === 'expense' ? catScope : 'public',
      isDefault: false,
    };

    await db.categories.add(category);
    dispatch({ type: 'ADD_CATEGORY', payload: category });
    playAddSound();
    Toast.show({ content: '分类已添加 ✨', position: 'top' });
    setShowAddCat(false);
    setCatName('');
  };

  const handleDeleteCategory = async (id: string, isDefault: boolean) => {
    if (isDefault) {
      Toast.show({ content: '预设分类不可删除', position: 'top' });
      return;
    }

    const result = await Dialog.confirm({
      content: '确定删除此分类？',
      confirmText: '确定',
      cancelText: '取消',
    });

    if (result) {
      playDeleteSound();
      await db.categories.delete(id);
      dispatch({ type: 'DELETE_CATEGORY', payload: id });
      Toast.show({ content: '已删除 🗑️', position: 'top' });
    }
  };

  const handleExportCSV = async () => {
    const transactions = await db.transactions.orderBy('date').reverse().toArray();
    if (transactions.length === 0) {
      Toast.show({ content: '没有可导出的数据', position: 'top' });
      return;
    }

    const exportData = transactions.map((t) => {
      const cat = state.categories.find((c) => c.id === t.categoryId);
      const acc = state.accounts.find((a) => a.id === t.accountId);
      return {
        日期: t.date,
        类型: t.type === 'expense' ? '支出' : '收入',
        金额: formatAmount(t.amount),
        分类: cat?.name || '未知',
        范围: cat?.scope === 'public' ? '公共' : cat?.scope === 'private' ? '私用' : '-',
        账户: acc?.name || '未知',
        备注: t.note,
      };
    });

    const now = new Date();
    const filename = `账单导出_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}.csv`;
    exportToCSV(exportData, filename);
    Toast.show({ content: '导出成功 📄', position: 'top' });
  };

  const handleClearAll = async () => {
    const result = await Dialog.confirm({
      content: '此操作将清空所有账单数据，不可恢复！确定继续？',
      confirmText: '确定清空',
      cancelText: '取消',
    });

    if (result) {
      await db.transactions.clear();
      Toast.show({ content: '数据已清空 💫', position: 'top' });
    }
  };

  const expensePublic = state.categories.filter((c) => c.type === 'expense' && c.scope === 'public');
  const expensePrivate = state.categories.filter((c) => c.type === 'expense' && c.scope === 'private');
  const incomeCats = state.categories.filter((c) => c.type === 'income');

  return (
    <div style={{ paddingBottom: 20 }}>
      <div className="page-title">⚙️ 设置</div>

      {/* 公共支出分类 */}
      <div className="card">
        <SectionHeader
          title="🏠 公共支出分类"
          onAdd={() => {
            setCatType('expense');
            setCatScope('public');
            setShowAddCat(true);
          }}
        />
        <CategoryTags
          cats={expensePublic}
          onDelete={(id, isDefault) => handleDeleteCategory(id, isDefault)}
        />
      </div>

      {/* 私用支出分类 */}
      <div className="card" style={{ marginTop: 0 }}>
        <SectionHeader
          title="👤 私用支出分类"
          onAdd={() => {
            setCatType('expense');
            setCatScope('private');
            setShowAddCat(true);
          }}
        />
        <CategoryTags
          cats={expensePrivate}
          onDelete={(id, isDefault) => handleDeleteCategory(id, isDefault)}
        />
      </div>

      {/* 收入分类 */}
      <div className="card" style={{ marginTop: 0 }}>
        <SectionHeader
          title="💰 收入分类"
          onAdd={() => {
            setCatType('income');
            setCatScope('public');
            setShowAddCat(true);
          }}
        />
        <CategoryTags
          cats={incomeCats}
          onDelete={(id, isDefault) => handleDeleteCategory(id, isDefault)}
        />
      </div>

      {/* 数据操作 */}
      <div className="card">
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>🗂️ 数据管理</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Button block onClick={handleExportCSV} style={{ borderRadius: 12, height: 42 }}>
            📄 导出账单 CSV
          </Button>
          <Button
            block
            color="danger"
            onClick={handleClearAll}
            style={{ borderRadius: 12, height: 42 }}
          >
            🗑️ 清空所有账单
          </Button>
        </div>
      </div>

      {/* 关于 */}
      <div className="card" style={{ textAlign: 'center', background: '#fff0f5' }}>
        <div style={{ fontSize: 14, color: '#ff85c0', fontWeight: 600 }}>🌸 记账助手 v2.0</div>
        <div style={{ fontSize: 12, color: '#b0b0b0', marginTop: 4 }}>
          数据仅保存在本地浏览器 · Made with 💖
        </div>
      </div>

      {/* 添加分类弹窗 */}
      <Dialog
        visible={showAddCat}
        title={`✨ 添加${catType === 'expense' ? (catScope === 'public' ? '公共' : '私用') : ''}分类`}
        content={
          <div style={{ padding: '12px 0' }}>
            {/* scope 选择（仅支出） */}
            {catType === 'expense' && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 13, color: '#8e8e93', marginBottom: 6 }}>范围</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => { playClickSound(); setCatScope('public'); }}
                    style={{
                      flex: 1, padding: 8, borderRadius: 10,
                      border: `2px solid ${catScope === 'public' ? '#ff85c0' : '#ffe0ec'}`,
                      background: catScope === 'public' ? '#fff0f5' : 'white',
                      color: catScope === 'public' ? '#ff85c0' : '#8e8e93',
                      cursor: 'pointer', fontWeight: 600,
                    }}
                  >
                    🏠 公共
                  </button>
                  <button
                    onClick={() => { playClickSound(); setCatScope('private'); }}
                    style={{
                      flex: 1, padding: 8, borderRadius: 10,
                      border: `2px solid ${catScope === 'private' ? '#b37feb' : '#ffe0ec'}`,
                      background: catScope === 'private' ? '#f3edff' : 'white',
                      color: catScope === 'private' ? '#b37feb' : '#8e8e93',
                      cursor: 'pointer', fontWeight: 600,
                    }}
                  >
                    👤 私用
                  </button>
                </div>
              </div>
            )}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, color: '#8e8e93', marginBottom: 6 }}>图标</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[
                  '🍔', '🚗', '🛒', '🏠', '🎮', '💊', '📚', '📱', '💄', '🐾',
                  '💰', '🧧', '📈', '💼', '🎁', '✈️', '🎬', '🏥', '👶', '📦',
                ].map((icon) => (
                  <button
                    key={icon}
                    onClick={() => { playClickSound(); setCatIcon(icon); }}
                    style={{
                      width: 38, height: 38, borderRadius: 10,
                      border: `2px solid ${catIcon === icon ? '#ff85c0' : '#ffe0ec'}`,
                      background: catIcon === icon ? '#fff0f5' : 'white',
                      fontSize: 20, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s',
                    }}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 13, color: '#8e8e93', marginBottom: 6 }}>名称</div>
              <Input
                placeholder="分类名称"
                value={catName}
                onChange={setCatName}
                style={{ '--border-color': '#ffe0ec' } as any}
              />
            </div>
          </div>
        }
        onClose={() => setShowAddCat(false)}
        actions={[
          [
            { key: 'cancel', text: '取消', onClick: () => setShowAddCat(false) },
            { key: 'confirm', text: '确定', style: { color: '#ff85c0' }, onClick: handleAddCategory },
          ],
        ]}
      />
    </div>
  );
}

function SectionHeader({ title, onAdd }: { title: string; onAdd: () => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
      <span style={{ fontSize: 16, fontWeight: 700 }}>{title}</span>
      <Button
        size="small"
        color="primary"
        onClick={onAdd}
        style={{
          borderRadius: 16,
          '--background-color': '#ff85c0',
          borderColor: '#ff85c0',
        } as any}
      >
        ➕ 添加
      </Button>
    </div>
  );
}

function CategoryTags({
  cats,
  onDelete,
}: {
  cats: { id: string; icon: string; name: string; isDefault: boolean }[];
  onDelete: (id: string, isDefault: boolean) => void;
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {cats.map((cat) => (
        <div
          key={cat.id}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '5px 12px',
            borderRadius: 18,
            background: '#fff5f9',
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          <span>{cat.icon}</span>
          <span>{cat.name}</span>
          {!cat.isDefault && (
            <button
              onClick={() => onDelete(cat.id, cat.isDefault)}
              style={{
                border: 'none',
                background: 'transparent',
                color: '#ffcdd2',
                cursor: 'pointer',
                fontSize: 14,
                padding: 0,
                marginLeft: 2,
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
