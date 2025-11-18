import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET - Liste des adresses
export async function GET(request: NextRequest) {
  try {
    const user = await  currentUser();
    
    if (!user) {
      return NextResponse.json(
        { message: 'Accès refusé' },
        { status: 401 }
      );
    }

    const addresses = await db.address.findMany({
      where: { 
        userId: user.id,
        deletedAt: null // Uniquement les adresses actives
      },
      orderBy: [
        { isDefaultShipping: 'desc' },
        { isDefaultBilling: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({
      success: true,
      addresses
    });

  } catch (error) {
    console.error('Erreur récupération adresses:', error);
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Créer une adresse
export async function POST(request: NextRequest) {
  try {
    
    const body = await request.json();
    const {
        // user_id,
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
    } = body;

    const user = await currentUser();

    if (!user) {
      return NextResponse.json(
        { message: 'Accès refusé' },
        { status: 401 }
      );
    }

    const user_id = user.id;

    // Validation
    if (!fullName || !phone || !addressLine1 || !postalCode || !city) {
      return NextResponse.json(
        { message: 'Accès refusé' },
        { status: 400 }
      );
    }

    // Si défini comme par défaut, retirer le statut des autres
    if (isDefaultShipping) {
      await db.address.updateMany({
        where: {
          userId: user_id,
          isDefaultShipping: true,
          deletedAt: null // Uniquement les adresses actives
        },
        data: {
          isDefaultShipping: false
        }
      });
    }

    if (isDefaultBilling) {
      await db.address.updateMany({
        where: {
          userId: user_id,
          isDefaultBilling: true,
          deletedAt: null // Uniquement les adresses actives
        },
        data: {
          isDefaultBilling: false
        }
      });
    }

    // Créer l'adresse
    const address = await db.address.create({
      data: {
        userId: user_id,
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
      address
    }, { status: 201 });

  } catch (error) {
    console.error('Erreur création adresse:', error);
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}