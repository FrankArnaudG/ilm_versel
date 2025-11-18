import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, Check, Loader2, AlertCircle, Package } from 'lucide-react';
import Image from 'next/image';

interface ProductModel {
  id: string;
  designation: string;
  brand: string;
  reference: string;
  category: string;
  colors?: Array<{
    id: string;
    images: Array<{ url: string }>;
  }>;
}

interface RecommendProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseModel: ProductModel | null;
  allModels: ProductModel[];
  onSaved: () => void;
  userId: string;
  role: string;
}

type RecommendationType = 'ACCESSORY' | 'COMPLEMENTARY' | 'UPGRADE' | 'ALTERNATIVE' | 'BUNDLE';

interface SelectedRecommendation {
  productId: string;
  relationType: RecommendationType;
  priority: number;
}

const RecommendProductsModal: React.FC<RecommendProductsModalProps> = ({
  isOpen,
  onClose,
  baseModel,
  allModels,
  onSaved,
  userId,
  role
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<SelectedRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtrer les modèles disponibles (exclure le modèle de base)
  const availableModels = useMemo(() => {
    if (!baseModel) return [];
    return allModels.filter(m => m.id !== baseModel.id);
  }, [allModels, baseModel]);

  // Modèles filtrés par recherche
  const filteredModels = useMemo(() => {
    if (!searchQuery.trim()) return availableModels;
    const query = searchQuery.toLowerCase();
    return availableModels.filter(m => 
      m.designation.toLowerCase().includes(query) ||
      m.brand.toLowerCase().includes(query) ||
      m.reference.toLowerCase().includes(query) ||
      m.category.toLowerCase().includes(query)
    );
  }, [availableModels, searchQuery]);

  // Réinitialiser quand le modal s'ouvre
  useEffect(() => {
    if (isOpen && baseModel) {
      setSearchQuery('');
      setSelectedProducts([]);
      setError(null);
    }
  }, [isOpen, baseModel]);

  const toggleProduct = (productId: string) => {
    setSelectedProducts(prev => {
      const exists = prev.find(p => p.productId === productId);
      if (exists) {
        return prev.filter(p => p.productId !== productId);
      } else {
        return [...prev, {
          productId,
          relationType: 'ACCESSORY' as RecommendationType,
          priority: 5
        }];
      }
    });
  };

  const updateRelationType = (productId: string, relationType: RecommendationType) => {
    setSelectedProducts(prev =>
      prev.map(p =>
        p.productId === productId ? { ...p, relationType } : p
      )
    );
  };

  const updatePriority = (productId: string, priority: number) => {
    setSelectedProducts(prev =>
      prev.map(p =>
        p.productId === productId ? { ...p, priority: Math.max(1, Math.min(10, priority)) } : p
      )
    );
  };

  const handleSave = async () => {
    if (!baseModel || selectedProducts.length === 0) {
      setError('Veuillez sélectionner au moins un produit à recommander');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/products/models/recommendations/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          role,
          mainProductId: baseModel.id,
          recommendations: selectedProducts
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la sauvegarde');
      }

      onSaved();
    } catch (err) {
      console.error('Erreur sauvegarde recommandations:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !baseModel) return null;

  const relationTypeLabels: Record<RecommendationType, string> = {
    ACCESSORY: '🔌 Accessoire',
    COMPLEMENTARY: '✨ Complémentaire',
    UPGRADE: '⬆️ Upgrade',
    ALTERNATIVE: '🔄 Alternative',
    BUNDLE: '📦 Pack'
  };

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Produits recommandés pour {baseModel.designation}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Sélectionnez les produits à recommander avec ce modèle
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un produit (nom, marque, référence, catégorie)..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
                />
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                <AlertCircle size={18} />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Selected products summary */}
            {selectedProducts.length > 0 && (
              <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-sm font-medium text-purple-900">
                  {selectedProducts.length} produit(s) sélectionné(s)
                </p>
              </div>
            )}

            {/* Products list */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {filteredModels.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchQuery ? 'Aucun produit trouvé' : 'Aucun produit disponible'}
                </div>
              ) : (
                filteredModels.map(model => {
                  const isSelected = selectedProducts.some(sp => sp.productId === model.id);
                  const selection = selectedProducts.find(sp => sp.productId === model.id);

                  return (
                    <div
                      key={model.id}
                      className={`border rounded-lg p-4 transition-all ${
                        isSelected
                          ? 'border-[#800080] bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleProduct(model.id)}
                          className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-[#800080] border-[#800080]'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {isSelected && <Check size={14} className="text-white" />}
                        </button>

                        {/* Product image */}
                        <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 relative">
                          {model.colors?.[0]?.images?.[0]?.url ? (
                            <Image
                              src={model.colors[0].images[0].url}
                              alt={model.designation}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Package size={24} />
                            </div>
                          )}
                        </div>

                        {/* Product info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate">
                                {model.designation}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {model.brand} • {model.category}
                              </p>
                              <p className="text-xs text-gray-400 font-mono mt-1">
                                {model.reference}
                              </p>
                            </div>
                          </div>

                          {/* Configuration (si sélectionné) */}
                          {isSelected && selection && (
                            <div className="mt-3 space-y-2 pt-3 border-t border-gray-200">
                              {/* Relation Type */}
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Type de recommandation
                                </label>
                                <select
                                  value={selection.relationType}
                                  onChange={(e) => updateRelationType(model.id, e.target.value as RecommendationType)}
                                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080]"
                                >
                                  {Object.entries(relationTypeLabels).map(([value, label]) => (
                                    <option key={value} value={value}>
                                      {label}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Priority */}
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Priorité (1-10) : {selection.priority}
                                </label>
                                <input
                                  type="range"
                                  min="1"
                                  max="10"
                                  value={selection.priority}
                                  onChange={(e) => updatePriority(model.id, parseInt(e.target.value))}
                                  className="w-full"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={loading || selectedProducts.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-[#800080] hover:bg-[#6b006b] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                `Enregistrer (${selectedProducts.length})`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecommendProductsModal;

