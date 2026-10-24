// Which role may open which part of the app. The API enforces access; this only decides
// where the UI sends people (ARCHITECTURE.md -> System Boundaries).

export type Role = 'volunteer' | 'onsite_commander' | 'office_commander' | 'admin';

export interface User {
  id: string;
  name: string;
  role: Role;
}

export const roleLabel: Record<Role, string> = {
  volunteer: 'Volunteer',
  onsite_commander: 'On-site commander',
  office_commander: 'Office commander',
  admin: 'Admin',
};

const areas: [prefix: string, roles: Role[]][] = [
  ['/volunteer', ['volunteer']],
  ['/commander', ['onsite_commander', 'office_commander']],
  ['/admin', ['admin']],
];

/** The roles allowed on a path, or 'public' when no sign-in is needed. */
export function rolesFor(path: string): Role[] | 'public' {
  const area = areas.find(([prefix]) => path === prefix || path.startsWith(`${prefix}/`));
  return area ? area[1] : 'public';
}

export function homeFor(role: Role): string {
  if (role === 'volunteer') return '/volunteer';
  if (role === 'admin') return '/admin/commanders';
  return '/commander/queue';
}

/**
 * Where to go after signing in. Only a same-site path the role may open; anything else
 * (another site, another role's area, the login page itself) falls back to the role's home.
 */
export function safeNext(next: string | null, role: Role): string {
  if (!next?.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) {
    return homeFor(role);
  }
  const path = next.split(/[?#]/)[0] ?? '';
  const roles = rolesFor(path);
  if (path === '/login' || (roles !== 'public' && !roles.includes(role))) return homeFor(role);
  return next;
}
