import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ServerApiVersion } from 'mongodb';

const uri = "mongodb+srv://sab:sabdatabase@practice.kt5d0mh.mongodb.net/?retryWrites=true&w=majority&appName=practice";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

export async function POST(request: NextRequest) {
  try {
    const { username, email, password, confirmPassword } = await request.json();

    // Validate input
    if (!username || !email || !password || !confirmPassword) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await client.connect();
    const database = client.db("practice");
    const users = database.collection("users");

    // Check if username already exists
    const existingUser = await users.findOne({ username });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingEmail = await users.findOne({ email });
    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }

    // Create new user
    const newUser = {
      username,
      email,
      password: Number(password), // Store as number to match existing format
      createdAt: new Date()
    };

    const result = await users.insertOne(newUser);

    return NextResponse.json(
      { 
        message: 'User registered successfully',
        userId: result.insertedId 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
} 