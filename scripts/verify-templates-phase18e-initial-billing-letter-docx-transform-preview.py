#!/usr/bin/env python3
from pathlib import Path
from html import escape, unescape
import json
import re
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]
SOURCE_DOCX = ROOT / "templates/docx/letters/initial-billing-letter.docx"
OUTPUT_DIR = ROOT / ".tmp-phase18e-output"
OUTPUT_DOCX = OUTPUT_DIR / "initial-billing-letter-BRL_202600003-transform-preview.docx"
PROOF_JSON = OUTPUT_DIR / "initial-billing-letter-BRL_202600003-transform-preview-proof.json"

REPLACEMENTS = {
    "{{letter.date}}": "June 23, 2026",
    "{{insurer.name}}": "Allstate Indemnity Company",
    "{{insurer.mailingAddress.line1}}": "3100 Sanders Road, Suite 201",
    "{{insurer.mailingAddress.city}}": "Northbrook",
    "{{insurer.mailingAddress.state}}": "Illinois",
    "{{insurer.mailingAddress.zip}}": "60062",
    "{{provider.name}}": "ATLANTIC MEDICAL & DIAGNOSTIC, P.C.",
    "{{patient.name}}": "David Barshay",
    "{{claim.number}}": "1111",
    "{{claim.amount}}": "$836.75",
    "{{claim.dosRange}}": "02/03/2021",
    "{{matter.fileNumber}}": "BRL_202600003",
}
EXPECTED_VISIBLE_VALUES = list(REPLACEMENTS.values())

def fail(message, details=None):
    print("FAIL:", message)
    if details is not None:
        print(json.dumps(details, indent=2, sort_keys=True))
    sys.exit(1)

def norm(value):
    return re.sub(r"\s+", " ", value).strip()

def visible_text(path):
    parts = []
    with zipfile.ZipFile(path, "r") as z:
        for name in z.namelist():
            if re.match(r"^word/(document|header[0-9]+|footer[0-9]+|footnotes|endnotes)[.]xml$", name):
                xml = z.read(name).decode("utf-8")
                parts.extend(unescape(m.group(1)) for m in re.finditer(r"<w:t(?:\s[^>]*)?>(.*?)</w:t>", xml, re.DOTALL))
    return norm(" ".join(parts))

def replace_forms(xml, token, value):
    count = 0
    forms = [token, escape(token, quote=False)]
    for form in dict.fromkeys(forms):
        form_count = xml.count(form)
        if form_count > 0:
            count += form_count
            xml = xml.replace(form, escape(value, quote=False))
    return xml, count

source_text = visible_text(SOURCE_DOCX)
legacy_source = sorted(set(re.findall(r"<<[^<>]+>>", source_text)))
missing_canonical = [token for token in REPLACEMENTS if token not in source_text]
if legacy_source:
    fail("legacy chevron tokens remain in canonical source DOCX", {"legacy": legacy_source, "sourceVisibleTextPreview": source_text[:2000]})
if missing_canonical:
    fail("canonical tokens missing from source DOCX", {"missing": missing_canonical, "sourceVisibleTextPreview": source_text[:2000]})

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
replacement_counts = {token: 0 for token in REPLACEMENTS}
with zipfile.ZipFile(SOURCE_DOCX, "r") as zin:
    with zipfile.ZipFile(OUTPUT_DOCX, "w", compression=zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            data = zin.read(item.filename)
            if item.filename.startswith("word/") and item.filename.endswith(".xml"):
                xml = data.decode("utf-8")
                for token, value in REPLACEMENTS.items():
                    xml, count = replace_forms(xml, token, value)
                    replacement_counts[token] += count
                data = xml.encode("utf-8")
            zout.writestr(item, data)

transformed_text = visible_text(OUTPUT_DOCX)
remaining_legacy = sorted(set(re.findall(r"<<[^<>]+>>", transformed_text)))
remaining_canonical = [token for token in REPLACEMENTS if token in transformed_text]
missing_values = [value for value in EXPECTED_VISIBLE_VALUES if value not in transformed_text]
zero_replacements = [token for token, count in replacement_counts.items() if count == 0]
proof = {
    "phase": "Templates Phase 18E after Phase 18F canonical migration",
    "sourceDocx": str(SOURCE_DOCX.relative_to(ROOT)),
    "outputDocx": str(OUTPUT_DOCX.relative_to(ROOT)),
    "replacementCounts": replacement_counts,
    "zeroReplacementCanonicalTokens": zero_replacements,
    "remainingLegacyTokens": remaining_legacy,
    "remainingCanonicalTokens": remaining_canonical,
    "missingExpectedVisibleValues": missing_values,
    "sourceVisibleTextPreview": source_text[:2000],
    "transformedVisibleTextPreview": transformed_text[:2000],
}
PROOF_JSON.write_text(json.dumps(proof, indent=2, sort_keys=True) + "\n", encoding="utf-8")
if zero_replacements:
    fail("some canonical source tokens were not replaced", proof)
if remaining_legacy:
    fail("legacy chevron tokens remain after transform", proof)
if remaining_canonical:
    fail("canonical tokens remain after transform", proof)
if missing_values:
    fail("expected resolved values missing after transform", proof)
print("PASS: Phase 18E canonical transform preview resolved all canonical tokens")
print(json.dumps(proof, indent=2, sort_keys=True))
