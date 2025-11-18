"use client"

import { Button } from '@/components/ui/button'
import { logOut } from '@/lib/logout'
import { useCurrentUser } from '@/ts/hooks/use-current-user'
import React from 'react'

const Page = () => {

    
    const user =  useCurrentUser()
  return (
    <Button
        onClick={async() => await logOut()}
    >
        {user?.email} {user?.name} {user?.role}
    </Button>
  )
}

export default Page