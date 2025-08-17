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
    const userId = userDoc._id as ObjectId;

    let query: any = {};
    if (role === 'developer') {
      // Include projects where user is in assignedDevelopers OR projects they created (fallback)
      query = { 
        $or: [
          { assignedDevelopers: { $in: [ userId ] } },
          { createdBy: userId }
        ]
      };
    } else if (role === 'klant') {
      query = { clientId: userId };
    }

    const list = await projects
      .find(query)
      .sort({ lastUpdated: -1, createdAt: -1 })
      .toArray();
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

    const body = await request.json();
    const {
      name,
      status = 'open',
      deadline,
      budget,
      assignedDevelopers = [],
      clientId,
      milestones = [],
      files = [],
      notes = [],
    } = body || {};

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Projectnaam is verplicht' }, { status: 400 });
    }
    // For quick-create from FAB, clientId may be omitted. When omitted, we keep it null for now.
    if (!['open', 'in_progress', 'completed', 'on_hold'].includes(status)) {
      return NextResponse.json({ error: 'Ongeldige status' }, { status: 400 });
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

    // Validate clientId if provided
    let clientObjectId: ObjectId | null = null;
    if (clientId) {
      try {
        clientObjectId = new ObjectId(clientId);
      } catch {
        return NextResponse.json({ error: 'Ongeldige clientId' }, { status: 400 });
      }
      const clientUser = await users.findOne({ _id: clientObjectId });
      if (!clientUser) {
        return NextResponse.json({ error: 'Ongeldige clientId' }, { status: 400 });
      }
    }

    // Normalize and validate assignedDevelopers
    let devIds: ObjectId[] = Array.isArray(assignedDevelopers)
      ? assignedDevelopers
          .map((id: any) => {
            try { return new ObjectId(String(id)); } catch { return null; }
          })
          .filter((v: any): v is ObjectId => v !== null)
      : [];
    // Ensure the creating developer is assigned by default
    if (!devIds.some(d => d.toString() === (userDoc._id as ObjectId).toString())) {
      devIds = [userDoc._id as ObjectId, ...devIds];
    }

    const newProject = {
      name: name.trim(),
      status,
      deadline: deadline ? new Date(deadline) : null,
      assignedDevelopers: devIds,
      clientId: clientObjectId,
      createdBy: userDoc._id as ObjectId, // Track who created the project
      milestones: Array.isArray(milestones)
        ? milestones.map((m: any) => ({
            title: String(m?.title || ''),
            description: String(m?.description || ''),
            dueDate: m?.dueDate ? new Date(m.dueDate) : null,
            completed: Boolean(m?.completed) || false,
          }))
        : [],
      files: Array.isArray(files)
        ? files.map((f: any) => ({
            filename: String(f?.filename || ''),
            url: String(f?.url || ''),
            uploadedAt: f?.uploadedAt ? new Date(f.uploadedAt) : new Date(),
          }))
        : [],
      notes: Array.isArray(notes)
        ? notes.map((n: any) => ({
            authorId: n?.authorId ? new ObjectId(String(n.authorId)) : (userDoc._id as ObjectId),
            text: String(n?.text || ''),
            date: n?.date ? new Date(n.date) : new Date(),
          }))
        : [],
      lastUpdated: new Date(),
      createdAt: new Date(),
    } as any;

    const result = await projects.insertOne(newProject);
    return NextResponse.json({ message: 'Project aangemaakt', projectId: result.insertedId }, { status: 201 });
  } catch (err) {
    console.error('Projects POST error:', err);
    return NextResponse.json({ error: 'Kon project niet aanmaken' }, { status: 500 });
  } finally {
    try { await client.close(); } catch {}
  }
}


