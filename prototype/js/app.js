/* Interface du prototype. Toute la logique métier est dans rules.js. */
(function () {
  var R = window.Rules, D = window.DEMO_DATA;
  var CLE = "cheminement-demo-v1";
  var state = charger() || R.etatInitial();
  var ui = { onglet: "offres", filtre: "Tout", brouillonProfil: null, impactOffre: null };

  function charger() { try { var s = localStorage.getItem(CLE); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
  function sauver() { try { localStorage.setItem(CLE, JSON.stringify(state)); } catch (e) { /* hors ligne sans stockage : état en mémoire */ } }
  function $(sel) { return document.querySelector(sel); }
  function h(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function toast(msg) { var t = $("#toast"); t.textContent = msg; t.classList.add("visible"); clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove("visible"); }, 3200); }
  function etat(code) { return '<span class="etat ' + code + '">' + h(R.LIBELLES_ETAT[code] || (code === "intention" ? "Intention — aucune place réservée" : code === "a-reevaluer" ? "À réévaluer" : code)) + "</span>"; }

  /* ---------- Horloge et alertes ---------- */
  function renderHorloge() {
    var phase = state.semaine <= 2 ? "exploration" : state.semaine <= 10 ? "choix et suivi" : "fin de session";
    $("#horloge").innerHTML = 'Automne 2026 · <span class="sem">Semaine ' + state.semaine + " / " + D.NB_SEMAINES + "</span> · lundi " +
      h(R.fmtDate(R.aujourdHui(state))) + ' <span class="note">(date simulée, phase ' + phase + ")</span>";
    $("#btn-avancer").disabled = state.semaine >= D.NB_SEMAINES || !state.profil;
    var al = R.alertes(state);
    $("#alertes").innerHTML = al.map(function (e) {
      var s = R.statutEcheance(state, e);
      return "<div><strong>Échéance proche :</strong> " + h(e.libelle) + " — " + h(R.fmtDate(e.date)) + " (" + h(s.libelle) + "). " +
        '<button class="lien" data-action="onglet" data-onglet="echeances">Voir les échéances</button></div>';
    }).join("");
  }

  /* ---------- Plan (colonne gauche) ---------- */
  function renderPlan() {
    if (!state.profil) { $("#plan").innerHTML = "<h2>Mon plan</h2><p class='note'>Configurez votre profil pour commencer.</p>"; return; }
    var conf = R.totaux(state, ["confirmee"]), eng = R.totaux(state, R.ETATS_ENGAGES), p = R.programme(state);
    var html = "<h2>Mon plan · Automne 2026</h2>";
    html += '<div class="chiffres">' +
      '<div class="chiffre"><b class="num">' + conf.credits + " / " + p.plafond + "</b><span>crédits confirmés</span></div>" +
      '<div class="chiffre"><b class="num">' + eng.credits + "</b><span>crédits si tout aboutit</span></div>" +
      '<div class="chiffre"><b class="num">' + eng.heures + " / " + state.profil.disponibilite + " h</b><span>charge engagée</span></div></div>";
    var cp = R.creditsParType(state);
    html += "<p class='note credits-types'><strong>Crédits du programme (E10)</strong> — acquis déclarés : " + cp.acquis + " · en cours : " + cp.enCours +
      " · planifiés (intentions, non réservés) : " + cp.planifies + " · <em>projection</em> : " + cp.projection + " / " + p.creditsTotal + "</p>";
    html += "<p class='note'>Intérêts : " + h(state.profil.interets.join(", ")) + " (principal : " + h(state.profil.interets[0]) + ") · " + h(p.nom) + "</p>";
    html += "<h3>Cases du plan</h3>";
    state.cases.forEach(function (c) {
      var d = R.demandeSurCase(state, c.id);
      if (d) {
        var o = R.offre(d.offreId);
        html += '<div class="case ' + d.etat + '"><div><span class="type">' + h(R.NOM_CASE[c.type]) + "</span>" + h(o.code) + " — " + h(o.titre) + "</div><div>" + etat(d.etat) + "</div></div>";
      } else {
        html += '<div class="case vide"><div><span class="type">' + h(R.NOM_CASE[c.type]) + "</span>Case libre</div>" +
          '<button class="lien" data-action="retirer-case" data-id="' + c.id + '" aria-label="Retirer cette case">retirer</button></div>';
      }
    });
    html += '<div class="filtres" style="margin-top:.4rem">' + ["cours", "projet", "activite"].map(function (t) {
      return '<button type="button" data-action="ajouter-case" data-type="' + t + '">+ ' + h(R.NOM_CASE[t]) + "</button>"; }).join("") + "</div>";
    html += "<p class='note'>Une case = une place visée. Pour candidater à plusieurs projets en parallèle, ajoutez une case par candidature.</p>";
    html += "<h3>Règles du programme (engagements en cours)</h3><ul class='regles'>" + R.regles(state, eng).map(function (r) {
      return "<li><span>" + h(r.libelle) + "</span><span class='v " + r.etat + "'>" + r.valeur + " / " + r.seuil + "</span></li>"; }).join("") + "</ul>";
    html += "<p class='note'>Source des seuils : " + h(p.source) + ".</p>";
    $("#plan").innerHTML = html;
  }

  /* ---------- Onglet Offres ---------- */
  function carteOffre(sug) {
    var o = sug.offre, pl = state.places[o.id] || 0, pd = R.peutDemander(state, o);
    var bouton = o.mode === "libre" ? (o.type === "Cours" ? "Voir l'impact et demander" : "Voir l'impact et s'inscrire") : "Voir l'impact et candidater";
    var html = '<article class="offre' + (pl <= 0 ? " complet" : "") + '" data-offre="' + o.id + '">';
    html += '<div class="meta">' + h(o.type) + " · " + h(o.unite) + (o.responsable ? " · " + h(o.responsable) : "") + "</div>";
    html += "<h3>" + h(o.code) + " — " + h(o.titre) + "</h3>";
    html += '<div class="chiffres-offre"><span>' + (pl > 0 ? pl + " place" + (pl > 1 ? "s" : "") : "<strong>Complet</strong>") + "</span><span>" + o.credits + " cr.</span><span>" + o.heures + " h/sem</span><span>" + (o.mode === "libre" ? "inscription" : "approbation d'un responsable") + "</span></div>";
    html += '<ul class="raisons">' + sug.raisons.map(function (r) { return "<li>" + h(r) + "</li>"; }).join("") + "</ul>";
    var pre = R.prealables(state, o);
    if (pre.statut !== "aucun") html += '<p class="prealables ' + pre.statut + '">' + h(pre.texte) + "</p>";
    if (pl <= 0) {
      var alt = R.alternatives(state, o);
      html += '<p class="alternatives"><strong>Alternatives (E13) :</strong> ' + (alt.offres.length ? alt.offres.map(function (x) { return h(x.code + " — " + x.titre); }).join(" ; ") : "aucune alternative disponible cette semaine") +
        ". Interlocuteur : " + h(alt.interlocuteur) + ".</p>";
    }
    html += '<div class="provenance">Provenance : ' + h(o.source) + " · places mises à jour semaine " + state.semaine + (o.ouvertureSemaine > 1 ? " · publiée en semaine " + o.ouvertureSemaine : "") + "</div>";
    html += '<div class="pied"><button type="button" data-action="impact" data-id="' + o.id + '"' + (pd.ok ? "" : " disabled") + ">" + bouton + "</button>";
    if (!pd.ok && pd.action) html += '<button type="button" class="discret" data-action="ajouter-case" data-type="' + pd.action + '">Ajouter une case</button>';
    if (!pd.ok && !pd.doublon) html += '<button type="button" class="discret" data-action="impact-seul" data-id="' + o.id + '">Voir l\'impact</button>';
    html += "</div>";
    if (!pd.ok) html += '<p class="raison-desactive">' + h(pd.raison) + "</p>";
    return html + "</article>";
  }
  function vueOffres() {
    var types = ["Tout", "Cours", "Projet", "Laboratoire", "Stage", "Séminaire", "Concours"];
    var liste = R.suggestions(state).filter(function (s) { return ui.filtre === "Tout" || s.offre.type === ui.filtre; });
    var html = "<h2>Offres de la session en cours</h2><p class='note'>Classées par pertinence ; chaque raison est affichée. Le bouton ouvre toujours l'impact <em>avant</em> la décision.</p>";
    html += '<div class="filtres" role="group" aria-label="Filtrer par type">' + types.map(function (t) {
      return '<button type="button" data-action="filtre" data-filtre="' + t + '" aria-pressed="' + (ui.filtre === t) + '">' + t + "</button>"; }).join("") + "</div>";
    html += liste.length ? '<div class="offres">' + liste.map(carteOffre).join("") + "</div>" : "<p>Aucune offre de ce type cette semaine. Essayez « Tout ».</p>";
    return html;
  }

  /* ---------- Dialogue d'impact (CU03 inclus dans CU04) ---------- */
  function ouvrirImpact(id, lectureSeule) {
    var o = R.offre(id), imp = R.impact(state, o), pd = R.peutDemander(state, o), dlg = $("#dlg-impact");
    var html = '<h2 id="impact-titre">Impact avant décision : ' + h(o.code) + " — " + h(o.titre) + "</h2>";
    html += "<p class='note'>Actuel = activités confirmées + demandes en cours. Projeté = actuel + cette offre. Aucune donnée n'est modifiée tant que vous ne déposez pas.</p>";
    html += '<div class="scroll"><table class="t"><thead><tr><th>Règle</th><th>Actuel</th><th>Projeté</th><th>État projeté</th></tr></thead><tbody>';
    imp.reglesApres.forEach(function (r, i) {
      var a = imp.reglesAvant[i], lib = { ok: "respectée", "a-completer": "à compléter", depasse: r.bloquant ? "dépassée — bloquant" : "dépassée — avertissement" }[r.etat];
      html += "<tr><td>" + h(r.libelle) + (r.note && r.etat !== "ok" ? "<br><span class='note'>" + h(r.note) + "</span>" : "") + "</td><td class='num'>" + a.valeur + "</td><td class='num'><strong>" + r.valeur + "</strong></td><td><span class='v " + r.etat + "'>" + lib + "</span></td></tr>";
    });
    html += "</tbody></table></div>";
    if (imp.prealables.statut !== "aucun") html += '<p class="prealables ' + imp.prealables.statut + '"><strong>Préalables (E3) :</strong> ' + h(imp.prealables.texte) + " <span class='note'>Source : " + h(o.sourcePrealables) + "</span></p>";
    if (imp.echeanceLiee) { var st = R.statutEcheance(state, imp.echeanceLiee); html += "<p><strong>Échéance liée :</strong> " + h(imp.echeanceLiee.libelle) + " — " + h(R.fmtDate(imp.echeanceLiee.date)) + " (" + h(st.libelle) + "). <span class='note'>Source : " + h(imp.echeanceLiee.source) + "</span></p>"; }
    html += "<p><strong>Destinataire de la demande :</strong> " + (o.mode === "libre" ? "Scolarité — système d'inscription (réponse simulée au pas de temps suivant)" : h(o.responsable || o.unite) + " — réponse dans la vue responsable (simulée) ; sans réponse, expiration après " + R.EXPIRATION_DEMANDE_SEMAINES + " semaines (règle de démonstration)") + ".</p>";
    if (imp.bloquants.length) html += '<p class="bloquant">Demande impossible : ' + imp.bloquants.map(function (r) { return h(r.libelle) + " (projeté " + r.valeur + ")"; }).join(" ; ") + ".</p>";
    else if (imp.avertissements.length && !lectureSeule) html += '<p class="averti"><label><input type="checkbox" id="chk-avert"> Je comprends que cette demande dépasse : ' + imp.avertissements.map(function (r) { return h(r.libelle); }).join(" ; ") + ", et je la dépose quand même.</label></p>";
    if (!pd.ok) html += '<p class="bloquant">' + h(pd.raison) + "</p>";
    html += '<div class="boutons"><button type="button" class="discret" data-action="fermer-dlg">Fermer</button>';
    if (!lectureSeule) html += '<button type="button" id="btn-deposer" data-action="deposer" data-id="' + o.id + '"' + (pd.ok && !imp.bloquants.length ? "" : " disabled") + ">Déposer la demande</button>";
    html += "</div>";
    dlg.innerHTML = html;
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
  }
  function fermerDlg() { var d = $("#dlg-impact"); if (d.close) d.close(); else d.removeAttribute("open"); }

  /* ---------- Dialogue de retrait (A2.3 ; E8, E9) ---------- */
  function ouvrirRetrait(id) {
    var c = R.consequencesRetrait(state, id); if (!c) return;
    var p = R.programme(state), dlg = $("#dlg-impact"), refuse = c.regle.mode === "refuse";
    var html = '<h2 id="impact-titre">Retirer ' + h(c.offre.code) + " — " + h(c.offre.titre) + " ?</h2>";
    html += "<p class='note'>Les conséquences sont calculées <em>avant</em> la décision. Rien n'est modifié tant que vous ne confirmez pas.</p>";
    html += '<p class="' + (refuse ? "bloquant" : "averti") + '"><strong>Règle de date :</strong> ' + h(c.regle.texte) + "</p>";
    html += '<div class="scroll"><table class="t"><thead><tr><th></th><th>Avant</th><th>Après retrait</th></tr></thead><tbody>' +
      "<tr><td>Crédits (engagés)</td><td class='num'>" + c.avant.credits + "</td><td class='num'><strong>" + c.apres.credits + "</strong></td></tr>" +
      "<tr><td>Charge (h/sem)</td><td class='num'>" + c.avant.heures + "</td><td class='num'><strong>" + c.apres.heures + "</strong></td></tr>" +
      "<tr><td>Seuil de temps plein (" + p.tempsPlein + " cr.)</td><td>" + (c.avant.credits >= p.tempsPlein ? "atteint" : "non atteint") + "</td><td><strong>" + (c.apres.credits >= p.tempsPlein ? "atteint" : "non atteint") + "</strong></td></tr>" +
      "</tbody></table></div>";
    if (c.alerteTempsPlein) html += '<p class="bloquant"><strong>Temps plein (E9) :</strong> ' + h(c.alerteTempsPlein) + "</p>";
    html += "<p><strong>Démarche :</strong> " + h(c.demarche) + "</p>";
    html += '<div class="boutons"><button type="button" class="discret" data-action="fermer-dlg">' + (refuse ? "Fermer" : "Annuler — garder l'activité") + "</button>";
    if (!refuse) html += '<button type="button" id="btn-confirmer-retrait" data-action="confirmer-retrait" data-id="' + id + '">Confirmer le retrait</button>';
    dlg.innerHTML = html + "</div>";
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
  }

  /* ---------- Mes demandes (CU05) ---------- */
  function vueDemandes() {
    if (!state.demandes.length) return "<h2>Mes demandes</h2><p>Aucune demande. Choisissez une offre dans l'onglet Offres.</p>";
    var rr = R.regleRetrait(state);
    var html = "<h2>Mes demandes et activités</h2><p class='note'>Chaque transition indique sa semaine et sa source. Règle de retrait actuelle : " + h(rr.texte) + "</p>";
    html += '<div class="scroll"><table class="t"><thead><tr><th>Activité</th><th>État</th><th>Destinataire</th><th>Historique (semaine · source · motif)</th><th>Actions</th></tr></thead><tbody>';
    state.demandes.slice().reverse().forEach(function (d) {
      var o = R.offre(d.offreId), actions = "";
      if (d.etat === "demandee") actions = '<button type="button" class="discret" data-action="annuler" data-id="' + d.id + '">Annuler</button> <span class="note">en attente depuis ' + (state.semaine - d.creeeSemaine) + " sem.</span>";
      if (d.etat === "offerte") actions = '<button type="button" data-action="accepter" data-id="' + d.id + '">Accepter l\'offre</button> <button type="button" class="discret" data-action="decliner" data-id="' + d.id + '">Décliner</button> <span class="note">à accepter avant la semaine ' + d.offreExpireSemaine + "</span>";
      if (d.etat === "confirmee") {
        var ap = state.appreciations[d.offreId] || 0;
        actions = '<button type="button" class="discret" data-action="retirer" data-id="' + d.id + '">Retirer</button> ' +
          '<button type="button" class="discret" data-action="apprecier" data-id="' + d.offreId + '" data-val="1" aria-pressed="' + (ap > 0) + '">Appréciation positive</button> ' +
          '<button type="button" class="discret" data-action="apprecier" data-id="' + d.offreId + '" data-val="-1" aria-pressed="' + (ap < 0) + '">Appréciation négative</button>' +
          (ap ? ' <button type="button" class="lien" data-action="apprecier" data-id="' + d.offreId + '" data-val="0">retirer l\'appréciation</button>' : "");
      }
      html += "<tr><td><strong>" + h(o.code) + "</strong> — " + h(o.titre) + "<br><span class='note'>" + o.credits + " cr. · " + o.heures + " h/sem</span></td><td>" + etat(d.etat) + "</td><td>" + h(d.destinataire) + "</td><td><ol style='margin:0;padding-left:1.1rem'>" +
        d.historique.map(function (x) { return "<li>" + etat(x.etat) + " sem. " + x.semaine + " · " + h(x.source) + (x.motif ? " · motif : <em>" + h(x.motif) + "</em>" : "") + "</li>"; }).join("") + "</ol></td><td>" + actions + "</td></tr>";
    });
    return html + "</tbody></table></div>";
  }

  /* ---------- Échéances (CU08) ---------- */
  function vueEcheances() {
    var liees = {};
    state.demandes.forEach(function (d) { if (R.ETATS_ENGAGES.indexOf(d.etat) >= 0) { var o = R.offre(d.offreId); var k = o.type === "Cours" ? "modif" : null; if (o.echeanceExterne) k = o.echeanceExterne; if (k) (liees[k] = liees[k] || []).push(o.code); if (o.type === "Cours") (liees.abandon = liees.abandon || []).push(o.code); } });
    var html = "<h2>Échéances</h2><p class='note'>Dates reprises de l'affichage du prototype de référence (relevé T07) : à vérifier auprès du calendrier officiel avant toute décision réelle. L'alerte apparaît 7 jours avant une échéance qui touche le plan.</p>";
    html += '<div class="scroll"><table class="t"><thead><tr><th>Date</th><th>Échéance</th><th>Statut (date simulée)</th><th>Activités du plan concernées</th><th>Source</th></tr></thead><tbody>';
    D.ECHEANCES.forEach(function (e) {
      var s = R.statutEcheance(state, e);
      html += "<tr><td class='num'>" + h(R.fmtDate(e.date)) + (e.fin ? " – " + h(R.fmtDate(e.fin)) : "") + "</td><td>" + h(e.libelle) + "</td><td><span class='v " + (s.code === "passee" ? "" : s.code === "proche" ? "depasse" : "ok") + "'>" + h(s.libelle) + "</span></td><td>" + h((liees[e.id] || []).join(", ") || "—") + "</td><td class='note'>" + h(e.source) + "</td></tr>";
    });
    return html + "</tbody></table></div>";
  }

  /* ---------- Sessions futures (CU06) ---------- */
  function vueSessions() {
    var tc = R.totalCasesFutures(state);
    var html = "<h2>Sessions futures</h2><p>" + h(R.pluriel(tc.reglees, "case", "cases")) + " sur " + tc.total + " " + (tc.reglees > 1 ? "sont occupées" : "est occupée") + " (session en cours ou intention) sur quatre sessions.</p>";
    html += "<p class='averti'>Une intention n'est <strong>pas</strong> une réservation. Seule la session en cours accepte des demandes ; la conversion d'une intention en demande se fera par une action expresse quand la session deviendra courante.</p>";
    html += '<div class="sessions">';
    state.sessionsFutures.forEach(function (s) {
      html += '<section class="session" aria-label="' + h(s.nom) + '"><h3>' + h(s.nom) + " <span class='note'>planifiée</span></h3>";
      ["cours", "projet", "activite"].forEach(function (t) {
        html += '<div class="qte"><button type="button" class="discret" data-action="cases-fut" data-s="' + s.id + '" data-t="' + t + '" data-d="-1" aria-label="Retirer une case ' + h(R.NOM_CASE[t]) + '">−</button><span class="num">' + s.cases[t] + '</span><button type="button" class="discret" data-action="cases-fut" data-s="' + s.id + '" data-t="' + t + '" data-d="1" aria-label="Ajouter une case ' + h(R.NOM_CASE[t]) + '">+</button> ' + h(R.NOM_CASE[t]) + "</div>";
      });
      state.intentions.filter(function (i) { return i.sessionId === s.id; }).forEach(function (i) {
        var o = R.offre(i.offreId);
        html += '<div class="intention ' + i.etat + '">' + etat(i.etat) + "<br><strong>" + h(o.code) + "</strong> — " + h(o.titre) + (i.note ? "<br><span class='note'>" + h(i.note) + "</span>" : "") +
          '<div class="pied" style="margin-top:.3rem"><button type="button" class="discret" data-action="retirer-intention" data-id="' + i.id + '">Retirer</button> <button type="button" disabled title="Session non courante">Convertir en demande</button></div>' +
          "<p class='raison-desactive'>Conversion impossible : " + h(s.nom) + " n'est pas la session en cours.</p></div>";
      });
      html += '<label class="champ" for="sel-' + s.id + '">Ajouter une intention</label><select id="sel-' + s.id + '">' +
        D.OFFRES_FUTURES.map(function (id) { var o = R.offre(id); return '<option value="' + id + '">' + h(o.code + " — " + o.titre) + (state.retraitsFuturs[id] ? " (n'est plus prévu)" : "") + "</option>"; }).join("") +
        '</select><div class="boutons" style="justify-content:flex-start"><button type="button" data-action="ajouter-intention" data-s="' + s.id + '">Déposer l\'intention</button></div></section>';
    });
    html += "</div><h3>Simuler un changement du catalogue futur</h3><p class='note'>Pour démontrer A2-4 : l'offre choisie n'est plus prévue ; les intentions concernées passent à « À réévaluer », rien n'est supprimé en silence.</p>" +
      '<select id="sel-retrait">' + D.OFFRES_FUTURES.map(function (id) { var o = R.offre(id); return '<option value="' + id + '">' + h(o.code + " — " + o.titre) + "</option>"; }).join("") + '</select><div class="boutons" style="justify-content:flex-start"><button type="button" class="discret" data-action="retrait-futur">Simuler le retrait de cette offre future</button></div>';
    return html;
  }

  /* ---------- Vue responsable simulée (CU07) ---------- */
  function vueResponsable() {
    var enAttente = state.demandes.filter(function (d) { return d.etat === "demandee" && R.offre(d.offreId).mode === "approbation"; });
    var html = "<h2>Vue responsable <em>(simulée)</em></h2><p class='averti'>Cette vue simule la personne qui encadre, pour démontrer CU07. Dans le système visé, elle serait réservée aux responsables authentifiés. Aucun message n'est réellement envoyé.</p>";
    if (!enAttente.length) return html + "<p>Aucune demande en attente d'un responsable. Déposez une candidature à un projet, un laboratoire ou un stage.</p>";
    enAttente.forEach(function (d) {
      var o = R.offre(d.offreId);
      html += '<section class="session" style="margin-bottom:.75rem"><h3>' + h(o.responsable || o.unite) + " — " + h(o.titre) + "</h3><p class='note'>Reçue en semaine " + d.creeeSemaine + " · capacité restante : " + (state.places[o.id] || 0) + " · profil : " + h(state.profil.interets.join(", ")) + "</p>" +
        '<label class="champ" for="motif-' + d.id + '">Motif (obligatoire pour refuser)</label><textarea id="motif-' + d.id + '" rows="2" placeholder="Ex. : places réservées aux personnes ayant réussi IFT2255"></textarea>' +
        '<div class="boutons" style="justify-content:flex-start"><button type="button" data-action="repondre" data-id="' + d.id + '" data-dec="offrir">Offrir une place</button><button type="button" class="discret" data-action="repondre" data-id="' + d.id + '" data-dec="refuser">Refuser avec motif</button></div></section>';
    });
    return html;
  }

  function vueJournal() {
    return "<h2>Journal du monde simulé</h2><p class='note'>Chaque changement (places, publications, réponses, expirations) est daté et sourcé : l'état n'évolue qu'au moment où vous avancez l'horloge ou agissez.</p><ul class='journal'>" +
      (state.journal.length ? state.journal.map(function (j) { return "<li><strong>Sem. " + j.semaine + "</strong> — " + h(j.texte) + " <span class='src'>[" + h(j.source) + "]</span></li>"; }).join("") : "<li>Rien encore.</li>") + "</ul>";
  }

  /* ---------- Bilan de fin de période (E14) ---------- */
  function vueBilan() {
    var b = R.bilan(state);
    var html = "<h2>Bilan de la période" + (b.terminee ? " — session terminée" : " (provisoire, semaine " + b.semaine + ")") + "</h2>" +
      "<p class='note'>Distingue ce qui est <strong>satisfait</strong>, <strong>incomplet</strong> ou <strong>incertain</strong>. Le prototype de référence n'affiche aucun bilan à la semaine 15.</p>";
    html += "<h3>Activités confirmées (simulation)</h3><ul>" + (b.confirmees.length ? b.confirmees.map(function (x) { return "<li>" + h(x) + "</li>"; }).join("") : "<li>Aucune.</li>") + "</ul>";
    html += "<h3>Règles du programme (activités confirmées seulement)</h3><ul class='regles'>" + b.regles.map(function (r) {
      return "<li><span>" + h(r.libelle) + "</span><span class='v " + (r.statut === "satisfait" ? "ok" : "a-completer") + "'>" + r.valeur + " / " + r.seuil + " · " + r.statut + "</span></li>"; }).join("") + "</ul>";
    html += "<h3>Demandes non résolues (incertain)</h3><ul>" + (b.nonResolues.length ? b.nonResolues.map(function (x) { return "<li>" + h(x.activite) + " — " + etat(x.etat) + "</li>"; }).join("") : "<li>Aucune.</li>") + "</ul>";
    html += "<h3>Intentions futures (incertain — aucune place réservée)</h3><ul>" + (b.intentions.length ? b.intentions.map(function (x) { return "<li>" + h(x.session) + " : " + h(x.activite) + " — " + etat(x.etat) + "</li>"; }).join("") : "<li>Aucune.</li>") + "</ul>";
    html += "<p class='note'>Crédits : acquis déclarés " + b.credits.acquis + " · en cours " + b.credits.enCours + " · planifiés " + b.credits.planifies + ".</p>";
    return html;
  }

  /* ---------- Export (CU10) ---------- */
  function exportHtml(ex) {
    var lg = Object.keys(ex.legende).map(function (k) { return "<li><b>" + h(k) + "</b> : " + h(ex.legende[k]) + "</li>"; }).join("");
    var act = ex.activites.map(function (a) { return "<tr><td>" + h(a.code) + " — " + h(a.titre) + "</td><td>" + h(a.type) + "</td><td>" + a.credits + "</td><td>" + a.heures + "</td><td>" + h(a.etat) + "</td><td>" + h(a.historique.map(function (x) { return x.etat + " (sem. " + x.semaine + ", " + x.source + (x.motif ? ", motif : " + x.motif : "") + ")"; }).join(" → ")) + "</td></tr>"; }).join("");
    var it = ex.intentions.map(function (i) { return "<tr><td>" + h(i.session) + "</td><td>" + h(i.code) + " — " + h(i.titre) + "</td><td>" + h(i.etat) + "</td><td>" + h(i.note) + "</td></tr>"; }).join("");
    var ec = ex.echeances.map(function (e) { return "<tr><td>" + h(e.date) + (e.fin ? " – " + h(e.fin) : "") + "</td><td>" + h(e.libelle) + "</td><td>" + h(e.statut) + "</td><td>" + h(e.source) + "</td></tr>"; }).join("");
    return "<!doctype html><html lang='fr'><head><meta charset='utf-8'><title>Export du plan — démonstration</title><style>body{font-family:Arial,sans-serif;max-width:900px;margin:2rem auto;color:#1B2A41}table{border-collapse:collapse;width:100%;margin:.5rem 0 1.5rem}td,th{border:1px solid #ccc;padding:4px 6px;font-size:13px;text-align:left}th{background:#eef2f6}.a{background:#FFF3D6;padding:8px;border:1px solid #F0D59A}</style></head><body>" +
      "<h1>Plan exporté — Automne 2026 et sessions futures</h1><p class='a'>" + h(ex.avertissement) + "</p><p>Généré le " + h(ex.genere) + " · semaine simulée " + ex.semaineSimulee + " (" + h(ex.dateSimulee) + ") · " + h(ex.programme.nom) + "</p>" +
      "<h2>Légende des statuts</h2><ul>" + lg + "</ul><h2>Activités de la session en cours</h2><table><tr><th>Activité</th><th>Type</th><th>Cr.</th><th>h/sem</th><th>État</th><th>Historique</th></tr>" + act + "</table>" +
      "<p>Confirmé : " + ex.totauxConfirmes.credits + " crédits, " + ex.totauxConfirmes.heures + " h/sem. Si toutes les demandes aboutissent : " + ex.totauxEngages.credits + " crédits, " + ex.totauxEngages.heures + " h/sem.</p>" +
      "<h2>Intentions futures (aucune place réservée)</h2><table><tr><th>Session</th><th>Offre</th><th>État</th><th>Note</th></tr>" + (it || "<tr><td colspan=4>Aucune</td></tr>") + "</table>" +
      "<h2>Échéances</h2><table><tr><th>Date</th><th>Échéance</th><th>Statut</th><th>Source</th></tr>" + ec + "</table></body></html>";
  }
  function telecharger(nom, contenu, type) { var b = new Blob([contenu], { type: type }); var a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = nom; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500); }
  function vueExport() {
    var ex = R.exporter(state);
    return "<h2>Exporter mon plan</h2><p>L'export distingue confirmé, demandé, offert et intention, avec la source de chaque transition et une légende.</p>" +
      '<div class="boutons" style="justify-content:flex-start"><button type="button" data-action="export-html">Télécharger la version lisible (HTML)</button><button type="button" class="discret" data-action="export-json">Télécharger les données (JSON)</button></div>' +
      "<h3>Aperçu des données exportées</h3><pre class='export' id='apercu-export'>" + h(JSON.stringify(ex, null, 2)) + "</pre>";
  }

  /* ---------- Profil (CU01) ---------- */
  function ouvrirProfil() {
    ui.brouillonProfil = JSON.parse(JSON.stringify(state.profil || { interets: [], programmeId: "demo-a", disponibilite: 30, pratique: 50 }));
    renderProfil(); $("#ecran-profil").hidden = false;
  }
  function renderProfil() {
    var b = ui.brouillonProfil, n = b.interets.length;
    var html = '<div class="carte-profil" role="dialog" aria-modal="true" aria-labelledby="titre-profil"><h1 id="titre-profil">Planifiez votre session</h1>' +
      "<p class='note'>Profil de démonstration : n'entrez aucune donnée personnelle. Ces choix orientent les suggestions ; les règles viennent du programme.</p>" +
      '<label class="champ">Intérêts (jusqu\'à trois ; le premier devient principal)</label><div class="puces">' +
      D.INTERETS.map(function (i) { var k = b.interets.indexOf(i); return '<button type="button" data-action="interet" data-i="' + h(i) + '" aria-pressed="' + (k >= 0) + '">' + h(i) + (k === 0 ? " · principal" : "") + "</button>"; }).join("") + "</div>" +
      '<label class="champ" for="sel-prog">Programme (règles versionnées, fictives)</label><select id="sel-prog">' +
      Object.keys(D.PROGRAMMES).map(function (k) { var p = D.PROGRAMMES[k]; return '<option value="' + k + '"' + (b.programmeId === k ? " selected" : "") + ">" + h(p.nom) + "</option>"; }).join("") + "</select>" +
      '<p class="note" id="seuils-prog"></p>' +
      '<label class="champ" for="txt-reussis">Cours déjà réussis (facultatif, codes séparés par des virgules — sert à vérifier les préalables, E3)</label>' +
      '<input id="txt-reussis" type="text" placeholder="Ex. : IFT1015, IFT1025" value="' + h((b.coursReussis || []).join(", ")) + '">' +
      '<label class="champ" for="rng-dispo">Disponibilité : <span id="val-dispo">' + b.disponibilite + "</span> h/semaine</label><input id='rng-dispo' type='range' min='10' max='45' step='1' value='" + b.disponibilite + "'>" +
      '<label class="champ" for="rng-prat">Façon d\'apprendre : <span id="val-prat">' + (b.pratique >= 60 ? "plutôt pratique" : b.pratique <= 40 ? "plutôt théorique" : "équilibrée") + "</span></label><input id='rng-prat' type='range' min='0' max='100' step='5' value='" + b.pratique + "'>" +
      '<div class="boutons"><button type="button" class="discret" data-action="profil-annuler"' + (state.profil ? "" : " hidden") + '>Annuler</button><button type="button" id="btn-commencer" data-action="profil-valider"' + (n ? "" : " disabled") + ">" + (n ? (state.profil ? "Enregistrer le profil" : "Commencer la planification") : "Choisissez au moins un intérêt") + "</button></div></div>";
    $("#ecran-profil").innerHTML = html;
    var majSeuils = function () { var p = D.PROGRAMMES[$("#sel-prog").value]; $("#seuils-prog").textContent = "Temps plein " + p.tempsPlein + " cr. · plafond " + p.plafond + " cr. · " + p.minCours + " cours min. · " + p.minBloc + " du bloc principal · " + p.source + "."; };
    majSeuils();
    $("#sel-prog").onchange = function () { b.programmeId = this.value; majSeuils(); };
    $("#rng-dispo").oninput = function () { b.disponibilite = +this.value; $("#val-dispo").textContent = this.value; };
    $("#txt-reussis").oninput = function () { b.coursReussis = this.value.split(/[,;\s]+/).map(function (x) { return x.trim().toUpperCase(); }).filter(Boolean); };
    $("#rng-prat").oninput = function () { b.pratique = +this.value; $("#val-prat").textContent = b.pratique >= 60 ? "plutôt pratique" : b.pratique <= 40 ? "plutôt théorique" : "équilibrée"; };
  }

  /* ---------- Rendu global ---------- */
  var VUES = { offres: vueOffres, demandes: vueDemandes, echeances: vueEcheances, sessions: vueSessions, responsable: vueResponsable, journal: vueJournal, bilan: vueBilan, export: vueExport };
  function render() {
    renderHorloge(); renderPlan();
    document.querySelectorAll("[role=tab]").forEach(function (b) { b.setAttribute("aria-selected", b.dataset.onglet === ui.onglet); });
    $("#vue").innerHTML = state.profil ? VUES[ui.onglet]() : "<p>Configurez votre profil pour afficher les offres.</p>";
    sauver();
  }

  document.addEventListener("click", function (ev) {
    var el = ev.target.closest("[data-action],[data-onglet]"); if (!el) return;
    var a = el.dataset.action, id = el.dataset.id, r;
    if (!a && el.dataset.onglet) { ui.onglet = el.dataset.onglet; return render(); }
    switch (a) {
      case "onglet": ui.onglet = el.dataset.onglet; break;
      case "filtre": ui.filtre = el.dataset.filtre; break;
      case "impact": ouvrirImpact(id, false); return;
      case "impact-seul": ouvrirImpact(id, true); return;
      case "fermer-dlg": fermerDlg(); return;
      case "deposer":
        var chk = $("#chk-avert"); r = R.deposer(state, id, chk ? chk.checked : false);
        if (!r.ok) { toast(r.aConfirmer ? "Cochez la case de confirmation pour déposer malgré l'avertissement." : r.raison); return; }
        fermerDlg(); toast("Demande déposée : état « Demandée ». Aucune place n'est encore obtenue."); break;
      case "annuler": r = R.annuler(state, id); toast(r.ok ? "Demande annulée." : r.raison); break;
      case "accepter": r = R.accepterOffre(state, id); toast(r.ok ? "Offre acceptée : activité confirmée (simulation)." : r.raison); break;
      case "decliner": r = R.declinerOffre(state, id); toast(r.ok ? "Offre déclinée." : r.raison); break;
      case "retirer": ouvrirRetrait(id); return;
      case "confirmer-retrait":
        r = R.retirer(state, id, true); fermerDlg();
        toast(r.ok ? "Activité retirée du plan." + (r.consequences.passeSousTempsPlein ? " Attention : le plan est sous le seuil de temps plein." : "") : r.raison); break;
      case "apprecier": r = R.apprecier(state, id, +el.dataset.val); toast(r.ok ? "Appréciation enregistrée ; suggestions recalculées (voir les raisons dans Offres)." : r.raison); break;
      case "repondre":
        var m = $("#motif-" + id); r = R.repondre(state, id, el.dataset.dec, m ? m.value : "");
        toast(r.ok ? (el.dataset.dec === "offrir" ? "Place offerte : la personne étudiante doit l'accepter." : "Refus enregistré avec motif.") : r.raison); if (!r.ok && /obligatoire/.test(r.raison)) return; break;
      case "avancer":
        r = R.avancerSemaine(state);
        if (r.ok && state.semaine >= D.NB_SEMAINES) { ui.onglet = "bilan"; toast("Semaine " + state.semaine + " : fin de la session simulée. Bilan affiché."); }
        else toast(r.ok ? "Semaine " + state.semaine + " : changements consignés dans le Journal." : r.raison);
        break;
      case "ajouter-case": R.ajouterCase(state, el.dataset.type); toast("Case ajoutée : " + R.NOM_CASE[el.dataset.type] + "."); break;
      case "retirer-case": r = R.retirerCase(state, id); if (!r.ok) toast(r.raison); break;
      case "cases-fut": R.modifierCases(state, el.dataset.s, el.dataset.t, +el.dataset.d); break;
      case "ajouter-intention": r = R.ajouterIntention(state, el.dataset.s, $("#sel-" + el.dataset.s).value); toast(r.ok ? "Intention déposée — aucune place réservée." : r.raison); break;
      case "retirer-intention": R.retirerIntention(state, id); break;
      case "retrait-futur": R.simulerRetraitFutur(state, $("#sel-retrait").value); toast("Catalogue futur modifié (simulé) : intentions concernées à réévaluer."); break;
      case "export-html": telecharger("plan_export_demo.html", exportHtml(R.exporter(state)), "text/html"); toast("Export HTML téléchargé."); return;
      case "export-json": telecharger("plan_export_demo.json", JSON.stringify(R.exporter(state), null, 2), "application/json"); toast("Export JSON téléchargé."); return;
      case "profil": ouvrirProfil(); return;
      case "interet":
        var b = ui.brouillonProfil, i = el.dataset.i, k = b.interets.indexOf(i);
        if (k >= 0) b.interets.splice(k, 1); else if (b.interets.length < 3) b.interets.push(i); else { toast("Trois intérêts au maximum : retirez-en un d'abord."); return; }
        renderProfil(); return;
      case "profil-annuler": $("#ecran-profil").hidden = true; return;
      case "profil-valider": if (!ui.brouillonProfil.interets.length) return; state.profil = ui.brouillonProfil; $("#ecran-profil").hidden = true; toast("Profil enregistré : suggestions et règles recalculées."); break;
      case "reinitialiser": if (!window.confirm("Effacer toute la démonstration et recommencer ?")) return; state = R.etatInitial(); ui.onglet = "offres"; ui.filtre = "Tout"; render(); ouvrirProfil(); return;
    }
    render();
  });

  render();
  if (!state.profil) ouvrirProfil();
})();
