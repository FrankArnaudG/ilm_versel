import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { Prisma } from '@prisma/client';

// ============================================
// GET - RÉCUPÉRER TOUTES LES COMMANDES
// ============================================
export async function GET(req: NextRequest) {
  try {
    const userSession = await currentUser();
    
    if (!userSession?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Récupérer les paramètres de recherche
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Calculer le skip pour la pagination
    const skip = (page - 1) * limit;

    // Construire les filtres
    const where: Prisma.OrderWhereInput = {};

    // Filtre par statut
    if (status && status !== 'ALL') {
      where.status = status as Prisma.EnumOrderStatusFilter;
    }

    // Filtre par recherche (numéro de commande ou client ID)
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { user: { clientId: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }

    // Récupérer le nombre total de commandes
    const totalOrders = await db.order.count({ where });

    // Récupérer les commandes avec pagination
    const orders = await db.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            clientId: true
          }
        },
        shippingAddress: true,
        billingAddress: true,
        store: {
          select: {
            id: true,
            name: true,
            country: true
          }
        },
        items: {
          include: {
            article: {
              select: {
                articleNumber: true,
                status: true
              }
            }
          }
        },
        _count: {
          select: {
            items: true
          }
        }
      }
    });

    // Formater les données pour le frontend
    const formattedOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      clientId: order.user.clientId || 'N/A',
      customerName: order.user.name || order.user.email,
      customerEmail: order.user.email,
      status: order.status,
      paymentStatus: order.paymentStatus,
      shippingStatus: order.shippingStatus,
      totalAmount: Number(order.totalAmount),
      itemsCount: order._count.items,
      locality: order.locality,
      storeName: order.store.name,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      shippingAddress: {
        fullName: order.shippingFullName || order.shippingAddress.fullName,
        city: order.shippingCity || order.shippingAddress.city,
        country: order.shippingCountry || order.shippingAddress.country
      }
    }));

    return NextResponse.json({
      success: true,
      data: {
        orders: formattedOrders,
        pagination: {
          page,
          limit,
          total: totalOrders,
          totalPages: Math.ceil(totalOrders / limit)
        }
      }
    });

  } catch (error: unknown) {
    // ✅ Type guard pour extraire le message d'erreur
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error('❌ Erreur récupération commandes:', errorMessage);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur lors de la récupération des commandes',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}