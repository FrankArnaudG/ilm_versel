'use client';

import React, { useState, useEffect } from 'react';
import { User, MapPin, Package, Heart, Edit2, Trash2, X, Phone, Plus, Lightbulb } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/ts/hooks/use-current-user';
import { useLocation } from '@/app/(main)/(view)/contexts/LocationContext';
import Swal from 'sweetalert2';
import { Navbar } from '@/app/(main)/(view)/components/Navbar';
import Image from 'next/image';

// ============================================
// INTERFACES
// ============================================

interface Address {
  id: string;
  label?: string;
  civility: 'MR' | 'MME';
  fullName: string;
  phone: string;
  country: string;
  city: string;
  postalCode: string;
  addressLine1: string;
  addressLine2?: string;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
  createdAt: string;
}

interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
}

interface AddressFormData {
  label: string;
  civility: 'MR' | 'MME';
  fullName: string;
  phone: string;
  country: string;
  city: string;
  postalCode: string;
  addressLine1: string;
  addressLine2?: string;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
}

// ============================================
// COMPOSANT MODAL FORMULAIRE D'ADRESSE
// ============================================

interface AddressFormModalProps {
  isOpen: boolean;
  address?: Address | null;
  onClose: () => void;
  onSave: (address: Address) => void;
}

const AddressFormModal: React.FC<AddressFormModalProps> = ({
  isOpen,
  address,
  onClose,
  onSave
}) => {

  const [formData, setFormData] = useState<AddressFormData>({
    label: '',
    civility: 'MME',
    fullName: '',
    phone: '',
    country: 'GF',
    city: '',
    postalCode: '',
    addressLine1: '',
    addressLine2: '',
    isDefaultShipping: false,
    isDefaultBilling: false
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✨ AJOUT : useEffect pour pré-remplir le formulaire en mode édition
  useEffect(() => {
    if (address) {
      // Mode édition : pré-remplir avec les données de l'adresse
      setFormData({
        label: address.label || '',
        civility: address.civility || 'MME',
        fullName: address.fullName || '',
        phone: address.phone || '',
        country: address.country || 'FR',
        city: address.city || '',
        postalCode: address.postalCode || '',
        addressLine1: address.addressLine1 || '',
        addressLine2: address.addressLine2 || '',
        isDefaultShipping: address.isDefaultShipping || false,
        isDefaultBilling: address.isDefaultBilling || false
      });
    } else {
      // Mode création : réinitialiser le formulaire
      setFormData({
        label: '',
        civility: 'MME',
        fullName: '',
        phone: '',
        country: 'FR',
        city: '',
        postalCode: '',
        addressLine1: '',
        addressLine2: '',
        isDefaultShipping: false,
        isDefaultBilling: false
      });
    }
    // Réinitialiser l'erreur quand on ouvre/ferme le modal
    setError(null);
  }, [address, isOpen]); // ⚠️ Important : déclencher quand address ou isOpen change

  // const handleChange = (field: keyof AddressFormData, value: any) => {
  const handleChange = (field: keyof AddressFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };


  const validateForm = (): boolean => {
    if (!formData.label.trim()) {
      setError('Veuillez saisir un intitulé pour cette adresse');
      return false;
    }
    if (!formData.fullName.trim()) {
      setError('Veuillez saisir votre nom complet');
      return false;
    }
    if (!formData.phone.trim()) {
      setError('Veuillez saisir votre numéro de téléphone');
      return false;
    }
    const phoneRegex = /^[0-9+\s()-]{10,}$/;
    if (!phoneRegex.test(formData.phone)) {
      setError('Numéro de téléphone invalide');
      return false;
    }
    if (!formData.addressLine1.trim()) {
      setError('Veuillez saisir votre adresse');
      return false;
    }
    if (!formData.postalCode.trim()) {
      setError('Veuillez saisir votre code postal');
      return false;
    }
    if (!formData.city.trim()) {
      setError('Veuillez saisir votre ville');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
        const url = address 
        ? `/api/customer/addresses/${address.id}` 
        : '/api/customer/addresses';
      
      const method = address ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // user_id: user?.id, 
          label: formData.label,
          civility: formData.civility,
          fullName: formData.fullName,
          phone: formData.phone,
          country: formData.country,
          city: formData.city,
          postalCode: formData.postalCode,
          addressLine1: formData.addressLine1,
          addressLine2: formData.addressLine2,
          isDefaultShipping: formData.isDefaultShipping,
          isDefaultBilling: formData.isDefaultBilling,
        })
      });

        if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de l\'enregistrement');
        }

        const data = await response.json();
        onSave(data.address);
        
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
        setLoading(false);
    }
    };
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#800080] to-[#660066] text-white px-6 py-5">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              {address ? 'Modifier l&apos;adresse' : 'Nouvelle adresse'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {/* Message d'erreur */}
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-8">
            {/* SECTION 1 : INTITULÉ DE L'ADRESSE */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <MapPin size={20} className="text-[#800080]" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Intitulé de l&apos;adresse</h3>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Intitulé <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => handleChange('label', e.target.value)}
                  placeholder="Ex: Maison, Bureau, Appartement parents..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#800080] transition-colors"
                  autoFocus
                />

                <p className="mt-2 text-sm text-gray-500 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    Donnez un nom à cette adresse pour la retrouver facilement
                </p>
              </div>

              {/* Suggestions rapides */}
              <div className="flex flex-wrap gap-2">
                {['Maison', 'Bureau', 'Appartement', 'Parents', 'Amis'].map(suggestion => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => handleChange('label', suggestion)}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-[#800080] hover:text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200"></div>

            {/* SECTION 2 : DONNÉES PERSONNELLES */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User size={20} className="text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Données personnelles</h3>
              </div>

              {/* Civilité */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Civilité <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleChange('civility', 'MME')}
                    className={`p-3 rounded-lg border-2 font-medium transition-all ${
                      formData.civility === 'MME'
                        ? 'border-[#800080] bg-purple-50 text-[#800080]'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <User className="w-5 h-5" />
                    Madame
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange('civility', 'MR')}
                    className={`p-3 rounded-lg border-2 font-medium transition-all ${
                      formData.civility === 'MR'
                        ? 'border-[#800080] bg-purple-50 text-[#800080]'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <User className="w-5 h-5" />
                    Monsieur
                  </button>
                </div>
              </div>

              {/* Nom complet */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nom complet (Nom et prénom(s)) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  placeholder="Ex: DUPONT Jean Marie"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#800080] transition-colors"
                />
              </div>

              {/* Téléphone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Téléphone <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <Phone size={20} />
                  </div>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="0696 12 34 56"
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#800080] transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200"></div>

            {/* SECTION 3 : ADRESSE */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <MapPin size={20} className="text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Adresse</h3>
              </div>

              {/* Pays */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Pays <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.country}
                  onChange={(e) => handleChange('country', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#800080] transition-colors"
                >
                  <option value="FR">🇫🇷 France</option>
                  <option value="GP">🇬🇵 Guadeloupe</option>
                  <option value="MQ">🇲🇶 Martinique</option>
                  <option value="GF">🇬🇫 Guyane</option>
                </select>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Code postal */}
                {/* <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Code postal <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => handleChange('postalCode', e.target.value)}
                    placeholder="97200"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#800080] transition-colors"
                  />
                </div> */}

                {/* Code postal */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Code postal <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^\d-]/g, ''); // Garde uniquement chiffres et tirets
                      if (value.length <= 9) {
                        handleChange('postalCode', value);
                      }
                    }}
                    placeholder="97200"
                    maxLength={9}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#800080] transition-colors"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Maximum 9 caractères
                  </p>
                </div>

                {/* Ville */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Ville <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    placeholder="Fort-de-France"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#800080] transition-colors"
                  />
                </div>
              </div>

              {/* Adresse ligne 1 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Adresse <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.addressLine1}
                  onChange={(e) => handleChange('addressLine1', e.target.value)}
                  placeholder="Numéro et nom de rue"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#800080] transition-colors"
                />
              </div>

              {/* Adresse ligne 2 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Complément d&apos;adresse <span className="text-gray-400">(optionnel)</span>
                </label>
                <input
                  type="text"
                  value={formData.addressLine2}
                  onChange={(e) => handleChange('addressLine2', e.target.value)}
                  placeholder="Bâtiment, étage, appartement..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#800080] transition-colors"
                />
              </div>
            </div>

            <div className="border-t border-gray-200"></div>

            {/* SECTION 4 : OPTIONS PAR DÉFAUT */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-xl">⚙️</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900">Options</h3>
              </div>

              <div className="space-y-3">
                <label className="flex items-start gap-3 p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-[#800080] hover:bg-purple-50 transition-all">
                  <input
                    type="checkbox"
                    checked={formData.isDefaultShipping}
                    onChange={(e) => handleChange('isDefaultShipping', e.target.checked)}
                    className="w-5 h-5 text-[#800080] rounded focus:ring-[#800080] mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 mb-1">
                      Définir comme adresse de livraison par défaut
                    </div>
                    <div className="text-sm text-gray-600">
                      Cette adresse sera automatiquement sélectionnée lors de vos prochaines commandes
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-[#800080] hover:bg-purple-50 transition-all">
                  <input
                    type="checkbox"
                    checked={formData.isDefaultBilling}
                    onChange={(e) => handleChange('isDefaultBilling', e.target.checked)}
                    className="w-5 h-5 text-[#800080] rounded focus:ring-[#800080] mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 mb-1">
                      Définir comme adresse de facturation par défaut
                    </div>
                    <div className="text-sm text-gray-600">
                      Cette adresse sera utilisée pour l&apos;édition de vos factures
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-6 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-6 bg-[#800080] text-white rounded-lg font-semibold hover:bg-[#6b006b] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Enregistrement...
                </>
              ) : (
                <>
                  ✓ {address ? 'Mettre à jour' : 'Enregistrer l&apos;adresse'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================
// COMPOSANT PAGE PROFIL
// ============================================

interface WishlistProduct {
  id: string;
  designation: string;
  brand: string;
  reference: string;
  category: string;
  image: string | null;
  price: number;
  oldPrice: number;
  addedAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'orders' | 'wishlist'>('profile');
  const [customer] = useState<Customer | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [wishlistProducts, setWishlistProducts] = useState<WishlistProduct[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  const [userError, setUserError] = useState(false);

  const user = useCurrentUser();
  const { selectedLocation } = useLocation();

  // Fonction pour obtenir la localité (depuis le contexte ou localStorage/cookie)
  const getLocality = (): string => {
    // Priorité 1 : selectedLocation du contexte
    if (selectedLocation?.name) {
      return selectedLocation.name;
    }

    // Priorité 2 : Cookie
    if (typeof window !== 'undefined') {
      const cookieLocation = document.cookie
        .split('; ')
        .find(row => row.startsWith('userLocation='))
        ?.split('=')[1];
      if (cookieLocation) {
        return cookieLocation;
      }

      // Priorité 3 : localStorage
      const savedData = localStorage.getItem('userLocationData');
      if (savedData) {
        try {
          const locationData = JSON.parse(savedData);
          if (locationData?.location?.name) {
            return locationData.location.name;
          }
        } catch (error) {
          console.error('Erreur lecture localStorage:', error);
        }
      }
    }

    // Valeur par défaut
    return 'Guadeloupe';
  };

  // ============================================
  // CHARGEMENT DES DONNÉES
  // ============================================
  
  useEffect(() => {
    fetchCustomerData();
  }, []);

  useEffect(() => {
    if (activeTab === 'wishlist') {
      fetchWishlist();
    }
  }, [activeTab]);

  const fetchCustomerData = async () => {
    try {
      setLoading(true);

      // Vérifier si l'utilisateur existe
      if (!user?.id) {
        setUserError(true);
        setLoading(false);
        return;
      }
      
    //   // Récupérer les infos client
    //   const customerResponse = await fetch('/api/customer/profile');
    //   const customerData = await customerResponse.json();
    //   setCustomer(customerData.customer);

      // Récupérer les adresses
      const response = await fetch('/api/customer/addresses');
    //   const addressesData = await addressesResponse.json();

    //   setAddresses(addressesData.addresses);
      const data = await response.json();

        if (!response.ok) {
            throw new Error('Failed to fetch addresses');
        }

        setAddresses(data.addresses || []);

    } catch (error) {
      console.error('Erreur chargement profil:', error);
      setAddresses([]); 
    } finally {
      setLoading(false);
    }
  };

  const fetchWishlist = async () => {
    try {
      setWishlistLoading(true);
      const response = await fetch('/api/customer/wishlist');
      
      if (!response.ok) {
        throw new Error('Failed to fetch wishlist');
      }

      const data = await response.json();
      setWishlistProducts(data.products || []);
    } catch (error) {
      console.error('Erreur chargement wishlist:', error);
      setWishlistProducts([]);
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleRemoveFromWishlist = async (productId: string) => {
    // Trouver le produit pour afficher son nom dans la confirmation
    const product = wishlistProducts.find(p => p.id === productId);
    const productName = product?.designation || 'ce produit';

    // Afficher la confirmation avec SweetAlert2
    const result = await Swal.fire({
      title: 'Retirer de la liste de souhaits ?',
      text: `Êtes-vous sûr de vouloir retirer "${productName}" de votre liste de souhaits ?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Oui, retirer',
      cancelButtonText: 'Annuler',
      reverseButtons: true,
      buttonsStyling: true,
      customClass: {
        confirmButton: 'swal2-confirm-custom',
        cancelButton: 'swal2-cancel-custom'
      },
      confirmButtonColor: '#800080',
      cancelButtonColor: '#6b7280'
    });

    // Si l'utilisateur confirme
    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/customer/wishlist/${productId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          setWishlistProducts(prev => prev.filter(p => p.id !== productId));
          
          // Afficher un message de succès
          Swal.fire({
            title: 'Retiré !',
            text: `${productName} a été retiré de votre liste de souhaits.`,
            icon: 'success',
            confirmButtonColor: '#800080',
            customClass: {
              confirmButton: 'swal2-confirm-custom',
              cancelButton: 'swal2-cancel-custom'
            },
            timer: 2000,
            showConfirmButton: true
          });
        } else {
          throw new Error('Erreur lors de la suppression');
        }
      } catch (error) {
        console.error('Erreur suppression wishlist:', error);
        
        // Afficher un message d'erreur
        Swal.fire({
          title: 'Erreur',
          text: 'Une erreur est survenue lors de la suppression du produit.',
          icon: 'error',
          confirmButtonColor: '#800080'
        });
      }
    }
  };

  // ============================================
  // GESTION DES ADRESSES
  // ============================================

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette adresse ?')) return;

    try {
      const response = await fetch(`/api/customer/addresses/${addressId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setAddresses(prev => prev.filter(addr => addr.id !== addressId));
      }
    } catch (error) {
      console.error('Erreur suppression adresse:', error);
      alert('Erreur lors de la suppression de l\'adresse');
    }
  };

  const handleSetDefaultAddress = async (addressId: string, type: 'shipping' | 'billing') => {
    try {
      const response = await fetch(`/api/customer/addresses/${addressId}/set-default`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });

      if (response.ok) {
        setAddresses(prev => prev.map(addr => ({
          ...addr,
          isDefaultShipping: type === 'shipping' 
            ? addr.id === addressId 
            : addr.isDefaultShipping,
          isDefaultBilling: type === 'billing' 
            ? addr.id === addressId 
            : addr.isDefaultBilling
        })));
      }
    } catch (error) {
      console.error('Erreur mise à jour adresse par défaut:', error);
    }
  };

  // Cas : Utilisateur non connecté
  if (userError || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            {/* Icône d'erreur */}
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <User size={40} className="text-red-600" />
            </div>

            {/* Titre */}
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Accès non autorisé
            </h2>

            {/* Message */}
            <p className="text-gray-600 mb-6">
              Vous devez être connecté pour accéder à votre profil.
            </p>

            {/* Boutons d'action */}
            <div className="space-y-3">
              <button
                onClick={() => router.push('/signIn')}
                className="w-full py-3 px-6 bg-[#800080] text-white rounded-lg font-semibold hover:bg-[#6b006b] transition-colors flex items-center justify-center gap-2"
              >
                <span>🔐</span>
                Se connecter
              </button>

              <button
                onClick={() => router.push('/')}
                className="w-full py-3 px-6 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Retour à l&apos;accueil
              </button>
            </div>

            {/* Lien inscription */}
            <p className="mt-6 text-sm text-gray-500">
              Pas encore de compte ?{' '}
              <button
                onClick={() => router.push('/signUp')}
                className="text-[#800080] font-semibold hover:underline"
              >
                Créer un compte
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#800080] mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {/* Header */}
      <div className="bg-gradient-to-r from-[#800080] to-[#660066] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white/30">
                <User size={48} />
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-2">{user?.name}</h2>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    <span>📧</span>
                    <span>{user?.email}</span>
                  </div>
                  {customer?.phone && (
                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                      <Phone size={16} />
                      <span>{customer.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8 overflow-x-auto">
            {[
              { id: 'profile', label: 'Profil', icon: User },
              { id: 'addresses', label: 'Mes adresses', icon: MapPin },
              { id: 'orders', label: 'Mes commandes', icon: Package },
              { id: 'wishlist', label: 'Liste de souhaits', icon: Heart }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'profile' | 'addresses' | 'orders' | 'wishlist')}
                className={`flex items-center gap-2 py-4 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-[#800080] text-[#800080]'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon size={20} />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* TAB: Profil */}
        {activeTab === 'profile' && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Grille de cartes */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Carte Informations personnelles */}
              <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <User size={20} className="text-[#800080]" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Informations personnelles</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Nom complet
                    </label>
                    <div className="px-4 py-3 bg-gray-50 rounded-lg border-2 border-gray-200">
                      <p className="text-gray-900 font-medium">{user?.name || 'Non renseigné'}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Email
                    </label>
                    <div className="px-4 py-3 bg-gray-50 rounded-lg border-2 border-gray-200">
                      <p className="text-gray-900 font-medium">{user?.email}</p>
                    </div>
                  </div>

                  {customer?.phone && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Téléphone
                      </label>
                      <div className="px-4 py-3 bg-gray-50 rounded-lg border-2 border-gray-200">
                        <p className="text-gray-900 font-medium">{customer.phone}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* <button className="w-full mt-6 py-3 bg-[#800080] text-white rounded-lg font-semibold hover:bg-[#6b006b] transition-colors flex items-center justify-center gap-2">
                  <Edit2 size={18} />
                  Modifier mes informations
                </button> */}
              </div>

              {/* Carte Statistiques */}
              <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Package size={20} className="text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Mon activité</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border-2 border-purple-200">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                        <Package size={24} className="text-[#800080]" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Commandes</p>
                        <p className="text-2xl font-bold text-[#800080]">0</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-pink-50 to-pink-100 rounded-lg border-2 border-pink-200">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                        <Heart size={24} className="text-pink-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Favoris</p>
                        <p className="text-2xl font-bold text-pink-600">0</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border-2 border-green-200">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                        <MapPin size={24} className="text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Adresses</p>
                        <p className="text-2xl font-bold text-green-600">{addresses.length}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Carte Sécurité */}
              <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-xl">🔒</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Sécurité</h3>
                </div>

                <div className="space-y-3">
                  <div 
                    onClick={() => router.push('/change-password')}
                    className="px-4 py-3 border-2 border-gray-200 rounded-lg hover:border-[#800080] hover:bg-purple-50 transition-all group cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900 group-hover:text-[#800080]">
                          Changer mon mot de passe
                        </p>
                        {/* <p className="text-sm text-gray-500">Dernière modification il y a 3 mois</p> */}
                      </div>
                      <span className="text-gray-400 group-hover:text-[#800080]">→</span>
                    </div>
                  </div>

                  {/* <button className="w-full text-left px-4 py-3 border-2 border-gray-200 rounded-lg hover:border-[#800080] hover:bg-purple-50 transition-all group cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900 group-hover:text-[#800080]">
                          Authentification à deux facteurs
                        </p>
                        <p className="text-sm text-gray-500">Sécurisez davantage votre compte</p>
                      </div>
                      <span className="text-gray-400 group-hover:text-[#800080]">→</span>
                    </div>
                  </button> */}
                </div>
              </div>

              {/* Carte Préférences
              <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-xl">⚙️</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Préférences</h3>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-[#800080] hover:bg-purple-50 transition-all">
                    <div>
                      <p className="font-semibold text-gray-900">Newsletter</p>
                      <p className="text-sm text-gray-500">Recevoir les offres et nouveautés</p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-5 h-5 text-[#800080] rounded focus:ring-[#800080]"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-[#800080] hover:bg-purple-50 transition-all">
                    <div>
                      <p className="font-semibold text-gray-900">Notifications SMS</p>
                      <p className="text-sm text-gray-500">Suivi de commande par SMS</p>
                    </div>
                    <input
                      type="checkbox"
                      className="w-5 h-5 text-[#800080] rounded focus:ring-[#800080]"
                    />
                  </label>
                </div>
              </div> */}
            </div>
          </div>
        )}

        {/* TAB: Adresses */}
        {activeTab === 'addresses' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Mes adresses</h2>
              <button
                onClick={() => {
                  setEditingAddress(null);
                  setShowAddressModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-[#800080] text-white rounded-lg font-medium hover:bg-[#6b006b] transition-colors"
              >
                <Plus size={20} />
                Ajouter une adresse
              </button>
            </div>

            {addresses.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <MapPin size={48} className="text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Aucune adresse enregistrée
                </h3>
                <p className="text-gray-500 mb-6">
                  Ajoutez une adresse pour faciliter vos prochaines commandes
                </p>
                <button
                  onClick={() => setShowAddressModal(true)}
                  className="px-6 py-3 bg-[#800080] text-white rounded-lg font-medium hover:bg-[#6b006b] transition-colors"
                >
                  Ajouter ma première adresse
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {addresses.map(address => (
                  <div
                    key={address.id}
                    className="bg-white rounded-xl shadow-sm p-6 relative hover:shadow-md transition-shadow border-2 border-gray-100 hover:border-purple-200"
                  >
                    {/* Badges par défaut */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {address.isDefaultShipping && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full flex items-center gap-1">
                          <span>📦</span> Livraison par défaut
                        </span>
                      )}
                      {address.isDefaultBilling && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full flex items-center gap-1">
                          <span>🧾</span> Facturation par défaut
                        </span>
                      )}
                    </div>

                    {/* Label avec icône */}
                    {address.label && (
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">
                          {address.label.toLowerCase().includes('maison') ? '🏠' :
                           address.label.toLowerCase().includes('bureau') ? '🏢' :
                           address.label.toLowerCase().includes('parent') ? '👨‍👩‍👦' :
                           '📍'}
                        </span>
                        <span className="text-lg font-bold text-[#800080]">
                          {address.label}
                        </span>
                      </div>
                    )}

                    {/* Informations de l'adresse */}
                    <div className="space-y-2 text-gray-700">
                      {/* Civilité et nom */}
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {address.civility === 'MME' ? '👩' : '👨'}
                        </span>
                        <span className="font-semibold">
                          {address.civility === 'MME' ? 'Madame' : 'Monsieur'} {address.fullName}
                        </span>
                      </div>
                      
                      {/* Téléphone */}
                      <div className="flex items-center gap-2 text-sm">
                        <Phone size={16} className="text-gray-400" />
                        <span>{address.phone}</span>
                      </div>
                      
                      {/* Adresse complète */}
                      <div className="flex items-start gap-2 text-sm pt-2 border-t border-gray-100">
                        <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <div>{address.addressLine1}</div>
                          {address.addressLine2 && (
                            <div className="text-gray-600">{address.addressLine2}</div>
                          )}
                          <div className="font-medium mt-1">
                            {address.postalCode} {address.city}
                          </div>
                          <div className="text-gray-600">
                            {address.country === 'FR' && '🇫🇷 France'}
                            {address.country === 'GP' && '🇬🇵 Guadeloupe'}
                            {address.country === 'MQ' && '🇲🇶 Martinique'}
                            {address.country === 'GF' && '🇬🇫 Guyane'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-5 pt-5 border-t border-gray-200 space-y-3">
                      {/* Définir par défaut */}
                      {(!address.isDefaultShipping || !address.isDefaultBilling) && (
                        <div className="flex gap-2">
                          {!address.isDefaultShipping && (
                            <button
                              onClick={() => handleSetDefaultAddress(address.id, 'shipping')}
                              className="flex-1 text-xs px-3 py-2 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors font-medium"
                            >
                              📦 Par défaut livraison
                            </button>
                          )}
                          {!address.isDefaultBilling && (
                            <button
                              onClick={() => handleSetDefaultAddress(address.id, 'billing')}
                              className="flex-1 text-xs px-3 py-2 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                            >
                              🧾 Par défaut facturation
                            </button>
                          )}
                        </div>
                      )}

                      {/* Modifier / Supprimer */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingAddress(address);
                            setShowAddressModal(true);
                          }}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        >
                          <Edit2 size={16} />
                          <span>Modifier</span>
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(address.id)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium"
                        >
                          <Trash2 size={16} />
                          <span>Supprimer</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: Commandes */}
        {activeTab === 'orders' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Mes commandes</h2>
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <Package size={48} className="text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Aucune commande
              </h3>
              <p className="text-gray-500">
                Vos commandes apparaîtront ici
              </p>
            </div>
          </div>
        )}

        {/* TAB: Liste de souhaits */}
        {activeTab === 'wishlist' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Ma liste de souhaits</h2>
            
            {wishlistLoading ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#800080] mx-auto mb-4"></div>
                <p className="text-gray-600">Chargement...</p>
              </div>
            ) : wishlistProducts.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <Heart size={48} className="text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Liste vide
                </h3>
                <p className="text-gray-500">
                  Ajoutez des produits à votre liste de souhaits
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {wishlistProducts.map(product => (
                  <div
                    key={product.id}
                    className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border-2 border-gray-100 hover:border-purple-200 group"
                  >
                    {/* Image */}
                    <div 
                      className="aspect-square bg-gray-50 rounded-lg overflow-hidden mb-4 cursor-pointer"
                      onClick={() => {
                        const locality = getLocality();
                        router.push(`/${locality}/${product.brand.toLowerCase()}/${product.category.toLowerCase()}/${product.id}`);
                      }}
                    >
                      <div className="w-full h-full overflow-hidden">
                        <Image
                          src={product.image || "/placeholder.jpg"}
                          alt={product.designation}
                          width={500}        // Largeur par défaut
                          height={500}       // Hauteur par défaut
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      </div>


                    </div>

                    {/* Informations */}
                    <div className="space-y-2">
                      <h3 
                        className="font-semibold text-gray-900 mb-1 line-clamp-2 cursor-pointer hover:text-[#800080] transition-colors"
                        onClick={() => {
                          const locality = getLocality();
                          router.push(`/${locality}/${product.brand.toLowerCase()}/${product.category.toLowerCase()}/${product.id}`);
                        }}
                      >
                        {product.designation}
                      </h3>
                      <div className="text-sm text-gray-500">{product.brand}</div>
                      
                      {/* Prix */}
                      <div className="flex items-center gap-2 pt-2">
                        <span className="text-xl font-bold text-[#800080]">
                          {product.price.toFixed(2)}€
                        </span>
                        {product.oldPrice > 0 && product.oldPrice > product.price && (
                          <span className="text-sm text-gray-400 line-through">
                            {product.oldPrice.toFixed(2)}€
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bouton Retirer */}
                    <button
                      onClick={() => handleRemoveFromWishlist(product.id)}
                      className="w-full mt-4 py-2 border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <Trash2 size={16} />
                      Retirer
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Adresse */}
      <AddressFormModal
        isOpen={showAddressModal}
        address={editingAddress}
        onClose={() => {
          setShowAddressModal(false);
          setEditingAddress(null);
        }}
        onSave={(address) => {
          if (editingAddress) {
            setAddresses(prev => prev.map(a => a.id === address.id ? address : a));
          } else {
            setAddresses(prev => [...prev, address]);
          }
          setShowAddressModal(false);
          setEditingAddress(null);
        }}
      />
    </div>
  );
}