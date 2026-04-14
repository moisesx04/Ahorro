/* ── db.js — Capa de datos con localStorage ── */

const KEYS = {
  usuario: 'aiq_usuario',
  ingresos: 'aiq_ingresos',
  gastos: 'aiq_gastos',
  deudas: 'aiq_deudas',
  metas: 'aiq_metas',
  config: 'aiq_config',
  notificaciones: 'aiq_notifs',
  logros: 'aiq_logros',
};

const get = (key) => { try { return JSON.parse(localStorage.getItem(key)) || null; } catch { return null; } };
const set = (key, val) => localStorage.setItem(key, JSON.stringify(val));

export const db = {
  /* ── USUARIO ── */
  getUsuario: () => get(KEYS.usuario) || { nombre: 'Amigo', puntos: 0, configurado: false },
  setUsuario: (u) => set(KEYS.usuario, u),

  /* ── CONFIG ── */
  getConfig: () => get(KEYS.config) || { presupuesto_diario: 500, modo_disciplina: false },
  setConfig: (c) => set(KEYS.config, c),

  /* ── INGRESOS ── */
  getIngresos: () => get(KEYS.ingresos) || [],
  addIngreso: (item) => {
    const list = get(KEYS.ingresos) || [];
    const nuevo = { ...item, id: Date.now().toString(), fecha: new Date().toISOString() };
    list.unshift(nuevo);
    set(KEYS.ingresos, list);
    return nuevo;
  },
  deleteIngreso: (id) => set(KEYS.ingresos, (get(KEYS.ingresos) || []).filter(i => i.id !== id)),

  /* ── GASTOS ── */
  getGastos: () => get(KEYS.gastos) || [],
  addGasto: (item) => {
    const list = get(KEYS.gastos) || [];
    const nuevo = { ...item, id: Date.now().toString(), fecha: new Date().toISOString() };
    list.unshift(nuevo);
    set(KEYS.gastos, list);
    return nuevo;
  },
  deleteGasto: (id) => set(KEYS.gastos, (get(KEYS.gastos) || []).filter(g => g.id !== id)),

  /* ── DEUDAS ── */
  getDeudas: () => get(KEYS.deudas) || [],
  addDeuda: (item) => {
    const list = get(KEYS.deudas) || [];
    const nuevo = { ...item, id: Date.now().toString(), monto_pagado: 0, pagos: [], fecha_creacion: new Date().toISOString() };
    list.push(nuevo);
    set(KEYS.deudas, list);
    return nuevo;
  },
  pagarDeuda: (id, monto) => {
    const list = get(KEYS.deudas) || [];
    const d = list.find(x => x.id === id);
    if (!d) return null;
    d.monto_pagado = Math.min(d.monto_total, (d.monto_pagado || 0) + monto);
    d.pagos = [...(d.pagos || []), { monto, fecha: new Date().toISOString() }];
    set(KEYS.deudas, list);
    return d;
  },
  deleteDeuda: (id) => set(KEYS.deudas, (get(KEYS.deudas) || []).filter(d => d.id !== id)),

  /* ── METAS ── */
  getMetas: () => get(KEYS.metas) || [],
  addMeta: (item) => {
    const list = get(KEYS.metas) || [];
    const nuevo = { ...item, id: Date.now().toString(), monto_actual: 0, fecha_creacion: new Date().toISOString() };
    list.push(nuevo);
    set(KEYS.metas, list);
    return nuevo;
  },
  abonarMeta: (id, monto) => {
    const list = get(KEYS.metas) || [];
    const m = list.find(x => x.id === id);
    if (!m) return null;
    m.monto_actual = Math.min(m.monto_objetivo, (m.monto_actual || 0) + monto);
    set(KEYS.metas, list);
    return m;
  },
  deleteMeta: (id) => set(KEYS.metas, (get(KEYS.metas) || []).filter(m => m.id !== id)),

  /* ── NOTIFICACIONES ── */
  getNotifs: () => get(KEYS.notificaciones) || [],
  addNotif: (n) => {
    const list = get(KEYS.notificaciones) || [];
    list.unshift({ ...n, id: Date.now().toString(), fecha: new Date().toISOString() });
    if (list.length > 30) list.length = 30;
    set(KEYS.notificaciones, list);
  },

  /* ── LOGROS ── */
  getLogros: () => get(KEYS.logros) || {},
  desbloquearLogro: (key) => {
    const l = get(KEYS.logros) || {};
    if (l[key]) return false;
    l[key] = true;
    set(KEYS.logros, l);
    return true;
  },

  /* ── HELPERS ── */
  getTodayGastos: () => {
    const hoy = new Date().toDateString();
    return (get(KEYS.gastos) || []).filter(g => new Date(g.fecha).toDateString() === hoy);
  },
  getMonthGastos: () => {
    const now = new Date();
    return (get(KEYS.gastos) || []).filter(g => {
      const d = new Date(g.fecha);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
  },
  getMonthIngresos: () => {
    const now = new Date();
    return (get(KEYS.ingresos) || []).filter(i => {
      const d = new Date(i.fecha);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
  },
  getWeekGastos: () => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return (get(KEYS.gastos) || []).filter(g => new Date(g.fecha) >= weekAgo);
  },
  sumMonto: (arr) => arr.reduce((s, i) => s + (parseFloat(i.monto) || 0), 0),
  totalDeudaPendiente: () => (get(KEYS.deudas) || []).reduce((s, d) => s + Math.max(0, d.monto_total - (d.monto_pagado || 0)), 0),
  formatMXN: (n) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n || 0),
  formatDate: (iso) => new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }),
  daysUntil: (iso) => iso ? Math.ceil((new Date(iso) - new Date()) / 86400000) : null,
};

export const CATEGORIAS_GASTO = {
  comida:     { emoji: '🍔', label: 'Comida' },
  transporte: { emoji: '🚌', label: 'Transporte' },
  salud:      { emoji: '💊', label: 'Salud' },
  educacion:  { emoji: '📚', label: 'Educación' },
  ocio:       { emoji: '🎉', label: 'Ocio' },
  lujo:       { emoji: '💄', label: 'Lujo' },
  servicios:  { emoji: '🔌', label: 'Servicios' },
  otro:       { emoji: '📦', label: 'Otro' },
};

export const CATEGORIAS_INGRESO = {
  salario:   { emoji: '💼', label: 'Salario' },
  freelance: { emoji: '💻', label: 'Freelance' },
  negocio:   { emoji: '🏪', label: 'Negocio' },
  inversion: { emoji: '📊', label: 'Inversión' },
  regalo:    { emoji: '🎁', label: 'Regalo' },
  otro:      { emoji: '📦', label: 'Otro' },
};

export const NIVELES = [
  { nombre: 'Principiante', icon: '🌱', desc: 'Dando los primeros pasos', xp: 0 },
  { nombre: 'Aprendiz',     icon: '📖', desc: 'Aprendiendo a controlar el dinero', xp: 100 },
  { nombre: 'Consciente',   icon: '👁️', desc: 'Tomando decisiones con propósito', xp: 250 },
  { nombre: 'Disciplinado', icon: '⚔️', desc: 'La disciplina es tu arma', xp: 500 },
  { nombre: 'Estratega',    icon: '♟️', desc: 'Piensas antes de gastar', xp: 1000 },
  { nombre: 'Maestro',      icon: '🏆', desc: 'Control financiero total', xp: 2000 },
];

export const LOGROS_DEF = {
  primer_gasto:    { icon: '💸', nombre: 'Primer Gasto', desc: 'Registraste tu primer gasto' },
  primer_ahorro:   { icon: '🐷', nombre: 'Primer Ahorro', desc: 'Abonaste a una meta' },
  primera_meta:    { icon: '🎯', nombre: 'Soñador', desc: 'Creaste tu primera meta' },
  primera_deuda:   { icon: '💳', nombre: 'Deuda Registrada', desc: 'Conoces lo que debes' },
  ahorro_1000:     { icon: '💰', nombre: 'Mil Pesos', desc: 'Ahorraste $1,000 en metas' },
  sin_impulsos:    { icon: '🧠', nombre: 'Mente Clara', desc: 'Cancelaste un gasto impulsivo' },
  meta_completada: { icon: '✅', nombre: 'Meta Cumplida', desc: 'Completaste una meta' },
  deuda_pagada:    { icon: '🎉', nombre: 'Deuda Pagada', desc: 'Liquidaste una deuda' },
  nivel_maestro:   { icon: '🏆', nombre: 'Maestro', desc: 'Alcanzaste nivel Maestro' },
};

export const calcNivel = (puntos) => {
  let idx = 0;
  for (let i = NIVELES.length - 1; i >= 0; i--) {
    if (puntos >= NIVELES[i].xp) { idx = i; break; }
  }
  return Math.min(idx, NIVELES.length - 1);
};

export const IMPULSE_QUESTIONS = [
  '¿De verdad necesitas esto ahora mismo?',
  '¿Está dentro de tu presupuesto del día?',
  '¿Lo usarás más de 10 veces?',
  '¿Puedes vivir sin esto hoy?',
  '¿Esto te acerca a tu meta de ahorro?',
];
export const IMPULSE_TIPS = [
  'Con ese dinero puedes avanzar en tu meta de ahorro 🎯',
  'El 80% de los gastos impulsivos se olvidan en 24 horas ⏰',
  'Esperar 24 horas reduce el deseo de compra en un 70% 🧠',
  'Tu yo del futuro te lo agradecerá 💪',
  '¿Qué pasaría si ahorras eso por 3 meses? 🚀',
];
