import { db } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

/**
 * Génère un token de vérification d'email
 */
export const generateVerificationToken = async (email: string) => {
    const token = uuidv4()
    const expires = new Date(new Date().getTime() + 3600 * 1000) // 1 heure

    // Supprimer les tokens existants pour cet email
    await db.verificationToken.deleteMany({
        where: { 
            identifier: email,
            type: 'EMAIL_VERIFICATION'
        }
    })

    // Créer un nouveau token
    const verificationToken = await db.verificationToken.create({
        data: {
            identifier: email,
            token,
            expires,
            type: 'EMAIL_VERIFICATION'
        }
    })

    return verificationToken
}

/**
 * Génère un token de réinitialisation de mot de passe
 */
export const generatePasswordResetToken = async (email: string) => {
    const token = uuidv4()
    const expires = new Date(new Date().getTime() + 3600 * 1000) // 1 heure

    // Supprimer les tokens existants pour cet email
    await db.verificationToken.deleteMany({
        where: { 
            identifier: email,
            type: 'PASSWORD_RESET'
        }
    })

    // Créer un nouveau token
    const passwordResetToken = await db.verificationToken.create({
        data: {
            identifier: email,
            token,
            expires,
            type: 'PASSWORD_RESET'
        }
    })

    return passwordResetToken
}

/**
 * Vérifie un token de vérification d'email
 */
export const verifyEmailToken = async (token: string) => {
    const existingToken = await db.verificationToken.findFirst({
        where: { 
            token,
            type: 'EMAIL_VERIFICATION'
        }
    })

    if (!existingToken) {
        return { error: 'Token invalide' }
    }

    const hasExpired = new Date(existingToken.expires) < new Date()

    if (hasExpired) {
        return { error: 'Token expiré' }
    }

    return { token: existingToken }
}

/**
 * Vérifie un token de réinitialisation de mot de passe
 */
export const verifyPasswordResetToken = async (token: string) => {
    const existingToken = await db.verificationToken.findFirst({
        where: { 
            token,
            type: 'PASSWORD_RESET'
        }
    })

    if (!existingToken) {
        return { error: 'Token invalide' }
    }

    const hasExpired = new Date(existingToken.expires) < new Date()

    if (hasExpired) {
        return { error: 'Token expiré' }
    }

    return { token: existingToken }
}

