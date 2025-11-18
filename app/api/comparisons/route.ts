import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/ts/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const body = await req.json();
    const { productIds, sessionId } = body;

    // Validation
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0 || productIds.length > 3) {
      return NextResponse.json(
        { error: 'Invalid product IDs. Must be an array of 1 to 3 product IDs.' },
        { status: 400 }
      );
    }

    // Récupérer les informations de la requête
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Créer la comparaison
    const comparison = await db.productComparison.create({
      data: {
        userId: session?.user?.id || null,
        productIds,
        sessionId: sessionId || null,
        ipAddress,
        userAgent,
      },
    });

    return NextResponse.json(
      { 
        success: true, 
        comparison,
        message: 'Comparison saved successfully' 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error saving comparison:', error);
    
    // Retourner un message d'erreur plus détaillé
    const errorMessage = error instanceof Error ? error.message : 'Failed to save comparison';
    const errorDetails = error instanceof Error ? error.stack : String(error);
    
    console.error('Error details:', errorDetails);
    
    return NextResponse.json(
      { 
        error: 'Failed to save comparison',
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Récupérer les comparaisons de l'utilisateur
    const comparisons = await db.productComparison.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return NextResponse.json({ comparisons });
  } catch (error) {
    console.error('Error fetching comparisons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comparisons' },
      { status: 500 }
    );
  }
}

