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

export async function GET() {
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
    const userDoc = await users.findOne({ $or: [{ username }, { email }] });
    if (!userDoc) return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });

    const { password, ...safe } = userDoc as any;
    return NextResponse.json({
      username: safe.username,
      email: safe.email,
      role: safe.role,
      image: safe.image,
      companyName: safe.companyName ?? '',
      BTWNumber: safe.BTWNumber ?? '',
      KVKNumber: safe.KVKNumber ?? '',
      postalCode: safe.postalCode ?? '',
      city: safe.city ?? '',
      country: safe.country ?? '',
      phoneNumber: safe.phoneNumber ?? '',
    });
  } catch (err) {
    return NextResponse.json({ error: 'Kon gegevens niet laden' }, { status: 500 });
  } finally {
    try { await client.close(); } catch {}
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const payload = await request.json();
    const { username, email, newPassword, companyName, BTWNumber, KVKNumber, postalCode, city, country, phoneNumber } = payload;

    await client.connect();
    const db = client.db('practice');
    const users = db.collection('users');
    const current = await users.findOne({ $or: [{ username: session.user.name }, { email: (session.user as any).email }] });
    if (!current) return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });

    if (typeof newPassword === 'string' && newPassword.length > 0 && newPassword.length < 6) {
      return NextResponse.json({ error: 'Wachtwoord moet minimaal 6 tekens lang zijn' }, { status: 400 });
    }

    const update: any = {};
    if (typeof username === 'string' && username.length > 0) update.username = username;
    if (typeof email === 'string' && email.length > 0) update.email = email;
    if (typeof companyName === 'string') update.companyName = companyName;
    if (typeof BTWNumber === 'string') update.BTWNumber = BTWNumber;
    if (typeof KVKNumber === 'string') update.KVKNumber = KVKNumber;
    if (typeof postalCode === 'string') update.postalCode = postalCode;
    if (typeof city === 'string') update.city = city;
    if (typeof country === 'string') update.country = country;
    if (typeof phoneNumber === 'string') update.phoneNumber = phoneNumber;
    if (typeof newPassword === 'string' && newPassword.length >= 6) update.password = newPassword;

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'Geen wijzigingen' }, { status: 400 });
    }

    await users.updateOne({ _id: current._id }, { $set: update });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: 'Opslaan mislukt' }, { status: 500 });
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
    const projects = db.collection('projects');
    const username = session.user.name as string | undefined;
    const email = (session.user as any).email as string | undefined;
    const userDoc = await users.findOne({ $or: [{ username }, { email }] });
    if (!userDoc) return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });

    const userId = userDoc._id.toString();
    // Delete projects linked to this developer or customer
    await projects.deleteMany({ $or: [{ developerId: userId }, { customerId: userId }] });
    // Delete user
    await users.deleteOne({ _id: userDoc._id });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: 'Verwijderen mislukt' }, { status: 500 });
  } finally {
    try { await client.close(); } catch {}
  }
}


