import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// Localisation par défaut
const DEFAULT_LOCATION = 'Guadeloupe';

export default async function HomePage() {
  // Lire le cookie de localisation
  const cookieStore = await cookies();
  const userLocation = cookieStore.get('userLocation')?.value;
  
  // Rediriger vers la localisation choisie ou par défaut
  const locationToRedirect = userLocation || DEFAULT_LOCATION;
  
  redirect(`/${locationToRedirect}`);
}
