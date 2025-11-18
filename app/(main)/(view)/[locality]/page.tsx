'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MapPin, ChevronRight, ChevronLeft, CreditCard, User, Phone, Mail, ChevronDown, X, Truck, GitCompare, Shield, Tag, Award, Check } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import { useCurrentUser } from '@/ts/hooks/use-current-user';
import { useLocation, DEFAULT_LOCATION } from '../contexts/LocationContext';
import { useComparator } from '../../contexts/ComparatorContext';
// import { ComparatorButton } from '../components/ComparatorButton';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

// Informations de la barre inférieure
const features = [
  { icon: CreditCard, text: 'Paiement fractionné sans frais' },
  { icon: Truck, text: 'Livraison offerte' },
  { icon: User, text: 'S.A.V.' }
];

const HeroSlider: React.FC = () => {
  return (
    <div className="w-full">
      {/* Container de la vidéo */}
      <div className="relative w-full h-[66vh] overflow-hidden bg-black">
        {/* Vidéo pleine largeur */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source
            src="assets/video/pub.mp4"
            type="video/mp4"
          />
          Votre navigateur ne supporte pas la lecture de vidéos.
        </video>
      </div>

      {/* Barre d'informations en bas */}
      <div className="w-full bg-gray-50 py-6 border-t border-gray-200">
        <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10 px-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div 
                key={index}
                className="flex flex-col md:flex-row items-center gap-2 text-center md:text-left"
              >
                <Icon className="text-rose-600 w-6 h-6 flex-shrink-0" />
                <span className="text-base md:text-lg font-medium text-gray-800">
                  {feature.text}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};


// Location Selection Modal Component
interface LocationModalProps {
  currentUserId?: string; // ID de l'utilisateur connecté (optionnel)
}

const LocationModal = ({ currentUserId }: LocationModalProps) => {
  const router = useRouter();
  const { selectedLocation, setSelectedLocation, allLocations, isInitialized } = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [showChangeOptions, setShowChangeOptions] = useState(false);
  const [tempSelection, setTempSelection] = useState<string | null>(
    selectedLocation?.id || null
  );
  const [isLoading, setIsLoading] = useState(false);

  // Vérifier si l'utilisateur a déjà confirmé sa localisation
  useEffect(() => {
    // Attendre que le contexte soit initialisé
    if (!isInitialized) return;

    const locationConfirmed = localStorage.getItem('locationConfirmed');
    
    // Si la localisation n'a jamais été confirmée, montrer le modal
    if (locationConfirmed !== 'true' && selectedLocation) {
      setIsOpen(true);
      setShowChangeOptions(false); // D'abord montrer la confirmation de la localisation par défaut
      setTempSelection(selectedLocation.id);
    }
  }, [selectedLocation, isInitialized]);

  const handleKeepLocation = () => {
    if (selectedLocation) {
      setSelectedLocation(selectedLocation, currentUserId);
      setIsOpen(false);
      // Rediriger vers la localisation confirmée
      router.push(`/${selectedLocation.name}`);
    }
  };

  const handleWantToChange = () => {
    setShowChangeOptions(true);
  };

  const handleConfirm = () => {
    if (!tempSelection) {
      alert('Veuillez sélectionner votre localisation');
      return;
    }

    setIsLoading(true);
    
    setTimeout(() => {
      const location = allLocations.find(loc => loc.id === tempSelection);
      if (location) {
        setSelectedLocation(location, currentUserId); // Passer l'userId si connecté
        setIsLoading(false);
        setIsOpen(false);
        // Rediriger vers la nouvelle localisation
        router.push(`/${location.name}`);
      }
    }, 500);
  };

  const handleLocationSelect = (locationId: string) => {
    setTempSelection(locationId);
  };

  if (!isOpen || !selectedLocation) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.preventDefault()}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#800080] to-[#9933cc] px-8 py-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <MapPin size={24} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold">Bienvenue chez I Love Mobile ❤️</h2>
          </div>
          <p className="text-white/90 text-sm">
            {showChangeOptions ? 'Sélectionnez votre nouvelle localisation' : 'Confirmez votre localisation'}
          </p>
        </div>

        {/* Content */}
        <div className="p-8">
          {!showChangeOptions ? (
            <>
              {/* Current Location Display */}
              <div className="bg-gradient-to-br from-[#f3e8ff] to-[#e9d5ff] border-2 border-[#800080] rounded-2xl p-6 mb-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-[#800080] rounded-full mb-4">
                    <span className="text-4xl">{selectedLocation.icon}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-[#800080] mb-2">
                    {selectedLocation.name}
                  </h3>
                  <p className="text-gray-700 flex items-center justify-center gap-2">
                    <Truck size={18} className="text-[#800080]" />
                    <span>Livraison : {selectedLocation.deliveryTime}</span>
                  </p>
                </div>
              </div>

              {/* Question */}
              <div className="text-center mb-6">
                <p className="text-lg font-semibold text-gray-900 mb-2">
                  La localisation actuelle est <span className="text-[#800080]">{selectedLocation.name}</span>
                </p>
                <p className="text-gray-600">
                  Souhaitez-vous garder cette localisation ou en choisir une autre ?
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleKeepLocation}
                  className="w-full py-4 rounded-xl font-semibold text-lg bg-[#800080] text-white hover:bg-[#6b006b] shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <span>Garder {selectedLocation.name}</span>
                  <ChevronRight size={20} />
                </button>
                
                <button
                  onClick={handleWantToChange}
                  className="w-full py-4 rounded-xl font-semibold text-lg bg-white text-[#800080] border-2 border-[#800080] hover:bg-[#f3e8ff] transition-all duration-300"
                >
                  Choisir une autre localisation
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Info Banner */}
              <div className="bg-[#f3e8ff] border-2 border-[#e9d5ff] rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <Truck size={24} className="text-[#800080]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Livraison express disponible et gratuite
                    </h3>
                    <p className="text-sm text-gray-700">
                      Nous livrons partout en <strong>Martinique</strong>, en <strong>Guyane</strong> et en <strong>Guadeloupe</strong> sous <strong>2h à 24h</strong> !
                    </p>
                  </div>
                </div>
              </div>

              {/* Location Selection */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Où êtes-vous situé(e) ?
                </h3>
            
            {allLocations.map((location) => (
              <button
                key={location.id}
                onClick={() => handleLocationSelect(location.id)}
                className={`w-full p-5 rounded-xl border-2 transition-all duration-300 text-left flex items-center justify-between group ${
                  tempSelection === location.id
                    ? 'border-[#800080] bg-[#f3e8ff] shadow-md'
                    : 'border-gray-200 hover:border-[#b366b3] hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all ${
                    tempSelection === location.id
                      ? 'bg-[#800080] scale-110'
                      : 'bg-gray-100 group-hover:bg-[#f3e8ff]'
                  }`}>
                    {tempSelection === location.id ? '📍' : location.icon}
                  </div>
                  <div>
                    <p className={`font-semibold text-lg ${
                      tempSelection === location.id ? 'text-[#800080]' : 'text-gray-900'
                    }`}>
                      {location.name}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <Truck size={14} />
                      <span>Livraison : {location.deliveryTime}</span>
                    </p>
                  </div>
                </div>
                
                {tempSelection === location.id && (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-[#800080] rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </button>
            ))}
              </div>

              {/* Warning Message */}
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                <p className="text-xs text-yellow-800 flex items-start gap-2">
                  <span className="text-base">⚠️</span>
                  <span>
                    Cette étape est <strong>obligatoire</strong> pour continuer. 
                    Nous avons besoin de votre localisation pour vous garantir les meilleurs délais de livraison.
                  </span>
                </p>
              </div>

              {/* Confirm Button */}
              <button
                onClick={handleConfirm}
                disabled={!tempSelection || isLoading}
                className={`w-full mt-6 py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                  tempSelection && !isLoading
                    ? 'bg-[#800080] text-white hover:bg-[#6b006b] shadow-lg hover:shadow-xl hover:scale-[1.02]'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Confirmation en cours...</span>
                  </>
                ) : (
                  <>
                    <span>Confirmer ma localisation</span>
                    <ChevronRight size={20} />
                  </>
                )}
              </button>

              {/* Help Link */}
              <div className="mt-4 text-center">
                <a 
                  href="#" 
                  className="text-sm text-gray-600 hover:text-[#800080] inline-flex items-center gap-1"
                >
                  <Phone size={14} />
                  <span>Besoin d&apos;aide ? Contactez-nous</span>
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// // components/LocationConfirmPopup.tsx
// const LocationConfirmPopup = () => {
//   const { selectedLocation, shouldShowConfirmPopup, setShouldShowConfirmPopup } = useLocation();
//   const [isAnimating, setIsAnimating] = useState(false);

//   if (!shouldShowConfirmPopup || !selectedLocation) return null;

//   const handleStay = () => {
//     // Mettre à jour le timestamp pour réinitialiser le délai de 24h
//     const savedData = localStorage.getItem('userLocationData');
//     if (savedData) {
//       try {
//         const locationData = JSON.parse(savedData);
//         locationData.timestamp = Date.now(); // Réinitialiser le timestamp
//         localStorage.setItem('userLocationData', JSON.stringify(locationData));
//       } catch (error) {
//         console.error('Erreur lors de la mise à jour du timestamp:', error);
//       }
//     }
    
//     setIsAnimating(true);
//     setTimeout(() => {
//       setShouldShowConfirmPopup(false);
//     }, 300);
//   };

//   const handleChange = () => {
//     // Réinitialiser la confirmation pour rouvrir le modal principal
//     localStorage.setItem('locationConfirmed', 'false');
//     setShouldShowConfirmPopup(false);
//     window.location.reload(); // ou utilisez un state pour rouvrir LocationModal
//   };

//   return (
//     <div 
//       className={`fixed inset-0 z-[99] flex items-start justify-center bg-black/40 backdrop-blur-sm pt-20 transition-opacity duration-300 ${
//         isAnimating ? 'opacity-0' : 'opacity-100'
//       }`}
//       onClick={handleStay}
//     >
//       <div 
//         className={`bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden transform transition-all duration-300 ${
//           isAnimating ? 'translate-y-[-20px] opacity-0' : 'translate-y-0 opacity-100'
//         }`}
//         onClick={(e) => e.stopPropagation()}
//       >
//         {/* Header avec icône de localisation */}
//         <div className="bg-gradient-to-r from-[#800080] to-[#9933cc] px-6 py-4 relative">
//           <button
//             onClick={handleStay}
//             className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors"
//             aria-label="Fermer"
//           >
//             <X size={20} />
//           </button>
          
//           <div className="flex items-center gap-3">
//             <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
//               <MapPin size={24} className="text-white" />
//             </div>
//             <div>
//               <h3 className="text-xl font-bold text-white">
//                 Confirmation de localisation
//               </h3>
//               <p className="text-white/90 text-sm">
//                 Il y a plus de 24 heures
//               </p>
//             </div>
//           </div>
//         </div>

//         {/* Content */}
//         <div className="p-6">
//           {/* Message principal */}
//           <div className="text-center mb-6">
//             <div className="inline-flex items-center justify-center w-16 h-16 bg-[#f3e8ff] rounded-full mb-4">
//               <span className="text-3xl">{selectedLocation.icon}</span>
//             </div>
            
//             <p className="text-lg text-gray-800 mb-2">
//               Vous êtes sur le site
//             </p>
//             <p className="text-2xl font-bold text-[#800080] mb-4">
//               {selectedLocation.name}
//             </p>
            
//             <p className="text-gray-600">
//               Voulez-vous changer de département ?
//             </p>
//           </div>

//           {/* Info complémentaire */}
//           <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
//             <p className="text-sm text-blue-800 flex items-center gap-2">
//               <span>ℹ️</span>
//               <span>
//                 Votre localisation influence les délais de livraison et la disponibilité des produits.
//               </span>
//             </p>
//           </div>

//           {/* Boutons d'action */}
//           <div className="space-y-3">
//             <button
//               onClick={handleStay}
//               className="w-full py-3 bg-[#800080] hover:bg-[#6b006b] text-white font-semibold rounded-xl transition-all duration-300 shadow-md hover:shadow-lg hover:scale-[1.02] flex items-center justify-center gap-2"
//             >
//               <span>✓</span>
//               <span>Non, j&apos;y reste</span>
//             </button>
            
//             <button
//               onClick={handleChange}
//               className="w-full py-3 bg-white hover:bg-gray-50 text-[#800080] font-semibold rounded-xl transition-all duration-300 border-2 border-[#800080] flex items-center justify-center gap-2"
//             >
//               <span>🔄</span>
//               <span>Oui, changer de département</span>
//             </button>
//           </div>

//           {/* Petit texte en bas */}
//           <p className="text-xs text-gray-500 text-center mt-4">
//             Cette confirmation sera demandée toutes les 24 heures
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };


// Hero Section Component with Help Section
// const HeroWithHelp = () => {
//   return (
//     <section className="bg-gradient-to-b from-white to-gray-50 py-12 md:py-16">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
//           {/* Left Column - Hero Text */}
//           <div className="space-y-4">
//             <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
//                 <span style={{ color: '#800080' }}>I Love Mobile. </span>
//                 <span className="text-gray-900">
//                     On te livre en 24 heures le produit que tu aimes{" "}
//                     <span style={{ color: '#800080' }}>❤</span>
//                 </span>
//             </h1>
//             <p className="text-lg text-gray-600 max-w-xl">
//               Découvrez notre collection premium de produits innovants conçus pour améliorer votre style de vie numérique.
//             </p>
//           </div>
          
//           {/* Right Column - Help Cards */}
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
//             {/* Specialist Card */}
//             <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
//               <div className="flex items-start space-x-4">
//                 <div className="flex-shrink-0">
//                     <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden" style={{ backgroundColor: '#87518B' }}>
//                         <Image 
//                             src="/assets/Profile-Picture.png" 
//                             alt="Profile" 
//                             width={48}
//                             height={48}
//                             className="object-cover"
//                         />
//                     </div>
//                 </div>
//                 <div className="flex-1">
//                     <h3 className="text-base font-semibold text-gray-900 mb-1">
//                         Besoin d&apos;aide pour vos achat ?
//                     </h3>
//                     <a href="#" className="hover:text-violet-700 text-sm font-medium inline-flex items-center group" style={{ color: '#800080' }}>
//                         Demander a un Specialist
//                         <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
//                     </a>
//                 </div>
//               </div>
//             </div>
            
//             {/* Store Location Card */}
//             <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
//               <div className="flex items-start space-x-4">
//                 <div className="flex-shrink-0">
//                   <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center">
//                     <MapPin size={24} style={{ color: '#800080' }} />
//                   </div>
//                 </div>
//                 <div className="flex-1">
//                   <h3 className="text-base font-semibold text-gray-900 mb-1">
//                     Trouvez-en un près de chez vous
//                   </h3>
//                   <a href="#" className="hover:text-violet-700 text-sm font-medium inline-flex items-center group" style={{ color: '#800080' }}>
//                     Visitez une boutique
//                     <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
//                   </a>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// };
const HeroWithHelp = () => {
  const params = useParams();
  const locality = params?.locality as string;
  
  return (
    <section className="bg-gradient-to-b from-white to-gray-50 py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left Column - Hero Text */}
          <div className="space-y-4">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                <span style={{ color: '#800080' }}>I Love Mobile. </span>
                <span className="text-gray-900">
                    On te livre en 24 heures le produit que tu aimes{" "}
                    {locality && (
                      <span>
                        en <span style={{ color: '#800080' }}>{locality}</span>
                      </span>
                    )}{" "}
                    <span style={{ color: '#800080' }}>❤</span>
                </span>
            </h1>
            <p className="text-lg text-gray-600 max-w-xl">
              Découvrez notre collection premium de produits innovants conçus pour améliorer votre style de vie numérique.
            </p>
          </div>
          
          {/* Right Column - Help Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            {/* Specialist Card */}
            <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden" 
                      style={{ backgroundColor: '#87518B' }}
                    >
                        <Image 
                            src="/assets/Profile-Picture.png" 
                            alt="Profile" 
                            width={48}
                            height={48}
                            className="object-cover"
                        />
                    </div>
                </div>
                <div className="flex-1">
                    <h3 className="text-base font-semibold text-gray-900 mb-1">
                        Besoin d&apos;aide pour vos achats ?
                    </h3>
                    <Link 
                      href={`/${locality}/contact`}
                      className="text-sm font-medium inline-flex items-center group transition-colors duration-200" 
                      style={{ color: '#800080' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#600060'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#800080'}
                    >
                        Demander à un spécialiste
                        <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
              </div>
            </div>
            
            {/* Store Location Card */}
            <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center" 
                    style={{ backgroundColor: '#f3e5f5' }}
                  >
                    <MapPin size={24} style={{ color: '#800080' }} />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-gray-900 mb-1">
                    Retrouve et contacte ta boutique préféré
                  </h3>
                  <a 
                    href={`/${locality}/boutiques`} 
                    className="text-sm font-medium inline-flex items-center group transition-colors duration-200" 
                    style={{ color: '#800080' }}
                    target="_blank"
                    rel="noopener noreferrer"
                    onMouseEnter={(e) => e.currentTarget.style.color = '#600060'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#800080'}
                  >
                    Visitez une boutique
                    <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Product Slider Component
const ProductSlider = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const params = useParams();
  const locality = params?.locality as string;

  // 🔹 Liste des produits avec image + lien
  const products = [
    {
      name: "Apple",
      image: "/assets/logo-apple.png",
      link: locality ? `/${locality}/Apple` : "/Apple",
    },
    {
      name: "Samsung",
      image: "/assets/logo-samsung.png",
      link: locality ? `/${locality}/Samsung` : "/Samsung",
    },
    {
      name: "Xiaomi",
      image: "/assets/logo-xiaomi.png",
      link: locality ? `/${locality}/Xiaomi` : "/Xiaomi",
    },
    {
      name: "Oukitel",
      subtitle: "Téléphone renforcé",
      image: "/assets/logo-oukitel.png",
      link: locality ? `/${locality}/Oukitel` : "/Oukitel",
      badgeImage: "/assets/bouclier-oukitel.jpg",
    },
    {
      name: "Smart Watch",
      image: "/assets/smartwatch.png",
      link: locality ? `/${locality}/Smart Watch` : "/Smart Watch",
    },
    {
      name: "AirPods Pro",
      image: "/assets/airpods.png",
      link: locality ? `/${locality}/AirPods Pro` : "/AirPods Pro",
    },
    {
      name: "Accessoires",
      image: "/assets/mobile+accessories2.png",
      link: locality ? `/${locality}/Accessoires` : "/Accessoires",
    },
  ];

  // 🔹 Fonction de défilement
  const scroll = (direction : 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = 300;
      const newScrollLeft =
        direction === "left"
          ? container.scrollLeft - scrollAmount
          : container.scrollLeft + scrollAmount;

      container.scrollTo({
        left: newScrollLeft,
        behavior: "smooth",
      });

      setTimeout(updateArrows, 300);
    }
  };

  // 🔹 Afficher / masquer les flèches selon la position
  const updateArrows = () => {
    const container = scrollContainerRef.current;
    if (container) {
      setShowLeftArrow(container.scrollLeft > 10);
      setShowRightArrow(
        container.scrollLeft <
          container.scrollWidth - container.clientWidth - 10
      );
    }
  };

  // 🔹 Mettre à jour les flèches au chargement
  useEffect(() => {
    updateArrows();
  }, []);

  return (
    <section className="bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative">
          {/* 🔹 Flèche gauche */}
          {showLeftArrow && (
            <button
              onClick={() => scroll("left")}
              className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-12 h-12 items-center justify-center bg-white rounded-full shadow-lg opacity-70 hover:opacity-100 transition-opacity duration-200"
              aria-label="Scroll left"
            >
              <ChevronLeft size={24} className="text-gray-800" />
            </button>
          )}

          {/* 🔹 Conteneur des produits */}
          <div
            ref={scrollContainerRef}
            onScroll={updateArrows}
            className="flex gap-4 md:gap-6 overflow-x-auto pb-4"
            style={{ 
              scrollbarWidth: "none", 
              msOverflowStyle: "none",
              WebkitOverflowScrolling: "touch"
            }}
          >
            {products.map((product, index) => (
              <a
                key={index}
                href={product.link}
                className="group flex-shrink-0 w-40 md:w-48 bg-white rounded-2xl p-6 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer"
              >
                <div className="relative aspect-square flex items-center justify-center mb-4 bg-gradient-to-br from-#f9fafb to-#f3e8ff rounded-xl overflow-hidden">
                    <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 160px, 192px"
                        className="object-contain transition-transform duration-300 group-hover:scale-110"
                    />
                  
                    {/* 🔹 Badge dans le coin droit (si présent) */}
                    {product.badgeImage && (
                        <div className="absolute top-2 right-2 w-10 h-10 md:w-12 md:h-12 bg-white rounded-full shadow-lg p-1 border-2 border-[#e9d5ff]">
                            <Image
                                src={product.badgeImage}
                                alt={`${product.name} badge`}
                                fill
                                sizes="48px"
                                className="object-contain"
                            />
                        </div>
                    )}
                </div>
                <h3 className="text-center text-sm font-medium text-gray-900 group-hover:text-[#800080] transition-colors">
                    {product.name}
                </h3>

                {product.subtitle && (
                    <p className="text-center text-xs text-gray-500 mt-1">
                    {product.subtitle}
                    </p>
                )}
              </a>
            ))}
          </div>

          {/* 🔹 Flèche droite */}
          {showRightArrow && (
            <button
              onClick={() => scroll("right")}
              className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-12 h-12 items-center justify-center bg-white rounded-full shadow-lg opacity-70 hover:opacity-100 transition-opacity duration-200"
              aria-label="Scroll right"
            >
              <ChevronRight size={24} className="text-gray-800" />
            </button>
          )}
        </div>
      </div>

      <style>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
};

// Interface pour les produits formatés
interface FormattedProduct {
  id: string;
  name: string;
  subtitle: string;
  details: string;
  rating: string;
  reviews: string;
  currentPrice: string;
  oldPrice?: string | null;
  image: string;
  link: string;
  productModel?: {
    specifications?: Record<string, unknown>;
  };
}

interface ProductModel {
  id: string;
  designation: string;
  brand: string;
  reference: string;
  category: string;
  family?: string;
  subFamily?: string;
  description?: string;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'DESTOCKING_ACTIVE' | 'DESTOCKING_END_OF_LIFE' | 'INACTIVE';
  specifications?: Record<string, unknown>;
  createdById?: string;
  createdAt: Date;
  updatedAt: Date;
  averageRating?: number | null;
  totalReviews?: number;
  colors?: ProductColor[];
  variants?: ProductVariant[];
  articles?: Article[];
}

interface ProductColor {
  id: string;
  colorName: string;
  hexaColor: string;
  modelId: string;
  createdAt: Date;
  images?: ProductImage[];
  articles?: Article[];
}

interface ProductImage {
  id: string;
  url: string;
  fileName?: string;
  displayOrder: number;
  colorId: string;
  createdAt: Date;
}

interface ProductVariant {
  id: string;
  variantReference: string;
  modelId: string;
  storeId: string;
  colorId?: string;
  variantAttribute: string | null;
  attributeType: 'STORAGE_RAM' | 'SIZE' | 'CAPACITY' | 'CONNECTOR' | 'MEMORY' | 'NONE' | null;
  useFCFA: boolean;
  pvTTC: number;
  pamp: number;
  oldPrice: number;
  margin: number;
  tva: number;
  pvTTC_FCFA: number;
  pamp_FCFA: number;
  oldPrice_FCFA: number;
  marginFCFA: number;
  marginPercent: number;
  totalStock: number;
  availableStock: number;
  reservedStock: number;
  soldStock: number;
  createdAt: Date;
  updatedAt: Date;
  store?: {
    id: string;
    name: string;
    code: string;
    city: string;
  };
  color?: {
    id: string;
    colorName: string;
    hexaColor: string;
  };
}

interface Article {
  id: string;
  articleNumber: string;
  articleReference: string;
  modelReference: string;
  description?: string;
  useFCFA: boolean;
  pvTTC: string;
  pamp: string;
  oldPrice: string;
  tva: string;
  margin: string;
  pvTTC_FCFA: string;
  pamp_FCFA: string;
  oldPrice_FCFA: string;
  marginFCFA: string;
  marginPercent: string;
  status: 'DRAFT' | 'IN_STOCK' | 'IN_TRANSIT' | 'SOLD' | 'RESERVED' | 'DEFECTIVE' | 'STOLEN' | 'RETURNED' | 'LOST';
  articleCondition: 'NEW' | 'LIKE_NEW' | 'REFURBISHED';
  specifications?: Record<string, unknown>;
  receivedDate: Date;
  soldDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  modelId: string;
  storeId: string;
  entryId: string;
  supplierId: string;
  colorId?: string;
  model?: ProductModel;
  color?: ProductColor;
}

// New Products Section Component
const NewProductsSection = () => {
  const router = useRouter();
  const params = useParams();
  const locality = params?.locality as string;
  const { addProduct, products } = useComparator();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [hoveredProduct, setHoveredProduct] = useState<number | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [newProducts, setNewProducts] = useState<FormattedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    const fetchNewProducts = async () => {
      if (!locality) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/produits/${locality}/featured?type=new`);
        
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des nouveaux produits');
        }
        
        const data = await response.json();
        setNewProducts(data.products || []);
      } catch (error) {
        console.error('Erreur lors du chargement des nouveaux produits:', error);
        setNewProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNewProducts();
  }, [locality]);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const scrollAmount = 380;
    const newScrollLeft =
      direction === "left"
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: newScrollLeft,
      behavior: "smooth",
    });

    setTimeout(updateArrows, 350);
  };

  const updateArrows = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    setShowLeftArrow(container.scrollLeft > 10);
    setShowRightArrow(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    );
  };

  // Mettre à jour les flèches après le chargement des produits
  useEffect(() => {
    if (!loading && newProducts.length > 0) {
      // Utiliser requestAnimationFrame pour s'assurer que le DOM est complètement rendu
      requestAnimationFrame(() => {
        setTimeout(() => {
          updateArrows();
        }, 100); // Petit délai pour laisser les images se charger
      });
    }
  }, [loading, newProducts.length]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Mettre à jour immédiatement
    updateArrows();

    // Observer les changements de taille du conteneur
    const resizeObserver = new ResizeObserver(() => {
      setTimeout(() => updateArrows(), 50);
    });
    resizeObserver.observe(container);

    // Observer aussi le redimensionnement de la fenêtre
    const onResize = () => {
      setTimeout(() => updateArrows(), 100);
    };
    window.addEventListener("resize", onResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <section className="bg-gray-50 py-16 mt-2">
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className={`${
            notification.type === 'success' ? 'bg-green-500' :
            notification.type === 'error' ? 'bg-red-500' :
            'bg-blue-500'
          } text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] max-w-md`}>
            <span className="flex-1">{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6 px-2">
          Nouveau Produits
        </h2>

        <div className="relative">
          {showLeftArrow && (
            <button
              onClick={() => scroll("left")}
              aria-label="Scroll left"
              className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-12 h-12 items-center justify-center bg-white rounded-full shadow-lg opacity-80 hover:opacity-100 transition-opacity duration-200"
            >
              <ChevronLeft size={22} className="text-gray-800" />
            </button>
          )}

          <div
            ref={scrollContainerRef}
            onScroll={updateArrows}
            className="flex gap-6 overflow-x-auto scroll-smooth pb-4"
            style={{ 
              scrollbarWidth: "none", 
              msOverflowStyle: "none"
            }}
          >
            {loading ? (
              <div className="flex items-center justify-center w-full py-20">
                <div className="text-gray-500">Chargement des produits...</div>
              </div>
            ) : newProducts.length === 0 ? (
              <div className="flex items-center justify-center w-full py-20">
                <div className="text-gray-500">Aucun nouveau produit disponible</div>
              </div>
            ) : (
              newProducts.map((product, index) => (
              <div
                key={index}
                className="relative w-[360px] min-w-[360px] h-[540px] bg-white rounded-2xl shadow-md p-6 flex flex-col justify-between transition-transform hover:scale-105 hover:shadow-lg cursor-pointer group"
                onMouseEnter={() => setHoveredProduct(index)}
                onMouseLeave={() => setHoveredProduct(null)}
                onClick={() => router.push(product.link)}
              >
                {/* Bouton Comparer */}
                {hoveredProduct === index && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      
                      if (products.length >= 3) {
                        showNotification('Vous ne pouvez comparer que 3 produits maximum', 'error');
                        return;
                      }
                      
                      const priceValue = product.currentPrice.includes('FCFA')
                        ? parseFloat(product.currentPrice.replace(/[^\d,]/g, '').replace(',', '.'))
                        : parseFloat(product.currentPrice.replace(/[^\d,.]/g, '').replace(',', '.'));
                      
                      const formattedProduct = {
                        id: product.id || `new-${index}`,
                        name: product.name,
                        brand: product.subtitle,
                        category: 'Nouveau',
                        image: product.image,
                        price: priceValue,
                        specifications: product.productModel?.specifications as Record<string, string | number | boolean> || {},
                      };
                      addProduct(formattedProduct);
                      showNotification(`${product.name} ajouté au comparateur!`, 'success');
                    }}
                    disabled={products.length >= 3}
                    className="absolute top-4 right-2 z-10 flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white text-[#800080] rounded-lg shadow-lg border-2 border-[#800080] font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title={products.length >= 3 ? "Maximum 3 produits" : "Ajouter au comparateur"}
                  >
                    <GitCompare size={18} />
                    <span>Comparer</span>
                  </button>
                )}
                
                {/* Zone image - 360px de hauteur (67% de la carte) */}
                <div className="flex items-center justify-center mb-4 bg-gradient-to-br from-#f9fafb to-#f3e8ff rounded-xl h-[360px] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/images/placeholder.png";
                    }}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>

                {/* Infos produit - Zone compacte (~144px) */}
                <div className="space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-1">{product.subtitle}</p>
                    <p className="text-xs text-gray-500">{product.details}</p>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-yellow-500">⭐</span>
                    <span className="font-medium text-gray-900">
                      {product.rating}/5
                    </span>
                    <span className="text-gray-500">({product.reviews})</span>
                  </div>

                  <div className="pt-1">
                    <span className="text-xl font-bold text-[#800080]">
                      {product.currentPrice}
                    </span>
                  </div>
                </div>
              </div>
              ))
            )}
          </div>

          {showRightArrow && (
            <button
              onClick={() => scroll("right")}
              aria-label="Scroll right"
              className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-12 h-12 items-center justify-center bg-white rounded-full shadow-lg opacity-80 hover:opacity-100 transition-opacity duration-200"
            >
              <ChevronRight size={22} className="text-gray-800" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

const RecommendedSection = () => {
  const router = useRouter();
  const params = useParams();
  const locality = params?.locality as string;
  const { addProduct, products } = useComparator();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [hoveredProduct, setHoveredProduct] = useState<number | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [recommendedProducts, setRecommendedProducts] = useState<FormattedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    const fetchRecommendedProducts = async () => {
      if (!locality) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/produits/${locality}/featured?type=recommended`);
        
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des produits recommandés');
        }
        
        const data = await response.json();
        setRecommendedProducts(data.products || []);
      } catch (error) {
        console.error('Erreur lors du chargement des produits recommandés:', error);
        setRecommendedProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendedProducts();
  }, [locality]);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = 300;
      const newScrollLeft = direction === 'left' 
        ? container.scrollLeft - scrollAmount 
        : container.scrollLeft + scrollAmount;
      
      container.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
      
      setTimeout(() => {
        updateArrows();
      }, 350);
    }
  };

  const updateArrows = () => {
    const container = scrollContainerRef.current;
    if (container) {
      setShowLeftArrow(container.scrollLeft > 10);
      setShowRightArrow(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 10
      );
    }
  };

  // Mettre à jour les flèches après le chargement des produits
  useEffect(() => {
    if (!loading && recommendedProducts.length > 0) {
      // Utiliser requestAnimationFrame pour s'assurer que le DOM est complètement rendu
      requestAnimationFrame(() => {
        setTimeout(() => {
          updateArrows();
        }, 100); // Petit délai pour laisser les images se charger
      });
    }
  }, [loading, recommendedProducts.length]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Mettre à jour immédiatement
    updateArrows();

    // Observer les changements de taille du conteneur
    const resizeObserver = new ResizeObserver(() => {
      setTimeout(() => updateArrows(), 50);
    });
    resizeObserver.observe(container);

    // Observer aussi le redimensionnement de la fenêtre
    const onResize = () => {
      setTimeout(() => updateArrows(), 100);
    };
    window.addEventListener("resize", onResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <section className="bg-gray-50 py-16">
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className={`${
            notification.type === 'success' ? 'bg-green-500' :
            notification.type === 'error' ? 'bg-red-500' :
            'bg-blue-500'
          } text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] max-w-md`}>
            <span className="flex-1">{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6 px-2">
          Recommandés pour vous
        </h2>
        
        <div className="relative">
          {showLeftArrow && (
            <button
              onClick={() => scroll('left')}
              className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-12 h-12 items-center justify-center bg-white rounded-full shadow-lg opacity-80 hover:opacity-100 transition-opacity duration-200"
              aria-label="Scroll left"
            >
              <ChevronLeft size={22} className="text-gray-800" />
            </button>
          )}
          
          <div
            ref={scrollContainerRef}
            onScroll={updateArrows}
            className="flex gap-6 overflow-x-auto scroll-smooth pb-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {loading ? (
              <div className="flex items-center justify-center w-full py-20">
                <div className="text-gray-500">Chargement des produits...</div>
              </div>
            ) : recommendedProducts.length === 0 ? (
              <div className="flex items-center justify-center w-full py-20">
                <div className="text-gray-500">Aucun produit recommandé disponible</div>
              </div>
            ) : (
              recommendedProducts.map((product, index) => (
              <div
                key={index}
                className="relative w-[280px] min-w-[280px] bg-white rounded-2xl p-6 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group"
                onMouseEnter={() => setHoveredProduct(index)}
                onMouseLeave={() => setHoveredProduct(null)}
                onClick={() => router.push(product.link)}
              >
                {/* Bouton Comparer */}
                {hoveredProduct === index && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      
                      if (products.length >= 3) {
                        showNotification('Vous ne pouvez comparer que 3 produits maximum', 'error');
                        return;
                      }
                      
                      const priceValue = product.currentPrice.includes('FCFA')
                        ? parseFloat(product.currentPrice.replace(/[^\d,]/g, '').replace(',', '.'))
                        : parseFloat(product.currentPrice.replace(/[^\d,.]/g, '').replace(',', '.'));
                      
                      const oldPriceValue = product.oldPrice
                        ? (product.oldPrice.includes('FCFA')
                            ? parseFloat(product.oldPrice.replace(/[^\d,]/g, '').replace(',', '.'))
                            : parseFloat(product.oldPrice.replace(/[^\d,.]/g, '').replace(',', '.')))
                        : undefined;
                      
                      const formattedProduct = {
                        id: product.id || `rec-${index}`,
                        name: product.name,
                        brand: product.subtitle,
                        category: 'Recommandé',
                        image: product.image,
                        price: priceValue,
                        oldPrice: oldPriceValue,
                        rating: product.rating,
                        reviews: product.reviews,
                        specifications: product.productModel?.specifications as Record<string, string | number | boolean> || {},
                      };
                      addProduct(formattedProduct);
                      showNotification(`${product.name} ajouté au comparateur!`, 'success');
                    }}
                    disabled={products.length >= 3}
                    className="absolute top-4 right-2 z-10 flex items-center gap-2 px-3 py-2 bg-white/90 hover:bg-white text-[#800080] rounded-lg shadow-lg border-2 border-[#800080] font-semibold text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title={products.length >= 3 ? "Maximum 3 produits" : "Ajouter au comparateur"}
                  >
                    <GitCompare size={16} />
                    <span>Comparer</span>
                  </button>
                )}
                
                {/* Zone image - 360px de hauteur */}
                <div className="flex items-center justify-center mb-4 bg-gradient-to-br from-#f9fafb to-#f3e8ff rounded-xl h-[240px] overflow-hidden">
                    <Image
                        src={product.image}
                        alt={product.name}
                        width={280}
                        height={240}
                        loading="lazy"
                        onError={(e) => {
                            e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='280' height='280' viewBox='0 0 280 280'%3E%3Crect fill='%23f3f4f6' width='280' height='280'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%239ca3af'%3EImage non disponible%3C/text%3E%3C/svg%3E";
                        }}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                </div>
                
                {/* Product Info */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-600">{product.subtitle}</p>
                  <p className="text-xs text-gray-500">{product.details}</p>
                  
                  {/* Rating */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-yellow-500">⭐</span>
                    <span className="font-medium text-gray-900">{product.rating}/5</span>
                    <span className="text-gray-500">({product.reviews})</span>
                  </div>
                  
                  {/* Pricing */}
                  <div className="flex items-baseline gap-2 pt-1">
                    <span className="text-xl font-bold text-[#800080]">
                      {product.currentPrice}
                    </span>
                    {product.oldPrice && (
                      <span className="text-sm text-gray-400 line-through">
                        {product.oldPrice}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              ))
            )}
          </div>
          
          {showRightArrow && (
            <button
              onClick={() => scroll('right')}
              className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-12 h-12 items-center justify-center bg-white rounded-full shadow-lg opacity-80 hover:opacity-100 transition-opacity duration-200"
              aria-label="Scroll right"
            >
              <ChevronRight size={22} className="text-gray-800" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

// Marque
const BrandSection = () => {
  const router = useRouter();
  const { products } = useComparator();

  const handleOpenComparator = () => {
    router.push('/comparateur');
  };

  return (
    <section className="bg-gray-50 py-1">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6 px-4">
          Comparez vos produits
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white rounded-3xl p-8 shadow-md">
          {/* Left Column - Comparator Section */}
          <div className="w-full">
            <div className="relative w-full h-full min-h-[400px] bg-[#f3e8ff] rounded-2xl overflow-hidden shadow-sm flex items-center justify-center p-8">
              <div className="flex flex-col items-center justify-center space-y-8">
                {/* Phone Images with VS */}
                <div className="flex items-center justify-center gap-6">
                  {/* First Phone */}
                  <div className="transform transition-transform hover:scale-105 duration-300">
                    <Image 
                        src="/assets/mobile-phone.png"
                        alt="Phone 1"
                        width={160}
                        height={208}
                        className="w-40 h-52 object-cover rounded-xl shadow-lg"
                    />
                  </div>
                  
                  {/* VS Text */}
                  <span className="text-4xl font-bold text-[#800080]">
                    VS
                  </span>
                  
                  {/* Second Phone */}
                  <div className="transform transition-transform hover:scale-105 duration-300">
                    <Image 
                        src="/assets/mobile-phone.png"
                        alt="Phone 2"
                        width={160}
                        height={208}
                        className="w-40 h-52 object-cover rounded-xl shadow-lg"
                    />
                  </div>
                </div>
                
                {/* Button */}
                <button 
                  onClick={handleOpenComparator}
                  className="bg-[#800080] hover:bg-[#6b006b] text-white font-semibold px-8 py-3 rounded-full shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl flex items-center gap-2"
                >
                  <GitCompare size={20} />
                  Accéder au comparateur
                  {products.length > 0 && (
                    <span className="bg-white text-[#800080] rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      {products.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
          
          {/* Right Column - Description Text */}
          <div className="w-full flex items-center">
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-900">
                Comparez facilement vos produits
              </h3>
              
              <div className="space-y-4 text-gray-700">
                <p className="text-lg leading-relaxed">
                  Vous voulez comparer plusieurs produits de même marque ou de marques différentes ? 
                  Notre comparateur vous permet de mettre côte à côte jusqu&apos;à <span className="font-semibold text-[#800080]">3 produits</span> pour analyser leurs caractéristiques, leurs prix et choisir celui qui vous convient le mieux.
                </p>
                
                <p className="text-base text-gray-600 italic pt-2">
                  Ajoutez vos produits au comparateur depuis n&apos;importe quelle page produit et accédez à votre comparaison personnalisée en un clic !
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ilm Difference Hero Section with Carousel
const IlmStoreDifference = () => {
  const { selectedLocation } = useLocation();
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const slides = [
    {
      title: (
        <>
          Livraison <span className="relative inline-block">gratuite<span className="absolute bottom-1 left-0 w-full h-3 bg-[#a8d5ff] -z-10"></span></span><br />
          partout en {selectedLocation?.name}
        </>
      ),
      icon: Truck,
      description: "Recevez vos smartphones directement chez vous sans frais supplémentaires",
      bgColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      title: (
        <>
          Garantie <span className="relative inline-block">14 jours<span className="absolute bottom-1 left-0 w-full h-3 bg-[#d5f3a8] -z-10"></span></span><br />
          satisfait ou remboursé
        </>
      ),
      icon: Shield,
      description: "Changez d'avis ? Nous vous remboursons intégralement sous 14 jours",
      bgColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
      title: (
        <>
          Prix <span className="relative inline-block">compétitifs<span className="absolute bottom-1 left-0 w-full h-3 bg-[#ffd5a8] -z-10"></span></span><br />
          toute l&apos;année
        </>
      ),
      icon: Tag,
      description: "Les meilleurs prix sur iPhone, Samsung, Oukitel et accessoires",
      bgColor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    },
    {
      title: (
        <>
          Qualité <span className="relative inline-block">premium<span className="absolute bottom-1 left-0 w-full h-3 bg-[#d5e64a] -z-10"></span></span><br />
          garantie
        </>
      ),
      icon: Award,
      description: "Uniquement des produits des grandes marques comme Apple et Samsung",
      bgColor: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    },
    {
      title: (
        <>
          Paiement <span className="relative inline-block">sécurisé<span className="absolute bottom-1 left-0 w-full h-3 bg-[#ffd5e6] -z-10"></span></span><br />
          et fractionné
        </>
      ),
      icon: CreditCard,
      description: "Payez en toute sécurité et fractionnez vos achats en plusieurs fois",
      bgColor: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
    }
  ];

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <section className="bg-gradient-to-br from-gray-50 to-gray-100 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Pourquoi choisir <span className="text-[#800080]">I Love Mobile</span> ?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Découvrez les avantages exclusifs qui font de nous votre partenaire mobile de confiance
          </p>
        </div>
        
        {/* Carousel Container */}
        <div className="relative overflow-hidden rounded-3xl shadow-2xl">
          {/* Slides Wrapper */}
          <div 
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {slides.map((slide, index) => {
              const IconComponent = slide.icon;
              return (
                <div
                  key={index}
                  className="min-w-full relative"
                  style={{ background: slide.bgColor }}
                >
                  {/* Overlay for better text readability */}
                  <div className="absolute inset-0 bg-black bg-opacity-10"></div>
                  
                  <div className="relative grid grid-cols-1 md:grid-cols-2 items-center gap-12 p-8 md:p-16 min-h-[500px]">
                    {/* Text Content - Left Side */}
                    <div className="flex flex-col justify-center text-white">
                      <h3 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                        {slide.title}
                      </h3>
                      <p className="text-lg md:text-xl text-white/90 leading-relaxed">
                        {slide.description}
                      </p>
                    </div>
                    
                    {/* Icon - Right Side */}
                    <div className="flex items-center justify-center">
                      <div className="w-64 h-64 md:w-80 md:h-80 bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl flex items-center justify-center transform hover:scale-105 transition-transform duration-300">
                        <IconComponent size={120} className="text-purple-600" strokeWidth={1.5} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Navigation Controls Container */}
          <div className="absolute bottom-8 left-8 right-8 flex items-center justify-between">
            {/* Dots Indicators - Left */}
            <div className="flex gap-3 bg-white/20 backdrop-blur-md rounded-full px-4 py-3">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`transition-all duration-300 rounded-full ${
                    currentIndex === index
                      ? 'w-10 h-3 bg-white shadow-lg'
                      : 'w-3 h-3 bg-white/50 hover:bg-white/80'
                  }`}
                  aria-label={`Aller à la diapositive ${index + 1}`}
                />
              ))}
            </div>
            
            {/* Arrow Buttons - Right */}
            <div className="flex gap-3">
              <button
                onClick={prevSlide}
                className="w-14 h-14 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-200 shadow-xl hover:shadow-2xl hover:scale-110"
                aria-label="Diapositive précédente"
              >
                <ChevronLeft size={28} className="text-purple-600" strokeWidth={2.5} />
              </button>
              <button
                onClick={nextSlide}
                className="w-14 h-14 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-200 shadow-xl hover:shadow-2xl hover:scale-110"
                aria-label="Diapositive suivante"
              >
                <ChevronRight size={28} className="text-purple-600" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats Below Carousel */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-12">
          {slides.map((slide, index) => {
            const IconComponent = slide.icon;
            return (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`p-4 rounded-2xl transition-all duration-300 ${
                  currentIndex === index
                    ? 'bg-purple-600 text-white shadow-lg scale-105'
                    : 'bg-white text-gray-700 hover:bg-gray-50 shadow'
                }`}
              >
                <IconComponent 
                  size={32} 
                  className={`mx-auto mb-2 ${currentIndex === index ? 'text-white' : 'text-purple-600'}`} 
                  strokeWidth={1.5}
                />
                <p className="text-xs font-semibold text-center">
                  {index === 0 && 'Livraison gratuite'}
                  {index === 1 && 'Garantie 14j'}
                  {index === 2 && 'Prix compétitifs'}
                  {index === 3 && 'Qualité premium'}
                  {index === 4 && 'Paiement sécurisé'}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};


// Boutique Section Component
const BoutiqueSection = () => {
  const router = useRouter();
  const params = useParams();
  const locality = params?.locality as string;
  const { addProduct, products } = useComparator();
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [boutiqueProducts, setBoutiqueProducts] = useState<ProductModel[]>([]);
  const [loading, setLoading] = useState(true);
  
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    const fetchBoutiqueProducts = async () => {
      if (!locality) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/produits/${locality}/search?limit=12`);
        
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des produits');
        }
        
        const data = await response.json();
        setBoutiqueProducts(data.productModel || []);
      } catch (error) {
        console.error('Erreur lors du chargement des produits:', error);
        setBoutiqueProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBoutiqueProducts();
  }, [locality]);

  const toggleCompare = (model: ProductModel) => {
    const isSelected = products.some(p => p.id === model.id);
    
    if (isSelected) {
      showNotification(`${model.designation} retiré du comparateur`, 'info');
      return;
    }
    
    if (products.length >= 3) {
      showNotification('Vous ne pouvez comparer que 3 produits maximum', 'error');
      return;
    }
    
    const prices = model.variants?.map((v) => parseFloat(v.pvTTC.toString())) || [];
    const price = prices.length > 0 ? Math.min(...prices) : 0;
    const oldPrices = model.variants?.map((v) => parseFloat(v.oldPrice.toString())).filter((p) => p > 0) || [];
    const oldPrice = oldPrices.length > 0 ? Math.min(...oldPrices) : undefined;
    const firstImage = model.colors?.[0]?.images?.[0]?.url || '/placeholder.jpg';
    
    const formattedProduct = {
      id: model.id,
      name: model.designation,
      brand: model.brand,
      category: model.category,
      image: firstImage,
      price,
      oldPrice,
      rating: model.averageRating?.toString(),
      reviews: model.totalReviews?.toString(),
      specifications: model.specifications as Record<string, string | number | boolean> || {},
    };
    
    addProduct(formattedProduct);
    showNotification(`${model.designation} ajouté au comparateur!`, 'success');
  };

  return (
    <section className="bg-white py-16">
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className={`${
            notification.type === 'success' ? 'bg-green-500' :
            notification.type === 'error' ? 'bg-red-500' :
            'bg-blue-500'
          } text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] max-w-md`}>
            <span className="flex-1">{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-semibold text-gray-900">Boutique</h2>
          <button
            onClick={() => router.push(`/${locality}/boutique`)}
            className="flex items-center gap-2 px-6 py-3 bg-[#800080] text-white rounded-lg hover:bg-[#6b006b] transition-colors duration-200 font-medium shadow-lg"
          >
            Voir plus
            <ChevronRight size={20} />
          </button>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#800080]"></div>
          </div>
        ) : boutiqueProducts.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-gray-500">Aucun produit disponible</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {boutiqueProducts.map((model) => {
              const prices = model.variants?.map((v) => parseFloat(v.pvTTC.toString())) || [];
              const price = prices.length > 0 ? Math.min(...prices) : 0;
              const oldPrices = model.variants?.map((v) => parseFloat(v.oldPrice.toString())).filter((p) => p > 0) || [];
              const oldPrice = oldPrices.length > 0 ? Math.min(...oldPrices) : 0;
              const firstImage = model.colors?.[0]?.images?.[0]?.url || '/placeholder.jpg';

              return (
                <div
                  key={model.id}
                  className="bg-white rounded-2xl hover:shadow-xl transition-all duration-300 group cursor-pointer border border-gray-100 relative overflow-hidden"
                  onMouseEnter={() => setHoveredProduct(model.id)}
                  onMouseLeave={() => setHoveredProduct(null)}
                  onClick={() => router.push(`/${locality}/${model.brand}/${model.category}/${model.id}`)}
                >
                  {/* Bouton Comparer au hover */}
                  {hoveredProduct === model.id && (
                    <div className="absolute top-2 right-2 z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCompare(model);
                        }}
                        disabled={products.length >= 3 && !products.some(p => p.id === model.id)}
                        className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all font-semibold text-xs backdrop-blur-sm ${
                          products.some(p => p.id === model.id)
                            ? 'bg-[#800080] text-white shadow-lg'
                            : products.length >= 3
                            ? 'bg-gray-400 text-white cursor-not-allowed opacity-70'
                            : 'bg-white/90 text-[#800080] hover:bg-white shadow-lg border-2 border-[#800080]'
                        }`}
                      >
                        {products.some(p => p.id === model.id) ? (
                          <>
                            <Check size={16} />
                            <span>Sélectionné</span>
                          </>
                        ) : (
                          <>
                            <span className="text-lg">+</span>
                            <span>Comparer</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Image */}
                  <div className="aspect-square mb-4 bg-gradient-to-br from-gray-50 to-[#F9F9F9] rounded-xl overflow-hidden relative group/image">
                    <Image
                      src={firstImage}
                      alt={model.designation}
                      width={400}
                      height={400}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Info */}
                  <div className="space-y-2 p-4">
                    <h3 className="font-semibold text-gray-900 group-hover:text-[#800080] line-clamp-2">
                      {model.designation}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>•</span>
                      <span>{model.brand}</span>
                      <div className="flex items-center gap-1">
                        {model.colors?.slice(0, 3).map((color) => (
                          <div
                            key={color.id}
                            className="w-5 h-5 rounded-full border-2 border-gray-300 cursor-pointer hover:border-[#800080] transition-colors"
                            style={{ backgroundColor: color.hexaColor }}
                            title={color.colorName}
                          />
                        ))}
                        {model.colors && model.colors.length > 3 && (
                          <span className="text-xs text-gray-400">+{model.colors.length - 3}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-baseline gap-2 pt-2">
                      <span className="text-lg font-semibold text-[#800080]">{price.toFixed(2)}€</span>
                      {oldPrice > 0 && (
                        <span className="text-sm text-gray-400 line-through">{oldPrice.toFixed(2)}€</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

const NewsletterSection = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleNewsletterSubmit = async () => {
    if (!email) {
      setNotification({
        type: 'error',
        message: 'Veuillez entrer une adresse email',
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setNotification({
          type: 'success',
          message: 'Inscription réussie ! Merci de vous être inscrit à notre newsletter.',
        });
        setEmail('');
        setTimeout(() => setNotification(null), 5000);
      } else {
        setNotification({
          type: 'error',
          message: data.message || 'Une erreur est survenue lors de l\'inscription',
        });
        setTimeout(() => setNotification(null), 5000);
      }
    } catch {
      setNotification({
        type: 'error',
        message: 'Une erreur est survenue. Veuillez réessayer plus tard.',
      });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleNewsletterSubmit();
    }
  };

  return (
    <section className="py-12">
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className={`${
            notification.type === 'success' ? 'bg-green-500' :
            notification.type === 'error' ? 'bg-red-500' :
            'bg-blue-500'
          } text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] max-w-md`}>
            <span className="flex-1">{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#800080] rounded-2xl p-12 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#9933cc] rounded-full opacity-20 -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#660066] rounded-full opacity-20 translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl font-semibold">Restez informé des dernières nouveautés</h2>
            <p className="text-[#f3e8ff] text-lg">
              Soyez le premier informé des nouveautés, des offres exclusives et des actualités technologiques importantes.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto mt-8">
              <div className="flex-1 relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Entrez votre adresse e-mail"
                  className="w-full bg-white rounded-lg px-4 py-3 pr-12 shadow-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#d5a3ff]"
                  disabled={isLoading}
                />
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              </div>
              <button
                onClick={handleNewsletterSubmit}
                disabled={isLoading}
                className="bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors duration-200 font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Inscription...' : "S'inscrire"}
              </button>
            </div>
            
            <button className="flex items-center gap-2 mx-auto text-[#f3e8ff] hover:text-white transition-colors duration-200 mt-4">
              <span className="text-sm font-medium">Apprendre encore plus</span>
              <ChevronDown size={16} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

// Best Offers Section Component
// const BestOffersSection = () => {
//   const scrollContainerRef = useRef(null);
//   const [showLeftArrow, setShowLeftArrow] = useState(false);
//   const [showRightArrow, setShowRightArrow] = useState(true);
//   const [selectedCategory, setSelectedCategory] = useState('Tous');
  
//   const categories = [
//     { name: 'Tous', emoji: '✨' },
//     { name: 'iPhone', emoji: '📱' },
//     { name: 'MacBook', emoji: '💻' },
//     { name: 'Montres connectées', emoji: '⌚' },
//     { name: 'iPad', emoji: '📱' },
//     { name: 'Smartphones Android', emoji: '📱' },
//     { name: 'Ordinateurs portables', emoji: '💻' },
//     { name: 'Jeux vidéo', emoji: '🎮' },
//     { name: 'Audio', emoji: '🎧' }
//   ];
  
//   const bestOffers = [
//     {
//       name: 'iPhone 14 Pro',
//       subtitle: '256 GB • Deep Purple',
//       image: '📱',
//       rating: '4.8',
//       reviews: '5,432',
//       price: '$899.00',
//       oldPrice: '$1,099.00',
//       discount: '-18%',
//       category: 'iPhone'
//     },
//     {
//       name: 'MacBook Air M2',
//       subtitle: '16GB RAM • 512GB SSD',
//       image: '💻',
//       rating: '4.9',
//       reviews: '3,891',
//       price: '$1,149.00',
//       oldPrice: '$1,499.00',
//       discount: '-23%',
//       category: 'MacBook'
//     },
//     {
//       name: 'Apple Watch Series 8',
//       subtitle: '45mm • GPS + Cellular',
//       image: '⌚',
//       rating: '4.7',
//       reviews: '4,256',
//       price: '$379.00',
//       oldPrice: '$499.00',
//       discount: '-24%',
//       category: 'Montres connectées'
//     },
//     {
//       name: 'iPad Air',
//       subtitle: 'M1 • 256GB • Wi-Fi',
//       image: '📱',
//       rating: '4.8',
//       reviews: '2,945',
//       price: '$549.00',
//       oldPrice: '$749.00',
//       discount: '-27%',
//       category: 'iPad'
//     },
//     {
//       name: 'AirPods Max',
//       subtitle: 'Spatial Audio • Silver',
//       image: '🎧',
//       rating: '4.6',
//       reviews: '1,834',
//       price: '$479.00',
//       oldPrice: '$549.00',
//       discount: '-13%',
//       category: 'Audio'
//     },
//     {
//       name: 'PlayStation 5',
//       subtitle: 'Digital Edition • 1TB',
//       image: '🎮',
//       rating: '4.9',
//       reviews: '6,721',
//       price: '$449.00',
//       oldPrice: '$499.00',
//       discount: '-10%',
//       category: 'Jeux vidéo'
//     }
//   ];

//   const scroll = (direction) => {
//     const container = scrollContainerRef.current;
//     if (container) {
//       const scrollAmount = 280;
//       const newScrollLeft = direction === 'left' 
//         ? container.scrollLeft - scrollAmount 
//         : container.scrollLeft + scrollAmount;
      
//       container.scrollTo({
//         left: newScrollLeft,
//         behavior: 'smooth'
//       });
      
//       setTimeout(() => {
//         updateArrows();
//       }, 300);
//     }
//   };

//   const updateArrows = () => {
//     const container = scrollContainerRef.current;
//     if (container) {
//       setShowLeftArrow(container.scrollLeft > 10);
//       setShowRightArrow(
//         container.scrollLeft < container.scrollWidth - container.clientWidth - 10
//       );
//     }
//   };

//   const filteredOffers = selectedCategory === 'Tous' 
//     ? bestOffers 
//     : bestOffers.filter(offer => offer.category === selectedCategory);

//   return (
//     <section className="bg-white py-16">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-12">
//           {/* Left Column - Hero Image */}
//           <div className="relative h-64 lg:h-96 rounded-3xl overflow-hidden shadow-2xl group">
//             <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-pink-500 flex items-center justify-center">
//               <div className="text-center space-y-6 px-8">
//                 <div className="flex justify-center items-center gap-6">
//                   <span className="text-7xl lg:text-8xl transform rotate-12 group-hover:rotate-0 transition-transform duration-500">📱</span>
//                   <span className="text-6xl lg:text-7xl transform -rotate-12 group-hover:rotate-0 transition-transform duration-500">🎧</span>
//                 </div>
//                 <div className="space-y-2">
//                   <h3 className="text-3xl lg:text-4xl font-bold text-white">Jusqu'à -30%</h3>
//                   <p className="text-lg text-white/90">Sur une sélection de produits</p>
//                 </div>
//               </div>
//             </div>
//             <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
//           </div>
          
//           {/* Right Column - Title & Categories */}
//           <div className="space-y-6">
//             <div>
//               <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
//                 Découvrez nos <span className="text-violet-600">meilleures offres</span>
//               </h2>
//               <p className="text-gray-600 text-lg">
//                 Des prix exceptionnels sur vos produits préférés
//               </p>
//             </div>
            
//             {/* Categories Scroll */}
//             <div className="relative">
//               {showLeftArrow && (
//                 <button
//                   onClick={() => scroll('left')}
//                   className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-10 h-10 items-center justify-center bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow duration-200"
//                   aria-label="Scroll left"
//                 >
//                   <ChevronLeft size={20} className="text-gray-800" />
//                 </button>
//               )}
              
//               <div
//                 ref={scrollContainerRef}
//                 onScroll={updateArrows}
//                 className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
//                 style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
//               >
//                 {categories.map((category, index) => (
//                   <button
//                     key={index}
//                     onClick={() => setSelectedCategory(category.name)}
//                     className={`flex-shrink-0 px-4 py-3 rounded-full transition-all duration-300 ease-out flex items-center gap-2 text-sm font-medium whitespace-nowrap ${
//                       selectedCategory === category.name
//                         ? 'bg-gradient-to-r from-violet-600 to-purple-700 text-white shadow-lg scale-105'
//                         : 'bg-white text-gray-700 shadow-md hover:shadow-lg hover:scale-105 hover:text-violet-600'
//                     }`}
//                   >
//                     <span className="text-lg">{category.emoji}</span>
//                     <span>{category.name}</span>
//                   </button>
//                 ))}
//               </div>
              
//               {showRightArrow && (
//                 <button
//                   onClick={() => scroll('right')}
//                   className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-10 h-10 items-center justify-center bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow duration-200"
//                   aria-label="Scroll right"
//                 >
//                   <ChevronRight size={20} className="text-gray-800" />
//                 </button>
//               )}
//             </div>
//           </div>
//         </div>
        
//         {/* Products Grid */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//           {filteredOffers.map((product, index) => (
//             <div
//               key={index}
//               className="bg-white rounded-2xl p-5 shadow-md hover:shadow-xl hover:-translate-y-2 transition-all duration-300 ease-out cursor-pointer group border border-gray-100"
//             >
//               {/* Discount Badge */}
//               <div className="flex justify-between items-start mb-4">
//                 <span className="bg-gradient-to-r from-red-500 to-pink-600 text-white text-xs font-bold px-3 py-1 rounded-full">
//                   {product.discount}
//                 </span>
//               </div>
              
//               {/* Product Image */}
//               <div className="aspect-square flex items-center justify-center mb-4 bg-gradient-to-br from-gray-50 to-violet-50 rounded-xl group-hover:from-violet-50 group-hover:to-purple-100 transition-colors duration-300">
//                 <span className="text-7xl group-hover:scale-110 transition-transform duration-300">{product.image}</span>
//               </div>
              
//               {/* Product Info */}
//               <div className="space-y-2">
//                 <h3 className="text-base font-semibold text-gray-900 group-hover:text-violet-600 transition-colors">
//                   {product.name}
//                 </h3>
                
//                 <p className="text-sm text-gray-500">
//                   {product.subtitle}
//                 </p>
                
//                 {/* Rating */}
//                 <div className="flex items-center gap-1 text-sm">
//                   <span className="text-yellow-500">⭐</span>
//                   <span className="font-medium text-gray-900">{product.rating}/5</span>
//                   <span className="text-gray-500">({product.reviews})</span>
//                 </div>
                
//                 {/* Pricing */}
//                 <div className="flex items-baseline gap-2 pt-2">
//                   <span className="text-xl font-bold text-violet-600">
//                     {product.price}
//                   </span>
//                   <span className="text-sm text-gray-400 line-through">
//                     {product.oldPrice}
//                   </span>
//                 </div>
                
//                 {/* Add to Cart Button */}
//                 <button className="w-full mt-3 py-2.5 bg-gradient-to-r from-violet-600 to-purple-700 text-white rounded-xl font-medium hover:shadow-lg hover:scale-105 transition-all duration-300 ease-out opacity-0 group-hover:opacity-100">
//                   Ajouter au panier
//                 </button>
//               </div>
//             </div>
//           ))}
//         </div>
        
//         {/* Show all offers link */}
//         <div className="text-center mt-10">
//           <button className="inline-flex items-center gap-2 px-8 py-3 bg-white text-violet-600 font-semibold rounded-full shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 ease-out border-2 border-violet-600 group">
//             Voir toutes les offres
//             <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
//           </button>
//         </div>
//       </div>
      
//       <style jsx>{`
//         .scrollbar-hide::-webkit-scrollbar {
//           display: none;
//         }
//       `}</style>
//     </section>
//   );
// };

// Main App Component
const IlmStore = () => {
  const user = useCurrentUser();
  const router = useRouter();
  const params = useParams();
  const locality = params?.locality as string;
  const { 
    selectedLocation, 
    setSelectedLocation, 
    allLocations, 
    checkLocationExpiry, 
    setShouldShowConfirmPopup, 
    loadUserLocation,
    isInitialized 
  } = useLocation();
  const [locationNotification, setLocationNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const locationCheckRef = useRef<string | null>(null);
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Vérifier et changer la localité si elle diffère de l'URL
  useEffect(() => {
    if (!isInitialized || !locality || !selectedLocation) return;

    const decodedLocality = decodeURIComponent(locality);
    
    // Créer une clé unique pour cette combinaison
    const checkKey = `${decodedLocality}-${selectedLocation.name}`;
    
    // Éviter de vérifier plusieurs fois pour la même combinaison
    if (locationCheckRef.current === checkKey) {
      return;
    }
    
    // Vérifier si la localité dans l'URL est différente de celle sélectionnée
    if (selectedLocation.name !== decodedLocality) {
      // Marquer cette combinaison comme vérifiée AVANT de changer la localité
      locationCheckRef.current = checkKey;
      
      // Chercher la localité dans la liste des localités disponibles
      const foundLocation = allLocations.find(loc => loc.name === decodedLocality);
      
      if (foundLocation) {
        // Nettoyer le timeout précédent s'il existe
        if (notificationTimeoutRef.current) {
          clearTimeout(notificationTimeoutRef.current);
          notificationTimeoutRef.current = null;
        }
        
        // Afficher la notification AVANT de changer la localité
        setLocationNotification({
          message: `Localité changée vers ${foundLocation.name}`,
          type: 'success'
        });
        
        // Masquer la notification après 3 secondes
        notificationTimeoutRef.current = setTimeout(() => {
          setLocationNotification(null);
          notificationTimeoutRef.current = null;
        }, 3000);
        
        // Changer la localité sélectionnée APRÈS avoir affiché la notification
        setSelectedLocation(foundLocation, user?.id);
      } else {
        // La localité n'existe pas, rediriger vers la localité par défaut ou la selectedLocation actuelle
        const redirectLocation = selectedLocation || DEFAULT_LOCATION;
        
        // Nettoyer le timeout précédent s'il existe
        if (notificationTimeoutRef.current) {
          clearTimeout(notificationTimeoutRef.current);
          notificationTimeoutRef.current = null;
        }
        
        // Afficher la notification AVANT de rediriger
        setLocationNotification({
          message: `Localité invalide. Redirection vers ${redirectLocation.name}`,
          type: 'error'
        });
        
        // Masquer la notification après 3 secondes
        notificationTimeoutRef.current = setTimeout(() => {
          setLocationNotification(null);
          notificationTimeoutRef.current = null;
        }, 3000);
        
        // Rediriger APRÈS avoir affiché la notification
        router.replace(`/${redirectLocation.name}`);
      }
    } else {
      // La localité correspond, mettre à jour le ref
      locationCheckRef.current = checkKey;
    }
    
    // Cleanup function pour nettoyer le timeout
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
        notificationTimeoutRef.current = null;
      }
    };
  }, [locality, selectedLocation, allLocations, setSelectedLocation, isInitialized, router, user?.id]);

  // gest de la localisation du user
  useEffect(() => {
    // CAS 1 : Utilisateur CONNECTÉ
    if (user) {
      // Charger la localisation depuis la BDD de l'utilisateur
      // loadUserLocation(user.id, user.location); // user.location = 'martinique', 'guadeloupe', etc.
      
      // Ne PAS vérifier l'expiration du cache
      setShouldShowConfirmPopup(false);
    } 
    // CAS 2 : Utilisateur NON CONNECTÉ
    else {
      // Vérifier si le cache a expiré (> 24h)
      const isExpired = checkLocationExpiry(false); // false = utilisateur non connecté
      
      if (isExpired) {
        setShouldShowConfirmPopup(true); // Afficher la popup
      }
    }
  }, [user, checkLocationExpiry, setShouldShowConfirmPopup, loadUserLocation]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Notification Toast pour changement de localité */}
      {locationNotification && (
        <div className="fixed top-4 right-4 z-[100] animate-slide-in">
          <div className={`${
            locationNotification.type === 'success' ? 'bg-green-500' :
            locationNotification.type === 'error' ? 'bg-red-500' :
            'bg-blue-500'
          } text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] max-w-md`}>
            <span className="flex-1">{locationNotification.message}</span>
            <button
              onClick={() => setLocationNotification(null)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      <LocationModal currentUserId={user?.id} />
      {/* <LocationConfirmPopup /> */}

      
      <Navbar />
      <HeroSlider />
      <HeroWithHelp />
      <ProductSlider />
      <NewProductsSection />
      <RecommendedSection />
      {/* <RecommendedSection2 /> */}
      <BrandSection />
      <IlmStoreDifference />
      <NewsletterSection />
      <BoutiqueSection />
      <Footer />
    </div>
  );
};

export default IlmStore;