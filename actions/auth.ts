'use server'

import * as z from 'zod'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { signIn } from '@/ts/auth'
import { DEFAULT_REDIRECT } from '@/ts/routes'
import { AuthError } from 'next-auth'
import { 
    LoginSchema, 
    RegisterSchema, 
    ForgotPasswordSchema, 
    ResetPasswordSchema,
    ChangePasswordSchema 
} from '@/lib/schemas'
import { 
    generateVerificationToken, 
    generatePasswordResetToken,
    verifyEmailToken,
    verifyPasswordResetToken 
} from '@/lib/tokens'
import { sendVerificationEmail, sendPasswordResetEmail } from '@/lib/mail'
import { auth } from '@/ts/auth'

/**
 * Action de connexion avec email et mot de passe
 */
export const login = async (values: z.infer<typeof LoginSchema>) => {
    const validatedFields = LoginSchema.safeParse(values)

    if (!validatedFields.success) {
        return { error: 'Champs invalides' }
    }

    const { email, password } = validatedFields.data

    // Vérifier si l'utilisateur existe
    const existingUser = await db.user.findUnique({
        where: { email }
    })

    if (!existingUser || !existingUser.email || !existingUser.password) {
        return { error: 'Email ou mot de passe incorrect' }
    }

    // Vérifier si l'email est vérifié
    if (!existingUser.emailVerified) {
        const verificationToken = await generateVerificationToken(existingUser.email)
        await sendVerificationEmail(existingUser.email, verificationToken.token)
        return { error: 'Email non vérifié. Un nouveau lien de vérification a été envoyé.' }
    }

    // Vérifier le mot de passe
    const passwordMatch = await bcrypt.compare(password, existingUser.password)

    if (!passwordMatch) {
        return { error: 'Email ou mot de passe incorrect' }
    }

    // Connexion avec NextAuth
    try {
        await signIn('credentials', {
            email,
            password,
            redirectTo: DEFAULT_REDIRECT
        })

        return { success: 'Connexion réussie' }
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return { error: 'Email ou mot de passe incorrect' }
                default:
                    return { error: 'Une erreur est survenue' }
            }
        }
        throw error
    }
}

/**
 * Action d'inscription avec email et mot de passe
 */
export const register = async (values: z.infer<typeof RegisterSchema>) => {
    const validatedFields = RegisterSchema.safeParse(values)

    if (!validatedFields.success) {
        return { error: 'Champs invalides' }
    }

    const { name, email, password } = validatedFields.data

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await db.user.findUnique({
        where: { email }
    })

    if (existingUser) {
        return { error: 'Cet email est déjà utilisé' }
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10)

    // Créer l'utilisateur
    const user = await db.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
        }
    })

    // Générer un token de vérification
    const verificationToken = await generateVerificationToken(email)

    // Envoyer l'email de vérification
    await sendVerificationEmail(email, verificationToken.token)

    return { success: 'Email de vérification envoyé. Veuillez vérifier votre boîte de réception.' }
}

/**
 * Action de vérification d'email
 */
export const verifyEmail = async (token: string) => {
    const result = await verifyEmailToken(token)

    if (result.error) {
        return { error: result.error }
    }

    if (!result.token) {
        return { error: 'Token invalide' }
    }

    // Récupérer l'utilisateur
    const existingUser = await db.user.findUnique({
        where: { email: result.token.identifier }
    })

    if (!existingUser) {
        return { error: 'Utilisateur introuvable' }
    }

    // Mettre à jour l'utilisateur
    await db.user.update({
        where: { id: existingUser.id },
        data: {
            emailVerified: new Date(),
        }
    })

    // Supprimer le token
    await db.verificationToken.delete({
        where: {
            identifier_token: {
                identifier: result.token.identifier,
                token: result.token.token
            }
        }
    })

    return { success: 'Email vérifié avec succès' }
}

/**
 * Action de demande de réinitialisation de mot de passe
 */
export const forgotPassword = async (values: z.infer<typeof ForgotPasswordSchema>) => {
    const validatedFields = ForgotPasswordSchema.safeParse(values)

    if (!validatedFields.success) {
        return { error: 'Email invalide' }
    }

    const { email } = validatedFields.data

    // Vérifier si l'utilisateur existe
    const existingUser = await db.user.findUnique({
        where: { email }
    })

    if (!existingUser) {
        // Pour des raisons de sécurité, on retourne success même si l'utilisateur n'existe pas
        return { success: 'Si cet email existe, un lien de réinitialisation a été envoyé.' }
    }

    // Générer un token de réinitialisation
    const passwordResetToken = await generatePasswordResetToken(email)

    // Envoyer l'email
    await sendPasswordResetEmail(email, passwordResetToken.token)

    return { success: 'Si cet email existe, un lien de réinitialisation a été envoyé.' }
}

/**
 * Action de réinitialisation de mot de passe
 */
export const resetPassword = async (values: z.infer<typeof ResetPasswordSchema>) => {
    const validatedFields = ResetPasswordSchema.safeParse(values)

    if (!validatedFields.success) {
        return { error: 'Champs invalides' }
    }

    const { token, password } = validatedFields.data

    // Vérifier le token
    const result = await verifyPasswordResetToken(token)

    if (result.error) {
        return { error: result.error }
    }

    if (!result.token) {
        return { error: 'Token invalide' }
    }

    // Récupérer l'utilisateur
    const existingUser = await db.user.findUnique({
        where: { email: result.token.identifier }
    })

    if (!existingUser) {
        return { error: 'Utilisateur introuvable' }
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(password, 10)

    // Mettre à jour le mot de passe
    await db.user.update({
        where: { id: existingUser.id },
        data: {
            password: hashedPassword,
        }
    })

    // Supprimer le token
    await db.verificationToken.delete({
        where: {
            identifier_token: {
                identifier: result.token.identifier,
                token: result.token.token
            }
        }
    })

    return { success: 'Mot de passe réinitialisé avec succès' }
}

/**
 * Action de modification de mot de passe (pour utilisateur connecté)
 */
export const changePassword = async (values: z.infer<typeof ChangePasswordSchema>) => {
    const validatedFields = ChangePasswordSchema.safeParse(values)

    if (!validatedFields.success) {
        return { error: 'Champs invalides' }
    }

    const { currentPassword, newPassword } = validatedFields.data

    // Récupérer l'utilisateur connecté
    const session = await auth()

    if (!session?.user?.email) {
        return { error: 'Non authentifié' }
    }

    const user = await db.user.findUnique({
        where: { email: session.user.email }
    })

    if (!user || !user.password) {
        return { error: 'Utilisateur introuvable' }
    }

    // Vérifier le mot de passe actuel
    const passwordMatch = await bcrypt.compare(currentPassword, user.password)

    if (!passwordMatch) {
        return { error: 'Mot de passe actuel incorrect' }
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Mettre à jour le mot de passe
    await db.user.update({
        where: { id: user.id },
        data: {
            password: hashedPassword,
        }
    })

    return { success: 'Mot de passe modifié avec succès' }
}

