import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "https://mk-backend-a6c7.onrender.com/api";

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const res = await fetch(`${BACKEND_URL}/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    const json = await res.text().then(t => {
      try { return JSON.parse(t); } catch { return t; }
    });

    // If it's an envelope, return as-is (keeps statusCode)
    if (json && typeof json === "object" && ("statusCode" in json || "success" in json)) {
      return NextResponse.json(json, { status: json.statusCode || 200 });
    }

    // Otherwise forward backend response
    return NextResponse.json(json, { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ statusCode: 500, success: false, error: { message: err.message } }, { status: 500 });
  }
}
