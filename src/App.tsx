import React, { useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { AuthContainer } from './components/auth/AuthContainer';
import { AuthGuard } from './components/auth/AuthGuard';
import { Layout } from './components/Layout';
import { DatabaseSeeder } from './components/admin/DatabaseSeeder';
import { Dashboard } from './components/Dashboard';
import { BillingMaster } from './components/BillingMaster';
import { EventDetail } from './components/EventDetail';
import { Clients } from './components/Clients';
import { ActivityLog } from './components/ActivityLog';
import { CreateEvent } from './components/CreateEvent';
import { CatalogManager } from './components/catalogs/CatalogManager';
import { UserManager } from './components/admin/UserManager';
import { UserProfile } from './components/auth/UserProfile';
import { DatabaseVerification } from './components/admin/DatabaseVerification';
import { DatabaseRecreation } from './components/admin/DatabaseRecreation';
import { DatabaseHealthMonitor } from './components/admin/DatabaseHealthMonitor';

function AppContent() {
  const { user, loading, isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [showCreateEvent, setShowCreateEvent] = useState(false);

  // Show authentication container if not authenticated
  if (!isAuthenticated || !user) {
    return <AuthContainer />;
  }

  const handleViewEvent = (eventId: number) => {
    setSelectedEventId(eventId);
    setCurrentPage('event-detail');
  };

  const handleBackFromEventDetail = () => {
    setSelectedEventId(null);
    setCurrentPage('billing-master');
  };

  const handleEventCreated = () => {
    setShowCreateEvent(false);
    setCurrentPage('billing-master');
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <AuthGuard requiredRole={['Administrador', 'Ejecutivo']}>
            <Dashboard />
          </AuthGuard>
        );
      case 'database-seeder':
        return (
          <AuthGuard requiredRole="Administrador">
            <DatabaseSeeder />
          </AuthGuard>
        );
      case 'billing-master':
        return (
          <AuthGuard requiredRole={['Administrador', 'Ejecutivo']}>
            <div className="space-y-6">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowCreateEvent(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Crear Evento
                </button>
              </div>
              <BillingMaster onViewEvent={handleViewEvent} />
            </div>
          </AuthGuard>
        );
      case 'event-detail':
        return selectedEventId ? (
          <AuthGuard requiredRole={['Administrador', 'Ejecutivo']}>
            <EventDetail 
              eventId={selectedEventId} 
              onBack={handleBackFromEventDetail} 
            />
          </AuthGuard>
        ) : (
          <div>Error: No se ha seleccionado un evento</div>
        );
      case 'clients':
        return (
          <AuthGuard requiredRole="Administrador">
            <Clients user={user} />
          </AuthGuard>
        );
      case 'users':
        return (
          <AuthGuard requiredRole="Administrador">
            <UserManager />
          </AuthGuard>
        );
      case 'activity-log':
        return (
          <AuthGuard requiredRole="Administrador">
            <ActivityLog />
          </AuthGuard>
        );
      case 'catalogs':
        return (
          <AuthGuard requiredRole="Administrador">
            <CatalogManager />
          </AuthGuard>
        );
      case 'database-verification':
        return (
          <AuthGuard requiredRole="Administrador">
            <DatabaseVerification />
          </AuthGuard>
        );
      case 'database-recreation':
        return (
          <AuthGuard requiredRole="Administrador">
            <DatabaseRecreation />
          </AuthGuard>
        );
      case 'database-health':
        return (
          <AuthGuard requiredRole="Administrador">
            <DatabaseHealthMonitor />
          </AuthGuard>
        );
      case 'profile':
        return (
          <AuthGuard requiredRole={['Administrador', 'Ejecutivo', 'Visualizador']}>
            <UserProfile />
          </AuthGuard>
        );
      default:
        return (
          <AuthGuard requiredRole={['Administrador', 'Ejecutivo']}>
            <Dashboard />
          </AuthGuard>
        );
    }
  };

  return (
    <>
      <Layout 
        currentPage={currentPage} 
        onPageChange={setCurrentPage}
        mockUser={user}
      >
        {renderCurrentPage()}
      </Layout>
      
      {showCreateEvent && (
        <AuthGuard requiredRole={['Administrador', 'Ejecutivo']}>
          <CreateEvent
            onEventCreated={handleEventCreated}
            onCancel={() => setShowCreateEvent(false)}
          />
        </AuthGuard>
      )}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;