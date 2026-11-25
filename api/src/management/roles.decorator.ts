import { SetMetadata } from '@nestjs/common';

export type ManagementRole = 'editor' | 'moderator' | 'admin';

export const ROLES_KEY = 'management_roles';

export const Roles = (...roles: ManagementRole[]) =>
  SetMetadata(ROLES_KEY, roles);
