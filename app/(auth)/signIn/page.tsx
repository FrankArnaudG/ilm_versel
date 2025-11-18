"use client"

import React, { Suspense, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { FcGoogle } from 'react-icons/fc'
import { signIn } from 'next-auth/react'
import { DEFAULT_REDIRECT } from '@/ts/routes'
import { useSearchParams } from 'next/navigation'
import { LoginSchema } from '@/lib/schemas'
import FormError from '@/components/form-error'
import { login } from '@/actions/auth'
import toast from 'react-hot-toast'
import LoadingScreen from '@/components/LoadingScreen'

const LoginPage = () => {
    const searchParams = useSearchParams()
    const urlError = searchParams.get('error') === "OAuthAccountNotLinked"
        ? "Cet email est déjà associé à un compte. Veuillez vous connecter avec votre méthode d'authentification originale ou utiliser une autre adresse email."
        : null

    const [isGoogleLoading, setIsGoogleLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState<string | undefined>("")

    const form = useForm<z.infer<typeof LoginSchema>>({
        resolver: zodResolver(LoginSchema),
        defaultValues: {
            email: '',
            password: '',
        }
    })

    const isPending = form.formState.isSubmitting

    const onSubmit = async (data: z.infer<typeof LoginSchema>) => {
        setError("")
        
        try {
            const result = await login(data)
            
            if (result?.error) {
                setError(result.error)
                toast.error(result.error)
            } else {
                toast.success('Connexion réussie')
            }
        } catch (error) {
            console.error(error)
            setError("Une erreur est survenue")
            toast.error("Une erreur est survenue")
        }
    }

    const onclick = async (provider: 'google') => {
        setIsGoogleLoading(true)
        signIn(provider, { 
            callbackUrl: DEFAULT_REDIRECT 
        })
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
                            Connexion
                        </CardTitle>
                        <CardDescription className='text-center text-base text-gray-600'>
                            Connectez-vous pour accéder à votre compte
                        </CardDescription>
                    </CardHeader>

                    <CardContent className='space-y-6 pb-8'>
                        <FormError message={urlError || error} />

                        <Button
                            variant='outline'
                            className='w-full h-12 space-x-3 flex items-center justify-center hover:bg-gray-50 transition-all duration-200 border-2 hover:border-gray-300'
                            onClick={() => onclick('google')}
                            disabled={isPending || isGoogleLoading}
                        >
                            {isGoogleLoading ? (
                                <Loader2 className='w-5 h-5 animate-spin' />
                            ) : (
                                <>
                                    <FcGoogle className='w-6 h-6' />
                                    <span className='font-medium'>Continuer avec Google</span>
                                </>
                            )}
                        </Button>

                        <div className='relative flex items-center justify-center py-2'>
                            <div className='absolute inset-0 flex items-center'>
                                <div className='w-full border-t border-gray-200'/>
                            </div>
                            <div className='relative bg-white px-4'>
                                <span className='text-sm text-gray-500 font-medium'>Ou par email</span>
                            </div>
                        </div>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-5'>
                                <FormField 
                                    name='email'
                                    control={form.control}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className='text-sm font-medium text-gray-700'>
                                                Adresse email
                                            </FormLabel>
                                            <FormControl>
                                                <div className='relative'>
                                                    <Mail className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
                                                    <Input 
                                                        {...field} 
                                                        id='email' 
                                                        type='email' 
                                                        placeholder='nom@exemple.com'
                                                        disabled={isPending}
                                                        className='h-12 pl-11 border-2 focus:border-blue-500 transition-colors'
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField 
                                    name='password'
                                    control={form.control}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className='text-sm font-medium text-gray-700'>
                                                Mot de passe
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

                                <div className='flex justify-end'>
                                    <Link 
                                        href='/forgot-password'
                                        className='text-sm text-[#800080] hover:underline'
                                    >
                                        Mot de passe oublié ?
                                    </Link>
                                </div>

                                <Button
                                    type='submit'
                                    className='w-full h-12 bg-[#800080] hover:bg-[#660066] text-white font-medium shadow-md hover:shadow-lg transition-all duration-200'
                                    disabled={isPending}
                                >
                                    {isPending ? (
                                        <Loader2 className='w-5 h-5 animate-spin' />
                                    ) : (
                                        'Se connecter'
                                    )}
                                </Button>
                            </form>
                        </Form>

                        <p className='text-center text-sm text-gray-600 pt-2'>
                            Vous n&apos;avez pas de compte ?{' '}
                            <Link href='/signUp' className='text-[#800080] font-medium hover:underline'>
                                Créer un compte
                            </Link>
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

// Composant principal avec Suspense
const LoginForm = () => {
    return (
        <Suspense fallback={
            <LoadingScreen />
        }>
            <LoginPage />
        </Suspense>
    )
}

export default LoginForm
