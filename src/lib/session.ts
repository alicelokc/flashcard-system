import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { redirect } from "next/navigation";

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireUser() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");
  return session.user;
}

export async function requireTeacher() {
  const user = await requireUser();
  if (user.role !== "TEACHER") redirect("/");
  return user;
}

export async function requireStudent() {
  const user = await requireUser();
  if (user.role !== "STUDENT") redirect("/");
  return user;
}
