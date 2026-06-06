import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Card, Btn, Input, Modal, StatCard, useToast, Toast } from '../components/UI';
import bcrypt from 'bcryptjs';

export default function AdminPanel({ onLogout }) {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(null);
  const [form, setForm] = useState({ name:'', email:'', password:'' });
  const { toasts, add: toast, remove } = useToast();

  const fetchStores = async () => {
    setLoading(true);
    const { data } = await supabase.from('stores').select('*').order('created_at', { ascending: false });
    setStores(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchStores(); }, []);

  const addStore = async () => {
    if (!form.name || !form.email || !form.password) return toast('أدخل جميع البيانات', 'error');
    const hash = await bcrypt.hash(form.password, 10);
    const { error } = await supabase.from('stores').insert({ name: form.name, email: form.email, password_hash: hash });
    if (error) return toast(error.message, 'error');

    // Get the new store to add owner employee
    const { data: newStore } = await supabase.from('stores').select('id').eq('email', form.email).single();
    if (newStore) {
      await supabase.from('employees').insert({ store_id: newStore.id, name: 'صاحب المحل', pin: '1234', role: 'owner' });
    }

    toast('تم إنشاء المحل ✓');
    setShowAdd(false);
    setForm({ name:'', email:'', password:'' });
    fetchStores();
  };

  const toggleStore = async (store) => {
    await supabase.from('stores').update({ is_active: !store.is_active }).eq('id', store.id);
    toast(store.is_active ? 'تم إيقاف المحل' : 'تم تفعيل المحل', store.is_active ? 'warn' : 'success');
    fetchStores();
  };

  const resetPassword = async (storeId, newPass) => {
    const hash = await bcrypt.hash(newPass, 10);
    await supabase.from('stores').update({ password_hash: hash }).eq('id', storeId);
    toast('تم تغيير كلمة السر ✓');
    setShowEdit(null);
  };

  const deleteStore = async (id) => {
    if (!window.confirm('⚠️ سيتم حذف المحل وجميع بياناته. هل أنت متأكد؟')) return;
    await supabase.from('stores').delete().eq('id', id);
    toast('تم الحذف');
    fetchStores();
  };

  const activeStores = stores.filter(s => s.is_active).length;

  return (
    <div dir="rtl" style={{ minHeight:'100vh', background:'#0f172a', fontFamily:'Tajawal,sans-serif', color:'#e2e8f0' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;600;700;800;900&display=swap');
        * { box-sizing:border-box; }
        ::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:#0f172a}::-webkit-scrollbar-thumb{background:#2d3a52;border-radius:3px}
        @keyframes slideIn{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:none}}
        .row-hover:hover{background:#252f42!important}
      `}</style>

      {/* Header */}
      <div style={{ background:'#1e2535', borderBottom:'1px solid #2d3a52', padding:'14px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontWeight:900, fontSize:24, color:'#38bdf8' }}>حسابات</div>
          <div style={{ fontSize:12, color:'#f59e0b', fontWeight:600 }}>🔐 لوحة الأدمن</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ color:'#94a3b8', fontSize:13 }}>admin@hesabat.app</span>
          <Btn size="sm" color="#374151" onClick={onLogout}>خروج</Btn>
        </div>
      </div>

      <div style={{ padding:24, maxWidth:1200, margin:'0 auto' }}>
        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:14, marginBottom:24 }}>
          <StatCard label="إجمالي المحلات" value={stores.length} icon="🏪" color="#38bdf8" />
          <StatCard label="المحلات النشطة" value={activeStores} icon="✅" color="#22c55e" />
          <StatCard label="المحلات الموقوفة" value={stores.length - activeStores} icon="⛔" color="#ef4444" />
        </div>

        {/* Stores Table */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <h2 style={{ margin:0, fontSize:18 }}>🏪 إدارة المحلات</h2>
          <Btn onClick={() => setShowAdd(true)} color="#3b82f6">+ إضافة محل جديد</Btn>
        </div>

        <Card>
          {loading ? (
            <div style={{ textAlign:'center', padding:40, color:'#64748b' }}>جاري التحميل...</div>
          ) : stores.length === 0 ? (
            <div style={{ textAlign:'center', padding:40, color:'#64748b' }}>لا توجد محلات بعد. أضف أول محل!</div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
                <thead>
                  <tr style={{ color:'#64748b', borderBottom:'2px solid #2d3a52' }}>
                    {['اسم المحل', 'الإيميل', 'تاريخ الإنشاء', 'الحالة', 'إجراءات'].map(h => (
                      <th key={h} style={{ padding:'10px 14px', textAlign:'right', fontWeight:600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stores.map(store => (
                    <tr key={store.id} className="row-hover" style={{ borderBottom:'1px solid #1e2535' }}>
                      <td style={{ padding:'12px 14px', fontWeight:700 }}>🏪 {store.name}</td>
                      <td style={{ padding:'12px 14px', color:'#94a3b8' }}>{store.email}</td>
                      <td style={{ padding:'12px 14px', color:'#64748b', fontSize:13 }}>
                        {new Date(store.created_at).toLocaleDateString('ar-SA')}
                      </td>
                      <td style={{ padding:'12px 14px' }}>
                        <span style={{ background: store.is_active ? '#166534' : '#7f1d1d', padding:'3px 12px', borderRadius:99, fontSize:12, fontWeight:600 }}>
                          {store.is_active ? '✅ نشط' : '⛔ موقوف'}
                        </span>
                      </td>
                      <td style={{ padding:'12px 14px' }}>
                        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                          <Btn size="sm" color={store.is_active ? '#92400e' : '#166534'} onClick={() => toggleStore(store)}>
                            {store.is_active ? 'إيقاف' : 'تفعيل'}
                          </Btn>
                          <Btn size="sm" color="#1d4ed8" onClick={() => setShowEdit(store)}>تغيير السر</Btn>
                          <Btn size="sm" color="#7f1d1d" onClick={() => deleteStore(store.id)}>حذف</Btn>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Add Store Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="➕ إضافة محل جديد">
        <Input label="اسم المحل" value={form.name} onChange={v => setForm(p=>({...p,name:v}))} placeholder="مثال: محل أبو أحمد" required />
        <Input label="الإيميل" value={form.email} onChange={v => setForm(p=>({...p,email:v}))} type="email" placeholder="store@example.com" required />
        <Input label="كلمة السر" value={form.password} onChange={v => setForm(p=>({...p,password:v}))} type="password" placeholder="كلمة سر قوية" required />
        <div style={{ background:'#0f172a', borderRadius:10, padding:12, marginBottom:12, fontSize:13, color:'#94a3b8' }}>
          💡 سيتم إنشاء موظف "صاحب المحل" تلقائياً برمز دخول <b style={{color:'#38bdf8'}}>1234</b> — ينصح بتغييره
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <Btn onClick={addStore} color="#22c55e" style={{ flex:1 }}>إنشاء المحل</Btn>
          <Btn onClick={() => setShowAdd(false)} color="#374151" style={{ flex:1 }}>إلغاء</Btn>
        </div>
      </Modal>

      {/* Reset Password Modal */}
      <ResetPasswordModal store={showEdit} onClose={() => setShowEdit(null)} onReset={resetPassword} />

      <Toast toasts={toasts} remove={remove} />
    </div>
  );
}

function ResetPasswordModal({ store, onClose, onReset }) {
  const [pass, setPass] = useState('');
  if (!store) return null;
  return (
    <Modal open={!!store} onClose={onClose} title={`تغيير كلمة سر: ${store.name}`}>
      <Input label="كلمة السر الجديدة" value={pass} onChange={setPass} type="password" placeholder="أدخل كلمة سر جديدة" />
      <div style={{ display:'flex', gap:8 }}>
        <Btn onClick={() => { if(pass) onReset(store.id, pass); }} color="#22c55e" style={{ flex:1 }}>حفظ</Btn>
        <Btn onClick={onClose} color="#374151" style={{ flex:1 }}>إلغاء</Btn>
      </div>
    </Modal>
  );
}
