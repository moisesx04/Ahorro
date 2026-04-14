/* ── useApp.js — Hook central de estado global ── */
import { useState, useCallback } from 'react';
import { db, calcNivel, NIVELES, LOGROS_DEF } from './db';

export function useApp() {
  const [usuario, setUsuarioState] = useState(() => db.getUsuario());
  const [config, setConfigState] = useState(() => db.getConfig());
  const [gastos, setGastos] = useState(() => db.getGastos());
  const [ingresos, setIngresos] = useState(() => db.getIngresos());
  const [deudas, setDeudas] = useState(() => db.getDeudas());
  const [metas, setMetas] = useState(() => db.getMetas());
  const [notifs, setNotifs] = useState(() => db.getNotifs());
  const [logros, setLogros] = useState(() => db.getLogros());
  const [toast, setToast] = useState(null);

  /* ── TOAST ── */
  const showToast = useCallback((msg, type = 'info') => {
    setToast({ msg, type, id: Date.now() });
    setTimeout(() => setToast(null), 3200);
  }, []);

  /* ── PUNTOS ── */
  const addPoints = useCallback((pts) => {
    setUsuarioState(prev => {
      const antes = calcNivel(prev.puntos || 0);
      const nuevoPuntos = (prev.puntos || 0) + pts;
      const despues = calcNivel(nuevoPuntos);
      const updated = { ...prev, puntos: nuevoPuntos };
      db.setUsuario(updated);
      if (despues > antes) {
        const nivel = NIVELES[despues];
        setTimeout(() => showToast(`🎉 ¡Subiste a nivel ${nivel.nombre}! ${nivel.icon}`, 'success'), 300);
        db.addNotif({ tipo: 'success', titulo: `Nivel ${nivel.nombre}`, mensaje: `¡Alcanzaste el nivel "${nivel.nombre}"!` });
        setNotifs(db.getNotifs());
        if (despues === NIVELES.length - 1) {
          db.desbloquearLogro('nivel_maestro');
          setLogros(db.getLogros());
        }
      }
      return updated;
    });
  }, [showToast]);

  /* ── LOGRO ── */
  const desbloquear = useCallback((key) => {
    if (db.desbloquearLogro(key)) {
      setLogros(db.getLogros());
      const def = LOGROS_DEF[key];
      if (def) setTimeout(() => showToast(`🏆 Logro: "${def.nombre}" ${def.icon}`, 'success'), 500);
    }
  }, [showToast]);

  /* ── NOTIF ── */
  const addNotif = useCallback((n) => {
    db.addNotif(n);
    setNotifs(db.getNotifs());
  }, []);

  /* ── USUARIO ── */
  const setUsuario = useCallback((u) => {
    db.setUsuario(u);
    setUsuarioState(u);
  }, []);

  /* ── CONFIG ── */
  const setConfig = useCallback((c) => {
    db.setConfig(c);
    setConfigState(c);
  }, []);

  /* ── GASTOS ── */
  const addGasto = useCallback((item) => {
    const nuevo = db.addGasto(item);
    setGastos(db.getGastos());
    addPoints(5);
    desbloquear('primer_gasto');
    if (!item.necesario) addPoints(0); // no bonus for impulso
    else addPoints(5); // bonus for necessary
    return nuevo;
  }, [addPoints, desbloquear]);

  const deleteGasto = useCallback((id) => {
    db.deleteGasto(id);
    setGastos(db.getGastos());
  }, []);

  /* ── INGRESOS ── */
  const addIngreso = useCallback((item) => {
    const nuevo = db.addIngreso(item);
    setIngresos(db.getIngresos());
    addPoints(10);
    return nuevo;
  }, [addPoints]);

  const deleteIngreso = useCallback((id) => {
    db.deleteIngreso(id);
    setIngresos(db.getIngresos());
  }, []);

  /* ── METAS ── */
  const addMeta = useCallback((item) => {
    const nueva = db.addMeta(item);
    setMetas(db.getMetas());
    addPoints(30);
    desbloquear('primera_meta');
    addNotif({ tipo: 'success', titulo: 'Nueva meta', mensaje: `Meta "${item.nombre}" creada. ¡Vamos!` });
    return nueva;
  }, [addPoints, desbloquear, addNotif]);

  const abonarMeta = useCallback((id, monto) => {
    const meta = db.abonarMeta(id, monto);
    setMetas(db.getMetas());
    addPoints(25);
    desbloquear('primer_ahorro');
    const totalAhorrado = db.getMetas().reduce((s, m) => s + (m.monto_actual || 0), 0);
    if (totalAhorrado >= 1000) desbloquear('ahorro_1000');
    if (meta && meta.monto_actual >= meta.monto_objetivo) {
      desbloquear('meta_completada');
      addPoints(100);
      showToast(`🏆 ¡Meta "${meta.nombre}" completada!`, 'success');
      addNotif({ tipo: 'success', titulo: '¡Meta cumplida!', mensaje: `Lograste "${meta.nombre}". ¡Increíble!` });
    }
    return meta;
  }, [addPoints, desbloquear, showToast, addNotif]);

  const deleteMeta = useCallback((id) => {
    db.deleteMeta(id);
    setMetas(db.getMetas());
  }, []);

  /* ── DEUDAS ── */
  const addDeuda = useCallback((item) => {
    const nueva = db.addDeuda(item);
    setDeudas(db.getDeudas());
    addPoints(5);
    desbloquear('primera_deuda');
    addNotif({ tipo: 'warning', titulo: 'Deuda registrada', mensaje: `Deuda con "${item.acreedor}" por ${db.formatMXN(item.monto_total)}.` });
    return nueva;
  }, [addPoints, desbloquear, addNotif]);

  const pagarDeuda = useCallback((id, monto) => {
    const deuda = db.pagarDeuda(id, monto);
    setDeudas(db.getDeudas());
    addPoints(50);
    if (deuda && deuda.monto_pagado >= deuda.monto_total) {
      desbloquear('deuda_pagada');
      addPoints(100);
      showToast(`🎉 ¡Deuda con "${deuda.acreedor}" liquidada!`, 'success');
      addNotif({ tipo: 'success', titulo: '¡Deuda pagada!', mensaje: `Liquidaste tu deuda con "${deuda.acreedor}".` });
    }
    return deuda;
  }, [addPoints, desbloquear, showToast, addNotif]);

  const deleteDeuda = useCallback((id) => {
    db.deleteDeuda(id);
    setDeudas(db.getDeudas());
  }, []);

  return {
    usuario, setUsuario,
    config, setConfig,
    gastos, addGasto, deleteGasto,
    ingresos, addIngreso, deleteIngreso,
    metas, addMeta, abonarMeta, deleteMeta,
    deudas, addDeuda, pagarDeuda, deleteDeuda,
    notifs, addNotif,
    logros,
    toast, showToast,
    addPoints, desbloquear,
  };
}
