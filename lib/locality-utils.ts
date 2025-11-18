// lib/locality-utils.ts
// Utilitaires pour la gestion des localités

import { NextResponse } from "next/server";

/**
 * Mapping des localités vers leurs IDs dans la base de données
 */
export const LOCALITY_IDS = {
  Martinique: 'cmhdemwlf000exd6k9xme6c3z',
  Guadeloupe: 'cmhdewrpn000lxd6k3gkef4rz',
  Guyane: 'cmhp99zbd0007xd3wax98iddg',
} as const;

/**
 * Type pour les noms de localités valides
 */
export type LocalityName = keyof typeof LOCALITY_IDS;

/**
 * Vérifie si une localité est valide
 */
export function isValidLocality(locality: string): locality is LocalityName {
  return locality in LOCALITY_IDS;
}

/**
 * Récupère l'ID d'une localité
 * @param locality - Nom de la localité
 * @returns L'ID de la localité ou null si invalide
 */
export function getLocalityId(locality: string): string | null {
  if (isValidLocality(locality)) {
    return LOCALITY_IDS[locality];
  }
  return null;
}

/**
 * Récupère l'ID d'une localité ou retourne une réponse d'erreur
 * @param locality - Nom de la localité
 * @returns L'ID de la localité ou une NextResponse d'erreur
 */
export function getLocalityIdOrError(
  locality: string
): string | NextResponse<{ message: string }> {
  const localityId = getLocalityId(locality);
  
  if (!localityId) {
    return NextResponse.json(
      { message: 'Localité non reconnue' },
      { status: 400 }
    );
  }
  
  return localityId;
}