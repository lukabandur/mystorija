# -*- coding: utf-8 -*-
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Table, TableStyle, Flowable
)
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT

os.makedirs("marketing", exist_ok=True)

# Brand colors
ORANGE = HexColor("#C4622D")
CREAM  = HexColor("#F8F5F0")
DARK   = HexColor("#1A1A1A")
MUTED  = HexColor("#7A756E")
BORDER = HexColor("#E5DED4")
WHITE  = HexColor("#FFFFFF")
ACCENTBG = HexColor("#FFF0E8")

# Fonts (Georgia for headings ~ Playfair, Helvetica for body ~ DM Sans)
pdfmetrics.registerFont(TTFont("Georgia", "C:/Windows/Fonts/georgia.ttf"))
pdfmetrics.registerFont(TTFont("Georgia-Bold", "C:/Windows/Fonts/georgiab.ttf"))

PAGE_W, PAGE_H = A4

styles = {
    "logo": ParagraphStyle("logo", fontName="Georgia-Bold", fontSize=30, leading=34,
                           textColor=DARK, alignment=TA_CENTER),
    "tagline": ParagraphStyle("tagline", fontName="Helvetica", fontSize=11, leading=15,
                              textColor=MUTED, alignment=TA_CENTER, spaceBefore=4),
    "section": ParagraphStyle("section", fontName="Helvetica-Bold", fontSize=10.5, leading=14,
                              textColor=ORANGE, spaceBefore=6, spaceAfter=8,
                              tracking=1),
    "feat_title": ParagraphStyle("feat_title", fontName="Helvetica-Bold", fontSize=11.5, leading=15,
                                 textColor=DARK),
    "feat_desc": ParagraphStyle("feat_desc", fontName="Helvetica", fontSize=9.5, leading=13,
                                textColor=MUTED),
    "price_name": ParagraphStyle("price_name", fontName="Georgia-Bold", fontSize=14, leading=16,
                                 textColor=DARK, alignment=TA_CENTER),
    "price_amt": ParagraphStyle("price_amt", fontName="Helvetica-Bold", fontSize=13, leading=16,
                                textColor=ORANGE, alignment=TA_CENTER, spaceBefore=2, spaceAfter=4),
    "price_feat": ParagraphStyle("price_feat", fontName="Helvetica", fontSize=8.8, leading=13,
                                 textColor=DARK, alignment=TA_CENTER),
    "foot": ParagraphStyle("foot", fontName="Helvetica", fontSize=9, leading=12,
                           textColor=MUTED, alignment=TA_CENTER),
}


class HRule(Flowable):
    def __init__(self, width, color=BORDER, thickness=1, space=6):
        super().__init__()
        self.width = width; self.color = color; self.thickness = thickness; self.space = space
    def wrap(self, aw, ah): return (self.width, self.space*2)
    def draw(self):
        self.canv.setStrokeColor(self.color)
        self.canv.setLineWidth(self.thickness)
        self.canv.line(0, self.space, self.width, self.space)


def feature_row(title, desc, content_w):
    """A colored square bullet + title/desc block."""
    sq = Table([[""]], colWidths=[7], rowHeights=[7])
    sq.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), ORANGE),
        ("ROUNDEDCORNERS", [2,2,2,2]),
        ("VALIGN", (0,0), (-1,-1), "TOP"),
    ]))
    txt = [Paragraph(title, styles["feat_title"]), Paragraph(desc, styles["feat_desc"])]
    row = Table([[sq, txt]], colWidths=[16, content_w-16])
    row.setStyle(TableStyle([
        ("VALIGN", (0,0), (-1,-1), "TOP"),
        ("TOPPADDING", (0,0), (0,0), 3),
        ("LEFTPADDING", (0,0), (-1,-1), 0),
        ("RIGHTPADDING", (0,0), (-1,-1), 0),
        ("BOTTOMPADDING", (0,0), (-1,-1), 7),
    ]))
    return row


def price_card(name, amount, feats, featured=False):
    inner = [Paragraph(name, styles["price_name"]),
             Paragraph(amount, styles["price_amt"])]
    for f in feats:
        inner.append(Paragraph(f, styles["price_feat"]))
    t = Table([[inner]], colWidths=[150])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), WHITE if not featured else ACCENTBG),
        ("BOX", (0,0), (-1,-1), 1.4 if featured else 0.8, ORANGE if featured else BORDER),
        ("ROUNDEDCORNERS", [10,10,10,10]),
        ("TOPPADDING", (0,0), (-1,-1), 14),
        ("BOTTOMPADDING", (0,0), (-1,-1), 14),
        ("LEFTPADDING", (0,0), (-1,-1), 10),
        ("RIGHTPADDING", (0,0), (-1,-1), 10),
        ("VALIGN", (0,0), (-1,-1), "TOP"),
    ]))
    return t


def on_page(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(CREAM)
    canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    # top accent bar
    canvas.setFillColor(ORANGE)
    canvas.rect(0, PAGE_H-6, PAGE_W, 6, fill=1, stroke=0)
    # footer
    canvas.setFont("Helvetica", 9)
    canvas.setFillColor(MUTED)
    canvas.drawCentredString(PAGE_W/2, 24,
        "mystorija.com   •   Jetzt im App Store   •   KI-Renovierung für dein Zuhause")
    canvas.restoreState()


MARGIN = 46
frame = Frame(MARGIN, 40, PAGE_W-2*MARGIN, PAGE_H-40-40, id="main",
              leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
doc = BaseDocTemplate("marketing/Mystorija-Feature-Sheet.pdf", pagesize=A4,
                      pageTemplates=[PageTemplate(id="t", frames=[frame], onPage=on_page)])

CW = PAGE_W - 2*MARGIN
story = []
story.append(Spacer(1, 10))
story.append(Paragraph('My<font color="#C4622D">storija</font>', styles["logo"]))
story.append(Paragraph("KI-Renovierung &amp; Design-Inspiration für dein Zuhause", styles["tagline"]))
story.append(Spacer(1, 14))
story.append(HRule(CW))
story.append(Spacer(1, 6))

story.append(Paragraph("FUNKTIONEN", styles["section"]))

features = [
    ("KI-Makeover",
     "Foto deines Raums hochladen, Wunsch beschreiben – die KI zeigt dir den renovierten Raum in ca. 20 Sekunden. Inklusive Materialliste und direkten Einkaufslinks."),
    ("Inspo-Analyse",
     "Screenshot von Pinterest, Instagram oder aus einer Zeitschrift hochladen – die KI erkennt sofort Materialien, Farben, Stil und die ungefähren Kosten."),
    ("KI-Chat-Berater",
     "Stell jede Renovierungsfrage und bekomme konkrete Antworten mit Produktnamen, Preisen und Schritt-für-Schritt-Erklärungen."),
    ("100+ Ideen &amp; Trends 2026",
     "Kuratierte Ideen für Bad, Küche, Wohnzimmer, Schlafzimmer und Terrasse – jeweils mit Budget-Angabe und passenden Shop-Links."),
    ("25 DIY-Anleitungen",
     "Schritt-für-Schritt-Guides mit Werkzeugliste, Schwierigkeitsgrad, Zeitaufwand, Kosten und Profi-Tipps – inkl. Warnungen wann ein Fachmann nötig ist."),
    ("Projekt-Planer",
     "Plane ganze Projekte mit Phasen, Aufgaben und Fortschritts-Tracking. Automatische Einkaufsliste für alle benötigten Materialien."),
    ("Shop-Integration",
     "Direktlinks zu Amazon, OBI, Bauhaus und Hornbach – vom Vorschlag direkt zum Kauf."),
]
for t, d in features:
    story.append(feature_row(t, d, CW))

story.append(Spacer(1, 2))
story.append(HRule(CW))
story.append(Spacer(1, 4))
story.append(Paragraph("PREISE", styles["section"]))

cards = [
    price_card("Kostenlos", "0 €",
               ["100+ Ideen &amp; Trends", "25 DIY-Anleitungen", "KI-Chat-Berater", "Projekt-Planer"]),
    price_card("Basic", "9,99 € / Monat",
               ["20 KI-Makeovers / Monat", "20 Inspo-Analysen / Monat", "Alle Gratis-Funktionen", "Materialien &amp; Shop-Links"], featured=True),
    price_card("Pro", "19,99 € / Monat",
               ["Unbegrenzte Makeovers", "Unbegrenzte Inspo-Analysen", "Beste Bildqualität", "Priorität bei Generierung"]),
]
price_table = Table([cards], colWidths=[CW/3.0]*3)
price_table.setStyle(TableStyle([
    ("VALIGN", (0,0), (-1,-1), "TOP"),
    ("LEFTPADDING", (0,0), (-1,-1), 5),
    ("RIGHTPADDING", (0,0), (-1,-1), 5),
]))
story.append(price_table)
story.append(Spacer(1, 10))
story.append(Paragraph(
    "Jederzeit kündbar · Zahlung sicher über Stripe · Verfügbar als iOS-App und Web-App · Deutsch &amp; Englisch",
    styles["foot"]))

doc.build(story)
print("PDF erstellt: marketing/Mystorija-Feature-Sheet.pdf")
