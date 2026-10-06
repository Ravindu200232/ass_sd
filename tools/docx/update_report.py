from pathlib import Path

from docx import Document
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor
from docx.text.paragraph import Paragraph


SOURCE = Path(r"C:\Users\ravin\OneDrive\Desktop\SE4030_SSD_Report.docx")
OUTPUT = Path(r"D:\ass_sd\SE4030_SSD_Report_Updated.docx")


def set_cell_shading(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tc_pr.append(shd)
    shd.set(qn("w:fill"), fill)


def set_cell_borders(cell, color="D9D9D9", size="6"):
    tc_pr = cell._tc.get_or_add_tcPr()
    borders = tc_pr.first_child_found_in("w:tcBorders")
    if borders is None:
        borders = OxmlElement("w:tcBorders")
        tc_pr.append(borders)
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        tag = f"w:{edge}"
        element = borders.find(qn(tag))
        if element is None:
            element = OxmlElement(tag)
            borders.append(element)
        element.set(qn("w:val"), "single")
        element.set(qn("w:sz"), size)
        element.set(qn("w:space"), "0")
        element.set(qn("w:color"), color)


def set_cell_margins(cell, top=90, start=110, bottom=90, end=110):
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    margins = tc_pr.first_child_found_in("w:tcMar")
    if margins is None:
        margins = OxmlElement("w:tcMar")
        tc_pr.append(margins)
    for side, value in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = margins.find(qn(f"w:{side}"))
        if node is None:
            node = OxmlElement(f"w:{side}")
            margins.append(node)
        node.set(qn("w:w"), str(value))
        node.set(qn("w:type"), "dxa")


def set_row_cant_split(row):
    tr_pr = row._tr.get_or_add_trPr()
    if tr_pr.find(qn("w:cantSplit")) is None:
        tr_pr.append(OxmlElement("w:cantSplit"))


def insert_paragraph_after(paragraph, text="", style=None):
    new_p = OxmlElement("w:p")
    paragraph._p.addnext(new_p)
    result = Paragraph(new_p, paragraph._parent)
    if style:
        try:
            result.style = style
        except KeyError:
            pass
    if text:
        result.add_run(text)
    return result


def paragraph_contains_media(paragraph, media_name):
    for blip in paragraph._p.iter(qn("a:blip")):
        rid = blip.get(qn("r:embed"))
        if rid and paragraph.part.related_parts[rid].partname == f"/word/media/{media_name}":
            return True
    return False


def set_table_text_font(table, size=9):
    for row in table.rows:
        set_row_cant_split(row)
        for cell in row.cells:
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            set_cell_borders(cell)
            set_cell_margins(cell)
            for paragraph in cell.paragraphs:
                paragraph.paragraph_format.space_after = Pt(2)
                for run in paragraph.runs:
                    run.font.size = Pt(size)


doc = Document(str(SOURCE))

# Make the member table match the names and workstreams used in the submission.
member_table = doc.tables[0]
name_by_workstream = {
    "Access control": "P.A.R.B. Subasingha",
    "Frontend attack": "R.M.K.N. Gunasena",
    "Configuration": "R.H.F. Hamna",
    "Input/business": "R.M.M.P. Bandara",
}
for row in member_table.rows[1:]:
    workstream = row.cells[2].text
    for key, name in name_by_workstream.items():
        if key in workstream:
            row.cells[0].text = name
            break
set_table_text_font(member_table, size=9)

# Align the commit statement with the GitHub Insights screenshot included in the report.
for paragraph in doc.paragraphs:
    if paragraph.text.strip().startswith("Commit history:"):
        paragraph.text = (
            "Commit history: The GitHub evidence below records four contributors, 11 branches "
            "and 30 commits in the reporting-period snapshot. The Insights view shows 0 files "
            "changed on main in that snapshot; the contributor branches preserve the individual "
            "work used for review and integration."
        )
        break

# Add captions to the three existing repository evidence screenshots.
for paragraph in doc.paragraphs:
    if paragraph_contains_media(paragraph, "image1.png"):
        caption = insert_paragraph_after(
            paragraph,
            "Figure 1. GitHub repository overview showing the SSD_Assigment project and its security evidence folders.",
            "Normal",
        )
        caption.alignment = WD_ALIGN_PARAGRAPH.CENTER
        break

for paragraph in doc.paragraphs:
    if paragraph_contains_media(paragraph, "image2.png"):
        caption = insert_paragraph_after(
            paragraph,
            "Figures 2 and 3. GitHub branch list and Insights summary showing the contributor branches, four authors and recorded commit activity.",
            "Normal",
        )
        caption.alignment = WD_ALIGN_PARAGRAPH.CENTER
        break

# Add a compact mapping to the six marking-guide criteria so the evidence is easy to find.
heading = doc.add_heading("10. Marking guide coverage", level=1)
for run in heading.runs:
    run.font.color.rgb = RGBColor(0, 0, 0)

intro = doc.add_paragraph(
    "The report addresses each criterion in the supplied SE4030 marking guide. The table below gives the marker a direct route to the supporting evidence."
)
intro.paragraph_format.space_after = Pt(6)

rubric = doc.add_table(rows=1, cols=3)
rubric.alignment = WD_TABLE_ALIGNMENT.CENTER
try:
    rubric.style = "Table Grid"
except KeyError:
    pass
headers = ["Marking criterion", "Evidence in this report", "Location"]
for cell, text in zip(rubric.rows[0].cells, headers):
    cell.text = text
    set_cell_shading(cell, "1F4E78")
    cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
    for paragraph in cell.paragraphs:
        paragraph.alignment = WD_ALIGN_PARAGRAPH.LEFT
        for run in paragraph.runs:
            run.bold = True
            run.font.color.rgb = RGBColor(255, 255, 255)
            run.font.size = Pt(9)

rows = [
    ("Application scope and complexity", "Multi-branch POS and inventory system with money, customer PII, roles, departments and approval workflows; not a teaching application.", "Section 2"),
    ("Identifying potential vulnerabilities", "19 findings identified using code review, dependency analysis, dynamic PoCs and regression testing.", "Sections 3-4"),
    ("Fixing the vulnerabilities", "14 findings fixed, five risks documented as deferred, and before/after runtime, unit and frontend test evidence recorded.", "Sections 4-5 and 9"),
    ("OAuth or OpenID Connect function", "Google OpenID Connect Authorization Code flow with PKCE, explicit ID-token checks and no auto-provisioning.", "Section 6"),
    ("Discussion", "Unfixed risks are justified and preventive engineering practices are discussed with lessons from the audit.", "Sections 7-8"),
    ("Individual contribution", "Member names, index numbers, workstreams and GitHub branch/Insights evidence are included.", "Section 9 and Figures 1-3"),
]
for row_data in rows:
    cells = rubric.add_row().cells
    for cell, text in zip(cells, row_data):
        cell.text = text
        cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
        for paragraph in cell.paragraphs:
            paragraph.paragraph_format.space_after = Pt(2)
            for run in paragraph.runs:
                run.font.size = Pt(8.5)

# Intentional widths keep the evidence column readable without forcing tiny text.
for row in rubric.rows:
    row.cells[0].width = Inches(1.65)
    row.cells[1].width = Inches(3.95)
    row.cells[2].width = Inches(0.9)
    set_row_cant_split(row)
set_table_text_font(rubric, size=8.5)
for index, row in enumerate(rubric.rows[1:], start=1):
    if index % 2 == 0:
        for cell in row.cells:
            set_cell_shading(cell, "F3F6F9")

doc.save(str(OUTPUT))
print(OUTPUT)
