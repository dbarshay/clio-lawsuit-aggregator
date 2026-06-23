#!/usr/bin/env python3
from pathlib import Path
from html import unescape
import json
import re
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]
DOCX = ROOT / "templates/docx/letters/initial-billing-letter.docx"

CANONICAL_TOKENS = [
    "{{letter.date}}",
    "{{insurer.name}}",
    "{{insurer.mailingAddress.line1}}",
    "{{insurer.mailingAddress.city}}",
    "{{insurer.mailingAddress.state}}",
    "{{insurer.mailingAddress.zip}}",
    "{{provider.name}}",
    "{{patient.name}}",
    "{{claim.number}}",
    "{{claim.amount}}",
    "{{claim.dosRange}}",
    "{{matter.fileNumber}}",
]

def fail(message, details=None):
    print("FAIL:", message)
    if details is not None:
        print(json.dumps(details, indent=2, sort_keys=True))
    sys.exit(1)

def visible_text(path):
    parts = []
    with zipfile.ZipFile(path, "r") as z:
        for name in z.namelist():
            if re.match(r"^word/(document|header[0-9]+|footer[0-9]+|footnotes|endnotes)[.]xml$", name):
                xml = z.read(name).decode("utf-8")
                parts.extend(unescape(m.group(1)) for m in re.finditer(r"<w:t(?:\s[^>]*)?>(.*?)</w:t>", xml, re.DOTALL))
    return re.sub(r"\s+", " ", " ".join(parts)).strip()

text = visible_text(DOCX)
legacy = sorted(set(re.findall(r"<<[^<>]+>>", text)))
missing = [token for token in CANONICAL_TOKENS if token not in text]
proof = {
    "phase": "Templates Phase 18F",
    "sourceDocx": str(DOCX.relative_to(ROOT)),
    "legacyChevronTokensRemaining": legacy,
    "missingCanonicalTokens": missing,
    "canonicalTokenInventory": CANONICAL_TOKENS,
    "visibleTextPreview": text[:2000],
}
if legacy:
    fail("legacy chevron tokens remain in committed DOCX", proof)
if missing:
    fail("canonical tokens are missing from committed DOCX", proof)
print("PASS: Phase 18F Initial Billing Letter DOCX uses canonical tokens only")
print(json.dumps(proof, indent=2, sort_keys=True))
