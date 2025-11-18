// ============================================
// lib/locality.ts
// Gestion des localités et mapping vers storeId
// ============================================

/**
 * Types des localités supportées
 */
export type Locality = 'Martinique' | 'Guadeloupe' | 'Guyane';

/**
 * Configuration des stores par localité
 */
export const LOCALITY_STORE_MAP: Record<Locality, string> = {
  Martinique: 'cmhnnz9gk000exdr0q25cpqcu',
  Guadeloupe: 'cmhkfvgu6000txdbcf560322v',
  Guyane: 'cmhp99zbd0007xd3wax98iddg',
} as const;

/**
 * Liste des localités valides
 */
export const VALID_LOCALITIES = Object.keys(LOCALITY_STORE_MAP) as Locality[];

/**
 * Vérifie si une localité est valide
 * @param locality - La localité à vérifier
 * @returns true si la localité est valide
 */
export function isValidLocality(locality: string): locality is Locality {
  return VALID_LOCALITIES.includes(locality as Locality);
}

/**
 * Récupère le storeId associé à une localité
 * @param locality - La localité
 * @returns Le storeId correspondant
 * @throws Error si la localité n'est pas reconnue
 */
export function getStoreIdByLocality(locality: string): string {
  if (!isValidLocality(locality)) {
    throw new Error(`Localité non reconnue: ${locality}. Localités valides: ${VALID_LOCALITIES.join(', ')}`);
  }
  
  return LOCALITY_STORE_MAP[locality];
}

/**
 * Récupère le storeId de manière sécurisée (retourne null si invalide)
 * @param locality - La localité
 * @returns Le storeId ou null si la localité est invalide
 */
export function getStoreIdSafe(locality: string): string | null {
  try {
    return getStoreIdByLocality(locality);
  } catch {
    return null;
  }
}

/**
 * Récupère la localité associée à un storeId
 * @param storeId - L'identifiant du store
 * @returns La localité correspondante ou null
 */
export function getLocalityByStoreId(storeId: string): Locality | null {
  const entry = Object.entries(LOCALITY_STORE_MAP).find(
    ([, id]) => id === storeId
  );
  return entry ? (entry[0] as Locality) : null;
}