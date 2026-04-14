import { db, NIVELES, LOGROS_DEF, calcNivel } from '../db';
import s from './Gamificacion.module.css';
import sh from '../shared.module.css';

export default function Gamificacion({ app }) {
  const { usuario, gastos, metas, deudas, logros } = app;
  const puntos = usuario.puntos || 0;
  const nivelIdx = calcNivel(puntos);
  const nivel = NIVELES[nivelIdx];
  const nextNivel = NIVELES[nivelIdx + 1];

  const pctXP = nextNivel 
    ? Math.min(100, Math.round(((puntos - nivel.xp) / (nextNivel.xp - nivel.xp)) * 100))
    : 100;

  const totalGastado = db.sumMonto(gastos);
  const totalAhorrado = metas.reduce((s, m) => s + (m.monto_actual || 0), 0);
  const impulsivos = gastos.filter(g => g.impulso).length;
  const deudasLiquidadas = deudas.filter(d => d.monto_pagado >= d.monto_total).length;

  const stats = [
    { icon: '💸', label: 'Total Gastado', value: db.formatMXN(totalGastado) },
    { icon: '💰', label: 'Total Ahorrado', value: db.formatMXN(totalAhorrado) },
    { icon: '🧠', label: 'Gastos Impulsivos', value: impulsivos },
    { icon: '✅', label: 'Deudas Pagadas', value: deudasLiquidadas },
  ];

  return (
    <div>
      <div className={sh.viewHeader}>
        <h2>🎮 Mi Progreso</h2>
      </div>

      <div className={s.levelCard}>
        <div className={s.levelIcon}>{nivel.icon}</div>
        <div className={s.levelInfo}>
          <h3>{nivel.nombre}</h3>
          <p>{nivel.desc}</p>
          <div className={s.xpBarWrap}>
            <div className={s.xpBarFill} style={{ width: `${pctXP}%` }} />
          </div>
          <small className={s.xpText}>
            {nextNivel 
              ? `${puntos} / ${nextNivel.xp} XP para "${nextNivel.nombre}"`
              : '¡Nivel máximo alcanzado! 🏆'}
          </small>
        </div>
      </div>

      <section className={s.section}>
        <h3>🏆 Logros</h3>
        <div className={s.achievementsGrid}>
          {Object.entries(LOGROS_DEF).map(([key, def]) => {
            const unlocked = logros[key];
            return (
              <div key={key} className={`${s.achievementCard} ${unlocked ? s.unlocked : s.locked}`}>
                <div className={s.achIcon}>{def.icon}</div>
                <div className={s.achName}>{def.nombre}</div>
                {!unlocked && <div className={s.lock}>🔒</div>}
              </div>
            );
          })}
        </div>
      </section>

      <section className={s.section}>
        <h3>📊 Estadísticas Personales</h3>
        <div className={s.statsGrid}>
          {stats.map((st, i) => (
            <div key={i} className={s.statCard}>
              <div className={s.statIcon}>{st.icon}</div>
              <div className={s.statLabel}>{st.label}</div>
              <div className={s.statValue}>{st.value}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
