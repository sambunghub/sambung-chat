/**
 * Workspace Store Tests
 *
 * Tests for the workspace store functionality
 * Run with: bun test apps/web/src/lib/__tests__/workspace.test.ts
 */

// Vitest globals enabled - no imports needed
import {
  workspace,
  buildWorkspacePath,
  workspaceBasePath,
  workspaceType,
  isTeamWorkspace,
} from '../stores/workspace.svelte';
import { get } from 'svelte/store';

describe('Workspace Store', () => {
  beforeEach(() => {
    // Reset to personal workspace before each test
    workspace.setWorkspace({
      type: 'personal',
      id: 'personal',
      name: 'Personal',
    });
  });

  describe('Initial State', () => {
    it('should start with personal workspace', () => {
      const state = get(workspace);
      expect(state.type).toBe('personal');
      expect(state.id).toBe('personal');
      expect(state.name).toBe('Personal');
    });
  });

  describe('setWorkspace', () => {
    it('should set workspace to specific state', () => {
      workspace.setWorkspace({
        type: 'team',
        id: 'team-1',
        name: 'Engineering',
        slug: 'engineering',
      });

      const state = get(workspace);
      expect(state.type).toBe('team');
      expect(state.id).toBe('team-1');
      expect(state.name).toBe('Engineering');
      expect(state.slug).toBe('engineering');
    });
  });

  describe('switchToTeam', () => {
    it('should switch to team workspace', () => {
      workspace.switchToTeam({
        id: 'team-2',
        name: 'Design',
        slug: 'design',
      });

      const state = get(workspace);
      expect(state.type).toBe('team');
      expect(state.id).toBe('team-2');
      expect(state.name).toBe('Design');
      expect(state.slug).toBe('design');
    });
  });

  describe('switchToPersonal', () => {
    it('should switch to personal workspace', () => {
      // First switch to team
      workspace.switchToTeam({
        id: 'team-1',
        name: 'Engineering',
        slug: 'engineering',
      });

      // Then switch back to personal
      workspace.switchToPersonal();

      const state = get(workspace);
      expect(state.type).toBe('personal');
      expect(state.id).toBe('personal');
      expect(state.name).toBe('Personal');
    });
  });

  describe('updateName', () => {
    it('should update workspace name', () => {
      workspace.updateName('My Personal Space');

      const state = get(workspace);
      expect(state.name).toBe('My Personal Space');
    });
  });

  describe('Derived Stores', () => {
    it('should derive base path for personal workspace', () => {
      workspace.switchToPersonal();
      expect(get(workspaceBasePath)).toBe('/app');
    });

    it('should derive base path for team workspace', () => {
      workspace.switchToTeam({
        id: 'team-1',
        name: 'Engineering',
        slug: 'engineering',
      });
      expect(get(workspaceBasePath)).toBe('/team/engineering');
    });

    it('should derive workspace type correctly', () => {
      workspace.switchToPersonal();
      expect(get(workspaceType)).toBe('personal');

      workspace.switchToTeam({
        id: 'team-1',
        name: 'Engineering',
        slug: 'engineering',
      });
      expect(get(workspaceType)).toBe('team');
    });

    it('should derive isTeamWorkspace correctly', () => {
      workspace.switchToPersonal();
      expect(get(isTeamWorkspace)).toBe(false);

      workspace.switchToTeam({
        id: 'team-1',
        name: 'Engineering',
        slug: 'engineering',
      });
      expect(get(isTeamWorkspace)).toBe(true);
    });
  });

  describe('buildWorkspacePath', () => {
    it('should build path for personal workspace', () => {
      workspace.switchToPersonal();
      expect(buildWorkspacePath('/chat')).toBe('/app/chat');
      expect(buildWorkspacePath('/prompts')).toBe('/app/prompts');
    });

    it('should build path for team workspace', () => {
      workspace.switchToTeam({
        id: 'team-1',
        name: 'Engineering',
        slug: 'engineering',
      });
      expect(buildWorkspacePath('/chat')).toBe('/team/engineering/chat');
      expect(buildWorkspacePath('/prompts')).toBe('/team/engineering/prompts');
    });

    it('should handle empty relative path', () => {
      workspace.switchToPersonal();
      expect(buildWorkspacePath('')).toBe('/app');
    });

    it('should handle nested paths', () => {
      workspace.switchToPersonal();
      expect(buildWorkspacePath('/chat/123')).toBe('/app/chat/123');
    });
  });
});
