import { Role } from "./roles";

type UserRecord = {
  name: string;
  email: string;
  username: string;
  password: string;
  role: Role;
};

const users: UserRecord[] = [
  {
    name: "Super Admin",
    email: "super@me.com",
    username: "super",
    password: "secret",
    role: Role.SUPER_ADMIN,
  },
  {
    name: "Admin",
    email: "admin@me.com",
    username: "admin",
    password: "secret",
    role: Role.ADMIN,
  },
  {
    name: "Moderator",
    email: "moderator@me.com",
    username: "moderator",
    password: "secret",
    role: Role.MODERATOR,
  },
  {
    name: "User",
    email: "user@me.com",
    username: "user",
    password: "secret",
    role: Role.USER,
  },
];

export default users;
