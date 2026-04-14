import s from './BottomNav.module.css';

const NAV = [
  { id: 'dashboard',    icon: '🏠', label: 'Inicio' },
  { id: 'gastos',       icon: '➕', label: 'Agregar' },
  { id: 'metas',        icon: '🎯', label: 'Metas' },
  { id: 'deudas',       icon: '💳', label: 'Deudas' },
  { id: 'reportes',     icon: '📉', label: 'Análisis' },
  { id: 'gamificacion', icon: '🎮', label: 'Nivel' },
];

export default function BottomNav({ current, navigate }) {
  return (
    <nav className={s.nav}>
      {NAV.map(item => (
        <button
          key={item.id}
          className={`${s.btn} ${current === item.id ? s.active : ''}`}
          onClick={() => navigate(item.id)}
        >
          <span className={s.icon}>{item.icon}</span>
          <span className={s.label}>{item.label}</span>
          {current === item.id && <span className={s.indicator} />}
        </button>
      ))}
    </nav>
  );
}
