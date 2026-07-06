import type { ReactNode } from "react";
import { StudentTabBar } from "@/components/student-tab-bar";

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <StudentTabBar />
    </>
  );
}
