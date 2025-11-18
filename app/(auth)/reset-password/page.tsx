"use client"

import React, { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Lock, Eye, EyeOff } from 'lucide-react'
import { ResetPasswordSchema } from '@/lib/schemas'
import FormError from '@/components/form-error'
import { resetPassword } from '@/actions/auth'
import toast from 'react-hot-toast'
import LoadingScreen from '@/components/LoadingScreen'

const ResetPasswordForm  = () => {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get('token')
    
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [error, setError] = useState<string | undefined>("")
    const [success, setSuccess] = useState<string | undefined>("")

    const form = useForm<z.infer<typeof ResetPasswordSchema>>({
        resolver: zodResolver(ResetPasswordSchema),
        defaultValues: {
            token: token || '',
            password: '',
            confirmPassword: '',
        }
    })

    useEffect(() => {
        if (!token) {
            setError("Token manquant")
        } else {
            form.setValue('token', token)
        }
    }, [token, form])

    const isPending = form.formState.isSubmitting

    const onSubmit = async (data: z.infer<typeof ResetPasswordSchema>) => {
        setError("")
        setSuccess("")
        
        try {
            const result = await resetPassword(data)
            
            if (result?.error) {
                setError(result.error)
                toast.error(result.error)
            } else if (result?.success) {
                setSuccess(result.success)
                toast.success(result.success)
                // Rediriger vers la page de connexion après 2 secondes
                setTimeout(() => {
                    router.push('/signIn')
                }, 2000)
            }
        } catch (error) {
            console.error(error)
            setError("Une erreur est survenue")
            toast.error("Une erreur est survenue")
        }
    }

    if (!token) {
        return (
            <div className='min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4'>
                <Card className='w-full max-w-md shadow-xl border-0 bg-white/95 backdrop-blur'>
                    <CardHeader className='space-y-3 pb-6'>
                        <CardTitle className='text-3xl font-bold text-center text-red-600'>
                            Token invalide
                        </CardTitle>
                        <CardDescription className='text-center text-base text-gray-600'>
                            Le lien de réinitialisation est invalide ou a expiré
                        </CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-6 pb-8'>
                        <Link href='/forgot-password'>
                            <Button className='w-full h-12 bg-[#800080] hover:bg-[#660066] text-white font-medium'>
                                Demander un nouveau lien
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        )
    }

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
                            Nouveau mot de passe
                        </CardTitle>
                        <CardDescription className='text-center text-base text-gray-600'>
                            Choisissez un nouveau mot de passe sécurisé
                        </CardDescription>
                    </CardHeader>

                    <CardContent className='space-y-6 pb-8'>
                        <FormError message={error} />
                        {success && (
                            <div className='bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm'>
                                {success}
                            </div>
                        )}

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-5'>
                                <FormField 
                                    name='password'
                                    control={form.control}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className='text-sm font-medium text-gray-700'>
                                                Nouveau mot de passe
                                            </FormLabel>
                                            <FormControl>
                                                <div className='relative'>
                                                    <Lock className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
                                                    <Input 
                                                        {...field} 
                                                        id='password' 
                                                        type={showPassword ? 'text' : 'password'}
                                                        placeholder='••••••••'
                                                        disabled={isPending}
                                                        className='h-12 pl-11 pr-11 border-2 focus:border-blue-500 transition-colors'
                                                    />
                                                    <button
                                                        type='button'
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
                                                    >
                                                        {showPassword ? (
                                                            <EyeOff className='w-5 h-5' />
                                                        ) : (
                                                            <Eye className='w-5 h-5' />
                                                        )}
                                                    </button>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField 
                                    name='confirmPassword'
                                    control={form.control}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className='text-sm font-medium text-gray-700'>
                                                Confirmer le mot de passe
                                            </FormLabel>
                                            <FormControl>
                                                <div className='relative'>
                                                    <Lock className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
                                                    <Input 
                                                        {...field} 
                                                        id='confirmPassword' 
                                                        type={showConfirmPassword ? 'text' : 'password'}
                                                        placeholder='••••••••'
                                                        disabled={isPending}
                                                        className='h-12 pl-11 pr-11 border-2 focus:border-blue-500 transition-colors'
                                                    />
                                                    <button
                                                        type='button'
                                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                        className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
                                                    >
                                                        {showConfirmPassword ? (
                                                            <EyeOff className='w-5 h-5' />
                                                        ) : (
                                                            <Eye className='w-5 h-5' />
                                                        )}
                                                    </button>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className='text-xs text-gray-600 space-y-1'>
                                    <p>Le mot de passe doit contenir :</p>
                                    <ul className='list-disc list-inside space-y-0.5'>
                                        <li>Au moins 8 caractères</li>
                                        <li>Une lettre majuscule</li>
                                        <li>Une lettre minuscule</li>
                                        <li>Un chiffre</li>
                                    </ul>
                                </div>

                                <Button
                                    type='submit'
                                    className='w-full h-12 bg-[#800080] hover:bg-[#660066] text-white font-medium shadow-md hover:shadow-lg transition-all duration-200'
                                    disabled={isPending}
                                >
                                    {isPending ? (
                                        <Loader2 className='w-5 h-5 animate-spin' />
                                    ) : (
                                        'Réinitialiser le mot de passe'
                                    )}
                                </Button>
                            </form>
                        </Form>

                        <p className='text-center text-sm text-gray-600 pt-2'>
                            <Link href='/signIn' className='text-[#800080] font-medium hover:underline'>
                                Retour à la connexion
                            </Link>
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

// Composant principal avec Suspense
const ResetPasswordPage = () => {
    return (
        <Suspense fallback={
            <LoadingScreen />
            // <div className='min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50'>
            //     <Loader2 className='w-8 h-8 animate-spin text-[#800080]' />
            // </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    )
}

export default ResetPasswordPage

