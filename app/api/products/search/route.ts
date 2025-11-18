import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters' },
        { status: 400 }
      );
    }

    // Rechercher les produits
    const products = await db.productModel.findMany({
      where: {
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
        ],
        status: 'ACTIVE',
      },
      take: limit,
      select: {
        id: true,
        designation: true,
        brand: true,
        category: true,
        reference: true,
        description: true,
        specifications: true,
        averageRating: true,
        totalReviews: true,
        colors: {
          take: 1,
          include: {
            images: {
              take: 1,
              orderBy: {
                displayOrder: 'asc',
              },
            },
          },
        },
        variants: {
          take: 1,
          orderBy: {
            pvTTC: 'asc',
          },
        },
      },
    });

    // Formater les résultats
    const formattedProducts = products.map((product) => ({
      id: product.id,
      name: product.designation,
      brand: product.brand,
      category: product.category,
      reference: product.reference,
      description: product.description,
      specifications: product.specifications,
      rating: product.averageRating?.toString() || null,
      totalReviews: product.totalReviews,
      image: product.colors[0]?.images[0]?.url || '/assets/mobile-phone.png',
      price: product.variants[0]?.pvTTC ? Number(product.variants[0].pvTTC) : 0,
      oldPrice: product.variants[0]?.oldPrice ? Number(product.variants[0].oldPrice) : null,
    }));

    return NextResponse.json({ products: formattedProducts });
  } catch (error) {
    console.error('Error searching products:', error);
    return NextResponse.json(
      { error: 'Failed to search products' },
      { status: 500 }
    );
  }
}


