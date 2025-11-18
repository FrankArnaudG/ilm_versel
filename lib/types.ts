/**
 * Enum pour le statut d'un utilisateur
 * Correspond à l'enum UserStatus dans Prisma
 */
export enum StoreStatus {
  ACTIVE = 'ACTIVE',       // Utilisateur actif, peut se connecter
  INACTIVE = 'INACTIVE',   // Utilisateur inactif, ne peut pas se connecter
  SUSPENDED = 'SUSPENDED'  // Utilisateur suspendu temporairement
}

// Constantes
export const EUR_TO_FCFA_RATE = 655.957;