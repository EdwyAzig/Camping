"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Flame } from "lucide-react";
import { CamplyLogo } from "@/components/ui/CamplyLogo";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "@/lib/i18n/client";
import { localizeAuthError } from "@/lib/i18n/errors";
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
  const { t } = useTranslations();
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
      setError(localizeAuthError(t, authError.message));
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
          <CamplyLogo className="mx-auto h-16 sm:h-20 w-auto mb-5" priority />
          <p className="text-cream/55 flex items-center justify-center gap-2 text-sm">
            <Flame className="w-4 h-4 text-ember campfire-icon" />
            {t("common.appTaglineShort")}
          </p>
        </div>

        <Card glow gradient>
          <CardTitle>{t("auth.loginTitle")}</CardTitle>
          <CardDescription className="mb-6">
            {t("auth.loginDescription")}
          </CardDescription>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>{t("common.email")}</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("auth.emailPlaceholder")}
                required
              />
            </div>
            <div>
              <Label>{t("common.password")}</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("auth.passwordPlaceholder")}
                required
              />
            </div>
            {error && (
              <p className="text-red-300 text-sm bg-red-900/30 px-3 py-2 rounded-lg border border-red-800/30">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("common.loggingIn") : t("auth.loginSubmit")}
            </Button>
          </form>

          <p className="text-center text-sm text-cream/45 mt-6">
            {t("auth.noAccount")}{" "}
            <Link
              href={joinCode ? `/register?join=${joinCode}` : "/register"}
              className="text-ember hover:underline font-medium"
            >
              {t("auth.registerLink")}
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
