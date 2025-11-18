"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { ChangePasswordSchema } from '@/lib/schemas'
import FormError from '@/components/form-error'
import { changePassword } from '@/actions/auth'
import toast from 'react-hot-toast'
import { useSession } from 'next-auth/react'

const ChangePasswordPage = () => {
    const router = useRouter()
    const { data: session, status } = useSession()
    
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [error, setError] = useState<string | undefined>("")
    const [success, setSuccess] = useState<string | undefined>("")

    const form = useForm<z.infer<typeof ChangePasswordSchema>>({
        resolver: zodResolver(ChangePasswordSchema),
        defaultValues: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        }
    })

    const isPending = form.formState.isSubmitting

    const onSubmit = async (data: z.infer<typeof ChangePasswordSchema>) => {
        setError("")
        setSuccess("")
        
        try {
            const result = await changePassword(data)
            
            if (result?.error) {
                setError(result.error)
                toast.error(result.error)
            } else if (result?.success) {
                setSuccess(result.success)
                toast.success(result.success)
                form.reset()
                // Rediriger après 2 secondes
                setTimeout(() => {
                    router.push('/profile-test')
                }, 2000)
            }
        } catch (error) {
            console.error(error)
            setError("Une erreur est survenue")
            toast.error("Une erreur est survenue")
        }
    }

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
                            Vous devez être connecté pour modifier votre mot de passe
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
            <div className='w-full max-w-md space-y-8'>
                {/* Logo Section */}
                <div className='flex flex-col items-center space-y-4'>
                    <div className='w-24 h-24 rounded-full bg-[#800080] flex items-center justify-center shadow-lg'>
                        <Lock className='w-12 h-12 text-white' />
                    </div>
                </div>

                {/* Card Section */}
                <Card className='w-full shadow-xl border-0 bg-white/95 backdrop-blur'>
                    <CardHeader className='space-y-3 pb-6'>
                        <CardTitle className='text-3xl font-bold text-center text-[#800080]'>
                            Modifier le mot de passe
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
                                    name='currentPassword'
                                    control={form.control}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className='text-sm font-medium text-gray-700'>
                                                Mot de passe actuel
                                            </FormLabel>
                                            <FormControl>
                                                <div className='relative'>
                                                    <Lock className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
                                                    <Input 
                                                        {...field} 
                                                        id='currentPassword' 
                                                        type={showCurrentPassword ? 'text' : 'password'}
                                                        placeholder='••••••••'
                                                        disabled={isPending}
                                                        className='h-12 pl-11 pr-11 border-2 focus:border-blue-500 transition-colors'
                                                    />
                                                    <button
                                                        type='button'
                                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                        className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
                                                    >
                                                        {showCurrentPassword ? (
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
                                    name='newPassword'
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
                                                        id='newPassword' 
                                                        type={showNewPassword ? 'text' : 'password'}
                                                        placeholder='••••••••'
                                                        disabled={isPending}
                                                        className='h-12 pl-11 pr-11 border-2 focus:border-blue-500 transition-colors'
                                                    />
                                                    <button
                                                        type='button'
                                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                                        className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
                                                    >
                                                        {showNewPassword ? (
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
                                                Confirmer le nouveau mot de passe
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
                                        'Modifier le mot de passe'
                                    )}
                                </Button>
                            </form>
                        </Form>

                        <Link 
                            href='/profile'
                            className='flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-[#800080] transition-colors'
                        >
                            <ArrowLeft className='w-4 h-4' />
                            Retour au profil
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default ChangePasswordPage

