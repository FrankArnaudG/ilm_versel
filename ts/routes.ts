
// //les routes de vu public
// export const publicRoutes = [
//     "/",
//     "/view",
//     "/Guadeloupe",
//     "/Martinique",
//     "/Guyane"
// ]
export const protectedRoutes = [
    // "/view_admin/ilm2",
    // "/profile",
    // "/profile/*",        // Protège /profile/edit, /profile/settings, etc.
    // "/admin",
    "/admin/*",          // Protège toute la section admin
]

//les routes d'authentifications
export const authRoutes = [
    "/signIn",
    "/signUp",
    "/error",
    "/verify-request",
    "/verify-email",
    "/forgot-password",
    "/reset-password",
]

// Route pour compléter le profil
export const profileSetupRoute = "/complete-profile"

export const apiAuthPrefix = "/api/auth"


export const DEFAULT_REDIRECT = "/"

// Fonction helper pour déterminer la redirection appropriée.
export const getRedirectUrl = (user: { name?: string | null }) => {
    if (!user.name) {
        return profileSetupRoute
    }
    return DEFAULT_REDIRECT
}