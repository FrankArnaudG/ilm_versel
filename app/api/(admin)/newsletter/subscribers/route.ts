// ============================================
// app/api/(admin)/newsletter/subscribers/route.ts
// GET - Récupérer la liste des souscripteurs à la newsletter (SuperAdmin uniquement)
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Vérifier que l'utilisateur est un SuperAdmin
    const user = await currentUser();
    
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { message: 'Accès refusé. Seuls les SuperAdmin peuvent accéder à cette ressource.' },
        { status: 403 }
      );
    }

    // Récupérer les paramètres de recherche et pagination
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Construire la condition de recherche
    const where = search
      ? {
          email: {
            contains: search,
            mode: 'insensitive' as const,
          },
        }
      : {};

    // Récupérer les souscripteurs avec pagination
    const [subscribers, total] = await Promise.all([
      db.newsletterSubscriber.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      db.newsletterSubscriber.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      subscribers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des souscripteurs:', error);
    return NextResponse.json(
      { message: 'Erreur serveur lors de la récupération des souscripteurs' },
      { status: 500 }
    );
  }
}

