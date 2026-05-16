export const config = {
  api: { bodyParser: { sizeLimit: "10mb" } },
};

const SYS = `Du bist RenoPilot, ein freundlicher DIY-Renovierungsberater. Antworte immer auf Deutsch, kurz und konkret (max. 4 Sätze). Immer mit Produktnamen und deutschen Preisen (OBI/Bauhaus/Hornbach/Amazon). Nutze **Fettschrift** für wichtige Begriffe.

WENN EIN FOTO hochgeladen wird:
🏠 **Raum & Materialien**: Was erkennst du?
🔨 **Sofortmaßnahmen**: Was kann man günstig selbst verbessern?
✨ **Upgrade-Ideen**: 2–3 konkrete Ideen
🛒 **Materialien**: Produktnamen mit [Link](https://www.amazon.de/s?k=SUCHBEGRIFF&tag=renopilot-21)

FACHWISSEN: Lammfellrolle 12–18mm fürs Streichen, Doppelklebung bei Fliesen, 10mm Dehnungsfuge Laminat, Bad-Silikon mit Pilzhemmer, SPC-Vinyl für Nassräume, LED 24V mit WAGO-Klemmen.`;

// Offline Antworten wenn kein API Key
function getOfflineAntwort(text) {
  const t = (text || "").toLowerCase();
  if (t.match(/hallo|hi|hey|guten|servus/))
    return "Hey! 👋 Ich bin dein RenoPilot – dein DIY-Renovierungsexperte.\n\nFrag mich zu Bad, Küche, Wohnzimmer, Boden oder Beleuchtung – ich helfe dir konkret und günstig!";
  if (t.match(/silikon|fuge|schimmel/))
    return "Silikon erneuern – günstigstes Upgrade! 🛠️\n\nBrauchst du: **Soudal Bad-Silikon** (ca. 8€), Cuttermesser, Silikon-Entferner. Altes Silikon raus → entfetten → Abklebeband → neues Silikon auftragen → nasser Finger glattziehen → Band sofort abziehen. **24h trocknen lassen!**\n\n[Soudal Silikon auf Amazon](https://www.amazon.de/s?k=soudal+bad+silikon+pilzhemmend&tag=renopilot-21)";
  if (t.match(/bad|badezimmer|dusche|wc|waschtisch/))
    return "Bad aufwerten – so gehst du vor! 🚿\n\n**Unter 100€:** Silikon erneuern, LED-Spiegel (Emke ab 80€), mattschwarz Accessoires. **Unter 500€:** Armaturen tauschen, SPC-Vinyl über Fliesen legen. **Unter 2.000€:** Mikrozement, Walk-In Dusche.\n\nWas ist dein Budget?";
  if (t.match(/küche|kueche|fronten|griffe|arbeitsplatte/))
    return "Küche aufwerten – top Investition! 🍳\n\n**30 Min, 30–80€:** Griffe tauschen (128mm Mattschwarz). **1–2 Tage, 80–200€:** Fronten folieren (Klebefolie Holzoptik). **2–3 Tage, 100–300€:** Fronten lackieren (Schleifen → Haftgrund → Seidenmatt-Lack RAL 7044).\n\n[Mattschwarz Griffe](https://www.amazon.de/s?k=küchen+griffe+mattschwarz+128mm&tag=renopilot-21)";
  if (t.match(/vinyl|laminat|boden|spc/))
    return "Boden selbst verlegen! 💪\n\n**SPC-Vinyl** (100% wasserfest, über Fliesen möglich): 15–25€/m² bei OBI. **Laminat** (nur Trockenräume!): ab 8€/m². Wichtig: **10mm Dehnungsfuge** zur Wand, 48h akklimatisieren, Trittschalldämmung nicht vergessen!\n\n[SPC Vinyl auf Amazon](https://www.amazon.de/s?k=spc+vinyl+boden+wasserfest+klick&tag=renopilot-21)";
  if (t.match(/streichen|wand|farbe|akzent/))
    return "Wand streichen – größte Wirkung für wenig Geld! 🎨\n\nNur **EINE Wand** dunkel = sofort neuer Raum. Trendfarben 2025: Dunkelgrün (RAL 6009), Navy (RAL 5011), Terrakotta (RAL 3012). **Lammfellrolle 12mm** kaufen – günstige Rollen hinterlassen Flusen!\n\n[Wandfarbe auf Amazon](https://www.amazon.de/s?k=wandfarbe+dunkelgrün+matt&tag=renopilot-21)";
  if (t.match(/led|licht|lampe|beleuchtung/))
    return "Beleuchtung = größter Stimmungsmacher! 💡\n\n**Regel:** 2700K warm = Wohnzimmer/Bad, 4000K neutral = Küche. **LED-Strip unter Küchenschränken:** 20–60€, sofort Effekt. Im Bad: immer **IP44** auf Verpackung prüfen!\n\n[LED Strip 2700K](https://www.amazon.de/s?k=led+strip+2700k+warmweiß+5m&tag=renopilot-21)";
  if (t.match(/mietwohnung|miete|vermieter/))
    return "Mietwohnung – was ist erlaubt? 🔑\n\n✅ Streichen (zurückstreichen beim Auszug), Klebefolie auf Fliesen/Fronten, Griffe tauschen (Original aufbewahren!), Klick-Boden ohne Kleber, LED-Spiegel (Stecker). ❌ Festinstallation Elektro, tragende Wände, Gasleitungen.";
  if (t.match(/mikrozement|beton/))
    return "Mikrozement – fugenloser Wow-Look! 🏛️\n\nDirekt über Fliesen möglich: **Haftgrund** → 2× **Mikrozement** (je 1mm) → 2× **PU-Versiegelung**. Zwischen Schichten schleifen. Ca. 60–120€/m² Material. Komplettset für 10m²: ca. 200–350€.\n\n[Mikrozement Set](https://www.amazon.de/s?k=mikrozement+set+boden+wand&tag=renopilot-21)";
  if (t.match(/terrasse|balkon|outdoor/))
    return "Terrasse aufwerten! 🌿\n\n**Sofort (unter 50€):** Solar-Lichterketten, Bambus-Sichtschutz. **Mittel:** WPC-Dielen (35–65€/m², wartungsfrei). **Projekt:** Pergola aus Douglasie. Nur **EPAL-gestempelte** Paletten verwenden!\n\n[WPC Dielen](https://www.amazon.de/s?k=wpc+dielen+terrasse+holzoptik&tag=renopilot-21)";
  if (t.match(/werkzeug|bohrmaschine|was brauche/))
    return "Grundausstattung für Anfänger! 🔨\n\nKaufen: **Bosch PSB 1800 LI** (~80€), **Wasserwaage 60cm** (5€), Cuttermesser, Tesa Precision Abklebeband. Mieten bei OBI: Fliesenschneider (15€/Tag), Schleifmaschine (20€/Tag). **Nie billige Werkzeuge kaufen!**";
  // Default
  return "Gute Frage! Ich helfe dir gerne. 💪\n\nSchreib mir konkret:\n• Welchen **Raum** möchtest du renovieren?\n• Was **stört** dich am meisten?\n• Was ist dein ungefähres **Budget**?\n\nOder nutze den **📷 Makeover-Tab** – Foto hochladen und KI zeigt dir wie es aussehen könnte!";
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  // Accept both formats:
  // { messages: [{role, content}] } - from ChatTab (multi-turn)
  // { message, imgBase64, mimeType } - legacy single message
  const { messages, message, imgBase64, mimeType } = req.body;

  // If no API key, use offline mode
  if (!process.env.ANTHROPIC_API_KEY) {
    const lastUserText = messages
      ? messages.filter(m => m.role === "user").pop()?.content || ""
      : message || "";
    return res.json({ reply: getOfflineAntwort(lastUserText) });
  }

  try {
    // Build messages array for Anthropic API
    let apiMessages;

    if (messages && Array.isArray(messages)) {
      // Multi-turn format from ChatTab
      apiMessages = messages.map(m => ({
        role: m.role,
        content: m.content || m.text || "",
      }));
    } else {
      // Single message format
      const content = [];
      if (imgBase64) {
        const base64Data = imgBase64.includes(",") ? imgBase64.split(",")[1] : imgBase64;
        const mediaType = mimeType || "image/jpeg";
        content.push({ type: "image", source: { type: "base64", media_type: mediaType, data: base64Data } });
      }
      content.push({ type: "text", text: message || "Hallo!" });
      apiMessages = [{ role: "user", content }];
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: SYS,
        messages: apiMessages,
      }),
    });

    if (!response.ok) {
      // API Fehler → Offline-Antwort
      const lastUserText = messages
        ? messages.filter(m => m.role === "user").pop()?.content || ""
        : message || "";
      return res.json({ reply: getOfflineAntwort(lastUserText) });
    }

    const data = await response.json();
    const reply = data.content?.map(b => b.text || "").join("").trim();

    if (!reply) {
      const lastUserText = messages
        ? messages.filter(m => m.role === "user").pop()?.content || ""
        : message || "";
      return res.json({ reply: getOfflineAntwort(lastUserText) });
    }

    res.json({ reply });

  } catch (err) {
    // Any error → Offline-Antwort statt Fehlermeldung
    const lastUserText = messages
      ? messages.filter(m => m.role === "user").pop()?.content || ""
      : message || "";
    res.json({ reply: getOfflineAntwort(lastUserText) });
  }
}
