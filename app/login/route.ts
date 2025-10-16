// app/api/login/route.ts
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const formData = await req.formData()
  const email = String(formData.get('email') || '')
  const password = String(formData.get('password') || '')

  // Aquí hablarás con tu backend:
  // const backendRes = await fetch('https://tu-backend/auth/login', { method:'POST', body: JSON.stringify({email,password}), headers:{'Content-Type':'application/json'} })

  // Si OK:
  cookies().set('session', 'valor_simulado', { httpOnly: true, path: '/' })
  return NextResponse.json({ ok: true })
}
