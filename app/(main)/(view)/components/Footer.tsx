import React from 'react';
import { useLocation } from '../contexts/LocationContext';
import { Mail, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';


export const Footer = () => {
  const { selectedLocation } = useLocation();
  return (
    <footer className="bg-black text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl" style={{ color: '#800080' }}>❤</span>
              <h3 className="text-white font-semibold text-lg">I Love Mobile</h3>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Votre destination premium pour les smartphones et accessoires des plus grandes marques.
            </p>
            <div className="space-y-2 pt-4">
              <div className="flex items-center gap-2 text-sm">
                <Phone size={16} className="text-[#800080]" />
                <span>+33 1 23 45 67 89</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail size={16} className="text-[#800080]" />
                <span>contact@ilovemobile.fr</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin size={16} className="text-[#800080]" />
                <span>{selectedLocation?.name}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Produits</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-white transition-colors pointer-events-none">Téléphones</Link></li>
              <li><a href="#" className="hover:text-white transition-colors pointer-events-none">Tablettes</a></li>
              <li><a href="#" className="hover:text-white transition-colors pointer-events-none">Ordinateurs</a></li>
              <li><a href="#" className="hover:text-white transition-colors pointer-events-none">Protections</a></li>
              <li><a href="#" className="hover:text-white transition-colors pointer-events-none">Accessoires de charge</a></li>
              <li><a href="#" className="hover:text-white transition-colors pointer-events-none">Supports</a></li>
              <li><a href="#" className="hover:text-white transition-colors pointer-events-none">Produits connectés</a></li>
              <li><a href="#" className="hover:text-white transition-colors pointer-events-none">Autres accessoires</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Aide & Support</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Assistance</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Politique de retour</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Livraison</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Garantie</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">À propos</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Notre histoire</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Nos engagements</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Carrières</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Légal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Mentions légales</a></li>
              <li><a href={`/${selectedLocation?.name}/cgu`} className="hover:text-white transition-colors">CGU</a></li>
              <li><a href={`/${selectedLocation?.name}/cgv`} className="hover:text-white transition-colors">CGV</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Confidentialité</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Cookies</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                {/* <span className="text-xl">❤️</span> */}
                <span className="text-xl" style={{ color: '#800080' }}>❤</span>
                <span className="text-white font-semibold">I Love Mobile</span>
              </div>
              <span className="text-sm text-gray-400">© 2025 I Love Mobile. Votre passion mobile, notre expertise.</span>
            </div>
            
            <div className="flex flex-col md:flex-row items-center gap-3">
              <span className="text-sm text-gray-400 whitespace-nowrap">Paiement sécurisé</span>
              <div className="flex items-center gap-2 flex-wrap">
                  {/* Cartes Bancaires Classiques */}
                  <div className="bg-white rounded px-3 py-1.5 text-xs font-bold text-blue-600 border border-gray-100">VISA</div>
                  <div className="bg-white rounded px-3 py-1.5 text-xs font-bold text-red-600 border border-gray-100">Mastercard</div>
                  
                  {/* American Express et Discover */}
                  <div className="bg-white rounded px-3 py-1.5 text-xs font-bold text-blue-700 border border-gray-100">AMEX</div>
                  {/* Ajout de Discover (Couleur Orange/Jaune pour la marque) */}
                  <div className="bg-white rounded px-3 py-1.5 text-xs font-bold text-orange-500 border border-gray-100">Discover</div> 

                  {/* Portefeuilles Électroniques / PSP */}
                  {/* <div className="bg-white rounded px-3 py-1.5 text-xs font-bold text-blue-500 border border-gray-100">PayPal</div> */}
                  <div className="bg-white rounded px-3 py-1.5 text-xs font-bold text-purple-600 border border-gray-100">Stripe</div>
                  
                  {/* Paiement Fractionné BNPL (Alma) */}
                  {/* Ajout d'Alma (Couleur Verte ou Violette pour la marque) */}
                  <div className="bg-white rounded px-3 py-1.5 text-xs font-bold text-green-600 border border-gray-100">Alma</div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </footer>
  );
};
