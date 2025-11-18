"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Mail, Lock, Eye, EyeOff, User } from 'lucide-react'
import { FcGoogle } from 'react-icons/fc'
import { signIn } from 'next-auth/react'
import { DEFAULT_REDIRECT } from '@/ts/routes'
import { RegisterSchema } from '@/lib/schemas'
import FormError from '@/components/form-error'
import { register } from '@/actions/auth'
import toast from 'react-hot-toast'

const RegisterForm = () => {
    const router = useRouter()
    const [isGoogleLoading, setIsGoogleLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [acceptedTerms, setAcceptedTerms] = useState(false)
    const [error, setError] = useState<string | undefined>("")
    const [success, setSuccess] = useState<string | undefined>("")

    const form = useForm<z.infer<typeof RegisterSchema>>({
        resolver: zodResolver(RegisterSchema),
        defaultValues: {
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
        }
    })

    const isPending = form.formState.isSubmitting

    const onSubmit = async (data: z.infer<typeof RegisterSchema>) => {
        setError("")
        setSuccess("")
        
        try {
            const result = await register(data)
            
            if (result?.error) {
                setError(result.error)
                toast.error(result.error)
            } else if (result?.success) {
                setSuccess(result.success)
                toast.success(result.success)
                // Rediriger après 2 secondes
                setTimeout(() => {
                    router.push('/verify-request')
                }, 2000)
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
                            Créer un compte
                        </CardTitle>
                        <CardDescription className='text-center text-base text-gray-600'>
                            Inscrivez-vous pour commencer
                        </CardDescription>
                    </CardHeader>

                    <CardContent className='space-y-6 pb-8'>
                        <FormError message={error} />
                        {success && (
                            <div className='bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm'>
                                {success}
                            </div>
                        )}

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
                                    name='name'
                                    control={form.control}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className='text-sm font-medium text-gray-700'>
                                                Nom complet
                                            </FormLabel>
                                            <FormControl>
                                                <div className='relative'>
                                                    <User className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
                                                    <Input 
                                                        {...field} 
                                                        id='name' 
                                                        type='text' 
                                                        placeholder='Votre nom complet'
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

                                <div className='flex items-start space-x-3 pt-2'>
                                    <input
                                        type='checkbox'
                                        id='terms'
                                        checked={acceptedTerms}
                                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                                        disabled={isPending}
                                        className='mt-1 w-4 h-4 text-[#800080] border-2 border-gray-300 rounded focus:ring-2 focus:ring-[#800080] cursor-pointer'
                                    />
                                    <label htmlFor='terms' className='text-sm text-gray-700 cursor-pointer'>
                                        J&apos;accepte les{' '}
                                        <Link 
                                            href='/terms' 
                                            target='_blank'
                                            className='text-[#800080] font-medium hover:underline'
                                        >
                                            Conditions Générales d&apos;Utilisation
                                        </Link>
                                    </label>
                                </div>

                                <Button
                                    type='submit'
                                    className='w-full h-12 bg-[#800080] hover:bg-[#660066] text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
                                    disabled={isPending || !acceptedTerms}
                                >
                                    {isPending ? (
                                        <Loader2 className='w-5 h-5 animate-spin' />
                                    ) : (
                                        'Créer un compte'
                                    )}
                                </Button>
                            </form>
                        </Form>

                        <p className='text-center text-sm text-gray-600 pt-2'>
                            Vous avez déjà un compte ?{' '}
                            <Link href='/signIn' className='text-[#800080] font-medium hover:underline'>
                                Se connecter
                            </Link>
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default RegisterForm

