import { redirect } from "next/navigation";

// Server component — immediately redirect to the server-side demo login handler.
// This avoids all client-side auth complexity.
export default function DemoPage() {
  redirect("/api/demo-login");
}
