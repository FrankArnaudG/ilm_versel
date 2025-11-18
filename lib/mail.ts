import { Resend } from 'resend'

const resend = new Resend(process.env.AUTH_RESEND_KEY)

const domain = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

/**
 * Envoie un email de vérification avec un lien de confirmation
 */
export const sendVerificationEmail = async (email: string, token: string) => {
    const confirmLink = `${domain}/verify-email?token=${token}`

    try {
        await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: email,
            subject: 'Confirmez votre adresse email',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #800080;">Bienvenue !</h2>
                    <p>Merci de vous être inscrit. Veuillez cliquer sur le lien ci-dessous pour vérifier votre adresse email :</p>
                    <a href="${confirmLink}" 
                       style="display: inline-block; background-color: #800080; color: white; padding: 12px 24px; 
                              text-decoration: none; border-radius: 6px; margin: 20px 0;">
                        Vérifier mon email
                    </a>
                    <p style="color: #666; font-size: 14px;">
                        Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.
                    </p>
                    <p style="color: #666; font-size: 14px;">
                        Ce lien expirera dans 1 heure.
                    </p>
                </div>
            `
        })
        return { success: true }
    } catch (error) {
        console.error('Erreur lors de l\'envoi de l\'email de vérification:', error)
        return { success: false, error: 'Impossible d\'envoyer l\'email' }
    }
}

/**
 * Envoie un email de réinitialisation de mot de passe
 */
export const sendPasswordResetEmail = async (email: string, token: string) => {
    const resetLink = `${domain}/reset-password?token=${token}`

    try {
        await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: email,
            subject: 'Réinitialisation de votre mot de passe',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #800080;">Réinitialisation de mot de passe</h2>
                    <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le lien ci-dessous pour continuer :</p>
                    <a href="${resetLink}" 
                       style="display: inline-block; background-color: #800080; color: white; padding: 12px 24px; 
                              text-decoration: none; border-radius: 6px; margin: 20px 0;">
                        Réinitialiser mon mot de passe
                    </a>
                    <p style="color: #666; font-size: 14px;">
                        Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.
                    </p>
                    <p style="color: #666; font-size: 14px;">
                        Ce lien expirera dans 1 heure.
                    </p>
                </div>
            `
        })
        return { success: true }
    } catch (error) {
        console.error('Erreur lors de l\'envoi de l\'email de réinitialisation:', error)
        return { success: false, error: 'Impossible d\'envoyer l\'email' }
    }
}

