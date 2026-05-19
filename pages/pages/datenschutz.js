import Head from "next/head";
import Link from "next/link";

export default function Datenschutz() {
  return (
    <>
      <Head>
        <title>Datenschutz – Mystorija</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;600&display=swap" rel="stylesheet" />
      </Head>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #F8F5F0; color: #1A1A1A; line-height: 1.7; }
        .container { max-width: 680px; margin: 0 auto; padding: 40px 24px 80px; }
        h1 { font-family: 'Playfair Display', serif; font-size: 32px; margin-bottom: 8px; }
        h2 { font-size: 16px; font-weight: 700; margin: 28px 0 8px; color: #C4622D; }
        p { font-size: 15px; color: #444; margin-bottom: 10px; }
        ul { font-size: 15px; color: #444; margin: 8px 0 12px 20px; }
        li { margin-bottom: 6px; }
        a { color: #C4622D; }
        .back { display: inline-flex; align-items: center; gap: 6px; color: #888; font-size: 14px; text-decoration: none; margin-bottom: 32px; }
        .card { background: white; border-radius: 16px; padding: 32px; border: 1px solid #EDE8DF; }
        .highlight { background: #FFF0E8; border-left: 3px solid #C4622D; padding: 12px 16px; border-radius: 0 8px 8px 0; margin: 16px 0; font-size: 14px; color: #555; }
      `}</style>

      <div className="container">
        <Link href="/landing" className="back">← Zurück</Link>

        <div className="card">
          <h1>Datenschutzerklärung</h1>
          <p style={{ color:"#888", fontSize:14, marginBottom:24 }}>Stand: Mai 2026 · DSGVO-konform</p>

          <div className="highlight">
            Mystorija speichert keine personenbezogenen Daten auf eigenen Servern. Alle Nutzerdaten werden ausschließlich lokal auf deinem Gerät (localStorage) gespeichert.
          </div>

          <h2>1. Verantwortlicher</h2>
          <p>Luka Bandur<br />
          Rijeka, Kroatien<br />
          E-Mail: <a href="mailto:info@mystorija.com">info@mystorija.com</a></p>

          <h2>2. Welche Daten werden verarbeitet?</h2>
          <p><strong>Lokal auf deinem Gerät (localStorage):</strong></p>
          <ul>
            <li>Gespeicherte Makeover-Projekte und Bilder</li>
            <li>Inspo-Analyse Verlauf</li>
            <li>Anleitungs-Fortschritt (Checklisten)</li>
            <li>Planer-Projekte und Einkaufslisten</li>
            <li>Abo-Status (nach Stripe-Zahlung)</li>
            <li>Monatlicher Nutzungszähler (Makeovers/Inspo)</li>
          </ul>
          <p>Diese Daten verlassen dein Gerät nicht und können von uns nicht eingesehen werden.</p>

          <h2>3. Drittanbieter-Dienste</h2>
          <p><strong>Anthropic (Claude KI):</strong><br />
          Beim Generieren von Makeovers und Inspo-Analysen werden die hochgeladenen Bilder an Anthropic übermittelt. Datenschutz: <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer">anthropic.com/privacy</a></p>

          <p><strong>fal.ai (Flux Bildgenerierung):</strong><br />
          Bilder werden zur Verarbeitung an fal.ai übertragen. Datenschutz: <a href="https://fal.ai/privacy" target="_blank" rel="noopener noreferrer">fal.ai/privacy</a></p>

          <p><strong>Stripe (Zahlungsabwicklung):</strong><br />
          Zahlungen werden über Stripe abgewickelt. Wir erhalten keine Kreditkartendaten. Datenschutz: <a href="https://stripe.com/de/privacy" target="_blank" rel="noopener noreferrer">stripe.com/privacy</a></p>

          <p><strong>Vercel (Hosting):</strong><br />
          Die App wird über Vercel gehostet. Datenschutz: <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">vercel.com/legal/privacy-policy</a></p>

          <h2>4. Hochgeladene Bilder</h2>
          <p>Wenn du ein Foto für den Makeover oder die Inspo-Analyse hochlädst, wird dieses Bild zur Verarbeitung an Anthropic und/oder fal.ai übermittelt. Die Bilder werden nicht dauerhaft von uns gespeichert. Bitte lade keine Bilder hoch auf denen erkennbare Personen ohne deren Einwilligung zu sehen sind.</p>

          <h2>5. Affiliate-Links</h2>
          <p>Mystorija enthält Affiliate-Links zu Amazon.de (Partnerprogramm), OBI, Bauhaus und Hornbach. Beim Klick auf diese Links können Cookies des jeweiligen Anbieters gesetzt werden. Als Amazon-Partner verdienen wir an qualifizierten Käufen. Für dich entstehen keine Mehrkosten.</p>

          <h2>6. Cookies</h2>
          <p>Mystorija verwendet keine eigenen Tracking-Cookies. Es werden ausschließlich technisch notwendige Daten im localStorage des Browsers gespeichert.</p>

          <h2>7. Deine Rechte (DSGVO)</h2>
          <ul>
            <li><strong>Auskunft:</strong> Du kannst jederzeit Auskunft über gespeicherte Daten verlangen</li>
            <li><strong>Löschung:</strong> Alle lokalen Daten kannst du selbst löschen (Browser-Einstellungen → Cache/localStorage leeren)</li>
            <li><strong>Widerspruch:</strong> Kontaktiere uns unter info@mystorija.com</li>
          </ul>

          <h2>8. Datensicherheit</h2>
          <p>Die Übertragung der App erfolgt über HTTPS. Hochgeladene Bilder werden verschlüsselt an Drittanbieter übertragen und nicht dauerhaft auf unseren Servern gespeichert.</p>

          <h2>9. Kontakt bei Datenschutzfragen</h2>
          <p>E-Mail: <a href="mailto:info@mystorija.com">info@mystorija.com</a></p>
          <p>Wir beantworten Anfragen innerhalb von 30 Tagen.</p>
        </div>
      </div>
    </>
  );
}
