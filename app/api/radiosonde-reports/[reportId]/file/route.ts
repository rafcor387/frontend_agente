import { NextRequest, NextResponse } from "next/server";

import { DJANGO_API } from "@/lib/config";


type RouteContext = {
  params: Promise<{ reportId: string }>;
};


export async function GET(request: NextRequest, context: RouteContext) {
  const { reportId } = await context.params;
  if (!/^\d+$/.test(reportId) || Number(reportId) <= 0) {
    return NextResponse.json(
      { error: "reportId debe ser un entero positivo." },
      { status: 400 }
    );
  }

  const download = request.nextUrl.searchParams.get("download") === "true";
  const upstreamUrl = new URL(
    `/feature/radiosonde-reports/${reportId}/file/`,
    DJANGO_API
  );
  if (download) upstreamUrl.searchParams.set("download", "true");

  try {
    const upstream = await fetch(upstreamUrl, { cache: "no-store" });
    const body = await upstream.arrayBuffer();
    const headers = new Headers();
    for (const name of [
      "content-type",
      "content-disposition",
      "cache-control",
      "etag",
    ]) {
      const value = upstream.headers.get(name);
      if (value) headers.set(name, value);
    }
    return new NextResponse(body, { status: upstream.status, headers });
  } catch (error) {
    console.error("Error proxying radiosonde report PDF:", error);
    return NextResponse.json(
      { error: "No se pudo recuperar el informe PDF." },
      { status: 502 }
    );
  }
}
