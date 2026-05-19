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

  const appUrl = process.env.APP_URL || "https://mystorija.com";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card", "sepa_debit"],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email || undefined,
      success_url: `${appUrl}/app?success=true&plan=${plan}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/app?canceled=true`,
      locale: "de",
      allow_promotion_codes: true,
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error("Stripe error:", err);
    res.status(500).json({ error: err.message });
  }
}
