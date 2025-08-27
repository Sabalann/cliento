import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ServerApiVersion, ObjectId, GridFSBucket } from 'mongodb'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth'
import { Readable } from 'stream'

const uri = process.env.MONGODB_URI || "mongodb+srv://sab:sabdatabase@practice.kt5d0mh.mongodb.net/?retryWrites=true&w=majority&appName=practice";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!id) return NextResponse.json({ error: 'ID ontbreekt' }, { status: 400 })
  const session = await getServerSession(authOptions)
  if (!session || !session.user) return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })

  const client = new MongoClient(uri, {
    serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
  })

  try {
    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Geen bestand ontvangen' }, { status: 400 })

    await client.connect()
    const db = client.db('practice')
    const users = db.collection('users')
    const projects = db.collection('projects')

    // auth: must be assigned developer or client of project
    const username = session.user.name as string | undefined
    const email = (session.user as any).email as string | undefined
    const me = await users.findOne({ $or: [{ username }, { email }] })
    if (!me) return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 })

    const _id = new ObjectId(id)
    const project = await projects.findOne({ _id })
    if (!project) return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 })

    const mineAsDev = Array.isArray(project.assignedDevelopers) && project.assignedDevelopers.some((d: ObjectId) => d?.toString() === me._id.toString())
    const mineAsClient = project.clientId?.toString && project.clientId.toString() === me._id.toString()
    if (!mineAsDev && !mineAsClient) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })

    // Store file in GridFS
    const bucket = new GridFSBucket(db, { bucketName: 'project_files' })
    // @ts-ignore - convert web stream to node stream
    const nodeStream = Readable.fromWeb(file.stream() as any)
    const uploadStream = bucket.openUploadStream(file.name, {
      metadata: {
        projectId: _id,
        uploadedBy: me._id,
        mimeType: file.type,
        size: file.size,
      },
    })

    await new Promise<void>((resolve, reject) => {
      nodeStream.pipe(uploadStream)
        .on('error', reject)
        .on('finish', () => resolve())
    })

    const fileId = uploadStream.id as ObjectId

    // Append file entry to project
    const fileEntry = {
      filename: file.name,
      url: `/api/projects/${id}/files/${fileId.toString()}`,
      uploadedAt: new Date(),
    }
    await projects.updateOne(
      { _id }, 
      { $push: { files: fileEntry }, $set: { lastUpdated: new Date() } } as any
    )

    return NextResponse.json({ message: 'Bestand geüpload', file: fileEntry })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Upload mislukt' }, { status: 500 })
  } finally {
    try { await client.close() } catch {}
  }
}


