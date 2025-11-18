/**
 * ProductModelsPage.tsx
 * 
 * Page principale du catalogue des modèles de produits I Love Mobile
 * 
 * Fonctionnalités:
 * - Vue Grille / Liste (toggle)
 * - Filtres avancés (recherche, catégorie, marque, prix, couleur, statut)
 * - Affichage du stock global et par boutique
 * - Gestion des couleurs et variantes
 * - Actions : Ajouter, Modifier, Voir détails
 * 
 * Emplacement: src/components/products/ProductModelsPage.tsx
 */


/**
 * AddProductModelModal.tsx
 * 
 * Modal adapté pour créer un modèle de produit via l'API
 * Inspiré du AddStoreModal
 */

/**
 * ProductModelsPage.tsx
 * 
 * Page principale du catalogue des modèles de produits I Love Mobile
 * SANS PROPS - Utilisée directement dans App.tsx
 * 
 * Fonctionnalités:
 * - Vue Grille / Liste (toggle)
 * - Filtres avancés (recherche, catégorie, marque, statut)
 * - Affichage des modèles avec couleurs et variantes
 * - Actions : Ajouter, Voir détails, Supprimer
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, LayoutDashboard, Package, Eye, Trash2, RefreshCw,
  ShoppingCart, X, Store, MapPin, ChevronRight, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { useCurrentUser } from '@/ts/hooks/use-current-user';
import { ErrorModal } from './Notification_error';
import { SuccessModal } from './Notification_success';
import AddProductModelModal from './products/AddProductModelModal';
import StockEntryModal from './products/AddProductArticle';
import RecommendProductsModal from './products/RecommendProductsModal';
import { useStores } from '../ilm2/contexts/StoresContext';
import { hasPermission, Role } from '@/lib/permissions';
import Image from 'next/image';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface ProductColor {
  id: string;
  colorName: string;
  hexaColor: string;
  images: {
    id: string;
    url: string;
    fileName: string | null;
    displayOrder: number;
  }[];
}

// interface ProductVariant {
//   id: string;
//   name: string;
//   useFCFA: boolean;
//   pvTTC: number;
//   pamp: number;
//   oldPrice: number;
//   margin: number;
//   tva: number;
//   pvTTC_FCFA: number;
//   pamp_FCFA: number;
//   oldPrice_FCFA: number;
//   marginFCFA: number;
//   specifications: Record<string, string> | null;
// }

interface ProductModel {
  id: string;
  designation: string;
  brand: string;
  reference: string;
  category: string;
  family: string | null;
  subFamily: string | null;
  description: string | null;
  status: 'ACTIVE' | 'DRAFT' | 'DISCONTINUED' | 'COMING_SOON';
  specifications: Record<string, string> | null;
  supplier: {
    id: string;
    name: string;
  };
  colors: ProductColor[];
  // variants: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

interface Filters {
  search: string;
  category: string;
  brand: string;
  sortBy: string;
  status: string;
}

interface Supplier {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  country: string;
}

// ============================================================================
// COMPOSANT PRINCIPAL - PAS DE PROPS
// ============================================================================

const ProductModelsPage: React.FC = () => {
  const user = useCurrentUser();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isStockEntryModalOpen, setIsStockEntryModalOpen] = useState(false);
  const { stores, loading: storesLoading } = useStores();

  const [isStoreSelectionOpen, setIsStoreSelectionOpen] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [selectedStoreName, setSelectedStoreName] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    isOpen: boolean;
    title: string;
    description?: string;
    variant: 'default' | 'destructive' | 'success' | 'warning';
  }>({
    isOpen: false,
    title: '',
    variant: 'default',
  });

  // Fonction pour afficher un toast
  const showToast = (
    title: string,
    description?: string,
    variant: 'default' | 'destructive' | 'success' | 'warning' = 'default'
  ) => {
    setToast({ isOpen: true, title, description, variant });
  };
  
  // États pour les données
  const [models, setModels] = useState<ProductModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>(user?.role || '');

  // États pour les notifications
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const [filters, setFilters] = useState<Filters>({
    search: '',
    category: 'all',
    brand: 'all',
    sortBy: 'recent',
    status: 'all'
  });

  const [isSuppliersListOpen, setIsSuppliersListOpen] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [suppliersLoading, setSuppliersLoading] = useState(false);
  const [isRecommendModalOpen, setIsRecommendModalOpen] = useState(false);
  const [recommendBaseModel, setRecommendBaseModel] = useState<ProductModel | null>(null);






  // Construire la liste des rôles disponibles
  const availableRoles = user ? [
    { value: user.role, label: `Rôle principal: ${user.role}`, isPrimary: true }
  ] : [];

  if (user?.secondaryRoles) {
    const activeSecondary = user.secondaryRoles.filter(sr => {
      if (!sr.expiresAt) return true;
      return new Date(sr.expiresAt) > new Date();
    });

    activeSecondary.forEach(sr => {
      availableRoles.push({
        value: sr.role,
        label: `Rôle secondaire: ${sr.role}`,
        isPrimary: false,
      });
    });
  }

  // Fonction pour charger les modèles depuis l'API
  const fetchModels = async () => {
    if (!user?.id || !selectedRole) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/products/models?user_id=${user.id}&role=${selectedRole}`);
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.message);
        return;
      }
      
      setModels(data.models || []);
      
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la récupération des modèles");
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    if (!user?.id || !selectedRole) return;
    
    setSuppliersLoading(true);
    
    try {
      const response = await fetch(`/api/suppliers?user_id=${user.id}&role=${selectedRole}`);
      const data = await response.json();
      
      if (response.ok) {
        setSuppliers(data.suppliers || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSuppliersLoading(false);
    }
  };


  // Charger les modèles au montage et quand le rôle change
  useEffect(() => {
    fetchModels();
    fetchSuppliers();
  }, [user?.id, selectedRole]);

  // Extraire les catégories et marques uniques
  const categories = ['all', ...new Set(models.map(m => m.category))];
  const brands = ['all', ...new Set(models.map(m => m.brand))];

  // Filtrer les modèles
  const filteredModels = models.filter(model => {
    if (filters.search && 
        !model.designation.toLowerCase().includes(filters.search.toLowerCase()) &&
        !model.brand.toLowerCase().includes(filters.search.toLowerCase()) &&
        !model.reference.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.category !== 'all' && model.category !== filters.category) return false;
    if (filters.brand !== 'all' && model.brand !== filters.brand) return false;
    if (filters.status !== 'all' && model.status !== filters.status) return false;
    return true;
  });

  // Trier les modèles
  const sortedModels = [...filteredModels].sort((a, b) => {
    switch (filters.sortBy) {
      case 'name-asc': return a.designation.localeCompare(b.designation);
      case 'name-desc': return b.designation.localeCompare(a.designation);
      case 'recent': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      default: return 0;
    }
  });

  const handleDeleteModel = async (modelId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce modèle ? Cette action est irréversible.')) {
      return;
    }

    try {
      const response = await fetch(`/api/products/models/${modelId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user?.id,
          role: selectedRole
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.message);
        setShowError(true);
        return;
      }

      setSuccessMessage(data.message);
      setShowSuccess(true);
      fetchModels(); // Rafraîchir la liste
      
    } catch (error) {
      console.error(error);
      setErrorMessage('Erreur lors de la suppression');
      setShowError(true);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { class: string; label: string }> = {
      ACTIVE: { class: 'bg-green-100 text-green-700', label: 'Actif' },
      DRAFT: { class: 'bg-gray-100 text-gray-700', label: 'Brouillon' },
      DISCONTINUED: { class: 'bg-red-100 text-red-700', label: 'Arrêté' },
      COMING_SOON: { class: 'bg-blue-100 text-blue-700', label: 'Bientôt' }
    };
    return badges[status] || badges.ACTIVE;
  };

  // Fonction appelée au clic sur "Nouvelle entrée en stock"
  const handleOpenStockEntry = () => {
    // ÉTAPE 1 : Récupérer le rôle actuel de l'utilisateur
    // Trouvez le rôle actuel (celui qui est isPrimary ou le premier)
    const currentUserRole = availableRoles.find(role => role.isPrimary)?.value || availableRoles[0]?.value;
    
    if (!currentUserRole) {
      showToast(
        "Erreur",
        "Aucun rôle actif n'a été trouvé.",
        "destructive"
      );
      return;
    }
    
    // ÉTAPE 2 : Vérifier si le rôle a la permission 'articles.create'
    const hasCreatePermission = hasPermission(currentUserRole as Role, 'articles.create');
    
    if (!hasCreatePermission) {
      showToast(
        "Accès refusé",
        "Vous n'avez pas les permissions nécessaires pour créer une entrée en stock.",
        "destructive"
      );
      return;
    }
    
    // ÉTAPE 3 : Vérifier le nombre de boutiques disponibles
    const storeCount = stores.length;
    
    // CAS 1 : Aucune boutique disponible
    if (storeCount === 0) {
      showToast(
        "Aucune boutique disponible",
        "Aucune boutique n'est disponible pour effectuer une entrée en stock.",
        "warning"
      );
      return;
    }
    
    // CAS 2 : Une seule boutique - Ouvrir directement le modal
    if (storeCount === 1) {
      setSelectedStoreId(stores[0].id);
      setSelectedStoreName(stores[0].name)
      setIsStockEntryModalOpen(true);
      return;
    }
    
    // CAS 3 : Plusieurs boutiques - Afficher la liste de sélection
    setIsStoreSelectionOpen(true);
  };

  // Fonction appelée quand une boutique est sélectionnée
  const handleStoreSelect = (storeId: string, storeName: string) => {
    setSelectedStoreId(storeId);
    setSelectedStoreName(storeName);
    setIsStoreSelectionOpen(false);
    setIsStockEntryModalOpen(true);
  };
  

  return (
    <>
      <SuccessModal
        isOpen={showSuccess}
        onClose={() => {
          setShowSuccess(false);
          fetchModels();
        }}
        message={successMessage}
      />

      <ErrorModal
        isOpen={showError}
        onClose={() => setShowError(false)}
        message={errorMessage}
      />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Catalogue des produits</h2>
            <p className="text-gray-600">{sortedModels.length} modèles de produits</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {/* Sélecteur de rôle */}
            {availableRoles.length > 1 && (
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
              >
                {availableRoles.map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
            >
              {viewMode === 'grid' ? (
                <>
                  <LayoutDashboard size={18} />
                  <span className="hidden sm:inline">Vue liste</span>
                </>
              ) : (
                <>
                  <Package size={18} />
                  <span className="hidden sm:inline">Vue grille</span>
                </>
              )}
            </button>

            <button 
              onClick={() => setIsSuppliersListOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Package size={20} />
              <span className="hidden sm:inline">Fournisseurs</span>
            </button>

            {/* Bouton Entrée en stock */}
            <button 
              onClick={handleOpenStockEntry}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ShoppingCart size={20} />
              <span className="hidden sm:inline">Entrée en stock</span>
            </button>
            
            {/* Bouton Nouveau modèle */}
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#800080] text-white rounded-lg hover:bg-[#6b006b] transition-colors"
            >
              <Plus size={20} />
              <span className="hidden sm:inline">Nouveau modèle</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Rechercher</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Nom, marque, référence..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Catégorie</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
              >
                <option value="all">Toutes</option>
                {categories.filter(c => c !== 'all').map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Brand */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Marque</label>
              <select
                value={filters.brand}
                onChange={(e) => setFilters({ ...filters, brand: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
              >
                <option value="all">Toutes</option>
                {brands.filter(b => b !== 'all').map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Trier par</label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
              >
                <option value="recent">Plus récents</option>
                <option value="oldest">Plus anciens</option>
                <option value="name-asc">Nom (A-Z)</option>
                <option value="name-desc">Nom (Z-A)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="animate-spin text-[#800080]" size={32} />
            <span className="ml-2">Chargement des modèles...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        ) : sortedModels.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
            <Package size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Aucun modèle trouvé</h3>
            <p className="text-gray-600">Essayez de modifier vos filtres ou d&apos;ajouter un nouveau modèle</p>
          </div>
        ) : viewMode === 'grid' ? (
          /* Vue Grille */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedModels.map(model => {
              const statusBadge = getStatusBadge(model.status);

              return (
                <div key={model.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
                  {/* Image */}
                  <div className="aspect-square bg-gradient-to-br from-gray-50 to-[#f3e8ff] p-4 relative">
                    {model.colors.length > 0 && model.colors[0].images.length > 0 ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={model.colors[0].images[0].url}
                          alt={model.designation}
                          fill
                          className="object-contain"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package size={64} className="text-gray-300" />
                      </div>
                    )}

                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusBadge.class}`}>
                        {statusBadge.label}
                      </span>
                    </div>

                    {/* Color dots */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                      {model.colors.slice(0, 4).map((color) => (
                        <div
                          key={color.id}
                          className="w-3 h-3 rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: color.hexaColor }}
                          title={color.colorName}
                        />
                      ))}
                      {model.colors.length > 4 && (
                        <div className="w-3 h-3 rounded-full border-2 border-white bg-gray-300 flex items-center justify-center text-[8px] font-bold">
                          +{model.colors.length - 4}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1">{model.brand}</p>
                        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{model.designation}</h3>
                        <p className="text-xs text-gray-500">{model.category}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                      <div className="bg-purple-50 rounded p-2 text-center">
                        <p className="text-purple-700 font-bold">{model.colors.length}</p>
                        <p className="text-purple-600">Couleurs</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => alert(`Voir détails: ${model.designation}`)}
                        className="flex-1 py-2 px-3 bg-[#f3e8ff] hover:bg-[#e9d5ff] text-[#800080] rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Eye size={16} />
                        Détails
                      </button>
                      <button
                        onClick={() => { setRecommendBaseModel(model); setIsRecommendModalOpen(true); }}
                        className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
                        title="Définir des produits recommandés"
                      >
                        <LayoutDashboard size={16} className="text-[#800080]" />
                      </button>
                      <button
                        onClick={() => handleDeleteModel(model.id)}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 size={16} className="text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Vue Liste */
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Produit</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Référence</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Catégorie</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Prix de base</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Couleurs</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Variantes</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Statut</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedModels.map(model => {
                    const statusBadge = getStatusBadge(model.status);

                    return (
                      <tr key={model.id} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-50 to-[#f3e8ff] p-1 flex-shrink-0 relative">
                              {model.colors.length > 0 && model.colors[0].images.length > 0 ? (
                                <div className="relative w-full h-full">
                                  <Image
                                    src={model.colors[0].images[0].url}
                                    alt={model.designation}
                                    fill
                                    className="object-contain"
                                    sizes="48px"
                                  />
                                </div>
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package size={32} className="text-gray-300" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{model.designation}</p>
                              <p className="text-xs text-gray-500">{model.brand}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-700 font-mono">{model.reference}</td>
                        <td className="py-4 px-6 text-sm text-gray-700">{model.category}</td>
                        
                        <td className="py-4 px-6">
                          <div className="flex gap-1">
                            {model.colors.slice(0, 5).map(color => (
                              <div
                                key={color.id}
                                className="w-5 h-5 rounded-full border-2 border-gray-300"
                                style={{ backgroundColor: color.hexaColor }}
                                title={color.colorName}
                              />
                            ))}
                            {model.colors.length > 5 && (
                              <div className="w-5 h-5 rounded-full bg-gray-200 border-2 border-gray-300 flex items-center justify-center text-[9px] font-bold text-gray-600">
                                +{model.colors.length - 5}
                              </div>
                            )}
                          </div>
                        </td>
                        
                        <td className="py-4 px-6">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge.class}`}>
                            {statusBadge.label}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex gap-2">
                            <button
                              onClick={() => alert(`Voir détails: ${model.designation}`)}
                              className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                              title="Voir les détails"
                            >
                              <Eye size={16} className="text-blue-600" />
                            </button>
                            <button
                              onClick={() => { setRecommendBaseModel(model); setIsRecommendModalOpen(true); }}
                              className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
                              title="Définir recommandations"
                            >
                              <LayoutDashboard size={16} className="text-[#800080]" />
                            </button>
                            <button
                              onClick={() => handleDeleteModel(model.id)}
                              className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 size={16} className="text-red-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal - Décommentez quand AddProductModelModal sera créé */}
        <AddProductModelModal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            fetchModels(); // Rafraîchir après ajout
          }}
          userRole={selectedRole}
        />

        {/* <StockEntryModal 
          isOpen={isStockEntryModalOpen}
          onClose={() => setIsStockEntryModalOpen(false)}
          stores={stores}
          
        /> */}

        {/* Modal d'entrée en stock */}
        {isStockEntryModalOpen && selectedStoreId && selectedStoreName &&(
          <StockEntryModal
            isOpen={isStockEntryModalOpen}
            onClose={() => {
              setIsStockEntryModalOpen(false);
              setSelectedStoreId(null);
              setSelectedStoreName(null);
            }}
            selectedRole={selectedRole}
            storeId={selectedStoreId}
            storeName={selectedStoreName}
            storesLoading={storesLoading}  // état de chargement
            productModels={sortedModels}
            onStockEntrySubmitSuccess={fetchModels}
            suppliersListe={suppliers}
            // Si vous voulez rafraîchir la liste, réouvrez le modal
            onRefreshSuppliers={fetchSuppliers} 
          />
        )}

        {/* Modal de sélection de boutique */}
        <StoreSelectionModal
          isOpen={isStoreSelectionOpen}
          onClose={() => setIsStoreSelectionOpen(false)}
          stores={stores}
          onSelectStore={handleStoreSelect}
        />

        {/* Toast de notification */}
        <Toast
          isOpen={toast.isOpen}
          title={toast.title}
          description={toast.description}
          variant={toast.variant}
          onClose={() => setToast({ ...toast, isOpen: false })}
        />

        <SuppliersListModal
          isOpen={isSuppliersListOpen}
          onClose={() => setIsSuppliersListOpen(false)}
          suppliers={suppliers}
          loading={suppliersLoading}
          onRefresh={fetchSuppliers}
        />

        {/* Modal de configuration des produits recommandés */}
        <RecommendProductsModal
          isOpen={isRecommendModalOpen}
          onClose={() => { setIsRecommendModalOpen(false); setRecommendBaseModel(null); }}
          baseModel={recommendBaseModel}
          allModels={sortedModels}
          onSaved={() => { setIsRecommendModalOpen(false); fetchModels(); }}
          userId={user?.id || ''}
          role={selectedRole}
        />
      </div>
    </>
  );
};

export default ProductModelsPage;




interface StoreOption {
  id: string;
  name: string;
  address?: string;
}

interface StoreSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  stores: StoreOption[];
  onSelectStore: (storeId: string, storeName: string) => void;
}

const StoreSelectionModal: React.FC<StoreSelectionModalProps> = ({
  isOpen,
  onClose,
  stores,
  onSelectStore,
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative border-b border-gray-200 px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Sélectionner une boutique
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Choisissez la boutique pour l&apos;entrée en stock
            </p>
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Store List */}
          <div className="px-6 py-4 max-h-96 overflow-y-auto">
            <div className="space-y-2">
              {stores.map((store) => (
                <button
                  key={store.id}
                  onClick={() => {
                    onSelectStore(store.id, store.name);
                  }}
                  className="w-full group relative overflow-hidden bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg p-4 transition-all duration-200 hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 group-hover:bg-blue-200 rounded-lg flex items-center justify-center transition-colors">
                      <Store className="h-5 w-5 text-blue-600" />
                    </div>

                    {/* Store Info */}
                    <div className="flex-1 text-left min-w-0">
                      <h3 className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">
                        {store.name}
                      </h3>
                      {store.address && (
                        <div className="flex items-start gap-1 mt-1">
                          <MapPin className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-gray-500 line-clamp-2">
                            {store.address}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Arrow */}
                    <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
                  </div>

                  {/* Hover effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </>
  );
};



interface ToastProps {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success' | 'warning';
  isOpen: boolean;
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({
  title,
  description,
  variant = 'default',
  isOpen,
  onClose,
  duration = 5000,
}) => {
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  const variants = {
    default: {
      container: 'bg-white border-gray-200',
      icon: <Info className="h-5 w-5 text-blue-600" />,
      iconBg: 'bg-blue-100',
    },
    destructive: {
      container: 'bg-red-50 border-red-200',
      icon: <AlertCircle className="h-5 w-5 text-red-600" />,
      iconBg: 'bg-red-100',
    },
    success: {
      container: 'bg-green-50 border-green-200',
      icon: <CheckCircle className="h-5 w-5 text-green-600" />,
      iconBg: 'bg-green-100',
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200',
      icon: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
      iconBg: 'bg-yellow-100',
    },
  };

  const currentVariant = variants[variant];

  return (
    <div className="fixed top-4 right-4 z-[100] animate-in slide-in-from-top-5 duration-300">
      <div
        className={`${currentVariant.container} border rounded-lg shadow-lg p-4 max-w-md w-full`}
      >
        <div className="flex items-start gap-3">
          <div className={`${currentVariant.iconBg} rounded-lg p-2 flex-shrink-0`}>
            {currentVariant.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
            {description && (
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};


interface SuppliersListModalProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: Supplier[];
  loading: boolean;
  onRefresh: () => void;
}

const SuppliersListModal: React.FC<SuppliersListModalProps> = ({
  isOpen,
  onClose,
  suppliers,
  loading,
  onRefresh
}) => {
  useEffect(() => {
    if (isOpen) {
      onRefresh(); // Rafraîchir à l'ouverture
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}>
          
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Liste des fournisseurs</h2>
              <p className="text-sm text-gray-500 mt-1">{suppliers.length} fournisseurs</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content - reste identique */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <RefreshCw className="animate-spin text-[#800080]" size={32} />
                <span className="ml-2">Chargement...</span>
              </div>
            ) : suppliers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Aucun fournisseur trouvé</p>
              </div>
            ) : (
              <div className="space-y-3">
                {suppliers.map((supplier) => (
                  <div key={supplier.id} className="border border-gray-200 rounded-lg p-4 hover:border-[#800080] transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{supplier.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">Contact: {supplier.contactName}</p>
                        <div className="flex gap-4 mt-2 text-sm text-gray-500">
                          {supplier.phone && <span>📞 {supplier.phone}</span>}
                          {supplier.email && <span>✉️ {supplier.email}</span>}
                        </div>
                        {supplier.address && <p className="text-sm text-gray-500 mt-1">📍 {supplier.address}</p>}
                        {supplier.country && (
                          <span className="inline-block mt-2 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                            {supplier.country}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4">
            <button onClick={onClose} className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
              Fermer
            </button>
          </div>
        </div>
      </div>
    </>
  );
};






// import React, { useState } from 'react';
// import { 
//   Plus, Search, Filter, LayoutDashboard, Package, Eye, Edit, 
//   Trash2, TrendingUp, Download, X
// } from 'lucide-react';
// import AddProductModelModal from './products/AddProductModelModal';
// import ModelDetailsModal from './products/ModelDetailsModal';

// // ============================================================================
// // TYPES & INTERFACES
// // ============================================================================

// interface ProductColor {
//   name: string;
//   hex: string;
//   images: string[];
// }

// interface ProductModel {
//   id: number;
//   name: string;
//   brand: string;
//   category: string;
//   basePrice: number;
//   oldPrice?: number;
//   description: string;
//   colors: ProductColor[];
//   variants: string[]; // ['128GB', '256GB', '512GB']
//   specs: Record<string, string>;
//   status: 'active' | 'inactive';
//   // Statistiques calculées
//   availableStock?: number;
//   inTransitStock?: number;
//   soldCount?: number;
//   totalProducts?: number;
// }

// interface Filters {
//   search: string;
//   category: string;
//   brand: string;
//   priceRange: string;
//   sortBy: string;
//   status: string;
// }

// // ============================================================================
// // MOCK DATA (À déplacer dans src/data/mockProducts.ts)
// // ============================================================================

// const MOCK_PRODUCT_MODELS: ProductModel[] = [
//   {
//     id: 1,
//     name: 'iPhone 15 Pro Max',
//     brand: 'Apple',
//     category: 'Téléphones',
//     basePrice: 1299,
//     oldPrice: 1499,
//     description: 'Le smartphone le plus puissant d\'Apple avec puce A17 Pro',
//     colors: [
//       { name: 'Titane Noir', hex: '#2C2C2E', images: ['https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800'] },
//       { name: 'Titane Blanc', hex: '#F5F5F7', images: ['https://images.unsplash.com/photo-1592286927505-c5d6794d1e8e?w=800'] },
//       { name: 'Titane Bleu', hex: '#3A5A7F', images: ['https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=800'] },
//       { name: 'Titane Naturel', hex: '#D4C5B0', images: ['https://images.unsplash.com/photo-1678652197831-2d180705cd2c?w=800'] }
//     ],
//     variants: ['128GB', '256GB', '512GB', '1TB'],
//     specs: {
//       'Écran': '6.7" Super Retina XDR',
//       'Processeur': 'Apple A17 Pro',
//       'RAM': '8 GB',
//       'Caméra': 'Triple 48MP + 12MP + 12MP',
//       'Batterie': '4422 mAh'
//     },
//     status: 'active',
//     availableStock: 156,
//     inTransitStock: 12,
//     soldCount: 89,
//     totalProducts: 257
//   },
//   {
//     id: 2,
//     name: 'Samsung Galaxy S24',
//     brand: 'Samsung',
//     category: 'Téléphones',
//     basePrice: 899,
//     oldPrice: 999,
//     description: 'Galaxy AI révolutionne la façon dont vous utilisez votre smartphone',
//     colors: [
//       { name: 'Noir Onyx', hex: '#000000', images: ['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800'] },
//       { name: 'Blanc Marbre', hex: '#FFFFFF', images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800'] },
//       { name: 'Violet Améthyste', hex: '#8B5CF6', images: ['https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800'] },
//       { name: 'Jaune Citron', hex: '#FDE047', images: ['https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800'] }
//     ],
//     variants: ['128GB', '256GB', '512GB'],
//     specs: {
//       'Écran': '6.2" Dynamic AMOLED 2X',
//       'Processeur': 'Snapdragon 8 Gen 3',
//       'RAM': '8 GB',
//       'Caméra': 'Triple 50MP + 12MP + 10MP',
//       'Batterie': '4000 mAh'
//     },
//     status: 'active',
//     availableStock: 98,
//     inTransitStock: 8,
//     soldCount: 67,
//     totalProducts: 173
//   },
//   {
//     id: 3,
//     name: 'MacBook Air M2',
//     brand: 'Apple',
//     category: 'Ordinateurs',
//     basePrice: 1399,
//     oldPrice: 1599,
//     description: 'Ultra fin et léger avec puce M2',
//     colors: [
//       { name: 'Gris Sidéral', hex: '#7D7D7D', images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800'] },
//       { name: 'Argent', hex: '#E3E4E5', images: ['https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800'] },
//       { name: 'Or', hex: '#F4E5C3', images: ['https://images.unsplash.com/photo-1611078489935-0cb964de46d6?w=800'] },
//       { name: 'Minuit', hex: '#2C2C3E', images: ['https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800'] }
//     ],
//     variants: ['256GB', '512GB', '1TB', '2TB'],
//     specs: {
//       'Écran': '13.6" Liquid Retina',
//       'Processeur': 'Apple M2',
//       'RAM': '8 GB / 16 GB / 24 GB',
//       'Stockage': 'SSD 256 GB - 2 TB',
//       'Autonomie': 'Jusqu\'à 18 heures'
//     },
//     status: 'active',
//     availableStock: 45,
//     inTransitStock: 5,
//     soldCount: 34,
//     totalProducts: 84
//   }
// ];

// const CATEGORIES = [
//   'Toutes catégories',
//   'Téléphones',
//   'Tablettes',
//   'Ordinateurs',
//   'Montres connectées',
//   'Écouteurs',
//   'Accessoires'
// ];

// const BRANDS = ['Toutes marques', 'Apple', 'Samsung', 'Google', 'Xiaomi', 'Huawei'];

// // ============================================================================
// // COMPOSANT PRINCIPAL
// // ============================================================================

// const ProductModelsPage: React.FC = () => {
//   const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
//   const [isAddModalOpen, setIsAddModalOpen] = useState(false);
//   const [isDetailsOpen, setIsDetailsOpen] = useState(false);
//   const [selectedModel, setSelectedModel] = useState<ProductModel | null>(null);
  
//   const [filters, setFilters] = useState<Filters>({
//     search: '',
//     category: 'all',
//     brand: 'all',
//     priceRange: 'all',
//     sortBy: 'recent',
//     status: 'all'
//   });

//   // Filtrer les modèles
//   const filteredModels = MOCK_PRODUCT_MODELS.filter(model => {
//     if (filters.search && !model.name.toLowerCase().includes(filters.search.toLowerCase()) &&
//         !model.brand.toLowerCase().includes(filters.search.toLowerCase())) {
//       return false;
//     }
//     if (filters.category !== 'all' && model.category !== filters.category) return false;
//     if (filters.brand !== 'all' && model.brand !== filters.brand) return false;
//     if (filters.status === 'in_stock' && (model.availableStock || 0) === 0) return false;
//     if (filters.status === 'low_stock' && (model.availableStock || 0) >= 10) return false;
//     if (filters.status === 'out_of_stock' && (model.availableStock || 0) > 0) return false;
//     return true;
//   });

//   // Trier les modèles
//   const sortedModels = [...filteredModels].sort((a, b) => {
//     switch (filters.sortBy) {
//       case 'name-asc': return a.name.localeCompare(b.name);
//       case 'name-desc': return b.name.localeCompare(a.name);
//       case 'price-asc': return a.basePrice - b.basePrice;
//       case 'price-desc': return b.basePrice - a.basePrice;
//       case 'best-sellers': return (b.soldCount || 0) - (a.soldCount || 0);
//       case 'stock-low': return (a.availableStock || 0) - (b.availableStock || 0);
//       default: return 0;
//     }
//   });

//   const handleViewDetails = (model: ProductModel) => {
//     setSelectedModel(model);
//     setIsDetailsOpen(true);
//   };

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
//         <div>
//           <h2 className="text-2xl font-bold text-gray-900 mb-1">Catalogue des produits</h2>
//           <p className="text-gray-600">{sortedModels.length} modèles de produits</p>
//         </div>
//         <div className="flex gap-2">
//           <button
//             onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
//             className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
//           >
//             {viewMode === 'grid' ? (
//               <>
//                 <LayoutDashboard size={18} />
//                 <span className="hidden sm:inline">Vue liste</span>
//               </>
//             ) : (
//               <>
//                 <Package size={18} />
//                 <span className="hidden sm:inline">Vue grille</span>
//               </>
//             )}
//           </button>
//           <button 
//             onClick={() => setIsAddModalOpen(true)}
//             className="flex items-center gap-2 px-4 py-2 bg-[#800080] text-white rounded-lg hover:bg-[#6b006b]"
//           >
//             <Plus size={20} />
//             Nouveau modèle
//           </button>
//         </div>
//       </div>

//       {/* Filters */}
//       <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
//           {/* Search */}
//           <div className="lg:col-span-2">
//             <label className="block text-sm font-semibold text-gray-700 mb-2">Rechercher</label>
//             <div className="relative">
//               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
//               <input
//                 type="text"
//                 value={filters.search}
//                 onChange={(e) => setFilters({ ...filters, search: e.target.value })}
//                 placeholder="Nom du modèle, marque..."
//                 className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
//               />
//             </div>
//           </div>

//           {/* Category */}
//           <div>
//             <label className="block text-sm font-semibold text-gray-700 mb-2">Catégorie</label>
//             <select
//               value={filters.category}
//               onChange={(e) => setFilters({ ...filters, category: e.target.value })}
//               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
//             >
//               <option value="all">Toutes</option>
//               {CATEGORIES.slice(1).map(cat => (
//                 <option key={cat} value={cat}>{cat}</option>
//               ))}
//             </select>
//           </div>

//           {/* Brand */}
//           <div>
//             <label className="block text-sm font-semibold text-gray-700 mb-2">Marque</label>
//             <select
//               value={filters.brand}
//               onChange={(e) => setFilters({ ...filters, brand: e.target.value })}
//               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
//             >
//               <option value="all">Toutes</option>
//               {BRANDS.slice(1).map(brand => (
//                 <option key={brand} value={brand}>{brand}</option>
//               ))}
//             </select>
//           </div>

//           {/* Sort */}
//           <div>
//             <label className="block text-sm font-semibold text-gray-700 mb-2">Trier par</label>
//             <select
//               value={filters.sortBy}
//               onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
//               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
//             >
//               <option value="recent">Plus récents</option>
//               <option value="name-asc">Nom (A-Z)</option>
//               <option value="name-desc">Nom (Z-A)</option>
//               <option value="price-asc">Prix croissant</option>
//               <option value="price-desc">Prix décroissant</option>
//               <option value="best-sellers">Meilleures ventes</option>
//               <option value="stock-low">Stock faible</option>
//             </select>
//           </div>
//         </div>
//       </div>

//       {/* Vue conditionnelle : Grid ou List */}
//       {viewMode === 'grid' ? (
//         /* Vue Grille */
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//           {sortedModels.map(model => (
//             <div key={model.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
//               {/* Image */}
//               <div className="aspect-square bg-gradient-to-br from-gray-50 to-[#f3e8ff] p-4 relative">
//                 <img
//                   src={model.colors[0].images[0]}
//                   alt={model.name}
//                   className="w-full h-full object-contain"
//                 />
//                 {model.oldPrice && (
//                   <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
//                     -{Math.round(((model.oldPrice - model.basePrice) / model.oldPrice) * 100)}%
//                   </div>
//                 )}
//                 {(model.soldCount || 0) > 50 && (
//                   <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
//                     <TrendingUp size={12} />
//                     Best Seller
//                   </div>
//                 )}
//                 {/* Color dots */}
//                 <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
//                   {model.colors.slice(0, 4).map((color, idx) => (
//                     <div
//                       key={idx}
//                       className="w-3 h-3 rounded-full border-2 border-white shadow-sm"
//                       style={{ backgroundColor: color.hex }}
//                       title={color.name}
//                     />
//                   ))}
//                   {model.colors.length > 4 && (
//                     <div className="w-3 h-3 rounded-full border-2 border-white bg-gray-300 flex items-center justify-center text-[8px] font-bold">
//                       +{model.colors.length - 4}
//                     </div>
//                   )}
//                 </div>
//               </div>

//               <div className="p-4">
//                 <div className="flex items-start justify-between mb-2">
//                   <div className="flex-1">
//                     <p className="text-xs text-gray-500 mb-1">{model.brand}</p>
//                     <h3 className="font-semibold text-gray-900 mb-1">{model.name}</h3>
//                     <p className="text-xs text-gray-500">{model.category}</p>
//                   </div>
//                 </div>
                
//                 <div className="flex items-baseline gap-2 mb-3">
//                   <span className="text-lg font-bold text-[#800080]">{model.basePrice} €</span>
//                   {model.oldPrice && (
//                     <span className="text-sm text-gray-400 line-through">{model.oldPrice} €</span>
//                   )}
//                 </div>

//                 <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
//                   <div className="bg-green-50 rounded p-2 text-center">
//                     <p className="text-green-700 font-bold">{model.availableStock}</p>
//                     <p className="text-green-600">Dispo</p>
//                   </div>
//                   <div className="bg-blue-50 rounded p-2 text-center">
//                     <p className="text-blue-700 font-bold">{model.inTransitStock}</p>
//                     <p className="text-blue-600">Transit</p>
//                   </div>
//                   <div className="bg-gray-50 rounded p-2 text-center">
//                     <p className="text-gray-700 font-bold">{model.soldCount}</p>
//                     <p className="text-gray-600">Vendu</p>
//                   </div>
//                 </div>

//                 <button
//                   onClick={() => handleViewDetails(model)}
//                   className="w-full py-2 px-3 bg-[#f3e8ff] hover:bg-[#e9d5ff] text-[#800080] rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
//                 >
//                   <Eye size={16} />
//                   Voir les produits ({model.totalProducts})
//                 </button>
//               </div>
//             </div>
//           ))}
//         </div>
//       ) : (
//         /* Vue Liste */
//         <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Produit</th>
//                   <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Marque</th>
//                   <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Catégorie</th>
//                   <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Prix</th>
//                   <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Couleurs</th>
//                   <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Disponible</th>
//                   <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Transit</th>
//                   <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Vendu</th>
//                   <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Total</th>
//                   <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {sortedModels.map(model => (
//                   <tr key={model.id} className="border-t border-gray-100 hover:bg-gray-50">
//                     <td className="py-4 px-6">
//                       <div className="flex items-center gap-3">
//                         <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-50 to-[#f3e8ff] p-1 flex-shrink-0">
//                           <img
//                             src={model.colors[0].images[0]}
//                             alt={model.name}
//                             className="w-full h-full object-contain"
//                           />
//                         </div>
//                         <div>
//                           <p className="font-semibold text-gray-900">{model.name}</p>
//                           {(model.soldCount || 0) > 50 && (
//                             <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
//                               <TrendingUp size={10} />
//                               Best Seller
//                             </span>
//                           )}
//                         </div>
//                       </div>
//                     </td>
//                     <td className="py-4 px-6 text-sm text-gray-700">{model.brand}</td>
//                     <td className="py-4 px-6 text-sm text-gray-700">{model.category}</td>
//                     <td className="py-4 px-6">
//                       <div className="flex items-baseline gap-2">
//                         <span className="font-bold text-gray-900">{model.basePrice} €</span>
//                         {model.oldPrice && (
//                           <span className="text-xs text-gray-400 line-through">{model.oldPrice} €</span>
//                         )}
//                       </div>
//                     </td>
//                     <td className="py-4 px-6">
//                       <div className="flex gap-1">
//                         {model.colors.slice(0, 5).map((color, idx) => (
//                           <div
//                             key={idx}
//                             className="w-5 h-5 rounded-full border-2 border-gray-300"
//                             style={{ backgroundColor: color.hex }}
//                             title={color.name}
//                           />
//                         ))}
//                         {model.colors.length > 5 && (
//                           <div className="w-5 h-5 rounded-full bg-gray-200 border-2 border-gray-300 flex items-center justify-center text-[9px] font-bold text-gray-600">
//                             +{model.colors.length - 5}
//                           </div>
//                         )}
//                       </div>
//                     </td>
//                     <td className="py-4 px-6">
//                       <span className="font-semibold text-green-600">{model.availableStock}</span>
//                     </td>
//                     <td className="py-4 px-6">
//                       <span className="font-semibold text-blue-600">{model.inTransitStock}</span>
//                     </td>
//                     <td className="py-4 px-6">
//                       <span className="font-semibold text-gray-600">{model.soldCount}</span>
//                     </td>
//                     <td className="py-4 px-6">
//                       <span className="font-bold text-[#800080]">{model.totalProducts}</span>
//                     </td>
//                     <td className="py-4 px-6">
//                       <div className="flex gap-2">
//                         <button
//                           onClick={() => handleViewDetails(model)}
//                           className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
//                           title="Voir les produits"
//                         >
//                           <Eye size={16} className="text-blue-600" />
//                         </button>
//                         <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Modifier">
//                           <Edit size={16} className="text-gray-600" />
//                         </button>
//                         <button className="p-2 hover:bg-red-100 rounded-lg transition-colors" title="Supprimer">
//                           <Trash2 size={16} className="text-red-600" />
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       )}

//       {/* Empty State */}
//       {sortedModels.length === 0 && (
//         <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
//           <Package size={48} className="mx-auto text-gray-400 mb-4" />
//           <h3 className="text-lg font-bold text-gray-900 mb-2">Aucun modèle trouvé</h3>
//           <p className="text-gray-600">Essayez de modifier vos filtres ou d&apos;ajouter un nouveau modèle</p>
//         </div>
//       )}

//       {/* Modals */}
//       <AddProductModelModal
//         isOpen={isAddModalOpen}
//         onClose={() => setIsAddModalOpen(false)}
//       />

//       <ModelDetailsModal
//         isOpen={isDetailsOpen}
//         onClose={() => setIsDetailsOpen(false)}
//         model={selectedModel}
//       />
//     </div>
//   );
// };

// export default ProductModelsPage;