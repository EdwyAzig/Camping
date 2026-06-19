"use client";

import { useEffect, useRef, useState } from "react";
import { ScanBarcode, X, Keyboard, Camera, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { lookupBarcodeProduct } from "@/lib/open-food-facts";
import type { OffProduct } from "@/lib/open-food-facts";
import {
  feedbackOnScan,
  scanBarcodeFromFile,
  startBarcodeScanner,
  type ScanEngine,
  type ScannerHandle,
} from "@/lib/barcode-scanner-engine";

interface BarcodeScannerProps {
  open: boolean;
  onClose: () => void;
  onDetected: (product: OffProduct) => void;
}

function ScanGuide() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4">
      <div
        className="relative w-full max-w-[340px] h-[30vw] max-h-[130px] min-h-[72px] rounded-xl border-2 border-ember bg-transparent"
        style={{ boxShadow: "0 0 0 100vmax rgba(0,0,0,0.55)" }}
      >
        <div className="absolute inset-x-4 top-1/2 h-0.5 bg-ember/90 -translate-y-1/2" />
        <p className="absolute -bottom-7 left-0 right-0 text-center text-[11px] text-cream/80">
          Allinea il codice qui
        </p>
      </div>
    </div>
  );
}

export function BarcodeScanner({ open, onClose, onDetected }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const handleRef = useRef<ScannerHandle | null>(null);
  const busyRef = useRef(false);
  const onDetectedRef = useRef(onDetected);
  const onCloseRef = useRef(onClose);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [mode, setMode] = useState<"camera" | "manual">("camera");
  const [engine, setEngine] = useState<ScanEngine | null>(null);
  const [status, setStatus] = useState("");

  onDetectedRef.current = onDetected;
  onCloseRef.current = onClose;

  async function stopScanner() {
    const h = handleRef.current;
    handleRef.current = null;
    setEngine(null);
    if (h) await h.stop();
  }

  async function lookupAndDeliver(code: string, fromManual = false) {
    const cleaned = code.replace(/\D/g, "");
    if (cleaned.length < 8 || busyRef.current) return;

    busyRef.current = true;
    await stopScanner();
    feedbackOnScan();
    setError(null);
    setStatus("Carico prodotto…");

    let product: OffProduct;
    try {
      product = await lookupBarcodeProduct(cleaned);
    } catch {
      product = {
        barcode: cleaned,
        name: "",
        brand: null,
        imageUrl: null,
        foodType: null,
        packSize: null,
        quantity: "1",
        category: "cibo",
        found: false,
      };
      if (fromManual) setError("Errore di rete");
    }

    busyRef.current = false;
    onDetectedRef.current(product);
    onCloseRef.current();
  }

  async function bootCamera() {
    if (busyRef.current) return;
    const video = videoRef.current;
    if (!video) return;

    await stopScanner();
    setStatus("Avvio fotocamera posteriore…");
    setError(null);

    try {
      const handle = await startBarcodeScanner(video, (code) => {
        void lookupAndDeliver(code);
      });
      handleRef.current = handle;
      setEngine(handle.engine);
      setStatus("Punta la fotocamera posteriore sul codice");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fotocamera non disponibile");
      setStatus("");
      setMode("manual");
    }
  }

  useEffect(() => {
    if (!open) {
      busyRef.current = false;
      void stopScanner();
      setError(null);
      setStatus("");
      setMode("camera");
      return;
    }

    if (mode !== "camera") {
      void stopScanner();
      return;
    }

    const t = setTimeout(() => {
      requestAnimationFrame(() => void bootCamera());
    }, 150);

    return () => {
      clearTimeout(t);
      void stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode]);

  async function handlePhotoScan(file: File) {
    setStatus("Leggo foto…");
    const code = await scanBarcodeFromFile(file);
    if (code) void lookupAndDeliver(code, true);
    else {
      setError("Codice non leggibile");
      setStatus("");
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black md:bg-night/90 md:items-center md:justify-center md:p-6">
      {/* Mobile: fullscreen. Desktop: card centrata */}
      <div
        className="flex flex-col flex-1 w-full md:flex-none md:max-w-lg md:rounded-2xl md:border md:border-glass-border md:overflow-hidden md:bg-night md:shadow-2xl md:max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 bg-night/95 border-b border-glass-border shrink-0 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <span className="text-sm font-medium text-cream flex items-center gap-2">
            <ScanBarcode className="w-5 h-5 text-ember" />
            Scanner
          </span>
          <div className="flex items-center gap-2">
            {mode === "camera" && (
              <button
                type="button"
                onClick={() => void bootCamera()}
                className="p-2 text-cream/50 hover:text-cream rounded-lg"
                aria-label="Riavvia fotocamera"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => { void stopScanner(); onClose(); }}
              className="p-2 text-cream/50 hover:text-cream rounded-lg"
              aria-label="Chiudi"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {mode === "camera" ? (
          <>
            <div className="relative flex-1 min-h-[45vh] md:min-h-0 md:h-[min(56vh,420px)] bg-black overflow-hidden">
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                playsInline
                muted
                autoPlay
              />
              <ScanGuide />
            </div>

            <div className="shrink-0 bg-night border-t border-glass-border px-4 py-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <p className="text-xs text-center text-cream/55 mb-3">
                {status || (engine ? "Tieni il telefono verticale, codice al centro" : "…")}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { void stopScanner(); setMode("manual"); }}
                  className="flex-1 py-3 text-xs text-cream/70 bg-white/5 rounded-xl flex items-center justify-center gap-1.5"
                >
                  <Keyboard className="w-4 h-4" /> Codice manuale
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-3 text-xs text-cream/70 bg-white/5 rounded-xl flex items-center justify-center gap-1.5"
                >
                  <Camera className="w-4 h-4" /> Da foto
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 p-4 space-y-4 bg-night pb-[max(1rem,env(safe-area-inset-bottom))]">
            <form onSubmit={(e) => { e.preventDefault(); void lookupAndDeliver(manualCode, true); }}>
              <Label className="text-xs">Codice EAN</Label>
              <Input
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.replace(/\D/g, ""))}
                placeholder="8001234567890"
                inputMode="numeric"
                autoFocus
                className="font-mono text-lg mt-1"
              />
              <Button type="submit" className="w-full mt-3" disabled={manualCode.length < 8}>
                Cerca prodotto
              </Button>
            </form>
            <button
              type="button"
              onClick={() => { setMode("camera"); setError(null); }}
              className="w-full text-sm text-cream/50 hover:text-cream"
            >
              Torna alla fotocamera
            </button>
          </div>
        )}

        {error && (
          <p className="text-xs text-red-300 text-center px-4 py-2 bg-red-950/40 shrink-0">{error}</p>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handlePhotoScan(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
