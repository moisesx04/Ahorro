import { useState, useEffect, useRef } from 'react';
import s from './ImpulseBlocker.module.css';

const QUESTIONS = [
  '¿De verdad necesitas esto ahora mismo?',
  '¿Está dentro de tu presupuesto de hoy?',
  '¿Lo usarás más de 10 veces?',
  '¿Puedes vivir sin esto hoy?',
  '¿Esto te acerca a tu meta de ahorro?',
];
const TIPS = [
  'Con ese dinero puedes avanzar en tu meta de ahorro 🎯',
  'El 80% de los gastos impulsivos se olvidan en 24 horas ⏰',
  'Esperar 24 horas reduce el deseo de compra en 70% 🧠',
  'Tu yo del futuro te lo agradecerá 💪',
  '¿Qué pasaría si ahorras eso por 3 meses? 🚀',
];

export default function ImpulseBlocker({ monto, customMsg, onCancel, onContinue }) {
  const [count, setCount] = useState(10);
  const [ready, setReady] = useState(false);
  const timerRef = useRef(null);
  const question = useRef(QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)]);
  const tip = useRef(TIPS[Math.floor(Math.random() * TIPS.length)]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCount(c => {
        if (c <= 1) { clearInterval(timerRef.current); setReady(true); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const pct = ((10 - count) / 10) * 100;

  return (
    <div className={s.overlay}>
      <div className={s.card}>
        <div className={s.shakeEmoji}>🧠</div>
        <h2 className={s.title}>¡ESPERA!</h2>

        <p className={s.question}>
          {customMsg || question.current}
        </p>

        {/* Countdown ring */}
        <div className={s.ringWrap}>
          <svg className={s.ring} viewBox="0 0 80 80">
            <circle className={s.trackCircle} cx="40" cy="40" r="34" />
            <circle
              className={s.progressCircle}
              cx="40" cy="40" r="34"
              style={{ strokeDashoffset: `${213.6 - (213.6 * pct) / 100}` }}
            />
          </svg>
          <span className={`${s.countdown} ${count <= 3 ? s.danger : ''}`}>
            {count === 0 ? '✓' : count}
          </span>
        </div>

        <div className={s.tip}>{tip.current}</div>

        <div className={s.actions}>
          <button className={s.btnCancel} onClick={onCancel}>
            ❌ Cancelar gasto
          </button>
          <button
            className={`${s.btnContinue} ${ready ? s.btnContinueReady : ''}`}
            onClick={onContinue}
            disabled={!ready}
          >
            {ready ? 'Continuar de todas formas' : `Espera ${count}s...`}
          </button>
        </div>
      </div>
    </div>
  );
}
