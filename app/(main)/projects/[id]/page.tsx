"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [newNote, setNewNote] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${id}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Kon project niet ophalen');
      setData(json.project);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (id) load(); }, [id]);

  async function update(field: any) {
    setError("");
    const res = await fetch(`/api/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(field),
    });
    const json = await res.json();
    if (!res.ok) { setError(json?.error || 'Kon niet bijwerken'); return; }
    await load();
  }

  async function addNote() {
    if (!newNote.trim()) return;
    await update({ newNote: { text: newNote } });
    setNewNote("");
  }

  if (loading) return <div className="p-6">Laden...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!data) return null;

  const isPopulatedClient = data?.clientId && typeof data.clientId === 'object';
  const clientName = isPopulatedClient ? (data.clientId.username || data.clientId.name || data.clientId.email) : '';

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="-mt-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/projects">Projecten</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{data.name || 'Project'}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{data.name}</h1>
        <select className="border rounded-md p-2" value={data.status} onChange={(e) => update({ status: e.target.value })}>
          <option value="open">Open</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
          <option value="on_hold">On hold</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border rounded-md p-3">
          <div className="text-sm text-gray-500">Klant</div>
          <div className="font-medium">{clientName}</div>
        </div>
        <div className="border rounded-md p-3">
          <div className="text-sm text-gray-500">Deadline</div>
          <input type="date" className="border rounded-md p-1" value={data.deadline ? new Date(data.deadline).toISOString().slice(0,10) : ''} onChange={(e) => update({ deadline: e.target.value })} />
        </div>
        <div className="border rounded-md p-3">
          <div className="text-sm text-gray-500">Budget</div>
          <input type="number" className="border rounded-md p-1" value={data.budget ?? ''} onChange={(e) => update({ budget: Number(e.target.value) })} />
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-lg font-semibold">Milestones</div>
        <div className="grid gap-3">
          {(data.milestones || []).map((m: any, idx: number) => (
            <div key={idx} className="border rounded-md p-3 grid sm:grid-cols-4 gap-2">
              <input className="border rounded p-2 sm:col-span-1" value={m.title} onChange={(e) => {
                const next = [...data.milestones]; next[idx] = { ...next[idx], title: e.target.value }; update({ milestones: next });
              }} />
              <input className="border rounded p-2 sm:col-span-2" value={m.description} onChange={(e) => {
                const next = [...data.milestones]; next[idx] = { ...next[idx], description: e.target.value }; update({ milestones: next });
              }} />
              <input type="date" className="border rounded p-2 sm:col-span-1" value={m.dueDate ? new Date(m.dueDate).toISOString().slice(0,10) : ''} onChange={(e) => {
                const next = [...data.milestones]; next[idx] = { ...next[idx], dueDate: e.target.value }; update({ milestones: next });
              }} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!m.completed} onChange={(e) => {
                  const next = [...data.milestones]; next[idx] = { ...next[idx], completed: e.target.checked }; update({ milestones: next });
                }} /> Voltooid
              </label>
            </div>
          ))}
          {(data.milestones || []).length === 0 && (
            <div className="text-sm text-gray-500">Geen milestones</div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-lg font-semibold">Bestanden</div>
        <div className="grid gap-2">
          {(data.files || []).map((f: any, idx: number) => (
            <a key={idx} className="text-blue-600 underline break-all" href={f.url} target="_blank" rel="noreferrer">
              {f.filename || f.url}
            </a>
          ))}
          {(data.files || []).length === 0 && (
            <div className="text-sm text-gray-500">Geen bestanden</div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-lg font-semibold">Notities</div>
        <div className="grid gap-2">
          {(data.notes || []).slice().sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((n: any, idx: number) => (
            <div key={idx} className="border rounded-md p-3">
              <div className="text-sm text-gray-500">{new Date(n.date).toLocaleString()}</div>
              <div className="whitespace-pre-wrap">{n.text}</div>
            </div>
          ))}
          <div className="grid gap-2">
            <textarea className="border rounded p-2" placeholder="Nieuwe notitie" value={newNote} onChange={(e) => setNewNote(e.target.value)} />
            <button onClick={addNote} className="bg-blue-600 text-white px-3 py-2 rounded-md w-max">Notitie toevoegen</button>
          </div>
        </div>
      </div>
    </div>
  );
}