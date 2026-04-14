import { db, CATEGORIAS_GASTO, CATEGORIAS_INGRESO } from '../db';
import s from './Dashboard.module.css';
import sh from '../shared.module.css';

export default function Dashboard({ app, navigate }) {
  const { usuario, config, gastos, ingresos, metas } = app;
  const monthG = db.getMonthGastos();
  const monthI = db.getMonthIngresos();
  const todayG = db.getTodayGastos();
  const totalMes = db.sumMonto(monthG);
  const totalIng = db.sumMonto(monthI);
  const balance = totalIng - totalMes;
  const totalHoy = db.sumMonto(todayG);
  const remaining = config.presupuesto_diario - totalHoy;
  const pct = Math.min(100, (totalHoy / config.presupuesto_diario) * 100);
  const totalDeuda = db.totalDeudaPendiente();
  const impulsivos = monthG.filter(g => g.impulso).length;

  const h = new Date().getHours();
  const greeting = h < 12 ? 'Buenos días' : h < 18 ? 'Buenas tardes' : 'Buenas noches';
  const greetedIcon = h < 12 ? '☀️' : h < 18 ? '🌤️' : '🌙';

  const recent = [...gastos.slice(0, 3), ...ingresos.slice(0, 2)]
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 5);

  let dailyMsg = '✅ Vas bien con tu presupuesto de hoy.';
  if (totalHoy === 0) dailyMsg = '✨ ¡Sin gastos hoy! Sigue así.';
  else if (pct >= 100) dailyMsg = '🚨 ¡Superaste tu presupuesto diario!';
  else if (pct >= 75) dailyMsg = '⚠️ Llevas el 75% del presupuesto. Ve con calma.';
  else if (pct >= 50) dailyMsg = '👀 Mitad del presupuesto usado. Sigue consciente.';

  return (
    <div>
      {/* Greeting */}
      <div className={s.greeting}>
        <div>
          <h2 className={s.greetText}>{greetedIcon} {greeting}, <span>{usuario.nombre}</span></h2>
          <p className={s.greetSub}>Aquí está tu resumen financiero</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className={s.statsGrid}>
        <StatCard icon="📈" label="Ingresos" value={db.formatMXN(totalIng)} color="income" />
        <StatCard icon="📉" label="Gastos" value={db.formatMXN(totalMes)} color="expense" />
        <StatCard icon="💎" label="Balance" value={db.formatMXN(balance)} color={balance >= 0 ? 'balance' : 'debt'} />
        <StatCard icon="💳" label="Deudas" value={db.formatMXN(totalDeuda)} color="debt" />
      </div>

      {/* Impulse alert */}
      {impulsivos >= 3 && (
        <div className={s.habitAlert}>
          <span className={s.alertIcon}>🧠</span>
          <div>
            <strong>{impulsivos} gastos impulsivos este mes</strong>
            <p>¿Necesitas activar el Modo Disciplina?</p>
          </div>
          <button className={sh.btnSmall} onClick={() => { app.setConfig({ ...config, modo_disciplina: true }); app.showToast('⚔️ Modo Disciplina ACTIVADO', 'success'); }}>
            Activar ⚔️
          </button>
        </div>
      )}

      {/* Daily Summary */}
      <section className={s.section}>
        <h3 className={s.sectionTitle}>📅 Resumen de Hoy</h3>
        <div className={s.dailyCard}>
          <div className={s.dailyRow}>
            <span>Gastado hoy</span>
            <strong className={s.dailyAmount}>{db.formatMXN(totalHoy)}</strong>
          </div>
          <div className={s.dailyRow}>
            <span>Presupuesto restante</span>
            <strong className={`${s.dailyAmount} ${remaining < 0 ? s.red : s.green}`}>
              {db.formatMXN(Math.abs(remaining))}
            </strong>
          </div>
          <div className={s.progressWrap}>
            <div className={`${s.progressFill} ${pct >= 90 ? s.progressDanger : ''}`} style={{ width: `${pct}%` }} />
          </div>
          <p className={s.dailyMsg}>{dailyMsg}</p>
        </div>
      </section>

      {/* Savings Goals */}
      <section className={s.section}>
        <div className={sh.sectionHeader}>
          <h3 className={s.sectionTitle} style={{marginBottom:0}}>🎯 Metas de Ahorro</h3>
          <button className={sh.btnSmall} onClick={() => navigate('metas')}>Ver todas</button>
        </div>
        {metas.length === 0 ? (
          <div className={s.emptyMini}>
            <span>🎯 Sin metas —</span>
            <button className={sh.btnSmall} onClick={() => navigate('metas')}>Crear meta</button>
          </div>
        ) : (
          metas.slice(0, 2).map(m => <GoalPreview key={m.id} meta={m} />)
        )}
      </section>

      {/* Recent Transactions */}
      <section className={s.section}>
        <div className={sh.sectionHeader}>
          <h3 className={s.sectionTitle} style={{marginBottom:0}}>🕐 Últimos Movimientos</h3>
          <button className={sh.btnSmall} onClick={() => navigate('reportes')}>Ver más</button>
        </div>
        {recent.length === 0 ? (
          <p className={s.emptyText}>Sin movimientos aún. ¡Registra tu primer gasto!</p>
        ) : (
          recent.map(t => <TransItem key={t.id} t={t} />)
        )}
      </section>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className={`${s.statCard} ${s[color]}`}>
      <span className={s.statIcon}>{icon}</span>
      <div>
        <span className={s.statLabel}>{label}</span>
        <span className={s.statValue}>{value}</span>
      </div>
    </div>
  );
}

function GoalPreview({ meta }) {
  const pct = Math.min(100, Math.round((meta.monto_actual / meta.monto_objetivo) * 100)) || 0;
  return (
    <div className={s.goalPreview}>
      <div className={s.goalRow}>
        <span className={s.goalName}>{pct >= 100 ? '✅ ' : '🎯 '}{meta.nombre}</span>
        <span className={s.goalPct} style={{ color: meta.color }}>{pct}%</span>
      </div>
      <div className={s.goalBar}>
        <div className={s.goalFill} style={{ width: `${pct}%`, background: meta.color }} />
      </div>
      <div className={s.goalAmounts}>
        <span style={{ color: meta.color }}>{db.formatMXN(meta.monto_actual)}</span>
        <span className={s.goalTarget}>/ {db.formatMXN(meta.monto_objetivo)}</span>
      </div>
    </div>
  );
}

function TransItem({ t }) {
  const isGasto = t.necesario !== undefined;
  const cats = isGasto ? CATEGORIAS_GASTO : CATEGORIAS_INGRESO;
  const cat = cats[t.categoria] || { emoji: '📦', label: t.categoria };
  return (
    <div className={s.transItem}>
      <div className={`${s.transIcon} ${isGasto ? s.gastoIcon : s.ingresoIcon}`}>{cat.emoji}</div>
      <div className={s.transBody}>
        <div className={s.transDesc}>{t.descripcion}</div>
        <div className={s.transMeta}>
          {db.formatDate(t.fecha)}
          <span className={s.catBadge}>{cat.label}</span>
          {t.impulso && <span className={s.impBadge}>⚡impulso</span>}
        </div>
      </div>
      <span className={`${s.transAmt} ${isGasto ? s.red : s.green}`}>
        {isGasto ? '-' : '+'}{db.formatMXN(t.monto)}
      </span>
    </div>
  );
}
