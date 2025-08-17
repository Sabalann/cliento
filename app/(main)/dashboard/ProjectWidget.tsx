"use client";

import { useEffect, useState } from 'react';

type Project = {
  _id: string;
  name: string;
  status: string;
  deadline: string | null;
  createdAt: string;
};

export default function ProjectWidget() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Kon projecten niet ophalen');
      setProjects(data.projects || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener('project:created', handler as EventListener);
    return () => window.removeEventListener('project:created', handler as EventListener);
  }, []);

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading ? (
        <p className="text-sm text-muted-foreground">Laden...</p>
      ) : projects.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nog geen projecten.</p>
      ) : (
        <ul className="space-y-2">
          {projects.map((p) => (
            <li key={p._id}>
              <a href={`/projects/${p._id}`} className="block rounded-md border p-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{p.name}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    p.status === 'completed' ? 'bg-green-100 text-green-800' :
                    p.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    p.status === 'on_hold' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {p.status === 'open' && 'Open'}
                    {p.status === 'in_progress' && 'In Progress'}
                    {p.status === 'completed' && 'Voltooid'}
                    {p.status === 'on_hold' && 'On Hold'}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {p.deadline ? `Deadline: ${new Date(p.deadline).toLocaleDateString()}` : 'Geen deadline'}
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


