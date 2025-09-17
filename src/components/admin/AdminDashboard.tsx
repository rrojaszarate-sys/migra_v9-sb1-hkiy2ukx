import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Settings, Users, Calendar, TrendingUp, DollarSign, FileText } from 'lucide-react';
import { ClientsManager } from './ClientsManager';
import { EventsManager } from './EventsManager';
import { IncomesManager } from './IncomesManager';
import { ExpensesManager } from './ExpensesManager';

type AdminSection = 'clients' | 'events' | 'incomes' | 'expenses';

export function AdminDashboard() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<AdminSection>('clients');

  if (user?.role !== 'Administrador') {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No tienes permisos para acceder a esta página.</p>
      </div>
    );
  }

  const sections = [
    { id: 'clients' as AdminSection, name: 'Clientes', icon: Users, color: 'blue' },
    { id: 'events' as AdminSection, name: 'Eventos', icon: Calendar, color: 'green' },
    { id: 'incomes' as AdminSection, name: 'Ingresos', icon: TrendingUp, color: 'emerald' },
    { id: 'expenses' as AdminSection, name: 'Gastos', icon: DollarSign, color: 'red' },
  ];

  const renderSection = () => {
    switch (activeSection) {
      case 'clients':
        return <ClientsManager />;
      case 'events':
        return <EventsManager />;
      case 'incomes':
        return <IncomesManager />;
      case 'expenses':
        return <ExpensesManager />;
      default:
        return <ClientsManager />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Settings className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">Administración de Catálogos</h1>
      </div>

      {/* Section Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                  activeSection === section.id
                    ? `border-${section.color}-500 text-${section.color}-600`
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <section.icon className="h-5 w-5" />
                <span>{section.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {renderSection()}
        </div>
      </div>
    </div>
  );
}