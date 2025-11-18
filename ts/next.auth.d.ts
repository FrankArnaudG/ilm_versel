import { Role } from '@prisma/client'
import { DefaultSession } from 'next-auth'

// Interface pour les rôles secondaires
export interface UserSecondaryRole {
    id: string;
    userId: string;
    role: Role;
    assignedById: string | null;
    assignedAt: Date;
    expiresAt: Date | null;
}

// Extension du type User
export type ExtendUser = DefaultSession['user'] & {
    id: string;
    role: Role;
    status: string;
    storeId: string | null;
    secondaryRoles?: UserSecondaryRole[]; // Ajout des rôles secondaires
}

// export type ExtendUser = DefaultSession['user'] & {
//     role: Role
// }



declare module 'next-auth' {
    interface Session {
        user: ExtendUser
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        role?: Role;
        status?: string;
        storeId?: string | null;
        secondaryRoles?: UserSecondaryRole[];
    }
}