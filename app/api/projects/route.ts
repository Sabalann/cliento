import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ServerApiVersion, ObjectId } from 'mongodb';
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

export async function GET() {
  let session;
  try {
    session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    await client.connect();
    const db = client.db('practice');
    const users = db.collection('users');
    const projects = db.collection('projects');

    // Resolve current user id and role
    const username = session.user.name as string | undefined;
    const email = (session.user as any).email as string | undefined;
    const userDoc = await users.findOne({ $or: [ { username }, { email } ] });
    if (!userDoc) {
      return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });
    }

    const role = userDoc.role as 'developer' | 'klant' | undefined;
    const userId = userDoc._id.toString();

    let query: any = {};
    if (role === 'developer') {
      query = { developerId: userId };
    } else if (role === 'klant') {
      query = { customerId: userId };
    }

    const list = await projects.find(query).sort({ createdAt: -1 }).toArray();
    return NextResponse.json({ projects: list });
  } catch (err) {
    console.error('Projects GET error:', err);
    return NextResponse.json({ error: 'Kon projecten niet ophalen' }, { status: 500 });
  } finally {
    try { await client.close(); } catch {}
  }
}

export async function POST(request: NextRequest) {
  let session;
  try {
    session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const { name } = await request.json();
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Projectnaam is verplicht' }, { status: 400 });
    }

    await client.connect();
    const db = client.db('practice');
    const users = db.collection('users');
    const projects = db.collection('projects');

    const username = session.user.name as string | undefined;
    const email = (session.user as any).email as string | undefined;
    const userDoc = await users.findOne({ $or: [ { username }, { email } ] });
    if (!userDoc) {
      return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });
    }

    if (userDoc.role !== 'developer') {
      return NextResponse.json({ error: 'Alleen developers kunnen projecten toevoegen' }, { status: 403 });
    }

    const developerId = userDoc._id.toString();

    const newProject = {
      name: name.trim(),
      developerId,
      customerId: '',
      createdAt: new Date(),
    };

    const result = await projects.insertOne(newProject);
    return NextResponse.json({ message: 'Project aangemaakt', projectId: result.insertedId }, { status: 201 });
  } catch (err) {
    console.error('Projects POST error:', err);
    return NextResponse.json({ error: 'Kon project niet aanmaken' }, { status: 500 });
  } finally {
    try { await client.close(); } catch {}
  }
}


