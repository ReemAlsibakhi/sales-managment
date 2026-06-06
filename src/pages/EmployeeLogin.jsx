import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Btn, Input } from '../components/UI';

export default function EmployeeLogin({ session, onLogin, onStoreLogout }) {
  const [employees, setEmployees] = useState([]);
  const [selected, setSelected] = useState(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('employees').select('*').eq('store_id', session.storeId).eq('is_active', true);
      setEmployees(data || []);
    };
    fetch();
  }, [session.storeId]);

  const tryLogin = async () => {
    if (!selected || !pin) return setError('اختر الموظف وأدخل الرمز');
    setLoading(true);
    const emp = employees.find(e => e.id === selected);
    if (!emp || emp.pin !== pin) {
      setError('رمز الدخول غير صحيح');
      setPin('');
      setLoading(false);
      return;
    }
    onLogin(emp);
    setLoading(false);
  };

  return (
    <div dir="rtl" style={{ minHeight:'100vh', background:'#0f172a', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontFamily:'Tajawal,sans-serif', padding:16 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&display=swap'); *{box-sizing:border-box}`}</style>

      <div style={{ textAlign:'center', marginBottom:28 }}>
        <div style={{ fontSize:42, fontWeight:900, color:'#38bdf8' }}>حسابات</div>
        <div style={{ fontSize:18, fontWeight:700, color:'#e2e8f0', marginTop:4 }}>🏪 {session.storeName}</div>
        <div style={{ color:'#64748b', fontSize:13, marginTop:2 }}>اختر الموظف وأدخل رمز الدخول</div>
      </div>

      <div style={{ background:'#1e2535', borderRadius:20, padding:28, width:'100%', maxWidth:380, boxShadow:'0 25px 80px #000a' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:20 }}>
          {employees.map(emp => (
            <button key={emp.id} onClick={() => { setSelected(emp.id); setPin(''); setError(''); }} style={{
              background: selected===emp.id ? '#1d4ed8' : '#0f172a',
              border: '1.5px solid ' + (selected===emp.id ? '#3b82f6' : '#2d3a52'),
              borderRadius:12, padding:'12px 16px', color:'#e2e8f0', cursor:'pointer',
              fontFamily:'Tajawal,sans-serif', fontSize:15, fontWeight:600, textAlign:'right', transition:'all .2s'
            }}>
              👤 {emp.name}
              {emp.role === 'owner' && <span style={{ color:'#38bdf8', fontSize:11, marginRight:8 }}>(صاحب المحل)</span>}
            </button>
          ))}
          {employees.length === 0 && (
            <div style={{ color:'#64748b', textAlign:'center', padding:20 }}>لا يوجد موظفون. تواصل مع الأدمن.</div>
          )}
        </div>

        {selected && (
          <>
            <Input label="رمز الدخول (PIN)" value={pin} onChange={setPin} type="password" placeholder="أدخل الرمز" />
            {error && <div style={{ color:'#ef4444', fontSize:13, marginBottom:8 }}>⚠️ {error}</div>}
            <Btn onClick={tryLogin} color="#3b82f6" style={{ width:'100%', marginBottom:8 }} size="lg" disabled={loading}>
              {loading ? '...' : 'دخول →'}
            </Btn>
          </>
        )}

        <button onClick={onStoreLogout} style={{ background:'none', border:'none', color:'#64748b', fontSize:13, cursor:'pointer', fontFamily:'Tajawal,sans-serif', width:'100%', marginTop:8 }}>
          ← تسجيل خروج من المحل
        </button>
      </div>
    </div>
  );
}
