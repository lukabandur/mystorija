export const config = {
  api: { bodyParser: { sizeLimit: "15mb" } },
};

const BASE_PROMPTS = {
  "bad-modern": "award winning luxury bathroom renovation, frameless walk-in rain shower, large format 120x60cm dark charcoal porcelain tiles, floating teak wood vanity, backlit LED mirror, matte black Grohe faucets, hidden ceiling LED strips warm 2700K, polished concrete floor, chrome shower niche, photorealistic architectural photography, interior design magazine, sharp focus, 8k",
  "bad-warm": "beautiful scandinavian bathroom renovation, white handmade zellige subway tiles, warm natural oak wood vanity and shelves, brushed gold Hansgrohe faucets, hanging rattan pendant light, monstera and eucalyptus plants, warm 2200K candlelight atmosphere, herringbone marble floor, cotton linen towels, photorealistic interior photography, cozy hygge aesthetic, 8k",
  "bad-mikro": "ultra modern microcement bathroom, seamless tadelakt concrete finish on all walls and floor, custom floating walnut vanity, Duravit undermount basin, minimal matte black tapware, hidden indirect LED lighting, large skylight, zen minimalist Japanese aesthetic, no grout lines, photorealistic architectural photography, 8k ultra detail",
  "kueche-navy": "stunning modern kitchen renovation, deep navy blue shaker cabinets, unlacquered brass hardware and faucet, open floating white oak shelves, three black Edison pendant lights over island, calacatta marble waterfall island, exposed brick wall, warm 2700K under cabinet lighting, herringbone oak parquet floor, photorealistic interior design photography, 8k",
  "kueche-grau": "sleek contemporary kitchen, silk grey lacquered flat front cabinets RAL7044, integrated Siemens appliances, matte black Quooker tap, large format white ceramic backsplash, seamless Corian countertop, recessed ceiling spotlights 3000K, light oak engineered wood floor, minimal German design aesthetic, photorealistic photography, 8k",
  "kueche-gruen": "warm inviting kitchen renovation, sage green shaker cabinets, aged brass bin pulls, live edge walnut open shelves, white subway tile backsplash, butcher block countertop, wicker pendant light, fresh herbs on windowsill, terracotta tiles floor, cottagecore farmhouse aesthetic, photorealistic interior photography, 8k",
  "wohn-gruen": "dramatic living room renovation, deep forest green limewash accent wall, wide plank white oak herringbone floor, curved cream boucle sofa, brass arc floor lamp, built-in bookcase with hidden LED strips, large fiddle leaf fig plant, linen curtains floor to ceiling, warm golden hour lighting, photorealistic interior design, 8k",
  "wohn-terra": "earthy boho modern living room, burnt terracotta clay limewash wall, natural jute and wool area rug, curved rattan armchairs, low oak coffee table, clusters of pillar candles, hanging macrame, terracotta ceramic vases, warm 2200K ambient lighting, abundant plants, photorealistic interior photography, 8k",
  "schlaf-terra": "serene master bedroom renovation, warm terracotta venetian plaster accent wall, king size upholstered bouclé headboard, layered linen bedding in oatmeal and sand, aged brass wall sconces, vertical oak wood slat panels, cashmere throw, eucalyptus stems in ceramic vase, soft 2200K warm glow, photorealistic interior photography, 8k",
  "schlaf-dunkel": "moody luxury bedroom, deep midnight navy ceiling, white limewash walls, custom built-in wardrobe with integrated lighting, velvet upholstered platform bed, brass bedside pendants, indirect cove LED lighting 2700K, plush wool rug, cinematic atmospheric photography, high-end hotel aesthetic, 8k",
  "terrasse-wpc": "beautiful modern terrace renovation, premium teak WPC decking, modular outdoor sofa with thick Sunbrella cushions, powder coated steel pergola with climbing jasmine, café Edison string lights, large terracotta planters with olive trees and lavender, outdoor kitchen island, warm summer evening golden light, photorealistic lifestyle photography, 8k",
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

  // Use Claude to enhance prompt with user wishes from chat
  if (chatContext && process.env.ANTHROPIC_API_KEY) {
    try {
      var promptRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-opus-4-6",
          max_tokens: 150,
          messages: [{
            role: "user",
            content: "Take this interior design image prompt and enhance it with these specific user wishes: '" + chatContext + "'. Keep it under 100 words, English only, photorealistic interior photography style. Base prompt: " + basePrompt,
          }],
        }),
      });
      var promptData = await promptRes.json();
      if (promptData.content && promptData.content[0]) {
        finalPrompt = promptData.content[0].text;
      }
    } catch(e) {
      console.log("Prompt enhancement failed:", e.message);
    }
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
        strength: 0.80,
        num_inference_steps: 35,
        guidance_scale: 4.0,
      }),
    });

    var data = await response.json();
    if (data.images && data.images[0] && data.images[0].url) {
      return res.json({ imageUrl: data.images[0].url, promptUsed: finalPrompt });
    }
    throw new Error(data.message || data.error || "Kein Bild erhalten");
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
