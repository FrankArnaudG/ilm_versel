/**
 * StockMovementModal.tsx
 * 
 * Modal pour ajouter ou ajuster le stock d'un produit
 * Permet de :
 * - Entrée de stock (réapprovisionnement, transfert, retour)
 * - Sortie de stock (transfert sortant, perte, vol)
 * - Ajustement/Correction (inventaire, erreur)
 * 
 * Emplacement: src/components/stock/StockMovementModal.tsx
 */

import React, { useState } from 'react';
import { 
  X, Check, Plus, TrendingDown, RefreshCw, AlertTriangle, 
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

interface StockMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  store: Store | null;
}

interface FormData {
  type: 'in' | 'out' | 'adjustment';
  quantity: string;
  reason: string;
  reference: string;
  notes: string;
}

interface MovementType {
  value: 'in' | 'out' | 'adjustment';
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}

// ============================================================================
// CONSTANTES
// ============================================================================

const MOVEMENT_TYPES: MovementType[] = [
  { 
    value: 'in', 
    label: 'Entrée de stock', 
    icon: Plus, 
    color: 'text-green-600', 
    bg: 'bg-green-50' 
  },
  { 
    value: 'out', 
    label: 'Sortie de stock', 
    icon: TrendingDown, 
    color: 'text-red-600', 
    bg: 'bg-red-50' 
  },
  { 
    value: 'adjustment', 
    label: 'Ajustement/Correction', 
    icon: RefreshCw, 
    color: 'text-orange-600', 
    bg: 'bg-orange-50' 
  }
];

const REASONS = {
  in: [
    'Réapprovisionnement fournisseur',
    'Transfert entrant',
    'Retour client',
    'Production interne',
    'Autre'
  ],
  out: [
    'Transfert sortant',
    'Produit défectueux',
    'Perte/Vol',
    'Démonstration',
    'Autre'
  ],
  adjustment: [
    'Correction inventaire',
    'Erreur de saisie',
    'Produit endommagé',
    'Régularisation',
    'Autre'
  ]
};

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

const StockMovementModal: React.FC<StockMovementModalProps> = ({ 
  isOpen, 
  onClose, 
  product, 
  store 
}) => {
  const [formData, setFormData] = useState<FormData>({
    type: 'in',
    quantity: '',
    reason: '',
    reference: '',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const currentStock = product?.stores?.find(s => s.storeId === store?.id)?.stock || 0;
    const quantity = parseInt(formData.quantity);
    const adjustedQuantity = formData.type === 'out' || (formData.type === 'adjustment' && quantity < 0)
      ? -Math.abs(quantity) 
      : Math.abs(quantity);
    
    const movementData = {
      ...formData,
      productId: product?.id,
      productName: product?.name,
      storeId: store?.id,
      storeName: store?.name,
      previousStock: currentStock,
      newStock: currentStock + adjustedQuantity,
      quantity: adjustedQuantity,
      performedBy: {
        name: 'Current User', // TODO: Remplacer par l'utilisateur connecté
        role: 'Manager',
        email: 'user@ilovemobile.fr'
      },
      date: new Date().toISOString()
    };

    console.log('Stock Movement:', movementData);
    // TODO: Appel API vers Laravel
    onClose();
  };

  if (!isOpen || !product || !store) return null;

  const selectedType = MOVEMENT_TYPES.find(t => t.value === formData.type);
  const TypeIcon = selectedType?.icon || Plus;
  const currentStock = product.stores?.find(s => s.storeId === store.id)?.stock || 0;
  const quantity = parseInt(formData.quantity) || 0;
  const newStock = formData.type === 'out' 
    ? currentStock - Math.abs(quantity)
    : currentStock + Math.abs(quantity);

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative bg-white rounded-2xl max-w-2xl w-full shadow-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#800080] to-[#9333ea] px-8 py-6 text-white rounded-t-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Mouvement de stock</h2>
                <p className="text-purple-100 text-sm">{product.name}</p>
                <p className="text-purple-200 text-xs mt-1">{store.name}</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8">
            {/* Current Stock Display */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700 font-semibold mb-1">Stock actuel</p>
                  <p className="text-3xl font-bold text-blue-900">{currentStock}</p>
                </div>
                {formData.quantity && (
                  <div className="text-right">
                    <p className="text-sm text-blue-700 font-semibold mb-1">Nouveau stock</p>
                    <p className={`text-3xl font-bold ${
                      newStock < 0 ? 'text-red-600' : 
                      newStock > currentStock ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {newStock}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Movement Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Type de mouvement <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {MOVEMENT_TYPES.map(type => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: type.value, reason: '' })}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        formData.type === type.value
                          ? `border-[#800080] ${type.bg} ring-2 ring-[#800080] ring-offset-2`
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon size={24} className={`mx-auto mb-2 ${formData.type === type.value ? type.color : 'text-gray-400'}`} />
                      <p className={`text-sm font-semibold text-center ${
                        formData.type === type.value ? 'text-gray-900' : 'text-gray-600'
                      }`}>
                        {type.label}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              {/* Quantity */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Quantité <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <TypeIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
                    placeholder="Entrez la quantité"
                    required
                  />
                </div>
                {newStock < 0 && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertTriangle size={12} />
                    Attention : stock négatif !
                  </p>
                )}
              </div>

              {/* Reference */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Référence
                </label>
                <input
                  type="text"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
                  placeholder="N° bon de livraison, facture..."
                />
              </div>
            </div>

            {/* Reason */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Motif <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
                required
              >
                <option value="">Sélectionnez un motif</option>
                {REASONS[formData.type]?.map(reason => (
                  <option key={reason} value={reason}>{reason}</option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Notes / Commentaires
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080] resize-none"
                placeholder="Informations complémentaires..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-6 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 py-3 px-6 bg-[#800080] text-white rounded-lg font-semibold hover:bg-[#6b006b] flex items-center justify-center gap-2"
              >
                <Check size={20} />
                Valider le mouvement
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StockMovementModal;