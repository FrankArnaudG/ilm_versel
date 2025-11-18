import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient, Role } from "@prisma/client"
import authConfig from "./auth.config"
import { db } from "@/lib/db"
 
 
export const { 
    auth, 
    handlers, 
    signIn, 
    signOut 
} = NextAuth({
  trustHost: true,
  pages: {
    signIn: '/signIn',
    error: '/error',
    verifyRequest: '/verify-request',
  },
  events: {
    async linkAccount({ user }) {
        await db.user.update({
            where: { id: user.id },
            data: {
                emailVerified: new Date(),
            },
        })
    }
  },

  callbacks: {
    async signIn({ user, account, profile }) {

        if (account?.provider !== "credentials") {
            return true
        }

        // Vérifier que l'email est vérifié pour l'authentification par credentials
        const existingUser = await db.user.findUnique({
            where: { id: user.id }
        })

        // Si l'email n'est pas vérifié, on bloque la connexion
        if (!existingUser?.emailVerified) {
            return false
        }
       
        return true
    },

    async session({ session, token }) {

        if (token.sub && session.user) {
            session.user.id = token.sub
        }

        if (token.name && session.user) {
            session.user.name = token.name as string
        }

        if (token.role && session.user) {
            session.user.role = token.role as Role
        }

        if (token.status && session.user) {
            session.user.status = token.status as string
        }

        if (token.storeId !== undefined && session.user) {
            session.user.storeId = token.storeId as string | null
        }

        // Ajouter les rôles secondaires à la session
        if (token.secondaryRoles && session.user) {
            session.user.secondaryRoles = token.secondaryRoles as any
        }

        return session
    },

    async jwt({ token, trigger, session }) {

        // Si c'est un update de session, rafraîchir les données
        if (trigger === "update") {
            const user = await db.user.findUnique({
                where: { id: token.sub },
                include: {
                    secondaryRoles: {
                        orderBy: {
                            assignedAt: 'desc'
                        }
                    }
                }
            });

            if (user) {
                token.name = user.name;
                token.role = user.role;
                token.status = user.status;
                token.storeId = user.storeId;
                token.secondaryRoles = user.secondaryRoles;
            }
            return token;
        }

        if (!token.sub) return token

        const user = await db.user.findUnique({
            where: { id: token.sub },
            include: {
                secondaryRoles: {
                    orderBy: {
                        assignedAt: 'desc'
                    }
                }
            }
        })

        if (!user) return token
        
        token.role = user.role
        token.status = user.status
        token.storeId = user.storeId
        token.secondaryRoles = user.secondaryRoles // Charger les rôles secondaires


        return token
    }


  },
  adapter: PrismaAdapter(db),
  session: { 
    strategy: "jwt",
 },
  providers: [
    ...authConfig.providers,
  ],
  
})