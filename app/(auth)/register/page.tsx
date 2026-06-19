"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Tent, Flame } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const joinCode = searchParams.get("join");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      router.push(joinCode ? `/join/${joinCode.toUpperCase()}` : "/onboarding");
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-ember/25 to-ember/5 border border-ember/30 mb-5 campfire-icon ember-glow">
            <Tent className="w-9 h-9 text-ember" />
          </div>
          <h1 className="font-[family-name:var(--font-fraunces)] text-3xl md:text-4xl text-shimmer">
            Crea account
          </h1>
          <p className="text-cream/55 mt-3 flex items-center justify-center gap-2 text-sm">
            <Flame className="w-4 h-4 text-ember campfire-icon" />
            Registrazione veloce per il gruppo
          </p>
        </div>

        <Card glow gradient>
          <CardTitle>Registrati</CardTitle>
          <CardDescription className="mb-6">
            Ci vogliono 30 secondi — poi organizzate tutto insieme
          </CardDescription>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Il tuo nome</Label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Marco"
                required
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
              />
            </div>
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimo 6 caratteri"
                minLength={6}
                required
              />
            </div>
            {error && (
              <p className="text-red-300 text-sm bg-red-900/30 px-3 py-2 rounded-lg border border-red-800/30">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creazione..." : "Unisciti al gruppo"}
            </Button>
          </form>

          <p className="text-center text-sm text-cream/45 mt-6">
            Hai già un account?{" "}
            <Link
              href={joinCode ? `/login?join=${joinCode}` : "/login"}
              className="text-ember hover:underline font-medium"
            >
              Accedi
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
