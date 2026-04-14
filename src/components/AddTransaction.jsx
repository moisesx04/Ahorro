import { useState } from 'react';
import { db, CATEGORIAS_GASTO, CATEGORIAS_INGRESO } from '../db';
import ImpulseBlocker from './ImpulseBlocker';
import s from './AddTransaction.module.css';
import sh from '../shared.module.css';

const CAT_GASTO = Object.entries(CATEGORIAS_GASTO);
const CAT_INGRESO = Object.entries(CATEGORIAS_INGRESO);

export default function AddTransaction({ app, navigate }) {
  const [tab, setTab] = useState('gasto');
  // Gasto state
  const [desc, setDesc]     = useState('');
  const [monto, setMonto]   = useState('');
  const [catG, setCatG]     = useState('comida');
  const [necesario, setNec] = useState(true);
  // Ingreso state
  const [descI, setDescI]   = useState('');
  const [montoI, setMontoI] = useState('');
  const [catI, setCatI]     = useState('salario');
  // Impulse blocker
  const [showBlocker, setShowBlocker] = useState(false);
  const [blockerMsg, setBlockerMsg]   = useState('');
  const [pendingGasto, setPending]    = useState(null);

  const handleGasto = () => {
    if (!desc.trim()) { app.showToast('Escribe una descripción', 'error'); return; }
    const m = parseFloat(monto);
    if (!m || m <= 0) { app.showToast('Ingresa un monto válido', 'error'); return; }
    const cfg = app.config;
    const totalHoy = db.sumMonto(db.getTodayGastos());
    const esImpulsivo = !necesario;
    const excedePresup = (totalHoy + m) > cfg.presupuesto_diario;
    const catRiesgo = ['lujo', 'ocio'].includes(catG);

    // DISCIPLINE MODE block
    if (cfg.modo_disciplina && esImpulsivo) {
      app.showToast('⚔️ Modo Disciplina: gasto innecesario bloqueado', 'error');
      app.addNotif({ tipo: 'danger', titulo: 'Modo Disciplina', mensaje: 'Intento de gasto innecesario bloqueado.' });
      return;
    }

    const gasto = { descripcion: desc.trim(), monto: m, categoria: catG, necesario, impulso: esImpulsivo };

    if (esImpulsivo || excedePresup || catRiesgo) {
      let msg = '';
      if (excedePresup) msg = `⚠️ Esto rompe tu presupuesto diario (${db.formatMXN(totalHoy)} de ${db.formatMXN(cfg.presupuesto_diario)} gastado). ¿Continúas?`;
      setPending(gasto);
      setBlockerMsg(msg);
      setShowBlocker(true);
    } else {
      commitGasto(gasto);
    }
  };

  const commitGasto = (gasto) => {
    app.addGasto(gasto);
    if (gasto.impulso) {
      app.addNotif({ tipo: 'warning', titulo: 'Gasto impulsivo', mensaje: `Registraste "${gasto.descripcion}" por ${db.formatMXN(gasto.monto)}.` });
    }
    app.showToast(`✅ Gasto: ${db.formatMXN(gasto.monto)}`, 'success');
    setDesc(''); setMonto(''); setCatG('comida'); setNec(true);
    navigate('dashboard');
  };

  const handleBlockerCancel = () => {
    setShowBlocker(false);
    setPending(null);
    app.desbloquear('sin_impulsos');
    app.addPoints(20);
    app.showToast('💪 ¡Excelente control mental! +20 pts', 'success');
  };

  const handleBlockerContinue = () => {
    setShowBlocker(false);
    if (pendingGasto) commitGasto(pendingGasto);
    setPending(null);
  };

  const handleIngreso = () => {
    if (!descI.trim()) { app.showToast('Escribe una descripción', 'error'); return; }
    const m = parseFloat(montoI);
    if (!m || m <= 0) { app.showToast('Ingresa un monto válido', 'error'); return; }
    app.addIngreso({ descripcion: descI.trim(), monto: m, categoria: catI });
    app.showToast(`💵 Ingreso: ${db.formatMXN(m)}`, 'success');
    setDescI(''); setMontoI(''); setCatI('salario');
    navigate('dashboard');
  };

  return (
    <div>
      {showBlocker && (
        <ImpulseBlocker
          monto={pendingGasto?.monto}
          customMsg={blockerMsg}
          onCancel={handleBlockerCancel}
          onContinue={handleBlockerContinue}
        />
      )}

      <div className={s.viewHeader}><h2>➕ Registrar</h2></div>

      {/* Tab switcher */}
      <div className={s.tabs}>
        <button className={`${s.tab} ${tab === 'gasto' ? s.tabActive : ''}`} onClick={() => setTab('gasto')}>
          💸 Gasto
        </button>
        <button className={`${s.tab} ${tab === 'ingreso' ? s.tabActive : ''}`} onClick={() => setTab('ingreso')}>
          💵 Ingreso
        </button>
      </div>

      {tab === 'gasto' && (
        <div className={s.formCard}>
          <div className={sh.formGroup}>
            <label className={s.label}>Descripción</label>
            <input className={sh.input} placeholder="¿En qué gastaste?" value={desc} onChange={e => setDesc(e.target.value)} maxLength={60} />
          </div>
          <div className={sh.formGroup}>
            <label className={s.label}>Monto (MXN)</label>
            <div className={sh.inputMoney}>
              <span className={sh.prefix}>$</span>
              <input className={sh.input} type="number" placeholder="0.00" value={monto} onChange={e => setMonto(e.target.value)} min="0" step="0.01" />
            </div>
          </div>
          <div className={sh.formGroup}>
            <label className={s.label}>Categoría</label>
            <div className={sh.catGrid}>
              {CAT_GASTO.map(([key, cat]) => (
                <div key={key} className={`${sh.catOption} ${catG === key ? sh.active : ''}`} onClick={() => setCatG(key)}>
                  {cat.emoji} {cat.label}
                </div>
              ))}
            </div>
          </div>
          <div className={sh.formGroup}>
            <label className={s.label}>¿Es necesario?</label>
            <div className={sh.toggleGroup}>
              <button className={`${sh.toggleBtn} ${necesario ? sh.activeYes : ''}`} onClick={() => setNec(true)}>✅ Sí, necesario</button>
              <button className={`${sh.toggleBtn} ${!necesario ? sh.activeNo : ''}`} onClick={() => setNec(false)}>❌ Es un impulso</button>
            </div>
          </div>
          <button className={`${sh.btnPrimary} ${sh.full}`} onClick={handleGasto}>
            Registrar Gasto 💸
          </button>
        </div>
      )}

      {tab === 'ingreso' && (
        <div className={s.formCard}>
          <div className={sh.formGroup}>
            <label className={s.label}>Descripción</label>
            <input className={sh.input} placeholder="¿De dónde viene?" value={descI} onChange={e => setDescI(e.target.value)} maxLength={60} />
          </div>
          <div className={sh.formGroup}>
            <label className={s.label}>Monto (MXN)</label>
            <div className={sh.inputMoney}>
              <span className={sh.prefix}>$</span>
              <input className={sh.input} type="number" placeholder="0.00" value={montoI} onChange={e => setMontoI(e.target.value)} min="0" step="0.01" />
            </div>
          </div>
          <div className={sh.formGroup}>
            <label className={s.label}>Categoría</label>
            <div className={sh.catGrid}>
              {CAT_INGRESO.map(([key, cat]) => (
                <div key={key} className={`${sh.catOption} ${catI === key ? sh.active : ''}`} onClick={() => setCatI(key)}>
                  {cat.emoji} {cat.label}
                </div>
              ))}
            </div>
          </div>
          <button className={`${sh.btnAccent} ${sh.full}`} style={{width:'100%',padding:'14px'}} onClick={handleIngreso}>
            Registrar Ingreso 💵
          </button>
        </div>
      )}
    </div>
  );
}
