import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * POST /api/upload/review-images
 * Upload des images d'avis dans le dossier public/reviews/
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('images') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { message: 'Aucune image fournie' },
        { status: 400 }
      );
    }

    const uploadedUrls: string[] = [];

    // Créer le dossier si nécessaire
    const uploadsDir = join(process.cwd(), 'public', 'reviews');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    for (const file of files) {
      // Vérifier que c'est bien une image
      if (!file.type.startsWith('image/')) {
        continue;
      }

      // Générer un nom unique
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const extension = file.name.split('.').pop() || 'jpg';
      const fileName = `review_${timestamp}_${randomString}.${extension}`;

      // Convertir le fichier en buffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Sauvegarder le fichier
      const filePath = join(uploadsDir, fileName);
      await writeFile(filePath, buffer);

      // Ajouter l'URL publique
      uploadedUrls.push(`/reviews/${fileName}`);
    }

    return NextResponse.json({
      success: true,
      urls: uploadedUrls,
      count: uploadedUrls.length
    });

  } catch (error) {
    console.error('❌ Erreur upload images:', error);
    return NextResponse.json(
      { message: 'Erreur lors de l\'upload des images' },
      { status: 500 }
    );
  }
}

