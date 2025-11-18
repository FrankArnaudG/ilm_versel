import { Role } from '@prisma/client'
import { useSession } from 'next-auth/react'

export const useCurrentUser = () => {

    const session = useSession()

    return session.data?.user
}

// Fonction utilitaire pour obtenir tous les rôles (principal + secondaires actifs)
export const useActiveRoles = () => {
    const user = useCurrentUser();
    
    if (!user) return [];
    
    const roles = [user.role];
    
    if (user.secondaryRoles) {
        const activeSecondary = user.secondaryRoles.filter(sr => {
            if (!sr.expiresAt) return true;
            return new Date(sr.expiresAt) > new Date();
        });
        roles.push(...activeSecondary.map(sr => sr.role));
    }
    
    return roles;
}

// Vérifie si l'utilisateur a un rôle spécifique (principal ou secondaire actif)
export const useHasRole = (role: Role): boolean => {
    const roles = useActiveRoles();
    return roles.includes(role);
}