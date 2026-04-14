import { useState } from 'react';
import { db } from '../db';
import s from './Deudas.module.css';
import sh from '../shared.module.css';

export default function Deudas({ app }) {
  const { deudas } = app;
  const [showModal, setShowModal] = useState(false);
  const [showPago, setShowPago] = useState(null);
  const [acreedor, setAcreedor] = useState('');
  const [monto, setMonto] = useState('');
  const [interes, setInteres] = useState('');
  const [fecha, setFecha] = useState('');
  const [pagoMonto, setPagoMonto] = useState('');

  const handleSave = () => {
    if (!acreedor.trim()) { app.showToast('Ingresa el acreedor', 'error'); return; }
    const m = parseFloat(monto);
    if (!m || m <= 0) { app.showToast('Ingresa un monto válido', 'error'); return; }
    app.addDeuda({ acreedor: acreedor.trim(), monto_total: m, interes: parseFloat(interes) || 0, fecha_limite: fecha });
    app.showToast(`💳 Deuda con "${acreedor}" registrada`, 'success');
    setAcreedor(''); setMonto(''); setInteres(''); setFecha('');
    setShowModal(false);
  };

  const handlePago = () => {
    const m = parseFloat(pagoMonto);
    if (!m || m <= 0) { app.showToast('Ingresa un monto válido', 'error'); return; }
    app.pagarDeuda(showPago, m);
    setPagoMonto(''); setShowPago(null);
  };

  const totalDeuda = deudas.reduce((s, d) => s + d.monto_total, 0);
  const totalPagado = deudas.reduce((s, d) => s + (d.monto_pagado || 0), 0);
  const totalPendiente = totalDeuda - totalPagado;

  return (
    <div>
      <div className={sh.viewHeader}>
        <h2>💳 Control de Deudas</h2>
        <button className={sh.btnAccent} onClick={() => setShowModal(true)}>+ Nueva Deuda</button>
      </div>

      {totalDeuda > 0 && (
        <div className={s.summaryBar}>
          <div>
            <div className={s.sumLabel}>Total deudas</div>
            <div className={s.sumValRed}>{db.formatMXN(totalPendiente)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className={s.sumLabel}>Pagado</div>
            <div className={s.sumValGreen}>{db.formatMXN(totalPagado)}</div>
          </div>
        </div>
      )}

      {deudas.length === 0 ? (
        <div className={sh.emptyState}>
          <span className={sh.icon}>🎉</span>
          <p>¡Sin deudas registradas! Sigue así.</p>
        </div>
      ) : (
        deudas.map(d => (
          <DeudaCard
            key={d.id}
            deuda={d}
            onPago={() => setShowPago(d.id)}
            onDelete={() => { app.deleteDeuda(d.id); app.showToast('Deuda eliminada', 'warning'); }}
          />
        ))
      )}

      {/* Nueva Deuda Modal */}
      {showModal && (
        <div className={sh.modalOverlay} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className={sh.modalCard}>
            <h3>💳 Nueva Deuda</h3>
            <div className={sh.formGroup}>
              <label>Acreedor (¿a quién le debes?)</label>
              <input className={sh.input} placeholder="Banco, persona, tienda..." value={acreedor} onChange={e => setAcreedor(e.target.value)} maxLength={40} />
            </div>
            <div className={sh.formGroup}>
              <label>Monto total (MXN)</label>
              <div className={sh.inputMoney}>
                <span className={sh.prefix}>$</span>
                <input className={sh.input} type="number" placeholder="0.00" value={monto} onChange={e => setMonto(e.target.value)} min="1" />
              </div>
            </div>
            <div className={sh.formGroup}>
              <label>Interés anual (%)</label>
              <input className={sh.input} type="number" placeholder="0" value={interes} onChange={e => setInteres(e.target.value)} min="0" max="200" step="0.1" />
            </div>
            <div className={sh.formGroup}>
              <label>Fecha límite de pago</label>
              <input className={sh.input} type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
            </div>
            <div className={sh.modalActions}>
              <button className={sh.btnGhost} onClick={() => setShowModal(false)}>Cancelar</button>
              <button className={sh.btnPrimary} onClick={handleSave}>Guardar Deuda</button>
            </div>
          </div>
        </div>
      )}

      {/* Pago Modal */}
      {showPago && (
        <div className={sh.modalOverlay} onClick={e => e.target === e.currentTarget && setShowPago(null)}>
          <div className={sh.modalCard}>
            <h3>💸 Registrar Pago</h3>
            <p className={s.deudoLabel}>Acreedor: {deudas.find(d => d.id === showPago)?.acreedor}</p>
            <div className={sh.formGroup}>
              <label>Monto del pago (MXN)</label>
              <div className={sh.inputMoney}>
                <span className={sh.prefix}>$</span>
                <input className={sh.input} type="number" placeholder="0.00" value={pagoMonto} onChange={e => setPagoMonto(e.target.value)} min="1" />
              </div>
            </div>
            <div className={sh.modalActions}>
              <button className={sh.btnGhost} onClick={() => setShowPago(null)}>Cancelar</button>
              <button className={sh.btnPrimary} onClick={handlePago}>Registrar Pago</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DeudaCard({ deuda, onPago, onDelete }) {
  const pendiente = deuda.monto_total - (deuda.monto_pagado || 0);
  const pct = Math.min(100, Math.round(((deuda.monto_pagado || 0) / deuda.monto_total) * 100));
  const dias = db.daysUntil(deuda.fecha_limite);
  const pagada = pendiente <= 0;

  let statusClass = s.ok;
  let statusLabel = '✅ Al día';
  if (dias !== null && dias < 0) {
    statusClass = s.overdue;
    statusLabel = '🚨 Vencida';
  } else if (dias !== null && dias <= 7) {
    statusClass = s.nearDue;
    statusLabel = `⚠️ ${dias}d restantes`;
  }

  return (
    <div className={`${s.card} ${statusClass}`}>
      <div className={s.header}>
        <div className={s.acreedor}>{pagada ? '✅ ' : '💳 '}{deuda.acreedor}</div>
        <span className={`${s.badge} ${statusClass}`}>{pagada ? '✅ Pagada' : statusLabel}</span>
      </div>
      <div className={s.amounts}>
        <div className={s.amountItem}>
          <label>Total</label>
          <span className={s.red}>{db.formatMXN(deuda.monto_total)}</span>
        </div>
        <div className={s.amountItem}>
          <label>Pagado</label>
          <span className={s.green}>{db.formatMXN(deuda.monto_pagado || 0)}</span>
        </div>
        <div className={s.amountItem}>
          <label>Pendiente</label>
          <span className={s.amber}>{db.formatMXN(Math.max(0, pendiente))}</span>
        </div>
      </div>
      <div className={s.progress}>
        <div className={s.progressMeta}>
          <span>Interés: {deuda.interes}%</span>
          <span>{pct}% pagado</span>
        </div>
        <div className={sh.progressWrap}>
          <div className={sh.progressFill} style={{ width: `${pct}%`, background: 'var(--accent)' }} />
        </div>
      </div>
      {deuda.fecha_limite && <div className={s.footer}>📅 Fecha límite: {db.formatDate(deuda.fecha_limite)}</div>}
      <div className={s.actions}>
        {!pagada && <button className={sh.btnPrimary} onClick={onPago}>💸 Pagar</button>}
        <button className={sh.btnDanger} onClick={onDelete}>🗑️ Eliminar</button>
      </div>
    </div>
  );
}
