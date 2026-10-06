"""Add representative evidence visuals and remove low-contrast table fills."""

from pathlib import Path

from docx import Document
from docx.enum.style import WD_STYLE_TYPE
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, RGBColor


ROOT = Path(r"D:\ass_sd")
INPUT = ROOT / "SE4030_SSD_Report_Updated.docx"
OUTPUT = INPUT
BLACK = RGBColor(0x00, 0x00, 0x00)


def set_cell_style(cell, fill: str):
    tc_pr = cell._tc.get_or_add_tcPr()
    shading = tc_pr.find(qn("w:shd"))
    if shading is None:
        shading = OxmlElement("w:shd")
        tc_pr.append(shading)
    shading.set(qn("w:val"), "clear")
    shading.set(qn("w:fill"), fill)

    borders = tc_pr.find(qn("w:tcBorders"))
    if borders is None:
        borders = OxmlElement("w:tcBorders")
        tc_pr.append(borders)
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        tag = qn(f"w:{edge}")
        element = borders.find(tag)
        if element is None:
            element = OxmlElement(f"w:{edge}")
            borders.append(element)
        element.set(qn("w:val"), "single")
        element.set(qn("w:sz"), "4")
        element.set(qn("w:space"), "0")
        element.set(qn("w:color"), "D9D9D9")


def set_all_text_black(document: Document):
    for style in document.styles:
        if style.type == WD_STYLE_TYPE.PARAGRAPH:
            try:
                style.font.color.rgb = BLACK
            except Exception:
                pass

    for paragraph in document.paragraphs:
        for run in paragraph.runs:
            run.font.color.rgb = BLACK

    for table in document.tables:
        for row_index, row in enumerate(table.rows):
            fill = "F2F2F2" if row_index == 0 and len(table.rows) > 1 else "FFFFFF"
            for cell in row.cells:
                set_cell_style(cell, fill)
                for paragraph in cell.paragraphs:
                    for run in paragraph.runs:
                        run.font.color.rgb = BLACK


def remove_paragraph_lines(document: Document):
    """Remove the blue left-side Word paragraph border/markup line."""

    for paragraph in document.paragraphs:
        p_pr = paragraph._p.get_or_add_pPr()
        border = p_pr.find(qn("w:pBdr"))
        if border is not None:
            p_pr.remove(border)
    for table in document.tables:
        for row in table.rows:
            for cell in row.cells:
                for paragraph in cell.paragraphs:
                    p_pr = paragraph._p.get_or_add_pPr()
                    border = p_pr.find(qn("w:pBdr"))
                    if border is not None:
                        p_pr.remove(border)


def add_pos_screenshots(document: Document):
    if any(p.text.strip() == "POS system screenshots" for p in document.paragraphs):
        replace_profit_screenshot(document)
        add_member_evidence_snapshot(document)
        return

    anchor = next(
        (p for p in document.paragraphs if p.text.strip() == "2.1 Threat model"),
        None,
    )
    if anchor is None:
        raise RuntimeError("Could not find the 2.1 Threat model heading")

    screenshots = [
        (
            ROOT / "video/Ravindu/Vulnerability 01 - Public Registration/V01-01-original-login-empty.png",
            "Figure 4. Original POS login screen used for the public-registration demonstration.",
        ),
        (
            ROOT / "video/Ravindu/Vulnerability 01 - Public Registration/V01-04-original-dashboard.png",
            "Figure 5. Original POS dashboard after the vulnerable login.",
        ),
        (
            ROOT / "video/Ravindu/Vulnerability 01 - Public Registration/V01-05-secure-login.png",
            "Figure 6. Secure POS dashboard after staff authentication.",
        ),
        (
            ROOT / "video/Ravindu/Vulnerability 03 - Cross Branch IDOR/V03-04-secure-customer-list.png",
            "Figure 7. Secure customer page showing the branch-scoped POS records.",
        ),
        (
            ROOT / "video/Ravindu/Vulnerability 02 - Missing Role Authorization/V02-01-original-employee-profit-report.png",
            "Figure 8. Original employee profit report exposing revenue, cost, profit and margin data.",
        ),
    ]
    missing = [str(path) for path, _ in screenshots if not path.exists()]
    if missing:
        raise FileNotFoundError("Missing screenshot files: " + ", ".join(missing))

    heading = anchor.insert_paragraph_before("POS system screenshots")
    heading.style = "Heading 2"
    heading.alignment = WD_ALIGN_PARAGRAPH.LEFT
    for run in heading.runs:
        run.font.color.rgb = BLACK

    intro = anchor.insert_paragraph_before(
        "The following screens are included to show the application that was audited, the original user flow, and the visible result after the security changes."
    )
    for run in intro.runs:
        run.font.color.rgb = BLACK

    for path, caption in screenshots:
        image_paragraph = anchor.insert_paragraph_before()
        image_paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
        image_paragraph.add_run().add_picture(str(path), width=Inches(5.75))
        caption_paragraph = anchor.insert_paragraph_before(caption)
        caption_paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for run in caption_paragraph.runs:
            run.font.color.rgb = BLACK
            run.italic = True

    add_member_evidence_snapshot(document)


def add_member_evidence_snapshot(document: Document):
    """Add one compact visual showing the four member evidence guides."""

    if any(p.text.strip() == "Member evidence snapshots" for p in document.paragraphs):
        return

    anchor = next(
        (p for p in document.paragraphs if p.text.strip() == "2.1 Threat model"),
        None,
    )
    if anchor is None:
        raise RuntimeError("Could not find the 2.1 Threat model heading")

    snapshot = ROOT / "work/member_evidence_snapshots.png"
    if not snapshot.exists():
        raise FileNotFoundError(f"Missing member evidence snapshot: {snapshot}")

    heading = anchor.insert_paragraph_before("Member evidence snapshots")
    heading.style = "Heading 2"
    heading.alignment = WD_ALIGN_PARAGRAPH.LEFT
    for run in heading.runs:
        run.font.color.rgb = BLACK

    intro = anchor.insert_paragraph_before(
        "One compact evidence image is included for each presenter to show the assigned scope and planned demonstration."
    )
    for run in intro.runs:
        run.font.color.rgb = BLACK

    image_paragraph = anchor.insert_paragraph_before()
    image_paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    image_paragraph.add_run().add_picture(str(snapshot), width=Inches(5.75))

    caption = anchor.insert_paragraph_before(
        "Figure 9. Representative member evidence snapshots for Ravindu, Malith, Hamna and Nimthra."
    )
    caption.alignment = WD_ALIGN_PARAGRAPH.CENTER
    for run in caption.runs:
        run.font.color.rgb = BLACK
        run.italic = True


def replace_profit_screenshot(document: Document):
    """Correct the final demo image when this script is run again."""

    caption = next(
        (p for p in document.paragraphs if p.text.strip().startswith("Figure 8.")),
        None,
    )
    if caption is None:
        return
    caption.text = "Figure 8. Original employee profit report exposing revenue, cost, profit and margin data."
    image_paragraphs = [p for p in document.paragraphs if list(p._p.iter(qn("a:blip")))]
    if len(image_paragraphs) < 5:
        return
    target = ROOT / "video/Ravindu/Vulnerability 02 - Missing Role Authorization/V02-01-original-employee-profit-report.png"
    relationship_id, _ = document.part.get_or_add_image(str(target))
    for blip in image_paragraphs[4]._p.iter(qn("a:blip")):
        blip.set(qn("r:embed"), relationship_id)


def main():
    document = Document(str(INPUT))
    set_all_text_black(document)
    remove_paragraph_lines(document)
    add_pos_screenshots(document)
    document.save(str(OUTPUT))
    print(f"Updated {OUTPUT}")


if __name__ == "__main__":
    main()
