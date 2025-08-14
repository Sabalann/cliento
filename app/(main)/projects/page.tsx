import Link from "next/link";
import { getServerSession } from "next-auth";

export default async function ProjectsIndexPage() {
  const session = await getServerSession();
  if (!session) {
    return <div className="p-6">Niet geautoriseerd.</div>;
  }
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/api/projects`, { cache: 'no-store' });
  const data = await res.json();
  const projects = data.projects || [];
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Projecten</h1>
        <Link href="/projects/new" className="bg-blue-600 text-white px-3 py-2 rounded-md">Nieuw project</Link>
      </div>
      <div className="grid gap-3">
        {projects.map((p: any) => (
          <Link key={p._id} href={`/projects/${p._id}`} className="border rounded-md p-3 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="font-medium">{p.name}</div>
              <div className="text-sm text-gray-500">{p.status || 'open'}</div>
            </div>
          </Link>
        ))}
        {projects.length === 0 && (
          <div className="text-sm text-gray-500">Geen projecten gevonden</div>
        )}
      </div>
    </div>
  );
}