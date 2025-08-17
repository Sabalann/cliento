import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ServerApiVersion, ObjectId, GridFSBucket } from 'mongodb';
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

    // Add uploader info to files for ownership checking
    if (project.files && Array.isArray(project.files)) {
      const bucket = new GridFSBucket(db, { bucketName: 'project_files' });
      for (let i = 0; i < project.files.length; i++) {
        const file = project.files[i];
        if (file._id) {
          try {
            const gridfsFiles = await bucket.find({ _id: new ObjectId(file._id) }).toArray();
            if (gridfsFiles.length > 0) {
              const gridfsFile = gridfsFiles[0] as any;
              file.uploadedBy = gridfsFile.metadata?.uploadedBy;
            }
          } catch (err) {
            console.error('Error fetching file metadata:', err);
          }
        }
      }
    }

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

    // Handle delete operations FIRST (before other updates)
    // Handle note deletion
    if (body.deleteNoteIndex !== undefined) {
      const noteIndex = parseInt(String(body.deleteNoteIndex));
      console.log('API: Deleting note at index:', noteIndex);
      
      if (!isNaN(noteIndex) && noteIndex >= 0) {
        if (project.notes && project.notes[noteIndex]) {
          const noteToDelete = project.notes[noteIndex];
          
          // Allow deletion if user is developer OR if user authored the note
          const canDeleteNote = isDev || (noteToDelete.authorId && noteToDelete.authorId.toString() === me._id.toString());
          
          if (!canDeleteNote) {
            return NextResponse.json({ error: 'Je kunt alleen je eigen notities verwijderen' }, { status: 403 });
          }

          // Create new notes array without the deleted note
          const newNotes = project.notes.filter((_: any, idx: number) => idx !== noteIndex);
          
          await projects.updateOne(
            { _id },
            { 
              $set: { 
                notes: newNotes,
                lastUpdated: new Date() 
              }
            }
          );
          
          console.log('API: Note deleted successfully');
          return NextResponse.json({ message: 'Notitie verwijderd' });
        }
      }
      return NextResponse.json({ error: 'Ongeldige notitie index' }, { status: 400 });
    }

    // Handle file deletion
    if (body.deleteFileIndex !== undefined) {
      const fileIndex = parseInt(String(body.deleteFileIndex));
      console.log('API: Deleting file at index:', fileIndex);
      
      if (!isNaN(fileIndex) && fileIndex >= 0) {
        if (project.files && project.files[fileIndex]) {
          const fileToDelete = project.files[fileIndex];
          
          // Check file ownership by looking up GridFS metadata
          let canDeleteFile = isDev; // Developers can delete any file
          
          if (!canDeleteFile && fileToDelete._id) {
            try {
              const bucket = new GridFSBucket(db, { bucketName: 'project_files' });
              const files = await bucket.find({ _id: new ObjectId(fileToDelete._id) }).toArray();
              if (files.length > 0) {
                const file = files[0] as any;
                // Allow deletion if user uploaded the file
                canDeleteFile = file.metadata?.uploadedBy?.toString() === me._id.toString();
              }
            } catch (gridfsError) {
              console.error('GridFS lookup error:', gridfsError);
            }
          }
          
          if (!canDeleteFile) {
            return NextResponse.json({ error: 'Je kunt alleen je eigen bestanden verwijderen' }, { status: 403 });
          }
          
          // Delete from GridFS if it has an _id
          if (fileToDelete._id) {
            try {
              const bucket = new GridFSBucket(db, { bucketName: 'project_files' });
              await bucket.delete(new ObjectId(fileToDelete._id));
            } catch (gridfsError) {
              console.error('GridFS deletion error:', gridfsError);
              // Continue even if GridFS deletion fails
            }
          }
          
          // Create new files array without the deleted file
          const newFiles = project.files.filter((_: any, idx: number) => idx !== fileIndex);
          
          await projects.updateOne(
            { _id },
            { 
              $set: { 
                files: newFiles,
                lastUpdated: new Date() 
              }
            }
          );
          
          console.log('API: File deleted successfully');
          return NextResponse.json({ message: 'Bestand verwijderd' });
        }
      }
      return NextResponse.json({ error: 'Ongeldige bestand index' }, { status: 400 });
    }

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
      if (body.budget !== undefined) setField('budget', parseFloat(body.budget) || null);
      if (body.assignedDevelopers !== undefined) {
        const devIds: ObjectId[] = Array.isArray(body.assignedDevelopers)
          ? body.assignedDevelopers.map((id: any) => new ObjectId(String(id)))
          : [];
        setField('assignedDevelopers', devIds);
      }
          if (body.clientId !== undefined) {
      if (body.clientId) {
        setField('clientId', new ObjectId(String(body.clientId)));
      } else {
        setField('clientId', null);
      }
    }


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
      await projects.updateOne({ _id }, { $push: { notes: newNote } as any, $set: { lastUpdated: new Date() } });
      return NextResponse.json({ message: 'Notitie toegevoegd' });
    }

    // Only update if there are actual changes (but don't error on empty updates)
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ message: 'Geen wijzigingen om bij te werken' });
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

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    // Only developers can delete projects
    if (!canEdit(me.role)) {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
    }

    const _id = new ObjectId(id);
    const result = await projects.deleteOne({ _id });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Project verwijderd' });
  } catch (err) {
    console.error('Project DELETE error:', err);
    return NextResponse.json({ error: 'Kon project niet verwijderen' }, { status: 500 });
  } finally {
    try { await client.close(); } catch {}
  }
}



