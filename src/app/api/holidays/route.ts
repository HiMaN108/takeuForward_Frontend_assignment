import { NextRequest, NextResponse } from "next/server";

const API_BASE = "https://calendarific.com/api/v2/holidays";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const country = searchParams.get("country");
  const year = searchParams.get("year");
  const month = searchParams.get("month");

  const apiKey = process.env.CALENDARIFIC_API_KEY;

  if (!apiKey || apiKey === "your_api_key_here") {
    return NextResponse.json(
      { error: "CALENDARIFIC_API_KEY not configured" },
      { status: 500 }
    );
  }

  if (!country || !year) {
    return NextResponse.json(
      { error: "country and year are required" },
      { status: 422 }
    );
  }

  const params = new URLSearchParams({
    api_key: apiKey,
    country,
    year,
  });

  if (month) params.append("month", month);

  try {
    const response = await fetch(`${API_BASE}?${params.toString()}`, {
      next: { revalidate: 86400 }, // cache for 24 hours
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { error: `Calendarific API error: ${response.status}`, details: text },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch holidays", details: String(err) },
      { status: 500 }
    );
  }
}
