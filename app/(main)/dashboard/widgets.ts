export type UserRole = 'klant' | 'developer';

export type WidgetConfig = {
  key: string;
  name: string;
  roles: UserRole[]; // roles allowed to see this widget
};

export const widgets: WidgetConfig[] = [
  { key: 'projectList', name: 'Projecten', roles: ['developer', 'klant'] },
  { key: 'tasks', name: 'Taken', roles: ['developer'] },
  { key: 'invoices', name: 'Facturen', roles: ['klant'] },
  { key: 'messages', name: 'Berichten', roles: ['developer', 'klant'] },
];


