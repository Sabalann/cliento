import { NextRequest } from 'next/server'
import { MongoClient, ServerApiVersion, ObjectId, GridFSBucket } from 'mongodb'

const uri = process.env.MONGODB_URI || "mongodb+srv://sab:sabdatabase@practice.kt5d0mh.mongodb.net/?retryWrites=true&w=majority&appName=practice";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string, fileId: string }> }) {
  const { fileId } = await params
  const client = new MongoClient(uri, {
    serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
  })
  try {
    await client.connect()
    const db = client.db('practice')
    const bucket = new GridFSBucket(db, { bucketName: 'project_files' })
    const _fileId = new ObjectId(fileId)

    const files = await bucket.find({ _id: _fileId }).toArray()
    if (!files || files.length === 0) {
      return new Response('Not Found', { status: 404 })
    }
    const file = files[0] as any
    const contentType = file?.metadata?.mimeType || 'application/octet-stream'
    
    // Convert stream to buffer for better compatibility
    const downloadStream = bucket.openDownloadStream(_fileId)
    const chunks: Buffer[] = []
    
    const response = await new Promise<Response>((resolve, reject) => {
      downloadStream.on('data', (chunk: Buffer) => {
        chunks.push(chunk)
      })
      
      downloadStream.on('end', () => {
        const buffer = Buffer.concat(chunks)
        resolve(new Response(buffer, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000, immutable',
            'Content-Length': buffer.length.toString(),
          },
        }))
      })
      
      downloadStream.on('error', (error) => {
        console.error('Download stream error:', error)
        resolve(new Response('Download failed', { status: 500 }))
      })
    })
    
    return response
  } catch (err) {
    console.error('Download error:', err)
    return new Response('Not Found', { status: 404 })
  } finally {
    try { await client.close() } catch {}
  }
}


