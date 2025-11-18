"use server"

import { signOut } from '@/ts/auth'


export const logOut = async () => {

    // des action avant de deconnecter

    await signOut({
        redirectTo: '/signIn'
    })

}