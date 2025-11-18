'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// ============================================
// TYPES
// ============================================

export interface CartItem {
  id: string;                          // ID unique pour cet item dans le panier
  productModelId: string;              // ID du ProductModel
  variantId: string;                   // ID de la variante sélectionnée
  colorId: string;                     // ID de la couleur sélectionnée
  
  // Informations d'affichage
  designation: string;                 // Nom du produit
  brand: string;                       // Marque
  colorName: string;                   // Nom de la couleur
  colorHex: string;                    // Code hexa de la couleur
  storage: string | null;              // Stockage (256GB, etc.)
  image: string;                       // URL de l'image
  
  // Prix et quantité
  price: number;                       // Prix unitaire TTC
  oldPrice?: number;                   // Ancien prix (si promo)
  quantity: number;                    // Quantité
  
  // Stock et boutique
  availableStock: number;              // Stock disponible
  storeId: string;                     // ID de la boutique
  storeName: string;                   // Nom de la boutique
  locality: string;                    // Localité (Martinique, Guadeloupe, Guyane)
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  totalPrice: number;
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  isInCart: (variantId: string, colorId: string) => boolean;
  getItemByVariant: (variantId: string, colorId: string) => CartItem | undefined;
}

// ============================================
// CONTEXTE
// ============================================

const CartContext = createContext<CartContextType | undefined>(undefined);

// ============================================
// PROVIDER
// ============================================

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  // ============================================
  // PERSISTENCE : Charger depuis localStorage
  // ============================================
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setItems(parsedCart);
      } catch (error) {
        console.error('Erreur chargement panier:', error);
        localStorage.removeItem('cart');
      }
    }
  }, []);

  // ============================================
  // PERSISTENCE : Sauvegarder dans localStorage
  // ============================================
  useEffect(() => {
    if (items.length > 0) {
      localStorage.setItem('cart', JSON.stringify(items));
    } else {
      localStorage.removeItem('cart');
    }
  }, [items]);

  // ============================================
  // CALCULS
  // ============================================
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = items.reduce((total, item) => {
    const itemTotal = (item.price || 0) * item.quantity;
    console.log('💰 Calcul prix:', {
      designation: item.designation,
      price: item.price,
      quantity: item.quantity,
      itemTotal,
      currentTotal: total
    });
    return total + itemTotal;
  }, 0);
  
  console.log('🛒 Panier total:', { itemCount, totalPrice, items });

  // ============================================
  // AJOUTER UN ARTICLE
  // ============================================
  const addItem = (newItem: Omit<CartItem, 'id'>) => {
    console.log('🔍 Tentative d\'ajout au panier:', newItem);
    
    // ✅ VALIDATION DES DONNÉES
    if (!newItem.price || typeof newItem.price !== 'number' || newItem.price <= 0) {
      console.error('❌ Prix invalide:', {
        price: newItem.price,
        type: typeof newItem.price,
        newItem
      });
      alert('Erreur : Prix du produit invalide');
      return;
    }

    if (!newItem.variantId || !newItem.colorId) {
      console.error('❌ Variante ou couleur invalide:', newItem);
      alert('Erreur : Variante du produit invalide');
      return;
    }

    if (newItem.quantity <= 0) {
      console.error('❌ Quantité invalide:', newItem);
      alert('Erreur : Quantité invalide');
      return;
    }

    console.log('✅ Validation réussie, ajout en cours...');

    setItems(prevItems => {
      // Vérifier si l'article existe déjà (même variante + couleur)
      const existingItemIndex = prevItems.findIndex(
        item => item.variantId === newItem.variantId && item.colorId === newItem.colorId
      );

      if (existingItemIndex > -1) {
        // Article existe déjà : augmenter la quantité
        const updatedItems = [...prevItems];
        const existingItem = updatedItems[existingItemIndex];
        
        // Vérifier le stock disponible
        const newQuantity = existingItem.quantity + newItem.quantity;
        if (newQuantity <= existingItem.availableStock) {
          updatedItems[existingItemIndex] = {
            ...existingItem,
            quantity: newQuantity
          };
          console.log('✅ Quantité mise à jour:', updatedItems[existingItemIndex]);
          return updatedItems;
        } else {
          // Stock insuffisant
          alert(`Stock insuffisant ! Maximum disponible : ${existingItem.availableStock}`);
          return prevItems;
        }
      } else {
        // Nouvel article : l'ajouter
        const cartItem: CartItem = {
          ...newItem,
          id: `${newItem.variantId}-${newItem.colorId}-${Date.now()}`, // ID unique
          price: Number(newItem.price), // ✅ S'assurer que c'est un nombre
          oldPrice: newItem.oldPrice ? Number(newItem.oldPrice) : undefined,
          quantity: Number(newItem.quantity)
        };
        
        console.log('✅ Nouvel article ajouté au panier:', {
          cartItem,
          priceType: typeof cartItem.price,
          price: cartItem.price,
          quantity: cartItem.quantity,
          total: cartItem.price * cartItem.quantity
        });
        return [...prevItems, cartItem];
      }
    });
  };

  // ============================================
  // RETIRER UN ARTICLE
  // ============================================
  const removeItem = (itemId: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };

  // ============================================
  // METTRE À JOUR LA QUANTITÉ
  // ============================================
  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }

    setItems(prevItems => {
      return prevItems.map(item => {
        if (item.id === itemId) {
          // Vérifier le stock disponible
          if (quantity <= item.availableStock) {
            return { ...item, quantity };
          } else {
            alert(`Stock insuffisant ! Maximum disponible : ${item.availableStock}`);
            return item;
          }
        }
        return item;
      });
    });
  };

  // ============================================
  // VIDER LE PANIER
  // ============================================
  const clearCart = () => {
    setItems([]);
    localStorage.removeItem('cart');
  };

  // ============================================
  // VÉRIFIER SI UN ARTICLE EST DANS LE PANIER
  // ============================================
  const isInCart = (variantId: string, colorId: string): boolean => {
    return items.some(item => item.variantId === variantId && item.colorId === colorId);
  };

  // ============================================
  // RÉCUPÉRER UN ARTICLE PAR VARIANTE
  // ============================================
  const getItemByVariant = (variantId: string, colorId: string): CartItem | undefined => {
    return items.find(item => item.variantId === variantId && item.colorId === colorId);
  };

  // ============================================
  // VALEUR DU CONTEXTE
  // ============================================
  const value: CartContextType = {
    items,
    itemCount,
    totalPrice,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    isInCart,
    getItemByVariant
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

// ============================================
// HOOK PERSONNALISÉ
// ============================================

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart doit être utilisé dans un CartProvider');
  }
  return context;
};