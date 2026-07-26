import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Direct YouTube iFrame audio playback enabled' });
}
