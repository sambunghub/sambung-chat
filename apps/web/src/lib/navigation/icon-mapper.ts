// Icon mapper for lucide-svelte icons
// Maps icon names from config to actual icon components

import type { Component } from 'svelte';
import * as LucideIcons from '@lucide/svelte';

// Type for icon names that we support
type IconName =
  | 'MessageSquare'
  | 'Bot'
  | 'Sparkles'
  | 'Users'
  | 'User'
  | 'Settings'
  | 'Sun'
  | 'LogOut'
  | 'Plus'
  | 'Folder'
  | 'Search'
  | 'Pin'
  | 'Pencil'
  | 'Trash2'
  | 'Check'
  | 'Copy'
  | 'Clock'
  | 'Store'
  | 'LayoutDashboard'
  | 'UserPlus';

// Icon mapper object - using Component type from Svelte
const iconMap: Record<IconName, Component> = {
  MessageSquare: LucideIcons.MessageSquare,
  Bot: LucideIcons.Bot,
  Sparkles: LucideIcons.Sparkles,
  Users: LucideIcons.Users,
  User: LucideIcons.User,
  Settings: LucideIcons.Settings,
  Sun: LucideIcons.Sun,
  LogOut: LucideIcons.LogOut,
  Plus: LucideIcons.Plus,
  Folder: LucideIcons.Folder,
  Search: LucideIcons.Search,
  Pin: LucideIcons.Pin,
  Pencil: LucideIcons.Pencil,
  Trash2: LucideIcons.Trash2,
  Check: LucideIcons.Check,
  Copy: LucideIcons.Copy,
  Clock: LucideIcons.Clock,
  Store: LucideIcons.Store,
  LayoutDashboard: LucideIcons.LayoutDashboard,
  UserPlus: LucideIcons.UserPlus,
};

// Helper function to get icon component by name
export function getIcon(iconName: string): Component | null {
  return iconMap[iconName as IconName] || null;
}

// Type guard to check if icon name is valid
export function isValidIconName(name: string): name is IconName {
  return name in iconMap;
}
