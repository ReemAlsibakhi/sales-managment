import { createContext, useContext, useState } from 'react';
import { supabase } from '../lib/supabase';
import bcrypt from 'bcryptjs';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hesabat_session')); } catch { return null; }
  });

  const saveSession = (s) => {
    setSession(s);
    if (s) localStorage.setItem('hesabat_session', JSON.stringify(s));
    else localStorage.removeItem('hesabat_session');
  };

  // Admin login
  const adminLogin = async (email, password) => {
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email)
      .single();
    if (error || !data) return { error: 'بيانات خاطئة' };
    const ok = await bcrypt.compare(password, data.password_hash);
    if (!ok) return { error: 'كلمة السر غير صحيحة' };
    saveSession({ type: 'admin', email: data.email, id: data.id });
    return { ok: true };
  };

  // Store login
  const storeLogin = async (email, password) => {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single();
    if (error || !data) return { error: 'بيانات خاطئة أو الحساب موقوف' };
    const ok = await bcrypt.compare(password, data.password_hash);
    if (!ok) return { error: 'كلمة السر غير صحيحة' };
    saveSession({ type: 'store', storeId: data.id, storeName: data.name, email: data.email });
    return { ok: true, store: data };
  };

  // Employee login (within store)
  const employeeLogin = async (storeId, pin) => {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('store_id', storeId)
      .eq('pin', pin)
      .eq('is_active', true)
      .single();
    if (error || !data) return { error: 'رمز الدخول غير صحيح' };
    saveSession(prev => ({ ...prev, employee: data, empName: data.name, empId: data.id, empRole: data.role }));
    return { ok: true, employee: data };
  };

  const logout = () => saveSession(null);

  return (
    <AuthContext.Provider value={{ session, adminLogin, storeLogin, employeeLogin, logout, saveSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
