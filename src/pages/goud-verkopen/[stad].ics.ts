import type { APIRoute } from 'astro';
import { tourSteden, type TourStad } from '../../data/tour';

export function getStaticPaths() {
  return tourSteden.map((stad) => ({ params: { stad: stad.slug }, props: { stad } }));
}

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/[,;]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');
const compact = (iso: string) => iso.replace(/-/g, '');

// 'Dinsdag 15 september' + '10:00 – 16:00 uur' → één VEVENT; zonder herkenbare tijd wordt het een hele dag.
const event = (stad: TourStad, stop: NonNullable<TourStad['stops'][number]>) => {
  const tijd = stop.tijd.match(/(\d\d):(\d\d)\D+(\d\d):(\d\d)/);
  const dag = compact(stop.datumISO!);
  const wanneer = tijd
    ? [`DTSTART;TZID=Europe/Amsterdam:${dag}T${tijd[1]}${tijd[2]}00`, `DTEND;TZID=Europe/Amsterdam:${dag}T${tijd[3]}${tijd[4]}00`]
    : [`DTSTART;VALUE=DATE:${dag}`];
  const adres = [stop.locatie, stad.adres, `${stad.postcode ?? ''} ${stad.naam}`.trim()].filter(Boolean).join(', ');
  return [
    'BEGIN:VEVENT',
    `UID:${stop.datumISO}-${stad.slug}@rpmedelmetaal.nl`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')}`,
    ...wanneer,
    `SUMMARY:${esc(`Gratis goudtaxatie RPM Edelmetaal – ${stad.naam}`)}`,
    `LOCATION:${esc(adres)}`,
    `DESCRIPTION:${esc(`Loop vrijblijvend binnen, een afspraak is niet nodig. Neem uw goud, zilver en legitimatie mee.\nhttps://www.rpmedelmetaal.nl/goud-verkopen/${stad.slug}`)}`,
    `URL:https://www.rpmedelmetaal.nl/goud-verkopen/${stad.slug}`,
    'END:VEVENT',
  ];
};

export const GET: APIRoute = ({ props }) => {
  const stad = props.stad as TourStad;
  const regels = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//RPM Edelmetaal//Tour//NL',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...stad.stops.filter((s) => s.datumISO).flatMap((s) => event(stad, s)),
    'END:VCALENDAR',
  ];
  return new Response(regels.join('\r\n') + '\r\n', {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8' },
  });
};
