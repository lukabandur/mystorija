import { useState, useRef, useEffect } from "react";
import Head from "next/head";

const C = { accent: "#C4622D", bg: "#F8F5F0", card: "#fff", border: "#EDE8DF", muted: "#888", text: "#1A1A1A" };

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

function compressImage(file) {
  return new Promise(function(resolve) {
    var img = new Image();
    img.onload = function() {
      var canvas = document.createElement("canvas");
      var max = 1024;
      var w = img.width, h = img.height;
      if (w > h && w > max) { h = Math.round(h * max / w); w = max; }
      else if (h > max) { w = Math.round(w * max / h); h = max; }
      canvas.width = w; canvas.height = h;
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

// ─── MAKEOVER TAB ─────────────────────────────────────────────────────────────
function MakeoverTab() {
  var fileRef = useRef();
  var s1 = useState(null); var file = s1[0]; var setFile = s1[1];
  var s2 = useState(null); var vorherUrl = s2[0]; var setVorherUrl = s2[1];
  var s3 = useState(null); var nachherUrl = s3[0]; var setNachherUrl = s3[1];
  var s4 = useState("bad-modern"); var stil = s4[0]; var setStil = s4[1];
  var s5 = useState(false); var loading = s5[0]; var setLoading = s5[1];
  var s6 = useState(null); var error = s6[0]; var setError = s6[1];
  var s7 = useState(0); var progress = s7[0]; var setProgress = s7[1];

  function handleDatei(e) {
    var f = e.target.files[0];
    if (!f) return;
    setFile(f); setVorherUrl(URL.createObjectURL(f));
    setNachherUrl(null); setError(null);
  }

  function generieren() {
    if (!file) return;
    setLoading(true); setNachherUrl(null); setError(null); setProgress(0);
    var timer = setInterval(function() {
      setProgress(function(p) { return p < 85 ? p + 2 : p; });
    }, 600);
    compressImage(file).then(function(base64) {
      return fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, style: stil }),
      });
    }).then(function(res) { return res.json(); })
    .then(function(data) {
      clearInterval(timer);
      if (data.error) { setError(data.error); setLoading(false); return; }
      setProgress(100); setNachherUrl(data.imageUrl); setLoading(false);
    }).catch(function(err) {
      clearInterval(timer); setError(err.message); setLoading(false);
    });
  }

  return (
    <div style={{ padding: "16px 16px 40px", overflowY: "auto", height: "100%" }}>
      <h2 style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700, marginBottom: 16, color: C.text }}>
        ✨ KI Makeover
      </h2>

      <p style={{ fontSize: 12, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Stil wählen</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
        {STILE.map(function(s) {
          return (
            <button key={s.id} onClick={function() { setStil(s.id); }} style={{
              padding: "9px 10px", borderRadius: 10, cursor: "pointer", textAlign: "left",
              border: "2px solid " + (stil === s.id ? C.accent : C.border),
              background: stil === s.id ? "#FFF0E8" : C.card,
              color: stil === s.id ? C.accent : C.text,
              fontSize: 12, fontWeight: stil === s.id ? 600 : 400,
            }}>
              {s.emoji} {s.label}
            </button>
          );
        })}
      </div>

      <div onClick={function() { fileRef.current.click(); }} style={{
        border: "2px dashed " + (vorherUrl ? C.accent : C.border),
        borderRadius: 16, overflow: "hidden",
        padding: vorherUrl ? 0 : "32px 20px",
        textAlign: "center", cursor: "pointer",
        background: vorherUrl ? "transparent" : C.card, marginBottom: 14,
      }}>
        {vorherUrl
          ? <img src={vorherUrl} alt="Vorher" style={{ width: "100%", display: "block", maxHeight: 280, objectFit: "cover" }} />
          : <>
              <div style={{ fontSize: 40, marginBottom: 10 }}>📷</div>
              <p style={{ fontWeight: 600, fontSize: 15, color: C.text, marginBottom: 4 }}>Foto hochladen</p>
              <p style={{ fontSize: 13, color: C.muted }}>Bad, Küche, Wohnzimmer…</p>
            </>
        }
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleDatei} />

      {vorherUrl && (
        <button onClick={generieren} disabled={loading} style={{
          width: "100%", padding: 16,
          background: loading ? "#DDD" : "linear-gradient(135deg, #C4622D, #A0522D)",
          color: loading ? "#999" : "white", border: "none", borderRadius: 50,
          fontSize: 15, fontWeight: 700, cursor: loading ? "default" : "pointer",
          marginBottom: 14, boxShadow: loading ? "none" : "0 4px 16px rgba(196,98,45,0.3)",
        }}>
          {loading ? "⏳ KI generiert Bild…" : "✨ Makeover generieren"}
        </button>
      )}

      {loading && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ height: 5, background: C.border, borderRadius: 3, overflow: "hidden", marginBottom: 6 }}>
            <div style={{ height: "100%", width: progress + "%", background: C.accent, borderRadius: 3, transition: "width 0.6s" }} />
          </div>
          <p style={{ fontSize: 12, color: C.muted, textAlign: "center" }}>
            {progress < 40 ? "Bild wird hochgeladen…" : progress < 80 ? "KI generiert Makeover… (15-30 Sek.)" : "Fast fertig…"}
          </p>
        </div>
      )}

      {error && (
        <div style={{ background: "#FFF5F5", border: "1px solid #F5D0D0", borderRadius: 12, padding: "12px 14px", marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: "#B91C1C", fontWeight: 600 }}>Fehler</p>
          <p style={{ fontSize: 12, color: "#7F1D1D", marginTop: 4 }}>{error}</p>
        </div>
      )}

      {nachherUrl && (
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center" }}>
            <div style={{ flex: 1, height: 2, background: C.border }} />
            <span style={{ fontSize: 12, color: C.accent, fontWeight: 700 }}>✨ NACHHER</span>
            <div style={{ flex: 1, height: 2, background: C.border }} />
          </div>
          <div style={{ borderRadius: 14, overflow: "hidden", marginBottom: 14, boxShadow: "0 6px 24px rgba(0,0,0,0.1)" }}>
            <img src={nachherUrl} alt="Nachher" style={{ width: "100%", display: "block" }} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={function() { setNachherUrl(null); generieren(); }} style={{
              flex: 1, padding: 13, background: C.card, border: "2px solid " + C.border,
              borderRadius: 50, fontSize: 13, fontWeight: 600, cursor: "pointer", color: C.text,
            }}>🔄 Nochmal</button>
            <a href={nachherUrl} download="makeover.jpg" target="_blank" rel="noreferrer" style={{
              flex: 1, padding: 13, background: C.accent, borderRadius: 50,
              fontSize: 13, fontWeight: 600, color: "white",
              textDecoration: "none", textAlign: "center", display: "flex",
              alignItems: "center", justifyContent: "center",
            }}>💾 Speichern</a>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CHAT TAB ─────────────────────────────────────────────────────────────────
function ChatTab() {
  var bottomRef = useRef();
  var s1 = useState([{ role: "assistant", text: "Hey! 👋 Ich bin dein RenoPilot-Experte.\n\nBeschreib mir deinen Raum oder deine Renovierungswünsche – ich helfe dir mit konkreten Tipps, Produkten und Preisen!\n\nBeispiele:\n• Mein Bad hat alte grüne Fliesen, was kann ich tun?\n• Ich möchte meine Küche für 500€ aufwerten\n• Welche Farbe passt zum Wohnzimmer?" }]);
  var messages = s1[0]; var setMessages = s1[1];
  var s2 = useState(""); var input = s2[0]; var setInput = s2[1];
  var s3 = useState(false); var loading = s3[0]; var setLoading = s3[1];
  var inputRef = useRef();

  useEffect(function() {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function send() {
    var text = input.trim();
    if (!text || loading) return;
    var newMessages = messages.concat({ role: "user", text: text });
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    var apiMessages = newMessages.map(function(m) {
      return { role: m.role, content: m.text };
    });

    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: apiMessages }),
    }).then(function(res) { return res.json(); })
    .then(function(data) {
      if (data.error) throw new Error(data.error);
      setMessages(function(prev) { return prev.concat({ role: "assistant", text: data.reply }); });
      setLoading(false);
    }).catch(function(err) {
      setMessages(function(prev) { return prev.concat({ role: "assistant", text: "Fehler: " + err.message }); });
      setLoading(false);
    });
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        {messages.map(function(msg, i) {
          var isUser = msg.role === "user";
          return (
            <div key={i} style={{
              display: "flex", justifyContent: isUser ? "flex-end" : "flex-start",
              marginBottom: 12, alignItems: "flex-end", gap: 8,
            }}>
              {!isUser && (
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>🔨</div>
              )}
              <div style={{
                maxWidth: "80%", padding: "10px 14px",
                background: isUser ? C.accent : C.card,
                color: isUser ? "white" : C.text,
                border: isUser ? "none" : "1px solid " + C.border,
                borderRadius: isUser ? "16px 16px 3px 16px" : "16px 16px 16px 3px",
                fontSize: 14, lineHeight: 1.65, whiteSpace: "pre-wrap",
              }}>
                {msg.text}
              </div>
            </div>
          );
        })}
        {loading && (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🔨</div>
            <div style={{ background: C.card, border: "1px solid " + C.border, borderRadius: "16px 16px 16px 3px", padding: "12px 16px", display: "flex", gap: 5 }}>
              {[0,1,2].map(function(i) {
                return <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: C.accent, opacity: 0.5, animation: "blink 1.2s ease " + (i*0.2) + "s infinite" }} />;
              })}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding: "10px 14px 16px", borderTop: "1px solid " + C.border, background: C.card, display: "flex", gap: 10, alignItems: "flex-end" }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={function(e) { setInput(e.target.value); }}
          onKeyDown={handleKey}
          placeholder="Beschreib deinen Raum oder deine Frage…"
          rows={1}
          style={{
            flex: 1, border: "1px solid " + C.border, borderRadius: 20,
            padding: "10px 16px", fontSize: 14, resize: "none",
            fontFamily: "-apple-system, sans-serif", outline: "none",
            background: C.bg, color: C.text, lineHeight: 1.5,
          }}
        />
        <button onClick={send} disabled={!input.trim() || loading} style={{
          width: 42, height: 42, borderRadius: "50%",
          background: input.trim() && !loading ? C.accent : C.border,
          border: "none", cursor: input.trim() && !loading ? "pointer" : "default",
          fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, transition: "background 0.2s",
        }}>➤</button>
      </div>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function Home() {
  var s = useState("makeover"); var tab = s[0]; var setTab = s[1];

  var TABS = [
    { id: "makeover", icon: "✨", label: "Makeover" },
    { id: "chat",     icon: "💬", label: "Chat" },
  ];

  return (
    <>
      <Head>
        <title>RenoPilot – KI Renovierung</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style dangerouslySetInnerHTML={{__html: "* { box-sizing: border-box; margin: 0; padding: 0; } body { font-family: -apple-system, sans-serif; background: " + C.bg + "; } textarea { outline: none; } @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }"}} />
      </Head>

      <div style={{ maxWidth: 560, margin: "0 auto", display: "flex", flexDirection: "column", height: "100vh" }}>

        <div style={{ background: C.card, borderBottom: "1px solid " + C.border, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <span style={{ fontFamily: "Georgia, serif", fontSize: 24, fontWeight: 800, color: C.text }}>
            Reno<span style={{ color: C.accent }}>Pilot</span>
          </span>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80" }} />
            <span style={{ fontSize: 12, color: C.accent, fontWeight: 600 }}>KI aktiv</span>
          </div>
        </div>

        <div style={{ flex: 1, overflow: "hidden" }}>
          <div style={{ display: tab === "makeover" ? "block" : "none", height: "100%", overflowY: "auto" }}>
            <MakeoverTab />
          </div>
          <div style={{ display: tab === "chat" ? "flex" : "none", flexDirection: "column", height: "100%" }}>
            <ChatTab />
          </div>
        </div>

        <div style={{ background: C.card, borderTop: "1px solid " + C.border, display: "grid", gridTemplateColumns: "1fr 1fr", flexShrink: 0 }}>
          {TABS.map(function(t) {
            return (
              <button key={t.id} onClick={function() { setTab(t.id); }} style={{
                background: "none", border: "none", cursor: "pointer",
                padding: "10px 4px 14px", display: "flex", flexDirection: "column",
                alignItems: "center", gap: 4,
                borderTop: "3px solid " + (tab === t.id ? C.accent : "transparent"),
              }}>
                <span style={{ fontSize: 20 }}>{t.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: tab === t.id ? C.accent : C.muted }}>
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
