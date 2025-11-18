import Link from 'next/link'
import React from 'react'

type ErrorType = 'Configuration' | 'AccessDenied' | 'Verification' | 'Default'

interface ErrorMessages {
  title: string
  description: string
}

const errorMessages: Record<ErrorType, ErrorMessages> = {
  Configuration: {
    title: "Erreur de configuration",
    description: "Il y a un problème avec la configuration du serveur. Veuillez contacter l&apos;administrateur."
  },
  AccessDenied: {
    title: "Accès refusé",
    description: "Vous n&apos;avez pas l&apos;autorisation d&apos;accéder à cette ressource."
  },
  Verification: {
    title: "Erreur de vérification",
    description: "Le lien de vérification a expiré ou a déjà été utilisé. Veuillez demander un nouveau lien de vérification."
  },
  Default: {
    title: "Une erreur s&apos;est produite",
    description: "Une erreur inattendue s&apos;est produite lors de l&apos;authentification. Veuillez réessayer."
  }
}

interface PageProps {
  searchParams: Promise<{
    error?: string
  }>
}

const ErrorPage = async ({ searchParams }: PageProps) => {
  const params = await searchParams
  const errorType = (params.error as ErrorType) || 'Default'
  const error = errorMessages[errorType] || errorMessages.Default

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          {/* Icône d'erreur */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          {/* Titre */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {error.title}
          </h1>

          {/* Description */}
          <p className="text-gray-600 mb-6">
            {error.description}
          </p>

          {/* Bouton de retour */}
          <div className="space-y-3">
            <Link
              href="/auth/signin"
              className="block w-full bg-blue-600 text-white rounded-lg px-4 py-2 font-medium hover:bg-blue-700 transition-colors"
            >
              Retour à la connexion
            </Link>
            
            <Link
              href="/"
              className="block w-full bg-gray-100 text-gray-700 rounded-lg px-4 py-2 font-medium hover:bg-gray-200 transition-colors"
            >
              Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ErrorPage