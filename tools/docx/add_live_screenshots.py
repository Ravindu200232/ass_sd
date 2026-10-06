"""Add four selected live vulnerability screenshots to the report."""

from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.shared import Inches, RGBColor


ROOT = Path(r"D:\ass_sd")
REPORT = ROOT / "SE4030_SSD_Report_Updated.docx"
BLACK = RGBColor(0x00, 0x00, 0x00)

EVIDENCE = [
    (
        ROOT / "work/live_screenshots/V02-original-live.png",
        "Figure 4. Ravindu - V-02 original employee profit report showing revenue, cost, profit and margin data.",
    ),
    (
        ROOT / "work/live_screenshots/V10-original-live.png",
        "Figure 5. Malith - V-10 original invoice screen showing the client-controlled price and discount-request surface.",
    ),
    (
        ROOT / "work/live_screenshots/V09-secure-live.png",
        "Figure 6. Hamna - V-09 secure login screen used during the security-response and configuration demonstration.",
    ),
    (
        ROOT / "work/live_screenshots/V20-secure-live.png",
        "Figure 7. Nimthra - V-20 secure employee stock view without wholesale-cost or margin fields.",
    ),
]


def add_section(document: Document):
    if any(p.text.strip() == "Selected live vulnerability evidence" for p in document.paragraphs):
        return

    anchor = next(
        (p for p in document.paragraphs if p.text.strip() == "2.1 Threat model"),
        None,
    )
    if anchor is None:
        raise RuntimeError("Could not find the 2.1 Threat model heading")

    missing = [str(path) for path, _ in EVIDENCE if not path.exists()]
    if missing:
        raise FileNotFoundError("Missing live screenshot files: " + ", ".join(missing))

    heading = anchor.insert_paragraph_before("Selected live vulnerability evidence")
    heading.style = "Heading 2"
    heading.alignment = WD_ALIGN_PARAGRAPH.LEFT
    for run in heading.runs:
        run.font.color.rgb = BLACK

    intro = anchor.insert_paragraph_before(
        "Four representative live application screens are included as concise evidence, one for each presenter. The complete before/after results remain in the automated evidence files."
    )
    for run in intro.runs:
        run.font.color.rgb = BLACK

    for path, caption in EVIDENCE:
        image_paragraph = anchor.insert_paragraph_before()
        image_paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
        image_paragraph.add_run().add_picture(str(path), width=Inches(5.75))

        caption_paragraph = anchor.insert_paragraph_before(caption)
        caption_paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for run in caption_paragraph.runs:
            run.font.color.rgb = BLACK
            run.italic = True


def main():
    document = Document(str(REPORT))
    add_section(document)
    document.save(str(REPORT))
    print(f"Updated {REPORT}")


if __name__ == "__main__":
    main()
