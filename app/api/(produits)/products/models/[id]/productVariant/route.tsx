// app/api/models/[id]/storages/route.ts
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import { Role } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: modelId } = await params;
     
    // Récupérer les paramètres de requête
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const store_id = searchParams.get('store_id');
    const role = searchParams.get('role');

    // Validation des paramètres
    if (!user_id || !role || !store_id) {
      return NextResponse.json({ 
        message: 'Accès refusé' 
      }, { status: 400 });
    }

    if (!modelId) {
      return NextResponse.json({ 
        message: 'ID du modèle manquant' 
      }, { status: 400 });
    }

    // Vérifier l'utilisateur
    const user = await db.user.findUnique({
      where: { id: user_id },
      include: {
        secondaryRoles: true
      }
    });

    if (!user) {
      return NextResponse.json({ 
        message: 'Accès refusé' 
      }, { status: 404 });
    }

    // Vérifier que l'utilisateur est actif
    if (user.status !== 'ACTIVE') {
      return NextResponse.json({ 
        message: 'Compte utilisateur inactif ou suspendu' 
      }, { status: 403 });
    }

    // Vérifier que le rôle fourni appartient bien à l'utilisateur
    const userRoles: Role[] = [user.role, ...user.secondaryRoles.map(sr => sr.role)];
    const isRoleValid = userRoles.includes(role as Role);

    if (!isRoleValid) {
      return NextResponse.json({ 
        message: "Accès refusé" 
      }, { status: 403 });
    }

    // Vérifier si le rôle secondaire n'est pas expiré
    if (role !== user.role) {
      const secondaryRole = user.secondaryRoles.find(sr => sr.role === role);
      if (secondaryRole?.expiresAt && new Date(secondaryRole.expiresAt) < new Date()) {
        return NextResponse.json({ 
          message: 'Ce rôle secondaire a expiré' 
        }, { status: 403 });
      }
    }

    // Vérifier les permissions
    const canView = hasPermission(role as Role, 'articles.create');

    if (!canView) {
      return NextResponse.json({ 
        message: "Vous n'êtes pas autorisé à voir les variants des produits." 
      }, { status: 403 });
    }

    // Vérifier que le modèle existe
    const model = await db.productModel.findUnique({
      where: { id: modelId },
      select: {
        id: true,
        designation: true,
        reference: true
      }
    });

    if (!model) {
      return NextResponse.json({ 
        message: 'Modèle de produit introuvable' 
      }, { status: 404 });
    }

    // Récupérer les variants (stockages) disponibles pour ce modèle
    const variants = await db.productVariant.findMany({
      where: { 
        modelId: modelId,
        storeId: store_id
      },
    });


    return NextResponse.json({ 
      variants_specifique: variants,
      model: {
        id: model.id,
        designation: model.designation,
        reference: model.reference
      },
      total: variants.length
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching model storages:', error);
    return NextResponse.json(
      { message: 'Erreur lors de la récupération des stockages' },
      { status: 500 }
    );
  }
}