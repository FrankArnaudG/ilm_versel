/**
 * StockPage.tsx
 * 
 * Page principale de gestion du stock I Love Mobile
 * Permet de :
 * - Visualiser le stock global et par boutique
 * - Filtrer les produits par boutique, statut, couleur, stockage
 * - Ajouter/Ajuster le stock (StockMovementModal)
 * - Voir l'historique des mouvements (StockHistoryModal)
 * - Suivre les statistiques des mouvements
 * 
 * Emplacement: src/pages/StockPage.tsx
 */

import React, { useState } from 'react';
import { 
  Search, Download, Plus, Package, AlertTriangle, 
  Check, X, Edit, Send, Clock, TrendingUp, TrendingDown, 
  ChevronRight,
} from 'lucide-react';
import StockMovementModal from './stock/StockMovementModal';
import StockHistoryModal from './stock/StockHistoryModal';
import StockMovementStats from './stock/StockMovementStats';
import Image from 'next/image';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface Product {
  id: number;
  name: string;
  category: string;
  image: string;
  globalStock: number;
  stores: StoreStock[];
}

interface StoreStock {
  storeId: number;
  storeName: string;
  stock: number;
}

interface Store {
  id: number;
  name: string;
  city: string;
  country: string;
  currency: string;
}

interface StockFilters {
  search: string;
  selectedStore: string;
  filterStatus: string;
}

// ============================================================================
// MOCK DATA (À déplacer dans src/data/)
// ============================================================================

const MOCK_STORES: Store[] = [
  { id: 1, name: 'I Love Mobile Paris', city: 'Paris', country: 'France', currency: 'EUR' },
  { id: 2, name: 'I Love Mobile Lyon', city: 'Lyon', country: 'France', currency: 'EUR' },
  { id: 3, name: 'I Love Mobile Dakar', city: 'Dakar', country: 'Sénégal', currency: 'XOF' },
  { id: 4, name: 'I Love Mobile Abidjan', city: 'Abidjan', country: 'Côte d\'Ivoire', currency: 'XOF' }
];

// Exemple de données produits
const MOCK_STOCK_DATA: Product[] = [
  {
    id: 1,
    name: 'iPhone 15 Pro Max',
    category: 'Téléphones',
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&h=400&fit=crop',
    globalStock: 156,
    stores: [
      { storeId: 1, storeName: 'I Love Mobile Paris', stock: 45 },
      { storeId: 2, storeName: 'I Love Mobile Lyon', stock: 38 },
      { storeId: 3, storeName: 'I Love Mobile Dakar', stock: 42 },
      { storeId: 4, storeName: 'I Love Mobile Abidjan', stock: 31 }
    ]
  },
  {
    id: 2,
    name: 'Samsung Galaxy S24',
    category: 'Téléphones',
    image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&h=400&fit=crop',
    globalStock: 98,
    stores: [
      { storeId: 1, storeName: 'I Love Mobile Paris', stock: 28 },
      { storeId: 2, storeName: 'I Love Mobile Lyon', stock: 22 },
      { storeId: 3, storeName: 'I Love Mobile Dakar', stock: 25 },
      { storeId: 4, storeName: 'I Love Mobile Abidjan', stock: 23 }
    ]
  },
  {
    id: 3,
    name: 'MacBook Air M2',
    category: 'Ordinateurs',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop',
    globalStock: 45,
    stores: [
      { storeId: 1, storeName: 'I Love Mobile Paris', stock: 15 },
      { storeId: 2, storeName: 'I Love Mobile Lyon', stock: 12 },
      { storeId: 3, storeName: 'I Love Mobile Dakar', stock: 10 },
      { storeId: 4, storeName: 'I Love Mobile Abidjan', stock: 8 }
    ]
  }
];

type MovementType = 'in' | 'out' | 'transfer_in' | 'transfer_out' | 'adjustment' | 'sale' | 'return';

interface StockMovement {
  id: string;
  modelId: number;
  modelName: string;
  color: string;
  storage: string;
  storeId: number;
  storeName: string;
  type: MovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  reference: string;
  performedBy: {
    name: string;
    role: string;
    email: string;
  };
  date: string;
  notes: string;
}


const MOCK_STOCK_MOVEMENTS: StockMovement[] = [
  {
    id: 'MVT-001',
    modelId: 1,
    modelName: 'iPhone 15 Pro Max',
    color: 'Titane Noir',
    storage: '256GB',
    storeId: 1,
    storeName: 'I Love Mobile Paris',
    type: 'in' as MovementType, // Ou simplement 'in' avec le typage du tableau
    quantity: 5,
    previousStock: 7,
    newStock: 12,
    reason: 'Réapprovisionnement fournisseur',
    reference: 'CMD-FOURNISSEUR-2024-001',
    performedBy: {
      name: 'Marie Martin',
      role: 'Manager',
      email: 'marie.martin@ilovemobile.fr'
    },
    date: '2025-10-01T10:30:00',
    notes: 'Livraison Apple - Facture #FA-2024-1234'
  },
  {
    id: 'MVT-002',
    modelId: 1,
    modelName: 'iPhone 15 Pro Max',
    color: 'Titane Noir',
    storage: '256GB',
    storeId: 1,
    storeName: 'I Love Mobile Paris',
    type: 'out' as MovementType,
    quantity: -2,
    previousStock: 12,
    newStock: 10,
    reason: 'Vente client',
    reference: 'VTE-001',
    performedBy: {
      name: 'Jean Dupont',
      role: 'Vendeur',
      email: 'jean.dupont@ilovemobile.fr'
    },
    date: '2025-10-12T16:45:00',
    notes: 'Vente avec garantie étendue'
  }
];

// ============================================================================
// COMPOSANT PRINCIPAL: StockPage
// ============================================================================

const StockPage: React.FC = () => {
  const [filters, setFilters] = useState<StockFilters>({
    search: '',
    selectedStore: 'all',
    filterStatus: 'all'
  });

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Filtrer les données
  const filteredStock = MOCK_STOCK_DATA.filter(item => {
    // Search filter
    if (filters.search && !item.name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }

    // Store filter
    if (filters.selectedStore !== 'all') {
      const storeData = item.stores.find(s => s.storeId === parseInt(filters.selectedStore));
      if (!storeData || storeData.stock === 0) return false;
    }

    // Status filter
    if (filters.filterStatus !== 'all') {
      if (filters.filterStatus === 'in_stock' && item.globalStock === 0) return false;
      if (filters.filterStatus === 'low_stock' && (item.globalStock === 0 || item.globalStock >= 20)) return false;
      if (filters.filterStatus === 'out_of_stock' && item.globalStock > 0) return false;
    }

    return true;
  });

  const handleAddStock = (product: Product, store: Store) => {
    setSelectedProduct(product);
    setSelectedStore(store);
    setIsMovementModalOpen(true);
  };

  const handleViewHistory = (product: Product, store: Store | null = null) => {
    setSelectedProduct(product);
    setSelectedStore(store);
    setIsHistoryModalOpen(true);
  };

  const getStoreStock = (product: Product, storeId: number): number => {
    const storeData = product.stores.find(s => s.storeId === storeId);
    return storeData ? storeData.stock : 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Gestion du stock</h2>
          <p className="text-gray-600">Stock global et par boutique</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <Download size={18} />
            Exporter
          </button>
          <button className="px-4 py-2 bg-[#800080] text-white rounded-lg hover:bg-[#6b006b] flex items-center gap-2">
            <Plus size={18} />
            Mouvement de stock
          </button>
        </div>
      </div>

      {/* Stock Movement Statistics */}
      <StockMovementStats movements={MOCK_STOCK_MOVEMENTS} />

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Rechercher</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Nom du produit..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
              />
            </div>
          </div>

          {/* Store Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Boutique</label>
            <select
              value={filters.selectedStore}
              onChange={(e) => setFilters({ ...filters, selectedStore: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
            >
              <option value="all">Toutes les boutiques</option>
              {MOCK_STORES.map(store => (
                <option key={store.id} value={store.id}>{store.city}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Statut</label>
            <select
              value={filters.filterStatus}
              onChange={(e) => setFilters({ ...filters, filterStatus: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
            >
              <option value="all">Tous les statuts</option>
              <option value="in_stock">En stock</option>
              <option value="low_stock">Stock bas</option>
              <option value="out_of_stock">Rupture</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stock Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-green-100">
              <Check size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">En stock</p>
              <p className="text-2xl font-bold text-gray-900">
                {MOCK_STOCK_DATA.filter(item => item.globalStock > 0).length}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-500">Modèles disponibles</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-orange-100">
              <AlertTriangle size={20} className="text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Stock bas</p>
              <p className="text-2xl font-bold text-gray-900">
                {MOCK_STOCK_DATA.filter(item => item.globalStock > 0 && item.globalStock < 20).length}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-500">Moins de 20 unités</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-red-100">
              <X size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Rupture</p>
              <p className="text-2xl font-bold text-gray-900">
                {MOCK_STOCK_DATA.filter(item => item.globalStock === 0).length}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-500">Modèles épuisés</p>
        </div>
      </div>

      {/* Recent Stock Movements */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Clock size={20} className="text-[#800080]" />
            Mouvements récents de stock
          </h3>
          <button className="text-sm text-[#800080] hover:text-[#6b006b] font-medium">
            Voir tout l&apos;historique →
          </button>
        </div>

        <div className="space-y-3">
          {MOCK_STOCK_MOVEMENTS.slice(0, 5).map(movement => {
            const isIncrease = movement.quantity > 0;
            return (
              <div key={movement.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isIncrease ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {isIncrease ? (
                    <TrendingUp size={20} className="text-green-600" />
                  ) : (
                    <TrendingDown size={20} className="text-red-600" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-900 text-sm truncate">{movement.modelName}</p>
                    <span className={`text-xs font-bold ${isIncrease ? 'text-green-600' : 'text-red-600'}`}>
                      {isIncrease ? '+' : ''}{movement.quantity}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 truncate">{movement.reason} • {movement.storeName}</p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    {new Date(movement.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(movement.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Avant</p>
                    <p className="text-sm font-bold text-gray-700">{movement.previousStock}</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-400 mx-1" />
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Après</p>
                    <p className={`text-sm font-bold ${isIncrease ? 'text-green-600' : 'text-red-600'}`}>
                      {movement.newStock}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Produit</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Catégorie</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Stock global</th>
                {MOCK_STORES.map(store => (
                  <th key={store.id} className="text-left py-4 px-6 text-sm font-semibold text-gray-600">
                    {store.city}
                  </th>
                ))}
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Statut</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStock.map(item => (
                <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50 group">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <Image
                        src={item.image} 
                        alt={item.name} 
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-lg object-cover" 
                      />
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600">{item.category}</td>
                  <td className="py-4 px-6">
                    <span className="font-bold text-gray-900">{item.globalStock}</span>
                  </td>
                  {MOCK_STORES.map(store => {
                    const stock = getStoreStock(item, store.id);
                    return (
                      <td key={store.id} className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-semibold ${
                            stock === 0 ? 'text-red-600' :
                            stock < 10 ? 'text-orange-600' : 
                            stock < 30 ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {stock}
                          </span>
                          {/* Actions rapides au survol */}
                          <div className="hidden group-hover:flex gap-1">
                            <button
                              onClick={() => handleAddStock(item, store)}
                              className="p-1 hover:bg-green-100 rounded transition-colors"
                              title="Ajouter/Ajuster stock"
                            >
                              <Plus size={14} className="text-green-600" />
                            </button>
                            <button
                              onClick={() => handleViewHistory(item, store)}
                              className="p-1 hover:bg-blue-100 rounded transition-colors"
                              title="Voir l'historique"
                            >
                              <Clock size={14} className="text-blue-600" />
                            </button>
                          </div>
                        </div>
                      </td>
                    );
                  })}
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      item.globalStock === 0 ? 'bg-red-100 text-red-700' :
                      item.globalStock < 20 ? 'bg-orange-100 text-orange-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {item.globalStock === 0 ? 'Rupture' :
                       item.globalStock < 20 ? 'Stock bas' : 'En stock'}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleViewHistory(item, null)}
                        className="p-2 hover:bg-blue-100 rounded-lg transition-colors" 
                        title="Historique complet"
                      >
                        <Clock size={16} className="text-blue-600" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Ajuster stock">
                        <Edit size={16} className="text-gray-600" />
                      </button>
                      <button className="p-2 hover:bg-purple-100 rounded-lg transition-colors" title="Transférer">
                        <Send size={16} className="text-purple-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredStock.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
          <Package size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">Aucun produit trouvé</h3>
          <p className="text-gray-600">Essayez de modifier vos filtres</p>
        </div>
      )}

      {/* Modals */}
      <StockMovementModal
        isOpen={isMovementModalOpen}
        onClose={() => {
          setIsMovementModalOpen(false);
          setSelectedProduct(null);
          setSelectedStore(null);
        }}
        product={selectedProduct}
        store={selectedStore}
      />

      <StockHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => {
          setIsHistoryModalOpen(false);
          setSelectedProduct(null);
          setSelectedStore(null);
        }}
        product={selectedProduct}
        store={selectedStore}
      />
    </div>
  );
};

export default StockPage;