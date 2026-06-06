# حسابات - Hesabat
## نظام إدارة المبيعات والفواتير

---

## 🚀 خطوات الرفع والتشغيل

### 1️⃣ Supabase - تشغيل قاعدة البيانات

1. اذهب إلى [supabase.com](https://supabase.com) → مشروعك
2. اضغط **SQL Editor** → **New Query**
3. انسخ محتوى ملف `schema.sql` والصقه واضغط **Run**
4. ✅ تم إنشاء جميع الجداول + حساب الأدمن

---

### 2️⃣ GitHub - رفع الكود

```bash
git clone https://github.com/osama-sibakhi/sales-managment
cd sales-managment

# انسخ ملفات المشروع هنا ثم:
git add .
git commit -m "حسابات v2.0 - نظام كامل"
git push origin main
```

---

### 3️⃣ Vercel - الاستضافة

1. اذهب إلى [vercel.com](https://vercel.com)
2. اضغط **New Project** → اختر **sales-managment** من GitHub
3. في **Environment Variables** أضف:
   ```
   REACT_APP_SUPABASE_URL = https://poxdwjgpyxqdltldlhwj.supabase.co
   REACT_APP_SUPABASE_ANON_KEY = eyJhbGci...
   ```
4. اضغط **Deploy** ✅

---

## 🔐 بيانات الدخول

### الأدمن:
- **إيميل:** `admin@hesabat.app`  
- **كلمة السر:** كلمتك الخاصة (محفوظة في قاعدة البيانات)

### صاحب المحل (بعد إنشائه من الأدمن):
- الإيميل وكلمة السر التي حددتها
- **PIN الموظف الافتراضي:** `1234` (يُنصح بتغييره)

---

## 🏗️ هيكل النظام

```
أدمن → ينشئ محلات (إيميل + كلمة سر)
محل → يدخل بالإيميل → يختار الموظف + PIN
موظفون متعددون → يعملون في نفس الوقت (Real-time)
```

---

## ✅ الميزات

- 🔐 نظام صلاحيات ثلاثي (أدمن / صاحب محل / موظف)
- 🛒 نقطة بيع مع بحث ذكي
- 📦 مخزون مع تنبيهات
- 💳 ديون مع واتساب
- ↩️ مرتجعات
- 📈 تقارير
- ⚡ Real-time بين الموظفين
