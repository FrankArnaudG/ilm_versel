// Configuration des comptes Chronopost par localité
export const CHRONOPOST_CONFIG = {
  development: {
    // Compte test pour TOUTES les localités en DEV
    accountNumber: '19869502',
    password: '255562',
  },
  production: {
    Martinique: {
      accountNumber: '11921204', // Ecocom
      password: '255562',
    },
    Guadeloupe: {
      accountNumber: '11893804', // Ecogwada
      password: '255562',
    },
    Guyane: {
      accountNumber: '11857604', // Ecoco@m
      password: '255562',
    },
  },
  // Code produit pour livraison à domicile
  productCode: '17',
  // Codes pays DOM-TOM
  countryCodes: {
    Martinique: 'MQ',
    Guadeloupe: 'GP',
    Guyane: 'GF',
  },
};

export function getChronopostCredentials(locality: string) {
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    return CHRONOPOST_CONFIG.development;
  }
  
  const config = CHRONOPOST_CONFIG.production[locality as keyof typeof CHRONOPOST_CONFIG.production];
  
  if (!config) {
    throw new Error(`Configuration Chronopost introuvable pour: ${locality}`);
  }
  
  return config;
}