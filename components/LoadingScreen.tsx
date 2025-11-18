// components/LoadingScreen.tsx
import { Loader2 } from 'lucide-react'

interface LoadingScreenProps {
  size?: number
  className?: string
}

const LoadingScreen = ({ size = 8, className = '' }: LoadingScreenProps) => {
  return (
    <div className={`min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 ${className}`}>
      <Loader2 className={`w-${size} h-${size} animate-spin text-[#800080]`} />
    </div>
  )
}

export default LoadingScreen