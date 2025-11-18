"use client"

import React, { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { verifyEmail } from '@/actions/auth'
import LoadingScreen from '@/components/LoadingScreen'

const VerifyEmailContent = () => {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get('token')
    
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | undefined>("")
    const [success, setSuccess] = useState<string | undefined>("")

    useEffect(() => {
        if (!token) {
            setError("Token manquant")
            setLoading(false)
            return
        }

        const verify = async () => {
            try {
                const result = await verifyEmail(token)
                
                if (result?.error) {
                    setError(result.error)
                } else if (result?.success) {
                    setSuccess(result.success)
                    // Rediriger vers la page de connexion après 3 secondes
                    setTimeout(() => {
                        router.push('/signIn')
                    }, 3000)
                }
            } catch (error) {
                console.error(error)
                setError("Une erreur est survenue")
            } finally {
                setLoading(false)
            }
        }

        verify()
    }, [token, router])

    return (
        <div className='min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4'>
            <div className='w-full max-w-md space-y-8'>
                {/* Logo Section */}
                <div className='flex flex-col items-center space-y-4'>
                    <Image 
                        src='/assets/logo.png' 
                        alt='Logo'
                        width={96}
                        height={96}
                        className='w-24 h-24 rounded-full object-cover shadow-lg'
                    />
                </div>

                {/* Card Section */}
                <Card className='w-full shadow-xl border-0 bg-white/95 backdrop-blur'>
                    <CardHeader className='space-y-3 pb-6'>
                        <CardTitle className='text-3xl font-bold text-center text-[#800080]'>
                            {loading ? 'Vérification en cours...' : success ? 'Email vérifié !' : 'Erreur de vérification'}
                        </CardTitle>
                        <CardDescription className='text-center text-base text-gray-600'>
                            {loading ? 'Veuillez patienter' : success ? 'Votre email a été vérifié avec succès' : 'Une erreur est survenue'}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className='space-y-6 pb-8'>
                        <div className='flex flex-col items-center justify-center space-y-4'>
                            {loading && (
                                <Loader2 className='w-16 h-16 text-[#800080] animate-spin' />
                            )}
                            
                            {!loading && success && (
                                <>
                                    <CheckCircle className='w-16 h-16 text-green-500' />
                                    <p className='text-center text-sm text-gray-600'>
                                        Redirection vers la page de connexion...
                                    </p>
                                </>
                            )}
                            
                            {!loading && error && (
                                <>
                                    <XCircle className='w-16 h-16 text-red-500' />
                                    <div className='bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm text-center w-full'>
                                        {error}
                                    </div>
                                </>
                            )}
                        </div>

                        {!loading && error && (
                            <Link href='/signIn'>
                                <Button className='w-full h-12 bg-[#800080] hover:bg-[#660066] text-white font-medium'>
                                    Retour à la connexion
                                </Button>
                            </Link>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

// Composant principal avec Suspense
const VerifyEmailPage = () => {
    return (
        <Suspense fallback={
            <LoadingScreen />
            // <div className='min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50'>
            //     <Loader2 className='w-8 h-8 animate-spin text-[#800080]' />
            // </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    )
}

export default VerifyEmailPage

