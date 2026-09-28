import { NextResponse } from "next/server";

import { DJANGO_API } from "@/lib/config";


type RouteContext = {
  params: Promise<{ reportId: string }>;
};


export async function GET(_request: Request, context: RouteContext) {
  const { reportId } = await context.params;
  if (!/^\d+$/.test(reportId) || Number(reportId) <= 0) {
    return NextResponse.json(
      { error: "reportId debe ser un entero positivo." },
      { status: 400 }
    );
  }

  try {
    const upstream = await fetch(
      new URL(`/feature/radiosonde-reports/${reportId}/`, DJANGO_API),
      { cache: "no-store" }
    );
    const body = await upstream.text();
    return new NextResponse(body, {
      status: upstream.status,
      headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
    });
  } catch (error) {
    console.error("Error proxying radiosonde report status:", error);
    return NextResponse.json(
      { error: "No se pudo consultar el estado del informe." },
      { status: 502 }
    );
  }
}
