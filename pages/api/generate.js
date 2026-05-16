export const config = {
  api: { bodyParser: { sizeLimit: "15mb" } },
};

const PROMPTS = {
  "bad-modern": "modern luxury spa bathroom, dark slate tiles, rainfall shower head, matte black fixtures, LED mirror, warm ambient lighting, photorealistic interior design 8k",
  "bad-warm": "bright scandinavian bathroom, white subway tiles, oak wood accents, gold faucets, indoor plants, warm 2700K lighting, photorealistic interior design",
  "kueche-navy": "modern kitchen, dark navy blue cabinets, brass handles, marble countertop, pendant lights, open shelves, photorealistic interior design 8k",
  "kueche-gruen": "modern kitchen, sage green cabinets, wooden open shelves, black handles, plants, bright natural light, scandinavian photorealistic interior",
  "wohn-dunkel": "living room, dark forest green accent wall, oak floor, linen bouclé sofa, brass table lamp, indirect LED cove lighting, photorealistic interior",
  "wohn-terra": "living room, terracotta warm tones, rattan furniture, woven textiles, boho style, natural light, cozy atmosphere, photorealistic interior",
  "schlaf-hell": "minimalist japandi bedroom, light oak wood bed, white walls, linen bedding, morning light, calm serene atmosphere, photorealistic interior",
  "schlaf-dunkel": "moody dark bedroom, charcoal walls, velvet headboard, brass wall sconces, indirect LED lighting, hotel suite feeling, photorealistic interior",
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { stil, imgBase64 } = req.body;
  const prompt = PROMPTS[stil] || PROMPTS["bad-modern"];

  try {
    const falRes = await fetch("https://fal.run/fal-ai/flux/dev/image-to-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Key ${process.env.FAL_KEY}`,
      },
      body: JSON.stringify({
        prompt,
        image_url: imgBase64 || null,
        strength: 0.65,
        num_inference_steps: 28,
        guidance_scale: 3.5,
        num_images: 1,
        enable_safety_checker: true,
      }),
    });

    const data = await falRes.json();
    const imageUrl = data?.images?.[0]?.url || data?.image?.url || null;

    if (!imageUrl) {
      return res.status(500).json({ error: "Kein Bild generiert." });
    }

    res.json({ imageUrl });
  } catch (err) {
    res.status(500).json({ error: "Fehler bei der Bildgenerierung." });
  }
}
