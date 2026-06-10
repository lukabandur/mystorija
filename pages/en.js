import React, { useState, useEffect, useRef } from "react";
import Head from "next/head";

export default function LandingEN() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [sliderPos, setSliderPos] = useState(50);
  const sliderRef = useRef(null);
  const isDragging = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("visible"); }),
      { threshold: 0.12 }
    );
    document.querySelectorAll(".reveal").forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  function handleSliderMove(clientX) {
    if (!isDragging.current || !sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const pct = Math.min(Math.max(((clientX - rect.left) / rect.width) * 100, 5), 95);
    setSliderPos(pct);
  }

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
      window.location.href = "/en/app";
    }
  }

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: `window.__dip=null;window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__dip=e;});` }} />
      <Head>
        <title>Mystorija – AI Home Renovation</title>
        <meta name="description" content="Upload a photo – AI generates your dream renovation in seconds. 97 ideas, 25 guides, materials to buy instantly." />
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
          .reveal { opacity: 0; transform: translateY(36px); transition: opacity 0.75s ease, transform 0.75s ease; }
          .reveal.from-left { transform: translateX(-48px); }
          .reveal.from-right { transform: translateX(48px); }
          .reveal.visible { opacity: 1 !important; transform: none !important; }
        `}</style>
      </Head>

      {/* NAV */}
      <nav>
        <a className="logo" href="/landing">My<span>storija</span></a>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <a href="/" style={{ fontSize:12, fontWeight:700, color:"var(--muted)", textDecoration:"none", padding:"7px 12px", borderRadius:20, border:"1.5px solid var(--border)", background:"var(--bg)" }}>🇩🇪 Deutsch</a>
          <a className="btn-secondary hide-mobile" href="/en/app" style={{ fontSize:13, padding:"8px 18px" }}>Open app</a>
          <a className="btn-primary" href="/en/app" style={{ fontSize:13, padding:"8px 18px" }}>Start free ✨</a>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding:"80px 24px 60px", textAlign:"center", maxWidth:700, margin:"0 auto" }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"var(--accent-bg)", color:"var(--accent)", border:"1px solid #f0c9b0", borderRadius:50, padding:"6px 14px", fontSize:13, fontWeight:600, marginBottom:28 }}>
          🤖 AI-powered · Start free instantly
        </div>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(36px, 7vw, 58px)", fontWeight:700, lineHeight:1.15, marginBottom:20 }}>
          Your Home,<br /><em style={{ fontStyle:"italic", color:"var(--accent)" }}>reimagined</em> with AI
        </h1>
        <p style={{ fontSize:18, color:"var(--muted)", maxWidth:520, margin:"0 auto 36px", lineHeight:1.7 }}>
          Upload a photo – AI generates your dream renovation in seconds. Identify materials, follow guides, get started.
        </p>
        <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
          <a className="btn-primary" href="/en/app" style={{ fontSize:15, padding:"14px 28px" }}>✨ Start for free</a>
          <button onClick={triggerInstall} style={{ display:"inline-flex", alignItems:"center", gap:8, background:"var(--card)", color:"var(--text)", padding:"14px 28px", borderRadius:50, fontSize:15, fontWeight:600, border:"1.5px solid var(--border)", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
            📲 {installed ? "Installed ✓" : "Install app"}
          </button>
        </div>
      </section>

      {/* APP PREVIEW */}
      <div style={{ maxWidth:560, margin:"0 auto 0", padding:"0 20px" }}>
        <div style={{ background:"var(--card)", border:"1.5px solid var(--border)", borderRadius:24, overflow:"hidden", boxShadow:"0 20px 60px rgba(0,0,0,0.08)" }}>
          <div style={{ background:"var(--card)", padding:"12px 18px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700 }}>My<span style={{ color:"var(--accent)" }}>storija</span></span>
            <span style={{ fontSize:12, color:"#888", fontWeight:600 }}>AI renovation</span>
          </div>
          <div style={{ padding:20, background:"var(--bg)" }}>
            <div style={{ border:"2px dashed var(--border)", borderRadius:16, padding:28, textAlign:"center", background:"var(--card)", marginBottom:14 }}>
              <div style={{ fontSize:40 }}>📸</div>
              <p style={{ fontWeight:700, marginTop:8 }}>Upload photo</p>
              <p style={{ fontSize:13, color:"var(--muted)", marginTop:4 }}>Bathroom, Kitchen, Living room, Terrace...</p>
            </div>
            <div style={{ background:"white", border:"1.5px solid var(--border)", borderRadius:12, padding:"11px 13px", fontSize:13, color:"#888", marginBottom:12 }}>
              e.g. Dark tiles, walk-in shower, matte black fixtures...
            </div>
            <div style={{ background:"linear-gradient(135deg, #C4622D, #A0522D)", color:"white", padding:14, borderRadius:50, textAlign:"center", fontWeight:700, fontSize:14 }}>
              ✨ Generate Makeover
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", borderTop:"1px solid var(--border)" }}>
            {[["✨","Makeover",true],["💬","Chat",false],["🔍","Inspo",false],["💡","Ideas",false],["📋","Guides",false],["📅","Planner",false],["🔨","Pros",false]].map(([icon,label,active]) => (
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
              <p style={{ fontSize:13, fontWeight:700, color:"var(--text)" }}>Install as app – no App Store needed</p>
              <p style={{ fontSize:12, color:"var(--muted)" }}>iPhone: tap Share ⬆ → "Add to Home Screen" · Android: tap "Install app" above</p>
            </div>
          </div>
          <button onClick={triggerInstall} style={{ flexShrink:0, background:"var(--accent)", color:"white", padding:"9px 18px", borderRadius:50, fontSize:13, fontWeight:700, border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", whiteSpace:"nowrap" }}>
            {installed ? "✓ Installed" : "Install →"}
          </button>
        </div>
      </div>

      {/* MARKETING CARDS (EN) */}
      <div style={{ maxWidth:900, margin:"40px auto 0", padding:"0 20px", display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:20 }}>

        {/* Card 1 */}
        <div style={{ background:"#FBF7F3", borderRadius:20, padding:"32px 28px", boxShadow:"0 8px 40px rgba(0,0,0,0.08)", border:"1px solid var(--border)" }}>
          <p style={{ fontSize:13, fontWeight:700, color:"var(--accent)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:14 }}>🔍 The Problem</p>
          <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(20px,4vw,26px)", lineHeight:1.3, marginBottom:8 }}>
            Looking for a tool that gives you <em style={{ color:"var(--accent)" }}>ideas</em>… and <em style={{ color:"var(--accent)" }}>guides</em> to renovate?
          </h3>
          <div style={{ background:"var(--accent)", color:"white", borderRadius:50, padding:"10px 20px", display:"inline-block", fontWeight:700, fontSize:15, margin:"14px 0 20px" }}>
            Then Mystorija is the right choice!
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:20 }}>
            {[["💡","AI ideas for every room"],["📋","Step-by-step guides"],["🛒","Materials & costs at a glance"],["🏆","Tips, tricks & expert knowledge"]].map(([icon,text]) => (
              <div key={text} style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ background:"var(--accent)", color:"white", borderRadius:50, width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>{icon}</span>
                <span style={{ fontSize:14, fontWeight:500 }}>{text}</span>
              </div>
            ))}
          </div>
          <div style={{ background:"var(--accent-bg)", borderRadius:14, padding:"14px 16px", borderLeft:"3px solid var(--accent)" }}>
            <p style={{ fontSize:14, fontWeight:600, color:"var(--text)" }}>Everything you need for your project –<br /><strong style={{ color:"var(--accent)" }}>in one app.</strong></p>
          </div>
        </div>

        {/* Card 2 */}
        <div style={{ background:"#1A1A1A", borderRadius:20, padding:"32px 28px", boxShadow:"0 8px 40px rgba(0,0,0,0.2)" }}>
          <p style={{ fontSize:13, fontWeight:700, color:"var(--accent)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:14 }}>✨ The Solution</p>
          <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(18px,3.5vw,24px)", color:"white", lineHeight:1.35, marginBottom:14 }}>
            You love an interior look, but don't know <em style={{ color:"var(--accent)" }}>where to find it</em> or how to recreate it?
          </h3>
          <div style={{ background:"var(--accent)", color:"white", borderRadius:50, padding:"8px 18px", display:"inline-block", fontWeight:700, fontSize:14, marginBottom:20 }}>
            Here's the solution 💡
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:22 }}>
            {[["📸","Upload a photo – room or interior"],["✨","AI design ideas in seconds"],["📋","Step-by-step guides"],["🛒","Materials, shops & costs"]].map(([icon,text]) => (
              <div key={text} style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ background:"#333", color:"var(--accent)", borderRadius:50, width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>{icon}</span>
                <span style={{ fontSize:14, color:"#ddd" }}>{text}</span>
              </div>
            ))}
          </div>
          <div style={{ borderTop:"1px solid #333", paddingTop:16 }}>
            <p style={{ fontFamily:"'Playfair Display',serif", fontSize:18, color:"white", marginBottom:4 }}>My<span style={{ color:"var(--accent)" }}>storija</span></p>
            <p style={{ fontSize:12, color:"#888", marginBottom:12 }}>Your Home. Your Idea. Our AI.</p>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {["Simple","Fast","Personal","Professional","Affordable"].map(t => (
                <span key={t} style={{ fontSize:11, color:"var(--accent)", fontWeight:700 }}>✓ {t}</span>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* BEFORE/AFTER SLIDER */}
      <section className="reveal" style={{ maxWidth:860, margin:"60px auto 0", padding:"0 24px" }}>
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div className="section-label">✨ AI in action</div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(24px,4vw,36px)", fontWeight:700, lineHeight:1.2 }}>Before · After</h2>
          <p style={{ fontSize:15, color:"var(--muted)", marginTop:8 }}>Drag the slider to see the difference</p>
        </div>
        <div
          ref={sliderRef}
          style={{ position:"relative", overflow:"hidden", borderRadius:20, cursor:"ew-resize", userSelect:"none", boxShadow:"0 20px 60px rgba(0,0,0,0.14)", touchAction:"none" }}
          onMouseDown={() => { isDragging.current = true; }}
          onMouseMove={e => handleSliderMove(e.clientX)}
          onMouseUp={() => { isDragging.current = false; }}
          onMouseLeave={() => { isDragging.current = false; }}
          onTouchStart={() => { isDragging.current = true; }}
          onTouchMove={e => handleSliderMove(e.touches[0].clientX)}
          onTouchEnd={() => { isDragging.current = false; }}
        >
          <img src="https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=900&h=460&fit=crop&q=80" alt="Before" style={{ width:"100%", display:"block", pointerEvents:"none" }} />
          <img src="https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=900&h=460&fit=crop&q=80" alt="After" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", pointerEvents:"none", clipPath:`inset(0 ${100-sliderPos}% 0 0)` }} />
          <div style={{ position:"absolute", top:0, bottom:0, left:`${sliderPos}%`, transform:"translateX(-50%)", width:3, background:"white", pointerEvents:"none" }}>
            <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:44, height:44, background:"white", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 2px 12px rgba(0,0,0,0.25)", fontSize:16, fontWeight:700, color:"var(--accent)" }}>⇔</div>
          </div>
          <div style={{ position:"absolute", top:16, left:16, background:"rgba(0,0,0,0.55)", backdropFilter:"blur(4px)", color:"white", fontSize:12, fontWeight:700, padding:"5px 14px", borderRadius:20, pointerEvents:"none" }}>Before</div>
          <div style={{ position:"absolute", top:16, right:16, background:"var(--accent)", color:"white", fontSize:12, fontWeight:700, padding:"5px 14px", borderRadius:20, pointerEvents:"none" }}>✨ AI After</div>
        </div>
      </section>

      {/* STATS */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:1, background:"var(--border)", borderTop:"1px solid var(--border)", borderBottom:"1px solid var(--border)", margin:"60px 0" }}>
        {[["100", "Ideas & Trends"],["50", "DIY Guides"],["20s", "to makeover"]].map(([num,label]) => (
          <div key={label} style={{ background:"var(--card)", padding:"28px 20px", textAlign:"center" }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:36, fontWeight:700, color:"var(--accent)" }}>{num}</div>
            <div style={{ fontSize:13, color:"var(--muted)", marginTop:4 }}>{label}</div>
          </div>
        ))}
      </div>
      {/* PAIN POINTS */}
      <section style={{ padding:"0 24px 70px", maxWidth:900, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <div className="section-label" style={{ textAlign:"center" }}>For everyone who wants to renovate</div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(26px,5vw,38px)", lineHeight:1.25 }}>
            {"Inspiration is everywhere –"}<br /><em style={{ color:"var(--accent)" }}>Mystorija helps you get it done</em>
          </h2>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:16, marginBottom:50 }}>
          {[
            ["🛋️","Finally a clear vision","You know you want to change something – but what should it look like? Just upload a photo and see your home transformed."],
            ["🔍","What makes this look?","Found a beautiful photo – but what tiles are those, what wood tone, how much does it cost? Mystorija recognizes and explains it all."],
            ["🔨","DIY or hire a pro?","Renovation doesn't have to be complicated. 25 clear guides show you step by step what you can do yourself."],
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
            <div className="section-label">🔍 Inspo Analysis</div>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, color:"white", lineHeight:1.3, margin:"10px 0 14px" }}>See an image<br />you love?</h3>
            <p style={{ fontSize:15, color:"#aaa", lineHeight:1.7, marginBottom:20 }}>Take a screenshot of any image you like – Pinterest, Instagram, magazines, anywhere. The AI instantly tells you everything you need to know:</p>
            {["Which materials were used","Exact color tones and palette","Approximate cost per material","How to recreate it yourself","Direct links to Amazon, OBI, Bauhaus & Hornbach"].map(t => (
              <div key={t} style={{ color:"#ddd", fontSize:14, display:"flex", gap:10, alignItems:"flex-start", marginBottom:8 }}>
                <span style={{ color:"var(--accent)", fontWeight:700, flexShrink:0 }}>✓</span> {t}
              </div>
            ))}
            <a href="/en" style={{ display:"inline-flex", alignItems:"center", gap:8, background:"var(--accent)", color:"white", padding:"12px 24px", borderRadius:50, fontSize:14, fontWeight:700, textDecoration:"none", marginTop:20 }}>
              🔍 Analyze photo →
            </a>
          </div>
          <div style={{ flexShrink:0 }}>
            <div style={{ background:"#2A2A2A", borderRadius:20, padding:20, width:220 }}>
              <div style={{ background:"#333", borderRadius:12, height:110, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:14, fontSize:36 }}>📸</div>
              <div style={{ background:"var(--accent)", borderRadius:8, padding:"10px 12px", marginBottom:8 }}>
                <p style={{ fontSize:11, fontWeight:700, color:"white", marginBottom:3 }}>Japandi Bathroom detected</p>
                <p style={{ fontSize:10, color:"#f0c9b0" }}>Microcement · Teak Wood · Matte Black</p>
              </div>
              <div style={{ display:"flex", gap:6 }}>
                {["#4A4A4A","#5A4A3A","#3A3A3A","#6A5A4A"].map(c => (
                  <div key={c} style={{ flex:1, height:16, background:c, borderRadius:4 }} />
                ))}
              </div>
              <p style={{ fontSize:10, color:"#888", marginTop:6 }}>Color palette detected</p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="reveal" style={{ padding:"70px 24px", maxWidth:900, margin:"0 auto" }} id="features">
        <div className="section-label">What Mystorija can do</div>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(28px,5vw,40px)", fontWeight:700, lineHeight:1.25, marginBottom:14 }}>Everything you need for your renovation</h2>
        <p style={{ fontSize:17, color:"var(--muted)", maxWidth:560, lineHeight:1.7, marginBottom:48 }}>From inspiration to finished guide – Mystorija guides you through every step.</p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:20 }}>
          {[
            ["✨","AI Makeover","Upload a photo, describe your wishes – AI shows you your room renovated. In seconds, not months."],
            ["🔍","Inspo Analysis","Upload a Pinterest screenshot – AI instantly recognizes all materials, colors and shows how to recreate it."],
            ["💡","100 Ideas & Trends","Bathroom, kitchen, living room, terrace and more. Current 2026 trends with costs and direct shop links."],
            ["📋","25 Guides","From painting walls to building a shower. With tool list, pro tips and video links."],
            ["💬","AI Advisor","Ask anything about renovation: costs, materials, permits. Like an experienced friend."],
            ["🛒","Materialien kaufen","AI recognizes materials used and links directly to Amazon, OBI, Bauhaus & Hornbach."],
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
      <section className="reveal from-left" style={{ background:"var(--card)", padding:"70px 24px" }}>
        <div style={{ maxWidth:900, margin:"0 auto" }}>
          <div className="section-label">How it works</div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(28px,5vw,40px)", fontWeight:700, lineHeight:1.25, marginBottom:14 }}>3 steps to your dream renovation</h2>
          <p style={{ fontSize:17, color:"var(--muted)", maxWidth:560, lineHeight:1.7, marginBottom:48 }}>No architecture degree, no 3D software. Just upload a photo and get started.</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:0 }}>
            {[
              ["1","Upload a photo","Take a photo of your room – no matter how it looks."],
              ["2","Describe your wishes","\"Dunkle Fliesen, keine Badewanne, Walk-In Dusche, mattschwarz Armaturen\""],
              ["3","AI generates your makeover","In ~20 seconds you see your renovated room – with materials and shopping list."],
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
      <section className="reveal" style={{ padding:"70px 24px", maxWidth:900, margin:"0 auto" }} id="preise">
        <div className="section-label">Preise</div>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(28px,5vw,40px)", fontWeight:700, lineHeight:1.25, marginBottom:14 }}>Transparent. Fair. No surprises.</h2>
        <p style={{ fontSize:17, color:"var(--muted)", maxWidth:560, lineHeight:1.7, marginBottom:24 }}>Start free and upgrade when you need more.</p>
        <div style={{ background:"var(--accent-bg)", border:"1.5px solid #f0c9b0", borderRadius:16, padding:"18px 24px", marginBottom:36, display:"flex", gap:16, alignItems:"center", flexWrap:"wrap" }}>
          <div style={{ fontSize:24 }}>⏱️</div>
          <div style={{ flex:1 }}>
            <p style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>See your result in 20 seconds</p>
            <p style={{ fontSize:13, color:"var(--muted)" }}>No account needed. No download. Just upload a photo and get started – free now.</p>
          </div>
          <a href="/en" style={{ flexShrink:0, background:"var(--accent)", color:"white", padding:"10px 20px", borderRadius:50, fontSize:13, fontWeight:700, textDecoration:"none", whiteSpace:"nowrap" }}>Start now →</a>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:20 }}>
          {[
            { name:"Basic", price:"9,99", featured:false, desc:"Perfect for getting started – all core features.", features:["20 Makeovers / month","20 Inspo analyses / month","100 Ideas & Trends","25 Guides","AI Chat Advisor","Planner & Shopping list"] },
            { name:"Pro ⭐", price:"19,99", featured:true, desc:"For serious renovators – generate without limits.", features:["Unlimited Makeovers","Unlimited Inspo analyses","Everything in Basic","Priority generation","Early access to new features"] },
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
              <a href="/en" style={{ display:"block", width:"100%", textAlign:"center", padding:13, borderRadius:50, fontSize:14, fontWeight:700, textDecoration:"none", background:p.featured?"var(--accent)":"transparent", color:p.featured?"white":"var(--text)", border:p.featured?"none":"1.5px solid var(--border)" }}>
                {p.featured ? "Go Pro ✨" : "Start now"}
              </a>
            </div>
          ))}
        </div>
      </section>


      {/* HANDWERKER B2B */}
      <section style={{ padding:"70px 24px", background:"var(--bg)" }}>
        <div style={{ maxWidth:860, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:48 }}>
            <div style={{ fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:"1.5px", color:"var(--accent)", marginBottom:10 }}>For Contractors & Businesses</div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(26px,5vw,38px)", lineHeight:1.25, marginBottom:14 }}>
              Your business –<br /><em style={{ color:"var(--accent)" }}>directly with renovation-ready customers</em>
            </h2>
            <p style={{ fontSize:16, color:"var(--muted)", maxWidth:540, margin:"0 auto", lineHeight:1.7 }}>
              Mystorija users are actively renovating. No better moment to present your business.
            </p>
          </div>

          {/* Single pricing card centered */}
          <div style={{ maxWidth:460, margin:"0 auto 40px", background:"var(--card)", border:"2px solid var(--accent)", borderRadius:24, padding:36, position:"relative" }}>
            <div style={{ position:"absolute", top:-14, left:"50%", transform:"translateX(-50%)", background:"var(--accent)", color:"white", fontSize:12, fontWeight:700, padding:"5px 18px", borderRadius:50, whiteSpace:"nowrap" }}>
              🔨 Contractor Plan
            </div>
            <div style={{ textAlign:"center", marginBottom:24 }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:52, fontWeight:700, lineHeight:1, color:"var(--text)" }}>
                <sup style={{ fontSize:22, verticalAlign:"super" }}>€</sup>49<sub style={{ fontSize:18, color:"var(--muted)", fontFamily:"'DM Sans',sans-serif", fontWeight:400 }}>,99/Monat</sub>
              </div>
              <p style={{ fontSize:14, color:"var(--muted)", marginTop:6 }}>Cancel anytime · No setup fee</p>
            </div>

            <div style={{ borderTop:"1px solid var(--border)", borderBottom:"1px solid var(--border)", padding:"20px 0", marginBottom:24 }}>
              {[
                ["🏢", "Business Profile", "With photos, services, contact details and reviews"],
                ["📣", "Advertisement", "Your banner appears in Ideas, Trends and Guides – exactly when users look for contractors"],
                ["📩", "Direct Inquiries", "Customers contact you directly from the app"],
                ["✅", "Verified Pro", "Badge for more trust with new customers"],
                ["📍", "Regional Visibility", "Shown in your region"],
                ["⭐", "Rating System", "Collect real customer reviews"],
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
              Apply now →
            </a>
            <p style={{ textAlign:"center", fontSize:12, color:"var(--muted)", marginTop:10 }}>
              Write us: <strong>info@mystorija.com</strong>
            </p>
          </div>
        </div>
      </section>



      {/* COMMUNITY */}
      <section style={{ background:"#1A1A1A", padding:"70px 24px" }}>
        <div style={{ maxWidth:900, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:50 }}>
            <div style={{ fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:"1.5px", color:"var(--accent)", marginBottom:10 }}>Community</div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(26px,5vw,38px)", color:"white", lineHeight:1.25, marginBottom:14 }}>
              A community is growing here<br /><em style={{ color:"var(--accent)" }}>around renovation</em>
            </h2>
            <p style={{ fontSize:16, color:"#aaa", maxWidth:560, margin:"0 auto", lineHeight:1.7 }}>
              Mystorija verbindet Menschen die renovieren moechten mit Handwerkern die helfen koennen. Zeige deine Projekte, hol dir Inspiration und finde den richtigen Profi.
            </p>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:20, marginBottom:50 }}>
            {[
              ["🏠", "For homeowners", "Share your renovation projects, show before/after results and get inspired by others' transformations."],
              ["🔨", "For contractors", "Present your work directly to people actively renovating. No cold outreach – only people who genuinely want to renovate."],
              ["💡", "For idea seekers", "See what others have done with similar rooms. Real projects, real results – no stock photos."],
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
              <p style={{ fontSize:13, fontWeight:700, textTransform:"uppercase", letterSpacing:"1px", color:"var(--accent)", marginBottom:8 }}>🔨 For Contractors & Businesses</p>
              <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:"white", lineHeight:1.3, marginBottom:12 }}>Join the Mystorija Community</h3>
              <p style={{ fontSize:14, color:"#aaa", lineHeight:1.6, marginBottom:20 }}>Present your business directly to people actively renovating – the most engaged audience there is. Listing from <strong style={{ color:"var(--accent)" }}>€49.99/month</strong>.</p>
              <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
                {["✓ Profile with photos & reviews","✓ Direct enquiries","✓ Verified businesses only"].map(t => (
                  <span key={t} style={{ fontSize:13, color:"#ccc" }}>{t}</span>
                ))}
              </div>
            </div>
            <div style={{ flexShrink:0, textAlign:"center" }}>
              <p style={{ fontSize:13, color:"#888", marginBottom:10 }}>Get on the waitlist</p>
              <a href="mailto:info@mystorija.com" style={{ display:"inline-block", background:"var(--accent)", color:"white", padding:"12px 24px", borderRadius:50, fontSize:14, fontWeight:700, textDecoration:"none" }}>
                Get in touch →
              </a>
              <p style={{ fontSize:11, color:"#666", marginTop:8 }}>Waitlist now open</p>
            </div>
          </div>
        </div>
      </section>

      
      {/* CONTACT */}
      <section style={{ background:"var(--card)", padding:"50px 24px", borderTop:"1px solid var(--border)" }}>
        <div style={{ maxWidth:600, margin:"0 auto", textAlign:"center" }}>
          <div style={{ fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:"1.5px", color:"var(--accent)", marginBottom:10 }}>Contact & Support</div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:28, marginBottom:12 }}>Questions? We are happy to help</h2>
          <p style={{ fontSize:16, color:"var(--muted)", marginBottom:28, lineHeight:1.7 }}>
            Questions about the app, your subscription or as a contractor who wants to join – just write us.
          </p>
          <a href="mailto:info@mystorija.com" style={{ display:"inline-flex", alignItems:"center", gap:10, background:"var(--accent)", color:"white", padding:"14px 32px", borderRadius:50, fontSize:16, fontWeight:700, textDecoration:"none" }}>
            ✉️ info@mystorija.com
          </a>
          <p style={{ fontSize:13, color:"var(--muted)", marginTop:12 }}>We respond within 24 hours</p>
        </div>
      </section>
{/* FOOTER */}
      <footer style={{ background:"#1A1A1A", padding:"40px 24px", textAlign:"center" }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, color:"white", marginBottom:8 }}>My<span style={{ color:"var(--accent)" }}>storija</span></div>
        <p style={{ fontSize:13, color:"#888", marginBottom:4 }}>AI-powered renovation app · 2026</p>
        <p style={{ fontSize:13, color:"#888", marginBottom:4 }}>Support: <a href="mailto:info@mystorija.com" style={{ color:"var(--accent)", textDecoration:"none" }}>info@mystorija.com</a></p>
        <p style={{ fontSize:13, color:"#888", marginBottom:4 }}>Support: <a href="mailto:info@mystorija.com" style={{ color:"var(--accent)", textDecoration:"none" }}>info@mystorija.com</a></p>
        <div style={{ marginTop:16, display:"flex", gap:0, justifyContent:"center" }}>
          {[["Imprint","/impressum"],["Privacy","/datenschutz"],["Open app","/en/app"]].map(([label,href]) => (
            <a key={label} href={href} style={{ color:"#888", textDecoration:"none", margin:"0 12px", fontSize:13 }}>{label}</a>
          ))}
        </div>
      </footer>
    </>
  );
}
