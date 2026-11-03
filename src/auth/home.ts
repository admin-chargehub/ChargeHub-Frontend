import type { UserOut } from "@/api/client";

/**
 * Where a signed-in user belongs.
 *
 * One definition, used by login, by the catch-all route and by the role
 * gate, because three places each deciding this independently is how an
 * operator ends up signed in and looking at the customer app.
 *
 * Operators are not sent to `/ops` by force once they are inside — an
 * operator is also a person who may want to book an outlet, and bouncing
 * them out of the customer app would be worse than the bug this fixes. This
 * only decides where they *land*.
 */
export function homeFor(user: Pick<UserOut, "role"> | null | undefined): string {
  if (!user) return "/";
  return user.role === "operator" || user.role === "admin" ? "/ops" : "/";
}

export function isOperator(user: Pick<UserOut, "role"> | null | undefined): boolean {
  return user?.role === "operator" || user?.role === "admin";
}
