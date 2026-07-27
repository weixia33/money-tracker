import { useState, useEffect, useRef } from 'react';
import { SpinLoading } from 'antd-mobile';
import * as echarts from 'echarts';
import { useAppContext } from '../context/AppContext';
import { db } from '../db';
import type { Transaction } from '../types';
import { centsToYuan, getCurrentMonth, formatAmount } from '../utils/format';

export default function Statistics() {
  const { state } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [summary, setSummary] = useState({
    publicExpense: 0,
    privateExpense: 0,
    totalExpense: 0,
    income: 0,
  });

  const pieChartRef = useRef<HTMLDivElement>(null);
  const scopePieRef = useRef<HTMLDivElement>(null);
  const barChartRef = useRef<HTMLDivElement>(null);
  const trendChartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadStats();
  }, [selectedMonth]);

  const loadStats = async () => {
    setLoading(true);
    const allTransactions = await db.transactions.orderBy('date').toArray();
    const monthTransactions = allTransactions.filter((t) => t.date.startsWith(selectedMonth));

    // scope 汇总
    let publicExp = 0, privateExp = 0, income = 0;
    for (const t of monthTransactions) {
      if (t.type === 'income') income += t.amount;
      else {
        const cat = state.categories.find((c) => c.id === t.categoryId);
        if (cat?.scope === 'private') privateExp += t.amount;
        else publicExp += t.amount;
      }
    }
    setSummary({
      publicExpense: publicExp,
      privateExpense: privateExp,
      totalExpense: publicExp + privateExp,
      income,
    });

    renderPieChart(monthTransactions);
    renderScopePie(publicExp, privateExp);
    renderBarChart(monthTransactions);
    const trend = calcTrend(allTransactions);
    renderTrendChart(trend);

    setLoading(false);
  };

  const calcTrend = (transactions: Transaction[]) => {
    const now = new Date();
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push(key);
    }

    return months.map((month) => {
      let income = 0;
      let expense = 0;
      for (const t of transactions) {
        if (t.date.startsWith(month)) {
          if (t.type === 'income') income += t.amount;
          else expense += t.amount;
        }
      }
      return { month, income, expense };
    });
  };

  const renderPieChart = (transactions: Transaction[]) => {
    if (!pieChartRef.current) return;
    const chart = echarts.init(pieChartRef.current);

    const categoryMap = new Map<string, number>();
    for (const t of transactions) {
      if (t.type === 'expense') {
        categoryMap.set(t.categoryId, (categoryMap.get(t.categoryId) || 0) + t.amount);
      }
    }

    const colors = [
      '#ff85c0', '#7bed9f', '#ffa502', '#54a0ff', '#a55eea',
      '#ff6b81', '#26de81', '#fd79a8', '#6c5ce7', '#00cec9',
    ];

    let idx = 0;
    const data = Array.from(categoryMap.entries()).map(([catId, amount]) => {
      const cat = state.categories.find((c) => c.id === catId);
      const d = {
        name: cat ? `${cat.icon} ${cat.name}` : '未知',
        value: centsToYuan(amount),
        itemStyle: { color: colors[idx % colors.length] },
      };
      idx++;
      return d;
    });

    chart.setOption({
      title: { text: '🌷 支出分类占比', left: 'center', textStyle: { fontSize: 14, fontWeight: 700 } },
      tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
      series: [{
        type: 'pie',
        radius: ['40%', '68%'],
        center: ['50%', '55%'],
        label: { show: true, formatter: '{b}\n{d}%', fontSize: 10 },
        emphasis: { label: { fontSize: 13, fontWeight: 'bold' } },
        data,
      }],
    });

    chart.resize();
    return () => chart.dispose();
  };

  const renderScopePie = (publicExp: number, privateExp: number) => {
    if (!scopePieRef.current) return;
    const chart = echarts.init(scopePieRef.current);

    chart.setOption({
      title: { text: '🎨 公共 vs 私用', left: 'center', textStyle: { fontSize: 14, fontWeight: 700 } },
      tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
      series: [{
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['50%', '55%'],
        label: { show: true, formatter: '{b}\n{d}%', fontSize: 11 },
        data: [
          { name: '🏠 公共', value: centsToYuan(publicExp), itemStyle: { color: '#ff85c0' } },
          { name: '👤 私用', value: centsToYuan(privateExp), itemStyle: { color: '#b37feb' } },
        ],
      }],
    });

    chart.resize();
    return () => chart.dispose();
  };

  const renderBarChart = (transactions: Transaction[]) => {
    if (!barChartRef.current) return;
    const chart = echarts.init(barChartRef.current);

    const categoryMap = new Map<string, number>();
    for (const t of transactions) {
      if (t.type === 'expense') {
        categoryMap.set(t.categoryId, (categoryMap.get(t.categoryId) || 0) + t.amount);
      }
    }

    const sorted = Array.from(categoryMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const names = sorted.map(([id]) => {
      const cat = state.categories.find((c) => c.id === id);
      return cat?.name || '未知';
    });
    const values = sorted.map(([, v]) => centsToYuan(v));

    chart.setOption({
      title: { text: '📊 分类支出排行', left: 'center', textStyle: { fontSize: 14, fontWeight: 700 } },
      tooltip: { trigger: 'axis', formatter: (p: any) => `${p[0].name}: ¥${p[0].value}` },
      grid: { left: 10, right: 20, bottom: 20, top: 35, containLabel: true },
      xAxis: { type: 'value', axisLabel: { fontSize: 10 } },
      yAxis: {
        type: 'category',
        data: names.reverse(),
        inverse: true,
        axisLabel: { fontSize: 11 },
      },
      series: [{
        type: 'bar',
        data: values.reverse().map((v) => ({
          value: v,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#ff85c0' },
              { offset: 1, color: '#b37feb' },
            ]),
            borderRadius: [0, 8, 8, 0],
          },
        })),
      }],
    });

    chart.resize();
    return () => chart.dispose();
  };

  const renderTrendChart = (trend: { month: string; income: number; expense: number }[]) => {
    if (!trendChartRef.current) return;
    const chart = echarts.init(trendChartRef.current);

    chart.setOption({
      title: { text: '📈 月度收支趋势', left: 'center', textStyle: { fontSize: 14, fontWeight: 700 } },
      tooltip: { trigger: 'axis' },
      legend: { data: ['收入', '支出'], bottom: 0, textStyle: { fontSize: 11 } },
      grid: { left: 10, right: 20, bottom: 30, top: 35, containLabel: true },
      xAxis: {
        type: 'category',
        data: trend.map((t) => t.month.substring(5)),
        axisLabel: { fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        axisLabel: { fontSize: 10, formatter: (v: number) => `¥${v}` },
      },
      series: [
        {
          name: '收入',
          type: 'line',
          data: trend.map((t) => centsToYuan(t.income)),
          smooth: true,
          lineStyle: { color: '#7bed9f', width: 3 },
          itemStyle: { color: '#7bed9f' },
          areaStyle: { color: 'rgba(123, 237, 159, 0.15)' },
          symbol: 'circle',
          symbolSize: 7,
        },
        {
          name: '支出',
          type: 'line',
          data: trend.map((t) => centsToYuan(t.expense)),
          smooth: true,
          lineStyle: { color: '#ff6b81', width: 3 },
          itemStyle: { color: '#ff6b81' },
          areaStyle: { color: 'rgba(255, 107, 129, 0.15)' },
          symbol: 'circle',
          symbolSize: 7,
        },
      ],
    });

    chart.resize();
    return () => chart.dispose();
  };

  const changeMonth = (delta: number) => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    const newMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonth);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <SpinLoading color="primary" />
      </div>
    );
  }

  const monthLabel = (() => {
    const [y, m] = selectedMonth.split('-');
    return `${y}年${parseInt(m)}月`;
  })();

  return (
    <div style={{ paddingBottom: 16 }}>
      {/* 月份切换 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '14px 16px',
          background: 'white',
          gap: 16,
          borderRadius: '0 0 16px 16px',
        }}
      >
        <button
          onClick={() => changeMonth(-1)}
          style={{
            border: 'none',
            background: '#fff0f5',
            borderRadius: '50%',
            width: 36,
            height: 36,
            fontSize: 16,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ff85c0',
          }}
        >
          ←
        </button>
        <span style={{ fontSize: 17, fontWeight: 700 }}>{monthLabel} ✨</span>
        <button
          onClick={() => changeMonth(1)}
          style={{
            border: 'none',
            background: '#fff0f5',
            borderRadius: '50%',
            width: 36,
            height: 36,
            fontSize: 16,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ff85c0',
          }}
        >
          →
        </button>
      </div>

      {/* 月度概要卡片 */}
      <div className="chart-container" style={{ display: 'flex', gap: 8, textAlign: 'center' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: '#8e8e93' }}>🏠 公共</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#ff85c0' }}>
            {formatAmount(summary.publicExpense)}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: '#8e8e93' }}>👤 私用</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#b37feb' }}>
            {formatAmount(summary.privateExpense)}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: '#8e8e93' }}>总支出</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#ff6b81' }}>
            {formatAmount(summary.totalExpense)}
          </div>
        </div>
      </div>

      {/* scope 饼图 */}
      <div className="chart-container">
        <div ref={scopePieRef} style={{ width: '100%', height: 220 }} />
      </div>

      {/* 分类饼图 */}
      <div className="chart-container">
        <div ref={pieChartRef} style={{ width: '100%', height: 260 }} />
      </div>

      {/* 柱状图 */}
      <div className="chart-container">
        <div ref={barChartRef} style={{ width: '100%', height: 280 }} />
      </div>

      {/* 趋势图 */}
      <div className="chart-container">
        <div ref={trendChartRef} style={{ width: '100%', height: 260 }} />
      </div>
    </div>
  );
}
