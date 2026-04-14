import { useState, useMemo } from 'react';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';
import { db, CATEGORIAS_GASTO } from '../db';
import s from './Reportes.module.css';
import sh from '../shared.module.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

export default function Reportes({ app }) {
  const [period, setPeriod] = useState('mes'); // hoy | semana | mes

  const data = useMemo(() => {
    let gastos, ingresos;
    if (period === 'hoy') {
      gastos = db.getTodayGastos();
      ingresos = db.getMonthIngresos().filter(i => new Date(i.fecha).toDateString() === new Date().toDateString());
    } else if (period === 'semana') {
      gastos = db.getWeekGastos();
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      ingresos = db.getMonthIngresos().filter(i => new Date(i.fecha) >= weekAgo);
    } else {
      gastos = db.getMonthGastos();
      ingresos = db.getMonthIngresos();
    }
    return { gastos, ingresos };
  }, [period, app.gastos, app.ingresos]);

  const { gastos, ingresos } = data;
  const totalG = db.sumMonto(gastos);
  const totalI = db.sumMonto(ingresos);

  const catData = useMemo(() => {
    const totals = {};
    gastos.forEach(g => {
      totals[g.categoria] = (totals[g.categoria] || 0) + g.monto;
    });
    return {
      labels: Object.keys(totals).map(k => (CATEGORIAS_GASTO[k]?.emoji + ' ' + (CATEGORIAS_GASTO[k]?.label || k))),
      datasets: [{
        data: Object.values(totals),
        backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'],
        borderWidth: 2,
        borderColor: '#141726',
      }]
    };
  }, [gastos]);

  const balanceData = {
    labels: ['Ingresos', 'Gastos', 'Balance'],
    datasets: [{
      data: [totalI, totalG, Math.max(0, totalI - totalG)],
      backgroundColor: ['rgba(16, 185, 129, 0.7)', 'rgba(239, 68, 68, 0.7)', 'rgba(99, 102, 241, 0.7)'],
      borderRadius: 8,
    }]
  };

  const insights = useMemo(() => {
    const list = [];
    const catTotals = {};
    gastos.forEach(g => { catTotals[g.categoria] = (catTotals[g.categoria] || 0) + g.monto; });
    const topCat = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0];
    const impulsivos = gastos.filter(g => g.impulso);

    if (topCat) {
      const cat = CATEGORIAS_GASTO[topCat[0]] || { emoji: '📦', label: topCat[0] };
      list.push({ icon: cat.emoji, title: `Más gastas en: ${cat.label}`, desc: `${db.formatMXN(topCat[1])} en este período.` });
    }
    if (impulsivos.length > 0) {
      list.push({ icon: '⚠️', title: `${impulsivos.length} gastos impulsivos`, desc: `Gastaste ${db.formatMXN(db.sumMonto(impulsivos))} en impulsos.` });
    }
    if (totalI > 0 && totalG < totalI) {
      const pSaved = Math.round(((totalI - totalG) / totalI) * 100);
      list.push({ icon: '🎉', title: `Ahorraste el ${pSaved}%`, desc: `Vas por buen camino hacia tus metas.` });
    }
    if (list.length === 0) list.push({ icon: '📊', title: 'Sin datos suficientes', desc: 'Registra movimientos para ver tus hábitos.' });
    return list;
  }, [gastos, totalI, totalG]);

  return (
    <div>
      <div className={sh.viewHeader}>
        <h2>📉 Análisis y Hábitos</h2>
      </div>

      <div className={s.periodTabs}>
        {['hoy', 'semana', 'mes'].map(p => (
          <button
            key={p}
            className={`${s.periodBtn} ${period === p ? s.active : ''}`}
            onClick={() => setPeriod(p)}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      <div className={s.chartsGrid}>
        <div className={s.chartCard}>
          <h4>Gastos por Categoría</h4>
          <div className={s.chartContainer}>
            {gastos.length > 0 ? <Doughnut data={catData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#9ca3bc', font: { size: 10 }, boxWidth: 10, padding: 8 } } } }} /> : <p className={s.emptyChart}>Sin gastos</p>}
          </div>
        </div>
        <div className={s.chartCard}>
          <h4>Ingresos vs Gastos</h4>
          <div className={s.chartContainer}>
            {totalI > 0 || totalG > 0 ? <Bar data={balanceData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#9ca3bc', font: { size: 10 } }, grid: { display: false } }, y: { ticks: { color: '#9ca3bc', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' } } } }} /> : <p className={s.emptyChart}>Sin datos</p>}
          </div>
        </div>
      </div>

      <section className={s.section}>
        <h3>🧠 Insights de Hábitos</h3>
        <div className={s.insightsList}>
          {insights.map((ins, i) => (
            <div key={i} className={s.insightCard}>
              <div className={s.insIcon}>{ins.icon}</div>
              <div className={s.insBody}>
                <h5>{ins.title}</h5>
                <p>{ins.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={s.section}>
        <h3>📋 Todos los Movimientos</h3>
        <div className={s.transList}>
          {[...gastos.map(g => ({ ...g, t: 'g' })), ...ingresos.map(i => ({ ...i, t: 'i' }))]
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
            .map(item => (
              <div key={item.id} className={sh.transItem}>
                <div className={`${sh.transIcon} ${item.t === 'g' ? sh.gasto : sh.ingreso}`}>
                  {item.t === 'g' ? CATEGORIAS_GASTO[item.categoria]?.emoji || '📦' : '💵'}
                </div>
                <div className={sh.transBody}>
                  <div className={sh.transDesc}>{item.descripcion}</div>
                  <div className={sh.transMeta}>
                    {db.formatDate(item.fecha)}
                    <span className={sh.catBadge}>{item.t === 'g' ? CATEGORIAS_GASTO[item.categoria]?.label || item.categoria : 'Ingreso'}</span>
                    {item.impulso && <span className={sh.impulsoBadge}>⚡ impulso</span>}
                  </div>
                </div>
                <div className={`${sh.transAmount} ${item.t === 'g' ? sh.negative : sh.positive}`}>
                  {item.t === 'g' ? '-' : '+'}{db.formatMXN(item.monto)}
                  <button className={s.delBtn} onClick={() => { item.t === 'g' ? app.deleteGasto(item.id) : app.deleteIngreso(item.id); app.showToast('Eliminado', 'warning'); }}>🗑️</button>
                </div>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}
