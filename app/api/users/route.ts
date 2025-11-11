import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const DJANGO_API = process.env.DJANGO_API ?? "http://127.0.0.1:8000";

export async function GET() {
  const cookieStore = await cookies();
  const access = cookieStore.get("access")?.value;

  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // ✅ Call your Django users endpoint
    const res = await fetch(`${DJANGO_API}/usuarios/users/`, {
      headers: {
        Authorization: `Bearer ${access}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      return NextResponse.json(error, { status: res.status });
    }

    const users = await res.json();
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}