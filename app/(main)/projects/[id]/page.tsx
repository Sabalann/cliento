"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft } from "lucide-react";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const id = params?.id as string;
  const [data, setData] = useState<any>(null);
  const [originalData, setOriginalData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");
  const [newNote, setNewNote] = useState("");
  const [clients, setClients] = useState<any[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showImages, setShowImages] = useState(true);
  const [showNotes, setShowNotes] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  async function load() {
    if (!session?.user) {
      console.log('No session available, skipping project load');
      return;
    }
    
    setLoading(true);
    setError("");
    try {
      console.log('Loading project with ID:', id);
      const res = await fetch(`/api/projects/${id}`, { 
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log('Response status:', res.status);
      const json = await res.json();
      console.log('Response data:', json);
      
      if (!res.ok) {
        throw new Error(json?.error || `HTTP ${res.status}: Kon project niet ophalen`);
      }
      
      if (!json.project) {
        throw new Error('Project data ontbreekt in response');
      }
      
      setData(json.project);
      setOriginalData(JSON.parse(JSON.stringify(json.project))); // Deep copy for comparison
    } catch (e: any) {
      console.error('Error loading project:', e);
      setError(e.message || 'Onbekende fout bij het laden van project');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { 
    if (id && sessionStatus !== 'loading' && session?.user) {
      console.log('Session ready, loading project and clients');
      load(); 
      loadClients();
    }
  }, [id, sessionStatus, session?.user]);

  async function loadCurrentUser() {
    if (!session?.user) return;
    try {
      const res = await fetch('/api/accounts');
      const data = await res.json();
      if (res.ok) {
        const user = (data.users || []).find((u: any) => 
          u.email === session.user?.email || u.username === session.user?.name
        );
        setCurrentUser(user);
      }
    } catch (e) {
      console.error('Failed to load current user:', e);
    }
  }

  useEffect(() => {
    loadCurrentUser();
  }, [session]);

  async function loadClients() {
    try {
      const res = await fetch('/api/accounts');
      const data = await res.json();
      if (res.ok) {
        setClients((data.users || []).filter((u: any) => u.role === 'klant'));
      }
    } catch (e) {
      console.error('Failed to load clients:', e);
    }
  }

  function hasDataChanged() {
    if (!data || !originalData) return false;
    
    // Compare relevant fields (exclude files and notes arrays since they have separate delete handling)
    const nameChanged = data.name !== originalData.name;
    const statusChanged = data.status !== originalData.status;
    const deadlineChanged = data.deadline !== originalData.deadline;
    const budgetChanged = data.budget !== originalData.budget;
    const clientChanged = (data.clientId?._id || data.clientId) !== (originalData.clientId?._id || originalData.clientId);
    const hasNewNote = newNote.trim() !== "";
    
    return nameChanged || statusChanged || deadlineChanged || budgetChanged || clientChanged || hasNewNote;
  }

  function canSaveChanges() {
    if (!data) return false;
    
    // Prevent saving if name is empty or only whitespace
    if (!data.name || data.name.trim() === '') return false;
    
    return hasDataChanged();
  }

  async function saveChanges() {
    setSaving(true);
    setError("");
    try {
      const updateData: any = {
        name: data.name,
        status: data.status,
        deadline: data.deadline,
        budget: data.budget,
        clientId: data.clientId?._id || data.clientId,
      };

      // Add new note if there is one
      if (newNote.trim()) {
        updateData.newNote = { text: newNote.trim() };
      }

      const res = await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Kon niet bijwerken');
      setNewNote("");
      await load(); // Reload to show changes
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  function updateData(field: string, value: any) {
    setData((prev: any) => ({ ...prev, [field]: value }));
  }

  function updateMilestone(index: number, field: string, value: any) {
    setData((prev: any) => ({
      ...prev,
      milestones: prev.milestones.map((m: any, i: number) => 
        i === index ? { ...m, [field]: value } : m
      )
    }));
  }

  async function deleteProject() {
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Kon project niet verwijderen');
      router.push('/dashboard');
    } catch (e: any) {
      setError(e.message);
    }
    setShowDeleteConfirm(false);
  }

  async function deleteNote(noteIndex: number) {
    if (!confirm('Weet je zeker dat je deze notitie wilt verwijderen?')) return;
    
    try {
      setError(""); // Clear any existing errors
      console.log('Deleting note at index:', noteIndex);
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteNoteIndex: noteIndex }),
      });
      const json = await res.json();
      console.log('Delete note response:', json);
      if (!res.ok) throw new Error(json?.error || 'Kon notitie niet verwijderen');
      await load(); // Reload to show changes
    } catch (e: any) {
      console.error('Delete note error:', e);
      setError(e.message);
    }
  }

  async function deleteFile(fileIndex: number) {
    if (!confirm('Weet je zeker dat je deze afbeelding wilt verwijderen?')) return;
    
    try {
      setError(""); // Clear any existing errors
      console.log('Deleting file at index:', fileIndex);
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteFileIndex: fileIndex }),
      });
      const json = await res.json();
      console.log('Delete file response:', json);
      if (!res.ok) throw new Error(json?.error || 'Kon bestand niet verwijderen');
      await load(); // Reload to show changes
    } catch (e: any) {
      console.error('Delete file error:', e);
      setError(e.message);
    }
  }

  async function uploadMultipleFiles(files: FileList) {
    const uploadPromises = Array.from(files).map(async (file) => {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`/api/projects/${id}/files`, { method: 'POST', body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Upload mislukt');
      return json;
    });

    try {
      setUploading(true);
      setError("");
      await Promise.all(uploadPromises);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }

  async function downloadInvoice() {
    setGeneratingInvoice(true);
    setError("");
    try {
      const response = await fetch(`/api/projects/${id}/invoice`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error || 'Kon factuur niet genereren');
      }
      
      // Create blob from response
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `factuur-${data.name || 'project'}-${new Date().getFullYear()}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGeneratingInvoice(false);
    }
  }

  if (sessionStatus === 'loading') return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="text-white">Sessie laden...</div>
    </div>
  );
  
  if (!session?.user) return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="text-white">Niet ingelogd</div>
    </div>
  );
  
  if (loading) return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="text-white">Project laden...</div>
    </div>
  );
  
  if (error) return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="text-red-300 mb-4">Fout bij laden: {error}</div>
      <button 
        onClick={() => load()} 
        className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-md border border-white/20 backdrop-blur-md transition"
      >
        Opnieuw proberen
      </button>
    </div>
  );
  
  if (!data) return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="text-white">Geen project data gevonden</div>
    </div>
  );

  const isPopulatedClient = data?.clientId && typeof data.clientId === 'object';
  const clientName = isPopulatedClient ? (data.clientId.username || data.clientId.name || data.clientId.email) : '';
  const canSave = canSaveChanges();
  const isClient = ((session?.user as any)?.role) === 'klant';

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <div className="-mt-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard" className="text-white/80 hover:text-white">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-white/60" />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-white">{data.name || 'Project'}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="flex items-center justify-between">
        {isClient ? (
          <h1 className="text-2xl font-semibold text-white">{data.name}</h1>
        ) : (
          <input 
            className="text-2xl font-semibold border-none outline-none bg-transparent text-white placeholder-white/60" 
            value={data.name || ''} 
            onChange={(e) => updateData('name', e.target.value)}
            placeholder="Project naam (verplicht)"
          />
        )}
        <div className="flex items-center gap-2">
          {isClient ? (
            <div className="px-3 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-md text-sm font-medium text-white">
              {data.status === 'open' && 'Open'}
              {data.status === 'in_progress' && 'In Progress'}
              {data.status === 'completed' && 'Voltooid'}
              {data.status === 'on_hold' && 'On Hold'}
            </div>
          ) : (
            <select className="border border-white/20 bg-white/10 backdrop-blur-md rounded-md p-2 text-white" value={data.status} onChange={(e) => updateData('status', e.target.value)}>
              <option value="open">Open</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On hold</option>
            </select>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="border border-white/20 bg-white/10 backdrop-blur-md rounded-md p-3">
          <div className="text-sm text-white/70">Klant</div>
          {isClient ? (
            <div className="font-medium text-white">{clientName || 'Geen klant toegewezen'}</div>
          ) : (
            <select 
              className="border border-white/20 bg-white/10 backdrop-blur-md rounded-md p-1 w-full text-white" 
              value={data.clientId?._id || data.clientId || ''} 
              onChange={(e) => updateData('clientId', e.target.value)}
            >
              <option value="">Selecteer klant</option>
              {clients.map((client: any) => (
                <option key={client._id} value={client._id}>
                  {client.username || client.name || client.email}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="border border-white/20 bg-white/10 backdrop-blur-md rounded-md p-3">
          <div className="text-sm text-white/70">Developer(s)</div>
          <div className="font-medium text-white">
            {Array.isArray(data.assignedDevelopers) && data.assignedDevelopers.length > 0 
              ? data.assignedDevelopers.map((dev: any) => dev.username || dev.name || dev.email).join(', ')
              : 'Geen developers toegewezen'
            }
          </div>
        </div>
        <div className="border border-white/20 bg-white/10 backdrop-blur-md rounded-md p-3">
          <div className="text-sm text-white/70">Budget</div>
          {isClient ? (
            <div className="font-medium text-white">
              {data.budget ? `€${data.budget}` : 'Geen budget ingesteld'}
            </div>
          ) : (
            <input 
              type="number" 
              className="border border-white/20 bg-white/10 backdrop-blur-md rounded-md p-1 w-full text-white placeholder-white/60" 
              placeholder="0.00"
              value={data.budget || ''} 
              onChange={(e) => updateData('budget', parseFloat(e.target.value) || null)}
            />
          )}
        </div>
        <div className="border border-white/20 bg-white/10 backdrop-blur-md rounded-md p-3">
          <div className="text-sm text-white/70">Deadline</div>
          {isClient ? (
            <div className="font-medium text-white">
              {data.deadline ? new Date(data.deadline).toLocaleDateString() : 'Geen deadline'}
            </div>
          ) : (
            <input type="date" className="border border-white/20 bg-white/10 backdrop-blur-md rounded-md p-1 w-full text-white" value={data.deadline ? new Date(data.deadline).toISOString().slice(0,10) : ''} onChange={(e) => updateData('deadline', e.target.value)} />
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div 
          className="flex items-center justify-between cursor-pointer" 
          onClick={() => setShowImages(!showImages)}
        >
          <div className="flex items-center gap-3">
            <div className="text-lg font-semibold text-white">Bestanden ({(data.files || []).length})</div>
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <input 
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                id="files"
                onChange={async (e) => {
                  const files = e.target.files;
                  if (!files || files.length === 0) return;
                  await uploadMultipleFiles(files);
                }}
              />
              <label htmlFor="files" className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded text-sm cursor-pointer border border-white/20 backdrop-blur-md transition">
                {uploading ? 'Uploaden...' : 'Upload bestand(en)'}
              </label>
            </div>
          </div>
          <div className="text-sm text-white/70">
            {showImages ? '▼ Verbergen' : '▶ Tonen'}
          </div>
        </div>
        
        {showImages && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(data.files || []).map((f: any, idx: number) => {
                // Handle both old format (with url) and new format (with _id)
                const imageSrc = f._id ? `/api/projects/${id}/files/${f._id}` : f.url;
                
                // Check if current user can delete this file
                const canDeleteThisFile = !isClient || (currentUser && f.uploadedBy === currentUser._id);
                
                return (
                  <motion.div 
                    key={idx} 
                    className="relative border border-white/20 bg-white/10 backdrop-blur-md rounded-md p-2 group"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: idx * 0.05 }}
                  >
                    {canDeleteThisFile && (
                      <button
                        onClick={() => deleteFile(idx)}
                        className="absolute top-2 right-2 bg-red-500/80 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 backdrop-blur-sm"
                        title="Verwijder afbeelding"
                      >
                        ×
                      </button>
                    )}
                    <div className="mb-2 text-xs font-medium truncate pr-8 text-white">{f.filename || 'Afbeelding'}</div>
                    {imageSrc ? (
                      <img 
                        src={imageSrc} 
                        alt={f.filename || 'project-afbeelding'} 
                        className="w-full h-32 object-cover rounded border border-white/20 cursor-pointer hover:opacity-90 transition"
                        onClick={() => setSelectedImage(imageSrc)}
                        onError={(e) => {
                          console.error('Image failed to load:', f._id || f.url);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-32 bg-white/5 rounded border border-white/20 flex items-center justify-center text-white/60 text-xs">
                        Geen afbeelding beschikbaar
                      </div>
                    )}
                    <div className="mt-1 text-xs text-white/60">
                      {f.uploadedAt && new Date(f.uploadedAt).toLocaleDateString()}
                    </div>
                  </motion.div>
                );
              })}
            </div>
            {(data.files || []).length === 0 && (
              <div className="text-sm text-white/60 text-center py-4">Geen bestanden</div>
            )}
          </>
        )}
      </div>

      <div className="space-y-2">
        <div 
          className="flex items-center justify-between cursor-pointer" 
          onClick={() => setShowNotes(!showNotes)}
        >
          <div className="text-lg font-semibold text-white">Notities ({(data.notes || []).length})</div>
          <div className="text-sm text-white/70">
            {showNotes ? '▼ Verbergen' : '▶ Tonen'}
          </div>
        </div>
        
        {showNotes && (
          <div className="grid gap-2">
            {(data.notes || []).slice().sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((n: any, originalIdx: number) => {
              // Find the original index in the unsorted array for deletion
              const actualIdx = (data.notes || []).findIndex((note: any) => 
                note.text === n.text && new Date(note.date).getTime() === new Date(n.date).getTime()
              );
              
              // Check if current user can delete this note
              const canDeleteThisNote = !isClient || (currentUser && n.authorId === currentUser._id);
              
              return (
                <div key={`${n.date}-${originalIdx}`} className="relative border border-white/20 bg-white/10 backdrop-blur-md rounded-md p-3 group">
                  {canDeleteThisNote && (
                    <button
                      onClick={() => deleteNote(actualIdx)}
                      className="absolute top-2 right-2 bg-red-500/80 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200 backdrop-blur-sm"
                      title="Verwijder notitie"
                    >
                      ×
                    </button>
                  )}
                  <div className="text-sm text-white/60 pr-8">{new Date(n.date).toLocaleString()}</div>
                  <div className="whitespace-pre-wrap text-white">{n.text}</div>
                </div>
              );
            })}
            <div className="grid gap-2">
              <textarea 
                className="border border-white/20 bg-white/10 backdrop-blur-md rounded p-2 text-white placeholder-white/60" 
                placeholder="Nieuwe notitie (wordt toegevoegd bij opslaan)" 
                value={newNote} 
                onChange={(e) => setNewNote(e.target.value)} 
                rows={3}
              />
            </div>
          </div>
        )}
      </div>

      {/* Invoice section - only show if project has client and required data */}
      {data.clientId && (
        <div className="border border-white/20 bg-white/10 backdrop-blur-md rounded-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Factuur</h3>
              <p className="text-sm text-white/80">
                Genereer een PDF factuur voor dit project
                {data.budget && ` (Bedrag: €${data.budget})`}
              </p>
            </div>
            <button
              onClick={downloadInvoice}
              disabled={generatingInvoice}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border border-white/20 backdrop-blur-md transition"
            >
              {generatingInvoice ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Genereren...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Factuur
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Save & Delete actions */}
      <div className="flex items-center justify-end gap-2 pt-4">
        {!isClient && (
          <Popover open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <PopoverTrigger asChild>
              <button className="bg-red-500/80 text-white px-4 py-2 rounded-md hover:bg-red-500 border border-red-400/50 backdrop-blur-md transition">
                Verwijderen
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-white/10 backdrop-blur-xl border-white/20">
              <div className="space-y-4">
                <h4 className="font-medium text-white">Project verwijderen</h4>
                <p className="text-sm text-white/80">
                  Weet je zeker dat je dit project wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} className="border-white/20 text-white hover:bg-white/10">
                    Annuleren
                  </Button>
                  <Button variant="destructive" onClick={deleteProject} className="bg-red-500/80 hover:bg-red-500">
                    Verwijderen
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
        <button 
          onClick={saveChanges} 
          disabled={saving || !canSave}
          className="bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed border border-white/20 backdrop-blur-md transition"
        >
          {saving ? 'Opslaan...' : 'Opslaan'}
        </button>
      </div>

      {/* Image Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div
              className="fixed top-4 left-4 z-10"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <button
                onClick={() => setSelectedImage(null)}
                className="inline-flex items-center gap-2 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white hover:text-white/90 bg-white/10 hover:bg-white/15 backdrop-blur-md transition"
              >
                <ChevronLeft className="h-4 w-4" />
                Terug
              </button>
            </motion.div>
            <motion.img
              src={selectedImage}
              alt="Enlarged project image"
              className="relative max-w-full max-h-full object-contain rounded-lg border border-white/20"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
