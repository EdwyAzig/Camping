import { requireUser, getUserTrip } from "@/lib/trip";
import { SessionManagerProvider } from "@/components/session/SessionManagerProvider";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const tripData = await getUserTrip();

  const initial = tripData
    ? { trip: tripData.trip, members: tripData.members, userId: tripData.userId }
    : { trip: null, members: [], userId: user.id };

  return <SessionManagerProvider initial={initial}>{children}</SessionManagerProvider>;
}
