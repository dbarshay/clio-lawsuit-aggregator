import { legacyClioOperationalRouteBlocked } from "@/lib/legacyClioOperationalRouteBlocked";

export async function GET() {
  return legacyClioOperationalRouteBlocked("app/api/settlements/close-preview");
}

export async function POST() {
  return legacyClioOperationalRouteBlocked("app/api/settlements/close-preview");
}
