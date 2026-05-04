import { NextRequest, NextResponse } from "next/server";
import { clioFetch } from "@/lib/clio";

export const runtime = "nodejs";

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function safetyReadOnly() {
  return {
    readOnly: true,
    noClioRecordsChanged: true,
    noDatabaseRecordsChanged: true,
    noDocumentsGenerated: true,
    noPrintQueueRecordsChanged: true,
  };
}

function normalizeContact(contact: any) {
  return {
    id: Number(contact?.id),
    name: clean(contact?.name),
    type: clean(contact?.type),
  };
}

function filterContacts(contacts: any[], query: string) {
  const q = query.toLowerCase();

  return contacts
    .map(normalizeContact)
    .filter((contact) => Number.isFinite(contact.id) && contact.name)
    .filter((contact) => clean(contact.type).toLowerCase() === "person")
    .filter((contact) => !q || contact.name.toLowerCase().includes(q))
    .slice(0, 25);
}

export async function GET(req: NextRequest) {
  try {
    const query = clean(req.nextUrl.searchParams.get("q"));

    if (query.length < 1) {
      return NextResponse.json({
        ok: true,
        action: "clio-contact-search",
        query,
        count: 0,
        contacts: [],
        safety: safetyReadOnly(),
        note: "Enter at least 1 character to search Clio person contacts.",
      });
    }

    const fields = "id,name,type";
    const primaryPath =
      `/contacts.json?query=${encodeURIComponent(query)}` +
      `&limit=25&fields=${encodeURIComponent(fields)}`;

    let res = await clioFetch(primaryPath, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    let text = await res.text();

    if (!res.ok) {
      const fallbackPath =
        `/contacts.json?limit=200&fields=${encodeURIComponent(fields)}`;

      res = await clioFetch(fallbackPath, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      text = await res.text();

      if (!res.ok) {
        return NextResponse.json(
          {
            ok: false,
            action: "clio-contact-search",
            query,
            error: `Clio contact search failed: status ${res.status}`,
            clioBody: text,
            safety: safetyReadOnly(),
          },
          { status: 500 }
        );
      }
    }

    const json = text ? JSON.parse(text) : null;
    const contacts = filterContacts(Array.isArray(json?.data) ? json.data : [], query);

    return NextResponse.json({
      ok: true,
      action: "clio-contact-search",
      query,
      count: contacts.length,
      contacts,
      contactTypeFilter: "Person",
      safety: safetyReadOnly(),
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        action: "clio-contact-search",
        error: err?.message || "Could not search Clio contacts.",
        safety: safetyReadOnly(),
      },
      { status: 500 }
    );
  }
}
