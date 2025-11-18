'use client';

import React from 'react';
import { GitCompare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useComparator } from '../../contexts/ComparatorContext';

export const ComparatorButton = () => {
  const router = useRouter();
  const { products } = useComparator();

  const handleClick = () => {
    router.push('/comparateur');
  };

  return (
    <button
      onClick={handleClick}
      className="relative p-2 text-gray-700 hover:text-[#800080] hover:bg-[#f3e8ff] rounded-lg transition-all duration-200"
      title="Comparateur de produits"
    >
      <GitCompare size={20} />
      {products.length > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#800080] text-white text-xs font-bold rounded-full flex items-center justify-center">
          {products.length}
        </span>
      )}
    </button>
  );
};

