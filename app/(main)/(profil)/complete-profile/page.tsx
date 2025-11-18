"use client"

import React from 'react'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

const CompleteProfileSchema = z.object({
    name: z.string().min(2, {
        message: "Le nom doit contenir au moins 2 caractères"
    }).max(50, {
        message: "Le nom ne peut pas dépasser 50 caractères"
    })
})

const CompleteProfileForm = () => {
    const router = useRouter()
    const { update } = useSession()
    const [error, setError] = React.useState<string | null>(null)

    const form = useForm<z.infer<typeof CompleteProfileSchema>>({
        resolver: zodResolver(CompleteProfileSchema),
        defaultValues: {
            name: '',
        }
    })

    const isPending = form.formState.isSubmitting

    const onSubmit = async (data: z.infer<typeof CompleteProfileSchema>) => {
        try {
            setError(null)
            
            // Appel API pour mettre à jour le profil
            const response = await fetch('/api/user/update-profile', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: data.name }),
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Échec de la mise à jour du profil')
            }

            // Mettre à jour la session NextAuth
            await update()

            // Afficher un message de succès
            toast.success('Profil complété avec succès !')

            // Attendre un peu puis rediriger vers la page d'accueil
            setTimeout(() => {
                router.push('/')
                router.refresh()
            }, 500)
        } catch (error) {
            console.error(error)
            const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue. Veuillez réessayer.'
            setError(errorMessage)
            toast.error(errorMessage)
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
                            Complétez votre profil
                        </CardTitle>
                        <CardDescription className='text-center text-base text-gray-600'>
                            Veuillez entrer votre nom pour continuer
                        </CardDescription>
                    </CardHeader>

                    <CardContent className='space-y-6 pb-8'>
                        {error && (
                            <div className='p-3 rounded-md bg-red-50 border border-red-200'>
                                <p className='text-sm text-red-600 text-center'>{error}</p>
                            </div>
                        )}

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
                                                        placeholder='Jean Dupont'
                                                        disabled={isPending}
                                                        className='h-12 pl-11 border-2 focus:border-blue-500 transition-colors'
                                                        autoFocus
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
                                        'Continuer'
                                    )}
                                </Button>
                            </form>
                        </Form>

                        <p className='text-center text-sm text-gray-600 pt-2'>
                            Cette information nous aide à personnaliser votre expérience
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default CompleteProfileForm