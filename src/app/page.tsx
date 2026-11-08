import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { HomeClient } from "@/components/HomeClient";

export default async function HomePage() {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  return <HomeClient role={session.user.role} name={session.user.name || ""} />;
}
