"use client"

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, CheckCircle2, ArrowLeft } from 'lucide-react'

const VerifyRequestPage = () => {
    return (
        <div className='min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4'>
            <div className='w-full max-w-md space-y-8'>
                {/* Logo Section */}
                <div className='flex flex-col items-center space-y-4'>
                    <Image 
                        src='/assets/logo_ilm.png' 
                        alt='Logo'
                        width={96}
                        height={96}
                        className='w-24 h-24 rounded-full object-cover shadow-lg'
                    />
                </div>

                {/* Card Section */}
                <Card className='w-full shadow-xl border-0 bg-white/95 backdrop-blur'>
                    <CardHeader className='space-y-3 pb-6'>
                        <div className='flex justify-center mb-2'>
                            <div className='relative'>
                                <div className='absolute inset-0 bg-[#800080] opacity-20 blur-xl rounded-full'></div>
                                <div className='relative bg-[#800080] p-4 rounded-full'>
                                    <Mail className='w-8 h-8 text-white' />
                                </div>
                            </div>
                        </div>
                        <CardTitle className='text-3xl font-bold text-center text-[#800080]'>
                            Vérifiez votre email
                        </CardTitle>
                        <CardDescription className='text-center text-base text-gray-600'>
                            Un email de vérification a été envoyé à votre adresse
                        </CardDescription>
                    </CardHeader>

                    <CardContent className='space-y-6 pb-8'>
                        {/* Instructions */}
                        <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3'>
                            <div className='flex items-start gap-3'>
                                <CheckCircle2 className='w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0' />
                                <div className='space-y-1'>
                                    <p className='text-sm font-medium text-blue-900'>
                                        Email envoyé avec succès
                                    </p>
                                    <p className='text-xs text-blue-700'>
                                        Veuillez vérifier votre boîte de réception et cliquer sur le lien de vérification pour activer votre compte.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Additional Info */}
                        <div className='space-y-3 text-sm text-gray-600'>
                            <div className='flex items-start gap-2'>
                                <span className='font-semibold text-gray-700'>📧</span>
                                <p>Vérifiez également votre dossier <span className='font-medium'>spam/courrier indésirable</span> si vous ne trouvez pas l&apos;email.</p>
                            </div>
                            <div className='flex items-start gap-2'>
                                <span className='font-semibold text-gray-700'>⏱️</span>
                                <p>Le lien de vérification est valable pendant <span className='font-medium'>1 heure</span>.</p>
                            </div>
                            <div className='flex items-start gap-2'>
                                <span className='font-semibold text-gray-700'>🔒</span>
                                <p>Une fois votre email vérifié, vous pourrez vous connecter à votre compte.</p>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className='border-t border-gray-200'></div>

                        {/* Actions */}
                        <div className='space-y-3'>
                            <Link href='/signIn'>
                                <Button 
                                    className='w-full h-12 bg-[#800080] hover:bg-[#660066] text-white font-medium shadow-md hover:shadow-lg transition-all duration-200'
                                >
                                    Retour à la connexion
                                </Button>
                            </Link>

                            <Link 
                                href='/signUp'
                                className='flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-[#800080] transition-colors'
                            >
                                <ArrowLeft className='w-4 h-4' />
                                Renvoyer un email de vérification
                            </Link>
                        </div>

                        {/* Help Text */}
                        <p className='text-center text-xs text-gray-500 pt-2'>
                            Besoin d&apos;aide ? Contactez notre support à{' '}
                            <a href='mailto:support@example.com' className='text-[#800080] hover:underline'>
                                support@example.com
                            </a>
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default VerifyRequestPage