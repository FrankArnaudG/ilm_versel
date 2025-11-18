"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Mail, ArrowLeft } from 'lucide-react'
import { ForgotPasswordSchema } from '@/lib/schemas'
import FormError from '@/components/form-error'
import { forgotPassword } from '@/actions/auth'
import toast from 'react-hot-toast'

const ForgotPasswordPage = () => {
    const [error, setError] = useState<string | undefined>("")
    const [success, setSuccess] = useState<string | undefined>("")

    const form = useForm<z.infer<typeof ForgotPasswordSchema>>({
        resolver: zodResolver(ForgotPasswordSchema),
        defaultValues: {
            email: '',
        }
    })

    const isPending = form.formState.isSubmitting

    const onSubmit = async (data: z.infer<typeof ForgotPasswordSchema>) => {
        setError("")
        setSuccess("")
        
        try {
            const result = await forgotPassword(data)
            
            if (result?.error) {
                setError(result.error)
                toast.error(result.error)
            } else if (result?.success) {
                setSuccess(result.success)
                toast.success(result.success)
                form.reset()
            }
        } catch (error) {
            console.error(error)
            setError("Une erreur est survenue")
            toast.error("Une erreur est survenue")
        }
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
                            Mot de passe oublié
                        </CardTitle>
                        <CardDescription className='text-center text-base text-gray-600'>
                            Entrez votre adresse email pour recevoir un lien de réinitialisation
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

                                <Button
                                    type='submit'
                                    className='w-full h-12 bg-[#800080] hover:bg-[#660066] text-white font-medium shadow-md hover:shadow-lg transition-all duration-200'
                                    disabled={isPending}
                                >
                                    {isPending ? (
                                        <Loader2 className='w-5 h-5 animate-spin' />
                                    ) : (
                                        'Envoyer le lien'
                                    )}
                                </Button>
                            </form>
                        </Form>

                        <Link 
                            href='/signIn'
                            className='flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-[#800080] transition-colors'
                        >
                            <ArrowLeft className='w-4 h-4' />
                            Retour à la connexion
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default ForgotPasswordPage

