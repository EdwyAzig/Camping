"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Tent, Flame } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const joinCode = searchParams.get("join");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push(joinCode ? `/join/${joinCode.toUpperCase()}` : "/");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-ember/25 to-ember/5 border border-ember/30 mb-5 campfire-icon ember-glow">
            <Tent className="w-9 h-9 text-ember" />
          </div>
          <h1 className="font-[family-name:var(--font-fraunces)] text-3xl md:text-4xl text-shimmer">
            Camping Control Center
          </h1>
          <p className="text-cream/55 mt-3 flex items-center justify-center gap-2 text-sm">
            <Flame className="w-4 h-4 text-ember campfire-icon" />
            Organizza il campeggio con il gruppo
          </p>
        </div>

        <Card glow gradient>
          <CardTitle>Accedi</CardTitle>
          <CardDescription className="mb-6">
            Entra con il tuo account per vedere il campeggio
          </CardDescription>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="••••••••"
                required
              />
            </div>
            {error && (
              <p className="text-red-300 text-sm bg-red-900/30 px-3 py-2 rounded-lg border border-red-800/30">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Accesso..." : "Entra"}
            </Button>
          </form>

          <p className="text-center text-sm text-cream/45 mt-6">
            Non hai un account?{" "}
            <Link
              href={joinCode ? `/register?join=${joinCode}` : "/register"}
              className="text-ember hover:underline font-medium"
            >
              Registrati
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
