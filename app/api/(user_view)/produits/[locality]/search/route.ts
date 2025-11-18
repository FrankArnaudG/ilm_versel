// ============================================
// app/api/produits/[locality]/search/route.ts
// GET - Recherche de produits par localité avec suggestions
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
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '100');

    // ============================================
    // VALIDATION DES PARAMÈTRES
    // ============================================
    if (!locality) {
      return NextResponse.json({ 
        message: 'Localité requise' 
      }, { status: 400 });
    }

    const storeId = getStoreIdByLocality(locality);

    // Si pas de query ou query trop court, on retourne tous les produits actifs
    const hasQuery = query && query.trim().length >= 2;


    // ============================================
    // RECHERCHE DES MODÈLES
    // ============================================
    const productModels = await db.productModel.findMany({
      where: {
        ...(hasQuery ? {
          OR: [
            {
              designation: {
                contains: query,
                mode: 'insensitive',
              },
            },
            {
              brand: {
                contains: query,
                mode: 'insensitive',
              },
            },
            {
              category: {
                contains: query,
                mode: 'insensitive',
              },
            },
            {
              reference: {
                contains: query,
                mode: 'insensitive',
              },
            },
            {
              description: {
                contains: query,
                mode: 'insensitive',
              },
            },
          ],
        } : {}),
        status: 'ACTIVE',
        variants: {
          some: {
            storeId: storeId,
            availableStock: { gt: 0 }
          }
        }
      },
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        // Couleurs avec images
        colors: {
          include: {
            images: {
              orderBy: { displayOrder: 'asc' }
            }
          },
          orderBy: { createdAt: 'asc' }
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
            { variantAttribute: 'asc' },
            { pvTTC: 'asc' }
          ]
        },
        
        // Articles avec variante complète
        articles: {
          where: {
            storeId: storeId,
            status: 'IN_STOCK'
          },
          include: {
            color: {
              select: {
                id: true,
                colorName: true,
                hexaColor: true
              }
            },
            variant: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    // ============================================
    // FILTRER LES MODÈLES SANS VARIANTES/ARTICLES
    // ============================================
    const filteredModels = productModels.filter(model => 
      (model.variants && model.variants.length > 0) || 
      (model.articles && model.articles.length > 0)
    );

    // ============================================
    // ENRICHIR LES ARTICLES AVEC LES PRIX ET CONVERTIR LES DECIMALS
    // ============================================
    const enrichedModels = filteredModels.map(model => ({
      ...model,
      // Convertir averageRating de Decimal en number
      averageRating: model.averageRating ? parseFloat(model.averageRating.toString()) : null,
      articles: model.articles?.map(article => ({
        ...article,
        // Ajouter les prix depuis la variante
        pvTTC: article.variant?.pvTTC ? article.variant.pvTTC.toString() : "0",
        pvTTC_FCFA: article.variant?.pvTTC_FCFA ? article.variant.pvTTC_FCFA.toString() : "0",
        oldPrice: article.variant?.oldPrice ? article.variant.oldPrice.toString() : "0",
        oldPrice_FCFA: article.variant?.oldPrice_FCFA ? article.variant.oldPrice_FCFA.toString() : "0",
        pamp: article.variant?.pamp ? article.variant.pamp.toString() : "0",
        pamp_FCFA: article.variant?.pamp_FCFA ? article.variant.pamp_FCFA.toString() : "0",
        tva: article.variant?.tva ? article.variant.tva.toString() : "18",
        margin: article.variant?.margin ? article.variant.margin.toString() : "0",
        marginFCFA: article.variant?.marginFCFA ? article.variant.marginFCFA.toString() : "0",
        marginPercent: article.variant?.marginPercent ? article.variant.marginPercent.toString() : "0",
        useFCFA: article.variant?.useFCFA || false
      }))
    }));

    // ============================================
    // RÉPONSE
    // ============================================
    return NextResponse.json({
      success: true,
      productModel: enrichedModels,
      query,
      locality,
      storeId
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Erreur recherche produits:', error);
    
    return NextResponse.json(
      { 
        success: false,
        message: 'Erreur interne du serveur',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

