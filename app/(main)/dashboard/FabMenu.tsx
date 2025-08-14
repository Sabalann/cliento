"use client";

import { useEffect, useState } from 'react';
import { Plus, FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type SessionUser = { role?: 'developer' | 'klant' } | undefined;

export default function FabMenu({ user }: { user: SessionUser }) {
  const [open, setOpen] = useState(false);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [creating, setCreating] = useState(false);
  const isDeveloper = user?.role === 'developer';

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, []);

  const createProject = async () => {
    if (!projectName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: projectName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Aanmaken mislukt');
      setProjectName('');
      setShowProjectDialog(false);
      // Redirect to detail page right away
      if (data?.projectId) {
        window.location.href = `/projects/${data.projectId}`;
        return;
      }
      window.dispatchEvent(new Event('project:created'));
    } catch (e) {
      // noop; optionally show toast
    } finally {
      setCreating(false);
    }
  };

  if (!isDeveloper) return null;

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 h-12 w-12 rounded-full bg-black text-white shadow-lg flex items-center justify-center hover:bg-black/90"
        aria-label="Acties"
      >
        <Plus className={`h-5 w-5 transition-transform ${open ? 'rotate-45' : ''}`} />
      </button>

      {/* Menu */}
      {open && (
        <div className="fixed bottom-20 right-6 z-50 w-56 rounded-xl border bg-white p-2 shadow-xl">
          <button
            onClick={() => {
              setShowProjectDialog(true);
              setOpen(false);
            }}
            className="w-full flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-muted/50"
          >
            <FolderPlus className="h-4 w-4" />
            <span>Nieuw project</span>
          </button>
        </div>
      )}

      {/* Simple inline dialog */}
      {showProjectDialog && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowProjectDialog(false)}>
          <div className="w-full max-w-sm rounded-xl border bg-white p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-3">Nieuw project</h3>
            <div className="flex gap-2">
              <Input
                placeholder="Projectnaam"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="flex-1"
              />
              <Button onClick={createProject} disabled={creating || !projectName.trim()}>
                {creating ? 'Opslaan...' : 'Opslaan'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


