import { getUserTrip } from "@/lib/trip";
import { AppShell } from "@/components/layout/AppShell";
import { SessionPageContent } from "@/components/session/SessionPageContent";

export default async function SessionePage() {
  const tripData = await getUserTrip();

  if (!tripData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <SessionPageContent />
        </div>
      </div>
    );
  }

  return (
    <AppShell trip={tripData.trip} members={tripData.members}>
      <SessionPageContent />
    </AppShell>
  );
}
