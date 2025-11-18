'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Menu, ChevronDown, ChevronUp, User, LogOut, ChevronRight, Settings } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useLocation } from '../contexts/LocationContext';
import { CartIcon } from './cart/CartComponents';
import { ComparatorButton } from './ComparatorButton';
import { useCurrentUser, useActiveRoles } from '@/ts/hooks/use-current-user';
import { logOut } from '@/lib/logout';

export const Navbar = () => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileActiveSubmenu, setMobileActiveSubmenu] = useState<string | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<Array<{
    id: string;
    designation: string;
    brand: string;
    category: string;
    colors?: Array<{ images?: Array<{ url: string }> }>;
    variants?: Array<{ pvTTC: number | string }>;
  }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { selectedLocation } = useLocation();
  const router = useRouter();
  const user = useCurrentUser();
  const activeRoles = useActiveRoles();
  
  // Vérifier si l'utilisateur a un rôle admin (différent de USER)
  const hasAdminRole = activeRoles.some(role => role !== 'USER');

  const menuData = {
    telephones: {
      title: 'Téléphones',
      categories: [
        {
          name: 'iPhone',
          image: '/assets/images/iphone 17.jpg',
          link: `/${selectedLocation?.name}/Apple/Téléphones`
        },
        {
          name: 'Samsung',
          image: '/assets/images/samsung-galaxy-s24-ultra.png',
          link: `/${selectedLocation?.name}/Samsung/Téléphones`
        },
      ]
    },
    charge: {
      title: 'Accessoires de charge',
      categories: [
        {
          name: 'Power Banks',
          image: '/assets/images/powerbank2.jpg',
          link: `/${selectedLocation?.name}/Accessoires-de-charge/Power Banks`
        },
        {
          name: 'Chargeurs sans fil',
          image: '/assets/images/chargeur_sans_fil.jpg',
          link: `/${selectedLocation?.name}/Accessoires-de-charge/Chargeurs sans fil`
        }
      ]
    },
    connectes: {
      title: 'Produits connectés',
      categories: [
        {
          name: 'Montres connectées',
          image: '/assets/images/montre.jpg',
          link: `/${selectedLocation?.name}/Produits-connectes/Montres connectées`
        },
        {
          name: 'Écouteurs sans fil',
          image: '/assets/images/ecouteurs.jpg',
          link: `/${selectedLocation?.name}/Produits-connectes/Écouteurs sans fil`
        },
        {
          name: 'Caméras connectées',
          image: '/assets/images/camera.jpg',
          link: `/${selectedLocation?.name}/Produits-connectes/Caméras connectées`
        },
      ]
    },
  };

  const handleMouseEnter = (key: string) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setActiveMenu(key);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setActiveMenu(null);
    }, 150);
  };

  const toggleMobileSubmenu = (key: string) => {
    setMobileActiveSubmenu(mobileActiveSubmenu === key ? null : key);
  };

  // Fonction pour rechercher des suggestions
  const fetchSearchSuggestions = async (query: string) => {
    if (!query || query.length < 2 || !selectedLocation) {
      setSearchSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/produits/${selectedLocation.name}/search?q=${encodeURIComponent(query)}&limit=5`);
      if (response.ok) {
        const data = await response.json();
        setSearchSuggestions(data.productModel || []);
      } else {
        setSearchSuggestions([]);
      }
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      setSearchSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounce pour les suggestions
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!selectedLocation) return;

    searchTimeoutRef.current = setTimeout(() => {
      fetchSearchSuggestions(searchQuery);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedLocation]);

  // Focus sur l'input quand le popup s'ouvre
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  // Gérer la touche Escape pour fermer le popup
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && searchOpen) {
        handleCloseSearch();
      }
    };

    if (searchOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [searchOpen]);

  // Fonction pour gérer la soumission de la recherche
  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (!searchQuery.trim() || !selectedLocation) return;
    
    // Rediriger vers la page store avec le terme de recherche
    router.push(`/${selectedLocation.name}/boutique?q=${encodeURIComponent(searchQuery.trim())}`);
    setSearchOpen(false);
    setSearchQuery('');
    setSearchSuggestions([]);
  };

  // Fonction pour fermer le popup
  const handleCloseSearch = () => {
    setSearchOpen(false);
    setSearchQuery('');
    setSearchSuggestions([]);
  };

  // Fermer le menu utilisateur quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  // Fonction de déconnexion
  const handleLogout = async () => {
    await logOut();
    setUserMenuOpen(false);
    router.push('/');
  };

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="block">
                <Image
                  src="/assets/logo_ilm.png" 
                  alt="I Love Mobile"
                  width={180}
                  height={60}
                  className="h-14 w-auto hover:opacity-90 transition-opacity duration-200 cursor-pointer"
                  priority
                />
              </Link>
            </div>
            
            {/* Desktop Navigation Items */}
            <div className="hidden lg:flex items-center space-x-1">
              {/* Lien Boutique */}
              <Link
                href={`/${selectedLocation?.name}/boutique`}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-[#800080] hover:bg-[#f3e8ff] rounded-lg transition-all duration-200"
              >
                Boutique
              </Link>
              
              {Object.entries(menuData).map(([key, menu]) => (
                <div
                  key={key}
                  className="relative"
                  onMouseEnter={() => handleMouseEnter(key)}
                  onMouseLeave={handleMouseLeave}
                >
                  <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-[#800080] hover:bg-[#f3e8ff] rounded-lg transition-all duration-200">
                    {menu.title}
                  </button>
                  
                  {activeMenu === key && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2">
                      <div className="w-[600px] bg-white rounded-2xl shadow-2xl border border-gray-100 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">{menu.title}</h3>
                        <div className="grid grid-cols-3 gap-4">
                          {menu.categories.map((cat, idx) => (
                            <Link
                              key={idx}
                              href={cat.link}
                              className="group flex flex-col items-center p-3 rounded-xl hover:bg-[#f3e8ff] transition-all duration-200"
                            >
                              <div className="w-24 h-24 mb-2 rounded-lg overflow-hidden shadow-md group-hover:shadow-lg transition-shadow duration-200">
                                <Image 
                                  src={cat.image} 
                                  alt={cat.name}
                                  width={96}
                                  height={96}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                              </div>
                              <span className="text-sm font-medium text-gray-700 group-hover:text-[#800080] text-center">
                                {cat.name}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Right Icons */}
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setSearchOpen(true)}
                className="p-2 text-gray-700 hover:text-[#800080] hover:bg-[#f3e8ff] rounded-lg transition-all duration-200"
              >
                <Search size={20} />
              </button>
              <ComparatorButton />
              <CartIcon />
              
              {/* User Menu */}
              <div className="relative" ref={userMenuRef}>
                {user ? (
                  <>
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="p-2 text-gray-700 hover:text-[#800080] hover:bg-[#f3e8ff] rounded-lg transition-all duration-200 flex items-center gap-2"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#800080] flex items-center justify-center text-white font-semibold text-sm">
                        {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    </button>
                    
                    {/* Dropdown Menu */}
                    {userMenuOpen && (
                      <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                        <div className="p-4 border-b border-gray-100">
                          <div className="font-semibold text-gray-900 truncate">
                            {user.name || 'Utilisateur'}
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            {user.email}
                          </div>
                        </div>
                        <div className="py-2">
                          <Link
                            href="/profile"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-[#f3e8ff] transition-colors"
                          >
                            <User size={18} />
                            <span>Mon profil</span>
                            <ChevronRight size={16} className="ml-auto text-gray-400" />
                          </Link>
                          {hasAdminRole && (
                            <Link
                              href="/view_admin/ilm2"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-[#f3e8ff] transition-colors"
                            >
                              <Settings size={18} />
                              <span>Administration</span>
                              <ChevronRight size={16} className="ml-auto text-gray-400" />
                            </Link>
                          )}
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <LogOut size={18} />
                            <span>Déconnexion</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href="/signIn"
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-[#800080] hover:bg-[#f3e8ff] rounded-lg transition-all duration-200 flex items-center gap-2"
                  >
                    <User size={18} />
                    <span className="hidden sm:inline">Connexion</span>
                  </Link>
                )}
              </div>
              
              {/* Mobile Menu Button */}
              <button 
                className="lg:hidden p-2 text-gray-700 hover:text-[#800080] hover:bg-[#f3e8ff] rounded-lg transition-all duration-200"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          ></div>
          
          <div className="fixed top-16 left-0 right-0 bottom-0 bg-white overflow-y-auto">
            <div className="px-4 py-6 space-y-2">
              {/* Lien Boutique Mobile */}
              <Link
                href={`/${selectedLocation?.name}/boutique`}
                className="flex items-center px-4 py-3 text-gray-700 hover:bg-[#f3e8ff] rounded-lg transition-all duration-200 font-medium border-b border-gray-100 mb-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Boutique
              </Link>
              
              {/* User Menu Mobile */}
              {user ? (
                <>
                  <div className="border-b border-gray-100 pb-2 mb-2">
                    <div className="px-4 py-3">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-[#800080] flex items-center justify-center text-white font-semibold">
                          {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 truncate">
                            {user.name || 'Utilisateur'}
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            {user.email}
                          </div>
                        </div>
                      </div>
                      <Link
                        href="/profile"
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-[#f3e8ff] rounded-lg transition-all duration-200"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <User size={18} />
                        <span>Mon profil</span>
                      </Link>
                      {hasAdminRole && (
                        <Link
                          href="/view_admin/ilm2"
                          className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-[#f3e8ff] rounded-lg transition-all duration-200"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Settings size={18} />
                          <span>Administration</span>
                        </Link>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                  >
                    <LogOut size={18} />
                    <span>Déconnexion</span>
                  </button>
                </>
              ) : (
                <Link
                  href="/signIn"
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-[#f3e8ff] rounded-lg transition-all duration-200 font-medium border-b border-gray-100 mb-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User size={18} />
                  <span>Connexion</span>
                </Link>
              )}
              
              {Object.entries(menuData).map(([key, menu]) => (
                <div key={key} className="border-b border-gray-100 pb-2">
                  <button
                    onClick={() => toggleMobileSubmenu(key)}
                    className="w-full flex items-center justify-between px-4 py-3 text-gray-700 hover:bg-[#f3e8ff] rounded-lg transition-all duration-200"
                  >
                    <span className="font-medium">{menu.title}</span>
                    {mobileActiveSubmenu === key ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                  
                  {mobileActiveSubmenu === key && (
                    <div className="mt-2 pl-4 space-y-2">
                      {menu.categories.map((cat, idx) => (
                        <Link
                          key={idx}
                          href={cat.link}
                          className="flex items-center space-x-3 px-4 py-2 hover:bg-[#f3e8ff] rounded-lg transition-all duration-200"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Image 
                            src={cat.image} 
                            alt={cat.name}
                            width={48}
                            height={48}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                          <span className="text-sm text-gray-700">{cat.name}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search Popup */}
      {searchOpen && (
        <div className="fixed inset-0 z-[60]">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleCloseSearch}
          />
          
          <div className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl mx-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
              {/* Search Input */}
              <form onSubmit={handleSearchSubmit} className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <Search size={20} className="text-gray-400 flex-shrink-0" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher un produit, une marque, une catégorie..."
                    className="flex-1 outline-none text-gray-900 placeholder-gray-400"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSearchSuggestions([]);
                      }}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <X size={18} className="text-gray-400" />
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={!searchQuery.trim()}
                    className="px-6 py-2 bg-[#800080] text-white rounded-lg font-medium hover:bg-[#6b006b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Rechercher
                  </button>
                </div>
              </form>

              {/* Suggestions */}
              {searchQuery.length >= 2 && (
                <div className="max-h-96 overflow-y-auto">
                  {isSearching ? (
                    <div className="p-8 text-center text-gray-500">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#800080] mx-auto"></div>
                      <p className="mt-2">Recherche en cours...</p>
                    </div>
                  ) : searchSuggestions.length > 0 ? (
                    <div className="p-2">
                      <div className="text-xs text-gray-500 px-3 py-2 font-medium">
                        Suggestions ({searchSuggestions.length})
                      </div>
                      {searchSuggestions.map((product) => {
                        const firstImage = product.colors?.[0]?.images?.[0]?.url || '/placeholder.jpg';
                        const price = product.variants?.[0]?.pvTTC 
                          ? parseFloat(product.variants[0].pvTTC.toString()) 
                          : 0;
                        
                        return (
                          <button
                            key={product.id}
                            onClick={() => {
                              router.push(`/${selectedLocation?.name}/${product.brand}/${product.category}/${product.id}`);
                              handleCloseSearch();
                            }}
                            className="w-full flex items-center gap-3 p-3 hover:bg-[#f3e8ff] rounded-lg transition-colors text-left"
                          >
                            <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                              <Image
                                src={firstImage}
                                alt={product.designation}
                                width={64}
                                height={64}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate">
                                {product.designation}
                              </div>
                              <div className="text-sm text-gray-600">
                                {product.brand} • {product.category}
                              </div>
                              {price > 0 && (
                                <div className="text-sm font-semibold text-[#800080] mt-1">
                                  {price.toFixed(2)}€
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      <p>Aucun résultat trouvé pour &quot;{searchQuery}&quot;</p>
                    </div>
                  )}
                </div>
              )}

              {/* Footer avec raccourci clavier */}
              {searchQuery.length < 2 && (
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Tapez au moins 2 caractères pour voir les suggestions</span>
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <kbd className="px-2 py-1 bg-white border border-gray-300 rounded">Entrée</kbd>
                        <span>pour rechercher</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <kbd className="px-2 py-1 bg-white border border-gray-300 rounded">Esc</kbd>
                        <span>pour fermer</span>
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

