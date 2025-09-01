"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion } from "motion/react";
import Link from "next/link";
import Image from "next/image";

interface Project {
  _id: string;
  name: string;
  status: string;
  deadline?: string;
  budget?: number;
  assignedDevelopers?: any[];
  clientId?: any;
  files?: any[];
  notes?: any[];
  lastUpdated: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (sessionStatus !== 'loading' && session?.user) {
      console.log('Session ready, loading projects and user role');
      loadProjects();
      loadUserRole();
    }
  }, [session, sessionStatus]);

  async function loadUserRole() {
    if (!session?.user) return;
    try {
      console.log('Loading user role for:', session.user);
      const res = await fetch('/api/accounts');
      const data = await res.json();
      console.log('Accounts API response:', data);
      if (res.ok) {
        const user = (data.users || []).find((u: any) => 
          u.email === session.user?.email || u.username === session.user?.name
        );
        console.log('Found user:', user);
        if (user) {
          setUserRole(user.role);
          console.log('Set user role to:', user.role);
        }
      }
    } catch (e) {
      console.error('Failed to load user role:', e);
    }
  }

  async function loadProjects() {
    if (!session?.user) {
      console.log('No session available, skipping projects load');
      return;
    }
    
    try {
      setLoading(true);
      setError("");
      console.log('Loading projects...');
      const res = await fetch('/api/projects');
      console.log('Projects API response status:', res.status);
      const data = await res.json();
      console.log('Projects API response data:', data);
      if (!res.ok) throw new Error(data?.error || 'Kon projecten niet ophalen');
      setProjects(data.projects || []);
    } catch (e: any) {
      console.error('Error loading projects:', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'in_progress':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'on_hold':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Voltooid';
      case 'in_progress':
        return 'In Progress';
      case 'on_hold':
        return 'On Hold';
      case 'open':
        return 'Open';
      default:
        return status;
    }
  };

  if (sessionStatus === 'loading') {
    return (
      <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
        <div className="text-white">Sessie laden...</div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
        <div className="text-white">Niet ingelogd</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
        <div className="text-white">Projecten laden...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
        <div className="text-red-300">{error}</div>
      </div>
    );
  }

  const isClient = userRole === 'klant';
  const isDeveloper = userRole === 'developer';

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <motion.div
        className="relative rounded-2xl border border-white/20 p-6 shadow-lg bg-white/10 backdrop-blur-xl"
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Image src="/cliento-logo.svg" alt="Cliento logo" width={48} height={48} priority />
            <div>
              <h1 className="text-2xl font-semibold text-white">
                Welkom terug, {session?.user?.name}!
              </h1>
              <p className="text-white/80">
                {isClient ? 'Bekijk je projecten en voortgang' : 'Beheer je projecten en klanten'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isDeveloper && (
              <Link
                href="/projects/new"
                className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg border border-white/20 backdrop-blur-md transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nieuw Project
              </Link>
            )}
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg border border-white/20 backdrop-blur-md transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Instellingen
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Projects Grid */}
      <div className="space-y-4">
        <motion.h2
          className="text-xl font-semibold text-white"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25, ease: "easeOut", delay: 0.1 }}
        >
          Projecten ({projects.length})
        </motion.h2>

        {projects.length === 0 ? (
          <motion.div
            className="relative rounded-2xl border border-white/20 p-8 shadow-lg bg-white/10 backdrop-blur-xl text-center"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut", delay: 0.2 }}
          >
            <div className="text-white/60 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg text-white/80">Geen projecten gevonden</p>
              <p className="text-sm text-white/60">
                {isDeveloper ? 'Begin door een nieuw project aan te maken' : 'Er zijn nog geen projecten aan jou toegewezen'}
              </p>
            </div>
            {isDeveloper && (
              <Link
                href="/projects/new"
                className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg border border-white/20 backdrop-blur-md transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Maak je eerste project
              </Link>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project, index) => (
              <motion.div
                key={project._id}
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.25, ease: "easeOut", delay: 0.1 + index * 0.05 }}
              >
                <Link href={`/projects/${project._id}`}>
                  <div className="relative rounded-2xl border border-white/20 p-6 shadow-lg bg-white/10 backdrop-blur-xl hover:bg-white/15 transition-all duration-200 cursor-pointer group">
                    <div className="space-y-4">
                      {/* Project Header */}
                      <div className="flex items-start justify-between">
                        <h3 className="text-lg font-semibold text-white group-hover:text-white/90 transition-colors line-clamp-2">
                          {project.name}
                        </h3>
                        <div className={`px-2 py-1 rounded-md text-xs border ${getStatusColor(project.status)}`}>
                          {getStatusText(project.status)}
                        </div>
                      </div>

                      {/* Project Details */}
                      <div className="space-y-2 text-sm text-white/70">
                        {project.deadline && (
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Deadline: {new Date(project.deadline).toLocaleDateString()}
                          </div>
                        )}
                        {project.budget && (
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                            Budget: €{project.budget}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                          {(project.files || []).length} bestanden
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          {(project.notes || []).length} notities
                        </div>
                      </div>

                      {/* Last Updated */}
                      <div className="text-xs text-white/50 pt-2 border-t border-white/10">
                        Laatst bijgewerkt: {new Date(project.lastUpdated).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}




