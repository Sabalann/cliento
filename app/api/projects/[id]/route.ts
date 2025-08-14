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

function canEdit(role: string | undefined): boolean {
  return role === 'developer';
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'ID ontbreekt' }, { status: 400 });

    await client.connect();
    const db = client.db('practice');
    const users = db.collection('users');
    const projects = db.collection('projects');

    const username = session.user.name as string | undefined;
    const email = (session.user as any).email as string | undefined;
    const me = await users.findOne({ $or: [ { username }, { email } ] });
    if (!me) return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });

    const _id = new ObjectId(id);
    const project = await projects.findOne({ _id });
    if (!project) return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });

    const mineAsDev = Array.isArray(project.assignedDevelopers) && project.assignedDevelopers.some((d: ObjectId) => d?.toString() === me._id.toString());
    const mineAsClient = project.clientId?.toString && project.clientId.toString() === me._id.toString();
    if (!mineAsDev && !mineAsClient) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });

    // populate assignedDevelopers and clientId
    const devIds: ObjectId[] = (project.assignedDevelopers || []).filter(Boolean);
    const devs = await users
      .find({ _id: { $in: devIds } }, { projection: { password: 0 } })
      .toArray();
    const clientUser = project.clientId
      ? await users.findOne({ _id: project.clientId }, { projection: { password: 0 } })
      : null;

    return NextResponse.json({
      project: {
        ...project,
        assignedDevelopers: devs,
        clientId: clientUser,
      }
    });
  } catch (err) {
    console.error('Project GET by id error:', err);
    return NextResponse.json({ error: 'Kon project niet ophalen' }, { status: 500 });
  } finally {
    try { await client.close(); } catch {}
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'ID ontbreekt' }, { status: 400 });

    const body = await request.json();
    await client.connect();
    const db = client.db('practice');
    const users = db.collection('users');
    const projects = db.collection('projects');

    const username = session.user.name as string | undefined;
    const email = (session.user as any).email as string | undefined;
    const me = await users.findOne({ $or: [ { username }, { email } ] });
    if (!me) return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });

    const _id = new ObjectId(id);
    const project = await projects.findOne({ _id });
    if (!project) return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });

    const isDev = canEdit(me.role);
    const isClient = project.clientId?.toString && project.clientId.toString() === me._id.toString();

    // Authorization rules
    if (!isDev && !isClient) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });

    const update: any = {};
    const setField = (key: string, value: any) => { update[key] = value; };

    if (isDev) {
      if (body.name !== undefined) setField('name', String(body.name));
      if (body.status !== undefined) {
        const allowed = ['open', 'in_progress', 'completed', 'on_hold'];
        if (!allowed.includes(body.status)) return NextResponse.json({ error: 'Ongeldige status' }, { status: 400 });
        setField('status', body.status);
      }
      if (body.deadline !== undefined) setField('deadline', body.deadline ? new Date(body.deadline) : null);
      if (body.budget !== undefined) setField('budget', typeof body.budget === 'number' ? body.budget : Number(body.budget));
      if (body.assignedDevelopers !== undefined) {
        const devIds: ObjectId[] = Array.isArray(body.assignedDevelopers)
          ? body.assignedDevelopers.map((id: any) => new ObjectId(String(id)))
          : [];
        setField('assignedDevelopers', devIds);
      }
      if (body.clientId !== undefined) setField('clientId', new ObjectId(String(body.clientId)));
      if (Array.isArray(body.milestones)) setField('milestones', body.milestones.map((m: any) => ({
        title: String(m?.title || ''),
        description: String(m?.description || ''),
        dueDate: m?.dueDate ? new Date(m.dueDate) : null,
        completed: Boolean(m?.completed) || false,
      })));
      if (Array.isArray(body.files)) setField('files', body.files.map((f: any) => ({
        filename: String(f?.filename || ''),
        url: String(f?.url || ''),
        uploadedAt: f?.uploadedAt ? new Date(f.uploadedAt) : new Date(),
      })));
      if (Array.isArray(body.notes)) setField('notes', body.notes.map((n: any) => ({
        authorId: n?.authorId ? new ObjectId(String(n.authorId)) : me._id,
        text: String(n?.text || ''),
        date: n?.date ? new Date(n.date) : new Date(),
      })));
    }

    // Clients can add new notes
    if (isClient && body.newNote) {
      const newNote = {
        authorId: me._id as ObjectId,
        text: String(body.newNote?.text || ''),
        date: new Date(),
      };
      await projects.updateOne({ _id }, { $push: { notes: newNote }, $set: { lastUpdated: new Date() } });
      return NextResponse.json({ message: 'Notitie toegevoegd' });
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'Geen wijzigingen' }, { status: 400 });
    }

    update.lastUpdated = new Date();

    await projects.updateOne({ _id }, { $set: update });
    return NextResponse.json({ message: 'Project bijgewerkt' });
  } catch (err) {
    console.error('Project PATCH error:', err);
    return NextResponse.json({ error: 'Kon project niet bijwerken' }, { status: 500 });
  } finally {
    try { await client.close(); } catch {}
  }
}



