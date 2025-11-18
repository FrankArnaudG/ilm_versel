// ============================================
// app/api/produits/[locality]/featured/route.ts
// GET - Liste des produits nouveaux et recommandés filtrés par localité
// ============================================

import { db } from "@/lib/db";
import { getStoreIdByLocality } from "@/lib/locality";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locality: string }> }
) {
  try {
    const { locality } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'new' ou 'recommended'

    // ============================================
    // VALIDATION DES PARAMÈTRES
    // ============================================
    if (!locality) {
      return NextResponse.json({ 
        message: 'Localité est requise' 
      }, { status: 400 });
    }

    if (!type || (type !== 'new' && type !== 'recommended')) {
      return NextResponse.json({ 
        message: 'Type doit être "new" ou "recommended"' 
      }, { status: 400 });
    }

    const storeId = getStoreIdByLocality(locality);

    // ============================================
    // RÉCUPÉRATION DES MODÈLES AVEC VARIANTES
    // ============================================
    const productModels = await db.productModel.findMany({
      where: {
        status: 'ACTIVE',
        ...(type === 'new' ? { is_new: true } : { is_recommanded: true }),
        variants: {
          some: {
            storeId: storeId,
            availableStock: { gt: 0 }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        // Couleurs avec images
        colors: {
          include: {
            images: {
              orderBy: { displayOrder: 'asc' },
              take: 1 // Prendre seulement la première image pour l'affichage
            }
          },
          orderBy: { createdAt: 'asc' },
          take: 1 // Prendre seulement la première couleur pour l'affichage
        },
        
        // Variantes de cette boutique uniquement
        variants: {
          where: {
            storeId: storeId,
            availableStock: { gt: 0 }
          },
          include: {
            store: {
              select: {
                id: true,
                name: true,
                code: true,
                city: true
              }
            },
          },
          orderBy: [
            { pvTTC: 'asc' } // Prendre la variante la moins chère
          ],
          take: 1 // Prendre seulement la première variante pour l'affichage
        }
      },
      take: 20 // Limiter à 20 produits
    });

    // ============================================
    // FORMATAGE DES DONNÉES POUR L'AFFICHAGE
    // ============================================
    const formattedProducts = productModels
      .filter(model => model.variants && model.variants.length > 0)
      .map(model => {
        const firstVariant = model.variants[0];
        const firstColor = model.colors[0];
        const firstImage = firstColor?.images[0];

        return {
          id: model.id,
          name: model.designation,
          subtitle: model.brand,
          details: firstVariant?.variantAttribute || '',
          rating: model.averageRating ? Number(model.averageRating).toFixed(1) : '0',
          reviews: model.totalReviews?.toString() || '0',
          currentPrice: firstVariant?.useFCFA 
            ? `${Number(firstVariant.pvTTC_FCFA).toLocaleString('fr-FR')} FCFA`
            : `€${Number(firstVariant.pvTTC).toFixed(2)}`,
          oldPrice: firstVariant?.oldPrice && Number(firstVariant.oldPrice) > 0
            ? (firstVariant.useFCFA 
                ? `${Number(firstVariant.oldPrice_FCFA).toLocaleString('fr-FR')} FCFA`
                : `€${Number(firstVariant.oldPrice).toFixed(2)}`)
            : null,
          image: firstImage?.url || '/images/placeholder.png',
          link: `/${locality}/${model.brand}/${model.category}/${model.id}`,
          productModel: model
        };
      });

    return NextResponse.json({
      products: formattedProducts,
      count: formattedProducts.length
    }, { status: 200 });

  } catch (error) {
    console.error('Erreur lors de la récupération des produits:', error);
    return NextResponse.json({ 
      message: 'Erreur serveur lors de la récupération des produits',
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}

