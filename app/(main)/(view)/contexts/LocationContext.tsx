// localisation
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Fonctions utilitaires pour gérer les cookies
const setCookie = (name: string, value: string, days: number = 365) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
};

const getCookie = (name: string): string | null => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

const deleteCookie = (name: string) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

interface Location {
  id: string;
  name: string;
  icon: string;
  deliveryTime: string;
}

interface LocationData {
  location: Location;
  timestamp: number;
  userId?: string;
}

interface LocationContextType {
  selectedLocation: Location | null;
  setSelectedLocation: (location: Location | null, userId?: string) => void;
  allLocations: Location[];
  shouldShowConfirmPopup: boolean;
  setShouldShowConfirmPopup: (show: boolean) => void;
  checkLocationExpiry: (isUserConnected: boolean) => boolean;
  loadUserLocation: (userId: string, userLocation?: string) => void;
  isInitialized: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const locations: Location[] = [
  { 
    id: 'cmhnnz9gk000exdr0q25cpqcus', 
    name: 'Martinique', 
    icon: '🏝️',
    deliveryTime: '2h à 24h'
  },
  { 
    id: 'cmhdewrpn000lxd6k3gkef4rz', 
    name: 'Guadeloupe', 
    icon: '🌴',
    deliveryTime: '2h à 24h'
  },
  { 
    id: 'cmhnnvf7n000axdr0gbfcf0yr', 
    name: 'Guyane', 
    icon: '🌿',
    deliveryTime: '2h à 24h'
  }
];

// Localisation par défaut : Guadeloupe
export const DEFAULT_LOCATION: Location = {
  id: 'cmhdewrpn000lxd6k3gkef4rz', 
  name: 'Guadeloupe', 
  icon: '🌴',
  deliveryTime: '2h à 24h'
};

const LOCATION_EXPIRY_TIME = 365 * 24 * 60 * 60 * 1000; // 365 jours en millisecondes

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const [selectedLocation, setSelectedLocationState] = useState<Location | null>(null);
  const [shouldShowConfirmPopup, setShouldShowConfirmPopup] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Vérifier si la localisation a expiré
  const checkLocationExpiry = (isUserConnected: boolean): boolean => {
    // Si l'utilisateur EST connecté, on ne vérifie PAS l'expiration du cache
    if (isUserConnected) {
      return false;
    }

    // Si l'utilisateur N'EST PAS connecté, on vérifie l'expiration du cache
    const savedData = localStorage.getItem('userLocationData');
    if (!savedData) return false;

    try {
      const locationData: LocationData = JSON.parse(savedData);
      const currentTime = Date.now();
      const timeDiff = currentTime - locationData.timestamp;

      // Si plus de 24h et utilisateur NON connecté
      if (timeDiff > LOCATION_EXPIRY_TIME) {
        return true; // Afficher popup de confirmation
      }
      return false;
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'expiration:', error);
      return false;
    }
  };

  // Charger la localisation de l'utilisateur connecté depuis la BDD
  const loadUserLocation = (userId: string, userLocationId?: string) => {
    if (userLocationId) {
      const location = locations.find(loc => loc.id === userLocationId);
      if (location) {
        setSelectedLocationState(location);
        // Sauvegarder dans le cache avec l'ID utilisateur
        const locationData: LocationData = {
          location,
          timestamp: Date.now(),
          userId: userId
        };
        localStorage.setItem('userLocationData', JSON.stringify(locationData));
        localStorage.setItem('locationConfirmed', 'true');
        
        // Sauvegarder dans un cookie pour accès côté serveur
        setCookie('userLocation', location.name, 365);
        setCookie('locationConfirmed', 'true', 365);
      }
    }
  };

  // Charger la localisation depuis localStorage et cookie au démarrage
  useEffect(() => {
    // Essayer d'abord de lire depuis le cookie (priorité pour SSR)
    const cookieLocationName = getCookie('userLocation');
    const locationConfirmed = localStorage.getItem('locationConfirmed');
    
    let locationToSet: Location | null = null;
    
    // Si on a un cookie, l'utiliser
    if (cookieLocationName) {
      const location = locations.find(loc => loc.name === cookieLocationName);
      if (location) {
        locationToSet = location;
      }
    }
    
    // Sinon, essayer le localStorage
    if (!locationToSet) {
      const savedData = localStorage.getItem('userLocationData');
      if (savedData) {
        try {
          const locationData: LocationData = JSON.parse(savedData);
          const location = locations.find(loc => loc.id === locationData.location.id);
          if (location) {
            locationToSet = location;
            // Synchroniser avec le cookie
            setCookie('userLocation', location.name, 365);
          }
        } catch (error) {
          console.error('Erreur lors du chargement de la localisation:', error);
        }
      }
    }
    
    // Si toujours pas de localisation, utiliser la localisation par défaut
    if (!locationToSet) {
      locationToSet = DEFAULT_LOCATION;
      // Définir le cookie par défaut
      setCookie('userLocation', DEFAULT_LOCATION.name, 365);
      // Ne pas marquer comme confirmé pour montrer le popup de confirmation
      if (locationConfirmed !== 'true') {
        setShouldShowConfirmPopup(true);
      }
    }
    
    setSelectedLocationState(locationToSet);
    setIsInitialized(true);
  }, []);

  const setSelectedLocation = (location: Location | null, userId?: string) => {
    setSelectedLocationState(location);
    
    if (location) {
      const locationData: LocationData = {
        location,
        timestamp: Date.now(),
        userId: userId
      };
      
      // Sauvegarder dans localStorage
      localStorage.setItem('userLocationData', JSON.stringify(locationData));
      localStorage.setItem('locationConfirmed', 'true');
      
      // Sauvegarder dans un cookie pour accès côté serveur
      setCookie('userLocation', location.name, 365);
      setCookie('locationConfirmed', 'true', 365);
    } else {
      localStorage.removeItem('userLocationData');
      localStorage.removeItem('locationConfirmed');
      deleteCookie('userLocation');
      deleteCookie('locationConfirmed');
    }
  };

  return (
    <LocationContext.Provider value={{ 
      selectedLocation, 
      setSelectedLocation,
      allLocations: locations,
      shouldShowConfirmPopup,
      setShouldShowConfirmPopup,
      checkLocationExpiry,
      loadUserLocation,
      isInitialized
    }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation doit être utilisé dans un LocationProvider');
  }
  return context;
};