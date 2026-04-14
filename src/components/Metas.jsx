import { useState } from 'react';
import { db } from '../db';
import s from './Metas.module.css';
import sh from '../shared.module.css';

const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4'];

export default function Metas({ app }) {
  const { metas } = app;
  const [showModal, setShowModal]   = useState(false);
  const [showAbonar, setShowAbonar] = useState(null);
  const [nombre, setNombre]   = useState('');
  const [monto, setMonto]     = useState('');
  const [fecha, setFecha]     = useState('');
  const [color, setColor]     = useState(COLORS[0]);
  const [abonarMonto, setAbonarMonto] = useState('');

  const handleSave = () => {
    if (!nombre.trim()) { app.showToast('Escribe el nombre de la meta', 'error'); return; }
    const m = parseFloat(monto);
    if (!m || m <= 0) { app.showToast('Ingresa un monto objetivo', 'error'); return; }
    app.addMeta({ nombre: nombre.trim(), monto_objetivo: m, fecha_limite: fecha, color });
    app.showToast(`🎯 Meta "${nombre}" creada`, 'success');
    setNombre(''); setMonto(''); setFecha(''); setColor(COLORS[0]);
    setShowModal(false);
  };

  const handleAbonar = () => {
    const m = parseFloat(abonarMonto);
    if (!m || m <= 0) { app.showToast('Ingresa un monto válido', 'error'); return; }
    app.abonarMeta(showAbonar, m);
    app.showToast(`💰 Abono registrado: ${db.formatMXN(m)}`, 'success');
    setAbonarMonto(''); setShowAbonar(null);
  };

  const totalAhorrado = metas.reduce((s, m) => s + (m.monto_actual || 0), 0);
  const totalObjetivo = metas.reduce((s, m) => s + m.monto_objetivo, 0);

  return (
    <div>
      <div className={sh.viewHeader}>
        <h2>🎯 Metas de Ahorro</h2>
        <button className={sh.btnAccent} onClick={() => setShowModal(true)}>+ Nueva Meta</button>
      </div>

      {metas.length > 0 && (
        <div className={s.summary}>
          <div className={s.summaryItem}>
            <span className={s.summaryLabel}>Total ahorrado</span>
            <span className={s.summaryVal} style={{color:'var(--accent-light)'}}>{db.formatMXN(totalAhorrado)}</span>
          </div>
          <div className={s.summaryDivider} />
          <div className={s.summaryItem}>
            <span className={s.summaryLabel}>Total objetivo</span>
            <span className={s.summaryVal}>{db.formatMXN(totalObjetivo)}</span>
          </div>
          <div className={s.summaryDivider} />
          <div className={s.summaryItem}>
            <span className={s.summaryLabel}>Progreso</span>
            <span className={s.summaryVal} style={{color:'var(--primary-light)'}}>
              {totalObjetivo > 0 ? Math.round((totalAhorrado/totalObjetivo)*100) : 0}%
            </span>
          </div>
        </div>
      )}

      {metas.length === 0 ? (
        <div className={sh.emptyState}>
          <span className={sh.icon}>🎯</span>
          <p>Sin metas todavía. ¡Crea tu primera meta de ahorro!</p>
        </div>
      ) : (
        metas.map(m => <MetaCard key={m.id} meta={m} onAbonar={() => setShowAbonar(m.id)} onDelete={() => { app.deleteMeta(m.id); app.showToast('Meta eliminada', 'warning'); }} />)
      )}

      {/* Nueva Meta Modal */}
      {showModal && (
        <div className={sh.modalOverlay} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className={sh.modalCard}>
            <h3>🎯 Nueva Meta de Ahorro</h3>
            <div className={sh.formGroup}>
              <label>Nombre de la meta</label>
              <input className={sh.input} placeholder="Ej: Viaje a la playa" value={nombre} onChange={e => setNombre(e.target.value)} maxLength={40} />
            </div>
            <div className={sh.formGroup}>
              <label>Monto objetivo (MXN)</label>
              <div className={sh.inputMoney}><span className={sh.prefix}>$</span>
                <input className={sh.input} type="number" placeholder="10,000" value={monto} onChange={e => setMonto(e.target.value)} min="1" />
              </div>
            </div>
            <div className={sh.formGroup}>
              <label>Fecha límite (opcional)</label>
              <input className={sh.input} type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
            </div>
            <div className={sh.formGroup}>
              <label>Color</label>
              <div className={sh.colorPicker}>
                {COLORS.map(c => (
                  <span key={c} className={`${sh.colorDot} ${color===c ? sh.active : ''}`}
                    style={{background:c}} onClick={() => setColor(c)} />
                ))}
              </div>
            </div>
            <div className={sh.modalActions}>
              <button className={sh.btnGhost} onClick={() => setShowModal(false)}>Cancelar</button>
              <button className={sh.btnPrimary} onClick={handleSave}>Guardar Meta</button>
            </div>
          </div>
        </div>
      )}

      {/* Abonar Modal */}
      {showAbonar && (
        <div className={sh.modalOverlay} onClick={e => e.target === e.currentTarget && setShowAbonar(null)}>
          <div className={sh.modalCard}>
            <h3>💰 Abonar a Meta</h3>
            <p className={s.deudorLabel}>{metas.find(m => m.id === showAbonar)?.nombre}</p>
            <div className={sh.formGroup}>
              <label>Monto a abonar (MXN)</label>
              <div className={sh.inputMoney}><span className={sh.prefix}>$</span>
                <input className={sh.input} type="number" placeholder="0.00" value={abonarMonto} onChange={e => setAbonarMonto(e.target.value)} min="1" />
              </div>
            </div>
            <div className={sh.modalActions}>
              <button className={sh.btnGhost} onClick={() => setShowAbonar(null)}>Cancelar</button>
              <button className={sh.btnPrimary} onClick={handleAbonar}>Abonar 💰</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetaCard({ meta, onAbonar, onDelete }) {
  const pct = Math.min(100, Math.round(((meta.monto_actual || 0) / meta.monto_objetivo) * 100));
  const dias = db.daysUntil(meta.fecha_limite);
  const completada = pct >= 100;

  return (
    <div className={s.card} style={{ borderLeft: `3px solid ${meta.color}` }}>
      <div className={s.cardHeader}>
        <div>
          <h4 className={s.name}>{completada ? '✅ ' : '🎯 '}{meta.nombre}</h4>
          {dias !== null && (
            <p className={`${s.dias} ${dias < 0 ? s.diasOverdue : dias <= 7 ? s.diasNear : ''}`}>
              {dias < 0 ? `⚠️ Venció hace ${Math.abs(dias)} días` : `📅 ${dias} días restantes`}
            </p>
          )}
        </div>
        <span className={s.pctBig} style={{ color: meta.color }}>{pct}%</span>
      </div>

      <div className={s.amounts}>
        <span>Ahorrado: <strong style={{ color: meta.color }}>{db.formatMXN(meta.monto_actual || 0)}</strong></span>
        <span>Objetivo: <strong>{db.formatMXN(meta.monto_objetivo)}</strong></span>
      </div>

      <div className={s.barWrap}>
        <div className={s.barFill} style={{ width: `${pct}%`, background: meta.color }} />
      </div>

      {completada && <p className={s.completedMsg}>🏆 ¡Meta completada! ¡Increíble logro!</p>}

      <div className={s.actions}>
        {!completada && <button className={sh.btnAccent} onClick={onAbonar}>💰 Abonar</button>}
        <button className={sh.btnDanger} onClick={onDelete}>🗑️ Eliminar</button>
      </div>
    </div>
  );
}
