import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const DJANGO_API = process.env.DJANGO_API ?? "http://127.0.0.1:8000";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const access = cookieStore.get("access")?.value;

  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json(); // { RECEIVER_EMAIL: "..." }

    const res = await fetch(`${DJANGO_API}/usuarios/api/enviar-correo/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      return NextResponse.json(error, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}