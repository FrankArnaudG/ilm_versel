import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';

/**
 * GET /api/reviews/moderate
 * Récupère tous les avis en attente de modération (SuperAdmin uniquement)
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier que l'utilisateur est un SuperAdmin
    const user = await currentUser();
    
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { message: 'Accès refusé. Seuls les SuperAdmin peuvent modérer les avis.' },
        { status: 403 }
      );
    }

    // Récupérer tous les avis en attente de modération
    const pendingReviews = await db.productReview.findMany({
      where: {
        isApproved: false,
        isVisible: true
      },
      include: {
        productModel: {
          select: {
            id: true,
            designation: true,
            brand: true,
            reference: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      reviews: pendingReviews.map(review => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        authorName: review.authorName,
        authorEmail: review.authorEmail,
        images: review.images,
        isVerifiedPurchase: review.isVerifiedPurchase,
        createdAt: review.createdAt,
        product: review.productModel,
        user: review.user
      })),
      total: pendingReviews.length
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des avis en attente:', error);
    return NextResponse.json(
      { message: 'Erreur serveur lors de la récupération des avis' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reviews/moderate
 * Approuve ou rejette un avis (SuperAdmin uniquement)
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier que l'utilisateur est un SuperAdmin
    const user = await currentUser();
    
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { message: 'Accès refusé. Seuls les SuperAdmin peuvent modérer les avis.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { reviewId, action, moderationNote } = body;

    // Validation
    if (!reviewId) {
      return NextResponse.json(
        { message: 'ID de l\'avis requis' },
        { status: 400 }
      );
    }

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { message: 'Action invalide. Doit être "approve" ou "reject"' },
        { status: 400 }
      );
    }

    // Vérifier que l'avis existe
    const review = await db.productReview.findUnique({
      where: { id: reviewId },
      select: { 
        id: true, 
        productModelId: true,
        isApproved: true 
      }
    });

    if (!review) {
      return NextResponse.json(
        { message: 'Avis introuvable' },
        { status: 404 }
      );
    }

    if (review.isApproved) {
      return NextResponse.json(
        { message: 'Cet avis a déjà été modéré' },
        { status: 400 }
      );
    }

    // Modérer l'avis et recalculer la note si approuvé
    const result = await db.$transaction(async (tx) => {
      if (action === 'approve') {
        // 1. Approuver l'avis
        const updatedReview = await tx.productReview.update({
          where: { id: reviewId },
          data: {
            isApproved: true,
            moderatedBy: user.id,
            moderatedAt: new Date(),
            moderationNote: moderationNote || null
          }
        });

        // 2. Recalculer la note moyenne en incluant ce nouvel avis approuvé
        const allApprovedReviews = await tx.productReview.findMany({
          where: {
            productModelId: review.productModelId,
            isVisible: true,
            isApproved: true
          },
          select: {
            rating: true
          }
        });

        const totalReviews = allApprovedReviews.length;
        const sumRatings = allApprovedReviews.reduce((sum, r) => sum + r.rating, 0);
        const averageRating = totalReviews > 0 ? sumRatings / totalReviews : 0;

        // 3. Mettre à jour le produit
        await tx.productModel.update({
          where: { id: review.productModelId },
          data: {
            averageRating: totalReviews > 0 ? averageRating : null,
            totalReviews: totalReviews
          }
        });

        return {
          action: 'approved',
          review: updatedReview,
          stats: {
            averageRating,
            totalReviews
          }
        };
      } else {
        // Rejeter l'avis (soft delete)
        const updatedReview = await tx.productReview.update({
          where: { id: reviewId },
          data: {
            isVisible: false,
            isApproved: false,
            moderatedBy: user.id,
            moderatedAt: new Date(),
            moderationNote: moderationNote || 'Avis rejeté'
          }
        });

        return {
          action: 'rejected',
          review: updatedReview,
          stats: null
        };
      }
    });

    console.log(`✅ Avis ${result.action} par ${user.name}:`, {
      reviewId,
      moderatorId: user.id
    });

    return NextResponse.json({
      success: true,
      message: result.action === 'approved' 
        ? 'Avis approuvé avec succès' 
        : 'Avis rejeté avec succès',
      action: result.action,
      stats: result.stats
    });

  } catch (error) {
    console.error('❌ Erreur lors de la modération de l\'avis:', error);
    return NextResponse.json(
      { message: 'Erreur serveur lors de la modération de l\'avis' },
      { status: 500 }
    );
  }
}

