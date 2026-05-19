import Head from "next/head";
import Link from "next/link";

export default function Impressum() {
  return (
    <>
      <Head>
        <title>Impressum – Mystorija</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;600&display=swap" rel="stylesheet" />
      </Head>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #F8F5F0; color: #1A1A1A; line-height: 1.7; }
        .container { max-width: 680px; margin: 0 auto; padding: 40px 24px 80px; }
        h1 { font-family: 'Playfair Display', serif; font-size: 32px; margin-bottom: 8px; }
        h2 { font-size: 16px; font-weight: 700; margin: 28px 0 8px; color: #C4622D; }
        p { font-size: 15px; color: #444; margin-bottom: 8px; }
        a { color: #C4622D; }
        .back { display: inline-flex; align-items: center; gap: 6px; color: #888; font-size: 14px; text-decoration: none; margin-bottom: 32px; }
        .card { background: white; border-radius: 16px; padding: 32px; border: 1px solid #EDE8DF; }
      `}</style>

      <div className="container">
        <Link href="/landing" className="back">← Zurück</Link>

        <div className="card">
          <h1>Impressum</h1>
          <p style={{ color:"#888", fontSize:14, marginBottom:24 }}>Angaben gemäß § 5 TMG</p>

          <h2>Betreiber</h2>
          <p>Luka Bandur<br />
          [Adresse folgt]<br />
          Rijeka, Kroatien</p>

          <h2>Kontakt</h2>
          <p>E-Mail: <a href="mailto:info@mystorija.com">info@mystorija.com</a></p>

          <h2>Plattform</h2>
          <p>Mystorija ist eine webbasierte SaaS-Applikation erreichbar unter mystorija.com und mystorija.com.</p>

          <h2>Hinweis zur EU-Streitschlichtung</h2>
          <p>Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:<br />
          <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">https://ec.europa.eu/consumers/odr</a></p>
          <p>Unsere E-Mail-Adresse finden Sie oben im Impressum. Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>

          <h2>Haftung für Inhalte</h2>
          <p>Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Die durch die KI generierten Bilder und Empfehlungen dienen ausschließlich der Inspiration und stellen keine professionelle Bau- oder Renovierungsberatung dar.</p>

          <h2>Affiliate-Links</h2>
          <p>Diese App enthält Affiliate-Links zu Amazon.de und anderen Partnerprogrammen. Als Amazon-Partner verdienen wir an qualifizierten Käufen. Für dich entstehen dabei keine Mehrkosten.</p>

          <h2>KI-generierte Inhalte</h2>
          <p>Die Makeover-Visualisierungen werden durch KI-Modelle (Anthropic Claude, Flux) generiert und dienen ausschließlich der Inspiration. Sie stellen keine Baugenehmigung, Fachplanung oder rechtsverbindliche Beratung dar.</p>
        </div>
      </div>
    </>
  );
}
