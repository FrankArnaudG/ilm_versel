'use client';

import React, { useState, useEffect } from 'react';
import { Star, X, Loader2 } from 'lucide-react';
import { useCurrentUser } from '@/ts/hooks/use-current-user';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  authorName: string;
  images: string[];
  isVerifiedPurchase: boolean;
  createdAt: string;
  replies: Reply[];
}

interface Reply {
  id: string;
  authorName: string;
  replyText: string;
  createdAt: string;
}

interface ProductReviewsProps {
  productModelId: string;
  initialAverageRating?: number | null;
  initialTotalReviews?: number;
}

const ProductReviews: React.FC<ProductReviewsProps> = ({ 
  productModelId,
  initialAverageRating = null,
  initialTotalReviews = 0
}) => {
  // Authentification
  const user = useCurrentUser();
  const router = useRouter();
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Statistiques
  const [averageRating, setAverageRating] = useState(initialAverageRating);
  const [totalReviews, setTotalReviews] = useState(initialTotalReviews);
  
  // Formulaire nouvel avis
  const [newComment, setNewComment] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]); // Fichiers réels
  const [imagePreviews, setImagePreviews] = useState<string[]>([]); // Aperçus locaux
  const [uploadingImages, setUploadingImages] = useState(false);
  
  // Réponses
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  // Chargement des avis
  useEffect(() => {
    fetchReviews();
  }, [productModelId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/reviews/${productModelId}`);
      
      if (!response.ok) {
        console.log('Erreur lors du chargement des avis');
        return;
      }

      const data = await response.json();
      
      setReviews(data.reviews || []);
      setAverageRating(data.product.averageRating);
      setTotalReviews(data.product.totalReviews);
      
    } catch (error) {
      console.error('Erreur chargement avis:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const fileArray = Array.from(files);
    
    // Stocker les fichiers réels
    setSelectedFiles(prev => [...prev, ...fileArray]);
    
    // Créer des aperçus locaux
    const newPreviews = fileArray.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (files: File[]): Promise<string[]> => {
    if (files.length === 0) return [];

    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('images', file);
      });

      const response = await fetch('/api/upload/review-images', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'upload des images');
      }

      const data = await response.json();
      return data.urls || [];
    } catch (error) {
      console.error('Erreur upload:', error);
      throw error;
    }
  };

  const submitReview = async () => {
    // Vérifier si l'utilisateur est connecté
    if (!user) {
      const confirmLogin = window.confirm(
        'Vous devez être connecté pour laisser un avis. Voulez-vous vous connecter maintenant ?'
      );
      if (confirmLogin) {
        router.push('/signIn');
      }
      return;
    }

    if (!newComment.trim()) {
      alert('Veuillez écrire un commentaire');
      return;
    }

    try {
      setSubmitting(true);

      // 1. Upload des images d'abord
      let uploadedImageUrls: string[] = [];
      if (selectedFiles.length > 0) {
        setUploadingImages(true);
        try {
          uploadedImageUrls = await uploadImages(selectedFiles);
        } catch (error) {
          alert('Erreur lors de l\'upload des images. L\'avis sera publié sans images.');
          console.error('Upload error:', error);
        } finally {
          setUploadingImages(false);
        }
      }

      // 2. Soumettre l'avis avec les URLs des images
      const response = await fetch(`/api/reviews/${productModelId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating: newRating,
          comment: newComment.trim(),
          images: uploadedImageUrls
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la soumission');
      }

      const data = await response.json();
      
      // Mettre à jour les statistiques
      setAverageRating(data.productStats.averageRating);
      setTotalReviews(data.productStats.totalReviews);
      
      // Recharger les avis
      await fetchReviews();
      
      // Réinitialiser le formulaire
      setNewComment("");
      setNewRating(5);
      setSelectedFiles([]);
      setImagePreviews([]);
      
      alert('✅ Votre avis a été publié avec succès !');
      
    } catch (error) {
      console.error('Erreur soumission avis:', error);
      alert('❌ Une erreur est survenue lors de la publication de votre avis');
    } finally {
      setSubmitting(false);
    }
  };

  const submitReply = async (reviewId: string) => {
    // Vérifier si l'utilisateur est connecté
    if (!user) {
      const confirmLogin = window.confirm(
        'Vous devez être connecté pour répondre à un avis. Voulez-vous vous connecter maintenant ?'
      );
      if (confirmLogin) {
        router.push('/signIn');
      }
      return;
    }

    if (!replyText.trim()) {
      alert('Veuillez écrire une réponse');
      return;
    }

    try {
      const response = await fetch(`/api/reviews/${productModelId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewId,
          replyText: replyText.trim()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la soumission');
      }

      // Recharger les avis pour afficher la nouvelle réponse
      await fetchReviews();
      
      // Réinitialiser le formulaire de réponse
      setReplyText("");
      setReplyingTo(null);
      
      alert('✅ Votre réponse a été publiée !');
      
    } catch (error) {
      console.error('Erreur soumission réponse:', error);
      alert('❌ Une erreur est survenue lors de la publication de votre réponse');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Aujourd\'hui';
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaine${Math.floor(diffDays / 7) > 1 ? 's' : ''}`;
    if (diffDays < 365) return `Il y a ${Math.floor(diffDays / 30)} mois`;
    return `Il y a ${Math.floor(diffDays / 365)} an${Math.floor(diffDays / 365) > 1 ? 's' : ''}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={32} className="animate-spin text-[#800080]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* En-tête avec statistiques */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Avis clients</h2>
          {totalReviews > 0 && (
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={star}
                    size={20}
                    className={star <= Math.round(averageRating || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
                  />
                ))}
              </div>
              <span className="text-lg font-semibold text-gray-900">
                {averageRating?.toFixed(1) || '0.0'} / 5
              </span>
              <span className="text-sm text-gray-500">
                ({totalReviews} avis)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Formulaire d'ajout d'avis */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="font-semibold text-lg mb-4">Laisser un avis</h3>
        
        {user && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-gray-700">
              Vous publiez en tant que <span className="font-semibold text-[#800080]">{user.name || user.email}</span>
            </p>
          </div>
        )}
        
        {/* Rating */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-gray-600">Votre note :</span>
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              onClick={() => setNewRating(star)}
              className="transition-colors"
              type="button"
            >
              <Star
                size={28}
                className={star <= newRating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
              />
            </button>
          ))}
          <span className="ml-2 text-sm font-medium text-gray-700">
            {newRating} / 5
          </span>
        </div>

        {/* Comment Text */}
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Partagez votre expérience avec ce produit..."
          className="w-full p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#800080]"
          rows={4}
        />

        {/* Image Upload */}
        <div className="mt-4">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-[#800080]">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <span>📷 Ajouter des photos</span>
          </label>
          
          {imagePreviews.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {imagePreviews.map((preview, idx) => (
                <div key={idx} className="relative w-20 h-20">
                  <Image 
                    src={preview} 
                    alt="" 
                    fill
                    sizes="80px"
                    className="object-cover rounded-lg" 
                  />
                  <button
                    onClick={() => removeImage(idx)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 z-10"
                    type="button"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={submitReview}
          disabled={submitting || uploadingImages}
          className="mt-4 px-6 py-3 bg-[#800080] text-white rounded-lg font-medium hover:bg-[#6b006b] disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {uploadingImages ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Upload des images...</span>
            </>
          ) : submitting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Publication en cours...</span>
            </>
          ) : (
            <span>Publier l&apos;avis</span>
          )}
        </button>
      </div>

      {/* Liste des avis */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-500">Aucun avis pour le moment. Soyez le premier à donner votre avis !</p>
          </div>
        ) : (
          reviews.map(review => (
            <div key={review.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="font-semibold text-gray-900">{review.authorName}</div>
                    {review.isVerifiedPurchase && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        ✓ Achat vérifié
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">{formatDate(review.createdAt)}</div>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
                    />
                  ))}
                </div>
              </div>

              {review.comment && (
                <p className="text-gray-700 mb-3">{review.comment}</p>
              )}

              {/* Images de l'avis */}
              {review.images && review.images.length > 0 && (
                <div className="flex gap-2 mb-3 flex-wrap">
                  {review.images.map((img, idx) => (
                    <div key={idx} className="relative w-24 h-24">
                      <Image
                        src={img}
                        alt=""
                        fill
                        sizes="96px"
                        className="object-cover rounded-lg cursor-pointer hover:opacity-80"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Bouton Répondre */}
              <button
                onClick={() => setReplyingTo(review.id)}
                className="text-sm text-[#800080] hover:text-[#6b006b] font-medium"
              >
                Répondre
              </button>

              {/* Formulaire de réponse */}
              {replyingTo === review.id && (
                <div className="mt-4 ml-8 space-y-3 bg-gray-50 p-4 rounded-lg">
                  {user && (
                    <div className="bg-white border border-purple-200 rounded-lg p-2">
                      <p className="text-xs text-gray-600">
                        Réponse en tant que <span className="font-semibold text-[#800080]">{user.name || user.email}</span>
                      </p>
                    </div>
                  )}
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Votre réponse..."
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#800080]"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => submitReply(review.id)}
                      className="px-4 py-2 bg-[#800080] text-white rounded-lg text-sm hover:bg-[#6b006b]"
                    >
                      Envoyer
                    </button>
                    <button
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyText("");
                    }}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}

              {/* Réponses */}
              {review.replies && review.replies.length > 0 && (
                <div className="mt-4 ml-8 space-y-3">
                  {review.replies.map(reply => (
                    <div key={reply.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-semibold text-sm text-gray-900">{reply.authorName}</div>
                        <div className="text-xs text-gray-500">{formatDate(reply.createdAt)}</div>
                      </div>
                      <p className="text-sm text-gray-700">{reply.replyText}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProductReviews;

