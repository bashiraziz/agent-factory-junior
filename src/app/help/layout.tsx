import type { ReactNode } from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { StudentTabBar } from "@/components/student-tab-bar";

export default async function HelpLayout({ children }: { children: ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  let showTabBar = false;
  if (session?.user) {
    const [profile] = await db
      .select({ role: profiles.role })
      .from(profiles)
      .where(eq(profiles.userId, session.user.id));
    showTabBar = profile?.role === "student";
  }

  return (
    <>
      {children}
      {showTabBar && <StudentTabBar />}
    </>
  );
}
