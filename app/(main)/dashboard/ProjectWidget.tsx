"use client";

import { useEffect, useState } from 'react';

type Project = {
  _id: string;
  name: string;
  developerId: string;
  customerId: string;
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
            <li key={p._id} className="rounded-md border p-2 flex items-center justify-between">
              <a href={`/projects/${p._id}`} className="font-medium hover:underline">{p.name}</a>
              <span className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


