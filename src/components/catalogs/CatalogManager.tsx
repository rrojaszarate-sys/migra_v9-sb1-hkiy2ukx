import React, { useState } from 'react';
import { Users, FileText, DollarSign, TrendingUp, Settings } from 'lucide-react';
import { ClientsCatalog } from './ClientsCatalog';
import { EventsCatalog } from './EventsCatalog';
import { IncomesCatalog } from './IncomesCatalog';
import { ExpensesCatalog } from './ExpensesCatalog';

type CatalogType = 'clients' | 'events' | 'incomes' | 'expenses';

export function CatalogManager() {
  const [activeCatalog, setActiveCatalog] = useState<CatalogType>('clients');

  const catalogs = [
    { id: 'clients' as CatalogType, name: 'Clientes', icon: Users, color: 'blue' },
    { id: 'events' as CatalogType, name: 'Eventos', icon: FileText, color: 'green' },
    { id: 'incomes' as CatalogType, name: 'Ingresos', icon: TrendingUp, color: 'emerald' },
    { id: 'expenses' as CatalogType, name: 'Gastos', icon: DollarSign, color: 'red' },
  ];

  const renderCatalog = () => {
    switch (activeCatalog) {
      case 'clients':
        return <ClientsCatalog />;
      case 'events':
        return <EventsCatalog />;
      case 'incomes':
        return <IncomesCatalog />;
      case 'expenses':
        return <ExpensesCatalog />;
      default:
        return <ClientsCatalog />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Settings className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">Administración de Catálogos</h1>
      </div>

      {/* Catalog Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {catalogs.map((catalog) => (
              <button
                key={catalog.id}
                onClick={() => setActiveCatalog(catalog.id)}
                className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeCatalog === catalog.id
                    ? `border-${catalog.color}-500 text-${catalog.color}-600`
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <catalog.icon className="h-5 w-5" />
                <span>{catalog.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {renderCatalog()}
        </div>
      </div>
    </div>
  );
}