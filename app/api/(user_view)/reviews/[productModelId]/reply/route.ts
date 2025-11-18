import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';

/**
 * POST /api/reviews/[productModelId]/reply
 * Ajoute une réponse à un avis
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ productModelId: string }> }
) {
  try {
    // Await params (Next.js 15 requirement)
    const { productModelId } = await params;
    
    // Récupérer l'utilisateur connecté côté serveur
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json(
        { message: 'Vous devez être connecté pour répondre à un avis' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { reviewId, replyText } = body;

    if (!reviewId) {
      return NextResponse.json(
        { message: 'ID de l\'avis requis' },
        { status: 400 }
      );
    }

    if (!replyText || replyText.trim().length === 0) {
      return NextResponse.json(
        { message: 'Texte de la réponse requis' },
        { status: 400 }
      );
    }

    // Vérifier que l'avis existe
    const review = await db.productReview.findUnique({
      where: { id: reviewId },
      select: { id: true, productModelId: true }
    });

    if (!review) {
      return NextResponse.json(
        { message: 'Avis introuvable' },
        { status: 404 }
      );
    }

    // Vérifier que l'avis appartient au bon produit
    if (review.productModelId !== productModelId) {
      return NextResponse.json(
        { message: 'L\'avis n\'appartient pas à ce produit' },
        { status: 400 }
      );
    }

    // Créer la réponse
    const reply = await db.reviewReply.create({
      data: {
        reviewId,
        userId: user.id,
        authorName: user.name || user.email || 'Utilisateur',
        replyText: replyText.trim()
      }
    });

    console.log('✅ Réponse créée avec succès:', {
      replyId: reply.id,
      reviewId: reviewId
    });

    return NextResponse.json({
      success: true,
      message: 'Réponse ajoutée avec succès',
      reply: {
        id: reply.id,
        authorName: reply.authorName,
        replyText: reply.replyText,
        createdAt: reply.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors de la création de la réponse:', error);
    return NextResponse.json(
      { message: 'Erreur serveur lors de la création de la réponse' },
      { status: 500 }
    );
  }
}

