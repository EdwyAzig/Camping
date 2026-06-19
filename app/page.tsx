import { redirect } from "next/navigation";
import { getCurrentUser, getUserTrip } from "@/lib/trip";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const tripData = await getUserTrip();
  if (!tripData) redirect("/onboarding");

  redirect("/dashboard");
}
