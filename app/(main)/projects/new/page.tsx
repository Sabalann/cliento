"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

export default function NewProjectPage() {
  const router = useRouter();
  const [developers, setDevelopers] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [status, setStatus] = useState("open");
  const [deadline, setDeadline] = useState<string>("");

  const [assignedDevelopers, setAssignedDevelopers] = useState<string[]>([]);
  const [clientId, setClientId] = useState<string>("");
  const [milestones, setMilestones] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    async function load() {
      try {
        const [devRes, usersRes] = await Promise.all([
          fetch("/api/developers"),
          fetch("/api/accounts"),
        ]);
        const devs = await devRes.json();
        const users = await usersRes.json();
        setDevelopers(devs.developers || []);
        setClients(Array.isArray(users?.users) ? users.users : []);
      } catch (e) {
        console.error(e);
      }
    }
    load();
  }, []);

  const addMilestone = () => setMilestones((m) => [...m, { title: "", description: "", dueDate: "", completed: false }]);
  const addFile = () => setFiles((f) => [...f, { filename: "", url: "" }]);
  const addNote = () => setNotes((n) => [...n, { text: "" }]);

  async function submit() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          status,
          deadline: deadline || undefined,

          assignedDevelopers,
          clientId,
          milestones,
          files,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Kon project niet aanmaken");
      router.push(`/projects/${data.projectId}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="-mt-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Nieuw Project</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <h1 className="text-xl font-semibold">Nieuw project</h1>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      <div className="grid gap-4">
        <label className="grid gap-1">
          <span className="text-sm">Naam</span>
          <input className="border rounded-md p-2" value={name} onChange={(e) => setName(e.target.value)} />
        </label>

        <label className="grid gap-1">
          <span className="text-sm">Status</span>
          <select className="border rounded-md p-2" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="open">Open</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
            <option value="on_hold">On hold</option>
          </select>
        </label>

        <label className="grid gap-1">
          <span className="text-sm">Deadline</span>
          <input type="date" className="border rounded-md p-2" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </label>

        <label className="grid gap-1">
          <span className="text-sm">Klant</span>
          <select className="border rounded-md p-2" value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">Selecteer klant</option>
            {clients.map((u: any) => (
              <option key={u._id} value={u._id}>{u.username || u.name || u.email}</option>
            ))}
          </select>
        </label>

        <label className="grid gap-1">
          <span className="text-sm">Developers</span>
          <select multiple className="border rounded-md p-2 h-28" value={assignedDevelopers} onChange={(e) => setAssignedDevelopers(Array.from(e.target.selectedOptions).map(o => o.value))}>
            {developers.map((d) => (
              <option key={d._id} value={d._id}>{d.username || d.name || d.email}</option>
            ))}
          </select>
        </label>

        <div className="space-y-2">
          <div className="font-medium">Milestones</div>
          {milestones.map((m, idx) => (
            <div key={idx} className="border rounded-md p-3 grid gap-2">
              <input className="border rounded p-2" placeholder="Titel" value={m.title} onChange={(e) => {
                const v = [...milestones]; v[idx] = { ...v[idx], title: e.target.value }; setMilestones(v);
              }} />
              <textarea className="border rounded p-2" placeholder="Beschrijving" value={m.description} onChange={(e) => {
                const v = [...milestones]; v[idx] = { ...v[idx], description: e.target.value }; setMilestones(v);
              }} />
              <input type="date" className="border rounded p-2" value={m.dueDate} onChange={(e) => {
                const v = [...milestones]; v[idx] = { ...v[idx], dueDate: e.target.value }; setMilestones(v);
              }} />
            </div>
          ))}
          <button onClick={addMilestone} className="text-blue-600 text-sm">+ Milestone</button>
        </div>

        <div className="space-y-2">
          <div className="font-medium">Bestanden</div>
          {files.map((f, idx) => (
            <div key={idx} className="border rounded-md p-3 grid gap-2">
              <input className="border rounded p-2" placeholder="Bestandsnaam" value={f.filename} onChange={(e) => {
                const v = [...files]; v[idx] = { ...v[idx], filename: e.target.value }; setFiles(v);
              }} />
              <input className="border rounded p-2" placeholder="URL" value={f.url} onChange={(e) => {
                const v = [...files]; v[idx] = { ...v[idx], url: e.target.value }; setFiles(v);
              }} />
            </div>
          ))}
          <button onClick={addFile} className="text-blue-600 text-sm">+ Bestand</button>
        </div>

        <div className="space-y-2">
          <div className="font-medium">Notities (intern)</div>
          {notes.map((n, idx) => (
            <div key={idx} className="border rounded-md p-3 grid gap-2">
              <textarea className="border rounded p-2" placeholder="Tekst" value={n.text} onChange={(e) => {
                const v = [...notes]; v[idx] = { ...v[idx], text: e.target.value }; setNotes(v);
              }} />
            </div>
          ))}
          <button onClick={addNote} className="text-blue-600 text-sm">+ Notitie</button>
        </div>

        <div>
          <button disabled={loading} onClick={submit} className="bg-blue-600 text-white px-4 py-2 rounded-md">
            {loading ? 'Opslaan...' : 'Opslaan'}
          </button>
        </div>
      </div>
    </div>
  );
}