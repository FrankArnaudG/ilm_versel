'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Check, Heart, Share2, ShoppingBag, Truck, Shield, Clock, Plus, Minus, Loader2, X } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/app/(main)/(view)/contexts/CartContext';
import ProductReviews from '@/app/(main)/(view)/components/ProductReviews';
import { useCurrentUser } from '@/ts/hooks/use-current-user';
import { CartIcon } from '@/app/(main)/(view)/components/cart/CartComponents';
import { ComparatorButton } from '@/app/(main)/(view)/components/ComparatorButton';
// import { useComparator } from '@/app/(main)/contexts/ComparatorContext';
import Image from 'next/image';

// ============================================
// INTERFACES TYPESCRIPT
// ============================================

interface ProductModel {
  id: string;
  designation: string;
  brand: string;
  reference: string;
  category: string;
  family?: string;
  subFamily?: string;
  description?: string;
  status: string;
  specifications?: Record<string, string | number | boolean>;
  colors?: ProductColor[];
  variants?: ProductVariant[];
  articles?: Article[];
}

interface ProductColor {
  id: string;
  colorName: string;
  hexaColor: string;
  images?: ProductImage[];
}

interface ProductImage {
  id: string;
  url: string;
  fileName?: string;
  displayOrder: number;
}

interface ProductVariant {
  id: string;
  variantReference: string;
  modelId: string;
  storeId: string;
  variantAttribute: string | null;
  attributeType: string | null;
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
  realAvailableStock?: number;
  stockByColor?: Record<string, number>;
  reservedStock: number;
  soldStock: number;
  store?: {
    id: string;
    name: string;
    code: string;
    city: string;
  };
}

interface Article {
  id: string;
  articleNumber: string;
  articleReference: string;
  modelReference: string;
  description?: string;
  status: string;
  articleCondition: string;
  specifications?: Record<string, string | number | boolean>;
  receivedDate: Date;
  soldDate?: Date;
  colorId?: string;
  variantId: string;
  color?: {
    id: string;
    colorName: string;
    hexaColor: string;
  };
  variant?: {
    id: string;
    variantAttribute: string | null;
    pvTTC: number;
    oldPrice: number;
    availableStock: number;
  };
  store?: {
    id: string;
    name: string;
    city: string;
  };
}

interface RecommendedProduct {
  id: string;
  designation: string;
  brand: string;
  reference: string;
  price: number;
  image: string | null;
  relationType: string;
  bundleDiscount?: number | null;
  bundlePrice?: number | null;
}

interface Statistics {
  priceRange: {
    min: number;
    max: number;
  };
  oldPriceRange: {
    min: number;
    max: number;
  } | null;
  totalStock: number;
  totalVariants: number;
  availableColors: Array<{
    id: string;
    name: string;
    hex: string;
    hasStock: boolean;
  }>;
  availableStorages: string[];
  availableStores: string[];
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

const ProductDetailPage = () => {
  const params = useParams(); 
  const router = useRouter();
  const id = params.id as string;
  const locality = params.locality as string;
  const brandName = params.brandName as string;
  const categoryName = params.categoryName as string;

  // États de données
  const [product, setProduct] = useState<ProductModel | null>(null);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [recommendedProducts, setRecommendedProducts] = useState<RecommendedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // États de sélection
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null);
  const [selectedStorage, setSelectedStorage] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [showRecommendationsModal, setShowRecommendationsModal] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // appel du CartContext
  const { addItem, getItemByVariant } = useCart();
  
  // appel du ComparatorContext
  // const { addProduct, products } = useComparator();
  
  // Utilisateur actuel
  const user = useCurrentUser();
  
  // État pour les notifications toast
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // ============================================
  // CHARGEMENT DES DONNÉES
  // ============================================
  useEffect(() => {
    const fetchProductDetail = async () => {
      try {
        setLoading(true);
        setError(null);

        // ✅ Inclure locality dans l'URL de l'API
        const response = await fetch(`/api/produits/${locality}/productId/${id}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erreur lors du chargement');
        }

        const data = await response.json();
        
        setProduct(data.productModel);
        setStatistics(data.statistics);
        setRecommendedProducts(data.recommendedProducts || []);

        // ✅ SÉLECTION INTELLIGENTE : Choisir la première couleur DISPONIBLE
        if (data.productModel.colors?.length > 0 && data.statistics.availableColors?.length > 0) {
          // Trouver la première couleur qui a réellement du stock
          const firstAvailableColor = data.statistics.availableColors.find(
            (c: { id: string; name: string; hex: string; hasStock: boolean }) => c.hasStock  // ✅ Type inline
          );
          
          if (firstAvailableColor) {
            setSelectedColorId(firstAvailableColor.id);
            
            // ✅ Trouver le premier stockage disponible pour cette couleur
            const storagesForColor = Array.from(
              new Set(
                data.productModel.variants
                  ?.filter((v: ProductVariant) => {
                    return data.productModel.articles?.some(
                      (article: Article) => article.colorId === firstAvailableColor.id && 
                                       article.variantId === v.id && 
                                       v.availableStock > 0
                    );
                  })
                  .map((v: ProductVariant) => v.variantAttribute)
                  .filter((attr: string | null): attr is string => attr !== null && attr !== undefined)
              )
            )as string[];
            
            if (storagesForColor.length > 0) {
              setSelectedStorage(storagesForColor[0]);
            }
          }
        } else if (data.productModel.colors?.length > 0) {
          // Fallback : si pas de couleurs disponibles dans les stats, prendre la première
          setSelectedColorId(data.productModel.colors[0].id);
          
          if (data.statistics.availableStorages?.length > 0) {
            setSelectedStorage(data.statistics.availableStorages[0]);
          }
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
        console.error('Erreur chargement détails produit:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id && locality) {
      fetchProductDetail();
    }
  }, [id, locality]);

  // ============================================
  // VÉRIFICATION WISHLIST AU CHARGEMENT
  // ============================================
  useEffect(() => {
    const checkWishlist = async () => {
      if (!id || !user) return;
      
      try {
        const response = await fetch(`/api/customer/wishlist/${id}`);
        if (response.ok) {
          const data = await response.json();
          setIsInWishlist(data.isInWishlist);
        }
      } catch (error) {
        console.error('Erreur vérification wishlist:', error);
      }
    };

    checkWishlist();
  }, [id, user]);

  // ============================================
  // EFFET : Vérifier la cohérence couleur/stockage
  // ============================================
  useEffect(() => {
    if (!product || !selectedColorId || !selectedStorage) return;

    // Vérifier si la combinaison couleur + stockage est valide
    const isValidCombination = product.variants?.some(v => {
      const hasMatchingArticle = product.articles?.some(
        article => article.colorId === selectedColorId && article.variantId === v.id
      );
      return hasMatchingArticle && v.variantAttribute === selectedStorage && v.availableStock > 0;
    });

    // Si la combinaison n'est pas valide, réinitialiser le stockage
    if (!isValidCombination) {
      const newAvailableStorages = Array.from(
        new Set(
          product.variants
            ?.filter(v => {
              return product.articles?.some(
                article => article.colorId === selectedColorId && 
                          article.variantId === v.id && 
                          v.availableStock > 0
              );
            })
            .map(v => v.variantAttribute)
            .filter((attr): attr is string => attr !== null && attr !== undefined)
        )
      );

      if (newAvailableStorages.length > 0) {
        setSelectedStorage(newAvailableStorages[0]);
      } else {
        setSelectedStorage(null);
      }
    }
  }, [selectedColorId, selectedStorage, product]);

  // ============================================
  // CALCULS BASÉS SUR LA SÉLECTION
  // ============================================
  
  // Couleur sélectionnée
  const selectedColor = product?.colors?.find(c => c.id === selectedColorId);
  const images = selectedColor?.images || [];

  // ✅ Si aucune image pour la couleur sélectionnée, essayer de prendre la première couleur avec images
  const displayImages = images.length > 0 
    ? images 
    : (product?.colors?.find(c => c.images && c.images.length > 0)?.images || []);

  // Variante sélectionnée (couleur + stockage)
  const selectedVariant = product?.variants?.find(v => {
    // Vérifier que la variante correspond à la couleur via les articles
    const hasMatchingArticle = product?.articles?.some(
      article => article.colorId === selectedColorId && article.variantId === v.id
    );
    return hasMatchingArticle && v.variantAttribute === selectedStorage;
  });

  // Stockages disponibles pour la couleur sélectionnée
  const availableStorages = selectedColorId 
    ? Array.from(
        new Set(
          product?.variants
            ?.filter(v => {
              // ✅ Vérifier le stock réel pour cette couleur
              const hasRealStock = v.stockByColor?.[selectedColorId] && v.stockByColor[selectedColorId] > 0;
              return hasRealStock;
            })
            .map(v => v.variantAttribute)
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
      })
    : [];

  // Prix et stock
  const price = selectedVariant ? parseFloat(selectedVariant.pvTTC.toString()) : 0;
  const oldPrice = selectedVariant?.oldPrice ? parseFloat(selectedVariant.oldPrice.toString()) : 0;
  // calcul du stock
  // const stock = selectedVariant?.availableStock || 0;
  const stock = selectedVariant && selectedColorId 
    ? (selectedVariant.stockByColor?.[selectedColorId] ?? 0)
    : 0;
  const hasDiscount = oldPrice > 0 && oldPrice > price;
  const discountPercent = hasDiscount ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;

  // ============================================
  // GESTIONNAIRES D'ÉVÉNEMENTS
  // ============================================

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % displayImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
  };

  const handleColorChange = (colorId: string) => {
    setSelectedColorId(colorId);
    setCurrentImageIndex(0);
    
    // ✅ Recalculer les stockages disponibles pour cette nouvelle couleur
    const newAvailableStorages = Array.from(
      new Set(
        product?.variants
          ?.filter(v => {
            return product?.articles?.some(
              article => article.colorId === colorId && 
                        article.variantId === v.id && 
                        v.availableStock > 0
            );
          })
          .map(v => v.variantAttribute)
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
    
    // ✅ Vérifier si le stockage actuellement sélectionné est disponible pour cette couleur
    const isCurrentStorageAvailable = newAvailableStorages.includes(selectedStorage || '');
    
    if (!isCurrentStorageAvailable && newAvailableStorages.length > 0) {
      // ✅ Sélectionner automatiquement le premier stockage disponible
      setSelectedStorage(newAvailableStorages[0]);
    } else if (isCurrentStorageAvailable) {
      // ✅ Garder le stockage actuel s'il est disponible
      // (ne rien faire, selectedStorage reste inchangé)
    } else {
      // ✅ Aucun stockage disponible pour cette couleur
      setSelectedStorage(null);
    }
  };

  // ============================================
  // CORRECTION DE handleAddToCart dans product-detail-connected.tsx
  // ============================================

  // Remplacer votre fonction handleAddToCart actuelle par celle-ci :

  const handleAddToCart = () => {
    console.log('🛒 === DÉBUT AJOUT AU PANIER ===');
    
    // Vérifications de base
    if (!selectedVariant || stock === 0 || !selectedColorId) {
      console.error('❌ Validation échouée:', {
        selectedVariant,
        stock,
        selectedColorId
      });
      alert('Veuillez sélectionner une variante valide');
      return;
    }

    // Logs pour déboguer les prix
    console.log('💰 Prix bruts:', {
      price,
      oldPrice,
      priceType: typeof price,
      oldPriceType: typeof oldPrice,
      selectedVariant: {
        pvTTC: selectedVariant.pvTTC,
        oldPrice: selectedVariant.oldPrice
      }
    });

    // ✅ Conversion explicite en nombres
    const itemPrice = typeof price === 'number' 
      ? price 
      : parseFloat(String(price).replace(',', '.') || '0');
      
    const itemOldPrice = typeof oldPrice === 'number' 
      ? oldPrice 
      : parseFloat(String(oldPrice).replace(',', '.') || '0');

    console.log('✅ Prix convertis:', {
      itemPrice,
      itemOldPrice,
      itemPriceType: typeof itemPrice,
      itemOldPriceType: typeof itemOldPrice
    });

    // Vérification finale des prix
    if (isNaN(itemPrice) || itemPrice <= 0) {
      console.error('❌ Prix invalide après conversion:', itemPrice);
      alert('Erreur : Prix du produit invalide');
      return;
    }

    // Préparer les données de l'article
    const cartItem = {
      productModelId: product!.id,
      variantId: selectedVariant.id,
      colorId: selectedColorId,
      
      // Informations d'affichage
      designation: product!.designation,
      brand: product!.brand,
      colorName: selectedColor?.colorName || '',
      colorHex: selectedColor?.hexaColor || '#000000',
      storage: selectedStorage,
      image: displayImages[0]?.url || '',
      
      // Prix (IMPORTANT : en nombres)
      price: itemPrice,
      oldPrice: itemOldPrice > 0 ? itemOldPrice : undefined,
      quantity: quantity,
      
      // Stock et boutique
      availableStock: stock,
      storeId: selectedVariant.store?.id || '',
      storeName: selectedVariant.store?.name || '',
      locality: locality
    };

    console.log('📦 Article préparé pour le panier:', cartItem);
    console.log('🔍 Vérification finale:', {
      'cartItem.price': cartItem.price,
      'typeof cartItem.price': typeof cartItem.price,
      'cartItem.quantity': cartItem.quantity,
      'typeof cartItem.quantity': typeof cartItem.quantity,
      'total attendu': cartItem.price * cartItem.quantity
    });

    // Ajouter au panier
    try {
      addItem(cartItem);
      console.log('✅ Article ajouté avec succès !');

      // Feedback utilisateur: toast 2s
      showNotification(`Ajouté: ${quantity}x ${product!.designation}`, 'success');

      // N'ouvrir le modal QUE s'il y a des recommandations
    if (recommendedProducts && recommendedProducts.length > 0) {
      setTimeout(() => {
        setShowRecommendationsModal(true);
      }, 1000);
    }
      
      // Réinitialiser la quantité
      setQuantity(1);
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout au panier:', error);
      alert('Une erreur est survenue lors de l\'ajout au panier');
    }
    
    console.log('🛒 === FIN AJOUT AU PANIER ===');
  };

  // // ============================================
  // // GESTIONNAIRE : Ajouter au comparateur
  // // ============================================
  
  // const handleAddToComparator = () => {
  //   if (!product) {
  //     showNotification('Erreur : Produit introuvable', 'error');
  //     return;
  //   }
    
  //   if (products.length >= 3) {
  //     showNotification('Vous ne pouvez comparer que 3 produits maximum', 'error');
  //     return;
  //   }
    
  //   // Vérifier si le produit est déjà dans le comparateur
  //   const isAlreadyInComparator = products.some(p => p.id === product.id);
  //   if (isAlreadyInComparator) {
  //     showNotification(`${product.designation} est déjà dans le comparateur`, 'info');
  //     return;
  //   }
    
  //   // Préparer le produit pour le comparateur
  //   const formattedProduct = {
  //     id: product.id,
  //     name: product.designation,
  //     brand: product.brand,
  //     category: product.category,
  //     image: displayImages[0]?.url || '/placeholder.jpg',
  //     price: price,
  //     oldPrice: oldPrice > 0 ? oldPrice : undefined,
  //     rating: product.specifications?.rating?.toString() || undefined,
  //     reviews: product.specifications?.reviews?.toString() || undefined,
  //     specifications: product.specifications || {},
  //   };
    
  //   addProduct(formattedProduct);
  //   showNotification(`${product.designation} ajouté au comparateur!`, 'success');
  // };

  // ============================================
  // VÉRIFICATION : Indicateur si déjà dans le panier
  // ============================================

  const currentItemInCart = selectedVariant && selectedColorId 
    ? getItemByVariant(selectedVariant.id, selectedColorId)
    : undefined;

  // ============================================
  // GESTIONNAIRE : Wishlist
  // ============================================
  
  const handleToggleWishlist = async () => {
    if (!user) {
      showNotification('Veuillez vous connecter pour ajouter des produits à votre liste de souhaits', 'info');
      return;
    }

    if (!product) return;

    setWishlistLoading(true);

    try {
      if (isInWishlist) {
        // Retirer de la wishlist
        const response = await fetch(`/api/customer/wishlist/${product.id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          setIsInWishlist(false);
          showNotification(`${product.designation} retiré de votre liste de souhaits`, 'success');
        } else {
          const data = await response.json();
          showNotification(data.message || 'Erreur lors de la suppression', 'error');
        }
      } else {
        // Ajouter à la wishlist
        const response = await fetch('/api/customer/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productModelId: product.id })
        });

        if (response.ok) {
          setIsInWishlist(true);
          showNotification(`${product.designation} ajouté à votre liste de souhaits`, 'success');
        } else {
          const data = await response.json();
          showNotification(data.message || 'Erreur lors de l\'ajout', 'error');
        }
      }
    } catch (error) {
      console.error('Erreur wishlist:', error);
      showNotification('Une erreur est survenue', 'error');
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleShare = async () => {
      // Construction du texte de partage détaillé
      const discount = hasDiscount ? ` (-${discountPercent}% de réduction !)` : '';
      const colorInfo = selectedColor ? ` en ${selectedColor.colorName}` : '';
      const storageInfo = selectedStorage ? ` ${selectedStorage}` : '';
      
      const shareText = `🛍️ Découvrez ce produit sur la boutique d'I Love Mobile!

      📱 ${product!.brand} - ${product!.designation}
      ${storageInfo}${colorInfo}

      💰 Prix : ${price.toFixed(2)}€${discount}
      ${hasDiscount ? `Prix barré : ${oldPrice.toFixed(2)}€` : ''}

      ✨ ${stock > 0 ? 'En stock et disponible' : 'Article recherché'}

      👉 Voir le produit :`;

      const shareData = {
        title: `${product!.brand} - ${product!.designation}`,
        text: shareText,
        url: window.location.href
      };

      try {
        // Vérifier si l'API Web Share est disponible (mobile principalement)
        if (navigator.share) {
          await navigator.share(shareData);
          showNotification('Partagé avec succès!', 'success');
        } else {
          // Fallback : Copier le texte complet + lien dans le presse-papiers
          const fullText = `${shareText}\n${window.location.href}`;
          await navigator.clipboard.writeText(fullText);
          showNotification('Texte et lien copiés dans le presse-papiers!', 'success');
        }
      } catch (error) {
        // L'utilisateur a annulé le partage ou erreur
        if ((error as Error).name !== 'AbortError') {
          console.error('Erreur lors du partage:', error);
          showNotification('Erreur lors du partage', 'error');
        }
      }
    };
  

   

  // ============================================
  // RENDU - LOADING
  // ============================================
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-[#800080] mx-auto mb-4" />
          <p className="text-gray-600">Chargement du produit...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDU - ERREUR
  // ============================================
  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Produit introuvable</h2>
          <p className="text-gray-600 mb-6">{error || 'Ce produit n\'existe pas ou n\'est plus disponible.'}</p>
          <Link 
            href={`/${locality}/${brandName}/${categoryName}`}
            className="px-6 py-3 bg-[#800080] text-white rounded-lg font-medium hover:bg-[#6b006b] inline-block"
          >
            Retour
          </Link>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDU PRINCIPAL
  // ============================================
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-4 right-4 z-50 animate-slide-in">
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

      {/* Modal de recommandations */}
      <RecommendationsModal
        isOpen={showRecommendationsModal}
        onClose={() => setShowRecommendationsModal(false)}
        products={recommendedProducts}
        locality={locality}
        brandName={brandName}
        categoryName={categoryName}
      />
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button 
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft size={20} />
              <span>Retour</span>
            </button>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={handleShare}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Partager ce produit"
              >
                <Share2 size={20} />
              </button>
              {/* <button 
                onClick={() => setIsFavorite(!isFavorite)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <Heart 
                  size={20} 
                  className={isFavorite ? "fill-red-500 text-red-500" : "text-gray-600"}
                />
              </button> */}
              <ComparatorButton />
              <CartIcon />
              {/* <button className="p-2 hover:bg-gray-100 rounded-lg relative">
                <ShoppingBag size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#800080] rounded-full"></span>
              </button> */}
            </div>
          </div>
        </div>
      </header>

      {/* Contenu Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* COLONNE GAUCHE - IMAGES */}
          <div className="space-y-4">
            {/* Image Principale */}
            <div className="relative w-full aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden group">
              <Image
                src={displayImages[currentImageIndex]?.url || '/placeholder.jpg'}
                alt={`${product.designation} - ${selectedColor?.colorName || 'Produit'}`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 600px"
                className="object-contain p-4 md:p-6"
                style={{ objectFit: 'contain' }}
                priority
              />
              
              {/* Bouton Wishlist - Cœur */}
              <button
                onClick={handleToggleWishlist}
                disabled={wishlistLoading}
                className="absolute top-4 right-4 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-all z-10 disabled:opacity-50 disabled:cursor-not-allowed"
                title={isInWishlist ? 'Retirer de la liste de souhaits' : 'Ajouter à la liste de souhaits'}
              >
                {wishlistLoading ? (
                  <Loader2 size={20} className="animate-spin text-[#800080]" />
                ) : (
                  <Heart 
                    size={20} 
                    className={isInWishlist ? "fill-[#800080] text-[#800080]" : "text-gray-600"}
                  />
                )}
              </button>
              
              {hasDiscount && (
                <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                  -{discountPercent}%
                </div>
              )}
              
              {/* Navigation Images */}
              {displayImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronRight size={24} />
                  </button>
                  
                  {/* Indicateurs */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {displayImages.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          idx === currentImageIndex 
                            ? 'bg-[#800080] w-8' 
                            : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Miniatures */}
            {displayImages.map((img, idx) => (
              <button
                key={img.id}
                onClick={() => setCurrentImageIndex(idx)}
                className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                  idx === currentImageIndex
                    ? 'border-[#800080] scale-105'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Image
                  src={img.url}
                  alt={`${product.designation} vue ${idx + 1}`}
                  fill
                  sizes="(max-width: 640px) 20vw, 15vw"
                  className="object-contain p-1"
                />
              </button>
            ))}

            {/* Badges de confiance */}
            <div className="grid grid-cols-3 gap-3 pt-4">
              <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200">
                <Truck size={20} className="text-[#800080]" />
                <div className="text-xs">
                  <div className="font-semibold">Livraison</div>
                  <div className="text-gray-500">24h à 48h max</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200">
                <Shield size={20} className="text-[#800080]" />
                <div className="text-xs">
                  <div className="font-semibold">Garantie</div>
                  <div className="text-gray-500">24 mois</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200">
                <Clock size={20} className="text-[#800080]" />
                <div className="text-xs">
                  <div className="font-semibold">Retour</div>
                  <div className="text-gray-500">14 jours</div>
                </div>
              </div>
            </div>
          </div>

          {/* COLONNE DROITE - INFORMATIONS ET SÉLECTION */}
          <div className="space-y-6">
            {/* En-tête produit */}
            <div>
              {/* <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <span>{product.brand}</span>
                <span>•</span>
                <span>Réf: {product.reference}</span>
              </div> */}
              <h1 className="text-4xl font-bold text-gray-900 mb-3">
                {product.designation}
              </h1>
              
              {/* Sous-famille (Gamme) */}
              {product.subFamily && (
                <div className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-3">
                  {product.subFamily}
                </div>
              )}
            </div>

            {/* Prix */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-5xl font-bold text-[#800080]">
                  {price.toFixed(2)}€
                </span>
                {hasDiscount && (
                  <span className="text-2xl text-gray-400 line-through">
                    {oldPrice.toFixed(2)}€
                  </span>
                )}
              </div>
              {hasDiscount && (
                <div className="text-sm text-green-600 font-medium">
                  Vous économisez {(oldPrice - price).toFixed(2)}€ ({discountPercent}%)
                </div>
              )}
            </div>

            {/* Sélecteur de Couleur */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="font-semibold text-lg mb-4">
                Couleur: <span className="text-[#800080]">{selectedColor?.colorName}</span>
              </h3>
              <div className="flex gap-3">
                {product.colors?.map(color => {
                  const isAvailable = product.variants?.some(v => {
                    const hasMatchingArticle = product.articles?.some(
                      article => article.colorId === color.id && article.variantId === v.id
                    );
                    return hasMatchingArticle && v.availableStock > 0;
                  });
                  
                  return (
                    <button
                      key={color.id}
                      onClick={() => isAvailable && handleColorChange(color.id)}
                      disabled={!isAvailable}
                      className={`relative w-14 h-14 rounded-full border-2 transition-all ${
                        selectedColorId === color.id
                          ? 'border-[#800080] scale-110 shadow-lg'
                          : isAvailable
                          ? 'border-gray-300 hover:border-[#800080] hover:scale-105'
                          : 'border-gray-200 opacity-50 cursor-not-allowed'
                      }`}
                      style={{ backgroundColor: color.hexaColor }}
                      title={color.colorName}
                    >
                      {selectedColorId === color.id && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Check size={24} className="text-white drop-shadow-lg" />
                        </div>
                      )}
                      {!isAvailable && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-full">
                          <span className="text-xs font-bold text-gray-500">✕</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sélecteur de Stockage */}
            {availableStorages.length > 0 && (
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="font-semibold text-lg mb-4">
                  Capacité de stockage
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {statistics?.availableStorages.map(storage => {
                    const isAvailable = availableStorages.includes(storage);
                    const variant = product.variants?.find(v => {
                      const hasMatchingArticle = product.articles?.some(
                        article => article.colorId === selectedColorId && article.variantId === v.id
                      );
                      return hasMatchingArticle && v.variantAttribute === storage;
                    });
                    
                    return (
                      <button
                        key={storage}
                        onClick={() => isAvailable && setSelectedStorage(storage)}
                        disabled={!isAvailable}
                        className={`relative px-4 py-4 rounded-xl font-medium transition-all ${
                          selectedStorage === storage
                            ? 'bg-[#800080] text-white shadow-lg'
                            : isAvailable
                            ? 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                            : 'bg-gray-50 text-gray-400 cursor-not-allowed opacity-50 border border-gray-200'
                        }`}
                      >
                        <div className="font-bold text-lg">{storage}</div>
                        {variant && isAvailable && (
                          <div className="text-xs mt-1">
                            {parseFloat(variant.pvTTC.toString()).toFixed(0)}€
                          </div>
                        )}
                        {!isAvailable && (
                          <div className="absolute top-2 right-2 text-xs">
                            Épuisé
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Stock et Quantité */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {stock > 0 ? (
                    <>
                      {/* <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-green-700 font-medium">
                        En stock ({stock} disponible{stock > 1 ? 's' : ''})
                      </span> */}
                    </>
                  ) : (
                    <>
                      <div className="w-3 h-3 bg-red-500 rounded-full" />
                      <span className="text-red-700 font-medium">Rupture de stock</span>
                    </>
                  )}
                </div>

                {stock > 0 && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-8 text-center font-semibold">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(stock, quantity + 1))}
                      className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Boutique */}
              {selectedVariant?.store && (
                <div className="text-sm text-gray-600 mb-4">
                  Livraison uniquement en <span className="font-medium">{selectedVariant.store.city}</span>
                </div>
              )}

              {/* Bouton Ajouter au panier */}
              <button
                onClick={handleAddToCart}
                disabled={stock === 0}
                className={`w-full py-4 rounded-xl font-semibold text-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
                  stock === 0
                    ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                    : currentItemInCart
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-[#800080] hover:bg-[#6b006b] text-white'
                }`}
              >
                <ShoppingBag size={20} />
                {stock === 0 
                  ? 'Indisponible' 
                  : currentItemInCart 
                  ? `Dans le panier (${currentItemInCart.quantity}) - ${(currentItemInCart.price * currentItemInCart.quantity).toFixed(2)}€`
                  : 'Ajouter au panier'
                }
              </button>

              {/* Bouton Ajouter au comparateur */}
              {/* <button
                onClick={handleAddToComparator}
                disabled={products.length >= 3 || products.some(p => p.id === product?.id)}
                className={`w-full py-4 rounded-xl font-semibold text-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
                  products.length >= 3 || products.some(p => p.id === product?.id)
                    ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                    : 'bg-[#f3e8ff] hover:bg-[#e9d5ff] text-[#800080] border-2 border-[#800080]'
                }`}
              >
                <GitCompare size={20} />
                {products.some(p => p.id === product?.id)
                  ? 'Déjà dans le comparateur'
                  : products.length >= 3
                  ? 'Comparateur plein (3/3)'
                  : 'Ajouter au comparateur'
                }
              </button> */}
              
            </div>

            {/* Tabs Description / Caractéristiques */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('description')}
                  className={`flex-1 py-4 font-semibold transition-colors ${
                    activeTab === 'description'
                      ? 'text-[#800080] border-b-2 border-[#800080]'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Description
                </button>
                <button
                  onClick={() => setActiveTab('specs')}
                  className={`flex-1 py-4 font-semibold transition-colors ${
                    activeTab === 'specs'
                      ? 'text-[#800080] border-b-2 border-[#800080]'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Caractéristiques
                </button>
              </div>

            <div className="p-6">
              <div className="max-h-96 overflow-y-auto pr-2">
                {activeTab === 'description' ? (
                  <div className="space-y-4">
                    {product.description ? (
                      <p className="text-gray-700 leading-relaxed">
                        {product.description}
                      </p>
                    ) : (
                      <p className="text-gray-500 italic">Aucune description disponible</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {product.specifications && Object.keys(product.specifications).length > 0 ? (
                      Object.entries(product.specifications).map(([key, value]) => (
                        <div key={key} className="flex py-2 border-b border-gray-100 last:border-0">
                          <div className="w-1/2 font-medium text-gray-700 capitalize">
                            {key.replace(/_/g, ' ')}
                          </div>
                          <div className="w-1/2 text-gray-600">{String(value)}</div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 italic">Aucune caractéristique disponible</p>
                    )}
                  </div>
                )}
              </div>
            </div>
            </div>
          </div>
        </div>

        {/* Produits Recommandés */}
        {recommendedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Produits recommandés</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recommendedProducts.map(recProduct => (
                <div
                  key={recProduct.id}
                  className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => router.push(`/${locality}/${brandName}/${categoryName}/${recProduct.id}`)}
                >
                  <div className="relative aspect-square bg-gray-50 rounded-lg overflow-hidden mb-4">
                    <Image
                      src={recProduct.image || '/placeholder.jpg'}
                      alt={recProduct.designation}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 33vw, 300px"
                      className="object-contain p-4 group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{recProduct.designation}</h3>
                  <div className="text-sm text-gray-500 mb-3">{recProduct.brand}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-[#800080]">{recProduct.price.toFixed(2)}€</span>
                    {/* <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Ajouter au panier
                        alert(`${recProduct.designation} ajouté au panier`);
                      }}
                      className="px-4 py-2 bg-[#800080] text-white rounded-lg text-sm hover:bg-[#6b006b] transition-colors"
                    >
                      Ajouter
                    </button> */}
                  </div>
                  {recProduct.relationType && (
                    <div className="mt-3 text-xs text-gray-500">
                      {recProduct.relationType === 'ACCESSORY' && 'Accessoire'}
                      {recProduct.relationType === 'COMPLEMENTARY' && 'Complémentaire'}
                      {recProduct.relationType === 'UPGRADE' && '⬆Upgrade'}
                      {recProduct.relationType === 'ALTERNATIVE' && 'Alternative'}
                      {recProduct.relationType === 'BUNDLE' && 'Pack'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section Avis Clients */}
        <div className="mt-16">
          <ProductReviews 
            productModelId={product.id}
            initialAverageRating={statistics?.priceRange ? null : null}
            initialTotalReviews={0}
          />
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;

// ============================================
// MODAL DE RECOMMANDATIONS AVEC SLIDER
// ============================================
// ============================================
// MODAL DE RECOMMANDATIONS - VERSION SOFT
// ============================================
const RecommendationsModal = ({
  isOpen,
  onClose,
  products,
  locality,
  brandName,
  categoryName,
}: {
  isOpen: boolean;
  onClose: () => void;
  products: RecommendedProduct[];
  locality: string;
  brandName: string;
  categoryName: string;
}) => {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Reset index when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
    }
  }, [isOpen]);

  if (!isOpen || products.length === 0) return null;

  // // Labels pour les types de recommandation
  // const relationTypeLabels: Record<string, string> = {
  //   ACCESSORY: 'Accessoire',
  //   COMPLEMENTARY: 'Complémentaire',
  //   UPGRADE: 'Upgrade',
  //   ALTERNATIVE: 'Alternative',
  //   BUNDLE: 'Pack',
  // };

  // Navigation
  const nextSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev + 1) % products.length);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const prevSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const goToSlide = (index: number) => {
    if (isAnimating || index === currentIndex) return;
    setIsAnimating(true);
    setCurrentIndex(index);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleProductClick = (productId: string) => {
    router.push(`/${locality}/${brandName}/${categoryName}/${productId}`);
    onClose();
  };

  const currentProduct = products[currentIndex];
  // const typeLabel = relationTypeLabels[currentProduct.relationType] || 'Recommandé';

  return (
    <div className="fixed inset-0 z-[100] animate-fadeIn">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300" 
        onClick={onClose} 
      />
      
      {/* Modal */}
      <div className="absolute inset-x-0 bottom-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-3/4 w-full bg-white rounded-t-3xl md:rounded-3xl shadow-xl overflow-hidden">
        {/* Header minimaliste */}
        <div className="relative px-6 py-6 bg-[#A64CA6] border-b border-gray-100">
          <button 
            onClick={onClose} 
            className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-gray-700 text-gray-900 hover:text-gray-600 transition-colors"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
          
          <div className="pr-10">
            <h3 className="text-lg font-semibold text-black mb-1">
              Cela pourrait aussi vous plaire
            </h3>
            
          </div>
        </div>

        {/* Slider Content */}
        <div className="relative bg-white py-8">
          {/* Product Card - Design épuré */}
          <div className="px-8 flex items-center justify-center">
            <div 
              className="bg-gray-50/50 rounded-2xl border border-gray-300 hover:border-gray-400 overflow-hidden transition-all duration-300 hover:shadow-md cursor-pointer max-w-sm w-full group"
              onClick={() => handleProductClick(currentProduct.id)}
            >
              {/* Image */}
              <div className="relative h-64 bg-gray-50 group-hover:bg-gray-100 transition-colors">
                <Image 
                  src={currentProduct.image || '/placeholder.jpg'} 
                  alt={currentProduct.designation}
                  fill
                  sizes="(max-width: 768px) 90vw, 400px"
                  className="object-contain p-4 sm:p-6 transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              
              {/* Info */}
              <div className="p-5 border-t border-gray-100">
                <div className="mb-3">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1.5">
                    {currentProduct.brand}
                  </p>
                  <h4 className="text-base font-medium text-gray-800 mb-1 line-clamp-2 group-hover:text-gray-900">
                    {currentProduct.designation}
                  </h4>
                </div>
                
                {/* Prix */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-baseline gap-2">
                    {currentProduct.bundlePrice && currentProduct.bundlePrice < currentProduct.price ? (
                      <>
                        <span className="text-xl font-semibold text-gray-900">
                          {currentProduct.bundlePrice.toFixed(2)}€
                        </span>
                        <span className="text-sm text-gray-400 line-through">
                          {currentProduct.price.toFixed(2)}€
                        </span>
                      </>
                    ) : (
                      <span className="text-xl font-semibold text-gray-900">
                        {currentProduct.price.toFixed(2)}€
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1 text-gray-400 group-hover:text-gray-600 transition-colors">
                    <span className="text-xs font-medium">Voir</span>
                    <ChevronRight size={16} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          {products.length > 1 && (
            <>
              {/* Arrows */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevSlide();
                }}
                disabled={isAnimating}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center bg-white hover:bg-gray-50 rounded-full shadow-sm border border-gray-200 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Produit précédent"
              >
                <ChevronLeft size={20} className="text-gray-600" />
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextSlide();
                }}
                disabled={isAnimating}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center bg-white hover:bg-gray-50 rounded-full shadow-sm border border-gray-200 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Produit suivant"
              >
                <ChevronRight size={20} className="text-gray-600" />
              </button>

              {/* Dots Indicators */}
              <div className="flex items-center justify-center gap-2 mt-6">
                {products.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    disabled={isAnimating}
                    className={`transition-all duration-300 rounded-full ${
                      currentIndex === index
                        ? 'w-6 h-1.5 bg-gray-800'
                        : 'w-1.5 h-1.5 bg-gray-300 hover:bg-gray-400'
                    } disabled:cursor-not-allowed`}
                    aria-label={`Aller au produit ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer minimaliste */}
        <div className="border-t border-gray-100 px-6 py-4 bg-gray-50/50">
          <div className="flex items-center justify-between gap-4">
            <div className="text-xs text-gray-500">
              {/* <span className="font-medium text-gray-700">{currentIndex + 1}</span>
              <span> sur {products.length}</span> */}
            </div>
            
            <button 
              onClick={onClose} 
              className="px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-600 font-medium transition-colors text-sm"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};