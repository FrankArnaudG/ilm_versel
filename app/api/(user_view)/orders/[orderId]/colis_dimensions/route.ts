import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Non authentifié'
      }, { status: 401 });
    }

    const allowedRoles = ['SUPER_ADMIN', 'OPERATIONS_DIRECTOR', 'STORE_MANAGER'];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({
        success: false,
        error: 'Accès non autorisé'
      }, { status: 403 });
    }

    const { orderId } = await params;
    const body = await request.json();
    const { totalWeight, totalLength, totalWidth, totalHeight } = body;

    console.log('📦 Mise à jour des dimensions pour commande:', orderId);

    // Vérifier que la commande existe
    const order = await db.order.findUnique({
      where: { id: orderId },
      select: { id: true, orderNumber: true }
    });

    if (!order) {
      return NextResponse.json({
        success: false,
        error: 'Commande introuvable'
      }, { status: 404 });
    }

    // Mettre à jour les dimensions
    const updatedOrder = await db.order.update({
      where: { id: orderId },
      data: {
        totalWeight: totalWeight ? parseFloat(totalWeight) : null,
        totalLength: totalLength ? parseFloat(totalLength) : null,
        totalWidth: totalWidth ? parseFloat(totalWidth) : null,
        totalHeight: totalHeight ? parseFloat(totalHeight) : null
      },
      select: {
        id: true,
        orderNumber: true,
        totalWeight: true,
        totalLength: true,
        totalWidth: true,
        totalHeight: true
      }
    });

    console.log('✅ Dimensions mises à jour:', updatedOrder.orderNumber);

    return NextResponse.json({
      success: true,
      order: {
        ...updatedOrder,
        totalWeight: updatedOrder.totalWeight ? parseFloat(updatedOrder.totalWeight.toString()) : null,
        totalLength: updatedOrder.totalLength ? parseFloat(updatedOrder.totalLength.toString()) : null,
        totalWidth: updatedOrder.totalWidth ? parseFloat(updatedOrder.totalWidth.toString()) : null,
        totalHeight: updatedOrder.totalHeight ? parseFloat(updatedOrder.totalHeight.toString()) : null
      },
      message: 'Dimensions sauvegardées avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur sauvegarde dimensions:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la sauvegarde des dimensions',
    }, { status: 500 });
  }
}