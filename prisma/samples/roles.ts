export enum Role {
  USER = "USER",
  MODERATOR = "MODERATOR",
  ADMIN = "ADMIN",
  SUPER_ADMIN = "SUPER ADMIN",
}

type RoleRecord = {
  name: Role;
  parent?: Role | null;
};

const roles: RoleRecord[] = [
  { name: Role.SUPER_ADMIN },
  { name: Role.ADMIN, parent: Role.SUPER_ADMIN },
  { name: Role.MODERATOR, parent: Role.ADMIN },
  { name: Role.USER, parent: Role.MODERATOR },
];

export default roles;
