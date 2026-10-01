# -*- coding: utf-8 -*-
"""Exécute le scénario de démonstration dans un vrai navigateur et vérifie clics et calculs.
Prérequis facultatifs : pip install playwright && python -m playwright install chromium
Usage : python3 tests/e2e_scenario.py [dossier_captures]
Les captures produites montrent NOTRE prototype, pas le prototype de référence."""
import sys, os, pathlib
from playwright.sync_api import sync_playwright

ICI = pathlib.Path(__file__).resolve().parent.parent
URL = (ICI / "index.html").as_uri()
SORTIE = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ICI / "tests" / "captures"
SORTIE.mkdir(parents=True, exist_ok=True)
verifs = []

def check(nom, cond):
    verifs.append((nom, bool(cond)))
    print(("  OK  " if cond else "  ÉCHEC ") + nom)

with sync_playwright() as p:
    try:
        nav = p.chromium.launch()
    except Exception:
        nav = p.chromium.launch(channel="msedge")  # repli : Microsoft Edge installé (Windows)
    page = nav.new_page(viewport={"width": 1400, "height": 1000}, accept_downloads=True)
    page.on("dialog", lambda d: d.accept())
    page.goto(URL)
    cap = lambda n: page.screenshot(path=str(SORTIE / f"{n}.png"), full_page=False)

    # 1. Profil (CU01)
    btn = page.locator("#btn-commencer")
    check("Bouton désactivé sans intérêt", btn.is_disabled() and "Choisissez au moins un intérêt" in btn.inner_text())
    cap("01_profil_sans_interet")
    for i in ["Logiciel", "Données et IA", "Gestion"]:
        page.locator(f'[data-action=interet][data-i="{i}"]').click()
    check("Premier intérêt principal", "principal" in page.locator('[data-i="Logiciel"]').inner_text())
    check("Bouton « Commencer la planification »", page.locator("#btn-commencer").inner_text() == "Commencer la planification")
    cap("02_profil_trois_interets")
    page.locator("#btn-commencer").click()
    cap("03_offres_classees")
    check("Première carte liée à l'intérêt principal", "intérêt principal" in page.locator(".offre").first.inner_text())

    # 2. Impact IFT1025 puis dépôt (CU03 inclus dans CU04)
    page.locator('[data-action=impact][data-id=ift1025]').click()
    txt = page.locator("#dlg-impact").inner_text()
    check("Impact IFT1025 affiché avant dépôt (0 → 3 crédits)", "Impact avant décision" in txt and "12 crédits ou plus" in txt)
    cap("04_impact_ift1025_avant_depot")
    page.locator("#btn-deposer").click()
    # 3. Projet Lavoie
    page.locator('[data-action=impact][data-id=p-logiciel]').click()
    check("Destinataire du projet : Prof. Lavoie (simulé)", "Prof. Lavoie" in page.locator("#dlg-impact").inner_text())
    cap("05_impact_projet_lavoie")
    page.locator("#btn-deposer").click()
    check("Autre projet bloqué, raison affichée", "Aucune case libre" in page.locator('[data-offre=p-ia]').inner_text())
    # 4. Atteindre 12 puis tester 18/30
    page.locator('[data-action=impact][data-id=ift2255]').click(); page.locator("#btn-deposer").click()
    plan = page.locator("#plan").inner_text()
    check("12 crédits engagés, 22 h", "12\ncrédits si tout aboutit" in plan and "22 / 30 h" in plan)
    page.locator('[data-action=impact][data-id=ift1015]').click(); page.locator("#btn-deposer").click()
    page.locator('#plan [data-action=ajouter-case][data-type=cours]').click()
    page.locator('[data-action=impact][data-id=stt1700]').click()
    check("Avertissement de charge avant dépôt (34 h > 30)", "Je comprends que cette demande dépasse" in page.locator("#dlg-impact").inner_text())
    cap("06_avertissement_charge_avant_depot")
    page.locator("#dlg-impact [data-action=fermer-dlg]").click()
    cap("07_plan_semaine1")

    # 5. Semaine 2 : réponses simulées
    page.locator("#btn-avancer").click()
    plan = page.locator("#plan").inner_text()
    check("Cours confirmés au pas suivant (9 crédits confirmés)", "9 / 18" in plan)
    page.locator('[data-onglet=responsable]').first.click()
    page.locator('[data-action=repondre][data-dec=refuser]').first.click()
    check("Refus sans motif empêché", page.locator("[data-action=repondre]").count() >= 1)
    cap("08_vue_responsable_simulee")
    page.locator('[data-action=repondre][data-dec=offrir]').first.click()
    page.locator('[data-onglet=demandes]').first.click()
    check("État « Offerte » visible", "Offerte" in page.locator("#vue").inner_text())
    page.locator('[data-action=accepter]').first.click()
    check("Projet confirmé après acceptation (15 crédits)", "15 / 18" in page.locator("#plan").inner_text())
    cap("09_demandes_historique_sources")

    # 6. Intention hiver (CU06)
    page.locator('[data-onglet=sessions]').first.click()
    page.select_option("#sel-H27", "ift3395")
    page.locator('[data-action=ajouter-intention][data-s=H27]').click()
    check("Intention marquée « aucune place réservée »", "aucune place réservée" in page.locator("#vue").inner_text())
    check("Crédits de session inchangés par l'intention", "15 / 18" in page.locator("#plan").inner_text())
    cap("10_intention_hiver_non_reservee")

    # 7. Semaine 3 : échéance et offre complète
    page.locator("#btn-avancer").click()
    check("Alerte d'échéance du 16 sept.", "16 sept." in page.locator("#alertes").inner_text())
    page.locator('[data-onglet=echeances]').first.click()
    cap("11_echeances_alerte")
    page.locator('[data-onglet=offres]').first.click()
    page.locator('[data-action=filtre][data-filtre=Laboratoire]').click()
    check("Laboratoire Kessel complet, raison affichée", "Complet" in page.locator('[data-offre=lab-kessel]').inner_text())
    cap("12_offre_complete_raison")

    # 8. Retrait expliqué avant décision (A2.3 ; E8, E9)
    page.locator('[data-onglet=demandes]').first.click()
    page.locator('[data-action=retirer]').first.click()
    dlg = page.locator("#dlg-impact").inner_text()
    check("Retrait : conséquences affichées avant la décision", "Après retrait" in dlg and "Règle de date" in dlg and "Confirmer le retrait" in dlg)
    cap("12b_retrait_consequences")
    page.locator("#dlg-impact [data-action=fermer-dlg]").click()
    check("Annulation du retrait : activité toujours confirmée", "15 / 18" in page.locator("#plan").inner_text())

    # 9. Bilan (E14)
    page.locator('[data-onglet=bilan]').first.click()
    check("Bilan : satisfait / incomplet / incertain", "Bilan de la période" in page.locator("#vue").inner_text() and "incertain" in page.locator("#vue").inner_text())
    cap("12c_bilan")

    # 10. Export (CU10)
    page.locator('[data-onglet=export]').first.click()
    with page.expect_download() as dl:
        page.locator('[data-action=export-html]').click()
    dl.value.save_as(str(SORTIE / "exemple_export_prototype.html"))
    check("Export HTML produit", (SORTIE / "exemple_export_prototype.html").stat().st_size > 1000)
    cap("13_export")
    nav.close()

echecs = [n for n, c in verifs if not c]
print(f"\n{len(verifs) - len(echecs)} / {len(verifs)} vérifications réussies")
sys.exit(1 if echecs else 0)
