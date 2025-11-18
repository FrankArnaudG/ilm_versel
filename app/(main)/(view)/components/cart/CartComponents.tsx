'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCart } from '../../contexts/CartContext';
import Image from 'next/image';

// ============================================
// COMPOSANT DRAWER PANIER (Panneau latéral)
// ============================================

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CartItem {
  id: string;
  designation: string;
  brand: string;
  price: number;
  oldPrice?: number;
  image: string;
  colorName: string;
  colorHex: string;
  colorId: string;
  variantId: string;
  storage?: string | null;
  quantity: number;
  availableStock: number;
  storeId: string;
  locality: string;
}

interface StockStatus {
  variantId: string;
  colorId: string;
  locality: string;
  requested: number;
  available: number;
  status: string;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const { items, itemCount, totalPrice, updateQuantity, removeItem, clearCart } = useCart();
  const router = useRouter();
  
  const [isVerifying, setIsVerifying] = useState(false);
  const [stockStatuses, setStockStatuses] = useState<Map<string, StockStatus>>(new Map());
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [hasVerified, setHasVerified] = useState(false);

  // Fonction pour vérifier le panier via l'API
  const verifyCart = async (itemsToVerify?: CartItem[]) => {
    setIsVerifying(true);
    setVerificationError(null);
    setHasVerified(false);

    // Utiliser les items passés en paramètre ou ceux du contexte
    const currentItems = itemsToVerify || items;

    try {
      // Préparer les données à envoyer
      const cartData = currentItems.map(item => ({
        variantId: item.variantId,
        colorId: item.colorId,
        storeId: item.storeId,
        locality: item.locality,
        quantity: item.quantity,
        designation: item.designation,
        colorName: item.colorName
      }));

      // Appel API
      const response = await fetch('/api/produits/cart/verify-stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: cartData }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors de la vérification du panier');
      }

      // Créer une Map des statuts de stock
      const statusMap = new Map<string, StockStatus>();
      data.stockStatus.forEach((status: StockStatus) => {
        const key = `${status.variantId}-${status.colorId}`;
        statusMap.set(key, status);
      });

      setStockStatuses(statusMap);
      setHasVerified(true);

    } catch (error) {
      console.error('Erreur vérification panier:', error);
      setVerificationError(
        error instanceof Error 
          ? error.message 
          : 'Impossible de vérifier le panier. Veuillez réessayer.'
      );
    } finally {
      setIsVerifying(false);
    }
  };

  // Vérifier le panier à l'ouverture et quand les items changent
  React.useEffect(() => {
    if (isOpen && items.length > 0) {
      verifyCart(items);
    } else if (!isOpen) {
      // Reset quand on ferme
      setHasVerified(false);
      setStockStatuses(new Map());
      setVerificationError(null);
    }
  }, [isOpen, items.length]); // Déclencher aussi quand le nombre d'items change

  const handleCheckout = () => {
    // Vérifier qu'il n'y a pas de problèmes de stock
    const hasStockIssues = Array.from(stockStatuses.values()).some(
      status => status.available < status.requested
    );

    if (hasStockIssues) {
      alert('Certains articles ont un stock insuffisant. Veuillez ajuster les quantités.');
      return;
    }

    onClose();
    router.push('/checkout');
  };

  if (!isOpen) return null;

  // Fonction pour obtenir le statut d'un article
  const getItemStatus = (item: CartItem) => {
    const key = `${item.variantId}-${item.colorId}`;
    return stockStatuses.get(key);
  };

  // Vérifier si on peut passer commande
  const canCheckout = hasVerified && 
    !isVerifying && 
    !verificationError &&
    items.length > 0 &&
    !Array.from(stockStatuses.values()).some(status => status.available < status.requested);

  // Utiliser un portal pour rendre le drawer en dehors de la hiérarchie DOM
  if (typeof window === 'undefined') return null;

  return createPortal(
    <>
      {/* Overlay */}
    <div
      className="fixed inset-0 bg-black/50 z-[100] transition-opacity"
      onClick={onClose}
    />

    {/* Drawer - CORRIGÉ */}
    <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-[110] flex flex-col transition-transform duration-300 ease-out">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <ShoppingBag size={24} className="text-[#800080]" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Mon Panier</h2>
              <p className="text-sm text-gray-500">{itemCount} article{itemCount > 1 ? 's' : ''}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Contenu */}
        {items.length === 0 ? (
          // Panier vide
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <ShoppingBag size={48} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Votre panier est vide
            </h3>
            <p className="text-gray-500 mb-6">
              Ajoutez des produits pour commencer vos achats
            </p>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-[#800080] text-white rounded-lg font-medium hover:bg-[#6b006b] transition-colors"
            >
              Continuer mes achats
            </button>
          </div>
        ) : (
          <>
            {/* Message d'erreur global */}
            {verificationError && (
              <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-red-800 font-medium mb-2">Erreur de vérification</p>
                    <p className="text-sm text-red-700">{verificationError}</p>
                  </div>
                </div>
                <button
                  onClick={() => verifyCart}
                  className="mt-3 w-full py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                >
                  Réessayer la vérification
                </button>
              </div>
            )}

            {/* Loader pendant la vérification */}
            {isVerifying ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6">
                <Loader2 size={48} className="text-[#800080] animate-spin mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Vérification en cours...
                </h3>
                <p className="text-sm text-gray-500 text-center">
                  Nous vérifions la disponibilité de vos articles
                </p>
              </div>
            ) : (
              <>
                {/* Liste des articles */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {items.map(item => {
                    const status = getItemStatus(item);
                    const hasStockIssue = status && status.available < status.requested;
                    const isOutOfStock = status && status.available === 0;
                    
                    return (
                      <div
                        key={item.id}
                        className={`bg-gray-50 rounded-xl p-4 relative hover:bg-gray-100 transition-colors ${
                          hasStockIssue ? 'border-2 border-orange-400' : ''
                        } ${isOutOfStock ? 'border-2 border-red-400 opacity-75' : ''}`}
                      >
                        {/* Avertissements de stock */}
                        {hasVerified && hasStockIssue && (
                          <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                            <div className="flex items-start gap-2">
                              <AlertCircle size={16} className="text-orange-600 flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                {isOutOfStock ? (
                                  <p className="text-xs text-orange-900 font-semibold">
                                    ❌ Produit actuellement indisponible
                                  </p>
                                ) : (
                                  <>
                                    <p className="text-xs text-orange-900 font-semibold mb-1">
                                      ⚠️ Stock insuffisant
                                    </p>
                                    <p className="text-xs text-orange-800">
                                      Demandé: {status.requested} • Disponible: {status.available}
                                    </p>
                                    <button
                                      onClick={() => {
                                        updateQuantity(item.id, status.available);
                                        // Re-vérifier immédiatement avec la nouvelle quantité
                                        const updatedItems = items.map(i => 
                                          i.id === item.id ? { ...i, quantity: status.available } : i
                                        );
                                        setTimeout(() => verifyCart(updatedItems), 100);
                                      }}
                                      className="mt-2 text-xs text-orange-700 font-medium underline hover:text-orange-800"
                                    >
                                      Ajuster à {status.available} unité{status.available > 1 ? 's' : ''}
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Bouton supprimer */}
                        <button
                          onClick={() => removeItem(item.id)}
                          className="absolute top-2 right-2 p-1.5 hover:bg-red-100 rounded-lg text-gray-400 hover:text-red-600 transition-colors z-10"
                        >
                          <Trash2 size={16} />
                        </button>

                        <div className="flex gap-4">
                          {/* Image */}
                          <div className={`w-20 h-20 bg-white rounded-lg overflow-hidden flex-shrink-0 relative ${
                            isOutOfStock ? 'grayscale' : ''
                          }`}>
                            <Image
                              src={item.image}
                              alt={item.designation}
                              fill
                              sizes="80px"
                              className="object-cover"
                            />
                          </div>

                          {/* Infos */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {item.designation}
                            </h3>
                            <p className="text-sm text-gray-500">{item.brand}</p>
                            
                            {/* Couleur et Stockage */}
                            <div className="flex items-center gap-2 mt-1">
                              <div
                                className="w-4 h-4 rounded-full border border-gray-300"
                                style={{ backgroundColor: item.colorHex }}
                                title={item.colorName}
                              />
                              <span className="text-xs text-gray-600">{item.colorName}</span>
                              {item.storage && (
                                <>
                                  <span className="text-xs text-gray-400">•</span>
                                  <span className="text-xs text-gray-600">{item.storage}</span>
                                </>
                              )}
                            </div>

                            {/* Localité */}
                            <div className="mt-1">
                              <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                                {item.locality}
                              </span>
                            </div>

                            {/* Prix et Quantité */}
                            <div className="flex items-center justify-between mt-3">
                              <div className="flex items-baseline gap-2">
                                <span className="text-lg font-bold text-[#800080]">
                                  {(item.price || 0).toFixed(2)}€
                                </span>
                                {item.oldPrice && item.oldPrice > (item.price || 0) && (
                                  <span className="text-sm text-gray-400 line-through">
                                    {item.oldPrice.toFixed(2)}€
                                  </span>
                                )}
                              </div>

                              {/* Contrôles quantité */}
                              <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200">
                                <button
                                  onClick={() => {
                                    const newQuantity = item.quantity - 1;
                                    updateQuantity(item.id, newQuantity);
                                    // Re-vérifier immédiatement avec la nouvelle quantité
                                    const updatedItems = items.map(i => 
                                      i.id === item.id ? { ...i, quantity: newQuantity } : i
                                    );
                                    setTimeout(() => verifyCart(updatedItems), 100);
                                  }}
                                  disabled={isOutOfStock || item.quantity <= 1}
                                  className="p-1.5 hover:bg-gray-100 rounded-l-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <Minus size={14} />
                                </button>
                                <span className="w-8 text-center text-sm font-medium">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => {
                                    const newQuantity = item.quantity + 1;
                                    updateQuantity(item.id, newQuantity);
                                    // Re-vérifier immédiatement avec la nouvelle quantité
                                    const updatedItems = items.map(i => 
                                      i.id === item.id ? { ...i, quantity: newQuantity } : i
                                    );
                                    setTimeout(() => verifyCart(updatedItems), 100);
                                  }}
                                  disabled={
                                    isOutOfStock || 
                                    (status && item.quantity >= status.available)
                                  }
                                  className="p-1.5 hover:bg-gray-100 rounded-r-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                            </div>

                            {/* Sous-total */}
                            <div className="text-sm text-gray-500 mt-2">
                              Sous-total: {((item.price || 0) * item.quantity).toFixed(2)}€
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer avec total et actions */}
                <div className="border-t border-gray-200 p-6 space-y-4 bg-white">
                  {/* Bouton vider le panier */}
                  <button
                    onClick={() => {
                      if (confirm('Êtes-vous sûr de vouloir vider le panier ?')) {
                        clearCart();
                      }
                    }}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Vider le panier
                  </button>

                  {/* Avertissement global si problèmes */}
                  {hasVerified && !canCheckout && items.length > 0 && (
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-sm text-orange-900 font-medium">
                        ⚠️ Veuillez ajuster les quantités avant de commander
                      </p>
                    </div>
                  )}

                  {/* Total */}
                  <div className="flex items-center justify-between py-4 border-t border-gray-200">
                    <span className="text-lg font-semibold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-[#800080]">
                      {totalPrice.toFixed(2)}€
                    </span>
                  </div>

                  {/* Boutons d'action */}
                  <div className="space-y-3">
                    <button
                      onClick={handleCheckout}
                      disabled={!canCheckout}
                      className="w-full py-4 bg-[#800080] text-white rounded-xl font-semibold text-lg hover:bg-[#6b006b] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {!hasVerified ? 'Vérification...' : 'Commander'}
                      <ArrowRight size={20} />
                    </button>
                    <button
                      onClick={onClose}
                      className="w-full py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                    >
                      Continuer mes achats
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </>,
    document.body
  );
};

// ============================================
// COMPOSANT ICÔNE PANIER (pour le header)
// ============================================

export const CartIcon: React.FC = () => {
  const { itemCount } = useCart();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsDrawerOpen(true)}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <ShoppingBag size={20} />
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#800080] text-white text-xs font-bold rounded-full flex items-center justify-center">
            {itemCount > 9 ? '9+' : itemCount}
          </span>
        )}
      </button>

      <CartDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </>
  );
};














// 'use client';

// import React, { useState } from 'react';
// import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
// import { useRouter } from 'next/navigation';
// import Link from 'next/link';
// import { useCart } from '../../contexts/CartContext';

// // ============================================
// // COMPOSANT DRAWER PANIER (Panneau latéral)
// // ============================================

// interface CartDrawerProps {
//   isOpen: boolean;
//   onClose: () => void;
// }

// interface CartItem {
//   id: string;
//   designation: string;
//   brand: string;
//   price: number;
//   oldPrice?: number;
//   image: string;
//   colorName: string;
//   colorHex: string;
//   colorId: string;
//   variantId: string;
//   storage?: string;
//   quantity: number;
//   availableStock: number;
//   storeId: string;
//   locality: string;
// }

// interface StockStatus {
//   variantId: string;
//   colorId: string;
//   locality: string;
//   requested: number;
//   available: number;
//   status: string;
// }

// export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
//   const { items, itemCount, totalPrice, updateQuantity, removeItem, clearCart } = useCart();
//   const router = useRouter();

//   const [isVerifying, setIsVerifying] = useState(false);
//   const [stockStatuses, setStockStatuses] = useState<Map<string, StockStatus>>(new Map());
//   const [verificationError, setVerificationError] = useState<string | null>(null);
//   const [hasVerified, setHasVerified] = useState(false);

//   // Fonction pour vérifier le panier via l'API
//   const verifyCart = async () => {
//     setIsVerifying(true);
//     setVerificationError(null);
//     setHasVerified(false);

//     try {

//       // Appel API
//       const response = await fetch('/api/produits/cart/verify-stock', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ items }),
//       });

//       const data = await response.json();

//       if (!response.ok || !data.success) {
//         throw new Error(data.error || 'Erreur lors de la vérification du panier');
//       }

//       // Créer une Map des statuts de stock
//       const statusMap = new Map<string, StockStatus>();
//       data.stockStatus.forEach((status: StockStatus) => {
//         const key = `${status.variantId}-${status.colorId}`;
//         statusMap.set(key, status);
//       });

//       setStockStatuses(statusMap);
//       setHasVerified(true);

//     } catch (error) {
//       console.error('Erreur vérification panier:', error);
//       setVerificationError(
//         error instanceof Error 
//           ? error.message 
//           : 'Impossible de vérifier le panier. Veuillez réessayer.'
//       );
//     } finally {
//       setIsVerifying(false);
//     }
//   };

//   // Vérifier le panier à l'ouverture
//   React.useEffect(() => {
//     if (isOpen && items.length > 0) {
//       verifyCart();
//     } else if (!isOpen) {
//       // Reset quand on ferme
//       setHasVerified(false);
//       setStockStatuses(new Map());
//       setVerificationError(null);
//     }
//   }, [isOpen]);

//   const handleCheckout = () => {
//     // Vérifier qu'il n'y a pas de problèmes de stock
//     const hasStockIssues = Array.from(stockStatuses.values()).some(
//       status => status.available < status.requested
//     );

//     if (hasStockIssues) {
//       alert('Certains articles ont un stock insuffisant. Veuillez ajuster les quantités.');
//       return;
//     }

//     onClose();
//     router.push('/checkout');
//   };


//   // const handleCheckout = () => {
//   //   onClose();
//   //   router.push('/checkout');
//   // };

//   if (!isOpen) return null;

//   // Fonction pour obtenir le statut d'un article
//   const getItemStatus = (item: CartItem) => {
//     const key = `${item.variantId}-${item.colorId}`;
//     return stockStatuses.get(key);
//   };

//   // Vérifier si on peut passer commande
//   const canCheckout = hasVerified && 
//     !isVerifying && 
//     !verificationError &&
//     items.length > 0 &&
//     !Array.from(stockStatuses.values()).some(status => status.available < status.requested);


//   return (
//     <>
//       {/* Overlay */}
//       <div
//         className="fixed inset-0 bg-black/50 z-50 transition-opacity"
//         onClick={onClose}
//       />
// {/* Drawer */}
//       <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col animate-slide-in">
//         {/* Header */}
//         <div className="flex items-center justify-between p-6 border-b border-gray-200">
//           <div className="flex items-center gap-3">
//             <ShoppingBag size={24} className="text-[#800080]" />
//             <div>
//               <h2 className="text-xl font-bold text-gray-900">Mon Panier</h2>
//               <p className="text-sm text-gray-500">{itemCount} article{itemCount > 1 ? 's' : ''}</p>
//             </div>
//           </div>
//           <button
//             onClick={onClose}
//             className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
//           >
//             <X size={24} />
//           </button>
//         </div>

//         {/* Contenu */}
//         {items.length === 0 ? (
//           // Panier vide
//           <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
//             <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
//               <ShoppingBag size={48} className="text-gray-400" />
//             </div>
//             <h3 className="text-xl font-semibold text-gray-900 mb-2">
//               Votre panier est vide
//             </h3>
//             <p className="text-gray-500 mb-6">
//               Ajoutez des produits pour commencer vos achats
//             </p>
//             <button
//               onClick={onClose}
//               className="px-6 py-3 bg-[#800080] text-white rounded-lg font-medium hover:bg-[#6b006b] transition-colors"
//             >
//               Continuer mes achats
//             </button>
//           </div>
//         ) : (
//           <>
//             {/* Message d'erreur global */}
//             {verificationError && (
//               <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
//                 <div className="flex items-start gap-3">
//                   <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
//                   <div className="flex-1">
//                     <p className="text-sm text-red-800 font-medium mb-2">Erreur de vérification</p>
//                     <p className="text-sm text-red-700">{verificationError}</p>
//                   </div>
//                 </div>
//                 <button
//                   onClick={verifyCart}
//                   className="mt-3 w-full py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
//                 >
//                   Réessayer la vérification
//                 </button>
//               </div>
//             )}

//             {/* Loader pendant la vérification */}
//             {isVerifying ? (
//               <div className="flex-1 flex flex-col items-center justify-center p-6">
//                 <Loader2 size={48} className="text-[#800080] animate-spin mb-4" />
//                 <h3 className="text-lg font-semibold text-gray-900 mb-2">
//                   Vérification en cours...
//                 </h3>
//                 <p className="text-sm text-gray-500 text-center">
//                   Nous vérifions la disponibilité de vos articles
//                 </p>
//               </div>
//             ) : (
//               <>
//                 {/* Liste des articles */}
//                 <div className="flex-1 overflow-y-auto p-6 space-y-4">
//                   {items.map(item => {
//                     const status = getItemStatus(item);
//                     const hasStockIssue = status && status.available < status.requested;
//                     const isOutOfStock = status && status.available === 0;
                    
//                     return (
//                       <div
//                         key={item.id}
//                         className={`bg-gray-50 rounded-xl p-4 relative hover:bg-gray-100 transition-colors ${
//                           hasStockIssue ? 'border-2 border-orange-400' : ''
//                         } ${isOutOfStock ? 'border-2 border-red-400 opacity-75' : ''}`}
//                       >
//                         {/* Avertissements de stock */}
//                         {hasVerified && hasStockIssue && (
//                           <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
//                             <div className="flex items-start gap-2">
//                               <AlertCircle size={16} className="text-orange-600 flex-shrink-0 mt-0.5" />
//                               <div className="flex-1">
//                                 {isOutOfStock ? (
//                                   <p className="text-xs text-orange-900 font-semibold">
//                                     ❌ Produit actuellement indisponible
//                                   </p>
//                                 ) : (
//                                   <>
//                                     <p className="text-xs text-orange-900 font-semibold mb-1">
//                                       ⚠️ Stock insuffisant
//                                     </p>
//                                     <p className="text-xs text-orange-800">
//                                       Demandé: {status.requested} • Disponible: {status.available}
//                                     </p>
//                                     <button
//                                       onClick={() => updateQuantity(item.id, status.available)}
//                                       className="mt-2 text-xs text-orange-700 font-medium underline hover:text-orange-800"
//                                     >
//                                       Ajuster à {status.available} unité{status.available > 1 ? 's' : ''}
//                                     </button>
//                                   </>
//                                 )}
//                               </div>
//                             </div>
//                           </div>
//                         )}

//                         {/* Bouton supprimer */}
//                         <button
//                           onClick={() => removeItem(item.id)}
//                           className="absolute top-2 right-2 p-1.5 hover:bg-red-100 rounded-lg text-gray-400 hover:text-red-600 transition-colors z-10"
//                         >
//                           <Trash2 size={16} />
//                         </button>

//                         <div className="flex gap-4">
//                           {/* Image */}
//                           <div className={`w-20 h-20 bg-white rounded-lg overflow-hidden flex-shrink-0 ${
//                             isOutOfStock ? 'grayscale' : ''
//                           }`}>
//                             <img
//                               src={item.image}
//                               alt={item.designation}
//                               className="w-full h-full object-cover"
//                             />
//                           </div>

//                           {/* Infos */}
//                           <div className="flex-1 min-w-0">
//                             <h3 className="font-semibold text-gray-900 truncate">
//                               {item.designation}
//                             </h3>
//                             <p className="text-sm text-gray-500">{item.brand}</p>
                            
//                             {/* Couleur et Stockage */}
//                             <div className="flex items-center gap-2 mt-1">
//                               <div
//                                 className="w-4 h-4 rounded-full border border-gray-300"
//                                 style={{ backgroundColor: item.colorHex }}
//                                 title={item.colorName}
//                               />
//                               <span className="text-xs text-gray-600">{item.colorName}</span>
//                               {item.storage && (
//                                 <>
//                                   <span className="text-xs text-gray-400">•</span>
//                                   <span className="text-xs text-gray-600">{item.storage}</span>
//                                 </>
//                               )}
//                             </div>

//                             {/* Localité */}
//                             <div className="mt-1">
//                               <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
//                                 {item.locality}
//                               </span>
//                             </div>

//                             {/* Prix et Quantité */}
//                             <div className="flex items-center justify-between mt-3">
//                               <div className="flex items-baseline gap-2">
//                                 <span className="text-lg font-bold text-[#800080]">
//                                   {(item.price || 0).toFixed(2)}€
//                                 </span>
//                                 {item.oldPrice && item.oldPrice > (item.price || 0) && (
//                                   <span className="text-sm text-gray-400 line-through">
//                                     {item.oldPrice.toFixed(2)}€
//                                   </span>
//                                 )}
//                               </div>

//                               {/* Contrôles quantité */}
//                               <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200">
//                                 <button
//                                   onClick={() => updateQuantity(item.id, item.quantity - 1)}
//                                   disabled={isOutOfStock}
//                                   className="p-1.5 hover:bg-gray-100 rounded-l-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//                                 >
//                                   <Minus size={14} />
//                                 </button>
//                                 <span className="w-8 text-center text-sm font-medium">
//                                   {item.quantity}
//                                 </span>
//                                 <button
//                                   onClick={() => updateQuantity(item.id, item.quantity + 1)}
//                                   disabled={
//                                     isOutOfStock || 
//                                     (status && item.quantity >= status.available)
//                                   }
//                                   className="p-1.5 hover:bg-gray-100 rounded-r-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//                                 >
//                                   <Plus size={14} />
//                                 </button>
//                               </div>
//                             </div>

//                             {/* Sous-total */}
//                             <div className="text-sm text-gray-500 mt-2">
//                               Sous-total: {((item.price || 0) * item.quantity).toFixed(2)}€
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                     );
//                   })}
//                 </div>

//                 {/* Footer avec total et actions */}
//                 <div className="border-t border-gray-200 p-6 space-y-4 bg-white">
//                   {/* Bouton vider le panier */}
//                   <button
//                     onClick={() => {
//                       if (confirm('Êtes-vous sûr de vouloir vider le panier ?')) {
//                         clearCart();
//                       }
//                     }}
//                     className="text-sm text-red-600 hover:text-red-700 font-medium"
//                   >
//                     Vider le panier
//                   </button>

//                   {/* Avertissement global si problèmes */}
//                   {hasVerified && !canCheckout && items.length > 0 && (
//                     <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
//                       <p className="text-sm text-orange-900 font-medium">
//                         ⚠️ Veuillez ajuster les quantités avant de commander
//                       </p>
//                     </div>
//                   )}

//                   {/* Total */}
//                   <div className="flex items-center justify-between py-4 border-t border-gray-200">
//                     <span className="text-lg font-semibold text-gray-900">Total</span>
//                     <span className="text-2xl font-bold text-[#800080]">
//                       {totalPrice.toFixed(2)}€
//                     </span>
//                   </div>

//                   {/* Boutons d'action */}
//                   <div className="space-y-3">
//                     <button
//                       onClick={handleCheckout}
//                       disabled={!canCheckout}
//                       className="w-full py-4 bg-[#800080] text-white rounded-xl font-semibold text-lg hover:bg-[#6b006b] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
//                     >
//                       {!hasVerified ? 'Vérification...' : 'Commander'}
//                       <ArrowRight size={20} />
//                     </button>
//                     <button
//                       onClick={onClose}
//                       className="w-full py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
//                     >
//                       Continuer mes achats
//                     </button>
//                   </div>
//                 </div>
//               </>
//             )}
//           </>
//         )}
//       </div>
//     </>
//   );
// };

// // ============================================
// // COMPOSANT ICÔNE PANIER (pour le header)
// // ============================================

// export const CartIcon: React.FC = () => {
//   const { itemCount } = useCart();
//   const [isDrawerOpen, setIsDrawerOpen] = useState(false);

//   return (
//     <>
//       <button
//         onClick={() => setIsDrawerOpen(true)}
//         className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
//       >
//         <ShoppingBag size={20} />
//         {itemCount > 0 && (
//           <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#800080] text-white text-xs font-bold rounded-full flex items-center justify-center">
//             {itemCount > 9 ? '9+' : itemCount}
//           </span>
//         )}
//       </button>

//       <CartDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
//     </>
//   );
// };