import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ServerApiVersion } from 'mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';

const uri = process.env.MONGODB_URI || "mongodb+srv://sab:sabdatabase@practice.kt5d0mh.mongodb.net/?retryWrites=true&w=majority&appName=practice";
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Geen bestand geüpload' }, { status: 400 });
    }

    // For demo: store as base64 in DB. In production use S3 or similar.
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = file.type || 'image/png';
    const dataUrl = `data:${mimeType};base64,${base64}`;

    await client.connect();
    const db = client.db('practice');
    const users = db.collection('users');
    const username = session.user.name as string | undefined;
    const email = (session.user as any).email as string | undefined;
    const current = await users.findOne({ $or: [{ username }, { email }] });
    if (!current) return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });

    await users.updateOne({ _id: current._id }, { $set: { image: dataUrl } });
    return NextResponse.json({ ok: true, image: dataUrl });
  } catch (err) {
    return NextResponse.json({ error: 'Upload mislukt' }, { status: 500 });
  } finally {
    try { await client.close(); } catch {}
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }
    await client.connect();
    const db = client.db('practice');
    const users = db.collection('users');
    const username = session.user.name as string | undefined;
    const email = (session.user as any).email as string | undefined;
    const current = await users.findOne({ $or: [{ username }, { email }] });
    if (!current) return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });
    await users.updateOne({ _id: current._id }, { $unset: { image: "" } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: 'Verwijderen mislukt' }, { status: 500 });
  } finally {
    try { await client.close(); } catch {}
  }
}


