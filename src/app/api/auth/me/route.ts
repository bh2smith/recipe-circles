import { NextResponse } from "next/server";
import { getSessionAddress } from "@/lib/session";

export async function GET() {
  const address = await getSessionAddress();
  if (!address) {
    return NextResponse.json({ address: null }, { status: 401 });
  }
  return NextResponse.json({ address });
}
