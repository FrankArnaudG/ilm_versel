import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET - Récupérer la liste de souhaits de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json(
        { message: 'Accès refusé' },
        { status: 401 }
      );
    }

    const wishlistItems = await db.wishlistItem.findMany({
      where: { userId: user.id },
      include: {
        productModel: {
          include: {
            colors: {
              include: {
                images: {
                  orderBy: { displayOrder: 'asc' },
                  take: 1
                }
              }
            },
            variants: {
              take: 1,
              orderBy: { pvTTC: 'asc' }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Formater les produits pour l'affichage
    const products = wishlistItems.map(item => {
      const product = item.productModel;
      const firstColor = product.colors?.[0];
      const firstImage = firstColor?.images?.[0];
      const firstVariant = product.variants?.[0];
      
      return {
        id: product.id,
        designation: product.designation,
        brand: product.brand,
        reference: product.reference,
        category: product.category,
        image: firstImage?.url || null,
        price: firstVariant ? parseFloat(firstVariant.pvTTC.toString()) : 0,
        oldPrice: firstVariant?.oldPrice ? parseFloat(firstVariant.oldPrice.toString()) : 0,
        addedAt: item.createdAt
      };
    });

    return NextResponse.json({
      success: true,
      products
    });

  } catch (error) {
    console.error('Erreur récupération wishlist:', error);
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Ajouter un produit à la liste de souhaits
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json(
        { message: 'Accès refusé' },
        { status: 401 }
      );
    }

    const { productModelId } = await request.json();

    if (!productModelId) {
      return NextResponse.json(
        { message: 'ID du produit manquant' },
        { status: 400 }
      );
    }

    // Vérifier si le produit existe
    const product = await db.productModel.findUnique({
      where: { id: productModelId }
    });

    if (!product) {
      return NextResponse.json(
        { message: 'Produit introuvable' },
        { status: 404 }
      );
    }

    // Vérifier si le produit est déjà dans la wishlist
    const existingItem = await db.wishlistItem.findUnique({
      where: {
        userId_productModelId: {
          userId: user.id,
          productModelId: productModelId
        }
      }
    });

    if (existingItem) {
      return NextResponse.json(
        { message: 'Produit déjà dans la liste de souhaits', alreadyExists: true },
        { status: 200 }
      );
    }

    // Ajouter le produit à la wishlist
    const wishlistItem = await db.wishlistItem.create({
      data: {
        userId: user.id,
        productModelId: productModelId
      },
      include: {
        productModel: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Produit ajouté à la liste de souhaits',
      wishlistItem
    });

  } catch (error) {
    console.error('Erreur ajout wishlist:', error);
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

