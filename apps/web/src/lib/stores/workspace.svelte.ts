import { writable, derived, get } from 'svelte/store';

/**
 * Workspace types and interfaces
 */

export interface Workspace {
  type: 'personal' | 'team';
  id: string;
  name: string;
  slug?: string;
}

export interface Team {
  id: string;
  name: string;
  slug: string;
  memberCount?: number;
  onlineCount?: number;
  avatar?: string;
}

/**
 * Workspace Store
 *
 * Manages the current workspace state (personal or team)
 * and provides methods to switch between workspaces.
 */
function createWorkspaceStore() {
  const { subscribe, set, update } = writable<Workspace>({
    type: 'personal',
    id: 'personal',
    name: 'Personal',
  });

  return {
    subscribe,

    /**
     * Set the workspace to a specific state
     */
    setWorkspace: (workspace: Workspace) => set(workspace),

    /**
     * Switch to a team workspace
     */
    switchToTeam: (team: Team) =>
      set({
        type: 'team',
        id: team.id,
        name: team.name,
        slug: team.slug,
      }),

    /**
     * Switch to personal workspace
     */
    switchToPersonal: () =>
      set({
        type: 'personal',
        id: 'personal',
        name: 'Personal',
      }),

    /**
     * Update workspace name
     */
    updateName: (name: string) => update((workspace) => ({ ...workspace, name })),
  };
}

export const workspace = createWorkspaceStore();

/**
 * Derived store for workspace-aware base path
 *
 * Returns the base URL path for the current workspace:
 * - Personal: '/app'
 * - Team: '/team/[slug]'
 */
export const workspaceBasePath = derived(workspace, ($workspace) =>
  $workspace.type === 'team' ? `/team/${$workspace.slug}` : '/app'
);

/**
 * Derived store for current workspace type
 */
export const workspaceType = derived(workspace, ($workspace) => $workspace.type);

/**
 * Derived store for whether current workspace is a team
 */
export const isTeamWorkspace = derived(workspace, ($workspace) => $workspace.type === 'team');

/**
 * Helper function to build a workspace-aware path
 *
 * @param relativePath - The relative path (e.g., '/chat', '/prompts')
 * @returns Full path including workspace base
 */
export function buildWorkspacePath(relativePath: string): string {
  const w = get(workspace);
  const basePath = w.type === 'team' ? `/team/${w.slug}` : '/app';

  return `${basePath}${relativePath}`;
}
