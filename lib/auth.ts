import { cookies } from "next/headers";
import { jwtDecode, JwtPayload } from "jwt-decode";

// Le decimos a TypeScript qué datos extra le metimos en Django
interface MiTokenPersonalizado extends JwtPayload {
  email: string;
  rol: string;
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const access = cookieStore.get("access")?.value;

  if (!access) return null;

  try {
    const decodedToken = jwtDecode<MiTokenPersonalizado>(access);
    
    return {
      email: decodedToken.email,
      rol: decodedToken.rol,
    };
  } catch (error) {
    return null;
  }
}