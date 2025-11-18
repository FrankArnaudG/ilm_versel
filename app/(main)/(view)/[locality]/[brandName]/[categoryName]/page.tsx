'use client';

import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, X, Check, Star, Grid3x3, List, ChevronLeft, ChevronRight, GitCompare } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useLocation, DEFAULT_LOCATION } from '../../../contexts/LocationContext';
import { Navbar } from '../../../components/Navbar';
import { useComparator } from '../../../../contexts/ComparatorContext';
// import { ComparatorButton } from '../../../components/ComparatorButton';
import { useCurrentUser } from '@/ts/hooks/use-current-user';
import Image from 'next/image';

interface ProductModel {
  id: string;
  designation: string; // Nom du modèle
  brand: string;
  reference: string; // Référence unique
  category: string;
  family?: string;
  subFamily?: string;
  description?: string;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'DESTOCKING_ACTIVE' | 'DESTOCKING_END_OF_LIFE' | 'INACTIVE';
  specifications?: Record<string, string | number | boolean>;
  createdById?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Notation produit
  averageRating?: number | null;
  totalReviews?: number;
  
  // Relations peuplées (optionnelles)
  colors?: ProductColor[];
  variants?: ProductVariant[];
  articles?: Article[];
  recommendedProducts?: RecommendedProduct[];
  recommendedFor?: RecommendedProduct[];
}

interface Article {
  id: string;
  articleNumber: string; // Correspond à "articleNumber" dans Prisma
  articleReference: string; // Correspond à "articleReference" dans Prisma
  modelReference: string; // Référence du modèle
  description?: string; // Optionnel dans le schéma
  
  // Prix et marges
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
  
  // Statut et condition
  status: 'DRAFT' | 'IN_STOCK' | 'IN_TRANSIT' | 'SOLD' | 'RESERVED' | 'DEFECTIVE' | 'STOLEN' | 'RETURNED' | 'LOST';
  articleCondition: 'NEW' | 'LIKE_NEW' | 'REFURBISHED'; // Nommé "articleCondition" dans Prisma
  
  // Spécifications
  specifications?: Record<string, string | number | boolean>;
  
  // Dates
  receivedDate: Date;
  soldDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  modelId: string;
  storeId: string;
  entryId: string;
  supplierId: string;
  colorId?: string;
  
  // Relations peuplées (optionnelles selon le besoin)
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
  
  // Attributs de variante
  variantAttribute: string | null;  // "256GB", "512GB", etc.
  attributeType: 'STORAGE_RAM' | 'SIZE' | 'CAPACITY' | 'CONNECTOR' | 'MEMORY' | 'NONE' | null;
  
  // Prix et marges
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
  
  // Statistiques de stock
  totalStock: number;
  availableStock: number;
  reservedStock: number;
  soldStock: number;
  
  // Dates
  createdAt: Date;
  updatedAt: Date;
  
  // Relations peuplées (optionnelles)
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

interface RecommendedProduct {
  id: string;
  mainProductId: string;
  recommendedProductId: string;
  priority: number; // Default: 5
  relationType: 'ACCESSORY' | 'COMPLEMENTARY' | 'UPGRADE' | 'ALTERNATIVE' | 'BUNDLE';
  bundleDiscount?: number; // Decimal(5, 2)
  bundlePrice?: number; // Decimal(10, 2)
  description?: string;
  isActive: boolean;
  createdById?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations peuplées (optionnelles)
  mainProduct?: ProductModel;
  recommendedProduct?: ProductModel;
}





interface FilterState {
  priceRange: string[];
  storage: string[];
  color: string[];
  condition: string[];
  range: string[];
  ram: string[];
}


const IPhoneStorePage = () => {
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

  // const [loading, setLoading] = useState(true);
  // const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const [productModel, setProductModel] = useState<ProductModel[]>([]);
  const { addProduct: addToComparator, products: comparatorProducts, removeProduct: removeFromComparator, clearProducts } = useComparator();
  
  // NOUVEAU: États pour le comparateur local (page)
  const [compareList, setCompareList] = useState<ProductModel[]>([]);
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [locationNotification, setLocationNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };
  
  // Fonction pour obtenir ou créer un sessionId
  const getOrCreateSessionId = (): string => {
    let sessionId = localStorage.getItem('comparatorSessionId');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('comparatorSessionId', sessionId);
    }
    return sessionId;
  };
  
  // Fonction pour sauvegarder la comparaison en base de données
  const saveComparison = async () => {
    if (comparatorProducts.length === 0) {
      showNotification('Aucun produit à sauvegarder', 'error');
      return;
    }
    
    // Vérifier si cette combinaison de produits a déjà été sauvegardée
    const currentProductIds = JSON.stringify(comparatorProducts.map(p => p.id).sort());
    const savedComparisonsKey = 'savedComparisons';
    
    // Récupérer les comparaisons déjà sauvegardées depuis localStorage
    let savedComparisons: string[] = [];
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(savedComparisonsKey);
      if (saved) {
        try {
          savedComparisons = JSON.parse(saved);
        } catch {
          savedComparisons = [];
        }
      }
    }
    
    // Vérifier si cette combinaison a déjà été sauvegardée
    if (savedComparisons.includes(currentProductIds)) {
      // Cette combinaison a déjà été sauvegardée, ne pas sauvegarder à nouveau
      clearProducts();
      showNotification('Comparaison déjà sauvegardée', 'info');
      return;
    }
    
    setIsSaving(true);
    try {
      const productIds = comparatorProducts.map(p => p.id);
      const sessionId = getOrCreateSessionId();
      
      const response = await fetch('/api/comparisons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productIds,
          sessionId,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Afficher le message d'erreur détaillé de l'API
        const errorMessage = data.error || data.message || 'Erreur lors de la sauvegarde';
        console.error('Erreur API:', errorMessage, data);
        showNotification(errorMessage, 'error');
        return;
      }
      
      // Ajouter cette combinaison à la liste des comparaisons sauvegardées
      savedComparisons.push(currentProductIds);
      if (typeof window !== 'undefined') {
        localStorage.setItem(savedComparisonsKey, JSON.stringify(savedComparisons));
      }
      
      // Vider le comparateur après la sauvegarde
      clearProducts();
      showNotification('Comparaison sauvegardée avec succès', 'success');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la comparaison:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la sauvegarde de la comparaison';
      showNotification(errorMessage, 'error');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Fonction pour naviguer vers la page comparateur
  const handleOpenComparator = () => {
    router.push('/comparateur');
  };
  
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

  
  // const [favorites, setFavorites] = useState<string[]>([]);


  const toggleFilter = (category:  keyof FilterState, value: string) => {
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

  // const toggleFavorite = (modelId: string) => {
  //   setFavorites(prev => 
  //     prev.includes(modelId) 
  //       ? prev.filter(id => id !== modelId)
  //       : [...prev, modelId]
  //   );
  // };

  // Fonction pour ajouter/retirer du comparateur
  const toggleCompare = (model: ProductModel) => {
    const isSelected = compareList.some(p => p.id === model.id);
    
    // Si le produit est déjà sélectionné, le retirer
    if (isSelected) {
      setCompareList(prev => prev.filter(p => p.id !== model.id));
      showNotification(`${model.designation} retiré du comparateur`, 'info');
      return;
    }
    
    // Vérifier la limite de 3 produits
    if (comparatorProducts.length >= 3) {
      showNotification('Vous ne pouvez comparer que 3 produits maximum', 'error');
      return;
    }
    
    // Ajouter au comparateur local
    setCompareList(prev => {
      if (prev.length < 3) {
        return [...prev, model];
      }
      return prev;
    });
    
    // Ajouter aussi au comparateur global
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
      // Filtrage par prix - utiliser les articles du modèle
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

      // Filtrage par gamme (range) - Utilisation de subFamily
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
          
          // Normaliser la valeur pour la comparaison
          const normalizedStorage = variant.variantAttribute.toUpperCase().replace(/\s+/g, '').trim();
          
          // Vérifier si le stockage correspond à un des filtres sélectionnés
          return selectedFilters.storage.some(filterStorage => {
            const normalizedFilter = filterStorage.toUpperCase().replace(/\s+/g, '').trim();
            // Comparaison flexible : "128GB" match avec "128 GB"
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
          // Normaliser pour la comparaison (ignorer la casse et les espaces)
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
  // const sortedProducts = [...filteredProducts].sort((a, b) => {
  //   switch (sortBy) {
  //     case 'price-low':
  //       return a.price - b.price;
  //     case 'price-high':
  //       return b.price - a.price;
  //     case 'rating':
  //       return b.rating - a.rating;
  //     case 'reviews':
  //       return b.reviews - a.reviews;
  //     default:
  //       return 0;
  //   }
  // });

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

  // Récupérer les paramètres depuis l'URL ou les props
  const params = useParams();
  const brandName = decodeURIComponent(params.brandName as string);
  const categoryName = params.categoryName ? decodeURIComponent(params.categoryName as string) : undefined;
  const locality = params.locality as string;
  const { selectedLocation, setSelectedLocation, allLocations, isInitialized } = useLocation();
  const user = useCurrentUser();

  let mainElementName: string | null = categoryName ? categoryName : null;
  const mainElementLink = categoryName ? `/${locality}/${brandName}/${categoryName}` : null;
  const baseElementLink = `/${locality}/${brandName}`;
  const baseElementName = brandName;

  if (categoryName && mainElementName) {
    if (baseElementName === "Apple" && mainElementName === "Téléphones") {
      mainElementName = "iPhone";
    } else if (baseElementName === "Samsung" && mainElementName === "Téléphones") {
      mainElementName = "Samsung";
    } else if (baseElementName === "Google" && mainElementName === "Téléphones") {
      mainElementName = "Google";
    }
  }

  // ============================================
  // VÉRIFICATION ET CHANGEMENT DE LOCALITÉ
  // ============================================
  useEffect(() => {
    if (!isInitialized || !locality) return;

    const decodedLocality = decodeURIComponent(locality);
    
    // Vérifier si la localité dans l'URL est différente de celle sélectionnée
    if (selectedLocation?.name !== decodedLocality) {
      // Chercher la localité dans la liste des localités disponibles
      const foundLocation = allLocations.find(loc => loc.name === decodedLocality);
      
      if (foundLocation) {
        // La localité existe, changer la localité sélectionnée
        setSelectedLocation(foundLocation, user?.id);
        setLocationNotification({
          message: `Localité changée vers ${foundLocation.name}`,
          type: 'success'
        });
        setTimeout(() => setLocationNotification(null), 3000);
      } else {
        // La localité n'existe pas, rediriger vers la localité par défaut ou la selectedLocation actuelle
        const redirectLocation = selectedLocation || DEFAULT_LOCATION;
        const redirectPath = categoryName 
          ? `/${redirectLocation.name}/${brandName}/${categoryName}`
          : `/${redirectLocation.name}/${brandName}`;
        router.replace(redirectPath);
        setLocationNotification({
          message: `Localité invalide. Redirection vers ${redirectLocation.name}`,
          type: 'error'
        });
        setTimeout(() => setLocationNotification(null), 3000);
      }
    }
  }, [locality, selectedLocation, allLocations, setSelectedLocation, isInitialized, router, user?.id, brandName, categoryName]);

  // ============================================
  // CHARGEMENT DES ARTICLES
  // ============================================
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // setLoading(true);
        // setError(null);

        // Construire l'URL de l'API selon la présence de categoryName
        const apiUrl = categoryName 
          ? `/api/produits/${locality}/${brandName}/${categoryName}`
          : `/api/produits/${locality}/${brandName}`;

        const response = await fetch(apiUrl);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erreur lors du chargement');
        }

        const data = await response.json();
        setProductModel(data.productModel || []);
      } catch (err) {
        // setError(err instanceof Error ? err.message : 'Une erreur est survenue');
        console.error('Erreur chargement articles:', err);
      }
    };

   if (locality && brandName) {
      fetchProducts();
    } else {
      console.log('⚠️ Paramètres manquants:', { locality, brandName });
    }
  }, [locality, brandName, categoryName]);

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
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[95%] mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-[#800080] to-[#660066] rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
              </Link>
              {baseElementLink && (
                <>
                  <ChevronRight size={16} className="text-gray-400" />
                  <Link href={baseElementLink} className="text-gray-600">
                    {baseElementName}
                  </Link>
                </>
              )}
              {mainElementLink && mainElementName && (
                <>
                  <ChevronRight size={16} className="text-gray-400" />
                  <Link href={mainElementLink} className="text-gray-900 font-semibold">
                    {mainElementName}
                  </Link>
                </>
              )}
            </div> 
            
            {/* <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900">{mainElementName ? mainElementName : baseElementName} </span>
            </div> */}
          </div>
        </div>
      </header>

        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-[#800080] to-[#660066] text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{mainElementName ? mainElementName : baseElementName}</h1>
            <p className="text-lg text-[#f3e8ff] max-w-2xl">
              Découvrez notre collection complète de {mainElementName ? mainElementName : baseElementName}.</p>
            <div className="mt-6 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Check size={18} />
                <span>Garantie constructeur</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={18} />
                <span>Livraison offerte en 24 - 48 heures maximum</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={18} />
                <span>Retour sous 14 jours</span>
              </div>
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

                {/* RAM */}
                {/* <div className="border-b border-gray-200 pb-6">
                  <h3 className="font-medium text-gray-900 mb-3">Mémoire RAM</h3>
                  <div className="space-y-2">
                    {filters.ram.map(ram => (
                      <label key={ram} className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={selectedFilters.ram.includes(ram)}
                          onChange={() => toggleFilter('ram', ram)}
                          className="w-4 h-4 text-[#800080] rounded focus:ring-[#800080]"
                        />
                        <span className="text-sm text-gray-700 group-hover:text-[#800080]">
                          {ram}
                        </span>
                      </label>
                    ))}
                  </div>
                </div> */}

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
                    {/* <option value="rating">Meilleures notes</option> */}
                    {/* <option value="reviews">Plus d'avis</option> */}
                  </select>
                </div>
              </div>

              {/* Products Grid */}
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedProducts.map((model: ProductModel) => {
                    // Récupérer les prix depuis les variantes
                    const prices = model.variants?.map(v => parseFloat(v.pvTTC.toString())) || [];
                    const price = prices.length > 0 ? Math.min(...prices) : 0;
                    
                    // const oldPrices = model.variants?.map(v => parseFloat(v.oldPrice.toString())).filter(p => p > 0) || [];
                    // const oldPrice = oldPrices.length > 0 ? Math.min(...oldPrices) : 0;
                    
                    // Récupérer la première image disponible
                    const firstImage = model.colors?.[0]?.images?.[0]?.url || '/placeholder.jpg';

                    // Extraire tous les stockages uniques (variantAttribute)
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

                    // Pour afficher la RAM (si elle existe dans les specifications du modèle)
                    // const ram = model.specifications?.RAM || model.specifications?.ram;

                    
                    return (
                      <div
                        key={model.id}
                        className="bg-white rounded-2xl hover:shadow-xl transition-all duration-300 group cursor-pointer border border-gray-100 relative overflow-hidden"
                        onMouseEnter={() => setHoveredProduct(model.id)}
                        onMouseLeave={() => setHoveredProduct(null)}
                        onClick={() => router.push(`/${selectedLocation?.name}/${brandName}/${categoryName ?? model.category}/${model.id}`)}
                      >
                        {/* Bouton Comparer au hover - haut droite */}
                        {hoveredProduct === model.id && (
                          <div className="absolute top-1 right-1 pointer-events-none z-10">
                            <button
                              onClick={(e) => {
                                e.stopPropagation(); // Empêche la propagation du clic
                                toggleCompare(model);
                              }}
                              disabled={compareList.length >= 3 && !compareList.some(p => p.id === model.id)}
                              className={`pointer-events-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all font-semibold text-sm backdrop-blur-sm ${
                                compareList.some(p => p.id === model.id)
                                  ? 'bg-[#800080] text-white shadow-lg'
                                  : compareList.length >= 3
                                  ? 'bg-gray-400 text-white cursor-not-allowed opacity-70'
                                  : 'bg-white/90 text-[#800080] hover:bg-white shadow-lg border-2 border-[#800080]'
                              }`}
                              title="Ajouter à la comparaison"
                            >
                              {compareList.some(p => p.id === model.id) ? (
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
                        {/* <div className="aspect-square mb-4 bg-gradient-to-br from-gray-50 to-[#F9F9F9] rounded-xl overflow-hidden relative group/image">
                          <img
                            src={firstImage}
                            alt={model.designation}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div> */}
                        {/* Image */}
                        <div className="relative w-full aspect-square mb-4 bg-gradient-to-br from-gray-50 to-[#F9F9F9] rounded-xl overflow-hidden group/image">
                          <Image
                            src={firstImage}
                            alt={model.designation}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                            style={{ objectFit: 'contain' }}
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
                            {/* Cercles de couleurs disponibles */}
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

                          {/* Afficher les stockages */}
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

                          {/* Prix le plus bas */}
                          <div className="text-sm text-gray-700 mt-2">
                            à partir de <span className="font-semibold text-[#800080]">{price.toFixed(2)}€</span>
                          </div>

                          {/* Afficher les RAM */}
                          {/* {rams.length > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">RAM:</span>
                              {rams.map((ram, idx) => (
                                <span
                                  key={idx}
                                  className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-md"
                                >
                                  {ram}
                                </span>
                              ))}
                            </div>
                          )} */}
                        {/* Bouton Ajouter au panier */}
                        {/* <button 
                          onClick={() => {
                            alert(`${model.designation} ajouté au panier!`);
                          }}
                          className="w-full mt-2 py-2 p-2 bg-[#800080] text-white rounded-xl font-medium hover:bg-[#6b006b] transition-colors active:scale-95"
                        >
                          Ajouter au panier
                        </button> */}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // List View
                <div className="space-y-4">
                  {paginatedProducts.map((model: ProductModel) => {
                    // Récupérer les prix depuis les variantes
                    const prices = model.variants?.map(v => parseFloat(v.pvTTC.toString())) || [];
                    const price = prices.length > 0 ? Math.min(...prices) : 0;
                    
                    // const oldPrices = model.variants?.map(v => parseFloat(v.oldPrice.toString())).filter(p => p > 0) || [];
                    // const oldPrice = oldPrices.length > 0 ? Math.min(...oldPrices) : 0;
                    
                    // Récupérer la première image disponible
                    const firstImage = model.colors?.[0]?.images?.[0]?.url || '';

                    // Extraire tous les stockages uniques (variantAttribute)
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

                    // Pour afficher la RAM (si elle existe dans les specifications du modèle)
                    // const ram = model.specifications?.RAM || model.specifications?.ram;
                    
                    return (
                      <div
                        key={model.id}
                        className="bg-white rounded-xl p-4 shadow-sm hover:shadow-lg transition-shadow border border-gray-100 cursor-pointer relative"
                        onMouseEnter={() => setHoveredProduct(model.id)}
                        onMouseLeave={() => setHoveredProduct(null)}
                        onClick={() => router.push(`/${selectedLocation?.name}/${brandName}/${categoryName ?? model.category}/${model.id}`)}
                      >
                        {/* Bouton Comparer au hover - List view */}
                        {hoveredProduct === model.id && (
                          <div className="absolute bottom-2 right-2 z-10">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleCompare(model);
                              }}
                              disabled={compareList.length >= 3 && !compareList.some(p => p.id === model.id)}
                              className={`pointer-events-auto flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg transition-all font-semibold text-xs backdrop-blur-sm ${
                                compareList.some(p => p.id === model.id)
                                  ? 'bg-[#800080] text-white shadow-lg'
                                  : compareList.length >= 3
                                  ? 'bg-gray-400 text-white cursor-not-allowed opacity-70'
                                  : 'bg-white/90 text-[#800080] hover:bg-white shadow-lg border-2 border-[#800080]'
                              }`}
                            >
                              {compareList.some(p => p.id === model.id) ? (
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
                          {/* <div className="w-32 h-32 flex-shrink-0 bg-gradient-to-br from-gray-50 to-[#F9F9F9] rounded-lg overflow-hidden">
                            <img
                              src={firstImage}
                              alt={model.designation}
                              className="w-full h-full object-cover"
                            />
                          </div> */}
                          <div className="relative w-32 h-32 flex-shrink-0 bg-gradient-to-br from-gray-50 to-[#F9F9F9] rounded-lg overflow-hidden">
                            <Image
                              src={firstImage}
                              alt={model.designation}
                              fill
                              sizes="128px"
                              className="object-contain p-2"
                              style={{ objectFit: 'contain' }}
                            />
                          </div>
                          <div className="flex-1 flex justify-between">
                            <div className="space-y-2">
                              <h3 className="font-semibold text-lg text-gray-900 group-hover:text-[#800080]">
                                {model.designation}
                              </h3>
                              <div className="flex items-center gap-3 text-sm text-gray-600">
                                <span>{model.brand}</span>
                                {/* Cercles de couleurs */}
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

                              {/* Afficher les stockages */}
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

                              {/* Prix le plus bas */}
                              <div className="text-sm text-gray-700 mt-2">
                                à partir de <span className="font-semibold text-[#800080]">{price.toFixed(2)}€</span>
                              </div>

                              {/* Afficher les RAM */}
                              {/* {rams.length > 0 && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500">RAM:</span>
                                  {rams.map((ram, idx) => (
                                    <span
                                      key={idx}
                                      className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-md"
                                    >
                                      {ram}
                                    </span>
                                  ))}
                                </div>
                              )} */}

                              {/* Rating en mode liste */}
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
                              {/* <div className="flex gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavorite(model.id);
                                  }}
                                  className="p-2 rounded-full hover:bg-gray-100"
                                >
                                  <Heart
                                    size={18}
                                    className={favorites.includes(model.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}
                                  />
                                </button>
                                <button 
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-2 rounded-full hover:bg-gray-100"
                                >
                                  <Share2 size={18} className="text-gray-400" />
                                </button>
                              </div> */}
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
              )}

              {/* Items per page selector */}
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

              {/* Pagination */}
              {totalPages > 1 && (
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

              {/* NOUVEAU: Bande de comparateur en bas */}
              {comparatorProducts.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-[#f3e8ff] to-[#f3e8ff] border-t-2 border-[#800080] shadow-2xl z-40">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    {/* Titre */}
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-gray-900">
                        Comparateur d&apos;appareils
                      </h3>
                      <p className="text-sm text-gray-600">
                        {comparatorProducts.length} appareil{comparatorProducts.length > 1 ? 's' : ''} sélectionné{comparatorProducts.length > 1 ? 's' : ''} (Maximum 3)
                      </p>
                    </div>

                    {/* Contenu */}
                    <div className="flex items-center justify-between gap-4">
                      {/* Appareils sélectionnés */}
                      <div className="flex gap-3 overflow-x-auto flex-1">
                        {comparatorProducts.map((product) => {
                          return (
                            // <div key={product.id} className="flex items-center gap-3 bg-white px-4 py-3 rounded-lg shadow-sm border border-[#e9d5ff] flex-shrink-0">
                            //   {/* Image du produit */}
                            //   <img
                            //     src={product.image}
                            //     alt={product.name}
                            //     className="w-16 h-16 object-cover rounded-lg"
                            //   />
                            <div key={product.id} className="flex items-center gap-3 bg-white px-4 py-3 rounded-lg shadow-sm border border-[#e9d5ff] flex-shrink-0">
                              {/* Image du produit */}
                              <div className="relative w-16 h-16 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden">
                                <Image
                                  src={product.image}
                                  alt={product.name}
                                  fill
                                  sizes="64px"
                                  className="object-contain p-1"
                                  style={{ objectFit: 'contain' }}
                                />
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold text-gray-900">{product.name}</div>
                                <div className="text-xs text-gray-600">{product.brand} • {product.category}</div>
                                <div className="text-sm font-bold text-[#800080] mt-1">{product.price.toFixed(2)}€</div>
                              </div>
                              <button
                                onClick={() => removeFromComparator(product.id)}
                                className="text-gray-400 hover:text-red-600 transition-colors ml-2"
                                title="Retirer du comparateur"
                              >
                                <X size={18} />
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {/* Boutons d'action */}
                      <div className="flex gap-3 flex-shrink-0">
                        <button 
                          onClick={handleOpenComparator}
                          className="px-6 py-3 bg-[#800080] text-white rounded-lg font-semibold hover:bg-[#6b006b] transition-colors shadow-md flex items-center gap-2"
                        >
                          <GitCompare size={18} />
                          Comparer
                        </button>
                        
                        <button
                          onClick={saveComparison}
                          disabled={isSaving}
                          className="px-4 py-3 text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSaving ? 'Sauvegarde...' : 'Effacer'}
                        </button>
                      </div>
                    </div>
                  </div>
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

                {/* Range (Gamme) - Mobile */}
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

                {/* RAM - Mobile */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="font-medium text-gray-900 mb-3">Mémoire RAM</h3>
                  <div className="space-y-2">
                    {filters.ram.map(ram => (
                      <label key={ram} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedFilters.ram.includes(ram)}
                          onChange={() => toggleFilter('ram', ram)}
                          className="w-4 h-4 text-[#800080] rounded"
                        />
                        <span className="text-sm text-gray-700">{ram}</span>
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



export default IPhoneStorePage;
