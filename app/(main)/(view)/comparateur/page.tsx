'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, Plus, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useComparator } from '../../contexts/ComparatorContext';
// import { useCurrentUser } from '@/ts/hooks/use-current-user';
// import { v4 as uuidv4 } from 'uuid';

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  reference: string;
  description?: string;
  image: string;
  price: number;
  oldPrice?: number;
  rating?: string;
  totalReviews?: number;
  specifications?: Record<string, string | number | boolean>;
}

export default function ComparatorPage() {
  const router = useRouter();
  const { products, addProduct, removeProduct, clearProducts } = useComparator();
  // const user = useCurrentUser();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  // const [comparisonSaved, setComparisonSaved] = useState(false);
  // const lastSavedProductIdsRef = useRef<string>('');
  // const [sessionId] = useState(() => {
  //   if (typeof window !== 'undefined') {
  //     let id = localStorage.getItem('sessionId');
  //     if (!id) {
  //       id = uuidv4();
  //       localStorage.setItem('sessionId', id);
  //     }
  //     return id;
  //   }
  //   return uuidv4();
  // });

  // Ne plus sauvegarder automatiquement - uniquement manuellement via le bouton "Enregistrer la comparaison"
  // Cela évite les sauvegardes multiples quand on ouvre la page comparateur

  // const saveComparison = async () => {
  //   if (products.length === 0) return;

  //   // Vérifier si cette combinaison de produits a déjà été sauvegardée
  //   const currentProductIds = JSON.stringify(products.map(p => p.id).sort());
  //   const savedComparisonsKey = 'savedComparisons';
    
  //   // Récupérer les comparaisons déjà sauvegardées depuis localStorage
  //   let savedComparisons: string[] = [];
  //   if (typeof window !== 'undefined') {
  //     const saved = localStorage.getItem(savedComparisonsKey);
  //     if (saved) {
  //       try {
  //         savedComparisons = JSON.parse(saved);
  //       } catch (e) {
  //         savedComparisons = [];
  //       }
  //     }
  //   }
    
  //   // Vérifier si cette combinaison a déjà été sauvegardée
  //   if (savedComparisons.includes(currentProductIds)) {
  //     // Cette combinaison a déjà été sauvegardée, ne pas sauvegarder à nouveau
  //     setComparisonSaved(true);
  //     setTimeout(() => setComparisonSaved(false), 3000);
  //     return;
  //   }

  //   try {
  //     const response = await fetch('/api/comparisons', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         productIds: products.map(p => p.id),
  //         sessionId,
  //       }),
  //     });

  //     if (response.ok) {
  //       setComparisonSaved(true);
  //       lastSavedProductIdsRef.current = currentProductIds;
        
  //       // Ajouter cette combinaison à la liste des comparaisons sauvegardées
  //       savedComparisons.push(currentProductIds);
  //       if (typeof window !== 'undefined') {
  //         localStorage.setItem(savedComparisonsKey, JSON.stringify(savedComparisons));
  //       }
        
  //       setTimeout(() => setComparisonSaved(false), 3000);
  //     }
  //   } catch (error) {
  //     console.error('Error saving comparison:', error);
  //   }
  // };

  const handleSearch = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.products);
      }
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (searchQuery) {
        handleSearch(searchQuery);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleAddProduct = (product: Product) => {
    addProduct(product);
    setSearchQuery('');
    setSearchResults([]);
    setShowSearch(false);
  };

  // Extraire les spécifications communes pour la comparaison
  const getCommonSpecs = () => {
    if (products.length === 0) return [];

    const allSpecs = products.map(p => p.specifications || {});
    const specKeys = new Set<string>();
    
    allSpecs.forEach(specs => {
      if (specs && typeof specs === 'object') {
        Object.keys(specs).forEach(key => specKeys.add(key));
      }
    });

    return Array.from(specKeys);
  };

  const commonSpecs = getCommonSpecs();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Comparateur de produits</h1>
              <p className="text-gray-600 mt-1">
                Comparez jusqu&apos;à 3 produits pour trouver celui qui vous convient le mieux
              </p>
            </div>
          </div>
          {/* {comparisonSaved && (
            <div className="flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-lg">
              <Check size={20} />
              <span>Comparaison enregistrée</span>
            </div>
          )} */}
        </div>

        {/* Search Bar */}
        {(products.length < 3 || showSearch) && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSearch(true)}
                  placeholder="Rechercher un produit à ajouter au comparateur..."
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              {showSearch && (
                <button
                  onClick={() => {
                    setShowSearch(false);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="px-4 py-3 text-gray-600 hover:text-gray-800"
                >
                  Annuler
                </button>
              )}
            </div>

            {/* Search Results */}
            {showSearch && searchResults.length > 0 && (
              <div className="mt-4 max-h-96 overflow-y-auto">
                <div className="grid gap-2">
                  {searchResults.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleAddProduct(product)}
                      disabled={products.some(p => p.id === product.id)}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="w-16 h-16 flex-shrink-0 bg-white rounded-lg overflow-hidden">
                        <Image
                          src={product.image}
                          alt={product.name}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{product.name}</h4>
                        <p className="text-sm text-gray-600">{product.category} de marque {product.brand} </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#800080]">{product.price.toFixed(2)} €</p>
                        {/* {product.oldPrice && product.oldPrice > 0 && (
                          <p className="text-sm text-gray-400 line-through">{product.oldPrice.toFixed(2)} €</p>
                        )} */}
                      </div>
                      {products.some(p => p.id === product.id) ? (
                        <span className="text-green-600 font-medium">Ajouté</span>
                      ) : (
                        <Plus size={20} className="text-[#800080]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {showSearch && searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
              <div className="mt-4 text-center py-8 text-gray-500">
                Aucun produit trouvé pour &quot;{searchQuery}&quot;
              </div>
            )}

            {isSearching && (
              <div className="mt-4 text-center py-8 text-gray-500">
                Recherche en cours...
              </div>
            )}
          </div>
        )}

        {/* Comparison View */}
        {products.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search size={40} className="text-[#800080]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Aucun produit à comparer</h2>
              <p className="text-gray-600 mb-6">
                Utilisez la barre de recherche ci-dessus pour ajouter jusqu&apos;à 3 produits à comparer.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {/* Products Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 border-b">
              {products.map((product) => (
                <div key={product.id} className="relative">
                  <button
                    onClick={() => removeProduct(product.id)}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-[#6b006b] text-white rounded-full flex items-center justify-center hover:bg-[#800080] transition-colors z-10"
                  >
                    <X size={16} />
                  </button>
                  <div className="text-center">
                    <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden mb-4 flex items-center justify-center p-4">
                      <Image
                        src={product.image}
                        alt={product.name}
                        width={200}
                        height={200}
                        className="w-auto h-auto max-w-full max-h-full object-contain"
                      />
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 mb-1">{product.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">{product.brand} • {product.category}</p>
                    <div className="mb-2">
                      <span className="text-2xl font-bold text-[#800080]">{product.price.toFixed(2)} €</span>
                      {product.oldPrice && product.oldPrice > 0 && (
                        <span className="ml-2 text-sm text-gray-400 line-through">
                          {product.oldPrice.toFixed(2)} €
                        </span>
                      )}
                    </div>
                    {product.rating && (
                      <div className="flex items-center justify-center gap-1 text-sm">
                        <span className="text-yellow-500">⭐</span>
                        <span className="font-medium">{product.rating}/5</span>
                        <span className="text-gray-500">({product.totalReviews || 2})</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Add More Button */}
              {products.length < 3 && (
                <button
                  onClick={() => setShowSearch(true)}
                  className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
                >
                  <Plus size={48} className="text-gray-400 mb-2" />
                  <span className="text-gray-600 font-medium">Ajouter un produit</span>
                </button>
              )}
            </div>

            {/* Specifications Comparison */}
            {commonSpecs.length > 0 && (
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Comparaison des caractéristiques</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Caractéristique</th>
                        {products.map((product) => (
                          <th key={product.id} className="py-3 px-4 text-center font-semibold text-gray-700">
                            {product.brand}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {commonSpecs.map((spec, index) => (
                        <tr key={spec} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                          <td className="py-3 px-4 font-medium text-gray-900">{spec}</td>
                          {products.map((product) => (
                            <td key={product.id} className="py-3 px-4 text-center text-gray-700">
                              {product.specifications?.[spec] || '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                      
                      {/* Price Row */}
                      <tr className="bg-purple-50 font-semibold">
                        <td className="py-3 px-4 text-gray-900">Prix</td>
                        {products.map((product) => (
                          <td key={product.id} className="py-3 px-4 text-center text-[#800080]">
                            {product.price.toFixed(2)} €
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="p-6 bg-gray-50 flex gap-4">
              <button
                onClick={clearProducts}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Effacer tout
              </button>
              {/* <button
                onClick={saveComparison}
                className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                Enregistrer la comparaison
              </button> */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


