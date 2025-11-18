import React from 'react';
import { CheckCircle, X } from 'lucide-react';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
}

// Modal de Succès
export const SuccessModal: React.FC<NotificationModalProps> = ({ isOpen, onClose, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl transform transition-all">
        {/* Header avec animation */}
        <div className="p-6 text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-bounce">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Succès !
          </h3>
          
          <p className="text-gray-600 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Bouton de fermeture */}
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full py-3 px-6 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all shadow-lg shadow-green-500/30"
          >
            Fermer
          </button>
        </div>

        {/* Bouton X en haut à droite */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X size={20} className="text-gray-500" />
        </button>
      </div>
    </div>
  );
};

