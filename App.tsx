import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/Layout';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { SalonModule } from './modules/HairSalon/SalonModule';
import { DressModule } from './modules/DressRental/DressModule';
import { NgafaModule } from './modules/Ngafa/NgafaModule';
import { UserModule } from './modules/Users/UserModule';
import { UserRole } from './types';

const AppContent = () => {
  const { user } = useApp();
  const [currentView, setCurrentView] = useState('DASHBOARD');

  if (!user) {
    return <Login />;
  }

  const renderView = () => {
    switch(currentView) {
      case 'DASHBOARD': return <Dashboard />;
      case 'SALON': return <SalonModule />;
      case 'DRESSES': return <DressModule />;
      case 'NGAFA': return <NgafaModule />;
      case 'USERS': 
        return user.role === UserRole.ADMIN ? <UserModule /> : <Dashboard />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout currentView={currentView} onViewChange={setCurrentView}>
      {renderView()}
    </Layout>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}