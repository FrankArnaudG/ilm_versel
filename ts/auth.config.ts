import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import type { NextAuthConfig } from "next-auth"
import { LoginSchema } from "@/lib/schemas"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
 
export default { 
    providers: [
        Google({
            clientId: process.env.GOOGLE_ID,
            clientSecret: process.env.GOOGLE_SECRET,
        }),
        Credentials({
            async authorize(credentials) {
                const validatedFields = LoginSchema.safeParse(credentials)

                if (validatedFields.success) {
                    const { email, password } = validatedFields.data

                    const user = await db.user.findUnique({
                        where: { email }
                    })

                    if (!user || !user.password) {
                        return null
                    }

                    const passwordsMatch = await bcrypt.compare(
                        password,
                        user.password
                    )

                    if (passwordsMatch) {
                        return user
                    }
                }

                return null
            }
        })
    ] 
} satisfies NextAuthConfig