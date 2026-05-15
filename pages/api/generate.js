export const config = {
  api: { bodyParser: { sizeLimit: "15mb" } },
};

// Prompts inspired by Luka's reference images
const BASE_PROMPTS = {
  "bad-modern":    "same room layout same perspective, luxury spa bathroom, large format dark charcoal porcelain tiles 120x60cm, floating teak vanity, LED backlit mirror, matte black Grohe faucets, warm 2700K LED cove lighting, architectural magazine editorial photorealistic 8k",
  "bad-warm":      "same room layout same perspective, scandinavian bathroom, white handmade zellige tiles, natural oak vanity, brushed gold faucets, plants, warm 2200K, herringbone marble floor, architectural magazine editorial photorealistic 8k",
  "bad-mikro":     "same room layout same perspective, seamless microcement tadelakt bathroom, floating walnut vanity, matte black tapware, hidden LED cove lighting, zen minimalist, architectural magazine editorial photorealistic 8k",
  "kueche-navy":   "same room layout same perspective, modern kitchen matte black handleless cabinets, warm walnut wood accents, LED strip lighting under cabinets 2700K, stone backsplash, walnut dining table, black pendant lights, LED cove ceiling, architectural magazine editorial photorealistic 8k",
  "kueche-grau":   "same room layout same perspective, minimalist taupe grey flat front kitchen, handleless cabinets, warm LED strip 2700K, black matte tap, white stone countertop, clean modern, architectural magazine editorial photorealistic 8k",
  "kueche-gruen":  "same room layout same perspective, warm kitchen sage green cabinets, brass handles, walnut open shelves, zellige backsplash, live edge table, architectural magazine editorial photorealistic 8k",
  "wohn-gruen":    "same room layout same perspective, modern living room warm LED cove ceiling lighting 2700K, taupe walls, floating TV cabinet with LED strip, large sectional sofa, herringbone parquet floor, architectural magazine editorial photorealistic 8k",
  "wohn-terra":    "same room layout same perspective, luxury living room white marble floor, white gloss TV wall with LED cove, cream sofa, warm LED cove ceiling, linen curtains floor to ceiling, architectural magazine editorial photorealistic 8k",
  "schlaf-terra":  "same room layout same perspective, bedroom warm terracotta venetian plaster wall, upholstered bouclé headboard, LED cove lighting 2200K, oak slat panels, linen bedding, architectural magazine editorial photorealistic 8k",
  "schlaf-dunkel": "same room layout same perspective, moody bedroom navy ceiling, white limewash walls, LED cove 2700K, velvet platform bed, brass pendants, architectural magazine editorial photorealistic 8k",
  "terrasse-wpc":  "same room layout same perspective, modern terrace premium WPC decking LED floor strip, outdoor lounge Sunbrella cushions, pergola, Edison string lights, olive tree planters, architectural magazine editorial photorealistic 8k",
};

const MATERIAL_EXPLANATIONS = {
  "bad-modern":    "modernes Spa-Bad mit dunklen Charcoal-Fliesen (120x60cm), schwebendem Teakholz-Waschtisch, mattschwarzem Grohe-Armaturenset und indirekten LED-Streifen (2700K warm)",
  "bad-warm":      "Scandinavian-Bad mit handgemachten Zellige-Kacheln, Eichenholz-Waschtisch, goldfarbenen Hansgrohe-Armaturen und Pflanzen",
  "bad-mikro":     "Mikrozement-Bad mit fugenlosem Betonfinish, schwebendem Waschtisch aus Nussholz und versteckter LED-Beleuchtung",
  "kueche-navy":   "Schwarze grifflose Küche mit warmen Walnuss-Akzenten, LED-Streifen unter Schränken (2700K), Steinrückwand und Walnuss-Esstisch",
  "kueche-grau":   "minimalistische Taupe/Grau Küche mit grifflosen Fronten, LED-Streifen 2700K, schwarzem Armatur und weißer Steinarbeitsplatte",
  "kueche-gruen":  "warme Küche mit Salbeigrün-Fronten, Messinggriffen, Walnuss-Regalen und Zellige-Rückwand",
  "wohn-gruen":    "Wohnzimmer mit warmem LED Cove-Licht (2700K), Taupe-Wänden, schwebendem TV-Möbel mit LED-Streifen und Fischgrät-Parkett",
  "wohn-terra":    "luxuriöses Wohnzimmer mit weißem Marmorboden, weißer Hochglanz-TV-Wand, LED Cove-Decke und bodenlangen Leinenvorhängen",
  "schlaf-terra":  "Schlafzimmer mit Terrakotta Venetian-Plaster-Wand, gepolstertem Bouclé-Kopfteil, Leinenbettwäsche und vertikalen Eichenholz-Paneelen",
  "schlaf-dunkel": "Schlafzimmer mit dunkelblauer Decke, Limewash-Wänden, Samtbett, Messing-Pendelleuchten und indirektem Cove-Licht",
  "terrasse-wpc":  "Terrasse mit Premium Teak-WPC-Dielen, LED-Bodenstreifen, Modular-Lounge, Stahl-Pergola und Olivenbäumen",
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  var imageBase64 = req.body.imageBase64;
  var style = req.body.style;
  var chatContext = req.body.chatContext || null;

  if (!imageBase64 || !style) {
    return res.status(400).json({ error: "Bild und Stil fehlen" });
  }

  var basePrompt = BASE_PROMPTS[style] || BASE_PROMPTS["bad-modern"];
  var finalPrompt = basePrompt;
  var materialText = MATERIAL_EXPLANATIONS[style] || "";

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      var userContext = chatContext ? "Nutzerwuensche: " + chatContext + ". " : "";
      var claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-opus-4-6",
          max_tokens: 600,
          messages: [{
            role: "user",
            content: userContext + "Basis-Stil: " + basePrompt + "\n\nGib mir zwei Dinge:\n1. PROMPT: Verbesserter englischer Bild-Prompt (max 80 Woerter). MUSS beginnen mit 'same room layout same perspective'. Baut Nutzerwuensche ein. Endet mit 'architectural magazine editorial photorealistic 8k'.\n2. MATERIALIEN: Deutsche Erklaerung (5-8 Punkte mit Emoji) was im Bild zu sehen ist, Materialnamen, Kosten, wo kaufen (OBI/Bauhaus/Amazon/IKEA). Nutze **fett** fuer Produktnamen. Fuer Anfaenger.\n\nFormat:\nPROMPT: [prompt]\nMATERIALIEN: [erklaerung]",
          }],
        }),
      });
      var claudeData = await claudeRes.json();
      if (claudeData.content && claudeData.content[0]) {
        var text = claudeData.content[0].text;
        var promptMatch = text.match(/PROMPT:\s*(.+?)(?:\n|MATERIALIEN)/s);
        var materialsMatch = text.match(/MATERIALIEN:\s*([\s\S]+)/);
        if (promptMatch) finalPrompt = promptMatch[1].trim();
        if (materialsMatch) materialText = materialsMatch[1].trim();
      }
    } catch(e) {
      console.log("Claude failed:", e.message);
    }
  }

  if (!finalPrompt.startsWith("same room layout")) {
    finalPrompt = "same room layout same perspective, " + finalPrompt;
  }

  try {
    var response = await fetch("https://fal.run/fal-ai/flux/dev/image-to-image", {
      method: "POST",
      headers: {
        "Authorization": "Key " + process.env.FAL_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: finalPrompt,
        image_url: "data:image/jpeg;base64," + imageBase64,
        strength: 0.65,
        num_inference_steps: 35,
        guidance_scale: 3.5,
      }),
    });

    var data = await response.json();
    if (data.images && data.images[0] && data.images[0].url) {
      return res.json({ imageUrl: data.images[0].url, materials: materialText, promptUsed: finalPrompt });
    }
    throw new Error(data.message || data.error || "Kein Bild erhalten");
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
