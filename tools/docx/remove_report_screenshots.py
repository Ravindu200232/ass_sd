"""Remove the optional screenshot evidence section from the report."""

from pathlib import Path

from docx import Document
from docx.oxml.ns import qn
from docx.text.paragraph import Paragraph


ROOT = Path(r"D:\ass_sd")
REPORT = ROOT / "SE4030_SSD_Report_Updated.docx"
START_TITLES = {"POS system screenshots", "Member evidence snapshots"}
END_TITLE = "2.1 Threat model"


def direct_paragraph_text(child, document):
    if child.tag != qn("w:p"):
        return ""
    return Paragraph(child, document).text.strip()


def main():
    document = Document(str(REPORT))
    children = list(document.element.body.iterchildren())
    start_index = next(
        (index for index, child in enumerate(children) if direct_paragraph_text(child, document) in START_TITLES),
        None,
    )
    end_index = next(
        (index for index, child in enumerate(children) if direct_paragraph_text(child, document) == END_TITLE),
        None,
    )

    if start_index is None or end_index is None or start_index >= end_index:
        print("No optional screenshot section found; report unchanged.")
        return

    for child in children[start_index:end_index]:
        document.element.body.remove(child)

    document.save(str(REPORT))
    print(f"Removed optional screenshot section from {REPORT}")


if __name__ == "__main__":
    main()
