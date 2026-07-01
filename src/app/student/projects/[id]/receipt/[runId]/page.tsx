import { redirect } from "next/navigation";

export default async function ({ params }: { params: Promise<{ id: string; runId: string }> }) {
  const { id, runId } = await params;
  redirect(`/student/projects/${id}/replay/${runId}`);
}
