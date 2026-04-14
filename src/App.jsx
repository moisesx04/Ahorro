import { useState, useEffect } from 'react';
import { useApp } from './useApp';
import { db } from './db';
import Splash from './components/Splash';
import Onboarding from './components/Onboarding';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Toast from './components/Toast';
import Dashboard from './components/Dashboard';
import AddTransaction from './components/AddTransaction';
import Metas from './components/Metas';
import Deudas from './components/Deudas';
import Reportes from './components/Reportes';
import Gamificacion from './components/Gamificacion';
import styles from './App.module.css';

export default function App() {
  const app = useApp();
  const [phase, setPhase] = useState('splash'); // splash | onboarding | app
  const [view, setView] = useState('dashboard');

  useEffect(() => {
    const timer = setTimeout(() => {
      setPhase(app.usuario.configurado ? 'app' : 'onboarding');
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  const onOnboardingDone = (nombre, ingreso, presupuesto) => {
    const u = { ...app.usuario, nombre, configurado: true };
    app.setUsuario(u);
    const c = { ...app.config, presupuesto_diario: presupuesto };
    app.setConfig(c);
    if (ingreso > 0) {
      app.addIngreso({ descripcion: 'Ingreso mensual base', monto: ingreso, categoria: 'salario' });
    }
    db.addNotif({ tipo: 'success', titulo: '¡Bienvenido!', mensaje: `Hola ${nombre}, empieza registrando un gasto o una meta.` });
    app.showToast(`¡Bienvenido, ${nombre}! 🚀`, 'success');
    setPhase('app');
  };

  const navigate = (v) => { setView(v); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const VIEWS = { dashboard: Dashboard, gastos: AddTransaction, metas: Metas, deudas: Deudas, reportes: Reportes, gamificacion: Gamificacion };
  const CurrentView = VIEWS[view] || Dashboard;

  if (phase === 'splash') return <Splash />;
  if (phase === 'onboarding') return <Onboarding onDone={onOnboardingDone} />;

  return (
    <div className={styles.appShell}>
      <Header app={app} />
      {app.config.modo_disciplina && (
        <div className={styles.disciplineBanner}>
          <span>⚔️ MODO DISCIPLINA ACTIVO — Gastos innecesarios bloqueados</span>
          <button onClick={() => { app.setConfig({ ...app.config, modo_disciplina: false }); app.showToast('Modo disciplina desactivado', 'warning'); }}>
            Desactivar
          </button>
        </div>
      )}
      <main className={styles.main}>
        <CurrentView app={app} navigate={navigate} />
      </main>
      <BottomNav current={view} navigate={navigate} />
      {app.toast && <Toast toast={app.toast} />}
    </div>
  );
}
