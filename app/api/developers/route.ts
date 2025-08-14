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

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }
    await client.connect();
    const db = client.db('practice');
    const users = db.collection('users');
    const devs = await users
      .find({ role: 'developer' }, { projection: { password: 0 } })
      .sort({ username: 1 })
      .toArray();
    return NextResponse.json({ developers: devs });
  } catch (err) {
    console.error('Developers GET error:', err);
    return NextResponse.json({ error: 'Kon developers niet ophalen' }, { status: 500 });
  } finally {
    try { await client.close(); } catch {}
  }
}



