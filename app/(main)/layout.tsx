import React from 'react'
import { SessionProvider } from 'next-auth/react'
import { auth } from '@/ts/auth'
import { LocationProvider } from './(view)/contexts/LocationContext'
import { CartProvider } from './(view)/contexts/CartContext'
import { ComparatorProvider } from './contexts/ComparatorContext'

type Props = {
    children: React.ReactNode
}

const layout = async({ children } : Props) => {

    const session = await auth()


    return (
        <SessionProvider session={session}>
            <LocationProvider>
                <CartProvider>
                    <ComparatorProvider>
                        {children}
                    </ComparatorProvider>
                </CartProvider>
            </LocationProvider>
        </SessionProvider>
    )
}

export default layout