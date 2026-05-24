import { useState, useEffect } from "react";
import Head from "next/head";

export default function Landing() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
    if (window.__dip) setInstallPrompt(window.__dip);
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e); window.__dip = e; };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setInstalled(true));
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function triggerInstall() {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === "accepted") { setInstallPrompt(null); setInstalled(true); }
    } else {
      window.location.href = "/app";
    }
  }

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: `window.__dip=null;window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__dip=e;});` }} />
      <Head>
        <title>Mystorija – KI-Renovierung für dein Zuhause</title>
        <meta name="description" content="Foto hochladen – KI generiert deine Traumrenovierung in Sekunden. 97 Ideen, 25 Anleitungen, Materialien sofort kaufen." />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#C4622D" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,600&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          :root {
            --accent: #C4622D; --accent-bg: #FFF0E8; --text: #1A1A1A;
            --muted: #888; --bg: #F8F5F0; --card: #FFFFFF;
            --border: #EDE8DF; --green: #3A7A56; --green-bg: #EDF5F1;
          }
          html { scroll-behavior: smooth; }
          body { font-family: 'DM Sans', sans-serif; background: var(--bg); color: var(--text); line-height: 1.6; }
          nav { position: sticky; top: 0; z-index: 100; background: rgba(248,245,240,0.92); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border); padding: 14px 24px; display: flex; align-items: center; justify-content: space-between; }
          .logo { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 700; text-decoration: none; color: var(--text); }
          .logo span { color: var(--accent); }
          .btn-primary { background: var(--accent); color: white; padding: 12px 24px; border-radius: 50px; text-decoration: none; font-size: 14px; font-weight: 600; }
          .btn-secondary { background: var(--card); color: var(--text); padding: 12px 24px; border-radius: 50px; text-decoration: none; font-size: 14px; font-weight: 600; border: 1.5px solid var(--border); }
          .section-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: var(--accent); margin-bottom: 10px; }
          @media (max-width: 600px) { .hide-mobile { display: none !important; } }
        `}</style>
      </Head>

      {/* NAV */}
      <nav>
        <a className="logo" href="/landing">My<span>storija</span></a>
        <div style={{ display:"flex", gap:12, alignItems:"center" }}>
          <a href="/en" style={{ fontSize:12, fontWeight:700, color:"var(--muted)", textDecoration:"none", padding:"7px 12px", borderRadius:20, border:"1.5px solid var(--border)", background:"var(--card)" }}>🇬🇧 English</a>
          <a className="btn-secondary hide-mobile" href="/app" style={{ fontSize:13, padding:"8px 18px" }}>App öffnen</a>
          <a className="btn-primary" href="/app" style={{ fontSize:13, padding:"8px 18px" }}>Kostenlos starten ✨</a>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding:"80px 24px 60px", textAlign:"center", maxWidth:700, margin:"0 auto" }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"var(--accent-bg)", color:"var(--accent)", border:"1px solid #f0c9b0", borderRadius:50, padding:"6px 14px", fontSize:13, fontWeight:600, marginBottom:28 }}>
          🤖 KI-gestützt · Sofort kostenlos starten
        </div>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(36px, 7vw, 58px)", fontWeight:700, lineHeight:1.15, marginBottom:20 }}>
          Dein Zuhause,<br /><em style={{ fontStyle:"italic", color:"var(--accent)" }}>neu gedacht</em> mit KI
        </h1>
        <p style={{ fontSize:18, color:"var(--muted)", maxWidth:520, margin:"0 auto 36px", lineHeight:1.7 }}>
          Foto hochladen – KI generiert deine Traumrenovierung in Sekunden. Materialien erkennen, Anleitungen folgen, loslegen.
        </p>
        <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
          <a className="btn-primary" href="/app" style={{ fontSize:15, padding:"14px 28px" }}>✨ Jetzt kostenlos testen</a>
          <button onClick={triggerInstall} style={{ display:"inline-flex", alignItems:"center", gap:8, background:"var(--card)", color:"var(--text)", padding:"14px 28px", borderRadius:50, fontSize:15, fontWeight:600, border:"1.5px solid var(--border)", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
            📲 {installed ? "Installiert ✓" : "App installieren"}
          </button>
        </div>
      </section>

      {/* APP PREVIEW */}
      <div style={{ maxWidth:560, margin:"0 auto 0", padding:"0 20px" }}>
        <div style={{ background:"var(--card)", border:"1.5px solid var(--border)", borderRadius:24, overflow:"hidden", boxShadow:"0 20px 60px rgba(0,0,0,0.08)" }}>
          <div style={{ background:"var(--card)", padding:"12px 18px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700 }}>My<span style={{ color:"var(--accent)" }}>storija</span></span>
            <span style={{ fontSize:12, color:"#888", fontWeight:600 }}>KI-Renovierung</span>
          </div>
          <div style={{ padding:20, background:"var(--bg)" }}>
            <div style={{ border:"2px dashed var(--border)", borderRadius:16, padding:28, textAlign:"center", background:"var(--card)", marginBottom:14 }}>
              <div style={{ fontSize:40 }}>📸</div>
              <p style={{ fontWeight:700, marginTop:8 }}>Foto hochladen</p>
              <p style={{ fontSize:13, color:"var(--muted)", marginTop:4 }}>Bad, Küche, Wohnzimmer, Terrasse...</p>
            </div>
            <div style={{ background:"white", border:"1.5px solid var(--border)", borderRadius:12, padding:"11px 13px", fontSize:13, color:"#888", marginBottom:12 }}>
              z.B. Dunkle Fliesen, Walk-In Dusche, mattschwarz Armaturen...
            </div>
            <div style={{ background:"linear-gradient(135deg, #C4622D, #A0522D)", color:"white", padding:14, borderRadius:50, textAlign:"center", fontWeight:700, fontSize:14 }}>
              ✨ Makeover generieren
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", borderTop:"1px solid var(--border)" }}>
            {[["✨","Makeover",true],["💬","Chat",false],["🔍","Inspo",false],["💡","Ideen",false],["📋","Anleit.",false],["📅","Planer",false],["🔨","Profis",false]].map(([icon,label,active]) => (
              <div key={label} style={{ padding:"9px 2px 8px", textAlign:"center", borderTop:active?"2.5px solid var(--accent)":"2.5px solid transparent", marginTop:-1 }}>
                <div style={{ fontSize:16 }}>{icon}</div>
                <div style={{ fontSize:9, fontWeight:600, color:active?"var(--accent)":"var(--muted)" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* INSTALL STRIP */}
      <div style={{ maxWidth:560, margin:"16px auto 0", padding:"0 20px" }}>
        <div style={{ background:"var(--accent-bg)", border:"1px solid #f0c9b0", borderRadius:14, padding:"12px 18px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:22 }}>📲</span>
            <div>
              <p style={{ fontSize:13, fontWeight:700, color:"var(--text)" }}>Als App installieren – kein App Store nötig</p>
              <p style={{ fontSize:12, color:"var(--muted)" }}>iPhone: Teilen ⬆ → „Zum Home-Bildschirm" · Android: oben „App installieren" tippen</p>
            </div>
          </div>
          <button onClick={triggerInstall} style={{ flexShrink:0, background:"var(--accent)", color:"white", padding:"9px 18px", borderRadius:50, fontSize:13, fontWeight:700, border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", whiteSpace:"nowrap" }}>
            {installed ? "✓ Installiert" : "Installieren →"}
          </button>
        </div>
      </div>

      {/* MARKETING IMAGES */}
      <div style={{ maxWidth:900, margin:"40px auto 0", padding:"0 20px", display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:20 }}>
        <img src="/images/0B12A956-7611-4853-BA4A-BB27E7EE98C0%20(2).png" alt="Mystorija – KI Ideen und Anleitungen" style={{ width:"100%", borderRadius:20, boxShadow:"0 8px 40px rgba(0,0,0,0.12)", display:"block" }} loading="lazy" />
        <img src="/images/BCC60902-D627-4932-94B8-1B7A5004FD64.png" alt="Mystorija – Vorher Nachher KI Makeover" style={{ width:"100%", borderRadius:20, boxShadow:"0 8px 40px rgba(0,0,0,0.12)", display:"block" }} loading="lazy" />
      </div>

      {/* STATS */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:1, background:"var(--border)", borderTop:"1px solid var(--border)", borderBottom:"1px solid var(--border)", margin:"60px 0" }}>
        {[["100","Ideen & Trends"],["50","DIY-Anleitungen"],["20s","bis zum Makeover"]].map(([num,label]) => (
          <div key={label} style={{ background:"var(--card)", padding:"28px 20px", textAlign:"center" }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:36, fontWeight:700, color:"var(--accent)" }}>{num}</div>
            <div style={{ fontSize:13, color:"var(--muted)", marginTop:4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* PAIN POINTS */}
      <section style={{ padding:"0 24px 70px", maxWidth:900, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <div className="section-label" style={{ textAlign:"center" }}>Für jeden der renovieren möchte</div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(26px,5vw,38px)", lineHeight:1.25 }}>
            Inspiration ist überall –<br /><em style={{ color:"var(--accent)" }}>Mystorija hilft dir umzusetzen</em>
          </h2>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:16, marginBottom:50 }}>
          {[
            ["🛋️","Endlich ein Bild im Kopf","Du weißt dass du etwas verändern möchtest – aber wie soll es genau aussehen? Lade einfach ein Foto hoch und sieh dein Zuhause neu."],
            ["🔍","Was steckt hinter diesem Look?","Ein schönes Foto gefunden – aber welche Fliesen sind das, welcher Holzton, was kostet das ungefähr? Mystorija erkennt und erklärt es dir."],
            ["🔨","Selbst machen oder Profi?","Renovieren muss nicht kompliziert sein. 25 klare Anleitungen zeigen dir Schritt für Schritt was du selbst umsetzen kannst."],
          ].map(([icon,title,desc]) => (
            <div key={title} style={{ background:"var(--card)", border:"1.5px solid var(--border)", borderRadius:18, padding:24 }}>
              <div style={{ fontSize:28, marginBottom:12 }}>{icon}</div>
              <p style={{ fontSize:15, fontWeight:700, marginBottom:8 }}>{title}</p>
              <p style={{ fontSize:14, color:"var(--muted)", lineHeight:1.6 }}>{desc}</p>
            </div>
          ))}
        </div>

        {/* INSPO HOOK */}
        <div style={{ background:"linear-gradient(135deg, #1A1A1A 0%, #2A1A0E 100%)", borderRadius:24, padding:"40px 32px", display:"flex", gap:32, alignItems:"center", flexWrap:"wrap" }}>
          <div style={{ flex:1, minWidth:220 }}>
            <div className="section-label">🔍 Inspo-Analyse</div>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, color:"white", lineHeight:1.3, margin:"10px 0 14px" }}>Siehst du ein Bild<br />das du liebst?</h3>
            <p style={{ fontSize:15, color:"#aaa", lineHeight:1.7, marginBottom:20 }}>Egal ob Pinterest, Instagram oder Magazin – lade es hoch. Die KI sagt dir sofort alles was du wissen musst:</p>
            {["Welche Materialien verwendet wurden","Genaue Farbtöne und Farbpalette","Ungefähre Kosten pro Material","Wie du es selbst nachmachen kannst","Direktlinks zu Amazon, OBI, Bauhaus & Hornbach"].map(t => (
              <div key={t} style={{ color:"#ddd", fontSize:14, display:"flex", gap:10, alignItems:"flex-start", marginBottom:8 }}>
                <span style={{ color:"var(--accent)", fontWeight:700, flexShrink:0 }}>✓</span> {t}
              </div>
            ))}
            <a href="/app" style={{ display:"inline-flex", alignItems:"center", gap:8, background:"var(--accent)", color:"white", padding:"12px 24px", borderRadius:50, fontSize:14, fontWeight:700, textDecoration:"none", marginTop:20 }}>
              🔍 Foto analysieren →
            </a>
          </div>
          <div style={{ flexShrink:0 }}>
            <div style={{ background:"#2A2A2A", borderRadius:20, padding:20, width:220 }}>
              <div style={{ background:"#333", borderRadius:12, height:110, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:14, fontSize:36 }}>📸</div>
              <div style={{ background:"var(--accent)", borderRadius:8, padding:"10px 12px", marginBottom:8 }}>
                <p style={{ fontSize:11, fontWeight:700, color:"white", marginBottom:3 }}>Japandi Bad erkannt</p>
                <p style={{ fontSize:10, color:"#f0c9b0" }}>Mikrozement · Teak Holz · Matte Black</p>
              </div>
              <div style={{ display:"flex", gap:6 }}>
                {["#4A4A4A","#5A4A3A","#3A3A3A","#6A5A4A"].map(c => (
                  <div key={c} style={{ flex:1, height:16, background:c, borderRadius:4 }} />
                ))}
              </div>
              <p style={{ fontSize:10, color:"#888", marginTop:6 }}>Farbpalette erkannt</p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding:"70px 24px", maxWidth:900, margin:"0 auto" }} id="features">
        <div className="section-label">Was Mystorija kann</div>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(28px,5vw,40px)", fontWeight:700, lineHeight:1.25, marginBottom:14 }}>Alles was du für deine Renovierung brauchst</h2>
        <p style={{ fontSize:17, color:"var(--muted)", maxWidth:560, lineHeight:1.7, marginBottom:48 }}>Von der Inspiration bis zur fertigen Anleitung – Mystorija begleitet dich durch jeden Schritt.</p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:20 }}>
          {[
            ["✨","KI-Makeover","Foto hochladen, Wünsche beschreiben – die KI zeigt dir deinen Raum renoviert. In Sekunden, nicht Monaten."],
            ["🔍","Inspo analysieren","Pinterest-Screenshot hochladen – KI erkennt sofort alle Materialien, Farben und zeigt wie du es nachmachst."],
            ["💡","100 Ideen & Trends","Bad, Küche, Wohnzimmer, Terrasse und mehr. Aktuelle Trends 2026 mit Kosten und direkten Shop-Links."],
            ["📋","25 Anleitungen","Von Wände streichen bis Dusche bauen. Mit Werkzeug-Liste, Profi-Tipps und Video-Links."],
            ["💬","KI-Berater","Frag alles rund ums Renovieren: Kosten, Materialien, Genehmigungen. Wie ein erfahrener Freund."],
            ["🛒","Materialien kaufen","KI erkennt verwendete Materialien und verlinkt direkt zu Amazon, OBI, Bauhaus & Hornbach."],
          ].map(([icon,title,desc]) => (
            <div key={title} style={{ background:"var(--card)", border:"1.5px solid var(--border)", borderRadius:18, padding:24 }}>
              <div style={{ fontSize:32, marginBottom:14 }}>{icon}</div>
              <h3 style={{ fontSize:16, fontWeight:700, marginBottom:8 }}>{title}</h3>
              <p style={{ fontSize:14, color:"var(--muted)", lineHeight:1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ background:"var(--card)", padding:"70px 24px" }}>
        <div style={{ maxWidth:900, margin:"0 auto" }}>
          <div className="section-label">So einfach geht's</div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(28px,5vw,40px)", fontWeight:700, lineHeight:1.25, marginBottom:14 }}>In 3 Schritten zur Traumrenovierung</h2>
          <p style={{ fontSize:17, color:"var(--muted)", maxWidth:560, lineHeight:1.7, marginBottom:48 }}>Kein Architekturstudium, kein 3D-Programm. Einfach Foto hochladen und loslegen.</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:0 }}>
            {[
              ["1","Foto hochladen","Mach ein Foto von deinem Raum – egal wie er gerade aussieht."],
              ["2","Wünsche beschreiben","\"Dunkle Fliesen, keine Badewanne, Walk-In Dusche, mattschwarz Armaturen\""],
              ["3","KI generiert dein Makeover","In ~20 Sekunden siehst du deinen renovierten Raum – mit Materialien und Einkaufsliste."],
            ].map(([num,title,desc], i) => (
              <div key={num} style={{ textAlign:"center", padding:"28px 20px", position:"relative" }}>
                <div style={{ width:44, height:44, borderRadius:"50%", background:"var(--accent)", color:"white", fontSize:18, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", fontFamily:"'Playfair Display',serif" }}>{num}</div>
                <h3 style={{ fontSize:15, fontWeight:700, marginBottom:8 }}>{title}</h3>
                <p style={{ fontSize:13, color:"var(--muted)", lineHeight:1.6 }}>{desc}</p>
                {i < 2 && <div style={{ position:"absolute", right:-12, top:38, fontSize:20, color:"var(--border)", zIndex:1 }}>→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section style={{ padding:"70px 24px", maxWidth:900, margin:"0 auto" }} id="preise">
        <div className="section-label">Preise</div>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(28px,5vw,40px)", fontWeight:700, lineHeight:1.25, marginBottom:14 }}>Transparent. Fair. Keine Überraschungen.</h2>
        <p style={{ fontSize:17, color:"var(--muted)", maxWidth:560, lineHeight:1.7, marginBottom:24 }}>Starte kostenlos und upgrade wenn du mehr willst.</p>
        <div style={{ background:"var(--accent-bg)", border:"1.5px solid #f0c9b0", borderRadius:16, padding:"18px 24px", marginBottom:36, display:"flex", gap:16, alignItems:"center", flexWrap:"wrap" }}>
          <div style={{ fontSize:24 }}>⏱️</div>
          <div style={{ flex:1 }}>
            <p style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>In 20 Sekunden siehst du dein Ergebnis</p>
            <p style={{ fontSize:13, color:"var(--muted)" }}>Kein Account nötig. Kein Download. Einfach Foto hochladen und loslegen – jetzt kostenlos.</p>
          </div>
          <a href="/app" style={{ flexShrink:0, background:"var(--accent)", color:"white", padding:"10px 20px", borderRadius:50, fontSize:13, fontWeight:700, textDecoration:"none", whiteSpace:"nowrap" }}>Jetzt starten →</a>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:20 }}>
          {[
            { name:"Basic", price:"9,99", featured:false, desc:"Ideal für den Start – alle Kern-Features.", features:["Unbegrenzte Makeovers","KI-Inspo-Analyse","100 Ideen & Trends","25 Anleitungen","KI-Chat Berater","Planer & Einkaufsliste"] },
            { name:"Pro ⭐", price:"19,99", featured:true, desc:"Für ernsthafte Renovierer – unbegrenzt generieren.", features:["Unbegrenzte Makeovers","Alles aus Basic","Priorität bei der Generierung","Früher Zugang zu neuen Features"] },
          ].map(p => (
            <div key={p.name} style={{ background:"var(--card)", border:`1.5px solid ${p.featured?"var(--accent)":"var(--border)"}`, borderRadius:20, padding:28, position:"relative" }}>
              {p.featured && <div style={{ position:"absolute", top:-12, left:"50%", transform:"translateX(-50%)", background:"var(--accent)", color:"white", fontSize:11, fontWeight:700, padding:"4px 14px", borderRadius:50, whiteSpace:"nowrap" }}>⭐ Empfohlen</div>}
              <div style={{ fontSize:13, fontWeight:700, textTransform:"uppercase", letterSpacing:1, color:"var(--muted)", marginBottom:8 }}>{p.name}</div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:42, fontWeight:700, lineHeight:1, marginBottom:4 }}>
                <sup style={{ fontSize:20, verticalAlign:"super" }}>€</sup>{p.price}<sub style={{ fontSize:16, color:"var(--muted)", fontFamily:"'DM Sans',sans-serif", fontWeight:400 }}>/Monat</sub>
              </div>
              <p style={{ fontSize:13, color:"var(--muted)", marginBottom:20, paddingBottom:20, borderBottom:"1px solid var(--border)" }}>{p.desc}</p>
              <ul style={{ listStyle:"none", display:"flex", flexDirection:"column", gap:10, marginBottom:24 }}>
                {p.features.map(f => <li key={f} style={{ fontSize:14, display:"flex", alignItems:"flex-start", gap:8 }}><span style={{ color:"var(--green)", fontWeight:700, flexShrink:0 }}>✓</span>{f}</li>)}
              </ul>
              <a href="/app" style={{ display:"block", width:"100%", textAlign:"center", padding:13, borderRadius:50, fontSize:14, fontWeight:700, textDecoration:"none", background:p.featured?"var(--accent)":"transparent", color:p.featured?"white":"var(--text)", border:p.featured?"none":"1.5px solid var(--border)" }}>
                {p.featured ? "Pro werden ✨" : "Jetzt starten"}
              </a>
            </div>
          ))}
        </div>
      </section>


      {/* HANDWERKER B2B */}
      <section style={{ padding:"70px 24px", background:"var(--bg)" }}>
        <div style={{ maxWidth:860, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:48 }}>
            <div style={{ fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:"1.5px", color:"var(--accent)", marginBottom:10 }}>Für Handwerker & Betriebe</div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(26px,5vw,38px)", lineHeight:1.25, marginBottom:14 }}>
              Dein Betrieb –<br /><em style={{ color:"var(--accent)" }}>direkt bei renovierungswilligen Kunden</em>
            </h2>
            <p style={{ fontSize:16, color:"var(--muted)", maxWidth:540, margin:"0 auto", lineHeight:1.7 }}>
              Mystorija-Nutzer sind aktiv am Renovieren. Kein besserer Moment um deinen Betrieb zu präsentieren.
            </p>
          </div>

          {/* Single pricing card centered */}
          <div style={{ maxWidth:460, margin:"0 auto 40px", background:"var(--card)", border:"2px solid var(--accent)", borderRadius:24, padding:36, position:"relative" }}>
            <div style={{ position:"absolute", top:-14, left:"50%", transform:"translateX(-50%)", background:"var(--accent)", color:"white", fontSize:12, fontWeight:700, padding:"5px 18px", borderRadius:50, whiteSpace:"nowrap" }}>
              🔨 Handwerker Plan
            </div>
            <div style={{ textAlign:"center", marginBottom:24 }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:52, fontWeight:700, lineHeight:1, color:"var(--text)" }}>
                <sup style={{ fontSize:22, verticalAlign:"super" }}>€</sup>49<sub style={{ fontSize:18, color:"var(--muted)", fontFamily:"'DM Sans',sans-serif", fontWeight:400 }}>,99/Monat</sub>
              </div>
              <p style={{ fontSize:14, color:"var(--muted)", marginTop:6 }}>Monatlich kündbar · Keine Einrichtungsgebühr</p>
            </div>

            <div style={{ borderTop:"1px solid var(--border)", borderBottom:"1px solid var(--border)", padding:"20px 0", marginBottom:24 }}>
              {[
                ["🏢", "Betriebsprofil", "Mit Fotos, Leistungen, Kontaktdaten und Bewertungen"],
                ["📣", "Werbeanzeige", "Dein Banner erscheint in Ideen, Trends und Anleitungen – genau wenn Nutzer nach Handwerkern suchen"],
                ["📩", "Direktanfragen", "Kunden kontaktieren dich direkt aus der App"],
                ["✅", "Verifizierter Profi", "Badge für mehr Vertrauen bei Neukunden"],
                ["📍", "Regionale Sichtbarkeit", "Wirst in deiner Region angezeigt"],
                ["⭐", "Bewertungssystem", "Sammle echte Kundenbewertungen"],
              ].map(([icon, title, desc]) => (
                <div key={title} style={{ display:"flex", gap:12, alignItems:"flex-start", padding:"10px 0", borderBottom:"1px solid var(--border)" }}>
                  <span style={{ fontSize:18, flexShrink:0 }}>{icon}</span>
                  <div>
                    <p style={{ fontSize:14, fontWeight:700, marginBottom:2 }}>{title}</p>
                    <p style={{ fontSize:13, color:"var(--muted)", lineHeight:1.5 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <a href="mailto:info@mystorija.com" style={{ display:"block", width:"100%", textAlign:"center", padding:"14px", borderRadius:50, fontSize:15, fontWeight:700, textDecoration:"none", background:"var(--accent)", color:"white" }}>
              Jetzt bewerben →
            </a>
            <p style={{ textAlign:"center", fontSize:12, color:"var(--muted)", marginTop:10 }}>
              Schreib uns: <strong>info@mystorija.com</strong>
            </p>
          </div>

          {/* Why now */}
          <div style={{ background:"var(--card)", border:"1.5px solid var(--border)", borderRadius:18, padding:"22px 28px", display:"flex", gap:16, alignItems:"center", flexWrap:"wrap" }}>
            <div style={{ fontSize:32 }}>📊</div>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>Jetzt einsteigen – Early-Preis sichern</p>
              <p style={{ fontSize:13, color:"var(--muted)", lineHeight:1.6 }}>Wer jetzt einsteigt sichert sich bevorzugte Platzierung und den günstigsten Einstiegspreis. Warteliste ist offen.</p>
            </div>
            <a href="mailto:info@mystorija.com" style={{ flexShrink:0, background:"var(--accent)", color:"white", padding:"11px 20px", borderRadius:50, fontSize:13, fontWeight:700, textDecoration:"none" }}>Kontakt →</a>
          </div>
        </div>
      </section>



      {/* COMMUNITY */}
      <section style={{ background:"#1A1A1A", padding:"70px 24px" }}>
        <div style={{ maxWidth:900, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:50 }}>
            <div style={{ fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:"1.5px", color:"var(--accent)", marginBottom:10 }}>Community</div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(26px,5vw,38px)", color:"white", lineHeight:1.25, marginBottom:14 }}>
              Hier entsteht eine Community<br /><em style={{ color:"var(--accent)" }}>rund ums Renovieren</em>
            </h2>
            <p style={{ fontSize:16, color:"#aaa", maxWidth:560, margin:"0 auto", lineHeight:1.7 }}>
              Mystorija verbindet Menschen die renovieren möchten mit Handwerkern die helfen können. Zeige deine Projekte, hol dir Inspiration und finde den richtigen Profi.
            </p>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:20, marginBottom:50 }}>
            {[
              ["🏠", "Für Hausbesitzer", "Teile deine Renovierungsprojekte, zeige Vorher/Nachher Ergebnisse und lass dich von anderen Projekten inspirieren."],
              ["🔨", "Für Handwerker", "Präsentiere deine Arbeit direkt an renovierungswillige Kunden. Kein Streuen – nur Menschen die wirklich renovieren möchten."],
              ["💡", "Für Ideen-Sucher", "Sieh was andere aus ähnlichen Räumen gemacht haben. Echte Projekte, echte Ergebnisse – keine Stock-Fotos."],
            ].map(([icon, title, desc]) => (
              <div key={title} style={{ background:"#2A2A2A", borderRadius:18, padding:24, border:"1px solid #333" }}>
                <div style={{ fontSize:32, marginBottom:14 }}>{icon}</div>
                <p style={{ fontSize:15, fontWeight:700, color:"white", marginBottom:8 }}>{title}</p>
                <p style={{ fontSize:14, color:"#888", lineHeight:1.6 }}>{desc}</p>
              </div>
            ))}
          </div>

          {/* Handwerker CTA */}
          <div style={{ background:"linear-gradient(135deg, #2A1A0E, #3A2010)", border:"1px solid #C4622D44", borderRadius:20, padding:"32px", display:"flex", gap:24, alignItems:"center", flexWrap:"wrap" }}>
            <div style={{ flex:1, minWidth:220 }}>
              <p style={{ fontSize:13, fontWeight:700, textTransform:"uppercase", letterSpacing:"1px", color:"var(--accent)", marginBottom:8 }}>🔨 Für Handwerker & Betriebe</p>
              <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:"white", lineHeight:1.3, marginBottom:12 }}>Werde Teil der Mystorija Community</h3>
              <p style={{ fontSize:14, color:"#aaa", lineHeight:1.6, marginBottom:20 }}>Präsentiere deinen Betrieb direkt an Menschen die gerade renovieren – die aktivste Zielgruppe überhaupt. Eintrag ab <strong style={{ color:"var(--accent)" }}>49,99€/Monat</strong>.</p>
              <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
                {["✓ Profil mit Fotos & Bewertungen","✓ Direkte Anfragen","✓ Nur verifizierte Betriebe"].map(t => (
                  <span key={t} style={{ fontSize:13, color:"#ccc" }}>{t}</span>
                ))}
              </div>
            </div>
            <div style={{ flexShrink:0, textAlign:"center" }}>
              <p style={{ fontSize:13, color:"#888", marginBottom:10 }}>Jetzt vormerken lassen</p>
              <a href="mailto:info@mystorija.com" style={{ display:"inline-block", background:"var(--accent)", color:"white", padding:"12px 24px", borderRadius:50, fontSize:14, fontWeight:700, textDecoration:"none" }}>
                Kontakt aufnehmen →
              </a>
              <p style={{ fontSize:11, color:"#666", marginTop:8 }}>Aktuell: Warteliste offen</p>
            </div>
          </div>
        </div>
      </section>
      <section style={{ background:"var(--accent)", padding:"60px 24px", textAlign:"center" }}>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:32, color:"white", marginBottom:12 }}>App auf deinen Homescreen</h2>
        <p style={{ fontSize:16, color:"rgba(255,255,255,0.85)", maxWidth:480, margin:"0 auto 28px", lineHeight:1.7 }}>Mystorija funktioniert wie eine native App – installierbar auf iPhone und Android. Kein App Store nötig.</p>
        <a href="/app" style={{ display:"inline-flex", alignItems:"center", gap:8, background:"white", color:"var(--accent)", padding:"14px 28px", borderRadius:50, fontSize:15, fontWeight:700, textDecoration:"none" }}>
          📲 App öffnen & installieren
        </a>
      </section>

      {/* FOOTER */}
      <footer style={{ background:"#1A1A1A", padding:"40px 24px", textAlign:"center" }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, color:"white", marginBottom:8 }}>My<span style={{ color:"var(--accent)" }}>storija</span></div>
        <p style={{ fontSize:13, color:"#888", marginBottom:4 }}>KI-gestützte Renovierungs-App · 2026</p>
        <div style={{ marginTop:16, display:"flex", gap:0, justifyContent:"center" }}>
          {[["Impressum","/impressum"],["Datenschutz","/datenschutz"],["App öffnen","/"]].map(([label,href]) => (
            <a key={label} href={href} style={{ color:"#888", textDecoration:"none", margin:"0 12px", fontSize:13 }}>{label}</a>
          ))}
        </div>
      </footer>
    </>
  );
}
