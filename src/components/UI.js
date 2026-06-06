import { useState, useCallback } from 'react';

export function Toast({ toasts, remove }) {
  return (
    <div style={{ position:'fixed', top:16, right:16, zIndex:9999, display:'flex', flexDirection:'column', gap:8 }}>
      {toasts.map(t => (
        <div key={t.id} onClick={() => remove(t.id)} style={{
          background: t.type==='error'?'#ef4444':t.type==='warn'?'#f59e0b':'#22c55e',
          color:'#fff', padding:'12px 18px', borderRadius:12, cursor:'pointer',
          fontFamily:'Tajawal,sans-serif', fontSize:14, maxWidth:320, boxShadow:'0 4px 20px #0004',
          animation:'slideIn .3s ease'
        }}>{t.msg}</div>
      ))}
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type='success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }, []);
  const remove = useCallback((id) => setToasts(p => p.filter(t => t.id !== id)), []);
  return { toasts, add, remove };
}

export function Modal({ open, onClose, title, children, width=520 }) {
  if (!open) return null;
  return (
    <div style={{ position:'fixed', inset:0, background:'#000a', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={onClose}>
      <div style={{ background:'#1e2535', borderRadius:18, width:'100%', maxWidth:width, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 25px 80px #000a' }} onClick={e=>e.stopPropagation()}>
        <div style={{ padding:'18px 22px', borderBottom:'1px solid #2d3a52', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontFamily:'Tajawal,sans-serif', fontWeight:700, fontSize:17, color:'#e2e8f0' }}>{title}</span>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#94a3b8', fontSize:22, cursor:'pointer' }}>×</button>
        </div>
        <div style={{ padding:'18px 22px' }}>{children}</div>
      </div>
    </div>
  );
}

export function Input({ label, value, onChange, type='text', placeholder, min, step, required, style:s, rows }) {
  const inputStyle = { width:'100%', background:'#0f172a', border:'1.5px solid #2d3a52', borderRadius:10, padding:'9px 12px', color:'#e2e8f0', fontSize:14, fontFamily:'Tajawal,sans-serif', outline:'none', boxSizing:'border-box', ...s };
  return (
    <div style={{ marginBottom:12 }}>
      {label && <label style={{ display:'block', color:'#94a3b8', fontSize:13, marginBottom:4, fontFamily:'Tajawal,sans-serif' }}>{label}{required&&<span style={{color:'#ef4444'}}> *</span>}</label>}
      {rows
        ? <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{...inputStyle, resize:'vertical'}} />
        : <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} min={min} step={step} style={inputStyle} />
      }
    </div>
  );
}

export function Select({ label, value, onChange, children, required }) {
  return (
    <div style={{ marginBottom:12 }}>
      {label && <label style={{ display:'block', color:'#94a3b8', fontSize:13, marginBottom:4, fontFamily:'Tajawal,sans-serif' }}>{label}{required&&<span style={{color:'#ef4444'}}> *</span>}</label>}
      <select value={value} onChange={e=>onChange(e.target.value)} style={{ width:'100%', background:'#0f172a', border:'1.5px solid #2d3a52', borderRadius:10, padding:'9px 12px', color:'#e2e8f0', fontSize:14, fontFamily:'Tajawal,sans-serif', outline:'none', boxSizing:'border-box' }}>
        {children}
      </select>
    </div>
  );
}

export function Btn({ children, onClick, color='#3b82f6', style:s, size='md', disabled, type='button' }) {
  const pad = size==='sm'?'6px 12px':size==='lg'?'13px 28px':'10px 20px';
  const fs = size==='sm'?13:size==='lg'?16:14;
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{
      background:disabled?'#374151':color, color:'#fff', border:'none', borderRadius:10,
      padding:pad, fontSize:fs, fontFamily:'Tajawal,sans-serif', cursor:disabled?'not-allowed':'pointer',
      fontWeight:600, transition:'opacity .2s', opacity:disabled?0.6:1, ...s
    }}>{children}</button>
  );
}

export function Card({ children, style:s }) {
  return <div style={{ background:'#1e2535', borderRadius:16, padding:'18px 20px', boxShadow:'0 4px 20px #0003', ...s }}>{children}</div>;
}

export function StatCard({ label, value, icon, color='#3b82f6', sub }) {
  return (
    <div style={{ background:'#1e2535', borderRadius:16, padding:'18px 20px', boxShadow:'0 4px 20px #0003', borderRight:`4px solid ${color}` }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
        <span style={{ fontSize:22 }}>{icon}</span>
        <span style={{ color:'#94a3b8', fontSize:13, fontFamily:'Tajawal,sans-serif' }}>{label}</span>
      </div>
      <div style={{ color:'#e2e8f0', fontWeight:800, fontSize:24, fontFamily:'Tajawal,sans-serif' }}>{value}</div>
      {sub && <div style={{ color:'#64748b', fontSize:12, fontFamily:'Tajawal,sans-serif', marginTop:2 }}>{sub}</div>}
    </div>
  );
}

export const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
export const fmt = (d) => { const dt=new Date(d); return dt.toLocaleDateString('ar-SA')+' '+dt.toLocaleTimeString('ar-SA',{hour:'2-digit',minute:'2-digit'}); };
export const fmtDate = (d) => new Date(d).toLocaleDateString('ar-SA');
export const diffDays = (d1, d2=new Date()) => Math.ceil((new Date(d1)-new Date(d2))/86400000);
