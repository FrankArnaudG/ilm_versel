'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  image: string;
  price: number;
  oldPrice?: number;
  rating?: string;
  reviews?: string;
  totalReviews?: number;
  specifications?: Record<string, string | number | boolean>;
}

interface ComparatorContextType {
  products: Product[];
  addProduct: (product: Product) => void;
  removeProduct: (productId: string) => void;
  clearProducts: () => void;
  isComparatorOpen: boolean;
  openComparator: () => void;
  closeComparator: () => void;
  canAddMore: boolean;
}

const ComparatorContext = createContext<ComparatorContextType | undefined>(undefined);

export const ComparatorProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isComparatorOpen, setIsComparatorOpen] = useState(false);

  // Charger les produits depuis le localStorage au montage
  useEffect(() => {
    const savedProducts = localStorage.getItem('comparatorProducts');
    if (savedProducts) {
      try {
        setProducts(JSON.parse(savedProducts));
      } catch (error) {
        console.error('Erreur lors du chargement des produits:', error);
      }
    }
  }, []);

  // Sauvegarder les produits dans le localStorage à chaque changement
  useEffect(() => {
    localStorage.setItem('comparatorProducts', JSON.stringify(products));
  }, [products]);

  const addProduct = (product: Product) => {
    if (products.length >= 3) {
      alert('Vous ne pouvez comparer que 3 produits maximum');
      return;
    }
    
    if (products.find(p => p.id === product.id)) {
      alert('Ce produit est déjà dans le comparateur');
      return;
    }

    setProducts([...products, product]);
  };

  const removeProduct = (productId: string) => {
    setProducts(products.filter(p => p.id !== productId));
  };

  const clearProducts = () => {
    setProducts([]);
  };

  const openComparator = () => {
    setIsComparatorOpen(true);
  };

  const closeComparator = () => {
    setIsComparatorOpen(false);
  };

  const canAddMore = products.length < 3;

  return (
    <ComparatorContext.Provider
      value={{
        products,
        addProduct,
        removeProduct,
        clearProducts,
        isComparatorOpen,
        openComparator,
        closeComparator,
        canAddMore,
      }}
    >
      {children}
    </ComparatorContext.Provider>
  );
};

export const useComparator = () => {
  const context = useContext(ComparatorContext);
  if (context === undefined) {
    throw new Error('useComparator must be used within a ComparatorProvider');
  }
  return context;
};


