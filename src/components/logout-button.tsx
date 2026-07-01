"use client";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";

export function LogoutButton() {
  const router = useRouter();
  async function handleSignOut() {
    await signOut();
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
