from __future__ import annotations

import html
import re
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    HRFlowable,
    PageTemplate,
    Paragraph,
    Preformatted,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(r"D:\ass_sd\video\Ravindu")
OUT = ROOT / "Ravindu-bilingual-video-guide.pdf"
SINHALA = ROOT / "Ravindu-video-script-Sinhala.md"
ENGLISH = ROOT / "Ravindu-video-speech-English.md"


pdfmetrics.registerFont(TTFont("Nirmala", r"C:\Windows\Fonts\Nirmala.ttc", subfontIndex=0))
pdfmetrics.registerFont(TTFont("NirmalaBold", r"C:\Windows\Fonts\Nirmala.ttc", subfontIndex=0))

PAGE_W, PAGE_H = A4


def clean_dashes(value: str) -> str:
    return value.replace("\u2013", "-").replace("\u2014", "-").replace("\u2011", "-")


def inline_markup(value: str) -> str:
    value = clean_dashes(value)
    value = html.escape(value, quote=False)
    value = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", value)
    value = re.sub(r"`([^`]+)`", r'<font name="Courier">\1</font>', value)
    return value


def section(text: str, prefix: str, next_prefix: str = "## ") -> list[str]:
    lines = text.splitlines()
    start = None
    for index, line in enumerate(lines):
        if line.startswith(prefix):
            start = index
            break
    if start is None:
        return []
    end = len(lines)
    for index in range(start + 1, len(lines)):
        if lines[index].startswith(next_prefix):
            end = index
            break
    return lines[start:end]


def before_first_section(text: str) -> list[str]:
    lines = text.splitlines()
    for index, line in enumerate(lines):
        if line.startswith("## "):
            return lines[:index]
    return lines


styles = getSampleStyleSheet()
styles.add(
    ParagraphStyle(
        name="CoverTitle",
        parent=styles["Title"],
        fontName="Nirmala",
        fontSize=22,
        leading=28,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#0F2747"),
        spaceAfter=8 * mm,
    )
)
styles.add(
    ParagraphStyle(
        name="CoverSubTitle",
        parent=styles["Normal"],
        fontName="Nirmala",
        fontSize=11,
        leading=16,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#425466"),
        spaceAfter=4 * mm,
    )
)
styles.add(
    ParagraphStyle(
        name="SectionTitle",
        parent=styles["Heading1"],
        fontName="Nirmala",
        fontSize=16,
        leading=20,
        textColor=colors.HexColor("#0F2747"),
        spaceBefore=7 * mm,
        spaceAfter=3 * mm,
        keepWithNext=True,
    )
)
styles.add(
    ParagraphStyle(
        name="SubTitle",
        parent=styles["Heading2"],
        fontName="Nirmala",
        fontSize=12.5,
        leading=16,
        textColor=colors.HexColor("#155E75"),
        spaceBefore=4 * mm,
        spaceAfter=2 * mm,
        keepWithNext=True,
    )
)
styles.add(
    ParagraphStyle(
        name="Label",
        parent=styles["Heading2"],
        fontName="Nirmala",
        fontSize=12,
        leading=15,
        textColor=colors.white,
        backColor=colors.HexColor("#176B87"),
        borderPadding=(4, 6, 4, 6),
        spaceBefore=5 * mm,
        spaceAfter=3 * mm,
        keepWithNext=True,
    )
)
styles.add(
    ParagraphStyle(
        name="BodySinhala",
        parent=styles["BodyText"],
        fontName="Nirmala",
        fontSize=9.3,
        leading=14.5,
        textColor=colors.HexColor("#1F2937"),
        spaceAfter=2.2 * mm,
    )
)
styles.add(
    ParagraphStyle(
        name="BodyEnglish",
        parent=styles["BodyText"],
        fontName="Nirmala",
        fontSize=9.2,
        leading=14,
        textColor=colors.HexColor("#1F2937"),
        spaceAfter=2.2 * mm,
    )
)
styles.add(
    ParagraphStyle(
        name="GuideBullet",
        parent=styles["BodyText"],
        fontName="Nirmala",
        fontSize=9.1,
        leading=13.5,
        leftIndent=5 * mm,
        firstLineIndent=-3 * mm,
        bulletIndent=0,
        textColor=colors.HexColor("#1F2937"),
        spaceAfter=1.4 * mm,
    )
)
styles.add(
    ParagraphStyle(
        name="Quote",
        parent=styles["BodyText"],
        fontName="Nirmala",
        fontSize=9.3,
        leading=14.5,
        leftIndent=6 * mm,
        rightIndent=4 * mm,
        borderColor=colors.HexColor("#9CC7D6"),
        borderWidth=1,
        borderPadding=4,
        backColor=colors.HexColor("#F0F8FA"),
        textColor=colors.HexColor("#163A4A"),
        spaceAfter=2.5 * mm,
    )
)
styles.add(
    ParagraphStyle(
        name="CodePath",
        parent=styles["BodyText"],
        fontName="Nirmala",
        fontSize=8.2,
        leading=11,
        textColor=colors.HexColor("#334155"),
        spaceBefore=1.5 * mm,
        spaceAfter=1.5 * mm,
    )
)
styles.add(
    ParagraphStyle(
        name="Small",
        parent=styles["BodyText"],
        fontName="Nirmala",
        fontSize=8.1,
        leading=11.5,
        textColor=colors.HexColor("#475569"),
        spaceAfter=2 * mm,
    )
)


def markdown_flowables(lines: list[str], language: str) -> list:
    flow = []
    paragraph_buffer: list[str] = []
    code_buffer: list[str] = []
    in_code = False

    def flush_paragraph() -> None:
        nonlocal paragraph_buffer
        if paragraph_buffer:
            text = " ".join(part.strip() for part in paragraph_buffer if part.strip())
            if text:
                flow.append(Paragraph(inline_markup(text), styles["BodySinhala" if language == "si" else "BodyEnglish"]))
            paragraph_buffer = []

    def flush_code() -> None:
        nonlocal code_buffer
        if code_buffer:
            code = "\n".join(clean_dashes(line) for line in code_buffer)
            flow.append(
                Preformatted(
                    code,
                    ParagraphStyle(
                        name=f"Code{len(flow)}",
                        fontName="Courier",
                        fontSize=6.8,
                        leading=8.4,
                        leftIndent=4 * mm,
                        rightIndent=2 * mm,
                        borderColor=colors.HexColor("#CBD5E1"),
                        borderWidth=0.5,
                        borderPadding=4,
                        backColor=colors.HexColor("#F8FAFC"),
                    ),
                )
            )
            flow.append(Spacer(1, 1.5 * mm))
            code_buffer = []

    for raw in lines:
        line = raw.rstrip()
        if line.strip().startswith("```"):
            flush_paragraph()
            if in_code:
                flush_code()
                in_code = False
            else:
                in_code = True
            continue
        if in_code:
            code_buffer.append(line)
            continue
        if not line.strip():
            flush_paragraph()
            continue
        if line.strip() == "---":
            flush_paragraph()
            flow.append(Spacer(1, 1.5 * mm))
            flow.append(HRFlowable(width="100%", thickness=0.7, color=colors.HexColor("#CBD5E1")))
            flow.append(Spacer(1, 1.5 * mm))
            continue
        if line.startswith("### "):
            flush_paragraph()
            flow.append(Paragraph(inline_markup(line[4:]), styles["SubTitle"]))
            continue
        if line.startswith("## "):
            flush_paragraph()
            flow.append(Paragraph(inline_markup(line[3:]), styles["SectionTitle"]))
            continue
        if line.startswith("# "):
            flush_paragraph()
            flow.append(Paragraph(inline_markup(line[2:]), styles["SectionTitle"]))
            continue
        if line.startswith("- "):
            flush_paragraph()
            flow.append(Paragraph("• " + inline_markup(line[2:]), styles["GuideBullet"]))
            continue
        number_match = re.match(r"^(\d+)\.\s+(.*)$", line)
        if number_match:
            flush_paragraph()
            flow.append(Paragraph(f"<b>{number_match.group(1)}.</b> {inline_markup(number_match.group(2))}", styles["GuideBullet"]))
            continue
        if line.startswith(">"):
            flush_paragraph()
            flow.append(Paragraph(inline_markup(line[1:].strip()), styles["Quote"]))
            continue
        paragraph_buffer.append(line)

    if in_code:
        flush_code()
    flush_paragraph()
    return flow


def add_code_evidence(
    story: list,
    title: str,
    path: str,
    code: str,
    line_ref: str | None = None,
) -> None:
    story.append(Paragraph(inline_markup(title), styles["SubTitle"]))
    display_path = path.replace("\\", "/")
    location = f"File: <font name=\"Courier\">{html.escape(display_path, quote=False)}</font>"
    if line_ref:
        location += f" &nbsp; <b>Lines:</b> {html.escape(line_ref, quote=False)}"
    story.append(Paragraph(location, styles["CodePath"]))
    story.append(
        Preformatted(
            clean_dashes(code.strip("\n")),
            ParagraphStyle(
                name=f"Evidence{len(story)}",
                fontName="Courier",
                fontSize=6.8,
                leading=8.4,
                leftIndent=4 * mm,
                rightIndent=2 * mm,
                borderColor=colors.HexColor("#CBD5E1"),
                borderWidth=0.5,
                borderPadding=4,
                backColor=colors.HexColor("#F8FAFC"),
            ),
        )
    )
    story.append(Spacer(1, 2 * mm))


CODE_EVIDENCE = {
    "V-01": [
        (
            "Key secure route protection",
            "demo/secure/pubudu-pos-api-secure/routes/api.php",
            "Route::middleware(['auth:sanctum', 'active'])->group(function () {\n    Route::middleware('admin')->group(function () {\n        Route::post('/register', [AuthController::class, 'register']);\n    });\n});",
            "80 and 187-193",
        ),
        (
            "Security test result",
            "demo/secure/pubudu-pos-api-secure/tests/Feature/Security/AccessControlTest.php",
            "$response = $this->postJson('/api/register', $payload);\n$response->assertStatus(401);\n$this->assertDatabaseMissing('users', ['username' => 'attacker']);",
            "20-35",
        ),
    ],
    "V-02": [
        (
            "Frontend administrator guard",
            "demo/secure/pubudu-pos-front-end-secure/src/App.jsx",
            "<Route\n  path=\"/sales/profit\"\n  element={\n    <ProtectedRoute adminOnly={true}>\n      <Layout><ProfitReport /></Layout>\n    </ProtectedRoute>\n  }\n/>",
            "176-185",
        ),
        (
            "Backend authorization result",
            "demo/secure/pubudu-pos-api-secure/routes/api.php",
            "Route::middleware(['auth:sanctum', 'active', 'admin'])->group(function () {\n    // financial report endpoints\n});\n\n// Employee request: 403 Forbidden",
            "80, 187 and 264-274",
        ),
    ],
    "V-03": [
        (
            "Department-scoped customer lookup",
            "demo/secure/pubudu-pos-api-secure/app/Http/Controllers/Api/CustomerController.php",
            "$customer = Customer::with('department')\n    ->visibleTo($request->user())\n    ->find($id);\n\nif (! $customer) {\n    return response()->json(['message' => 'Not found'], 404);\n}",
            "18-25 and 131-145",
        ),
        (
            "Reusable branch scope",
            "demo/secure/pubudu-pos-api-secure/app/Models/Concerns/ScopedToDepartment.php",
            "public function scopeVisibleTo(Builder $query, ?User $user): Builder\n{\n    return $query->where('department_id', $user?->department_id);\n}",
            "58-80",
        ),
    ],
    "V-05": [
        (
            "Generic authentication response",
            "demo/secure/pubudu-pos-api-secure/app/Http/Controllers/Api/AuthController.php",
            "$passwordValid = $user\n    ? Hash::check($request->password, $user->password)\n    : Hash::check($request->password, self::DUMMY_HASH);\n\nif (! $user || ! $passwordValid) {\n    return response()->json([\n        'message' => 'The username or password is incorrect.',\n    ], 401);\n}",
            "27 and 92-105",
        ),
        (
            "Login throttling",
            "demo/secure/pubudu-pos-api-secure/routes/api.php",
            "Route::middleware('throttle:login')->group(function () {\n    Route::post('/login', [AuthController::class, 'login']);\n});\n\n// Repeated attempts are refused with HTTP 429.",
            "61-66",
        ),
    ],
    "V-06": [
        (
            "Reject and revoke inactive-user tokens",
            "demo/secure/pubudu-pos-api-secure/app/Http/Middleware/EnsureUserIsActive.php",
            "if ($user && ! $user->is_active) {\n    $user->tokens()->delete();\n    return response()->json([\n        'message' => 'Account is inactive.',\n    ], 403);\n}",
            "45-69",
        ),
        (
            "Finite token expiry",
            "demo/secure/pubudu-pos-api-secure/config/sanctum.php",
            "'expiration' => (int) env('SANCTUM_TOKEN_EXPIRATION', 480),\n\n// 480 minutes = 8 hours",
            "62-66",
        ),
    ],
    "OIDC": [
        (
            "Authorization Code + PKCE values",
            "demo/secure/pubudu-pos-api-secure/app/Services/GoogleOidcService.php",
            "$state = Str::random(40);\n$nonce = Str::random(40);\n$codeVerifier = Str::random(96);\n$codeChallenge = rtrim(strtr(\n    base64_encode(hash('sha256', $codeVerifier, true)), '+/', '-_'\n), '=');\n\nCache::put($this->cacheKey($state), [\n    'nonce' => $nonce,\n    'code_verifier' => $codeVerifier,\n], self::FLOW_TTL_SECONDS);",
            "75-107",
        ),
        (
            "Callback validation",
            "demo/secure/pubudu-pos-api-secure/app/Http/Controllers/Api/GoogleAuthController.php",
            "$flow = $this->oidc->consumeFlow($request->string('state'));\n// The server exchanges the code using the stored verifier.\n// The ID token is checked for issuer, audience, expiry and nonce.",
            "102-131",
        ),
    ],
}


SECTION_SPECS = [
    ("V-01", "## V-01", "V-01"),
    ("V-02", "## V-02", "V-02"),
    ("V-03", "## V-03", "V-03"),
    ("V-05", "## V-05", "V-05"),
    ("V-06", "## V-06", "V-06"),
    ("OIDC", "## Google OpenID Connect", "OIDC"),
]


def footer(canvas, document) -> None:
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor("#CBD5E1"))
    canvas.line(18 * mm, 14 * mm, PAGE_W - 18 * mm, 14 * mm)
    canvas.setFont("Nirmala", 7.5)
    canvas.setFillColor(colors.HexColor("#64748B"))
    canvas.drawString(18 * mm, 9 * mm, "Pubudu Tire Management System - Ravindu video guide")
    canvas.drawRightString(PAGE_W - 18 * mm, 9 * mm, f"Page {document.page}")
    canvas.restoreState()


def build() -> None:
    sin_text = SINHALA.read_text(encoding="utf-8")
    eng_text = ENGLISH.read_text(encoding="utf-8")

    frame = Frame(18 * mm, 19 * mm, PAGE_W - 36 * mm, PAGE_H - 33 * mm, id="normal")
    document = BaseDocTemplate(
        str(OUT),
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=17 * mm,
        bottomMargin=19 * mm,
        title="Ravindu Bilingual Video Guide",
        author="Pubudu Tire Management System team",
    )
    document.addPageTemplates([PageTemplate(id="main", frames=frame, onPage=footer)])

    story = []
    story.append(Spacer(1, 20 * mm))
    story.append(Paragraph("Ravindu - Bilingual Security Video Guide", styles["CoverTitle"]))
    story.append(Paragraph("Sinhala action guide + English speech + code segments + test evidence", styles["CoverSubTitle"]))
    story.append(Spacer(1, 5 * mm))
    cover_data = [
        [Paragraph("Member", styles["Small"]), Paragraph("P.A.R.B. Subasingha (Ravindu)", styles["Small"])],
        [Paragraph("Original website", styles["Small"]), Paragraph("http://localhost:5174/login", styles["Small"])],
        [Paragraph("Secure website", styles["Small"]), Paragraph("http://localhost:5173/login", styles["Small"])],
        [Paragraph("Assigned scope", styles["Small"]), Paragraph("V-01, V-02, V-03, V-05, V-06 and Google OIDC", styles["Small"])],
    ]
    cover_table = Table(cover_data, colWidths=[42 * mm, 125 * mm])
    cover_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#E6F3F7")),
                ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#9CC7D6")),
                ("INNERGRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#C9DDE4")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    story.append(cover_table)
    story.append(Spacer(1, 8 * mm))
    story.append(Paragraph("How to use this PDF", styles["SectionTitle"]))
    story.extend(markdown_flowables(before_first_section(sin_text), "si"))
    story.append(Spacer(1, 3 * mm))
    story.append(Paragraph("English introduction for the video", styles["Label"]))
    story.extend(markdown_flowables(before_first_section(eng_text), "en"))

    for key, sin_prefix, code_key in SECTION_SPECS:
        sin_part = section(sin_text, sin_prefix)
        eng_part = section(eng_text, sin_prefix)
        if not sin_part or not eng_part:
            continue
        story.append(Spacer(1, 3 * mm))
        story.append(Paragraph(f"{key} - Sinhala guide first, English speech underneath", styles["SectionTitle"]))
        story.append(Paragraph("Sinhala guide - මේ කොටස කරන විදිහ", styles["Label"]))
        story.extend(markdown_flowables(sin_part, "si"))
        story.append(Paragraph("English speech - read this in the video", styles["Label"]))
        story.extend(markdown_flowables(eng_part, "en"))
        story.append(Paragraph("Key code segments and file locations", styles["Label"]))
        for entry in CODE_EVIDENCE.get(code_key, []):
            title, path, code = entry[:3]
            line_ref = entry[3] if len(entry) > 3 else None
            add_code_evidence(story, title, path, code, line_ref)

    story.append(Paragraph("Final conclusion and recording checklist", styles["SectionTitle"]))
    story.append(Paragraph("Sinhala conclusion and checklist", styles["Label"]))
    story.extend(markdown_flowables(section(sin_text, "## අවසාන conclusion එක"), "si"))
    story.append(Paragraph("English conclusion", styles["Label"]))
    story.extend(markdown_flowables(section(eng_text, "## Conclusion"), "en"))
    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph("Important: keep passwords masked. Do not display bearer tokens, client secrets or personal Google-account data. Do not submit the V-01 registration exploit and do not deactivate the seeded employee for V-06.", styles["Quote"]))

    document.build(story)
    print(OUT)


if __name__ == "__main__":
    build()
