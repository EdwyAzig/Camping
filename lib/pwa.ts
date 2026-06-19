export const PWA_DISMISS_KEY = "camply-install-dismissed";
export const PWA_SPLASH_SEEN_KEY = "camply-splash-seen";

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    ("standalone" in window.navigator &&
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

export function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function canShowInstallUi(): boolean {
  if (typeof window === "undefined") return false;
  if (isStandaloneDisplay()) return false;
  return isIosDevice() || "serviceWorker" in navigator;
}

export function wasInstallDismissed(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(PWA_DISMISS_KEY) === "1";
}

export function dismissInstallPrompt(): void {
  localStorage.setItem(PWA_DISMISS_KEY, "1");
}

export function wasSplashSeenThisSession(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  return sessionStorage.getItem(PWA_SPLASH_SEEN_KEY) === "1";
}

export function markSplashSeen(): void {
  sessionStorage.setItem(PWA_SPLASH_SEEN_KEY, "1");
}

export function shouldShowSplash(): boolean {
  if (typeof window === "undefined") return true;
  if (isStandaloneDisplay()) return true;
  return !wasSplashSeenThisSession();
}

export function removeInstantSplash(): void {
  document.getElementById("instant-splash")?.classList.add("is-hidden");
}
