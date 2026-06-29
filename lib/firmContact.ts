// Single source of truth for the firm ("Barshay, Rizzo & Lopez, PLLC") signer/contact.
// Use this wherever the "firm" signer or firm signature block is rendered (e.g. the
// generate-preview firm fallback) so the firm name, email, phone, and fax live in one place.
export const BARSH_FIRM_CONTACT = {
  id: "firm",
  displayName: "Firm",
  email: "info@brlfirm.com",
  telephone: "(631) 210-7272",
  phoneExtension: "",
  faxNumber: "(516) 706-5055",
  signatureBlockName: "Barshay, Rizzo & Lopez, PLLC",
  signatureText: "Barshay, Rizzo & Lopez, PLLC",
} as const;
