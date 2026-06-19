"use client";

import { ExternalLink } from "lucide-react";
import { googleMapsEmbedUrl, googleMapsOpenUrl } from "@/lib/google-maps";

interface TripMapProps {
  lat: number;
  lng: number;
  locationName: string;
  mapsUrl?: string;
}

export function TripMap({ lat, lng, locationName, mapsUrl }: TripMapProps) {
  const embedUrl = googleMapsEmbedUrl(lat, lng, locationName);
  const openUrl = googleMapsOpenUrl(lat, lng, mapsUrl);

  return (
    <div className="relative rounded-xl overflow-hidden border border-glass-border bg-night/40">
      <iframe
        title={`Mappa: ${locationName}`}
        src={embedUrl}
        className="w-full h-64 md:h-80 border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
      <a
        href={openUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-night/85 border border-glass-border text-cream/80 hover:text-cream hover:border-ember/40 backdrop-blur-sm transition-colors"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        Apri in Google Maps
      </a>
    </div>
  );
}
