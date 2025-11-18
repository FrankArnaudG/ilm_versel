/**
 * StockMovementStats.tsx
 * 
 * Composant affichant les statistiques des mouvements de stock
 * sur les 7 derniers jours (configurable)
 * 
 * Fonctionnalités:
 * - Calcul automatique des entrées/sorties sur période donnée
 * - Variation nette du stock
 * - Nombre total de mouvements
 * - Design avec cartes colorées
 * 
 * Emplacement: src/components/stock/StockMovementStats.tsx
 */

import React from 'react';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface StockMovement {
  id: string;
  modelId: number;
  modelName: string;
  storeId: number;
  storeName: string;
  type: 'in' | 'out' | 'transfer_in' | 'transfer_out' | 'adjustment' | 'sale' | 'return';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  reference?: string;
  date: string;
  performedBy: {
    name: string;
    role: string;
    email: string;
  };
  notes?: string;
}

interface StockMovementStatsProps {
  movements: StockMovement[];
  days?: number; // Nombre de jours à analyser (par défaut 7)
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

const StockMovementStats: React.FC<StockMovementStatsProps> = ({ 
  movements, 
  days = 7 
}) => {
  // Filtrer les mouvements des X derniers jours
  const today = new Date();
  const recentMovements = movements.filter(m => {
    const movementDate = new Date(m.date);
    const diffDays = Math.floor((today.getTime() - movementDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= days;
  });

  // Calculer les statistiques
  const totalIn = recentMovements
    .filter(m => m.quantity > 0)
    .reduce((sum, m) => sum + m.quantity, 0);

  const totalOut = recentMovements
    .filter(m => m.quantity < 0)
    .reduce((sum, m) => sum + Math.abs(m.quantity), 0);

  const netChange = totalIn - totalOut;

  const movementsCount = recentMovements.length;
  const inMovementsCount = recentMovements.filter(m => m.quantity > 0).length;
  const outMovementsCount = recentMovements.filter(m => m.quantity < 0).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Entrées */}
      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
            <TrendingUp size={20} className="text-white" />
          </div>
          <div>
            <p className="text-xs text-green-700 font-semibold">
              Entrées ({days}j)
            </p>
            <p className="text-2xl font-bold text-green-900">+{totalIn}</p>
          </div>
        </div>
        <p className="text-xs text-green-600">
          {inMovementsCount} mouvement{inMovementsCount > 1 ? 's' : ''}
        </p>
      </div>

      {/* Sorties */}
      <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center">
            <TrendingDown size={20} className="text-white" />
          </div>
          <div>
            <p className="text-xs text-red-700 font-semibold">
              Sorties ({days}j)
            </p>
            <p className="text-2xl font-bold text-red-900">-{totalOut}</p>
          </div>
        </div>
        <p className="text-xs text-red-600">
          {outMovementsCount} mouvement{outMovementsCount > 1 ? 's' : ''}
        </p>
      </div>

      {/* Variation Nette */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
            <RefreshCw size={20} className="text-white" />
          </div>
          <div>
            <p className="text-xs text-blue-700 font-semibold">Variation nette</p>
            <p className={`text-2xl font-bold ${netChange >= 0 ? 'text-blue-900' : 'text-red-900'}`}>
              {netChange >= 0 ? '+' : ''}{netChange}
            </p>
          </div>
        </div>
        <p className="text-xs text-blue-600">
          {movementsCount} mouvement{movementsCount > 1 ? 's' : ''} totaux
        </p>
      </div>
    </div>
  );
};

export default StockMovementStats;