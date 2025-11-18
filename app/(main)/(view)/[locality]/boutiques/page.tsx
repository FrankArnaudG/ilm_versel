'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, Plus, X, Phone, ExternalLink, Navigation, Loader2, Edit, Trash2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useCurrentUser, useHasRole } from '@/ts/hooks/use-current-user';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { Navbar } from '../../components/Navbar';
import { useLocation, DEFAULT_LOCATION } from '../../contexts/LocationContext';

// Import dynamique de react-leaflet pour éviter les erreurs SSR
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

// // Import de L pour les icônes
// let L: typeof import('leaflet') | undefined;
// if (typeof window !== 'undefined') {
//   L = require('leaflet');
  
//   if (L) {
//     // Fix pour les icônes par défaut de Leaflet
//     delete (L.Icon.Default.prototype as any)._getIconUrl;
//     L.Icon.Default.mergeOptions({
//       iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
//       iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
//       shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
//     });
//   }
// }

// Import de L pour les icônes
let L: typeof import('leaflet') | undefined;
if (typeof window !== 'undefined') {
  import('leaflet').then((leafletModule) => {
    L = leafletModule;
    
    if (L) {
      // Fix pour les icônes par défaut de Leaflet
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });
    }
  });
}

interface OfflineStoreLocation {
  id: string;
  nom: string;
  departement: string;
  adresse: string;
  latitude: number | string | Decimal;
  longitude: number | string | Decimal;
  telephone: string | null;
  google_map_link: string | null;
  createdAt: string;
  updatedAt: string;
}

// Type pour Decimal de Prisma
type Decimal = {
  toString(): string;
  toNumber(): number;
}

// Coordonnées de centrage et zoom par département
const LOCATION_CONFIG: Record<string, { center: [number, number]; zoom: number }> = {
  Martinique: { center: [14.6415, -61.0242], zoom: 11 },
  Guadeloupe: { center: [16.2650, -61.5510], zoom: 10 },
  Guyane: { center: [4.9224, -52.3135], zoom: 7 },
};

export default function BoutiquesPage() {
  const params = useParams();
  const router = useRouter();
  const { selectedLocation, isInitialized } = useLocation();
  const locality = params?.locality as string;
  const user = useCurrentUser();
  const isSuperAdmin = useHasRole('SUPER_ADMIN');

  const [boutiques, setBoutiques] = useState<OfflineStoreLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBoutique, setEditingBoutique] = useState<OfflineStoreLocation | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  
  // État pour contrôler le centre et le zoom de la carte
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [mapZoom, setMapZoom] = useState<number | null>(null);

  // Formulaire
  const [formData, setFormData] = useState({
    nom: '',
    adresse: '',
    latitude: '',
    longitude: '',
    telephone: '',
    google_map_link: '',
  });
  
  // Vérifier si la localité existe dans les configurations
  const isValidLocality = locality && locality in LOCATION_CONFIG;
  
  // Rediriger si la localité n'existe pas
  useEffect(() => {
    if (!isInitialized) return;
    
    if (!isValidLocality) {
      // Utiliser la localité choisie par l'utilisateur ou la localité par défaut
      const targetLocality = selectedLocation?.name || DEFAULT_LOCATION.name;
      router.replace(`/${targetLocality}/boutiques`);
    }
  }, [isValidLocality, isInitialized, selectedLocation, router]);

  // Charger les boutiques
  useEffect(() => {
    const loadBoutiques = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/boutiques/${locality}`);
        const data = await response.json();

        if (data.success) {
          console.log('Boutiques chargées:', data.data);
          console.log('Nombre de boutiques:', data.data?.length || 0);
          if (data.data && data.data.length > 0) {
            console.log('Première boutique:', data.data[0]);
            console.log('Coordonnées première boutique:', {
              lat: data.data[0].latitude,
              lng: data.data[0].longitude,
              latType: typeof data.data[0].latitude,
              lngType: typeof data.data[0].longitude
            });
          }
          setBoutiques(data.data || []);
        } else {
          setError(data.message || 'Erreur lors du chargement des boutiques');
        }
      } catch (err) {
        setError('Erreur lors du chargement des boutiques');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (locality && isValidLocality) {
      loadBoutiques();
    }
  }, [locality, isValidLocality]);
  
  // Si la localité n'est pas valide, ne rien afficher pendant la redirection
  if (!isValidLocality || !isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#800080] mx-auto mb-4"></div>
          <p className="text-gray-600">Redirection...</p>
        </div>
      </div>
    );
  }

  // Gérer le formulaire
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Ouvrir le modal d'édition
  const handleEdit = (boutique: OfflineStoreLocation) => {
    setEditingBoutique(boutique);
    const lat = typeof boutique.latitude === 'object' && 'toNumber' in boutique.latitude 
      ? boutique.latitude.toNumber() 
      : Number(boutique.latitude);
    const lng = typeof boutique.longitude === 'object' && 'toNumber' in boutique.longitude 
      ? boutique.longitude.toNumber() 
      : Number(boutique.longitude);
    
    setFormData({
      nom: boutique.nom,
      adresse: boutique.adresse,
      latitude: lat.toString(),
      longitude: lng.toString(),
      telephone: boutique.telephone || '',
      google_map_link: boutique.google_map_link || '',
    });
    setShowEditModal(true);
  };

  // Fermer le modal d'édition
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingBoutique(null);
    setFormData({
      nom: '',
      adresse: '',
      latitude: '',
      longitude: '',
      telephone: '',
      google_map_link: '',
    });
  };

  // Supprimer une boutique
  const handleDelete = async (boutiqueId: string) => {
    if (!user || !isSuperAdmin) {
      setError('Vous devez être connecté en tant que SUPER_ADMIN pour supprimer une boutique');
      return;
    }

    if (!confirm('Êtes-vous sûr de vouloir supprimer cette boutique ?')) {
      return;
    }

    try {
      setDeleting(boutiqueId);
      setError(null);

      const response = await fetch(`/api/boutiques/${locality}/${boutiqueId}?user_id=${user.id}&role=SUPER_ADMIN`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        // Recharger les boutiques
        const reloadResponse = await fetch(`/api/boutiques/${locality}`);
        const reloadData = await reloadResponse.json();
        if (reloadData.success) {
          setBoutiques(reloadData.data);
        }
      } else {
        setError(data.message || 'Erreur lors de la suppression de la boutique');
      }
    } catch (err) {
      setError('Erreur lors de la suppression de la boutique');
      console.error(err);
    } finally {
      setDeleting(null);
    }
  };

  // Soumettre le formulaire (ajout ou modification)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !isSuperAdmin) {
      setError('Vous devez être connecté en tant que SUPER_ADMIN pour effectuer cette action');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const isEditing = !!editingBoutique;
      const url = isEditing 
        ? `/api/boutiques/${locality}/${editingBoutique.id}`
        : `/api/boutiques/${locality}`;

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          role: 'SUPER_ADMIN',
          nom: formData.nom,
          adresse: formData.adresse,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          telephone: formData.telephone || null,
          google_map_link: formData.google_map_link || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Recharger les boutiques
        const reloadResponse = await fetch(`/api/boutiques/${locality}`);
        const reloadData = await reloadResponse.json();
        if (reloadData.success) {
          setBoutiques(reloadData.data);
        }

        // Réinitialiser le formulaire
        setFormData({
          nom: '',
          adresse: '',
          latitude: '',
          longitude: '',
          telephone: '',
          google_map_link: '',
        });
        setShowAddModal(false);
        handleCloseEditModal();
      } else {
        setError(data.message || `Erreur lors de ${isEditing ? 'la modification' : 'la création'} de la boutique`);
      }
    } catch (err) {
      setError(`Erreur lors de ${editingBoutique ? 'la modification' : 'la création'} de la boutique`);
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Obtenir les coordonnées de centrage et le zoom
  const locationConfig = LOCATION_CONFIG[locality] || { center: [14.6415, -61.0242] as [number, number], zoom: 11 };
  const center = mapCenter || locationConfig.center;
  const zoom = mapZoom !== null ? mapZoom : locationConfig.zoom;
  
  // Fonction pour centrer la carte sur une boutique
  const handleFocusBoutique = (boutique: OfflineStoreLocation) => {
    let lat: number;
    let lng: number;
    
    try {
      if (typeof boutique.latitude === 'object' && boutique.latitude !== null && 'toNumber' in boutique.latitude) {
        lat = (boutique.latitude as Decimal).toNumber();
      } else if (typeof boutique.latitude === 'string') {
        lat = parseFloat(boutique.latitude);
      } else {
        lat = Number(boutique.latitude);
      }
      
      if (typeof boutique.longitude === 'object' && boutique.longitude !== null && 'toNumber' in boutique.longitude) {
        lng = (boutique.longitude as Decimal).toNumber();
      } else if (typeof boutique.longitude === 'string') {
        lng = parseFloat(boutique.longitude);
      } else {
        lng = Number(boutique.longitude);
      }
      
      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        setMapCenter([lat, lng]);
        setMapZoom(15); // Zoom plus proche pour voir la boutique
      }
    } catch (err) {
      console.error('Erreur lors du centrage sur la boutique:', err);
    }
  };
  
  // Réinitialiser le centrage de la carte
  const handleResetMap = () => {
    setMapCenter(null);
    setMapZoom(null);
  };

  // Fonctions pour Google Maps
  const getGoogleMapsUrl = (latitude: number, longitude: number) => {
    return `https://www.google.com/maps?q=${latitude},${longitude}`;
  };

  const getDirectionsUrl = (latitude: number, longitude: number) => {
    return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600 mb-4" />
          <p className="text-gray-600">Chargement des boutiques...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Nos Boutiques - {locality}
              </h1>
              <p className="text-gray-600">
                Retrouvez toutes nos boutiques physiques dans le département
              </p>
            </div>
            {isSuperAdmin && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus size={20} />
                Ajouter une boutique
              </button>
            )}
          </div>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Carte */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden h-[600px] relative">
              {typeof window !== 'undefined' && L && !loading && (
                <MapContainer
                  center={center}
                  zoom={zoom}
                  style={{ height: '100%', width: '100%', zIndex: 0 }}
                  key={`map-${mapCenter ? mapCenter.join(',') : locality}-${boutiques.length}`}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {boutiques.map((boutique) => {
                    // Convertir les coordonnées en nombres
                    let lat: number;
                    let lng: number;
                    
                    try {
                      if (typeof boutique.latitude === 'object' && boutique.latitude !== null && 'toNumber' in boutique.latitude) {
                        lat = (boutique.latitude as Decimal).toNumber();
                      } else if (typeof boutique.latitude === 'string') {
                        lat = parseFloat(boutique.latitude);
                      } else {
                        lat = Number(boutique.latitude);
                      }
                      
                      if (typeof boutique.longitude === 'object' && boutique.longitude !== null && 'toNumber' in boutique.longitude) {
                        lng = (boutique.longitude as Decimal).toNumber();
                      } else if (typeof boutique.longitude === 'string') {
                        lng = parseFloat(boutique.longitude);
                      } else {
                        lng = Number(boutique.longitude);
                      }
                    } catch (err) {
                      console.error('Erreur conversion coordonnées:', err, boutique);
                      return null;
                    }
                    
                    // Vérifier que les coordonnées sont valides
                    if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
                      console.warn('Coordonnées invalides pour la boutique:', boutique, 'lat:', lat, 'lng:', lng);
                      return null;
                    }
                    
                    console.log('Ajout marqueur:', boutique.nom, 'à', lat, lng);
                    
                    return (
                    <Marker
                      key={boutique.id}
                      position={[lat, lng]}
                    >
                      <Popup>
                        <div className="p-2">
                          <h3 className="font-bold text-lg mb-2">{boutique.nom}</h3>
                          <p className="text-sm text-gray-600 mb-2">{boutique.adresse}</p>
                          {boutique.telephone && (
                            <p className="text-sm mb-2 flex items-center gap-1">
                              <Phone size={14} />
                              {boutique.telephone}
                            </p>
                          )}
                          <div className="flex gap-2 mt-3">
                            <a
                              href={getGoogleMapsUrl(lat, lng)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                              style={{ color: 'white' }}
                            >
                              <ExternalLink size={12} />
                              Google Maps
                            </a>
                            <a
                              href={getDirectionsUrl(lat, lng)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                              style={{ color: 'white' }}
                            >
                              <Navigation size={12} />
                              Itinéraire
                            </a>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                    );
                  })}
                </MapContainer>
              )}
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                </div>
              )}
            </div>
          </div>

          {/* Liste des boutiques */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Liste des boutiques</h2>
              {mapCenter && (
                <button
                  onClick={handleResetMap}
                  className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                >
                  Réinitialiser la vue
                </button>
              )}
            </div>
            {boutiques.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Aucune boutique trouvée</p>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto">
                {boutiques.map((boutique) => (
                  <div
                    key={boutique.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer hover:border-purple-300"
                    onClick={() => handleFocusBoutique(boutique)}
                  >
                    <h3 className="font-semibold text-gray-900 mb-1">{boutique.nom}</h3>
                    <p className="text-sm text-gray-600 mb-2 flex items-start gap-1">
                      <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                      {boutique.adresse}
                    </p>
                    {boutique.telephone && (
                      <p className="text-sm text-gray-600 mb-3 flex items-center gap-1">
                        <Phone size={14} />
                        {boutique.telephone}
                      </p>
                    )}
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        {(() => {
                          const lat = typeof boutique.latitude === 'object' && 'toNumber' in boutique.latitude 
                            ? boutique.latitude.toNumber() 
                            : Number(boutique.latitude);
                          const lng = typeof boutique.longitude === 'object' && 'toNumber' in boutique.longitude 
                            ? boutique.longitude.toNumber() 
                            : Number(boutique.longitude);
                          return (
                            <>
                              <a
                                href={getGoogleMapsUrl(lat, lng)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink size={12} />
                                Google Maps
                              </a>
                              <a
                                href={getDirectionsUrl(lat, lng)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Navigation size={12} />
                                Itinéraire
                              </a>
                            </>
                          );
                        })()}
                      </div>
                      {isSuperAdmin && (
                        <div className="flex gap-2 pt-2 border-t border-gray-200">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(boutique);
                            }}
                            className="flex items-center gap-1 text-xs bg-purple-500 text-white px-2 py-1 rounded hover:bg-purple-600"
                          >
                            <Edit size={12} />
                            Modifier
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(boutique.id);
                            }}
                            disabled={deleting === boutique.id}
                            className="flex items-center gap-1 text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {deleting === boutique.id ? (
                              <>
                                <Loader2 size={12} className="animate-spin" />
                                Suppression...
                              </>
                            ) : (
                              <>
                                <Trash2 size={12} />
                                Supprimer
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal d'ajout */}
      {showAddModal && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Ajouter une boutique</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de la boutique *
                </label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse *
                </label>
                <input
                  type="text"
                  name="adresse"
                  value={formData.adresse}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Latitude *
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Longitude *
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone
                </label>
                <input
                  type="tel"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lien Google Maps
                </label>
                <input
                  type="url"
                  name="google_map_link"
                  value={formData.google_map_link}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Ajout...
                    </span>
                  ) : (
                    'Ajouter'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal d'édition */}
      {showEditModal && editingBoutique && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Modifier la boutique</h2>
              <button
                onClick={handleCloseEditModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de la boutique *
                </label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse *
                </label>
                <input
                  type="text"
                  name="adresse"
                  value={formData.adresse}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Latitude *
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Longitude *
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone
                </label>
                <input
                  type="tel"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lien Google Maps
                </label>
                <input
                  type="url"
                  name="google_map_link"
                  value={formData.google_map_link}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Modification...
                    </span>
                  ) : (
                    'Modifier'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

