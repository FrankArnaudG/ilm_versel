// contexts/StoresContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useCurrentUser } from '@/ts/hooks/use-current-user';
import { StoreStatus } from '@/lib/types';

// ============================================================================
// TYPES
// ============================================================================

interface Store {
  id: string;
  code: string;
  name: string;
  city: string;
  country: string;
  department: string;
  address: string;
  currency: string;
  timezone: string;
  status: StoreStatus; 
  company?: string;
  phone?: string;
  email?: string;
  openingDate?: string;
  manager?: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  _count?: {
    employees: number;
  };
}

interface StoresContextType {
  stores: Store[];
  loading: boolean;
  error: string;
  selectedRole: string;
  setSelectedRole: (role: string) => void;
  refetchStores: () => Promise<void>;
  getStoreById: (id: string) => Store | undefined;
}

// ============================================================================
// CONTEXT
// ============================================================================

const StoresContext = createContext<StoresContextType | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

export function StoresProvider({ children }: { children: ReactNode }) {
  const user = useCurrentUser();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  // Initialiser le rôle sélectionné
  useEffect(() => {
    if (user?.role && !selectedRole) {
      setSelectedRole(user.role);
    }
  }, [user?.role, selectedRole]);

  // Fonction fetch exactement comme dans StoresPage
  const fetchStores = async () => {
    if (!user?.id || !selectedRole) {
      setStores([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/stores?user_id=${user.id}&role=${selectedRole}`);
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.message || 'Erreur lors du chargement');
        setStores([]);
        return;
      }
      
      // L'API retourne soit 'stores' (array) soit 'canViewOwnStore' (object)
      const storesList = data.stores || (data.canViewOwnStore ? [data.canViewOwnStore] : []);
      setStores(storesList);
      
    } catch (err) {
      console.error('Erreur fetchStores:', err);
      setError("Erreur lors de la récupération des boutiques");
      setStores([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper pour récupérer un store par ID
  const getStoreById = (id: string): Store | undefined => {
    return stores.find(store => store.id === id);
  };

  // Charger les boutiques au montage et quand le rôle change
  useEffect(() => {
    fetchStores();
  }, [user?.id, selectedRole]);

  return (
    <StoresContext.Provider 
      value={{ 
        stores, 
        loading, 
        error, 
        selectedRole, 
        setSelectedRole, 
        refetchStores: fetchStores,
        getStoreById
      }}
    >
      {children}
    </StoresContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useStores() {
  const context = useContext(StoresContext);
  if (!context) {
    throw new Error('useStores must be used within StoresProvider');
  }
  return context;
}

// ============================================================================
// EXPORTS
// ============================================================================

export type { Store, StoresContextType };