import { Context } from "hono";
import { createMiddleware } from "hono/factory";
import db from "@/libs/db";

interface RoleMiddlewareOptions {
  roles: string[];
  strict?: boolean;
}

/**
 * Role-based access control middleware for Hono.js.
 *
 * This middleware checks the user's role against a list of allowed roles and
 * grants or denies access based on the specified options. It supports both
 * strict and hierarchical role checks.
 *
 * @param {RoleMiddlewareOptions} options - The options for role-based access control.
 * @param {string[]} options.roles - An array of role names that are allowed access.
 * @param {boolean} [options.strict=true] - If true, only exact role matches are allowed.
 *   If false, allows access to roles that are equal to or higher in hierarchy than
 *   the minimum specified role.
 * @returns {Function} The middleware function to use in Hono.js routes.
 */
const roleMiddleware = ({ roles, strict = true }: RoleMiddlewareOptions) =>
  createMiddleware(async (c: Context, next) => {
    const userRole = c.get("userRole");

    if (!userRole) {
      return c.json(
        { message: "Unauthorized: Role not found" },
        { status: 403 }
      );
    }

    if (strict) {
      const hasAccess = roles.includes(userRole);
      if (!hasAccess) {
        return c.json(
          { message: "Unauthorized: Access denied" },
          { status: 403 }
        );
      }
    } else {
      const minRole = roles[0];
      const roleHierarchy = await getFilteredRoleHierarchy(userRole, minRole);
      const minRoleIndex = roleHierarchy.indexOf(minRole);
      const userRoleIndex = roleHierarchy.indexOf(userRole);
      const hasAccess = userRoleIndex >= minRoleIndex;

      if (!hasAccess) {
        return c.json(
          { message: "Unauthorized: Access denied" },
          { status: 403 }
        );
      }
    }

    await next();
  });

/**
 * Retrieves a filtered role hierarchy from the given role name to the minimum role.
 *
 * This function fetches the role's hierarchy starting from the specified role name
 * down to the minimum role provided. It returns an array of role names representing
 * the filtered hierarchy.
 *
 * @param {string} roleName The name of the role to start fetching the hierarchy from.
 * @param {string} minRole The minimum role to include in the filtered hierarchy.
 * @returns {Promise<string[]>} A promise that resolves to an array of role names in the filtered hierarchy.
 */
const getFilteredRoleHierarchy = async (
  roleName: string,
  minRole: string
): Promise<string[]> => {
  const hierarchy = await getRoleHierarchy(roleName);

  const minRoleIndex = hierarchy.indexOf(minRole);
  return hierarchy.slice(minRoleIndex >= 0 ? minRoleIndex : 0);
};

/**
 * Recursively fetches a role's hierarchy from the database.
 *
 * Given a role name, fetches the role and its parent role recursively until
 * there are no more parent roles. Returns an array of role names from the
 * given role to the topmost parent role.
 *
 * @param {string} roleName The name of the role to fetch the hierarchy for.
 * @returns {Promise<string[]>} A promise that resolves to an array of role names.
 */
const getRoleHierarchy = async (roleName: string): Promise<string[]> => {
  const roleHierarchy = await db.role.findUnique({
    where: { name: roleName },
    include: {
      parent: true,
    },
  });

  const hierarchy: string[] = [];

  if (roleHierarchy) {
    hierarchy.push(roleHierarchy.name);

    if (roleHierarchy.parent) {
      const parentHierarchy = await getRoleHierarchy(roleHierarchy.parent.name);
      hierarchy.push(...parentHierarchy);
    }
  }

  return hierarchy;
};

export default roleMiddleware;
