"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  LayoutDashboard, Package, ShoppingCart, Users, Settings, 
  Search, Bell, ChevronRight, ChevronLeft, DollarSign, 
  ShoppingBag, Menu, Store,
  BarChart3, ArrowUpRight, ArrowDownRight, Download, Package2,
  AlertTriangle, Moon, Sun, LogOut, User, Mail, MessageSquare,
} from 'lucide-react';
import StoresPage from '../components/StoresPage';
import ProductModelsPage from '../components/ProductModelsPage';
import ReviewsModerationPage from '../components/ReviewsModerationPage';
import { StoresProvider } from './contexts/StoresContext';
import OrdersList from '../components/OrdersList';
import { Role } from '@/lib/permissions';


interface Store {
  id: number;
  name: string;
  country: string;
  city: string;
  address: string;
  currency: string;
  timezone?: string;
  status: 'active' | 'inactive';
  managerName?: string;
  phone?: string;
  email?: string;
}

// Mock Data - ok 
const MOCK_STORES = [
  {
    id: 1,
    name: 'I Love Mobile ECOCOMAM',
    city: 'Martinique',
    country: 'France',
    currency: 'EUR',
    status: 'active',
    sales: 45890,
    orders: 234,
    stock: 1245,
    address: '123 Avenue des Champs-Élysées'
  },
  {
    id: 2,
    name: 'I Love Mobile ECOGWADA',
    city: 'Guadeloupe',
    country: 'France',
    currency: 'EUR',
    status: 'active',
    sales: 32450,
    orders: 189,
    stock: 987,
    address: '45 Rue de la République'
  },
  {
    id: 3,
    name: 'I Love Mobile ECOCOM',
    city: 'Guyane',
    country: 'France',
    currency: 'EUR',
    status: 'active',
    sales: 28790,
    orders: 156,
    stock: 654,
    address: 'Avenue Léopold Sédar Senghor'
  },
  {
    id: 4,
    name: 'I Love Mobile ECOMAVELI',
    city: 'La Réunion',
    country: 'France',
    currency: 'EUR',
    status: 'active',
    sales: 19320,
    orders: 98,
    stock: 432,
    address: 'Boulevard de la République'
  }
];

const MOCK_ORDERS = [
  {
    id: 'CMD-2501',
    customer: 'Marie Dubois',
    email: 'marie@email.com',
    store: 'Paris',
    total: 1328,
    currency: 'EUR',
    status: 'shipped',
    date: '2025-10-10',
    items: 2,
    type: 'online'
  },
  {
    id: 'CMD-2502',
    customer: 'Amadou Diop',
    email: 'amadou@email.com',
    store: 'Dakar',
    total: 590000,
    currency: 'XOF',
    status: 'processing',
    date: '2025-10-11',
    items: 1,
    type: 'in_store'
  },
  {
    id: 'CMD-2503',
    customer: 'Sophie Laurent',
    email: 'sophie@email.com',
    store: 'Lyon',
    total: 2199,
    currency: 'EUR',
    status: 'pending',
    date: '2025-10-12',
    items: 3,
    type: 'online'
  }
];

// Sidebar Component
const Sidebar = ({ currentPage, setCurrentPage, isMobileOpen, setIsMobileOpen, userRole }: {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  userRole: Role;
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'STORE_MANAGER'] },
    { id: 'stores', label: 'Boutiques', icon: Store, roles: ['SUPER_ADMIN'] },
    { id: 'products', label: 'Produits', icon: Package, roles: ['SUPER_ADMIN', 'STORE_MANAGER'] },
    { id: 'commandes', label: 'Liste Commandes', icon: Package2, roles: ['SUPER_ADMIN', 'STORE_MANAGER'] },
    { id: 'stock', label: 'Gestion du stock', icon: Package2, roles: ['SUPER_ADMIN', 'STORE_MANAGER'] },
    { id: 'orders', label: 'Commandes', icon: ShoppingCart, roles: ['SUPER_ADMIN', 'STORE_MANAGER'] },
    { id: 'reviews', label: 'Modération des avis', icon: MessageSquare, roles: ['SUPER_ADMIN'] },
    { id: 'newsletter', label: 'Newsletter', icon: Mail, roles: ['SUPER_ADMIN'] },
    { id: 'users', label: 'Utilisateurs', icon: Users, roles: ['SUPER_ADMIN'] },
    { id: 'reports', label: 'Rapports', icon: BarChart3, roles: ['SUPER_ADMIN', 'STORE_MANAGER'] },
    { id: 'settings', label: 'Paramètres', icon: Settings, roles: ['SUPER_ADMIN', 'STORE_MANAGER'] }
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(userRole));

  return (
    <>
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-50
        transform transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 flex flex-col
      `}>
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-[#800080] to-[#9333ea] rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">I</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">I Love Mobile</h1>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          </div>

          {userRole === 'STORE_MANAGER' && (
            <div className="bg-purple-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Store size={16} className="text-[#800080]" />
                <span className="text-xs font-semibold text-[#800080]">Boutique actuelle</span>
              </div>
              <p className="text-sm font-bold text-gray-900">I Love Mobile Paris</p>
            </div>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {filteredItems.map(item => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentPage(item.id);
                  setIsMobileOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-[#f3e8ff] text-[#800080]'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-xl transition-all">
            <LogOut size={20} />
            <span className="font-medium text-sm">Déconnexion</span>
          </button>
        </div>
      </aside>
    </>
  );
};

// Header Component
const Header = ({ setIsMobileOpen, darkMode, setDarkMode }: {
  setIsMobileOpen: (open: boolean) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
}) => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="px-4 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            <Menu size={24} />
          </button>

          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Rechercher produit, commande, boutique..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button className="relative p-2 hover:bg-gray-100 rounded-lg">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#800080] to-[#9333ea] flex items-center justify-center">
                <User size={18} className="text-white" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-gray-900">Admin</p>
                <p className="text-xs text-gray-500">Super Admin</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

// Stats Card Component
const StatsCard = ({ icon: Icon, label, value, trend, trendValue, color, subtitle }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  trend?: 'up' | 'down';
  trendValue?: string | number;
  color: string;
  subtitle?: string;
}) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between mb-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
      {trend && (
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
          trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trendValue}%
        </div>
      )}
    </div>
    <div>
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
    </div>
  </div>
);

// Dashboard Page
const DashboardPage = ({ userRole }: { userRole: Role }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Tableau de bord</h2>
          <p className="text-gray-600">Vue d&apos;ensemble {userRole === 'SUPER_ADMIN' ? 'globale' : 'de votre boutique'}</p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
          >
            <option value="7d">7 derniers jours</option>
            <option value="30d">30 derniers jours</option>
            <option value="90d">90 derniers jours</option>
            <option value="1y">Cette année</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download size={18} />
            <span className="hidden sm:inline">Exporter</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          icon={DollarSign}
          label="Ventes totales"
          value="126 450 €"
          trend="up"
          trendValue="12.5"
          subtitle="vs période précédente"
          color="bg-gradient-to-br from-green-500 to-green-600"
        />
        <StatsCard
          icon={ShoppingBag}
          label="Commandes"
          value="677"
          trend="up"
          trendValue="8.2"
          subtitle="234 en ligne, 443 en boutique"
          color="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <StatsCard
          icon={Package}
          label="Produits actifs"
          value="324"
          trend="up"
          trendValue="3.1"
          subtitle="18 en stock faible"
          color="bg-gradient-to-br from-[#800080] to-[#9333ea]"
        />
        {userRole === 'SUPER_ADMIN' && (
          <StatsCard
            icon={Store}
            label="Boutiques actives"
            value="4"
            subtitle="3 pays, 4 devises"
            color="bg-gradient-to-br from-orange-500 to-orange-600"
          />
        )}
      </div>

      {/* Low Stock Alert */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-orange-600 mt-0.5" size={20} />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">Alerte Stock Bas</h3>
            <p className="text-sm text-gray-700 mb-2">18 produits ont un stock inférieur au seuil d&apos;alerte dans plusieurs boutiques</p>
            <button className="text-sm font-semibold text-[#800080] hover:text-[#6b006b]">
              Voir les détails →
            </button>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Store */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Ventes par boutique</h3>
            <button className="text-sm text-[#800080] hover:text-[#6b006b] font-medium">
              Voir tout
            </button>
          </div>
          <div className="space-y-4">
            {MOCK_STORES.map(store => (
              <div key={store.id} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#800080] to-[#9333ea] flex items-center justify-center">
                  <Store size={18} className="text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-900">{store.city}</span>
                    <span className="font-bold text-gray-900">{store.sales.toLocaleString()} {store.currency}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-[#800080] to-[#9333ea] h-2 rounded-full"
                      style={{ width: `${(store.sales / 50000) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Commandes récentes</h3>
            <button className="text-sm text-[#800080] hover:text-[#6b006b] font-medium">
              Voir tout
            </button>
          </div>
          <div className="space-y-3">
            {MOCK_ORDERS.slice(0, 5).map(order => (
              <div key={order.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <ShoppingCart size={18} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{order.id}</p>
                  <p className="text-xs text-gray-500 truncate">{order.customer} • {order.store}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm text-gray-900">{order.total.toLocaleString()} {order.currency}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    order.status === 'shipped' ? 'bg-green-100 text-green-700' :
                    order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {order.status === 'shipped' ? 'Expédiée' :
                     order.status === 'processing' ? 'En cours' : 'En attente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// const StockPage = () => {
//   const [selectedStore, setSelectedStore] = useState('all');
//   const [filterStatus, setFilterStatus] = useState('all');
//   const [searchTerm, setSearchTerm] = useState('');
  
//   // Modals state
//   const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
//   const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
//   const [selectedProduct, setSelectedProduct] = useState(null);
//   const [selectedStoreForModal, setSelectedStoreForModal] = useState(null);

//   // Get unique products from MOCK_PRODUCTS grouped by model
//   const getStockData = () => {
//     const stockByModel = {};

//     MOCK_PRODUCTS.forEach(product => {
//       if (!stockByModel[product.modelId]) {
//         const model = MOCK_PRODUCT_MODELS.find(m => m.id === product.modelId);
//         stockByModel[product.modelId] = {
//           id: product.modelId,
//           name: product.modelName,
//           category: model?.category || 'N/A',
//           image: model?.colors[0]?.images[0] || '',
//           globalStock: 0,
//           stores: []
//         };
//       }

//       // Count stock by store
//       const storeIndex = stockByModel[product.modelId].stores.findIndex(s => s.storeId === product.storeId);
      
//       if (storeIndex === -1) {
//         stockByModel[product.modelId].stores.push({
//           storeId: product.storeId,
//           storeName: product.storeName,
//           stock: product.status === 'in_stock' ? 1 : 0
//         });
//       } else {
//         if (product.status === 'in_stock') {
//           stockByModel[product.modelId].stores[storeIndex].stock += 1;
//         }
//       }

//       // Count global stock (only in_stock products)
//       if (product.status === 'in_stock') {
//         stockByModel[product.modelId].globalStock += 1;
//       }
//     });

//     return Object.values(stockByModel);
//   };

//   const stockData = getStockData();

//   // Filter stock data
//   const filteredStock = stockData.filter(item => {
//     // Search filter
//     if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) {
//       return false;
//     }

//     // Store filter
//     if (selectedStore !== 'all') {
//       const storeData = item.stores.find(s => s.storeId === parseInt(selectedStore));
//       if (!storeData || storeData.stock === 0) return false;
//     }

//     // Status filter
//     if (filterStatus !== 'all') {
//       if (filterStatus === 'in_stock' && item.globalStock === 0) return false;
//       if (filterStatus === 'low_stock' && (item.globalStock === 0 || item.globalStock >= 20)) return false;
//       if (filterStatus === 'out_of_stock' && item.globalStock > 0) return false;
//     }

//     return true;
//   });

//   const handleAddStock = (product, store) => {
//     setSelectedProduct(product);
//     setSelectedStoreForModal(store);
//     setIsMovementModalOpen(true);
//   };

//   const handleViewHistory = (product, store) => {
//     setSelectedProduct(product);
//     setSelectedStoreForModal(store);
//     setIsHistoryModalOpen(true);
//   };

//   // Stock Movement Statistics
//   const StockMovementStats = () => {
//     const today = new Date();
//     const last7Days = MOCK_STOCK_MOVEMENTS.filter(m => {
//       const movementDate = new Date(m.date);
//       const diffDays = Math.floor((today - movementDate) / (1000 * 60 * 60 * 24));
//       return diffDays <= 7;
//     });

//     const totalIn = last7Days.filter(m => m.quantity > 0).reduce((sum, m) => sum + m.quantity, 0);
//     const totalOut = last7Days.filter(m => m.quantity < 0).reduce((sum, m) => sum + Math.abs(m.quantity), 0);
//     const netChange = totalIn - totalOut;

//     return (
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
//         <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
//           <div className="flex items-center gap-3 mb-2">
//             <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
//               <TrendingUp size={20} className="text-white" />
//             </div>
//             <div>
//               <p className="text-xs text-green-700 font-semibold">Entrées (7j)</p>
//               <p className="text-2xl font-bold text-green-900">+{totalIn}</p>
//             </div>
//           </div>
//           <p className="text-xs text-green-600">
//             {last7Days.filter(m => m.quantity > 0).length} mouvements
//           </p>
//         </div>

//         <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
//           <div className="flex items-center gap-3 mb-2">
//             <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center">
//               <TrendingDown size={20} className="text-white" />
//             </div>
//             <div>
//               <p className="text-xs text-red-700 font-semibold">Sorties (7j)</p>
//               <p className="text-2xl font-bold text-red-900">-{totalOut}</p>
//             </div>
//           </div>
//           <p className="text-xs text-red-600">
//             {last7Days.filter(m => m.quantity < 0).length} mouvements
//           </p>
//         </div>

//         <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
//           <div className="flex items-center gap-3 mb-2">
//             <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
//               <RefreshCw size={20} className="text-white" />
//             </div>
//             <div>
//               <p className="text-xs text-blue-700 font-semibold">Variation nette</p>
//               <p className={`text-2xl font-bold ${netChange >= 0 ? 'text-blue-900' : 'text-red-900'}`}>
//                 {netChange >= 0 ? '+' : ''}{netChange}
//               </p>
//             </div>
//           </div>
//           <p className="text-xs text-blue-600">
//             {last7Days.length} mouvements totaux
//           </p>
//         </div>
//       </div>
//     );
//   };

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
//         <div>
//           <h2 className="text-2xl font-bold text-gray-900 mb-1">Gestion du stock</h2>
//           <p className="text-gray-600">Stock global et par boutique</p>
//         </div>
//         <div className="flex gap-2">
//           <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
//             <Download size={18} />
//             Exporter
//           </button>
//           <button className="px-4 py-2 bg-[#800080] text-white rounded-lg hover:bg-[#6b006b] flex items-center gap-2">
//             <Plus size={18} />
//             Mouvement de stock
//           </button>
//         </div>
//       </div>

//       {/* Stock Movement Statistics */}
//       <StockMovementStats />

//       {/* Filters */}
//       <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//           {/* Search */}
//           <div>
//             <label className="block text-sm font-semibold text-gray-700 mb-2">Rechercher</label>
//             <div className="relative">
//               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
//               <input
//                 type="text"
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 placeholder="Nom du produit..."
//                 className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
//               />
//             </div>
//           </div>

//           {/* Store Filter */}
//           <div>
//             <label className="block text-sm font-semibold text-gray-700 mb-2">Boutique</label>
//             <select
//               value={selectedStore}
//               onChange={(e) => setSelectedStore(e.target.value)}
//               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
//             >
//               <option value="all">Toutes les boutiques</option>
//               {MOCK_STORES.map(store => (
//                 <option key={store.id} value={store.id}>{store.city}</option>
//               ))}
//             </select>
//           </div>

//           {/* Status Filter */}
//           <div>
//             <label className="block text-sm font-semibold text-gray-700 mb-2">Statut</label>
//             <select
//               value={filterStatus}
//               onChange={(e) => setFilterStatus(e.target.value)}
//               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
//             >
//               <option value="all">Tous les statuts</option>
//               <option value="in_stock">En stock</option>
//               <option value="low_stock">Stock bas</option>
//               <option value="out_of_stock">Rupture</option>
//             </select>
//           </div>
//         </div>
//       </div>

//       {/* Stock Overview Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//         <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
//           <div className="flex items-center gap-3 mb-3">
//             <div className="p-2 rounded-lg bg-green-100">
//               <Check size={20} className="text-green-600" />
//             </div>
//             <div>
//               <p className="text-sm text-gray-600">En stock</p>
//               <p className="text-2xl font-bold text-gray-900">
//                 {stockData.filter(item => item.globalStock > 0).length}
//               </p>
//             </div>
//           </div>
//           <p className="text-xs text-gray-500">Modèles disponibles</p>
//         </div>

//         <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
//           <div className="flex items-center gap-3 mb-3">
//             <div className="p-2 rounded-lg bg-orange-100">
//               <AlertTriangle size={20} className="text-orange-600" />
//             </div>
//             <div>
//               <p className="text-sm text-gray-600">Stock bas</p>
//               <p className="text-2xl font-bold text-gray-900">
//                 {stockData.filter(item => item.globalStock > 0 && item.globalStock < 20).length}
//               </p>
//             </div>
//           </div>
//           <p className="text-xs text-gray-500">Moins de 20 unités</p>
//         </div>

//         <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
//           <div className="flex items-center gap-3 mb-3">
//             <div className="p-2 rounded-lg bg-red-100">
//               <X size={20} className="text-red-600" />
//             </div>
//             <div>
//               <p className="text-sm text-gray-600">Rupture</p>
//               <p className="text-2xl font-bold text-gray-900">
//                 {stockData.filter(item => item.globalStock === 0).length}
//               </p>
//             </div>
//           </div>
//           <p className="text-xs text-gray-500">Modèles épuisés</p>
//         </div>
//       </div>

//       {/* Recent Stock Movements */}
//       <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
//         <div className="flex items-center justify-between mb-4">
//           <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
//             <Clock size={20} className="text-[#800080]" />
//             Mouvements récents de stock
//           </h3>
//           <button className="text-sm text-[#800080] hover:text-[#6b006b] font-medium">
//             Voir tout l'historique →
//           </button>
//         </div>

//         <div className="space-y-3">
//           {MOCK_STOCK_MOVEMENTS.slice(0, 5).map(movement => {
//             const isIncrease = movement.quantity > 0;
//             return (
//               <div key={movement.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
//                 <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
//                   isIncrease ? 'bg-green-100' : 'bg-red-100'
//                 }`}>
//                   {isIncrease ? (
//                     <TrendingUp size={20} className="text-green-600" />
//                   ) : (
//                     <TrendingDown size={20} className="text-red-600" />
//                   )}
//                 </div>
                
//                 <div className="flex-1 min-w-0">
//                   <div className="flex items-center gap-2 mb-1">
//                     <p className="font-semibold text-gray-900 text-sm truncate">{movement.modelName}</p>
//                     <span className={`text-xs font-bold ${isIncrease ? 'text-green-600' : 'text-red-600'}`}>
//                       {isIncrease ? '+' : ''}{movement.quantity}
//                     </span>
//                   </div>
//                   <p className="text-xs text-gray-600 truncate">{movement.reason} • {movement.storeName}</p>
//                 </div>

//                 <div className="text-right">
//                   <p className="text-xs text-gray-500">
//                     {new Date(movement.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
//                   </p>
//                   <p className="text-xs text-gray-400">
//                     {new Date(movement.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
//                   </p>
//                 </div>

//                 <div className="flex items-center gap-1">
//                   <div className="text-center">
//                     <p className="text-xs text-gray-500">Avant</p>
//                     <p className="text-sm font-bold text-gray-700">{movement.previousStock}</p>
//                   </div>
//                   <ChevronRight size={16} className="text-gray-400 mx-1" />
//                   <div className="text-center">
//                     <p className="text-xs text-gray-500">Après</p>
//                     <p className={`text-sm font-bold ${isIncrease ? 'text-green-600' : 'text-red-600'}`}>
//                       {movement.newStock}
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </div>

//       {/* Stock Table */}
//       <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="w-full">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Produit</th>
//                 <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Catégorie</th>
//                 <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Stock global</th>
//                 {MOCK_STORES.map(store => (
//                   <th key={store.id} className="text-left py-4 px-6 text-sm font-semibold text-gray-600">
//                     {store.city}
//                   </th>
//                 ))}
//                 <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Statut</th>
//                 <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {filteredStock.map(item => {
//                 const getStoreStock = (storeId) => {
//                   const storeData = item.stores.find(s => s.storeId === storeId);
//                   return storeData ? storeData.stock : 0;
//                 };

//                 const getStoreData = (storeId) => {
//                   return MOCK_STORES.find(s => s.id === storeId);
//                 };

//                 return (
//                   <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50 group">
//                     <td className="py-4 px-6">
//                       <div className="flex items-center gap-3">
//                         <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover" />
//                         <div>
//                           <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
//                           <p className="text-xs text-gray-500">{item.category}</p>
//                         </div>
//                       </div>
//                     </td>
//                     <td className="py-4 px-6 text-sm text-gray-600">{item.category}</td>
//                     <td className="py-4 px-6">
//                       <span className="font-bold text-gray-900">{item.globalStock}</span>
//                     </td>
//                     {MOCK_STORES.map(store => {
//                       const stock = getStoreStock(store.id);
//                       return (
//                         <td key={store.id} className="py-4 px-6">
//                           <div className="flex items-center gap-2">
//                             <span className={`text-sm font-semibold ${
//                               stock === 0 ? 'text-red-600' :
//                               stock < 10 ? 'text-orange-600' : 
//                               stock < 30 ? 'text-yellow-600' : 'text-green-600'
//                             }`}>
//                               {stock}
//                             </span>
//                             {/* Actions rapides au survol */}
//                             <div className="hidden group-hover:flex gap-1">
//                               <button
//                                 onClick={() => handleAddStock(item, getStoreData(store.id))}
//                                 className="p-1 hover:bg-green-100 rounded transition-colors"
//                                 title="Ajouter/Ajuster stock"
//                               >
//                                 <Plus size={14} className="text-green-600" />
//                               </button>
//                               <button
//                                 onClick={() => handleViewHistory(item, getStoreData(store.id))}
//                                 className="p-1 hover:bg-blue-100 rounded transition-colors"
//                                 title="Voir l'historique"
//                               >
//                                 <Clock size={14} className="text-blue-600" />
//                               </button>
//                             </div>
//                           </div>
//                         </td>
//                       );
//                     })}
//                     <td className="py-4 px-6">
//                       <span className={`px-3 py-1 rounded-full text-xs font-medium ${
//                         item.globalStock === 0 ? 'bg-red-100 text-red-700' :
//                         item.globalStock < 20 ? 'bg-orange-100 text-orange-700' :
//                         'bg-green-100 text-green-700'
//                       }`}>
//                         {item.globalStock === 0 ? 'Rupture' :
//                          item.globalStock < 20 ? 'Stock bas' : 'En stock'}
//                       </span>
//                     </td>
//                     <td className="py-4 px-6">
//                       <div className="flex gap-2">
//                         <button 
//                           onClick={() => {
//                             setSelectedProduct(item);
//                             setSelectedStoreForModal(null);
//                             setIsHistoryModalOpen(true);
//                           }}
//                           className="p-2 hover:bg-blue-100 rounded-lg transition-colors" 
//                           title="Historique complet"
//                         >
//                           <Clock size={16} className="text-blue-600" />
//                         </button>
//                         <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Ajuster stock">
//                           <Edit size={16} className="text-gray-600" />
//                         </button>
//                         <button className="p-2 hover:bg-purple-100 rounded-lg transition-colors" title="Transférer">
//                           <Send size={16} className="text-purple-600" />
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {filteredStock.length === 0 && (
//         <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
//           <Package size={48} className="mx-auto text-gray-400 mb-4" />
//           <h3 className="text-lg font-bold text-gray-900 mb-2">Aucun produit trouvé</h3>
//           <p className="text-gray-600">Essayez de modifier vos filtres</p>
//         </div>
//       )}

//       {/* Modals */}
//       <StockMovementModal
//         isOpen={isMovementModalOpen}
//         onClose={() => {
//           setIsMovementModalOpen(false);
//           setSelectedProduct(null);
//           setSelectedStoreForModal(null);
//         }}
//         product={selectedProduct}
//         store={selectedStoreForModal}
//       />

//       <StockHistoryModal
//         isOpen={isHistoryModalOpen}
//         onClose={() => {
//           setIsHistoryModalOpen(false);
//           setSelectedProduct(null);
//           setSelectedStoreForModal(null);
//         }}
//         product={selectedProduct}
//         store={selectedStoreForModal}
//       />
//     </div>
//   );
// };

// Orders Page
// const OrdersPage = () => {
//   const [selectedOrder, setSelectedOrder] = useState(null);
//   const [isDetailsOpen, setIsDetailsOpen] = useState(false);
//   const [filters, setFilters] = useState({
//     search: '',
//     status: 'all',
//     type: 'all',
//     store: 'all',
//     dateRange: '30d'
//   });

//   const filteredOrders = MOCK_ORDERS.filter(order => {
//     if (filters.search && !order.id.toLowerCase().includes(filters.search.toLowerCase()) &&
//         !order.customer.toLowerCase().includes(filters.search.toLowerCase())) {
//       return false;
//     }
//     if (filters.status !== 'all' && order.status !== filters.status) return false;
//     if (filters.type !== 'all' && order.type !== filters.type) return false;
//     if (filters.store !== 'all' && order.store !== filters.store) return false;
//     return true;
//   });

//   const handleViewDetails = (order) => {
//     setSelectedOrder(order);
//     setIsDetailsOpen(true);
//   };

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h2 className="text-2xl font-bold text-gray-900 mb-1">Gestion des commandes</h2>
//           <p className="text-gray-600">{filteredOrders.length} commandes</p>
//         </div>
//         <div className="flex gap-2">
//           <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
//             <Filter size={18} />
//             Filtrer
//           </button>
//           <button className="flex items-center gap-2 px-4 py-2 bg-[#800080] text-white rounded-lg hover:bg-[#6b006b]">
//             <Plus size={18} />
//             Nouvelle commande
//           </button>
//         </div>
//       </div>

//       {/* Filters */}
//       <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
//         <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
//           <div className="md:col-span-2">
//             <div className="relative">
//               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
//               <input
//                 type="text"
//                 value={filters.search}
//                 onChange={(e) => setFilters({ ...filters, search: e.target.value })}
//                 placeholder="Rechercher une commande..."
//                 className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
//               />
//             </div>
//           </div>
//           <select
//             value={filters.status}
//             onChange={(e) => setFilters({ ...filters, status: e.target.value })}
//             className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
//           >
//             <option value="all">Tous les statuts</option>
//             <option value="pending">En attente</option>
//             <option value="processing">En traitement</option>
//             <option value="shipped">Expédiée</option>
//             <option value="delivered">Livrée</option>
//           </select>
//           <select
//             value={filters.type}
//             onChange={(e) => setFilters({ ...filters, type: e.target.value })}
//             className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
//           >
//             <option value="all">Tous les types</option>
//             <option value="online">En ligne</option>
//             <option value="in_store">En boutique</option>
//           </select>
//           <select
//             value={filters.store}
//             onChange={(e) => setFilters({ ...filters, store: e.target.value })}
//             className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
//           >
//             <option value="all">Toutes les boutiques</option>
//             {MOCK_STORES.map(store => (
//               <option key={store.id} value={store.city}>{store.city}</option>
//             ))}
//           </select>
//         </div>
//       </div>

//       {/* Orders Table */}
//       <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="w-full">
//             <thead className="bg-gray-50">
//               <tr className="border-t border-gray-100 hover:bg-gray-50 group">
//                 <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Commande</th>
//                 <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Client</th>
//                 <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Boutique</th>
//                 <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Date</th>
//                 <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Articles</th>
//                 <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Total</th>
//                 <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Type</th>
//                 <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Statut</th>
//                 <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {filteredOrders.map(order => (
//                 <tr key={order.id} className="border-t border-gray-100 hover:bg-gray-50">
//                   <td className="py-4 px-6">
//                     <span className="font-semibold text-gray-900">{order.id}</span>
//                   </td>
//                   <td className="py-4 px-6">
//                     <div>
//                       <p className="font-medium text-gray-900">{order.customer}</p>
//                       <p className="text-xs text-gray-500">{order.email}</p>
//                     </div>
//                   </td>
//                   <td className="py-4 px-6">
//                     <span className="text-sm text-gray-700">{order.store}</span>
//                   </td>
//                   <td className="py-4 px-6 text-sm text-gray-600">
//                     {new Date(order.date).toLocaleDateString('fr-FR')}
//                   </td>
//                   <td className="py-4 px-6 text-sm text-gray-600">{order.items}</td>
//                   <td className="py-4 px-6">
//                     <span className="font-bold text-gray-900">{order.total.toLocaleString()} {order.currency}</span>
//                   </td>
//                   <td className="py-4 px-6">
//                     <span className={`px-3 py-1 rounded-full text-xs font-medium ${
//                       order.type === 'online' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
//                     }`}>
//                       {order.type === 'online' ? 'En ligne' : 'En boutique'}
//                     </span>
//                   </td>
//                   <td className="py-4 px-6">
//                     <span className={`px-3 py-1 rounded-full text-xs font-medium ${
//                       order.status === 'shipped' ? 'bg-green-100 text-green-700' :
//                       order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
//                       'bg-yellow-100 text-yellow-700'
//                     }`}>
//                       {order.status === 'shipped' ? 'Expédiée' :
//                        order.status === 'processing' ? 'En cours' : 'En attente'}
//                     </span>
//                   </td>
//                   <td className="py-4 px-6">
//                     <div className="flex gap-2">
//                       <button 
//                         onClick={() => handleViewDetails(order)}
//                         className="p-2 hover:bg-blue-100 rounded-lg"
//                         title="Voir détails"
//                       >
//                         <Eye size={16} className="text-blue-600" />
//                       </button>
//                       <button className="p-2 hover:bg-gray-100 rounded-lg" title="Modifier">
//                         <Edit size={16} className="text-gray-600" />
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* Order Details Modal */}
//       <OrderDetailsModal
//         isOpen={isDetailsOpen}
//         onClose={() => setIsDetailsOpen(false)}
//         order={selectedOrder}
//       />
//     </div>
//   );
// };

// // Product Form Modal
// const ProductFormModal = ({ isOpen, onClose, product }) => {
//   const [formData, setFormData] = useState({
//     name: '',
//     sku: '',
//     category: 'Téléphones',
//     price: '',
//     description: '',
//     images: []
//   });

//   const [variants, setVariants] = useState([
//     { storage: '128GB', color: 'Noir', price: '' }
//   ]);

//   const [specs, setSpecs] = useState([
//     { key: 'Écran', value: '' },
//     { key: 'Processeur', value: '' }
//   ]);

//   const [stockByStore, setStockByStore] = useState(
//     MOCK_STORES.map(store => ({
//       storeId: store.id,
//       storeName: store.name,
//       stock: 0,
//       price: '',
//       alertThreshold: 20
//     }))
//   );

//   // Populate form when product is loaded (edit mode)
//   React.useEffect(() => {
//     if (product) {
//       setFormData({
//         name: product.name || '',
//         sku: product.sku || '',
//         category: product.category || 'Téléphones',
//         price: product.price || '',
//         description: product.description || '',
//         images: []
//       });

//       // Populate stock by store
//       if (product.stores) {
//         setStockByStore(
//           MOCK_STORES.map(store => {
//             const storeData = product.stores.find(s => s.storeId === store.id);
//             return {
//               storeId: store.id,
//               storeName: store.name,
//               stock: storeData?.stock || 0,
//               price: storeData?.price || product.price || '',
//               alertThreshold: 20
//             };
//           })
//         );
//       }
//     } else {
//       // Reset form for new product
//       setFormData({
//         name: '',
//         sku: '',
//         category: 'Téléphones',
//         price: '',
//         description: '',
//         images: []
//       });
//       setVariants([{ storage: '128GB', color: 'Noir', price: '' }]);
//       setSpecs([{ key: 'Écran', value: '' }, { key: 'Processeur', value: '' }]);
//       setStockByStore(
//         MOCK_STORES.map(store => ({
//           storeId: store.id,
//           storeName: store.name,
//           stock: 0,
//           price: '',
//           alertThreshold: 20
//         }))
//       );
//     }
//   }, [product, isOpen]);

//   const categories = [
//     'Téléphones',
//     'Tablettes',
//     'Ordinateurs',
//     'Protections',
//     'Accessoires de charge',
//     'Supports',
//     'Produits connectés',
//     'Autres accessoires'
//   ];

//   const addVariant = () => {
//     setVariants([...variants, { storage: '', color: '', price: '' }]);
//   };

//   const removeVariant = (index) => {
//     setVariants(variants.filter((_, i) => i !== index));
//   };

//   const addSpec = () => {
//     setSpecs([...specs, { key: '', value: '' }]);
//   };

//   const removeSpec = (index) => {
//     setSpecs(specs.filter((_, i) => i !== index));
//   };

//   const updateVariant = (index, field, value) => {
//     const newVariants = [...variants];
//     newVariants[index][field] = value;
//     setVariants(newVariants);
//   };

//   const updateSpec = (index, field, value) => {
//     const newSpecs = [...specs];
//     newSpecs[index][field] = value;
//     setSpecs(newSpecs);
//   };

//   const updateStoreStock = (storeId, field, value) => {
//     setStockByStore(
//       stockByStore.map(store =>
//         store.storeId === storeId ? { ...store, [field]: value } : store
//       )
//     );
//   };

//   const calculateTotalStock = () => {
//     return stockByStore.reduce((sum, store) => sum + parseInt(store.stock || 0), 0);
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
    
//     const productData = {
//       ...formData,
//       variants,
//       specs,
//       stockByStore,
//       globalStock: calculateTotalStock()
//     };

//     console.log('Product data:', productData);
//     // Ici, ajoutez votre appel API
//     onClose();
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 z-50 overflow-y-auto">
//       <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
//         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        
//         <div className="relative bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
//           {/* Header */}
//           <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 rounded-t-2xl z-10">
//             <div className="flex items-center justify-between">
//               <div>
//                 <h2 className="text-2xl font-bold text-gray-900 mb-1">
//                   {product ? 'Modifier le produit' : 'Nouveau produit'}
//                 </h2>
//                 <p className="text-gray-600">
//                   {product ? `Mise à jour de ${product.name}` : 'Ajouter un nouveau produit au catalogue'}
//                 </p>
//               </div>
//               <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
//                 <X size={24} />
//               </button>
//             </div>
//           </div>

//           {/* Form */}
//           <form onSubmit={handleSubmit} className="p-8">
//             {/* Basic Information */}
//             <div className="mb-8">
//               <div className="flex items-center gap-2 mb-6">
//                 <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#800080] to-[#9333ea] flex items-center justify-center">
//                   <Package size={18} className="text-white" />
//                 </div>
//                 <h3 className="text-lg font-bold text-gray-900">Informations de base</h3>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 {/* Product Name */}
//                 <div>
//                   <label className="block text-sm font-semibold text-gray-700 mb-2">
//                     Nom du produit <span className="text-red-500">*</span>
//                   </label>
//                   <input
//                     type="text"
//                     value={formData.name}
//                     onChange={(e) => setFormData({...formData, name: e.target.value})}
//                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
//                     placeholder="iPhone 15 Pro Max"
//                     required
//                   />
//                 </div>

//                 {/* SKU */}
//                 <div>
//                   <label className="block text-sm font-semibold text-gray-700 mb-2">
//                     SKU <span className="text-red-500">*</span>
//                   </label>
//                   <input
//                     type="text"
//                     value={formData.sku}
//                     onChange={(e) => setFormData({...formData, sku: e.target.value.toUpperCase()})}
//                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
//                     placeholder="IPH15PM-256-BLK"
//                     required
//                   />
//                 </div>

//                 {/* Category */}
//                 <div>
//                   <label className="block text-sm font-semibold text-gray-700 mb-2">
//                     Catégorie <span className="text-red-500">*</span>
//                   </label>
//                   <select
//                     value={formData.category}
//                     onChange={(e) => setFormData({...formData, category: e.target.value})}
//                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
//                     required
//                   >
//                     {categories.map(cat => (
//                       <option key={cat} value={cat}>{cat}</option>
//                     ))}
//                   </select>
//                 </div>

//                 {/* Base Price */}
//                 <div>
//                   <label className="block text-sm font-semibold text-gray-700 mb-2">
//                     Prix de base (€) <span className="text-red-500">*</span>
//                   </label>
//                   <input
//                     type="number"
//                     value={formData.price}
//                     onChange={(e) => setFormData({...formData, price: e.target.value})}
//                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
//                     placeholder="1299"
//                     required
//                   />
//                 </div>
//               </div>

//               {/* Description */}
//               <div className="mt-6">
//                 <label className="block text-sm font-semibold text-gray-700 mb-2">
//                   Description
//                 </label>
//                 <textarea
//                   value={formData.description}
//                   onChange={(e) => setFormData({...formData, description: e.target.value})}
//                   rows="4"
//                   className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080] resize-none"
//                   placeholder="Description détaillée du produit..."
//                 />
//               </div>

//               {/* Images Upload */}
//               <div className="mt-6">
//                 <label className="block text-sm font-semibold text-gray-700 mb-2">
//                   Images du produit
//                 </label>
//                 <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#800080] transition-colors cursor-pointer">
//                   <Upload className="mx-auto mb-2 text-gray-400" size={32} />
//                   <p className="text-sm text-gray-600">Glissez vos images ici ou cliquez pour parcourir</p>
//                   <p className="text-xs text-gray-400 mt-1">PNG, JPG jusqu'à 10MB</p>
//                 </div>
//               </div>
//             </div>

//             {/* Stock by Store */}
//             <div className="mb-8 border-t border-gray-200 pt-8">
//               <div className="flex items-center gap-2 mb-6">
//                 <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
//                   <Store size={18} className="text-white" />
//                 </div>
//                 <div className="flex-1">
//                   <h3 className="text-lg font-bold text-gray-900">Stock par boutique</h3>
//                   <p className="text-sm text-gray-600">Stock total: <span className="font-bold text-[#800080]">{calculateTotalStock()}</span> unités</p>
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 {stockByStore.map((store) => (
//                   <div key={store.storeId} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
//                     <div className="flex items-center gap-2 mb-3">
//                       <Store size={16} className="text-[#800080]" />
//                       <h4 className="font-semibold text-gray-900">{store.storeName}</h4>
//                     </div>
//                     <div className="grid grid-cols-2 gap-3">
//                       <div>
//                         <label className="block text-xs font-semibold text-gray-700 mb-1">
//                           Stock
//                         </label>
//                         <input
//                           type="number"
//                           value={store.stock}
//                           onChange={(e) => updateStoreStock(store.storeId, 'stock', e.target.value)}
//                           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080] text-sm"
//                           placeholder="0"
//                           min="0"
//                         />
//                       </div>
//                       <div>
//                         <label className="block text-xs font-semibold text-gray-700 mb-1">
//                           Prix local
//                         </label>
//                         <input
//                           type="number"
//                           value={store.price}
//                           onChange={(e) => updateStoreStock(store.storeId, 'price', e.target.value)}
//                           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080] text-sm"
//                           placeholder={formData.price}
//                         />
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             {/* Variants */}
//             <div className="mb-8 border-t border-gray-200 pt-8">
//               <div className="flex items-center justify-between mb-6">
//                 <div className="flex items-center gap-2">
//                   <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
//                     <Package2 size={18} className="text-white" />
//                   </div>
//                   <h3 className="text-lg font-bold text-gray-900">Variantes du produit</h3>
//                 </div>
//                 <button
//                   type="button"
//                   onClick={addVariant}
//                   className="text-sm text-[#800080] hover:text-[#6b006b] font-medium flex items-center gap-1"
//                 >
//                   <Plus size={16} />
//                   Ajouter une variante
//                 </button>
//               </div>
              
//               <div className="space-y-3">
//                 {variants.map((variant, index) => (
//                   <div key={index} className="flex gap-3 items-center">
//                     <input
//                       type="text"
//                       placeholder="Stockage"
//                       value={variant.storage}
//                       onChange={(e) => updateVariant(index, 'storage', e.target.value)}
//                       className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
//                     />
//                     <input
//                       type="text"
//                       placeholder="Couleur"
//                       value={variant.color}
//                       onChange={(e) => updateVariant(index, 'color', e.target.value)}
//                       className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
//                     />
//                     <input
//                       type="number"
//                       placeholder="Prix"
//                       value={variant.price}
//                       onChange={(e) => updateVariant(index, 'price', e.target.value)}
//                       className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
//                     />
//                     <button 
//                       type="button"
//                       onClick={() => removeVariant(index)}
//                       className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
//                     >
//                       <Trash2 size={18} />
//                     </button>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             {/* Specifications */}
//             <div className="mb-8 border-t border-gray-200 pt-8">
//               <div className="flex items-center justify-between mb-6">
//                 <div className="flex items-center gap-2">
//                   <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
//                     <Settings size={18} className="text-white" />
//                   </div>
//                   <h3 className="text-lg font-bold text-gray-900">Spécifications techniques</h3>
//                 </div>
//                 <button
//                   type="button"
//                   onClick={addSpec}
//                   className="text-sm text-[#800080] hover:text-[#6b006b] font-medium flex items-center gap-1"
//                 >
//                   <Plus size={16} />
//                   Ajouter une spécification
//                 </button>
//               </div>
              
//               <div className="space-y-3">
//                 {specs.map((spec, index) => (
//                   <div key={index} className="flex gap-3 items-center">
//                     <input
//                       type="text"
//                       placeholder="Nom (ex: Écran)"
//                       value={spec.key}
//                       onChange={(e) => updateSpec(index, 'key', e.target.value)}
//                       className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
//                     />
//                     <input
//                       type="text"
//                       placeholder="Valeur (ex: 6.7 pouces)"
//                       value={spec.value}
//                       onChange={(e) => updateSpec(index, 'value', e.target.value)}
//                       className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
//                     />
//                     <button 
//                       type="button"
//                       onClick={() => removeSpec(index)}
//                       className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
//                     >
//                       <Trash2 size={18} />
//                     </button>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             {/* Action Buttons */}
//             <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
//               <button
//                 type="button"
//                 onClick={onClose}
//                 className="flex-1 py-3 px-6 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
//               >
//                 Annuler
//               </button>
//               <button
//                 type="submit"
//                 className="flex-1 py-3 px-6 bg-gradient-to-r from-[#800080] to-[#9333ea] text-white rounded-lg font-semibold hover:from-[#6b006b] hover:to-[#7e22ce] transition-all shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2"
//               >
//                 <Check size={20} />
//                 {product ? 'Mettre à jour' : 'Créer le produit'}
//               </button>
//             </div>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// };

// // Add Product Model Modal
// const AddProductModelModal = ({ isOpen, onClose }) => {
//   const [step, setStep] = useState(1); // 1: Basic Info, 2: Colors, 3: Variants, 4: Specs
//   const [formData, setFormData] = useState({
//     name: '',
//     brand: '',
//     category: 'Téléphones',
//     basePrice: '',
//     oldPrice: '',
//     description: '',
//     status: 'active'
//   });

//   const [colors, setColors] = useState([
//     { name: '', hex: '#000000', images: [] }
//   ]);

//   const [variants, setVariants] = useState(['128GB', '256GB', '512GB']);
//   const [newVariant, setNewVariant] = useState('');

//   const [specs, setSpecs] = useState([
//     { key: 'Écran', value: '' },
//     { key: 'Processeur', value: '' },
//     { key: 'RAM', value: '' },
//     { key: 'Caméra', value: '' },
//     { key: 'Batterie', value: '' }
//   ]);

//   const categories = [
//     'Téléphones',
//     'Tablettes',
//     'Ordinateurs',
//     'Montres connectées',
//     'Écouteurs',
//     'Accessoires'
//   ];

//   const brands = ['Apple', 'Samsung', 'Google', 'Xiaomi', 'Huawei', 'OnePlus', 'OPPO', 'Autre'];

//   const predefinedColors = [
//     { name: 'Noir', hex: '#000000' },
//     { name: 'Blanc', hex: '#FFFFFF' },
//     { name: 'Bleu', hex: '#3B82F6' },
//     { name: 'Rouge', hex: '#EF4444' },
//     { name: 'Vert', hex: '#10B981' },
//     { name: 'Rose', hex: '#EC4899' },
//     { name: 'Violet', hex: '#8B5CF6' },
//     { name: 'Or', hex: '#F59E0B' },
//     { name: 'Argent', hex: '#E5E7EB' },
//     { name: 'Gris', hex: '#6B7280' }
//   ];

//   const addColor = () => {
//     setColors([...colors, { name: '', hex: '#000000', images: [] }]);
//   };

//   const removeColor = (index) => {
//     setColors(colors.filter((_, i) => i !== index));
//   };

//   const updateColor = (index, field, value) => {
//     const newColors = [...colors];
//     newColors[index][field] = value;
//     setColors(newColors);
//   };

//   const addVariant = () => {
//     if (newVariant && !variants.includes(newVariant)) {
//       setVariants([...variants, newVariant]);
//       setNewVariant('');
//     }
//   };

//   const removeVariant = (variant) => {
//     setVariants(variants.filter(v => v !== variant));
//   };

//   const updateSpec = (index, field, value) => {
//     const newSpecs = [...specs];
//     newSpecs[index][field] = value;
//     setSpecs(newSpecs);
//   };

//   const addSpec = () => {
//     setSpecs([...specs, { key: '', value: '' }]);
//   };

//   const removeSpec = (index) => {
//     setSpecs(specs.filter((_, i) => i !== index));
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
    
//     const modelData = {
//       ...formData,
//       colors: colors.filter(c => c.name && c.hex),
//       variants: variants,
//       specs: specs.reduce((acc, spec) => {
//         if (spec.key && spec.value) {
//           acc[spec.key] = spec.value;
//         }
//         return acc;
//       }, {})
//     };

//     console.log('New Model Data:', modelData);
//     // Ici, ajoutez votre appel API
//     onClose();
//     setStep(1);
//   };

//   const nextStep = () => {
//     if (step < 4) setStep(step + 1);
//   };

//   const prevStep = () => {
//     if (step > 1) setStep(step - 1);
//   };

//   const canProceed = () => {
//     switch (step) {
//       case 1:
//         return formData.name && formData.brand && formData.basePrice;
//       case 2:
//         return colors.some(c => c.name && c.hex);
//       case 3:
//         return variants.length > 0;
//       case 4:
//         return specs.some(s => s.key && s.value);
//       default:
//         return false;
//     }
//   };

//   if (!isOpen) return null;

//   const steps = [
//     { id: 1, name: 'Informations de base', icon: Package },
//     { id: 2, name: 'Couleurs', icon: ImageIcon },
//     { id: 3, name: 'Variantes', icon: Package2 },
//     { id: 4, name: 'Spécifications', icon: Settings }
//   ];

//   return (
//     <div className="fixed inset-0 z-50 overflow-y-auto">
//       <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
//         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
        
//         <div className="relative bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
//           {/* Header */}
//           <div className="sticky top-0 bg-gradient-to-r from-[#800080] to-[#9333ea] px-8 py-6 text-white z-10 rounded-t-2xl">
//             <div className="flex items-center justify-between mb-4">
//               <div>
//                 <h2 className="text-2xl font-bold mb-1">Créer un nouveau modèle</h2>
//                 <p className="text-purple-100 text-sm">Étape {step} sur 4</p>
//               </div>
//               <button 
//                 onClick={onClose}
//                 className="p-2 hover:bg-white/20 rounded-lg transition-colors"
//               >
//                 <X size={24} />
//               </button>
//             </div>

//             {/* Steps Progress */}
//             <div className="flex items-center justify-between">
//               {steps.map((s, idx) => {
//                 const StepIcon = s.icon;
//                 return (
//                   <React.Fragment key={s.id}>
//                     <div className="flex flex-col items-center">
//                       <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
//                         step >= s.id ? 'bg-white text-[#800080]' : 'bg-white/20 text-white'
//                       }`}>
//                         {step > s.id ? <Check size={20} /> : <StepIcon size={20} />}
//                       </div>
//                       <p className={`text-xs mt-2 hidden sm:block ${step >= s.id ? 'text-white font-semibold' : 'text-purple-200'}`}>
//                         {s.name}
//                       </p>
//                     </div>
//                     {idx < steps.length - 1 && (
//                       <div className={`flex-1 h-1 mx-2 rounded transition-all ${
//                         step > s.id ? 'bg-white' : 'bg-white/20'
//                       }`} />
//                     )}
//                   </React.Fragment>
//                 );
//               })}
//             </div>
//           </div>

//           {/* Form Content */}
//           <form onSubmit={handleSubmit} className="p-8">
//             {/* Step 1: Basic Information */}
//             {step === 1 && (
//               <div className="space-y-6">
//                 <h3 className="text-lg font-bold text-gray-900 mb-4">Informations de base</h3>
                
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                   {/* Model Name */}
//                   <div>
//                     <label className="block text-sm font-semibold text-gray-700 mb-2">
//                       Nom du modèle <span className="text-red-500">*</span>
//                     </label>
//                     <input
//                       type="text"
//                       value={formData.name}
//                       onChange={(e) => setFormData({...formData, name: e.target.value})}
//                       className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
//                       placeholder="iPhone 15 Pro Max"
//                       required
//                     />
//                   </div>

//                   {/* Brand */}
//                   <div>
//                     <label className="block text-sm font-semibold text-gray-700 mb-2">
//                       Marque <span className="text-red-500">*</span>
//                     </label>
//                     <select
//                       value={formData.brand}
//                       onChange={(e) => setFormData({...formData, brand: e.target.value})}
//                       className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
//                       required
//                     >
//                       <option value="">Sélectionnez une marque</option>
//                       {brands.map(brand => (
//                         <option key={brand} value={brand}>{brand}</option>
//                       ))}
//                     </select>
//                   </div>

//                   {/* Category */}
//                   <div>
//                     <label className="block text-sm font-semibold text-gray-700 mb-2">
//                       Catégorie <span className="text-red-500">*</span>
//                     </label>
//                     <select
//                       value={formData.category}
//                       onChange={(e) => setFormData({...formData, category: e.target.value})}
//                       className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
//                       required
//                     >
//                       {categories.map(cat => (
//                         <option key={cat} value={cat}>{cat}</option>
//                       ))}
//                     </select>
//                   </div>

//                   {/* Base Price */}
//                   <div>
//                     <label className="block text-sm font-semibold text-gray-700 mb-2">
//                       Prix de base (€) <span className="text-red-500">*</span>
//                     </label>
//                     <input
//                       type="number"
//                       value={formData.basePrice}
//                       onChange={(e) => setFormData({...formData, basePrice: e.target.value})}
//                       className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
//                       placeholder="1299"
//                       required
//                     />
//                   </div>

//                   {/* Old Price */}
//                   <div>
//                     <label className="block text-sm font-semibold text-gray-700 mb-2">
//                       Ancien prix (€)
//                     </label>
//                     <input
//                       type="number"
//                       value={formData.oldPrice}
//                       onChange={(e) => setFormData({...formData, oldPrice: e.target.value})}
//                       className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
//                       placeholder="1499"
//                     />
//                   </div>
//                 </div>

//                 {/* Description */}
//                 <div>
//                   <label className="block text-sm font-semibold text-gray-700 mb-2">
//                     Description
//                   </label>
//                   <textarea
//                     value={formData.description}
//                     onChange={(e) => setFormData({...formData, description: e.target.value})}
//                     rows="4"
//                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080] resize-none"
//                     placeholder="Description détaillée du produit..."
//                   />
//                 </div>
//               </div>
//             )}

//             {/* Step 2: Colors */}
//             {step === 2 && (
//               <div className="space-y-6">
//                 <div className="flex items-center justify-between">
//                   <h3 className="text-lg font-bold text-gray-900">Couleurs disponibles</h3>
//                   <button
//                     type="button"
//                     onClick={addColor}
//                     className="text-sm text-[#800080] hover:text-[#6b006b] font-medium flex items-center gap-1"
//                   >
//                     <Plus size={16} />
//                     Ajouter une couleur
//                   </button>
//                 </div>

//                 {/* Predefined Colors Quick Select */}
//                 <div className="bg-gray-50 rounded-lg p-4">
//                   <p className="text-sm font-semibold text-gray-700 mb-3">Couleurs prédéfinies</p>
//                   <div className="flex flex-wrap gap-2">
//                     {predefinedColors.map(preColor => (
//                       <button
//                         key={preColor.name}
//                         type="button"
//                         onClick={() => {
//                           if (!colors.some(c => c.name === preColor.name)) {
//                             setColors([...colors, { ...preColor, images: [] }]);
//                           }
//                         }}
//                         className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:border-[#800080] transition-colors"
//                       >
//                         <span
//                           className="w-5 h-5 rounded-full border-2 border-gray-300"
//                           style={{ backgroundColor: preColor.hex }}
//                         />
//                         <span className="text-sm text-gray-700">{preColor.name}</span>
//                       </button>
//                     ))}
//                   </div>
//                 </div>

//                 {/* Color List */}
//                 <div className="space-y-4">
//                   {colors.map((color, colorIndex) => (
//                     <div key={colorIndex} className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-[#800080] transition-colors">
//                       <div className="flex items-center gap-4 mb-4">
//                         <div className="flex-1 grid grid-cols-2 gap-4">
//                           <div>
//                             <label className="block text-sm font-semibold text-gray-700 mb-2">
//                               Nom de la couleur
//                             </label>
//                             <input
//                               type="text"
//                               value={color.name}
//                               onChange={(e) => updateColor(colorIndex, 'name', e.target.value)}
//                               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
//                               placeholder="Titane Noir"
//                             />
//                           </div>
//                           <div>
//                             <label className="block text-sm font-semibold text-gray-700 mb-2">
//                               Code couleur
//                             </label>
//                             <div className="flex gap-2">
//                               <input
//                                 type="color"
//                                 value={color.hex}
//                                 onChange={(e) => updateColor(colorIndex, 'hex', e.target.value)}
//                                 className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
//                               />
//                               <input
//                                 type="text"
//                                 value={color.hex}
//                                 onChange={(e) => updateColor(colorIndex, 'hex', e.target.value)}
//                                 className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
//                                 placeholder="#000000"
//                               />
//                             </div>
//                           </div>
//                         </div>
//                         <button
//                           type="button"
//                           onClick={() => removeColor(colorIndex)}
//                           className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
//                         >
//                           <Trash2 size={18} />
//                         </button>
//                       </div>

//                       {/* Image Upload Area */}
//                       <div className="mt-4">
//                         <div className="flex items-center justify-between mb-3">
//                           <label className="block text-sm font-semibold text-gray-700">
//                             Images ({color.name || 'cette couleur'})
//                           </label>
//                           {color.images && color.images.length > 0 && (
//                             <span className="text-xs text-gray-500">
//                               {color.images.length} image{color.images.length > 1 ? 's' : ''} • Glissez pour réorganiser
//                             </span>
//                           )}
//                         </div>

//                         {/* Images Grid with Order Management */}
//                         {color.images && color.images.length > 0 && (
//                           <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
//                             {color.images.map((image, imgIndex) => (
//                               <div
//                                 key={imgIndex}
//                                 draggable
//                                 onDragStart={(e) => {
//                                   e.dataTransfer.effectAllowed = 'move';
//                                   e.dataTransfer.setData('colorIndex', colorIndex);
//                                   e.dataTransfer.setData('imageIndex', imgIndex);
//                                 }}
//                                 onDragOver={(e) => {
//                                   e.preventDefault();
//                                   e.dataTransfer.dropEffect = 'move';
//                                 }}
//                                 onDrop={(e) => {
//                                   e.preventDefault();
//                                   const dragColorIndex = parseInt(e.dataTransfer.getData('colorIndex'));
//                                   const dragImageIndex = parseInt(e.dataTransfer.getData('imageIndex'));
                                  
//                                   if (dragColorIndex === colorIndex && dragImageIndex !== imgIndex) {
//                                     const newColors = [...colors];
//                                     const images = [...newColors[colorIndex].images];
//                                     const [draggedImage] = images.splice(dragImageIndex, 1);
//                                     images.splice(imgIndex, 0, draggedImage);
//                                     newColors[colorIndex].images = images;
//                                     setColors(newColors);
//                                   }
//                                 }}
//                                 className="relative group cursor-move bg-gray-50 rounded-lg border-2 border-gray-200 hover:border-[#800080] transition-all aspect-square overflow-hidden"
//                               >
//                                 {/* Image Preview */}
//                                 <img
//                                   src={image.url || image}
//                                   alt={`${color.name} - ${imgIndex + 1}`}
//                                   className="w-full h-full object-cover"
//                                 />
                                
//                                 {/* Order Badge */}
//                                 <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-[#800080] text-white flex items-center justify-center text-xs font-bold shadow-lg">
//                                   {imgIndex + 1}
//                                 </div>

//                                 {/* Primary Image Badge */}
//                                 {imgIndex === 0 && (
//                                   <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
//                                     <Check size={12} />
//                                     Principal
//                                   </div>
//                                 )}

//                                 {/* Hover Actions */}
//                                 <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
//                                   {/* Move Left */}
//                                   {imgIndex > 0 && (
//                                     <button
//                                       type="button"
//                                       onClick={() => {
//                                         const newColors = [...colors];
//                                         const images = [...newColors[colorIndex].images];
//                                         [images[imgIndex - 1], images[imgIndex]] = [images[imgIndex], images[imgIndex - 1]];
//                                         newColors[colorIndex].images = images;
//                                         setColors(newColors);
//                                       }}
//                                       className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
//                                       title="Déplacer à gauche"
//                                     >
//                                       <ChevronLeft size={16} className="text-gray-700" />
//                                     </button>
//                                   )}

//                                   {/* Set as Primary */}
//                                   {imgIndex !== 0 && (
//                                     <button
//                                       type="button"
//                                       onClick={() => {
//                                         const newColors = [...colors];
//                                         const images = [...newColors[colorIndex].images];
//                                         const [primaryImage] = images.splice(imgIndex, 1);
//                                         images.unshift(primaryImage);
//                                         newColors[colorIndex].images = images;
//                                         setColors(newColors);
//                                       }}
//                                       className="p-2 bg-green-500 rounded-lg hover:bg-green-600 transition-colors"
//                                       title="Définir comme image principale"
//                                     >
//                                       <Check size={16} className="text-white" />
//                                     </button>
//                                   )}

//                                   {/* Delete */}
//                                   <button
//                                     type="button"
//                                     onClick={() => {
//                                       const newColors = [...colors];
//                                       newColors[colorIndex].images = newColors[colorIndex].images.filter((_, i) => i !== imgIndex);
//                                       setColors(newColors);
//                                     }}
//                                     className="p-2 bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
//                                     title="Supprimer"
//                                   >
//                                     <Trash2 size={16} className="text-white" />
//                                   </button>

//                                   {/* Move Right */}
//                                   {imgIndex < color.images.length - 1 && (
//                                     <button
//                                       type="button"
//                                       onClick={() => {
//                                         const newColors = [...colors];
//                                         const images = [...newColors[colorIndex].images];
//                                         [images[imgIndex], images[imgIndex + 1]] = [images[imgIndex + 1], images[imgIndex]];
//                                         newColors[colorIndex].images = images;
//                                         setColors(newColors);
//                                       }}
//                                       className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
//                                       title="Déplacer à droite"
//                                     >
//                                       <ChevronRight size={16} className="text-gray-700" />
//                                     </button>
//                                   )}
//                                 </div>

//                                 {/* Drag Handle Indicator */}
//                                 <div className="absolute bottom-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
//                                   <div className="flex gap-1">
//                                     <div className="w-1 h-1 rounded-full bg-white"></div>
//                                     <div className="w-1 h-1 rounded-full bg-white"></div>
//                                     <div className="w-1 h-1 rounded-full bg-white"></div>
//                                   </div>
//                                 </div>
//                               </div>
//                             ))}
//                           </div>
//                         )}

//                         {/* Upload Area */}
//                         <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#800080] transition-colors cursor-pointer bg-gray-50">
//                           <input
//                             type="file"
//                             multiple
//                             accept="image/*"
//                             onChange={(e) => {
//                               const files = Array.from(e.target.files);
//                               // Simuler l'ajout d'images (dans une vraie app, uploadez vers un serveur)
//                               const newImages = files.map((file, idx) => ({
//                                 url: URL.createObjectURL(file),
//                                 file: file,
//                                 name: file.name
//                               }));
                              
//                               const newColors = [...colors];
//                               newColors[colorIndex].images = [...(newColors[colorIndex].images || []), ...newImages];
//                               setColors(newColors);
//                               e.target.value = ''; // Reset input
//                             }}
//                             className="hidden"
//                             id={`upload-${colorIndex}`}
//                           />
//                           <label htmlFor={`upload-${colorIndex}`} className="cursor-pointer">
//                             <Upload className="mx-auto mb-2 text-gray-400" size={32} />
//                             <p className="text-sm text-gray-600 font-medium">
//                               Glissez des images ici ou cliquez pour parcourir
//                             </p>
//                             <p className="text-xs text-gray-500 mt-2">
//                               PNG, JPG, WEBP jusqu'à 10MB • Plusieurs fichiers acceptés
//                             </p>
//                             {color.images && color.images.length > 0 && (
//                               <p className="text-xs text-[#800080] font-semibold mt-2">
//                                 + Ajouter d'autres images
//                               </p>
//                             )}
//                           </label>
//                         </div>

//                         {/* Order Instructions */}
//                         {color.images && color.images.length > 1 && (
//                           <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
//                             <div className="flex gap-2 text-sm text-blue-800">
//                               <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
//                               <div>
//                                 <p className="font-semibold mb-1">Gestion de l'ordre des images</p>
//                                 <ul className="text-xs space-y-1">
//                                   <li>• <strong>Glissez-déposez</strong> les images pour les réorganiser</li>
//                                   <li>• Utilisez les <strong>flèches</strong> pour déplacer une image</li>
//                                   <li>• Cliquez sur <Check size={12} className="inline" /> pour définir comme <strong>image principale</strong></li>
//                                   <li>• La <strong>première image</strong> sera affichée par défaut</li>
//                                 </ul>
//                               </div>
//                             </div>
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   ))}

//                   {colors.length === 0 && (
//                     <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
//                       <ImageIcon size={48} className="mx-auto mb-2 text-gray-400" />
//                       <p className="font-semibold">Aucune couleur ajoutée</p>
//                       <p className="text-sm">Ajoutez au moins une couleur pour continuer</p>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             )}

//             {/* Step 3: Variants */}
//             {step === 3 && (
//               <div className="space-y-6">
//                 <h3 className="text-lg font-bold text-gray-900">Variantes de stockage</h3>

//                 {/* Add Variant */}
//                 <div className="bg-gray-50 rounded-lg p-4">
//                   <label className="block text-sm font-semibold text-gray-700 mb-2">
//                     Ajouter une variante
//                   </label>
//                   <div className="flex gap-2">
//                     <input
//                       type="text"
//                       value={newVariant}
//                       onChange={(e) => setNewVariant(e.target.value)}
//                       onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addVariant())}
//                       className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
//                       placeholder="Ex: 128GB, 256GB, 512GB, 1TB..."
//                     />
//                     <button
//                       type="button"
//                       onClick={addVariant}
//                       className="px-4 py-2 bg-[#800080] text-white rounded-lg hover:bg-[#6b006b] flex items-center gap-2"
//                     >
//                       <Plus size={18} />
//                       Ajouter
//                     </button>
//                   </div>
//                 </div>

//                 {/* Variants List */}
//                 <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
//                   {variants.map((variant, index) => (
//                     <div
//                       key={index}
//                       className="flex items-center justify-between bg-white border-2 border-gray-200 rounded-lg p-3 group hover:border-[#800080] transition-colors"
//                     >
//                       <span className="font-semibold text-gray-900">{variant}</span>
//                       <button
//                         type="button"
//                         onClick={() => removeVariant(variant)}
//                         className="opacity-0 group-hover:opacity-100 p-1 text-red-600 hover:bg-red-50 rounded transition-opacity"
//                       >
//                         <X size={16} />
//                       </button>
//                     </div>
//                   ))}
//                 </div>

//                 {variants.length === 0 && (
//                   <div className="text-center py-8 text-gray-500">
//                     <Package2 size={48} className="mx-auto mb-2 text-gray-400" />
//                     <p>Aucune variante ajoutée</p>
//                     <p className="text-sm">Ajoutez au moins une variante de stockage</p>
//                   </div>
//                 )}
//               </div>
//             )}

//             {/* Step 4: Specifications */}
//             {step === 4 && (
//               <div className="space-y-6">
//                 <div className="flex items-center justify-between">
//                   <h3 className="text-lg font-bold text-gray-900">Spécifications techniques</h3>
//                   <button
//                     type="button"
//                     onClick={addSpec}
//                     className="text-sm text-[#800080] hover:text-[#6b006b] font-medium flex items-center gap-1"
//                   >
//                     <Plus size={16} />
//                     Ajouter une spécification
//                   </button>
//                 </div>

//                 <div className="space-y-3">
//                   {specs.map((spec, index) => (
//                     <div key={index} className="flex gap-3 items-center">
//                       <input
//                         type="text"
//                         placeholder="Nom (ex: Écran, Processeur...)"
//                         value={spec.key}
//                         onChange={(e) => updateSpec(index, 'key', e.target.value)}
//                         className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
//                       />
//                       <input
//                         type="text"
//                         placeholder="Valeur (ex: 6.7 pouces, Apple A17 Pro...)"
//                         value={spec.value}
//                         onChange={(e) => updateSpec(index, 'value', e.target.value)}
//                         className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
//                       />
//                       <button 
//                         type="button"
//                         onClick={() => removeSpec(index)}
//                         className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
//                       >
//                         <Trash2 size={18} />
//                       </button>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {/* Navigation Buttons */}
//             <div className="flex justify-between pt-8 mt-8 border-t border-gray-200">
//               <button
//                 type="button"
//                 onClick={prevStep}
//                 disabled={step === 1}
//                 className={`px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold transition-colors ${
//                   step === 1 
//                     ? 'text-gray-400 cursor-not-allowed' 
//                     : 'text-gray-700 hover:bg-gray-50'
//                 }`}
//               >
//                 ← Précédent
//               </button>

//               {step < 4 ? (
//                 <button
//                   type="button"
//                   onClick={nextStep}
//                   disabled={!canProceed()}
//                   className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
//                     canProceed()
//                       ? 'bg-[#800080] text-white hover:bg-[#6b006b]'
//                       : 'bg-gray-300 text-gray-500 cursor-not-allowed'
//                   }`}
//                 >
//                   Suivant →
//                 </button>
//               ) : (
//                 <button
//                   type="submit"
//                   disabled={!canProceed()}
//                   className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors ${
//                     canProceed()
//                       ? 'bg-gradient-to-r from-[#800080] to-[#9333ea] text-white hover:from-[#6b006b] hover:to-[#7e22ce]'
//                       : 'bg-gray-300 text-gray-500 cursor-not-allowed'
//                   }`}
//                 >
//                   <Check size={20} />
//                   Créer le modèle
//                 </button>
//               )}
//             </div>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// };

// // Product Details Modal - Shows complete info for transfer or sale -ok
// const ProductDetailsModal = ({ isOpen, onClose, product }) => {
//   if (!isOpen || !product) return null;

//   const statusConfig = {
//     in_stock: { label: 'En stock', color: 'bg-green-100 text-green-700', icon: Check },
//     in_transit: { label: 'En transit', color: 'bg-blue-100 text-blue-700', icon: Send },
//     transferred: { label: 'Transféré', color: 'bg-purple-100 text-purple-700', icon: RefreshCw },
//     sold: { label: 'Vendu', color: 'bg-gray-100 text-gray-700', icon: ShoppingBag }
//   };

//   const currentStatus = statusConfig[product.status];
//   const StatusIcon = currentStatus.icon;

//   return (
//     <div className="fixed inset-0 z-[60] overflow-y-auto">
//       <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
//         <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        
//         <div className="relative bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
//           {/* Header */}
//           <div className="sticky top-0 bg-gradient-to-r from-[#800080] to-[#9333ea] px-8 py-6 text-white z-10 rounded-t-2xl">
//             <div className="flex items-start justify-between">
//               <div>
//                 <div className="flex items-center gap-3 mb-2">
//                   <Package2 size={24} />
//                   <h2 className="text-2xl font-bold">Détails du produit</h2>
//                 </div>
//                 <p className="text-purple-100 text-sm">IMEI: {product.imei}</p>
//               </div>
//               <button 
//                 onClick={onClose}
//                 className="p-2 hover:bg-white/20 rounded-lg transition-colors"
//               >
//                 <X size={24} />
//               </button>
//             </div>
//           </div>

//           <div className="p-8 space-y-6">
//             {/* Product Info */}
//             <div className="bg-white rounded-xl border border-gray-200 p-6">
//               <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
//                 <Package size={20} className="text-[#800080]" />
//                 Informations du produit
//               </h3>
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <p className="text-sm text-gray-600 mb-1">Modèle</p>
//                   <p className="font-semibold text-gray-900">{product.modelName}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-gray-600 mb-1">IMEI</p>
//                   <p className="font-mono font-bold text-gray-900">{product.imei}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-gray-600 mb-1">Couleur</p>
//                   <div className="flex items-center gap-2">
//                     <span
//                       className="w-5 h-5 rounded-full border-2 border-gray-300"
//                       style={{ backgroundColor: product.colorHex }}
//                     />
//                     <span className="font-semibold text-gray-900">{product.color}</span>
//                   </div>
//                 </div>
//                 <div>
//                   <p className="text-sm text-gray-600 mb-1">Stockage</p>
//                   <p className="font-semibold text-gray-900">{product.storage}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-gray-600 mb-1">Prix</p>
//                   <div className="flex items-baseline gap-2">
//                     <span className="font-bold text-[#800080] text-lg">{product.price.toLocaleString()} €</span>
//                     {product.oldPrice && (
//                       <span className="text-sm text-gray-400 line-through">{product.oldPrice.toLocaleString()} €</span>
//                     )}
//                   </div>
//                 </div>
//                 <div>
//                   <p className="text-sm text-gray-600 mb-1">État</p>
//                   <p className="font-semibold text-gray-900 capitalize">{product.condition === 'new' ? 'Neuf' : product.condition}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-gray-600 mb-1">Boutique actuelle</p>
//                   <p className="font-semibold text-gray-900">{product.storeName}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-gray-600 mb-1">Statut</p>
//                   <span className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${currentStatus.color}`}>
//                     <StatusIcon size={14} />
//                     {currentStatus.label}
//                   </span>
//                 </div>
//               </div>
//             </div>

//             {/* Transfer Information */}
//             {(product.status === 'in_transit' || product.status === 'transferred') && product.transfer && (
//               <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
//                 <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
//                   <Send size={20} className="text-blue-600" />
//                   Informations de transfert
//                 </h3>
                
//                 <div className="space-y-6">
//                   {/* Transfer Status Timeline */}
//                   <div className="relative">
//                     <div className="flex items-center justify-between mb-6">
//                       <div className="flex-1 text-center">
//                         <div className="w-10 h-10 rounded-full bg-green-500 mx-auto mb-2 flex items-center justify-center">
//                           <Check size={20} className="text-white" />
//                         </div>
//                         <p className="text-xs font-semibold text-gray-900">Demandé</p>
//                         <p className="text-xs text-gray-600">{new Date(product.transfer.requestedDate).toLocaleDateString('fr-FR')}</p>
//                       </div>
//                       <div className="flex-1 h-1 bg-green-500"></div>
//                       <div className="flex-1 text-center">
//                         <div className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center ${
//                           product.transfer.status !== 'pending' ? 'bg-green-500' : 'bg-gray-300'
//                         }`}>
//                           <Check size={20} className="text-white" />
//                         </div>
//                         <p className="text-xs font-semibold text-gray-900">Approuvé</p>
//                         {product.transfer.approvedDate && (
//                           <p className="text-xs text-gray-600">{new Date(product.transfer.approvedDate).toLocaleDateString('fr-FR')}</p>
//                         )}
//                       </div>
//                       <div className={`flex-1 h-1 ${product.transfer.status !== 'pending' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
//                       <div className="flex-1 text-center">
//                         <div className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center ${
//                           product.status === 'in_transit' ? 'bg-blue-500 animate-pulse' : 
//                           product.status === 'transferred' ? 'bg-green-500' : 'bg-gray-300'
//                         }`}>
//                           {product.status === 'transferred' ? <Check size={20} className="text-white" /> : <Send size={20} className="text-white" />}
//                         </div>
//                         <p className="text-xs font-semibold text-gray-900">
//                           {product.status === 'transferred' ? 'Reçu' : 'En transit'}
//                         </p>
//                         {product.transfer.receivedDate ? (
//                           <p className="text-xs text-gray-600">{new Date(product.transfer.receivedDate).toLocaleDateString('fr-FR')}</p>
//                         ) : (
//                           <p className="text-xs text-blue-600">ETA: {new Date(product.transfer.estimatedArrival).toLocaleDateString('fr-FR')}</p>
//                         )}
//                       </div>
//                     </div>
//                   </div>

//                   {/* Transfer Details Grid */}
//                   <div className="grid grid-cols-2 gap-6">
//                     {/* From Store */}
//                     <div className="bg-white rounded-lg p-4 border border-blue-200">
//                       <p className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
//                         <Store size={16} className="text-blue-600" />
//                         Boutique d'origine
//                       </p>
//                       <p className="font-bold text-gray-900 mb-1">{product.transfer.fromStoreName}</p>
//                       <div className="mt-3 pt-3 border-t border-gray-200">
//                         <p className="text-xs text-gray-600 mb-1">Expéditeur</p>
//                         <p className="font-semibold text-gray-900 text-sm">{product.transfer.approvedBy.name}</p>
//                         <p className="text-xs text-gray-600">{product.transfer.approvedBy.role}</p>
//                         <p className="text-xs text-gray-600">{product.transfer.approvedBy.email}</p>
//                         <p className="text-xs text-gray-600">{product.transfer.approvedBy.phone}</p>
//                       </div>
//                     </div>

//                     {/* To Store */}
//                     <div className="bg-white rounded-lg p-4 border border-blue-200">
//                       <p className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
//                         <Store size={16} className="text-green-600" />
//                         Boutique de destination
//                       </p>
//                       <p className="font-bold text-gray-900 mb-1">{product.transfer.toStoreName}</p>
//                       <div className="mt-3 pt-3 border-t border-gray-200">
//                         <p className="text-xs text-gray-600 mb-1">Destinataire</p>
//                         <p className="font-semibold text-gray-900 text-sm">{product.transfer.requestedBy.name}</p>
//                         <p className="text-xs text-gray-600">{product.transfer.requestedBy.role}</p>
//                         <p className="text-xs text-gray-600">{product.transfer.requestedBy.email}</p>
//                         <p className="text-xs text-gray-600">{product.transfer.requestedBy.phone}</p>
//                       </div>
//                     </div>
//                   </div>

//                   {/* Tracking Info */}
//                   <div className="bg-white rounded-lg p-4 border border-blue-200">
//                     <p className="text-sm font-semibold text-gray-900 mb-2">Suivi du colis</p>
//                     <div className="flex items-center justify-between">
//                       <div>
//                         <p className="text-xs text-gray-600 mb-1">Numéro de suivi</p>
//                         <p className="font-mono font-bold text-gray-900">{product.transfer.trackingNumber}</p>
//                       </div>
//                       <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
//                         Suivre le colis
//                       </button>
//                     </div>
//                   </div>

//                   {/* Notes */}
//                   {product.transfer.notes && (
//                     <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
//                       <p className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
//                         <AlertCircle size={16} className="text-yellow-600" />
//                         Notes
//                       </p>
//                       <p className="text-sm text-gray-700">{product.transfer.notes}</p>
//                     </div>
//                   )}

//                   {/* Received Confirmation */}
//                   {product.status === 'transferred' && product.transfer.receivedBy && (
//                     <div className="bg-green-50 rounded-lg p-4 border border-green-200">
//                       <p className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
//                         <Check size={16} className="text-green-600" />
//                         Réception confirmée
//                       </p>
//                       <p className="text-sm text-gray-700">
//                         Reçu par <span className="font-semibold">{product.transfer.receivedBy.name}</span> le{' '}
//                         {new Date(product.transfer.receivedDate).toLocaleDateString('fr-FR')} à{' '}
//                         {new Date(product.transfer.receivedDate).toLocaleTimeString('fr-FR')}
//                       </p>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             )}

//             {/* Sale Information */}
//             {product.status === 'sold' && product.sale && (
//               <div className="bg-green-50 rounded-xl border border-green-200 p-6">
//                 <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
//                   <ShoppingBag size={20} className="text-green-600" />
//                   Informations de vente
//                 </h3>

//                 <div className="space-y-6">
//                   {/* Sale Type & Date */}
//                   <div className="grid grid-cols-3 gap-4">
//                     <div className="bg-white rounded-lg p-4 border border-green-200">
//                       <p className="text-xs text-gray-600 mb-1">Type de vente</p>
//                       <div className="flex items-center gap-2">
//                         {product.sale.saleType === 'online' ? (
//                           <Globe size={16} className="text-blue-600" />
//                         ) : (
//                           <Store size={16} className="text-purple-600" />
//                         )}
//                         <p className="font-bold text-gray-900">
//                           {product.sale.saleType === 'online' ? 'En ligne' : 'En boutique'}
//                         </p>
//                       </div>
//                     </div>
//                     <div className="bg-white rounded-lg p-4 border border-green-200">
//                       <p className="text-xs text-gray-600 mb-1">Date de vente</p>
//                       <p className="font-bold text-gray-900">{new Date(product.sale.saleDate).toLocaleDateString('fr-FR')}</p>
//                     </div>
//                     <div className="bg-white rounded-lg p-4 border border-green-200">
//                       <p className="text-xs text-gray-600 mb-1">N° de vente</p>
//                       <p className="font-mono font-bold text-gray-900">{product.sale.id}</p>
//                     </div>
//                   </div>

//                   {/* Customer Information */}
//                   <div className="bg-white rounded-lg p-4 border border-green-200">
//                     <p className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
//                       <User size={16} className="text-green-600" />
//                       Informations client
//                     </p>
//                     <div className="grid grid-cols-2 gap-4">
//                       <div>
//                         <p className="text-xs text-gray-600 mb-1">Nom complet</p>
//                         <p className="font-semibold text-gray-900">
//                           {product.sale.customer.firstName} {product.sale.customer.lastName}
//                         </p>
//                       </div>
//                       <div>
//                         <p className="text-xs text-gray-600 mb-1">Email</p>
//                         <p className="font-semibold text-gray-900">{product.sale.customer.email}</p>
//                       </div>
//                       <div>
//                         <p className="text-xs text-gray-600 mb-1">Téléphone</p>
//                         <p className="font-semibold text-gray-900">{product.sale.customer.phone}</p>
//                       </div>
//                       <div>
//                         <p className="text-xs text-gray-600 mb-1">Adresse</p>
//                         <p className="font-semibold text-gray-900 text-sm">{product.sale.customer.address}</p>
//                       </div>
//                       {product.sale.customer.loyaltyCard && (
//                         <div>
//                           <p className="text-xs text-gray-600 mb-1">Carte de fidélité</p>
//                           <p className="font-mono font-semibold text-[#800080]">{product.sale.customer.loyaltyCard}</p>
//                         </div>
//                       )}
//                       {product.sale.customer.deliveryAddress && (
//                         <div>
//                           <p className="text-xs text-gray-600 mb-1">Adresse de livraison</p>
//                           <p className="font-semibold text-gray-900 text-sm">{product.sale.customer.deliveryAddress}</p>
//                         </div>
//                       )}
//                     </div>
//                   </div>

//                   {/* Payment Information */}
//                   <div className="grid grid-cols-2 gap-4">
//                     <div className="bg-white rounded-lg p-4 border border-green-200">
//                       <p className="text-sm font-semibold text-gray-900 mb-3">Détails du paiement</p>
//                       <div className="space-y-2">
//                         <div className="flex justify-between">
//                           <span className="text-sm text-gray-600">Prix produit</span>
//                           <span className="font-semibold text-gray-900">{product.price.toLocaleString()} €</span>
//                         </div>
//                         {product.sale.discount > 0 && (
//                           <div className="flex justify-between">
//                             <span className="text-sm text-gray-600">Remise</span>
//                             <span className="font-semibold text-red-600">-{product.sale.discount} €</span>
//                           </div>
//                         )}
//                         {product.sale.warranty && product.sale.warranty.cost > 0 && (
//                           <div className="flex justify-between">
//                             <span className="text-sm text-gray-600">Garantie ({product.sale.warranty.duration})</span>
//                             <span className="font-semibold text-gray-900">+{product.sale.warranty.cost} €</span>
//                           </div>
//                         )}
//                         {product.sale.accessories && product.sale.accessories.length > 0 && (
//                           <>
//                             {product.sale.accessories.map((acc, idx) => (
//                               <div key={idx} className="flex justify-between">
//                                 <span className="text-sm text-gray-600">{acc.name}</span>
//                                 <span className="font-semibold text-gray-900">+{acc.price} €</span>
//                               </div>
//                             ))}
//                           </>
//                         )}
//                         <div className="border-t border-gray-300 pt-2 mt-2">
//                           <div className="flex justify-between">
//                             <span className="text-sm font-bold text-gray-900">Total</span>
//                             <span className="text-lg font-bold text-green-600">
//                               {(
//                                 product.sale.finalPrice + 
//                                 (product.sale.warranty?.cost || 0) + 
//                                 (product.sale.accessories?.reduce((sum, acc) => sum + acc.price, 0) || 0)
//                               ).toLocaleString()} €
//                             </span>
//                           </div>
//                         </div>
//                       </div>
//                     </div>

//                     <div className="bg-white rounded-lg p-4 border border-green-200">
//                       <p className="text-sm font-semibold text-gray-900 mb-3">Méthode de paiement</p>
//                       <div className="space-y-3">
//                         <div>
//                           <p className="text-xs text-gray-600 mb-1">Type</p>
//                           <p className="font-semibold text-gray-900 capitalize">
//                             {product.sale.paymentMethod === 'card' ? 'Carte bancaire' :
//                              product.sale.paymentMethod === 'cash' ? 'Espèces' :
//                              product.sale.paymentMethod === 'transfer' ? 'Virement' : 'Financement'}
//                           </p>
//                         </div>
//                         {product.sale.warranty && (
//                           <div>
//                             <p className="text-xs text-gray-600 mb-1">Garantie</p>
//                             <p className="font-semibold text-gray-900">
//                               {product.sale.warranty.type === 'extended' ? 'Garantie étendue' : 'Garantie standard'}
//                               {' '}({product.sale.warranty.duration})
//                             </p>
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   </div>

//                   {/* Seller Information (In-Store Sales) */}
//                   {product.sale.saleType === 'in_store' && product.sale.soldBy && (
//                     <div className="bg-white rounded-lg p-4 border border-green-200">
//                       <p className="text-sm font-semibold text-gray-900 mb-2">Vendu par</p>
//                       <div className="flex items-center gap-3">
//                         <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#800080] to-[#9333ea] flex items-center justify-center text-white font-bold">
//                           {product.sale.soldBy.name.charAt(0)}
//                         </div>
//                         <div>
//                           <p className="font-semibold text-gray-900">{product.sale.soldBy.name}</p>
//                           <p className="text-xs text-gray-600">ID: {product.sale.soldBy.employeeId}</p>
//                         </div>
//                       </div>
//                     </div>
//                   )}

//                   {/* Delivery Information (Online Sales) */}
//                   {product.sale.saleType === 'online' && product.sale.deliveryMethod && (
//                     <div className="bg-white rounded-lg p-4 border border-green-200">
//                       <p className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
//                         <Send size={16} className="text-green-600" />
//                         Informations de livraison
//                       </p>
//                       <div className="grid grid-cols-3 gap-4">
//                         <div>
//                           <p className="text-xs text-gray-600 mb-1">Méthode</p>
//                           <p className="font-semibold text-gray-900">
//                             {product.sale.deliveryMethod === 'home_delivery' ? 'Livraison à domicile' :
//                              product.sale.deliveryMethod === 'pickup' ? 'Retrait en boutique' : 'Livraison express'}
//                           </p>
//                         </div>
//                         <div>
//                           <p className="text-xs text-gray-600 mb-1">Statut</p>
//                           <span className={`px-2 py-1 rounded-full text-xs font-medium ${
//                             product.sale.deliveryStatus === 'delivered' ? 'bg-green-100 text-green-700' :
//                             product.sale.deliveryStatus === 'in_transit' ? 'bg-blue-100 text-blue-700' :
//                             'bg-yellow-100 text-yellow-700'
//                           }`}>
//                             {product.sale.deliveryStatus === 'delivered' ? 'Livré' :
//                              product.sale.deliveryStatus === 'in_transit' ? 'En transit' : 'En attente'}
//                           </span>
//                         </div>
//                         <div>
//                           <p className="text-xs text-gray-600 mb-1">Date de livraison</p>
//                           <p className="font-semibold text-gray-900">
//                             {product.sale.deliveryDate ? new Date(product.sale.deliveryDate).toLocaleDateString('fr-FR') : 'N/A'}
//                           </p>
//                         </div>
//                       </div>
//                       {product.sale.trackingNumber && (
//                         <div className="mt-3 pt-3 border-t border-gray-200">
//                           <div className="flex items-center justify-between">
//                             <div>
//                               <p className="text-xs text-gray-600 mb-1">Numéro de suivi</p>
//                               <p className="font-mono font-bold text-gray-900">{product.sale.trackingNumber}</p>
//                             </div>
//                             <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700">
//                               Suivre le colis
//                             </button>
//                           </div>
//                         </div>
//                       )}
//                     </div>
//                   )}

//                   {/* Accessories */}
//                   {product.sale.accessories && product.sale.accessories.length > 0 && (
//                     <div className="bg-white rounded-lg p-4 border border-green-200">
//                       <p className="text-sm font-semibold text-gray-900 mb-3">Accessoires vendus</p>
//                       <div className="space-y-2">
//                         {product.sale.accessories.map((acc, idx) => (
//                           <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
//                             <span className="text-sm text-gray-700">{acc.name}</span>
//                             <span className="font-semibold text-gray-900">{acc.price} €</span>
//                           </div>
//                         ))}
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             )}

//             {/* Action Buttons */}
//             <div className="flex gap-3 pt-4 border-t border-gray-200">
//               <button
//                 onClick={onClose}
//                 className="flex-1 py-3 px-6 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
//               >
//                 Fermer
//               </button>
//               {product.status === 'in_stock' && (
//                 <button className="flex-1 py-3 px-6 bg-[#800080] text-white rounded-lg font-semibold hover:bg-[#6b006b] flex items-center justify-center gap-2">
//                   <Send size={20} />
//                   Initier un transfert
//                 </button>
//               )}
//               {product.status === 'in_transit' && (
//                 <button className="flex-1 py-3 px-6 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 flex items-center justify-center gap-2">
//                   <Check size={20} />
//                   Confirmer la réception
//                 </button>
//               )}
//               <button className="py-3 px-6 border-2 border-[#800080] text-[#800080] rounded-lg font-semibold hover:bg-[#f3e8ff] flex items-center justify-center gap-2">
//                 <Download size={20} />
//                 Télécharger PDF
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// // Order Details Modal
// const OrderDetailsModal = ({ isOpen, onClose, order }) => {
//   if (!isOpen || !order) return null;

//   const getStatusColor = (status) => {
//     const colors = {
//       pending: 'bg-yellow-100 text-yellow-700',
//       processing: 'bg-blue-100 text-blue-700',
//       shipped: 'bg-purple-100 text-purple-700',
//       delivered: 'bg-green-100 text-green-700',
//       cancelled: 'bg-red-100 text-red-700'
//     };
//     return colors[status] || colors.pending;
//   };

//   const getStatusLabel = (status) => {
//     const labels = {
//       pending: 'En attente',
//       processing: 'En traitement',
//       shipped: 'Expédiée',
//       delivered: 'Livrée',
//       cancelled: 'Annulée'
//     };
//     return labels[status] || status;
//   };

//   return (
//     <div className="fixed inset-0 z-[60] overflow-y-auto">
//       <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
//         <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        
//         <div className="relative bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
//           {/* Header */}
//           <div className="sticky top-0 bg-gradient-to-r from-[#800080] to-[#9333ea] px-8 py-6 text-white z-10 rounded-t-2xl">
//             <div className="flex items-start justify-between">
//               <div>
//                 <div className="flex items-center gap-3 mb-2">
//                   <ShoppingCart size={24} />
//                   <h2 className="text-2xl font-bold">Détails de la commande</h2>
//                 </div>
//                 <p className="text-purple-100 text-sm">Commande N° {order.id}</p>
//               </div>
//               <button 
//                 onClick={onClose}
//                 className="p-2 hover:bg-white/20 rounded-lg transition-colors"
//               >
//                 <X size={24} />
//               </button>
//             </div>
//           </div>

//           <div className="p-8 space-y-6">
//             {/* Order Status & Info */}
//             <div className="grid grid-cols-2 gap-4">
//               <div className="bg-white rounded-xl border border-gray-200 p-4">
//                 <p className="text-sm text-gray-600 mb-2">Statut de la commande</p>
//                 <span className={`px-4 py-2 rounded-full text-sm font-bold inline-block ${getStatusColor(order.status)}`}>
//                   {getStatusLabel(order.status)}
//                 </span>
//               </div>
//               <div className="bg-white rounded-xl border border-gray-200 p-4">
//                 <p className="text-sm text-gray-600 mb-2">Type de commande</p>
//                 <div className="flex items-center gap-2">
//                   {order.type === 'online' ? (
//                     <Globe size={20} className="text-blue-600" />
//                   ) : (
//                     <Store size={20} className="text-purple-600" />
//                   )}
//                   <span className="font-bold text-gray-900">
//                     {order.type === 'online' ? 'Commande en ligne' : 'Vente en boutique'}
//                   </span>
//                 </div>
//               </div>
//             </div>

//             {/* Customer Information */}
//             <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
//               <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
//                 <User size={20} className="text-blue-600" />
//                 Informations client
//               </h3>
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <p className="text-sm text-gray-600 mb-1">Nom complet</p>
//                   <p className="font-semibold text-gray-900">{order.customer}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-gray-600 mb-1">Email</p>
//                   <p className="font-semibold text-gray-900">{order.email}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-gray-600 mb-1">Téléphone</p>
//                   <p className="font-semibold text-gray-900">+33 6 12 34 56 78</p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-gray-600 mb-1">Boutique</p>
//                   <p className="font-semibold text-gray-900">{order.store}</p>
//                 </div>
//               </div>
//             </div>

//             {/* Order Items */}
//             <div className="bg-white rounded-xl border border-gray-200 p-6">
//               <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
//                 <Package size={20} className="text-[#800080]" />
//                 Articles commandés ({order.items})
//               </h3>
//               <div className="space-y-3">
//                 {/* Mock items - remplacez par les vraies données */}
//                 <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
//                   <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
//                   <div className="flex-1">
//                     <p className="font-semibold text-gray-900">iPhone 15 Pro Max</p>
//                     <p className="text-sm text-gray-600">256GB - Titane Noir</p>
//                   </div>
//                   <div className="text-right">
//                     <p className="font-bold text-gray-900">1 299 €</p>
//                     <p className="text-sm text-gray-600">Qté: 1</p>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Payment Summary */}
//             <div className="bg-green-50 rounded-xl border border-green-200 p-6">
//               <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
//                 <DollarSign size={20} className="text-green-600" />
//                 Résumé du paiement
//               </h3>
//               <div className="space-y-2">
//                 <div className="flex justify-between">
//                   <span className="text-gray-700">Sous-total</span>
//                   <span className="font-semibold text-gray-900">{order.total} {order.currency}</span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-gray-700">Livraison</span>
//                   <span className="font-semibold text-gray-900">0 {order.currency}</span>
//                 </div>
//                 <div className="border-t border-green-300 pt-2 mt-2">
//                   <div className="flex justify-between">
//                     <span className="text-lg font-bold text-gray-900">Total</span>
//                     <span className="text-2xl font-bold text-green-600">{order.total} {order.currency}</span>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Timeline */}
//             <div className="bg-white rounded-xl border border-gray-200 p-6">
//               <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
//                 <Clock size={20} className="text-gray-600" />
//                 Historique de la commande
//               </h3>
//               <div className="space-y-4">
//                 <div className="flex gap-4">
//                   <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
//                     <Check size={16} className="text-white" />
//                   </div>
//                   <div className="flex-1">
//                     <p className="font-semibold text-gray-900">Commande passée</p>
//                     <p className="text-sm text-gray-600">{new Date(order.date).toLocaleDateString('fr-FR', { 
//                       day: 'numeric', 
//                       month: 'long', 
//                       year: 'numeric',
//                       hour: '2-digit',
//                       minute: '2-digit'
//                     })}</p>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Action Buttons */}
//             <div className="flex gap-3 pt-4 border-t border-gray-200">
//               <button
//                 onClick={onClose}
//                 className="flex-1 py-3 px-6 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
//               >
//                 Fermer
//               </button>
//               <button className="flex-1 py-3 px-6 bg-[#800080] text-white rounded-lg font-semibold hover:bg-[#6b006b] flex items-center justify-center gap-2">
//                 <Edit size={20} />
//                 Modifier la commande
//               </button>
//               <button className="py-3 px-6 border-2 border-[#800080] text-[#800080] rounded-lg font-semibold hover:bg-[#f3e8ff] flex items-center justify-center gap-2">
//                 <Download size={20} />
//                 Facture PDF
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };


// Model Details Modal - Shows individual products with IMEI


// // Model Details Modal - Updated with Transfer System
// const ModelDetailsModal = ({ isOpen, onClose, model }) => {
//   const [activeTab, setActiveTab] = useState('products');
//   const [selectedColor, setSelectedColor] = useState(null);
//   const [selectedStorage, setSelectedStorage] = useState('all');
//   const [selectedStore, setSelectedStore] = useState('all');
//   const [selectedStatus, setSelectedStatus] = useState('all');
//   const [searchIMEI, setSearchIMEI] = useState('');
//   const [currentImageIndex, setCurrentImageIndex] = useState(0);
//   const [selectedProduct, setSelectedProduct] = useState(null);
//   const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

//   React.useEffect(() => {
//     if (model && model.colors && model.colors.length > 0) {
//       setSelectedColor(model.colors[0]);
//       setCurrentImageIndex(0);
//     }
//   }, [model]);

//   if (!isOpen || !model) return null;

//   // Get all products for this model
//   const modelProducts = MOCK_PRODUCTS.filter(p => p.modelId === model.id);

//   // Filter products
//   const filteredProducts = modelProducts.filter(product => {
//     if (searchIMEI && !product.imei.includes(searchIMEI)) return false;
//     if (selectedColor && product.color !== selectedColor.name) return false;
//     if (selectedStorage !== 'all' && product.storage !== selectedStorage) return false;
//     if (selectedStore !== 'all' && product.storeId !== parseInt(selectedStore)) return false;
//     if (selectedStatus !== 'all' && product.status !== selectedStatus) return false;
//     return true;
//   });

//   // Group products by store
//   const productsByStore = MOCK_STORES.map(store => ({
//     ...store,
//     products: filteredProducts.filter(p => p.storeId === store.id),
//     inStockCount: filteredProducts.filter(p => p.storeId === store.id && p.status === 'in_stock').length,
//     inTransitCount: filteredProducts.filter(p => p.storeId === store.id && p.status === 'in_transit').length,
//     transferredCount: filteredProducts.filter(p => p.storeId === store.id && p.status === 'transferred').length,
//     soldCount: filteredProducts.filter(p => p.storeId === store.id && p.status === 'sold').length
//   }));

//   // Group products by color
//   const productsByColor = model.colors.map(color => ({
//     ...color,
//     count: modelProducts.filter(p => p.color === color.name).length,
//     available: modelProducts.filter(p => p.color === color.name && p.status === 'in_stock').length
//   }));

//   const tabs = [
//     { id: 'products', label: 'Produits', icon: Package, count: filteredProducts.length },
//     { id: 'overview', label: 'Vue d\'ensemble', icon: LayoutDashboard },
//     { id: 'specs', label: 'Spécifications', icon: Settings },
//     { id: 'gallery', label: 'Galerie', icon: ImageIcon }
//   ];

//   const getStatusBadge = (status) => {
//     const config = {
//       in_stock: { label: 'En stock', color: 'bg-green-100 text-green-700', icon: Check },
//       in_transit: { label: 'En transit', color: 'bg-blue-100 text-blue-700', icon: Send },
//       transferred: { label: 'Transféré', color: 'bg-purple-100 text-purple-700', icon: RefreshCw },
//       sold: { label: 'Vendu', color: 'bg-gray-100 text-gray-700', icon: ShoppingBag }
//     };
//     return config[status] || config.in_stock;
//   };

//   const getConditionBadge = (condition) => {
//     const config = {
//       new: { label: 'Neuf', color: 'bg-green-100 text-green-700' },
//       'like-new': { label: 'Comme neuf', color: 'bg-blue-100 text-blue-700' },
//       refurbished: { label: 'Reconditionné', color: 'bg-orange-100 text-orange-700' }
//     };
//     return config[condition] || config.new;
//   };

//   const handleViewProductDetails = (product) => {
//     setSelectedProduct(product);
//     setIsDetailsModalOpen(true);
//   };

//   return (
//     <>
//       <div className="fixed inset-0 z-50 overflow-y-auto">
//         <div className="flex items-start justify-center min-h-screen px-4 pt-4 pb-20">
//           <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
          
//           <div className="relative bg-white rounded-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden shadow-2xl my-8">
//             {/* Header */}
//             <div className="bg-gradient-to-r from-[#800080] to-[#9333ea] px-8 py-6 text-white">
//               <div className="flex items-start justify-between mb-4">
//                 <div className="flex items-start gap-4">
//                   <div className="w-20 h-20 rounded-xl bg-white/20 backdrop-blur-sm p-2">
//                     <img
//                       src={selectedColor?.images[0] || model.colors[0].images[0]}
//                       alt={model.name}
//                       className="w-full h-full object-contain"
//                     />
//                   </div>
//                   <div>
//                     <p className="text-purple-100 text-sm mb-1">{model.brand}</p>
//                     <h2 className="text-2xl font-bold mb-2">{model.name}</h2>
//                     <div className="flex items-center gap-4 text-sm">
//                       <div className="flex items-baseline gap-2">
//                         <span className="text-2xl font-bold">{model.basePrice} €</span>
//                         {model.oldPrice && (
//                           <span className="text-purple-200 line-through">{model.oldPrice} €</span>
//                         )}
//                       </div>
//                       <span className="text-purple-100">•</span>
//                       <span className="text-purple-100">{model.colors.length} couleurs</span>
//                       <span className="text-purple-100">•</span>
//                       <span className="text-purple-100">{modelProducts.length} produits</span>
//                     </div>
//                   </div>
//                 </div>
//                 <button 
//                   onClick={onClose}
//                   className="p-2 hover:bg-white/20 rounded-lg transition-colors"
//                 >
//                   <X size={24} />
//                 </button>
//               </div>

//               {/* Quick Stats */}
//               <div className="grid grid-cols-4 gap-4">
//                 <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
//                   <p className="text-purple-100 text-xs mb-1">En stock</p>
//                   <p className="text-xl font-bold">{modelProducts.filter(p => p.status === 'in_stock').length}</p>
//                 </div>
//                 <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
//                   <p className="text-purple-100 text-xs mb-1">En transit</p>
//                   <p className="text-xl font-bold">{modelProducts.filter(p => p.status === 'in_transit').length}</p>
//                 </div>
//                 <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
//                   <p className="text-purple-100 text-xs mb-1">Transféré</p>
//                   <p className="text-xl font-bold">{modelProducts.filter(p => p.status === 'transferred').length}</p>
//                 </div>
//                 <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
//                   <p className="text-purple-100 text-xs mb-1">Vendu</p>
//                   <p className="text-xl font-bold">{modelProducts.filter(p => p.status === 'sold').length}</p>
//                 </div>
//               </div>
//             </div>

//             {/* Tabs Navigation */}
//             <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
//               <div className="px-8">
//                 <div className="flex gap-1">
//                   {tabs.map(tab => {
//                     const Icon = tab.icon;
//                     const isActive = activeTab === tab.id;
//                     return (
//                       <button
//                         key={tab.id}
//                         onClick={() => setActiveTab(tab.id)}
//                         className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors ${
//                           isActive
//                             ? 'border-[#800080] text-[#800080]'
//                             : 'border-transparent text-gray-600 hover:text-gray-900'
//                         }`}
//                       >
//                         <Icon size={18} />
//                         {tab.label}
//                         {tab.count !== undefined && (
//                           <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
//                             isActive ? 'bg-[#800080] text-white' : 'bg-gray-200 text-gray-700'
//                           }`}>
//                             {tab.count}
//                           </span>
//                         )}
//                       </button>
//                     );
//                   })}
//                 </div>
//               </div>
//             </div>

//             {/* Tab Content */}
//             <div className="p-8 overflow-y-auto" style={{ maxHeight: 'calc(95vh - 340px)' }}>
//               {/* Products Tab */}
//               {activeTab === 'products' && (
//                 <div className="space-y-6">
//                   {/* Filters */}
//                   <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
//                     <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
//                       {/* Search IMEI */}
//                       <div className="md:col-span-2">
//                         <label className="block text-sm font-semibold text-gray-700 mb-2">
//                           Rechercher par IMEI
//                         </label>
//                         <div className="relative">
//                           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
//                           <input
//                             type="text"
//                             value={searchIMEI}
//                             onChange={(e) => setSearchIMEI(e.target.value)}
//                             placeholder="Entrez le numéro IMEI..."
//                             className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
//                           />
//                         </div>
//                       </div>

//                       {/* Storage Filter */}
//                       <div>
//                         <label className="block text-sm font-semibold text-gray-700 mb-2">Stockage</label>
//                         <select
//                           value={selectedStorage}
//                           onChange={(e) => setSelectedStorage(e.target.value)}
//                           className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
//                         >
//                           <option value="all">Tous</option>
//                           {model.variants.map(variant => (
//                             <option key={variant} value={variant}>{variant}</option>
//                           ))}
//                         </select>
//                       </div>

//                       {/* Store Filter */}
//                       <div>
//                         <label className="block text-sm font-semibold text-gray-700 mb-2">Boutique</label>
//                         <select
//                           value={selectedStore}
//                           onChange={(e) => setSelectedStore(e.target.value)}
//                           className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
//                         >
//                           <option value="all">Toutes</option>
//                           {MOCK_STORES.map(store => (
//                             <option key={store.id} value={store.id}>{store.city}</option>
//                           ))}
//                         </select>
//                       </div>

//                       {/* Status Filter */}
//                       <div>
//                         <label className="block text-sm font-semibold text-gray-700 mb-2">Statut</label>
//                         <select
//                           value={selectedStatus}
//                           onChange={(e) => setSelectedStatus(e.target.value)}
//                           className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
//                         >
//                           <option value="all">Tous</option>
//                           <option value="in_stock">En stock</option>
//                           <option value="in_transit">En transit</option>
//                           <option value="transferred">Transféré</option>
//                           <option value="sold">Vendu</option>
//                         </select>
//                       </div>
//                     </div>

//                     {/* Color Selector */}
//                     <div className="mt-4 pt-4 border-t border-gray-300">
//                       <label className="block text-sm font-semibold text-gray-700 mb-3">Filtrer par couleur</label>
//                       <div className="flex flex-wrap gap-3">
//                         <button
//                           onClick={() => setSelectedColor(null)}
//                           className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
//                             !selectedColor
//                               ? 'bg-[#800080] text-white ring-2 ring-[#800080] ring-offset-2'
//                               : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-[#800080]'
//                           }`}
//                         >
//                           Toutes les couleurs
//                         </button>
//                         {productsByColor.map(color => (
//                           <button
//                             key={color.name}
//                             onClick={() => setSelectedColor(color)}
//                             className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
//                               selectedColor?.name === color.name
//                                 ? 'bg-[#800080] text-white ring-2 ring-[#800080] ring-offset-2'
//                                 : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-[#800080]'
//                             }`}
//                           >
//                             <span
//                               className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
//                               style={{ backgroundColor: color.hex }}
//                             />
//                             {color.name}
//                             <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
//                               selectedColor?.name === color.name ? 'bg-white text-[#800080]' : 'bg-gray-200 text-gray-700'
//                             }`}>
//                               {color.available}
//                             </span>
//                           </button>
//                         ))}
//                       </div>
//                     </div>
//                   </div>

//                   {/* Products by Store */}
//                   {filteredProducts.length === 0 ? (
//                     <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
//                       <Package size={48} className="mx-auto text-gray-400 mb-4" />
//                       <h3 className="text-lg font-bold text-gray-900 mb-2">Aucun produit trouvé</h3>
//                       <p className="text-gray-600">Essayez de modifier vos filtres</p>
//                     </div>
//                   ) : (
//                     <div className="space-y-6">
//                       {productsByStore.map(store => {
//                         if (store.products.length === 0) return null;
                        
//                         return (
//                           <div key={store.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//                             <div className="bg-gradient-to-r from-[#800080] to-[#9333ea] px-6 py-4 text-white">
//                               <div className="flex items-center justify-between">
//                                 <div className="flex items-center gap-3">
//                                   <Store size={20} />
//                                   <div>
//                                     <h3 className="font-bold text-lg">{store.name}</h3>
//                                     <p className="text-sm text-purple-100">{store.city}, {store.country}</p>
//                                   </div>
//                                 </div>
//                                 <div className="flex items-center gap-4 text-sm">
//                                   <div className="bg-white/20 px-3 py-1 rounded-full">
//                                     <span className="font-semibold">{store.inStockCount}</span> en stock
//                                   </div>
//                                   <div className="bg-white/20 px-3 py-1 rounded-full">
//                                     <span className="font-semibold">{store.inTransitCount}</span> en transit
//                                   </div>
//                                   <div className="bg-white/20 px-3 py-1 rounded-full">
//                                     <span className="font-semibold">{store.transferredCount}</span> transféré
//                                   </div>
//                                   <div className="bg-white/20 px-3 py-1 rounded-full">
//                                     <span className="font-semibold">{store.soldCount}</span> vendu
//                                   </div>
//                                 </div>
//                               </div>
//                             </div>

//                             <div className="overflow-x-auto">
//                               <table className="w-full">
//                                 <thead className="bg-gray-50">
//                                   <tr>
//                                     <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">IMEI</th>
//                                     <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">Couleur</th>
//                                     <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">Stockage</th>
//                                     <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">Prix</th>
//                                     <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">État</th>
//                                     <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">Statut</th>
//                                     <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">Infos</th>
//                                     <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">Actions</th>
//                                   </tr>
//                                 </thead>
//                                 <tbody>
//                                   {store.products.map(product => {
//                                     const statusConfig = getStatusBadge(product.status);
//                                     const conditionConfig = getConditionBadge(product.condition);
//                                     const StatusIcon = statusConfig.icon;
                                    
//                                     return (
//                                       <tr key={product.imei} className="border-t border-gray-100 hover:bg-gray-50">
//                                         <td className="py-3 px-6">
//                                           <div className="flex items-center gap-2">
//                                             <Package2 size={16} className="text-[#800080]" />
//                                             <span className="font-mono text-sm font-semibold text-gray-900">
//                                               {product.imei}
//                                             </span>
//                                           </div>
//                                         </td>
//                                         <td className="py-3 px-6">
//                                           <div className="flex items-center gap-2">
//                                             <span
//                                               className="w-5 h-5 rounded-full border-2 border-gray-300"
//                                               style={{ backgroundColor: product.colorHex }}
//                                             />
//                                             <span className="text-sm text-gray-700">{product.color}</span>
//                                           </div>
//                                         </td>
//                                         <td className="py-3 px-6">
//                                           <span className="text-sm font-semibold text-gray-900">{product.storage}</span>
//                                         </td>
//                                         <td className="py-3 px-6">
//                                           <div className="flex items-baseline gap-2">
//                                             <span className="font-bold text-gray-900">{product.price.toLocaleString()}</span>
//                                             <span className="text-xs text-gray-500">{store.currency}</span>
//                                           </div>
//                                           {product.oldPrice && (
//                                             <span className="text-xs text-gray-400 line-through">{product.oldPrice.toLocaleString()}</span>
//                                           )}
//                                         </td>
//                                         <td className="py-3 px-6">
//                                           <span className={`px-2 py-1 rounded-full text-xs font-medium ${conditionConfig.color}`}>
//                                             {conditionConfig.label}
//                                           </span>
//                                         </td>
//                                         <td className="py-3 px-6">
//                                           <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${statusConfig.color}`}>
//                                             <StatusIcon size={14} />
//                                             {statusConfig.label}
//                                           </span>
//                                         </td>
//                                         <td className="py-3 px-6">
//                                           {product.status === 'in_transit' && (
//                                             <div className="text-xs">
//                                               <p className="text-blue-600 font-semibold flex items-center gap-1">
//                                                 <Send size={12} />
//                                                 Vers {product.transfer.toStoreName}
//                                               </p>
//                                               <p className="text-gray-500">Arrivée: {new Date(product.transfer.estimatedArrival).toLocaleDateString('fr-FR')}</p>
//                                             </div>
//                                           )}
//                                           {product.status === 'transferred' && (
//                                             <div className="text-xs">
//                                               <p className="text-purple-600 font-semibold flex items-center gap-1">
//                                                 <RefreshCw size={12} />
//                                                 De {product.transfer.fromStoreName}
//                                               </p>
//                                               <p className="text-gray-500">Reçu le: {new Date(product.transfer.receivedDate).toLocaleDateString('fr-FR')}</p>
//                                             </div>
//                                           )}
//                                           {product.status === 'sold' && (
//                                             <div className="text-xs">
//                                               <p className="text-gray-600 font-semibold flex items-center gap-1">
//                                                 <ShoppingBag size={12} />
//                                                 {product.sale.saleType === 'online' ? 'En ligne' : 'En boutique'}
//                                               </p>
//                                               <p className="text-gray-500">Client: {product.sale.customer.firstName} {product.sale.customer.lastName}</p>
//                                             </div>
//                                           )}
//                                           {product.status === 'in_stock' && (
//                                             <div className="text-xs">
//                                               <p className="text-green-600 font-semibold">Disponible</p>
//                                               <p className="text-gray-500">Ajouté le: {new Date(product.addedDate).toLocaleDateString('fr-FR')}</p>
//                                             </div>
//                                           )}
//                                         </td>
//                                         <td className="py-3 px-6">
//                                           <div className="flex gap-2">
//                                             <button 
//                                               onClick={() => handleViewProductDetails(product)}
//                                               className="p-2 hover:bg-blue-100 rounded-lg" 
//                                               title="Voir détails complets"
//                                             >
//                                               <Eye size={16} className="text-blue-600" />
//                                             </button>
//                                             <button className="p-2 hover:bg-gray-100 rounded-lg" title="Modifier">
//                                               <Edit size={16} className="text-gray-600" />
//                                             </button>
//                                             {product.status === 'in_stock' && (
//                                               <button className="p-2 hover:bg-purple-100 rounded-lg" title="Initier transfert">
//                                                 <Send size={16} className="text-purple-600" />
//                                               </button>
//                                             )}
//                                           </div>
//                                         </td>
//                                       </tr>
//                                     );
//                                   })}
//                                 </tbody>
//                               </table>
//                             </div>
//                           </div>
//                         );
//                       })}
//                     </div>
//                   )}
//                 </div>
//               )}

//               {/* Overview Tab - Same as before */}
//               {activeTab === 'overview' && (
//                 <div className="space-y-6">
//                   <div className="bg-white rounded-xl p-6 border border-gray-200">
//                     <h3 className="text-lg font-bold text-gray-900 mb-4">Description</h3>
//                     <p className="text-gray-700">{model.description}</p>
//                   </div>

//                   {/* Stock by Color */}
//                   <div className="bg-white rounded-xl p-6 border border-gray-200">
//                     <h3 className="text-lg font-bold text-gray-900 mb-4">Stock par couleur</h3>
//                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//                       {productsByColor.map(color => (
//                         <div key={color.name} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
//                           <div className="flex items-center gap-2 mb-2">
//                             <span
//                               className="w-6 h-6 rounded-full border-2 border-gray-300"
//                               style={{ backgroundColor: color.hex }}
//                             />
//                             <span className="font-semibold text-gray-900 text-sm">{color.name}</span>
//                           </div>
//                           <div className="flex items-baseline gap-2">
//                             <span className="text-2xl font-bold text-[#800080]">{color.available}</span>
//                             <span className="text-sm text-gray-500">/ {color.count}</span>
//                           </div>
//                           <p className="text-xs text-gray-600 mt-1">en stock</p>
//                         </div>
//                       ))}
//                     </div>
//                   </div>

//                   {/* Stock by Store */}
//                   <div className="bg-white rounded-xl p-6 border border-gray-200">
//                     <h3 className="text-lg font-bold text-gray-900 mb-4">Stock par boutique</h3>
//                     <div className="space-y-3">
//                       {productsByStore.map(store => (
//                         <div key={store.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
//                           <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#800080] to-[#9333ea] flex items-center justify-center">
//                             <Store size={20} className="text-white" />
//                           </div>
//                           <div className="flex-1">
//                             <p className="font-semibold text-gray-900">{store.name}</p>
//                             <p className="text-sm text-gray-500">{store.city}, {store.country}</p>
//                           </div>
//                           <div className="grid grid-cols-4 gap-4 text-center">
//                             <div>
//                               <p className="text-lg font-bold text-green-600">{store.inStockCount}</p>
//                               <p className="text-xs text-gray-600">Stock</p>
//                             </div>
//                             <div>
//                               <p className="text-lg font-bold text-blue-600">{store.inTransitCount}</p>
//                               <p className="text-xs text-gray-600">Transit</p>
//                             </div>
//                             <div>
//                               <p className="text-lg font-bold text-purple-600">{store.transferredCount}</p>
//                               <p className="text-xs text-gray-600">Transféré</p>
//                             </div>
//                             <div>
//                               <p className="text-lg font-bold text-gray-600">{store.soldCount}</p>
//                               <p className="text-xs text-gray-600">Vendu</p>
//                             </div>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {/* Specs Tab - Same as before */}
//               {activeTab === 'specs' && (
//                 <div className="bg-white rounded-xl border border-gray-200">
//                   <div className="p-6">
//                     <h3 className="text-lg font-bold text-gray-900 mb-4">Spécifications techniques</h3>
//                     <div className="space-y-3">
//                       {Object.entries(model.specs).map(([key, value]) => (
//                         <div key={key} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-0">
//                           <span className="font-semibold text-gray-700">{key}</span>
//                           <span className="text-gray-900">{value}</span>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {/* Gallery Tab - Same as before */}
//               {activeTab === 'gallery' && (
//                 <div className="space-y-6">
//                   <div>
//                     <h3 className="text-lg font-bold text-gray-900 mb-4">Sélectionnez une couleur</h3>
//                     <div className="flex flex-wrap gap-3">
//                       {model.colors.map(color => (
//                         <button
//                           key={color.name}
//                           onClick={() => {
//                             setSelectedColor(color);
//                             setCurrentImageIndex(0);
//                           }}
//                           className={`px-4 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
//                             selectedColor?.name === color.name
//                               ? 'bg-[#800080] text-white ring-2 ring-[#800080] ring-offset-2'
//                               : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-[#800080]'
//                           }`}
//                         >
//                           <span
//                             className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
//                             style={{ backgroundColor: color.hex }}
//                           />
//                           {color.name}
//                         </button>
//                       ))}
//                     </div>
//                   </div>

//                   {selectedColor && (
//                     <>
//                       <div className="bg-gradient-to-br from-gray-50 to-[#f3e8ff] rounded-xl p-8 aspect-video flex items-center justify-center">
//                         <img
//                           src={selectedColor.images[currentImageIndex]}
//                           alt={`${model.name} - ${selectedColor.name}`}
//                           className="max-h-full max-w-full object-contain"
//                         />
//                       </div>

//                       <div className="grid grid-cols-6 gap-4">
//                         {selectedColor.images.map((image, index) => (
//                           <button
//                             key={index}
//                             onClick={() => setCurrentImageIndex(index)}
//                             className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
//                               currentImageIndex === index
//                                 ? 'border-[#800080] ring-2 ring-[#800080] ring-offset-2'
//                                 : 'border-gray-300 hover:border-[#800080]'
//                             }`}
//                           >
//                             <img
//                               src={image}
//                               alt={`Thumbnail ${index + 1}`}
//                               className="w-full h-full object-cover"
//                             />
//                           </button>
//                         ))}
//                       </div>
//                     </>
//                   )}
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Product Details Modal */}
//       {isDetailsModalOpen && selectedProduct && (
//         <ProductDetailsModal
//           isOpen={isDetailsModalOpen}
//           onClose={() => setIsDetailsModalOpen(false)}
//           product={selectedProduct}
//         />
//       )}
//     </>
//   );
// };

interface NewsletterSubscriber {
  id: string;
  email: string;
  createdAt: string; // ou Date si vous le parsez
  updatedAt: string; // ou Date si vous le parsez
}
// Newsletter Subscribers Page
const NewsletterSubscribersPage = () => {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const isMountedRef = useRef(true);
  const loadingRef = useRef(false);

  // Charger les souscripteurs
  const loadSubscribers = useCallback(async () => {
    // Éviter les appels multiples simultanés
    if (loadingRef.current) return;
    
    loadingRef.current = true;
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/newsletter/subscribers?page=${page}&limit=50&search=${encodeURIComponent(search)}`
      );
      const data = await response.json();
      
      if (isMountedRef.current && data.success) {
        setSubscribers(data.subscribers);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des souscripteurs:', error);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
      loadingRef.current = false;
    }
  }, [page, search]);

  useEffect(() => {
    isMountedRef.current = true;
    loadSubscribers();
    
    return () => {
      isMountedRef.current = false;
    };
  }, [loadSubscribers]);

  // Charger tous les souscripteurs pour l'export (sans pagination)
  const loadAllSubscribersForExport = async () => {
    try {
      const response = await fetch(
        `/api/newsletter/subscribers?page=1&limit=10000&search=${encodeURIComponent(search)}`
      );
      const data = await response.json();
      return data.success ? data.subscribers : [];
    } catch (error) {
      console.error('Erreur lors du chargement des souscripteurs pour export:', error);
      return [];
    }
  };

  // Export PDF
  const handleExportPDF = async () => {
    try {
      const allSubscribers = await loadAllSubscribersForExport();
      if (allSubscribers.length === 0) {
        alert('Aucun souscripteur à exporter');
        return;
      }

      const jsPDF = (await import('jspdf')).default;
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // En-tête
      pdf.setFontSize(20);
      pdf.setTextColor(128, 0, 128);
      pdf.text('Liste des souscripteurs à la newsletter', 20, 20);

      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Date d'export: ${new Date().toLocaleDateString('fr-FR')}`, 20, 30);
      pdf.text(`Total: ${allSubscribers.length} souscripteurs`, 20, 35);

      // Tableau
      let y = 45;
      const pageHeight = pdf.internal.pageSize.height;
      const margin = 20;
      const rowHeight = 8;

      // En-tête du tableau
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Email', margin, y);
      pdf.text('Date d\'inscription', margin + 100, y);
      y += rowHeight;

      // Ligne de séparation
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, y, 190, y);
      y += 5;

      // Données
      pdf.setFont('helvetica', 'normal');
      allSubscribers.forEach((subscriber: NewsletterSubscriber) => {
        if (y > pageHeight - 20) {
          pdf.addPage();
          y = 20;
        }

        pdf.setFontSize(9);
        pdf.text(subscriber.email, margin, y);
        pdf.text(
          new Date(subscriber.createdAt).toLocaleDateString('fr-FR'),
          margin + 100,
          y
        );
        y += rowHeight;
      });

      // Télécharger le PDF
      pdf.save(`newsletter-subscribers-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      alert('Erreur lors de l\'export PDF');
    }
  };

  // Export CSV
  const handleExportCSV = async () => {
    try {
      const allSubscribers = await loadAllSubscribersForExport();
      if (allSubscribers.length === 0) {
        alert('Aucun souscripteur à exporter');
        return;
      }

      // Créer le contenu CSV
      const headers = ['Email', 'Date d\'inscription'];
      const rows = allSubscribers.map((subscriber: NewsletterSubscriber) => [
        subscriber.email,
        new Date(subscriber.createdAt).toLocaleString('fr-FR')
      ]);

      // Convertir en CSV avec BOM pour Excel (UTF-8)
      const csvContent = [
        '\uFEFF', // BOM pour UTF-8
        headers.join(','),
        ...rows.map((row: string[]) => row.map((cell: string) => `"${cell}"`).join(','))
      ].join('\n');

      // Créer le blob et télécharger
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erreur lors de l\'export CSV:', error);
      alert('Erreur lors de l\'export CSV');
    }
  };

  // Export Excel
  const handleExportExcel = async () => {
    try {
      const allSubscribers = await loadAllSubscribersForExport();
      if (allSubscribers.length === 0) {
        alert('Aucun souscripteur à exporter');
        return;
      }

      const XLSX = await import('xlsx');

      // Préparer les données
      // Préparer les données
      const data = [
        ['Email', 'Date d\'inscription'],
        ...allSubscribers.map((subscriber: NewsletterSubscriber) => [
          subscriber.email,
          new Date(subscriber.createdAt).toLocaleString('fr-FR')
        ])
      ];

      // Créer le workbook
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(data);

      // Ajuster la largeur des colonnes
      worksheet['!cols'] = [
        { wch: 40 }, // Email
        { wch: 25 }  // Date
      ];

      // Ajouter la feuille au workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Souscripteurs');

      // Télécharger le fichier
      XLSX.writeFile(workbook, `newsletter-subscribers-${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Erreur lors de l\'export Excel:', error);
      alert('Erreur lors de l\'export Excel');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Souscripteurs à la newsletter</h2>
          <p className="text-gray-600">{total} souscripteur{total > 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            disabled={total === 0}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={18} />
            CSV
          </button>
          <button
            onClick={handleExportExcel}
            disabled={total === 0}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={18} />
            Excel
          </button>
          <button
            onClick={handleExportPDF}
            disabled={total === 0}
            className="flex items-center gap-2 px-4 py-2 bg-[#800080] text-white rounded-lg hover:bg-[#6b006b] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={18} />
            PDF
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Rechercher par email..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Chargement...</div>
        ) : subscribers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Aucun souscripteur trouvé</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Email</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Date d&apos;inscription</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((subscriber) => (
                    <tr key={subscriber.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Mail size={16} className="text-gray-400" />
                          <span className="font-medium text-gray-900">{subscriber.email}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">
                        {new Date(subscriber.createdAt).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-gray-100">
                <div className="text-sm text-gray-600">
                  Page {page} sur {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Reports Page
// const ReportsPage = () => {
//   return (
//     <div className="space-y-6">
//       <div className="flex items-center justify-between">
//         <div>
//           <h2 className="text-2xl font-bold text-gray-900 mb-1">Rapports & Statistiques</h2>
//           <p className="text-gray-600">Analyses détaillées de vos performances</p>
//         </div>
//         <div className="flex gap-2">
//           <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
//             <Calendar size={18} />
//             Période
//           </button>
//           <button className="flex items-center gap-2 px-4 py-2 bg-[#800080] text-white rounded-lg hover:bg-[#6b006b]">
//             <Download size={18} />
//             Exporter PDF
//           </button>
//         </div>
//       </div>

//       {/* Report Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//         <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
//           <div className="flex items-center justify-between mb-4">
//             <h3 className="font-bold text-gray-900">Ventes par pays</h3>
//             <Globe className="text-[#800080]" size={20} />
//           </div>
//           <div className="space-y-3">
//             <div className="flex items-center justify-between">
//               <span className="text-sm text-gray-600">France</span>
//               <span className="font-bold text-gray-900">78 340 €</span>
//             </div>
//             <div className="flex items-center justify-between">
//               <span className="text-sm text-gray-600">Sénégal</span>
//               <span className="font-bold text-gray-900">18.5M XOF</span>
//             </div>
//             <div className="flex items-center justify-between">
//               <span className="text-sm text-gray-600">Côte d'Ivoire</span>
//               <span className="font-bold text-gray-900">12.7M XOF</span>
//             </div>
//           </div>
//         </div>

//         <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
//           <div className="flex items-center justify-between mb-4">
//             <h3 className="font-bold text-gray-900">Top produits</h3>
//             <TrendingUp className="text-green-600" size={20} />
//           </div>
//           <div className="space-y-3">
//             <div className="flex items-center gap-3">
//               <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#800080] to-[#9333ea]"></div>
//               <div className="flex-1">
//                 <p className="text-sm font-semibold text-gray-900">iPhone 15 Pro</p>
//                 <p className="text-xs text-gray-500">245 ventes</p>
//               </div>
//             </div>
//             <div className="flex items-center gap-3">
//               <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600"></div>
//               <div className="flex-1">
//                 <p className="text-sm font-semibold text-gray-900">Galaxy S24</p>
//                 <p className="text-xs text-gray-500">189 ventes</p>
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
//           <div className="flex items-center justify-between mb-4">
//             <h3 className="font-bold text-gray-900">Canaux de vente</h3>
//             <ShoppingCart className="text-blue-600" size={20} />
//           </div>
//           <div className="space-y-3">
//             <div className="flex items-center justify-between">
//               <span className="text-sm text-gray-600">En ligne</span>
//               <span className="font-bold text-gray-900">234 (35%)</span>
//             </div>
//             <div className="flex items-center justify-between">
//               <span className="text-sm text-gray-600">En boutique</span>
//               <span className="font-bold text-gray-900">443 (65%)</span>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Detailed Chart */}
//       <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
//         <h3 className="text-lg font-bold text-gray-900 mb-6">Évolution des ventes (30 derniers jours)</h3>
//         <div className="h-64 flex items-end justify-between gap-2">
//           {[65, 78, 82, 75, 90, 88, 95, 85, 92, 98, 105, 102, 110, 108].map((height, i) => (
//             <div key={i} className="flex-1 flex flex-col items-center gap-2">
//               <div 
//                 className="w-full bg-gradient-to-t from-[#800080] to-[#9333ea] rounded-t-lg transition-all hover:opacity-80 cursor-pointer"
//                 style={{ height: `${height}%` }}
//               />
//               <span className="text-xs text-gray-500">{i + 1}</span>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// Main App
const App = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [userRole, setUserRole] = useState<Role>('SUPER_ADMIN'); // 'super_admin' or 'manager'

  return (
    <StoresProvider>
      <div className="min-h-screen bg-gray-50">
        <Sidebar 
          currentPage={currentPage} 
          setCurrentPage={setCurrentPage}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
          userRole={userRole}
        />
        
        <div className="lg:ml-64">
          <Header 
            setIsMobileOpen={setIsMobileOpen}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
          />
          
          <main className="p-4 lg:p-8">
            {currentPage === 'dashboard' && <DashboardPage userRole={userRole} />}
            {currentPage === 'stores' && <StoresPage />}
            {currentPage === 'products' && <ProductModelsPage />}
            {currentPage === 'commandes' && <OrdersList />}
            {/* {currentPage === 'stock' && <StockPage />} */}
            {/* {currentPage === 'orders' && <OrdersPage />} */}
            {currentPage === 'reviews' && <ReviewsModerationPage />}
            {currentPage === 'newsletter' && <NewsletterSubscribersPage />}
            {/* {currentPage === 'users' && <UsersPage />} */}
            {/* {currentPage === 'reports' && <ReportsPage />} */}
            {/* {currentPage === 'settings' && <SettingsPage />} */}
          </main>
        </div>

        {/* Role Switcher (Demo only) */}
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setUserRole(userRole === 'SUPER_ADMIN' ? 'STORE_MANAGER' : 'SUPER_ADMIN')}
            className="px-4 py-2 bg-white border-2 border-[#800080] text-[#800080] rounded-lg shadow-lg hover:bg-[#f3e8ff] font-semibold text-sm"
          >
            Mode: {userRole === 'SUPER_ADMIN' ? 'Super Admin' : 'Manager'}
          </button>
        </div>
      </div>
    </StoresProvider>
  );
};

export default App;