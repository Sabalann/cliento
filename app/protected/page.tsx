import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
    const session = await getServerSession();
    if (!session || !session.user) {
        redirect("/api/auth/signin");
    }
    return (
        <div>
            <h1>Protected Page</h1>
            <p>You are {session.user.name}</p>
        </div>
    );
}