import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import { db } from '@/lib/db';

// ============================================
// TYPES ET INTERFACES
// ============================================

interface UploadedDocumentInfo {
  url: string;
  fileName: string;
  originalName: string;
  size: number;
  uploadedAt: Date;
}

// ============================================
// CONFIGURATION
// ============================================

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'docx', 'xlsx'];
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

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
 * Génère un nom de fichier unique et sécurisé
 */
function generateUniqueFileName(originalName: string, stockEntryId: string): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const extension = originalName.split('.').pop()?.toLowerCase() || 'pdf';
  
  // Nettoyer le nom original pour éviter les caractères spéciaux
  const cleanOriginalName = originalName
    .replace(/\.[^/.]+$/, '') // Enlever l'extension
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Enlever les accents
    .replace(/[^a-z0-9]/gi, '_') // Remplacer les caractères spéciaux par _
    .substring(0, 50); // Limiter la longueur
  
  return `doc_${stockEntryId}_${cleanOriginalName}_${timestamp}_${random}.${extension}`;
}

// ============================================
// POST - UPLOAD DOCUMENT
// ============================================

export async function POST(request: Request) {
  try {
    console.log('📥 Début de l\'upload de document justificatif...');

    // ===========================
    // 1. RÉCUPÉRER LES DONNÉES
    // ===========================
    const formData = await request.formData();
    const file = formData.get('document') as File;
    const stockEntryId = formData.get('stockEntryId') as string;

    console.log('📋 Données reçues:', {
      hasFile: !!file,
      stockEntryId,
      fileName: file?.name,
      fileSize: file?.size
    });

    // ===========================
    // 2. VALIDATION DES DONNÉES
    // ===========================
    
    // Vérifier qu'un fichier est fourni
    if (!file || !file.size) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Aucun fichier fourni' 
        }, 
        { status: 400 }
      );
    }

    // Vérifier que l'ID de l'entrée en stock est fourni
    if (!stockEntryId) {
      return NextResponse.json(
        { 
          success: false,
          message: 'ID de l\'entrée en stock requis' 
        }, 
        { status: 400 }
      );
    }

    // Valider le type de fichier
    if (!validateFileType(file)) {
      return NextResponse.json(
        { 
          success: false,
          message: `Type de fichier non autorisé. Formats acceptés: ${ALLOWED_EXTENSIONS.join(', ')}`,
          receivedType: file.type
        }, 
        { status: 400 }
      );
    }

    // Valider la taille du fichier
    if (!validateFileSize(file)) {
      return NextResponse.json(
        { 
          success: false,
          message: `Fichier trop volumineux. Taille maximum: ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
          receivedSize: `${(file.size / (1024 * 1024)).toFixed(2)}MB`
        }, 
        { status: 400 }
      );
    }

    console.log('✅ Validation du fichier réussie');

    // ===========================
    // 3. PRÉPARER LE DOSSIER
    // ===========================
    
    // Créer le chemin: public/Document justificatif d,entrer stock/{stockEntryId}/
    const uploadDir = path.join(
      process.cwd(), 
      'public', 
      'Document justificatif d,entrer stock',
      stockEntryId
    );

    console.log('📂 Chemin de destination:', uploadDir);

    // Créer les dossiers s'ils n'existent pas
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
      console.log('✅ Dossiers créés avec succès');
    } else {
      console.log('ℹ️ Dossiers déjà existants');
    }

    // ===========================
    // 4. UPLOADER LE FICHIER
    // ===========================
    
    console.log(`📤 Upload du fichier: ${file.name}`);

    // Lire le fichier
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Générer un nom de fichier unique
    const fileName = generateUniqueFileName(file.name, stockEntryId);
    const filePath = path.join(uploadDir, fileName);

    // Écrire le fichier sur le disque
    await writeFile(filePath, buffer);

    // Construire l'URL publique
    const publicUrl = `/Document justificatif d,entrer stock/${stockEntryId}/${fileName}`;

    const uploadedDocument: UploadedDocumentInfo = {
      url: publicUrl,
      fileName: fileName,
      originalName: file.name,
      size: file.size,
      uploadedAt: new Date()
    };

    console.log('✅ Fichier uploadé avec succès:', fileName);

    // ===========================
    // 5. SAUVEGARDER EN BASE DE DONNÉES
    // ===========================

    await db.stockEntry.update({
        where: { id: stockEntryId },
        data: {
            documentFile: publicUrl
        }
    });

    console.log('✅ Document enregistré en BD pour l\'entrée:', stockEntryId);

    // ===========================
    // 6. RÉPONSE SUCCESS
    // ===========================
    
    const response = {
      success: true,
      message: 'Document justificatif uploadé avec succès',
      document: uploadedDocument,
      summary: {
        uploadPath: `/Document justificatif d,entrer stock/${stockEntryId}/`,
        fileSize: `${(file.size / 1024).toFixed(2)} KB`,
        fileType: file.type
      }
    };

    console.log('✅ Upload terminé:', response.summary);

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    // ===========================
    // 6. GESTION DES ERREURS
    // ===========================
    
    console.error('❌ Erreur lors de l\'upload du document:', error);
    
    return NextResponse.json(
      { 
        success: false,
        message: 'Erreur interne du serveur lors de l\'upload du document',
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        details: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.stack : String(error))
          : undefined
      },
      { status: 500 }
    );
  }
}

// // ============================================
// // DELETE - SUPPRIMER UN DOCUMENT
// // ============================================

// export async function DELETE(request: Request) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const filePath = searchParams.get('path');

//     console.log('🗑️ Tentative de suppression du document:', filePath);

//     if (!filePath) {
//       return NextResponse.json(
//         { 
//           success: false,
//           message: 'Chemin du fichier requis' 
//         },
//         { status: 400 }
//       );
//     }

//     // Construire le chemin complet
//     const fullPath = path.join(process.cwd(), 'public', filePath);

//     // Vérifier que le fichier existe
//     if (!existsSync(fullPath)) {
//       return NextResponse.json(
//         { 
//           success: false,
//           message: 'Fichier non trouvé' 
//         },
//         { status: 404 }
//       );
//     }

//     // Vérifier que le fichier est bien dans le bon dossier (sécurité)
//     if (!fullPath.includes('Document justificatif d,entrer stock')) {
//       return NextResponse.json(
//         { 
//           success: false,
//           message: 'Accès non autorisé à ce fichier' 
//         },
//         { status: 403 }
//       );
//     }

//     // Supprimer le fichier
//     const { unlink } = await import('fs/promises');
//     await unlink(fullPath);

//     console.log('✅ Fichier supprimé avec succès:', filePath);

//     return NextResponse.json({
//       success: true,
//       message: 'Document supprimé avec succès'
//     });

//   } catch (error) {
//     console.error('❌ Erreur lors de la suppression du document:', error);
    
//     return NextResponse.json(
//       { 
//         success: false,
//         message: 'Erreur lors de la suppression du document',
//         error: error instanceof Error ? error.message : 'Erreur inconnue'
//       },
//       { status: 500 }
//     );
//   }
// }

// // ============================================
// // GET - RÉCUPÉRER LES DOCUMENTS D'UNE ENTRÉE
// // ============================================

// export async function GET(request: Request) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const stockEntryId = searchParams.get('stockEntryId');

//     if (!stockEntryId) {
//       return NextResponse.json(
//         { 
//           success: false,
//           message: 'ID de l\'entrée en stock requis' 
//         },
//         { status: 400 }
//       );
//     }

//     const uploadDir = path.join(
//       process.cwd(), 
//       'public', 
//       'Document justificatif d,entrer stock',
//       stockEntryId
//     );

//     // Vérifier si le dossier existe
//     if (!existsSync(uploadDir)) {
//       return NextResponse.json({
//         success: true,
//         message: 'Aucun document trouvé pour cette entrée en stock',
//         documents: []
//       });
//     }

//     // Lire les fichiers du dossier
//     const { readdir, stat } = await import('fs/promises');
//     const files = await readdir(uploadDir);
    
//     const documents = await Promise.all(
//       files.map(async (fileName) => {
//         const filePath = path.join(uploadDir, fileName);
//         const fileStats = await stat(filePath);
        
//         return {
//           url: `/Document justificatif d,entrer stock/${stockEntryId}/${fileName}`,
//           fileName: fileName,
//           size: fileStats.size,
//           uploadedAt: fileStats.birthtime
//         };
//       })
//     );

//     return NextResponse.json({
//       success: true,
//       message: `${documents.length} document(s) trouvé(s)`,
//       documents: documents
//     });

//   } catch (error) {
//     console.error('❌ Erreur lors de la récupération des documents:', error);
    
//     return NextResponse.json(
//       { 
//         success: false,
//         message: 'Erreur lors de la récupération des documents',
//         error: error instanceof Error ? error.message : 'Erreur inconnue'
//       },
//       { status: 500 }
//     );
//   }
// }