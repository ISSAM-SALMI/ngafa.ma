import { uuidv4 } from '../../utils/uuid';
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole, User } from '../../types';
import { Users, Plus, Trash2, Key, User as UserIcon } from 'lucide-react';

export const UserModule = () => {
  const { usersList, addUser, deleteUser, user: currentUser } = useApp();
  
  const [newUser, setNewUser] = useState({ 
    name: '', 
    username: '', 
    password: '', 
    role: UserRole.EMPLOYEE 
  });

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.username || !newUser.password) return;

    addUser({
      id: uuidv4(),
      name: newUser.name,
      username: newUser.username,
      password: newUser.password,
      role: newUser.role
    });

    setNewUser({ name: '', username: '', password: '', role: UserRole.EMPLOYEE });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center">
            <Users className="ml-2 text-indigo-500" /> إدارة المستخدمين
          </h2>
          <p className="text-sm text-slate-500">إضافة وتعديل صلاحيات الموظفين</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
        
        {/* User List */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-semibold text-slate-700">قائمة المستخدمين</h3>
            <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs font-bold">
              {usersList.length} مستخدم
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                <tr>
                  <th className="px-6 py-3">الاسم</th>
                  <th className="px-6 py-3">اسم المستخدم (الدخول)</th>
                  <th className="px-6 py-3">الدور</th>
                  <th className="px-6 py-3 text-left">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map(u => (
                  <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50 last:border-0">
                    <td className="px-6 py-4 font-medium text-slate-900 flex items-center">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center ml-3 text-slate-500">
                        <UserIcon size={16} />
                      </div>
                      {u.name}
                      {u.id === currentUser?.id && <span className="mr-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">أنت</span>}
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-mono">{u.username}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded font-medium ${
                        u.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {u.role === UserRole.ADMIN ? 'مدير' : 'موظف'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-left">
                      {/* Prevent deleting yourself */}
                      {u.id !== currentUser?.id && (
                        <button 
                          onClick={() => deleteUser(u.id)}
                          className="text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors"
                          title="حذف المستخدم"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add User Form */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-fit">
          <h3 className="font-semibold text-slate-700 mb-4 flex items-center">
            <Plus className="w-4 h-4 ml-2" /> مستخدم جديد
          </h3>
          <form onSubmit={handleAddUser} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">الاسم الكامل</label>
              <input 
                required 
                type="text" 
                placeholder="مثال: أحمد محمد"
                className="w-full bg-white text-slate-900 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 outline-none placeholder-slate-400" 
                value={newUser.name}
                onChange={(e) => setNewUser({...newUser, name: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">اسم المستخدم (للدخول)</label>
              <input 
                required 
                type="text" 
                placeholder="user1"
                className="w-full bg-white text-slate-900 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 outline-none placeholder-slate-400" 
                value={newUser.username}
                onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">كلمة المرور</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  required 
                  type="text" 
                  placeholder="Password"
                  className="w-full bg-white text-slate-900 border border-slate-200 rounded-lg px-3 py-2 pl-9 text-sm focus:ring-indigo-500 outline-none placeholder-slate-400" 
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">الصلاحية</label>
              <select 
                className="w-full bg-white text-slate-900 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-indigo-500"
                value={newUser.role}
                onChange={(e) => setNewUser({...newUser, role: e.target.value as UserRole})}
              >
                <option value={UserRole.EMPLOYEE}>موظف (وصول للخدمات فقط)</option>
                <option value={UserRole.ADMIN}>مدير (وصول كامل)</option>
              </select>
            </div>

            <button 
              type="submit" 
              className="w-full bg-slate-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10 mt-2"
            >
              إضافة المستخدم
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};