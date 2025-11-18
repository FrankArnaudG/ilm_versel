"use client";

import React, { useState, useEffect } from 'react';
import { 
  Star, Check, X, Loader2, Eye, AlertCircle, 
  User, Calendar, Package, MessageSquare, Image as ImageIcon
} from 'lucide-react';
import Image from 'next/image';

interface PendingReview {
  id: string;
  rating: number;
  comment: string | null;
  authorName: string;
  authorEmail: string | null;
  images: string[];
  isVerifiedPurchase: boolean;
  createdAt: string;
  product: {
    id: string;
    designation: string;
    brand: string;
    reference: string;
  };
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

const ReviewsModerationPage = () => {
  const [reviews, setReviews] = useState<PendingReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedReview, setSelectedReview] = useState<PendingReview | null>(null);
  const [moderationNote, setModerationNote] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Charger les avis en attente
  useEffect(() => {
    fetchPendingReviews();
  }, []);

  const fetchPendingReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/reviews/moderate');
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des avis');
      }

      const data = await response.json();
      setReviews(data.reviews || []);
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors du chargement des avis en attente');
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = async (reviewId: string, action: 'approve' | 'reject', note?: string) => {
    try {
      setProcessing(reviewId);

      const response = await fetch('/api/reviews/moderate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewId,
          action,
          moderationNote: note || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la modération');
      }

      const data = await response.json();
      
      alert(data.message);
      
      // Retirer l'avis de la liste
      setReviews(prev => prev.filter(r => r.id !== reviewId));
      
      // Fermer le modal si ouvert
      setShowModal(false);
      setSelectedReview(null);
      setModerationNote('');

    } catch (error) {
      console.error('Erreur:', error);
      alert(error instanceof Error ? error.message : 'Erreur lors de la modération');
    } finally {
      setProcessing(null);
    }
  };

  const openReviewDetail = (review: PendingReview) => {
    setSelectedReview(review);
    setShowModal(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement des avis en attente...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <MessageSquare className="text-purple-600" size={32} />
              Modération des Avis
            </h1>
            <p className="text-gray-600 mt-1">
              Gérez les avis clients en attente de validation
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={fetchPendingReviews}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Loader2 size={18} />
              <span>Actualiser</span>
            </button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-yellow-600" size={24} />
              <div>
                <div className="text-2xl font-bold text-yellow-900">{reviews.length}</div>
                <div className="text-sm text-yellow-700">Avis en attente</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des avis */}
      {reviews.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Check className="mx-auto text-green-500 mb-4" size={64} />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Aucun avis en attente
          </h3>
          <p className="text-gray-600">
            Tous les avis ont été modérés. Bon travail ! 🎉
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {reviews.map(review => (
            <div key={review.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex gap-6">
                {/* Colonne gauche - Informations produit */}
                <div className="flex-shrink-0 w-48">
                  <div className="bg-gray-100 rounded-lg p-4">
                    <Package className="text-gray-400 mb-2" size={32} />
                    <div className="text-sm font-semibold text-gray-900">
                      {review.product.designation}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {review.product.brand}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Réf: {review.product.reference}
                    </div>
                  </div>
                </div>

                {/* Colonne centrale - Contenu de l'avis */}
                <div className="flex-1">
                  {/* En-tête de l'avis */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-3">
                        <User className="text-gray-400" size={16} />
                        <span className="font-semibold text-gray-900">{review.authorName}</span>
                        {review.isVerifiedPurchase && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            ✓ Achat vérifié
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                        <Calendar size={14} />
                        <span>{formatDate(review.createdAt)}</span>
                      </div>
                    </div>

                    {/* Note */}
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          size={20}
                          className={star <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
                        />
                      ))}
                      <span className="ml-2 font-bold text-gray-900">{review.rating}/5</span>
                    </div>
                  </div>

                  {/* Commentaire */}
                  {review.comment && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-3">
                      <p className="text-gray-800">{review.comment}</p>
                    </div>
                  )}

                  {/* Images */}
                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-2 mb-3">
                      <ImageIcon className="text-gray-400" size={18} />
                      <div className="flex gap-2">
                        {review.images.map((img, idx) => (
                          <div 
                            key={idx}
                            className="relative w-16 h-16 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
                          >
                            <Image
                              src={img}
                              alt={`Image ${idx + 1} de l'avis`}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Informations utilisateur */}
                  <div className="text-xs text-gray-500">
                    Email: {review.user.email}
                  </div>
                </div>

                {/* Colonne droite - Actions */}
                <div className="flex-shrink-0 flex flex-col gap-3">
                  <button
                    onClick={() => openReviewDetail(review)}
                    className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={processing === review.id}
                  >
                    <Eye size={18} />
                    <span>Détails</span>
                  </button>

                  <button
                    onClick={() => handleModerate(review.id, 'approve')}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400"
                    disabled={processing === review.id}
                  >
                    {processing === review.id ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Check size={18} />
                    )}
                    <span>Approuver</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedReview(review);
                      setShowModal(true);
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:bg-gray-400"
                    disabled={processing === review.id}
                  >
                    <X size={18} />
                    <span>Rejeter</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de rejet avec note */}
      {showModal && selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Modérer l&apos;avis
              </h3>

              {/* Détails de l'avis */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="fill-yellow-400 text-yellow-400" size={20} />
                  <span className="font-bold">{selectedReview.rating}/5</span>
                </div>
                <p className="text-gray-800">{selectedReview.comment}</p>
                <div className="mt-2 text-sm text-gray-600">
                  Par {selectedReview.authorName} pour {selectedReview.product.designation}
                </div>
              </div>

              {/* Note de modération */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note de modération (optionnelle)
                </label>
                <textarea
                  value={moderationNote}
                  onChange={(e) => setModerationNote(e.target.value)}
                  placeholder="Raison du rejet ou note pour les archives..."
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleModerate(selectedReview.id, 'approve', moderationNote)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                  disabled={processing === selectedReview.id}
                >
                  {processing === selectedReview.id ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Check size={18} />
                  )}
                  <span>Approuver</span>
                </button>

                <button
                  onClick={() => handleModerate(selectedReview.id, 'reject', moderationNote)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                  disabled={processing === selectedReview.id}
                >
                  {processing === selectedReview.id ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <X size={18} />
                  )}
                  <span>Rejeter</span>
                </button>

                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedReview(null);
                    setModerationNote('');
                  }}
                  className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={processing === selectedReview.id}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewsModerationPage;

