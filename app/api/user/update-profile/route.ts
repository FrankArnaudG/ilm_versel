import { NextResponse } from 'next/server'
import { auth } from '@/ts/auth'
import { db } from '@/lib/db'

export async function PATCH(request: Request) {
    try {
        // Vérifier l'authentification
        const session = await auth()

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Non authentifié' },
                { status: 401 }
            )
        }

        // Récupérer les données
        const body = await request.json()
        const { name } = body

        // Validation
        if (!name || name.trim().length < 2) {
            return NextResponse.json(
                { error: 'Le nom doit contenir au moins 2 caractères' },
                { status: 400 }
            )
        }

        if (name.length > 50) {
            return NextResponse.json(
                { error: 'Le nom ne peut pas dépasser 50 caractères' },
                { status: 400 }
            )
        }

        // Mettre à jour l'utilisateur
        const updatedUser = await db.user.update({
            where: { email: session.user.email },
            data: { name: name.trim() },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Profil mis à jour avec succès',
            user: updatedUser
        })

    } catch (error) {
        console.error('Erreur lors de la mise à jour du profil:', error)
        return NextResponse.json(
            { error: 'Erreur lors de la mise à jour du profil' },
            { status: 500 }
        )
    }
}

