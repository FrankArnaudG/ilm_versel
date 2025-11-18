// app/api/products/models/recommendations/add/route.ts

import { db } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import { Role, RecommendationType } from "@prisma/client";
import { NextResponse } from "next/server";

interface RecommendationInput {
  productId: string;
  relationType: RecommendationType;
  priority: number;
}


export async function POST(request: Request) {
  try {
    const payload = await request.json();
    
    console.log('📥 Payload recommandations reçu:', {
      user_id: payload.user_id,
      role: payload.role,
      mainProductId: payload.mainProductId,
      recommendationsCount: payload.recommendations?.length
    });

    // ===========================
    // 1. VÉRIFICATIONS DE BASE
    // ===========================
    
    if (!payload.user_id) {
      return NextResponse.json({ 
        message: 'Accès refusé - user_id manquant' 
      }, { status: 403 });
    }

    if (!payload.mainProductId) {
      return NextResponse.json({ 
        message: 'ID du produit principal manquant' 
      }, { status: 400 });
    }

    if (!payload.recommendations || !Array.isArray(payload.recommendations) || payload.recommendations.length === 0) {
      return NextResponse.json({ 
        message: 'Aucune recommandation fournie' 
      }, { status: 400 });
    }

    // Vérifier l'utilisateur
    const user = await db.user.findUnique({
      where: { id: payload.user_id },
      include: {
        secondaryRoles: true
      }
    });

    if (!user) {
      return NextResponse.json({ 
        message: 'Utilisateur non trouvé' 
      }, { status: 403 });
    }

    if (user.status !== 'ACTIVE') {
      return NextResponse.json({ 
        message: 'Compte utilisateur inactif ou suspendu' 
      }, { status: 403 });
    }

    // ===========================
    // 2. VÉRIFICATION DES RÔLES
    // ===========================
    
    const userRoles: Role[] = [user.role, ...user.secondaryRoles.map(sr => sr.role)];
    const isRoleValid = userRoles.includes(payload.role as Role);

    if (!isRoleValid) {
      return NextResponse.json({ 
        message: "Votre rôle est introuvable" 
      }, { status: 403 });
    }

    if (payload.role !== user.role) {
      const secondaryRole = user.secondaryRoles.find(sr => sr.role === payload.role);
      if (secondaryRole?.expiresAt && new Date(secondaryRole.expiresAt) < new Date()) {
        return NextResponse.json({ 
          message: 'Ce rôle secondaire a expiré' 
        }, { status: 403 });
      }
    }

    // Vérifier la permission (utilise products.update car on modifie un produit existant)
    const canManageRecommendations = hasPermission(payload.role as Role, 'products.update');
    
    if (!canManageRecommendations) {
      return NextResponse.json({ 
        message: "Vous n'êtes pas autorisé à gérer les recommandations de produits" 
      }, { status: 403 });
    }

    // ===========================
    // 3. VÉRIFICATION DU PRODUIT PRINCIPAL
    // ===========================
    
    const mainProduct = await db.productModel.findUnique({
      where: { id: payload.mainProductId }
    });

    if (!mainProduct) {
      return NextResponse.json({ 
        message: 'Produit principal introuvable' 
      }, { status: 404 });
    }

    // ===========================
    // 4. VÉRIFICATION DES PRODUITS RECOMMANDÉS
    // ===========================
    
    const recommendedProductIds = payload.recommendations.map((r: RecommendationInput) => r.productId);
    
    // Vérifier que les produits recommandés existent
    const existingProducts = await db.productModel.findMany({
      where: { 
        id: { in: recommendedProductIds }
      },
      select: { id: true }
    });

    if (existingProducts.length !== recommendedProductIds.length) {
      const foundIds = existingProducts.map(p => p.id);
      const missingIds = recommendedProductIds.filter((id: string) => !foundIds.includes(id));
      return NextResponse.json({ 
        message: `Produits recommandés introuvables: ${missingIds.join(', ')}` 
      }, { status: 404 });
    }

    // Vérifier qu'on ne recommande pas le produit à lui-même
    const selfRecommendation = recommendedProductIds.find((id: string) => id === payload.mainProductId);
    if (selfRecommendation) {
      return NextResponse.json({ 
        message: 'Un produit ne peut pas se recommander lui-même' 
      }, { status: 400 });
    }

    // ===========================
    // 5. MISE À JOUR DES RECOMMANDATIONS
    // ===========================

    const result = await db.$transaction(async (tx) => {
      // Récupérer les recommandations existantes
      const existingRecommendations = await tx.recommendedProduct.findMany({
        where: { mainProductId: payload.mainProductId }
      });

      const existingMap = new Map(
        existingRecommendations.map(r => [r.recommendedProductId, r])
      );

      let created = 0;
      let updated = 0;

      // Traiter chaque recommandation
      for (const rec of payload.recommendations) {
        const existing = existingMap.get(rec.productId);

        if (existing) {
          // Mise à jour
          await tx.recommendedProduct.update({
            where: { id: existing.id },
            data: {
              relationType: rec.relationType as RecommendationType,
              priority: rec.priority,
              isActive: true,
              updatedAt: new Date()
            }
          });
          updated++;
        } else {
          // Création
          await tx.recommendedProduct.create({
            data: {
              mainProductId: payload.mainProductId,
              recommendedProductId: rec.productId,
              relationType: rec.relationType as RecommendationType,
              priority: rec.priority,
              isActive: true,
              createdById: payload.user_id
            }
          });
          created++;
        }
      }

      return { created, updated };
    });

    console.log('✅ Recommandations traitées:', result);
    
    return NextResponse.json({
      success: true,
      message: `${result.created} recommandation(s) créée(s), ${result.updated} mise(s) à jour`,
      summary: result
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Erreur ajout recommandations:', error);

    return NextResponse.json(
      { 
        success: false,
        message: 'Erreur lors de l\'ajout des recommandations',
      },
      { status: 500 }
    );
  }
}