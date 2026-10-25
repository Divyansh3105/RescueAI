import type { ComponentType } from 'react';
import { RequireRole } from '@/auth/RequireRole';
import { AuditPage } from '@/pages/commander/AuditPage';
import { MapPage } from '@/pages/commander/MapPage';
import { QueuePage } from '@/pages/commander/QueuePage';
import { TeamsPage } from '@/pages/commander/TeamsPage';
import { VolunteersPage } from '@/pages/commander/VolunteersPage';
import { CommandersPage } from '@/pages/admin/CommandersPage';
import { DataPage } from '@/pages/admin/DataPage';
import { UsersPage } from '@/pages/admin/UsersPage';
import { WeightsPage } from '@/pages/admin/WeightsPage';
import { RequestPage } from '@/pages/citizen/RequestPage';
import { LoginPage } from '@/pages/login/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { HistoryPage } from '@/pages/volunteer/HistoryPage';
import { HomePage } from '@/pages/volunteer/HomePage';
import { ProfilePage } from '@/pages/volunteer/ProfilePage';
import { RegisterPage } from '@/pages/volunteer/RegisterPage';
import { usePath } from '@/router';
import { rolesFor } from '@/routes';

// Who may open each path is decided by routes.ts (rolesFor); this only maps paths to pages.
const pages: Record<string, ComponentType> = {
  '/': RequestPage,
  '/login': LoginPage,
  '/register': RegisterPage,
  '/volunteer': HomePage,
  '/volunteer/profile': ProfilePage,
  '/volunteer/history': HistoryPage,
  '/commander/queue': QueuePage,
  '/commander/map': MapPage,
  '/commander/volunteers': VolunteersPage,
  '/commander/teams': TeamsPage,
  '/commander/audit': AuditPage,
  '/admin/commanders': CommandersPage,
  '/admin/users': UsersPage,
  '/admin/weights': WeightsPage,
  '/admin/data': DataPage,
  '/admin/audit': AuditPage,
};

export default function App() {
  const { path } = usePath();
  const Page = pages[path] ?? NotFoundPage;
  const roles = rolesFor(path);
  if (roles === 'public') return <Page />;
  return (
    <RequireRole roles={roles}>
      <Page />
    </RequireRole>
  );
}
