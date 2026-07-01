"use client";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";

export function LogoutButton() {
  const router = useRouter();
  async function handleSignOut() {
    // Invalidate seat & child sessions server-side (nulls sessionToken in DB
    // and clears the cookies) alongside Better Auth signOut.
    await Promise.allSettled([
      fetch("/api/logout", { method: "POST" }),
      signOut(),
    ]);
    router.push("/sign-in");
  }
  return (
    <button
      onClick={handleSignOut}
      className="px-3 py-1.5 rounded-pill font-sans font-extrabold text-xs transition-colors"
      style={{ background: "#F0E7D6", color: "#5C5747" }}
    >
      Sign out
    </button>
  );
}
