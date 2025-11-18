'use client';

import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, X, Check, Star, Grid3x3, List, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useLocation, DEFAULT_LOCATION } from '../../contexts/LocationContext';
import { Navbar } from '../../components/Navbar';
import { useComparator } from '../../../contexts/ComparatorContext';
import { useCurrentUser } from '@/ts/hooks/use-current-user';

// Interfaces (mêmes que dans la page de catégorie)
interface ProductModel {
  id: string;
  designation: string;
  brand: string;
  reference: string;
  category: string;
  family?: string;
  subFamily?: string;
  description?: string;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'DESTOCKING_ACTIVE' | 'DESTOCKING_END_OF_LIFE' | 'INACTIVE';
  specifications?: Record<string, string | number | boolean>;
  createdById?: string;
  createdAt: Date;
  updatedAt: Date;
  averageRating?: number | null;
  totalReviews?: number;
  colors?: ProductColor[];
  variants?: ProductVariant[];
  articles?: Article[];
}

interface Article {
  id: string;
  articleNumber: string;
  articleReference: string;
  modelReference: string;
  description?: string;
  useFCFA: boolean;
  pvTTC: string;
  pamp: string;
  oldPrice: string;
  tva: string;
  margin: string;
  pvTTC_FCFA: string;
  pamp_FCFA: string;
  oldPrice_FCFA: string;
  marginFCFA: string;
  marginPercent: string;
  status: 'DRAFT' | 'IN_STOCK' | 'IN_TRANSIT' | 'SOLD' | 'RESERVED' | 'DEFECTIVE' | 'STOLEN' | 'RETURNED' | 'LOST';
  articleCondition: 'NEW' | 'LIKE_NEW' | 'REFURBISHED';
  specifications?: Record<string, string | number | boolean>;
  receivedDate: Date;
  soldDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  modelId: string;
  storeId: string;
  entryId: string;
  supplierId: string;
  colorId?: string;
  model?: ProductModel;
  store?: Store;
  entry?: StockEntry;
  supplier?: Supplier;
  color?: ProductColor;
}

interface ProductColor {
  id: string;
  colorName: string;
  hexaColor: string;
  modelId: string;
  createdAt: Date;
  images?: ProductImage[];
  articles?: Article[];
}

interface ProductImage {
  id: string;
  url: string;
  fileName?: string;
  displayOrder: number;
  colorId: string;
  createdAt: Date;
}

interface ProductVariant {
  id: string;
  variantReference: string;
  modelId: string;
  storeId: string;
  colorId?: string;
  variantAttribute: string | null;
  attributeType: 'STORAGE_RAM' | 'SIZE' | 'CAPACITY' | 'CONNECTOR' | 'MEMORY' | 'NONE' | null;
  useFCFA: boolean;
  pvTTC: number;
  pamp: number;
  oldPrice: number;
  margin: number;
  tva: number;
  pvTTC_FCFA: number;
  pamp_FCFA: number;
  oldPrice_FCFA: number;
  marginFCFA: number;
  marginPercent: number;
  totalStock: number;
  availableStock: number;
  reservedStock: number;
  soldStock: number;
  createdAt: Date;
  updatedAt: Date;
  store?: {
    id: string;
    name: string;
    code: string;
    city: string;
  };
  color?: {
    id: string;
    colorName: string;
    hexaColor: string;
  };
}

interface Store {
  id: string;
  code: string;
  name: string;
  country: string;
  city: string;
  department: string;
  address: string;
  phone?: string;
  email?: string;
  currency: string;
  timezone: string;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  openingDate?: Date;
  company?: string;
  managerId?: string;
  createdById?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Supplier {
  id: string;
  name: string;
  contactName: string;
  phone?: string;
  email?: string;
  address?: string;
  country?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface StockEntry {
  id: string;
  storeId: string;
  supplierId: string;
  documentFile: string;
  documentType: string;
  documentRefs: string;
  purchaseDate: Date;
  receivedDate: Date;
  importSource: 'MANUAL' | 'EXCEL' | 'API';
  excelFileName?: string;
  totalArticles: number;
  status: 'PENDING' | 'VALIDATED' | 'COMPLETED' | 'PARTIAL';
  createdById: string;
  validatedById?: string;
  validatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface FilterState {
  priceRange: string[];
  storage: string[];
  color: string[];
  condition: string[];
  range: string[];
  ram: string[];
}

const StorePage = () => {
  const [selectedFilters, setSelectedFilters] = useState<FilterState>({
    priceRange: [],
    storage: [],
    color: [],
    condition: [],
    range: [],
    ram: []
  });
  const [sortBy, setSortBy] = useState('featured');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productModel, setProductModel] = useState<ProductModel[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [locationNotification, setLocationNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locality = params.locality as string;
  const { selectedLocation, setSelectedLocation, allLocations, isInitialized } = useLocation();
  const user = useCurrentUser();
  const { addProduct: addToComparator, products: comparatorProducts, removeProduct: removeFromComparator } = useComparator();

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Récupérer le terme de recherche depuis l'URL
  useEffect(() => {
    const query = searchParams.get('q') || '';
    setSearchQuery(query);
  }, [searchParams]);

  const filters = {
    priceRange: [
      { id: 'under500', label: 'Moins de 500€', min: 0, max: 500 },
      { id: '500-800', label: '500€ - 800€', min: 500, max: 800 },
      { id: '800-1200', label: '800€ - 1200€', min: 800, max: 1200 },
      { id: 'over1200', label: 'Plus de 1200€', min: 1200, max: 9999 }
    ],
    range: [
      { id: 'entry', label: 'Entrée de gamme', maxPrice: 700 },
      { id: 'mid', label: 'Moyenne gamme', minPrice: 700, maxPrice: 1100 },
      { id: 'high', label: 'Haut de gamme', minPrice: 1100 }
    ],
    storage: ['64 GB', '128 GB', '256 GB', '512 GB', '1 TB'],
    ram: ['4 GB', '6 GB', '8 GB'],
    color: [
      { name: 'Noir', hex: '#1a1a1a' },
      { name: 'Blanc', hex: '#f5f5f5' },
      { name: 'Bleu', hex: '#3b82f6' },
      { name: 'Rose', hex: '#ec4899' },
      { name: 'Violet', hex: '#8b5cf6' },
      { name: 'Vert', hex: '#10b981' },
      { name: 'Or', hex: '#fbbf24' },
      { name: 'Titane', hex: '#9ca3af' }
    ],
    condition: ['Neuf', 'Reconditionné', 'Occasion'],
  };

  const toggleFilter = (category: keyof FilterState, value: string) => {
    setSelectedFilters(prev => {
      const current = prev[category];
      const isSelected = current.includes(value);
      return {
        ...prev,
        [category]: isSelected 
          ? current.filter(item => item !== value)
          : [...current, value]
      };
    });
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSelectedFilters({
      priceRange: [],
      storage: [],
      color: [],
      condition: [],
      range: [],
      ram: []
    });
    setCurrentPage(1);
  };

  // Fonction pour ajouter/retirer du comparateur
  const toggleCompare = (model: ProductModel) => {
    const isSelected = comparatorProducts.some(p => p.id === model.id);
    
    if (isSelected) {
      removeFromComparator(model.id);
      showNotification(`${model.designation} retiré du comparateur`, 'info');
      return;
    }
    
    if (comparatorProducts.length >= 3) {
      showNotification('Vous ne pouvez comparer que 3 produits maximum', 'error');
      return;
    }
    
    const prices = model.variants?.map(v => parseFloat(v.pvTTC.toString())) || [];
    const price = prices.length > 0 ? Math.min(...prices) : 0;
    const oldPrices = model.variants?.map(v => parseFloat(v.oldPrice.toString())).filter(p => p > 0) || [];
    const oldPrice = oldPrices.length > 0 ? Math.min(...oldPrices) : undefined;
    const firstImage = model.colors?.[0]?.images?.[0]?.url || '/placeholder.jpg';
    
    const formattedProduct = {
      id: model.id,
      name: model.designation,
      brand: model.brand,
      category: model.category,
      image: firstImage,
      price,
      oldPrice,
      rating: model.averageRating?.toString(),
      reviews: model.totalReviews?.toString(),
      specifications: model.specifications || {},
    };
    
    addToComparator(formattedProduct);
    showNotification(`${model.designation} ajouté au comparateur!`, 'success');
  };

  const getFilteredProducts = () => {
    return productModel.filter(model => {
      // Filtrage par prix
      if (selectedFilters.priceRange.length > 0) {
        const minArticlePrice = model.articles && model.articles.length > 0
          ? Math.min(...model.articles.map(a => parseFloat(a.pvTTC)))
          : 0;
        
        const matchesPrice = selectedFilters.priceRange.some(rangeId => {
          const range = filters.priceRange.find(r => r.id === rangeId);
          return range && minArticlePrice >= range.min && minArticlePrice <= range.max;
        });
        if (!matchesPrice) return false;
      }

      // Filtrage par gamme
      if (selectedFilters.range.length > 0) {
        const matchesRange = selectedFilters.range.some(rangeId => {
          if (rangeId === 'entry') {
            return model.subFamily === 'Bas de gamme' || model.subFamily?.toLowerCase().includes('entrée');
          } else if (rangeId === 'mid') {
            return model.subFamily === 'Moyenne gamme' || model.subFamily?.toLowerCase().includes('moyenne');
          } else if (rangeId === 'high') {
            return model.subFamily === 'Haut de gamme' || model.subFamily?.toLowerCase().includes('haut');
          }
          return false;
        });
        if (!matchesRange) return false;
      }

      // Filtrage par stockage
      if (selectedFilters.storage.length > 0) {
        const hasStorage = model.variants?.some(variant => {
          if (!variant.variantAttribute) return false;
          const normalizedStorage = variant.variantAttribute.toUpperCase().replace(/\s+/g, '').trim();
          return selectedFilters.storage.some(filterStorage => {
            const normalizedFilter = filterStorage.toUpperCase().replace(/\s+/g, '').trim();
            return normalizedStorage === normalizedFilter || 
                  normalizedStorage.includes(normalizedFilter) ||
                  normalizedFilter.includes(normalizedStorage);
          });
        });
        if (!hasStorage) return false;
      }

      // Filtrage par couleur
      if (selectedFilters.color.length > 0) {
        const hasColor = model.colors?.some(color => {
          const normalizedColorName = color.colorName.toLowerCase().trim();
          return selectedFilters.color.some(filterColor => {
            const normalizedFilter = filterColor.toLowerCase().trim();
            return normalizedColorName === normalizedFilter;
          });
        });
        if (!hasColor) return false;
      }

      // Filtrage par condition
      if (selectedFilters.condition.length > 0) {
        const hasCondition = model.articles?.some(article => {
          const condition = article.articleCondition === 'NEW' ? 'Neuf'
            : article.articleCondition === 'REFURBISHED' ? 'Reconditionné'
            : 'Occasion';
          return selectedFilters.condition.includes(condition);
        });
        if (!hasCondition) return false;
      }

      return true;
    });
  };

  const getSortedProducts = (products: ProductModel[]) => {
    const sorted = [...products];
    
    switch(sortBy) {
      case 'price-low':
        return sorted.sort((a, b) => {
          const priceA = a.articles?.[0]?.pvTTC ? parseFloat(a.articles[0].pvTTC) : 0;
          const priceB = b.articles?.[0]?.pvTTC ? parseFloat(b.articles[0].pvTTC) : 0;
          return priceA - priceB;
        });
      case 'price-high':
        return sorted.sort((a, b) => {
          const priceA = a.articles?.[0]?.pvTTC ? parseFloat(a.articles[0].pvTTC) : 0;
          const priceB = b.articles?.[0]?.pvTTC ? parseFloat(b.articles[0].pvTTC) : 0;
          return priceB - priceA;
        });
      case 'name':
        return sorted.sort((a, b) => a.designation.localeCompare(b.designation));
      default:
        return sorted;
    }
  };

  // Pagination
  const filteredProducts = getFilteredProducts();
  const sortedProducts = getSortedProducts(filteredProducts);
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = sortedProducts.slice(startIndex, startIndex + itemsPerPage);

  // Vérification et changement de localité
  useEffect(() => {
    if (!isInitialized || !locality) return;

    const decodedLocality = decodeURIComponent(locality);
    
    if (selectedLocation?.name !== decodedLocality) {
      const foundLocation = allLocations.find(loc => loc.name === decodedLocality);
      
      if (foundLocation) {
        setSelectedLocation(foundLocation, user?.id);
        setLocationNotification({
          message: `Localité changée vers ${foundLocation.name}`,
          type: 'success'
        });
        setTimeout(() => setLocationNotification(null), 3000);
      } else {
        const redirectLocation = selectedLocation || DEFAULT_LOCATION;
        router.replace(`/${redirectLocation.name}/boutique${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''}`);
        setLocationNotification({
          message: `Localité invalide. Redirection vers ${redirectLocation.name}`,
          type: 'error'
        });
        setTimeout(() => setLocationNotification(null), 3000);
      }
    }
  }, [locality, selectedLocation, allLocations, setSelectedLocation, isInitialized, router, user?.id, searchQuery]);

  // Chargement des produits
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        // Récupérer directement le paramètre de recherche depuis l'URL
        const queryFromUrl = searchParams.get('q') || '';
        const queryToUse = queryFromUrl || searchQuery;
        
        // Utiliser la route de recherche qui gère aussi le cas sans query
        const apiUrl = `/api/produits/${locality}/search${queryToUse && queryToUse.trim().length >= 2 ? `?q=${encodeURIComponent(queryToUse.trim())}` : ''}`;

        const response = await fetch(apiUrl);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erreur lors du chargement');
        }

        const data = await response.json();
        setProductModel(data.productModel || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
        console.error('Erreur chargement articles:', err);
      } finally {
        setLoading(false);
      }
    };

    if (locality) {
      fetchProducts();
    }
  }, [locality, searchParams, searchQuery]);

  // Gérer la recherche depuis la page
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 2) {
      router.push(`/${selectedLocation?.name}/boutique?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navbar />
      </div>
      <div className="min-h-screen bg-gray-50 pt-16">
        {/* Notification Toast */}
        {notification && (
          <div className="fixed top-4 right-4 z-50 animate-slide-in">
            <div className={`${
              notification.type === 'success' ? 'bg-green-500' :
              notification.type === 'error' ? 'bg-red-500' :
              'bg-blue-500'
            } text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] max-w-md`}>
              <span className="flex-1">{notification.message}</span>
              <button
                onClick={() => setNotification(null)}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Notification Toast pour changement de localité */}
        {locationNotification && (
          <div className="fixed top-20 right-4 z-[100] animate-slide-in">
            <div className={`${
              locationNotification.type === 'success' ? 'bg-green-500' :
              locationNotification.type === 'error' ? 'bg-red-500' :
              'bg-blue-500'
            } text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] max-w-md`}>
              <span className="flex-1">{locationNotification.message}</span>
              <button
                onClick={() => setLocationNotification(null)}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}
        
        {/* Header */}
        {/* <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-[95%] mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <Link href="/" className="flex items-center gap-2">
                  <Home size={20} className="text-gray-600" />
                </Link>
                <ChevronRight size={16} className="text-gray-400" />
                <Link href={`/${locality}`} className="text-gray-600">
                  {locality}
                </Link>
                <ChevronRight size={16} className="text-gray-400" />
                <span className="text-gray-900 font-semibold">Boutique</span>
              </div>
            </div>
          </div>
        </header> */}

        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-[#800080] to-[#660066] text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {searchQuery ? `Résultats pour "${searchQuery}"` : 'Boutique'}
            </h1>
            <p className="text-lg text-[#f3e8ff] max-w-2xl">
              {searchQuery 
                ? `Découvrez tous nos produits correspondant à votre recherche.`
                : 'Découvrez notre collection complète de produits.'}
            </p>
            
            {/* Barre de recherche dans le hero */}
            <div className="mt-6 max-w-2xl">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher un produit..."
                    className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-white text-[#800080] rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  Rechercher
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex gap-8">
            {/* Sidebar Filters - Desktop */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="h-[calc(100vh-8rem)] overflow-y-auto space-y-6 pr-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Filtres</h2>
                  {Object.values(selectedFilters).some(arr => arr.length > 0) && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-[#800080] hover:text-[#6b006b]"
                    >
                      Effacer tout
                    </button>
                  )}
                </div>

                {/* Price Range */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="font-medium text-gray-900 mb-3">Prix</h3>
                  <div className="space-y-2">
                    {filters.priceRange.map(range => (
                      <label key={range.id} className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={selectedFilters.priceRange.includes(range.id)}
                          onChange={() => toggleFilter('priceRange', range.id)}
                          className="w-4 h-4 text-[#800080] rounded focus:ring-[#800080]"
                        />
                        <span className="text-sm text-gray-700 group-hover:text-[#800080]">
                          {range.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Range (Gamme) */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="font-medium text-gray-900 mb-3">Gamme</h3>
                  <div className="space-y-2">
                    {filters.range.map(range => (
                      <label key={range.id} className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={selectedFilters.range.includes(range.id)}
                          onChange={() => toggleFilter('range', range.id)}
                          className="w-4 h-4 text-[#800080] rounded focus:ring-[#800080]"
                        />
                        <span className="text-sm text-gray-700 group-hover:text-[#800080]">
                          {range.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Storage */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="font-medium text-gray-900 mb-3">Stockage</h3>
                  <div className="space-y-2">
                    {filters.storage.map(storage => (
                      <label key={storage} className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={selectedFilters.storage.includes(storage)}
                          onChange={() => toggleFilter('storage', storage)}
                          className="w-4 h-4 text-[#800080] rounded focus:ring-[#800080]"
                        />
                        <span className="text-sm text-gray-700 group-hover:text-[#800080]">
                          {storage}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Color */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="font-medium text-gray-900 mb-3">Couleur</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {filters.color.map(color => (
                      <button
                        key={color.name}
                        onClick={() => toggleFilter('color', color.name)}
                        className={`w-10 h-10 rounded-full border-2 transition-all ${
                          selectedFilters.color.includes(color.name)
                            ? 'border-[#800080] scale-110'
                            : 'border-gray-300 hover:border-[#b366b3]'
                        }`}
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Condition */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="font-medium text-gray-900 mb-3">État</h3>
                  <div className="space-y-2">
                    {filters.condition.map(condition => (
                      <label key={condition} className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={selectedFilters.condition.includes(condition)}
                          onChange={() => toggleFilter('condition', condition)}
                          className="w-4 h-4 text-[#800080] rounded focus:ring-[#800080]"
                        />
                        <span className="text-sm text-gray-700 group-hover:text-[#800080]">
                          {condition}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            {/* Products Section */}
            <div className="flex-1 pb-32">
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-6 bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    {filteredProducts.length} produits trouvés
                  </span>
                  
                  {/* Mobile Filter Button */}
                  <button
                    onClick={() => setShowFilters(true)}
                    className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <SlidersHorizontal size={18} />
                    <span className="text-sm">Filtres</span>
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  {/* View Mode */}
                  <div className="hidden sm:flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                    >
                      <Grid3x3 size={18} />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                    >
                      <List size={18} />
                    </button>
                  </div>

                  {/* Sort */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#800080]"
                  >
                    <option value="featured">En vedette</option>
                    <option value="price-low">Prix croissant</option>
                    <option value="price-high">Prix décroissant</option>
                    <option value="name">Nom</option>
                  </select>
                </div>
              </div>

              {/* Loading State */}
              {loading && (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#800080]"></div>
                </div>
              )}

              {/* Error State */}
              {error && !loading && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                  {error}
                </div>
              )}

              {/* Products Grid */}
              {!loading && !error && (
                viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginatedProducts.map((model: ProductModel) => {
                      const prices = model.variants?.map(v => parseFloat(v.pvTTC.toString())) || [];
                      const price = prices.length > 0 ? Math.min(...prices) : 0;
                      // const oldPrices = model.variants?.map(v => parseFloat(v.oldPrice.toString())).filter(p => p > 0) || [];
                      // const oldPrice = oldPrices.length > 0 ? Math.min(...oldPrices) : 0;
                      const firstImage = model.colors?.[0]?.images?.[0]?.url || '/placeholder.jpg';

                      const storages = Array.from(
                        new Set(
                          model.variants
                            ?.map(v => v.variantAttribute)
                            .filter((attr): attr is string => attr !== null && attr !== undefined)
                        )
                      ).sort((a, b) => {
                        const toGB = (value: string) => {
                          const num = parseInt(value.replace(/\D/g, ''));
                          const unit = value.toUpperCase();
                          if (unit.includes('TB') || unit.includes('TO')) {
                            return num * 1024;
                          }
                          return num;
                        };
                        return toGB(a) - toGB(b);
                      });

                      return (
                        <div
                          key={model.id}
                          className="bg-white rounded-2xl hover:shadow-xl transition-all duration-300 group cursor-pointer border border-gray-100 relative overflow-hidden"
                          onMouseEnter={() => setHoveredProduct(model.id)}
                          onMouseLeave={() => setHoveredProduct(null)}
                          onClick={() => router.push(`/${selectedLocation?.name}/${model.brand}/${model.category}/${model.id}`)}
                        >
                          {/* Bouton Comparer au hover */}
                          {hoveredProduct === model.id && (
                            <div className="absolute top-1 right-1 pointer-events-none z-10">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleCompare(model);
                                }}
                                disabled={comparatorProducts.length >= 3 && !comparatorProducts.some(p => p.id === model.id)}
                                className={`pointer-events-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all font-semibold text-sm backdrop-blur-sm ${
                                  comparatorProducts.some(p => p.id === model.id)
                                    ? 'bg-[#800080] text-white shadow-lg'
                                    : comparatorProducts.length >= 3
                                    ? 'bg-gray-400 text-white cursor-not-allowed opacity-70'
                                    : 'bg-white/90 text-[#800080] hover:bg-white shadow-lg border-2 border-[#800080]'
                                }`}
                              >
                                {comparatorProducts.some(p => p.id === model.id) ? (
                                  <>
                                    <Check size={20} />
                                    <span>Sélectionné</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="text-xl">+</span>
                                    <span>Comparer</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}

                          {/* Image */}
                          <div className="aspect-square mb-4 bg-gradient-to-br from-gray-50 to-[#F9F9F9] rounded-xl overflow-hidden relative group/image">
                            <Image
                              src={firstImage}
                              alt={model.designation}
                              width={400}
                              height={400}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>

                          {/* Info */}
                          <div className="space-y-2 p-2">
                            <h3 className="font-semibold text-gray-900 group-hover:text-[#800080]">
                              {model.designation}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <span>•</span>
                              <span>{model.brand}</span>
                              <div className="flex items-center gap-1">
                                {model.colors?.map((color: ProductColor) => (
                                  <div
                                    key={color.id}
                                    className="w-6 h-6 rounded-full border-2 border-gray-300 cursor-pointer hover:border-[#800080] transition-colors"
                                    style={{ backgroundColor: color.hexaColor }}
                                    title={color.colorName}
                                  />
                                ))}
                              </div>
                            </div>

                            {storages.length > 0 && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">Stockage:</span>
                                {storages.map((storage, idx) => (
                                  <span
                                    key={idx}
                                    className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-md"
                                  >
                                    {storage}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className="text-sm text-gray-700 mt-2">
                              à partir de <span className="font-semibold text-[#800080]">{price.toFixed(2)}€</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  // List View
                  <div className="space-y-4">
                    {paginatedProducts.map((model: ProductModel) => {
                      const prices = model.variants?.map(v => parseFloat(v.pvTTC.toString())) || [];
                      const price = prices.length > 0 ? Math.min(...prices) : 0;
                      const firstImage = model.colors?.[0]?.images?.[0]?.url || '';

                      const storages = Array.from(
                        new Set(
                          model.variants
                            ?.map(v => v.variantAttribute)
                            .filter((attr): attr is string => attr !== null && attr !== undefined)
                        )
                      ).sort((a, b) => {
                        const toGB = (value: string) => {
                          const num = parseInt(value.replace(/\D/g, ''));
                          const unit = value.toUpperCase();
                          if (unit.includes('TB') || unit.includes('TO')) {
                            return num * 1024;
                          }
                          return num;
                        };
                        return toGB(a) - toGB(b);
                      });

                      return (
                        <div
                          key={model.id}
                          className="bg-white rounded-xl p-4 shadow-sm hover:shadow-lg transition-shadow border border-gray-100 cursor-pointer relative"
                          onMouseEnter={() => setHoveredProduct(model.id)}
                          onMouseLeave={() => setHoveredProduct(null)}
                          onClick={() => router.push(`/${selectedLocation?.name}/${model.brand}/${model.category}/${model.id}`)}
                        >
                          {/* Bouton Comparer au hover - List view */}
                          {hoveredProduct === model.id && (
                            <div className="absolute bottom-2 right-2 z-10">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleCompare(model);
                                }}
                                disabled={comparatorProducts.length >= 3 && !comparatorProducts.some(p => p.id === model.id)}
                                className={`pointer-events-auto flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg transition-all font-semibold text-xs backdrop-blur-sm ${
                                  comparatorProducts.some(p => p.id === model.id)
                                    ? 'bg-[#800080] text-white shadow-lg'
                                    : comparatorProducts.length >= 3
                                    ? 'bg-gray-400 text-white cursor-not-allowed opacity-70'
                                    : 'bg-white/90 text-[#800080] hover:bg-white shadow-lg border-2 border-[#800080]'
                                }`}
                              >
                                {comparatorProducts.some(p => p.id === model.id) ? (
                                  <>
                                    <Check size={16} />
                                    <span>Sélectionné</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="text-lg">+</span>
                                    <span>Comparer</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}

                          <div className="flex gap-4">
                            <div className="w-32 h-32 flex-shrink-0 bg-gradient-to-br from-gray-50 to-[#F9F9F9] rounded-lg overflow-hidden">
                              <Image
                                src={firstImage}
                                alt={model.designation}
                                width={128}
                                height={128}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 flex justify-between">
                              <div className="space-y-2">
                                <h3 className="font-semibold text-lg text-gray-900 group-hover:text-[#800080]">
                                  {model.designation}
                                </h3>
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                  <span>{model.brand}</span>
                                  <div className="flex items-center gap-1">
                                    {model.colors?.map((color: ProductColor) => (
                                      <div
                                        key={color.id}
                                        className="w-5 h-5 rounded-full border-2 border-gray-300 hover:border-[#800080] transition-colors"
                                        style={{ backgroundColor: color.hexaColor }}
                                        title={color.colorName}
                                      />
                                    ))}
                                  </div>
                                </div>

                                {storages.length > 0 && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">Stockage:</span>
                                    {storages.map((storage, idx) => (
                                      <span
                                        key={idx}
                                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-md"
                                      >
                                        {storage}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                <div className="text-sm text-gray-700 mt-2">
                                  à partir de <span className="font-semibold text-[#800080]">{price.toFixed(2)}€</span>
                                </div>

                                {model.totalReviews && model.totalReviews > 0 ? (
                                  <div className="flex items-center gap-2 text-sm">
                                    <div className="flex items-center gap-1">
                                      {[1, 2, 3, 4, 5].map(star => (
                                        <Star
                                          key={star}
                                          size={14}
                                          className={star <= Math.round(model.averageRating || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
                                        />
                                      ))}
                                    </div>
                                    <span className="font-medium text-xs">{model.averageRating?.toFixed(1)}</span>
                                    <span className="text-gray-500 text-xs">({model.totalReviews})</span>
                                  </div>
                                ) : null}

                                {model.description && (
                                  <p className="text-sm text-gray-600 line-clamp-2">
                                    {model.description}
                                  </p>
                                )}
                              </div>
                              <div className="flex flex-col items-end justify-between">
                                <div className="text-right">
                                  <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-bold text-[#800080]">
                                      {price.toFixed(2)}€
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              )}

              {/* Empty State */}
              {!loading && !error && paginatedProducts.length === 0 && (
                <div className="text-center py-20">
                  <p className="text-gray-500 text-lg">
                    {searchQuery 
                      ? `Aucun produit trouvé pour "${searchQuery}"`
                      : 'Aucun produit disponible'}
                  </p>
                </div>
              )}

              {/* Items per page selector */}
              {!loading && !error && sortedProducts.length > 0 && (
                <div className="flex items-center justify-between text-sm text-gray-600 mb-4 pt-5">
                  <span>
                    Affichage {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedProducts.length)} sur {sortedProducts.length} produits
                  </span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-3 py-1 border border-gray-300 rounded-lg"
                  >
                    <option value="12">12 par page</option>
                    <option value="24">24 par page</option>
                    <option value="48">48 par page</option>
                  </select>
                </div>
              )}

              {/* Pagination */}
              {!loading && !error && totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-[#800080] text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Filter Overlay */}
        {showFilters && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowFilters(false)}
            />
            <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white shadow-xl overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Filtres</h2>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-4 space-y-6">
                {/* Price Range */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="font-medium text-gray-900 mb-3">Prix</h3>
                  <div className="space-y-2">
                    {filters.priceRange.map(range => (
                      <label key={range.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedFilters.priceRange.includes(range.id)}
                          onChange={() => toggleFilter('priceRange', range.id)}
                          className="w-4 h-4 text-[#800080] rounded"
                        />
                        <span className="text-sm text-gray-700">{range.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Range (Gamme) */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="font-medium text-gray-900 mb-3">Gamme</h3>
                  <div className="space-y-2">
                    {filters.range.map(range => (
                      <label key={range.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedFilters.range.includes(range.id)}
                          onChange={() => toggleFilter('range', range.id)}
                          className="w-4 h-4 text-[#800080] rounded"
                        />
                        <span className="text-sm text-gray-700">{range.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Storage */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="font-medium text-gray-900 mb-3">Stockage</h3>
                  <div className="space-y-2">
                    {filters.storage.map(storage => (
                      <label key={storage} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedFilters.storage.includes(storage)}
                          onChange={() => toggleFilter('storage', storage)}
                          className="w-4 h-4 text-[#800080] rounded"
                        />
                        <span className="text-sm text-gray-700">{storage}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Color */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="font-medium text-gray-900 mb-3">Couleur</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {filters.color.map(color => (
                      <button
                        key={color.name}
                        onClick={() => toggleFilter('color', color.name)}
                        className={`w-12 h-12 rounded-full border-2 transition-all ${
                          selectedFilters.color.includes(color.name)
                            ? 'border-[#800080] scale-110'
                            : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Condition */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="font-medium text-gray-900 mb-3">État</h3>
                  <div className="space-y-2">
                    {filters.condition.map(condition => (
                      <label key={condition} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedFilters.condition.includes(condition)}
                          onChange={() => toggleFilter('condition', condition)}
                          className="w-4 h-4 text-[#800080] rounded"
                        />
                        <span className="text-sm text-gray-700">{condition}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex gap-3">
                <button
                  onClick={clearFilters}
                  className="flex-1 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
                >
                  Effacer
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="flex-1 py-3 bg-[#800080] text-white rounded-lg font-medium hover:bg-[#6b006b]"
                >
                  Voir {sortedProducts.length} résultats
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default StorePage;

