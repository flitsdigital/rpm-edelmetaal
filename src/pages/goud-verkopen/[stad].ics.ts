import type { APIRoute } from 'astro';
import { tourSteden, komendeStops, agendaItem, type TourStad, type Stop } from '../../data/tour';

export function getStaticPaths() {
  return tourSteden.map((stad) => ({ params: { stad: stad.slug }, props: { stad } }));
}

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/[,;]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');

// Zonder herkenbare tijd wordt het een hele dag.
const event = (stad: TourStad, stop: Stop) => {
  const item = agendaItem(stad, stop);
  const wanneer = item.start
    ? [`DTSTART;TZID=Europe/Amsterdam:${item.start}`, `DTEND;TZID=Europe/Amsterdam:${item.eind}`]
    : [`DTSTART;VALUE=DATE:${item.dag}`];
  return [
    'BEGIN:VEVENT',
    `UID:${stop.datumISO}-${stad.slug}@rpmedelmetaal.nl`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')}`,
    ...wanneer,
    `SUMMARY:${esc(item.titel)}`,
    `LOCATION:${esc(item.adres)}`,
    `DESCRIPTION:${esc(item.omschrijving)}`,
    `URL:${item.url}`,
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
    ...komendeStops(stad).filter((s) => s.datumISO).flatMap((s) => event(stad, s)),
    'END:VCALENDAR',
  ];
  return new Response(regels.join('\r\n') + '\r\n', {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8' },
  });
};
