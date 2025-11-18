// middleware.ts - VERSION SANS NEXTAUTH
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { authRoutes, publicRoutes, profileSetupRoute, DEFAULT_REDIRECT } from "./ts/routes"

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl
    
    // Permettre les routes API
    if (pathname.startsWith('/api/')) {
        return NextResponse.next()
    }

    // Vérifier le token de session (cookie next-auth)
    const sessionToken = request.cookies.get('next-auth.session-token') || 
                        request.cookies.get('__Secure-next-auth.session-token')
    
    const isLoggedIn = !!sessionToken
    const isAuthRoute = authRoutes.includes(pathname)
    const isPublicRoute = publicRoutes.includes(pathname)
    const isProfileSetup = pathname === profileSetupRoute

    // Si connecté et sur route d'auth, rediriger vers accueil
    if (isLoggedIn && isAuthRoute) {
        return NextResponse.redirect(new URL(DEFAULT_REDIRECT, request.url))
    }

    // Si non connecté et route protégée
    if (!isLoggedIn && !isPublicRoute && !isAuthRoute) {
        return NextResponse.redirect(new URL('/signIn', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}