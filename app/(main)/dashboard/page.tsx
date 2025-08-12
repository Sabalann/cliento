import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { widgets } from './widgets';
import ProjectWidget from './ProjectWidget';
import FabMenu from './FabMenu';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as 'klant' | 'developer' | undefined;

  const visibleWidgets = widgets.filter(w => (role ? w.roles.includes(role) : true));

  return (
    <div className="relative">
      <FabMenu user={session?.user as any} />
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {visibleWidgets.map(w => (
          <div key={w.key} className="rounded-xl border bg-card text-card-foreground shadow p-4">
            <h2 className="text-lg font-semibold">{w.name}</h2>
            <p className="text-sm text-muted-foreground">Zichtbaar voor: {w.roles.join(', ')}</p>
            <div className="mt-3 text-sm text-muted-foreground">
              {w.key === 'projectList' ? <ProjectWidget /> : 'Widget inhoud komt hier...'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


