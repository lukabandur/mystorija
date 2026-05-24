export const config = {
  api: { bodyParser: { sizeLimit: "15mb" } },
};

const SYSTEM = `Du bist ein Innenarchitektur-Experte der Renovierungsmaterialien in Fotos erkennt. Antworte AUSSCHLIESSLICH mit einem JSON-Objekt, kein Text davor oder danach, keine Markdown-Backticks.

Das JSON muss exakt dieses Format haben:
{"stil":"Stilname","stimmung":"Kurze Beschreibung 2 Sätze","materialien":[{"bereich":"Bereich","material":"Material","farbe":"Farbe","produkt":"Produkt oder leer","amazon":"kurzer suchbegriff deutsch","preis":"Preisrange"}],"farben":["#hex1","#hex2","#hex3"],"schwierigkeit":"Einfach","budget":"500-2000€","zeitaufwand":"1-2 Wochenenden","umsetzung":["Schritt 1","Schritt 2","Schritt 3","Schritt 4","Schritt 5"],"profi_tipps":["Tipp 1","Tipp 2"],"sofort_upgrades":["Upgrade 1","Upgrade 2"]}

Erkenne echte Materialien: Feinsteinzeug, Zellige, Mikrozement, Eiche, Teak, Marmor usw. Nenne Marken wenn erkennbar (Grohe, Hansgrohe, IKEA, Mapei). Sei konkret und präzise.`;

const SYSTEM_EN = `You are an interior design expert who recognizes renovation materials in photos. Respond ONLY with a JSON object, no text before or after, no markdown backticks.

The JSON must have exactly this format:
{"style":"Style name","mood":"Short description 2 sentences","materials":[{"area":"Area","material":"Material","color":"Color","product":"Product or empty","amazon":"short english search term","price":"Price range"}],"colors":["#hex1","#hex2","#hex3"],"difficulty":"Easy","budget":"500-2000€","timeframe":"1-2 weekends","steps":["Step 1","Step 2","Step 3","Step 4","Step 5"],"pro_tips":["Tip 1","Tip 2"],"quick_upgrades":["Upgrade 1","Upgrade 2","Upgrade 3"]}`;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { imageBase64, mimeType, lang } = req.body;
  if (!imageBase64) return res.status(400).json({ error: "No image" });
  const activeSystem = lang === "en" ? SYSTEM_EN : SYSTEM;

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(200).json({ error: "ANTHROPIC_API_KEY fehlt in Vercel Environment Variables." });
  }

  try {
    const b64 = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
    const media = (mimeType || "image/jpeg").replace("image/jpg", "image/jpeg");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 2000,
        system: activeSystem,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: media, data: b64 } },
            { type: "text", text: lang === "en" ? "Analyze this image. Respond with the JSON object only." : "Analysiere dieses Bild. Antworte nur mit dem JSON-Objekt." },
          ],
        }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic error:", response.status, errText);
      return res.status(200).json({ error: lang === "en" ? `API error ${response.status}: ${response.statusText}` : `API Fehler ${response.status}: ${response.statusText}` });
    }

    const data = await response.json();
    const raw = data.content?.map(b => b.text || "").join("").trim();

    if (!raw) return res.status(200).json({ error: lang === "en" ? "No response from AI." : "Leere Antwort von KI." });

    // Robust JSON extraction
    let result;
    try {
      // Remove markdown code blocks if present
      let cleaned = raw
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      // Find JSON object if there's surrounding text
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) cleaned = jsonMatch[0];

      result = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("Parse error:", parseErr.message, "Raw:", raw.slice(0, 300));
      return res.status(200).json({ error: lang === "en" ? "Could not process AI response. Please try again." : "KI-Antwort konnte nicht verarbeitet werden. Bitte erneut versuchen." });
    }

    // Validate: require at least a style/mood field — materials may be empty for some images
    const hasContent = result.stil || result.style || result.stimmung || result.mood;
    if (!hasContent) {
      return res.status(200).json({ error: lang === "en" ? "Incomplete analysis. Please try again." : "Unvollständige Analyse. Bitte erneut versuchen." });
    }

    res.status(200).json({ analysis: result });

  } catch (err) {
    console.error("Handler error:", err);
    res.status(200).json({ error: `Serverfehler: ${err.message}` });
  }
}
