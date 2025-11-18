export interface CompanyInfo {
  name: string;
  siren: string;
  tva: string;
  tvaRate: number; // Taux de TVA en pourcentage
  address: string;
  email: string;
  phone: string;
}

export const getCompanyByLocation = (locationName: string | undefined): CompanyInfo => {
  switch (locationName) {
    case 'Guyane':
      return {
        name: 'ECOCOM',
        siren: '791956998',
        tva: 'FR51791956998',
        tvaRate: 0, // Guyane : exonération de TVA
        address: 'IMMEUBLE BOURDIN 8 RUE DU CAPITAINE BERNARD 97300 CAYENNE',
        email: '[contact@ecocom-guyane.fr]',
        phone: '[+594 594 12 34 56]'
      };
    
    case 'Martinique':
      return {
        name: 'ECOCOMAM',
        siren: '812384188',
        tva: 'FR28812384188',
        tvaRate: 8.5, // Martinique : TVA à 8.5%
        address: 'CTRE CCIAL LA GALLERIA 97232 LE LAMENTIN',
        email: '[contact@ecocomam.fr]',
        phone: '[+596 596 98 76 54]'
      };
    
    case 'Guadeloupe':
      return {
        name: 'ECOGWADA',
        siren: '812553022',
        tva: 'FR93812553022',
        tvaRate: 8.5, // Guadeloupe : TVA à 8.5%
        address: 'CCIAL COEUR DE JARRY HOUELBOURG ZI DE JARRY 97122 BAIE MAHAULT',
        email: '[contact@ecogwada.fr]',
        phone: '[+590 590 45 67 89]'
      };
    
    default:
      // Valeur par défaut si aucune location n'est sélectionnée
      return {
        name: '',
        siren: '',
        tva: 'FR45678912345',
        tvaRate: 0,
        address: '',
        email: '',
        phone: ''
      };
  }
};