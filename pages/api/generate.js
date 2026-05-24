export const config = {
  api: { bodyParser: { sizeLimit: "15mb" } },
};

// ── In-Memory Rate Limiter ────────────────────────────────────────────────────
// Speichert: IP → { count, windowStart, blocked, blockedUntil }
const rateLimitStore = new Map();

const RATE_WINDOW_MS   = 60 * 1000;   // 1 Minute
const RATE_MAX_REQ     = 8;            // Max 8 Makeovers pro Minute (normal Nutzer)
const ABUSE_THRESHOLD  = 15;           // Ab 15/min → Verdacht auf Abuse
const BLOCK_DURATION_MS = 10 * 60 * 1000; // 10 Minuten blockiert

function getRealIP(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitStore.get(ip) || { count: 0, windowStart: now, blocked: false, blockedUntil: 0 };

  // Ist IP blockiert?
  if (entry.blocked && now < entry.blockedUntil) {
    const remainMin = Math.ceil((entry.blockedUntil - now) / 60000);
    return { allowed: false, reason: `Zu viele Anfragen. Bitte warte noch ${remainMin} Minute(n).`, blocked: true };
  }

  // Block abgelaufen → reset
  if (entry.blocked && now >= entry.blockedUntil) {
    entry.blocked = false;
    entry.count = 0;
    entry.windowStart = now;
  }

  // Neues Zeitfenster?
  if (now - entry.windowStart > RATE_WINDOW_MS) {
    entry.count = 0;
    entry.windowStart = now;
  }

  entry.count++;

  // Abuse erkannt → sofort blockieren
  if (entry.count >= ABUSE_THRESHOLD) {
    entry.blocked = true;
    entry.blockedUntil = now + BLOCK_DURATION_MS;
    rateLimitStore.set(ip, entry);
    console.warn(`[ABUSE] IP ${ip} blockiert: ${entry.count} Requests in 1 Minute`);
    return { allowed: false, reason: "Zu viele Anfragen erkannt. Bitte warte 10 Minuten.", blocked: true };
  }

  // Normales Limit überschritten
  if (entry.count > RATE_MAX_REQ) {
    rateLimitStore.set(ip, entry);
    return { allowed: false, reason: "Bitte kurz warten – du generierst sehr schnell.", blocked: false };
  }

  rateLimitStore.set(ip, entry);
  return { allowed: true };
}

// Cleanup alter Einträge alle 30 Minuten
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitStore) {
    if (now - entry.windowStart > 60 * 60 * 1000) rateLimitStore.delete(ip);
  }
}, 30 * 60 * 1000);

// ── Plan Limits ───────────────────────────────────────────────────────────────
const PLAN_LIMITS = {
  free:  0,
  basic: 50,
  pro:   Infinity,
};

const FREE_LIMIT = 3;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  // ── Rate Limit Check ────────────────────────────────────────────────────────
  const ip = getRealIP(req);
  const rateCheck = checkRateLimit(ip);
  if (!rateCheck.allowed) {
    return res.status(429).json({
      error: rateCheck.reason,
      blocked: rateCheck.blocked || false,
    });
  }

  const { imageBase64, chatContext, plan, style, dimensions, lang } = req.body;

  // ── Plan Limit Check ────────────────────────────────────────────────────────
  // Monatliches Limit wird clientseitig im localStorage gezählt
  // Server prüft nur ob Plan existiert und gibt Limit zurück
  const planKey = plan || "free";
  const planLimit = PLAN_LIMITS[planKey] ?? PLAN_LIMITS.free;

  if (!imageBase64 || imageBase64.length < 100) {
    return res.status(400).json({ error: "Kein Bild übermittelt." });
  }

  const cleanBase64 = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;

  // Maße für Claude-Prompt aufbereiten
  let dimensionInfo = "";
  if (dimensions?.laenge && dimensions?.breite) {
    const l = parseFloat(String(dimensions.laenge).replace(",", "."));
    const b = parseFloat(String(dimensions.breite).replace(",", "."));
    const h = parseFloat(String(dimensions.hoehe || "2.4").replace(",", "."));
    const sqm = (l * b).toFixed(1);
    dimensionInfo = `Room dimensions: ${l}m × ${b}m × ${h}m high (${sqm}m² floor area). `;
  }

  try {
    // Nutzerwunsch vorübersetzen für besseres Verständnis
    function preTranslate(text) {
      return text
        .replace(/füge?\s+(.+?)\s+(?:hinzu|ein|dazu)/gi, (_, obj) => `ADD ${obj}`)
        .replace(/füge?\s+(.+?)\s+(?:hinzu|ein|dazu)/gi, (_, obj) => `ADD ${obj}`)
        .replace(/baue?\s+(.+?)\s+ein/gi, (_, obj) => `ADD ${obj}`)
        .replace(/grill|bbq|gasgrill/gi, "built-in BBQ grill / outdoor kitchen")
        .replace(/pergola/gi, "wooden pergola with climbing plants")
        .replace(/pool|schwimmbad/gi, "swimming pool")
        .replace(/jacuzzi|whirlpool/gi, "jacuzzi hot tub")
        .replace(/außenküche|outdoor.?küche/gi, "full outdoor kitchen with countertop")
        .replace(/hochbeet/gi, "raised garden bed with herbs")
        .replace(/pavillon/gi, "garden pavilion / gazebo")
        .replace(/lichterketten?/gi, "warm 2200K string lights")
        .replace(/sichtschutz/gi, "privacy fence / screen")
        .replace(/pflanzen|blumen/gi, "potted plants and flowers")
        .replace(/olivenbaum/gi, "large olive tree in terracotta planter")
        .replace(/lavendel/gi, "lavender bushes")
        .replace(/sofa|couch/gi, "outdoor lounge sofa with cushions")
        .replace(/tisch/gi, "dining table")
        .replace(/stühle?/gi, "designer chairs")
        .replace(/lounge/gi, "outdoor lounge area")
        .replace(/beleuchtu\w+|licht/gi, "warm outdoor lighting 2200K")
        .replace(/mauer|wand/gi, "wall")
        .replace(/boden/gi, "floor")
        .replace(/fliesen/gi, "large format outdoor porcelain tiles")
        .replace(/holz(?:boden|dielen)?/gi, "teak wood decking")
        .replace(/keine?|kein/gi, "REMOVE")
        .replace(/dafür|stattdessen/gi, "and instead ADD")
        .replace(/anstatt|statt/gi, "instead of");
    }

    const translatedContext = chatContext ? preTranslate(chatContext) : null;
    let roomDescription = "";
    let fluxPrompt = "";

    if (process.env.ANTHROPIC_API_KEY) {
      const analysePrompt = chatContext
        ? `${dimensionInfo}You are a world-class interior design AI specialized in photorealistic renovation visualization.

USER WANTS THESE EXACT CHANGES: "${chatContext}"
TRANSLATED: "${translatedContext}"

CRITICAL RULES:
1. The user's changes are ABSOLUTE PRIORITY - implement ALL of them precisely
2. If user says "no bathtub" - REMOVE IT completely
3. If user says "walk-in shower" - ADD a detailed walk-in shower
4. If user says "dark tiles" - make ALL floor/wall tiles dark
5. Keep same room perspective and architectural structure
6. If user wants to ADD furniture/objects: specify EXACT position (e.g. "place a king-size bed centered against the main wall", "add a dining table in the center of the room")
7. For empty rooms: be very explicit about WHERE objects go and their SIZE
8. Always describe objects in photorealistic detail with brand names and materials

Write ONE ultra-detailed English prompt for Flux image-to-image renovation. Structure EXACTLY like this:

PART 1 - STRUCTURE (most important):
"realistic renovation makeover, keep exact room layout and architecture, same room position, same window and door placement, same ceiling height, same perspective and camera angle, photorealistic interior photography"

PART 2 - USER CHANGES (mandatory):
Apply these exact changes: "${chatContext}" - be very specific about position (e.g. "king-size bed centered against the north wall", "floating vanity 80cm width on left wall")

PART 3 - MATERIALS & DETAILS:
- Tile sizes with grout (e.g. "120x60cm matte anthracite porcelain tiles, 2mm grey grout")
- Fixture brands: Grohe, Hansgrohe, Duravit, TOTO
- Exact colors: RAL codes or Farrow & Ball names
- Surfaces: matte, polished, brushed, satin

PART 4 - LIGHTING (critical for realism):
"warm ambient LED lighting 2700K, indirect cove lighting, recessed spotlights, soft shadows, natural light from window, realistic light reflections on tiles"

PART 5 - QUALITY KEYWORDS:
"photorealistic, architectural visualization, Architectural Digest quality, shot with Sony A7R IV 24mm, soft natural shadows, depth of field, 8K ultra detailed, interior photography magazine quality"

Return ONLY valid JSON: {"description": "current room in 1 sentence", "prompt": "full structured prompt", "negative": "cartoon, illustration, CGI render, unrealistic, distorted geometry, wrong perspective, extra rooms, hallucination, blurry, low quality, painting, sketch"}`
        : `${dimensionInfo}You are a world-class interior design AI. Analyze this room and create a stunning modern renovation.

Analyze this room and create a stunning realistic renovation prompt. Structure EXACTLY like this:

PART 1: "realistic renovation makeover, keep exact room layout and architecture, same perspective and camera angle, photorealistic interior photography, architectural visualization"

PART 2 - DETECT room type and apply best 2026 renovation:
- Bathroom → large format 120x60cm porcelain tiles, floating oak vanity, Grohe matte black fixtures, LED mirror IP44, walk-in shower, indirect 2700K cove lighting
- Kitchen → navy/sage green shaker fronts, brass hardware, zellige backsplash, quartz countertop, pendant lights 2700K  
- Living room → dark green/terracotta accent wall, fluted MDF panels, bouclé sofa, cove lighting 2700K
- Bedroom → accent wall, upholstered headboard, linen curtains, brass wall sconces 2200K
- Terrace → large format outdoor tiles 80x80cm, lounge set, olive tree in terracotta, string lights 2200K
${dimensionInfo ? `Room is ${dimensionInfo} - scale furniture accordingly` : ""}

PART 3: "warm ambient LED lighting 2700K, soft shadows, natural light, realistic reflections, indirect cove lighting"

PART 4: "photorealistic, Architectural Digest quality, Sony A7R IV 24mm, 8K ultra detailed, interior photography magazine quality, soft natural shadows, depth of field"

Return ONLY valid JSON: {"description": "current room state", "prompt": "full structured prompt", "negative": "cartoon, CGI, render, unrealistic, distorted, hallucination, wrong perspective, blurry, painting"}`;

      const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 800,
          messages: [{
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: "image/jpeg", data: cleanBase64 } },
              { type: "text", text: analysePrompt },
            ],
          }],
        }),
      });

      if (claudeRes.ok) {
        const claudeData = await claudeRes.json();
        const rawText = claudeData.content?.map(b => b.text || "").join("").trim();
        try {
          const jsonMatch = rawText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            roomDescription = parsed.description || "";
            fluxPrompt = parsed.prompt || "";
            const negFromClaude = parsed.negative || "";

            // Combine with user-specified negatives
            const baseNeg = "blurry, low quality, distorted, unrealistic, cartoon, painting";
            const finalNeg = negFromClaude ? `${negFromClaude}, ${baseNeg}` : baseNeg;

            // Use Claude's prompt directly – it already has everything
            console.log("Claude prompt:", fluxPrompt.slice(0, 200));

            // ── SCHRITT 2: Flux mit Claude-optimiertem Prompt ──────────────
            const result = await runFlux(cleanBase64, fluxPrompt, finalNeg, plan, chatContext);
            if (result.error) return res.status(500).json({ error: result.error });

            return res.json({
              imageUrl: result.imageUrl,
              imageBase64: result.imageBase64,
              materials: generateMaterials(chatContext, style, lang),
              roomDescription,
              isObjectReplacement: !!(chatContext && chatContext.match(/keine|dafür|statt|anstatt|ersetzen|entfernen/i)),
              model: plan === "pro" ? "claude+flux-pro" : "claude+flux-dev",
            });
          }
        } catch (parseErr) {
          console.log("Claude parse error, falling back to direct prompt");
        }
      }
    }

    // ── FALLBACK: Direkter Prompt ohne Claude-Analyse ─────────────────────
    const fallbackPrompt = buildFallbackPrompt(chatContext, style);
    const fallbackNeg = "blurry, low quality, distorted, unrealistic";
    const result = await runFlux(cleanBase64, fallbackPrompt, fallbackNeg, plan, chatContext);
    if (result.error) return res.status(500).json({ error: result.error });

    res.json({
      imageUrl: result.imageUrl,
      imageBase64: result.imageBase64,
      materials: generateMaterials(chatContext, style),
      isObjectReplacement: !!(chatContext && chatContext.match(/keine|dafür|statt|anstatt|ersetzen|entfernen/i)),
      model: plan === "pro" ? "flux-pro" : "flux-dev",
    });

  } catch (err) {
    console.error("Generate error:", err);
    res.status(500).json({ error: `Server-Fehler: ${err.message}` });
  }
}

// ── Flux ausführen ────────────────────────────────────────────────────────────
async function runFlux(base64, prompt, negativePrompt, plan, chatContext) {
  let uploadedUrl = null;
  const imageBuffer = Buffer.from(base64, "base64");

  // Upload zu fal.ai
  try {
    const uploadRes = await fetch("https://fal.run/fal-ai/storage/upload", {
      method: "POST",
      headers: { "Authorization": `Key ${process.env.FAL_KEY}`, "Content-Type": "image/jpeg" },
      body: imageBuffer,
    });
    if (uploadRes.ok) {
      const uploadData = await uploadRes.json();
      uploadedUrl = uploadData?.url || uploadData?.file_url || null;
    }
  } catch {}

  const imageUrl = uploadedUrl || `data:image/jpeg;base64,${base64}`;

  // Strength dynamisch – höher = mehr Änderungen
  const hasObjReplace = chatContext && chatContext.match(/keine|dafür|statt|anstatt|entfernen|remove|ohne|weg/i);
  const hasMinorChange = chatContext && chatContext.match(/farbe|color|heller|dunkler|lighter|darker|ton|shade/i);
  const hasAddObject = chatContext && chatContext.match(/füge|hinzufügen|add|einbauen|place|put|install|stell|hang/i);
  const strength = hasObjReplace ? 0.92 : hasAddObject ? 0.95 : hasMinorChange ? 0.65 : (chatContext ? 0.80 : 0.68);

  // Flux Dev für alle Pläne – optimierte Parameter
  // Use Flux Dev with image-to-image + better parameters for structure preservation
  const falEndpoint = "https://fal.run/fal-ai/flux/dev/image-to-image";

  const falBody = {
    image_url: imageUrl,
    prompt,
    negative_prompt: negativePrompt || "cartoon, illustration, painting, drawing, anime, sketch, low quality, blurry, distorted geometry, wrong perspective, extra rooms, different angle, render, CGI, unrealistic, deformed, watermark, hallucination, wrong room, different room",
    strength,
    num_inference_steps: 50,
    guidance_scale: 8.0,
    num_images: 1,
    enable_safety_checker: false,
    output_format: "jpeg",
    image_size: "landscape_4_3",
    seed: Math.floor(Math.random() * 1000000),
  };

  const falRes = await fetch(falEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Key ${process.env.FAL_KEY}` },
    body: JSON.stringify(falBody),
  });

  const rawText = await falRes.text();
  let data;
  try { data = JSON.parse(rawText); }
  catch { return { error: `fal.ai Parse Fehler: ${rawText.slice(0, 200)}` }; }

  if (!falRes.ok) return { error: `fal.ai ${falRes.status}: ${JSON.stringify(data).slice(0, 300)}` };

  const resultUrl = data?.images?.[0]?.url || data?.image?.url || data?.output?.[0] || null;
  if (!resultUrl) return { error: `Kein Bild. Response: ${JSON.stringify(data).slice(0, 200)}` };

  // Bild server-seitig holen (kein CORS)
  let resultBase64 = null;
  try {
    const imgFetch = await fetch(resultUrl);
    if (imgFetch.ok) {
      resultBase64 = Buffer.from(await imgFetch.arrayBuffer()).toString("base64");
    }
  } catch {}

  return { imageUrl: resultUrl, imageBase64: resultBase64 };
}

// ── Fallback Prompt ohne Claude ───────────────────────────────────────────────
function buildFallbackPrompt(chatContext, style) {
  const PRESERVE_IN  = "Preserve exact room layout, same window positions, same walls, same perspective. Photorealistic interior architecture photography, 8k, professional lighting.";
  const PRESERVE_OUT = "Preserve exact outdoor layout, same balustrade, same stairs, same walls, same perspective. Photorealistic architectural photography, 8k, golden hour lighting.";

  if (!chatContext) {
    const STYLE_PROMPTS = {
      "bad-modern":   { p:"luxury spa bathroom renovation, large format 120x60cm dark anthracite porcelain tiles floor to ceiling, frameless glass walk-in shower with rainfall showerhead, floating teak wall-mounted vanity, backlit LED mirror, matte black Grohe fixtures, warm 2700K recessed lighting", pr:PRESERVE_IN },
      "bad-warm":     { p:"warm scandinavian bathroom renovation, handmade white zellige subway tiles, natural oak floating vanity, brushed brass Hansgrohe faucet, herringbone marble floor, round brass mirror, green plant, warm 2200K lighting", pr:PRESERVE_IN },
      "bad-mikro":    { p:"microcement spa bathroom, seamless warm grey microcement walls and floor, floating walnut vanity, matte black tapware, large rectangular backlit mirror, indirect LED cove lighting, zen minimalist atmosphere", pr:PRESERVE_IN },
      "kueche-navy":  { p:"stunning navy blue shaker kitchen, deep navy cabinets, brushed brass bin pulls, open floating white oak shelves, calacatta marble countertop, aged brass pendant lights, zellige white tile backsplash", pr:PRESERVE_IN },
      "kueche-grau":  { p:"sleek grey lacquered kitchen, silk grey flat-front cabinets, integrated appliances, matte black tap, large white ceramic backsplash, LED strip under wall cabinets, quartz countertop", pr:PRESERVE_IN },
      "kueche-gruen": { p:"warm sage green shaker kitchen, sage green cabinets, aged brass cup pulls, live edge walnut open shelves, white zellige tile backsplash, butcher block island, rattan pendant lights", pr:PRESERVE_IN },
      "wohn-gruen":   { p:"dramatic living room, deep forest green limewash feature wall, wide plank oak herringbone floor, curved cream bouclé sofa, large brass arc floor lamp, built-in bookshelves with warm LED cove lighting, terracotta ceramic vases", pr:PRESERVE_IN },
      "wohn-terra":   { p:"earthy warm living room, burnt terracotta venetian plaster accent wall, natural jute rug, curved rattan lounge chairs, low solid oak coffee table, warm 2200K lighting, clay pots with plants", pr:PRESERVE_IN },
      "schlaf-terra": { p:"serene terracotta bedroom, warm terracotta venetian plaster feature wall, upholstered bouclé curved headboard 180cm, layered linen bedding, aged brass wall sconces 2200K, linen curtains", pr:PRESERVE_IN },
      "schlaf-dunkel":{ p:"moody luxury bedroom, deep midnight navy ceiling, white limewash walls, invisible LED cove lighting, low velvet platform bed in charcoal, brass bedside pendant lights, floor-length curtains", pr:PRESERVE_IN },
      "terrasse-wpc": { p:"stunning renovated Mediterranean terrace, premium large format 80x80cm sandstone porcelain outdoor tiles covering entire floor, modern outdoor lounge set with thick weatherproof sand-color cushions, solid teak dining table with 4 designer chairs, multiple large terracotta planters with olive trees and lavender, outdoor wall sconces warm 2200K, climbing plants on white wall, outdoor rug under lounge area", pr:PRESERVE_OUT },
    };
    const s = STYLE_PROMPTS[style] || STYLE_PROMPTS["bad-modern"];
    return `${s.p}. ${s.pr}`;
  }

  const isOutdoor = style === "terrasse-wpc" || /terrasse|balkon|outdoor|garten/i.test(chatContext);
  const PRESERVE = isOutdoor ? PRESERVE_OUT : PRESERVE_IN;

  const t = chatContext
    .replace(/keine?\s+(\w+)\s+dafür/gi, "REMOVE $1, ADD")
    .replace(/keine?|kein/gi, "remove")
    .replace(/dafür|stattdessen/gi, "instead add")
    .replace(/badewanne/gi, "bathtub").replace(/dusche/gi, "shower")
    .replace(/fliesen/gi, "tiles").replace(/dunkel/gi, "dark")
    .replace(/modern/gi, "modern").replace(/weiß/gi, "white")
    .replace(/grau/gi, "grey").replace(/schwarz/gi, "matte black")
    .replace(/terrasse|balkon/gi, "terrace").replace(/boden/gi, "floor")
    .replace(/lounge/gi, "outdoor lounge furniture").replace(/pflanzen/gi, "plants and planters");

  return `${t}. ${PRESERVE}`;
}

// ── Affiliate Links ──────────────────────────────────────────────────────────
// TODO: Echte Tags nach Anmeldung eintragen:
// Amazon:  tag=mystorija-21   → amazon.de/associates
// OBI:     awc=XXXX           → awin.com (Merchant: OBI, ID: 13295)
// Bauhaus: awc=XXXX           → awin.com (Merchant: Bauhaus)
// Hornbach: awc=XXXX          → belboon.com oder awin.com

const AMZN  = (q) => `https://www.amazon.de/s?k=${encodeURIComponent(q)}&tag=mystorija-21`;
const OBI   = (q) => `https://www.obi.de/suche/${encodeURIComponent(q)}/`;
const BH    = (q) => `https://www.bauhaus.info/search?q=${encodeURIComponent(q)}`;
const HB    = (q) => `https://www.hornbach.de/s/${encodeURIComponent(q)}/`;

function shopLinks(q_amzn, q_bau) {
  const bq = q_bau || q_amzn;
  return `[Amazon](${AMZN(q_amzn)}) · [OBI](${OBI(bq)}) · [Bauhaus](${BH(bq)}) · [Hornbach](${HB(bq)})`;
}

// ── Materialien generieren ────────────────────────────────────────────────────
function generateMaterials(chatContext, style, lang) {
  const isEN = lang === "en";
  const approx = isEN ? "Approx." : "Ca.";
  const ctx = (chatContext || "").toLowerCase();
  const items = [];

  if (ctx.match(/dusche|shower/))
    items.push(`🚿 **${isEN ? "Walk-In Shower Set" : "Walk-In Dusche Set"}** – ${isEN ? "8mm tempered glass + mixer + drain. " : "Glaswand 8mm ESG + Armatur + Ablaufrinne. "}${approx} 800–2.500€.
${shopLinks("walk in dusche set glaswand", "walk-in dusche")}`);

  if (ctx.match(/badewanne/))
    items.push(`🛁 **${isEN ? "Freestanding Bathtub" : "Freistehende Badewanne"}** – ${isEN ? "Oval acrylic 170×75cm. " : "Acryl oval 170×75cm. "}${approx} 400–1.500€.
${shopLinks("freistehende badewanne acryl oval", "freistehende badewanne")}`);

  if (ctx.match(/fliesen|tiles/))
    items.push(`🪨 **${isEN ? "Porcelain Tile 60×120cm" : "Feinsteinzeug 60×120cm"}** – ${isEN ? "Concrete or marble look. " : "Betonoptik oder Marmor. "}${approx} 25–55€/m².
${shopLinks("feinsteinzeug fliesen 60x120 grau", "feinsteinzeug fliesen 60x120")}`);

  if (ctx.match(/dunkel|anthrazit|dark|schwarz/))
    items.push(`⬛ **${isEN ? "Matte Black Fixtures" : "Mattschwarz Armaturen"}** – ${isEN ? "Grohe Essence or Hansgrohe. " : "Grohe Essence oder Hansgrohe. "}${approx} 200–600€.
${shopLinks("grohe armatur mattschwarz bad", "armatur mattschwarz bad")}`);

  if (ctx.match(/holz|eiche|wood|oak/))
    items.push(`🪵 **${isEN ? "Wall-Hung Oak Vanity 80cm" : "Waschtisch Eiche wandhängend"}** – ${isEN ? "Solid wood. " : "Massiv, 80cm. "}${approx} 400–900€.
${shopLinks("waschtisch eiche wandmontage", "waschtisch holz wandmontage")}`);

  if (ctx.match(/licht|light|led/))
    items.push(`💡 **LED Mirror IP44** – ${isEN ? "Backlit, dimmable. " : "Hinterbeleuchtet, dimmbar. "}${approx} 80–300€.
${shopLinks("led spiegel bad ip44 dimmbar", "led spiegel bad")}`);

  if (ctx.match(/mikrozement|beton/))
    items.push(`🏛️ **${isEN ? "Microcement Kit 10m²" : "Mikrozement Set 10m²"}** – ${isEN ? "Primer + microcement + sealer. " : "Haftgrund + Mikrozement + Versiegelung. "}${approx} 200–400€.
${shopLinks("mikrozement set komplett boden wand", "mikrozement set")}`);

  if (ctx.match(/farbe|streichen|wandfarbe/))
    items.push(`🎨 **${isEN ? "Premium Matt Wall Paint" : "Wandfarbe Premium matt"}** – ${isEN ? "Alpina or Schöner Wohnen. " : "Alpina oder Schöner Wohnen. "}${approx} 20–60€.
${shopLinks("wandfarbe matt premium alpina", "wandfarbe innen matt")}`);

  if (ctx.match(/parkett|boden|laminat|vinyl/))
    items.push(`🪵 **${isEN ? "SPC Vinyl / Laminate" : "SPC-Vinyl / Laminat"}** – ${isEN ? "Click system, waterproof. " : "Klicksystem, wasserfest. "}${approx} 15–35€/m².
${shopLinks("spc vinyl klick boden wasserfest", "vinyl laminat klick boden")}`);

  if (ctx.match(/tapete|tapezier/))
    items.push(`🌿 **${isEN ? "Premium Wallpaper" : "Tapete Premium"}** – ${isEN ? "Non-woven, easy to hang. " : "Vliestapete, einfach zu verarbeiten. "}${approx} 20–60€/roll.
${shopLinks("vliestapete premium wohnzimmer", "vliestapete")}`);

  if (ctx.match(/terrasse|wpc|dielen/))
    items.push(`🌴 **${isEN ? "Composite Decking Set" : "WPC-Dielen Set"}** – ${isEN ? "Incl. clips + pedestals. " : "Inkl. Stelzlager und Clips. "}${approx} 35–65€/m².
${shopLinks("wpc dielen terrasse stelzlager set", "wpc dielen terrasse")}`);

  if (ctx.match(/grill|bbq/))
    items.push(`🔥 **${isEN ? "Outdoor Gas Grill" : "Gasgrill Outdoor"}** – ${isEN ? "3-burner, incl. side cooker. " : "3-Brenner, inkl. Seitenkocher. "}${approx} 300–1.500€.
${shopLinks("gasgrill outdoor 3 brenner edelstahl", "gasgrill outdoor")}`);

  if (ctx.match(/pergola/))
    items.push(`🌿 **${isEN ? "Pergola Kit" : "Pergola Bausatz"}** – ${isEN ? "Douglas fir, weather-resistant. " : "Douglasie, wetterfest. "}${approx} 400–1.500€.
${shopLinks("pergola bausatz douglasie holz", "pergola bausatz holz")}`);

  if (ctx.match(/rigips|trockenbau|wand bauen/))
    items.push(`🏗️ **${isEN ? "Drywalling Kit" : "Trockenbau Set"}** – ${isEN ? "CW/UW tracks + plasterboard + screws. " : "CW/UW-Profile + Rigipsplatten + Schrauben. "}${approx} 8–15€/m².
${shopLinks("rigips ständerwerk trockenbau set", "trockenbau set rigips")}`);

  if (ctx.match(/spiegel/))
    items.push(`🪞 **${isEN ? "Round / LED Mirror" : "Rundspiegel / LED-Spiegel"}** – ${isEN ? "Brass or matte black. " : "Messing oder Mattschwarz. "}${approx} 80–400€.
${shopLinks("spiegel rund messing bad wohnzimmer", "spiegel rund bad")}`);

  // Fallback style-based materials
  if (items.length === 0) {
    const SM = {
      "bad-modern": [
        `🪨 **${isEN ? "Anthracite Porcelain Tile 120×60cm" : "Feinsteinzeug Anthrazit 120×60cm"}** – ${approx} 35–55€/m².
${shopLinks("feinsteinzeug anthrazit 120x60", "feinsteinzeug anthrazit")}`,
        `🚿 **${isEN ? "Matte Black Grohe Tap" : "Grohe Armatur Mattschwarz"}** – ${approx} 200–450€.
${shopLinks("grohe armatur mattschwarz", "armatur mattschwarz")}`,
        `💡 **LED Mirror IP44** – ${approx} 150–400€.
${shopLinks("led spiegel bad ip44 hinterbeleuchtet", "led spiegel bad")}`,
        `🪵 **${isEN ? "Wall-Hung Teak Vanity" : "Waschtisch Teak wandhängend"}** – ${approx} 600–1.200€.
${shopLinks("waschtisch teak wandmontage", "waschtisch holz")}`,
      ],
      "bad-warm": [
        `🟫 **${isEN ? "Zellige Metro Tiles 7.5×15cm" : "Zellige Metro-Fliesen 7,5×15cm"}** – ${approx} 40–80€/m².
${shopLinks("zellige fliesen metro weiß handgemacht", "metro fliesen bad")}`,
        `🪵 **${isEN ? "Oak Vanity 80cm" : "Eiche Waschtisch 80cm"}** – ${approx} 400–900€.
${shopLinks("waschtisch eiche massiv bad", "waschtisch eiche")}`,
        `✨ **${isEN ? "Hansgrohe Gold Tap" : "Hansgrohe Armatur Gold"}** – ${approx} 250–500€.
${shopLinks("hansgrohe armatur gold gebürstet", "armatur gold bad")}`,
      ],
      "bad-mikro": [
        `🏛️ **${isEN ? "Microcement Kit 10m²" : "Mikrozement Set 10m²"}** – ${approx} 200–400€.
${shopLinks("mikrozement set komplett bad boden", "mikrozement bad")}`,
        `🖤 **${isEN ? "Matte Black Mixer Tap" : "Armatur Mattschwarz"}** – ${approx} 150–400€.
${shopLinks("armatur mattschwarz bad unterputz", "armatur mattschwarz")}`,
        `💡 **${isEN ? "Rectangular LED Mirror" : "LED-Spiegel rechteckig"}** – ${approx} 120–350€.
${shopLinks("led spiegel bad rechteckig dimmbar", "led spiegel bad")}`,
      ],
      "kueche-navy": [
        `🎨 **${isEN ? "Primer + Satin Lacquer" : "Haftgrund + Seidenmatt Lack"}** – ${isEN ? "Zinsser BIN + Jotun. " : "Zinsser BIN + Jotun. "}${approx} 60–120€.
${shopLinks("zinsser bin haftgrund küche lackieren", "haftgrund küchenfronten")}`,
        `✨ **${isEN ? "Brass Handles 128mm" : "Messing Griffe 128mm"}** – ${approx} 50–120€.
${shopLinks("küchen griffe messing gebürstet 128mm set", "küchen griffe messing")}`,
        `🪨 **${isEN ? "Calacatta Worktop" : "Calacatta Arbeitsplatte"}** – ${isEN ? "Quartz or porcelain. " : "Quarz oder Feinsteinzeug. "}${approx} 200–600€.
${shopLinks("quarz arbeitsplatte calacatta küche", "arbeitsplatte marmor optik")}`,
        `💡 **${isEN ? "LED Strip 2700K Kitchen" : "LED-Strip 2700K Küche"}** – ${approx} 30–60€.
${shopLinks("led strip küche unterschrank 2700k", "led strip küche")}`,
      ],
      "kueche-grau": [
        `🎨 **${isEN ? "Satin Grey Lacquer" : "Seidenmatt Lack Grau"}** – RAL 7035 ${isEN ? "or" : "oder"} 7016. ${approx} 30–80€.
${shopLinks("küche lack grau seidenmatt ral", "lack küche grau")}`,
        `🪨 **${isEN ? "White Quartz Worktop" : "Quarz Arbeitsplatte weiß"}** – ${approx} 200–500€.
${shopLinks("quarz arbeitsplatte weiß küche silestone", "quarz arbeitsplatte küche")}`,
        `💡 **LED Strip 4000K** – ${approx} 25–55€.
${shopLinks("led strip 4000k neutralweiß küche", "led strip küche neutralweiß")}`,
      ],
      "kueche-gruen": [
        `🌿 **${isEN ? "Sage Green Satin Lacquer" : "Seidenmatt Lack Salbeigrün"}** – RAL 6021. ${approx} 30–80€.
${shopLinks("lack salbeigrün küche seidenmatt ral 6021", "lack küche grün")}`,
        `✨ **${isEN ? "Brass Cup Pulls" : "Messing Cup Pulls"}** – ${approx} 40–100€.
${shopLinks("küchen griffe cup pull messing alt", "küchen griffe messing cup")}`,
        `🪵 **${isEN ? "Live Edge Oak Shelf" : "Live Edge Wandregal Eiche"}** – ${approx} 80–200€.
${shopLinks("wandregal massivholz eiche live edge küche", "wandregal massivholz küche")}`,
      ],
      "wohn-gruen": [
        `🌿 **${isEN ? "Bottle Green Matt Paint" : "Wandfarbe Flaschengrün matt"}** – Alpina. ${approx} 25–60€.
${shopLinks("wandfarbe flaschengrün dunkelgrün matt alpina", "wandfarbe dunkelgrün")}`,
        `🪵 **Fluted MDF Panel** – ${approx} 30–60€/m².
${shopLinks("wandpaneele mdf fluted panel holzoptik", "wandpaneele mdf fluted")}`,
        `💡 **LED Strip 2700K Cove** – ${approx} 25–50€.
${shopLinks("led strip 2700k warmweiß dimmbar cove", "led strip 2700k")}`,
        `🛋️ **${isEN ? "Bouclé Cushion Covers" : "Bouclé Kissenbezüge"}** – ${approx} 20–60€.
${shopLinks("bouclé kissenbezug creme wohnzimmer", "kissen bouclé wohnzimmer")}`,
      ],
      "wohn-terra": [
        `🎨 **${isEN ? "Terracotta Wall Paint" : "Wandfarbe Terrakotta"}** – Alpina ${isEN ? "Florentine Earth" : "Florentiner Erde"}. ${approx} 20–45€.
${shopLinks("wandfarbe terrakotta alpina florentiner erde", "wandfarbe terrakotta")}`,
        `🪑 **${isEN ? "Rattan Armchair" : "Rattan Sessel"}** – ${approx} 150–500€.
${shopLinks("rattan sessel wohnzimmer natur", "rattan sessel")}`,
        `🟫 **${isEN ? "Jute Rug 200×300" : "Jute Teppich 200×300"}** – ${approx} 80–250€.
${shopLinks("jute teppich naturfarben 200x300", "jute teppich groß")}`,
      ],
      "schlaf-terra": [
        `🎨 **${isEN ? "Terracotta Wall Paint" : "Wandfarbe Terrakotta"}** – ${approx} 20–45€.
${shopLinks("wandfarbe terrakotta schlafzimmer warm", "wandfarbe terrakotta")}`,
        `🛏️ **${isEN ? "Bouclé Fabric for Headboard" : "Bouclé Stoff für Kopfteil"}** – ${approx} 15–30€/m².
${shopLinks("bouclé stoff polsterstoff creme meterware", "bouclé stoff meterware")}`,
        `💡 **${isEN ? "Brass Wall Sconces ×2" : "Wandleuchten Messing 2x"}** – ${approx} 80–200€.
${shopLinks("wandleuchte messing schlafzimmer gelenkarm", "wandleuchte messing bett")}`,
      ],
      "schlaf-dunkel": [
        `🎨 **${isEN ? "Navy / Anthracite Wall Paint" : "Wandfarbe Nachtblau / Anthrazit"}** – ${approx} 25–60€.
${shopLinks("wandfarbe nachtblau dunkel matt premium", "wandfarbe dunkelblau")}`,
        `🪟 **${isEN ? "Floor-Length Velvet Curtains" : "Samtvorhänge bodenlang"}** – ${approx} 80–200€.
${shopLinks("samtvorhang velvet dunkel bodenlang öse", "samtvorhang dunkel")}`,
        `💡 **LED Cove Strip 2200K** – ${approx} 30–70€.
${shopLinks("led strip 2200k extra warmweiß dimmbar", "led strip extra warmweiß")}`,
      ],
      "terrasse-wpc": [
        `🌴 **${isEN ? "Composite Decking Set 10m²" : "WPC-Dielen Set 10m²"}** – ${isEN ? "Incl. clips + pedestals. " : "Inkl. Clips + Stelzlager. "}${approx} 35–65€/m².
${shopLinks("wpc dielen terrasse 10m2 stelzlager clips", "wpc dielen terrasse set")}`,
        `☀️ **${isEN ? "Outdoor Lounge Set" : "Outdoor Lounge Set"}** – ${isEN ? "Polyrattan, Sunbrella cushions. " : "Polyrattan, Sunbrella-Kissen. "}${approx} 400–1.200€.
${shopLinks("outdoor lounge polyrattan set sunbrella terrasse", "outdoor lounge set")}`,
        `✨ **${isEN ? "Solar String Lights 2200K" : "Solar Lichterketten 2200K"}** – ${approx} 20–60€.
${shopLinks("solar lichterketten warmweiß außen terrasse", "lichterketten solar außen")}`,
        `🌿 **${isEN ? "Olive Tree + Terracotta Pot" : "Olivenbaum + Terrakotta Topf"}** – ${approx} 80–300€.
${shopLinks("olivenbaum groß topf terrasse balkon", "olivenbaum terrakotta topf")}`,
      ],
    };
    return (SM[style] || SM["bad-modern"]).join("\n");
  }

  return items.join("\n");
}
