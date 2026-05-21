import React, { useState, useRef, useEffect } from "react";
import Head from "next/head";
import { supabase } from "../../lib/supabase";
import { Analytics } from "@vercel/analytics/next";

const C = {
  bg: "#F8F5F0", card: "#FFFFFF", border: "#EDE8DF",
  accent: "#C4622D", accentBg: "#FFF0E8", text: "#1A1A1A",
  muted: "#888888", green: "#3A7A56", greenBg: "#EDF5F1", tag: "#F0EDE8",
};

const SYSTEM = `You are Mystorija, a professional renovation expert. ALWAYS respond in English only. Be direct, give specific product recommendations with prices in €. Max 3-4 paragraphs. Use emojis.`;
async function callAPI(messages) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, lang: "en" }),
  });
  const data = await response.json();
  return data.reply || data.content || data.error || "Sorry, something went wrong.";
}


function LoadingSpinner({ size }) {
  const sz = size || 24;
  return <div style={{ width: sz, height: sz, border: "3px solid " + C.border, borderTop: "3px solid " + C.accent, borderRadius: "50%", flexShrink: 0, animation: "spin 0.85s linear infinite" }} />;
}

function Pill({ children, bg, color }) {
  return <span style={{ background: bg || C.accentBg, color: color || C.accent, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 500, whiteSpace: "nowrap" }}>{children}</span>;
}

// ─── AFFILIATE ────────────────────────────────────────────────────────────────
const AFFILIATE_TAG = "mystorija-21";
function amazonLink(q, qBau) {
  const bq = qBau || q;
  return {
    amzn: `https://www.amazon.de/s?k=${encodeURIComponent(q)}&tag=mystorija-21`,
    obi:  `https://www.obi.de/suche/${encodeURIComponent(bq)}/`,
    bh:   `https://www.bauhaus.info/search?q=${encodeURIComponent(bq)}`,
    hb:   `https://www.hornbach.de/s/${encodeURIComponent(bq)}/`,
  };
}

// ─── ANLEITUNGEN DATEN (16 Stueck) ────────────────────────────────────────────
const ANLEITUNGEN = [
  { id:"streichen", emoji:"🖌️", titel:"Paint Walls", schwierigkeit:"Easy", zeit:"1–2 days", kosten:"30–80€",
    img:"https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=120&q=80",
    werkzeug:["Extension pole","Lambswool roller 12-18mm","Flat brush 5cm","Masking tape Tesa Precision","Protective sheet"],
    schritte:["Moebel raus / abdecken, Steckdosen abkleben","Risse spachteln, schleifen, Staub absaugen","Abkleben mit Spirit level – Band fingerspitzenartig andruecken","Farbton auf Pappe testen – daysslicht UND Kunstlicht!","Erste Schicht mit Rolle gleichmaessig auftragen","Min. 4h trocknen, dann zweite Schicht","Dispersionsfarbe: Band nach Trocknen abziehen. Latexfarbe: Band NASS abziehen!","Anschluesse (Decke, Fenster) mit Pinsel nacharbeiten"],
    tipp:"Lambswool roller 12-18mm = beste Oberflaeche ohne Flusen.",
    fehler:"Zu wenig abkleben, falscher Abziehmodus, zu dicke Schichten.",
    youtube:"https://www.youtube.com/results?search_query=waende+streichen+profi+anleitung",
    amazon:amazonLink("lammfellrolle teleskopstange set") },
  { id:"spachteln", emoji:"🔧", titel:"Skim Coat Walls", schwierigkeit:"Medium", zeit:"2–3 days", kosten:"40–120€",
    img:"https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=120&q=80",
    werkzeug:["Glaettekelle 40cm","Rakel","Schleifgitter 120er","Glasflies","Pulverspachtel","Fertigspachtel"],
    schritte:["Q1 – Fugen: Pulverspachtel einpressen, Fugendeckstreifen einlegen","Q2 – Uebergaenge: Fertigspachtel duenn mit Kelle ziehen","Q3 – Abporen: duenner Abrieb ueber die gesamte Flaeche","Glasflies empfohlen: verhindert Rissbildung","Nach jeder Schicht nass mit Rakel ueberziehen","Schleifen nur Q2/Q3 mit Gitter auf Brett","Vor Streichen: Tiefengrund duenn auftragen"],
    tipp:"Pulverspachtel fuer Q1 (stabiler), Fertigspachtel fuer Q2/Q3 (besser schleifbar).",
    fehler:"Q1 und Q2 verwechseln, zu dick auftragen, nicht schleifen.",
    youtube:"https://www.youtube.com/results?search_query=wand+spachteln+anleitung+q1+q2",
    amazon:amazonLink("glaettekelle donespachtel set") },
  { id:"fliesen", emoji:"⬛", titel:"Fliesen legen", schwierigkeit:"Medium", zeit:"2–4 days", kosten:"100–400€",
    img:"https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=120&q=80",
    werkzeug:["Notched trowel 8mm","Nivelliersystem","Tile cutter","Fugenmasse","Rubber mallet"],
    schritte:["Raumbreite ÷ Fliesenbreite – letzter Streifen mind. ¾ Width","Mitte des Raums als Startpunkt","Untergrund: eben, trocken, tragfaehig","Doppelklebung: Kleber auf Boden UND Fliese","Notched trowel 8mm gleichmaessig aufziehen","1/3-Verband verlegen","Nivelliersystem bei grossen Formaten","24h trocknen, dann fugen"],
    tipp:"Grosse Formate (60×60+) immer Doppelklebung + Nivelliersystem.",
    fehler:"Untergrund nicht pruefen, Doppelklebung vergessen.",
    youtube:"https://www.youtube.com/results?search_query=fliesen+legen+anleitung",
    amazon:amazonLink("fliesen nivelliersystem zahnkelle") },
  { id:"bad", emoji:"🚿", titel:"Bad ohne Abriss renovieren", schwierigkeit:"Medium", zeit:"3–5 days", kosten:"200–800€",
    img:"https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=120&q=80",
    werkzeug:["Utility knife","Anlauger","Silikon+Pistole","Abdichtband","SMP-Klebstoff"],
    schritte:["Klopftest: hohle Fliesen markieren (>20% = Abriss noetig)","Altes Silikon komplett raus + Untergrund entfetten","Abdichtung: Wanne, Dusche bis 2m, Boden","SMP-Klebstoff: KEINE Dispersionsgrundierung darunter","Neue Fliesen auf alte legen (Boden +1–2cm)","Silikon mit Finger+Spuelmittel glattziehen","Armaturentausch: Wasser ab, Teflonband","Licht, Spiegel, Accessoires"],
    tipp:"Nur Silikon + Oberflaechen = 80% Arbeitsersparnis bei gleichem Ergebnis.",
    fehler:"Abdichtung vergessen, Silikon auf Fett, falscher Kleber.",
    youtube:"https://www.youtube.com/results?search_query=bad+renovieren+ohne+abriss",
    amazon:amazonLink("bad renovierung silikon abdichtband set") },
  { id:"laminat", emoji:"🪵", titel:"Laminat verlegen", schwierigkeit:"Easy", zeit:"1 day", kosten:"15–50€/m²",
    img:"https://images.unsplash.com/photo-1574739782594-db4ead022697?w=120&q=80",
    werkzeug:["Jigsaw","Zugeisen","Trittschalldaemmung","Abstandshalter 10mm","Rubber mallet"],
    schritte:["Untergrund: eben (max. 3mm/2m), trocken","Trittschalldaemmung vollflaechig verlegen","48h Laminat akklimatisieren – Pflicht!","Abstandshalter 10mm an alle Waende","Nut zur Wand, erste Reihe ausrichten","Jede Reihe mind. 40cm versetzt","Letzte Reihe messen, schneiden, einziehen","Sockelleisten an Wand schrauben (NICHT ans Laminat)"],
    tipp:"48h akklimatisieren verhindert, dass sich der Boden nach Verlegen woelbt.",
    fehler:"Dehnungsfuge vergessen, keine Folie auf Beton.",
    youtube:"https://www.youtube.com/results?search_query=laminat+verlegen+anleitung",
    amazon:amazonLink("laminat verlegewerkzeug trittschalldaemmung") },
  { id:"wandpaneele", emoji:"📐", titel:"Wandpaneele / Fluted Panels", schwierigkeit:"Easy", zeit:"4–8 hours", kosten:"50–200€",
    img:"https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=120&q=80",
    werkzeug:["Bohrschrauber","Jigsaw","SPC-Kleber","Spirit level","Abstandshalter"],
    schritte:["Wand: gerade, trocken, tapetenfrei","Paneele 24h akklimatisieren","Erstes Panel mit Spirit level ausrichten","Kleber: S-Muster, mind. 5cm vom Rand","Panel andruecken, 2 Min. halten","Stoesse versetzen wie Mauerwerk","Steckdosen: Pappe-Schablone, dann Jigsaw","Abschluss mit Profil oder Anstrich"],
    tipp:"Fluted Panels hinter Bett oder Sofa – meistgesuchter Look 2025.",
    fehler:"Erstes Panel nicht ausrichten, Loesungsmittel-Kleber auf Kunststoff.",
    youtube:"https://www.youtube.com/results?search_query=wandpaneele+fluted+panel",
    amazon:amazonLink("wandpaneele fluted panel MDF") },
  { id:"led", emoji:"💡", titel:"LED-Beleuchtung einbauen", schwierigkeit:"Easy", zeit:"2–4 hours", kosten:"30–150€",
    img:"https://images.unsplash.com/photo-1600210492493-0946911123ea?w=120&q=80",
    werkzeug:["WAGO-Klemmen","Seitenschneider","Voltage tester","LED-Streifen 24V","Dimmer"],
    schritte:["Sicherung raus! Voltage tester nutzen","24V LED-Streifen waehlen","WAGO statt Luesterklemmen","Untergrund entfetten, Ecken mit Verbinder","Streifen kleben, andruecken","Trailing-Edge-Dimmer einbauen","Trafo: min. 20% Leistungsreserve","Test vor dem Abdecken"],
    tipp:"Indirekte LED in Stuckkehle wirkt besser als direkte Spots.",
    fehler:"Zu schwacher Trafo, Streifen knicken, falscher Dimmer.",
    youtube:"https://www.youtube.com/results?search_query=led+streifen+einbauen+anleitung",
    amazon:amazonLink("led streifen 24v wago dimmer set") },
  { id:"silikon", emoji:"🔲", titel:"Silikon erneuern", schwierigkeit:"Easy", zeit:"2–3 hours", kosten:"10–25€",
    img:"https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=120&q=80",
    werkzeug:["Silikonentferner","Utility knife","Sanitaer-Silikon (Soudal)","Silikonpistole","Spuelmittel"],
    schritte:["Altes Silikon mit Utility knife raus","Reste mit Entferner loesen (15 Min.)","Untergrund mit Isopropanol entfetten","Malerband beidseitig abkleben","Silikon in einem Zug auftragen","Finger mit Spuelmittel glattziehen","Band SOFORT (nass) abziehen","24h nicht nass"],
    tipp:"Badewanne vor Abdichten mit Wasser fuellen – haelt bei Belastung besser.",
    fehler:"Band zu spaet, fettig, kein Pilzhemmer.",
    youtube:"https://www.youtube.com/results?search_query=silikon+erneuern+bad+anleitung",
    amazon:amazonLink("soudal sanitaer silikon pilzhemmend") },
  { id:"tapezieren", emoji:"🖼️", titel:"Tapete entfernen & tapezieren", schwierigkeit:"Easy", zeit:"1–2 days", kosten:"20–80€",
    img:"https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=120&q=80",
    werkzeug:["Tapeziertisch","Tapezierbuerste","Tapezierpaste","Utility knife","Wasserwalze"],
    schritte:["Alte Tapete einweichen: Wasser + Spuelmittel, 15 Min. warten","Tapete in langen Streifen von oben abziehen","Kleisterreste nass abwischen, trocknen lassen","Neue Tapete messen: Raumhoehe + 5cm Zugabe","Kleister anruehren, auf Tapete auftragen","Tapete einschlagen, 5 Min. einweichen","Von oben ansetzen, Luftblasen rausstreichen","Ueberschuss mit Utility knife abschneiden"],
    tipp:"Immer in Richtung des Fensterlichts tapezieren – Stoesse werden unsichtbar.",
    fehler:"Zu kurze Einweichzeit, Luftblasen nicht rausstreichen, falscher Kleister.",
    youtube:"https://www.youtube.com/results?search_query=tapete+entfernen+tapezieren+anleitung",
    amazon:amazonLink("tapezierpaste tapezierbuerste set") },
  { id:"fugenreinigen", emoji:"🧹", titel:"Fugen reinigen & auffrischen", schwierigkeit:"Easy", zeit:"2–4 hours", kosten:"15–40€",
    img:"https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=120&q=80",
    werkzeug:["Fugenreiniger","Fugenbuerste","Dampfreiniger (optional)","Fugenstift weiss","Schleifklotz"],
    schritte:["Fugenreiniger auftragen, 10–15 Min. einwirken","Mit Fugenbuerste kraeftig schrubben","Dampfreiniger fuer hartnaeckige Stellen","Gruendlich abspuelen, trocknen lassen","Wenn grau/gelblich: Fugenstift auftragen","Bei komplett verfaerbt: ausschleifen + neu verfugen","Fugenschutz-Spray als Abschluss"],
    tipp:"Dampfreiniger leihen statt kaufen – effektivstes Werkzeug fuer einmalige Nutzung.",
    fehler:"Chlorhaltige Reiniger auf farbigen Fliesen, Fugen nicht vollstaendig trocknen.",
    youtube:"https://www.youtube.com/results?search_query=fugen+reinigen+auffrischen+anleitung",
    amazon:amazonLink("fugenreiniger fugenstift weiss set") },
  { id:"kueche-fronten", emoji:"🍳", titel:"Replace Kitchen Fronts", schwierigkeit:"Easy", zeit:"1 day", kosten:"200–800€",
    img:"https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=120&q=80",
    werkzeug:["Cordless drill","Kreuzschlitzschrauber","Spirit level","Massband","Scharnier-Einstellwerkzeug"],
    schritte:["Alte Fronten abschrauben: Scharniere loesen","Scharniere auf neue Fronten – gleiche Position messen","Neue Front einhaengen, noch nicht festschrauben","Spaltmass pruefen: 2–3mm gleichmaessig rundum","Scharniere in 3 Richtungen justieren","Erst wenn alles passt: Schrauben fest","Griffe montieren: Schablone, bohren"],
    tipp:"Kuechenfronten-Tausch = halbe neue Kueche fuer 10% des Preises.",
    fehler:"Scharniere falsch justiert, Schablone fuer Griffe nicht genutzt.",
    youtube:"https://www.youtube.com/results?search_query=kuechenfronten+austauschen+anleitung",
    amazon:amazonLink("kuechenfronten scharnier einstellwerkzeug") },
  { id:"trockenbau", emoji:"🔩", titel:"Trockenbauwand bauen", schwierigkeit:"Medium", zeit:"1–2 days", kosten:"80–200€",
    img:"https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=120&q=80",
    werkzeug:["Metallprofil-Schere","Cordless drill","Spirit level + Lot","Rigipsplatten","Schrauben 3,5×35mm"],
    schritte:["Bodenprofile (UW) mit Lot ausrichten und verschrauben","Deckenprofile parallel befestigen","Staenderprofile (CW) alle 62,5cm einsetzen","Elektro-Leerrohr jetzt einziehen","Erste Lage Rigips verschrauben: alle 25cm","Mineralwolle als Daemmung einlegen","Zweite Seite beplanken","Fugen verspachteln: Fugenband + Q1/Q2"],
    tipp:"CW-Profile alle 62,5cm = perfekter Raster fuer 125cm-Platten.",
    fehler:"Staender falsch messen, keine Daemmung, Schrauben zu tief.",
    youtube:"https://www.youtube.com/results?search_query=trockenbauwand+bauen+anleitung",
    amazon:amazonLink("rigips staenderwerk CD UW profil set") },
  { id:"parkett-schleifen", emoji:"🪵", titel:"Parkett schleifen & oelen", schwierigkeit:"Medium", zeit:"2–3 days", kosten:"80–300€",
    img:"https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=120&q=80",
    werkzeug:["Parkettschleifer (leihen!)","Deltaschleifer fuer Ecken","Schleifpapier 40/80/120er","Naturoel oder Versiegelung","Parkettrolle"],
    schritte:["Raum leeren, alle Naegel versenken","Erste Runde: grobes 40er diagonal","Zweite Runde: 80er entlang Maserung","Dritte Runde: 120er Feinschliff","Ecken mit Deltaschleifer nacharbeiten","Saugen + feucht wischen, 2h trocknen","Oel duenn auftragen, in Maserungsrichtung","Nach 12h zweite Oelschicht"],
    tipp:"Parkettschleifer im Baumarkt leihen – 2 days reichen. Schutzmaske Pflicht!",
    fehler:"Naegel nicht versenken, zu dicke Oelschicht, Ecken vergessen.",
    youtube:"https://www.youtube.com/results?search_query=parkett+abschleifen+oelen+anleitung",
    amazon:amazonLink("osmo hartwachsoel 3032 parkett") },
  { id:"fenster-abdichten", emoji:"🪟", titel:"Fenster abdichten", schwierigkeit:"Easy", zeit:"2–4 hours", kosten:"20–60€",
    img:"https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=120&q=80",
    werkzeug:["Dichtungsband selbstklebend","Acryl-Dichtstoff","Silikonpistole","Utility knife","Isopropanol"],
    schritte:["Alte Dichtungen pruefen: eindruecken – federt? Wenn nicht: erneuern","Alte Gummidichtung aus Nut ziehen","Neue Moosgummi-Dichtung einlegen","Aussenfuge pruefen: Acryl gerissen?","Alte Aussenfuge raus, Untergrund saeubern","Neues Acryl, glatt abziehen, nach 2h uebermalen","Innenfuge: Kompriband einlegen"],
    tipp:"Fensterdichtungen alle 10–15 Jahre erneuern. Kosten 5€, sparen 15% Heizenergie.",
    fehler:"Falsches Dichtungsmass, Acryl auf fettigem Untergrund.",
    youtube:"https://www.youtube.com/results?search_query=fenster+abdichten+daemmen+anleitung",
    amazon:amazonLink("fensterdichtung moosgummi selbstklebend") },
  { id:"duschkabine", emoji:"🚿", titel:"Duschkabine einbauen", schwierigkeit:"Medium", zeit:"1 day", kosten:"150–600€",
    img:"https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=120&q=80",
    werkzeug:["Spirit level","Cordless drill","Duebel + Schrauben","Sanitaer-Silikon","Metallsaege"],
    schritte:["Teile laut Anleitung sortieren","Duschwanne einbauen: Fuesse bis waagerecht justieren","Ablauf anschliessen, auf Dichtigkeit testen","Wandprofil senkrecht anzeichnen, duebeln","Glaselemente einhaengen","Alle Verbindungen mit Sanitaer-Silikon abdichten","Tueren einhaengen, Mechanismus pruefen","24h aushaerten, dann Wassertest"],
    tipp:"Duschwanne IMMER mit Wasser fuellen bevor du abdichtest.",
    fehler:"Wanne nicht waagerecht, Ablauf nicht getestet, Silikon auf nasser Flaeche.",
    youtube:"https://www.youtube.com/results?search_query=duschkabine+einbauen+anleitung",
    amazon:amazonLink("duschkabine dichtband sanitaer silikon") },
  { id:"aussenputz", emoji:"🧱", titel:"Risse im Aussenputz reparieren", schwierigkeit:"Medium", zeit:"1 day", kosten:"30–100€",
    img:"https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=120&q=80",
    werkzeug:["Flex mit Trennscheibe","Putzspachtel","Aussenputz-Reparaturmasse","Armierungsband","Grundierung"],
    schritte:["Riss aufweiten: V-foermig aufschlitzen (bessere Haftung)","Losen Putz entfernen, abbuersten","Grundierung auftragen, 30 Min. trocknen","Armierungsband in Riss einlegen","Reparaturmasse in zwei Schichten","Erste Schicht eindruecken, 2h trocknen","Zweite Schicht buendig abglaetten","Nach 24h Fassadenfarbe auftragen"],
    tipp:"Risse >3mm immer aufschlitzen. Zugekleisterter Riss reisst nach einem Winter wieder auf.",
    fehler:"Riss nicht aufweiten, kein Armierungsband, Farbton nicht anpassen.",
    youtube:"https://www.youtube.com/results?search_query=aussenputz+riss+reparieren+anleitung",
    amazon:amazonLink("aussenputz reparatur set armierungsband") },
  { id:"parkett", emoji:"🪵", titel:"Parkett & Vinyl verlegen", schwierigkeit:"Medium", zeit:"1–2 days", kosten:"150–600€",
    img:"https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=120&q=80",
    werkzeug:["Jigsaw","Rubber mallet","Zugeisen","Abstandshalter 10mm","Spirit level"],
    schritte:["48h akklimatisieren (Pakete geoeffnet, liegend im Raum)","Untergrund pruefen: max. 3mm Unebenheit – sonst Ausgleichsmasse (Knauf Nivello)","Trittschalldaemmung auslegen, Stoesse 15cm ueberlappen","Erste Reihe: 10mm Abstandshalter zur Wand – IMMER!","Klicksystem: Winkel einsetzen und nach unten druecken","Richtung: laengs zur Fensterseite = Raum wirkt groesser","Letzte Reihe mit Zugeisen eindruecken","Sockelleisten KLEBEN – nie auf Laminat schrauben!"],
    tipp:"SPC-Vinyl = 100% wasserfest fuer Bad und Kueche. Laminat nur fuer Trockenraeume!",
    fehler:"Dehnungsfuge vergessen, zu frueh betreten (24h warten), Tuerrahmen nicht untergeschoben.",
    youtube:"https://www.youtube.com/results?search_query=vinyl+laminat+verlegen+anleitung",
    amazon:amazonLink("spc vinyl klick boden verlegen set") },
  { id:"kueche-fronten", emoji:"🍳", titel:"Paint Kitchen Fronts", schwierigkeit:"Medium", zeit:"2–3 days", kosten:"80–300€",
    img:"https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=120&q=80",
    werkzeug:["Exzenterschleifer P120/180","Haftgrund Zinsser BIN","Seidenmatt-Lack","Schaumstoffrolle 4mm","Masking tape","Schraubenzieher"],
    schritte:["Fronten ausbauen und nummerieren","Mit Aceton entfetten – der wichtigste Schritt!","P120 schleifen fuer Haftung, Staub absaugen","Haftgrund duenn auftragen, 2h trocknen","1. Farbschicht mit Schaumstoffrolle (kurzflorig = keine Struktur)","4h trocknen, P180 leicht anschleifen","2. und 3. Farbschicht mit je 4h Trockenzeit","Fronten einbauen, Scharniere justieren"],
    tipp:"Zinsser BIN haftet auf fast allem – auch glatten MDF-Fronten ohne langes Schleifen.",
    fehler:"Zu dicke Schichten = Laeufer. Nicht entfettet = Abloesung nach weeks.",
    youtube:"https://www.youtube.com/results?search_query=kuechenfronten+lackieren+anleitung",
    amazon:amazonLink("zinsser bin haftgrund kueche fronten lackieren") },
  { id:"led-strip", emoji:"💡", titel:"LED-Strip & Cove-Licht installieren", schwierigkeit:"Easy", zeit:"2–4 hours", kosten:"30–120€",
    img:"https://images.unsplash.com/photo-1600210492493-0946911123ea?w=120&q=80",
    werkzeug:["LED-Strip 24V COB","Trafo (20% Reserve)","WAGO-Klemmen","Alu-Profil + Diffusor","Utility knife"],
    schritte:["Length messen, Wattzahl berechnen (W/m × Meter)","Trafo waehlen: min. 20% mehr als Gesamtwatt","Alu-Profil zuschneiden und mit Klebeband oder Schrauben montieren","Strip NUR an Schnittmarkierungen kuerzen!","Strip einlegen, Diffusor aufsetzen","Anschluss mit WAGO-Klemmen (kein Loeten noetig)","Trailing-Edge-Dimmer anschliessen (kein Flimmern!)","Testen bevor alles verklebt wird"],
    tipp:"24V = kein Spannungsabfall. Bei 12V und mehr als 3m wird Licht ungleichmaessig.",
    fehler:"Vorderflanken-Dimmer = Flimmern. Trafo zu schwach = ueberhitzt. Strip falsch herum.",
    youtube:"https://www.youtube.com/results?search_query=led+strip+cove+licht+anleitung",
    amazon:amazonLink("led strip 24v cob warmweiss 2700k trafo dimmer") },
  { id:"rigips-wand", emoji:"🏗️", titel:"Rigips-Trennwand bauen", schwierigkeit:"Medium", zeit:"2–3 days", kosten:"200–600€",
    img:"https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=120&q=80",
    werkzeug:["Cordless drill","Blechschere fuer Profile","Spirit level 1m","Rigips-Schrauben 3,5×35mm","Spachtel"],
    schritte:["Grundriss auf Boden anzeichnen, Spirit level zur Decke uebertragen","UW-Profile an Boden + Decke mit Duebeln alle 50cm","CW-Staender alle 62,5cm – Raster fuer 125cm Platten!","Leerrohr fuer Kabel einziehen VOR dem Beplatten","Erste Seite: Schrauben alle 25cm, Kopf 0,5mm versenkt","Daemmwolle einlegen (Steinwolle fuer Schallschutz)","Zweite Seite – Plattenstoesse versetzt!","Fugenspachtel + Glasflies-Band einbetten, trocknen, schleifen"],
    tipp:"Im Bad: GKFI (gruene Feuchtraumplatten) verwenden – weisse GKB quillt auf!",
    fehler:"Staender falsch abstaendig, Glasflies vergessen = Riss nach 6 Monaten.",
    youtube:"https://www.youtube.com/results?search_query=rigips+trennwand+bauen+anleitung",
    amazon:amazonLink("rigips staenderwerk cw uw profil trockenbau set") },
  { id:"wpc-terrasse", emoji:"🌴", titel:"WPC-Terrasse verlegen", schwierigkeit:"Medium", zeit:"1–2 days", kosten:"500–2.000€",
    img:"https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=120&q=80",
    werkzeug:["Circular saw oder Jigsaw","Cordless drill","Spirit level","Stelzlager hoehenverstellbar","Abstandshalter 5mm"],
    schritte:["Untergrund reinigen – alter Belag kann bleiben wenn stabil","Stelzlager setzen alle 50cm, Flucht mit Schnur pruefen","2% Gefaelle einplanen (weg vom Haus)","Tragebalken auf Stelzlager – Holz oder Alu alle 40–50cm","Erste Diele mit 10mm Abstand zur Wand","Unsichtbare Clips einsetzen – kein Schraubloch sichtbar!","Letzte Reihe zuschneiden","Abschlussprofile an allen Raendern montieren"],
    tipp:"WPC 48h akklimatisieren. Im Sommer dehnt WPC sich aus – Dehnfugen einhalten!",
    fehler:"Zu wenig Gefaelle = Pfuetzen, keine Dehnfuge = Wellen im Sommer.",
    youtube:"https://www.youtube.com/results?search_query=wpc+dielen+verlegen+terrasse",
    amazon:amazonLink("wpc dielen terrasse stelzlager clip unsichtbar set") },
  { id:"arbeitsplatte", emoji:"🔨", titel:"Arbeitsplatte wechseln", schwierigkeit:"Medium", zeit:"1 day", kosten:"100–500€",
    img:"https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=120&q=80",
    werkzeug:["Jigsaw mit Holzblatt","Oberfraese fuer saubere Ausschnitte","Silikon + Pistole","Montagekleber","Massband"],
    schritte:["Wasser unter Spuele abstellen, Siphon abbauen","Alte Platte von unten loesen (Schrauben in Eckverbindern)","Neue Platte auf Mass zuschneiden – 1mm zu gross lassen","Spuelenausschnitt mit Schablone anzeichnen","Jigsaw: erst Loch bohren, dann Richtung Gegenfase schneiden","Schnittkanten SOFORT abdichten – quillt sonst auf!","Platte einlegen, von unten verschrauben","Silikon an Wand und Spuelenrand, 24h trocknen"],
    tipp:"Schnittkante nie unbehandelt lassen – quillt garantiert auf!",
    fehler:"Ausschnitt zu gross, Kante nicht abgedichtet, Silikon zu frueh belastet.",
    youtube:"https://www.youtube.com/results?search_query=arbeitsplatte+kueche+wechseln",
    amazon:amazonLink("holzarbeitsplatte kueche massiv buche eiche geoelt") },
  { id:"abdichtung-bad", emoji:"🛡️", titel:"Bad abdichten (Dusche & Wanne)", schwierigkeit:"Medium", zeit:"2 days", kosten:"80–200€",
    img:"https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=120&q=80",
    werkzeug:["Dichtschlaemme Mapei Mapelastic","Dichtband + Dichtmanschetten","Pinsel 10cm","Zahnspachtel","Latexhandschuhe"],
    schritte:["Untergrund reinigen: kein Staub, kein Fett","1. Lage Dichtschlaemme duenn auftragen","Dichtband in ALLE Ecken einbetten waehrend Lage noch nass!","Dichtmanschetten ueber alle Rohre einbetten","1. Lage trocknen: mind. 4h (besser ueber Nacht)","2. Lage quer zur ersten – Kreuzverband verhindert Risse","24h trocknen vor Fliesenarbeiten","Mit Spruehflasche testen: kein Durchfeuchten"],
    tipp:"Dichtband einbetten = es muss in der ersten Lage versinken. Nur ueberstreichen reicht nicht!",
    fehler:"Nur 1 Lage, Band nicht eingebettet, Trockenzeit unterschritten = undicht nach 1 Jahr.",
    youtube:"https://www.youtube.com/results?search_query=bad+abdichten+dichtschlaemme+anleitung",
    amazon:amazonLink("mapei mapelastic dichtschlaemme bad dusche set") },
  { id:"bodengleiche-dusche", emoji:"🚿", titel:"Bodengleiche Dusche bauen", schwierigkeit:"Hard", zeit:"3–5 days", kosten:"500–2.000€",
    img:"https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=120&q=80",
    werkzeug:["Ablaufrinne oder Punktablauf","Gefaelleestrich-Set","Dichtschlaemme 2-lagig","Flexkleber C2","Spirit level 1m"],
    schritte:["Ablauf positionieren: weit vom Duschkopf entfernt","Gefaelleestrich anmischen: 1,5–2% Gefaelle zur Rinne","Estrich aufbringen, Gefaelle pruefen (Spirit level + Messen)","48h trocknen, Klopftest: kein Hohlklang!","2-lagige Abdichtung mit Dichtband in allen Ecken","Fliesen mit Flexkleber C2 verlegen – Gefaelle beibehalten","Schlueter KERDI-Profil am Uebergang Dusche/Bad","Randfuge: NUR Silikon (Soudal S100) – nie Fugenmoertel!"],
    tipp:"Wasser-Test: Wasser draufgiessen und beobachten – muss restlos ablaufen ohne Pfuetzen.",
    fehler:"Zu wenig Gefaelle, kein Dichtband in Ecken, falscher Kleber.",
    youtube:"https://www.youtube.com/results?search_query=bodengleiche+dusche+bauen+anleitung",
    amazon:amazonLink("bodengleiche dusche ablaufrinne gefaelleestrich set") },
  { id:"fliesenspiegel-bekleben", emoji:"🎨", titel:"Apply Kitchen Film", schwierigkeit:"Easy", zeit:"2–4 hours", kosten:"30–100€",
    img:"https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=120&q=80",
    werkzeug:["Klebefolie d-c-fix oder Oracal","Utility knife + Stahllineal","Rubber squeegee","Isopropanol","Foen"],
    schritte:["Mit Isopropanol entfetten – komplett trocknen lassen","Folie ausmessen + 3cm Uebermass","Traegerpapier 10cm abziehen, Kante ausrichten","Rakel von oben nach unten – keine Blasen!","Ueberlappungen an Fugen einschneiden","Blasen: Nadel einstechen, Foen erwaermen, herausdruecken","Ecken mit Foen erwaermen fuer bessere Haftung","Schalter: X einschneiden, Ecken ausklappen"],
    tipp:"Spueliwasser (1 Tropfen auf 1L) ermoeglicht Positionieren auf glatten Flaechen.",
    fehler:"Nicht entfettet = Abloesung, zu stark gezogen = Falten.",
    youtube:"https://www.youtube.com/results?search_query=klebefolie+fliesen+kueche+anleitung",
    amazon:amazonLink("klebefolie selbstklebend moebel fliesen dc-fix") },
];

// ─── ONBOARDING ───────────────────────────────────────────────────────────────
const ONBOARDING_STEPS = [
  {
    icon: "✨",
    title: "AI Makeover",
    desc: "Lade ein Foto deines Raumes hoch. Die KI zeigt dir in 20 Sekunden wie er nach der Renovierung aussehen koennte.",
    tab: "makeover",
    color: C.accent,
  },
  {
    icon: "💬",
    title: "Renovation Expert",
    desc: "Frag den KI-Chat alles: Kosten, Materialien, Schritt-fuer-Step Anleitungen. Wie ein erfahrener Handwerker auf Abruf.",
    tab: "chat",
    color: "#2A6DB5",
  },
  {
    icon: "📋",
    title: "16 Profi-Anleitungen",
    desc: "Von Silikon erneuern bis Mikrozement – hake jeden Step waehrend der Arbeit ab. Your Progress wird gespeichert.",
    tab: "anleit",
    color: C.green,
  },
  {
    icon: "🔨",
    title: "Profis in deiner Naehe",
    desc: "Wenn du doch lieber einen Handwerker beauftragen moechtest: Finde gepruefte Betriebe direkt in der App.",
    tab: "profis",
    color: "#8B4513",
  },
];

function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const current = ONBOARDING_STEPS[step];
  const isLast = step === ONBOARDING_STEPS.length - 1;

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:1000, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <div className="fu" style={{ background:C.card, borderRadius:"24px 24px 0 0", padding:"28px 24px 40px", width:"100%", maxWidth:600 }}>
        {/* Progress dots */}
        <div style={{ display:"flex", justifyContent:"center", gap:8, marginBottom:24 }}>
          {ONBOARDING_STEPS.map((_, i) => (
            <div key={i} style={{ width: i===step?24:8, height:8, borderRadius:4, background:i===step?current.color:C.border, transition:"all 0.3s" }} />
          ))}
        </div>

        {/* Icon */}
        <div style={{ width:72, height:72, borderRadius:20, background:current.color+"22", border:`2px solid ${current.color}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, margin:"0 auto 20px" }}>
          {current.icon}
        </div>

        {/* Content */}
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:24, textAlign:"center", color:C.text, marginBottom:12 }}>
          {current.title}
        </h2>
        <p style={{ fontSize:15, color:C.text, textAlign:"center", lineHeight:1.7, marginBottom:28, opacity:0.8 }}>
          {current.desc}
        </p>

        {/* Buttons */}
        <div style={{ display:"flex", gap:10 }}>
          {!isLast && (
            <button onClick={onDone} style={{ flex:1, padding:"12px", borderRadius:50, border:`1px solid ${C.border}`, background:"none", color:C.muted, fontSize:14, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
              Skip
            </button>
          )}
          <button onClick={() => isLast ? onDone() : setStep(s => s+1)} style={{ flex:2, padding:"14px", borderRadius:50, background:current.color, color:"white", border:"none", fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
            {isLast ? "Jetzt loslegen! 🚀" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ANLEITUNGEN TAB (mit localStorage) ──────────────────────────────────────
function AnleitungenTab({ lang = "de" }) {
  const [offen, setOpen] = useState(null);
  const [erledigt, setDone] = useState({});

  // Fortschritt laden
  useEffect(() => {
    try {
      const saved = localStorage.getItem("mystorija_anleitungen");
      if (saved) setDone(JSON.parse(saved));
    } catch {}
  }, []);

  // Fortschritt speichern
  const toggleStep = (key) => {
    setDone(prev => {
      const next = { ...prev, [key]: !prev[key] };
      try { localStorage.setItem("mystorija_anleitungen", JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const totalsteps = ANLEITUNGEN.reduce((s, a) => s + a.schritte.length, 0);
  const totalDone = Object.values(erledigt).filter(Boolean).length;
  const pct = Math.round((totalDone / totalsteps) * 100);
  return (
    <div style={{ overflowY:"auto", height:"100%", padding:"14px 16px" }}>
      {/* Gesamtfortschritt */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"14px 16px", marginBottom:14, boxShadow:"0 1px 6px rgba(0,0,0,.04)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <div>
            <p style={{ fontSize:14, fontWeight:700, color:C.text }}>Your Progress</p>
            <p style={{ fontSize:11, color:C.muted, marginTop:2 }}>{totalDone} von {totalsteps} stepsn erledigt</p>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:20, fontWeight:700, color:C.accent }}>{pct}%</span>
            {totalDone > 0 && (
              <button onClick={() => {
                setDone({});
                try { localStorage.removeItem("mystorija_anleitungen"); } catch {}
              }} style={{ fontSize:11, color:C.muted, background:"none", border:`1px solid ${C.border}`, borderRadius:20, padding:"3px 8px", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                Reset
              </button>
            )}
          </div>
        </div>
        <div style={{ height:8, background:C.border, borderRadius:4, overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${pct}%`, background:`linear-gradient(to right, ${C.accent}, #E8855A)`, borderRadius:4, transition:"width 0.4s" }} />
        </div>
        {pct === 100 && (
          <p style={{ fontSize:12, color:C.green, fontWeight:600, marginTop:8, textAlign:"center" }}>🎉 Alle Anleitungen abgeschlossen – du bist ein Profi!</p>
        )}
      </div>

      <p style={{ fontSize:12, color:C.muted, marginBottom:14, fontStyle:"italic" }}>
        Tap a guide → check off steps as you work. Progress is saved.
      </p>
      {ANLEITUNGEN.map(a => {
        const done = a.schritte.filter((_,i) => erledigt[`${a.id}-${i}`]).length;
        const isOpen = offen === a.id;
        return (
          <div key={a.id} style={{ background:C.card, borderRadius:14, marginBottom:10, border:`1px solid ${isOpen ? C.accent+"66" : C.border}`, boxShadow:isOpen?`0 2px 16px ${C.accent}18`:"0 1px 4px rgba(0,0,0,.04)", overflow:"hidden" }}>
            <button onClick={() => setOpen(isOpen ? null : a.id)} style={{ width:"100%", padding:"13px 14px", background:"transparent", border:"none", display:"flex", alignItems:"center", gap:12, cursor:"pointer" }}>
              <div style={{ width:52, height:52, borderRadius:10, overflow:"hidden", flexShrink:0, border:`1px solid ${C.border}` }}>
                <img src={a.img} alt={a.titel} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
              </div>
              <div style={{ flex:1, textAlign:"left" }}>
                <div style={{ fontSize:15, color:C.text, fontWeight:600 }}>{a.emoji} {a.titel}</div>
                <div style={{ display:"flex", gap:7, marginTop:5, flexWrap:"wrap" }}>
                  <Pill bg={a.schwierigkeit==="Leicht"?C.greenBg:C.accentBg} color={a.schwierigkeit==="Leicht"?C.green:C.accent}>{a.schwierigkeit}</Pill>
                  <Pill bg="#EBF2FA" color="#2A6DB5">⏱ {a.zeit}</Pill>
                  <Pill bg={C.greenBg} color={C.green}>💶 {a.kosten}</Pill>
                </div>
              </div>
              {done > 0 && <div style={{ fontSize:12, color:C.green, fontWeight:600, flexShrink:0 }}>{done}/{a.schritte.length}</div>}
              <span style={{ fontSize:20, color:C.muted, transform:isOpen?"rotate(90deg)":"none", transition:"transform .2s", flexShrink:0 }}>›</span>
            </button>
            {isOpen && (
              <div style={{ padding:"0 14px 16px" }}>
                <div style={{ background:C.accentBg, border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 13px", marginBottom:14 }}>
                  <div style={{ fontSize:11, color:C.accent, fontWeight:600, marginBottom:8, textTransform:"uppercase", letterSpacing:.5 }}>🔨 Werkzeug & Material</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                    {a.werkzeug.map(w => <span key={w} style={{ fontSize:12, padding:"3px 10px", background:C.card, color:C.text, borderRadius:20, border:`1px solid ${C.border}` }}>{w}</span>)}
                  </div>
                </div>
                <div style={{ fontSize:11, color:C.accent, fontWeight:600, marginBottom:10, textTransform:"uppercase", letterSpacing:.5 }}>📋 Step fuer Schritt</div>
                {a.schritte.map((s, idx) => {
                  const key = `${a.id}-${idx}`, d = erledigt[key];
                  return (
                    <div key={idx} onClick={() => toggleSchritt(`${a.id}-${idx}`)} style={{ display:"flex", gap:10, padding:"9px 11px", borderRadius:9, marginBottom:4, cursor:"pointer", background:d?C.greenBg:C.accentBg+"44", border:`1px solid ${d?C.green+"44":C.border}` }}>
                      <div style={{ width:24, height:24, borderRadius:"50%", flexShrink:0, border:`2px solid ${d?C.green:C.border}`, background:d?C.green:"transparent", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, color:d?"#fff":C.muted, fontWeight:700 }}>{d?"✓":idx+1}</div>
                      <span style={{ fontSize:13, color:d?C.muted:C.text, textDecoration:d?"line-through":"none", lineHeight:1.5 }}>{s}</span>
                    </div>
                  );
                })}
                <div style={{ background:C.accentBg, border:`1px solid ${C.accent}33`, borderRadius:10, padding:"11px 13px", marginTop:10 }}>
                  <div style={{ fontSize:11, color:C.accent, fontWeight:600, marginBottom:4 }}>💡 Profi-Tipp</div>
                  <p style={{ fontSize:13, color:C.text, lineHeight:1.6 }}>{a.tipp}</p>
                </div>
                <div style={{ background:"#FDEEEC", border:"1px solid #F5D0D0", borderRadius:10, padding:"11px 13px", marginTop:8 }}>
                  <div style={{ fontSize:11, color:"#C0392B", fontWeight:600, marginBottom:4 }}>⚠️ Haeufige Fehler</div>
                  <p style={{ fontSize:13, color:C.muted, lineHeight:1.6 }}>{a.fehler}</p>
                </div>
                <div style={{ display:"flex", gap:8, marginTop:10 }}>
                  <a href={a.youtube} target="_blank" rel="noopener noreferrer" style={{ flex:1, textAlign:"center", padding:"9px", borderRadius:9, background:"#FDEEEC", color:"#C0392B", fontSize:12, textDecoration:"none", fontWeight:600, border:"1px solid #F5D0D033" }}>▶ Video</a>
                  <a href={a.amazon?.amzn || a.amazon} target="_blank" rel="noopener noreferrer" style={{ flex:1, textAlign:"center", padding:"9px", borderRadius:9, background:"#FFF8E7", color:"#B7791F", fontSize:12, textDecoration:"none", fontWeight:600, border:"1px solid #F6E05E44" }}>Amazon</a>
                  <a href={a.amazon?.obi} target="_blank" rel="noopener noreferrer" style={{ flex:1, textAlign:"center", padding:"9px", borderRadius:9, background:"#EBFAF0", color:"#276749", fontSize:12, textDecoration:"none", fontWeight:600, border:"1px solid #C6F6D544" }}>OBI</a>
                  <a href={a.amazon?.hb} target="_blank" rel="noopener noreferrer" style={{ flex:1, textAlign:"center", padding:"9px", borderRadius:9, background:C.accentBg, color:C.accent, fontSize:12, textDecoration:"none", fontWeight:600, border:`1px solid ${C.accent}33` }}>Hornbach</a>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}


// ─── OFFLINE EXPERTEN-SYSTEM ─────────────────────────────────────────────────
function getRenovierungsAntwort(text, hasImage) {
  const t = text.toLowerCase();
  if (hasImage) return "Tolles Foto! 📸\n\nIch sehe deinen Raum. Hier sind meine ersten Einschaetzungen:\n\n🔍 **Was ich empfehle:**\n\n1. **Sofort-Upgrade (unter 50€):** Neue Griffe, frisches Silikon, LED-Leuchte – kleine Aenderungen, grosse Wirkung.\n\n2. **Mittel-Projekt (unter 300€):** Waende streichen, Vinyl-Boden ueber alte Fliesen, Spiegel tauschen.\n\n3. **Komplett-Upgrade (unter 1.000€):** Mikrozement, neue Armaturen, abgehaengte Decke mit LED.\n\n💡 Schreib mir was du aendern moechtest – Boden, Wand, Decke oder Deko – und ich gebe dir einen konkreten Plan!";
  if (t.match(/hallo|hi|hey|guten|servus/)) return "Hey! 👋 Schoen dass du da bist!\n\nIch bin dein Mystorija – dein DIY-Experte fuer Renovierungen.\n\n**Was kann ich fuer dich tun?**\n\n🚿 Bad renovieren\n🍳 Kueche aufwerten\n🛋️ Wohnzimmer gestalten\n🛏️ Schlafzimmer umgestalten\n🌿 Terrasse/Balkon\n\nLade ein Foto hoch oder schreib mir welchen Raum du renovieren moechtest!";
  if (t.match(/silikon|fuge|schimmel/)) return "Silikon erneuern – einer der guenstigsten und wirkungsvollsten Upgrades! 🛠️\n\n**Was du brauchst:**\n• Bad-Silikon mit Schimmelschutz: Soudal oder Ottoseal (ca. 8€)\n• Silikon-Entferner (ca. 5€)\n• Cutter-Messer\n• Fugenglaetter oder feuchter Finger\n\n**Step fuer Schritt:**\n1. Altes Silikon mit Cutter einschneiden\n2. Silikon-Entferner auftragen, 30 Min warten\n3. Reste abziehen, Flaeche entfetten\n4. Masking tape links und rechts\n5. Silikon gleichmaessig auftragen\n6. Mit feuchtem Finger glattziehen\n7. Band sofort abziehen, 24h trocknen lassen\n\n⏱️ Zeit: 2 hours\n💰 Kosten: ca. 15€\n⭐ Schwierigkeit: Anfaenger";
  if (t.match(/vinyl|laminat|boden verlegen|klick/)) return "Boden verlegen – machst du selbst! 💪\n\n**SPC-Vinyl (fuer Bad & Kueche):**\n• 100% wasserfest, ueber alte Fliesen moeglich\n• Kosten: 15–25€/m² bei OBI/Bauhaus\n• Kein Kleber noetig – Klicksystem\n\n**Step fuer Schritt:**\n1. Untergrund pruefen – max. 3mm Unebenheit\n2. Schaumunterlage auslegen\n3. Erste Reihe mit 10mm Abstand zur Wand\n4. Reihe fuer Reihe einrasten\n5. Letzte Reihe zuschneiden\n6. Sockelleisten kleben\n\n⏱️ Zeit: 1 day fuer 20m²\n💰 Kosten: ab 15€/m²\n⭐ Schwierigkeit: Anfaenger";
  if (t.match(/bad|badezimmer|dusche|wc|toilette|waschtisch/)) return "Badezimmer renovieren – hier ist mein Plan! 🚿\n\n**Budget 50–150€ (Sofort-Upgrades):**\n• Silikon komplett erneuern (Soudal Bad-Silikon)\n• LED-Spiegel mit IP44: Emke Amazon ab 80€\n• Mattschwarz-Accessoires Set: ~40€\n\n**Budget 150–500€:**\n• Armaturen auf Mattschwarz tauschen\n• SPC-Vinyl ueber alte Fliesen legen\n• Stauraum ueber WC montieren\n\n**Budget 500–2.000€:**\n• Mikrozement ueber Fliesen (kein Stemmen!)\n• Walk-In Dusche einbauen\n• Waschtisch komplett tauschen\n\n⚠️ Wichtig: Immer Bad-Silikon mit Schimmelschutz! IP44 bei Lampen Pflicht!";
  if (t.match(/kueche|kueche|fronten|schrank|arbeitsplatte|griffe/)) return "Kueche aufwerten – top Investition! 🍳\n\n🔩 **Griffe tauschen (30 min, 30–80€)**\n→ 128mm Buegel Mattschwarz auf Amazon.\n\n🎨 **Fronten folieren (1–2 days, 80–200€)**\n→ Klebefolie Holz/Beton/Marmor-Optik. Reversibel fuer Mietwohnung!\n→ Wichtig: erst entfetten mit Aceton!\n\n🖌️ **Fronten lackieren (2–3 days, 100–300€)**\n→ Schleifen (P120) → Haftgrund → 3× Seidenmatt-Lack\n→ RAL 7044 Seidengrau oder RAL 5011 Navy = Trend 2025\n\n💡 LED-Strip unter Oberschraenken: 20–60€, 2700K warm!";
  if (t.match(/wohnzimmer|wand streichen|akzent|farbe|streichen/)) return "Wand streichen – einfachstes Upgrade mit groesster Wirkung! 🎨\n\n**Die Akzentwand:**\nNur EINE Wand dunkel streichen → sofort anderer Raum!\n\n**Aktuelle Trendfarben 2025:**\n• Dunkelgruen (RAL 6009)\n• Navy Blau (RAL 5011)\n• Anthrazit (RAL 7016)\n• Terrakotta (RAL 3012)\n\n**Step fuer Schritt:**\n1. Wand abkleben (Tesa Precision!)\n2. Testfeld 30×30cm malen – trocknen lassen!\n3. Tiefengrund auftragen\n4. 2 Schichten Farbe (Rolle 18cm)\n5. Klebeband feucht abziehen\n\n💰 Kosten: 30–60€ · ⏱️ Zeit: 1 day";
  if (t.match(/licht|lampe|led|beleuchtung|hell|dunkel|atmosphaere/)) return "Beleuchtung – groesster Stimmungsmacher! 💡\n\n**Die wichtigste Regel:**\n2700K = warm = Wohnzimmer/Schlafzimmer/Bad\n4000K = neutral = Kueche/Arbeitszimmer\n6000K = kalt = NIE im Wohnbereich!\n\n**Guenstige Upgrades:**\n• LED-Strips hinter TV: 20–50€\n• LED-Strip unter Kuechenschraenken: 20–60€\n• Nachttischlampen statt Deckenlampe: 40–120€\n\n**Badezimmer:**\n⚠️ IP44 Pflicht! Immer auf Verpackung pruefen!\n\n💡 Dimmer einbauen: 15–30€ bei OBI – lohnt sich ueberall!";
  if (t.match(/mietwohnung|miete|vermieter|erlaubt/)) return "Mietwohnung renovieren – was ist erlaubt? 🔑\n\n**Ohne Genehmigung erlaubt:**\n✓ Streichen (beim Auszug zurueckstreichen)\n✓ Moebel aufstellen, Regale montieren\n✓ Klebefolie auf Fliesen/Fronten (reversibel!)\n✓ Griffe tauschen (Original aufbewahren!)\n✓ LED-Spiegel (Stecker-Anschluss)\n✓ Klick-Bodenbelag ohne Kleber\n\n**NIE ohne Genehmigung:**\n❌ Elektro-Festinstallation\n❌ Tragende Waende veraendern\n❌ Gasleitungen\n\n💡 Alles Original-Material aufbewahren!";
  return "Super Frage! 💪 Als Renovation Expert helfe ich dir gerne.\n\nSchreib mir mehr Details:\n• **Welchen Raum** moechtest du renovieren?\n• **Was stoert dich** am meisten?\n• **Wie viel Budget** hast du ungefaehr?\n\nOder lade ein Foto hoch – dann sehe ich direkt was moeglich ist!";
}

// ─── AFFILIATE Renderer ───────────────────────────────────────────────────────
function ShopLinks({ text, fullBlock }) {
  // Parse markdown links from this line OR fullBlock
  const src = fullBlock || text;
  const links = [];
  const regex = /\[([^\]]+)\]\((https?:[^)]+)\)/g;
  let m;
  while ((m = regex.exec(src)) !== null) {
    links.push({ label: m[1], url: m[2] });
  }
  if (links.length === 0) return null;

  const COLORS = {
    'Amazon':   { bg:'#FFF8E7', color:'#B7791F' },
    'OBI':      { bg:'#E8F5E9', color:'#2E7D32' },
    'Bauhaus':  { bg:'#E3F2FD', color:'#1565C0' },
    'Hornbach': { bg:C.accentBg, color:C.accent },
  };

  return (
    <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginTop:4 }}>
      {links.map((l, i) => {
        const col = COLORS[l.label] || { bg:C.tag, color:C.muted };
        return (
          <a key={i} href={l.url} target="_blank" rel="noopener noreferrer"
            style={{ fontSize:10, fontWeight:700, padding:'3px 9px', borderRadius:20,
              background:col.bg, color:col.color, textDecoration:'none', border:`1px solid ${col.color}22` }}>
            {l.label} →
          </a>
        );
      })}
    </div>
  );
}

function BoldText({ text }) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return <span>{parts.map((part, j) => j % 2 === 1 ? <strong key={j} style={{ color:C.text, fontWeight:700 }}>{part}</strong> : <span key={j}>{part}</span>)}</span>;
}

function renderMaterialien(text) {
  if (!text) return null;
  const lines = text.split("\n").filter(l => l.trim());
  const pairs = [];

  // Paare bilden: Textzeile + folgende Link-Zeile
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith('[') && line.includes('](http')) continue; // Link-Zeile ueberspringen
    const nextLine = lines[i + 1] || "";
    const linkLine = nextLine.trim().startsWith('[') && nextLine.includes('](http') ? nextLine : "";
    pairs.push({ text: line, links: linkLine });
  }

  if (pairs.length === 0) return null;
  return (
    <>
      {pairs.map((p, i) => (
        <div key={i} style={{ padding:"9px 0", borderBottom:`1px solid ${C.border}` }}>
          <p style={{ fontSize:13, color:C.text, lineHeight:1.6, marginBottom:4 }}>
            <BoldText text={p.text} />
          </p>
          {p.links ? (
            <ShopLinks text={p.text} fullBlock={p.links} />
          ) : (
            <ShopLinks text={p.text} />
          )}
        </div>
      ))}
      <p style={{ fontSize:11, color:C.muted, marginTop:8, fontStyle:"italic" }}>
        💾 Save → Links im Planer klickbar
      </p>
      <Analytics />
    </>
  );
}

// ─── STILE FUeR MAKEOVER ───────────────────────────────────────────────────────
const STILE_MAKEOVER = [
  { id:"bad-modern",    emoji:"🚿", label:"Bad: Modern & Spa" },
  { id:"bad-warm",      emoji:"🚿", label:"Bad: Hell & Warm" },
  { id:"bad-mikro",     emoji:"🚿", label:"Bad: Mikrozement" },
  { id:"kueche-navy",   emoji:"🍳", label:"Kitchen: Navy & Wood" },
  { id:"kueche-grau",   emoji:"🍳", label:"Kitchen: Silk Grey" },
  { id:"kueche-gruen",  emoji:"🍳", label:"Kueche: Salbeigruen" },
  { id:"wohn-gruen",    emoji:"🛋️", label:"Wohnzimmer: Gruen" },
  { id:"wohn-terra",    emoji:"🛋️", label:"Wohnzimmer: Terrakotta" },
  { id:"schlaf-terra",  emoji:"🛏️", label:"Schlafzimmer: Terrakotta" },
  { id:"schlaf-dunkel", emoji:"🛏️", label:"Schlafzimmer: Dunkel" },
  { id:"terrasse-wpc",  emoji:"🌿", label:"Terrasse: WPC & Lounge" },
];

function compressImageFile(file) {
  return new Promise(function(resolve) {
    var img = new Image();
    img.onload = function() {
      var canvas = document.createElement("canvas");
      var max = 1024, w = img.width, h = img.height;
      if (w > h && w > max) { h = Math.round(h * max / w); w = max; }
      else if (h > max) { w = Math.round(w * max / h); h = max; }
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      canvas.toBlob(function(blob) {
        var reader = new FileReader();
        reader.onload = function() { resolve(reader.result.split(",")[1]); };
        reader.readAsDataURL(blob);
      }, "image/jpeg", 0.85);
    };
    img.src = URL.createObjectURL(file);
  });
}

// ─── TIPPS BOX ────────────────────────────────────────────────────────────────
function TippsBox() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("tipps"); // "tipps" | "vorlage"

  const TIPPS = [
    { icon:"🔄", titel:"Objekte ersetzen", gut:"Keine Badewanne, dafuer eine Walk-In Dusche mit Regendusche", schlecht:"Dusche", erklaerung:"Sag was weg soll UND was kommen soll. 'Dafuer', 'stattdessen', 'anstatt' helfen der KI." },
    { icon:"🎨", titel:"Farben & Materialien", gut:"Anthrazit-Feinsteinzeug 80x80cm, weisse Fugen, Eichenholz-Waschtisch", schlecht:"Andere Farben", erklaerung:"Nenne konkrete Farbnamen und Materialien: Anthrazit, Navy, Terrakotta, Marmor, Eiche, Mikrozement, Zellige." },
    { icon:"🌿", titel:"Terrasse & Aussen", gut:"Fuege Grill hinzu, Pergola mit Rankpflanzen, Olivenbaum in Terrakotta-Topf, Lichterketten", schlecht:"Schoener machen", erklaerung:"Fuer Terrassen: Moebel, Pflanzen, Beleuchtung und Bodenbelag separat nennen. Je mehr Details, desto besser." },
    { icon:"💡", titel:"Stil beschreiben", gut:"Modernes Spa-Bad mit indirektem Licht, mattschwarz Armaturen, Holzakzente", schlecht:"Modern", erklaerung:"Stile: Modern, Skandinavisch, Industrial, Japandi, Mediterran, Luxus, Minimalist, Rustikal." },
    { icon:"📐", titel:"Mehreres kombinieren", gut:"Dunkle Fliesen, keine Badewanne dafuer Dusche, schwarze Armaturen, Wandnische", schlecht:"Alles neu", erklaerung:"Mehrere Aenderungen mit Komma trennen – die KI arbeitet alle ab." },
    { icon:"⚠️", titel:"Was KI schwer kann", gut:"Darker tiles, Farbe aendern, Moebel hinzufuegen", schlecht:"Waende verschieben, Fenster vergroessern", erklaerung:"Farben, Materialien & Moebel hinzufuegen klappt gut. Strukturelle Aenderungen (Waende, Fenster) sind KI-schwierig." },
  ];

  const VORLAGEN = [
    {
      raum: "🚿 Bad", beispiel: "Keine Badewanne, dafuer eine bodengleiche Walk-In Dusche mit Regendusche. Dunkle Anthrazit-Fliesen 80x80cm, mattschwarz Armaturen, schwebender Eichen-Waschtisch, LED-Spiegel.",
    },
    {
      raum: "🍳 Kueche", beispiel: "Navy-blaue Fronten, Messing-Griffe, offene Eichenregale statt Haengeschraenke, weisse Zellige-Fliesen als Rueckwand, LED-Strip unter den Oberschraenken.",
    },
    {
      raum: "🛋️ Wohnzimmer", beispiel: "Dunkelgruene Akzentwand hinter dem Sofa, warmes indirektes Deckenlicht, gerillte Holzpaneele hinter dem TV, bouclé-Sofa, Terrakotta-Vasen.",
    },
    {
      raum: "🌿 Terrasse", beispiel: "Grossformatige Aussenfliesen 60x60cm grau, Lounge-Sofa mit cremefarbenen Outdoor-Kissen, Esstisch mit weissen Stuehlen, Pergola mit Rankpflanzen, Olivenbaum in Terrakotta-Topf, Lichterketten, Grill rechts hinten.",
    },
    {
      raum: "🏡 Terrasse modern", beispiel: "WPC-Dielen in Teak-Optik, modulare Lounge-Gruppe, Sichtschutz aus Holzlatten, Aussenkueche mit Grill eingebaut, grosse Terrakotta-Toepfe mit Lavendel und Olivenbaum, Solar-Lichterketten 2200K.",
    },
  ];

  return (
    <div style={{ marginTop:8 }}>
      <button onClick={() => setOpen(o => !o)} style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", cursor:"pointer", padding:0, fontFamily:"'DM Sans',sans-serif" }}>
        <span style={{ fontSize:12, color:C.accent, fontWeight:600 }}>💡 Tips & Templates for better results</span>
        <span style={{ fontSize:12, color:C.muted, transform:open?"rotate(90deg)":"none", transition:"0.2s", display:"inline-block" }}>›</span>
      </button>

      {open && (
        <div className="fu" style={{ marginTop:10, background:C.accentBg, border:`1px solid ${C.accent}33`, borderRadius:12, overflow:"hidden" }}>
          {/* Tab-Switcher */}
          <div style={{ display:"flex", borderBottom:`1px solid ${C.accent}33` }}>
            {[["tipps","💡 Tipps"],["vorlage","📋 Vorlagen"]].map(([id,label]) => (
              <button key={id} onClick={() => setTab(id)} style={{ flex:1, padding:"9px", background:tab===id?"white":"transparent", border:"none", borderBottom:`2px solid ${tab===id?C.accent:"transparent"}`, color:tab===id?C.accent:C.muted, fontSize:12, fontWeight:tab===id?700:400, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>{label}</button>
            ))}
          </div>

          {tab === "tipps" && (
            <div style={{ padding:"12px", display:"flex", flexDirection:"column", gap:10 }}>
              <p style={{ fontSize:12, fontWeight:700, color:C.accent }}>How to get the best AI makeovers:</p>
              {TIPPS.map((t, i) => (
                <div key={i} style={{ background:"white", borderRadius:10, padding:"11px 13px" }}>
                  <p style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:6 }}>{t.icon} {t.titel}</p>
                  <div style={{ display:"flex", gap:6, alignItems:"flex-start", marginBottom:5 }}>
                    <span style={{ fontSize:10, background:C.greenBg, color:C.green, padding:"2px 7px", borderRadius:20, fontWeight:700, flexShrink:0, marginTop:1 }}>✓</span>
                    <span style={{ fontSize:12, color:C.text, lineHeight:1.4 }}>"{t.gut}"</span>
                  </div>
                  <div style={{ display:"flex", gap:6, alignItems:"flex-start", marginBottom:6 }}>
                    <span style={{ fontSize:10, background:"#FEF2F2", color:"#B91C1C", padding:"2px 7px", borderRadius:20, fontWeight:700, flexShrink:0, marginTop:1 }}>✗</span>
                    <span style={{ fontSize:12, color:C.muted, lineHeight:1.4 }}>"{t.schlecht}"</span>
                  </div>
                  <p style={{ fontSize:11, color:C.muted, lineHeight:1.5, borderTop:`1px solid ${C.border}`, paddingTop:6 }}>{t.erklaerung}</p>
                </div>
              ))}
            </div>
          )}

          {tab === "vorlage" && (
            <div style={{ padding:"12px", display:"flex", flexDirection:"column", gap:8 }}>
              <p style={{ fontSize:12, fontWeight:700, color:C.accent, marginBottom:4 }}>Tippe auf eine Vorlage um sie zu verwenden:</p>
              {VORLAGEN.map((v, i) => (
                <div key={i} style={{ background:"white", borderRadius:10, padding:"11px 13px", cursor:"pointer", border:`1px solid ${C.border}` }}
                  onClick={() => {
                    // Find parent MakeoverTab's setWunsch via a custom event
                    window.dispatchEvent(new CustomEvent("mystorija_set_wunsch", { detail: v.beispiel }));
                    setOpen(false);
                  }}>
                  <p style={{ fontSize:13, fontWeight:700, color:C.accent, marginBottom:5 }}>{v.raum}</p>
                  <p style={{ fontSize:12, color:C.text, lineHeight:1.55 }}>"{v.beispiel}"</p>
                  <p style={{ fontSize:11, color:C.green, marginTop:6, fontWeight:600 }}>↑ Tippen zum Einfuegen</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── MAKEOVER TAB (aus altem Chat – vollstaendig) ──────────────────────────────
function MakeoverTab({ lang = "de", onSaveToPlaner, savedMakeovers, plan, canGenerate, freeUsed, onNeedUpgrade, onGenerated }) {
  var fileRef = useRef();
  const [file, setFile] = useState(null);
  const [vorherUrl, setVorherUrl] = useState(null);
  const [nachherUrl, setNachherUrl] = useState(null);
  const [materials, setMaterials] = useState(null);
  const [stil, setStil] = useState("bad-modern");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [wunsch, setWunsch] = useState("");
  
  const [saved, setSaved] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewingHistory, setViewingHistory] = useState(null);
  const [isObjReplace, setIsObjReplace] = useState(false);
  const [nachherBase64, setNachherBase64] = useState(null); // gespeicherte base64 fuer Refinement
  const [laenge, setLaenge] = useState("");
  const [breite, setWidth] = useState("");
  const [hoehe, setHoehe] = useState("");

  // Vorlage aus TippsBox einfuegen
  useEffect(() => {
    const handler = (e) => setWunsch(e.detail);
    window.addEventListener("mystorija_set_wunsch", handler);
    return () => window.removeEventListener("mystorija_set_wunsch", handler);
  }, []);
  const [makoverAnalyse, setMakoverAnalyse] = useState(null);
  const [makoverAnalyseLoading, setMakoverAnalyseLoading] = useState(false);
  const [refining, setRefining] = useState(false);
  const [refinementInput, setRefinementInput] = useState("");
  const [refinementHistory, setRefinementHistory] = useState([]);

  // Monatliches Limit tracken
  const LIMITS = { free: 0, basic: 50, pro: Infinity };
  const currentLimit = LIMITS[plan] ?? LIMITS.free;
  const isFreeBlocked = !plan || plan === "free";

  function getMonthlyUsage() {
    try {
      const key = `mystorija_usage_${new Date().getFullYear()}_${new Date().getMonth()}`;
      return parseInt(localStorage.getItem(key) || "0");
    } catch { return 0; }
  }

  function incrementMonthlyUsage() {
    try {
      const key = `mystorija_usage_${new Date().getFullYear()}_${new Date().getMonth()}`;
      localStorage.setItem(key, String(getMonthlyUsage() + 1));
    } catch {}
  }

  const monthlyUsage = getMonthlyUsage();
  const isLimitReached = monthlyUsage >= currentLimit;

  function handleDatei(e) {
    const f = e.target.files[0]; if (!f) return;
    setFile(f); setVorherUrl(URL.createObjectURL(f));
    setNachherUrl(null); setMaterials(null); setError(null); setSaved(false); setViewingHistory(null);
  }

  async function refineMakeover() {
    if (!refinementInput.trim() || !nachherUrl) return;
    const instruction = refinementInput;
    setRefinementInput("");
    setRefining(true);
    setRefinementHistory(prev => [...prev, { url: nachherUrl, instruction }]);

    try {
      const base64 = nachherBase64;
      if (!base64) {
        setError("Bild nicht mehr verfuegbar – bitte neu generieren.");
        setRefining(false);
        return;
      }

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64,
          style: stil,
          chatContext: instruction,
          plan: plan||"free",
          dimensions: (laenge && breite) ? { laenge, breite, hoehe: hoehe||"2.4" } : null,
        }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Server Fehler ${res.status}: ${txt.slice(0, 100)}`);
      }
      const data = await res.json();

      if (data.imageUrl) {
        setNachherUrl(data.imageUrl);
        if (data.materials) setMaterials(data.materials);
        setSaved(false);
        // Base64 direkt vom Server speichern
        setNachherBase64(data.imageBase64 || null);
      } else {
        setError(data.error || "Fehler beim Verfeinern.");
      }
    } catch (err) {
      setError(err.message);
    }
    setRefining(false);
  }

  function generieren() {
    if (!file) return;
    if (isFreeBlocked) {
      if (onNeedUpgrade) onNeedUpgrade();
      return;
    }
    if (isLimitReached && plan !== "pro") {
      setError(`Monthly limit reached (${currentLimit} Makeovers). Upgrade auf Pro fuer unbegrenzte Generierungen.`);
      if (onNeedUpgrade) onNeedUpgrade();
      return;
    }
    setViewingHistory(null); setLoading(true); setNachherUrl(null); setMaterials(null);
    setError(null); setProgress(0); setSaved(false); setNachherBase64(null);
    const timer = setInterval(() => setProgress(p => p < 85 ? p + 2 : p), 600);

    (async () => {
      try {
        const base64 = await compressImageFile(file);
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: base64,
            style: stil,
            chatContext: wunsch||null,
            plan: plan||"free",
            dimensions: (laenge && breite) ? { laenge, breite, hoehe: hoehe||"2.4" } : null,
          }),
        });
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`Server Fehler ${res.status}: ${txt.slice(0, 100)}`);
        }
        const data = await res.json();
        clearInterval(timer);
        if (data.error) { setError(data.error); setLoading(false); return; }
        setProgress(100);
        setNachherUrl(data.imageUrl);
        setMaterials(data.materials || null);
        setIsObjReplace(!!data.isObjectReplacement);
        setLoading(false);
        if (onGenerated) onGenerated();
        // Base64 direkt vom Server (kein CORS-Problem)
        setNachherBase64(data.imageBase64 || null);
        incrementMonthlyUsage(); // Monatszaehler erhoehen
        // Automatisch analysieren was generiert wurde
        if (data.imageBase64) {
          setMakoverAnalyse(null);
          setMakoverAnalyseLoading(true);
          fetch("/api/analyse", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64: data.imageBase64, mimeType: "image/jpeg" }),
          }).then(r => r.json()).then(d => {
            if (d.analysis) setMakoverAnalyse(d.analysis);
          }).catch(() => {}).finally(() => setMakoverAnalyseLoading(false));
        }
      } catch (err) {
        clearInterval(timer);
        setError(err.message);
        setLoading(false);
      }
    })();
  }

  function handleSaveToPlaner() {
    if (!nachherUrl) return;
    const m = {
      id: Date.now(),
      date: new Date().toLocaleDateString("de-DE"),
      time: new Date().toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"}),
      titel: wunsch ? wunsch.slice(0,40) : (makoverAnalyse?.stil || "Makeover"),
      vorherUrl, imgUrl: nachherUrl,
      materials: makoverAnalyse
        ? buildMaterialsFromAnalyse(makoverAnalyse)  // KI-erkannte Materialien bevorzugen
        : materials,
      wunsch,
      analyse: makoverAnalyse || null,  // komplette Analyse speichern
    };
    onSaveToPlaner(m); setSaved(true);
  }

  // KI-Analyse in Materialien-Text umwandeln fuer Shopping list
  function buildMaterialsFromAnalyse(analyse) {
    if (!analyse?.materialien?.length) return materials;
    return analyse.materialien.map(mat => {
      const amazonLink = mat.amazon
        ? ` [Amazon →](https://www.amazon.de/s?k=${encodeURIComponent(mat.amazon)}&tag=mystorija-21)`
        : "";
      const preis = mat.preis ? ` · Ca. ${mat.preis}` : "";
      return `🪨 **${mat.material}** – ${mat.bereich}${mat.farbe ? `, ${mat.farbe}` : ""}${preis}.${amazonLink}`;
    }).join("\n");
  }

  function neuesMakeover() {
    setFile(null); setVorherUrl(null); setNachherUrl(null); setMaterials(null);
    setError(null); setSaved(false); setWunsch(""); setViewingHistory(null);
    setMakoverAnalyse(null); setMakoverAnalyseLoading(false); setRefinementHistory([]);
  }

  return (
    <div style={{ display:"flex", height:"100%", overflow:"hidden" }}>
      {/* Sidebar */}
      {sidebarOpen && (
        <div style={{ width:220, borderRight:`1px solid ${C.border}`, background:C.card, overflowY:"auto", flexShrink:0, display:"flex", flexDirection:"column" }}>
          <div style={{ padding:"12px 12px 8px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <p style={{ fontSize:13, fontWeight:700, color:C.text }}>Meine Makeovers</p>
            <button onClick={() => setSidebarOpen(false)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:16, color:C.muted }}>✕</button>
          </div>
          <button onClick={() => { neuesMakeover(); setSidebarOpen(false); }} style={{ margin:"8px", padding:"8px 12px", borderRadius:8, background:C.accent, color:"white", border:"none", cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>+ Neues Makeover</button>
          <div style={{ flex:1, overflowY:"auto", padding:"0 8px 8px" }}>
            {(!savedMakeovers||savedMakeovers.length===0) ? (
              <p style={{ fontSize:12, color:C.muted, textAlign:"center", padding:"20px 8px" }}>Noch keine gespeicherten Makeovers</p>
            ) : savedMakeovers.map(m => (
              <div key={m.id} onClick={() => { setViewingHistory(m); setSidebarOpen(false); }} style={{ borderRadius:8, overflow:"hidden", marginBottom:8, cursor:"pointer", border:`2px solid ${viewingHistory?.id===m.id?C.accent:C.border}`, background:C.bg }}>
                {m.imgUrl && <img src={m.imgUrl} alt="" style={{ width:"100%", height:70, objectFit:"cover", display:"block" }} />}
                <div style={{ padding:"6px 8px" }}>
                  <p style={{ fontSize:11, fontWeight:600, color:C.text }}>{m.titel}</p>
                  <p style={{ fontSize:10, color:C.muted }}>{m.date} {m.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main */}
      <div style={{ flex:1, overflowY:"auto", padding:"14px 16px 40px" }}>
        {/* Top Bar */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
          <div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:20 }}>KI Makeover</h2>
            {plan !== "pro" && (
              <p style={{ fontSize:11, fontWeight:600, marginTop:2, color: isFreeBlocked ? "#B91C1C" : isLimitReached ? "#B91C1C" : C.muted }}>
                {isFreeBlocked ? "🔒 Basic plan required" : isLimitReached ? "🔒 Limit reached" : `${monthlyUsage} / ${currentLimit} diesen Monat`}
              </p>
            )}
          </div>
          <div style={{ display:"flex", gap:8 }}>
            {(nachherUrl||viewingHistory) && <button onClick={neuesMakeover} style={{ padding:"7px 14px", borderRadius:20, border:`1px solid ${C.border}`, background:C.card, cursor:"pointer", fontSize:12, fontWeight:600, color:C.text, fontFamily:"'DM Sans',sans-serif" }}>+ Neu</button>}
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ padding:"7px 14px", borderRadius:20, background:sidebarOpen?C.accent:C.card, color:sidebarOpen?"white":C.text, border:`1px solid ${sidebarOpen?C.accent:C.border}`, cursor:"pointer", fontSize:12, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>
              {savedMakeovers?.length > 0 ? `${savedMakeovers.length} gespeichert` : "History"}
            </button>
          </div>
        </div>

        {viewingHistory ? (
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14, padding:"10px 14px", background:C.accentBg, borderRadius:10 }}>
              <span style={{ fontSize:13, fontWeight:600, color:C.accent }}>{viewingHistory.titel}</span>
              <span style={{ fontSize:12, color:C.muted }}>{viewingHistory.date}</span>
            </div>
            {viewingHistory.vorherUrl && <div style={{ marginBottom:10 }}><p style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:1, marginBottom:6 }}>Vorher</p><img src={viewingHistory.vorherUrl} alt="Vorher" style={{ width:"100%", borderRadius:12, maxHeight:200, objectFit:"cover" }} /></div>}
            <p style={{ fontSize:11, fontWeight:700, color:C.accent, textTransform:"uppercase", letterSpacing:1, marginBottom:6 }}>Nachher</p>
            <div style={{ borderRadius:14, overflow:"hidden", marginBottom:12, boxShadow:"0 6px 24px rgba(0,0,0,0.1)" }}>
              <img src={viewingHistory.imgUrl} alt="Nachher" style={{ width:"100%", display:"block" }} />
            </div>
            {viewingHistory.materials && (
              <div style={{ background:C.accentBg, border:`1px solid #F0C4A0`, borderRadius:12, padding:"14px" }}>
                <p style={{ fontWeight:700, fontSize:13, color:C.accent, marginBottom:8 }}>{T["de"].materials}</p>
                <div>{renderMaterialien(viewingHistory.materials)}</div>
                <p style={{ fontSize:10, color:C.muted, marginTop:6 }}>* Affiliate-Links – fuer dich keine Mehrkosten</p>
              </div>
            )}
          </div>
        ) : (
          <div>
            {/* Masse */}
            <div style={{ marginBottom:14 }}>
              <p style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:8 }}>📐 Room dimensions <span style={{ fontSize:11, fontWeight:400, color:C.muted }}>(optional, improves result)</span></p>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:11, color:C.muted, marginBottom:4 }}>Length</p>
                  <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                    <input
                      value={laenge} onChange={e => setLaenge(e.target.value.replace(/[^0-9.,]/g,""))}
                      placeholder="3,5" type="text" inputMode="decimal"
                      style={{ width:"100%", padding:"8px 10px", borderRadius:9, border:`1.5px solid ${laenge?C.accent:C.border}`, fontSize:14, fontFamily:"'DM Sans',sans-serif", background:C.bg, textAlign:"center" }}
                    />
                    <span style={{ fontSize:12, color:C.muted, flexShrink:0 }}>m</span>
                  </div>
                </div>
                <span style={{ fontSize:18, color:C.muted, marginTop:16 }}>×</span>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:11, color:C.muted, marginBottom:4 }}>Width</p>
                  <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                    <input
                      value={breite} onChange={e => setWidth(e.target.value.replace(/[^0-9.,]/g,""))}
                      placeholder="2,2" type="text" inputMode="decimal"
                      style={{ width:"100%", padding:"8px 10px", borderRadius:9, border:`1.5px solid ${breite?C.accent:C.border}`, fontSize:14, fontFamily:"'DM Sans',sans-serif", background:C.bg, textAlign:"center" }}
                    />
                    <span style={{ fontSize:12, color:C.muted, flexShrink:0 }}>m</span>
                  </div>
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:11, color:C.muted, marginBottom:4 }}>Height</p>
                  <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                    <input
                      value={hoehe} onChange={e => setHoehe(e.target.value.replace(/[^0-9.,]/g,""))}
                      placeholder="2,4" type="text" inputMode="decimal"
                      style={{ width:"100%", padding:"8px 10px", borderRadius:9, border:`1.5px solid ${hoehe?C.accent:C.border}`, fontSize:14, fontFamily:"'DM Sans',sans-serif", background:C.bg, textAlign:"center" }}
                    />
                    <span style={{ fontSize:12, color:C.muted, flexShrink:0 }}>m</span>
                  </div>
                </div>
              </div>
              {laenge && breite && (
                <p style={{ fontSize:11, color:C.green, marginTop:5, fontWeight:600 }}>
                  ✓ {(parseFloat(laenge.replace(",",".")) * parseFloat(breite.replace(",","."))).toFixed(1)} m² – wird an KI uebergeben
                </p>
              )}
            </div>

            {/* Beschreibung */}
            <div style={{ marginBottom:14 }}>
              <p style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:8 }}>✏️ What should change? <span style={{ fontSize:11, fontWeight:400, color:C.muted }}>(optional)</span></p>
              <textarea
                value={wunsch}
                onChange={e => setWunsch(e.target.value)}
                placeholder="e.g. No bathtub, add walk-in shower, dark tiles, modern style..."
                rows={3}
                style={{ width:"100%", border:`1.5px solid ${wunsch?C.accent:C.border}`, borderRadius:12, padding:"10px 13px", fontSize:13, resize:"none", fontFamily:"'DM Sans',sans-serif", background:C.bg, lineHeight:1.6 }}
              />
              {/* Tipps ausklappbar */}
              <TippsBox />
            </div>

            {/* Upload */}
            <div onClick={() => fileRef.current.click()} style={{ border:`2px dashed ${vorherUrl?C.accent:C.border}`, borderRadius:16, overflow:"hidden", padding:vorherUrl?0:"32px 20px", textAlign:"center", cursor:"pointer", background:vorherUrl?"transparent":C.card, marginBottom:12 }}>
              {vorherUrl ? <img src={vorherUrl} alt="Vorher" style={{ width:"100%", display:"block", maxHeight:260, objectFit:"cover" }} /> :
                <div><p style={{ fontSize:36, marginBottom:8 }}>📷</p><p style={{ fontWeight:600, fontSize:15, color:C.text, marginBottom:4 }}>Upload photo</p><p style={{ fontSize:13, color:C.muted }}>Bathroom, kitchen, living room...</p></div>}
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleDatei} />

            {vorherUrl && (
              <>

                {plan === "pro" && (
                  <div style={{ background:C.greenBg, border:`1px solid ${C.green}33`, borderRadius:10, padding:"6px 12px", marginBottom:8, display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ fontSize:12 }}>⭐</span>
                    <p style={{ fontSize:12, color:C.green, fontWeight:600 }}>Pro: Flux Pro Modell aktiv – hoehere Bildqualitaet</p>
                  </div>
                )}
                <button onClick={generieren} disabled={loading} style={{ width:"100%", padding:15, marginBottom:12, background:loading?"#DDD":isFreeBlocked?"#2A1A0E":"linear-gradient(135deg, #C4622D, #A0522D)", color:loading?"#999":"white", border:"none", borderRadius:50, fontSize:15, fontWeight:700, cursor:loading?"default":"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                  {loading ? T["de"].generating : isFreeBlocked ? T["de"].freePlan : T["de"].generateBtn}
                </button>
              </>
            )}

            {loading && (
              <div style={{ marginBottom:14 }}>
                <div style={{ height:5, background:C.border, borderRadius:3, overflow:"hidden", marginBottom:6 }}>
                  <div style={{ height:"100%", width:`${progress}%`, background:C.accent, borderRadius:3, transition:"width 0.6s" }} />
                </div>
                <p style={{ fontSize:12, color:C.muted, textAlign:"center" }}>
                  {progress<40?"Analysiere Bild...":progress<80?"KI generiert Makeover...":"Fast done..."}
                </p>
              </div>
            )}

            {error && <div style={{ background:"#FFF5F5", border:"1px solid #F5D0D0", borderRadius:12, padding:"12px 14px", marginBottom:14 }}><p style={{ fontSize:13, color:"#B91C1C", fontWeight:600 }}>Fehler</p><p style={{ fontSize:12, color:"#7F1D1D", marginTop:4 }}>{error}</p></div>}

            {nachherUrl && (
              <div>
                {/* Refinement History */}
                {refinementHistory.length > 0 && (
                  <div style={{ marginBottom:10 }}>
                    <p style={{ fontSize:11, color:C.muted, marginBottom:6, fontStyle:"italic" }}>History der Anpassungen:</p>
                    <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:4 }}>
                      {refinementHistory.map((h, i) => (
                        <div key={i} onClick={() => { setNachherUrl(h.url); setSaved(false); }} style={{ flexShrink:0, cursor:"pointer", borderRadius:8, overflow:"hidden", border:`2px solid ${C.border}`, width:70 }}>
                          <img src={h.url} alt="" style={{ width:"100%", height:52, objectFit:"cover", display:"block" }} />
                          <div style={{ padding:"2px 4px", background:C.bg, fontSize:9, color:C.muted, lineHeight:1.3 }}>{i+1}: {h.instruction.slice(0,15)}…</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Generated Image */}
                <div style={{ borderRadius:14, overflow:"hidden", marginBottom:10, boxShadow:"0 6px 24px rgba(0,0,0,0.1)", position:"relative" }}>
                  <img src={nachherUrl} alt="Nachher" style={{ width:"100%", display:"block", opacity:refining?0.5:1, transition:"opacity 0.3s" }} />
                  {refining && (
                    <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:10 }}>
                      <LoadingSpinner size={36} />
                      <p style={{ fontSize:13, color:C.text, fontWeight:600, background:"rgba(255,255,255,0.9)", padding:"4px 12px", borderRadius:20 }}>Verfeinere Bild…</p>
                    </div>
                  )}
                </div>

                {/* Hinweis bei Objekt-Austausch */}
                {isObjReplace && (
                  <div style={{ background:"#FFF8E1", border:"1px solid #FFD54F", borderRadius:10, padding:"10px 13px", marginBottom:10, display:"flex", gap:8 }}>
                    <span style={{ fontSize:16, flexShrink:0 }}>💡</span>
                    <div>
                      <p style={{ fontSize:12, fontWeight:700, color:"#E65100", marginBottom:2 }}>Objekt-Austausch ist KI-schwierig</p>
                      <p style={{ fontSize:11, color:"#7A4100", lineHeight:1.5 }}>KI-Bildgeneratoren koennen Materialien &amp; Farben gut aendern, aber Moebel/Sanitaer exakt ersetzen ist schwieriger. Falls das Ergebnis nicht passt: Stil-Aenderungen (Farbe, Fliesen, Licht) funktionieren besser. Mehrmals "Nochmal" druecken kann helfen.</p>
                    </div>
                  </div>
                )}

                {/* ── KI-Analyse des generierten Bildes ── */}
                {makoverAnalyseLoading && (
                  <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"14px 16px", marginBottom:10, display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ display:"flex", gap:4 }}>
                      {[0,1,2].map(j => <div key={j} style={{ width:7, height:7, borderRadius:"50%", background:C.accent, animation:`blink 1.2s ease ${j*0.2}s infinite` }} />)}
                    </div>
                    <p style={{ fontSize:13, color:C.muted }}>KI analysiert verwendete Materialien…</p>
                  </div>
                )}

                {makoverAnalyse && !makoverAnalyseLoading && (
                  <div className="fu" style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, marginBottom:10, overflow:"hidden" }}>
                    {/* Header */}
                    <div style={{ padding:"12px 14px", background:`linear-gradient(135deg, ${C.accent}18, ${C.accentBg})`, borderBottom:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div>
                        <p style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:700, color:C.text }}>{makoverAnalyse.stil}</p>
                        <p style={{ fontSize:11, color:C.muted, marginTop:2 }}>{makoverAnalyse.stimmung?.split(".")[0]}.</p>
                      </div>
                      {/* Farbpalette */}
                      <div style={{ display:"flex", gap:4 }}>
                        {makoverAnalyse.farben?.slice(0,4).map((f,i) => (
                          <div key={i} style={{ width:18, height:18, borderRadius:4, background:f, border:"1.5px solid rgba(0,0,0,0.1)" }} title={f} />
                        ))}
                      </div>
                    </div>

                    {/* Materialien */}
                    <div style={{ padding:"10px 14px 6px" }}>
                      <p style={{ fontSize:12, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:0.5, marginBottom:8 }}>Erkannte Materialien & Moebel</p>
                      {makoverAnalyse.materialien?.map((mat, i) => (
                        <div key={i} style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 0", borderBottom:i<makoverAnalyse.materialien.length-1?`1px solid ${C.border}`:"none" }}>
                          <span style={{ fontSize:10, background:C.tag, color:C.muted, padding:"2px 7px", borderRadius:20, flexShrink:0, whiteSpace:"nowrap" }}>{mat.bereich}</span>
                          <div style={{ flex:1, minWidth:0 }}>
                            <p style={{ fontSize:13, fontWeight:600, color:C.text }}>{mat.material}</p>
                            {mat.farbe && <p style={{ fontSize:11, color:C.muted }}>{mat.farbe}{mat.preis ? ` · ${mat.preis}` : ""}</p>}
                          </div>
                          {mat.amazon && (
                            <a href={`https://www.amazon.de/s?k=${encodeURIComponent(mat.amazon)}&tag=${AFFILIATE_TAG}`} target="_blank" rel="noopener noreferrer"
                              style={{ flexShrink:0, background:C.greenBg, color:C.green, borderRadius:20, padding:"4px 10px", fontSize:11, textDecoration:"none", fontWeight:700 }}>
                              🛒
                            </a>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Sofort-Upgrades */}
                    {makoverAnalyse.sofort_upgrades?.length > 0 && (
                      <div style={{ padding:"10px 14px 12px", borderTop:`1px solid ${C.border}`, background:C.greenBg }}>
                        <p style={{ fontSize:12, fontWeight:700, color:C.green, marginBottom:6 }}>💡 Guenstiger Einstieg</p>
                        {makoverAnalyse.sofort_upgrades.slice(0,2).map((up,i) => (
                          <p key={i} style={{ fontSize:12, color:"#1A4731", lineHeight:1.5, marginBottom:i<1?4:0 }}>• {up}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Refinement Chat ── */}
                <div style={{ background:C.accentBg, border:`1px solid ${C.accent}44`, borderRadius:14, padding:"12px 14px", marginBottom:10 }}>
                  <p style={{ fontSize:12, fontWeight:700, color:C.accent, marginBottom:8 }}>{T["de"].refineTitle}</p>
                  <div style={{ display:"flex", gap:8 }}>
                    <input
                      value={refinementInput}
                      onChange={e => setRefinementInput(e.target.value)}
                      onKeyDown={e => { if(e.key==="Enter") refineMakeover(); }}
                      placeholder="z.B. Darker tiles machen, Spiegel hinzufuegen…"
                      style={{ flex:1, padding:"9px 13px", borderRadius:10, border:`1px solid ${C.border}`, fontSize:13, fontFamily:"'DM Sans',sans-serif", background:"white" }}
                    />
                    <button onClick={refineMakeover} disabled={refining||!refinementInput.trim()} style={{ padding:"9px 16px", borderRadius:10, background:refining||!refinementInput.trim()?C.border:C.accent, color:"white", border:"none", cursor:"pointer", fontWeight:700, fontSize:14, flexShrink:0 }}>
                      {refining ? <LoadingSpinner size={16} /> : "→"}
                    </button>
                  </div>
                  {/* Quick suggestions */}
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:8 }}>
                    {["Darker tiles", "Warmer light", "Lighter color", "Add wood", "Larger mirror", "Black fixtures"].map(s => (
                      <button key={s} onClick={() => setRefinementInput(s)} style={{ padding:"4px 10px", borderRadius:20, border:`1px solid ${C.accent}44`, background:"white", color:C.accent, fontSize:11, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>{s}</button>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display:"flex", gap:8, marginBottom:10 }}>
                  <button onClick={() => { setNachherUrl(null); setMaterials(null); setRefinementHistory([]); generieren(); }} style={{ flex:1, padding:11, background:C.card, border:`2px solid ${C.border}`, borderRadius:50, fontSize:13, fontWeight:600, cursor:"pointer", color:C.text, fontFamily:"'DM Sans',sans-serif" }}>🔄 New</button>
                  <a href={nachherUrl} download="makeover.jpg" target="_blank" rel="noreferrer" style={{ flex:1, padding:11, background:C.accent, borderRadius:50, fontSize:13, fontWeight:600, color:"white", textDecoration:"none", textAlign:"center", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans',sans-serif" }}>💾 Save</a>
                </div>

                {materials && (
                  <div style={{ background:C.accentBg, border:"1px solid #F0C4A0", borderRadius:12, padding:"14px" }}>
                    <p style={{ fontWeight:700, fontSize:13, color:C.accent, marginBottom:8 }}>{T["de"].materials}</p>
                    <div style={{ marginBottom:12 }}>{renderMaterialien(materials)}</div>
                    <p style={{ fontSize:10, color:C.muted, marginBottom:10 }}>* Affiliate-Links – fuer dich keine Mehrkosten</p>
                    <div style={{ display:"flex", gap:8 }}>
                      <button onClick={handleSaveToPlaner} style={{ flex:1, padding:"11px", borderRadius:50, background:saved?"#4ade80":"linear-gradient(135deg, #1a1a2e, #2d2d4e)", color:"white", border:"none", cursor:saved?"default":"pointer", fontSize:12, fontWeight:700, fontFamily:"'DM Sans',sans-serif" }}>
                        {saved ? T["de"].savedBtn : T["de"].saveBtn}
                      </button>
                      <button onClick={handleSaveToPlaner} style={{ flex:2, padding:"11px", borderRadius:50, background:saved?"#4ade80":C.accent, color:"white", border:"none", cursor:saved?"default":"pointer", fontSize:12, fontWeight:700, fontFamily:"'DM Sans',sans-serif" }}>
                        {saved?T["de"].plannerSaved:"Save to Planner"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CHAT TAB ─────────────────────────────────────────────────────────────────
function renderChatText(text) {
  return text.split("\n").map((line, i) => {
    if (!line.trim()) return <div key={i} style={{ height: 5 }} />;
    const parts = [];
    let rest = line, key = 0;
    const pattern = /(\*\*(.+?)\*\*|\[([^\]]+)\]\((https?:\/\/[^)]+)\))/g;
    let last = 0, m;
    pattern.lastIndex = 0;
    while ((m = pattern.exec(rest)) !== null) {
      if (m.index > last) parts.push(<span key={key++}>{rest.slice(last, m.index)}</span>);
      if (m[2]) parts.push(<strong key={key++} style={{ fontWeight: 700 }}>{m[2]}</strong>);
      else if (m[3] && m[4]) parts.push(<a key={key++} href={m[4]} target="_blank" rel="noopener noreferrer" style={{ color: C.accent, textDecoration: "underline", textDecorationStyle: "dotted" }}>{m[3]}</a>);
      last = m.index + m[0].length;
    }
    if (last < rest.length) parts.push(<span key={key++}>{rest.slice(last)}</span>);
    const isBullet = line.startsWith("• ") || line.startsWith("- ");
    if (isBullet) return <div key={i} style={{ display: "flex", gap: 6, marginBottom: 2 }}><span style={{ flexShrink: 0, marginTop: 1 }}>•</span><span>{parts}</span></div>;
    return <div key={i} style={{ marginBottom: 2 }}>{parts}</div>;
  });
}

function ChatTab({ lang = "de", messages, setMessages }) {
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [imgFile, setImgFile] = useState(null);
  const [imgPreview, setImgPreview] = useState(null);
  const bottomRef = useRef(null);
  const fileRef = useRef(null);
  const textRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const SUGGESTIONS = [
    "How to renovate my bathroom on a budget?",
    "Best wall color for living room 2026?",
    "How to install SPC vinyl flooring myself?",
    "How much does a kitchen renovation cost?",
    "How to install LED lighting?",
    "Can you tile over existing tiles?",
    "How to apply microcement yourself?",
    "Kuechenfronten lackieren Step fuer Schritt?",
  ];

  async function sendMessage(textOverride, imgOverride, mimeOverride) {
    const text = textOverride ?? inputText;
    const img = imgOverride ?? imgPreview;
    if (!text.trim() && !img) return;

    const userMsg = {
      role: "user",
      text: text.trim() || "Analysiere dieses Bild.",
      img: img || null,
      imgBase64: img || null,
      mimeType: mimeOverride || (imgFile?.type) || "image/jpeg",
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setImgFile(null);
    setImgPreview(null);
    setLoading(true);

    // Build full conversation for API
    const allMsgs = [...messages, userMsg];
    const apiMessages = allMsgs.map(m => ({
      role: m.role,
      content: m.role === "assistant" ? (m.text || "") : (m.text || ""),
      ...(m.imgBase64 && m.imgBase64 !== "[Foto]" ? { imgBase64: m.imgBase64, mimeType: m.mimeType } : {}),
    }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", text: data.reply || "Keine Antwort erhalten." }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", text: "❌ Verbindungsfehler. Bitte erneut versuchen." }]);
    }
    setLoading(false);
  }

  function onFile(e) {
    const f = e.target.files[0]; if (!f) return;
    setImgFile(f);
    const r = new FileReader();
    r.onload = ev => {
      setImgPreview(ev.target.result);
      // Auto send with the image
      sendMessage("Analysiere dieses Foto meines Raumes bitte.", ev.target.result, f.type);
    };
    r.readAsDataURL(f);
  }

  function clearChat() {
    setMessages([{
      role: "assistant",
      text: "Chat geleert. 👋 Womit kann ich dir helfen?\n\nStell mir eine Frage oder lade ein **Foto** deines Raumes hoch – ich analysiere es sofort!",
    }]);
  }

  const isEmpty = messages.length <= 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", background: C.bg }}>

      {/* Header */}
      <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, background: C.accent, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🔨</div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Mystorija Experte</p>
            <p style={{ fontSize: 11, color: C.green }}>● Online – AI-powered</p>
          </div>
        </div>
        <button onClick={clearChat} style={{ fontSize: 12, color: C.muted, background: "none", border: `1px solid ${C.border}`, borderRadius: 20, padding: "4px 10px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
          🗑 Clear
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>

        {/* Welcome + Suggestions when chat is empty */}
        {isEmpty && (
          <div className="fu" style={{ marginBottom: 20 }}>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "16px 18px", marginBottom: 14, boxShadow: "0 2px 12px rgba(0,0,0,.04)" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ width: 32, height: 32, background: C.accent, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>🔨</div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>Mystorija</p>
                  <p style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>
                    Hey! 👋 Ich bin dein persoenlicher Renovierungsexperte – frag mich alles ueber Bad, Kueche, Wohnzimmer, Boden, Licht und mehr.<br /><br />
                    Ich gebe dir <strong>konkrete Antworten</strong> mit Produktnamen, Preisen und Schritt-fuer-Step Anleitungen. Oder lade ein 📷 Foto hoch und ich analysiere deinen Raum sofort!
                  </p>
                </div>
              </div>
            </div>
            <p style={{ fontSize: 12, color: C.muted, marginBottom: 8, fontStyle: "italic" }}>Common questions:</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => sendMessage(s)} style={{ padding: "7px 13px", borderRadius: 20, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", textAlign: "left", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.slice(isEmpty ? 0 : 0).map((msg, i) => (
          <div key={i} className="fu" style={{ marginBottom: 16, display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
            {msg.role === "assistant" && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                <div style={{ width: 24, height: 24, background: C.accent, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 }}>🔨</div>
                <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>Mystorija</span>
              </div>
            )}
            {/* Show uploaded image above message */}
            {msg.img && msg.img !== "[Foto]" && (
              <img src={msg.img} alt="" style={{ maxWidth: 240, borderRadius: 12, marginBottom: 6, boxShadow: "0 2px 12px rgba(0,0,0,.1)", border: `2px solid ${C.accent}` }} />
            )}
            {msg.img === "[Foto]" && (
              <div style={{ maxWidth: 240, borderRadius: 12, marginBottom: 6, background: C.tag, border: `1px solid ${C.border}`, padding: "6px 10px", fontSize: 11, color: C.muted }}>📷 Foto gesendet</div>
            )}
            <div style={{
              maxWidth: "90%",
              padding: "11px 15px",
              borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "4px 18px 18px 18px",
              background: msg.role === "user" ? C.accent : C.card,
              color: msg.role === "user" ? "#fff" : C.text,
              border: msg.role === "assistant" ? `1px solid ${C.border}` : "none",
              fontSize: 14, lineHeight: 1.65,
              boxShadow: "0 1px 6px rgba(0,0,0,.06)",
            }}>
              {msg.role === "user"
                ? msg.text
                : renderChatText(msg.text)
              }
            </div>
          </div>
        ))}

        {/* Loading */}
        {loading && (
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 16 }}>
            <div style={{ width: 24, height: 24, background: C.accent, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 }}>🔨</div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "4px 18px 18px 18px", padding: "12px 16px", display: "flex", gap: 5, alignItems: "center" }}>
              {[0, 1, 2].map(j => (
                <div key={j} style={{ width: 7, height: 7, borderRadius: "50%", background: C.accent, animation: `blink 1.2s ease ${j * 0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding:"10px 14px 14px", borderTop:`1px solid ${C.border}`, background:C.card }}>
        <div style={{ display:"flex", gap:8, alignItems:"flex-end" }}>
          <textarea
            ref={textRef}
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Stell eine Frage zur Renovierung…"
            rows={1}
            style={{ flex:1, resize:"none", border:`1.5px solid ${C.border}`, borderRadius:12, padding:"10px 14px", fontSize:14, fontFamily:"'DM Sans', sans-serif", background:C.bg, lineHeight:1.5, minHeight:42, maxHeight:120 }}
            onFocus={e => { e.target.style.borderColor = C.accent; }}
            onBlur={e => { e.target.style.borderColor = C.border; }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !inputText.trim()}
            style={{ width:42, height:42, borderRadius:12, flexShrink:0, background:loading || !inputText.trim() ? C.border : C.accent, border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:18 }}
          >
            {loading ? <LoadingSpinner size={18} /> : "→"}
          </button>
        </div>
        <p style={{ fontSize:10, color:C.muted, textAlign:"center", marginTop:6 }}>
          Enter to send · Shift+Enter new line · Photo analysis → 🔍 Inspo Tab
        </p>
      </div>
    </div>
  );
}

// ─── HANDWERKER TAB ───────────────────────────────────────────────────────────
const BRANCHEN = ["All","Fliesen & Bad","Maler & Lackierer","Elektriker","Sanitaer & Heizung","Trockenbau","Schreiner","Bodenleger"];

function HandwerkerTab({ lang = "de" }) {
  const [filter, setFilter] = useState("All");
  const [ort, setOrt] = useState("");

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"hidden" }}>
      <div style={{ background:C.card, borderBottom:`1px solid ${C.border}`, padding:"14px 16px 12px", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:20 }}>🔨 Find Pros</h2>
          <span style={{ background:C.accentBg, color:C.accent, borderRadius:20, padding:"4px 12px", fontSize:11, fontWeight:700 }}>Coming soon</span>
        </div>
        <input value={ort} onChange={e => setOrt(e.target.value)} placeholder="📍 Stadt oder PLZ eingeben…" style={{ width:"100%", border:`1px solid ${C.border}`, borderRadius:10, padding:"9px 13px", fontSize:14, marginBottom:10, fontFamily:"'DM Sans',sans-serif", background:C.bg }} />
        <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:4 }}>
          {BRANCHEN.map(b => <button key={b} onClick={() => setFilter(b)} style={{ padding:"5px 12px", borderRadius:20, border:"none", cursor:"pointer", background:filter===b?C.accent:C.bg, color:filter===b?"white":C.muted, fontSize:12, fontWeight:600, whiteSpace:"nowrap", fontFamily:"'DM Sans',sans-serif", flexShrink:0 }}>{b}</button>)}
        </div>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"20px 16px" }}>
        {/* Handwerker CTA */}
        <div style={{ background:"linear-gradient(135deg, #1a1a2e, #2d2d4e)", borderRadius:16, padding:"20px", marginBottom:20, textAlign:"center" }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🔨</div>
          <p style={{ color:"white", fontWeight:700, fontSize:16, marginBottom:8 }}>Are you a contractor?</p>
          <p style={{ color:"rgba(255,255,255,0.75)", fontSize:13, lineHeight:1.6, marginBottom:16 }}>
            Werde Teil des Mystorija Handwerker-Netzwerks.<br/>
            Direkte Anfragen von renovierungswilligen Kunden.
          </p>
          <div style={{ display:"flex", gap:8, justifyContent:"center", flexWrap:"wrap", marginBottom:12 }}>
            {["✓ Eigenes Profil","✓ Direktanfragen","✓ Werbung in der App","✓ Bewertungen"].map(f => (
              <span key={f} style={{ background:"rgba(255,255,255,0.1)", color:"white", borderRadius:20, padding:"4px 12px", fontSize:11, fontWeight:600 }}>{f}</span>
            ))}
          </div>
          <a href="mailto:info@mystorija.com" style={{ display:"inline-block", background:C.accent, color:"white", borderRadius:50, padding:"11px 24px", fontSize:13, fontWeight:700, textDecoration:"none" }}>
            Apply now – €49.99/month →
          </a>
        </div>

        {/* Coming Soon */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"30px 20px", textAlign:"center" }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🏗️</div>
          <p style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, marginBottom:10 }}>Contractor Directory</p>
          <p style={{ fontSize:14, color:C.muted, lineHeight:1.7, maxWidth:280, margin:"0 auto 20px" }}>
            Wir bauen gerade das Verzeichnis auf. Bald findest du hier gepruefte Handwerker in deiner Naehe.
          </p>
          <div style={{ background:C.greenBg, borderRadius:12, padding:"14px 16px" }}>
            <p style={{ fontSize:13, color:C.green, fontWeight:600 }}>
              💡 Coming soon – wir pruefen jeden Betrieb sorgfaeltig
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── EINKAUFSLISTE (aus gespeicherten Makeovers) ──────────────────────────────
function parseMaterials(text) {
  if (!text) return [];
  return text.split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => {
      // Extract name (bold **...**), description, and Amazon link
      const boldMatch = line.match(/\*\*([^*]+)\*\*/);
      const linkMatch = line.match(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/);
      const name = boldMatch ? boldMatch[1] : line.replace(/\*\*/g, "").replace(/\[.*?\]\(.*?\)/g, "").replace(/^[🪨🪵💡🚿✨⬛📚🌿🏺🍂🛏️🌙🪑🌳⬜🔵]/u, "").split("–")[0].trim();
      const amazonUrl = linkMatch ? linkMatch[2] : null;
      // Get price from line
      const priceMatch = line.match(/Ca\.\s*([\d–.]+\s*€[^.]*)/);
      const price = priceMatch ? priceMatch[1] : null;
      // Get emoji at start
      const emojiMatch = line.match(/^([🪨🪵💡🚿✨⬛📚🌿🏺🍂🛏️🌙🪑🌳⬜🔵🏛️])/u);
      const emoji = emojiMatch ? emojiMatch[1] : "🛒";
      return { name, amazonUrl, price, emoji, raw: line };
    });
}

function EinkaufsListe({ savedMakeovers }) {
  const [checked, setChecked] = useState({});
  const [openMakeover, setOpenMakeover] = useState(savedMakeovers[0]?.id || null);

  const toggle = (key) => setChecked(prev => ({ ...prev, [key]: !prev[key] }));

  // Count total items & checked across all makeovers
  const allItems = savedMakeovers.flatMap((m, mi) =>
    parseMaterials(m.materials).map((item, ii) => ({ key: `${m.id}-${ii}` }))
  );
  const totalChecked = allItems.filter(i => checked[i.key]).length;
  const total = allItems.length;

  return (
    <div style={{ marginTop:24 }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:18 }}>🛒 Shopping list</h3>
        {total > 0 && (
          <span style={{ fontSize:12, color:C.muted, background:C.accentBg, padding:"3px 10px", borderRadius:20 }}>
            {totalChecked}/{total} gekauft
          </span>
        )}
      </div>

      {/* Progress Bar */}
      {total > 0 && (
        <div style={{ height:6, background:C.border, borderRadius:3, overflow:"hidden", marginBottom:16 }}>
          <div style={{ height:"100%", width:`${Math.round((totalChecked/total)*100)}%`, background:`linear-gradient(to right, ${C.accent}, #E8855A)`, borderRadius:3, transition:"width 0.3s" }} />
        </div>
      )}

      {savedMakeovers.map((m, mi) => {
        const items = parseMaterials(m.materials);
        if (items.length === 0) return null;
        const mChecked = items.filter((_, ii) => checked[`${m.id}-${ii}`]).length;
        const isOpen = openMakeover === m.id;

        return (
          <div key={m.id} className="fu" style={{ background:C.card, border:`1px solid ${isOpen ? C.accent+"66" : C.border}`, borderRadius:16, marginBottom:12, overflow:"hidden" }}>
            {/* Makeover Header – klappbar */}
            <button onClick={() => setOpenMakeover(isOpen ? null : m.id)} style={{ width:"100%", padding:"0", background:"transparent", border:"none", cursor:"pointer", textAlign:"left", display:"flex" }}>
              {/* Vorschaubild */}
              <div style={{ width:80, height:72, flexShrink:0, overflow:"hidden" }}>
                <img src={m.imgUrl} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
              </div>
              <div style={{ flex:1, padding:"12px 14px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div>
                  <p style={{ fontFamily:"'Playfair Display',serif", fontSize:14, fontWeight:700, color:C.text, marginBottom:2 }}>{m.titel}</p>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:11, color:C.muted }}>{m.date}</span>
                    <span style={{ fontSize:11, background:mChecked===items.length?C.greenBg:C.accentBg, color:mChecked===items.length?C.green:C.accent, padding:"2px 8px", borderRadius:20, fontWeight:600 }}>
                      {mChecked}/{items.length} {mChecked===items.length?"✓ Alles gekauft":"Produkte"}
                    </span>
                  </div>
                </div>
                <span style={{ fontSize:18, color:C.muted, transform:isOpen?"rotate(90deg)":"none", transition:"transform .2s" }}>›</span>
              </div>
            </button>

            {/* Produkt-Liste */}
            {isOpen && (
              <div className="fu" style={{ borderTop:`1px solid ${C.border}` }}>
                {/* Alle abhaken Button */}
                <div style={{ padding:"8px 14px", background:C.accentBg, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <p style={{ fontSize:12, color:C.accent, fontWeight:600 }}>📋 Shopping list for {m.titel}</p>
                  <button onClick={() => {
                    const allDone = items.every((_, ii) => checked[`${m.id}-${ii}`]);
                    const update = {};
                    items.forEach((_, ii) => { update[`${m.id}-${ii}`] = !allDone; });
                    setChecked(prev => ({ ...prev, ...update }));
                  }} style={{ fontSize:11, color:C.accent, background:"none", border:`1px solid ${C.accent}44`, borderRadius:20, padding:"3px 10px", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                    {items.every((_, ii) => checked[`${m.id}-${ii}`]) ? "Alle abwaehlen" : "Alle abhaken"}
                  </button>
                </div>

                {items.map((item, ii) => {
                  const key = `${m.id}-${ii}`;
                  const done = checked[key];
                  return (
                    <div key={ii} style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 14px", borderBottom:`1px solid ${C.border}`, background:done?"#F9FDF9":"transparent" }}>
                      {/* Checkbox */}
                      <div onClick={() => toggle(key)} style={{ width:22, height:22, borderRadius:6, flexShrink:0, border:`2px solid ${done?C.green:C.border}`, background:done?C.green:"white", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                        {done && <span style={{ color:"white", fontSize:12, fontWeight:700 }}>✓</span>}
                      </div>

                      {/* Produkt Info */}
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:13, fontWeight:600, color:done?C.muted:C.text, textDecoration:done?"line-through":"none", lineHeight:1.4 }}>
                          {item.emoji} {item.name}
                        </p>
                        {item.price && !done && (
                          <p style={{ fontSize:11, color:C.muted, marginTop:2 }}>💶 Ca. {item.price}</p>
                        )}
                      </div>

                      {/* Amazon Link */}
                      {item.amazonUrl && (
                        <a href={item.amazonUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ flexShrink:0, background:done?C.border:C.greenBg, color:done?C.muted:C.green, borderRadius:20, padding:"5px 11px", fontSize:12, textDecoration:"none", fontWeight:700, display:"flex", alignItems:"center", gap:4, opacity:done?0.5:1 }}>
                          🛒 <span>Kaufen</span>
                        </a>
                      )}
                    </div>
                  );
                })}

                {/* Zusammenfassung unten */}
                <div style={{ padding:"10px 14px", background:C.greenBg, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontSize:12, color:C.green, fontWeight:600 }}>
                    {mChecked === items.length ? "🎉 Alle Produkte besorgt!" : `${items.length - mChecked} Produkte noch offen`}
                  </span>
                  {mChecked === items.length && (
                    <span style={{ fontSize:11, color:C.green }}>Jetzt loslegen! 💪</span>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── PLANER TAB – komplett neu ────────────────────────────────────────────────
const KOMPLETT_PLAENE = [
  {
    name:"Bad Komplettsanierung", icon:"🚿", dauer:"2–4 weeks", budget:"3.000–15.000€", desc:"Vom leeren Raum zum Traumbad",
    phasen:[
      { name:"Planung & Vorbereitung", items:["Grundriss aufzeichnen, Masse nehmen","Sanitaer-Konzept festlegen (WC, Dusche, Wanne?)","Materialien auswaehlen: Fliesen, Armaturen, Sanitaer","Angebote einholen: Installateur, Fliesenleger","Material bestellen (Lieferzeiten beachten!)"] },
      { name:"Abriss & Entkernung", items:["Wasser & Strom abstellen","Altes Sanitaer demontieren (WC, Wanne, Waschbecken)","Fliesen stemmen (Stemmhammer leihen)","Alten Estrich pruefen – ggf. erneuern","Waende auf Schimmel pruefen","Schutt entsorgen (Container bestellen)"] },
      { name:"Rohbau & Installation", items:["Neue Leitungen verlegen (Installateur!)","Elektro: Leerrohr fuer Spiegel, Steckdosen IP44","Rigips Vorbauwand fuer Unterputz-Spuelung","Gefaelleestrich fuer bodengleiche Dusche (1,5%)","Abdichtung: Dichtband + 2× Dichtschlaemme","Trockenzeit abwarten (mind. 48h)"] },
      { name:"Fliesen & Oberflaechen", items:["Fliesenkleber C2 anruehren (Mapei Keraflex)","Boden fliesen – von Mitte aus starten","Waende fliesen – Werkskante nach aussen","Nivelliersystem bei Grossformat verwenden","24h trocknen, dann verfugen","Randfugen: Silikon (Bad-Silikon Soudal S100)"] },
      { name:"Sanitaer & Elektro", items:["WC montieren (Vorwandinstallation einstellen)","Waschtisch anschliessen (Teflonband!)","Dusche/Wanne anschliessen, Dichtigkeitstest","Armaturen montieren","Spiegel aufhaengen (IP44 pruefen!)","Licht anschliessen (Elektriker)"] },
      { name:"Finishing", items:["Silikon komplett erneuern + glaetten","Dichtheit aller Anschluesse pruefen","Accessoires montieren (Handtuchhalter, Haken)","Alles reinigen","Fotos machen – vorher/nachher!"] },
    ]
  },
  {
    name:"Kitchen Renovation", icon:"🍳", dauer:"1–2 weeks", budget:"500–8.000€", desc:"Von neuen Fronten bis zur kompletten Kuechenerneuerung",
    phasen:[
      { name:"Planung", items:["Konzept: Nur Fronten oder komplett neu?","Farbkonzept waehlen (Testmuster bestellen!)","Arbeitsplatte auswaehlen","Material bestellen (4 weeks Lieferzeit!)","Budget aufteilen: Fronten / Platte / Licht / Deko"] },
      { name:"Fronten & Griffe", items:["Alte Fronten abschrauben, beschriften","Fronten schleifen (P120) oder entfetten fuer Folie","Haftgrund auftragen, trocknen lassen","Farbe auftragen: 3× Seidenmatt-Lack","Neue Griffe montieren (Schablone verwenden!)","Fronten wieder einhaengen, Scharniere justieren"] },
      { name:"Arbeitsplatte", items:["Alte Arbeitsplatte demontieren","Neue Arbeitsplatte zuschneiden (Jigsaw)","Schnittkanten SOFORT abdichten","Einbauspuele ausschneiden, einsetzen","Arbeitsplatte verkleben + verschrauben","Silikon Uebergang Wand-Arbeitsplatte"] },
      { name:"Licht & Finishing", items:["LED-Strip unter Oberschraenken (2700K)","Pendelleuchten ueber Insel/Tisch montieren","Alle Fugen mit Silikon abschliessen","Armaturen auf Dichtigkeit pruefen","Grundreinigung & Einraeumen"] },
    ]
  },
  {
    name:"Wohnzimmer transformieren", icon:"🛋️", dauer:"1–3 days", budget:"100–2.000€", desc:"Akzentwand, Licht, Boden – der komplette Look",
    phasen:[
      { name:"Planung", items:["Farbkonzept auf Pinterest sammeln","Welche Wand wird Akzentwand?","Bodenbelag: Bleibt er oder wird getauscht?","Lichtkonzept: Deckenlampe raus, Stehlampe + Spots","Budget aufteilen: Farbe / Boden / Moebel / Licht"] },
      { name:"Accent Wall", items:["Move furniture from wall","Tesa Precision abkleben (Decke, Boden, Waende)","Tiefengrund auftragen wenn noetig","2 Schichten Wandfarbe mit Lammfellrolle","Band nass abziehen bei Latexfarbe","Trockenzeit: mind. 4h zwischen Schichten"] },
      { name:"Boden verlegen", items:["Alten Boden pruefen – Unebenheiten ausgleichen","Trittschalldaemmung auslegen","10mm Abstandshalter an alle Waende","Vinyl/Laminat Reihe fuer Reihe einrasten","Sockelleisten kleben (NICHT nageln)"] },
      { name:"Licht & Finishing", items:["LED-Strip hinter TV (2700K)","Cove-Licht an Deckenrand bauen","Stehlampen positionieren","Rearrange furniture","Deko aufstellen, Pflanzen platzieren","Fotos machen!"] },
    ]
  },
  {
    name:"Schlafzimmer upgraden", icon:"🛏️", dauer:"1–2 days", budget:"100–1.500€", desc:"Kopfteil, Farbe, Licht – Hotel-Feeling",
    phasen:[
      { name:"Planung", items:["Farbkonzept: Akzentwand welche Farbe?","Kopfteil: DIY oder kaufen?","Licht: Wandleuchten links/rechts vom Bett","Verdunkelungsrollo oder Vorhang planen"] },
      { name:"Akzentwand hinter Bett", items:["Bett wegschieben","Wand abkleben, Tiefengrund","2 Schichten Farbe (Terrakotta, Salbeigruen, Navy)","Band abziehen, trocknen lassen"] },
      { name:"Kopfteil DIY", items:["MDF 18mm auf Mass (OBI schneidet zu)","5cm Schaumstoff RG35 aufkleben","Bouclé-Stoff spannen und tackern","An Wand haengen (verdeckte Schrauben)"] },
      { name:"Licht & Atmosphaere", items:["Wandleuchten beidseitig montieren (2200K)","Verdunkelungsrollo direkt am Fenster","Vorhangstange moeglichst hoch montieren","Bettwaesche wechseln (Leinen = Trend 2025)","Deko: 1 grosse Pflanze, Kerzen, Tablett"] },
    ]
  },
  {
    name:"Terrasse aufwerten", icon:"🌿", dauer:"1–2 weekends", budget:"300–3.000€", desc:"WPC-Boden, Sichtschutz, Lounge",
    phasen:[
      { name:"Planung & Material", items:["Grundflaeche ausmessen (Length × Width)","Konzept: Lounge, Essbereich, Pflanzen?","WPC-Menge berechnen (+10% Verschnitt)","Unterkonstruktion planen (alle 50cm)","Material bestellen"] },
      { name:"Unterkonstruktion", items:["Alten Belag entfernen","Stelzlager setzen (hoehenverstellbar)","2% Gefaelle einplanen (Wasserablauf)","Tragebalken verlegen und nivellieren"] },
      { name:"WPC-Dielen verlegen", items:["Erste Reihe mit 5mm Abstand zur Wand","Clips einsetzen – unsichtbare Befestigung","Reihe fuer Reihe arbeiten","Letzte Reihe zuschneiden","Abschlussprofile montieren"] },
      { name:"Sichtschutz & Moebel", items:["Sichtschutz-Pfosten setzen","Latten oder Bambus anbringen","Solar-Lichterketten aufhaengen (2200K)","Lounge-Moebel aufstellen","Pflanzkuebel mit Olivenbaum/Lavendel"] },
    ]
  },
];

function PlanerTab({ lang = "de", savedMakeovers }) {
  const [ansicht, setAnsicht] = useState("plaene");
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [openPhase, setOpenPhase] = useState(0);
  const [checked, setChecked] = useState({});
  const [eigene, setEigene] = useState([]);
  const [creating, setCreating] = useState(false);
  const [newProjekt, setNewProjekt] = useState({ name:"", icon:"🏠", phasen:[{ name:"Phase 1", items:[""] }] });

  useEffect(() => {
    try {
      const s = localStorage.getItem("mystorija_planer");
      if (s) { const d = JSON.parse(s); setChecked(d.checked||{}); setEigene(d.eigene||[]); }
    } catch {}
  }, []);

  const saveLS = (c, e) => {
    try { localStorage.setItem("mystorija_planer", JSON.stringify({ checked: c||checked, eigene: e||eigene })); } catch {}
  };

  const toggleCheck = (key) => {
    const next = { ...checked, [key]: !checked[key] };
    setChecked(next); saveLS(next, null);
  };

  const planProgress = (plan) => {
    if (!plan) return { done:0, total:0, pct:0 };
    const total = plan.phasen.reduce((s,ph)=>s+ph.items.length, 0);
    const done = plan.phasen.reduce((s,ph,pi)=>s+ph.items.filter((_,ii)=>checked[`${plan.name}-${pi}-${ii}`]).length, 0);
    return { done, total, pct: total ? Math.round((done/total)*100) : 0 };
  };

  const ICONS = ["🏠","🚿","🍳","🌿","🛋️","🛏️","🔨","📦","🏗️","💡","🪟","🔧"];
  const allePlane = [...KOMPLETT_PLAENE, ...eigene];

  // Detailansicht fuer ausgewaehlten Plan
  if (selectedPlan) {
    const plan = allePlane.find(p => p.name === selectedPlan);
    if (!plan) { setSelectedPlan(null); return null; }
    const { done, total, pct } = planProgress(plan);
    return (
      <div style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"hidden" }}>
        <div style={{ background:C.card, borderBottom:`1px solid ${C.border}`, padding:"12px 16px", display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
          <button onClick={() => setSelectedPlan(null)} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:C.muted }}>←</button>
          <div style={{ flex:1 }}>
            <p style={{ fontSize:16, fontWeight:700 }}>{plan.icon} {plan.name}</p>
            <p style={{ fontSize:11, color:C.muted }}>{done}/{total} steps · {pct}% done</p>
          </div>
          {pct > 0 && <button onClick={() => { const next={...checked}; plan.phasen.forEach((ph,pi)=>ph.items.forEach((_,ii)=>{delete next[`${plan.name}-${pi}-${ii}`];})); setChecked(next); saveLS(next,null); }} style={{ fontSize:11, color:C.muted, background:"none", border:`1px solid ${C.border}`, borderRadius:20, padding:"3px 8px", cursor:"pointer" }}>Reset</button>}
        </div>
        <div style={{ height:5, background:C.border, flexShrink:0 }}>
          <div style={{ height:"100%", width:`${pct}%`, background:`linear-gradient(to right, ${C.accent}, #E8855A)`, transition:"width 0.3s" }} />
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"14px 16px" }}>
          <div style={{ background:C.accentBg, borderRadius:12, padding:"12px 14px", marginBottom:14, display:"flex", gap:10 }}>
            <div><p style={{ fontSize:12, color:C.accent, fontWeight:600 }}>⏱ {plan.dauer}</p><p style={{ fontSize:12, color:C.accent }}>💶 {plan.budget}</p></div>
            <p style={{ fontSize:13, color:C.text, flex:1, lineHeight:1.5 }}>{plan.desc}</p>
          </div>
          {pct === 100 && <div style={{ background:C.greenBg, borderRadius:12, padding:"12px", marginBottom:14, textAlign:"center" }}><p style={{ fontSize:16, color:C.green, fontWeight:700 }}>🎉 Projekt abgeschlossen!</p></div>}
          {plan.phasen.map((phase, pi) => {
            const phaseDone = phase.items.filter((_,ii)=>checked[`${plan.name}-${pi}-${ii}`]).length;
            const phComplete = phaseDone === phase.items.length;
            const isOpen = openPhase === pi;
            return (
              <div key={pi} style={{ background:C.card, border:`1px solid ${phComplete?C.green+"44":isOpen?C.accent+"55":C.border}`, borderRadius:14, marginBottom:10, overflow:"hidden" }}>
                <button onClick={()=>setOpenPhase(isOpen?-1:pi)} style={{ width:"100%", padding:"13px 16px", background:phComplete?C.greenBg:"transparent", border:"none", display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}>
                  <div style={{ width:28, height:28, borderRadius:"50%", background:phComplete?C.green:phaseDone>0?C.accent:C.border, color:"white", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, flexShrink:0 }}>{phComplete?"✓":pi+1}</div>
                  <div style={{ flex:1, textAlign:"left" }}>
                    <p style={{ fontSize:14, fontWeight:600, color:phComplete?C.green:C.text }}>{phase.name}</p>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:3 }}>
                      <div style={{ flex:1, height:3, background:C.border, borderRadius:2 }}><div style={{ height:"100%", width:`${phase.items.length?(phaseDone/phase.items.length*100):0}%`, background:C.green, borderRadius:2 }} /></div>
                      <span style={{ fontSize:11, color:C.muted }}>{phaseDone}/{phase.items.length}</span>
                    </div>
                  </div>
                  <span style={{ fontSize:18, color:C.muted, transform:isOpen?"rotate(90deg)":"none", transition:"0.2s" }}>›</span>
                </button>
                {isOpen && (
                  <div style={{ borderTop:`1px solid ${C.border}`, padding:"8px 16px 12px" }}>
                    {phase.items.map((item, ii) => {
                      const key=`${plan.name}-${pi}-${ii}`, done=checked[key];
                      return (
                        <div key={ii} onClick={()=>toggleCheck(key)} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"9px 0", borderBottom:ii<phase.items.length-1?`1px solid ${C.border}`:"none", cursor:"pointer" }}>
                          <div style={{ width:22, height:22, borderRadius:6, flexShrink:0, marginTop:1, border:`2px solid ${done?C.green:C.border}`, background:done?C.green:"white", display:"flex", alignItems:"center", justifyContent:"center" }}>
                            {done && <span style={{ color:"white", fontSize:12, fontWeight:700 }}>✓</span>}
                          </div>
                          <p style={{ fontSize:14, color:done?C.muted:C.text, textDecoration:done?"line-through":"none", lineHeight:1.4, flex:1 }}>{item}</p>
                        </div>
                      );
                    })}
                    <button onClick={()=>{ const allDone=phase.items.every((_,ii)=>checked[`${plan.name}-${pi}-${ii}`]); const next={...checked}; phase.items.forEach((_,ii)=>{next[`${plan.name}-${pi}-${ii}`]=!allDone;}); setChecked(next); saveLS(next,null); }} style={{ marginTop:8, fontSize:12, color:C.accent, background:"none", border:`1px solid ${C.accent}44`, borderRadius:20, padding:"4px 12px", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                      {phase.items.every((_,ii)=>checked[`${plan.name}-${pi}-${ii}`])?"Phase abwaehlen":"Alle abhaken"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          {savedMakeovers?.length > 0 && <EinkaufsListe savedMakeovers={savedMakeovers} />}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"hidden" }}>
      <div style={{ display:"flex", borderBottom:`1px solid ${C.border}`, background:C.card, flexShrink:0 }}>
        {[["plaene","📋 Projekte"],["eigene","✏️ Eigene"],["einkauf","🛒 Einkauf"]].map(([id,label])=>(
          <button key={id} onClick={()=>setAnsicht(id)} style={{ flex:1, padding:"12px 8px", background:"transparent", border:"none", borderBottom:`2px solid ${ansicht===id?C.accent:"transparent"}`, color:ansicht===id?C.accent:C.muted, fontSize:13, fontWeight:ansicht===id?600:400, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>{label}</button>
        ))}
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"14px 16px" }}>
        {ansicht === "plaene" && (
          <div>
            <p style={{ fontSize:12, color:C.muted, marginBottom:14, fontStyle:"italic" }}>Choose a project – all steps sind vorgegeben. Fortschritt wird gespeichert.</p>
            {allePlane.map((plan, i) => {
              const { done, total, pct } = planProgress(plan);
              return (
                <div key={i} onClick={()=>{setSelectedPlan(plan.name);setOpenPhase(0);}} className="fu" style={{ background:C.card, border:`1px solid ${pct>0?C.accent+"55":C.border}`, borderRadius:16, marginBottom:12, padding:"16px", cursor:"pointer" }}>
                  <div style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom:10 }}>
                    <span style={{ fontSize:30 }}>{plan.icon}</span>
                    <div style={{ flex:1 }}>
                      <p style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:700, color:C.text }}>{plan.name}</p>
                      <p style={{ fontSize:12, color:C.muted, marginTop:2 }}>{plan.desc}</p>
                      <div style={{ display:"flex", gap:6, marginTop:6, flexWrap:"wrap" }}>
                        {plan.dauer && <span style={{ fontSize:11, background:C.accentBg, color:C.accent, padding:"2px 8px", borderRadius:20 }}>⏱ {plan.dauer}</span>}
                        {plan.budget && <span style={{ fontSize:11, background:C.greenBg, color:C.green, padding:"2px 8px", borderRadius:20 }}>💶 {plan.budget}</span>}
                        <span style={{ fontSize:11, background:C.tag, color:C.muted, padding:"2px 8px", borderRadius:20 }}>{plan.phasen.length} Phasen · {total} steps</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ flex:1, height:6, background:C.border, borderRadius:3, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${pct}%`, background:pct===100?C.green:`linear-gradient(to right, ${C.accent}, #E8855A)`, borderRadius:3, transition:"width 0.3s" }} />
                    </div>
                    <span style={{ fontSize:12, color:pct===100?C.green:C.muted, fontWeight:pct===100?700:400, flexShrink:0 }}>{pct===100?"✓ Fertig!":pct>0?`${pct}%`:"Starten →"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {ansicht === "eigene" && (
          <div>
            {!creating ? (
              <button onClick={()=>setCreating(true)} style={{ width:"100%", padding:"14px", borderRadius:14, border:`2px dashed ${C.accent}`, background:C.accentBg, color:C.accent, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:14, marginBottom:14 }}>+ Eigenes Projekt erstellen</button>
            ) : (
              <div className="fu" style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"16px", marginBottom:14 }}>
                <p style={{ fontWeight:700, fontSize:16, marginBottom:12 }}>Neues Projekt</p>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:12 }}>
                  {ICONS.map(ic=><button key={ic} onClick={()=>setNewProjekt(p=>({...p,icon:ic}))} style={{ width:36, height:36, borderRadius:10, border:`2px solid ${newProjekt.icon===ic?C.accent:C.border}`, background:newProjekt.icon===ic?C.accentBg:"white", cursor:"pointer", fontSize:18 }}>{ic}</button>)}
                </div>
                <input value={newProjekt.name} onChange={e=>setNewProjekt(p=>({...p,name:e.target.value}))} placeholder="Project name" style={{ width:"100%", padding:"10px 13px", borderRadius:10, border:`1.5px solid ${C.border}`, fontSize:14, fontFamily:"'DM Sans',sans-serif", marginBottom:12, background:C.bg }} />
                {newProjekt.phasen.map((phase, pi)=>(
                  <div key={pi} style={{ background:C.accentBg, borderRadius:10, padding:"12px", marginBottom:10 }}>
                    <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                      <input value={phase.name} onChange={e=>setNewProjekt(p=>{const ph=[...p.phasen];ph[pi]={...ph[pi],name:e.target.value};return{...p,phasen:ph};})} placeholder={`Phase ${pi+1} Name`} style={{ flex:1, padding:"7px 10px", borderRadius:8, border:`1px solid ${C.border}`, fontSize:13, fontFamily:"'DM Sans',sans-serif", background:"white" }} />
                      {pi>0 && <button onClick={()=>setNewProjekt(p=>({...p,phasen:p.phasen.filter((_,x)=>x!==pi)}))} style={{ background:"none", border:"none", color:"#CCC", cursor:"pointer", fontSize:16 }}>✕</button>}
                    </div>
                    {phase.items.map((item, ii)=>(
                      <div key={ii} style={{ display:"flex", gap:6, marginBottom:6 }}>
                        <span style={{ width:20, height:20, background:C.accent, color:"white", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, flexShrink:0, marginTop:6 }}>{ii+1}</span>
                        <input value={item} onChange={e=>setNewProjekt(p=>{const ph=[...p.phasen];ph[pi]={...ph[pi],items:ph[pi].items.map((it,x)=>x===ii?e.target.value:it)};return{...p,phasen:ph};})} placeholder={`Step ${ii+1}`} style={{ flex:1, padding:"6px 10px", borderRadius:8, border:`1px solid ${C.border}`, fontSize:13, fontFamily:"'DM Sans',sans-serif", background:"white" }}
                          onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();setNewProjekt(p=>{const ph=[...p.phasen];ph[pi]={...ph[pi],items:[...ph[pi].items,""]};return{...p,phasen:ph};});}}} />
                        <button onClick={()=>setNewProjekt(p=>{const ph=[...p.phasen];ph[pi]={...ph[pi],items:ph[pi].items.filter((_,x)=>x!==ii)};return{...p,phasen:ph};})} style={{ background:"none", border:"none", color:"#CCC", cursor:"pointer" }}>✕</button>
                      </div>
                    ))}
                    <button onClick={()=>setNewProjekt(p=>{const ph=[...p.phasen];ph[pi]={...ph[pi],items:[...ph[pi].items,""]};return{...p,phasen:ph};})} style={{ fontSize:12, color:C.accent, background:"none", border:"none", cursor:"pointer", padding:"4px 0" }}>+ Schritt</button>
                  </div>
                ))}
                <button onClick={()=>setNewProjekt(p=>({...p,phasen:[...p.phasen,{name:`Phase ${p.phasen.length+1}`,items:[""]}]}))} style={{ width:"100%", padding:"8px", borderRadius:10, border:`1px dashed ${C.border}`, background:"none", color:C.muted, cursor:"pointer", fontSize:13, marginBottom:12, fontFamily:"'DM Sans',sans-serif" }}>+ Phase hinzufuegen</button>
                <div style={{ display:"flex", gap:10 }}>
                  <button onClick={()=>{
                    if(!newProjekt.name.trim()) return;
                    const proj={...newProjekt,phasen:newProjekt.phasen.map(ph=>({...ph,items:ph.items.filter(i=>i.trim())})).filter(ph=>ph.items.length>0)};
                    if(proj.phasen.length===0) return;
                    const next=[...eigene,proj]; setEigene(next); saveLS(null,next);
                    setCreating(false); setNewProjekt({name:"",icon:"🏠",phasen:[{name:"Phase 1",items:[""]}]});
                    setSelectedPlan(proj.name); setOpenPhase(0); setAnsicht("plaene");
                  }} style={{ flex:2, padding:"12px", borderRadius:50, background:C.accent, color:"white", border:"none", fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Erstellen →</button>
                  <button onClick={()=>setCreating(false)} style={{ flex:1, padding:"12px", borderRadius:50, border:`1px solid ${C.border}`, background:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Cancel</button>
                </div>
              </div>
            )}
            <p style={{ fontSize:12, color:C.muted, textAlign:"center", fontStyle:"italic" }}>Enter = naechster Step · Phasen gruppieren verwandte Tasks</p>
          </div>
        )}
        {ansicht === "einkauf" && (
          savedMakeovers?.length > 0
            ? <EinkaufsListe savedMakeovers={savedMakeovers} />
            : <div style={{ textAlign:"center", padding:"40px 20px" }}>
                <p style={{ fontSize:32, marginBottom:12 }}>🛒</p>
                <p style={{ fontFamily:"'Playfair Display',serif", fontSize:16, marginBottom:8 }}>Noch keine Shopping list</p>
                <p style={{ fontSize:13, color:C.muted, lineHeight:1.6 }}>Generiere einen Makeover und druecke "Save to Planner" – dann erscheinen hier alle Materialien zum Abhaken.</p>
              </div>
        )}
      </div>
    </div>
  );
}


// ─── INSPO ANALYSE TAB ───────────────────────────────────────────────────────
function InspoTab({ plan, lang = "de" }) {
  const [imgFile, setImgFile] = useState(null);
  const [imgPreview, setImgPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const fileRef = useRef();

  const INSPO_LIMITS = { free: 0, basic: 30, pro: Infinity };
  const inspoLimit = INSPO_LIMITS[plan] ?? 0;
  const isFreeInspo = !plan || plan === "free";

  function getMonthlyInspoUsage() {
    try {
      const key = `mystorija_inspo_${new Date().getFullYear()}_${new Date().getMonth()}`;
      return parseInt(localStorage.getItem(key) || "0");
    } catch { return 0; }
  }
  function incrementInspoUsage() {
    try {
      const key = `mystorija_inspo_${new Date().getFullYear()}_${new Date().getMonth()}`;
      localStorage.setItem(key, String(getMonthlyInspoUsage() + 1));
    } catch {}
  }
  const inspoUsage = getMonthlyInspoUsage();
  const inspoLimitReached = inspoUsage >= inspoLimit;

  // Saved analyses laden
  useEffect(() => {
    try {
      const saved = localStorage.getItem("mystorija_inspo");
      if (saved) setHistory(JSON.parse(saved));
    } catch {}
  }, []);

  function saveToHistory(preview, result) {
    const entry = { id: Date.now(), preview, analysis: result, date: new Date().toLocaleDateString("de-DE") };
    setHistory(prev => {
      const next = [entry, ...prev].slice(0, 20); // max 20
      try { localStorage.setItem("mystorija_inspo", JSON.stringify(next)); } catch {}
      return next;
    });
  }

  function deleteFromHistory(id) {
    setHistory(prev => {
      const next = prev.filter(h => h.id !== id);
      try { localStorage.setItem("mystorija_inspo", JSON.stringify(next)); } catch {}
      return next;
    });
  }

  async function analyse(file, preview) {
    if (isFreeInspo || inspoLimitReached) {
      setError(isFreeInspo ? "Inspo-Analyse ab Basic Plan (9,99€/month)." : `Monthly limit reached (${inspoLimit} Analysen).`);
      return;
    }
    setLoading(true); setAnalysis(null); setError(null); setShowHistory(false);
    try {
      const compressed = await compressImageFile(file);
      const res = await fetch("/api/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: compressed, mimeType: file.type, lang: "de" }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); }
      else {
        setAnalysis(data.analysis);
        saveToHistory(preview, data.analysis);
        incrementInspoUsage();
      }
    } catch (err) { setError(err.message); }
    setLoading(false);
  }

  function onFile(e) {
    const f = e.target.files[0]; if (!f) return;
    setImgFile(f);
    const r = new FileReader();
    r.onload = ev => { setImgPreview(ev.target.result); analyse(f, ev.target.result); };
    r.readAsDataURL(f);
  }

  const SCHWIERIGKEIT_COLOR = { "Easy": C.green, "Medium": C.accent, "Schwierig": "#B91C1C" };

  return (
    <div style={{ overflowY:"auto", height:"100%" }}>
      {/* Header */}
      <div style={{ padding:"16px 16px 12px", borderBottom:`1px solid ${C.border}`, background:C.card }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:20, marginBottom:4 }}>🔍 Analyze Inspo</h2>
            <p style={{ fontSize:13, color:C.muted, lineHeight:1.5 }}>Upload photo – KI erkennt Materialien, Stil und zeigt wie du es nachmachst.</p>
          </div>
          {history.length > 0 && (
            <button onClick={() => setShowHistory(!showHistory)} style={{ flexShrink:0, marginLeft:10, padding:"6px 12px", borderRadius:20, border:`1px solid ${C.border}`, background:showHistory?C.accent:C.card, color:showHistory?"white":C.muted, fontSize:12, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontWeight:600 }}>
              📚 {history.length}
            </button>
          )}
        </div>

        {/* Usage Display */}
        {!isFreeInspo && (
          <p style={{ fontSize:11, color: inspoLimitReached?"#B91C1C":C.muted, fontWeight:600, marginTop:6 }}>
            {inspoLimitReached ? "🔒 Limit reached" : `${inspoUsage} / ${plan==="pro"?"∞":inspoLimit} Analysen diesen Monat`}
          </p>
        )}

        {/* Hook Banner */}
        <div style={{ marginTop:12, background:"#1A1A1A", borderRadius:14, padding:"14px 16px", display:"flex", gap:12, alignItems:"center" }}>
          <div style={{ flexShrink:0, fontSize:24 }}>📱</div>
          <div style={{ flex:1 }}>
            <p style={{ fontSize:13, fontWeight:700, color:"white", marginBottom:3 }}>{T["de"].inspoHook}</p>
            <p style={{ fontSize:11, color:"#aaa", lineHeight:1.5 }}>{T["de"].inspoSub}</p>
          </div>
        </div>
      </div>

      {/* History Ansicht */}
      {showHistory && (
        <div style={{ padding:"14px 16px", borderBottom:`1px solid ${C.border}`, background:C.bg }}>
          <p style={{ fontSize:12, color:C.muted, marginBottom:10, fontStyle:"italic" }}>Saved analyses – tippe zum Wiederherstellen</p>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {history.map(h => (
              <div key={h.id} style={{ display:"flex", gap:10, background:C.card, border:`1px solid ${C.border}`, borderRadius:12, overflow:"hidden", cursor:"pointer" }}
                onClick={() => { setImgPreview(h.preview); setAnalysis(h.analysis); setShowHistory(false); }}>
                <img src={h.preview} alt="" style={{ width:64, height:56, objectFit:"cover", flexShrink:0 }} />
                <div style={{ flex:1, padding:"8px 10px" }}>
                  <p style={{ fontSize:13, fontWeight:700, color:C.text }}>{h.analysis?.stil || "Analyse"}</p>
                  <p style={{ fontSize:11, color:C.muted }}>{h.date} · {h.analysis?.budget || ""}</p>
                </div>
                <button onClick={e => { e.stopPropagation(); deleteFromHistory(h.id); }} style={{ background:"none", border:"none", color:"#CCC", cursor:"pointer", padding:"8px", fontSize:16, alignSelf:"center" }}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ padding:"14px 16px" }}>
        {/* Upload Area */}
        <div onClick={() => fileRef.current?.click()} style={{ border:`2px dashed ${imgPreview?C.accent:C.border}`, borderRadius:16, padding: imgPreview?"0":"32px 16px", cursor:"pointer", background:imgPreview?C.card:C.accentBg, marginBottom:14, overflow:"hidden", textAlign: imgPreview?"left":"center", position:"relative" }}>
          {imgPreview ? (
            <div style={{ position:"relative" }}>
              <img src={imgPreview} alt="" style={{ width:"100%", maxHeight:260, objectFit:"cover", display:"block" }} />
              <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)" }} />
              <div style={{ position:"absolute", bottom:12, left:14, right:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <p style={{ color:"white", fontWeight:700, fontSize:13 }}>📷 Foto hochgeladen</p>
                <button onClick={e => { e.stopPropagation(); setImgFile(null); setImgPreview(null); setAnalysis(null); }} style={{ background:"rgba(255,255,255,0.2)", border:"none", color:"white", borderRadius:20, padding:"4px 10px", fontSize:12, cursor:"pointer" }}>Anderes Foto</button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ fontSize:40, marginBottom:10 }}>📷</div>
              <p style={{ fontSize:15, fontWeight:700, color:C.accent, marginBottom:4 }}>Upload inspiration photo</p>
              <p style={{ fontSize:13, color:C.muted }}>Pinterest, Instagram, magazine – AI analyzes instantly</p>
            </>
          )}
        </div>
        <input type="file" ref={fileRef} accept="image/*" onChange={onFile} style={{ display:"none" }} />

        {/* Loading */}
        {loading && (
          <div className="fu" style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"20px 16px", textAlign:"center", marginBottom:14 }}>
            <div style={{ display:"flex", justifyContent:"center", gap:6, marginBottom:10 }}>
              {[0,1,2].map(j => <div key={j} style={{ width:10, height:10, borderRadius:"50%", background:C.accent, animation:`blink 1.2s ease ${j*0.2}s infinite` }} />)}
            </div>
            <p style={{ fontSize:14, fontWeight:600, color:C.text }}>KI analysiert Materialien...</p>
            <p style={{ fontSize:12, color:C.muted, marginTop:4 }}>Erkennt Fliesen, Holz, Armaturen, Farben</p>
          </div>
        )}

        {/* Error */}
        {error && <div style={{ background:"#FEF2F2", border:"1px solid #FCA5A5", borderRadius:12, padding:"12px 14px", marginBottom:14 }}><p style={{ color:"#B91C1C", fontSize:13 }}>❌ {error}</p></div>}

        {/* Analysis Result */}
        {analysis && (
          <div className="fu">
            {/* Stil & Stimmung */}
            <div style={{ background:`linear-gradient(135deg, ${C.accent}22, ${C.accentBg})`, border:`1px solid ${C.accent}44`, borderRadius:14, padding:"16px", marginBottom:14 }}>
              <p style={{ fontFamily:"'Playfair Display',serif", fontSize:20, color:C.text, marginBottom:6 }}>✨ {analysis.stil}</p>
              <p style={{ fontSize:13, color:C.text, lineHeight:1.65, marginBottom:12 }}>{analysis.stimmung}</p>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {analysis.farben?.map((f,i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <div style={{ width:24, height:24, borderRadius:6, background:f, border:"2px solid rgba(0,0,0,0.1)", flexShrink:0 }} />
                    <span style={{ fontSize:11, color:C.muted }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Eckdaten */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:14 }}>
              {[
                { label:"Budget", val:analysis.budget, icon:"💶" },
                { label:"Zeitaufwand", val:analysis.zeitaufwand, icon:"⏱" },
                { label:"Schwierigkeit", val:analysis.schwierigkeit, icon:"🔧" },
              ].map(({label,val,icon}) => (
                <div key={label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"10px 10px 8px", textAlign:"center" }}>
                  <p style={{ fontSize:16, marginBottom:4 }}>{icon}</p>
                  <p style={{ fontSize:10, color:C.muted, marginBottom:3 }}>{label}</p>
                  <p style={{ fontSize:12, fontWeight:700, color: label==="Schwierigkeit" ? (SCHWIERIGKEIT_COLOR[val]||C.text) : C.text, lineHeight:1.3 }}>{val}</p>
                </div>
              ))}
            </div>

            {/* Materialien */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, marginBottom:14, overflow:"hidden" }}>
              <div style={{ padding:"12px 14px", background:C.accentBg, borderBottom:`1px solid ${C.border}` }}>
                <p style={{ fontSize:14, fontWeight:700, color:C.accent }}>🪨 Erkannte Materialien</p>
              </div>
              {analysis.materialien?.map((mat, i) => (
                <div key={i} style={{ padding:"12px 14px", borderBottom:i<analysis.materialien.length-1?`1px solid ${C.border}`:"none" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:2 }}>
                        <span style={{ fontSize:11, background:C.tag, color:C.muted, padding:"1px 7px", borderRadius:20, flexShrink:0 }}>{mat.bereich}</span>
                        {mat.farbe && <span style={{ fontSize:11, color:C.muted }}>{mat.farbe}</span>}
                      </div>
                      <p style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:2 }}>{mat.material}</p>
                      {mat.produkt && <p style={{ fontSize:12, color:C.muted }}>{mat.produkt}</p>}
                    </div>
                    {mat.preis && <span style={{ fontSize:12, fontWeight:600, color:C.green, flexShrink:0, marginLeft:10 }}>{mat.preis}</span>}
                  </div>
                  {mat.amazon && (
                    <a href={`https://www.amazon.de/s?k=${encodeURIComponent(mat.amazon)}&tag=${AFFILIATE_TAG}`} target="_blank" rel="noopener noreferrer"
                      style={{ display:"inline-flex", alignItems:"center", gap:4, marginTop:4, background:C.greenBg, color:C.green, borderRadius:20, padding:"4px 11px", fontSize:12, textDecoration:"none", fontWeight:600 }}>
                      🛒 {mat.amazon}
                    </a>
                  )}
                </div>
              ))}
            </div>

            {/* So machst du es nach */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, marginBottom:14, overflow:"hidden" }}>
              <div style={{ padding:"12px 14px", background:"#F0F7FF", borderBottom:`1px solid ${C.border}` }}>
                <p style={{ fontSize:14, fontWeight:700, color:"#1E40AF" }}>🔨 So machst du es nach</p>
              </div>
              <div style={{ padding:"12px 14px" }}>
                {analysis.umsetzung?.map((schritt, i) => (
                  <div key={i} style={{ display:"flex", gap:10, marginBottom:i<analysis.umsetzung.length-1?10:0 }}>
                    <div style={{ width:24, height:24, borderRadius:"50%", background:C.accent, color:"white", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, flexShrink:0 }}>{i+1}</div>
                    <p style={{ fontSize:13, color:C.text, lineHeight:1.55, flex:1, paddingTop:3 }}>{schritt.replace(/^Step \d+:\s*/,"")}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Profi-Tipps */}
            {analysis.profi_tipps?.length > 0 && (
              <div style={{ background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:14, padding:"14px", marginBottom:14 }}>
                <p style={{ fontSize:13, fontWeight:700, color:"#B45309", marginBottom:8 }}>⚡ Profi-Tipps</p>
                {analysis.profi_tipps.map((tip,i) => (
                  <p key={i} style={{ fontSize:13, color:"#7C4A03", lineHeight:1.6, marginBottom:i<analysis.profi_tipps.length-1?6:0 }}>• {tip}</p>
                ))}
              </div>
            )}

            {/* Sofort-Upgrades */}
            {analysis.sofort_upgrades?.length > 0 && (
              <div style={{ background:C.greenBg, border:`1px solid ${C.green}44`, borderRadius:14, padding:"14px", marginBottom:14 }}>
                <p style={{ fontSize:13, fontWeight:700, color:C.green, marginBottom:8 }}>✅ Guenstige Sofort-Upgrades</p>
                {analysis.sofort_upgrades.map((up,i) => (
                  <p key={i} style={{ fontSize:13, color:"#1A4731", lineHeight:1.6, marginBottom:i<analysis.sofort_upgrades.length-1?6:0 }}>• {up}</p>
                ))}
              </div>
            )}

            {/* Neues Foto */}
            <button onClick={() => fileRef.current?.click()} style={{ width:"100%", padding:"13px", borderRadius:50, border:`2px solid ${C.accent}`, background:C.accentBg, color:C.accent, fontWeight:700, cursor:"pointer", fontSize:14, fontFamily:"'DM Sans',sans-serif" }}>
              📷 Naechstes Foto analysieren
            </button>
          </div>
        )}

        {/* Hinweis wenn noch kein Foto */}
        {!imgPreview && !loading && (
          <div style={{ marginTop:8 }}>
            <p style={{ fontSize:12, color:C.muted, marginBottom:12, textAlign:"center", fontStyle:"italic" }}>Examples of what you can upload:</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {[
                { emoji:"🚿", text:"Dream bathroom from Pinterest" },
                { emoji:"🍳", text:"Kitchen from magazine" },
                { emoji:"🛋️", text:"Living room inspo" },
                { emoji:"🛏️", text:"Bedroom idea" },
              ].map(({emoji,text}) => (
                <div key={text} onClick={() => fileRef.current?.click()} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"14px", textAlign:"center", cursor:"pointer" }}>
                  <div style={{ fontSize:24, marginBottom:6 }}>{emoji}</div>
                  <p style={{ fontSize:12, color:C.muted }}>{text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── IDEEN TAB ────────────────────────────────────────────────────────────────
const TRENDS = [
  // ── BAD (15) ─────────────────────────────────────────────────────────────────
  { cat:"Bathroom", title:"Walk-In Regendusche", desc:"Bodengleiche Dusche mit Decken-Regendusche 30×30cm. Gefaelleestrich 1,5%, Schlueter KERDI Abdichtung, 8mm ESG-Glas. Kein Stemmen wenn neu aufgebaut.", how:"Installateur + DIY", budget:"1.500–5.000€", emoji:"🚿", img:"https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&h=220&fit=crop&q=80", amazon:"walk-in dusche regendusche set glaswand 8mm" },
  { cat:"Bathroom", title:"Freistehende Badewanne", desc:"Acryl-Wanne freistehend mit Bodenarmatur – das Statement-Stueck jedes Bades. Montage: nur Ablauf + Zulauf noetig, kein Einbauen.", how:"Installateur", budget:"800–3.000€", emoji:"🛁", img:"https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=600&h=220&fit=crop&q=80", amazon:"freistehende badewanne weiss acryl oval" },
  { cat:"Bathroom", title:"Mikrozement Spa-Bad", desc:"Fugenloser Betonlook direkt ueber Fliesen. 3 Lagen + 2× PU-Versiegelung. Antibakteriell, pflegeleicht – wirkt wie ein 5-Sterne-Hotel.", how:"DIY mit Uebung", budget:"60–120€/m²", emoji:"🏛️", img:"https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=600&h=220&fit=crop&q=80", amazon:"mikrozement set boden wand bad komplett" },
  { cat:"Bathroom", title:"Mattschwarz Armaturen Set", desc:"Grohe Essence oder Hansgrohe Metropol in Mattschwarz. Armatur tauschen = DIY 2h. Kombiniert mit Holz-Waschtisch = perfekter Kontrast.", how:"DIY – 2 hours", budget:"200–600€", emoji:"🖤", img:"https://images.unsplash.com/photo-1575844611782-6c3a7d57ae3d?w=600&h=220&fit=crop&q=80", amazon:"grohe armatur mattschwarz bad set" },
  { cat:"Bathroom", title:"Handgemachte Zellige Fliesen", desc:"Marokkanische 10×10cm Fliesen – jede einzigartig. Ueber alte Fliesen mit Flex C2. Wand oder Duschbereich als Akzent.", how:"DIY – weekend", budget:"40–120€/m²", emoji:"🟤", img:"https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&h=220&fit=crop&q=80", amazon:"zellige fliesen handgemacht 10x10" },
  { cat:"Bathroom", title:"Grossformat 120×60cm Feinsteinzeug", desc:"Weniger Fugen = mehr Luxus. Laesst Baeder groesser wirken. Doppelklebung Pflicht! Nivelliersystem verwenden bei >60×60.", how:"Fliesenleger", budget:"35–70€/m²", emoji:"⬛", img:"https://images.unsplash.com/photo-1620626011761-996317702782?w=600&h=220&fit=crop&q=80", amazon:"feinsteinzeug 120x60 anthrazit bad" },
  { cat:"Bathroom", title:"Schwebender Holz-Waschtisch", desc:"Teak oder Eiche, wandhaengend. Rigips-Vorwand wenn kein Hohlraum. Macht Boden optisch groesser – Spa-Feeling sofort.", how:"Installateur + DIY", budget:"400–1.200€", emoji:"🪵", img:"https://images.unsplash.com/photo-1604709177225-055f99402ea3?w=600&h=220&fit=crop&q=80", amazon:"waschtisch eiche teak schwebend wandmontage" },
  { cat:"Bathroom", title:"Hinterleuchteter LED-Spiegel", desc:"IP44, dimmbar, Beschlagschutz. Stecker-Anschluss = kein Elektriker. Sofortiger Wow-Effekt fuer unter 150€.", how:"DIY – 30 Min", budget:"80–400€", emoji:"💡", img:"https://images.unsplash.com/photo-1600147831337-1f7ea73a3e40?w=600&h=220&fit=crop&q=80", amazon:"led spiegel bad hinterbeleuchtet ip44 dimmbar" },
  { cat:"Bathroom", title:"Marmor-Look Grossformat", desc:"Marmor-Optik Feinsteinzeug – pflegeleichter als echter Marmor. 80×160cm fuer maximalen Luxus-Effekt.", how:"Fliesenleger", budget:"45–90€/m²", emoji:"🏔️", img:"https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&h=220&fit=crop&q=80", amazon:"marmor optik fliesen grossformat bad" },
  { cat:"Bathroom", title:"Indirekte LED-Deckenbeleuchtung", desc:"LED-Cove-Licht im Badezimmer = Spa-Atmosphaere rund um die Uhr. IP44, 2700K, dimmbar. Rigips-Kastenblende an Decke.", how:"DIY+Elektriker", budget:"200–500€", emoji:"✨", img:"https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=600&h=220&fit=crop&q=80", amazon:"led strip 2700k bad decke ip44 cove" },
  { cat:"Bathroom", title:"Japandi Bad Minimalistisch", desc:"Holz, Beton, Gruenpflanze – reduziert auf das Wesentliche. Tadelakt-Waende oder Mikrozement, Hinoki-Holzhocker, bodentiefe Fenster.", how:"Medium", budget:"2.000–6.000€", emoji:"🎋", img:"https://images.unsplash.com/photo-1604709177225-055f99402ea3?w=600&h=220&fit=crop&q=80", amazon:"japandi bad holzhocker tadelakt" },
  { cat:"Bathroom", title:"Badewanne einmauern mit Ablageflaeche", desc:"Eingemauerte Wanne mit Ablage/Sitzbank daneben aus Feinsteinzeug. Integriert Stauraum und Sitzflaeche. Beton- oder Holzoptik moeglich.", how:"Fliesenleger", budget:"1.500–4.000€", emoji:"🛀", img:"https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=600&h=220&fit=crop&q=80", amazon:"eingemauerte badewanne fliesen feinsteinzeug" },
  { cat:"Bathroom", title:"Doppelwaschbecken Gemeinsam", desc:"Zwei Waschbecken nebeneinander auf einem langen Waschtischunterschrank. Ideal fuer Paare. Spart morgens Zeit.", how:"Installateur", budget:"600–2.000€", emoji:"👫", img:"https://images.unsplash.com/photo-1575844611782-6c3a7d57ae3d?w=600&h=220&fit=crop&q=80", amazon:"doppelwaschbecken waschtisch 120cm set" },
  { cat:"Bathroom", title:"Heizkoerper als Design-Element", desc:"Handtuchtrockner in Mattschwarz oder Gebuerstetes Gold als Statement. Spart Platz und trocknet Handtuecher.", how:"Installateur", budget:"150–500€", emoji:"🔥", img:"https://images.unsplash.com/photo-1600147831337-1f7ea73a3e40?w=600&h=220&fit=crop&q=80", amazon:"badheizkoerper handtuchtrockner mattschwarz design" },
  { cat:"Bathroom", title:"Wandnische mit Beleuchtung", desc:"In der Duschwand eine Nische aussparen: Ablageflaeche fuer Shampoo und dekorative Kerzen. Mit LED-Strip beleuchtet = Highlight.", how:"Fliesenleger", budget:"200–600€", emoji:"💎", img:"https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&h=220&fit=crop&q=80", amazon:"duschablage nische edelstahl einbau led" },

  // ── KUeCHE (15) ────────────────────────────────────────────────────────────────
  { cat:"Kitchen", title:"Navy Blue Shaker Kueche", desc:"Dunkelblau mit Messing-Griffen und Marmor-Arbeitsplatte. RAL 5011 Stahlblau oder F&B Hague Blue. Klassisch und zeitlos.", how:"DIY 2-3 days", budget:"150–500€", emoji:"🔵", img:"https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=220&fit=crop&q=80", amazon:"kueche navy blau fronten lackieren" },
  { cat:"Kitchen", title:"Opene Eichenregale", desc:"Haengeschraenke raus, schwebende 4cm-Massivholzbretter rein. Raum wirkt sofort groesser. OBI schneidet auf Mass.", how:"DIY – halber day", budget:"100–350€", emoji:"📚", img:"https://images.unsplash.com/photo-1556909211-36987e6e9a65?w=600&h=220&fit=crop&q=80", amazon:"massivholz regal eiche 4cm kueche schwebregal" },
  { cat:"Kitchen", title:"Kuecheninsel aus KALLAX", desc:"IKEA KALLAX + dicke Massivholzplatte = guenstige Insel. Barhocker dazu = Familientreffpunkt. Unter 600€.", how:"DIY – weekend", budget:"300–700€", emoji:"🏝️", img:"https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=600&h=220&fit=crop&q=80", amazon:"kuecheninsel massivholzplatte eiche ikea kallax" },
  { cat:"Kitchen", title:"Zellige Rueckwand Metro", desc:"Handgemachte 7,5×15cm Fliesen als Kuechenrueckwand. Direkt ueber alte Fliesen. Weiss, Cremé oder Salbeigruen.", how:"DIY – 1 day", budget:"50–150€", emoji:"⬜", img:"https://images.unsplash.com/photo-1556909048-f0a46d7c3c0a?w=600&h=220&fit=crop&q=80", amazon:"metro fliesen zellige kueche rueckwand" },
  { cat:"Kitchen", title:"Messing & Kupfer Hardware", desc:"Griffe, Armatur, Haengelampen in gebuerstetem Messing. 128mm Buegel-Griffe tauschen = 30 Min, grosser Effekt.", how:"DIY – 30 Min", budget:"40–200€", emoji:"✨", img:"https://images.unsplash.com/photo-1556910638-6cdac31d8c23?w=600&h=220&fit=crop&q=80", amazon:"kuechen griffe messing gebuerstet set 20stueck" },
  { cat:"Kitchen", title:"Holz-Arbeitsplatte Butcher Block", desc:"Massivholz (Buche/Eiche/Nussbaum) als Kontrast zu dunklen Fronten. Jaehrlich Osmo-Oel. Schnittkanten SOFORT abdichten!", how:"DIY bei Tausch", budget:"80–350€", emoji:"🪵", img:"https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=600&h=220&fit=crop&q=80", amazon:"holzarbeitsplatte kueche massiv buche eiche geoelt" },
  { cat:"Kitchen", title:"LED-Strip unter Oberschraenken", desc:"2700K warmweiss unter allen Oberschraenken = Arbeitslicht + Atmosphaere. Macht Essen appetitlicher. Komplettset mit Trafo 30€.", how:"DIY – 1 hour", budget:"30–80€", emoji:"💡", img:"https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=220&fit=crop&q=80", amazon:"led strip kueche unterschrank 2700k warmweiss" },
  { cat:"Kitchen", title:"Sage Green Shaker Fronten", desc:"Salbeigruen (RAL 6021) mit Messinggriffen und Live-Edge Regal darueber. Warm, bodenstaendig, Instagram-wuerdig.", how:"DIY 2-3 days", budget:"100–400€", emoji:"🌿", img:"https://images.unsplash.com/photo-1556910638-6cdac31d8c23?w=600&h=220&fit=crop&q=80", amazon:"kueche salbeigruen fronten haftgrund seidenmatt" },
  { cat:"Kitchen", title:"Pendelleuchten ueber Insel", desc:"3 Pendelleuchten im gleichen Abstand ueber Insel oder Tisch. Abstand: 65–75cm zur Flaeche. Globe, Sputnik oder Industrial.", how:"Elektriker", budget:"100–600€", emoji:"💫", img:"https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=600&h=220&fit=crop&q=80", amazon:"pendelleuchte kueche insel set 3er gold" },
  { cat:"Kitchen", title:"Grifflose J-Pull Fronten", desc:"Fraesung oben an der Frontseite statt Griffe = cleaner minimalistischer Look. Tip-On oder J-Pull Profil moeglich.", how:"Tischler / Montage", budget:"300–800€", emoji:"🤍", img:"https://images.unsplash.com/photo-1556909048-f0a46d7c3c0a?w=600&h=220&fit=crop&q=80", amazon:"grifflose fronten j-pull kueche modern" },
  { cat:"Kitchen", title:"Betonsteinoptik Kuechenboden", desc:"Grossformatige Feinsteinzeug-Fliesen in Betonoptik fuer den Kuechenboden. Pflegeleicht, zeitlos. Ueber alte Fliesen moeglich.", how:"Fliesenleger", budget:"25–50€/m²", emoji:"🔲", img:"https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=600&h=220&fit=crop&q=80", amazon:"beton optik fliesen kueche feinsteinzeug grau" },
  { cat:"Kitchen", title:"Dunstabzug als Statement", desc:"Edelstahl-Esse oder Wand-Haube in Mattschwarz als Designelement statt versteckt. Schornstein-Look oder Glockenform.", how:"Montage", budget:"300–1.500€", emoji:"🏭", img:"https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=600&h=220&fit=crop&q=80", amazon:"dunstabzugshaube wandhaube mattschwarz design" },
  { cat:"Kitchen", title:"Quarzstein Arbeitsplatte", desc:"Quarz (Silestone, Compac) – Naturstein-Look ohne Versiegelung. Hitze- und kratzfest. 2cm oder schlanke 1,2cm Kante.", how:"Profi-Montage", budget:"400–1.200€", emoji:"💎", img:"https://images.unsplash.com/photo-1556909211-36987e6e9a65?w=600&h=220&fit=crop&q=80", amazon:"quarzstein arbeitsplatte silestone kueche" },
  { cat:"Kitchen", title:"Pantry-Schrank Stauraum", desc:"Hoher Vorratsschrank neben dem Kuehlschrank mit ausziehbaren Einsaetzen und LED-Innenbeleuchtung. Stauraum verdoppeln.", how:"Tischler / IKEA", budget:"300–1.000€", emoji:"📦", img:"https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=220&fit=crop&q=80", amazon:"pantry schrank kueche stauraum lebensmittel" },
  { cat:"Kitchen", title:"Mikrozement Kuechenrueckwand", desc:"Fugenlose Mikrozement-Rueckwand statt Fliesen. Einfach zu reinigen, aussergewoehnlicher Look. Anthrazit oder Warm-Greige.", how:"Mittel-DIY", budget:"80–200€/m²", emoji:"🏛️", img:"https://images.unsplash.com/photo-1556910638-6cdac31d8c23?w=600&h=220&fit=crop&q=80", amazon:"mikrozement kueche rueckwand arbeitsbereich" },

  // ── WOHNZIMMER (15) ───────────────────────────────────────────────────────────
  { cat:"Living Room", title:"Dunkelgruen Akzentwand", desc:"Eine Wand in Flaschengruen RAL 6009. Lammfellrolle, 2 Schichten. 30–60€ fuer den groessten Raumeffekt ueberhaupt.", how:"DIY – 1 day", budget:"30–80€", emoji:"🌿", img:"https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=220&fit=crop&q=80", amazon:"wandfarbe dunkelgruen matt alpina schoener wohnen" },
  { cat:"Living Room", title:"Fluted Panel TV-Wand", desc:"Gerillte MDF-Latten hinter dem TV, LED-Strip dahinter. Vorher oelen oder lackieren. Magazin-Look fuer 150€.", how:"DIY – halber day", budget:"80–250€", emoji:"📺", img:"https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=220&fit=crop&q=80", amazon:"mdf fluted panel wandpaneele holzoptik" },
  { cat:"Living Room", title:"Cove-Licht Deckenrand", desc:"Holzrahmen 15cm an Decke, LED-Strip 2700K dahinter. Waermstes Licht = Hotel-Feeling. Trafo hinter Kastenblende.", how:"DIY – weekend", budget:"150–400€", emoji:"✨", img:"https://images.unsplash.com/photo-1600210492493-0946911123ea?w=600&h=220&fit=crop&q=80", amazon:"led strip 2700k cove kastenblende decke" },
  { cat:"Living Room", title:"Erdtoene Rattan & Jute 2026", desc:"Terrakotta, Ocker, Sandstein. Rattan-Sessel, Jute-Teppich 200×300, handgemachte Keramik. Sofort ohne Handwerker.", how:"Sofort", budget:"200–600€", emoji:"🍂", img:"https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=220&fit=crop&q=80", amazon:"rattan sessel jute teppich terrakotta wohnzimmer" },
  { cat:"Living Room", title:"Limewash Strukturwand", desc:"Kalkputz-Optik mit lebendiger Textur. Ueber normaler Farbe moeglich. Warm Greige, Rosa, Taubenblau – jede Wand einzigartig.", how:"DIY – 1 day", budget:"40–120€", emoji:"🏺", img:"https://images.unsplash.com/photo-1558882224-dda166733046?w=600&h=220&fit=crop&q=80", amazon:"limewash farbe kalkputz optik strukturfarbe" },
  { cat:"Living Room", title:"Einbauregal Boden bis Decke", desc:"MDF Regal von Wand zu Wand. LED-Strip dahinter in der Kastenblende. Weiss lackiert oder Eiche furniert.", how:"2 weekends", budget:"400–1.500€", emoji:"📖", img:"https://images.unsplash.com/photo-1509644851169-2acc08aa25b5?w=600&h=220&fit=crop&q=80", amazon:"einbauregal mdf wohnzimmer boden decke" },
  { cat:"Living Room", title:"Bouclé Sofa Curved", desc:"Geschwungenes Bouclé-Sofa in Creme oder Hellgrau. Der Sofa-Trend 2026. Kombiniert mit Terrakotta-Wand = perfekt.", how:"Kauf", budget:"800–3.000€", emoji:"🛋️", img:"https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=220&fit=crop&q=80", amazon:"bouclé sofa curved wohnzimmer creme" },
  { cat:"Living Room", title:"Botanisches Wohnzimmer", desc:"Grosse Monstera, Fiddle Leaf Fig, Olivenbaum als Hauptelemente – nicht als Beiwerk. Koerbe als Toepfe, helle Ecken.", how:"Sofort", budget:"100–400€", emoji:"🌱", img:"https://images.unsplash.com/photo-1416879595882-b3d065a0e45d?w=600&h=220&fit=crop&q=80", amazon:"monstera gross topf rattan zimmerpflanzen" },
  { cat:"Living Room", title:"Smart Home Licht Shelly", desc:"Shelly Relais hinter den Lichtschalter – App-steuerbar, kein Elektriker. Mit Alexa/Google Home. Szenen einrichten.", how:"DIY – 30 Min", budget:"20–60€", emoji:"📱", img:"https://images.unsplash.com/photo-1600210492493-0946911123ea?w=600&h=220&fit=crop&q=80", amazon:"shelly dimmer smart home lichtschalter" },
  { cat:"Living Room", title:"Holzboden Fischgraet", desc:"Fertigparkett in Fischgraet verlegt – eleganteste Verlegeart. Optisch breiter Raum. Eiche geoelt, 12cm Width.", how:"DIY – weekend", budget:"40–80€/m²", emoji:"⬛", img:"https://images.unsplash.com/photo-1562663474-6cbb3eaa4d14?w=600&h=220&fit=crop&q=80", amazon:"doneparkett eiche fischgraet wohnzimmer" },
  { cat:"Living Room", title:"Bogenlampe Messing XXL", desc:"Grosse Bogenlampe in gebuerstetem Messing oder Schwarz = sofortiger Luxus-Effekt. Kein Elektriker – Stecker.", how:"Kauf+Aufbau", budget:"150–600€", emoji:"🌙", img:"https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=220&fit=crop&q=80", amazon:"bogenlampe messing gross wohnzimmer stehlampe" },
  { cat:"Living Room", title:"Dunkle Velvet Vorhaenge", desc:"Bodenlange Samtvorhaenge von Decke bis Boden machen jeden Raum opulenter. Immer 20cm breiter als das Fenster!", how:"Aufhaengen", budget:"80–300€", emoji:"🎭", img:"https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&h=220&fit=crop&q=80", amazon:"samtvorhang velvet dunkel bodenlang oesenvorhang" },
  { cat:"Living Room", title:"Galerien-Wand Gallery Wall", desc:"5–9 Bilder in verschiedenen Groessen als Wand-Arrangement. Vorher auf dem Boden layouten, dann mit Spirit level aufhaengen.", how:"DIY", budget:"50–200€", emoji:"🖼️", img:"https://images.unsplash.com/photo-1509644851169-2acc08aa25b5?w=600&h=220&fit=crop&q=80", amazon:"bilderrahmen set gallery wall galerie wand" },
  { cat:"Living Room", title:"Stein-Optik Akzentwand", desc:"Leichte 3D-Wandpaneele in Naturstein-Optik (Kalkstein, Schiefer). Kleben, keine Duebel. Kamin oder TV-Wand.", how:"DIY – 2 hours", budget:"30–80€/m²", emoji:"🪨", img:"https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?w=600&h=220&fit=crop&q=80", amazon:"wandpaneele steinoptik 3d kalkstein schiefer" },

  // ── SCHLAFZIMMER (12) ─────────────────────────────────────────────────────────
  { cat:"Bedroom", title:"Bouclé Kopfteil Selbst gemacht", desc:"MDF (OBI auf Mass) + Schaumstoff 5cm RG35 + Bouclé tackern. Hotel-Feeling fuer 150€. Wand dahinter in Terrakotta.", how:"DIY – 4h", budget:"80–200€", emoji:"🛏️", img:"https://images.unsplash.com/photo-1617325247661-675ab4b64ae2?w=600&h=220&fit=crop&q=80", amazon:"bouclé stoff creme polster kopfteil meterware" },
  { cat:"Bedroom", title:"Nachtblau Decke", desc:"Nur die Decke in Hague Blue oder Nachtblau. Waende weiss. Geborgenheitsgefuehl wie unter dem Sternenhimmel.", how:"DIY – 3h", budget:"25–60€", emoji:"🌙", img:"https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&h=220&fit=crop&q=80", amazon:"wandfarbe nachtblau decke matt dunkel" },
  { cat:"Bedroom", title:"Wandleuchten Gelenkarm", desc:"Beidseitig neben dem Bett, 2200K, Stecker-Version = kein Elektriker. Messing oder Mattschwarz. Tischlampen ersetzen.", how:"DIY – 30 Min", budget:"60–250€", emoji:"💡", img:"https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=600&h=220&fit=crop&q=80", amazon:"wandleuchte gelenkarm bett messing leselampe" },
  { cat:"Bedroom", title:"Japandi Schlafzimmer", desc:"Holzlatten vertikal an der Wand, niedriges Plattform-Bett, Greige-Toene, ein grosser Ast als Deko. Zen pur.", how:"DIY – 1 day", budget:"100–400€", emoji:"🎋", img:"https://images.unsplash.com/photo-1540518614846-7eded433c457?w=600&h=220&fit=crop&q=80", amazon:"japandi schlafzimmer holzlatten niedrig bett" },
  { cat:"Bedroom", title:"Begehbarer Kleiderschrank", desc:"Aus einer Ecke oder kleinem Zimmer einen Walk-in-Closet bauen. Pax-System IKEA oder Massandoneung. Traumziel vieler.", how:"weekend", budget:"400–2.000€", emoji:"👗", img:"https://images.unsplash.com/photo-1617325247661-675ab4b64ae2?w=600&h=220&fit=crop&q=80", amazon:"begehbarer kleiderschrank system einbau pax" },
  { cat:"Bedroom", title:"Leinenbettwaesche & Schichten", desc:"Qualitaets-Leinenbettwaesche + Baumwolldecken + Wurfkissen in 3 Toenen. Hotel-Feeling ohne Umbau.", how:"Sofort", budget:"80–250€", emoji:"🛌", img:"https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&h=220&fit=crop&q=80", amazon:"leinen bettwaesche natuerlich gewaschener leinen" },
  { cat:"Bedroom", title:"Dunkles Luxus Schlafzimmer", desc:"Charcoal-Waende, Messingakzente, samtiger Teppich, bodenlange Vorhaenge. Moodylooks sind Trend 2026.", how:"Streichen + Kaufen", budget:"200–800€", emoji:"🌑", img:"https://images.unsplash.com/photo-1540518614846-7eded433c457?w=600&h=220&fit=crop&q=80", amazon:"wandfarbe dunkel anthrazit schlafzimmer samt teppich" },
  { cat:"Bedroom", title:"Verdunkelungsrollos Kassette", desc:"Kassetten-Rollo direkt am Fensterfluegel – komplett dunkel auch im Sommer. Entscheidend fuer Schlafqualitaet.", how:"DIY – 30 Min", budget:"30–120€", emoji:"🌚", img:"https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=600&h=220&fit=crop&q=80", amazon:"verdunklungsrollo kassette klebemontage" },
  { cat:"Bedroom", title:"Terrakotta Akzentwand Bett", desc:"Nur die Wand hinter dem Bett in Terrakotta (Alpina Florentiner Erde). Rest weiss. Bouclé-Kissen ergaenzen.", how:"DIY – 2h", budget:"20–45€", emoji:"🔶", img:"https://images.unsplash.com/photo-1617325247661-675ab4b64ae2?w=600&h=220&fit=crop&q=80", amazon:"wandfarbe terrakotta alpina florentiner erde" },
  { cat:"Bedroom", title:"Holz-Bettkopfteil Naturholz", desc:"Massivholz-Kopfteil aus roher Eiche oder Nussbaum. Organische Form, kein Schleifen noetig. Charaktervoll.", how:"Kauf/DIY", budget:"150–600€", emoji:"🌲", img:"https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&h=220&fit=crop&q=80", amazon:"kopfteil massivholz eiche nussbaum bett" },
  { cat:"Bedroom", title:"Einbauschrank mit Schiebetuer", desc:"Rahmenlose Schiebetuer mit Spiegelflaeche = Raum wirkt doppelt so gross. Profil in Mattschwarz oder Weiss.", how:"Tischler", budget:"800–3.000€", emoji:"🪞", img:"https://images.unsplash.com/photo-1540518614846-7eded433c457?w=600&h=220&fit=crop&q=80", amazon:"schiebetuer spiegel einbauschrank rahmenlos" },
  { cat:"Bedroom", title:"Nachttisch floating Wandmontage", desc:"Schwebender Nachttisch direkt an der Wand – kein Beingestell, minimalistisch, pflegeleicht. Eiche oder Weiss.", how:"DIY – 1h", budget:"60–250€", emoji:"🛋️", img:"https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=600&h=220&fit=crop&q=80", amazon:"nachttisch wandmontage schwebend eiche weiss" },

  // ── ESSZIMMER (8) ─────────────────────────────────────────────────────────────
  { cat:"Dining", title:"Esstisch Massivholz mit Stahl", desc:"Eiche-Platte auf schwarzen Stahlbeinen = Industrie-Look. 220cm fuer 8 Personen. Robuest, kratzfest, zeitlos.", how:"Kauf", budget:"500–2.000€", emoji:"🍽️", img:"https://images.unsplash.com/photo-1549187774-b4e9b0445b41?w=600&h=220&fit=crop&q=80", amazon:"esstisch massivholz eiche stahl beine industrial" },
  { cat:"Dining", title:"Pendelleuchten ueber Tisch", desc:"3 Kugel-Pendel oder 1 laenglicher Linear-Stab ueber dem Tisch. Abstand 65–75cm zur Tischflaeche. Warm 2700K.", how:"Elektriker", budget:"100–800€", emoji:"💡", img:"https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=600&h=220&fit=crop&q=80", amazon:"pendelleuchte esstisch linear set gold 3er" },
  { cat:"Dining", title:"Bank + Stuhl Kombi", desc:"Eine Seite Sitzbank, andere Seite Stuehle = gemuetlicher und platzsparender. Bank aus Holz oder gepolstert.", how:"Kauf", budget:"300–1.200€", emoji:"🪑", img:"https://images.unsplash.com/photo-1549187774-b4e9b0445b41?w=600&h=220&fit=crop&q=80", amazon:"sitzbank esstisch holz eiche gepolstert" },
  { cat:"Dining", title:"Gruene Pflanzenwand Esszimmer", desc:"Vertikales Pflanzenbild als lebendige Tapete. Oder einfach 3 grosse Toepfe in der Ecke. Bringt Leben in den Raum.", how:"Sofort", budget:"50–300€", emoji:"🌱", img:"https://images.unsplash.com/photo-1416879595882-b3d065a0e45d?w=600&h=220&fit=crop&q=80", amazon:"pflanzenwand vertikal indoor esszimmer" },
  { cat:"Dining", title:"Marmor-Tisch Statement", desc:"Echter Calacatta-Marmor oder guenstige Variante aus Feinsteinzeug. Rechteckig oder oval. Kombination mit Leder-Stuehlen.", how:"Kauf", budget:"600–3.000€", emoji:"💎", img:"https://images.unsplash.com/photo-1556918134-66e57c2f28e3?w=600&h=220&fit=crop&q=80", amazon:"esstisch marmor oval weiss calacatta" },
  { cat:"Dining", title:"Holzvertaefelung Esszimmer Wand", desc:"Fluted Wood Panels oder einfache Kieferleisten vertikal. Naturfarbe oelen oder weiss lackieren. Waermt jeden Raum.", how:"DIY – weekend", budget:"100–400€", emoji:"🪵", img:"https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=220&fit=crop&q=80", amazon:"holzleisten vertikal wand esszimmer fluted" },
  { cat:"Dining", title:"Velvet-Stuehle bunt als Akzent", desc:"Samtene Stuehle in Senfgelb, Dunkelgruen oder Terrakotta zu einem schlichten Tisch. Ein Farbakzent reicht.", how:"Kauf", budget:"200–800€", emoji:"🪑", img:"https://images.unsplash.com/photo-1549187774-b4e9b0445b41?w=600&h=220&fit=crop&q=80", amazon:"velvet stuhl samt esszimmer gruen terrakotta" },
  { cat:"Dining", title:"Openes Weinregal als Raumteiler", desc:"Streckenmetall- oder Holzregal teilt Wohn- und Essbereich optisch ohne Waende. Weinflaschen als Deko.", how:"DIY/Kauf", budget:"150–600€", emoji:"🍷", img:"https://images.unsplash.com/photo-1558618049-6b1cdd80a2e2?w=600&h=220&fit=crop&q=80", amazon:"weinregal wand raumteiler offen holz metall" },

  // ── FLUR & EINGANG (8) ───────────────────────────────────────────────────────
  { cat:"Hallway", title:"Dunkler Flur Dramatisch", desc:"Flur komplett dunkel streichen (Anthrazit oder Nachtblau). Heller Boden = Drama-Effekt. Wandspiegel macht ihn groesser.", how:"DIY – 2h", budget:"25–60€", emoji:"🚪", img:"https://images.unsplash.com/photo-1558882224-dda166733046?w=600&h=220&fit=crop&q=80", amazon:"wandfarbe anthrazit flur matt dunkel" },
  { cat:"Hallway", title:"Rundspiegel als Statement", desc:"Grosser runder Spiegel (80–100cm) macht den Flur sofort groesser. Messing oder Mattschwarz Rahmen.", how:"Aufhaengen", budget:"80–400€", emoji:"🪞", img:"https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=600&h=220&fit=crop&q=80", amazon:"rundspiegel gross messing flur eingang 80cm" },
  { cat:"Hallway", title:"Eingang Garderobenleiste Holz", desc:"Massivholz-Brett mit Eisen-Haken – schlicht und funktional. Alternativ: IKEA Brimnes oder Selbstbau aus Treibholz.", how:"DIY – 1h", budget:"30–150€", emoji:"🧥", img:"https://images.unsplash.com/photo-1600210492493-0946911123ea?w=600&h=220&fit=crop&q=80", amazon:"garderobenleiste holz massiv mit haken flur" },
  { cat:"Hallway", title:"Fischgraet Fliesenboden Eingang", desc:"Klassischer Fischgraet-Boden in Schwarz-Weiss oder Terrakotta fuer den Eingang. Zeitlos und wertsteigernd.", how:"Fliesenleger", budget:"35–70€/m²", emoji:"♟️", img:"https://images.unsplash.com/photo-1574739782594-db4ead022697?w=600&h=220&fit=crop&q=80", amazon:"fischgraet fliesen eingang schwarz weiss terrakotta" },
  { cat:"Hallway", title:"Tapete als Hingucker Flur", desc:"Botanische oder geometrische Tapete nur an einer Wand = Kunstwerk. Flur wird zum ersten Eindruck der wow-macht.", how:"DIY – 2h", budget:"50–200€", emoji:"🌺", img:"https://images.unsplash.com/photo-1558882224-dda166733046?w=600&h=220&fit=crop&q=80", amazon:"tapete botanisch flur eingang hingucker" },
  { cat:"Hallway", title:"Sitzbank Schuhregal Kombi", desc:"Eingangssitzbank mit Schuhaufbewahrung darunter und Haken darueber. IKEA Hemnes Hack oder Selbstbau.", how:"IKEA/DIY", budget:"100–400€", emoji:"👟", img:"https://images.unsplash.com/photo-1600147831337-1f7ea73a3e40?w=600&h=220&fit=crop&q=80", amazon:"eingangssitzbank schuhregal mit haken" },
  { cat:"Hallway", title:"Beleuchtung Sockelleisten LED", desc:"LED-Streifen in der Sockelleiste oder an der Decke = Orientierungslicht nachts ohne Schalter. Bewegungssensor.", how:"DIY", budget:"30–80€", emoji:"🔆", img:"https://images.unsplash.com/photo-1600210492493-0946911123ea?w=600&h=220&fit=crop&q=80", amazon:"led sockelleiste flur orientierungslicht bewegungssensor" },
  { cat:"Hallway", title:"Pflanzentisch Eingang Konsolenset", desc:"Schlanker Konsolentisch mit einer Pflanze, Spiegel darueber und Tablett fuer Schluessel. Erster Eindruck zaehlt.", how:"Sofort", budget:"80–300€", emoji:"🌿", img:"https://images.unsplash.com/photo-1416879595882-b3d065a0e45d?w=600&h=220&fit=crop&q=80", amazon:"konsolentisch schmal flur mit spiegel set" },

  // ── HOMEOFFICE (7) ────────────────────────────────────────────────────────────
  { cat:"Home Office", title:"Einbau-Schreibtisch an der Wand", desc:"Schwimmendes Schreibtischbrett aus Eiche oder MDF – 180cm breit, 60cm tief. Kein Gestell, mehr Platz, cleaner Look.", how:"DIY – 2h", budget:"80–250€", emoji:"💻", img:"https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600&h=220&fit=crop&q=80", amazon:"schreibtisch wandmontage schwebend eiche" },
  { cat:"Home Office", title:"Buecherregal als Hintergrund", desc:"Vollgepacktes Buecherregal als Zoom-Hintergrund macht Eindruck. Einbau-Billy-Hack oder Massregal.", how:"IKEA/Tischler", budget:"200–800€", emoji:"📚", img:"https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&h=220&fit=crop&q=80", amazon:"buechterregal einbau wand homeoffice" },
  { cat:"Home Office", title:"Akustikpaneele Filz", desc:"Filz- oder Schaumstoff-Akustikpaneele reduzieren Echo deutlich – wichtig fuer Videokonferenzen. Auch dekorativ.", how:"DIY – 1h", budget:"50–200€", emoji:"🎵", img:"https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=600&h=220&fit=crop&q=80", amazon:"akustikpaneele filz homeoffice schall" },
  { cat:"Home Office", title:"Pegboard Wand Organizer", desc:"Lochplatten-System fuer Werkzeuge, Stifte, Notizen. Ikea Skadis oder individuell. Flexibel und dekorativ.", how:"DIY – 1h", budget:"30–100€", emoji:"📌", img:"https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=600&h=220&fit=crop&q=80", amazon:"pegboard lochplatte organizer buero wand" },
  { cat:"Home Office", title:"Gruene Pflanzenwand hinter Schreibtisch", desc:"Eine echte Pflanzenwand oder Kunstpflanzenwand als Hintergrund. Reduziert Stress, verbessert Luftqualitaet.", how:"DIY/Kauf", budget:"100–500€", emoji:"🌿", img:"https://images.unsplash.com/photo-1416879595882-b3d065a0e45d?w=600&h=220&fit=crop&q=80", amazon:"pflanzenwand vertikal homeoffice kunstpflanze" },

  // ── BODEN (8) ─────────────────────────────────────────────────────────────────
  { cat:"Flooring", title:"SPC-Vinyl Ueber Fliesen", desc:"100% wasserfest, Klick-System ueber alte Fliesen. Kein Stemmen, kein Kleber. Fertig an einem day.", how:"DIY – 1 day", budget:"15–35€/m²", emoji:"🪵", img:"https://images.unsplash.com/photo-1574739782594-db4ead022697?w=600&h=220&fit=crop&q=80", amazon:"spc vinyl klick wasserfest ueber fliesen" },
  { cat:"Flooring", title:"Fischgraet-Eichenparkett", desc:"Dielen in Fischgraet-Muster – eleganteste Verlegeart. Eiche geoelt 12cm Width. Wertsteigernd.", how:"DIY/Profi", budget:"40–80€/m²", emoji:"⬛", img:"https://images.unsplash.com/photo-1562663474-6cbb3eaa4d14?w=600&h=220&fit=crop&q=80", amazon:"doneparkett eiche fischgraet verlegen" },
  { cat:"Flooring", title:"Epoxidharz Betonoptik", desc:"Fugenloser Industrieboden ueber altem Belag. Sehr robust, ideal fuer Kueche und Flur. Vorbereitung ist alles.", how:"Intermediate", budget:"20–50€/m²", emoji:"🔘", img:"https://images.unsplash.com/photo-1574739782594-db4ead022697?w=600&h=220&fit=crop&q=80", amazon:"epoxidharz boden betonoptik set self leveling" },
  { cat:"Flooring", title:"Terrakotta Fliesen mediterran", desc:"Handgedonete Terrakotta-Bodenfliesen – warm, mediterran, zeitlos. Muss versiegelt werden.", how:"Fliesenleger", budget:"20–60€/m²", emoji:"🔶", img:"https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&h=220&fit=crop&q=80", amazon:"terrakotta fliesen handgemacht boden mediterran" },
  { cat:"Flooring", title:"Zementfliesen Vintage Muster", desc:"Bunte Musterfliesen in Schwarz-Weiss oder Bunt. Fuer Kueche, Bad oder Flur. Ueber alte Fliesen moeglich.", how:"Fliesenleger", budget:"30–80€/m²", emoji:"🎨", img:"https://images.unsplash.com/photo-1574739782594-db4ead022697?w=600&h=220&fit=crop&q=80", amazon:"zementfliesen muster vintage bunt schwarz weiss" },
  { cat:"Flooring", title:"Teppich als Raumteiler", desc:"Grosser Teppich (300×400) definiert den Sitzbereich. Jute, Wolle oder Outdoor-Teppich. Alle Moebelbeine drauf.", how:"Legen", budget:"80–600€", emoji:"🟫", img:"https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=220&fit=crop&q=80", amazon:"grosser teppich wohnzimmer jute wolle 300x400" },
  { cat:"Flooring", title:"Dunkler Holzboden Drama", desc:"Dunkles Eichenparkett (Raeuchereiche, Nussbaum) + helle Waende = maximaler Kontrast-Effekt.", how:"Verlegen", budget:"45–100€/m²", emoji:"⬛", img:"https://images.unsplash.com/photo-1562663474-6cbb3eaa4d14?w=600&h=220&fit=crop&q=80", amazon:"raeuchereiche parkett dunkel holzboden verlegen" },
  { cat:"Flooring", title:"Weisser Marmorboden Luxus", desc:"Weisse Grossformat-Marmorfliesen oder -Optik. Macht Raeume groesser und heller. Pflegeleichter Feinsteinzeug statt echter Marmor.", how:"Fliesenleger", budget:"40–120€/m²", emoji:"🤍", img:"https://images.unsplash.com/photo-1620626011761-996317702782?w=600&h=220&fit=crop&q=80", amazon:"marmor fliesen weiss gross format luxus" },

  // ── TERRASSE & GARTEN (12) ────────────────────────────────────────────────────
  { cat:"Terrace", title:"WPC-Dielen mit Clips", desc:"Wartungsfreie WPC-Dielen auf Stelzlagern. Clip-Befestigung unsichtbar. Ueber Beton direkt verlegbar.", how:"DIY – weekend", budget:"35–65€/m²", emoji:"🌴", img:"https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600&h=220&fit=crop&q=80", amazon:"wpc dielen terrasse clips stelzlager" },
  { cat:"Terrace", title:"Outdoor-Lounge Polyrattan", desc:"Modulare Polyrattan-Lounge mit Sunbrella-Kissen. UV-bestaendig, wetterfest. Outdoor-Teppich als Basis.", how:"Aufbau", budget:"400–1.500€", emoji:"☀️", img:"https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=220&fit=crop&q=80", amazon:"outdoor lounge polyrattan sunbrella terrasse" },
  { cat:"Terrace", title:"Pergola Douglasie Selbstbau", desc:"Freistehende Pergola aus Douglasie – wetterfest ohne Impraegnierung. Mit Rankpflanzen begruenen.", how:"weekend", budget:"400–1.500€", emoji:"🌿", img:"https://images.unsplash.com/photo-1416879595882-b3d065a0e45d?w=600&h=220&fit=crop&q=80", amazon:"pergola bausatz douglasie selbstbau garten" },
  { cat:"Terrace", title:"Eingebauter Gasgrill Outdoor", desc:"Modulare Aussenkueche mit Gasgrill eingebaut, Arbeitsflaeche Feinsteinzeug. Das Upgrade fuer gesellige Abende.", how:"Pro", budget:"1.000–5.000€", emoji:"🔥", img:"https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=220&fit=crop&q=80", amazon:"aussenkueche gasgrill einbau outdoor garten" },
  { cat:"Terrace", title:"Mediterrane Olivenbaum-Oase", desc:"Olivenbaeume in Terrakotta-Toepfen, Lavendel als Sichtschutz, Rankrosen. Kein Handwerker noetig.", how:"Sofort", budget:"200–600€", emoji:"🫒", img:"https://images.unsplash.com/photo-1558882224-dda166733046?w=600&h=220&fit=crop&q=80", amazon:"olivenbaum terrasse terrakotta topf gross" },
  { cat:"Terrace", title:"Solar Lichterketten 2200K", desc:"Warmweisse Solar-Lichterketten ueber der Terrasse. Kein Kabel, kein Strom. Automatisch an/aus. 10m ab 20€.", how:"Aufhaengen", budget:"20–80€", emoji:"✨", img:"https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600&h=220&fit=crop&q=80", amazon:"solar lichterkette 2200k warmweiss aussen" },
  { cat:"Terrace", title:"Bambussichtschutz & Privatsphaere", desc:"Bambus-Sichtschutz-Matten auf dem Zaun = sofortige Privatsphaere. 3 Matten = ca. 45€. Natuerlicher Look.", how:"30 Min", budget:"30–80€", emoji:"🎋", img:"https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=220&fit=crop&q=80", amazon:"bambussichtschutz balkon terrasse zaun" },
  { cat:"Terrace", title:"Outdoor-Teppich als Basis", desc:"Outdoor-Teppich unter der Lounge-Gruppe definiert den Bereich und macht ihn gemuetlicher. UV-bestaendig, waschbar.", how:"Legen", budget:"50–300€", emoji:"🟫", img:"https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=600&h=220&fit=crop&q=80", amazon:"outdoor teppich terrasse wetterfest uv" },
  { cat:"Terrace", title:"Hochbeet Gemuese & Kraeuter", desc:"Hochbeet aus Laerchenholz – Gemuese auf kleinstem Raum. Kein Buecken. Fuellung: Erde + Kompost 40:60.", how:"DIY – 2h", budget:"80–300€", emoji:"🌱", img:"https://images.unsplash.com/photo-1416879595882-b3d065a0e45d?w=600&h=220&fit=crop&q=80", amazon:"hochbeet holz laerche garten terrasse" },
  { cat:"Terrace", title:"Poolbereich Lounge Aufblasbar", desc:"Aufblasbarer Pool ab 50€ + Lounge daneben + Sonnensegel = Urlaub zuhause. Fuer Kinder und Erwachsene.", how:"Aufbauen", budget:"100–500€", emoji:"💦", img:"https://images.unsplash.com/photo-1558905923-6fe62de33bc3?w=600&h=220&fit=crop&q=80", amazon:"aufblasbarer pool terrasse sonnensegel" },
  { cat:"Terrace", title:"Balkon DIY Stadtgarten", desc:"Auf 6m² alles moeglich: Sichtschutz, 1 Stuhl + Tisch, 3 Toepfe. Wandregale fuer Pflanzen nutzen.", how:"1 day", budget:"100–300€", emoji:"🌇", img:"https://images.unsplash.com/photo-1416879595882-b3d065a0e45d?w=600&h=220&fit=crop&q=80", amazon:"balkon sichtschutz stadtgarten topfpflanzen" },
  { cat:"Terrace", title:"Feuerkorb & Abendatmosphaere", desc:"Gusseiserner Feuerkorb oder Feuerschale + Terracotta-Schuessel mit Bio-Ethanol. Lager-Feuer-Feeling.", how:"Kauf", budget:"50–300€", emoji:"🔥", img:"https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600&h=220&fit=crop&q=80", amazon:"feuerkorb gusseisen terrasse outdoor feuerschale" },
];

const KATEGORIEN = ["All", "Bathroom", "Kitchen", "Living Room", "Bedroom", "Dining", "Hallway", "Home Office", "Flooring", "Terrace"];

function IdeenTab({ lang = "de" }) {
  const [kat, setKat] = useState("All");
  const [openTrend, setOpenTrend] = useState(null);
  const gefiltert = kat === "All" ? TRENDS : TRENDS.filter(t => t.cat === kat);

  return (
    <div style={{ overflowY:"auto", height:"100%" }}>
      {/* Filter */}
      <div style={{ padding:"14px 16px 10px", position:"sticky", top:0, background:C.bg, zIndex:10, borderBottom:`1px solid ${C.border}` }}>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:20, marginBottom:10 }}>Ideas & Trends 2026</h2>
        <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:2 }}>
          {KATEGORIEN.map(k => (
            <button key={k} onClick={() => setKat(k)} style={{ padding:"6px 13px", borderRadius:20, border:`1px solid ${kat===k?C.accent:C.border}`, background:kat===k?C.accent:"white", color:kat===k?"white":C.muted, fontSize:12, cursor:"pointer", fontWeight:kat===k?600:400, fontFamily:"'DM Sans',sans-serif", flexShrink:0 }}>{k}</button>
          ))}
        </div>
      </div>

      <div style={{ padding:"12px 16px 20px" }}>
        <p style={{ fontSize:12, color:C.muted, marginBottom:14, fontStyle:"italic" }}>{gefiltert.length} Ideen – tap for more details</p>
        {gefiltert.map((trend, i) => (
          <div key={i} className="fu" style={{ background:C.card, border:`1px solid ${openTrend===i?C.accent:C.border}`, borderRadius:16, marginBottom:12, overflow:"hidden", animationDelay:`${i*0.03}s` }}>
            {/* Bild */}
            <div style={{ position:"relative", height:170, overflow:"hidden", cursor:"pointer" }} onClick={() => setOpenTrend(openTrend===i?null:i)}>
              <img src={trend.img} alt={trend.title} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
              <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 55%)" }} />
              <div style={{ position:"absolute", top:10, right:10 }}>
                <span style={{ background:"rgba(255,255,255,0.9)", color:C.accent, borderRadius:20, padding:"3px 9px", fontSize:11, fontWeight:700 }}>{trend.cat}</span>
              </div>
              <div style={{ position:"absolute", bottom:12, left:14, right:14 }}>
                <p style={{ color:"white", fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700, marginBottom:4 }}>{trend.emoji} {trend.title}</p>
                <div style={{ display:"flex", gap:6 }}>
                  <span style={{ background:"rgba(255,255,255,0.2)", color:"white", borderRadius:20, padding:"2px 8px", fontSize:11 }}>💶 {trend.budget}</span>
                  <span style={{ background:"rgba(255,255,255,0.2)", color:"white", borderRadius:20, padding:"2px 8px", fontSize:11 }}>🔨 {trend.how}</span>
                </div>
              </div>
            </div>

            {/* Ausgeklappt */}
            {openTrend === i && (
              <div className="fu" style={{ padding:"14px 16px" }}>
                <p style={{ fontSize:14, color:C.text, lineHeight:1.7, marginBottom:12 }}>{trend.desc}</p>
                <div style={{ display:"flex", gap:8 }}>
                  <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(trend.title + " Anleitung DIY")}`} target="_blank" rel="noopener noreferrer" style={{ flex:1, textAlign:"center", padding:"8px", borderRadius:9, background:"#FDEEEC", color:"#C0392B", fontSize:12, textDecoration:"none", fontWeight:600 }}>▶ YouTube Tutorial</a>
                  <a href={`https://www.amazon.de/s?k=${encodeURIComponent(trend.amazon)}&tag=${AFFILIATE_TAG}`} target="_blank" rel="noopener noreferrer" style={{ flex:1, textAlign:"center", padding:"8px", borderRadius:9, background:C.accentBg, color:C.accent, fontSize:12, textDecoration:"none", fontWeight:600 }}>🛒 Material kaufen</a>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PAYWALL / PRICING ───────────────────────────────────────────────────────
function PricingModal({ onClose, onSuccess, freeUsed }) {
  const [loading, setLoading] = useState(null);
  const [email, setEmail] = useState("");

  async function checkout(plan) {
    setLoading(plan);
    try {
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, email }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert("Fehler: " + (data.error || "Unbekannt"));
    } catch (e) {
      alert("Verbindungsfehler. Bitte erneut versuchen.");
    }
    setLoading(null);
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:1000, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <div className="fu" style={{ background:C.card, borderRadius:"24px 24px 0 0", padding:"28px 22px 40px", width:"100%", maxWidth:600 }}>
        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
          <div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:C.text }}>Mystorija upgraden</h2>
            <p style={{ fontSize:13, color:C.muted, marginTop:3 }}>
              {freeUsed >= 3 ? "Du hast alle 3 gratis Makeovers genutzt." : `Noch ${3 - freeUsed} gratis Makeover${3-freeUsed!==1?"s":""} uebrig.`}
            </p>
          </div>
          {onClose && <button onClick={onClose} style={{ background:"none", border:"none", fontSize:20, color:C.muted, cursor:"pointer", padding:"4px" }}>✕</button>}
        </div>

        {/* Email */}
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Deine E-Mail-Adresse" type="email"
          style={{ width:"100%", padding:"11px 14px", borderRadius:10, border:`1.5px solid ${C.border}`, fontSize:14, fontFamily:"'DM Sans',sans-serif", background:C.bg, marginBottom:16, marginTop:12 }} />

        {/* Plans */}
        <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:16 }}>

          {/* Basic */}
          <div style={{ border:`2px solid ${C.border}`, borderRadius:16, padding:"16px 18px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <div>
                <p style={{ fontWeight:700, fontSize:16, color:C.text }}>Basic</p>
                <p style={{ fontSize:12, color:C.muted }}>For occasional renovators</p>
              </div>
              <div style={{ textAlign:"right" }}>
                <p style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:C.text, fontWeight:700 }}>9,99€</p>
                <p style={{ fontSize:11, color:C.muted }}>/month</p>
              </div>
            </div>
            <div style={{ fontSize:13, color:C.text, lineHeight:1.8, marginBottom:12 }}>
              {["✓ 20 AI Makeovers pro Monat", "✓ Alle Stilvorlagen", "✓ Materialien + Amazon-Links", "✓ Anleitungen & Chat"].map(f => <div key={f}>{f}</div>)}
            </div>
            <button onClick={() => checkout("basic")} disabled={!!loading} style={{ width:"100%", padding:"12px", borderRadius:50, background:loading==="basic"?C.border:C.text, color:"white", border:"none", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
              {loading==="basic" ? "Wird geladen…" : "Basic starten →"}
            </button>
          </div>

          {/* Pro */}
          <div style={{ border:`2px solid ${C.accent}`, borderRadius:16, padding:"16px 18px", background:C.accentBg, position:"relative" }}>
            <div style={{ position:"absolute", top:-12, left:"50%", transform:"translateX(-50%)", background:C.accent, color:"white", borderRadius:20, padding:"3px 14px", fontSize:11, fontWeight:700, whiteSpace:"nowrap" }}>⭐ MEISTGEWAeHLT</div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <div>
                <p style={{ fontWeight:700, fontSize:16, color:C.text }}>Pro</p>
                <p style={{ fontSize:12, color:C.muted }}>For serious renovators</p>
              </div>
              <div style={{ textAlign:"right" }}>
                <p style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:C.accent, fontWeight:700 }}>19,99€</p>
                <p style={{ fontSize:11, color:C.muted }}>/month</p>
              </div>
            </div>
            <div style={{ fontSize:13, color:C.text, lineHeight:1.8, marginBottom:12 }}>
              {["✓ Unbegrenzte AI Makeovers", "✓ Flux Pro – bessere Bildqualitaet", "✓ Alle Basic Features", "✓ Priority generation"].map(f => <div key={f} style={{ fontWeight: f.includes("Pro") ? 600 : 400 }}>{f}</div>)}
            </div>
            <button onClick={() => checkout("pro")} disabled={!!loading} style={{ width:"100%", padding:"13px", borderRadius:50, background:loading==="pro"?C.border:C.accent, color:"white", border:"none", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
              {loading==="pro" ? "Wird geladen…" : "Pro starten →"}
            </button>
          </div>
        </div>

        <p style={{ fontSize:11, color:C.muted, textAlign:"center" }}>
          Monatlich kuendbar · Zahlung ueber Stripe gesichert · Keine versteckten Kosten
        </p>
      </div>
    </div>
  );
}
// Tab labels
const TABS = [
  { id:"makeover", labelDE:"Makeover", labelEN:"Makeover", icon:"✨" },
  { id:"chat",     labelDE:"Chat",     labelEN:"Chat",     icon:"💬" },
  { id:"inspo",    labelDE:"Inspo",    labelEN:"Inspo",    icon:"🔍" },
  { id:"ideen",    labelDE:"Ideen",    labelEN:"Ideas",    icon:"💡" },
  { id:"anleit",   labelDE:"Anleit.",  labelEN:"Guides",   icon:"📋" },
  { id:"planer",   labelDE:"Planer",   labelEN:"Planner",  icon:"📅" },
  { id:"profis",   labelDE:"Profis",   labelEN:"Pros",     icon:"🔨" },
];





const T = {
  de: {
    makeover: "✨ Makeover", chat: "💬 Chat", inspo: "🔍 Inspo",
    ideen: "💡 Ideen", anleit: "📋 Anleit.", planer: "📅 Planer", profis: "🔨 Profis",
    generateBtn: "✨ Generate Makeover", uploadHint: "Upload photo",
    uploadSub: "Bathroom, kitchen, living room, terrace...",
    wishPlaceholder: "z.B. Dunkle Fliesen, Walk-In Dusche...",
    generating: "AI is generating your makeover...", materials: "Materials used:",
    save: "💾 Save", newMakeover: "🔄 New",
    loginBtn: "Sign in", logoutBtn: "Sign out",
    freePlan: "Basic plan required", limitReached: "🔒 Limit reached",
    inspoHook: "Seen a beautiful image somewhere?",
    inspoSub: "Upload screenshot – Mystorija instantly recognizes all materials and colors.",
    analyzeBtn: "🔍 Analyze", trending: "Trends 2026",
    refineTitle: "✏️ Refine – what should change?",
    refinePlaceholder: "z.B. Darker tiles, Spiegel hinzufuegen...",
    savedBtn: "Saved!", plannerSaved: "Saved to Planner!",
    newBtn: "🔄 New", saveBtn: "💾 Save",
    toolsLabel: "Tools needed:", tipsLabel: "Pro tips:",
    warningLabel: "⚠️ Watch out:",
    stepsLabel: "steps:", diffLabel: "Schwierigkeit:",
    costLabel: "Budget:", timeLabel: "Zeit:",
    guidesTitle: "DIY Guides", ideasTitle: "Ideas & Trends 2026",
    plannerTitle: "Planer", prosTitle: "Find Pros",
    chatTitle: "Renovation Expert", inspoTitle: "Analyze Inspo",
    makeoverTitle: "KI Makeover",
    upgradeMsg: "Ab Basic Plan – jetzt upgraden",
    limitMsg: "Monthly limit reached – upgrade auf Pro",
    dimensionsLabel: "Room dimensions (optional)",
    lengthPh: "Length m", widthPh: "Width m", heightPh: "Height m",
    tipsBtn: "💡 Tips & Templates",
    viewHistory: "📚 History",
  },
  en: {
    makeover: "✨ Makeover", chat: "💬 Chat", inspo: "🔍 Inspo",
    ideen: "💡 Ideas", anleit: "📋 Guides", planer: "📅 Planner", profis: "🔨 Pros",
    generateBtn: "✨ Generate Makeover", uploadHint: "Upload a photo",
    uploadSub: "Bathroom, kitchen, living room, terrace...",
    wishPlaceholder: "e.g. Dark tiles, walk-in shower, matte black fixtures...",
    generating: "AI is generating your makeover...", materials: "Materials used:",
    save: "💾 Save", newMakeover: "🔄 New",
    loginBtn: "Sign in", logoutBtn: "Sign out",
    freePlan: "Basic plan required", limitReached: "🔒 Limit reached",
    inspoHook: "Seen a beautiful image somewhere?",
    inspoSub: "Take a screenshot of any image – Pinterest, Instagram, magazines. Mystorija instantly recognizes all materials and colors.",
    analyzeBtn: "🔍 Analyze", trending: "Trends 2026",
    refineTitle: "✏️ Refine – what should change?",
    refinePlaceholder: "e.g. Make tiles darker, add mirror...",
    savedBtn: "Saved!", plannerSaved: "Saved to Planner!",
    newBtn: "🔄 New", saveBtn: "💾 Save",
    toolsLabel: "Tools needed:", tipsLabel: "Pro Tips:",
    warningLabel: "⚠️ Watch out:",
    stepsLabel: "Steps:", diffLabel: "Difficulty:",
    costLabel: "Budget:", timeLabel: "Time:",
    guidesTitle: "DIY Guides", ideasTitle: "Ideas & Trends 2026",
    plannerTitle: "Planner", prosTitle: "Find Pros",
    chatTitle: "Renovation Expert", inspoTitle: "Inspo Analyzer",
    makeoverTitle: "AI Makeover",
    upgradeMsg: "Upgrade to Basic to generate makeovers",
    limitMsg: "Monthly limit reached – upgrade to Pro",
    dimensionsLabel: "Room dimensions (optional)",
    lengthPh: "Length m", widthPh: "Width m", heightPh: "Height m",
    tipsBtn: "💡 Tips & Templates",
    viewHistory: "📚 History",
  }
};

export default function HomeEN() {
  const [activeTab, setActiveTab] = useState("makeover");
  const [savedMakeovers, setSavedMakeovers] = useState([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [lang, setLang] = useState("de");
  const [secretTaps, setSecretTaps] = useState(0);
  const [showSecretInput, setShowSecretInput] = useState(false);
  const [secretInput, setSecretInput] = useState("");

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    setSubscription(null);
    try { localStorage.removeItem("mystorija_subscription"); localStorage.removeItem("mystorija_dev"); } catch {}
  }

  function handleSecretCode(code) {
    if (code === "STORIJA2026") {
      try { localStorage.setItem("mystorija_dev", "STORIJA2026"); } catch {}
      setSubscription({ plan: "pro", sessionId: "dev", activated: true });
      setShowSecretInput(false);
      setSecretInput("");
      alert("✅ Pro access activated!");
    } else {
      alert("❌ Wrong code");
    }
  }
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);

  // Service Worker + PWA Install
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e); setShowInstall(true); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);
  const [freeUsed, setFreeUsed] = useState(0);
  const [chatMessages, setChatMessages] = useState([{
    role:"assistant",
    text:"Hey! 👋 Ich bin dein persoenlicher Renovierungsexperte – frag mich alles ueber Bad, Kueche, Wohnzimmer, Boden, Licht und mehr.\n\nIch gebe dir **konkrete Antworten** mit Produktnamen, Preisen und Schritt-fuer-Step Anleitungen. Oder lade ein 📷 Foto hoch und ich analysiere deinen Raum sofort!",
  }]);

  useEffect(() => {
    // Onboarding
    try { if (!localStorage.getItem("mystorija_onboarding_done")) setShowOnboarding(true); } catch {}

    // Free usage counter
    try { setFreeUsed(parseInt(localStorage.getItem("mystorija_free_used") || "0")); } catch {}

    // Secret dev code check
    try {
      const devCode = localStorage.getItem("mystorija_dev");
      if (devCode === "STORIJA2026") {
        setSubscription({ plan: "pro", sessionId: "dev", activated: true });
      }
    } catch {}

    // Auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
      // Load subscription from user metadata
      if (session?.user?.user_metadata?.plan) {
        setSubscription({ plan: session.user.user_metadata.plan, activated: true });
      }
    });
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user?.user_metadata?.plan) {
        setSubscription({ plan: session.user.user_metadata.plan, activated: true });
      }
    });
    return () => authSub.unsubscribe();

    // Subscription aus localStorage
    try {
      const saved = localStorage.getItem("mystorija_subscription");
      if (saved) {
        const parsed = JSON.parse(saved);
        setSubscription(parsed);
        // Verify still active
        fetch("/api/verify-subscription", {
          method: "POST", headers: {"Content-Type":"application/json"},
          body: JSON.stringify({ sessionId: parsed.sessionId }),
        }).then(r => r.json()).then(data => {
          if (!data.valid) {
            setSubscription(null);
            localStorage.removeItem("mystorija_subscription");
          }
        }).catch(() => {});
      }
    } catch {}

    // Nach Stripe Redirect
    const params = new URLSearchParams(window.location.search);
    const stripeStatus = params.get("subscription");
    const plan = params.get("plan");
    const sessionId = params.get("session_id");

    if (stripeStatus === "success" && plan && sessionId) {
      const sub = { plan, sessionId, activatedAt: Date.now() };
      setSubscription(sub);
      try { localStorage.setItem("mystorija_subscription", JSON.stringify(sub)); } catch {}
      // URL saeubern
      window.history.replaceState({}, "", "/");
      setShowPricing(false);
    }
  }, []);

  function finishOnboarding() {
    setShowOnboarding(false);
    try { localStorage.setItem("mystorija_onboarding_done", "1"); } catch {}
  }

  function incrementFreeUsed() {
    const next = freeUsed + 1;
    setFreeUsed(next);
    try { localStorage.setItem("mystorija_free_used", String(next)); } catch {}
  }

  function canGenerate() {
    return true; // Kein Limit – Paywall spaeter via Stripe
  }

  const planLabel = subscription?.plan === "pro" ? "Pro ⭐" : subscription?.plan === "basic" ? "Basic" : null;

  return (
    <>
      {showOnboarding && <Onboarding onDone={finishOnboarding} />}
      {showPricing && <PricingModal onClose={() => setShowPricing(false)} freeUsed={freeUsed} />}
      <Head>
        <title>Mystorija – KI-Renovierung & Inspo</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="description" content="Mystorija – KI-Renovierung, Inspiration & DIY Guides fuer dein Zuhause" />
        <meta name="theme-color" content="#C4622D" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Mystorija" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <style dangerouslySetInnerHTML={{ __html:globalCSS }} />
      </Head>
      <div style={{ display:"flex", flexDirection:"column", height:"100vh", background:C.bg, maxWidth:600, margin:"0 auto" }}>
        <div style={{ background:C.card, borderBottom:`1px solid ${C.border}`, padding:"13px 18px", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <span onClick={() => { const t = secretTaps+1; setSecretTaps(t); if(t>=5){setShowSecretInput(true);setSecretTaps(0);} }} style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, cursor:"default", userSelect:"none" }}>My<span style={{ color:C.accent }}>storija</span></span>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            {showInstall && (
              <button onClick={async () => { if (installPrompt) { installPrompt.prompt(); const r = await installPrompt.userChoice; if (r.outcome==="accepted") setShowInstall(false); }}} style={{ fontSize:11, color:C.green, fontWeight:700, background:C.greenBg, padding:"5px 10px", borderRadius:20, border:`1px solid ${C.green}33`, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                📲 Installieren
              </button>
            )}
<button onClick={() => window.location.href="/app"} style={{ fontSize:11, fontWeight:700, color:C.muted, background:C.bg, padding:"5px 10px", borderRadius:20, border:`1px solid ${C.border}`, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                "🇬🇧 EN"
              </button>
            {user ? (
              <button onClick={handleLogout} style={{ fontSize:11, color:C.muted, fontWeight:600, background:C.bg, padding:"5px 10px", borderRadius:20, border:`1px solid ${C.border}`, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                {T["de"].logoutBtn}
              </button>
            ) : (
              <a href="/en/login" style={{ fontSize:11, color:C.accent, fontWeight:700, background:C.accentBg, padding:"5px 10px", borderRadius:20, border:`1px solid ${C.accent}33`, textDecoration:"none" }}>
                {T["de"].loginBtn}
              </a>
            )}
            {planLabel ? (
              <span style={{ fontSize:12, color:C.accent, fontWeight:700, background:C.accentBg, padding:"4px 10px", borderRadius:20 }}>{planLabel}</span>
            ) : (
              <button onClick={() => setShowPricing(true)} style={{ fontSize:12, color:"white", fontWeight:700, background:C.accent, padding:"5px 12px", borderRadius:20, border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                Upgrade ✨
              </button>
            )}
            
          </div>
        </div>
        <div style={{ flex:1, overflow:"hidden", position:"relative" }}>
          <div style={{ display:activeTab==="makeover"?"flex":"none", height:"100%", overflow:"hidden" }}>
            <MakeoverTab
              onSaveToPlaner={m => setSavedMakeovers(prev=>[m,...prev])}
              savedMakeovers={savedMakeovers}
              plan={subscription?.plan || "free"}
              canGenerate={canGenerate()}
              freeUsed={freeUsed}
              onNeedUpgrade={() => setShowPricing(true)}
              onGenerated={incrementFreeUsed}
            />
          </div>
          <div style={{ display:activeTab==="chat"?"flex":"none", flexDirection:"column", height:"100%" }}>
            <ChatTab messages={chatMessages} setMessages={setChatMessages} />
          </div>
          {activeTab==="inspo" && <InspoTab plan={subscription?.plan} lang={lang} />}
          {activeTab==="ideen" && <IdeenTab lang={lang} />}
          {activeTab==="anleit" && <AnleitungenTab lang={lang} />}
          {activeTab==="planer" && <PlanerTab savedMakeovers={savedMakeovers} lang={lang} />}
          {activeTab==="profis" && <HandwerkerTab lang={lang} />}
        </div>
        <div style={{ background:C.card, borderTop:`1px solid ${C.border}`, display:"grid", gridTemplateColumns:"repeat(7, 1fr)", flexShrink:0, overflowX:"auto" }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ background:"none", border:"none", cursor:"pointer", padding:"7px 1px 10px", display:"flex", flexDirection:"column", alignItems:"center", gap:2, borderTop:`2.5px solid ${activeTab===tab.id?C.accent:"transparent"}`, transition:"border-color 0.2s", minWidth:0 }}>
              <span style={{ fontSize:17 }}>{tab.icon}</span>
              <span style={{ fontSize:9, fontWeight:600, color:activeTab===tab.id?C.accent:C.muted, fontFamily:"'DM Sans',sans-serif", whiteSpace:"nowrap" }}>{tab.labelDE}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Secret Dev Code Modal */}
      {showSecretInput && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div style={{ background:C.card, borderRadius:20, padding:28, width:"100%", maxWidth:320, textAlign:"center" }}>
            <p style={{ fontFamily:"'Playfair Display',serif", fontSize:20, marginBottom:8 }}>🔐 Activation code</p>
            <p style={{ fontSize:13, color:C.muted, marginBottom:16 }}>Enter code to unlock Pro</p>
            <input value={secretInput} onChange={e => setSecretInput(e.target.value)} onKeyDown={e => e.key==="Enter" && handleSecretCode(secretInput)} placeholder="Code eingeben..." style={{ width:"100%", padding:"11px 14px", borderRadius:12, border:`2px solid ${C.border}`, fontSize:15, marginBottom:12, fontFamily:"'DM Sans',sans-serif", textAlign:"center", letterSpacing:2 }} autoFocus />
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={() => { setShowSecretInput(false); setSecretInput(""); }} style={{ flex:1, padding:"11px", borderRadius:50, border:`1px solid ${C.border}`, background:C.bg, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:14 }}>Cancel</button>
              <button onClick={() => handleSecretCode(secretInput)} style={{ flex:1, padding:"11px", borderRadius:50, background:C.accent, color:"white", border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:700 }}>Activate</button>
            </div>
          </div>
        </div>
      )}
      <Analytics />
    </>
  );
}
