import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';

/**
 * GET /api/reviews/[productModelId]
 * Récupère tous les avis d'un produit
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productModelId: string }> }
) {
  try {
    const { productModelId } = await params;

    // Vérifier que le produit existe
    const product = await db.productModel.findUnique({
      where: { id: productModelId },
      select: { id: true, designation: true, averageRating: true, totalReviews: true }
    });

    if (!product) {
      return NextResponse.json(
        { message: 'Produit introuvable' },
        { status: 404 }
      );
    }

    // Vérifier si la modération est activée
    const moderationEnabled = process.env.ENABLE_REVIEW_MODERATION === 'true';

    // Récupérer les avis visibles avec leurs réponses
    const reviews = await db.productReview.findMany({
      where: {
        productModelId,
        isVisible: true,
        // Si la modération est activée, ne montrer que les avis approuvés
        ...(moderationEnabled ? { isApproved: true } : {})
      },
      include: {
        replies: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        designation: product.designation,
        averageRating: product.averageRating ? parseFloat(product.averageRating.toString()) : null,
        totalReviews: product.totalReviews
      },
      reviews: reviews.map(review => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        authorName: review.authorName,
        images: review.images,
        isVerifiedPurchase: review.isVerifiedPurchase,
        createdAt: review.createdAt,
        replies: review.replies.map(reply => ({
          id: reply.id,
          authorName: reply.authorName,
          replyText: reply.replyText,
          createdAt: reply.createdAt
        }))
      }))
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des avis:', error);
    return NextResponse.json(
      { message: 'Erreur serveur lors de la récupération des avis' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reviews/[productModelId]
 * Ajoute un nouvel avis et recalcule la note moyenne
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ productModelId: string }> }
) {
  try {
    const { productModelId } = await params;
    
    // Récupérer l'utilisateur connecté côté serveur
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json(
        { message: 'Vous devez être connecté pour laisser un avis' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validation des données
    const { rating, comment, images } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { message: 'La note doit être entre 1 et 5' },
        { status: 400 }
      );
    }

    if (!comment || comment.trim().length === 0) {
      return NextResponse.json(
        { message: 'Le commentaire est requis' },
        { status: 400 }
      );
    }

    // Vérifier que le produit existe
    const product = await db.productModel.findUnique({
      where: { id: productModelId },
      select: { id: true }
    });

    if (!product) {
      return NextResponse.json(
        { message: 'Produit introuvable' },
        { status: 404 }
      );
    }

    // Vérifier si la modération est activée
    const moderationEnabled = process.env.ENABLE_REVIEW_MODERATION === 'true';

    // Créer l'avis et recalculer la note moyenne dans une transaction
    const result = await db.$transaction(async (tx) => {
      // 1. Créer le nouvel avis
      const newReview = await tx.productReview.create({
        data: {
          productModelId,
          userId: user.id,
          rating: parseInt(rating),
          comment: comment.trim(),
          authorName: user.name || user.email || 'Utilisateur',
          authorEmail: user.email || null,
          images: images || [],
          isVisible: true,
          isVerifiedPurchase: false, // TODO: Vérifier si l'utilisateur a acheté le produit
          isApproved: !moderationEnabled // Si pas de modération, approuver automatiquement
        }
      });

      // 2. Calculer la nouvelle note moyenne (seulement avec les avis approuvés)
      const allReviews = await tx.productReview.findMany({
        where: {
          productModelId,
          isVisible: true,
          ...(moderationEnabled ? { isApproved: true } : {})
        },
        select: {
          rating: true
        }
      });

      const totalReviews = allReviews.length;
      const sumRatings = allReviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalReviews > 0 ? sumRatings / totalReviews : 0;

      // 3. Mettre à jour le produit avec la nouvelle note moyenne
      await tx.productModel.update({
        where: { id: productModelId },
        data: {
          averageRating: averageRating,
          totalReviews: totalReviews
        }
      });

      return {
        review: newReview,
        stats: {
          averageRating,
          totalReviews
        }
      };
    });

    console.log('✅ Avis créé avec succès:', {
      reviewId: result.review.id,
      newAverageRating: result.stats.averageRating,
      totalReviews: result.stats.totalReviews,
      needsModeration: moderationEnabled
    });

    return NextResponse.json({
      success: true,
      message: moderationEnabled 
        ? 'Avis soumis avec succès. Il sera visible après validation par un administrateur.'
        : 'Avis ajouté avec succès',
      review: {
        id: result.review.id,
        rating: result.review.rating,
        comment: result.review.comment,
        authorName: result.review.authorName,
        images: result.review.images,
        createdAt: result.review.createdAt,
        isApproved: result.review.isApproved
      },
      productStats: {
        averageRating: result.stats.averageRating,
        totalReviews: result.stats.totalReviews
      },
      needsModeration: moderationEnabled
    });

  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'avis:', error);
    return NextResponse.json(
      { message: 'Erreur serveur lors de la création de l\'avis' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reviews/[productModelId]?reviewId=xxx
 * Supprime un avis (soft delete en le rendant invisible) et recalcule la note
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productModelId: string }> }
) {
  try {
    const { productModelId } = await params;
    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('reviewId');

    if (!reviewId) {
      return NextResponse.json(
        { message: 'ID de l\'avis requis' },
        { status: 400 }
      );
    }

    // Vérifier que l'avis existe et appartient au produit
    const review = await db.productReview.findFirst({
      where: {
        id: reviewId,
        productModelId
      }
    });

    if (!review) {
      return NextResponse.json(
        { message: 'Avis introuvable' },
        { status: 404 }
      );
    }

    // Soft delete et recalcul dans une transaction
    const result = await db.$transaction(async (tx) => {
      // 1. Rendre l'avis invisible
      await tx.productReview.update({
        where: { id: reviewId },
        data: { isVisible: false }
      });

      // 2. Recalculer la note moyenne sans cet avis
      const visibleReviews = await tx.productReview.findMany({
        where: {
          productModelId,
          isVisible: true
        },
        select: {
          rating: true
        }
      });

      const totalReviews = visibleReviews.length;
      const sumRatings = visibleReviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = totalReviews > 0 ? sumRatings / totalReviews : 0;

      // 3. Mettre à jour le produit
      await tx.productModel.update({
        where: { id: productModelId },
        data: {
          averageRating: totalReviews > 0 ? averageRating : null,
          totalReviews: totalReviews
        }
      });

      return {
        averageRating,
        totalReviews
      };
    });

    return NextResponse.json({
      success: true,
      message: 'Avis supprimé avec succès',
      productStats: {
        averageRating: result.averageRating,
        totalReviews: result.totalReviews
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors de la suppression de l\'avis:', error);
    return NextResponse.json(
      { message: 'Erreur serveur lors de la suppression de l\'avis' },
      { status: 500 }
    );
  }
}

