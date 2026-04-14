import { useState } from 'react';
import { db, calcNivel, NIVELES } from '../db';
import s from './Header.module.css';

export default function Header({ app }) {
  const [showNotifs, setShowNotifs] = useState(false);
  const monthG = db.sumMonto(db.getMonthGastos());
  const monthI = db.sumMonto(db.getMonthIngresos());
  const balance = monthI - monthG;
  const puntos = app.usuario.puntos || 0;
  const nivel = NIVELES[calcNivel(puntos)];
  const unread = app.notifs.filter(n => !n.leida).length;

  const toggleDiscipline = () => {
    const newCfg = { ...app.config, modo_disciplina: !app.config.modo_disciplina };
    app.setConfig(newCfg);
    app.showToast(newCfg.modo_disciplina ? '⚔️ Modo Disciplina ACTIVADO' : '💤 Modo Disciplina desactivado', newCfg.modo_disciplina ? 'success' : 'warning');
  };

  return (
    <header className={s.header}>
      <div className={s.logo}>💰 AhorroIQ</div>

      <div className={s.balancePill}>
        <span className={s.balLabel}>Balance</span>
        <span className={`${s.balAmount} ${balance < 0 ? s.negative : ''}`}>
          {db.formatMXN(balance)}
        </span>
      </div>

      <div className={s.actions}>
        <div className={s.userBadge}>
          <span>{nivel.icon}</span>
          <span className={s.pts}>{puntos} pts</span>
        </div>

        <button
          className={`${s.iconBtn} ${app.config.modo_disciplina ? s.disciplineOn : ''}`}
          title={app.config.modo_disciplina ? 'Modo Disciplina ACTIVO' : 'Activar Modo Disciplina'}
          onClick={toggleDiscipline}
        >
          ⚔️
        </button>

        <div className={s.notifWrap}>
          <button className={s.iconBtn} onClick={() => setShowNotifs(v => !v)} title="Notificaciones">
            🔔
            {unread > 0 && <span className={s.badge}>{unread > 9 ? '9+' : unread}</span>}
          </button>

          {showNotifs && (
            <div className={s.notifPanel}>
              <div className={s.notifHeader}>
                <h3>🔔 Notificaciones</h3>
                <button onClick={() => setShowNotifs(false)}>✕</button>
              </div>
              <div className={s.notifList}>
                {app.notifs.length === 0
                  ? <p className={s.notifEmpty}>Sin notificaciones</p>
                  : app.notifs.slice(0, 15).map(n => (
                    <div key={n.id} className={`${s.notifItem} ${s[n.tipo] || ''}`}>
                      <strong>{n.titulo}</strong>
                      <p>{n.mensaje}</p>
                      <small>{db.formatDate(n.fecha)}</small>
                    </div>
                  ))
                }
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
