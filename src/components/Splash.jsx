import { useEffect } from 'react';
import s from './Splash.module.css';

export default function Splash() {
  return (
    <div className={s.splash}>
      <div className={s.content}>
        <div className={s.logoWrap}>
          <span className={s.logoIcon}>💰</span>
          <h1 className={s.title}>AhorroIQ</h1>
          <p className={s.sub}>Tu dinero, bajo control inteligente</p>
        </div>
        <div className={s.loaderBar}>
          <div className={s.loaderFill} />
        </div>
        <p className={s.hint}>Cargando tu espacio financiero...</p>
      </div>
    </div>
  );
}
