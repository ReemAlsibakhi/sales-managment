import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Card, Btn, Input, Select, Modal, StatCard, Toast, useToast, uid, fmt, fmtDate, diffDays } from '../components/UI';


export default function StoreDashboard({ session, onEmployeeLogout, onStoreLogout }) {
  const storeId = session.storeId;
  const emp = session.employee;
  const storeName = session.storeName;

  const [tab, setTab] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [debts, setDebts] = useState([]);
  const [returns, setReturns] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const { toasts, add: toast, remove } = useToast();

  // Fetch all data
  const fetchAll = useCallback(async () => {
    const [p, s, pu, d, r, e] = await Promise.all([
      supabase.from('products').select('*').eq('store_id', storeId).order('created_at', { ascending: false }),
      supabase.from('sales').select('*').eq('store_id', storeId).order('created_at', { ascending: false }),
      supabase.from('purchases').select('*').eq('store_id', storeId).order('created_at', { ascending: false }),
      supabase.from('debts').select('*').eq('store_id', storeId).order('created_at', { ascending: false }),
      supabase.from('returns').select('*').eq('store_id', storeId).order('created_at', { ascending: false }),
      supabase.from('employees').select('*').eq('store_id', storeId),
    ]);
    setProducts(p.data || []);
    setSales(s.data || []);
    setPurchases(pu.data || []);
    setDebts(d.data || []);
    setReturns(r.data || []);
    setEmployees(e.data || []);
    setLoadingData(false);
  }, [storeId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Real-time subscriptions
  useEffect(() => {
    const tables = ['products', 'sales', 'purchases', 'debts', 'returns', 'employees'];
    const subs = tables.map(table =>
      supabase.channel(`${table}_${storeId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table, filter: `store_id=eq.${storeId}` }, () => fetchAll())
        .subscribe()
    );
    return () => subs.forEach(s => supabase.removeChannel(s));
  }, [storeId, fetchAll]);

  const lowStock = products.filter(p => p.unit !== 'kg' && p.qty <= 10 && p.qty > 0);
  const expiringSoon = products.filter(p => p.expiry && diffDays(p.expiry) <= 30 && diffDays(p.expiry) >= 0);
  const overdueDebts = debts.filter(d => !d.paid && Math.abs(diffDays(d.created_at)) >= 3);

  const tabs = [
    { id:'dashboard', label:'الرئيسية', icon:'📊' },
    { id:'pos', label:'نقطة البيع', icon:'🛒' },
    { id:'inventory', label:'المخزون', icon:'📦' },
    { id:'purchases', label:'المشتريات', icon:'🚚' },
    { id:'debts', label:'الديون', icon:'💳', badge: overdueDebts.length },
    { id:'returns', label:'المرتجعات', icon:'↩️' },
    { id:'reports', label:'التقارير', icon:'📈' },
    { id:'employees', label:'الموظفون', icon:'👥' },
  ];

  const shared = { storeId, products, setProducts, sales, setSales, purchases, setPurchases, debts, setDebts, returns, setReturns, employees, setEmployees, session, storeName, toast, fetchAll };

  if (loadingData) return (
    <div dir="rtl" style={{ minHeight:'100vh', background:'#0f172a', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Tajawal,sans-serif', color:'#38bdf8', fontSize:20 }}>
      ⏳ جاري تحميل البيانات...
    </div>
  );

  return (
    <div dir="rtl" style={{ minHeight:'100vh', background:'#0f172a', fontFamily:'Tajawal,sans-serif', color:'#e2e8f0' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;600;700;800;900&display=swap');
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:#0f172a}::-webkit-scrollbar-thumb{background:#2d3a52;border-radius:3px}
        input:focus,select:focus{border-color:#3b82f6!important}
        @keyframes slideIn{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:none}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        .tab-btn:hover{background:#2d3a52!important}
        .row-hover:hover{background:#252f42!important}
        .prod-card:hover{border-color:#38bdf8!important}
      `}</style>

      {/* Alerts */}
      {(lowStock.length > 0 || expiringSoon.length > 0 || overdueDebts.length > 0) && (
        <div style={{ background:'#7c3aed', padding:'8px 20px', display:'flex', gap:16, flexWrap:'wrap', fontSize:13, alignItems:'center' }}>
          {lowStock.length > 0 && <span>⚠️ {lowStock.length} صنف مخزونه أقل من 10</span>}
          {expiringSoon.length > 0 && <span>⏰ {expiringSoon.length} صنف ينتهي قريباً</span>}
          {overdueDebts.length > 0 && <span style={{ animation:'pulse 2s infinite' }}>🚨 {overdueDebts.length} دين متأخر</span>}
        </div>
      )}

      {/* Header */}
      <div style={{ background:'#1e2535', borderBottom:'1px solid #2d3a52', padding:'12px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontWeight:900, fontSize:22, color:'#38bdf8' }}>حسابات</div>
          <div style={{ fontSize:12, color:'#64748b' }}>حسابات لإدارة المبيعات و الفواتير</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ textAlign:'left' }}>
            <div style={{ fontSize:13, color:'#94a3b8' }}>🏪 {storeName}</div>
            <div style={{ fontSize:12, color:'#38bdf8' }}>👤 {emp?.name}</div>
          </div>
          <Btn size="sm" color="#1d4ed8" onClick={onEmployeeLogout}>تغيير موظف</Btn>
          <Btn size="sm" color="#374151" onClick={onStoreLogout}>خروج</Btn>
        </div>
      </div>

      {/* Nav */}
      <div style={{ background:'#1a2436', borderBottom:'1px solid #2d3a52', display:'flex', overflowX:'auto', padding:'0 8px' }}>
        {tabs.map(t => (
          <button key={t.id} className="tab-btn" onClick={() => setTab(t.id)} style={{
            background: tab===t.id ? '#2d3a52' : 'none', border:'none', color: tab===t.id ? '#38bdf8' : '#94a3b8',
            padding:'12px 16px', cursor:'pointer', fontFamily:'Tajawal,sans-serif', fontSize:13, fontWeight:600,
            borderBottom: tab===t.id ? '2px solid #38bdf8' : '2px solid transparent', whiteSpace:'nowrap', transition:'all .2s', position:'relative'
          }}>
            {t.icon} {t.label}
            {t.badge > 0 && <span style={{ background:'#ef4444', color:'#fff', borderRadius:99, fontSize:10, padding:'1px 5px', marginRight:4 }}>{t.badge}</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding:20, maxWidth:1400, margin:'0 auto' }}>
        {tab==='dashboard' && <Dashboard {...shared} lowStock={lowStock} expiringSoon={expiringSoon} overdueDebts={overdueDebts} />}
        {tab==='pos' && <POS {...shared} />}
        {tab==='inventory' && <Inventory {...shared} lowStock={lowStock} expiringSoon={expiringSoon} />}
        {tab==='purchases' && <Purchases {...shared} />}
        {tab==='debts' && <Debts {...shared} overdueDebts={overdueDebts} />}
        {tab==='returns' && <Returns {...shared} />}
        {tab==='reports' && <Reports {...shared} />}
        {tab==='employees' && <Employees {...shared} />}
      </div>

      <Toast toasts={toasts} remove={remove} />
    </div>
  );
}

// ─────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────
function Dashboard({ sales, products, debts, lowStock, expiringSoon, overdueDebts }) {
  const today = new Date().toDateString();
  const todaySales = sales.filter(s => new Date(s.created_at).toDateString() === today);
  const todayRevenue = todaySales.reduce((a, s) => a + (s.total || 0), 0);
  const todayCost = todaySales.reduce((a, s) => a + (s.cost_total || 0), 0);
  const todayProfit = todayRevenue - todayCost;
  const totalDebt = debts.filter(d => !d.paid).reduce((a, d) => a + (d.remaining || 0), 0);

  const soldQty = {};
  todaySales.forEach(s => (s.items||[]).forEach(i => { soldQty[i.name] = (soldQty[i.name]||0) + i.qty; }));
  const best = Object.entries(soldQty).sort((a,b)=>b[1]-a[1])[0];

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(190px,1fr))', gap:14, marginBottom:24 }}>
        <StatCard label="مبيعات اليوم" value={todayRevenue.toFixed(2)+' ﷼'} icon="💰" color="#22c55e" sub={`${todaySales.length} فاتورة`} />
        <StatCard label="ربح اليوم" value={todayProfit.toFixed(2)+' ﷼'} icon="📈" color="#38bdf8" />
        <StatCard label="أكثر منتج مبيعاً" value={best?best[0]:'—'} icon="🏆" color="#f59e0b" sub={best?`${best[1]} وحدة`:''} />
        <StatCard label="إجمالي الديون" value={totalDebt.toFixed(2)+' ﷼'} icon="💳" color="#ef4444" sub={`${debts.filter(d=>!d.paid).length} زبون`} />
        <StatCard label="أصناف المخزون" value={products.length} icon="📦" color="#8b5cf6" />
        <StatCard label="تنبيهات" value={lowStock.length+expiringSoon.length} icon="⚠️" color="#f97316" />
      </div>

      {(lowStock.length>0||expiringSoon.length>0||overdueDebts.length>0) && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14, marginBottom:24 }}>
          {lowStock.length>0 && <Card style={{ borderRight:'3px solid #f97316' }}>
            <div style={{ fontWeight:700, marginBottom:10, color:'#f97316' }}>⚠️ مخزون منخفض</div>
            {lowStock.map(p=><div key={p.id} style={{ fontSize:13, color:'#94a3b8', padding:'3px 0', borderBottom:'1px solid #2d3a52' }}>{p.name}: <b style={{color:'#ef4444'}}>{p.qty}</b> قطعة</div>)}
          </Card>}
          {expiringSoon.length>0 && <Card style={{ borderRight:'3px solid #f59e0b' }}>
            <div style={{ fontWeight:700, marginBottom:10, color:'#f59e0b' }}>⏰ ينتهي قريباً</div>
            {expiringSoon.map(p=><div key={p.id} style={{ fontSize:13, color:'#94a3b8', padding:'3px 0', borderBottom:'1px solid #2d3a52' }}>{p.name}: <b style={{color:'#f59e0b'}}>{diffDays(p.expiry)} يوم</b></div>)}
          </Card>}
          {overdueDebts.length>0 && <Card style={{ borderRight:'3px solid #ef4444' }}>
            <div style={{ fontWeight:700, marginBottom:10, color:'#ef4444' }}>🚨 ديون متأخرة</div>
            {overdueDebts.map(d=><div key={d.id} style={{ fontSize:13, color:'#94a3b8', padding:'3px 0', borderBottom:'1px solid #2d3a52' }}>{d.customer_name}: <b style={{color:'#ef4444'}}>{d.remaining?.toFixed(2)} ﷼</b></div>)}
          </Card>}
        </div>
      )}

      <Card>
        <div style={{ fontWeight:700, marginBottom:14, fontSize:16 }}>📋 آخر المبيعات</div>
        {sales.slice(0,8).length===0 ? <div style={{ color:'#64748b', textAlign:'center', padding:24 }}>لا توجد مبيعات بعد</div> : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead><tr style={{ color:'#64748b', borderBottom:'1px solid #2d3a52' }}>
                {['التاريخ','الموظف','المبلغ','الدفع','الزبون'].map(h=><th key={h} style={{ padding:'8px 10px', textAlign:'right' }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {sales.slice(0,8).map(s=>(
                  <tr key={s.id} className="row-hover" style={{ borderBottom:'1px solid #1e2535' }}>
                    <td style={{ padding:'8px 10px', color:'#94a3b8' }}>{fmt(s.created_at)}</td>
                    <td style={{ padding:'8px 10px' }}>{s.emp_name||'—'}</td>
                    <td style={{ padding:'8px 10px', color:'#22c55e', fontWeight:700 }}>{s.total?.toFixed(2)} ﷼</td>
                    <td style={{ padding:'8px 10px' }}>
                      <span style={{ background: s.pay_method==='cash'?'#166534':s.pay_method==='transfer'?'#1e3a5f':'#7c3aed', padding:'2px 8px', borderRadius:99, fontSize:11 }}>
                        {s.pay_method==='cash'?'نقدي':s.pay_method==='transfer'?'تحويل':s.pay_method==='debt'?'دين':'جزئي'}
                      </span>
                    </td>
                    <td style={{ padding:'8px 10px', color:'#94a3b8' }}>{s.customer_name||'—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────
// POS
// ─────────────────────────────────────────────
function POS({ storeId, products, setProducts, sales, setSales, debts, setDebts, session, storeName, toast, fetchAll }) {
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [payMethod, setPayMethod] = useState('cash');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [showInvoice, setShowInvoice] = useState(null);
  const [showRestore, setShowRestore] = useState(false);
  const [saving, setSaving] = useState(false);
  const searchRef = useRef();

  const filtered = search.length > 0
    ? products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).slice(0, 8)
    : [...products].sort((a, b) => (b.last_sold || 0) - (a.last_sold || 0)).slice(0, 12);

  const addToCart = (product) => {
    setCart(prev => {
      const ex = prev.find(i => i.product_id === product.id);
      if (ex) return prev.map(i => i.product_id===product.id ? {...i, qty: i.qty+(product.unit==='kg'?0.5:1)} : i);
      return [...prev, { product_id: product.id, name: product.name, qty: product.unit==='kg'?0.5:1, price: product.price, cost: product.cost||0, unit: product.unit }];
    });
    setSearch('');
    searchRef.current?.focus();
  };

  const total = cart.reduce((a, i) => a + i.qty * i.price, 0);
  const costTotal = cart.reduce((a, i) => a + i.qty * (i.cost||0), 0);

  const completeSale = async () => {
    if (cart.length === 0) return toast('السلة فارغة', 'error');
    if ((payMethod==='debt'||payMethod==='partial') && !customerName) return toast('أدخل اسم الزبون', 'error');
    for (const item of cart) {
      const prod = products.find(p => p.id === item.product_id);
      if (prod && prod.unit !== 'kg' && prod.qty < item.qty) return toast(`الكمية غير كافية: ${prod.name}`, 'error');
    }

    setSaving(true);
    const paid = payMethod==='cash'||payMethod==='transfer' ? total : payMethod==='partial' ? (parseFloat(paidAmount)||0) : 0;
    const remaining = total - paid;

    const saleData = {
      store_id: storeId, emp_id: session.employee?.id, emp_name: session.employee?.name,
      customer_name: customerName||null, customer_phone: customerPhone||null,
      items: cart, total, cost_total: costTotal, pay_method: payMethod, paid, remaining
    };

    const { data: newSale, error } = await supabase.from('sales').insert(saleData).select().single();
    if (error) { toast('خطأ في حفظ البيع', 'error'); setSaving(false); return; }

    // Update stock
    for (const item of cart) {
      const prod = products.find(p => p.id === item.product_id);
      if (prod) {
        await supabase.from('products').update({ qty: Math.max(0, prod.qty - item.qty), last_sold: Date.now() }).eq('id', prod.id);
      }
    }

    // Handle debt
    if (remaining > 0 && customerName) {
      const existDebt = debts.find(d => !d.paid && d.customer_name === customerName);
      if (existDebt) {
        await supabase.from('debts').update({
          total: existDebt.total + remaining, remaining: existDebt.remaining + remaining,
          sale_ids: [...(existDebt.sale_ids||[]), newSale.id]
        }).eq('id', existDebt.id);
      } else {
        await supabase.from('debts').insert({
          store_id: storeId, customer_name: customerName, customer_phone: customerPhone||null,
          total: remaining, remaining, paid: false, payments: [], sale_ids: [newSale.id], emp_name: session.employee?.name
        });
      }
    }

    await fetchAll();
    setShowInvoice({ ...saleData, id: newSale.id, created_at: newSale.created_at, storeName });
    setCart([]); setCustomerName(''); setCustomerPhone(''); setPaidAmount(''); setPayMethod('cash');
    setSaving(false);
    toast('تم تسجيل البيع ✓');
  };

  const sendWhatsApp = (inv) => {
    const items = inv.items.map(i=>`• ${i.name}: ${i.qty} × ${i.price} = ${(i.qty*i.price).toFixed(2)} ﷼`).join('\n');
    const msg = `🧾 فاتورة من ${inv.storeName}\n📅 ${fmt(inv.created_at)}\n👤 ${inv.emp_name}\n\n${items}\n\n💰 الإجمالي: ${inv.total.toFixed(2)} ﷼\n${inv.remaining>0?`⚠️ المتبقي: ${inv.remaining.toFixed(2)} ﷼`:'✅ مدفوع بالكامل'}`;
    const phone = inv.customer_phone?.replace(/\D/g,'');
    window.open(`https://wa.me/${phone||''}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 370px', gap:20, alignItems:'start' }}>
      <div>
        <Card style={{ marginBottom:16 }}>
          <input ref={searchRef} value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="🔍 ابحث عن منتج... (اكتب أول حرف)" autoFocus
            style={{ width:'100%', background:'#0f172a', border:'1.5px solid #3b82f6', borderRadius:12, padding:'12px 16px', color:'#e2e8f0', fontSize:16, fontFamily:'Tajawal,sans-serif', outline:'none' }} />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(145px,1fr))', gap:8, marginTop:12 }}>
            {filtered.map(p => (
              <button key={p.id} className="prod-card" onClick={() => addToCart(p)} style={{
                background:'#0f172a', border:'1px solid #2d3a52', borderRadius:10, padding:'10px 12px',
                cursor:'pointer', textAlign:'right', color:'#e2e8f0', fontFamily:'Tajawal,sans-serif', transition:'border-color .2s'
              }}>
                <div style={{ fontWeight:600, fontSize:13 }}>{p.name}</div>
                <div style={{ color:'#22c55e', fontSize:12, marginTop:2 }}>{p.price} ﷼/{p.unit==='kg'?'كجم':'قطعة'}</div>
                <div style={{ color: p.qty<=10?'#ef4444':'#64748b', fontSize:11 }}>{p.qty} {p.unit==='kg'?'كجم':'قطعة'}</div>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <div style={{ fontWeight:700, marginBottom:12, fontSize:16 }}>🛒 السلة</div>
          {cart.length===0 ? <div style={{ color:'#64748b', textAlign:'center', padding:20 }}>السلة فارغة</div> : (
            <>
              {cart.map(item => (
                <div key={item.product_id} style={{ display:'flex', gap:8, alignItems:'center', padding:'8px 0', borderBottom:'1px solid #2d3a52', flexWrap:'wrap' }}>
                  <div style={{ flex:1, fontSize:14, fontWeight:600, minWidth:100 }}>{item.name}</div>
                  <input type="number" value={item.qty} min={0} step={item.unit==='kg'?0.1:1}
                    onChange={e => { const v=parseFloat(e.target.value); if(!v||v<=0) setCart(p=>p.filter(i=>i.product_id!==item.product_id)); else setCart(p=>p.map(i=>i.product_id===item.product_id?{...i,qty:v}:i)); }}
                    style={{ width:65, background:'#0f172a', border:'1px solid #2d3a52', borderRadius:8, padding:'5px 8px', color:'#e2e8f0', fontFamily:'Tajawal,sans-serif', textAlign:'center' }} />
                  <span style={{ color:'#64748b', fontSize:11 }}>{item.unit==='kg'?'كجم':'قطعة'}</span>
                  <input type="number" value={item.price} min={0} step="0.01"
                    onChange={e => setCart(p=>p.map(i=>i.product_id===item.product_id?{...i,price:parseFloat(e.target.value)||0}:i))}
                    style={{ width:70, background:'#0f172a', border:'1px solid #2d3a52', borderRadius:8, padding:'5px 8px', color:'#e2e8f0', fontFamily:'Tajawal,sans-serif', textAlign:'center' }} />
                  <span style={{ color:'#64748b', fontSize:11 }}>﷼</span>
                  <div style={{ width:75, color:'#22c55e', fontWeight:700, textAlign:'center' }}>{(item.qty*item.price).toFixed(2)} ﷼</div>
                  <button onClick={()=>setCart(p=>p.filter(i=>i.product_id!==item.product_id))} style={{ background:'none', border:'none', color:'#ef4444', cursor:'pointer', fontSize:18 }}>×</button>
                </div>
              ))}
              <div style={{ marginTop:12, textAlign:'left', fontSize:20, fontWeight:900, color:'#22c55e' }}>الإجمالي: {total.toFixed(2)} ﷼</div>
            </>
          )}
        </Card>
      </div>

      <div>
        <Card>
          <div style={{ fontWeight:700, marginBottom:14, fontSize:16 }}>💳 الدفع</div>
          <div style={{ display:'flex', gap:6, marginBottom:16, flexWrap:'wrap' }}>
            {[['cash','💵 نقدي','#166534'],['transfer','🏦 تحويل','#1e3a5f'],['debt','📋 دين','#7c3aed'],['partial','⚡ جزئي','#92400e']].map(([v,l,bg])=>(
              <button key={v} onClick={()=>setPayMethod(v)} style={{
                flex:1, background:payMethod===v?bg:'#0f172a', border:'1.5px solid '+(payMethod===v?'transparent':'#2d3a52'),
                borderRadius:10, padding:'8px 4px', color:'#e2e8f0', cursor:'pointer', fontFamily:'Tajawal,sans-serif', fontSize:12, fontWeight:600, minWidth:60
              }}>{l}</button>
            ))}
          </div>

          {(payMethod==='debt'||payMethod==='partial'||payMethod==='cash'||payMethod==='transfer') && (
            <>
              <Input label={`اسم الزبون${payMethod==='debt'||payMethod==='partial'?' *':' (اختياري)'}`} value={customerName} onChange={setCustomerName} placeholder="اسم الزبون" />
              <Input label="رقم الجوال (اختياري)" value={customerPhone} onChange={setCustomerPhone} placeholder="05xxxxxxxx" type="tel" />
            </>
          )}
          {payMethod==='partial' && (
            <Input label="المبلغ المدفوع *" value={paidAmount} onChange={setPaidAmount} type="number" placeholder="0.00" min="0" step="0.01" />
          )}
          {payMethod==='partial' && paidAmount && (
            <div style={{ background:'#0f172a', borderRadius:10, padding:10, marginBottom:12 }}>
              <div style={{ color:'#22c55e', fontSize:13 }}>مدفوع: {parseFloat(paidAmount).toFixed(2)} ﷼</div>
              <div style={{ color:'#ef4444', fontSize:13 }}>متبقي: {Math.max(0,total-parseFloat(paidAmount)).toFixed(2)} ﷼</div>
            </div>
          )}

          <div style={{ background:'#0f172a', borderRadius:12, padding:14, marginBottom:14, textAlign:'center' }}>
            <div style={{ color:'#64748b', fontSize:13 }}>الإجمالي</div>
            <div style={{ color:'#22c55e', fontSize:28, fontWeight:900 }}>{total.toFixed(2)} ﷼</div>
          </div>

          <Btn onClick={completeSale} color="#22c55e" style={{ width:'100%', marginBottom:8 }} size="lg" disabled={cart.length===0||saving}>
            {saving ? '⏳ جاري الحفظ...' : '✅ إتمام البيع'}
          </Btn>
          <Btn onClick={()=>setShowRestore(true)} color="#374151" style={{ width:'100%' }} size="sm">📄 استرجاع فاتورة</Btn>
        </Card>
      </div>

      {showInvoice && (
        <Modal open={!!showInvoice} onClose={()=>setShowInvoice(null)} title="🧾 الفاتورة" width={420}>
          <div style={{ textAlign:'center', marginBottom:16 }}>
            <div style={{ fontWeight:900, fontSize:20, color:'#38bdf8' }}>{showInvoice.storeName}</div>
            <div style={{ color:'#64748b', fontSize:13 }}>{fmt(showInvoice.created_at)}</div>
            <div style={{ color:'#94a3b8', fontSize:13 }}>موظف: {showInvoice.emp_name}</div>
          </div>
          {showInvoice.items.map((item,i)=>(
            <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid #2d3a52', fontSize:14 }}>
              <span>{item.name} × {item.qty}</span>
              <span style={{ color:'#22c55e' }}>{(item.qty*item.price).toFixed(2)} ﷼</span>
            </div>
          ))}
          <div style={{ padding:'12px 0', borderTop:'2px solid #38bdf8', marginTop:8, textAlign:'left' }}>
            <div style={{ fontSize:18, fontWeight:900, color:'#22c55e' }}>الإجمالي: {showInvoice.total.toFixed(2)} ﷼</div>
            {showInvoice.remaining>0 && <div style={{ color:'#ef4444', fontSize:14 }}>المتبقي: {showInvoice.remaining.toFixed(2)} ﷼</div>}
          </div>
          <div style={{ display:'flex', gap:8, marginTop:12 }}>
            <Btn color="#25d366" onClick={()=>sendWhatsApp(showInvoice)} style={{ flex:1 }}>📱 واتساب</Btn>
            <Btn color="#374151" onClick={()=>setShowInvoice(null)} style={{ flex:1 }}>إغلاق</Btn>
          </div>
        </Modal>
      )}

      <Modal open={showRestore} onClose={()=>setShowRestore(false)} title="📄 استرجاع فاتورة" width={600}>
        <div style={{ maxHeight:450, overflowY:'auto' }}>
          {sales.slice(0,30).map(s=>(
            <div key={s.id} style={{ padding:'10px 0', borderBottom:'1px solid #2d3a52' }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:14 }}>
                <div><span style={{ color:'#38bdf8' }}>{fmt(s.created_at)}</span>{s.customer_name&&<span style={{ color:'#94a3b8', marginRight:8 }}>— {s.customer_name}</span>}</div>
                <span style={{ color:'#22c55e', fontWeight:700 }}>{s.total?.toFixed(2)} ﷼</span>
              </div>
              <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>{(s.items||[]).map(i=>`${i.name}(${i.qty})`).join(' | ')} · {s.emp_name}</div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────
// INVENTORY
// ─────────────────────────────────────────────
function Inventory({ storeId, products, toast, fetchAll, lowStock, expiringSoon }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editProd, setEditProd] = useState(null);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const blank = { name:'', qty:'', price:'', cost:'', unit:'piece', expiry:'', category:'' };
  const [form, setForm] = useState(blank);

  const save = async () => {
    if (!form.name||!form.price||form.qty==='') return toast('أدخل البيانات المطلوبة', 'error');
    setSaving(true);
    const data = { store_id:storeId, name:form.name, category:form.category||null, unit:form.unit, qty:parseFloat(form.qty), price:parseFloat(form.price), cost:parseFloat(form.cost)||0, expiry:form.expiry||null };
    if (editProd) {
      await supabase.from('products').update(data).eq('id', editProd.id);
      toast('تم التحديث ✓');
    } else {
      await supabase.from('products').insert(data);
      toast('تم الإضافة ✓');
    }
    await fetchAll();
    setSaving(false); setShowAdd(false); setEditProd(null); setForm(blank);
  };

  const del = async (id) => {
    if (!window.confirm('حذف هذا المنتج؟')) return;
    await supabase.from('products').delete().eq('id', id);
    toast('تم الحذف'); fetchAll();
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:8 }}>
        <h2 style={{ margin:0 }}>📦 المخزون ({products.length} صنف)</h2>
        <Btn onClick={()=>{setForm(blank);setEditProd(null);setShowAdd(true);}} color="#3b82f6">+ إضافة صنف</Btn>
      </div>
      <Input label="" value={search} onChange={setSearch} placeholder="🔍 ابحث في المخزون..." style={{ marginBottom:12 }} />
      <Card>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead><tr style={{ color:'#64748b', borderBottom:'2px solid #2d3a52' }}>
              {['الصنف','الفئة','الكمية','البيع','التكلفة','الوحدة','الانتهاء','إجراءات'].map(h=><th key={h} style={{ padding:'10px 12px', textAlign:'right' }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {filtered.map(p => {
                const isLow = p.unit!=='kg' && p.qty<=10;
                const isExp = p.expiry && diffDays(p.expiry)<=30 && diffDays(p.expiry)>=0;
                return (
                  <tr key={p.id} className="row-hover" style={{ borderBottom:'1px solid #1e2535' }}>
                    <td style={{ padding:'10px 12px', fontWeight:600 }}>{p.name}{isLow&&<span style={{color:'#f97316',fontSize:11,marginRight:4}}>⚠️</span>}</td>
                    <td style={{ padding:'10px 12px', color:'#64748b' }}>{p.category||'—'}</td>
                    <td style={{ padding:'10px 12px', color:isLow?'#ef4444':'#22c55e', fontWeight:700 }}>{p.qty} {p.unit==='kg'?'كجم':'قطعة'}</td>
                    <td style={{ padding:'10px 12px', color:'#38bdf8' }}>{p.price} ﷼</td>
                    <td style={{ padding:'10px 12px', color:'#94a3b8' }}>{p.cost||'—'}{p.cost?' ﷼':''}</td>
                    <td style={{ padding:'10px 12px' }}><span style={{ background:p.unit==='kg'?'#1e3a5f':'#1e2535', padding:'2px 8px', borderRadius:99, fontSize:11 }}>{p.unit==='kg'?'كجم':'قطعة'}</span></td>
                    <td style={{ padding:'10px 12px', color:isExp?'#f59e0b':'#64748b', fontSize:12 }}>{p.expiry?(fmtDate(p.expiry)+(isExp?` (${diffDays(p.expiry)} يوم)`:'')):'—'}</td>
                    <td style={{ padding:'10px 12px' }}>
                      <div style={{ display:'flex', gap:6 }}>
                        <Btn size="sm" color="#1d4ed8" onClick={()=>{setEditProd(p);setForm({name:p.name,qty:p.qty,price:p.price,cost:p.cost||'',unit:p.unit||'piece',expiry:p.expiry||'',category:p.category||''});setShowAdd(true);}}>تعديل</Btn>
                        <Btn size="sm" color="#7f1d1d" onClick={()=>del(p.id)}>حذف</Btn>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length===0&&<tr><td colSpan={8} style={{ textAlign:'center', padding:40, color:'#64748b' }}>لا توجد منتجات</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={showAdd} onClose={()=>{setShowAdd(false);setEditProd(null);setForm(blank);}} title={editProd?'تعديل صنف':'إضافة صنف جديد'}>
        <Input label="اسم الصنف" value={form.name} onChange={v=>setForm(p=>({...p,name:v}))} required placeholder="مثال: مياه معدنية" />
        <Input label="الفئة (اختياري)" value={form.category} onChange={v=>setForm(p=>({...p,category:v}))} placeholder="مثال: مشروبات" />
        <Select label="وحدة البيع" value={form.unit} onChange={v=>setForm(p=>({...p,unit:v}))}>
          <option value="piece">قطعة</option>
          <option value="kg">كيلوجرام (يدعم الجرامات)</option>
        </Select>
        <Input label={`الكمية (${form.unit==='kg'?'كجم':'قطعة'})`} value={form.qty} onChange={v=>setForm(p=>({...p,qty:v}))} type="number" min="0" step={form.unit==='kg'?'0.001':'1'} required />
        <Input label="سعر البيع (﷼)" value={form.price} onChange={v=>setForm(p=>({...p,price:v}))} type="number" min="0" step="0.01" required />
        <Input label="تكلفة الشراء (﷼) اختياري" value={form.cost} onChange={v=>setForm(p=>({...p,cost:v}))} type="number" min="0" step="0.01" />
        <Input label="تاريخ الانتهاء (اختياري)" value={form.expiry} onChange={v=>setForm(p=>({...p,expiry:v}))} type="date" />
        {form.unit==='kg'&&<div style={{ background:'#0f172a', borderRadius:10, padding:10, marginBottom:12, fontSize:13, color:'#94a3b8' }}>💡 0.250 = 250 جرام | السعر يُحسب تلقائياً</div>}
        <div style={{ display:'flex', gap:8, marginTop:8 }}>
          <Btn onClick={save} color="#22c55e" style={{ flex:1 }} disabled={saving}>{saving?'...':(editProd?'حفظ':'إضافة')}</Btn>
          <Btn onClick={()=>{setShowAdd(false);setEditProd(null);setForm(blank);}} color="#374151" style={{ flex:1 }}>إلغاء</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────
// PURCHASES
// ─────────────────────────────────────────────
function Purchases({ storeId, products, purchases, session, toast, fetchAll }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ product_id:'', qty:'', cost:'', supplier:'', note:'' });

  const save = async () => {
    if (!form.product_id||!form.qty||!form.cost) return toast('أدخل البيانات المطلوبة', 'error');
    const prod = products.find(p => p.id===form.product_id);
    const qty = parseFloat(form.qty);
    await supabase.from('purchases').insert({ store_id:storeId, product_id:form.product_id, product_name:prod?.name, qty, cost:parseFloat(form.cost), supplier:form.supplier||null, note:form.note||null, emp_name:session.employee?.name });
    await supabase.from('products').update({ qty:(prod?.qty||0)+qty, cost:parseFloat(form.cost) }).eq('id', form.product_id);
    await fetchAll();
    setForm({ product_id:'', qty:'', cost:'', supplier:'', note:'' });
    setShowAdd(false);
    toast('تم تسجيل الشراء ✓');
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <h2 style={{ margin:0 }}>🚚 المشتريات</h2>
        <Btn onClick={()=>setShowAdd(true)} color="#3b82f6">+ تسجيل شراء</Btn>
      </div>
      <Card>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead><tr style={{ color:'#64748b', borderBottom:'2px solid #2d3a52' }}>
            {['التاريخ','الصنف','الكمية','التكلفة','المورد','الموظف'].map(h=><th key={h} style={{ padding:'10px 12px', textAlign:'right' }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {purchases.map(p=>(
              <tr key={p.id} className="row-hover" style={{ borderBottom:'1px solid #1e2535' }}>
                <td style={{ padding:'10px 12px', color:'#94a3b8', fontSize:12 }}>{fmt(p.created_at)}</td>
                <td style={{ padding:'10px 12px', fontWeight:600 }}>{p.product_name}</td>
                <td style={{ padding:'10px 12px', color:'#22c55e' }}>{p.qty}</td>
                <td style={{ padding:'10px 12px', color:'#f59e0b' }}>{p.cost} ﷼</td>
                <td style={{ padding:'10px 12px', color:'#94a3b8' }}>{p.supplier||'—'}</td>
                <td style={{ padding:'10px 12px', color:'#64748b' }}>{p.emp_name}</td>
              </tr>
            ))}
            {purchases.length===0&&<tr><td colSpan={6} style={{ textAlign:'center', padding:40, color:'#64748b' }}>لا توجد مشتريات</td></tr>}
          </tbody>
        </table>
      </Card>
      <Modal open={showAdd} onClose={()=>setShowAdd(false)} title="تسجيل شراء بضاعة">
        <Select label="الصنف" value={form.product_id} onChange={v=>setForm(p=>({...p,product_id:v}))} required>
          <option value="">— اختر الصنف —</option>
          {products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
        <Input label="الكمية" value={form.qty} onChange={v=>setForm(p=>({...p,qty:v}))} type="number" min="0" step="0.001" required />
        <Input label="تكلفة الوحدة (﷼)" value={form.cost} onChange={v=>setForm(p=>({...p,cost:v}))} type="number" min="0" step="0.01" required />
        <Input label="المورد (اختياري)" value={form.supplier} onChange={v=>setForm(p=>({...p,supplier:v}))} placeholder="اسم المورد" />
        <Input label="ملاحظة" value={form.note} onChange={v=>setForm(p=>({...p,note:v}))} />
        <div style={{ display:'flex', gap:8 }}>
          <Btn onClick={save} color="#22c55e" style={{ flex:1 }}>تسجيل</Btn>
          <Btn onClick={()=>setShowAdd(false)} color="#374151" style={{ flex:1 }}>إلغاء</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────
// DEBTS
// ─────────────────────────────────────────────
function Debts({ debts, session, storeName, toast, fetchAll, overdueDebts }) {
  const [showPay, setShowPay] = useState(null);
  const [payAmt, setPayAmt] = useState('');
  const [showMsg, setShowMsg] = useState(null);
  const [msgText, setMsgText] = useState('');
  const [filter, setFilter] = useState('active');

  const filtered = debts.filter(d => filter==='all'?true:filter==='active'?!d.paid:d.paid);
  const totalDebt = debts.filter(d=>!d.paid).reduce((a,d)=>a+(d.remaining||0),0);

  const payDebt = async () => {
    if (!payAmt) return toast('أدخل المبلغ','error');
    const amt = parseFloat(payAmt);
    const newRemaining = Math.max(0, showPay.remaining - amt);
    await supabase.from('debts').update({
      remaining: newRemaining, paid: newRemaining===0,
      payments: [...(showPay.payments||[]), { amt, date: new Date().toISOString(), empName: session.employee?.name }]
    }).eq('id', showPay.id);
    await fetchAll();
    toast(amt>=showPay.remaining?'تم سداد الدين بالكامل ✓':'تم تسجيل الدفعة ✓');
    setShowPay(null); setPayAmt('');
  };

  const openWhatsApp = (debt) => {
    setShowMsg(debt);
    setMsgText(`السلام عليكم ${debt.customer_name}،\nنذكركم بالدين المستحق بقيمة ${debt.remaining?.toFixed(2)} ﷼ لصالح ${storeName}.\nنرجو السداد في أقرب وقت.\nشكراً لتعاملكم معنا 🙏`);
  };

  const sendWhatsApp = () => {
    const phone = showMsg.customer_phone?.replace(/\D/g,'');
    window.open(`https://wa.me/966${phone}?text=${encodeURIComponent(msgText)}`, '_blank');
    setShowMsg(null);
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:8 }}>
        <h2 style={{ margin:0 }}>💳 الديون</h2>
        <div style={{ display:'flex', gap:8 }}>
          {['active','paid','all'].map(f=>(
            <Btn key={f} size="sm" color={filter===f?'#3b82f6':'#374151'} onClick={()=>setFilter(f)}>
              {f==='active'?'الحالية':f==='paid'?'المسددة':'الكل'}
            </Btn>
          ))}
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))', gap:12, marginBottom:20 }}>
        <StatCard label="إجمالي الديون" value={totalDebt.toFixed(2)+' ﷼'} icon="💰" color="#ef4444" />
        <StatCard label="عدد المدينين" value={debts.filter(d=>!d.paid).length} icon="👥" color="#f59e0b" />
        <StatCard label="ديون متأخرة" value={overdueDebts.length} icon="🚨" color="#7c3aed" />
      </div>
      <Card>
        {filtered.length===0?<div style={{ textAlign:'center', padding:40, color:'#64748b' }}>لا توجد ديون</div>:(
          filtered.map(d => {
            const days = Math.abs(Math.floor((new Date()-new Date(d.created_at))/86400000));
            const isOverdue = !d.paid && days>=3;
            return (
              <div key={d.id} style={{ padding:'14px 0', borderBottom:'1px solid #2d3a52' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'start', flexWrap:'wrap', gap:8 }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:15 }}>
                      {d.customer_name}
                      {isOverdue&&<span style={{ color:'#ef4444', fontSize:11, marginRight:8, animation:'pulse 2s infinite' }}>🚨 متأخر {days} يوم</span>}
                      {d.paid&&<span style={{ color:'#22c55e', fontSize:11, marginRight:8 }}>✅ مسدد</span>}
                    </div>
                    {d.customer_phone&&<div style={{ color:'#64748b', fontSize:12 }}>📱 {d.customer_phone}</div>}
                    <div style={{ color:'#64748b', fontSize:12 }}>📅 {fmt(d.created_at)} · {d.emp_name}</div>
                    {(d.payments||[]).map((pay,i)=>(
                      <div key={i} style={{ color:'#22c55e', fontSize:12 }}>✓ دفعة: {pay.amt} ﷼ في {fmt(pay.date)}</div>
                    ))}
                  </div>
                  <div style={{ textAlign:'left' }}>
                    <div style={{ color:'#94a3b8', fontSize:12 }}>الإجمالي: {d.total?.toFixed(2)} ﷼</div>
                    <div style={{ color:d.paid?'#22c55e':'#ef4444', fontSize:18, fontWeight:900 }}>متبقي: {d.remaining?.toFixed(2)} ﷼</div>
                    <div style={{ display:'flex', gap:6, marginTop:8, flexWrap:'wrap' }}>
                      {!d.paid&&<Btn size="sm" color="#22c55e" onClick={()=>setShowPay(d)}>💰 تسديد</Btn>}
                      {!d.paid&&d.customer_phone&&<Btn size="sm" color="#25d366" onClick={()=>openWhatsApp(d)}>📱 واتساب</Btn>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </Card>

      <Modal open={!!showPay} onClose={()=>{setShowPay(null);setPayAmt('');}} title={`تسديد: ${showPay?.customer_name}`}>
        <div style={{ color:'#ef4444', fontSize:20, fontWeight:800, marginBottom:16 }}>المتبقي: {showPay?.remaining?.toFixed(2)} ﷼</div>
        <Input label="المبلغ المدفوع" value={payAmt} onChange={setPayAmt} type="number" min="0" step="0.01" placeholder="أدخل المبلغ" />
        <div style={{ display:'flex', gap:8 }}>
          <Btn onClick={()=>setPayAmt(showPay?.remaining?.toString())} color="#374151" size="sm">كامل المبلغ</Btn>
          <Btn onClick={payDebt} color="#22c55e" style={{ flex:1 }}>تسجيل الدفعة</Btn>
        </div>
      </Modal>

      <Modal open={!!showMsg} onClose={()=>setShowMsg(null)} title="📱 رسالة واتساب">
        <div style={{ color:'#94a3b8', fontSize:13, marginBottom:8 }}>تخصيص نص الرسالة:</div>
        <Input label="" value={msgText} onChange={setMsgText} rows={6} />
        <div style={{ display:'flex', gap:8, marginTop:8 }}>
          <Btn onClick={sendWhatsApp} color="#25d366" style={{ flex:1 }}>📤 إرسال</Btn>
          <Btn onClick={()=>setShowMsg(null)} color="#374151">إلغاء</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────
// RETURNS
// ─────────────────────────────────────────────
function Returns({ storeId, sales, products, debts, returns, session, toast, fetchAll }) {
  const [showAdd, setShowAdd] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [returnItems, setReturnItems] = useState([]);
  const [returnMethod, setReturnMethod] = useState('cash');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const selectSale = (s) => { setSelectedSale(s); setReturnItems((s.items||[]).map(i=>({...i,returnQty:0}))); };

  const processReturn = async () => {
    const items = returnItems.filter(i=>i.returnQty>0);
    if (items.length===0) return toast('حدد الكميات المرجعة','error');
    setSaving(true);
    const total = items.reduce((a,i)=>a+i.returnQty*i.price,0);
    await supabase.from('returns').insert({ store_id:storeId, sale_id:selectedSale.id, customer_name:selectedSale.customer_name, emp_name:session.employee?.name, items, return_total:total, return_method:returnMethod, reason:reason||null });
    for (const item of items) {
      const prod = products.find(p=>p.id===item.product_id);
      if (prod) await supabase.from('products').update({ qty: prod.qty + item.returnQty }).eq('id', prod.id);
    }
    if (returnMethod==='debt_cancel' && selectedSale.customer_name) {
      const debt = debts.find(d=>!d.paid&&d.customer_name===selectedSale.customer_name);
      if (debt) await supabase.from('debts').update({ remaining: Math.max(0,debt.remaining-total), paid: debt.remaining-total<=0 }).eq('id', debt.id);
    }
    await fetchAll();
    setSaving(false); setShowAdd(false); setSelectedSale(null); setReturnItems([]); setReason('');
    toast(`تم تسجيل المرتجع: ${total.toFixed(2)} ﷼`);
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <h2 style={{ margin:0 }}>↩️ المرتجعات</h2>
        <Btn onClick={()=>setShowAdd(true)} color="#f59e0b">+ تسجيل مرتجع</Btn>
      </div>
      <Card>
        {returns.length===0?<div style={{ textAlign:'center', padding:40, color:'#64748b' }}>لا توجد مرتجعات</div>:(
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead><tr style={{ color:'#64748b', borderBottom:'2px solid #2d3a52' }}>
              {['التاريخ','الزبون','المبلغ','طريقة الإرجاع','الموظف'].map(h=><th key={h} style={{ padding:'10px 12px', textAlign:'right' }}>{h}</th>)}
            </tr></thead>
            <tbody>{returns.map(r=>(
              <tr key={r.id} className="row-hover" style={{ borderBottom:'1px solid #1e2535' }}>
                <td style={{ padding:'10px 12px', color:'#94a3b8', fontSize:12 }}>{fmt(r.created_at)}</td>
                <td style={{ padding:'10px 12px' }}>{r.customer_name||'—'}</td>
                <td style={{ padding:'10px 12px', color:'#f59e0b', fontWeight:700 }}>{r.return_total?.toFixed(2)} ﷼</td>
                <td style={{ padding:'10px 12px' }}>{r.return_method==='cash'?'نقدي':r.return_method==='debt_cancel'?'شطب دين':'تحويل'}</td>
                <td style={{ padding:'10px 12px', color:'#64748b' }}>{r.emp_name}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </Card>

      <Modal open={showAdd} onClose={()=>{setShowAdd(false);setSelectedSale(null);setReturnItems([]);}} title="تسجيل مرتجع" width={600}>
        {!selectedSale?(
          <div style={{ maxHeight:400, overflowY:'auto' }}>
            <div style={{ color:'#94a3b8', fontSize:13, marginBottom:12 }}>اختر الفاتورة:</div>
            {sales.slice(0,30).map(s=>(
              <div key={s.id} onClick={()=>selectSale(s)} className="row-hover" style={{ padding:'10px 12px', borderBottom:'1px solid #2d3a52', cursor:'pointer', borderRadius:8 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:14 }}>
                  <span>{s.customer_name||'زبون'} — {fmt(s.created_at)}</span>
                  <span style={{ color:'#22c55e' }}>{s.total?.toFixed(2)} ﷼</span>
                </div>
                <div style={{ fontSize:12, color:'#64748b' }}>{(s.items||[]).map(i=>i.name).join(', ')}</div>
              </div>
            ))}
          </div>
        ):(
          <>
            <div style={{ marginBottom:12, padding:12, background:'#0f172a', borderRadius:10 }}>
              <div style={{ fontWeight:700 }}>فاتورة: {selectedSale.customer_name||'زبون'}</div>
              <div style={{ color:'#64748b', fontSize:13 }}>{fmt(selectedSale.created_at)} · {selectedSale.total?.toFixed(2)} ﷼</div>
            </div>
            {returnItems.map((item,idx)=>(
              <div key={idx} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 0', borderBottom:'1px solid #2d3a52' }}>
                <div style={{ flex:1, fontSize:13 }}>{item.name} (تم بيع: {item.qty})</div>
                <span style={{ color:'#64748b', fontSize:12 }}>مرتجع:</span>
                <input type="number" value={item.returnQty} min={0} max={item.qty} step={item.unit==='kg'?0.1:1}
                  onChange={e=>setReturnItems(p=>p.map((i,j)=>j===idx?{...i,returnQty:parseFloat(e.target.value)||0}:i))}
                  style={{ width:70, background:'#0f172a', border:'1px solid #2d3a52', borderRadius:8, padding:'5px 8px', color:'#e2e8f0', fontFamily:'Tajawal,sans-serif', textAlign:'center' }} />
                <div style={{ color:'#f59e0b', width:70, textAlign:'left', fontSize:13 }}>{(item.returnQty*item.price).toFixed(2)} ﷼</div>
              </div>
            ))}
            <Select label="طريقة الإرجاع" value={returnMethod} onChange={setReturnMethod} style={{ marginTop:12 }}>
              <option value="cash">إرجاع نقدي</option>
              <option value="transfer">إرجاع تحويل</option>
              <option value="debt_cancel">شطب من الدين</option>
            </Select>
            <Input label="سبب المرتجع (اختياري)" value={reason} onChange={setReason} placeholder="مثال: منتج تالف" />
            <div style={{ color:'#f59e0b', fontWeight:700, marginBottom:12 }}>
              إجمالي المرتجع: {returnItems.reduce((a,i)=>a+i.returnQty*i.price,0).toFixed(2)} ﷼
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <Btn onClick={processReturn} color="#f59e0b" style={{ flex:1 }} disabled={saving}>{saving?'...':'تأكيد المرتجع'}</Btn>
              <Btn onClick={()=>{setSelectedSale(null);setReturnItems([]);}} color="#374151">رجوع</Btn>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────
// REPORTS
// ─────────────────────────────────────────────
function Reports({ sales, purchases }) {
  const [period, setPeriod] = useState('today');
  const getRange = () => {
    const now = new Date();
    if (period==='today'){const s=new Date(now.toDateString());return[s,now];}
    if (period==='week'){const s=new Date(now);s.setDate(s.getDate()-7);return[s,now];}
    if (period==='month'){const s=new Date(now);s.setDate(1);return[s,now];}
    return[new Date(0),now];
  };
  const [start,end]=getRange();
  const ps=sales.filter(s=>{const d=new Date(s.created_at);return d>=start&&d<=end;});
  const revenue=ps.reduce((a,s)=>a+(s.total||0),0);
  const cost=ps.reduce((a,s)=>a+(s.cost_total||0),0);
  const profit=revenue-cost;
  const empStats={};
  ps.forEach(s=>{if(!empStats[s.emp_name])empStats[s.emp_name]={sales:0,count:0};empStats[s.emp_name].sales+=s.total||0;empStats[s.emp_name].count++;});
  const prodSales={};
  ps.forEach(s=>(s.items||[]).forEach(i=>{if(!prodSales[i.name])prodSales[i.name]={qty:0,rev:0};prodSales[i.name].qty+=i.qty;prodSales[i.name].rev+=i.qty*i.price;}));
  const top=Object.entries(prodSales).sort((a,b)=>b[1].rev-a[1].rev).slice(0,10);
  const payStats={cash:0,transfer:0,debt:0,partial:0};
  ps.forEach(s=>{if(payStats[s.pay_method]!==undefined)payStats[s.pay_method]+=s.total||0;});

  return (
    <div>
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
        {['today','week','month','all'].map(p=>(
          <Btn key={p} size="sm" color={period===p?'#3b82f6':'#374151'} onClick={()=>setPeriod(p)}>
            {p==='today'?'اليوم':p==='week'?'الأسبوع':p==='month'?'الشهر':'الكل'}
          </Btn>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:14, marginBottom:20 }}>
        <StatCard label="الإيرادات" value={revenue.toFixed(2)+' ﷼'} icon="💰" color="#22c55e" sub={`${ps.length} فاتورة`} />
        <StatCard label="التكلفة" value={cost.toFixed(2)+' ﷼'} icon="🏷️" color="#f59e0b" />
        <StatCard label="الربح الصافي" value={profit.toFixed(2)+' ﷼'} icon="📈" color="#38bdf8" sub={`هامش ${revenue>0?((profit/revenue)*100).toFixed(1):0}%`} />
        <StatCard label="متوسط الفاتورة" value={(ps.length>0?revenue/ps.length:0).toFixed(2)+' ﷼'} icon="🧾" color="#8b5cf6" />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <Card>
          <div style={{ fontWeight:700, marginBottom:14 }}>🏆 أكثر المنتجات مبيعاً</div>
          {top.map(([name,s],i)=>(
            <div key={name} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid #2d3a52', fontSize:13 }}>
              <span><span style={{color:'#64748b'}}>#{i+1}</span> {name}</span>
              <span style={{color:'#22c55e'}}>{s.rev.toFixed(2)} ﷼ <span style={{color:'#64748b',fontSize:11}}>({s.qty})</span></span>
            </div>
          ))}
          {top.length===0&&<div style={{color:'#64748b',textAlign:'center'}}>لا بيانات</div>}
        </Card>
        <Card>
          <div style={{ fontWeight:700, marginBottom:14 }}>👥 مبيعات الموظفين</div>
          {Object.entries(empStats).map(([name,s])=>(
            <div key={name} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #2d3a52', fontSize:13 }}>
              <span>👤 {name}</span>
              <span style={{color:'#22c55e'}}>{s.sales.toFixed(2)} ﷼ <span style={{color:'#64748b',fontSize:11}}>({s.count})</span></span>
            </div>
          ))}
          {Object.keys(empStats).length===0&&<div style={{color:'#64748b',textAlign:'center'}}>لا بيانات</div>}
          <div style={{marginTop:16,fontWeight:700,marginBottom:10}}>💳 طرق الدفع</div>
          {[['cash','نقدي'],['transfer','تحويل'],['debt','دين'],['partial','جزئي']].map(([k,l])=>(
            <div key={k} style={{display:'flex',justifyContent:'space-between',fontSize:13,padding:'4px 0'}}>
              <span style={{color:'#94a3b8'}}>{l}</span>
              <span style={{color:'#38bdf8'}}>{payStats[k].toFixed(2)} ﷼</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// EMPLOYEES
// ─────────────────────────────────────────────
function Employees({ storeId, employees, session, toast, fetchAll }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name:'', pin:'', role:'employee' });
  const isOwner = session.employee?.role==='owner';

  const add = async () => {
    if (!form.name||!form.pin) return toast('أدخل الاسم والرمز','error');
    if (form.pin.length<4) return toast('الرمز 4 أرقام على الأقل','error');
    await supabase.from('employees').insert({ store_id:storeId, name:form.name, pin:form.pin, role:form.role });
    await fetchAll();
    setForm({ name:'', pin:'', role:'employee' });
    setShowAdd(false);
    toast('تم إضافة الموظف ✓');
  };

  const del = async (id) => {
    if (id===session.employee?.id) return toast('لا يمكن حذف حسابك الحالي','error');
    if (!window.confirm('حذف الموظف؟')) return;
    await supabase.from('employees').delete().eq('id', id);
    fetchAll();
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <h2 style={{ margin:0 }}>👥 الموظفون</h2>
        {isOwner&&<Btn onClick={()=>setShowAdd(true)} color="#3b82f6">+ إضافة موظف</Btn>}
      </div>
      {!isOwner&&<div style={{ color:'#f59e0b', marginBottom:16, fontSize:13 }}>⚠️ فقط صاحب المحل يمكنه إدارة الموظفين</div>}
      <Card>
        {employees.map(e=>(
          <div key={e.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid #2d3a52' }}>
            <div>
              <div style={{ fontWeight:600 }}>👤 {e.name} {e.id===session.employee?.id&&<span style={{color:'#38bdf8',fontSize:11}}>(أنت)</span>}</div>
              <div style={{ color:'#64748b', fontSize:13 }}>{e.role==='owner'?'صاحب المحل':'موظف'} · رمز: {'•'.repeat(e.pin?.length||4)}</div>
            </div>
            {isOwner&&e.id!==session.employee?.id&&<Btn size="sm" color="#7f1d1d" onClick={()=>del(e.id)}>حذف</Btn>}
          </div>
        ))}
      </Card>
      <Modal open={showAdd} onClose={()=>setShowAdd(false)} title="إضافة موظف">
        <Input label="الاسم" value={form.name} onChange={v=>setForm(p=>({...p,name:v}))} required />
        <Input label="رمز الدخول (PIN)" value={form.pin} onChange={v=>setForm(p=>({...p,pin:v}))} type="password" required placeholder="4 أرقام على الأقل" />
        <Select label="الصلاحية" value={form.role} onChange={v=>setForm(p=>({...p,role:v}))}>
          <option value="employee">موظف</option>
          <option value="owner">صاحب المحل</option>
        </Select>
        <div style={{ display:'flex', gap:8 }}>
          <Btn onClick={add} color="#22c55e" style={{ flex:1 }}>إضافة</Btn>
          <Btn onClick={()=>setShowAdd(false)} color="#374151" style={{ flex:1 }}>إلغاء</Btn>
        </div>
      </Modal>
    </div>
  );
}
