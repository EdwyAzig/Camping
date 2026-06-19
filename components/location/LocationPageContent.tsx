"use client";

import { useState } from "react";
import { MapPin, Phone, ParkingCircle, Wrench } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { TripMap } from "@/components/map/TripMap";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { Card, CardTitle } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { getTripMapsUrl } from "@/lib/default-location";
import { formatEuro } from "@/lib/utils";
import { calcPitchCost } from "@/lib/finance";
import { countNights } from "@/lib/dates";
import type { Trip } from "@/lib/types";

export function LocationPageContent({ trip: initial }: { trip: Trip }) {
  const [trip, setTrip] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("trips")
      .update({
        location_name: trip.location_name,
        address: trip.address,
        lat: trip.lat,
        lng: trip.lng,
        parking_notes: trip.parking_notes,
        services: trip.services,
        table_cost: trip.table_cost,
        grill_rental_cost: trip.grill_rental_cost,
        parking_cost: trip.parking_cost,
        pitch_cost_per_night: trip.pitch_cost_per_night,
        other_location_cost: trip.other_location_cost,
        other_location_cost_label: trip.other_location_cost_label,
        contact_info: trip.contact_info,
      })
      .eq("id", trip.id)
      .select()
      .single();
    if (data) setTrip(data as Trip);
    setSaving(false);
    setEditing(false);
  }

  const nights = countNights(trip.start_date, trip.end_date);
  const pitchTotal = calcPitchCost(trip);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
        <PageHeader
          title="Location"
          description={trip.location_name}
          icon={MapPin}
          badge="Luogo"
          className="flex-1 min-w-0"
        />
        <Button variant="secondary" size="sm" onClick={() => (editing ? save() : setEditing(true))} className="shrink-0 w-full sm:w-auto">
          {editing ? (saving ? "Salvo..." : "Salva") : "Modifica"}
        </Button>
      </div>

      <Card gradient className="p-3 animate-fade-up">
        <TripMap
          lat={trip.lat}
          lng={trip.lng}
          locationName={trip.location_name}
          mapsUrl={getTripMapsUrl(trip)}
        />
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="w-4 h-4 text-ember" /> Indirizzo & coordinate
          </CardTitle>
          {editing ? (
            <div className="mt-3 space-y-2">
              <Input value={trip.location_name} onChange={(e) => setTrip({ ...trip, location_name: e.target.value })} placeholder="Nome luogo" />
              <Input value={trip.address} onChange={(e) => setTrip({ ...trip, address: e.target.value })} placeholder="Indirizzo" />
              <div className="grid grid-cols-2 gap-2">
                <Input type="number" step="any" value={trip.lat} onChange={(e) => setTrip({ ...trip, lat: parseFloat(e.target.value) })} placeholder="Lat" />
                <Input type="number" step="any" value={trip.lng} onChange={(e) => setTrip({ ...trip, lng: parseFloat(e.target.value) })} placeholder="Lng" />
              </div>
            </div>
          ) : (
            <div className="mt-3 text-sm space-y-1 text-cream/80">
              <p>{trip.address || "—"}</p>
              <p className="text-cream/50">{trip.lat.toFixed(4)}, {trip.lng.toFixed(4)}</p>
            </div>
          )}
        </Card>

        <Card>
          <CardTitle className="text-base flex items-center gap-2">
            <ParkingCircle className="w-4 h-4 text-ember" /> Parcheggio
          </CardTitle>
          {editing ? (
            <Textarea className="mt-3" value={trip.parking_notes} onChange={(e) => setTrip({ ...trip, parking_notes: e.target.value })} />
          ) : (
            <p className="mt-3 text-sm text-cream/80">{trip.parking_notes || "Nessuna nota"}</p>
          )}
        </Card>

        <Card>
          <CardTitle className="text-base flex items-center gap-2">
            <Wrench className="w-4 h-4 text-ember" /> Servizi
          </CardTitle>
          {editing ? (
            <Textarea className="mt-3" value={trip.services} onChange={(e) => setTrip({ ...trip, services: e.target.value })} />
          ) : (
            <p className="mt-3 text-sm text-cream/80">{trip.services || "—"}</p>
          )}
        </Card>

        <Card>
          <CardTitle className="text-base">Costi del posto</CardTitle>
          <div className="mt-3 space-y-2 text-sm">
            {editing ? (
              <>
                <div>
                  <Label>Piazzola / pernotazione €/notte</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={trip.pitch_cost_per_night ?? 0}
                    onChange={(e) => setTrip({ ...trip, pitch_cost_per_night: parseFloat(e.target.value) })}
                  />
                  {nights > 0 ? (
                    <p className="text-xs text-cream/45 mt-1">
                      {formatEuro(trip.pitch_cost_per_night ?? 0)}/notte × {nights} notti = {formatEuro(pitchTotal)}
                    </p>
                  ) : (
                    <p className="text-xs text-cream/45 mt-1">
                      Imposta le date nel Programma per calcolare le notti, oppure inserisci il totale in &quot;Altro&quot;.
                    </p>
                  )}
                </div>
                <div><Label>Tavolo €</Label><Input type="number" value={trip.table_cost ?? 0} onChange={(e) => setTrip({ ...trip, table_cost: parseFloat(e.target.value) })} /></div>
                <div><Label>Griglia noleggio €</Label><Input type="number" value={trip.grill_rental_cost ?? 0} onChange={(e) => setTrip({ ...trip, grill_rental_cost: parseFloat(e.target.value) })} /></div>
                <div><Label>Parcheggio €</Label><Input type="number" value={trip.parking_cost ?? 0} onChange={(e) => setTrip({ ...trip, parking_cost: parseFloat(e.target.value) })} /></div>
                <div>
                  <Label>Altro €</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={trip.other_location_cost ?? 0}
                    onChange={(e) => setTrip({ ...trip, other_location_cost: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Descrizione altro</Label>
                  <Input
                    value={trip.other_location_cost_label}
                    onChange={(e) => setTrip({ ...trip, other_location_cost_label: e.target.value })}
                    placeholder="Es. docce, elettricità, cane..."
                  />
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-cream/50">
                    Piazzola{nights > 0 ? ` (${nights} notti)` : ""}
                  </span>
                  {formatEuro(pitchTotal)}
                </div>
                <div className="flex justify-between"><span className="text-cream/50">Tavolo</span>{formatEuro(trip.table_cost)}</div>
                <div className="flex justify-between"><span className="text-cream/50">Griglia</span>{formatEuro(trip.grill_rental_cost)}</div>
                <div className="flex justify-between"><span className="text-cream/50">Parcheggio</span>{formatEuro(trip.parking_cost)}</div>
                {(trip.other_location_cost ?? 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-cream/50">{trip.other_location_cost_label || "Altro"}</span>
                    {formatEuro(trip.other_location_cost)}
                  </div>
                )}
              </>
            )}
          </div>
        </Card>

        <Card className="md:col-span-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Phone className="w-4 h-4 text-ember" /> Contatto prenotazione
          </CardTitle>
          {editing ? (
            <Textarea className="mt-3" value={trip.contact_info} onChange={(e) => setTrip({ ...trip, contact_info: e.target.value })} />
          ) : (
            <p className="mt-3 text-sm text-cream/80">{trip.contact_info || "—"}</p>
          )}
        </Card>
      </div>
    </div>
  );
}
