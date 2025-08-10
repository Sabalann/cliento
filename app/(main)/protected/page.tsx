import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const session = await getServerSession();
  if (!session || !session.user) {
    redirect("/auth/signin");
  }
  return (
    <div>
      <h1>Beveiligde pagina</h1>
      <p>Je bent {session.user.name}</p>
    </div>
  );
}



