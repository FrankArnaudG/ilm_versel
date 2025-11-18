import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// DELETE - Retirer un produit de la liste de souhaits
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productModelId: string }> }
) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json(
        { message: 'Accès refusé' },
        { status: 401 }
      );
    }

    const { productModelId } = await params;

    if (!productModelId) {
      return NextResponse.json(
        { message: 'ID du produit manquant' },
        { status: 400 }
      );
    }

    // Vérifier si le produit est dans la wishlist
    const wishlistItem = await db.wishlistItem.findUnique({
      where: {
        userId_productModelId: {
          userId: user.id,
          productModelId: productModelId
        }
      }
    });

    if (!wishlistItem) {
      return NextResponse.json(
        { message: 'Produit non trouvé dans la liste de souhaits' },
        { status: 404 }
      );
    }

    // Supprimer le produit de la wishlist
    await db.wishlistItem.delete({
      where: {
        id: wishlistItem.id
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Produit retiré de la liste de souhaits'
    });

  } catch (error) {
    console.error('Erreur suppression wishlist:', error);
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// GET - Vérifier si un produit est dans la wishlist
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productModelId: string }> }
) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({
        success: true,
        isInWishlist: false
      });
    }

    const { productModelId } = await params;

    if (!productModelId) {
      return NextResponse.json(
        { message: 'ID du produit manquant' },
        { status: 400 }
      );
    }

    const wishlistItem = await db.wishlistItem.findUnique({
      where: {
        userId_productModelId: {
          userId: user.id,
          productModelId: productModelId
        }
      }
    });

    return NextResponse.json({
      success: true,
      isInWishlist: !!wishlistItem
    });

  } catch (error) {
    console.error('Erreur vérification wishlist:', error);
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

