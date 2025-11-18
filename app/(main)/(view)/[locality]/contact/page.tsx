'use client';

import React, { useEffect } from 'react';
import { Phone, Mail, MapPin, MessageCircle, Clock, Building2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '../../components/Navbar';
import { useLocation, DEFAULT_LOCATION } from '../../contexts/LocationContext';
import { Footer } from '../../components/Footer';

// Données de contact par département
const contactData = {
  Martinique: {
    adresse: {
      principale: '123 Rue de la République',
      complement: '97200 Fort-de-France',
      pays: 'Martinique'
    },
    telephones: [
      { departement: 'Service Client', numero: '+596 696 12 34 56', horaires: 'Lun-Ven: 9h-18h, Sam: 10h-17h' },
      { departement: 'Ventes', numero: '+596 696 12 34 57', horaires: 'Lun-Ven: 9h-18h, Sam: 10h-17h' },
      { departement: 'Support Technique', numero: '+596 696 12 34 58', horaires: 'Lun-Ven: 9h-18h' },
      { departement: 'Service Après-Vente', numero: '+596 696 12 34 59', horaires: 'Lun-Ven: 9h-17h' }
    ],
    whatsapp: [
      { departement: 'Service Client', numero: '+596 696 12 34 56', disponible: 'Lun-Dim: 9h-20h' },
      { departement: 'Ventes', numero: '+596 696 12 34 57', disponible: 'Lun-Sam: 9h-19h' }
    ],
    emails: [
      { departement: 'Service Client', email: 'client.martinique@ilovemobile.fr' },
      { departement: 'Ventes', email: 'ventes.martinique@ilovemobile.fr' },
      { departement: 'Support Technique', email: 'support.martinique@ilovemobile.fr' },
      { departement: 'Service Après-Vente', email: 'sav.martinique@ilovemobile.fr' },
      { departement: 'Direction', email: 'direction.martinique@ilovemobile.fr' }
    ]
  },
  Guadeloupe: {
    adresse: {
      principale: '456 Boulevard des Héros',
      complement: '97100 Basse-Terre',
      pays: 'Guadeloupe'
    },
    telephones: [
      { departement: 'Service Client', numero: '+590 590 12 34 56', horaires: 'Lun-Ven: 9h-18h, Sam: 10h-17h' },
      { departement: 'Ventes', numero: '+590 590 12 34 57', horaires: 'Lun-Ven: 9h-18h, Sam: 10h-17h' },
      { departement: 'Support Technique', numero: '+590 590 12 34 58', horaires: 'Lun-Ven: 9h-18h' },
      { departement: 'Service Après-Vente', numero: '+590 590 12 34 59', horaires: 'Lun-Ven: 9h-17h' }
    ],
    whatsapp: [
      { departement: 'Service Client', numero: '+590 590 12 34 56', disponible: 'Lun-Dim: 9h-20h' },
      { departement: 'Ventes', numero: '+590 590 12 34 57', disponible: 'Lun-Sam: 9h-19h' }
    ],
    emails: [
      { departement: 'Service Client', email: 'client.guadeloupe@ilovemobile.fr' },
      { departement: 'Ventes', email: 'ventes.guadeloupe@ilovemobile.fr' },
      { departement: 'Support Technique', email: 'support.guadeloupe@ilovemobile.fr' },
      { departement: 'Service Après-Vente', email: 'sav.guadeloupe@ilovemobile.fr' },
      { departement: 'Direction', email: 'direction.guadeloupe@ilovemobile.fr' }
    ]
  },
  Guyane: {
    adresse: {
      principale: '789 Avenue Général de Gaulle',
      complement: '97300 Cayenne',
      pays: 'Guyane'
    },
    telephones: [
      { departement: 'Service Client', numero: '+594 594 12 34 56', horaires: 'Lun-Ven: 9h-18h, Sam: 10h-17h' },
      { departement: 'Ventes', numero: '+594 594 12 34 57', horaires: 'Lun-Ven: 9h-18h, Sam: 10h-17h' },
      { departement: 'Support Technique', numero: '+594 594 12 34 58', horaires: 'Lun-Ven: 9h-18h' },
      { departement: 'Service Après-Vente', numero: '+594 594 12 34 59', horaires: 'Lun-Ven: 9h-17h' }
    ],
    whatsapp: [
      { departement: 'Service Client', numero: '+594 594 12 34 56', disponible: 'Lun-Dim: 9h-20h' },
      { departement: 'Ventes', numero: '+594 594 12 34 57', disponible: 'Lun-Sam: 9h-19h' }
    ],
    emails: [
      { departement: 'Service Client', email: 'client.guyane@ilovemobile.fr' },
      { departement: 'Ventes', email: 'ventes.guyane@ilovemobile.fr' },
      { departement: 'Support Technique', email: 'support.guyane@ilovemobile.fr' },
      { departement: 'Service Après-Vente', email: 'sav.guyane@ilovemobile.fr' },
      { departement: 'Direction', email: 'direction.guyane@ilovemobile.fr' }
    ]
  }
};

export default function ContactPage() {
  const params = useParams();
  const router = useRouter();
  const { selectedLocation, isInitialized } = useLocation();
  const locality = params?.locality as string;
  
  // Normaliser le nom de la localité pour correspondre aux clés
  const normalizedLocality = locality 
    ? locality.charAt(0).toUpperCase() + locality.slice(1).toLowerCase()
    : 'Martinique';
  
  // Vérifier si la localité existe dans les données de contact
  const isValidLocality = normalizedLocality in contactData;
  
  // Rediriger si la localité n'existe pas
  useEffect(() => {
    if (!isInitialized) return;
    
    if (!isValidLocality) {
      // Utiliser la localité choisie par l'utilisateur ou la localité par défaut
      const targetLocality = selectedLocation?.name || DEFAULT_LOCATION.name;
      router.replace(`/${targetLocality}/contact`);
    }
  }, [isValidLocality, isInitialized, selectedLocation, router]);
  
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
  
  const contacts = contactData[normalizedLocality as keyof typeof contactData] || contactData.Martinique;

  const handleWhatsAppClick = (numero: string) => {
    // Nettoyer le numéro pour WhatsApp (enlever les espaces et +)
    const cleanNumber = numero.replace(/\s+/g, '').replace(/\+/g, '');
    window.open(`https://wa.me/${cleanNumber}`, '_blank');
  };

  const handlePhoneClick = (numero: string) => {
    window.location.href = `tel:${numero.replace(/\s+/g, '')}`;
  };

  const handleEmailClick = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Contactez-nous
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Notre équipe est à votre disposition pour répondre à toutes vos questions. 
            Choisissez le département qui vous convient le mieux.
          </p>
        </div>

        {/* Adresse principale */}
        <div className="bg-white rounded-2xl p-6 shadow-md mb-8 border border-gray-100">
          <div className="flex items-start gap-4">
            <div className="bg-[#800080]/10 p-3 rounded-lg">
              <MapPin className="text-[#800080]" size={24} />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Building2 size={20} className="text-[#800080]" />
                Adresse principale - {normalizedLocality}
              </h2>
              <p className="text-gray-700 text-lg font-medium mb-1">
                {contacts.adresse.principale}
              </p>
              <p className="text-gray-600">
                {contacts.adresse.complement}
              </p>
              <p className="text-gray-600">
                {contacts.adresse.pays}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Téléphones */}
          <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-[#800080]/10 p-3 rounded-lg">
                <Phone className="text-[#800080]" size={24} />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900">Téléphones</h2>
            </div>
            <div className="space-y-4">
              {contacts.telephones.map((tel, index) => (
                <div 
                  key={index}
                  className="p-4 border border-gray-200 rounded-lg hover:border-[#800080] transition-colors cursor-pointer"
                  onClick={() => handlePhoneClick(tel.numero)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 mb-1">{tel.departement}</p>
                      <p className="text-[#800080] font-medium text-lg mb-2">{tel.numero}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock size={14} />
                        <span>{tel.horaires}</span>
                      </div>
                    </div>
                    <Phone size={20} className="text-[#800080] flex-shrink-0 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* WhatsApp */}
          <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-[#800080]/10 p-3 rounded-lg">
                <MessageCircle className="text-[#800080]" size={24} />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900">WhatsApp</h2>
            </div>
            <div className="space-y-4">
              {contacts.whatsapp.map((wa, index) => (
                <div 
                  key={index}
                  className="p-4 border border-gray-200 rounded-lg hover:border-[#800080] transition-colors cursor-pointer"
                  onClick={() => handleWhatsAppClick(wa.numero)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 mb-1">{wa.departement}</p>
                      <p className="text-[#800080] font-medium text-lg mb-2">{wa.numero}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock size={14} />
                        <span>{wa.disponible}</span>
                      </div>
                    </div>
                    <MessageCircle size={20} className="text-[#800080] flex-shrink-0 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Emails */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-[#800080]/10 p-3 rounded-lg">
              <Mail className="text-[#800080]" size={24} />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">Emails</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contacts.emails.map((email, index) => (
              <div 
                key={index}
                className="p-4 border border-gray-200 rounded-lg hover:border-[#800080] transition-colors cursor-pointer"
                onClick={() => handleEmailClick(email.email)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 mb-1">{email.departement}</p>
                    <p className="text-[#800080] font-medium">{email.email}</p>
                  </div>
                  <Mail size={20} className="text-[#800080] flex-shrink-0 mt-1" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Informations supplémentaires */}
        <div className="mt-8 bg-gradient-to-r from-[#800080]/10 to-[#600060]/10 rounded-2xl p-6 border border-[#800080]/20">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Besoin d&apos;aide supplémentaire ?
          </h3>
          <p className="text-gray-700 mb-4">
            Notre équipe est disponible pour vous accompagner dans vos achats et répondre à toutes vos questions. 
            N&apos;hésitez pas à nous contacter via le canal de votre choix.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link 
              href={`/${locality}/boutiques`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#800080] text-white rounded-lg hover:bg-[#600060] transition-colors"
            >
              <MapPin size={16} />
              Voir nos boutiques
            </Link>
            <Link 
              href={`/${locality}`}
              className="inline-flex items-center gap-2 px-4 py-2 border border-[#800080] text-[#800080] rounded-lg hover:bg-[#800080]/10 transition-colors"
            >
              Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

