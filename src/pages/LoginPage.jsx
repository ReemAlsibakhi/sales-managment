import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Input, Btn } from '../components/UI';

export default function LoginPage() {
  const { adminLogin, storeLogin } = useAuth();
  const [tab, setTab] = useState('store'); // 'store' | 'admin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return setError('أدخل الإيميل وكلمة السر');
    setLoading(true);
    setError('');
    const fn = tab === 'admin' ? adminLogin : storeLogin;
    const result = await fn(email, password);
    if (result.error) setError(result.error);
    setLoading(false);
  };

  return (
    <div dir="rtl" style={{ minHeight:'100vh', background:'#0f172a', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontFamily:'Tajawal,sans-serif', padding:16 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&display=swap'); *{box-sizing:border-box}`}</style>

      {/* Logo */}
      <div style={{ textAlign:'center', marginBottom:36 }}>
        <div style={{ fontSize:52, fontWeight:900, color:'#38bdf8', letterSpacing:2, textShadow:'0 0 40px #38bdf850' }}>حسابات</div>
        <div style={{ color:'#64748b', fontSize:14, marginTop:4 }}>حسابات لإدارة المبيعات و الفواتير</div>
      </div>

      <div style={{ background:'#1e2535', borderRadius:22, padding:32, width:'100%', maxWidth:400, boxShadow:'0 25px 80px #000c' }}>
        {/* Tabs */}
        <div style={{ display:'flex', background:'#0f172a', borderRadius:12, padding:4, marginBottom:24, gap:4 }}>
          {[['store','🏪 دخول المحل'],['admin','🔐 أدمن']].map(([v,l]) => (
            <button key={v} onClick={() => { setTab(v); setError(''); }} style={{
              flex:1, background: tab===v ? '#1d4ed8' : 'none', border:'none', borderRadius:10,
              padding:'9px 0', color: tab===v ? '#fff' : '#94a3b8', fontFamily:'Tajawal,sans-serif',
              fontSize:14, fontWeight:600, cursor:'pointer', transition:'all .2s'
            }}>{l}</button>
          ))}
        </div>

        <Input label="الإيميل" value={email} onChange={setEmail} type="email" placeholder={tab==='admin'?'admin@hesabat.app':'store@example.com'} required />
        <Input label="كلمة السر" value={password} onChange={setPassword} type="password" placeholder="••••••••" required />

        {error && (
          <div style={{ background:'#7f1d1d', borderRadius:10, padding:'10px 14px', marginBottom:12, fontSize:13, color:'#fca5a5' }}>
            ⚠️ {error}
          </div>
        )}

        <Btn onClick={handleLogin} color="#3b82f6" style={{ width:'100%' }} size="lg" disabled={loading}>
          {loading ? '⏳ جاري الدخول...' : 'دخول →'}
        </Btn>

        {tab === 'store' && (
          <div style={{ marginTop:16, textAlign:'center', color:'#64748b', fontSize:13 }}>
            للحصول على حساب تواصل مع الأدمن
          </div>
        )}
      </div>
    </div>
  );
}
