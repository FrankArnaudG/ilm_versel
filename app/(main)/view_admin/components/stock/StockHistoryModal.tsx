/**
 * StockHistoryModal.tsx
 * 
 * Modal affichant l'historique complet des mouvements de stock
 * pour un produit spécifique (global ou par boutique)
 * 
 * Emplacement: src/components/stock/StockHistoryModal.tsx
 */

import React from 'react';
import { 
  X, Download, Clock, TrendingUp, TrendingDown, Send, RefreshCw, 
  ShoppingBag, Package2, User, AlertCircle, ChevronRight
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface Product {
  id: number;
  name: string;
  category?: string;
  stores?: Array<{
    storeId: number;
    storeName: string;
    stock: number;
  }>;
}

interface Store {
  id: number;
  name: string;
  city?: string;
  country?: string;
}

interface StockMovement {
  id: string;
  modelId: number;
  modelName: string;
  color?: string;
  storage?: string;
  storeId: number;
  storeName: string;
  type: 'in' | 'out' | 'transfer_in' | 'transfer_out' | 'adjustment' | 'sale' | 'return';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  reference?: string;
  date: string;
  performedBy: {
    name: string;
    role: string;
    email: string;
  };
  transferTo?: {
    storeId: number;
    storeName: string;
  };
  saleInfo?: {
    customer: string;
    orderId: string;
    amount: number;
  };
  notes?: string;
}

interface StockHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  store: Store | null; // Si null, affiche l'historique global
}

// ============================================================================
// MOCK DATA (À remplacer par appel API)
// ============================================================================

const MOCK_MOVEMENTS: StockMovement[] = [
  {
    id: 'MVT-001',
    modelId: 1,
    modelName: 'iPhone 15 Pro Max',
    color: 'Titane Noir',
    storage: '256GB',
    storeId: 1,
    storeName: 'I Love Mobile Paris',
    type: 'in',
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
    type: 'out',
    quantity: -2,
    previousStock: 12,
    newStock: 10,
    reason: 'Transfert sortant',
    reference: 'TR-001',
    transferTo: {
      storeId: 2,
      storeName: 'I Love Mobile Lyon'
    },
    performedBy: {
      name: 'Marie Martin',
      role: 'Manager',
      email: 'marie.martin@ilovemobile.fr'
    },
    date: '2025-10-10T09:00:00',
    notes: 'Client en attente à Lyon'
  },
  {
    id: 'MVT-003',
    modelId: 1,
    modelName: 'iPhone 15 Pro Max',
    color: 'Titane Bleu',
    storage: '512GB',
    storeId: 2,
    storeName: 'I Love Mobile Lyon',
    type: 'sale',
    quantity: -1,
    previousStock: 5,
    newStock: 4,
    reason: 'Vente client',
    reference: 'VTE-001',
    saleInfo: {
      customer: 'Sophie Laurent',
      orderId: 'CMD-2503',
      amount: 1399
    },
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
// FONCTIONS UTILITAIRES
// ============================================================================

const getMovementIcon = (type: StockMovement['type']) => {
  const icons = {
    in: { icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100' },
    out: { icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-100' },
    transfer_in: { icon: Send, color: 'text-blue-600', bg: 'bg-blue-100' },
    transfer_out: { icon: Send, color: 'text-purple-600', bg: 'bg-purple-100' },
    adjustment: { icon: RefreshCw, color: 'text-orange-600', bg: 'bg-orange-100' },
    sale: { icon: ShoppingBag, color: 'text-gray-600', bg: 'bg-gray-100' },
    return: { icon: Package2, color: 'text-indigo-600', bg: 'bg-indigo-100' }
  };
  return icons[type] || icons.adjustment;
};

const getMovementLabel = (type: StockMovement['type']) => {
  const labels = {
    in: 'Entrée',
    out: 'Sortie',
    transfer_in: 'Transfert entrant',
    transfer_out: 'Transfert sortant',
    adjustment: 'Ajustement',
    sale: 'Vente',
    return: 'Retour'
  };
  return labels[type] || type;
};

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

const StockHistoryModal: React.FC<StockHistoryModalProps> = ({ 
  isOpen, 
  onClose, 
  product, 
  store 
}) => {
  if (!isOpen || !product) return null;

  // Filtrer les mouvements pour ce produit et cette boutique
  const movements = MOCK_MOVEMENTS.filter(m => 
    m.modelId === product.id && (!store || m.storeId === store.id)
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const currentStock = store 
    ? product.stores?.find(s => s.storeId === store.id)?.stock || 0
    : product.stores?.reduce((sum, s) => sum + s.stock, 0) || 0;

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-[#800080] to-[#9333ea] px-8 py-6 text-white z-10">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Historique des mouvements</h2>
                <p className="text-purple-100">{product.name}</p>
                <p className="text-purple-200 text-sm mt-1">
                  {store ? store.name : 'Toutes les boutiques'}
                </p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Current Stock Summary */}
            <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-purple-100 text-xs mb-1">Stock actuel</p>
                  <p className="text-2xl font-bold">{currentStock}</p>
                </div>
                <div>
                  <p className="text-purple-100 text-xs mb-1">Total entrées</p>
                  <p className="text-2xl font-bold text-green-300">
                    +{movements.filter(m => m.quantity > 0).reduce((sum, m) => sum + m.quantity, 0)}
                  </p>
                </div>
                <div>
                  <p className="text-purple-100 text-xs mb-1">Total sorties</p>
                  <p className="text-2xl font-bold text-red-300">
                    {movements.filter(m => m.quantity < 0).reduce((sum, m) => sum + m.quantity, 0)}
                  </p>
                </div>
                <div>
                  <p className="text-purple-100 text-xs mb-1">Mouvements</p>
                  <p className="text-2xl font-bold">{movements.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="p-8 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 240px)' }}>
            {movements.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Clock size={48} className="mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">Aucun mouvement</h3>
                <p>Aucun historique de mouvement pour ce produit</p>
              </div>
            ) : (
              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                {/* Movements */}
                <div className="space-y-6">
                  {movements.map((movement) => {
                    const config = getMovementIcon(movement.type);
                    const Icon = config.icon;
                    const isIncrease = movement.quantity > 0;

                    return (
                      <div key={movement.id} className="relative pl-20">
                        {/* Timeline Dot */}
                        <div className={`absolute left-6 top-4 w-6 h-6 rounded-full ${config.bg} border-4 border-white flex items-center justify-center shadow-lg`}>
                          <Icon size={12} className={config.color} />
                        </div>

                        {/* Movement Card */}
                        <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-[#800080] transition-all shadow-sm">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${config.bg} ${config.color}`}>
                                  {getMovementLabel(movement.type)}
                                </span>
                                <span className={`text-lg font-bold ${isIncrease ? 'text-green-600' : 'text-red-600'}`}>
                                  {isIncrease ? '+' : ''}{movement.quantity}
                                </span>
                              </div>
                              <h4 className="font-bold text-gray-900 text-lg mb-1">{movement.reason}</h4>
                              {movement.reference && (
                                <p className="text-sm text-gray-600">Réf: {movement.reference}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-500 mb-1">
                                {new Date(movement.date).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric'
                                })}
                              </p>
                              <p className="text-xs text-gray-400">
                                {new Date(movement.date).toLocaleTimeString('fr-FR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>

                          {/* Stock Change */}
                          <div className="bg-gray-50 rounded-lg p-4 mb-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs text-gray-600 mb-1">Stock avant</p>
                                <p className="text-2xl font-bold text-gray-900">{movement.previousStock}</p>
                              </div>
                              <div className="flex-1 flex items-center justify-center">
                                <div className="flex items-center gap-2">
                                  <div className="w-12 h-0.5 bg-gray-300"></div>
                                  <ChevronRight className={isIncrease ? 'text-green-600' : 'text-red-600'} size={20} />
                                  <div className="w-12 h-0.5 bg-gray-300"></div>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-gray-600 mb-1">Stock après</p>
                                <p className={`text-2xl font-bold ${isIncrease ? 'text-green-600' : movement.newStock < movement.previousStock ? 'text-red-600' : 'text-gray-900'}`}>
                                  {movement.newStock}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Additional Info */}
                          <div className="grid grid-cols-2 gap-4">
                            {/* Performed By */}
                            <div className="bg-blue-50 rounded-lg p-3">
                              <p className="text-xs text-blue-700 font-semibold mb-2 flex items-center gap-1">
                                <User size={12} />
                                Effectué par
                              </p>
                              <p className="font-semibold text-gray-900 text-sm">{movement.performedBy.name}</p>
                              <p className="text-xs text-gray-600">{movement.performedBy.role}</p>
                            </div>

                            {/* Transfer Info */}
                            {movement.transferTo && (
                              <div className="bg-purple-50 rounded-lg p-3">
                                <p className="text-xs text-purple-700 font-semibold mb-2 flex items-center gap-1">
                                  <Send size={12} />
                                  Transfert vers
                                </p>
                                <p className="font-semibold text-gray-900 text-sm">{movement.transferTo.storeName}</p>
                              </div>
                            )}

                            {/* Sale Info */}
                            {movement.saleInfo && (
                              <div className="bg-green-50 rounded-lg p-3">
                                <p className="text-xs text-green-700 font-semibold mb-2 flex items-center gap-1">
                                  <ShoppingBag size={12} />
                                  Vente
                                </p>
                                <p className="font-semibold text-gray-900 text-sm">{movement.saleInfo.customer}</p>
                                <p className="text-xs text-gray-600">{movement.saleInfo.amount} €</p>
                              </div>
                            )}
                          </div>

                          {/* Notes */}
                          {movement.notes && (
                            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                              <p className="text-xs text-yellow-800 font-semibold mb-1 flex items-center gap-1">
                                <AlertCircle size={12} />
                                Notes
                              </p>
                              <p className="text-sm text-gray-700">{movement.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-8 py-4">
            <div className="flex justify-between items-center">
              <button
                onClick={onClose}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
              >
                Fermer
              </button>
              <button className="px-6 py-3 bg-[#800080] text-white rounded-lg font-semibold hover:bg-[#6b006b] flex items-center gap-2">
                <Download size={20} />
                Exporter l&apos;historique
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockHistoryModal;