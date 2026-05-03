import { useState, useRef } from "react";
import Head from "next/head";

const STILE = [
  { id: "bad-modern",    emoji: "🚿", label: "Bad: Modern & Spa" },
  { id: "bad-warm",      emoji: "🚿", label: "Bad: Hell & Warm" },
  { id: "bad-mikro",     emoji: "🚿", label: "Bad: Mikrozement" },
  { id: "kueche-navy",   emoji: "🍳", label: "Küche: Navy & Holz" },
  { id: "kueche-grau",   emoji: "🍳", label: "Küche: Seidengrau" },
  { id: "kueche-gruen",  emoji: "🍳", label: "Küche: Salbeigrün" },
  { id: "wohn-gruen",    emoji: "🛋️", label: "Wohnzimmer: Dunkelgrün" },
  { id: "wohn-terra",    emoji: "🛋️", label: "Wohnzimmer: Terrakotta" },
  { id: "schlaf-terra",  emoji: "🛏️", label: "Schlafzimmer: Terrakotta" },
  { id: "schlaf-dunkel", emoji: "🛏️", label: "Schlafzimmer: Dunkel" },
  { id: "terrasse-wpc",  emoji: "🌿", label: "Terrasse: WPC & Lounge" },
];

const C = { accent: "#C4622D", bg: "#F8F5F0", card: "#fff", border: "#EDE8DF", muted: "#888", text: "#1A1A1A" };

function compressImage(file, maxSize) {
  var ms = maxSize || 1024;
  return new Promise(function(resolve) {
    var img = new Image();
    img.onload = function() {
      var canvas = document.createElement("canvas");
      var w = img.width;
      var h = img.height;
      if (w > h && w > ms) { h = Math.round(h * ms / w); w = ms; }
      else if (h > ms) { w = Math.round(w * ms / h); h = ms; }
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      canvas.toBlob(function(blob) {
        var reader = new FileReader();
        reader.onload = function() { resolve(reader.result.split(",")[1]); };
        reader.readAsDataURL(blob);
      }, "image/jpeg", 0.85);
    };
    img.src = URL.createObjectURL(file);
  });
}

export default function Home() {
  var fileRef = useRef();
  var s = useState(null); var file = s[0]; var setFile = s[1];
  var s2 = useState(null); var vorherUrl = s2[0]; var setVorherUrl = s2[1];
  var s3 = useState(null); var nachherUrl = s3[0]; var setNachherUrl = s3[1];
  var s4 = useState("bad-modern"); var stil = s4[0]; var setStil = s4[1];
  var s5 = useState(false); var loading = s5[0]; var setLoading = s5[1];
  var s6 = useState(null); var error = s6[0]; var setError = s6[1];
  var s7 = useState(0); var progress = s7[0]; var setProgress = s7[1];

  function handleDatei(e) {
    var f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setVorherUrl(URL.createObjectURL(f));
    setNachherUrl(null);
    setError(null);
  }

  function generieren() {
    if (!file) return;
    setLoading(true);
    setNachherUrl(null);
    setError(null);
    setProgress(0);
    var timer = setInterval(function() {
      setProgress(function(p) { return p < 85 ? p + 3 : p; });
    }, 500);
    compressImage(file, 1024).then(function(base64) {
      return fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, style: stil }),
      });
    }).then(function(res) {
      return res.json();
    }).then(function(data) {
      clearInterval(timer);
      if (data.error) { setError(data.error); setLoading(false); return; }
      setProgress(100);
      setNachherUrl(data.imageUrl);
      setLoading(false);
    }).catch(function(err) {
      clearInterval(timer);
      setError(err.message);
      setLoading(false);
    });
  }

  return (
    <>
      <Head>
        <title>RenoPilot – KI Makeover</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style dangerouslySetInnerHTML={{__html: "* { box-sizing: border-box; margin: 0; padding: 0; } body { font-family: -apple-system, sans-serif; background: " + C.bg + "; } @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } } .fadeIn { animation: fadeIn 0.4s ease; }"}} />
      </Head>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "20px 16px 60px" }}>

        <div style={{ textAlign: "center", padding: "28px 0 24px" }}>
          <h1 style={{ fontSize: 34, fontWeight: 800, color: C.text, letterSpacing: -1 }}>
            Reno<span style={{ color: C.accent }}>Pilot</span>
          </h1>
          <p style={{ fontSize: 15, color: C.muted, marginTop: 6 }}>
            Foto hochladen → Stil wählen → KI generiert Makeover
          </p>
        </div>

        <p style={{ fontSize: 12, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Ziel-Stil wählen</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
          {STILE.map(function(s) {
            return (
              <button key={s.id} onClick={function() { setStil(s.id); }} style={{
                padding: "10px 12px", borderRadius: 12, cursor: "pointer", textAlign: "left",
                border: "2px solid " + (stil === s.id ? C.accent : C.border),
                background: stil === s.id ? "#FFF0E8" : C.card,
                color: stil === s.id ? C.accent : C.text,
                fontSize: 13, fontWeight: stil === s.id ? 600 : 400,
              }}>
                {s.emoji} {s.label}
              </button>
            );
          })}
        </div>

        <div onClick={function() { fileRef.current.click(); }} style={{
          border: "2px dashed " + (vorherUrl ? C.accent : C.border),
          borderRadius: 16, overflow: "hidden",
          padding: vorherUrl ? 0 : "40px 20px",
          textAlign: "center", cursor: "pointer",
          background: vorherUrl ? "transparent" : C.card, marginBottom: 14,
        }}>
          {vorherUrl ? (
            <img src={vorherUrl} alt="Vorher" style={{ width: "100%", display: "block", maxHeight: 320, objectFit: "cover" }} />
          ) : (
            <>
              <div style={{ fontSize: 44, marginBottom: 10 }}>📷</div>
              <p style={{ fontWeight: 600, fontSize: 16, color: C.text, marginBottom: 4 }}>Foto hochladen</p>
              <p style={{ fontSize: 13, color: C.muted }}>Bad, Küche, Wohnzimmer, Terrasse…</p>
            </>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleDatei} />

        {vorherUrl && (
          <button onClick={generieren} disabled={loading} style={{
            width: "100%", padding: 18,
            background: loading ? "#DDD" : "linear-gradient(135deg, #C4622D, #A0522D)",
            color: loading ? "#999" : "white",
            border: "none", borderRadius: 50,
            fontSize: 16, fontWeight: 700, cursor: loading ? "default" : "pointer",
            marginBottom: 16,
            boxShadow: loading ? "none" : "0 4px 20px rgba(196,98,45,0.3)",
          }}>
            {loading ? "⏳ KI generiert Bild…" : "✨ Makeover generieren"}
          </button>
        )}

        {loading && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ height: 6, background: C.border, borderRadius: 3, overflow: "hidden", marginBottom: 8 }}>
              <div style={{ height: "100%", width: progress + "%", background: C.accent, borderRadius: 3, transition: "width 0.5s" }} />
            </div>
            <p style={{ fontSize: 13, color: C.muted, textAlign: "center" }}>
              {progress < 40 ? "Bild wird analysiert…" : progress < 80 ? "KI generiert Makeover…" : "Fast fertig…"}
            </p>
          </div>
        )}

        {error && (
          <div style={{ background: "#FFF5F5", border: "1px solid #F5D0D0", borderRadius: 12, padding: "14px 16px", marginBottom: 20 }}>
            <p style={{ fontSize: 14, color: "#B91C1C", fontWeight: 600, marginBottom: 4 }}>Fehler</p>
            <p style={{ fontSize: 13, color: "#7F1D1D" }}>{error}</p>
          </div>
        )}

        {nachherUrl && (
          <div className="fadeIn">
            <div style={{ display: "flex", gap: 10, marginBottom: 12, alignItems: "center" }}>
              <div style={{ flex: 1, height: 2, background: C.border }} />
              <span style={{ fontSize: 13, color: C.accent, fontWeight: 700 }}>✨ NACHHER</span>
              <div style={{ flex: 1, height: 2, background: C.border }} />
            </div>
            <div style={{ borderRadius: 16, overflow: "hidden", marginBottom: 16, boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
              <img src={nachherUrl} alt="Nachher" style={{ width: "100%", display: "block" }} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={function() { setNachherUrl(null); generieren(); }} style={{
                flex: 1, padding: 14, background: C.card,
                border: "2px solid " + C.border, borderRadius: 50,
                fontSize: 14, fontWeight: 600, cursor: "pointer", color: C.text,
              }}>
                🔄 Nochmal
              </button>
              <a href={nachherUrl} download="makeover.jpg" target="_blank" rel="noreferrer" style={{
                flex: 1, padding: 14, background: C.accent, borderRadius: 50,
                fontSize: 14, fontWeight: 600, color: "white",
                textDecoration: "none", textAlign: "center",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                💾 Speichern
              </a>
            </div>
          </div>
        )}

        <div style={{ marginTop: 32, padding: 16, background: "#FFF0E8", borderRadius: 12, textAlign: "center" }}>
          <p style={{ fontSize: 12, color: "#8B5E3C", lineHeight: 1.6 }}>
            🤖 Powered by fal.ai · Ca. 15-30 Sekunden pro Bild<br />
            Bilder werden nicht gespeichert
          </p>
        </div>
      </div>
    </>
  );
}
