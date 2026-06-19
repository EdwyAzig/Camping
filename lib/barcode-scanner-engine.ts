import { BrowserMultiFormatOneDReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import type { IScannerControls } from "@zxing/browser/esm/common/IScannerControls";

export type ScanEngine = "dual" | "zxing";

export interface ScannerHandle {
  stop: () => Promise<void>;
  engine: ScanEngine;
}

const CAMERA_CONSTRAINTS: MediaStreamConstraints = {
  audio: false,
  video: {
    facingMode: { ideal: "environment" },
    width: { ideal: 1280 },
    height: { ideal: 720 },
  },
};

function normalizeBarcode(raw: string): string | null {
  const cleaned = raw.replace(/\D/g, "");
  if (cleaned.length < 8 || cleaned.length > 14) return null;
  return cleaned;
}

declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats?: string[] }) => {
      detect(source: ImageBitmapSource): Promise<{ rawValue: string }[]>;
    };
  }
}

async function pickBackCameraId(): Promise<string | undefined> {
  try {
    const devices = await BrowserMultiFormatOneDReader.listVideoInputDevices();
    if (!devices.length) return undefined;

    const labeled = devices.find((d) =>
      /back|rear|environment|posteriore|traseir/i.test(d.label)
    );
    if (labeled) return labeled.deviceId;

    // Senza label (Safari/iOS): di solito la posteriore è l'ultima
    if (devices.length > 1) return devices[devices.length - 1].deviceId;
    return devices[0].deviceId;
  } catch {
    return undefined;
  }
}

async function startVideoStream(
  reader: BrowserMultiFormatOneDReader,
  video: HTMLVideoElement,
  onResult: (text: string) => void
): Promise<IScannerControls> {
  try {
    return await reader.decodeFromConstraints(CAMERA_CONSTRAINTS, video, (result) => {
      if (result) onResult(result.getText());
    });
  } catch {
    const cameraId = await pickBackCameraId();
    return reader.decodeFromVideoDevice(cameraId, video, (result) => {
      if (result) onResult(result.getText());
    });
  }
}

export async function startBarcodeScanner(
  video: HTMLVideoElement,
  onCode: (code: string) => void
): Promise<ScannerHandle> {
  let stopped = false;
  let fired = false;
  let controls: IScannerControls | null = null;
  let rafId = 0;

  video.setAttribute("playsinline", "true");
  video.setAttribute("webkit-playsinline", "true");
  video.muted = true;

  const fire = (raw: string) => {
    if (stopped || fired) return;
    const code = normalizeBarcode(raw);
    if (!code) return;
    fired = true;
    onCode(code);
  };

  const hints = new Map<DecodeHintType, BarcodeFormat[]>();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E,
    BarcodeFormat.CODE_128,
  ]);

  const reader = new BrowserMultiFormatOneDReader(hints, {
    delayBetweenScanAttempts: 80,
    delayBetweenScanSuccess: 2000,
    tryPlayVideoTimeout: 10000,
  });

  controls = await startVideoStream(reader, video, (text) => fire(text));

  let detector: InstanceType<NonNullable<typeof window.BarcodeDetector>> | null = null;
  if (typeof window !== "undefined" && window.BarcodeDetector) {
    try {
      detector = new window.BarcodeDetector({
        formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"],
      });
    } catch {
      detector = null;
    }
  }

  let nativeBusy = false;
  const nativeLoop = () => {
    if (stopped || fired || !detector) return;
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || video.videoWidth === 0) {
      rafId = requestAnimationFrame(nativeLoop);
      return;
    }
    if (nativeBusy) {
      rafId = requestAnimationFrame(nativeLoop);
      return;
    }
    nativeBusy = true;
    detector
      .detect(video)
      .then((codes) => {
        nativeBusy = false;
        if (stopped || fired) return;
        for (const hit of codes) fire(hit.rawValue);
        if (!fired) rafId = requestAnimationFrame(nativeLoop);
      })
      .catch(() => {
        nativeBusy = false;
        if (!stopped && !fired) rafId = requestAnimationFrame(nativeLoop);
      });
  };

  if (detector) rafId = requestAnimationFrame(nativeLoop);

  return {
    engine: detector ? "dual" : "zxing",
    stop: async () => {
      stopped = true;
      cancelAnimationFrame(rafId);
      controls?.stop();
      const stream = video.srcObject as MediaStream | null;
      stream?.getTracks().forEach((t) => t.stop());
      video.srcObject = null;
    },
  };
}

export function feedbackOnScan() {
  navigator.vibrate?.(40);
}

export async function scanBarcodeFromFile(file: File): Promise<string | null> {
  const hints = new Map<DecodeHintType, BarcodeFormat[]>();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E,
    BarcodeFormat.CODE_128,
  ]);
  const reader = new BrowserMultiFormatOneDReader(hints);
  const url = URL.createObjectURL(file);
  try {
    const result = await reader.decodeFromImageUrl(url);
    return normalizeBarcode(result.getText());
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}
