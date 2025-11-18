// Define Role as a union type instead of an array 
export type Role = 
    | 'USER'
    | 'SUPER_ADMIN'
    | 'OPERATIONS_DIRECTOR'
    | 'FINANCIAL_MANAGER'
    | 'DATA_ANALYST'
    | 'INVENTORY_MANAGER'
    | 'STORE_MANAGER'
    | 'ASSISTANT_MANAGER'
    | 'SALES_REPRESENTATIVE';

// Define permissions object with proper typing
export const PERMISSIONS: Record<string, Role[]> = {
    // Boutiques
    'stores.view_all': ['SUPER_ADMIN', 'OPERATIONS_DIRECTOR', 'FINANCIAL_MANAGER', 'DATA_ANALYST', 'INVENTORY_MANAGER'],
    'stores.view_own': ['STORE_MANAGER', 'ASSISTANT_MANAGER', 'SALES_REPRESENTATIVE'],
    'stores.create': ['SUPER_ADMIN'],
    'stores.update': ['SUPER_ADMIN', 'OPERATIONS_DIRECTOR', 'STORE_MANAGER'],
    'stores.delete': ['SUPER_ADMIN'],

    // Produits (Product Models)
    'products.view_all': ['SUPER_ADMIN', 'OPERATIONS_DIRECTOR', 'FINANCIAL_MANAGER', 'DATA_ANALYST', 'INVENTORY_MANAGER', 'STORE_MANAGER', 'ASSISTANT_MANAGER', 'SALES_REPRESENTATIVE'],
    'products.create': ['SUPER_ADMIN', 'OPERATIONS_DIRECTOR', 'INVENTORY_MANAGER'],
    'products.update': ['SUPER_ADMIN', 'OPERATIONS_DIRECTOR', 'INVENTORY_MANAGER'],
    'products.delete': ['SUPER_ADMIN', 'OPERATIONS_DIRECTOR'],

    // Articles (Physical Items - instances of products)
    'articles.view_all': ['SUPER_ADMIN', 'OPERATIONS_DIRECTOR', 'FINANCIAL_MANAGER', 'DATA_ANALYST', 'INVENTORY_MANAGER'],
    'articles.view_store': ['STORE_MANAGER', 'ASSISTANT_MANAGER', 'SALES_REPRESENTATIVE'],
    'articles.create': ['SUPER_ADMIN', 'OPERATIONS_DIRECTOR', 'INVENTORY_MANAGER', 'STORE_MANAGER'],
    'articles.update': ['SUPER_ADMIN', 'OPERATIONS_DIRECTOR', 'INVENTORY_MANAGER', 'STORE_MANAGER'],
    'articles.delete': ['SUPER_ADMIN', 'OPERATIONS_DIRECTOR', 'INVENTORY_MANAGER'],
    'articles.transfer': ['SUPER_ADMIN', 'OPERATIONS_DIRECTOR', 'INVENTORY_MANAGER', 'STORE_MANAGER'],

    // Suppliers (fournisseur)
    'suppliers.view_all': ['SUPER_ADMIN', 'OPERATIONS_DIRECTOR', 'FINANCIAL_MANAGER', 'INVENTORY_MANAGER'],
    'suppliers.create': ['SUPER_ADMIN', 'OPERATIONS_DIRECTOR', 'INVENTORY_MANAGER'],
    'suppliers.update': ['SUPER_ADMIN', 'OPERATIONS_DIRECTOR', 'INVENTORY_MANAGER'],
    'suppliers.delete': ['SUPER_ADMIN', 'OPERATIONS_DIRECTOR'],

    // Stock
    'stock.view_global': ['SUPER_ADMIN', 'OPERATIONS_DIRECTOR', 'FINANCIAL_MANAGER', 'DATA_ANALYST', 'INVENTORY_MANAGER'],
    'stock.view_store': ['STORE_MANAGER', 'ASSISTANT_MANAGER', 'SALES_REPRESENTATIVE'],
    'stock.adjust': ['SUPER_ADMIN', 'OPERATIONS_DIRECTOR', 'INVENTORY_MANAGER', 'STORE_MANAGER'],
    'stock.transfer_request': ['SUPER_ADMIN', 'OPERATIONS_DIRECTOR', 'INVENTORY_MANAGER', 'STORE_MANAGER', 'ASSISTANT_MANAGER'],
    'stock.transfer_approve': ['SUPER_ADMIN', 'OPERATIONS_DIRECTOR', 'INVENTORY_MANAGER', 'STORE_MANAGER'],
    'stock.view_history': ['SUPER_ADMIN', 'OPERATIONS_DIRECTOR', 'FINANCIAL_MANAGER', 'DATA_ANALYST', 'INVENTORY_MANAGER', 'STORE_MANAGER', 'ASSISTANT_MANAGER'],

    // Commandes
    'orders.view_all': ['SUPER_ADMIN', 'OPERATIONS_DIRECTOR', 'FINANCIAL_MANAGER', 'DATA_ANALYST'],
    'orders.view_store': ['INVENTORY_MANAGER', 'STORE_MANAGER', 'ASSISTANT_MANAGER'],
    'orders.view_own': ['SALES_REPRESENTATIVE'],
    'orders.create': ['SUPER_ADMIN', 'OPERATIONS_DIRECTOR', 'STORE_MANAGER', 'ASSISTANT_MANAGER', 'SALES_REPRESENTATIVE'],
    'orders.update': ['SUPER_ADMIN', 'OPERATIONS_DIRECTOR', 'STORE_MANAGER', 'ASSISTANT_MANAGER'],
    'orders.cancel': ['SUPER_ADMIN', 'OPERATIONS_DIRECTOR', 'STORE_MANAGER'],

    // Utilisateurs
    'users.view_all': ['SUPER_ADMIN', 'OPERATIONS_DIRECTOR'],
    'users.view_store': ['STORE_MANAGER'],
    'users.create': ['SUPER_ADMIN', 'OPERATIONS_DIRECTOR', 'STORE_MANAGER'],
    'users.update': ['SUPER_ADMIN', 'OPERATIONS_DIRECTOR', 'STORE_MANAGER'],
    'users.delete': ['SUPER_ADMIN', 'OPERATIONS_DIRECTOR'],

    // Rapports
    'reports.view_global': ['SUPER_ADMIN', 'OPERATIONS_DIRECTOR', 'FINANCIAL_MANAGER', 'DATA_ANALYST'],
    'reports.view_store': ['INVENTORY_MANAGER', 'STORE_MANAGER', 'ASSISTANT_MANAGER'],
    'reports.financial': ['SUPER_ADMIN', 'FINANCIAL_MANAGER', 'DATA_ANALYST'],
    'reports.export': ['SUPER_ADMIN', 'OPERATIONS_DIRECTOR', 'FINANCIAL_MANAGER', 'DATA_ANALYST', 'INVENTORY_MANAGER'],

    // Incidents
    'incidents.view_all': ['SUPER_ADMIN', 'OPERATIONS_DIRECTOR'],
    'incidents.view_store': ['STORE_MANAGER', 'ASSISTANT_MANAGER'],
    'incidents.create': ['SUPER_ADMIN', 'OPERATIONS_DIRECTOR', 'STORE_MANAGER', 'ASSISTANT_MANAGER'],
    'incidents.update': ['SUPER_ADMIN', 'OPERATIONS_DIRECTOR', 'STORE_MANAGER'],
    'incidents.delete': ['SUPER_ADMIN'],
};

// Type for permission keys
export type Permission = keyof typeof PERMISSIONS;

// Fonction pour vérifier les permissions
// Helper function to check if a permission exists
export function hasPermission(Role: Role, permission: Permission): boolean {
    const allowedRoles = PERMISSIONS[permission];
    return allowedRoles ? allowedRoles.includes(Role) : false;
}

// Fonction pour vérifier plusieurs permissions (ET logique)
// Check if user has ALL specified permissions (AND logic)
export function hasAllPermissions(Role: Role, permissions: Permission[]): boolean {
    return permissions.every(permission => hasPermission(Role, permission));
}

// Fonction pour vérifier plusieurs permissions (OU logique)
// Check if user has ANY of the specified permissions (OR logic)
export function hasAnyPermission(Role: Role, permissions: Permission[]): boolean {
    return permissions.some(permission => hasPermission(Role, permission));
}

// Get all permissions for a specific role
export function getRolePermissions(Role: Role): Permission[] {
    return Object.entries(PERMISSIONS)
        .filter(([_, roles]) => roles.includes(Role))
        .map(([permission]) => permission as Permission);
}

// Check if a role is an admin role
export function isAdminRole(Role: Role): boolean {
    return Role === 'SUPER_ADMIN' || Role === 'OPERATIONS_DIRECTOR';
}