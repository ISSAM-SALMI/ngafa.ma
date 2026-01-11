import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const Login = () => {
  const { login } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(username, password);
    if (!success) setError(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 via-indigo-500 to-amber-500 bg-clip-text text-transparent mb-2">
            نوبتشيا ERP
          </h1>
          <p className="text-slate-500 text-sm">تسجيل الدخول لإدارة الأنشطة</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">اسم المستخدم</label>
            <input 
              type="text" 
              className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-right placeholder-slate-400"
              placeholder="مثال: zahraadmin"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(false); }}
              dir="ltr" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">كلمة المرور</label>
            <input 
              type="password" 
              className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-right placeholder-slate-400"
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false); }}
              dir="ltr" 
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
              بيانات الدخول غير صحيحة. يرجى التحقق من الاسم وكلمة المرور.
            </div>
          )}

          <button 
            type="submit"
            className="w-full bg-slate-900 text-white font-medium py-3 rounded-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
          >
            دخول
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100">
          <p className="text-xs text-slate-400 text-center">النظام محمي ومخصص للموظفين المصرح لهم فقط.</p>
        </div>
      </div>
    </div>
  );
};