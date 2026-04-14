import { useEffect, useState } from 'react';
import s from './Toast.module.css';

export default function Toast({ toast }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setVisible(true); }, [toast?.id]);
  if (!toast) return null;
  return (
    <div className={`${s.toast} ${s[toast.type] || ''} ${visible ? s.visible : ''}`}>
      {toast.msg}
    </div>
  );
}
