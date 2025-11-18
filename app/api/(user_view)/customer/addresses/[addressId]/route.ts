import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// PATCH - Modifier une adresse
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

    const {
      label,
      civility,
      fullName,
      phone,
      country,
      city,
      postalCode,
      addressLine1,
      addressLine2,
      isDefaultShipping,
      isDefaultBilling
    } = await request.json();

    // Validation
    if (!fullName || !phone || !addressLine1 || !postalCode || !city) {
      return NextResponse.json(
        { message: 'Champs requis manquants' },
        { status: 400 }
      );
    }

    // Vérifier que l'adresse appartient bien à l'utilisateur
    const existingAddress = await db.address.findUnique({
      where: { id: addressId }
    });

    if (!existingAddress || existingAddress.userId !== user.id) {
      return NextResponse.json(
        { message: 'Adresse non trouvée' },
        { status: 404 }
      );
    }

    // Si défini comme par défaut, retirer le statut des autres adresses
    if (isDefaultShipping) {
      await db.address.updateMany({
        where: {
          userId: user.id,
          isDefaultShipping: true,
          deletedAt: null, // Uniquement les adresses actives
          id: { not: addressId }
        },
        data: {
          isDefaultShipping: false
        }
      });
    }

    if (isDefaultBilling) {
      await db.address.updateMany({
        where: {
          userId: user.id,
          isDefaultBilling: true,
          deletedAt: null, // Uniquement les adresses actives
          id: { not: addressId }
        },
        data: {
          isDefaultBilling: false
        }
      });
    }

    // Mettre à jour l'adresse
    const updatedAddress = await db.address.update({
      where: { id: addressId },
      data: {
        label: label || '',
        civility,
        fullName,
        phone,
        country: country || 'FR',
        city,
        postalCode,
        addressLine1,
        addressLine2: addressLine2 || '',
        isDefaultShipping: isDefaultShipping || false,
        isDefaultBilling: isDefaultBilling || false
      }
    });

    return NextResponse.json({
      success: true,
      address: updatedAddress
    });

  } catch (error) {
    console.error('Erreur modification adresse:', error);
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une adresse
export async function DELETE(
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

    // Vérifier que l'adresse appartient bien à l'utilisateur
    const existingAddress = await db.address.findUnique({
      where: { id: addressId }
    });

    if (!existingAddress || existingAddress.userId !== user.id) {
      return NextResponse.json(
        { message: 'Adresse non trouvée' },
        { status: 404 }
      );
    }

    // Supprimer l'adresse
    // SOFT DELETE : Marquer comme supprimée
    await db.address.update({
      where: { id: addressId },
      data: { 
        deletedAt: new Date(),
        // Retirer les statuts par défaut lors de la suppression
        isDefaultShipping: false,
        isDefaultBilling: false
      }
    });

    // ✅ Si c'était une adresse par défaut, définir une autre adresse comme par défaut
    if (existingAddress.isDefaultShipping) {
      // Trouver la prochaine adresse active pour la livraison
      const nextShippingAddress = await db.address.findFirst({
        where: {
          userId: user.id,
          deletedAt: null,
          id: { not: addressId }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (nextShippingAddress) {
        await db.address.update({
          where: { id: nextShippingAddress.id },
          data: { isDefaultShipping: true }
        });
      }
    }

    if (existingAddress.isDefaultBilling) {
      // Trouver la prochaine adresse active pour la facturation
      const nextBillingAddress = await db.address.findFirst({
        where: {
          userId: user.id,
          deletedAt: null,
          id: { not: addressId }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (nextBillingAddress) {
        await db.address.update({
          where: { id: nextBillingAddress.id },
          data: { isDefaultBilling: true }
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Adresse supprimée'
    });

  } catch (error) {
    console.error('Erreur suppression adresse:', error);
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}