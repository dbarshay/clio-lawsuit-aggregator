from pathlib import Path
from zipfile import ZipFile
from xml.etree import ElementTree as ET
import json
import sys

fixture_path = Path("test/fixtures/templates/templates-phase18h-initial-billing-letter-word-openable-source-restore-fixture.json")
fixture = json.loads(fixture_path.read_text())
source = Path(fixture["sourceDocx"])

if not source.exists():
    print("FAIL: source DOCX missing: " + str(source))
    sys.exit(1)

bad_xml = []
xml_count = 0
combined = []

try:
    with ZipFile(source, "r") as z:
        names = z.namelist()
        required = {"[Content_Types].xml", "_rels/.rels", "word/document.xml"}
        missing_required = sorted(required.difference(names))
        if missing_required:
            print("FAIL: DOCX missing required package parts: " + ", ".join(missing_required))
            sys.exit(1)

        for name in names:
            if name.endswith(".xml"):
                xml_count += 1
                data = z.read(name)
                combined.append(data.decode("utf-8", errors="replace"))
                try:
                    ET.fromstring(data)
                except Exception as exc:
                    bad_xml.append({"part": name, "error": str(exc)})
except Exception as exc:
    print("FAIL: DOCX zip/package read failed: " + str(exc))
    sys.exit(1)

if bad_xml:
    print("FAIL: XML parts do not parse: " + json.dumps(bad_xml, indent=2))
    sys.exit(1)

all_xml = "\n".join(combined)
canonical_present = [token for token in fixture["requiredCanonicalTokensForManualReinsert"] if token in all_xml]
legacy_present = []
idx = 0
while True:
    a = all_xml.find("<<", idx)
    if a < 0:
        break
    b = all_xml.find(">>", a + 2)
    if b < 0:
        break
    legacy_present.append(all_xml[a:b + 2])
    idx = b + 2

result = {
    "phase": fixture["phase"],
    "sourceDocx": str(source),
    "sourceSizeBytes": source.stat().st_size,
    "xmlPartCount": xml_count,
    "badXmlParts": bad_xml,
    "canonicalTokensCurrentlyPresent": sorted(set(canonical_present)),
    "legacyChevronTokensCurrentlyPresent": sorted(set(legacy_present)),
    "requiredCanonicalTokensForManualReinsert": fixture["requiredCanonicalTokensForManualReinsert"],
    "restoredFromTag": fixture["restoredFromTag"],
}

print(json.dumps(result, indent=2))
print("PASS: Phase 18H restored a zip/XML-valid Word-openable source candidate; manual Word token reinsertion is next")
