"""Build the submission PDF from the updated Word report.

This is a small reflowing exporter for the assignment report.  It keeps the
report text, tables, and the three GitHub evidence screenshots while making a
clean A4 PDF that does not depend on Microsoft Word being installed.
"""

from __future__ import annotations

import re
from pathlib import Path
from xml.sax.saxutils import escape

from docx import Document
from docx.oxml.ns import qn
from docx.table import Table as DocxTable
from docx.text.paragraph import Paragraph as DocxParagraph
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch, mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    Image,
    PageTemplate,
    PageBreak,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(r"D:\ass_sd")
SOURCE = ROOT / "SE4030_SSD_Report_Updated.docx"
OUTPUT = ROOT / "submission_package" / "report" / "SE4030_SSD_Report.pdf"
MEDIA = ROOT / "work" / "pdf_media"


def plain(value: str) -> str:
    """Normalise punctuation so the built-in PDF fonts remain reliable."""

    replacements = {
        "\u2013": "-",
        "\u2014": "-",
        "\u2011": "-",
        "\u2192": "->",
        "\u2190": "<-",
        "\u21d2": "=>",
        "\u00a0": " ",
        "\u2018": "'",
        "\u2019": "'",
        "\u201c": '"',
        "\u201d": '"',
        "\u2026": "...",
        "\u2022": "-",
        "\u00d7": "x",
    }
    for old, new in replacements.items():
        value = value.replace(old, new)
    return value


def markup(value: str) -> str:
    value = plain(value).replace("\r", "")
    return escape(value).replace("\n", "<br/>")


def iter_blocks(document: Document):
    for child in document.element.body.iterchildren():
        if child.tag == qn("w:p"):
            yield DocxParagraph(child, document)
        elif child.tag == qn("w:tbl"):
            yield DocxTable(child, document)


def paragraph_images(paragraph: DocxParagraph, document: Document, media_dir: Path):
    paths = []
    seen = set()
    for blip in paragraph._p.iter(qn("a:blip")):
        rel_id = blip.get(qn("r:embed"))
        if not rel_id or rel_id in seen:
            continue
        seen.add(rel_id)
        part = document.part.related_parts.get(rel_id)
        if part is None or not hasattr(part, "blob"):
            continue
        filename = Path(getattr(part, "filename", f"{rel_id}.png")).name
        suffix = Path(filename).suffix or ".png"
        target = media_dir / f"{rel_id}{suffix}"
        if not target.exists():
            target.write_bytes(part.blob)
        paths.append(target)
    return paths


def table_flowable(docx_table: DocxTable, styles, available_width: float):
    rows = []
    has_header = len(docx_table.rows) > 1
    for row_index, row in enumerate(docx_table.rows):
        cells = []
        for cell in row.cells:
            cell_text = "\n".join(p.text for p in cell.paragraphs).strip()
            cell_style = styles["TableHeaderCell"] if has_header and row_index == 0 else styles["TableCell"]
            cells.append(Paragraph(markup(cell_text), cell_style))
        rows.append(cells)
    if not rows:
        return Spacer(1, 2 * mm)

    column_count = max(len(row) for row in rows)
    if column_count == 1:
        widths = [available_width]
    elif column_count == 2:
        widths = [available_width * 0.35, available_width * 0.65]
    elif column_count == 3:
        widths = [available_width * 0.25, available_width * 0.45, available_width * 0.30]
    elif column_count == 4:
        widths = [available_width * 0.22, available_width * 0.38, available_width * 0.20, available_width * 0.20]
    else:
        widths = [available_width / column_count] * column_count

    table = Table(rows, colWidths=widths, repeatRows=1, hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f2f2f2")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.black),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#d9d9d9")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#fafafa")]),
            ]
        )
    )
    return table


def footer(canvas, document):
    canvas.saveState()
    width, _ = A4
    canvas.setStrokeColor(colors.HexColor("#d1d9e0"))
    canvas.setLineWidth(0.4)
    canvas.line(18 * mm, 14 * mm, width - 18 * mm, 14 * mm)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#59636e"))
    canvas.drawString(18 * mm, 9 * mm, "SE4030 - Secure Software Development")
    canvas.drawRightString(width - 18 * mm, 9 * mm, f"Page {document.page}")
    canvas.restoreState()


def build():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    MEDIA.mkdir(parents=True, exist_ok=True)
    for old_media in MEDIA.iterdir():
        if old_media.is_file():
            old_media.unlink()
    document = Document(str(SOURCE))

    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="CoverTitle",
            parent=styles["Title"],
            fontName="Helvetica-Bold",
            fontSize=23,
            leading=28,
            textColor=colors.black,
            alignment=TA_CENTER,
            spaceAfter=12,
        )
    )
    styles.add(
        ParagraphStyle(
            name="CoverSubTitle",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=13,
            leading=17,
            textColor=colors.black,
            alignment=TA_CENTER,
            spaceAfter=7,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ReportBody",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=9.5,
            leading=13.2,
            alignment=TA_LEFT,
            spaceAfter=5,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ReportH1",
            parent=styles["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=15,
            leading=19,
            textColor=colors.black,
            spaceBefore=10,
            spaceAfter=7,
            keepWithNext=True,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ReportH2",
            parent=styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=11.5,
            leading=14,
            textColor=colors.black,
            spaceBefore=7,
            spaceAfter=4,
            keepWithNext=True,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ReportH3",
            parent=styles["Heading3"],
            fontName="Helvetica-Bold",
            fontSize=10.2,
            leading=12.5,
            textColor=colors.black,
            spaceBefore=5,
            spaceAfter=3,
            keepWithNext=True,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ReportCaption",
            parent=styles["Normal"],
            fontName="Helvetica-Oblique",
            fontSize=8.2,
            leading=10.5,
            alignment=TA_CENTER,
            textColor=colors.black,
            spaceBefore=2,
            spaceAfter=7,
        )
    )
    styles.add(
        ParagraphStyle(
            name="TableCell",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=7.2,
            leading=9.1,
            spaceAfter=0,
        )
    )
    styles.add(
        ParagraphStyle(
            name="TableHeaderCell",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=7.2,
            leading=9.1,
            textColor=colors.black,
            spaceAfter=0,
        )
    )
    styles.add(
        ParagraphStyle(
            name="MemberCell",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=9,
            leading=12,
            spaceAfter=0,
        )
    )

    margin = 18 * mm
    frame = Frame(margin, 19 * mm, A4[0] - 2 * margin, A4[1] - 34 * mm, id="normal")
    template = PageTemplate(id="report", frames=[frame], onPage=footer)
    pdf = BaseDocTemplate(
        str(OUTPUT),
        pagesize=A4,
        leftMargin=margin,
        rightMargin=margin,
        topMargin=15 * mm,
        bottomMargin=19 * mm,
        title="Securing a Multi-Branch Point-of-Sale System",
        author="SE4030 group assignment",
    )
    pdf.addPageTemplates([template])

    available_width = A4[0] - 2 * margin
    story = []

    story.append(Spacer(1, 24 * mm))
    story.append(Paragraph("Securing a Multi-Branch Point-of-Sale System", styles["CoverTitle"]))
    story.append(Paragraph("SE4030 - Secure Software Development", styles["CoverSubTitle"]))
    story.append(Paragraph("Group assignment report", styles["CoverSubTitle"]))
    story.append(Spacer(1, 18 * mm))
    story.append(Paragraph("Application", styles["ReportH2"]))
    story.append(
        Paragraph(
            "Pubudu Tyres POS / mini-ERP - Laravel REST API and React single-page application.",
            styles["ReportBody"],
        )
    )
    story.append(Spacer(1, 8 * mm))
    story.append(Paragraph("Group members", styles["ReportH2"]))
    member_rows = [
        [Paragraph("Name", styles["TableHeaderCell"]), Paragraph("Index number", styles["TableHeaderCell"]), Paragraph("Role", styles["TableHeaderCell"])],
        [Paragraph("P.A.R.B. Subasingha", styles["MemberCell"]), Paragraph("IT22098450", styles["MemberCell"]), Paragraph("Ravindu - leader", styles["MemberCell"])],
        [Paragraph("R.M.M.P. Bandara", styles["MemberCell"]), Paragraph("IT22249166", styles["MemberCell"]), Paragraph("Malith", styles["MemberCell"])],
        [Paragraph("R.H.F. Hamna", styles["MemberCell"]), Paragraph("IT22516916", styles["MemberCell"]), Paragraph("Hamna", styles["MemberCell"])],
        [Paragraph("R.M.K.N. Gunasena", styles["MemberCell"]), Paragraph("IT22078582", styles["MemberCell"]), Paragraph("Nimathra", styles["MemberCell"])],
    ]
    member_table = Table(member_rows, colWidths=[available_width * 0.42, available_width * 0.25, available_width * 0.33])
    member_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f2f2f2")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.black),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#d9d9d9")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#fafafa")]),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    story.append(member_table)
    story.append(Spacer(1, 18 * mm))
    story.append(Paragraph("Prepared for submission", styles["CoverSubTitle"]))
    story.append(PageBreak())

    started = False
    for block in iter_blocks(document):
        if isinstance(block, DocxParagraph):
            text = block.text.strip()
            images = paragraph_images(block, document, MEDIA)
            if not started:
                if text == "1. Executive Summary":
                    started = True
                else:
                    continue

            if text:
                style_name = block.style.name or ""
                if style_name.startswith("Heading 1"):
                    style = styles["ReportH1"]
                elif style_name.startswith("Heading 2"):
                    style = styles["ReportH2"]
                elif style_name.startswith("Heading 3"):
                    style = styles["ReportH3"]
                elif text.startswith("Figure ") or text.startswith("Figures "):
                    style = styles["ReportCaption"]
                else:
                    style = styles["ReportBody"]
                story.append(Paragraph(markup(text), style))

            for image_path in images:
                image = Image(str(image_path))
                image._restrictSize(available_width, 105 * mm)
                story.append(Spacer(1, 2 * mm))
                story.append(image)
                story.append(Spacer(1, 2 * mm))
        else:
            if started:
                story.append(table_flowable(block, styles, available_width))
                story.append(Spacer(1, 4 * mm))

    pdf.build(story)
    print(f"Created {OUTPUT}")


if __name__ == "__main__":
    build()
