// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt' // ✅ Léger, pas de Prisma

import { 
    authRoutes, 
    DEFAULT_REDIRECT, 
    protectedRoutes, 
    profileSetupRoute 
} from "./ts/routes"

export async function middleware(req: NextRequest) {
    const { nextUrl } = req
    
    // ✅ Récupérer le token JWT (contient déjà user.name, role, etc.)
    const token = await getToken({ 
        req, 
        secret: process.env.AUTH_SECRET 
    })
    
    const isLoggedIn = !!token
    const hasCompletedProfile = !!token?.name // ✅ Votre logique actuelle

    const isAuthRoute = authRoutes.includes(nextUrl.pathname)
    const isProtectedRoute = protectedRoutes.some(route => {
        if (route.endsWith('/*')) {
            return nextUrl.pathname.startsWith(route.replace('/*', ''))
        }
        return nextUrl.pathname === route
    })
    const isProfileSetup = nextUrl.pathname === profileSetupRoute

    // Permettre les routes API
    if (nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.next()
    }

    if (isLoggedIn) {
        // Redirection vers setup si profil incomplet
        if (!hasCompletedProfile && !isProfileSetup) {
            return NextResponse.redirect(new URL(profileSetupRoute, nextUrl))
        }

        // Redirection depuis setup si profil complet
        if (hasCompletedProfile && isProfileSetup) {
            return NextResponse.redirect(new URL(DEFAULT_REDIRECT, nextUrl))
        }

        // Redirection depuis routes auth si connecté
        if (isAuthRoute) {
            const redirectUrl = hasCompletedProfile ? DEFAULT_REDIRECT : profileSetupRoute
            return NextResponse.redirect(new URL(redirectUrl, nextUrl))
        }

        return NextResponse.next()
    }

    // Non connecté : bloquer les routes protégées
    if (isProtectedRoute || isProfileSetup) {
        return NextResponse.redirect(new URL('/signIn', nextUrl))
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}




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








// import authConfig from "./ts/auth.config"
// import NextAuth from "next-auth"
// import { apiAuthPrefix, authRoutes, DEFAULT_REDIRECT, publicRoutes, profileSetupRoute } from "./ts/routes"

// const { auth } = NextAuth(authConfig)

// export default auth((req) => {
//     const { nextUrl } = req
//     const isLoggedIn = !!req.auth

//     const isPublicRoutes = publicRoutes.includes(nextUrl.pathname)
//     const isAuthRoutes = authRoutes.includes(nextUrl.pathname)
//     const isApiAuthPrefix = nextUrl.pathname.startsWith(apiAuthPrefix)
//     const isProfileSetupRoute = nextUrl.pathname === profileSetupRoute

//     // Permettre toutes les routes API d'authentification et les routes API user
//     if (isApiAuthPrefix || nextUrl.pathname.startsWith('/api/user')) {
//         return 
//     }

//     // Si l'utilisateur est connecté
//     if (isLoggedIn) {
//         // Vérifier si le profil est complet
//         const hasCompletedProfile = !!req.auth?.user?.name

//         // Si le profil n'est pas complet et que l'utilisateur n'est pas sur la page de complétion
//         if (!hasCompletedProfile && !isProfileSetupRoute) {
//             return Response.redirect(new URL(profileSetupRoute, nextUrl))
//         }

//         // Si le profil est complet et que l'utilisateur est sur la page de complétion
//         // Rediriger vers la page d'accueil
//         if (hasCompletedProfile && isProfileSetupRoute) {
//             return Response.redirect(new URL('/', nextUrl))
//         }

//         // Si l'utilisateur est sur une route d'authentification
//         if (isAuthRoutes) {
//             const redirectUrl = hasCompletedProfile ? DEFAULT_REDIRECT : profileSetupRoute
//             return Response.redirect(new URL(redirectUrl, nextUrl))
//         }

//         return
//     }

//     // Si l'utilisateur n'est pas connecté et tente d'accéder à une route d'authentification
//     if (isAuthRoutes) {
//         return
//     }

//     // // Si l'utilisateur n'est pas connecté et tente d'accéder à une route protégée
//     // if (!isPublicRoutes) {
//     //     return Response.redirect(new URL("/signIn", nextUrl))
//     // }
// })

// export const config = {
//     matcher: [
//         '/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'
//     ],
// }