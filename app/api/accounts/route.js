import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("practice");
    const products = await db.collection("products").find().toArray();
    return Response.json(products);
  } catch (error) {
    console.error("Database error:", error);
    return Response.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const client = await clientPromise;
    const db = client.db("practice");
    const { name, price } = await req.json();
    const newProduct = { name, price };
    const result = await db.collection("products").insertOne(newProduct);
    return Response.json({ _id: result.insertedId, ...newProduct });
  } catch (error) {
    console.error("Database error:", error);
    return Response.json({ error: "Failed to create product" }, { status: 500 });
  }
} 