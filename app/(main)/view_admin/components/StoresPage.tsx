/**
 * StoresPage.tsx
 * 
 * Page principale de gestion des boutiques I Love Mobile
 * Permet de :
 * - Visualiser toutes les boutiques
 * - Ajouter une nouvelle boutique
 * - Modifier une boutique existante
 * - Voir les détails complets d'une boutique
 * - Supprimer une boutique
 */

import React, { useEffect, useState } from 'react';
import { 
  Plus, Eye, Edit, Trash2, MoreVertical, Store, MapPin, 
  X, Check, RefreshCw, Globe, ChevronDown, DollarSign,
  Clock, User, Phone, Mail, Package2,
  Map,
  Building,
  LayoutDashboard,
  Settings,
} from 'lucide-react';
import { useCurrentUser } from '@/ts/hooks/use-current-user';
import { ErrorModal } from './Notification_error';
import { SuccessModal } from './Notification_success';
import { StoreStatus } from '@/lib/types';
import { useStores } from '../ilm2/contexts/StoresContext';
import Image from 'next/image';

// ============================================================================
// TYPES & INTERFACES
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

interface StoreFormData {
  storeName: string;
  storeCode: string;
  country: string;
  city: string;
  department: string;
  address: string;
  currency: string;
  timezone: string;
  status: string;
  managerEmail: string;
  phone: string;
  email: string;
  openingDate: string;
  company?: string;
}


interface Employee {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  image: string | null;
  role: string;
  status: string;
  lastLogin: string | null;
}

type Manager = Employee;

interface StoreData {
  store: {
    id: string;
    code: string;
    name: string;
    country: string;
    city: string;
    department: string;
    address: string;
    phone: string | null;
    email: string | null;
    currency: string;
    timezone: string;
    status: StoreStatus;
    openingDate: string | null;
    company: string | null;
    createdAt: string;
    updatedAt: string;
    manager: Manager | null;
    employees: Employee[];
    createdBy: {
      id: string;
      name: string | null;
      email: string;
    } | null;
  };
  statistics: {
    totalEmployees: number;
    activeEmployees: number;
  };
  accessLevel: string;
}

// ============================================================================
// COMPOSANT: StoreDropdownMenu
// Menu d'actions pour chaque boutique
// ============================================================================

interface StoreDropdownMenuProps {
  store: Store;
  onEdit: (store: Store) => void;
  onDelete: (storeId: string) => void;
  onViewDetails: (store: Store) => void;
}

const StoreDropdownMenu: React.FC<StoreDropdownMenuProps> = ({ 
  store, 
  onEdit, 
  onDelete, 
  onViewDetails 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <MoreVertical size={18} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
          <button
            onClick={() => {
              onViewDetails(store);
              setIsOpen(false);
            }}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <Eye size={16} />
            Voir les détails
          </button>
          <button
            onClick={() => {
              onEdit(store);
              setIsOpen(false);
            }}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <Edit size={16} />
            Modifier
          </button>
          <div className="border-t border-gray-200 my-1"></div>
          <button
            onClick={() => {
              if (confirm(`Êtes-vous sûr de vouloir supprimer la boutique "${store.name}" ?\n\nCette action est irréversible.`)) {
                onDelete(store.id);
              }
              setIsOpen(false);
            }}
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
          >
            <Trash2 size={16} />
            Supprimer
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// COMPOSANT: AddStoreModal
// Modal pour ajouter une nouvelle boutique
// ============================================================================

interface AddStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: string;
}

const AddStoreModal: React.FC<AddStoreModalProps> = ({ isOpen, onClose, userRole }) => {

  const user = useCurrentUser();

  const [formData, setFormData] = useState<StoreFormData>({
    storeName: '',
    storeCode: '',
    country: '',
    city: '',
    department: '',
    address: '',
    currency: '',
    timezone: '',
    status: 'ACTIVE',
    managerEmail: '',
    phone: '',
    email: '',
    openingDate: '',
    company: ''
  });

  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [ crea_loading, setCrea_loading ] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');


  const countries = [
    { value: 'France', label: 'France', flag: '🇫🇷' },
    { value: 'Burkina Faso', label: 'Burkina Faso', flag: '🇧🇫' },
  ];

  const companies = [
    { value: 'ECOCOMAM - Martinique', label: 'ECOCOMAM - Martinique', flag: '🇲🇶' },
    { value: 'ECOGWADA - Guadeloupe', label: 'ECOGWADA - Guadeloupe', flag: '🇬🇵' },
    { value: 'ECOCOM - Guyane', label: 'ECOCOM - Guyane', flag: '🇬🇫' },
    { value: 'ECOMAVELI - La Réunion', label: 'ECOMAVELI - La Réunion', flag: '🇷🇪' },
  ];

  const currencies = [
    { value: 'EUR', label: 'Euro (EUR)', symbol: '€' },
    { value: 'XOF', label: 'Franc CFA (XOF)', symbol: 'CFA' },
    { value: 'USD', label: 'Dollar US (USD)', symbol: '$' },
  ];

  const timezones = [
    { value: 'Europe/Paris', label: 'Europe/Paris (GMT+2)' },
    { value: 'Europe/Martinique', label: 'Europe/Martinique (GMT+2)' },
    { value: 'Europe/Guadeloupe', label: 'Europe/Guadeloupe (GMT+2)' },
    { value: 'Europe/Guyane', label: 'Europe/Guyane (GMT+2)' },
    { value: 'Europe/La Réunion', label: 'Europe/La Réunion (GMT+2)' },
    { value: 'Africa/Burkina Faso', label: 'Africa/Casablanca (GMT+0)' }
  ];

  const generateStoreCode = () => {
    setIsGeneratingCode(true);
    setTimeout(() => {
      const code = `BOUT${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`;
      setFormData({ ...formData, storeCode: code });
      setIsGeneratingCode(false);
    }, 500);
  };

  // const StoreHandleSubmit = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   console.log('Form submitted:', formData);
  //   // TODO: Appel API vers Laravel
  //   onClose();
  // };

    const StoreHandleSubmit = async(e: React.FormEvent) => {
      e.preventDefault();

      setCrea_loading(true)

      if(!formData.storeName) {
          setCrea_loading(false)
          setErrorMessage("Vous devez renseigner le nom de la boutique")
          setShowError(true);
          return
      }

      if(!formData.storeCode) {
          setCrea_loading(false)
          setErrorMessage("Vous devez renseigner le code de la boutique")
          setShowError(true);
          return
      }

      if(!formData.country) {
          setCrea_loading(false)
          setErrorMessage("Vous devez renseigner le pays")
          setShowError(true);
          return
      }

      if(!formData.city) {
          setCrea_loading(false)
          setErrorMessage("Vous devez renseigner la ville")
          setShowError(true);
          return
      }

      if(!formData.department) {
          setCrea_loading(false)
          setErrorMessage("Vous devez renseigner le département")
          setShowError(true);
          return
      }

      if(!formData.currency) {
          setCrea_loading(false)
          setErrorMessage("Vous devez renseigner la devise locale")
          setShowError(true);
          return
      }

      if(!formData.timezone) {
          setCrea_loading(false)
          setErrorMessage("Vous devez renseigner le fuseau horaire")
          setShowError(true);
          return
      }

      if(!formData.address) {
          setCrea_loading(false)
          setErrorMessage("Vous devez renseigner l'adresse")
          setShowError(true);
          return
      }

      if(!formData.managerEmail) {
          setCrea_loading(false)
          setErrorMessage("Vous devez renseigner l'e-mail du manager")
          setShowError(true);
          return
      }

      if(!formData.phone) {
          setCrea_loading(false)
          setErrorMessage("Vous devez renseigner le numéro de téléphone")
          setShowError(true);
          return
      }

      if(!formData.email) {
          setCrea_loading(false)
          setErrorMessage("Vous devez renseigner l'e-mail de la boutique")
          setShowError(true);
          return
      }

      if(!formData.company) {
          setCrea_loading(false)
          setErrorMessage("Vous devez renseigner la société a laquelle cette boutique est rattachée")
          setShowError(true);
          return
      }

      try {
          const response = await fetch("/api/stores", {
              method : 'POST',
              headers : {
                  'Content-Type': 'application/json',
              },
              body : JSON.stringify({
                  user_id : user?.id,
                  role: userRole,
                  store_code : formData.storeCode,
                  store_name : formData.storeName,
                  store_country : formData.country,
                  store_city : formData.city,
                  store_department : formData.department,
                  store_address : formData.address,
                  store_phone : formData.phone,
                  store_email : formData.email,
                  store_currency : formData.currency,
                  store_timezone : formData.timezone,
                  store_openingDate : formData.openingDate,
                  store_managerEmail : formData.managerEmail,
                  store_status: formData.status,
                  store_company: formData.company,
              })
          })

          const data = await response.json();

          if(!response.ok) {
              // le message renvoyer par l'API
              
              console.log(data.message)
              setCrea_loading(false)
              setErrorMessage(data.message)
              setShowError(true);
              return
          }

          // Si tout c'est bien passer
          setCrea_loading(false)
          setSuccessMessage(data.message)
          setShowSuccess(true);
          //Rafraichire la page
          // setTimeout(() => {
          //   onClose();
          //   window.location.reload();
          // }, 1500);

          // vidons les champs input de tgiNumber au cas ou le user veut creer un deuxieme
          setFormData({
            storeName: '',
            storeCode: '',
            country: '',
            city: '',
            department: '',
            currency: '',
            timezone: '',
            address: '',
            managerEmail: '',
            phone: '',
            email: '',
            openingDate: '',
            status: '',
            company: '',
          })
          

      } catch (error) {
          console.error(error)
          setCrea_loading(false)
          setErrorMessage("Un probleme inatendu est survenu. Contactez le support si le problème persiste.")
          setShowError(true);
      }
  }



  if (!isOpen) return null;

  return (
    <>
    <SuccessModal
      isOpen={showSuccess}
      onClose={() => setShowSuccess(false)}
      message={successMessage}
      // message="La boutique a été créée avec succès ! Vous pouvez maintenant la gérer depuis le tableau de bord."
    />

    <ErrorModal
      isOpen={showError}
      onClose={() => setShowError(false)}
      message={errorMessage}
      // message="Une erreur est survenue lors de la création de la boutique. Veuillez vérifier les informations saisies et réessayer."
    />

      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
          
          <div className="relative bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 rounded-t-2xl z-10">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Créer une nouvelle boutique</h2>
                  <p className="text-gray-600">Remplissez les informations ci-dessous pour ajouter une nouvelle boutique au réseau.</p>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={24} className="text-gray-500" />
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={StoreHandleSubmit} className="p-8">
              {/* General Information Section */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#800080] to-[#9333ea] flex items-center justify-center">
                    <Store size={18} className="text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Informations générales</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Store Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nom de la boutique <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        value={formData.storeName}
                        onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080] focus:border-transparent transition-all"
                        placeholder="I Love Mobile Paris"
                        required
                      />
                    </div>
                  </div>

                  {/* Store Code */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Code unique <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Package2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="text"
                          value={formData.storeCode}
                          onChange={(e) => setFormData({ ...formData, storeCode: e.target.value.toUpperCase() })}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080] focus:border-transparent transition-all"
                          placeholder="BOUT001"
                          required
                        />
                      </div>
                      <button
                        type="button"
                        onClick={generateStoreCode}
                        disabled={isGeneratingCode}
                        className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        <RefreshCw size={18} className={isGeneratingCode ? 'animate-spin' : ''} />
                        Auto
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Code unique d&apos;identification de la boutique</p>
                  </div>

                  {/* Country */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Pays <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                      <select
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080] focus:border-transparent transition-all appearance-none bg-white"
                        required
                      >
                        <option value="">Sélectionnez un pays</option>
                        {countries.map(country => (
                          <option key={country.value} value={country.value}>
                            {country.flag} {country.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                    </div>
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Ville <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080] focus:border-transparent transition-all"
                        placeholder="Paris"
                        required
                      />
                    </div>
                  </div>

                  {/* Department */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Département <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Map className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080] focus:border-transparent transition-all"
                        placeholder="ex: 75 ou Île-de-France"
                        required
                      />
                    </div>
                  </div>

                  {/* Currency */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Devise locale <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                      <select
                        value={formData.currency}
                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080] focus:border-transparent transition-all appearance-none bg-white"
                        required
                      >
                        <option value="">Sélectionnez une devise</option>
                        {currencies.map(currency => (
                          <option key={currency.value} value={currency.value}>
                            {currency.symbol} {currency.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                    </div>
                  </div>

                  {/* Timezone */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Fuseau horaire <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                      <select
                        value={formData.timezone}
                        onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080] focus:border-transparent transition-all appearance-none bg-white"
                        required
                      >
                        <option value="">Sélectionnez un fuseau</option>
                        {timezones.map(tz => (
                          <option key={tz.value} value={tz.value}>
                            {tz.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="mt-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Adresse complète <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={3}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080] focus:border-transparent transition-all resize-none"
                      placeholder="123 Avenue des Champs-Élysées, 75008 Paris"
                      required
                    />
                  </div>
                </div>

                {/* Status Toggle */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">Statut de la boutique</p>
                      <p className="text-sm text-gray-600">Activer ou désactiver immédiatement cette boutique</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ 
                        ...formData, 
                        status: formData.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
                      })}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                        formData.status === 'ACTIVE' ? 'bg-[#800080]' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                          formData.status === 'ACTIVE' ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  {/* Indicateur visuel du statut */}
                  <div className="mt-3 flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      formData.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                    <span className={`text-sm font-medium ${
                      formData.status === 'ACTIVE' ? 'text-green-700' : 'text-gray-600'
                    }`}>
                      {formData.status === 'ACTIVE' ? 'Boutique active' : 'Boutique inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="border-t border-gray-200 pt-8">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <User size={18} className="text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Informations de contact</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Manager Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Adresse e-mail du manager <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="email"
                        value={formData.managerEmail}
                        onChange={(e) => setFormData({ ...formData, managerEmail: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080] focus:border-transparent transition-all"
                        placeholder="manager@ilovemobile.fr"
                        required
                      />
                    </div>
                  </div>
                  {/* Country */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Société (entreprise) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                      <select
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080] focus:border-transparent transition-all appearance-none bg-white"
                        required
                      >
                        <option value="">Sélectionnez une société</option>
                        {companies.map(company => (
                          <option key={company.value} value={company.value}>
                            {company.flag} {company.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Numéro de téléphone <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080] focus:border-transparent transition-all"
                        placeholder="+33 1 23 45 67 89"
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Adresse e-mail <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080] focus:border-transparent transition-all"
                        placeholder="contact@ilovemobile.fr"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-8 border-t border-gray-200 mt-8">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={crea_loading}
                  className="flex-1 py-3 px-6 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={crea_loading}
                  className="flex-1 py-3 px-6 bg-gradient-to-r from-[#800080] to-[#9333ea] text-white rounded-lg font-semibold hover:from-[#6b006b] hover:to-[#7e22ce] transition-all shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2"
                >
                  <Check size={20} />
                  {crea_loading ? 'En cours d\'enregistrement...' : 'Enregistrer la boutique'}
                  
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};


interface EditStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  store: Store;
  userRole: string;
  onStoreUpdated?: () => void;
}

// ============================================================================
// COMPOSANT: EditStoreModal
// ============================================================================

const EditStoreModal: React.FC<EditStoreModalProps> = ({ 
  isOpen, 
  onClose, 
  store,
  userRole,
  onStoreUpdated 
}) => {
  const user = useCurrentUser();

  const [formData, setFormData] = useState<StoreFormData>({
    storeName: '',
    storeCode: '',
    country: '',
    city: '',
    department: '',
    address: '',
    currency: '',
    timezone: '',
    status: '',
    managerEmail: '',
    phone: '',
    email: '',
    openingDate: '',
    company: ''
  });

  const [loading, setLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Données de référence
  const countries = [
    { value: 'France', label: 'France', flag: '🇫🇷' },
    { value: 'Burkina Faso', label: 'Burkina Faso', flag: '🇧🇫' },
  ];

  const companies = [
    { value: 'ECOCOMAM - Martinique', label: 'ECOCOMAM - Martinique', flag: '🇲🇶' },
    { value: 'ECOGWADA - Guadeloupe', label: 'ECOGWADA - Guadeloupe', flag: '🇬🇵' },
    { value: 'ECOCOM - Guyane', label: 'ECOCOM - Guyane', flag: '🇬🇫' },
    { value: 'ECOMAVELI - La Réunion', label: 'ECOMAVELI - La Réunion', flag: '🇷🇪' },
  ];

  const currencies = [
    { value: 'EUR', label: 'Euro (EUR)', symbol: '€' },
    { value: 'XOF', label: 'Franc CFA (XOF)', symbol: 'CFA' },
    { value: 'USD', label: 'Dollar US (USD)', symbol: '$' },
  ];

  const timezones = [
    { value: 'Europe/Paris', label: 'Europe/Paris (GMT+1)' },
    { value: 'Africa/Dakar', label: 'Africa/Dakar (GMT+0)' },
    { value: 'Africa/Abidjan', label: 'Africa/Abidjan (GMT+0)' },
    { value: 'Africa/Casablanca', label: 'Africa/Casablanca (GMT+1)' }
  ];

  // Initialiser le formulaire avec les données de la boutique
  useEffect(() => {
    if (store) {
      setFormData({
        storeName: store.name,
        storeCode: store.code,
        country: store.country,
        city: store.city,
        department: store.department,
        address: store.address,
        currency: store.currency,
        timezone: store.timezone,
        status: store.status,
        managerEmail: store.manager?.email || '',
        phone: store.phone || '',
        email: store.email || '',
        openingDate: store.openingDate ? store.openingDate.split('T')[0] : '',
        company: store.company || ''
      });
    }
  }, [store]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Préparer seulement les champs modifiés
      const updates: Record<string, string | null> = {};
      
      if (formData.storeName !== store.name) updates.store_name = formData.storeName;
      if (formData.storeCode !== store.code) updates.store_code = formData.storeCode;
      if (formData.country !== store.country) updates.store_country = formData.country;
      if (formData.city !== store.city) updates.store_city = formData.city;
      if (formData.department !== store.department) updates.store_department = formData.department;
      if (formData.address !== store.address) updates.store_address = formData.address;
      if (formData.phone !== (store.phone || '')) updates.store_phone = formData.phone || null;
      if (formData.email !== (store.email || '')) updates.store_email = formData.email || null;
      if (formData.currency !== store.currency) updates.store_currency = formData.currency;
      if (formData.timezone !== store.timezone) updates.store_timezone = formData.timezone;
      if (formData.status !== store.status) updates.store_status = formData.status;
      if (formData.company !== (store.company || '')) updates.store_company = formData.company || null;
      
      // Gérer la date d'ouverture
      const currentDate = store.openingDate ? store.openingDate.split('T')[0] : '';
      if (formData.openingDate !== currentDate) {
        updates.store_openingDate = formData.openingDate ? new Date(formData.openingDate).toISOString() : null;
      }

      // Gérer le changement de manager
      if (formData.managerEmail !== (store.manager?.email || '')) {
        updates.store_managerEmail = formData.managerEmail || null;
      }

      // Vérifier s'il y a des modifications
      if (Object.keys(updates).length === 0) {
        setErrorMessage('Aucune modification détectée');
        setShowError(true);
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/stores/${store.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user?.id,
          role: userRole,
          ...updates
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.message);
        setShowError(true);
        setLoading(false);
        return;
      }

      // Succès
      setSuccessMessage(data.message);
      setShowSuccess(true);
      setLoading(false);

      // Rafraîchir les données
      if (onStoreUpdated) {
        onStoreUpdated(); // Appeler le callback pour rafraîchir
      }

    } catch (error) {
      console.error(error);
      setErrorMessage('Un problème inattendu est survenu.');
      setShowError(true);
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <SuccessModal
        isOpen={showSuccess}
        onClose={() => {
          setShowSuccess(false);
          onClose(); // Fermer le modal principal
        }}
        message={successMessage}
      />

      <ErrorModal
        isOpen={showError}
        onClose={() => setShowError(false)}
        message={errorMessage}
      />

      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
          
          <div className="relative bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 rounded-t-2xl z-10">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Modifier la boutique</h2>
                  <p className="text-gray-600">
                    {store.name} ({store.code})
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Vous pouvez modifier un ou plusieurs champs. Seules les modifications seront envoyées.
                  </p>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={24} className="text-gray-500" />
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-8">
              {/* General Information Section */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#800080] to-[#9333ea] flex items-center justify-center">
                    <Store size={18} className="text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Informations générales</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Store Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nom de la boutique
                    </label>
                    <div className="relative">
                      <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        value={formData.storeName}
                        onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080] focus:border-transparent transition-all"
                        placeholder="I Love Mobile Paris"
                      />
                    </div>
                  </div>

                  {/* Store Code */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Code unique
                    </label>
                    <div className="relative">
                      <Package2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        value={formData.storeCode}
                        onChange={(e) => setFormData({ ...formData, storeCode: e.target.value.toUpperCase() })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080] focus:border-transparent transition-all"
                        placeholder="BOUT001"
                      />
                    </div>
                  </div>

                  {/* Country */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Pays
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                      <select
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080] focus:border-transparent transition-all appearance-none bg-white"
                      >
                        <option value="">Sélectionnez un pays</option>
                        {countries.map(country => (
                          <option key={country.value} value={country.value}>
                            {country.flag} {country.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                    </div>
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Ville
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080] focus:border-transparent transition-all"
                        placeholder="Paris"
                      />
                    </div>
                  </div>

                  {/* Department */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Département
                    </label>
                    <div className="relative">
                      <Map className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080] focus:border-transparent transition-all"
                        placeholder="ex: 75 ou Île-de-France"
                      />
                    </div>
                  </div>

                  {/* Currency */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Devise locale
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                      <select
                        value={formData.currency}
                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080] focus:border-transparent transition-all appearance-none bg-white"
                      >
                        <option value="">Sélectionnez une devise</option>
                        {currencies.map(currency => (
                          <option key={currency.value} value={currency.value}>
                            {currency.symbol} {currency.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                    </div>
                  </div>

                  {/* Timezone */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Fuseau horaire
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                      <select
                        value={formData.timezone}
                        onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080] focus:border-transparent transition-all appearance-none bg-white"
                      >
                        <option value="">Sélectionnez un fuseau</option>
                        {timezones.map(tz => (
                          <option key={tz.value} value={tz.value}>
                            {tz.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="mt-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Adresse complète
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={3}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080] focus:border-transparent transition-all resize-none"
                      placeholder="123 Avenue des Champs-Élysées, 75008 Paris"
                    />
                  </div>
                </div>

                {/* Status Toggle */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">Statut de la boutique</p>
                      <p className="text-sm text-gray-600">Activer ou désactiver cette boutique</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ 
                        ...formData, 
                        status: formData.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
                      })}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                        formData.status === 'ACTIVE' ? 'bg-[#800080]' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                          formData.status === 'ACTIVE' ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      formData.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                    <span className={`text-sm font-medium ${
                      formData.status === 'ACTIVE' ? 'text-green-700' : 'text-gray-600'
                    }`}>
                      {formData.status === 'ACTIVE' ? 'Boutique active' : 'Boutique inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="border-t border-gray-200 pt-8">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <User size={18} className="text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Informations de contact</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Manager Email */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Adresse e-mail du manager
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="email"
                        value={formData.managerEmail}
                        onChange={(e) => setFormData({ ...formData, managerEmail: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080] focus:border-transparent transition-all"
                        placeholder="manager@ilovemobile.fr"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Laissez vide pour ne pas changer le manager
                    </p>
                  </div>

                  {/* Company */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Société (entreprise)
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                      <select
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080] focus:border-transparent transition-all appearance-none bg-white"
                      >
                        <option value="">Sélectionnez une société</option>
                        {companies.map(company => (
                          <option key={company.value} value={company.value}>
                            {company.flag} {company.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Numéro de téléphone
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080] focus:border-transparent transition-all"
                        placeholder="+33 1 23 45 67 89"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Adresse e-mail
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080] focus:border-transparent transition-all"
                        placeholder="contact@ilovemobile.fr"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-8 border-t border-gray-200 mt-8">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 py-3 px-6 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 px-6 bg-gradient-to-r from-[#800080] to-[#9333ea] text-white rounded-lg font-semibold hover:from-[#6b006b] hover:to-[#7e22ce] transition-all shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={20} className="animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Check size={20} />
                      Enregistrer les modifications
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};



// Store Details Modal/Page
interface StoreDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
  userRole: string;
}

const StoreDetailsModal: React.FC<StoreDetailsModalProps> = ({ 
  isOpen, 
  onClose, 
  storeId,
  userRole 
}) => {
  const user = useCurrentUser();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [storeData, setStoreData] = useState<StoreData | null>(null);

  // Charger les détails de la boutique
  useEffect(() => {
    const fetchStoreDetails = async () => {
      if (!isOpen || !storeId || !user?.id) return;

      setLoading(true);
      setError('');

      try {
        const response = await fetch(
          `/api/stores/${storeId}?user_id=${user.id}&role=${userRole}`
        );

        const data = await response.json();

        if (!response.ok) {
          setError(data.message);
          return;
        }

        setStoreData(data);
      } catch (err) {
        console.error(err);
        setError('Erreur lors du chargement des détails');
      } finally {
        setLoading(false);
      }
    };

    fetchStoreDetails();
  }, [isOpen, storeId, user?.id, userRole]);

  if (!isOpen) return null;

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: LayoutDashboard },
    { id: 'team', label: 'Équipe', icon: User },
    { id: 'settings', label: 'Paramètres', icon: Settings }
  ];

  // Fonction pour formater la date
  const formatDate = (date: string | null) => {
    if (!date) return 'Non défini';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  // Fonction pour le badge de statut
  const getStatusBadge = (status: StoreStatus) => {
    const badges: Record<StoreStatus, string> = {
      ACTIVE: 'bg-green-100 text-green-700',
      INACTIVE: 'bg-orange-100 text-orange-700',
      SUSPENDED: 'bg-gray-100 text-gray-700'
    };
    const labels: Record<StoreStatus, string> = {
      ACTIVE: 'Active',
      INACTIVE: 'Inactive',
      SUSPENDED: 'Suspendu'
    };
    return { 
      class: badges[status], 
      label: labels[status] 
    };
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-start justify-center min-h-screen px-4 pt-4 pb-20">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
        
        <div className="relative bg-white rounded-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden shadow-2xl my-8">
          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <RefreshCw className="animate-spin text-[#800080]" size={48} />
            </div>
          ) : error ? (
            <div className="p-8">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <p className="text-red-600 font-semibold mb-4">{error}</p>
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Fermer
                </button>
              </div>
            </div>
          ) : storeData && (
            <>
              {/* Header with Store Info */}
              <div className="bg-gradient-to-r from-[#800080] to-[#9333ea] px-8 py-6 text-white">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Store size={32} className="text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-2xl font-bold">{storeData.store.name}</h2>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(storeData.store.status).class} bg-white/20 text-white`}>
                          {getStatusBadge(storeData.store.status).label}
                        </span>
                      </div>
                      <p className="text-purple-100 flex items-center gap-2 mb-1">
                        <MapPin size={16} />
                        {storeData.store.address}
                      </p>
                      <p className="text-purple-100 text-sm">
                        {storeData.store.city}, {storeData.store.country} • {storeData.store.currency}
                      </p>
                      <p className="text-purple-100 text-sm mt-1">
                        Code: <span className="font-semibold">{storeData.store.code}</span>
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={onClose}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <p className="text-purple-100 text-sm mb-1">Employés</p>
                    <p className="text-2xl font-bold">
                      {storeData.statistics.activeEmployees} / {storeData.statistics.totalEmployees}
                    </p>
                    <p className="text-xs text-purple-200 mt-1">actifs</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <p className="text-purple-100 text-sm mb-1">Manager</p>
                    <p className="text-lg font-bold">
                      {storeData.store.manager?.name || 'Non assigné'}
                    </p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <p className="text-purple-100 text-sm mb-1">Société</p>
                    <p className="text-lg font-bold">
                      {storeData.store.company || 'Non défini'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabs Navigation */}
              <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
                <div className="px-8">
                  <div className="flex gap-1">
                    {tabs.map(tab => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors ${
                            isActive
                              ? 'border-[#800080] text-[#800080]'
                              : 'border-transparent text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          <Icon size={18} />
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-8 overflow-y-auto" style={{ maxHeight: 'calc(95vh - 280px)' }}>
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Store Information Card */}
                      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <Building size={20} className="text-[#800080]" />
                          Informations de la boutique
                        </h3>
                        <div className="space-y-3">
                          <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-sm text-gray-600">Département</span>
                            <span className="font-semibold text-gray-900">{storeData.store.department}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-sm text-gray-600">Fuseau horaire</span>
                            <span className="font-semibold text-gray-900">{storeData.store.timezone}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-sm text-gray-600">Date d&apos;ouverture</span>
                            <span className="font-semibold text-gray-900">
                              {formatDate(storeData.store.openingDate)}
                            </span>
                          </div>
                          <div className="flex justify-between py-2">
                            <span className="text-sm text-gray-600">Créé par</span>
                            <span className="font-semibold text-gray-900">
                              {storeData.store.createdBy?.name || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Contact Information Card */}
                      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <Mail size={20} className="text-blue-600" />
                          Informations de contact
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <Phone size={18} className="text-gray-400 mt-1" />
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Téléphone</p>
                              <p className="font-semibold text-gray-900">
                                {storeData.store.phone || 'Non renseigné'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <Mail size={18} className="text-gray-400 mt-1" />
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Email</p>
                              <p className="font-semibold text-gray-900">
                                {storeData.store.email || 'Non renseigné'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <MapPin size={18} className="text-gray-400 mt-1" />
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Adresse complète</p>
                              <p className="font-semibold text-gray-900">
                                {storeData.store.address}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Manager Details */}
                    {storeData.store.manager && (
                      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <User size={20} className="text-[#800080]" />
                          Manager de la boutique
                        </h3>
                        <div className="flex items-center gap-4">
                          {storeData.store.manager.image ? (
                            <Image
                                src={storeData.store.manager.image}
                                alt={storeData.store.manager.name || 'Photo'}
                                width={64}
                                height={64}
                                className="w-16 h-16 rounded-full object-cover"
                              />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#800080] to-[#9333ea] flex items-center justify-center text-white text-xl font-bold">
                              {storeData.store.manager.name?.charAt(0) || 'M'}
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="font-bold text-gray-900 text-lg">{storeData.store.manager.name}</p>
                            <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                              <Mail size={14} />
                              {storeData.store.manager.email}
                            </p>
                            {storeData.store.manager.phone && (
                              <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                                <Phone size={14} />
                                {storeData.store.manager.phone}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              storeData.store.manager.status === 'ACTIVE' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {storeData.store.manager.status}
                            </span>
                            {storeData.store.manager.lastLogin && (
                              <p className="text-xs text-gray-500 mt-2">
                                Dernière connexion:<br />
                                {formatDate(storeData.store.manager.lastLogin)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Team Tab */}
                {activeTab === 'team' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Équipe de la boutique</h3>
                        <p className="text-gray-600">
                          {storeData.statistics.totalEmployees} employé(s) • {storeData.statistics.activeEmployees} actif(s)
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {storeData.store.employees.length > 0 ? (
                        storeData.store.employees.map((employee) => (
                          <div key={employee.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3">
                              {employee.image ? (
                                <Image
                                  src={employee.image}
                                  alt={employee.name || 'photo'}
                                  width={48}
                                  height={48}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white font-bold">
                                  {employee.name?.charAt(0) || 'E'}
                                </div>
                              )}
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900">{employee.name}</p>
                                <p className="text-xs text-gray-500">{employee.email}</p>
                                {employee.phone && (
                                  <p className="text-xs text-gray-500">{employee.phone}</p>
                                )}
                              </div>
                              <div className="text-right">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  employee.status === 'ACTIVE' 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {employee.status}
                                </span>
                                <p className="text-xs text-gray-500 mt-1">{employee.role}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-2 bg-gray-50 rounded-lg p-8 text-center">
                          <User size={48} className="mx-auto text-gray-400 mb-4" />
                          <p className="text-gray-600">Aucun employé dans cette boutique</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">Paramètres de la boutique</h3>
                      <p className="text-gray-600">Informations système et configuration</p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800">
                        <strong>Niveau d&apos;accès:</strong> {storeData.accessLevel === 'all' ? 'Tous les magasins' : storeData.accessLevel === 'company' ? 'Magasins de l\'entreprise' : 'Votre magasin uniquement'}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <h4 className="font-bold text-gray-900 mb-4">Informations système</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-sm text-gray-600">ID Boutique</span>
                            <span className="font-mono text-xs text-gray-900">{storeData.store.id}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-sm text-gray-600">Créé le</span>
                            <span className="text-sm text-gray-900">{formatDate(storeData.store.createdAt)}</span>
                          </div>
                          <div className="flex justify-between py-2">
                            <span className="text-sm text-gray-600">Dernière modification</span>
                            <span className="text-sm text-gray-900">{formatDate(storeData.store.updatedAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};




// ============================================================================
// COMPOSANT PRINCIPAL: StoresPage
// ============================================================================

const StoresPage: React.FC = () => {
  const { stores, loading, error, selectedRole, setSelectedRole, refetchStores } = useStores();
  
  const user = useCurrentUser();
  // const activeRoles = useActiveRoles();
  // const [stores, setStores] = useState<Store[]>(MOCK_STORES);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // const [stores, setStores] = useState<Store[]>([]);
  // const [selectedRole, setSelectedRole] = useState<string>(user?.role || '');
  // const [loading, setLoading] = useState(true);
  // const [error, setError] = useState('');

  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);

  const [selectedCompany, setSelectedCompany] = useState<string>('all');

  // Créer la liste des compagnies disponibles
  const companies = [
    { value: 'all', label: 'Toutes les sociétés' },
    { value: 'ECOCOMAM - Martinique', label: 'ECOCOMAM - Martinique', flag: '🇲🇶' },
    { value: 'ECOGWADA - Guadeloupe', label: 'ECOGWADA - Guadeloupe', flag: '🇬🇵' },
    { value: 'ECOCOM - Guyane', label: 'ECOCOM - Guyane', flag: '🇬🇫' },
    { value: 'ECOMAVELI - La Réunion', label: 'ECOMAVELI - La Réunion', flag: '🇷🇪' },
  ];

  const handleEditStore = (store: Store) => {
    setSelectedStore(store);
    setIsEditModalOpen(true);
  };
  // Ajouter cette fonction pour rafraîchir après modification
  const handleStoreUpdated = () => {
    refetchStores(); // Recharge toutes les boutiques
    // Mettre à jour aussi selectedStore si le modal reste ouvert
    if (selectedStore) {
      const updatedStore = stores.find(s => s.id === selectedStore.id);
      if (updatedStore) {
        setSelectedStore(updatedStore);
      }
    }
  };

  const handleViewDetails = (store: Store) => {
    setSelectedStoreId(store.id);
    setIsDetailsOpen(true);
  };

  // Construire la liste des rôles disponibles
  const availableRoles = user ? [
    { value: user.role, label: `Rôle principal: ${user.role}`, isPrimary: true }
  ] : [];

  // Ajouter les rôles secondaires actifs
  if (user?.secondaryRoles) {
    const activeSecondary = user.secondaryRoles.filter(sr => {
      if (!sr.expiresAt) return true;
      return new Date(sr.expiresAt) > new Date();
    });

    activeSecondary.forEach(sr => {
      availableRoles.push({
        value: sr.role,
        label: `Rôle secondaire: ${sr.role}`,
        isPrimary: false,
      });
    });
  }

  const handleDeleteStore = async (storeId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette boutique ? Cette action est irréversible.')) {
      return;
    }

    try {
      const response = await fetch(`/api/stores/${storeId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user?.id,
          role: selectedRole
        })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      // Rafraîchir la liste après suppression
      refetchStores();
      alert(data.message);
      
    } catch (error) {
      console.error(error);
      alert('Erreur lors de la suppression');
    }
  };

  // Créer un useEffect pour charger les boutiques
  // const fetchStores = async () => {
  //   if (!user?.id || !selectedRole) return;
    
  //   setLoading(true);
  //   setError('');
    
  //   try {
  //     const response = await fetch(`/api/stores?user_id=${user.id}&role=${selectedRole}`);
      
  //     const data = await response.json();
      
  //     if (!response.ok) {
  //       setError(data.message);
  //       return;
  //     }
      
  //     // L'API retourne soit 'stores' (array) soit 'canViewOwnStore' (object)
  //     const storesList = data.stores || (data.canViewOwnStore ? [data.canViewOwnStore] : []);
  //     setStores(storesList);
      
  //   } catch (err) {
  //     console.error(err);
  //     setError("Erreur lors de la récupération des boutiques");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // // Charger les boutiques au montage et quand le rôle change
  // useEffect(() => {
  //   fetchStores();
  // }, [user?.id, selectedRole]);

  // pour filter les stores par company
  const filteredStores = selectedCompany === 'all' 
    ? stores 
    : stores.filter(store => store.company === selectedCompany);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Gestion des boutiques</h2>
          <p className="text-gray-600">
            {filteredStores.length} boutique{filteredStores.length > 1 ? 's' : ''} 
            {selectedCompany !== 'all' && ` - ${companies.find(c => c.value === selectedCompany)?.label}`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filtre par compagnie */}
          <div className="relative">
            <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080] focus:border-transparent transition-all appearance-none bg-white min-w-[250px]"
            >
              {companies.map(company => (
                <option key={company.value} value={company.value}>
                  {company.flag ? `${company.flag} ` : ''}{company.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
          </div>

          {/* Sélecteur de rôle (si applicable) */}
          {user?.secondaryRoles && user.secondaryRoles.length > 0 && (
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800080] transition-all"
            >
              <option value={user.role}>
                Rôle principal: {user.role}
              </option>
              {user.secondaryRoles.map((sr) => (
                <option key={sr.id} value={sr.role}>
                  Rôle secondaire: {sr.role}
                </option>
              ))}
            </select>
          )}

          {/* Bouton Ajouter */}
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#800080] text-white rounded-lg hover:bg-[#6b006b] transition-colors"
          >
            <Plus size={20} />
            Ajouter une boutique
          </button>
        </div>
      </div>

      {/* Stores Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <RefreshCw className="animate-spin" size={32} />
          <span className="ml-2">Chargement des boutiques...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      ) : stores.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <Store size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Aucune boutique trouvée</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stores.map(store => (
            <div key={store.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#800080] to-[#9333ea] flex items-center justify-center">
                    <Store size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{store.name}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <MapPin size={14} />
                      {store.city}, {store.country}
                    </p>
                  </div>
                </div>
                <StoreDropdownMenu
                  store={store}
                  onViewDetails={handleViewDetails}
                  onEdit={handleEditStore}
                  onDelete={handleDeleteStore}
                />
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Ventes</span>
                  {/* <span className="font-bold text-gray-900">{store.sales.toLocaleString()} {store.currency}</span> */}
                  <span className="font-bold text-gray-900">5000 {store.currency}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Commandes</span>
                  {/* <span className="font-bold text-gray-900">{store.orders}</span> */}
                  <span className="font-bold text-gray-900">10</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">Stock total</span>
                  {/* <span className="font-bold text-gray-900">{store.stock} produits</span> */}
                  <span className="font-bold text-gray-900">99 produits</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => handleViewDetails(store)} 
                  className="flex-1 py-2 px-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <Eye size={16} />
                  Détails
                </button>
                <button 
                  onClick={() => handleEditStore(store)} 
                  className="flex-1 py-2 px-3 bg-[#f3e8ff] hover:bg-[#e9d5ff] text-[#800080] rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <Edit size={16} />
                  Modifier
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <AddStoreModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        userRole={selectedRole}
      />

      {/* <EditStoreModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        store={selectedStore}
      /> */}

      <StoreDetailsModal 
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedStoreId(null);
        }}
        storeId={selectedStoreId || ''}
        userRole={selectedRole}
      />

      <EditStoreModal 
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedStore(null);
        }}
        store={selectedStore!}
        userRole={selectedRole}
        onStoreUpdated={handleStoreUpdated} // Passer le callback
      />

    </div>
  );
};

export default StoresPage;