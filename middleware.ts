// // middleware.ts - VERSION SANS NEXTAUTH
// import { NextResponse } from 'next/server'
// import type { NextRequest } from 'next/server'
// import { authRoutes, profileSetupRoute, DEFAULT_REDIRECT, protectedRoutes } from "./ts/routes"

// export function middleware(request: NextRequest) {
//     const { pathname } = request.nextUrl
    
//     // Permettre les routes API
//     if (pathname.startsWith('/api/')) {
//         return NextResponse.next()
//     }

//     // Vérifier le token de session (cookie next-auth)
//     const sessionToken = request.cookies.get('next-auth.session-token') || 
//                         request.cookies.get('__Secure-next-auth.session-token')
    
//     const isLoggedIn = !!sessionToken
//     const isAuthRoute = authRoutes.includes(pathname)
//     const isProtectedRoutes = protectedRoutes.includes(pathname)
//     const isProfileSetup = pathname === profileSetupRoute

//     // Si connecté et sur route d'auth, rediriger vers accueil
//     if (isLoggedIn && isAuthRoute) {
//         return NextResponse.redirect(new URL(DEFAULT_REDIRECT, request.url))
//     }

//    // Si non connecté et route protégée (ou profileSetup), rediriger vers signIn
//     if (!isLoggedIn && (isProtectedRoutes || isProfileSetup)) {
//         return NextResponse.redirect(new URL('/signIn', request.url))
//     }

//     return NextResponse.next()
// }

// export const config = {
//     matcher: [
//         '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
//     ],
// }





// // middleware.ts - VERSION OPTIMISÉE
// import { auth } from "./ts/auth"  // Import direct depuis auth.ts
// import { 
//     apiAuthPrefix, 
//     authRoutes, 
//     DEFAULT_REDIRECT, 
//     publicRoutes, 
//     profileSetupRoute 
// } from "./ts/routes"

// export default auth((req) => {
//     const { nextUrl } = req
//     const isLoggedIn = !!req.auth

//     const isPublicRoutes = publicRoutes.includes(nextUrl.pathname)
//     const isAuthRoutes = authRoutes.includes(nextUrl.pathname)
//     const isApiAuthPrefix = nextUrl.pathname.startsWith(apiAuthPrefix)
//     const isProfileSetupRoute = nextUrl.pathname === profileSetupRoute

//     // Permettre les routes API
//     if (isApiAuthPrefix || nextUrl.pathname.startsWith('/api/user')) {
//         return 
//     }

//     if (isLoggedIn) {
//         const hasCompletedProfile = !!req.auth?.user?.name

//         if (!hasCompletedProfile && !isProfileSetupRoute) {
//             return Response.redirect(new URL(profileSetupRoute, nextUrl))
//         }

//         if (hasCompletedProfile && isProfileSetupRoute) {
//             return Response.redirect(new URL('/', nextUrl))
//         }

//         if (isAuthRoutes) {
//             const redirectUrl = hasCompletedProfile ? DEFAULT_REDIRECT : profileSetupRoute
//             return Response.redirect(new URL(redirectUrl, nextUrl))
//         }

//         return
//     }

//     if (isAuthRoutes) {
//         return
//     }
// })

// // MATCHER OPTIMISÉ - Exclut les fichiers statiques
// export const config = {
//     matcher: [
//         '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
//     ],
// }








import authConfig from "./ts/auth.config"
import NextAuth from "next-auth"
import { apiAuthPrefix, authRoutes, DEFAULT_REDIRECT, protectedRoutes, profileSetupRoute } from "./ts/routes"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
    const { nextUrl } = req
    const isLoggedIn = !!req.auth

    const isprotectedRoutes = protectedRoutes.includes(nextUrl.pathname)
    const isAuthRoutes = authRoutes.includes(nextUrl.pathname)
    const isApiAuthPrefix = nextUrl.pathname.startsWith(apiAuthPrefix)
    const isProfileSetupRoute = nextUrl.pathname === profileSetupRoute

    // Permettre toutes les routes API d'authentification et les routes API user
    if (isApiAuthPrefix || nextUrl.pathname.startsWith('/api/user')) {
        return 
    }

    // Si l'utilisateur est connecté
    if (isLoggedIn) {
        // Vérifier si le profil est complet
        const hasCompletedProfile = !!req.auth?.user?.name

        // Si le profil n'est pas complet et que l'utilisateur n'est pas sur la page de complétion
        if (!hasCompletedProfile && !isProfileSetupRoute) {
            return Response.redirect(new URL(profileSetupRoute, nextUrl))
        }

        // Si le profil est complet et que l'utilisateur est sur la page de complétion
        // Rediriger vers la page d'accueil
        if (hasCompletedProfile && isProfileSetupRoute) {
            return Response.redirect(new URL('/', nextUrl))
        }

        // Si l'utilisateur est sur une route d'authentification
        if (isAuthRoutes) {
            const redirectUrl = hasCompletedProfile ? DEFAULT_REDIRECT : profileSetupRoute
            return Response.redirect(new URL(redirectUrl, nextUrl))
        }

        return
    }

    // Si l'utilisateur n'est pas connecté et tente d'accéder à une route d'authentification
    if (isAuthRoutes) {
        return
    }

    // Si l'utilisateur n'est pas connecté et tente d'accéder à une route protégée
    if (!isprotectedRoutes) {
        return Response.redirect(new URL("/signIn", nextUrl))
    }
})

export const config = {
    matcher: [
        '/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'
    ],
}