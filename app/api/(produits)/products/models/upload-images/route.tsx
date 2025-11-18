import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

// Types pour la validation
interface UploadedFileInfo {
  url: string;
  fileName: string;
  originalName: string;
  displayOrder: number;
  size: number;
}

// Configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * Normalise un nom de fichier/dossier
 * Enlève les caractères spéciaux et les espaces
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD') // Décompose les caractères accentués
    .replace(/[\u0300-\u036f]/g, '') // Enlève les accents
    .replace(/[^a-z0-9]/g, '-') // Remplace tout sauf lettres et chiffres par des tirets
    .replace(/-+/g, '-') // Remplace les tirets multiples par un seul
    .replace(/^-|-$/g, ''); // Enlève les tirets au début et à la fin
}

/**
 * Valide le type de fichier
 */
function validateFileType(file: File): boolean {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
    return false;
  }
  
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return false;
  }
  
  return true;
}

/**
 * Valide la taille du fichier
 */
function validateFileSize(file: File): boolean {
  return file.size <= MAX_FILE_SIZE;
}

/**
 * Génère un nom de fichier unique
 */
function generateUniqueFileName(originalName: string, index: number): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  
  return `${index + 1}-${timestamp}-${random}.${extension}`;
}

export async function POST(request: Request) {
  try {
    // ===========================
    // 1. RÉCUPÉRER LES DONNÉES
    // ===========================
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const modelName = formData.get('modelName') as string;
    const colorName = formData.get('colorName') as string;

    console.log('📥 Requête d\'upload reçue:', {
      filesCount: files.length,
      modelName,
      colorName
    });

    // ===========================
    // 2. VALIDATION DES DONNÉES
    // ===========================
    
    // Vérifier qu'il y a des fichiers
    if (!files || files.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Aucun fichier fourni' 
        }, 
        { status: 400 }
      );
    }

    // Vérifier les métadonnées
    if (!modelName || !colorName) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Nom du modèle et couleur requis' 
        }, 
        { status: 400 }
      );
    }

    // Valider chaque fichier
    const validationErrors: string[] = [];
    
    files.forEach((file, index) => {
      if (!validateFileType(file)) {
        validationErrors.push(
          `Fichier ${index + 1} (${file.name}): Type non autorisé. Formats acceptés: ${ALLOWED_EXTENSIONS.join(', ')}`
        );
      }
      
      if (!validateFileSize(file)) {
        validationErrors.push(
          `Fichier ${index + 1} (${file.name}): Taille trop grande. Maximum: ${MAX_FILE_SIZE / (1024 * 1024)}MB`
        );
      }
    });

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Validation échouée',
          errors: validationErrors 
        }, 
        { status: 400 }
      );
    }

    // ===========================
    // 3. PRÉPARER LES DOSSIERS
    // ===========================
    
    // Normaliser les noms
    const normalizedModelName = normalizeName(modelName);
    const normalizedColorName = normalizeName(colorName);

    console.log('📁 Noms normalisés:', {
      model: normalizedModelName,
      color: normalizedColorName
    });

    // Créer le chemin du dossier
    const uploadDir = path.join(
      process.cwd(), 
      'public', 
      'assets', 
      normalizedModelName, 
      normalizedColorName
    );

    console.log('📂 Chemin de destination:', uploadDir);

    // Créer les dossiers s'ils n'existent pas
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
      console.log('✅ Dossiers créés');
    } else {
      console.log('ℹ️ Dossiers existants');
    }

    // ===========================
    // 4. UPLOADER LES FICHIERS
    // ===========================
    
    const uploadedFiles: UploadedFileInfo[] = [];
    const uploadErrors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        console.log(`📤 Upload du fichier ${i + 1}/${files.length}: ${file.name}`);

        // Lire le fichier
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Générer un nom de fichier unique
        const fileName = generateUniqueFileName(file.name, i);
        const filePath = path.join(uploadDir, fileName);

        // Écrire le fichier
        await writeFile(filePath, buffer);

        // Construire l'URL publique
        const publicUrl = `/assets/${normalizedModelName}/${normalizedColorName}/${fileName}`;

        uploadedFiles.push({
          url: publicUrl,
          fileName: fileName,
          originalName: file.name,
          displayOrder: i,
          size: file.size
        });

        console.log(`✅ Fichier ${i + 1} uploadé: ${fileName}`);

      } catch (error) {
        const errorMsg = `Erreur lors de l'upload de ${file.name}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`;
        console.error(`❌ ${errorMsg}`);
        uploadErrors.push(errorMsg);
      }
    }

    // ===========================
    // 5. VÉRIFIER LES RÉSULTATS
    // ===========================
    
    if (uploadedFiles.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Aucun fichier n\'a pu être uploadé',
          errors: uploadErrors 
        }, 
        { status: 500 }
      );
    }

    // Si certains fichiers ont échoué mais pas tous
    if (uploadErrors.length > 0) {
      console.warn('⚠️ Upload partiel:', {
        success: uploadedFiles.length,
        failed: uploadErrors.length
      });
    }

    // ===========================
    // 6. RÉPONSE SUCCESS
    // ===========================
    
    const response = {
      success: true,
      message: `${uploadedFiles.length} fichier(s) uploadé(s) avec succès${uploadErrors.length > 0 ? ` (${uploadErrors.length} échec(s))` : ''}`,
      files: uploadedFiles,
      summary: {
        total: files.length,
        success: uploadedFiles.length,
        failed: uploadErrors.length,
        totalSize: uploadedFiles.reduce((sum, f) => sum + f.size, 0),
        uploadPath: `/assets/${normalizedModelName}/${normalizedColorName}/`
      },
      ...(uploadErrors.length > 0 && { errors: uploadErrors })
    };

    console.log('✅ Upload terminé:', response.summary);

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    // ===========================
    // 7. GESTION DES ERREURS GLOBALES
    // ===========================
    
    console.error('❌ Erreur globale lors de l\'upload:', error);
    
    return NextResponse.json(
      { 
        success: false,
        message: 'Erreur interne du serveur lors de l\'upload des images',
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        details: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.stack : String(error))
          : undefined
      },
      { status: 500 }
    );
  }
}

// ===========================
// OPTIONNEL: DELETE ENDPOINT
// ===========================

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');

    if (!filePath) {
      return NextResponse.json(
        { message: 'Chemin du fichier requis' },
        { status: 400 }
      );
    }

    const fullPath = path.join(process.cwd(), 'public', filePath);

    // Vérifier que le fichier existe
    if (!existsSync(fullPath)) {
      return NextResponse.json(
        { message: 'Fichier non trouvé' },
        { status: 404 }
      );
    }

    // Supprimer le fichier
    const { unlink } = await import('fs/promises');
    await unlink(fullPath);

    console.log(`🗑️ Fichier supprimé: ${filePath}`);

    return NextResponse.json({
      success: true,
      message: 'Fichier supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    
    return NextResponse.json(
      { 
        message: 'Erreur lors de la suppression du fichier',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}