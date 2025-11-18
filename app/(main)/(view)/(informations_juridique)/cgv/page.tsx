'use client';

import React, { useState } from 'react';
import { ChevronLeft, FileText, Scale, ShieldCheck, Package, CreditCard, RefreshCcw, AlertCircle, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocation } from '../../contexts/LocationContext';
import { getCompanyByLocation } from '@/lib/companyConfig';

export default function CGVPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const { selectedLocation } = useLocation();

  const sections = [
    { id: 'article1', title: 'Article 1 - Identité du Vendeur et Contact', icon: FileText },
    { id: 'article2', title: 'Article 2 - Objet et Application des CGV', icon: Scale },
    { id: 'article3', title: 'Article 3 - Prix et Produits', icon: CreditCard },
    { id: 'article4', title: 'Article 4 - Commande et Conclusion du Contrat', icon: ShieldCheck },
    { id: 'article5', title: 'Article 5 - Paiement', icon: CreditCard },
    { id: 'article6', title: 'Article 6 - Livraison', icon: Package },
    { id: 'article7', title: 'Article 7 - Droit de Rétractation', icon: RefreshCcw },
    { id: 'article8', title: 'Article 8 - Garanties Légales et Commerciale', icon: ShieldCheck },
    { id: 'article9', title: 'Article 9 - Données Personnelles et Litiges', icon: AlertCircle }
  ];

  const toggleSection = (id: string) => {
    setActiveSection(activeSection === id ? null : id);
  };

  // Obtenir les informations de l&apos;entreprise selon la location
  const companyInfo = getCompanyByLocation(selectedLocation?.name);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-[#800080] transition-colors"
            >
              <ChevronLeft size={20} />
              <span>Retour</span>
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Conditions Générales de Vente
            </h1>
            <div className="w-20" />
          </div>
          <div className="mt-3 text-center">
            <p className="text-sm text-gray-600">{companyInfo.name} - Applicables en {selectedLocation?.name || ''}</p>
            <p className="text-xs text-gray-500 mt-1">Dernière mise à jour : Novembre 2025</p>
          </div>
        </div>
      </header>

      {/* Contenu */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Préambule */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-l-4 border-[#800080] rounded-lg p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <Scale className="text-[#800080] flex-shrink-0 mt-1" size={24} />
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Information importante</h2>
              <p className="text-sm text-gray-700 leading-relaxed">
                Les présentes Conditions Générales de Vente (CGV) régissent toute commande passée sur le site 
                <span className="font-semibold"> www.ilovemobile.com</span> pour une livraison en 
                <span className="font-semibold text-[#800080]"> {selectedLocation?.name}</span>. 
                Toute commande implique l&apos;acceptation sans réserve de ces conditions.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation rapide */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText size={20} className="text-[#800080]" />
            Navigation rapide
          </h3>
          <div className="grid sm:grid-cols-2 gap-2">
            {sections.map(section => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="text-sm text-[#800080] hover:underline flex items-center gap-2 p-2 rounded hover:bg-purple-50 transition-colors"
              >
                <section.icon size={16} />
                {section.title}
              </a>
            ))}
          </div>
        </div>

        {/* Article 1 */}
        <div id="article1" className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button
            onClick={() => toggleSection('article1')}
            className="w-full p-6 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="text-[#800080]" size={24} />
                <h2 className="text-xl font-bold text-gray-900">
                  Article 1 - Identité du Vendeur et Contact
                </h2>
              </div>
              <ChevronLeft 
                className={`transform transition-transform ${activeSection === 'article1' ? 'rotate-[-90deg]' : ''}`} 
                size={20} 
              />
            </div>
          </button>
          {activeSection === 'article1' && (
            <div className="px-6 pb-6 space-y-4 text-gray-700">
              <p className="leading-relaxed">Le présent contrat de vente est conclu entre :</p>
              
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <h3 className="font-bold text-gray-900 mb-2">Le Vendeur :</h3>
                <ul className="space-y-1 text-sm">
                  <li>• Société : <span className="font-semibold">{companyInfo.name} (SARL)</span></li>
                  <li>• SIREN : <span className="font-semibold">{companyInfo.siren}</span></li>
                  <li>• TVA intracommunautaire : <span className="font-semibold">{companyInfo.tva}</span></li>
                  <li>• Siège social : <span className="font-semibold">{companyInfo.address}, {selectedLocation?.name}</span></li>
                  <li>• Contact : <span className="font-semibold">{companyInfo.phone} et {companyInfo.email}</span></li>
                </ul>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="font-bold text-gray-900 mb-2">L&apos;Acheteur :</h3>
                <p className="text-sm">
                  Tout Utilisateur passant commande de Produits sur la Plateforme www.ilovemobile.com 
                  pour une livraison en <span className="font-semibold">{selectedLocation?.name}</span>.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Article 2 */}
        <div id="article2" className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button
            onClick={() => toggleSection('article2')}
            className="w-full p-6 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Scale className="text-[#800080]" size={24} />
                <h2 className="text-xl font-bold text-gray-900">
                  Article 2 - Objet et Application des CGV
                </h2>
              </div>
              <ChevronLeft 
                className={`transform transition-transform ${activeSection === 'article2' ? 'rotate-[-90deg]' : ''}`} 
                size={20} 
              />
            </div>
          </button>
          {activeSection === 'article2' && (
            <div className="px-6 pb-6 space-y-3 text-gray-700">
              <p className="leading-relaxed">
                Les présentes CGV régissent <span className="font-semibold">exclusivement</span> la vente des Produits 
                (téléphones, accessoires, smartwatches, powerbanks, etc.), qu&apos;ils soient neufs ou reconditionnés, 
                sur le site www.ilovemobile.com pour l&apos;entité {companyInfo.name}.
              </p>
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                <p className="text-sm font-semibold text-yellow-900">
                  ⚠️ Toute commande implique l&apos;adhésion sans réserve de l&apos;Acheteur aux présentes CGV.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Article 3 */}
        <div id="article3" className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button
            onClick={() => toggleSection('article3')}
            className="w-full p-6 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="text-[#800080]" size={24} />
                <h2 className="text-xl font-bold text-gray-900">
                  Article 3 - Prix et Produits
                </h2>
              </div>
              <ChevronLeft 
                className={`transform transition-transform ${activeSection === 'article3' ? 'rotate-[-90deg]' : ''}`} 
                size={20} 
              />
            </div>
          </button>
          {activeSection === 'article3' && (
            <div className="px-6 pb-6 space-y-4 text-gray-700">
              <div>
                <h3 className="font-bold text-gray-900 mb-2">3.1. Prix</h3>
                <p className="leading-relaxed">
                  Les prix des Produits sont indiqués en <span className="font-semibold">Euros toutes taxes comprises (TTC)</span>, 
                  tenant compte du taux de TVA en vigueur en {selectedLocation?.name} (<span className="font-semibold">{companyInfo.tvaRate}%</span>) 
                  au jour de la commande.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-3">3.2. Types de Produits</h3>
                
                <div className="space-y-3">
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                      <Package size={18} />
                      Produits Neufs
                    </h4>
                    <p className="text-sm text-green-800">
                      Produits jamais utilisés, vendus dans leur emballage d&apos;origine.
                    </p>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                      <RefreshCcw size={18} />
                      Produits Reconditionnés
                    </h4>
                    <p className="text-sm text-blue-800">
                      Produits d&apos;occasion ayant fait l&apos;objet d&apos;un processus de remise en état par des professionnels 
                      afin d&apos;être pleinement fonctionnels. Leur état esthétique (grade) est clairement précisé sur la Fiche Produit.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Article 4 */}
        <div id="article4" className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button
            onClick={() => toggleSection('article4')}
            className="w-full p-6 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldCheck className="text-[#800080]" size={24} />
                <h2 className="text-xl font-bold text-gray-900">
                  Article 4 - Commande et Conclusion du Contrat
                </h2>
              </div>
              <ChevronLeft 
                className={`transform transition-transform ${activeSection === 'article4' ? 'rotate-[-90deg]' : ''}`} 
                size={20} 
              />
            </div>
          </button>
          {activeSection === 'article4' && (
            <div className="px-6 pb-6 space-y-4 text-gray-700">
              <div>
                <h3 className="font-bold text-gray-900 mb-3">4.1. Processus (Règle du &quot;Double Clic&quot;)</h3>
                <p className="mb-3 leading-relaxed">
                  Le processus de commande est conforme à la législation française :
                </p>
                
                <div className="space-y-2">
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="font-bold text-[#800080] flex-shrink-0">1.</span>
                    <div>
                      <span className="font-semibold">Validation du panier et des informations</span>
                      <p className="text-sm mt-1">L&apos;Acheteur vérifie et confirme le détail de sa commande.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="font-bold text-[#800080] flex-shrink-0">2.</span>
                    <div>
                      <span className="font-semibold">Acceptation des conditions</span>
                      <p className="text-sm mt-1">L&apos;Acheteur prend connaissance et accepte les présentes CGV et les CGU.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="font-bold text-[#800080] flex-shrink-0">3.</span>
                    <div>
                      <span className="font-semibold">Paiement</span>
                      <p className="text-sm mt-1">L&apos;Acheteur procède au paiement sécurisé.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border-2 border-[#800080]">
                    <span className="font-bold text-[#800080] flex-shrink-0">4.</span>
                    <div>
                      <span className="font-semibold text-[#800080]">Confirmation finale (Double Clic)</span>
                      <p className="text-sm mt-1">
                        Le fait de cliquer sur le bouton de confirmation finale (le bouton payer) constitue une 
                        <span className="font-semibold"> acceptation irrévocable</span> du contrat de vente.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
                <h3 className="font-bold text-orange-900 mb-2">4.2. Indisponibilité</h3>
                <p className="text-sm text-orange-800">
                  En cas d&apos;indisponibilité d&apos;un Produit après passation de la commande, l&apos;Acheteur sera informé 
                  et remboursé sans délai (maximum 14 jours suivant le paiement).
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Article 5 */}
        <div id="article5" className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button
            onClick={() => toggleSection('article5')}
            className="w-full p-6 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="text-[#800080]" size={24} />
                <h2 className="text-xl font-bold text-gray-900">
                  Article 5 - Paiement
                </h2>
              </div>
              <ChevronLeft 
                className={`transform transition-transform ${activeSection === 'article5' ? 'rotate-[-90deg]' : ''}`} 
                size={20} 
              />
            </div>
          </button>
          {activeSection === 'article5' && (
            <div className="px-6 pb-6 space-y-3 text-gray-700">
              <p className="leading-relaxed">
                Le paiement est <span className="font-semibold">exigible immédiatement</span> à la commande.
              </p>
              <p className="leading-relaxed">
                Les moyens de paiement acceptés sont ceux proposés sur la Plateforme (carte bancaire).
              </p>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-blue-900">
                  En cas d&apos;utilisation d&apos;une facilité de paiement (paiement fractionné) proposée par un partenaire financier, 
                  les conditions contractuelles spécifiques du partenaire s&apos;appliquent.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Article 6 */}
        <div id="article6" className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button
            onClick={() => toggleSection('article6')}
            className="w-full p-6 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Package className="text-[#800080]" size={24} />
                <h2 className="text-xl font-bold text-gray-900">
                  Article 6 - Livraison
                </h2>
              </div>
              <ChevronLeft 
                className={`transform transition-transform ${activeSection === 'article6' ? 'rotate-[-90deg]' : ''}`} 
                size={20} 
              />
            </div>
          </button>
          {activeSection === 'article6' && (
            <div className="px-6 pb-6 space-y-4 text-gray-700">
              <div className="bg-purple-50 rounded-lg p-4 border-2 border-[#800080]">
                <h3 className="font-bold text-[#800080] mb-2 flex items-center gap-2">
                  <Package size={18} />
                  6.1. Zone de Livraison
                </h3>
                <p className="text-sm text-gray-800">
                  La livraison des Produits est <span className="font-semibold">strictement limitée à la {selectedLocation?.name}</span>.
                </p>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h3 className="font-bold text-green-900 mb-2">6.2. Frais de Livraison</h3>
                <p className="text-sm text-green-800 font-semibold">
                  ✓ Les frais de livraison sont OFFERTS à l&apos;Acheteur.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-2">6.3. Délai de Livraison</h3>
                <p className="text-sm leading-relaxed">
                  Le Vendeur s&apos;engage à livrer la commande dans un délai maximum de 
                  <span className="font-semibold"> 48 heures (2 jours) ouvrés</span> à compter de la validation du paiement.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-2">6.4. Retard</h3>
                <p className="text-sm leading-relaxed">
                  En cas de manquement à l&apos;obligation de livraison dans le délai imparti, l&apos;Acheteur peut enjoindre 
                  le Vendeur d&apos;effectuer la livraison dans un délai supplémentaire raisonnable. Si le Vendeur ne 
                  s&apos;exécute pas, l&apos;Acheteur peut résoudre le contrat.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-bold text-gray-900 mb-2">6.5. Transfert des Risques</h3>
                <p className="text-sm text-gray-700">
                  Les risques de perte ou d&apos;endommagement des Produits sont transférés à l&apos;Acheteur au moment où 
                  il prend possession physiquement des Produits.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Article 7 */}
        <div id="article7" className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button
            onClick={() => toggleSection('article7')}
            className="w-full p-6 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <RefreshCcw className="text-[#800080]" size={24} />
                <h2 className="text-xl font-bold text-gray-900">
                  Article 7 - Droit de Rétractation (Légal)
                </h2>
              </div>
              <ChevronLeft 
                className={`transform transition-transform ${activeSection === 'article7' ? 'rotate-[-90deg]' : ''}`} 
                size={20} 
              />
            </div>
          </button>
          {activeSection === 'article7' && (
            <div className="px-6 pb-6 space-y-4 text-gray-700">
              <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-500">
                <h3 className="font-bold text-blue-900 mb-2">7.1. Délai</h3>
                <p className="text-sm text-blue-800 leading-relaxed">
                  Conformément à la loi, l&apos;Acheteur dispose d&apos;un délai de <span className="font-semibold">quatorze (14) jours calendaires</span> à 
                  compter de la réception du Produit pour exercer son droit de rétractation 
                  <span className="font-semibold"> sans avoir à justifier de motifs ni à payer de pénalités</span>.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-2">7.2. Exercice</h3>
                <p className="text-sm leading-relaxed">
                  Pour exercer ce droit, l&apos;Acheteur doit notifier sa décision au Vendeur ({companyInfo.name}) au moyen d&apos;une 
                  déclaration dénuée d&apos;ambiguïté par e-mail à l’adresse suivante : [insérer l’adresse e-mail du vendeur]. .
                </p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-2">7.3. Retour des Produits</h3>
                <p className="text-sm leading-relaxed mb-2">
                  L&apos;Acheteur doit retourner les Produits au Vendeur au plus tard dans les 
                  <span className="font-semibold"> quatorze (14) jours</span> suivant la communication de sa décision de se rétracter.
                </p>
                <p className="text-sm text-orange-700 font-semibold">
                  ⚠️ Les frais de retour du Produit sont à la charge de l&apos;Acheteur.
                </p>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h3 className="font-bold text-green-900 mb-2">7.4. Remboursement</h3>
                <p className="text-sm text-green-800 leading-relaxed">
                  En cas de rétractation, le Vendeur remboursera l&apos;intégralité du prix payé, au plus tard <span className="font-semibold">quatorze (14) jours</span> à compter du jour où 
                  il est informé de la décision de rétractation, sous réserve d&apos;avoir récupéré le Produit.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Article 8 */}
        <div id="article8" className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button
            onClick={() => toggleSection('article8')}
            className="w-full p-6 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldCheck className="text-[#800080]" size={24} />
                <h2 className="text-xl font-bold text-gray-900">
                  Article 8 - Garanties Légales et Commerciale
                </h2>
              </div>
              <ChevronLeft 
                className={`transform transition-transform ${activeSection === 'article8' ? 'rotate-[-90deg]' : ''}`} 
                size={20} 
              />
            </div>
          </button>
          {activeSection === 'article8' && (
            <div className="px-6 pb-6 space-y-4 text-gray-700">
              <p className="leading-relaxed font-medium">
                Le Vendeur ({companyInfo.name}) est tenu des défauts de conformité du Produit au contrat et des vices cachés 
                dans les conditions prévues par la loi (Code de la consommation et Code civil).
              </p>

              <div className="space-y-4">
                {/* GLC */}
                <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                  <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                    <ShieldCheck size={20} />
                    8.1. Garantie Légale de Conformité (GLC)
                  </h3>
                  
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-semibold text-blue-900">Délai :</span>
                      <p className="mt-1 text-blue-800">
                        La GLC couvre les défauts de conformité existant lors de la délivrance pendant 
                        <span className="font-semibold"> deux (2) ans</span>.
                      </p>
                    </div>

                    <div className="bg-white rounded p-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="text-green-600 font-bold">•</span>
                        <p className="text-blue-900">
                          <span className="font-semibold">Pour les Produits Neufs :</span> Les défauts sont présumés 
                          exister au moment de la délivrance pendant le délai de 2 ans.
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-orange-600 font-bold">•</span>
                        <p className="text-blue-900">
                          <span className="font-semibold">Pour les Produits Reconditionnés :</span> Les défauts sont 
                          présumés exister au moment de la délivrance pendant les douze (12) premiers mois.
                        </p>
                      </div>
                    </div>

                    <div>
                      <span className="font-semibold text-blue-900">Mise en œuvre :</span>
                      <p className="mt-1 text-blue-800">
                        L&apos;Acheteur peut choisir entre la réparation ou le remplacement du Produit, sous réserve des 
                        conditions de coût prévues à l&apos;article L. 217-9 du Code de la consommation.
                      </p>
                    </div>
                  </div>
                </div>

                {/* GLVC */}
                <div className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
                  <h3 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                    <Scale size={20} />
                    8.2. Garantie Légale des Vices Cachés (GLVC)
                  </h3>
                  
                  <p className="text-sm text-purple-800 leading-relaxed">
                    L&apos;Acheteur peut mettre en œuvre la garantie des vices cachés au sens de l&apos;article 1641 du Code civil 
                    s&apos;il prouve que le défaut était antérieur à la vente et rend le produit impropre à l&apos;usage. 
                    Il a le choix entre la <span className="font-semibold">résolution de la vente</span> ou une 
                    <span className="font-semibold"> réduction du prix</span>.
                  </p>
                </div>

                {/* Garantie Commerciale */}
                <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
                  <h3 className="font-bold text-green-900 mb-3 flex items-center gap-2">
                    <ShieldCheck size={20} />
                    8.3. Garantie Commerciale {companyInfo.name}
                  </h3>
                  
                  <div className="space-y-2 text-sm">
                    <p className="text-green-800 leading-relaxed">
                      En complément des garanties légales ci-dessus, le Vendeur ({companyInfo.name}) offre une 
                      <span className="font-semibold"> Garantie Commerciale de deux (2) ans</span> à compter de la date 
                      de livraison, pour tout défaut de fonctionnement du Produit non causé par une mauvaise utilisation 
                      ou un dommage externe (choc, oxydation, etc.).
                    </p>
                    {/* <div className="bg-white rounded p-3 mt-2">
                      <p className="text-xs text-green-700">
                        📄 Les modalités précises de cette garantie sont détaillées dans le document de garantie joint au Produit.
                      </p>
                    </div> */}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Article 9 */}
        <div id="article9" className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button
            onClick={() => toggleSection('article9')}
            className="w-full p-6 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="text-[#800080]" size={24} />
                <h2 className="text-xl font-bold text-gray-900">
                  Article 9 - Données Personnelles et Litiges
                </h2>
              </div>
              <ChevronLeft 
                className={`transform transition-transform ${activeSection === 'article9' ? 'rotate-[-90deg]' : ''}`} 
                size={20} 
              />
            </div>
          </button>
          {activeSection === 'article9' && (
            <div className="px-6 pb-6 space-y-4 text-gray-700">
              <div>
                <h3 className="font-bold text-gray-900 mb-2">9.1. Données Personnelles</h3>
                <p className="text-sm leading-relaxed">
                  Les informations relatives aux données personnelles sont régies par les Conditions Générales 
                  d&apos;Utilisation (CGU) et la Politique de Confidentialité de la Plateforme.
                </p>
              </div>

              <div className="bg-orange-50 border-2 border-orange-400 rounded-lg p-4">
                <h3 className="font-bold text-orange-900 mb-3 flex items-center gap-2">
                  <Scale size={20} />
                  9.2. Médiation (OBLIGATOIRE)
                </h3>
                <div className="space-y-2 text-sm text-orange-800">
                  <p className="leading-relaxed">
                    En cas de litige, après une réclamation écrite restée infructueuse auprès d&apos;{companyInfo.name} dans un délai 
                    d&apos;un an, l&apos;Acheteur peut recourir <span className="font-semibold">gratuitement</span> à un médiateur 
                    de la consommation.
                  </p>
                  <div className="bg-white rounded p-3 mt-2">
                    <p className="font-semibold text-orange-900 mb-1">Médiateur :</p>
                    <p className="text-xs text-orange-700">
                      [Nom et coordonnées du médiateur pertinent pour la {selectedLocation?.name} et l&apos;activité e-commerce à insérer, 
                      par exemple le Médiateur de la FEVAD ou autre organisme agréé.]
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-bold text-gray-900 mb-2">9.3. Juridiction Compétente</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  À défaut de résolution amiable, le litige sera porté devant les 
                  <span className="font-semibold"> tribunaux français compétents</span>.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer informatif */}
        <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl p-6 shadow-sm border-2 border-[#800080]">
          <div className="flex items-start gap-4">
            <div className="bg-white rounded-full p-3 shadow-sm">
              <FileText className="text-[#800080]" size={28} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Besoin d&apos;aide ou de clarifications ?
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed mb-3">
                Si vous avez des questions concernant ces Conditions Générales de Vente, n&apos;hésitez pas à contacter 
                notre service client {companyInfo.name}.
              </p>
              <div className="flex flex-wrap gap-3">
                <a 
                  href="mailto:contact@{companyInfo.name}.com" 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#800080] text-white rounded-lg hover:bg-[#6b006b] transition-colors text-sm font-medium"
                >
                  <Mail size={16} />
                  Nous contacter
                </a>
                <button
                  onClick={() => router.back()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white text-[#800080] border-2 border-[#800080] rounded-lg hover:bg-purple-50 transition-colors text-sm font-medium"
                >
                  <ChevronLeft size={16} />
                  Retour aux achats
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mentions légales importantes */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <AlertCircle size={18} className="text-gray-600" />
            Mentions importantes
          </h3>
          <div className="space-y-2 text-xs text-gray-600 leading-relaxed">
            <p>
              • Ces CGV sont applicables exclusivement aux commandes passées sur www.ilovemobile.com 
              pour une livraison en <span className="font-semibold text-[#800080]">{selectedLocation?.name}</span>.
            </p>
            <p>
              • Le Vendeur se réserve le droit de modifier les présentes CGV à tout moment. 
              Les CGV applicables sont celles en vigueur à la date de la commande.
            </p>
            <p>
              • En validant votre commande, vous reconnaissez avoir pris connaissance et accepté 
              l&apos;intégralité des présentes Conditions Générales de Vente.
            </p>
            <p className="font-semibold text-gray-800 mt-3">
              📍 Zone de livraison exclusive : {selectedLocation?.name} uniquement
            </p>
          </div>
        </div>

      </div>

      {/* Footer sticky */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              © 2025 {companyInfo.name} - Tous droits réservés
            </p>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-sm text-[#800080] hover:underline font-medium"
            >
              ↑ Retour en haut
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}