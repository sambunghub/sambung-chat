# Teams & Workspace Concept

**Version:** 1.0
**Last Updated:** January 14, 2026
**License:** AGPL-3.0

---

## Overview

SambungChat supports **personal workspace** and **team workspaces** for collaboration.

**Key Concept:** Team = Organization (single-level grouping for open-source version)

> **Note:** Advanced features (RBAC, SSO, multi-level hierarchy) are reserved for commercial SaaS offering.

---

## Workspace Types

### 1. Personal Workspace (`/app/*`)

User's private workspace for individual work.

**Characteristics:**

- Single user only
- Chats are private to user
- Can be organized with folders and tags
- Full control over models and settings

**URL Pattern:** `/app/*`

**Use Cases:**

- Individual exploration and testing
- Private projects
- Personal knowledge base

### 2. Team Workspace (`/team/[slug]/*`)

Shared workspace for team collaboration.

**Characteristics:**

- Multiple users (team members)
- Chats are shared within team
- Two roles: Admin (can manage members) and Member
- Team-scoped models, folders, tags

**URL Pattern:** `/team/[slug]/*`

**Use Cases:**

- Small teams (2-50 people)
- Project collaboration
- Knowledge sharing
- Team-wide prompt library

---

## Team Model

### Basic Structure (Open-Source MVP)

```
User
 └─ Team A (slug: "engineering")
    ├─ Members: [admin: alice, member: bob, member: charlie]
    ├─ Chats: [shared, visible to all members]
    ├─ Folders: [team-scoped]
    └─ Tags: [team-scoped]
 └─ Team B (slug: "marketing")
    ├─ Members: [admin: diana, member: eve]
    └─ ...
```

**Key Points:**

- **Single level:** No organization hierarchy
- **User-selectable slug:** `engineering`, `marketing-team`, etc.
- **Two roles only:** `admin` or `member`
- **Isolated data:** Teams cannot see each other's data

---

## Access Control

### Team Member Roles

| Role       | Permissions                                                                                      |
| ---------- | ------------------------------------------------------------------------------------------------ |
| **Admin**  | - Create/delete team chats<br>- Invite/remove members<br>- Update team settings<br>- Delete team |
| **Member** | - View team chats<br>- Create team chats<br>- Use team models<br>- Leave team                    |

### Joining a Team

**Methods:**

1. **Create team:** User becomes admin automatically
2. **Email invite:** Existing member sends invite link
3. **Public link:** (Future) Team can be discoverable (not in MVP)

---

## Data Isolation

### Chats

```sql
chats:
├── user_id UUID NOT NULL       -- Always set (creator)
├── team_id UUID                -- NULL = personal, NOT NULL = team
└── Public visibility depends on team_id
```

**Rules:**

- `team_id = NULL` → Personal chat (only user can see)
- `team_id = 'xyz'` → Team chat (all team members can see)

### Folders & Tags

**Scoped to workspace:**

| Resource   | Personal                          | Team                                |
| ---------- | --------------------------------- | ----------------------------------- |
| **Folder** | `user_id = yours, team_id = NULL` | `user_id = NULL, team_id = team.id` |
| **Tag**    | `user_id = yours, team_id = NULL` | `user_id = NULL, team_id = team.id` |

**Rule:** A folder/tag is EITHER personal OR team, never both.

---

## Slug Management

### Slug Rules

| Rule              | Value                                               |
| ----------------- | --------------------------------------------------- |
| **Format**        | 3-50 characters                                     |
| **Allowed chars** | Lowercase letters (a-z), numbers (0-9), hyphens (-) |
| **Pattern**       | `/^[a-z0-9-]{3,50}$/`                               |
| **Uniqueness**    | Enforced at DB level                                |
| **Changeable**    | Yes, with redirect from old slug                    |

### Slug Validation

```typescript
function validateSlug(slug: string): { valid: boolean; error?: string } {
  if (!slug || slug.length < 3 || slug.length > 50) {
    return { valid: false, error: 'Slug must be 3-50 characters' };
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { valid: false, error: 'Only lowercase letters, numbers, and hyphens allowed' };
  }

  if (slug.startsWith('-') || slug.endsWith('-')) {
    return { valid: false, error: 'Cannot start or end with hyphen' };
  }

  if (slug.includes('--')) {
    return { valid: false, error: 'Cannot have consecutive hyphens' };
  }

  return { valid: true };
}
```

### Slug Changes

When slug changes:

1. Store old→new mapping in `slug_redirects` table
2. Old URLs automatically redirect to new slug
3. Search engines update index (301 redirect)

---

## Public Sharing

### Team Chat → Public

**Not in MVP** - Team chats are always private to team members.

**Future (SaaS):** Option to make team chat publicly accessible via link.

### Personal Chat → Public

**Not in MVP** - Personal chats stay personal.

**Future (SaaS):** Option to generate public link for personal chat.

---

## Extensibility

### Current (Open-Source MVP)

- Single-level teams
- Two roles (admin/member)
- Email invites
- Basic member management

### Future Extension Points

**Database fields for future use:**

```sql
teams:
├── settings JSONB   -- Store additional config
└── metadata JSONB   -- Store additional attributes

team_members:
├── role TEXT         -- Currently: 'admin' | 'member'
└── -- Future: role_id REFERENCES roles(id) for RBAC
```

**Extension points:**

- JSONB `settings` field in teams table
- JSONB `metadata` field in teams table
- Text-based `role` field can evolve to role_id REFERENCES

---

## Related Documents

- **[Route Structure](./routes.md)** - Complete URL patterns and routing
- **[Database Schema](./database.md)** - Team tables and relationships
- **[Architecture](./architecture.md)** - Overall system architecture
- **[API Reference](./api-reference.md)** - Team-related API endpoints

---

## Examples

### Personal Workspace Flow

```
1. User logs in
2. Redirected to /app/chat
3. Creates personal chat: "Project Alpha Notes"
4. Organizes in folder: "Work Projects"
5. Tags with: "important", "research"
```

### Team Workspace Flow

```
1. User creates team: slug="acme-eng"
2. Becomes team admin automatically
3. Invites bob@example.com (Member role)
4. Bob accepts invite via email link
5. Both can see /team/acme-eng/chats
6. Alice creates team chat: "Daily Standup Notes"
7. Bob can see and contribute to the chat
```

---

## FAQ

**Q: Can I be in multiple teams?**
A: Yes! You can create/join multiple teams. Use workspace switcher to navigate between `/app/*` and `/team/[slug]/*`.

**Q: Can teams see each other?**
A: No. Teams are completely isolated. Team A cannot see Team B's chats, folders, or tags.

**Q: What happens if I leave a team?**
A: You lose access to all team chats, folders, and tags. The team continues without you.

**Q: Can I delete a team?**
A: Only team admins can delete teams. This permanently deletes all team data (chats, folders, tags).

**Q: Can I transfer team ownership?**
A: Not in MVP. You can delete the team or make another member admin first.

**Q: Are teams public?**
A: No. Teams are private and invite-only in MVP. Public teams may be added in future versions.

---

**"Sambung: Connect any AI model. Self-hosted. Privacy-first. Open-source forever."**
