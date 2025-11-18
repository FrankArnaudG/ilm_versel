// components/ProfileCheck.tsx
'use client'

import { useSession } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"
import { profileSetupRoute } from "@/ts/routes"

export function ProfileCheck({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const hasCompletedProfile = !!session.user.name
      
      if (!hasCompletedProfile && pathname !== profileSetupRoute) {
        router.push(profileSetupRoute)
      }
      
      if (hasCompletedProfile && pathname === profileSetupRoute) {
        router.push('/')
      }
    }
  }, [session, status, pathname, router])

  return <>{children}</>
}