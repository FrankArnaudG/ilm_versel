"use client"

import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Lock, User } from 'lucide-react'
import { useSession } from 'next-auth/react'

const ProfileTestPage = () => {
    const { data: session, status } = useSession()

    if (status === 'loading') {
        return (
            <div className='min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50'>
                <div className='text-center'>
                    <div className='w-16 h-16 border-4 border-[#800080] border-t-transparent rounded-full animate-spin mx-auto'></div>
                    <p className='mt-4 text-gray-600'>Chargement...</p>
                </div>
            </div>
        )
    }

    if (!session?.user) {
        return (
            <div className='min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4'>
                <Card className='w-full max-w-md shadow-xl border-0 bg-white/95 backdrop-blur'>
                    <CardHeader className='space-y-3 pb-6'>
                        <CardTitle className='text-3xl font-bold text-center text-red-600'>
                            Non authentifié
                        </CardTitle>
                        <CardDescription className='text-center text-base text-gray-600'>
                            Vous devez être connecté pour accéder à cette page
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href='/signIn'>
                            <Button className='w-full h-12 bg-[#800080] hover:bg-[#660066] text-white font-medium'>
                                Se connecter
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className='min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4'>
            <div className='w-full max-w-2xl space-y-8'>
                {/* Logo Section */}
                <div className='flex flex-col items-center space-y-4'>
                    <div className='w-24 h-24 rounded-full bg-[#800080] flex items-center justify-center shadow-lg'>
                        <User className='w-12 h-12 text-white' />
                    </div>
                    <h1 className='text-3xl font-bold text-gray-800'>Page de Test Profil</h1>
                </div>

                {/* Profile Info Card */}
                <Card className='w-full shadow-xl border-0 bg-white/95 backdrop-blur'>
                    <CardHeader className='space-y-3 pb-6'>
                        <CardTitle className='text-2xl font-bold text-center text-[#800080]'>
                            Informations du Profil
                        </CardTitle>
                        <CardDescription className='text-center text-base text-gray-600'>
                            Gérez vos informations personnelles et votre sécurité
                        </CardDescription>
                    </CardHeader>

                    <CardContent className='space-y-6 pb-8'>
                        {/* User Info */}
                        <div className='space-y-4'>
                            <div className='bg-gray-50 p-4 rounded-lg'>
                                <p className='text-sm text-gray-500 mb-1'>Email</p>
                                <p className='text-base font-medium text-gray-800'>{session.user.email}</p>
                            </div>

                            {session.user.name && (
                                <div className='bg-gray-50 p-4 rounded-lg'>
                                    <p className='text-sm text-gray-500 mb-1'>Nom</p>
                                    <p className='text-base font-medium text-gray-800'>{session.user.name}</p>
                                </div>
                            )}

                            {session.user.role && (
                                <div className='bg-gray-50 p-4 rounded-lg'>
                                    <p className='text-sm text-gray-500 mb-1'>Rôle</p>
                                    <p className='text-base font-medium text-gray-800'>{session.user.role}</p>
                                </div>
                            )}
                        </div>

                        {/* Divider */}
                        <div className='border-t border-gray-200'></div>

                        {/* Security Section */}
                        <div className='space-y-4'>
                            <h3 className='text-lg font-semibold text-gray-800'>Sécurité</h3>
                            
                            <Link href='/change-password'>
                                <Button 
                                    className='w-full h-12 bg-[#800080] hover:bg-[#660066] text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2'
                                >
                                    <Lock className='w-5 h-5' />
                                    Modifier mon mot de passe
                                </Button>
                            </Link>
                        </div>

                        {/* Additional Info */}
                        <div className='bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg text-sm'>
                            <p className='font-medium mb-1'>Page de test</p>
                            <p>Cette page est une page de démonstration pour tester le système de modification de mot de passe.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default ProfileTestPage

