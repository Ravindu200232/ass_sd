/**
 * Validation for spreadsheet and CSV uploads.  [V-17]
 *
 * WHAT WAS WRONG
 * --------------
 * Four places in this app let an operator pick a file and hand it straight to
 * the SheetJS parser, and they disagreed about validation:
 *
 *   src/pages/Product/Products.jsx:336    10 MB cap + type allow-list   (good)
 *   src/pages/Services/Services.jsx:327   extension only, NO size cap
 *   src/pages/Stock/GrnAdjust.jsx:1223    nothing at all:
 *
 *       const file = e.target.files[0];
 *       if (!file) return;                  // <- the entire validation
 *       ...
 *       const workbook = XLSX.read(data, { type: "array" });
 *
 *   src/components/GRNForm/CSVImportModal.jsx:177  reader.readAsText, accept=".csv"
 *
 * The `accept` attribute is a file-picker hint, not a control: it is bypassed
 * by drag-and-drop and by renaming a file. So arbitrary bytes of arbitrary size
 * reached xlsx@0.18.5, which was affected by CVE-2023-30533 (prototype
 * pollution in sheet_to_json) and CVE-2024-22363 (ReDoS). The parser itself is
 * patched in V-12; this module closes the input path, because defence in depth
 * means not relying on the parser being flawless.
 *
 * Cell values from these files also flow into the receipt templates as product
 * names, which is the other half of the V-13 XSS chain.
 *
 * OWASP A05:2021 Security Misconfiguration / A06:2021 Vulnerable Components
 * CWE-434 Unrestricted Upload of File with Dangerous Type
 * CWE-400 Uncontrolled Resource Consumption
 */

/** 10 MB. A product catalogue for a tyre shop is a few hundred kilobytes. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** Row cap, so a sparse sheet claiming a million rows cannot hang the tab. */
export const MAX_IMPORT_ROWS = 5000;

const SPREADSHEET_EXTENSIONS = ["xlsx", "xls", "csv"];

const SPREADSHEET_MIME_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-excel", // .xls
  "text/csv",
  "application/csv",
  "text/plain", // some browsers report this for .csv
  "application/octet-stream", // and some report this for .xlsx
  "", // Firefox sometimes reports an empty type for .xls
];

/**
 * Magic-byte signatures. This is the only check an attacker cannot simply
 * rename their way past, and it is why the function is async.
 *
 * .xlsx is a ZIP container  -> 50 4B ("PK")
 * .xls is an OLE2 compound  -> D0 CF 11 E0 A1 B1 1A E1
 * .csv is plain text and has no signature, so it is checked by extension and
 * by decoding the head as UTF-8 instead.
 */
const ZIP_MAGIC = [0x50, 0x4b];
const OLE2_MAGIC = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];

const extensionOf = (name) => String(name || "").split(".").pop().toLowerCase();

const startsWith = (bytes, signature) =>
  signature.every((byte, i) => bytes[i] === byte);

const formatBytes = (n) =>
  n >= 1024 * 1024
    ? `${(n / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.ceil(n / 1024)} KB`;

/**
 * Validate a user-selected spreadsheet or CSV file.
 *
 * Checks, in order of cost: presence, size, extension, reported MIME type,
 * then magic bytes. Returns a result object rather than throwing, so callers
 * can surface the message with their existing toast.
 *
 * @param {File|null|undefined} file
 * @param {{ maxBytes?: number, allowedExtensions?: string[] }} [options]
 * @returns {Promise<{ ok: true } | { ok: false, error: string }>}
 */
export async function validateSpreadsheetFile(file, options = {}) {
  const maxBytes = options.maxBytes ?? MAX_UPLOAD_BYTES;
  const allowed = options.allowedExtensions ?? SPREADSHEET_EXTENSIONS;

  if (!file) {
    return { ok: false, error: "No file selected." };
  }

  if (file.size === 0) {
    return { ok: false, error: "That file is empty." };
  }

  if (file.size > maxBytes) {
    return {
      ok: false,
      error: `That file is ${formatBytes(file.size)}. The limit is ${formatBytes(maxBytes)}.`,
    };
  }

  const extension = extensionOf(file.name);

  if (!allowed.includes(extension)) {
    return {
      ok: false,
      error: `Unsupported file type ".${extension}". Allowed: ${allowed
        .map((e) => "." + e)
        .join(", ")}.`,
    };
  }

  // A reported type outside the known set is suspicious, but browsers are
  // inconsistent enough that this cannot be strict on its own - hence the
  // magic-byte check below.
  if (file.type && !SPREADSHEET_MIME_TYPES.includes(file.type)) {
    return {
      ok: false,
      error: `Unexpected file type reported by the browser ("${file.type}").`,
    };
  }

  // Magic bytes. This is what catches a .exe renamed to .xlsx.
  try {
    const head = new Uint8Array(await file.slice(0, 8).arrayBuffer());

    if (extension === "xlsx") {
      if (!startsWith(head, ZIP_MAGIC)) {
        return {
          ok: false,
          error: "That file is not a valid .xlsx workbook (bad file signature).",
        };
      }
    } else if (extension === "xls") {
      // Excel 2007+ saved as .xls is sometimes really a zip, so accept both.
      if (!startsWith(head, OLE2_MAGIC) && !startsWith(head, ZIP_MAGIC)) {
        return {
          ok: false,
          error: "That file is not a valid .xls workbook (bad file signature).",
        };
      }
    } else if (extension === "csv") {
      // CSV has no signature. Reject anything that is clearly binary: a NUL in
      // the first bytes of a text file means it is not text.
      if (head.includes(0x00)) {
        return {
          ok: false,
          error: "That file looks like binary data, not a CSV.",
        };
      }
    }
  } catch {
    return { ok: false, error: "That file could not be read." };
  }

  return { ok: true };
}

/**
 * Guard a parsed sheet against an absurd row count before the rows are mapped
 * into application objects.
 *
 * @param {unknown[]} rows
 * @param {number} [maxRows]
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
export function validateRowCount(rows, maxRows = MAX_IMPORT_ROWS) {
  const count = Array.isArray(rows) ? rows.length : 0;

  if (count === 0) {
    return { ok: false, error: "That file contains no data rows." };
  }

  if (count > maxRows) {
    return {
      ok: false,
      error: `That file contains ${count.toLocaleString()} rows. The limit is ${maxRows.toLocaleString()} per import.`,
    };
  }

  return { ok: true };
}

export default validateSpreadsheetFile;
