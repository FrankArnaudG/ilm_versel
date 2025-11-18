import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// PATCH - Définir une adresse comme par défaut
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ addressId: string }> }
) {
  try {
    const { addressId } = await params;
    const user = await currentUser();

    if (!user) {
      return NextResponse.json(
        { message: 'Accès refusé' },
        { status: 401 }
      );
    }

    const { type } = await request.json(); // 'shipping' ou 'billing'

    // Validation
    if (!type || !['shipping', 'billing'].includes(type)) {
      return NextResponse.json(
        { message: 'Type invalide. Utilisez "shipping" ou "billing"' },
        { status: 400 }
      );
    }

    // Vérifier que l'adresse appartient à l'utilisateur ET n'est pas supprimée
    const existingAddress = await db.address.findUnique({
      where: { id: addressId }
    });

    if (!existingAddress || existingAddress.userId !== user.id || existingAddress.deletedAt !== null) {
      return NextResponse.json(
        { message: 'Adresse non trouvée' },
        { status: 404 }
      );
    }

    // Retirer le statut par défaut des autres adresses ACTIVES et définir celle-ci
    if (type === 'shipping') {
      // Retirer isDefaultShipping des autres adresses actives
      await db.address.updateMany({
        where: {
          userId: user.id,
          isDefaultShipping: true,
          deletedAt: null, // 🔥 Uniquement les adresses actives
          id: { not: addressId }
        },
        data: {
          isDefaultShipping: false
        }
      });

      // Définir cette adresse comme par défaut pour la livraison
      await db.address.update({
        where: { id: addressId },
        data: {
          isDefaultShipping: true
        }
      });
    } else if (type === 'billing') {
      // Retirer isDefaultBilling des autres adresses actives
      await db.address.updateMany({
        where: {
          userId: user.id,
          isDefaultBilling: true,
          deletedAt: null, // 🔥 Uniquement les adresses actives
          id: { not: addressId }
        },
        data: {
          isDefaultBilling: false
        }
      });

      // Définir cette adresse comme par défaut pour la facturation
      await db.address.update({
        where: { id: addressId },
        data: {
          isDefaultBilling: true
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: `Adresse par défaut ${type === 'shipping' ? 'de livraison' : 'de facturation'} mise à jour`
    });

  } catch (error) {
    console.error('Erreur mise à jour adresse par défaut:', error);
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}