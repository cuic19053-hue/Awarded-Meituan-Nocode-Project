import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginForm from './components/LoginForm';
import Navbar from './components/Navbar';
import AdvancedBookingForm from './components/AdvancedBookingForm';
import MyBookings from './components/MyBookings';
import ApprovalBoard from './components/ApprovalBoard';
import RoomManagement from './components/RoomManagement';
import Dashboard from './components/Dashboard';
import Analytics from './components/Analytics';

const AppContent = () => {
  const { isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState('booking');

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'booking':
        return <AdvancedBookingForm onBookingSuccess={() => setCurrentPage('my-bookings')} />;
      case 'my-bookings':
        return <MyBookings />;
      case 'approval':
        return <ApprovalBoard />;
      case 'room-management':
        return <RoomManagement />;
      case 'dashboard':
        return <Dashboard />;
      case 'analytics':
        return <Analytics />;
      default:
        return <AdvancedBookingForm onBookingSuccess={() => setCurrentPage('my-bookings')} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar currentPage={currentPage} onPageChange={setCurrentPage} />
      <main className="py-8">
        {renderPage()}
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
