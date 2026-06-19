import { redirect } from "next/navigation";
import { requireUser, getUserTrip } from "@/lib/trip";
import { AppShell } from "@/components/layout/AppShell";
import { SessionPageContent } from "@/components/session/SessionPageContent";

export default async function SessionePage() {
  const user = await requireUser();
  const tripData = await getUserTrip();

  if (!tripData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <SessionPageContent trip={null} members={[]} userId={user.id} />
        </div>
      </div>
    );
  }

  const { trip, members } = tripData;

  return (
    <AppShell trip={trip} members={members}>
      <SessionPageContent trip={trip} members={members} userId={user.id} />
    </AppShell>
  );
}
