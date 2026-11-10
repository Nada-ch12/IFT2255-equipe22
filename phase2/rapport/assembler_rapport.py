"""Assemble le rapport de la phase 2 (IFT2255, équipe 22) en un fichier Word.

Utilisation (depuis n'importe quel dossier) :
    python phase2/rapport/assembler_rapport.py

Le script lit les fichiers Markdown de phase2/ dans l'ordre de SECTIONS,
insère les figures de phase2/diagrammes/ et écrit
phase2/rapport/IFT2255_Phase2_Equipe22.docx.
Relancez-le après chaque modification d'une partie.
Pour le PDF : ouvrir le .docx dans Word, mettre à jour la table des matières
(clic droit > Mettre à jour les champs), puis Enregistrer sous > PDF,
ou lancer exporter_pdf.ps1 (Windows + Word).
"""
import re
from pathlib import Path

from docx import Document
from docx.enum.section import WD_ORIENT, WD_SECTION
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor
from PIL import Image

ICI = Path(__file__).resolve().parent
PHASE2 = ICI.parent
DIAG = PHASE2 / "diagrammes"
SORTIE = ICI / "IFT2255_Phase2_Equipe22.docx"

SECTIONS = [
    ICI / "01_Introduction.md",
    PHASE2 / "Revisions_Phase1.md",
    PHASE2 / "B1_C4_Niveau3.md",
    PHASE2 / "B2_Diagramme_Classes.md",
    PHASE2 / "B3_Specifications_Tests.md",
    PHASE2 / "B4_Modele_Donnees.md",
    ICI / "07_Defense_des_choix.md",
    ICI / "08_Declaration_IA.md",
    ICI / "09_Repartition.md",
]

# Figures envoyées en annexe plutôt qu'insérées dans le texte.
EN_ANNEXE = {"B2-Classes_Annexe.png"}

LEGENDES = {
    "Etats_Demande.png": "Modèle d'états d'une demande (unique pour tous les artefacts)",
    "A2-1_revise.png": "A2.1 révisé : ajouter une activité après vérification des contraintes",
    "A2-2_revise.png": "A2.2 révisé : demander une place et répondre à une offre",
    "A3-C4-Niveau1_revise.png": "A3 révisé : C4 niveau 1, contexte",
    "A3-C4-Niveau2_revise.png": "A3 révisé : C4 niveau 2, conteneurs",
    "B1-C4-Niveau3.png": "B1 : C4 niveau 3, composants de l'API REST et des connecteurs d'import",
    "B2-Modele_Domaine.png": "B2 : modèle du domaine",
    "B2-Classes_Principal.png": "B2 : diagramme de classes, vue principale (15 classes)",
    "B2-Classes_Annexe.png": "B2 : classes complémentaires, rangées par composant de B1",
    "B4-Parcours_Donnees.png": "B4 : parcours de deux données, de la source à l'affichage",
}

# Nettoyage des mentions de travail qui ne doivent pas apparaître dans le rapport.
NETTOYAGES = [
    (re.compile(r"\s*\(BROUILLON[^)]*\)"), ""),
    (re.compile(r"\s*\(section « défense des choix », 15 %\)"), ""),
    (re.compile(r"\s*\(au moins \d+\)"), ""),
]
TITRES_IGNORES = re.compile(r"^#+\s*(\d+\.\s*)?À (vérifier|faire)", re.I)

RE_IMAGE = re.compile(r"`?diagrammes/([A-Za-z0-9_\-]+\.png)`?")
RE_INLINE = re.compile(r"(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|`[^`]+`)")

PLEINE_LARGEUR_PORTRAIT = 16.5   # cm
PLEINE_LARGEUR_PAYSAGE = 24.0    # cm
HAUTEUR_MAX_PORTRAIT = 21.0      # cm
HAUTEUR_MAX_PAYSAGE = 14.0       # cm


class Assembleur:
    def __init__(self):
        self.doc = Document()
        self.num_figure = 0
        self.num_section = 0
        self.annexe = []
        self._styles()

    # ---------- mise en forme générale ----------
    def _styles(self):
        sec = self.doc.sections[0]
        sec.page_width, sec.page_height = Cm(21.59), Cm(27.94)
        for cote in ("left_margin", "right_margin", "top_margin", "bottom_margin"):
            setattr(sec, cote, Cm(2.5))
        normal = self.doc.styles["Normal"]
        normal.font.name = "Calibri"
        normal.font.size = Pt(11)
        normal.element.rPr.rFonts.set(qn("w:eastAsia"), "Calibri")
        normal.paragraph_format.space_after = Pt(6)
        for niveau, taille in ((1, 18), (2, 14), (3, 12)):
            st = self.doc.styles[f"Heading {niveau}"]
            st.font.name = "Calibri"
            st.font.size = Pt(taille)
            st.font.color.rgb = RGBColor(0x1F, 0x3A, 0x5F)
        pied = sec.footer.paragraphs[0]
        pied.alignment = WD_ALIGN_PARAGRAPH.CENTER
        self._champ(pied, "PAGE")

    def _champ(self, paragraphe, code):
        run = paragraphe.add_run()
        for type_, texte in (("begin", None), (None, code), ("end", None)):
            if type_:
                el = OxmlElement("w:fldChar")
                el.set(qn("w:fldCharType"), type_)
            else:
                el = OxmlElement("w:instrText")
                el.set(qn("xml:space"), "preserve")
                el.text = texte
            run._r.append(el)

    # ---------- page titre et table des matières ----------
    def page_titre(self):
        d = self.doc
        for _ in range(6):
            d.add_paragraph()
        for texte, taille, gras in (
            ("IFT2255 — Génie logiciel (A26)", 14, False),
            ("Projet — Phase 2", 26, True),
            ("Conception de la plateforme de planification des études", 16, False),
        ):
            p = d.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            r = p.add_run(texte)
            r.font.size, r.bold = Pt(taille), gras
        d.add_paragraph()
        p = d.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.add_run("Équipe 22").bold = True
        for membre in ("Nada Chiki (20261599)", "Ismail Mohib (20274803)",
                       "Hamza Khalil (20259237)", "Mohamed Driss (20205703)"):
            p = d.add_paragraph(membre)
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_after = Pt(0)
        d.add_paragraph()
        for texte in ("Enseignant : Louis-Edouard Lafontant",
                      "Remis le 14 novembre 2026",
                      "Dépôt : https://github.com/Nada-ch12/IFT2255-equipe22"):
            p = d.add_paragraph(texte)
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        d.add_page_break()
        d.add_heading("Table des matières", level=1)
        p = d.add_paragraph()
        self._champ(p, 'TOC \\o "1-2" \\h \\z \\u')
        d.add_paragraph("(Dans Word : clic droit sur la table, puis « Mettre à jour les champs ».)").runs[0].italic = True

    # ---------- texte en ligne ----------
    def _runs(self, paragraphe, texte, gras=False, italique=False, taille=None):
        for morceau in RE_INLINE.split(texte):
            if not morceau:
                continue
            g, i, code = gras, italique, False
            if morceau.startswith("**") and morceau.endswith("**"):
                morceau, g = morceau[2:-2], True
            elif morceau.startswith("`") and morceau.endswith("`"):
                morceau, code = morceau[1:-1], True
            elif morceau.startswith("*") and morceau.endswith("*") and len(morceau) > 2:
                morceau, i = morceau[1:-1], True
            r = paragraphe.add_run(morceau)
            r.bold, r.italic = g, i
            if code:
                r.font.name = "Consolas"
                r.font.size = Pt(9.5)
            elif taille:
                r.font.size = Pt(taille)

    # ---------- figures ----------
    def figure(self, nom, legende=None):
        chemin = DIAG / nom
        if not chemin.exists():
            p = self.doc.add_paragraph(f"[Figure manquante : {nom}]")
            p.runs[0].bold = True
            return
        if nom in EN_ANNEXE:
            self.annexe.append(nom)
            return
        self._inserer_image(chemin, legende or LEGENDES.get(nom, nom))

    def _inserer_image(self, chemin, legende, retour=True):
        largeur_px, hauteur_px = Image.open(chemin).size
        ratio = largeur_px / hauteur_px
        paysage = ratio > 1.4 and largeur_px > 1800
        if paysage:
            self._orientation(paysage=True)
            larg = min(PLEINE_LARGEUR_PAYSAGE, HAUTEUR_MAX_PAYSAGE * ratio)
        else:
            larg = min(PLEINE_LARGEUR_PORTRAIT, HAUTEUR_MAX_PORTRAIT * ratio)
        self.num_figure += 1
        p = self.doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.add_run().add_picture(str(chemin), width=Cm(larg))
        c = self.doc.add_paragraph()
        c.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = c.add_run(f"Figure {self.num_figure} — {legende}")
        r.italic, r.font.size = True, Pt(9.5)
        if paysage and retour:
            self._orientation(paysage=False)

    def _orientation(self, paysage):
        # Un titre ne doit pas rester seul en bas de page avant un changement
        # d'orientation : on le déplace dans la nouvelle section.
        titre = None
        corps = self.doc.element.body
        dernier = self.doc.paragraphs[-1] if self.doc.paragraphs else None
        if (paysage and dernier is not None and dernier.style.name.startswith("Heading")
                and dernier._p is corps[-2]):
            titre = (dernier.text, int(dernier.style.name.split()[-1]))
            corps.remove(dernier._p)
        sec = self.doc.add_section(WD_SECTION.NEW_PAGE)
        sec.orientation = WD_ORIENT.LANDSCAPE if paysage else WD_ORIENT.PORTRAIT
        petit, grand = Cm(21.59), Cm(27.94)
        sec.page_width, sec.page_height = (grand, petit) if paysage else (petit, grand)
        if titre:
            self.doc.add_heading(*titre)

    # ---------- tableaux ----------
    def tableau(self, lignes):
        rangees = []
        for ligne in lignes:
            cellules = [c.strip() for c in ligne.strip().strip("|").split("|")]
            if all(re.fullmatch(r":?-{2,}:?", c) for c in cellules if c):
                continue
            rangees.append(cellules)
        if not rangees:
            return
        ncol = max(len(r) for r in rangees)
        t = self.doc.add_table(rows=len(rangees), cols=ncol)
        t.style = "Table Grid"
        t.alignment = WD_TABLE_ALIGNMENT.CENTER
        for i, rangee in enumerate(rangees):
            for j in range(ncol):
                cellule = t.cell(i, j)
                cellule.paragraphs[0].paragraph_format.space_after = Pt(0)
                self._runs(cellule.paragraphs[0], rangee[j] if j < len(rangee) else "",
                           gras=(i == 0), taille=9)
                if i == 0:
                    ombre = OxmlElement("w:shd")
                    ombre.set(qn("w:val"), "clear")
                    ombre.set(qn("w:fill"), "DCE6F2")
                    cellule._tc.get_or_add_tcPr().append(ombre)
        self.doc.add_paragraph()

    # ---------- lecture d'un fichier Markdown ----------
    def fichier(self, chemin, decalage=0, sauter_titre=False):
        texte = chemin.read_text(encoding="utf-8")
        for motif, remplacement in NETTOYAGES:
            texte = motif.sub(remplacement, texte)
        lignes = texte.splitlines()
        i, ignorer_jusqua = 0, None
        premier_titre = True
        while i < len(lignes):
            ligne = lignes[i]
            brut = ligne.strip()

            if brut.startswith("#"):
                niveau = len(brut) - len(brut.lstrip("#"))
                if ignorer_jusqua is not None and niveau <= ignorer_jusqua:
                    ignorer_jusqua = None
                if TITRES_IGNORES.match(brut):
                    ignorer_jusqua = niveau
                    i += 1
                    continue
            if ignorer_jusqua is not None:
                i += 1
                continue

            m = re.match(r"<!--\s*INCLURE\s+(\S+)\s*-->", brut)
            if m:
                self.fichier(PHASE2 / m.group(1), decalage=1, sauter_titre=True)
                i += 1
                continue
            if not brut or brut == "---" or brut.startswith("<!--"):
                i += 1
                continue
            if brut.startswith("> ⚠"):
                i += 1
                continue

            if brut.startswith("```"):
                bloc = []
                i += 1
                while i < len(lignes) and not lignes[i].strip().startswith("```"):
                    bloc.append(lignes[i])
                    i += 1
                p = self.doc.add_paragraph()
                r = p.add_run("\n".join(bloc))
                r.font.name, r.font.size = "Consolas", Pt(9)
                i += 1
                continue

            if brut.startswith("#"):
                niveau = len(brut) - len(brut.lstrip("#"))
                titre = brut.lstrip("#").strip()
                if premier_titre and sauter_titre:
                    premier_titre = False
                    i += 1
                    continue
                premier_titre = False
                niveau_final = min(niveau + decalage, 3)
                if niveau_final == 1:
                    self.num_section += 1
                    titre = f"{self.num_section}. {titre}"
                self.doc.add_heading(titre, level=niveau_final)
                i += 1
                continue

            if brut.startswith("|"):
                bloc = []
                while i < len(lignes) and lignes[i].strip().startswith("|"):
                    bloc.append(lignes[i])
                    i += 1
                self.tableau(bloc)
                continue

            images = RE_IMAGE.findall(brut)
            if re.match(r"^Figures?\s*:", brut) and images:
                legende = None
                if len(images) == 1:
                    reste = RE_IMAGE.sub("", brut.split(":", 1)[1]).strip(" ,.")
                    legende = reste[:1].upper() + reste[1:] if reste else None
                for nom in images:
                    self.figure(nom, legende)
                i += 1
                continue

            puce = re.match(r"^(\s*)([-*]|\d+\.)\s+(.*)", ligne)
            if puce:
                indent, marque, contenu = puce.groups()
                style = "List Number" if marque[0].isdigit() else "List Bullet"
                if len(indent) >= 2:
                    style += " 2"
                p = self.doc.add_paragraph(style=style)
                self._runs(p, self._sans_chemins(contenu))
                for nom in images:
                    self.figure(nom)
                i += 1
                continue

            if brut.startswith(">"):
                p = self.doc.add_paragraph()
                p.paragraph_format.left_indent = Cm(0.8)
                self._runs(p, brut.lstrip("> ").strip(), italique=True)
                i += 1
                continue

            # paragraphe : regrouper les lignes consécutives
            bloc = [brut]
            i += 1
            while i < len(lignes):
                suivante = lignes[i].strip()
                if (not suivante or suivante[0] in "#|>`" or suivante == "---"
                        or re.match(r"^([-*]|\d+\.)\s+", suivante) or suivante.startswith("<!--")):
                    break
                bloc.append(suivante)
                i += 1
            texte_p = " ".join(bloc)
            p = self.doc.add_paragraph()
            self._runs(p, self._sans_chemins(texte_p))
            for nom in RE_IMAGE.findall(texte_p):
                self.figure(nom)

    def _sans_chemins(self, texte):
        # Une puce qui commence par un chemin d'image : on retire le chemin.
        m = re.match(r"^`?diagrammes/([A-Za-z0-9_\-]+\.png)`?\s*[,:]?\s*(.*)$", texte)
        if m:
            reste = m.group(2)
            reste = reste[:1].upper() + reste[1:]
            if m.group(1) in EN_ANNEXE:
                reste = reste.rstrip(" .;") + " (voir l'annexe)."
            return reste
        def remplacer(m):
            return "(voir l'annexe)" if m.group(1) in EN_ANNEXE else "(figure ci-dessous)"
        return RE_IMAGE.sub(remplacer, texte)

    # ---------- assemblage ----------
    def assembler(self):
        self.page_titre()
        for chemin in SECTIONS:
            self.doc.add_page_break()
            self.fichier(chemin)
        if self.annexe:
            self.doc.add_page_break()
            self.num_section += 1
            self.doc.add_heading(f"{self.num_section}. Annexe", level=1)
            for k, nom in enumerate(self.annexe):
                dernier = k == len(self.annexe) - 1
                self._inserer_image(DIAG / nom, LEGENDES.get(nom, nom), retour=not dernier)
        self.doc.save(SORTIE)
        return SORTIE


if __name__ == "__main__":
    sortie = Assembleur().assembler()
    print(f"Rapport écrit : {sortie}")
