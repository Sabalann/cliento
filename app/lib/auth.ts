import GithubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoClient, ServerApiVersion } from 'mongodb';

const uri = process.env.MONGODB_URI || "mongodb+srv://sab:sabdatabase@practice.kt5d0mh.mongodb.net/?retryWrites=true&w=majority&appName=practice";

if (!uri) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

export const authOptions = {
  providers: [
    GithubProvider({
        clientId: process.env.GITHUB_ID ?? "",
        clientSecret: process.env.GITHUB_SECRET ?? "",
    }),
    CredentialsProvider({
        name: "Credentials",
        credentials: {
            username: { label: "Username", type: "text" },
            password: { label: "Password", type: "password" },
        },
        async authorize(credentials) {
            if (!credentials?.username || !credentials?.password) {
                console.log("Missing credentials");
                return null;
            }
            
            console.log("Attempting login with:", credentials.username);
            
            try {
                // Connect to MongoDB
                await client.connect();
                console.log("Connected to MongoDB");
                
                // Access your database and collection
                const database = client.db("practice");
                const users = database.collection("users");
                
                // Find user by username
                const user = await users.findOne({ username: credentials.username });
                console.log("Found user:", user);
                
                if (user && user.password === credentials.password) {
                    console.log("Password matches, returning user");
                    return {
                        id: user._id.toString(),
                        name: user.username,
                        email: user.email || `${user.username}@example.com`,
                    };
                } else {
                    console.log("User not found or password doesn't match");
                    if (user) {
                        console.log("User found but password mismatch. Expected:", user.password, "Got:", credentials.password);
                    }
                }
                
                return null;
            } catch (error) {
                console.error("Database authentication error:", error);
                if (error instanceof Error) {
                    console.error("Error details:", error.message);
                }
                return null;
            } finally {
                try {
                    // Close the connection
                    await client.close();
                } catch (closeError) {
                    console.error("Error closing connection:", closeError);
                }
            }
        },
    }), 
  ],
  secret: process.env.NEXTAUTH_SECRET,
}; 