import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    const response = await fetch("http://127.0.0.1:5000/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query })
    });

    const { data, errors } = await response.json();

    if (errors && errors.length > 0) {
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
