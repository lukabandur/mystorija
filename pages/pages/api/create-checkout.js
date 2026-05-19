import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRICE_IDS = {
  basic: "price_1TYmT4DVVPgjSTdOkgRYVmXW",
  pro:   "price_1TYmTTDVVPgjSTdOxYmpwNoc",
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { plan, email } = req.body;
  const priceId = PRICE_IDS[plan];
  if (!priceId) return res.status(400).json({ error: "Ungültiger Plan" });

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card", "sepa_debit"],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email || undefined,
      success_url: `${process.env.APP_URL || "https://mystorija.com"}/app?success=true&plan=${plan}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL || "https://mystorija.com"}/app?canceled=true`,
      locale: "de",
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe error:", err);
    res.status(500).json({ error: err.message });
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { plan, email } = req.body;

  if (!PLANS[plan]) return res.status(400).json({ error: "Unbekannter Plan" });
  if (!process.env.STRIPE_SECRET_KEY) return res.status(500).json({ error: "Stripe nicht konfiguriert" });

  const p = PLANS[plan];
  const appUrl = process.env.APP_URL || "https://renopilot-neon.vercel.app";

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card", "sepa_debit"],
      mode: "subscription",
      customer_email: email || undefined,
      line_items: [{
        price_data: {
          currency: p.currency,
          product_data: {
            name: p.name,
            description: p.description,
            images: [`${appUrl}/icon.png`],
          },
          unit_amount: p.price,
          recurring: { interval: p.interval },
        },
        quantity: 1,
      }],
      success_url: `${appUrl}?subscription=success&plan=${plan}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}?subscription=cancelled`,
      metadata: { plan },
      locale: "de",
      allow_promotion_codes: true,
      billing_address_collection: "auto",
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
