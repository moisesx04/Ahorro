import { useState } from 'react';
import s from './Onboarding.module.css';

const SLIDES = [
  { emoji: '🧠', title: 'Control Mental del Dinero', desc: 'No solo registras gastos. Entrenamos tu mente para gastar mejor y romper hábitos impulsivos.' },
  { emoji: '🚨', title: 'Modo Bloqueo Anti-Impulso', desc: 'Antes de registrar un gasto, la app te hace reflexionar 10 segundos. Ese tiempo puede salvarte.' },
  { emoji: '🎮', title: 'Gamificación Real', desc: 'Gana puntos por buenos hábitos. Sube de nivel. Desbloquea logros. Tu control financiero es el juego.' },
];

export default function Onboarding({ onDone }) {
  const [slide, setSlide] = useState(0);
  const [nombre, setNombre] = useState('');
  const [ingreso, setIngreso] = useState('');
  const [presupuesto, setPresupuesto] = useState('');
  const isLast = slide === SLIDES.length;

  const next = () => { if (slide < SLIDES.length) setSlide(s => s + 1); };
  const prev = () => { if (slide > 0) setSlide(s => s - 1); };

  const handleStart = () => {
    if (!nombre.trim()) return;
    onDone(nombre.trim(), parseFloat(ingreso) || 0, parseFloat(presupuesto) || 500);
  };

  return (
    <div className={s.wrap}>
      <div className={s.container}>
        {/* Progress dots */}
        <div className={s.dots}>
          {[...SLIDES, 'setup'].map((_, i) => (
            <span key={i} className={`${s.dot} ${i === slide ? s.dotActive : ''}`} />
          ))}
        </div>

        {/* Slides */}
        {!isLast ? (
          <div className={s.slide} key={slide}>
            <span className={s.emoji}>{SLIDES[slide].emoji}</span>
            <h2 className={s.title}>{SLIDES[slide].title}</h2>
            <p className={s.desc}>{SLIDES[slide].desc}</p>
          </div>
        ) : (
          <div className={s.slide} key="setup">
            <span className={s.emoji}>👤</span>
            <h2 className={s.title}>¡Comencemos!</h2>
            <div className={s.form}>
              <input className={s.input} placeholder="Tu nombre" value={nombre} onChange={e => setNombre(e.target.value)} maxLength={30} />
              <input className={s.input} type="number" placeholder="Ingreso mensual (MXN)" value={ingreso} onChange={e => setIngreso(e.target.value)} min="0" />
              <input className={s.input} type="number" placeholder="Presupuesto diario límite" value={presupuesto} onChange={e => setPresupuesto(e.target.value)} min="0" />
              <button className={s.btnStart} onClick={handleStart} disabled={!nombre.trim()}>
                ¡Empezar a Ahorrar! 🚀
              </button>
            </div>
          </div>
        )}

        {/* Nav */}
        {!isLast && (
          <div className={s.nav}>
            <button className={s.btnGhost} onClick={prev} style={{ visibility: slide === 0 ? 'hidden' : 'visible' }}>← Atrás</button>
            <button className={s.btnPrimary} onClick={next}>
              {slide === SLIDES.length - 1 ? 'Configurar →' : 'Siguiente →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
