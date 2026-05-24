import React, { useState, useRef, useEffect } from "react";
import Head from "next/head";
import { supabase } from "../../lib/supabase";
import { Analytics } from "@vercel/analytics/next";

const C = {
  bg: "#F8F5F0", card: "#FFFFFF", border: "#EDE8DF",
  accent: "#C4622D", accentBg: "#FFF0E8", text: "#1A1A1A",
  muted: "#888888", green: "#3A7A56", greenBg: "#EDF5F1", tag: "#F0EDE8",
};

const globalCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,600&family=DM+Sans:wght@300;400;500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
  body { font-family: 'DM Sans', sans-serif; background: #F8F5F0; overscroll-behavior: none; }
  textarea, input, button { font-family: 'DM Sans', sans-serif; }

  /* Smooth scrolling */
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #EDE8DF; border-radius: 3px; }

  /* Animations */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes blink {
    0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
    40%            { opacity: 1;   transform: scale(1); }
  }
  @keyframes shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.5; }
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-8px); }
    to   { opacity: 1; transform: translateX(0); }
  }

  /* Card hover lift */
  .fu { animation: fadeUp 0.35s ease both; }
  .fi { animation: fadeIn 0.3s ease both; }

  /* Loading skeleton */
  .skeleton {
    background: linear-gradient(90deg, #f0ece6 25%, #e8e3dc 50%, #f0ece6 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 8px;
  }

  /* Tab active indicator */
  .tab-active { position: relative; }
  .tab-active::after {
    content: '';
    position: absolute;
    bottom: 0; left: 20%; right: 20%;
    height: 2px;
    background: #C4622D;
    border-radius: 2px;
  }

  /* Button press effect */
  button:active { transform: scale(0.97); }
  a:active { transform: scale(0.97); }

  /* Image lazy load fade */
  img { transition: opacity 0.3s ease; }
  img[loading="lazy"] { opacity: 0; }
  img[loading="lazy"].loaded { opacity: 1; }

  /* Focus styles */
  textarea:focus, input:focus, select:focus { outline: none; }

  /* Blink for loading dots */
  @keyframes blink { 0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1); } }

  /* Spin */
  @keyframes spin { to { transform: rotate(360deg); } }
`;


const SYSTEM = `You are Mystorija, a professional renovation expert. ALWAYS respond in English only. Be direct, give specific product recommendations with prices in €. Max 3-4 paragraphs. Use emojis.`;
async function callAPI(messages) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, lang: "en" }),
  });
  const data = await response.json();
  return data.reply || data.content || data.error || "Sorry, something went wrong.";
}


function LoadingSpinner({ size }) {
  const sz = size || 24;
  return <div style={{ width: sz, height: sz, border: "3px solid " + C.border, borderTop: "3px solid " + C.accent, borderRadius: "50%", flexShrink: 0, animation: "spin 0.85s linear infinite" }} />;
}

function Pill({ children, bg, color }) {
  return <span style={{ background: bg || C.accentBg, color: color || C.accent, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 500, whiteSpace: "nowrap" }}>{children}</span>;
}

// ─── AFFILIATE ────────────────────────────────────────────────────────────────
const AFFILIATE_TAG = "mystorija-21";
function amazonLink(q, qBau) {
  const bq = qBau || q;
  return {
    amzn: `https://www.amazon.de/s?k=${encodeURIComponent(q)}&tag=mystorija-21`,
    obi:  `https://www.obi.de/suche/${encodeURIComponent(bq)}/`,
    bh:   `https://www.bauhaus.info/search?q=${encodeURIComponent(bq)}`,
    hb:   `https://www.hornbach.de/s/${encodeURIComponent(bq)}/`,
  };
}

// ─── GUIDES DATA (18 guides) ──────────────────────────────────────────────────
const ANLEITUNGEN = [
  { id:"streichen", emoji:"🖌️", titel:"Paint Walls", schwierigkeit:"Easy", zeit:"1–2 days", kosten:"30–80€",
    img:"https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=120&q=80",
    werkzeug:["Extension pole","Lambswool roller 12-18mm","Flat brush 5cm","Tesa Precision masking tape","Dust sheet"],
    schritte:["Move/cover furniture, tape over sockets","Fill cracks, sand smooth, vacuum dust","Tape edges with spirit level – press firmly with fingertip","Test colour on cardboard – in daylight AND artificial light!","Apply first coat evenly with roller","Min. 4h drying time, then second coat","Matt paint: peel tape after drying. Latex paint: peel tape WET!","Touch up edges (ceiling, windows) with brush"],
    tipp:"Lambswool roller 12-18mm = best finish with no fluff.",
    fehler:"Too little masking tape, wrong tape removal method, coats too thick.",
    youtube:"https://www.youtube.com/results?search_query=how+to+paint+walls+like+a+pro",
    amazon:amazonLink("lambswool roller extension pole set") },
  { id:"spachteln", emoji:"🔧", titel:"Skim Coat Walls", schwierigkeit:"Medium", zeit:"2–3 days", kosten:"40–120€",
    img:"https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=120&q=80",
    werkzeug:["Wide spatula 40cm","Skim board","120-grit sanding screen","Fibreglass joint tape","Powder filler","Ready-mixed filler"],
    schritte:["Q1 – Joints: press in powder filler, embed joint tape","Q2 – Transitions: pull thin ready-mixed filler with spatula","Q3 – Pore-filling: thin skim coat over entire surface","Fibreglass tape recommended – prevents cracking","After each coat, skim over wet with board","Sand only Q2/Q3 with screen on a flat board","Before painting: apply diluted primer thinly"],
    tipp:"Powder filler for Q1 (stronger), ready-mixed for Q2/Q3 (easier to sand).",
    fehler:"Mixing up Q1 and Q2, applying too thick, skipping sanding.",
    youtube:"https://www.youtube.com/results?search_query=how+to+skim+coat+walls+diy",
    amazon:amazonLink("wide spatula skim coat filler set") },
  { id:"fliesen", emoji:"⬛", titel:"Lay Tiles", schwierigkeit:"Medium", zeit:"2–4 days", kosten:"100–400€",
    img:"https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=120&q=80",
    werkzeug:["8mm notched trowel","Tile levelling system","Tile cutter","Grout","Rubber mallet"],
    schritte:["Room width ÷ tile width – last strip min. ¾ width","Centre of room as starting point","Substrate: flat, dry, load-bearing","Back-buttering: adhesive on floor AND tile","Apply 8mm notched trowel evenly","Lay in 1/3-bond pattern","Use levelling system for large formats","24h drying, then grout"],
    tipp:"Large formats (60×60+) always need back-buttering + levelling system.",
    fehler:"Not checking substrate, forgetting back-buttering.",
    youtube:"https://www.youtube.com/results?search_query=how+to+lay+floor+tiles+diy",
    amazon:amazonLink("tile levelling system notched trowel set") },
  { id:"bad", emoji:"🚿", titel:"Renovate Bathroom Without Demolition", schwierigkeit:"Medium", zeit:"3–5 days", kosten:"200–800€",
    img:"https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=120&q=80",
    werkzeug:["Utility knife","Roller","Silicone gun","Waterproof sealing tape","SMP adhesive"],
    schritte:["Tap test: mark hollow tiles (>20% hollow = demolition needed)","Remove all old silicone + degrease substrate","Seal: bath surround, shower up to 2m height, floor","SMP adhesive: NO dispersion primer underneath","Lay new tiles over old (floor level rises 1–2cm)","Smooth silicone with wet finger + washing-up liquid","Tap replacement: turn off water, use PTFE tape","Finish with lighting, mirror, accessories"],
    tipp:"Silicone + surface update only = 80% less work for the same visual result.",
    fehler:"Forgetting waterproof sealing, silicone on greasy surface, wrong adhesive.",
    youtube:"https://www.youtube.com/results?search_query=bathroom+renovation+without+demolition+diy",
    amazon:amazonLink("bathroom renovation silicone sealing tape kit") },
  { id:"laminat", emoji:"🪵", titel:"Lay Laminate Flooring", schwierigkeit:"Easy", zeit:"1 day", kosten:"15–50€/m²",
    img:"https://images.unsplash.com/photo-1574739782594-db4ead022697?w=120&q=80",
    werkzeug:["Jigsaw","Pull bar","Acoustic underlay","10mm spacers","Rubber mallet"],
    schritte:["Substrate: flat (max. 3mm/2m), dry","Lay underlay across the entire floor","48h acclimatisation – mandatory!","10mm spacers against all walls","Tongue towards wall, align first row carefully","Each row offset by min. 40cm","Measure, cut and press in last row","Screw skirting boards to wall (NEVER to laminate)"],
    tipp:"48h acclimatisation prevents the floor from buckling after laying.",
    fehler:"Forgetting expansion gap, no vapour barrier on concrete.",
    youtube:"https://www.youtube.com/results?search_query=how+to+lay+laminate+flooring+diy",
    amazon:amazonLink("laminate flooring installation kit underlay") },
  { id:"wandpaneele", emoji:"📐", titel:"Wall Panels / Fluted Panels", schwierigkeit:"Easy", zeit:"4–8 hours", kosten:"50–200€",
    img:"https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=120&q=80",
    werkzeug:["Cordless drill","Jigsaw","Panel adhesive","Spirit level","Spacers"],
    schritte:["Wall: straight, dry, wallpaper-free","Panels: 24h acclimatisation","Align first panel with spirit level – this is critical","Adhesive: S-pattern, min. 5cm from edge","Press panel firmly, hold for 2 min.","Offset joints like brickwork","Sockets: cut cardboard template, then jigsaw","Finish edges with profile strip or paint"],
    tipp:"Fluted panels behind bed or sofa – the most searched interior look of 2025.",
    fehler:"Not aligning first panel, using solvent-based adhesive on plastic panels.",
    youtube:"https://www.youtube.com/results?search_query=fluted+wall+panels+diy+install",
    amazon:amazonLink("fluted wall panels MDF living room") },
  { id:"led", emoji:"💡", titel:"Install LED Lighting", schwierigkeit:"Easy", zeit:"2–4 hours", kosten:"30–150€",
    img:"https://images.unsplash.com/photo-1600210492493-0946911123ea?w=120&q=80",
    werkzeug:["WAGO connectors","Side cutters","Voltage tester","24V LED strip","Trailing-edge dimmer"],
    schritte:["Switch off breaker! Verify with voltage tester","Always choose 24V LED strips (safer, no voltage drop)","Use WAGO connectors – never old choc blocks","Degrease surface, use corner connectors at bends","Press and stick strip firmly","Install trailing-edge dimmer (avoids flicker)","Transformer: min. 20% power headroom","Test before covering up or sealing in"],
    tipp:"Indirect LED in a coving strip looks far better than direct spotlights.",
    fehler:"Transformer too weak, kinking the strip, using the wrong dimmer type.",
    youtube:"https://www.youtube.com/results?search_query=led+strip+lights+installation+diy",
    amazon:amazonLink("24v led strip lights wago dimmer kit") },
  { id:"silikon", emoji:"🔲", titel:"Replace Silicone Sealant", schwierigkeit:"Easy", zeit:"2–3 hours", kosten:"10–25€",
    img:"https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=120&q=80",
    werkzeug:["Silicone remover gel","Utility knife","Sanitary silicone (Soudal S100)","Silicone gun","Washing-up liquid"],
    schritte:["Cut out old silicone with utility knife","Loosen residue with silicone remover (leave 15 min.)","Degrease substrate with isopropanol","Apply masking tape either side of the joint","Apply silicone in one smooth continuous pass","Smooth with wet finger + washing-up liquid","Remove tape IMMEDIATELY while silicone is still wet","No water contact for 24h"],
    tipp:"Fill the bath with water before sealing – it holds better when the tub flexes under load.",
    fehler:"Removing tape too late, greasy surface, forgetting anti-fungal silicone.",
    youtube:"https://www.youtube.com/results?search_query=how+to+reseal+bath+silicone+diy",
    amazon:amazonLink("soudal sanitary silicone anti-mould gun") },
  { id:"tapezieren", emoji:"🖼️", titel:"Strip & Hang Wallpaper", schwierigkeit:"Easy", zeit:"1–2 days", kosten:"20–80€",
    img:"https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=120&q=80",
    werkzeug:["Pasting table","Wallpaper brush","Wallpaper paste","Utility knife","Water roller"],
    schritte:["Soak old wallpaper: water + washing-up liquid, wait 15 min.","Peel off in long strips from top to bottom","Wipe off paste residue while wet, allow to dry fully","Measure new wallpaper: room height + 5cm extra","Mix paste, apply to wallpaper back","Book (fold) wallpaper, soak for 5 min.","Apply from top, brush out air bubbles","Trim excess with utility knife along the edge"],
    tipp:"Always hang towards the window light – seams become invisible.",
    fehler:"Too short soaking time, not smoothing out air bubbles, wrong paste type.",
    youtube:"https://www.youtube.com/results?search_query=how+to+hang+wallpaper+beginner",
    amazon:amazonLink("wallpaper paste brush pasting table kit") },
  { id:"fugenreinigen", emoji:"🧹", titel:"Clean & Refresh Tile Grout", schwierigkeit:"Easy", zeit:"2–4 hours", kosten:"15–40€",
    img:"https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=120&q=80",
    werkzeug:["Grout cleaner","Grout brush","Steam cleaner (optional hire)","White grout pen","Sanding block"],
    schritte:["Apply grout cleaner, leave for 10–15 min.","Scrub vigorously with grout brush","Use steam cleaner for stubborn areas","Rinse thoroughly, allow to dry completely","If grey/yellow: apply white grout pen","If fully discoloured: grind out + re-grout","Apply grout sealer spray to finish"],
    tipp:"Hire a steam cleaner instead of buying – most effective tool for a one-off clean.",
    fehler:"Chlorine cleaners on coloured tiles, not letting grout dry fully before sealing.",
    youtube:"https://www.youtube.com/results?search_query=how+to+clean+tile+grout+diy",
    amazon:amazonLink("grout cleaner brush pen white tile set") },
  { id:"kueche-fronten", emoji:"🍳", titel:"Replace Kitchen Cabinet Fronts", schwierigkeit:"Easy", zeit:"1 day", kosten:"200–800€",
    img:"https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=120&q=80",
    werkzeug:["Cordless drill","Crosshead screwdriver","Spirit level","Tape measure","Hinge adjustment tool"],
    schritte:["Remove old fronts: loosen hinges","Transfer hinges to new fronts – measure exact same position","Hang new front, do not tighten yet","Check gap: 2–3mm evenly all around","Adjust hinges in all 3 directions","Only tighten screws when everything lines up","Fit handles: use drilling template"],
    tipp:"Swapping cabinet fronts = half a new kitchen for 10% of the price.",
    fehler:"Incorrectly adjusted hinges, not using a template for handle holes.",
    youtube:"https://www.youtube.com/results?search_query=replace+kitchen+cabinet+doors+diy",
    amazon:amazonLink("kitchen cabinet doors hinge adjustment tool") },
  { id:"trockenbau", emoji:"🔩", titel:"Build a Drywall Partition", schwierigkeit:"Medium", zeit:"1–2 days", kosten:"80–200€",
    img:"https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=120&q=80",
    werkzeug:["Metal profile cutters","Cordless drill","Spirit level + plumb line","Plasterboard sheets","3.5×35mm screws"],
    schritte:["Fix floor tracks (UW) aligned with plumb line and screw down","Attach ceiling tracks parallel","Insert stud profiles (CW) every 62.5cm","Run electrical conduit through studs now","Screw on first plasterboard layer: every 25cm","Insert mineral wool insulation between studs","Board the second side","Fill joints: joint tape + Q1/Q2 filler"],
    tipp:"CW profiles every 62.5cm = perfect grid for standard 125cm-wide boards.",
    fehler:"Wrong stud spacing, no insulation, screws driven too deep.",
    youtube:"https://www.youtube.com/results?search_query=how+to+build+stud+partition+wall+diy",
    amazon:amazonLink("plasterboard stud wall metal profiles kit") },
  { id:"parkett-schleifen", emoji:"🪵", titel:"Sand & Oil Parquet", schwierigkeit:"Medium", zeit:"2–3 days", kosten:"80–300€",
    img:"https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=120&q=80",
    werkzeug:["Belt sander (hire!)","Detail/delta sander for corners","Sandpaper 40/80/120 grit","Natural oil or lacquer","Parquet roller"],
    schritte:["Empty the room, countersink all nails below surface","First pass: coarse 40-grit diagonally across boards","Second pass: 80-grit along the grain","Third pass: 120-grit fine finish","Work into corners with delta sander","Vacuum + damp wipe, allow 2h to dry","Apply oil thinly, working in direction of grain","Second oil coat after 12h"],
    tipp:"Hire a belt sander from the hardware store – 2 days is plenty. Dust mask essential!",
    fehler:"Not countersinking nails, oil coat too thick, missing corners.",
    youtube:"https://www.youtube.com/results?search_query=how+to+sand+and+oil+hardwood+floor+diy",
    amazon:amazonLink("osmo hardwax oil 3032 parquet floor") },
  { id:"fenster-abdichten", emoji:"🪟", titel:"Seal Windows", schwierigkeit:"Easy", zeit:"2–4 hours", kosten:"20–60€",
    img:"https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=120&q=80",
    werkzeug:["Self-adhesive foam seal strip","Acrylic frame sealant","Sealant gun","Utility knife","Isopropanol"],
    schritte:["Check existing seals: press in – does it spring back? If not: replace","Pull old rubber seal out of the groove","Press in new foam rubber seal","Check outer frame joint: has acrylic cracked?","Remove old outer sealant, clean substrate","Apply fresh acrylic, smooth off, overpaint after 2h","Inner gap: press in compriband sealing tape"],
    tipp:"Window seals last 10–15 years. €5 cost, saves around 15% on heating bills.",
    fehler:"Wrong seal size, applying acrylic to a greasy substrate.",
    youtube:"https://www.youtube.com/results?search_query=how+to+draught+proof+windows+diy",
    amazon:amazonLink("window draught seal foam strip acrylic sealant") },
  { id:"duschkabine", emoji:"🚿", titel:"Install a Shower Enclosure", schwierigkeit:"Medium", zeit:"1 day", kosten:"150–600€",
    img:"https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=120&q=80",
    werkzeug:["Spirit level","Cordless drill","Rawlplugs + screws","Sanitary silicone","Hacksaw"],
    schritte:["Sort all parts according to the instructions first","Install shower tray: adjust feet until perfectly level","Connect drain, test for leaks before going further","Mark wall profile vertically with spirit level, drill and plug","Hang glass panels into profiles","Seal all joints with sanitary silicone","Hang doors, check opening mechanism","Allow 24h to cure, then do a full water test"],
    tipp:"Always fill the shower tray with water BEFORE sealing – it holds better under load.",
    fehler:"Tray not perfectly level, drain not tested, silicone applied to wet surface.",
    youtube:"https://www.youtube.com/results?search_query=how+to+install+shower+enclosure+diy",
    amazon:amazonLink("shower enclosure sealing tape sanitary silicone") },
  { id:"aussenputz", emoji:"🧱", titel:"Repair Exterior Render Cracks", schwierigkeit:"Medium", zeit:"1 day", kosten:"30–100€",
    img:"https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=120&q=80",
    werkzeug:["Angle grinder with cutting disc","Plastering trowel","Exterior repair compound","Fibreglass mesh tape","Bonding primer"],
    schritte:["Widen crack: cut V-shape with angle grinder (improves adhesion)","Remove loose render, brush clean","Apply bonding primer, leave 30 min.","Press fibreglass mesh tape into crack","Apply repair compound in two coats","Press in first coat, dry 2h","Smooth second coat flush with surface","Apply exterior masonry paint after 24h"],
    tipp:"Cracks >3mm must always be widened first. A patched crack will reopen after the first winter.",
    fehler:"Not widening the crack, skipping fibreglass mesh, not matching the colour.",
    youtube:"https://www.youtube.com/results?search_query=how+to+repair+exterior+render+cracks",
    amazon:amazonLink("exterior render repair compound fibreglass mesh") },
  { id:"parkett", emoji:"🪵", titel:"Lay Engineered Parquet & Vinyl", schwierigkeit:"Medium", zeit:"1–2 days", kosten:"150–600€",
    img:"https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=120&q=80",
    werkzeug:["Jigsaw","Rubber mallet","Pull bar","10mm spacers","Spirit level"],
    schritte:["48h acclimatisation – leave packets open, flat in the room","Check substrate: max. 3mm deviation – otherwise use self-levelling compound","Lay underlay, overlap joints by 15cm","First row: 10mm spacers against ALL walls – always!","Click system: angle in then press down","Direction: lengthways to window = room looks larger","Push in last row with pull bar","Glue skirting to wall – NEVER screw or nail to the floor"],
    tipp:"SPC vinyl = 100% waterproof, perfect for bathrooms and kitchens. Laminate for dry rooms only.",
    fehler:"Forgetting expansion gap, walking on floor too early (wait 24h), not undercutting door frames.",
    youtube:"https://www.youtube.com/results?search_query=how+to+lay+engineered+wood+flooring+diy",
    amazon:amazonLink("spc vinyl click flooring installation kit") },
  { id:"kueche-fronten-lackieren", emoji:"🍳", titel:"Paint Kitchen Cabinet Fronts", schwierigkeit:"Medium", zeit:"2–3 days", kosten:"80–300€",
    img:"https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=120&q=80",
    werkzeug:["Orbital sander P120/180","Zinsser BIN primer","Satin wood paint","4mm foam roller","Masking tape","Screwdriver"],
    schritte:["Remove fronts and number them on the back","Degrease thoroughly with acetone – the most important step!","Sand with P120 for key, vacuum all dust","Apply thin coat of primer, dry 2h","1st colour coat with foam roller (short pile = no texture)","Dry 4h, sand lightly with P180","2nd and 3rd colour coats with 4h drying between each","Rehang fronts, adjust hinges"],
    tipp:"Zinsser BIN primer bonds to almost anything – even smooth MDF without heavy sanding.",
    fehler:"Coats too thick = runs. Skipping degreasing = paint peels off in weeks.",
    youtube:"https://www.youtube.com/results?search_query=how+to+paint+kitchen+cabinet+doors+diy",
    amazon:amazonLink("zinsser bin primer kitchen cabinet paint foam roller") },
  { id:"led-strip", emoji:"💡", titel:"LED Strip & Cove Lighting", schwierigkeit:"Easy", zeit:"2–4 hours", kosten:"30–120€",
    img:"https://images.unsplash.com/photo-1600210492493-0946911123ea?w=120&q=80",
    werkzeug:["24V COB LED strip","Transformer (20% headroom)","WAGO connectors","Aluminium profile + diffuser","Utility knife"],
    schritte:["Measure length, calculate total wattage (W/m × metres)","Choose transformer: min. 20% more capacity than total watts","Cut and mount aluminium profile with tape or screws","Only cut strip AT the marked cutting points!","Insert strip into profile, clip diffuser on","Connect with WAGO connectors (no soldering required)","Connect trailing-edge dimmer (eliminates flickering)","Test everything before gluing permanently"],
    tipp:"24V = no voltage drop. At 12V over 3m the light becomes uneven at the ends.",
    fehler:"Leading-edge dimmer = flickering. Transformer too weak = overheats. Strip connected backwards.",
    youtube:"https://www.youtube.com/results?search_query=led+strip+cove+lighting+install+diy",
    amazon:amazonLink("led strip 24v cob warm white 2700k driver dimmer") },
  { id:"rigips-wand", emoji:"🏗️", titel:"Build a Plasterboard Partition Wall", schwierigkeit:"Medium", zeit:"2–3 days", kosten:"200–600€",
    img:"https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=120&q=80",
    werkzeug:["Cordless drill","Metal profile cutters","1m spirit level","Plasterboard screws 3.5×35mm","Filling spatula"],
    schritte:["Mark floor plan on floor, transfer to ceiling with spirit level","Fix UW tracks to floor + ceiling with plugs every 50cm","CW studs every 62.5cm – perfect grid for 125cm boards!","Run electrical conduit BEFORE boarding","First side: screw every 25cm, countersink head 0.5mm","Insert mineral wool (stone wool for sound insulation)","Second side – stagger board joints!","Embed joint filler + fibreglass tape, dry, sand flush"],
    tipp:"In bathrooms: use GKFI moisture-resistant board (green) – standard GKB swells up!",
    fehler:"Wrong stud spacing, forgetting fibreglass tape = crack within 6 months.",
    youtube:"https://www.youtube.com/results?search_query=how+to+build+plasterboard+stud+wall+diy",
    amazon:amazonLink("plasterboard stud wall cw uw metal profiles kit") },
  { id:"wpc-terrasse", emoji:"🌴", titel:"Lay WPC Composite Decking", schwierigkeit:"Medium", zeit:"1–2 days", kosten:"500–2.000€",
    img:"https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=120&q=80",
    werkzeug:["Circular saw or jigsaw","Cordless drill","Spirit level","Adjustable height pedestals","5mm spacers"],
    schritte:["Clean substrate – existing surface can stay if stable","Set pedestals every 50cm, check alignment with string line","Plan 2% fall (away from the house)","Joists on pedestals – wood or aluminium every 40–50cm","First board with 10mm gap from wall","Insert hidden clips – no visible screw hole!","Cut last row to width","Fit end profiles on all edges"],
    tipp:"Acclimatise WPC for 48h. In summer WPC expands – always leave expansion gaps!",
    fehler:"Too little fall = puddles, no expansion gap = boards buckle in summer.",
    youtube:"https://www.youtube.com/results?search_query=how+to+lay+composite+decking+diy",
    amazon:amazonLink("composite decking terrace pedestals hidden clip kit") },
  { id:"arbeitsplatte", emoji:"🔨", titel:"Replace Kitchen Worktop", schwierigkeit:"Medium", zeit:"1 day", kosten:"100–500€",
    img:"https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=120&q=80",
    werkzeug:["Jigsaw with wood blade","Router for clean cutouts","Silicone gun","Construction adhesive","Tape measure"],
    schritte:["Turn off water supply to sink, disconnect trap","Loosen old worktop from below (screws in corner brackets)","Cut new worktop to size – leave 1mm oversize","Mark sink cutout using template","Jigsaw: drill entry hole first, then cut towards the bevelled edge","Seal cut edges IMMEDIATELY – otherwise they swell!","Lower worktop in, screw from below","Silicone at wall and sink edge, leave 24h to cure"],
    tipp:"Never leave a cut edge untreated – it will definitely swell and delaminate.",
    fehler:"Cutout too large, edge not sealed, silicone loaded too early.",
    youtube:"https://www.youtube.com/results?search_query=how+to+replace+kitchen+worktop+diy",
    amazon:amazonLink("solid wood worktop kitchen oak oiled") },
  { id:"abdichtung-bad", emoji:"🛡️", titel:"Waterproof a Shower & Bath", schwierigkeit:"Medium", zeit:"2 days", kosten:"80–200€",
    img:"https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=120&q=80",
    werkzeug:["Tanking slurry (Mapei Mapelastic)","Sealing tape + pipe collars","10cm brush","Notched trowel","Latex gloves"],
    schritte:["Clean substrate: no dust, no grease","Apply 1st coat of tanking slurry thinly","Embed sealing tape in ALL corners while 1st coat is still wet!","Embed pipe collars around all pipe penetrations","Let 1st coat dry: minimum 4h (overnight is better)","2nd coat at 90° to first – cross-pattern prevents cracking","24h drying before any tile work","Test with spray bottle: no dampness showing through"],
    tipp:"Embedding the tape means it must sink into the wet first coat. Just brushing over the top is not enough!",
    fehler:"Only one coat, tape not embedded, drying time rushed = leaking within a year.",
    youtube:"https://www.youtube.com/results?search_query=how+to+waterproof+shower+bathroom+diy",
    amazon:amazonLink("mapei mapelastic tanking slurry bathroom shower kit") },
  { id:"bodengleiche-dusche", emoji:"🚿", titel:"Build a Level-Access Shower", schwierigkeit:"Hard", zeit:"3–5 days", kosten:"500–2.000€",
    img:"https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=120&q=80",
    werkzeug:["Linear drain or point drain","Fall screed kit","2-coat tanking slurry","C2 flexible tile adhesive","1m spirit level"],
    schritte:["Position drain: as far from shower head as possible","Mix fall screed: 1.5–2% fall towards drain","Apply screed, check fall (spirit level + measuring)","48h drying, tap test: no hollow sound!","2-coat waterproofing with sealing tape in all corners","Tile with C2 flex adhesive – maintain the fall","Schlüter KERDI profile at shower/bathroom transition","Edge joint: ONLY silicone (Soudal S100) – never grout!"],
    tipp:"Water test: pour water on and watch – must drain away completely with no standing puddles.",
    fehler:"Too little fall, no sealing tape in corners, wrong adhesive.",
    youtube:"https://www.youtube.com/results?search_query=how+to+build+wet+room+level+access+shower",
    amazon:amazonLink("level access shower drain fall screed kit") },
  { id:"fliesenspiegel-bekleben", emoji:"🎨", titel:"Apply Adhesive Film to Tiles", schwierigkeit:"Easy", zeit:"2–4 hours", kosten:"30–100€",
    img:"https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=120&q=80",
    werkzeug:["Adhesive film (d-c-fix or Oracal)","Utility knife + steel ruler","Rubber squeegee","Isopropanol","Hair dryer"],
    schritte:["Degrease with isopropanol – let dry completely","Measure film + 3cm extra","Peel backing paper 10cm, align edge","Squeegee from top downwards – no bubbles!","Cut overlaps at grout lines","Bubbles: prick with needle, warm with hair dryer, press out","Warm corners with hair dryer for better adhesion","Sockets: cut X-shape, fold corners back"],
    tipp:"A drop of washing-up liquid in water lets you reposition film on smooth surfaces.",
    fehler:"Surface not degreased = peeling, pulled too tight = wrinkles.",
    youtube:"https://www.youtube.com/results?search_query=how+to+apply+adhesive+film+tiles+kitchen",
    amazon:amazonLink("adhesive film self-adhesive tiles furniture dc-fix") },
];

// ─── ONBOARDING ───────────────────────────────────────────────────────────────
const ONBOARDING_STEPS = [
  {
    icon: "✨",
    title: "AI Makeover",
    desc: "Upload a photo of your room. The AI shows you in 20 seconds what it could look like after renovation.",
    tab: "makeover",
    color: C.accent,
  },
  {
    icon: "💬",
    title: "Renovation Expert",
    desc: "Ask the AI chat anything: costs, materials, step-by-step guides. Like an experienced contractor on demand.",
    tab: "chat",
    color: "#2A6DB5",
  },
  {
    icon: "📋",
    title: "16 Pro Guides",
    desc: "From resealing to microcement – check off every step as you work. Your progress is saved automatically.",
    tab: "anleit",
    color: C.green,
  },
  {
    icon: "🔨",
    title: "Pros Near You",
    desc: "If you'd rather hire a contractor: find verified tradespeople directly in the app.",
    tab: "profis",
    color: "#8B4513",
  },
];

function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const current = ONBOARDING_STEPS[step];
  const isLast = step === ONBOARDING_STEPS.length - 1;

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:1000, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <div className="fu" style={{ background:C.card, borderRadius:"24px 24px 0 0", padding:"28px 24px 40px", width:"100%", maxWidth:600 }}>
        {/* Progress dots */}
        <div style={{ display:"flex", justifyContent:"center", gap:8, marginBottom:24 }}>
          {ONBOARDING_STEPS.map((_, i) => (
            <div key={i} style={{ width: i===step?24:8, height:8, borderRadius:4, background:i===step?current.color:C.border, transition:"all 0.3s" }} />
          ))}
        </div>

        {/* Icon */}
        <div style={{ width:72, height:72, borderRadius:20, background:current.color+"22", border:`2px solid ${current.color}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, margin:"0 auto 20px" }}>
          {current.icon}
        </div>

        {/* Content */}
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:24, textAlign:"center", color:C.text, marginBottom:12 }}>
          {current.title}
        </h2>
        <p style={{ fontSize:15, color:C.text, textAlign:"center", lineHeight:1.7, marginBottom:28, opacity:0.8 }}>
          {current.desc}
        </p>

        {/* Buttons */}
        <div style={{ display:"flex", gap:10 }}>
          {!isLast && (
            <button onClick={onDone} style={{ flex:1, padding:"12px", borderRadius:50, border:`1px solid ${C.border}`, background:"none", color:C.muted, fontSize:14, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
              Skip
            </button>
          )}
          <button onClick={() => isLast ? onDone() : setStep(s => s+1)} style={{ flex:2, padding:"14px", borderRadius:50, background:current.color, color:"white", border:"none", fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
            {isLast ? "Let's go! 🚀" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ANLEITUNGEN TAB (mit localStorage) ──────────────────────────────────────
function AnleitungenTab({ lang = "de" }) {
  const [offen, setOpen] = useState(null);
  const [erledigt, setDone] = useState({});

  // Fortschritt laden
  useEffect(() => {
    try {
      const saved = localStorage.getItem("mystorija_anleitungen");
      if (saved) setDone(JSON.parse(saved));
    } catch {}
  }, []);

  // Fortschritt speichern
  const toggleStep = (key) => {
    setDone(prev => {
      const next = { ...prev, [key]: !prev[key] };
      try { localStorage.setItem("mystorija_anleitungen", JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const totalsteps = ANLEITUNGEN.reduce((s, a) => s + a.schritte.length, 0);
  const totalDone = Object.values(erledigt).filter(Boolean).length;
  const pct = Math.round((totalDone / totalsteps) * 100);
  return (
    <div style={{ overflowY:"auto", height:"100%", padding:"14px 16px" }}>
      {/* Gesamtfortschritt */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"14px 16px", marginBottom:14, boxShadow:"0 1px 6px rgba(0,0,0,.04)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <div>
            <p style={{ fontSize:14, fontWeight:700, color:C.text }}>Your Progress</p>
            <p style={{ fontSize:11, color:C.muted, marginTop:2 }}>{totalDone} von {totalsteps} stepsn erledigt</p>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:20, fontWeight:700, color:C.accent }}>{pct}%</span>
            {totalDone > 0 && (
              <button onClick={() => {
                setDone({});
                try { localStorage.removeItem("mystorija_anleitungen"); } catch {}
              }} style={{ fontSize:11, color:C.muted, background:"none", border:`1px solid ${C.border}`, borderRadius:20, padding:"3px 8px", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                Reset
              </button>
            )}
          </div>
        </div>
        <div style={{ height:8, background:C.border, borderRadius:4, overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${pct}%`, background:`linear-gradient(to right, ${C.accent}, #E8855A)`, borderRadius:4, transition:"width 0.4s" }} />
        </div>
        {pct === 100 && (
          <p style={{ fontSize:12, color:C.green, fontWeight:600, marginTop:8, textAlign:"center" }}>🎉 All guides completed – you're a pro!</p>
        )}
      </div>

      <p style={{ fontSize:12, color:C.muted, marginBottom:14, fontStyle:"italic" }}>
        Tap a guide → check off steps as you work. Progress is saved.
      </p>
      {ANLEITUNGEN.map(a => {
        const done = a.schritte.filter((_,i) => erledigt[`${a.id}-${i}`]).length;
        const isOpen = offen === a.id;
        return (
          <div key={a.id} style={{ background:C.card, borderRadius:14, marginBottom:10, border:`1px solid ${isOpen ? C.accent+"66" : C.border}`, boxShadow:isOpen?`0 2px 16px ${C.accent}18`:"0 1px 4px rgba(0,0,0,.04)", overflow:"hidden" }}>
            <button onClick={() => setOpen(isOpen ? null : a.id)} style={{ width:"100%", padding:"13px 14px", background:"transparent", border:"none", display:"flex", alignItems:"center", gap:12, cursor:"pointer" }}>
              <div style={{ width:52, height:52, borderRadius:10, overflow:"hidden", flexShrink:0, border:`1px solid ${C.border}` }}>
                <img src={a.img} alt={a.titel} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
              </div>
              <div style={{ flex:1, textAlign:"left" }}>
                <div style={{ fontSize:15, color:C.text, fontWeight:600 }}>{a.emoji} {a.titel}</div>
                <div style={{ display:"flex", gap:7, marginTop:5, flexWrap:"wrap" }}>
                  <Pill bg={a.schwierigkeit==="Leicht"?C.greenBg:C.accentBg} color={a.schwierigkeit==="Leicht"?C.green:C.accent}>{a.schwierigkeit}</Pill>
                  <Pill bg="#EBF2FA" color="#2A6DB5">⏱ {a.zeit}</Pill>
                  <Pill bg={C.greenBg} color={C.green}>💶 {a.kosten}</Pill>
                </div>
              </div>
              {done > 0 && <div style={{ fontSize:12, color:C.green, fontWeight:600, flexShrink:0 }}>{done}/{a.schritte.length}</div>}
              <span style={{ fontSize:20, color:C.muted, transform:isOpen?"rotate(90deg)":"none", transition:"transform .2s", flexShrink:0 }}>›</span>
            </button>
            {isOpen && (
              <div style={{ padding:"0 14px 16px" }}>
                <div style={{ background:C.accentBg, border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 13px", marginBottom:14 }}>
                  <div style={{ fontSize:11, color:C.accent, fontWeight:600, marginBottom:8, textTransform:"uppercase", letterSpacing:.5 }}>🔨 Werkzeug & Material</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                    {a.werkzeug.map(w => <span key={w} style={{ fontSize:12, padding:"3px 10px", background:C.card, color:C.text, borderRadius:20, border:`1px solid ${C.border}` }}>{w}</span>)}
                  </div>
                </div>
                <div style={{ fontSize:11, color:C.accent, fontWeight:600, marginBottom:10, textTransform:"uppercase", letterSpacing:.5 }}>📋 Step by Step</div>
                {a.schritte.map((s, idx) => {
                  const key = `${a.id}-${idx}`, d = erledigt[key];
                  return (
                    <div key={idx} onClick={() => toggleSchritt(`${a.id}-${idx}`)} style={{ display:"flex", gap:10, padding:"9px 11px", borderRadius:9, marginBottom:4, cursor:"pointer", background:d?C.greenBg:C.accentBg+"44", border:`1px solid ${d?C.green+"44":C.border}` }}>
                      <div style={{ width:24, height:24, borderRadius:"50%", flexShrink:0, border:`2px solid ${d?C.green:C.border}`, background:d?C.green:"transparent", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, color:d?"#fff":C.muted, fontWeight:700 }}>{d?"✓":idx+1}</div>
                      <span style={{ fontSize:13, color:d?C.muted:C.text, textDecoration:d?"line-through":"none", lineHeight:1.5 }}>{s}</span>
                    </div>
                  );
                })}
                <div style={{ background:C.accentBg, border:`1px solid ${C.accent}33`, borderRadius:10, padding:"11px 13px", marginTop:10 }}>
                  <div style={{ fontSize:11, color:C.accent, fontWeight:600, marginBottom:4 }}>💡 Profi-Tipp</div>
                  <p style={{ fontSize:13, color:C.text, lineHeight:1.6 }}>{a.tipp}</p>
                </div>
                <div style={{ background:"#FDEEEC", border:"1px solid #F5D0D0", borderRadius:10, padding:"11px 13px", marginTop:8 }}>
                  <div style={{ fontSize:11, color:"#C0392B", fontWeight:600, marginBottom:4 }}>⚠️ Common Mistakes</div>
                  <p style={{ fontSize:13, color:C.muted, lineHeight:1.6 }}>{a.fehler}</p>
                </div>
                <div style={{ display:"flex", gap:8, marginTop:10 }}>
                  <a href={a.youtube} target="_blank" rel="noopener noreferrer" style={{ flex:1, textAlign:"center", padding:"9px", borderRadius:9, background:"#FDEEEC", color:"#C0392B", fontSize:12, textDecoration:"none", fontWeight:600, border:"1px solid #F5D0D033" }}>▶ Video</a>
                  <a href={a.amazon?.amzn || a.amazon} target="_blank" rel="noopener noreferrer" style={{ flex:1, textAlign:"center", padding:"9px", borderRadius:9, background:"#FFF8E7", color:"#B7791F", fontSize:12, textDecoration:"none", fontWeight:600, border:"1px solid #F6E05E44" }}>Amazon</a>
                  <a href={a.amazon?.obi} target="_blank" rel="noopener noreferrer" style={{ flex:1, textAlign:"center", padding:"9px", borderRadius:9, background:"#EBFAF0", color:"#276749", fontSize:12, textDecoration:"none", fontWeight:600, border:"1px solid #C6F6D544" }}>OBI</a>
                  <a href={a.amazon?.hb} target="_blank" rel="noopener noreferrer" style={{ flex:1, textAlign:"center", padding:"9px", borderRadius:9, background:C.accentBg, color:C.accent, fontSize:12, textDecoration:"none", fontWeight:600, border:`1px solid ${C.accent}33` }}>Hornbach</a>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}


// ─── OFFLINE EXPERT SYSTEM ───────────────────────────────────────────────────
function getRenovierungsAntwort(text, hasImage) {
  const t = text.toLowerCase();
  if (hasImage) return "Great photo! 📸\n\nI can see your room. Here are my initial thoughts:\n\n🔍 **What I recommend:**\n\n1. **Quick upgrade (under €50):** New handles, fresh sealant, LED light – small changes, big impact.\n\n2. **Mid-range project (under €300):** Paint walls, vinyl flooring over old tiles, replace mirror.\n\n3. **Full upgrade (under €1,000):** Microcement, new fixtures, suspended ceiling with LED.\n\n💡 Tell me what you'd like to change – floor, walls, ceiling or decor – and I'll give you a concrete plan!";
  if (t.match(/hello|hi|hey/)) return "Hey! 👋 Great to have you here!\n\nI'm Mystorija – your DIY renovation expert.\n\n**How can I help you?**\n\n🚿 Renovate bathroom\n🍳 Upgrade kitchen\n🛋️ Style living room\n🛏️ Transform bedroom\n🌿 Terrace/balcony\n\nUpload a photo or tell me which room you want to renovate!";
  if (t.match(/silicone|sealant|grout|mold/)) return "Replacing sealant – one of the cheapest and most effective upgrades! 🛠️\n\n**What you need:**\n• Bathroom silicone with mold protection: Soudal or Ottoseal (~€8)\n• Silicone remover (~€5)\n• Utility knife\n• Smoothing tool or damp finger\n\n**Step by step:**\n1. Score old silicone with utility knife\n2. Apply silicone remover, wait 30 min\n3. Remove residue, degrease surface\n4. Apply masking tape left and right\n5. Apply silicone evenly\n6. Smooth with damp finger\n7. Remove tape immediately, let dry 24h\n\n⏱️ Time: 2 hours\n💰 Cost: ~€15\n⭐ Difficulty: Beginner";
  if (t.match(/vinyl|laminate|floor|click/)) return "Laying flooring – you can do this yourself! 💪\n\n**SPC Vinyl (for bathroom & kitchen):**\n• 100% waterproof, can go over old tiles\n• Cost: €15–25/m² at OBI/Bauhaus\n• No glue needed – click system\n\n**Step by step:**\n1. Check subfloor – max. 3mm unevenness\n2. Lay foam underlay\n3. First row with 10mm gap from wall\n4. Snap rows together one by one\n5. Cut last row to size\n6. Glue skirting boards\n\n⏱️ Time: 1 day for 20m²\n💰 Cost: from €15/m²\n⭐ Difficulty: Beginner";
  if (t.match(/bathroom|shower|toilet|basin|sink/)) return "Renovate bathroom – here's my plan! 🚿\n\n**Budget €50–150 (quick upgrades):**\n• Replace all sealant (Soudal bathroom silicone)\n• LED mirror with IP44: Emke on Amazon from €80\n• Matte black accessories set: ~€40\n\n**Budget €150–500:**\n• Swap fixtures to matte black\n• SPC vinyl over old tiles\n• Add storage above toilet\n\n**Budget €500–2,000:**\n• Microcement over tiles (no breaking needed!)\n• Install walk-in shower\n• Full basin replacement\n\n⚠️ Important: Always use bathroom silicone with mold protection! IP44 rating required for lights!";
  if (t.match(/kitchen|cabinet|countertop|handles|fronts/)) return "Upgrade kitchen – great investment! 🍳\n\n🔩 **Replace handles (30 min, €30–80)**\n→ 128mm bar handle matte black on Amazon.\n\n🎨 **Wrap fronts in foil (1–2 days, €80–200)**\n→ Adhesive film in wood/concrete/marble look. Reversible for rental!\n→ Important: degrease with acetone first!\n\n🖌️ **Paint fronts (2–3 days, €100–300)**\n→ Sand (P120) → primer → 3× satin lacquer\n→ RAL 7044 silk grey or RAL 5011 navy = trend 2025\n\n💡 LED strip under wall units: €20–60, 2700K warm!";
  if (t.match(/living room|wall paint|accent wall|color|paint/)) return "Paint a wall – easiest upgrade with biggest impact! 🎨\n\n**The accent wall:**\nPaint just ONE wall dark → instantly different room!\n\n**Current trend colors 2025:**\n• Dark green (RAL 6009)\n• Navy blue (RAL 5011)\n• Anthracite (RAL 7016)\n• Terracotta (RAL 3012)\n\n**Step by step:**\n1. Tape wall (Tesa Precision!)\n2. Test patch 30×30cm – let dry!\n3. Apply primer\n4. 2 coats of paint (18cm roller)\n5. Remove tape while damp\n\n💰 Cost: €30–60 · ⏱️ Time: 1 day";
  if (t.match(/light|lamp|led|lighting|bright|dark|atmosphere/)) return "Lighting – the biggest mood maker! 💡\n\n**The most important rule:**\n2700K = warm = living room/bedroom/bathroom\n4000K = neutral = kitchen/home office\n6000K = cold = NEVER in living areas!\n\n**Affordable upgrades:**\n• LED strips behind TV: €20–50\n• LED strip under kitchen cabinets: €20–60\n• Bedside lamps instead of ceiling light: €40–120\n\n**Bathroom:**\n⚠️ IP44 required! Always check packaging!\n\n💡 Install dimmer: €15–30 at OBI – worth it everywhere!";
  if (t.match(/rental|tenant|landlord|allowed/)) return "Renovating a rental – what's allowed? 🔑\n\n**Allowed without permission:**\n✓ Painting (paint back when you leave)\n✓ Furniture, mounting shelves\n✓ Adhesive film on tiles/fronts (reversible!)\n✓ Replace handles (keep originals!)\n✓ LED mirror (plug-in connection)\n✓ Click flooring without glue\n\n**NEVER without permission:**\n❌ Fixed electrical installations\n❌ Removing load-bearing walls\n❌ Gas pipes\n\n💡 Keep all original materials!";
  return "Great question! 💪 As your renovation expert I'm happy to help.\n\nTell me more:\n• **Which room** do you want to renovate?\n• **What bothers you** most?\n• **What's your budget** roughly?\n\nOr upload a photo – then I can see directly what's possible!";
}

// ─── AFFILIATE Renderer ───────────────────────────────────────────────────────
function ShopLinks({ text, fullBlock }) {
  // Parse markdown links from this line OR fullBlock
  const src = fullBlock || text;
  const links = [];
  const regex = /\[([^\]]+)\]\((https?:[^)]+)\)/g;
  let m;
  while ((m = regex.exec(src)) !== null) {
    links.push({ label: m[1], url: m[2] });
  }
  if (links.length === 0) return null;

  const COLORS = {
    'Amazon':   { bg:'#FFF8E7', color:'#B7791F' },
    'OBI':      { bg:'#E8F5E9', color:'#2E7D32' },
    'Bauhaus':  { bg:'#E3F2FD', color:'#1565C0' },
    'Hornbach': { bg:C.accentBg, color:C.accent },
  };

  return (
    <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginTop:4 }}>
      {links.map((l, i) => {
        const col = COLORS[l.label] || { bg:C.tag, color:C.muted };
        return (
          <a key={i} href={l.url} target="_blank" rel="noopener noreferrer"
            style={{ fontSize:10, fontWeight:700, padding:'3px 9px', borderRadius:20,
              background:col.bg, color:col.color, textDecoration:'none', border:`1px solid ${col.color}22` }}>
            {l.label} →
          </a>
        );
      })}
    </div>
  );
}

function BoldText({ text }) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return <span>{parts.map((part, j) => j % 2 === 1 ? <strong key={j} style={{ color:C.text, fontWeight:700 }}>{part}</strong> : <span key={j}>{part}</span>)}</span>;
}

function renderMaterialien(text) {
  if (!text) return null;
  const lines = text.split("\n").filter(l => l.trim());
  const pairs = [];

  // Paare bilden: Textzeile + folgende Link-Zeile
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith('[') && line.includes('](http')) continue; // Link-Zeile ueberspringen
    const nextLine = lines[i + 1] || "";
    const linkLine = nextLine.trim().startsWith('[') && nextLine.includes('](http') ? nextLine : "";
    pairs.push({ text: line, links: linkLine });
  }

  if (pairs.length === 0) return null;
  return (
    <>
      {pairs.map((p, i) => (
        <div key={i} style={{ padding:"9px 0", borderBottom:`1px solid ${C.border}` }}>
          <p style={{ fontSize:13, color:C.text, lineHeight:1.6, marginBottom:4 }}>
            <BoldText text={p.text} />
          </p>
          {p.links ? (
            <ShopLinks text={p.text} fullBlock={p.links} />
          ) : (
            <ShopLinks text={p.text} />
          )}
        </div>
      ))}
      <p style={{ fontSize:11, color:C.muted, marginTop:8, fontStyle:"italic" }}>
        💾 Save → Links im Planer klickbar
      </p>
      <Analytics />
    </>
  );
}

// ─── STILE FUeR MAKEOVER ───────────────────────────────────────────────────────
const STILE_MAKEOVER = [
  { id:"bad-modern",    emoji:"🚿", label:"Bad: Modern & Spa" },
  { id:"bad-warm",      emoji:"🚿", label:"Bad: Hell & Warm" },
  { id:"bad-mikro",     emoji:"🚿", label:"Bad: Mikrozement" },
  { id:"kueche-navy",   emoji:"🍳", label:"Kitchen: Navy & Wood" },
  { id:"kueche-grau",   emoji:"🍳", label:"Kitchen: Silk Grey" },
  { id:"kueche-gruen",  emoji:"🍳", label:"Kitchen: Sage Green" },
  { id:"wohn-gruen",    emoji:"🛋️", label:"Living Room: Green" },
  { id:"wohn-terra",    emoji:"🛋️", label:"Living Room: Terracotta" },
  { id:"schlaf-terra",  emoji:"🛏️", label:"Schlafzimmer: Terrakotta" },
  { id:"schlaf-dunkel", emoji:"🛏️", label:"Schlafzimmer: Dunkel" },
  { id:"terrasse-wpc",  emoji:"🌿", label:"Terrasse: WPC & Lounge" },
];

function compressImageFile(file) {
  return new Promise(function(resolve) {
    var img = new Image();
    img.onload = function() {
      var canvas = document.createElement("canvas");
      var max = 1024, w = img.width, h = img.height;
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

// ─── TIPPS BOX ────────────────────────────────────────────────────────────────
function TippsBox() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("tipps"); // "tipps" | "vorlage"

  const TIPPS = [
    { icon:"🔄", titel:"Objekte ersetzen", gut:"Keine Badewanne, dafuer eine Walk-In Dusche mit Regendusche", schlecht:"Dusche", erklaerung:"Sag was weg soll UND was kommen soll. 'Dafuer', 'stattdessen', 'anstatt' helfen der KI." },
    { icon:"🎨", titel:"Farben & Materialien", gut:"Anthrazit-Feinsteinzeug 80x80cm, weisse Fugen, Eichenholz-Waschtisch", schlecht:"Andere Farben", erklaerung:"Nenne konkrete Farbnamen und Materialien: Anthrazit, Navy, Terrakotta, Marmor, Eiche, Mikrozement, Zellige." },
    { icon:"🌿", titel:"Terrasse & Aussen", gut:"Fuege Grill hinzu, Pergola mit Rankpflanzen, Olivenbaum in Terrakotta-Topf, Lichterketten", schlecht:"Schoener machen", erklaerung:"Fuer Terrassen: Moebel, Pflanzen, Beleuchtung und Bodenbelag separat nennen. Je mehr Details, desto besser." },
    { icon:"💡", titel:"Stil beschreiben", gut:"Modernes Spa-Bad mit indirektem Licht, mattschwarz Armaturen, Holzakzente", schlecht:"Modern", erklaerung:"Stile: Modern, Skandinavisch, Industrial, Japandi, Mediterran, Luxus, Minimalist, Rustikal." },
    { icon:"📐", titel:"Mehreres kombinieren", gut:"Dunkle Fliesen, keine Badewanne dafuer Dusche, schwarze Armaturen, Wandnische", schlecht:"Alles neu", erklaerung:"Mehrere Aenderungen mit Komma trennen – die KI arbeitet alle ab." },
    { icon:"⚠️", titel:"Was KI schwer kann", gut:"Darker tiles, Farbe aendern, Moebel hinzufuegen", schlecht:"Waende verschieben, Fenster vergroessern", erklaerung:"Farben, Materialien & Moebel hinzufuegen klappt gut. Strukturelle Aenderungen (Waende, Fenster) sind KI-schwierig." },
  ];

  const VORLAGEN = [
    {
      raum: "🚿 Bathroom", beispiel: "No bathtub, instead a walk-in shower with rain head. Dark anthracite tiles 80x80cm, matte black fixtures, floating oak vanity, LED mirror.",
    },
    {
      raum: "🍳 Kitchen", beispiel: "Navy blue fronts, brass handles, open oak shelves instead of wall cabinets, white zellige tile backsplash, LED strip under wall units.",
    },
    {
      raum: "🛋️ Living Room", beispiel: "Dark green accent wall behind sofa, warm indirect ceiling light, fluted wood panels behind TV, bouclé sofa, terracotta vases.",
    },
    {
      raum: "🌿 Terrace", beispiel: "Large outdoor tiles 60x60cm grey, lounge sofa with cream outdoor cushions, dining table with white chairs, pergola with climbing plants, olive tree in terracotta pot, string lights, grill at the back right.",
    },
    {
      raum: "🏡 Modern Terrace", beispiel: "WPC decking in teak look, modular lounge set, wooden slat privacy screen, built-in outdoor kitchen with grill, large terracotta pots with lavender and olive tree, solar string lights 2200K.",
    },
  ];

  return (
    <div style={{ marginTop:8 }}>
      <button onClick={() => setOpen(o => !o)} style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", cursor:"pointer", padding:0, fontFamily:"'DM Sans',sans-serif" }}>
        <span style={{ fontSize:12, color:C.accent, fontWeight:600 }}>💡 Tips & Templates for better results</span>
        <span style={{ fontSize:12, color:C.muted, transform:open?"rotate(90deg)":"none", transition:"0.2s", display:"inline-block" }}>›</span>
      </button>

      {open && (
        <div className="fu" style={{ marginTop:10, background:C.accentBg, border:`1px solid ${C.accent}33`, borderRadius:12, overflow:"hidden" }}>
          {/* Tab-Switcher */}
          <div style={{ display:"flex", borderBottom:`1px solid ${C.accent}33` }}>
            {[["tipps","💡 Tipps"],["vorlage","📋 Vorlagen"]].map(([id,label]) => (
              <button key={id} onClick={() => setTab(id)} style={{ flex:1, padding:"9px", background:tab===id?"white":"transparent", border:"none", borderBottom:`2px solid ${tab===id?C.accent:"transparent"}`, color:tab===id?C.accent:C.muted, fontSize:12, fontWeight:tab===id?700:400, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>{label}</button>
            ))}
          </div>

          {tab === "tipps" && (
            <div style={{ padding:"12px", display:"flex", flexDirection:"column", gap:10 }}>
              <p style={{ fontSize:12, fontWeight:700, color:C.accent }}>How to get the best AI makeovers:</p>
              {TIPPS.map((t, i) => (
                <div key={i} style={{ background:"white", borderRadius:10, padding:"11px 13px" }}>
                  <p style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:6 }}>{t.icon} {t.titel}</p>
                  <div style={{ display:"flex", gap:6, alignItems:"flex-start", marginBottom:5 }}>
                    <span style={{ fontSize:10, background:C.greenBg, color:C.green, padding:"2px 7px", borderRadius:20, fontWeight:700, flexShrink:0, marginTop:1 }}>✓</span>
                    <span style={{ fontSize:12, color:C.text, lineHeight:1.4 }}>"{t.gut}"</span>
                  </div>
                  <div style={{ display:"flex", gap:6, alignItems:"flex-start", marginBottom:6 }}>
                    <span style={{ fontSize:10, background:"#FEF2F2", color:"#B91C1C", padding:"2px 7px", borderRadius:20, fontWeight:700, flexShrink:0, marginTop:1 }}>✗</span>
                    <span style={{ fontSize:12, color:C.muted, lineHeight:1.4 }}>"{t.schlecht}"</span>
                  </div>
                  <p style={{ fontSize:11, color:C.muted, lineHeight:1.5, borderTop:`1px solid ${C.border}`, paddingTop:6 }}>{t.erklaerung}</p>
                </div>
              ))}
            </div>
          )}

          {tab === "vorlage" && (
            <div style={{ padding:"12px", display:"flex", flexDirection:"column", gap:8 }}>
              <p style={{ fontSize:12, fontWeight:700, color:C.accent, marginBottom:4 }}>Tippe auf eine Vorlage um sie zu verwenden:</p>
              {VORLAGEN.map((v, i) => (
                <div key={i} style={{ background:"white", borderRadius:10, padding:"11px 13px", cursor:"pointer", border:`1px solid ${C.border}` }}
                  onClick={() => {
                    // Find parent MakeoverTab's setWunsch via a custom event
                    window.dispatchEvent(new CustomEvent("mystorija_set_wunsch", { detail: v.beispiel }));
                    setOpen(false);
                  }}>
                  <p style={{ fontSize:13, fontWeight:700, color:C.accent, marginBottom:5 }}>{v.raum}</p>
                  <p style={{ fontSize:12, color:C.text, lineHeight:1.55 }}>"{v.beispiel}"</p>
                  <p style={{ fontSize:11, color:C.green, marginTop:6, fontWeight:600 }}>↑ Tippen zum Einfuegen</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── MAKEOVER TAB (aus altem Chat – vollstaendig) ──────────────────────────────
function MakeoverTab({ lang = "de", onSaveToPlaner, savedMakeovers, plan, canGenerate, freeUsed, onNeedUpgrade, onGenerated }) {
  var fileRef = useRef();
  const [file, setFile] = useState(null);
  const [vorherUrl, setVorherUrl] = useState(null);
  const [nachherUrl, setNachherUrl] = useState(null);
  const [materials, setMaterials] = useState(null);
  const [stil, setStil] = useState("bad-modern");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [wunsch, setWunsch] = useState("");
  
  const [saved, setSaved] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewingHistory, setViewingHistory] = useState(null);
  const [isObjReplace, setIsObjReplace] = useState(false);
  const [nachherBase64, setNachherBase64] = useState(null); // gespeicherte base64 fuer Refinement
  const [laenge, setLaenge] = useState("");
  const [breite, setWidth] = useState("");
  const [hoehe, setHoehe] = useState("");

  // Vorlage aus TippsBox einfuegen
  useEffect(() => {
    const handler = (e) => setWunsch(e.detail);
    window.addEventListener("mystorija_set_wunsch", handler);
    return () => window.removeEventListener("mystorija_set_wunsch", handler);
  }, []);
  const [makoverAnalyse, setMakoverAnalyse] = useState(null);
  const [makoverAnalyseLoading, setMakoverAnalyseLoading] = useState(false);
  const [refining, setRefining] = useState(false);
  const [refinementInput, setRefinementInput] = useState("");
  const [refinementHistory, setRefinementHistory] = useState([]);

  // Monatliches Limit tracken
  const LIMITS = { free: 0, basic: 50, pro: Infinity };
  const currentLimit = LIMITS[plan] ?? LIMITS.free;
  const isFreeBlocked = !plan || plan === "free";

  function getMonthlyUsage() {
    try {
      const key = `mystorija_usage_${new Date().getFullYear()}_${new Date().getMonth()}`;
      return parseInt(localStorage.getItem(key) || "0");
    } catch { return 0; }
  }

  function incrementMonthlyUsage() {
    try {
      const key = `mystorija_usage_${new Date().getFullYear()}_${new Date().getMonth()}`;
      localStorage.setItem(key, String(getMonthlyUsage() + 1));
    } catch {}
  }

  const monthlyUsage = getMonthlyUsage();
  const isLimitReached = monthlyUsage >= currentLimit;

  function handleDatei(e) {
    const f = e.target.files[0]; if (!f) return;
    setFile(f); setVorherUrl(URL.createObjectURL(f));
    setNachherUrl(null); setMaterials(null); setError(null); setSaved(false); setViewingHistory(null);
  }

  async function refineMakeover() {
    if (!refinementInput.trim() || !nachherUrl) return;
    const instruction = refinementInput;
    setRefinementInput("");
    setRefining(true);
    setRefinementHistory(prev => [...prev, { url: nachherUrl, instruction }]);

    try {
      const base64 = nachherBase64;
      if (!base64) {
        setError("Bild nicht mehr verfuegbar – bitte neu generieren.");
        setRefining(false);
        return;
      }

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64,
          style: stil,
          chatContext: instruction,
          plan: plan||"free",
          dimensions: (laenge && breite) ? { laenge, breite, hoehe: hoehe||"2.4" } : null,
        }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Server error ${res.status}: ${txt.slice(0, 100)}`);
      }
      const data = await res.json();

      if (data.imageUrl) {
        setNachherUrl(data.imageUrl);
        if (data.materials) setMaterials(data.materials);
        setSaved(false);
        // Base64 direkt vom Server speichern
        setNachherBase64(data.imageBase64 || null);
      } else {
        setError(data.error || "Error while refining.");
      }
    } catch (err) {
      setError(err.message);
    }
    setRefining(false);
  }

  function generieren() {
    if (!file) return;
    if (isFreeBlocked) {
      if (onNeedUpgrade) onNeedUpgrade();
      return;
    }
    if (isLimitReached && plan !== "pro") {
      setError(`Monthly limit reached (${currentLimit} Makeovers). Upgrade to Pro for unlimited generations.`);
      if (onNeedUpgrade) onNeedUpgrade();
      return;
    }
    setViewingHistory(null); setLoading(true); setNachherUrl(null); setMaterials(null);
    setError(null); setProgress(0); setSaved(false); setNachherBase64(null);
    const timer = setInterval(() => setProgress(p => p < 85 ? p + 2 : p), 600);

    (async () => {
      try {
        const base64 = await compressImageFile(file);
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: base64,
            style: stil,
            chatContext: wunsch||null,
            plan: plan||"free",
            dimensions: (laenge && breite) ? { laenge, breite, hoehe: hoehe||"2.4" } : null,
          }),
        });
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`Server error ${res.status}: ${txt.slice(0, 100)}`);
        }
        const data = await res.json();
        clearInterval(timer);
        if (data.error) { setError(data.error); setLoading(false); return; }
        setProgress(100);
        setNachherUrl(data.imageUrl);
        setMaterials(data.materials || null);
        setIsObjReplace(!!data.isObjectReplacement);
        setLoading(false);
        if (onGenerated) onGenerated();
        // Base64 direkt vom Server (kein CORS-Problem)
        setNachherBase64(data.imageBase64 || null);
        incrementMonthlyUsage(); // Monatszaehler erhoehen
        // Automatisch analysieren was generiert wurde
        if (data.imageBase64) {
          setMakoverAnalyse(null);
          setMakoverAnalyseLoading(true);
          fetch("/api/analyse", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64: data.imageBase64, mimeType: "image/jpeg" }),
          }).then(r => r.json()).then(d => {
            if (d.analysis) setMakoverAnalyse(d.analysis);
          }).catch(() => {}).finally(() => setMakoverAnalyseLoading(false));
        }
      } catch (err) {
        clearInterval(timer);
        setError(err.message);
        setLoading(false);
      }
    })();
  }

  function handleSaveToPlaner() {
    if (!nachherUrl) return;
    const m = {
      id: Date.now(),
      date: new Date().toLocaleDateString("de-DE"),
      time: new Date().toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"}),
      titel: wunsch ? wunsch.slice(0,40) : (makoverAnalyse?.stil || "Makeover"),
      vorherUrl, imgUrl: nachherUrl,
      materials: makoverAnalyse
        ? buildMaterialsFromAnalyse(makoverAnalyse)  // KI-erkannte Materialien bevorzugen
        : materials,
      wunsch,
      analyse: makoverAnalyse || null,  // komplette Analyse speichern
    };
    onSaveToPlaner(m); setSaved(true);
  }

  // KI-Analyse in Materialien-Text umwandeln fuer Shopping list
  function buildMaterialsFromAnalyse(analyse) {
    if (!analyse?.materialien?.length) return materials;
    return analyse.materialien.map(mat => {
      const amazonLink = mat.amazon
        ? ` [Amazon →](https://www.amazon.de/s?k=${encodeURIComponent(mat.amazon)}&tag=mystorija-21)`
        : "";
      const preis = mat.preis ? ` · Ca. ${mat.preis}` : "";
      return `🪨 **${mat.material}** – ${mat.bereich}${mat.farbe ? `, ${mat.farbe}` : ""}${preis}.${amazonLink}`;
    }).join("\n");
  }

  function neuesMakeover() {
    setFile(null); setVorherUrl(null); setNachherUrl(null); setMaterials(null);
    setError(null); setSaved(false); setWunsch(""); setViewingHistory(null);
    setMakoverAnalyse(null); setMakoverAnalyseLoading(false); setRefinementHistory([]);
  }

  return (
    <div style={{ display:"flex", height:"100%", overflow:"hidden" }}>
      {/* Sidebar */}
      {sidebarOpen && (
        <div style={{ width:220, borderRight:`1px solid ${C.border}`, background:C.card, overflowY:"auto", flexShrink:0, display:"flex", flexDirection:"column" }}>
          <div style={{ padding:"12px 12px 8px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <p style={{ fontSize:13, fontWeight:700, color:C.text }}>My Makeovers</p>
            <button onClick={() => setSidebarOpen(false)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:16, color:C.muted }}>✕</button>
          </div>
          <button onClick={() => { neuesMakeover(); setSidebarOpen(false); }} style={{ margin:"8px", padding:"8px 12px", borderRadius:8, background:C.accent, color:"white", border:"none", cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>+ New Makeover</button>
          <div style={{ flex:1, overflowY:"auto", padding:"0 8px 8px" }}>
            {(!savedMakeovers||savedMakeovers.length===0) ? (
              <p style={{ fontSize:12, color:C.muted, textAlign:"center", padding:"20px 8px" }}>No saved makeovers yet</p>
            ) : savedMakeovers.map(m => (
              <div key={m.id} onClick={() => { setViewingHistory(m); setSidebarOpen(false); }} style={{ borderRadius:8, overflow:"hidden", marginBottom:8, cursor:"pointer", border:`2px solid ${viewingHistory?.id===m.id?C.accent:C.border}`, background:C.bg }}>
                {m.imgUrl && <img src={m.imgUrl} alt="" style={{ width:"100%", height:70, objectFit:"cover", display:"block" }} />}
                <div style={{ padding:"6px 8px" }}>
                  <p style={{ fontSize:11, fontWeight:600, color:C.text }}>{m.titel}</p>
                  <p style={{ fontSize:10, color:C.muted }}>{m.date} {m.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main */}
      <div style={{ flex:1, overflowY:"auto", padding:"14px 16px 40px" }}>
        {/* Top Bar */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
          <div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:20 }}>KI Makeover</h2>
            {plan !== "pro" && (
              <p style={{ fontSize:11, fontWeight:600, marginTop:2, color: isFreeBlocked ? "#B91C1C" : isLimitReached ? "#B91C1C" : C.muted }}>
                {isFreeBlocked ? "🔒 Basic plan required" : isLimitReached ? "🔒 Limit reached" : `${monthlyUsage} / ${currentLimit} this month`}
              </p>
            )}
          </div>
          <div style={{ display:"flex", gap:8 }}>
            {(nachherUrl||viewingHistory) && <button onClick={neuesMakeover} style={{ padding:"7px 14px", borderRadius:20, border:`1px solid ${C.border}`, background:C.card, cursor:"pointer", fontSize:12, fontWeight:600, color:C.text, fontFamily:"'DM Sans',sans-serif" }}>+ Neu</button>}
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ padding:"7px 14px", borderRadius:20, background:sidebarOpen?C.accent:C.card, color:sidebarOpen?"white":C.text, border:`1px solid ${sidebarOpen?C.accent:C.border}`, cursor:"pointer", fontSize:12, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>
              {savedMakeovers?.length > 0 ? `${savedMakeovers.length} saved` : "History"}
            </button>
          </div>
        </div>

        {viewingHistory ? (
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14, padding:"10px 14px", background:C.accentBg, borderRadius:10 }}>
              <span style={{ fontSize:13, fontWeight:600, color:C.accent }}>{viewingHistory.titel}</span>
              <span style={{ fontSize:12, color:C.muted }}>{viewingHistory.date}</span>
            </div>
            {viewingHistory.vorherUrl && <div style={{ marginBottom:10 }}><p style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:1, marginBottom:6 }}>Before</p><img src={viewingHistory.vorherUrl} alt="Before" style={{ width:"100%", borderRadius:12, maxHeight:200, objectFit:"cover" }} /></div>}
            <p style={{ fontSize:11, fontWeight:700, color:C.accent, textTransform:"uppercase", letterSpacing:1, marginBottom:6 }}>After</p>
            <div style={{ borderRadius:14, overflow:"hidden", marginBottom:12, boxShadow:"0 6px 24px rgba(0,0,0,0.1)" }}>
              <img src={viewingHistory.imgUrl} alt="After" style={{ width:"100%", display:"block" }} />
            </div>
            {viewingHistory.materials && (
              <div style={{ background:C.accentBg, border:`1px solid #F0C4A0`, borderRadius:12, padding:"14px" }}>
                <p style={{ fontWeight:700, fontSize:13, color:C.accent, marginBottom:8 }}>{T["en"].materials}</p>
                <div>{renderMaterialien(viewingHistory.materials)}</div>
                <p style={{ fontSize:10, color:C.muted, marginTop:6 }}>* Affiliate links – no extra cost to you</p>
              </div>
            )}
          </div>
        ) : (
          <div>
            {/* Masse */}
            <div style={{ marginBottom:14 }}>
              <p style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:8 }}>📐 Room dimensions <span style={{ fontSize:11, fontWeight:400, color:C.muted }}>(optional, improves result)</span></p>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:11, color:C.muted, marginBottom:4 }}>Length</p>
                  <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                    <input
                      value={laenge} onChange={e => setLaenge(e.target.value.replace(/[^0-9.,]/g,""))}
                      placeholder="3,5" type="text" inputMode="decimal"
                      style={{ width:"100%", padding:"8px 10px", borderRadius:9, border:`1.5px solid ${laenge?C.accent:C.border}`, fontSize:14, fontFamily:"'DM Sans',sans-serif", background:C.bg, textAlign:"center" }}
                    />
                    <span style={{ fontSize:12, color:C.muted, flexShrink:0 }}>m</span>
                  </div>
                </div>
                <span style={{ fontSize:18, color:C.muted, marginTop:16 }}>×</span>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:11, color:C.muted, marginBottom:4 }}>Width</p>
                  <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                    <input
                      value={breite} onChange={e => setWidth(e.target.value.replace(/[^0-9.,]/g,""))}
                      placeholder="2,2" type="text" inputMode="decimal"
                      style={{ width:"100%", padding:"8px 10px", borderRadius:9, border:`1.5px solid ${breite?C.accent:C.border}`, fontSize:14, fontFamily:"'DM Sans',sans-serif", background:C.bg, textAlign:"center" }}
                    />
                    <span style={{ fontSize:12, color:C.muted, flexShrink:0 }}>m</span>
                  </div>
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:11, color:C.muted, marginBottom:4 }}>Height</p>
                  <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                    <input
                      value={hoehe} onChange={e => setHoehe(e.target.value.replace(/[^0-9.,]/g,""))}
                      placeholder="2,4" type="text" inputMode="decimal"
                      style={{ width:"100%", padding:"8px 10px", borderRadius:9, border:`1.5px solid ${hoehe?C.accent:C.border}`, fontSize:14, fontFamily:"'DM Sans',sans-serif", background:C.bg, textAlign:"center" }}
                    />
                    <span style={{ fontSize:12, color:C.muted, flexShrink:0 }}>m</span>
                  </div>
                </div>
              </div>
              {laenge && breite && (
                <p style={{ fontSize:11, color:C.green, marginTop:5, fontWeight:600 }}>
                  ✓ {(parseFloat(laenge.replace(",",".")) * parseFloat(breite.replace(",","."))).toFixed(1)} m² – passed to AI
                </p>
              )}
            </div>

            {/* Beschreibung */}
            <div style={{ marginBottom:14 }}>
              <p style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:8 }}>✏️ What should change? <span style={{ fontSize:11, fontWeight:400, color:C.muted }}>(optional)</span></p>
              <textarea
                value={wunsch}
                onChange={e => setWunsch(e.target.value)}
                placeholder="e.g. No bathtub, add walk-in shower, dark tiles, modern style..."
                rows={3}
                style={{ width:"100%", border:`1.5px solid ${wunsch?C.accent:C.border}`, borderRadius:12, padding:"10px 13px", fontSize:13, resize:"none", fontFamily:"'DM Sans',sans-serif", background:C.bg, lineHeight:1.6 }}
              />
              {/* Tipps ausklappbar */}
              <TippsBox />
            </div>

            {/* Upload */}
            <div onClick={() => fileRef.current.click()} style={{ border:`2px dashed ${vorherUrl?C.accent:C.border}`, borderRadius:16, overflow:"hidden", padding:vorherUrl?0:"32px 20px", textAlign:"center", cursor:"pointer", background:vorherUrl?"transparent":C.card, marginBottom:12 }}>
              {vorherUrl ? <img src={vorherUrl} alt="Vorher" style={{ width:"100%", display:"block", maxHeight:260, objectFit:"cover" }} /> :
                <div><p style={{ fontSize:36, marginBottom:8 }}>📷</p><p style={{ fontWeight:600, fontSize:15, color:C.text, marginBottom:4 }}>Upload photo</p><p style={{ fontSize:13, color:C.muted }}>Bathroom, kitchen, living room...</p></div>}
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleDatei} />

            {vorherUrl && (
              <>

                {plan === "pro" && (
                  <div style={{ background:C.greenBg, border:`1px solid ${C.green}33`, borderRadius:10, padding:"6px 12px", marginBottom:8, display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ fontSize:12 }}>⭐</span>
                    <p style={{ fontSize:12, color:C.green, fontWeight:600 }}>Pro: Flux Pro model active – higher image quality</p>
                  </div>
                )}
                <button onClick={generieren} disabled={loading} style={{ width:"100%", padding:15, marginBottom:12, background:loading?"#DDD":isFreeBlocked?"#2A1A0E":"linear-gradient(135deg, #C4622D, #A0522D)", color:loading?"#999":"white", border:"none", borderRadius:50, fontSize:15, fontWeight:700, cursor:loading?"default":"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                  {loading ? T["en"].generating : isFreeBlocked ? T["en"].freePlan : T["en"].generateBtn}
                </button>
              </>
            )}

            {loading && (
              <div style={{ marginBottom:14 }}>
                <div style={{ height:5, background:C.border, borderRadius:3, overflow:"hidden", marginBottom:6 }}>
                  <div style={{ height:"100%", width:`${progress}%`, background:C.accent, borderRadius:3, transition:"width 0.6s" }} />
                </div>
                <p style={{ fontSize:12, color:C.muted, textAlign:"center" }}>
                  {progress<40?"Analyzing photo...":progress<80?"AI generating makeover...":"Almost done..."}
                </p>
              </div>
            )}

            {error && <div style={{ background:"#FFF5F5", border:"1px solid #F5D0D0", borderRadius:12, padding:"12px 14px", marginBottom:14 }}><p style={{ fontSize:13, color:"#B91C1C", fontWeight:600 }}>Error</p><p style={{ fontSize:12, color:"#7F1D1D", marginTop:4 }}>{error}</p></div>}

            {nachherUrl && (
              <div>
                {/* Refinement History */}
                {refinementHistory.length > 0 && (
                  <div style={{ marginBottom:10 }}>
                    <p style={{ fontSize:11, color:C.muted, marginBottom:6, fontStyle:"italic" }}>Refinement history:</p>
                    <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:4 }}>
                      {refinementHistory.map((h, i) => (
                        <div key={i} onClick={() => { setNachherUrl(h.url); setSaved(false); }} style={{ flexShrink:0, cursor:"pointer", borderRadius:8, overflow:"hidden", border:`2px solid ${C.border}`, width:70 }}>
                          <img src={h.url} alt="" style={{ width:"100%", height:52, objectFit:"cover", display:"block" }} />
                          <div style={{ padding:"2px 4px", background:C.bg, fontSize:9, color:C.muted, lineHeight:1.3 }}>{i+1}: {h.instruction.slice(0,15)}…</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Generated Image */}
                <div style={{ borderRadius:14, overflow:"hidden", marginBottom:10, boxShadow:"0 6px 24px rgba(0,0,0,0.1)", position:"relative" }}>
                  <img src={nachherUrl} alt="Nachher" style={{ width:"100%", display:"block", opacity:refining?0.5:1, transition:"opacity 0.3s" }} />
                  {refining && (
                    <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:10 }}>
                      <LoadingSpinner size={36} />
                      <p style={{ fontSize:13, color:C.text, fontWeight:600, background:"rgba(255,255,255,0.9)", padding:"4px 12px", borderRadius:20 }}>Refining image…</p>
                    </div>
                  )}
                </div>

                {/* Hinweis bei Objekt-Austausch */}
                {isObjReplace && (
                  <div style={{ background:"#FFF8E1", border:"1px solid #FFD54F", borderRadius:10, padding:"10px 13px", marginBottom:10, display:"flex", gap:8 }}>
                    <span style={{ fontSize:16, flexShrink:0 }}>💡</span>
                    <div>
                      <p style={{ fontSize:12, fontWeight:700, color:"#E65100", marginBottom:2 }}>Object replacement is challenging for AI</p>
                      <p style={{ fontSize:11, color:"#7A4100", lineHeight:1.5 }}>AI image generators can change materials & colors well, but replacing furniture/fixtures exactly is harder. If the result doesn't look right: style changes (color, tiles, lighting) work better. Pressing "New" multiple times can help.</p>
                    </div>
                  </div>
                )}

                {/* ── KI-Analyse des generierten Bildes ── */}
                {makoverAnalyseLoading && (
                  <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"14px 16px", marginBottom:10, display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ display:"flex", gap:4 }}>
                      {[0,1,2].map(j => <div key={j} style={{ width:7, height:7, borderRadius:"50%", background:C.accent, animation:`blink 1.2s ease ${j*0.2}s infinite` }} />)}
                    </div>
                    <p style={{ fontSize:13, color:C.muted }}>AI analyzing materials used…</p>
                  </div>
                )}

                {makoverAnalyse && !makoverAnalyseLoading && (
                  <div className="fu" style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, marginBottom:10, overflow:"hidden" }}>
                    {/* Header */}
                    <div style={{ padding:"12px 14px", background:`linear-gradient(135deg, ${C.accent}18, ${C.accentBg})`, borderBottom:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div>
                        <p style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:700, color:C.text }}>{makoverAnalyse.stil}</p>
                        <p style={{ fontSize:11, color:C.muted, marginTop:2 }}>{makoverAnalyse.stimmung?.split(".")[0]}.</p>
                      </div>
                      {/* Farbpalette */}
                      <div style={{ display:"flex", gap:4 }}>
                        {makoverAnalyse.farben?.slice(0,4).map((f,i) => (
                          <div key={i} style={{ width:18, height:18, borderRadius:4, background:f, border:"1.5px solid rgba(0,0,0,0.1)" }} title={f} />
                        ))}
                      </div>
                    </div>

                    {/* Materialien */}
                    <div style={{ padding:"10px 14px 6px" }}>
                      <p style={{ fontSize:12, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:0.5, marginBottom:8 }}>Detected Materials & Furniture</p>
                      {makoverAnalyse.materialien?.map((mat, i) => (
                        <div key={i} style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 0", borderBottom:i<makoverAnalyse.materialien.length-1?`1px solid ${C.border}`:"none" }}>
                          <span style={{ fontSize:10, background:C.tag, color:C.muted, padding:"2px 7px", borderRadius:20, flexShrink:0, whiteSpace:"nowrap" }}>{mat.bereich}</span>
                          <div style={{ flex:1, minWidth:0 }}>
                            <p style={{ fontSize:13, fontWeight:600, color:C.text }}>{mat.material}</p>
                            {mat.farbe && <p style={{ fontSize:11, color:C.muted }}>{mat.farbe}{mat.preis ? ` · ${mat.preis}` : ""}</p>}
                          </div>
                          {mat.amazon && (
                            <a href={`https://www.amazon.de/s?k=${encodeURIComponent(mat.amazon)}&tag=${AFFILIATE_TAG}`} target="_blank" rel="noopener noreferrer"
                              style={{ flexShrink:0, background:C.greenBg, color:C.green, borderRadius:20, padding:"4px 10px", fontSize:11, textDecoration:"none", fontWeight:700 }}>
                              🛒
                            </a>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Sofort-Upgrades */}
                    {makoverAnalyse.sofort_upgrades?.length > 0 && (
                      <div style={{ padding:"10px 14px 12px", borderTop:`1px solid ${C.border}`, background:C.greenBg }}>
                        <p style={{ fontSize:12, fontWeight:700, color:C.green, marginBottom:6 }}>💡 Guenstiger Einstieg</p>
                        {makoverAnalyse.sofort_upgrades.slice(0,2).map((up,i) => (
                          <p key={i} style={{ fontSize:12, color:"#1A4731", lineHeight:1.5, marginBottom:i<1?4:0 }}>• {up}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Refinement Chat ── */}
                <div style={{ background:C.accentBg, border:`1px solid ${C.accent}44`, borderRadius:14, padding:"12px 14px", marginBottom:10 }}>
                  <p style={{ fontSize:12, fontWeight:700, color:C.accent, marginBottom:8 }}>{T["en"].refineTitle}</p>
                  <div style={{ display:"flex", gap:8 }}>
                    <input
                      value={refinementInput}
                      onChange={e => setRefinementInput(e.target.value)}
                      onKeyDown={e => { if(e.key==="Enter") refineMakeover(); }}
                      placeholder="z.B. Darker tiles machen, Spiegel hinzufuegen…"
                      style={{ flex:1, padding:"9px 13px", borderRadius:10, border:`1px solid ${C.border}`, fontSize:13, fontFamily:"'DM Sans',sans-serif", background:"white" }}
                    />
                    <button onClick={refineMakeover} disabled={refining||!refinementInput.trim()} style={{ padding:"9px 16px", borderRadius:10, background:refining||!refinementInput.trim()?C.border:C.accent, color:"white", border:"none", cursor:"pointer", fontWeight:700, fontSize:14, flexShrink:0 }}>
                      {refining ? <LoadingSpinner size={16} /> : "→"}
                    </button>
                  </div>
                  {/* Quick suggestions */}
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:8 }}>
                    {["Darker tiles", "Warmer light", "Lighter color", "Add wood", "Larger mirror", "Black fixtures"].map(s => (
                      <button key={s} onClick={() => setRefinementInput(s)} style={{ padding:"4px 10px", borderRadius:20, border:`1px solid ${C.accent}44`, background:"white", color:C.accent, fontSize:11, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>{s}</button>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display:"flex", gap:8, marginBottom:10 }}>
                  <button onClick={() => { setNachherUrl(null); setMaterials(null); setRefinementHistory([]); generieren(); }} style={{ flex:1, padding:11, background:C.card, border:`2px solid ${C.border}`, borderRadius:50, fontSize:13, fontWeight:600, cursor:"pointer", color:C.text, fontFamily:"'DM Sans',sans-serif" }}>🔄 New</button>
                  <a href={nachherUrl} download="makeover.jpg" target="_blank" rel="noreferrer" style={{ flex:1, padding:11, background:C.accent, borderRadius:50, fontSize:13, fontWeight:600, color:"white", textDecoration:"none", textAlign:"center", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans',sans-serif" }}>💾 Save</a>
                </div>

                {materials && (
                  <div style={{ background:C.accentBg, border:"1px solid #F0C4A0", borderRadius:12, padding:"14px" }}>
                    <p style={{ fontWeight:700, fontSize:13, color:C.accent, marginBottom:8 }}>{T["en"].materials}</p>
                    <div style={{ marginBottom:12 }}>{renderMaterialien(materials)}</div>
                    <p style={{ fontSize:10, color:C.muted, marginBottom:10 }}>* Affiliate links – no extra cost to you</p>
                    <div style={{ display:"flex", gap:8 }}>
                      <button onClick={handleSaveToPlaner} style={{ flex:1, padding:"11px", borderRadius:50, background:saved?"#4ade80":"linear-gradient(135deg, #1a1a2e, #2d2d4e)", color:"white", border:"none", cursor:saved?"default":"pointer", fontSize:12, fontWeight:700, fontFamily:"'DM Sans',sans-serif" }}>
                        {saved ? T["en"].savedBtn : T["en"].saveBtn}
                      </button>
                      <button onClick={handleSaveToPlaner} style={{ flex:2, padding:"11px", borderRadius:50, background:saved?"#4ade80":C.accent, color:"white", border:"none", cursor:saved?"default":"pointer", fontSize:12, fontWeight:700, fontFamily:"'DM Sans',sans-serif" }}>
                        {saved?T["en"].plannerSaved:"Save to Planner"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CHAT TAB ─────────────────────────────────────────────────────────────────
function renderChatText(text) {
  return text.split("\n").map((line, i) => {
    if (!line.trim()) return <div key={i} style={{ height: 5 }} />;
    const parts = [];
    let rest = line, key = 0;
    const pattern = /(\*\*(.+?)\*\*|\[([^\]]+)\]\((https?:\/\/[^)]+)\))/g;
    let last = 0, m;
    pattern.lastIndex = 0;
    while ((m = pattern.exec(rest)) !== null) {
      if (m.index > last) parts.push(<span key={key++}>{rest.slice(last, m.index)}</span>);
      if (m[2]) parts.push(<strong key={key++} style={{ fontWeight: 700 }}>{m[2]}</strong>);
      else if (m[3] && m[4]) parts.push(<a key={key++} href={m[4]} target="_blank" rel="noopener noreferrer" style={{ color: C.accent, textDecoration: "underline", textDecorationStyle: "dotted" }}>{m[3]}</a>);
      last = m.index + m[0].length;
    }
    if (last < rest.length) parts.push(<span key={key++}>{rest.slice(last)}</span>);
    const isBullet = line.startsWith("• ") || line.startsWith("- ");
    if (isBullet) return <div key={i} style={{ display: "flex", gap: 6, marginBottom: 2 }}><span style={{ flexShrink: 0, marginTop: 1 }}>•</span><span>{parts}</span></div>;
    return <div key={i} style={{ marginBottom: 2 }}>{parts}</div>;
  });
}

function ChatTab({ lang = "de", messages, setMessages }) {
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [imgFile, setImgFile] = useState(null);
  const [imgPreview, setImgPreview] = useState(null);
  const bottomRef = useRef(null);
  const fileRef = useRef(null);
  const textRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const SUGGESTIONS = [
    "How to renovate my bathroom on a budget?",
    "Best wall color for living room 2026?",
    "How to install SPC vinyl flooring myself?",
    "How much does a kitchen renovation cost?",
    "How to install LED lighting?",
    "Can you tile over existing tiles?",
    "How to apply microcement yourself?",
    "How to paint kitchen cabinet fronts step by step?",
  ];

  async function sendMessage(textOverride, imgOverride, mimeOverride) {
    const text = textOverride ?? inputText;
    const img = imgOverride ?? imgPreview;
    if (!text.trim() && !img) return;

    const userMsg = {
      role: "user",
      text: text.trim() || "Analyze this image.",
      img: img || null,
      imgBase64: img || null,
      mimeType: mimeOverride || (imgFile?.type) || "image/jpeg",
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setImgFile(null);
    setImgPreview(null);
    setLoading(true);

    // Build full conversation for API
    const allMsgs = [...messages, userMsg];
    const apiMessages = allMsgs.map(m => ({
      role: m.role,
      content: m.role === "assistant" ? (m.text || "") : (m.text || ""),
      ...(m.imgBase64 && m.imgBase64 !== "[Foto]" ? { imgBase64: m.imgBase64, mimeType: m.mimeType } : {}),
    }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", text: data.reply || "Keine Antwort erhalten." }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", text: "❌ Verbindungsfehler. Bitte erneut versuchen." }]);
    }
    setLoading(false);
  }

  function onFile(e) {
    const f = e.target.files[0]; if (!f) return;
    setImgFile(f);
    const r = new FileReader();
    r.onload = ev => {
      setImgPreview(ev.target.result);
      // Auto send with the image
      sendMessage("Please analyze this photo of my room.", ev.target.result, f.type);
    };
    r.readAsDataURL(f);
  }

  function clearChat() {
    setMessages([{
      role: "assistant",
      text: "Chat cleared. 👋 How can I help you?\n\nAsk me a question or upload a **photo** of your room – I'll analyze it instantly!",
    }]);
  }

  const isEmpty = messages.length <= 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", background: C.bg }}>

      {/* Header */}
      <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, background: C.accent, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🔨</div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Mystorija Experte</p>
            <p style={{ fontSize: 11, color: C.green }}>● Online – AI-powered</p>
          </div>
        </div>
        <button onClick={clearChat} style={{ fontSize: 12, color: C.muted, background: "none", border: `1px solid ${C.border}`, borderRadius: 20, padding: "4px 10px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
          🗑 Clear
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>

        {/* Welcome + Suggestions when chat is empty */}
        {isEmpty && (
          <div className="fu" style={{ marginBottom: 20 }}>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "16px 18px", marginBottom: 14, boxShadow: "0 2px 12px rgba(0,0,0,.04)" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ width: 32, height: 32, background: C.accent, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>🔨</div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>Mystorija</p>
                  <p style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>
                    Hey! 👋 I'm your personal renovation expert – ask me anything about bathrooms, kitchens, living rooms, flooring, lighting and more.<br /><br />
                    I'll give you <strong>concrete answers</strong> with product names, prices and step-by-step guides. Or upload a 📷 photo and I'll analyze your room instantly!
                  </p>
                </div>
              </div>
            </div>
            <p style={{ fontSize: 12, color: C.muted, marginBottom: 8, fontStyle: "italic" }}>Common questions:</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => sendMessage(s)} style={{ padding: "7px 13px", borderRadius: 20, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", textAlign: "left", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.slice(isEmpty ? 0 : 0).map((msg, i) => (
          <div key={i} className="fu" style={{ marginBottom: 16, display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
            {msg.role === "assistant" && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                <div style={{ width: 24, height: 24, background: C.accent, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 }}>🔨</div>
                <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>Mystorija</span>
              </div>
            )}
            {/* Show uploaded image above message */}
            {msg.img && msg.img !== "[Foto]" && (
              <img src={msg.img} alt="" style={{ maxWidth: 240, borderRadius: 12, marginBottom: 6, boxShadow: "0 2px 12px rgba(0,0,0,.1)", border: `2px solid ${C.accent}` }} />
            )}
            {msg.img === "[Foto]" && (
              <div style={{ maxWidth: 240, borderRadius: 12, marginBottom: 6, background: C.tag, border: `1px solid ${C.border}`, padding: "6px 10px", fontSize: 11, color: C.muted }}>📷 Photo sent</div>
            )}
            <div style={{
              maxWidth: "90%",
              padding: "11px 15px",
              borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "4px 18px 18px 18px",
              background: msg.role === "user" ? C.accent : C.card,
              color: msg.role === "user" ? "#fff" : C.text,
              border: msg.role === "assistant" ? `1px solid ${C.border}` : "none",
              fontSize: 14, lineHeight: 1.65,
              boxShadow: "0 1px 6px rgba(0,0,0,.06)",
            }}>
              {msg.role === "user"
                ? msg.text
                : renderChatText(msg.text)
              }
            </div>
          </div>
        ))}

        {/* Loading */}
        {loading && (
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 16 }}>
            <div style={{ width: 24, height: 24, background: C.accent, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 }}>🔨</div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "4px 18px 18px 18px", padding: "12px 16px", display: "flex", gap: 5, alignItems: "center" }}>
              {[0, 1, 2].map(j => (
                <div key={j} style={{ width: 7, height: 7, borderRadius: "50%", background: C.accent, animation: `blink 1.2s ease ${j * 0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding:"10px 14px 14px", borderTop:`1px solid ${C.border}`, background:C.card }}>
        <div style={{ display:"flex", gap:8, alignItems:"flex-end" }}>
          <textarea
            ref={textRef}
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Stell eine Frage zur Renovierung…"
            rows={1}
            style={{ flex:1, resize:"none", border:`1.5px solid ${C.border}`, borderRadius:12, padding:"10px 14px", fontSize:14, fontFamily:"'DM Sans', sans-serif", background:C.bg, lineHeight:1.5, minHeight:42, maxHeight:120 }}
            onFocus={e => { e.target.style.borderColor = C.accent; }}
            onBlur={e => { e.target.style.borderColor = C.border; }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !inputText.trim()}
            style={{ width:42, height:42, borderRadius:12, flexShrink:0, background:loading || !inputText.trim() ? C.border : C.accent, border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:18 }}
          >
            {loading ? <LoadingSpinner size={18} /> : "→"}
          </button>
        </div>
        <p style={{ fontSize:10, color:C.muted, textAlign:"center", marginTop:6 }}>
          Enter to send · Shift+Enter new line · Photo analysis → 🔍 Inspo Tab
        </p>
      </div>
    </div>
  );
}

// ─── HANDWERKER TAB ───────────────────────────────────────────────────────────
const BRANCHEN = ["All","Fliesen & Bad","Maler & Lackierer","Elektriker","Sanitaer & Heizung","Trockenbau","Schreiner","Bodenleger"];

function HandwerkerTab({ lang = "de" }) {
  const [filter, setFilter] = useState("All");
  const [ort, setOrt] = useState("");

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"hidden" }}>
      <div style={{ background:C.card, borderBottom:`1px solid ${C.border}`, padding:"14px 16px 12px", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:20 }}>🔨 Find Pros</h2>
          <span style={{ background:C.accentBg, color:C.accent, borderRadius:20, padding:"4px 12px", fontSize:11, fontWeight:700 }}>Coming soon</span>
        </div>
        <input value={ort} onChange={e => setOrt(e.target.value)} placeholder="📍 Enter city or postcode…" style={{ width:"100%", border:`1px solid ${C.border}`, borderRadius:10, padding:"9px 13px", fontSize:14, marginBottom:10, fontFamily:"'DM Sans',sans-serif", background:C.bg }} />
        <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:4 }}>
          {BRANCHEN.map(b => <button key={b} onClick={() => setFilter(b)} style={{ padding:"5px 12px", borderRadius:20, border:"none", cursor:"pointer", background:filter===b?C.accent:C.bg, color:filter===b?"white":C.muted, fontSize:12, fontWeight:600, whiteSpace:"nowrap", fontFamily:"'DM Sans',sans-serif", flexShrink:0 }}>{b}</button>)}
        </div>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"20px 16px" }}>
        {/* Handwerker CTA */}
        <div style={{ background:"linear-gradient(135deg, #1a1a2e, #2d2d4e)", borderRadius:16, padding:"20px", marginBottom:20, textAlign:"center" }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🔨</div>
          <p style={{ color:"white", fontWeight:700, fontSize:16, marginBottom:8 }}>Are you a contractor?</p>
          <p style={{ color:"rgba(255,255,255,0.75)", fontSize:13, lineHeight:1.6, marginBottom:16 }}>
            Join the Mystorija contractor network.<br/>
            Direct inquiries from renovation-ready customers.
          </p>
          <div style={{ display:"flex", gap:8, justifyContent:"center", flexWrap:"wrap", marginBottom:12 }}>
            {["✓ Own profile","✓ Direct inquiries","✓ In-app advertising","✓ Reviews"].map(f => (
              <span key={f} style={{ background:"rgba(255,255,255,0.1)", color:"white", borderRadius:20, padding:"4px 12px", fontSize:11, fontWeight:600 }}>{f}</span>
            ))}
          </div>
          <a href="mailto:info@mystorija.com" style={{ display:"inline-block", background:C.accent, color:"white", borderRadius:50, padding:"11px 24px", fontSize:13, fontWeight:700, textDecoration:"none" }}>
            Apply now – €49.99/month →
          </a>
        </div>

        {/* Coming Soon */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"30px 20px", textAlign:"center" }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🏗️</div>
          <p style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, marginBottom:10 }}>Contractor Directory</p>
          <p style={{ fontSize:14, color:C.muted, lineHeight:1.7, maxWidth:280, margin:"0 auto 20px" }}>
            We're currently building the directory. Soon you'll find verified contractors near you right here.
          </p>
          <div style={{ background:C.greenBg, borderRadius:12, padding:"14px 16px" }}>
            <p style={{ fontSize:13, color:C.green, fontWeight:600 }}>
              💡 Coming soon – we carefully verify every business
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── EINKAUFSLISTE (aus gespeicherten Makeovers) ──────────────────────────────
function parseMaterials(text) {
  if (!text) return [];
  return text.split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => {
      // Extract name (bold **...**), description, and Amazon link
      const boldMatch = line.match(/\*\*([^*]+)\*\*/);
      const linkMatch = line.match(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/);
      const name = boldMatch ? boldMatch[1] : line.replace(/\*\*/g, "").replace(/\[.*?\]\(.*?\)/g, "").replace(/^[🪨🪵💡🚿✨⬛📚🌿🏺🍂🛏️🌙🪑🌳⬜🔵]/u, "").split("–")[0].trim();
      const amazonUrl = linkMatch ? linkMatch[2] : null;
      // Get price from line
      const priceMatch = line.match(/Ca\.\s*([\d–.]+\s*€[^.]*)/);
      const price = priceMatch ? priceMatch[1] : null;
      // Get emoji at start
      const emojiMatch = line.match(/^([🪨🪵💡🚿✨⬛📚🌿🏺🍂🛏️🌙🪑🌳⬜🔵🏛️])/u);
      const emoji = emojiMatch ? emojiMatch[1] : "🛒";
      return { name, amazonUrl, price, emoji, raw: line };
    });
}

function EinkaufsListe({ savedMakeovers }) {
  const [checked, setChecked] = useState({});
  const [openMakeover, setOpenMakeover] = useState(savedMakeovers[0]?.id || null);

  const toggle = (key) => setChecked(prev => ({ ...prev, [key]: !prev[key] }));

  // Count total items & checked across all makeovers
  const allItems = savedMakeovers.flatMap((m, mi) =>
    parseMaterials(m.materials).map((item, ii) => ({ key: `${m.id}-${ii}` }))
  );
  const totalChecked = allItems.filter(i => checked[i.key]).length;
  const total = allItems.length;

  return (
    <div style={{ marginTop:24 }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:18 }}>🛒 Shopping list</h3>
        {total > 0 && (
          <span style={{ fontSize:12, color:C.muted, background:C.accentBg, padding:"3px 10px", borderRadius:20 }}>
            {totalChecked}/{total} gekauft
          </span>
        )}
      </div>

      {/* Progress Bar */}
      {total > 0 && (
        <div style={{ height:6, background:C.border, borderRadius:3, overflow:"hidden", marginBottom:16 }}>
          <div style={{ height:"100%", width:`${Math.round((totalChecked/total)*100)}%`, background:`linear-gradient(to right, ${C.accent}, #E8855A)`, borderRadius:3, transition:"width 0.3s" }} />
        </div>
      )}

      {savedMakeovers.map((m, mi) => {
        const items = parseMaterials(m.materials);
        if (items.length === 0) return null;
        const mChecked = items.filter((_, ii) => checked[`${m.id}-${ii}`]).length;
        const isOpen = openMakeover === m.id;

        return (
          <div key={m.id} className="fu" style={{ background:C.card, border:`1px solid ${isOpen ? C.accent+"66" : C.border}`, borderRadius:16, marginBottom:12, overflow:"hidden" }}>
            {/* Makeover Header – klappbar */}
            <button onClick={() => setOpenMakeover(isOpen ? null : m.id)} style={{ width:"100%", padding:"0", background:"transparent", border:"none", cursor:"pointer", textAlign:"left", display:"flex" }}>
              {/* Vorschaubild */}
              <div style={{ width:80, height:72, flexShrink:0, overflow:"hidden" }}>
                <img src={m.imgUrl} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
              </div>
              <div style={{ flex:1, padding:"12px 14px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div>
                  <p style={{ fontFamily:"'Playfair Display',serif", fontSize:14, fontWeight:700, color:C.text, marginBottom:2 }}>{m.titel}</p>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:11, color:C.muted }}>{m.date}</span>
                    <span style={{ fontSize:11, background:mChecked===items.length?C.greenBg:C.accentBg, color:mChecked===items.length?C.green:C.accent, padding:"2px 8px", borderRadius:20, fontWeight:600 }}>
                      {mChecked}/{items.length} {mChecked===items.length?"✓ Alles gekauft":"Produkte"}
                    </span>
                  </div>
                </div>
                <span style={{ fontSize:18, color:C.muted, transform:isOpen?"rotate(90deg)":"none", transition:"transform .2s" }}>›</span>
              </div>
            </button>

            {/* Produkt-Liste */}
            {isOpen && (
              <div className="fu" style={{ borderTop:`1px solid ${C.border}` }}>
                {/* Check all Button */}
                <div style={{ padding:"8px 14px", background:C.accentBg, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <p style={{ fontSize:12, color:C.accent, fontWeight:600 }}>📋 Shopping list for {m.titel}</p>
                  <button onClick={() => {
                    const allDone = items.every((_, ii) => checked[`${m.id}-${ii}`]);
                    const update = {};
                    items.forEach((_, ii) => { update[`${m.id}-${ii}`] = !allDone; });
                    setChecked(prev => ({ ...prev, ...update }));
                  }} style={{ fontSize:11, color:C.accent, background:"none", border:`1px solid ${C.accent}44`, borderRadius:20, padding:"3px 10px", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                    {items.every((_, ii) => checked[`${m.id}-${ii}`]) ? "Deselect all" : "Check all"}
                  </button>
                </div>

                {items.map((item, ii) => {
                  const key = `${m.id}-${ii}`;
                  const done = checked[key];
                  return (
                    <div key={ii} style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 14px", borderBottom:`1px solid ${C.border}`, background:done?"#F9FDF9":"transparent" }}>
                      {/* Checkbox */}
                      <div onClick={() => toggle(key)} style={{ width:22, height:22, borderRadius:6, flexShrink:0, border:`2px solid ${done?C.green:C.border}`, background:done?C.green:"white", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                        {done && <span style={{ color:"white", fontSize:12, fontWeight:700 }}>✓</span>}
                      </div>

                      {/* Produkt Info */}
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:13, fontWeight:600, color:done?C.muted:C.text, textDecoration:done?"line-through":"none", lineHeight:1.4 }}>
                          {item.emoji} {item.name}
                        </p>
                        {item.price && !done && (
                          <p style={{ fontSize:11, color:C.muted, marginTop:2 }}>💶 Ca. {item.price}</p>
                        )}
                      </div>

                      {/* Amazon Link */}
                      {item.amazonUrl && (
                        <a href={item.amazonUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ flexShrink:0, background:done?C.border:C.greenBg, color:done?C.muted:C.green, borderRadius:20, padding:"5px 11px", fontSize:12, textDecoration:"none", fontWeight:700, display:"flex", alignItems:"center", gap:4, opacity:done?0.5:1 }}>
                          🛒 <span>Kaufen</span>
                        </a>
                      )}
                    </div>
                  );
                })}

                {/* Zusammenfassung unten */}
                <div style={{ padding:"10px 14px", background:C.greenBg, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontSize:12, color:C.green, fontWeight:600 }}>
                    {mChecked === items.length ? "🎉 Alle Produkte besorgt!" : `${items.length - mChecked} Produkte noch offen`}
                  </span>
                  {mChecked === items.length && (
                    <span style={{ fontSize:11, color:C.green }}>Jetzt loslegen! 💪</span>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── PLANER TAB – komplett neu ────────────────────────────────────────────────
const KOMPLETT_PLAENE = [
  {
    name:"Bad Komplettsanierung", icon:"🚿", dauer:"2–4 weeks", budget:"3.000–15.000€", desc:"Vom leeren Raum zum Traumbad",
    phasen:[
      { name:"Planung & Vorbereitung", items:["Grundriss aufzeichnen, Masse nehmen","Sanitaer-Konzept festlegen (WC, Dusche, Wanne?)","Materialien auswaehlen: Fliesen, Armaturen, Sanitaer","Angebote einholen: Installateur, Fliesenleger","Material bestellen (Lieferzeiten beachten!)"] },
      { name:"Abriss & Entkernung", items:["Wasser & Strom abstellen","Altes Sanitaer demontieren (WC, Wanne, Waschbecken)","Fliesen stemmen (Stemmhammer leihen)","Alten Estrich pruefen – ggf. erneuern","Waende auf Schimmel pruefen","Schutt entsorgen (Container bestellen)"] },
      { name:"Rohbau & Installation", items:["Neue Leitungen verlegen (Installateur!)","Elektro: Leerrohr fuer Spiegel, Steckdosen IP44","Rigips Vorbauwand fuer Unterputz-Spuelung","Gefaelleestrich fuer bodengleiche Dusche (1,5%)","Abdichtung: Dichtband + 2× Dichtschlaemme","Trockenzeit abwarten (mind. 48h)"] },
      { name:"Fliesen & Oberflaechen", items:["Fliesenkleber C2 anruehren (Mapei Keraflex)","Boden fliesen – von Mitte aus starten","Waende fliesen – Werkskante nach aussen","Nivelliersystem bei Grossformat verwenden","24h trocknen, dann verfugen","Randfugen: Silikon (Bad-Silikon Soudal S100)"] },
      { name:"Sanitaer & Elektro", items:["WC montieren (Vorwandinstallation einstellen)","Waschtisch anschliessen (Teflonband!)","Dusche/Wanne anschliessen, Dichtigkeitstest","Armaturen montieren","Spiegel aufhaengen (IP44 pruefen!)","Licht anschliessen (Elektriker)"] },
      { name:"Finishing", items:["Replace all sealant + smooth","Check all connections for leaks","Mount accessories (towel rail, hooks)","Clean everything","Take photos – before/after!"] },
    ]
  },
  {
    name:"Kitchen Renovation", icon:"🍳", dauer:"1–2 weeks", budget:"500–8,000€", desc:"From new fronts to a complete kitchen overhaul",
    phasen:[
      { name:"Planning", items:["Concept: fronts only or full renovation?","Choose color scheme (order test samples!)","Select countertop","Order materials (4 weeks delivery time!)","Split budget: fronts / countertop / lighting / decor"] },
      { name:"Fronts & Handles", items:["Remove old fronts, label them","Sand fronts (P120) or degrease for film","Apply primer, let dry","Paint: 3× satin lacquer","Mount new handles (use template!)","Rehang fronts, adjust hinges"] },
      { name:"Countertop", items:["Remove old countertop","Cut new countertop to size (jigsaw)","Seal cut edges IMMEDIATELY","Cut out and fit sink","Glue + screw countertop","Silicone joint wall-countertop"] },
      { name:"Lighting & Finishing", items:["LED strip under wall units (2700K)","Mount pendant lights over island/table","Seal all joints with silicone","Check fixtures for leaks","Deep clean & unpack"] },
    ]
  },
  {
    name:"Transform Living Room", icon:"🛋️", dauer:"1–3 days", budget:"100–2,000€", desc:"Accent wall, lighting, flooring – the complete look",
    phasen:[
      { name:"Planning", items:["Collect color ideas on Pinterest","Which wall will be the accent wall?","Flooring: keep or replace?","Lighting concept: remove ceiling lamp, add floor lamp + spots","Split budget: paint / floor / furniture / lighting"] },
      { name:"Accent Wall", items:["Move furniture away from wall","Tape with Tesa Precision (ceiling, floor, walls)","Apply primer if needed","2 coats of wall paint with lambswool roller","Remove tape while damp for latex paint","Drying time: at least 4h between coats"] },
      { name:"Lay Flooring", items:["Check old floor – level out unevenness","Lay acoustic underlay","10mm spacers against all walls","Snap vinyl/laminate rows together","Glue skirting boards (do NOT nail to laminate)"] },
      { name:"Lighting & Finishing", items:["LED strip behind TV (2700K)","Build cove light at ceiling edge","Position floor lamps","Rearrange furniture","Place decor, position plants","Take photos!"] },
    ]
  },
  {
    name:"Schlafzimmer upgraden", icon:"🛏️", dauer:"1–2 days", budget:"100–1.500€", desc:"Kopfteil, Farbe, Licht – Hotel-Feeling",
    phasen:[
      { name:"Planung", items:["Farbkonzept: Akzentwand welche Farbe?","Kopfteil: DIY oder kaufen?","Licht: Wandleuchten links/rechts vom Bett","Verdunkelungsrollo oder Vorhang planen"] },
      { name:"Akzentwand hinter Bett", items:["Bett wegschieben","Wand abkleben, Tiefengrund","2 Schichten Farbe (Terrakotta, Salbeigruen, Navy)","Band abziehen, trocknen lassen"] },
      { name:"Kopfteil DIY", items:["MDF 18mm auf Mass (OBI schneidet zu)","5cm Schaumstoff RG35 aufkleben","Bouclé-Stoff spannen und tackern","An Wand haengen (verdeckte Schrauben)"] },
      { name:"Licht & Atmosphaere", items:["Wandleuchten beidseitig montieren (2200K)","Verdunkelungsrollo direkt am Fenster","Vorhangstange moeglichst hoch montieren","Bettwaesche wechseln (Leinen = Trend 2025)","Deko: 1 grosse Pflanze, Kerzen, Tablett"] },
    ]
  },
  {
    name:"Terrasse aufwerten", icon:"🌿", dauer:"1–2 weekends", budget:"300–3.000€", desc:"WPC-Boden, Sichtschutz, Lounge",
    phasen:[
      { name:"Planung & Material", items:["Grundflaeche ausmessen (Length × Width)","Konzept: Lounge, Essbereich, Pflanzen?","WPC-Menge berechnen (+10% Verschnitt)","Unterkonstruktion planen (alle 50cm)","Material bestellen"] },
      { name:"Unterkonstruktion", items:["Alten Belag entfernen","Stelzlager setzen (hoehenverstellbar)","2% Gefaelle einplanen (Wasserablauf)","Tragebalken verlegen und nivellieren"] },
      { name:"WPC-Dielen verlegen", items:["Erste Reihe mit 5mm Abstand zur Wand","Clips einsetzen – unsichtbare Befestigung","Reihe fuer Reihe arbeiten","Letzte Reihe zuschneiden","Abschlussprofile montieren"] },
      { name:"Sichtschutz & Moebel", items:["Sichtschutz-Pfosten setzen","Latten oder Bambus anbringen","Solar-Lichterketten aufhaengen (2200K)","Lounge-Moebel aufstellen","Pflanzkuebel mit Olivenbaum/Lavendel"] },
    ]
  },
];

function PlanerTab({ lang = "de", savedMakeovers }) {
  const [ansicht, setAnsicht] = useState("plaene");
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [openPhase, setOpenPhase] = useState(0);
  const [checked, setChecked] = useState({});
  const [eigene, setEigene] = useState([]);
  const [creating, setCreating] = useState(false);
  const [newProjekt, setNewProjekt] = useState({ name:"", icon:"🏠", phasen:[{ name:"Phase 1", items:[""] }] });

  useEffect(() => {
    try {
      const s = localStorage.getItem("mystorija_planer");
      if (s) { const d = JSON.parse(s); setChecked(d.checked||{}); setEigene(d.eigene||[]); }
    } catch {}
  }, []);

  const saveLS = (c, e) => {
    try { localStorage.setItem("mystorija_planer", JSON.stringify({ checked: c||checked, eigene: e||eigene })); } catch {}
  };

  const toggleCheck = (key) => {
    const next = { ...checked, [key]: !checked[key] };
    setChecked(next); saveLS(next, null);
  };

  const planProgress = (plan) => {
    if (!plan) return { done:0, total:0, pct:0 };
    const total = plan.phasen.reduce((s,ph)=>s+ph.items.length, 0);
    const done = plan.phasen.reduce((s,ph,pi)=>s+ph.items.filter((_,ii)=>checked[`${plan.name}-${pi}-${ii}`]).length, 0);
    return { done, total, pct: total ? Math.round((done/total)*100) : 0 };
  };

  const ICONS = ["🏠","🚿","🍳","🌿","🛋️","🛏️","🔨","📦","🏗️","💡","🪟","🔧"];
  const allePlane = [...KOMPLETT_PLAENE, ...eigene];

  // Detailansicht fuer ausgewaehlten Plan
  if (selectedPlan) {
    const plan = allePlane.find(p => p.name === selectedPlan);
    if (!plan) { setSelectedPlan(null); return null; }
    const { done, total, pct } = planProgress(plan);
    return (
      <div style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"hidden" }}>
        <div style={{ background:C.card, borderBottom:`1px solid ${C.border}`, padding:"12px 16px", display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
          <button onClick={() => setSelectedPlan(null)} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:C.muted }}>←</button>
          <div style={{ flex:1 }}>
            <p style={{ fontSize:16, fontWeight:700 }}>{plan.icon} {plan.name}</p>
            <p style={{ fontSize:11, color:C.muted }}>{done}/{total} steps · {pct}% done</p>
          </div>
          {pct > 0 && <button onClick={() => { const next={...checked}; plan.phasen.forEach((ph,pi)=>ph.items.forEach((_,ii)=>{delete next[`${plan.name}-${pi}-${ii}`];})); setChecked(next); saveLS(next,null); }} style={{ fontSize:11, color:C.muted, background:"none", border:`1px solid ${C.border}`, borderRadius:20, padding:"3px 8px", cursor:"pointer" }}>Reset</button>}
        </div>
        <div style={{ height:5, background:C.border, flexShrink:0 }}>
          <div style={{ height:"100%", width:`${pct}%`, background:`linear-gradient(to right, ${C.accent}, #E8855A)`, transition:"width 0.3s" }} />
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"14px 16px" }}>
          <div style={{ background:C.accentBg, borderRadius:12, padding:"12px 14px", marginBottom:14, display:"flex", gap:10 }}>
            <div><p style={{ fontSize:12, color:C.accent, fontWeight:600 }}>⏱ {plan.dauer}</p><p style={{ fontSize:12, color:C.accent }}>💶 {plan.budget}</p></div>
            <p style={{ fontSize:13, color:C.text, flex:1, lineHeight:1.5 }}>{plan.desc}</p>
          </div>
          {pct === 100 && <div style={{ background:C.greenBg, borderRadius:12, padding:"12px", marginBottom:14, textAlign:"center" }}><p style={{ fontSize:16, color:C.green, fontWeight:700 }}>🎉 Projekt abgeschlossen!</p></div>}
          {plan.phasen.map((phase, pi) => {
            const phaseDone = phase.items.filter((_,ii)=>checked[`${plan.name}-${pi}-${ii}`]).length;
            const phComplete = phaseDone === phase.items.length;
            const isOpen = openPhase === pi;
            return (
              <div key={pi} style={{ background:C.card, border:`1px solid ${phComplete?C.green+"44":isOpen?C.accent+"55":C.border}`, borderRadius:14, marginBottom:10, overflow:"hidden" }}>
                <button onClick={()=>setOpenPhase(isOpen?-1:pi)} style={{ width:"100%", padding:"13px 16px", background:phComplete?C.greenBg:"transparent", border:"none", display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}>
                  <div style={{ width:28, height:28, borderRadius:"50%", background:phComplete?C.green:phaseDone>0?C.accent:C.border, color:"white", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, flexShrink:0 }}>{phComplete?"✓":pi+1}</div>
                  <div style={{ flex:1, textAlign:"left" }}>
                    <p style={{ fontSize:14, fontWeight:600, color:phComplete?C.green:C.text }}>{phase.name}</p>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:3 }}>
                      <div style={{ flex:1, height:3, background:C.border, borderRadius:2 }}><div style={{ height:"100%", width:`${phase.items.length?(phaseDone/phase.items.length*100):0}%`, background:C.green, borderRadius:2 }} /></div>
                      <span style={{ fontSize:11, color:C.muted }}>{phaseDone}/{phase.items.length}</span>
                    </div>
                  </div>
                  <span style={{ fontSize:18, color:C.muted, transform:isOpen?"rotate(90deg)":"none", transition:"0.2s" }}>›</span>
                </button>
                {isOpen && (
                  <div style={{ borderTop:`1px solid ${C.border}`, padding:"8px 16px 12px" }}>
                    {phase.items.map((item, ii) => {
                      const key=`${plan.name}-${pi}-${ii}`, done=checked[key];
                      return (
                        <div key={ii} onClick={()=>toggleCheck(key)} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"9px 0", borderBottom:ii<phase.items.length-1?`1px solid ${C.border}`:"none", cursor:"pointer" }}>
                          <div style={{ width:22, height:22, borderRadius:6, flexShrink:0, marginTop:1, border:`2px solid ${done?C.green:C.border}`, background:done?C.green:"white", display:"flex", alignItems:"center", justifyContent:"center" }}>
                            {done && <span style={{ color:"white", fontSize:12, fontWeight:700 }}>✓</span>}
                          </div>
                          <p style={{ fontSize:14, color:done?C.muted:C.text, textDecoration:done?"line-through":"none", lineHeight:1.4, flex:1 }}>{item}</p>
                        </div>
                      );
                    })}
                    <button onClick={()=>{ const allDone=phase.items.every((_,ii)=>checked[`${plan.name}-${pi}-${ii}`]); const next={...checked}; phase.items.forEach((_,ii)=>{next[`${plan.name}-${pi}-${ii}`]=!allDone;}); setChecked(next); saveLS(next,null); }} style={{ marginTop:8, fontSize:12, color:C.accent, background:"none", border:`1px solid ${C.accent}44`, borderRadius:20, padding:"4px 12px", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                      {phase.items.every((_,ii)=>checked[`${plan.name}-${pi}-${ii}`])?"Deselect phase":"Check all"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          {savedMakeovers?.length > 0 && <EinkaufsListe savedMakeovers={savedMakeovers} />}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"hidden" }}>
      <div style={{ display:"flex", borderBottom:`1px solid ${C.border}`, background:C.card, flexShrink:0 }}>
        {[["plaene","📋 Projekte"],["eigene","✏️ Eigene"],["einkauf","🛒 Einkauf"]].map(([id,label])=>(
          <button key={id} onClick={()=>setAnsicht(id)} style={{ flex:1, padding:"12px 8px", background:"transparent", border:"none", borderBottom:`2px solid ${ansicht===id?C.accent:"transparent"}`, color:ansicht===id?C.accent:C.muted, fontSize:13, fontWeight:ansicht===id?600:400, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>{label}</button>
        ))}
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"14px 16px" }}>
        {ansicht === "plaene" && (
          <div>
            <p style={{ fontSize:12, color:C.muted, marginBottom:14, fontStyle:"italic" }}>Choose a project – all steps are provided. Progress is saved automatically.</p>
            {allePlane.map((plan, i) => {
              const { done, total, pct } = planProgress(plan);
              return (
                <div key={i} onClick={()=>{setSelectedPlan(plan.name);setOpenPhase(0);}} className="fu" style={{ background:C.card, border:`1px solid ${pct>0?C.accent+"55":C.border}`, borderRadius:16, marginBottom:12, padding:"16px", cursor:"pointer" }}>
                  <div style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom:10 }}>
                    <span style={{ fontSize:30 }}>{plan.icon}</span>
                    <div style={{ flex:1 }}>
                      <p style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:700, color:C.text }}>{plan.name}</p>
                      <p style={{ fontSize:12, color:C.muted, marginTop:2 }}>{plan.desc}</p>
                      <div style={{ display:"flex", gap:6, marginTop:6, flexWrap:"wrap" }}>
                        {plan.dauer && <span style={{ fontSize:11, background:C.accentBg, color:C.accent, padding:"2px 8px", borderRadius:20 }}>⏱ {plan.dauer}</span>}
                        {plan.budget && <span style={{ fontSize:11, background:C.greenBg, color:C.green, padding:"2px 8px", borderRadius:20 }}>💶 {plan.budget}</span>}
                        <span style={{ fontSize:11, background:C.tag, color:C.muted, padding:"2px 8px", borderRadius:20 }}>{plan.phasen.length} phases · {total} steps</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ flex:1, height:6, background:C.border, borderRadius:3, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${pct}%`, background:pct===100?C.green:`linear-gradient(to right, ${C.accent}, #E8855A)`, borderRadius:3, transition:"width 0.3s" }} />
                    </div>
                    <span style={{ fontSize:12, color:pct===100?C.green:C.muted, fontWeight:pct===100?700:400, flexShrink:0 }}>{pct===100?"✓ Done!":pct>0?`${pct}%`:"Start →"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {ansicht === "eigene" && (
          <div>
            {!creating ? (
              <button onClick={()=>setCreating(true)} style={{ width:"100%", padding:"14px", borderRadius:14, border:`2px dashed ${C.accent}`, background:C.accentBg, color:C.accent, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:14, marginBottom:14 }}>+ Eigenes Projekt erstellen</button>
            ) : (
              <div className="fu" style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"16px", marginBottom:14 }}>
                <p style={{ fontWeight:700, fontSize:16, marginBottom:12 }}>Neues Projekt</p>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:12 }}>
                  {ICONS.map(ic=><button key={ic} onClick={()=>setNewProjekt(p=>({...p,icon:ic}))} style={{ width:36, height:36, borderRadius:10, border:`2px solid ${newProjekt.icon===ic?C.accent:C.border}`, background:newProjekt.icon===ic?C.accentBg:"white", cursor:"pointer", fontSize:18 }}>{ic}</button>)}
                </div>
                <input value={newProjekt.name} onChange={e=>setNewProjekt(p=>({...p,name:e.target.value}))} placeholder="Project name" style={{ width:"100%", padding:"10px 13px", borderRadius:10, border:`1.5px solid ${C.border}`, fontSize:14, fontFamily:"'DM Sans',sans-serif", marginBottom:12, background:C.bg }} />
                {newProjekt.phasen.map((phase, pi)=>(
                  <div key={pi} style={{ background:C.accentBg, borderRadius:10, padding:"12px", marginBottom:10 }}>
                    <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                      <input value={phase.name} onChange={e=>setNewProjekt(p=>{const ph=[...p.phasen];ph[pi]={...ph[pi],name:e.target.value};return{...p,phasen:ph};})} placeholder={`Phase ${pi+1} Name`} style={{ flex:1, padding:"7px 10px", borderRadius:8, border:`1px solid ${C.border}`, fontSize:13, fontFamily:"'DM Sans',sans-serif", background:"white" }} />
                      {pi>0 && <button onClick={()=>setNewProjekt(p=>({...p,phasen:p.phasen.filter((_,x)=>x!==pi)}))} style={{ background:"none", border:"none", color:"#CCC", cursor:"pointer", fontSize:16 }}>✕</button>}
                    </div>
                    {phase.items.map((item, ii)=>(
                      <div key={ii} style={{ display:"flex", gap:6, marginBottom:6 }}>
                        <span style={{ width:20, height:20, background:C.accent, color:"white", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, flexShrink:0, marginTop:6 }}>{ii+1}</span>
                        <input value={item} onChange={e=>setNewProjekt(p=>{const ph=[...p.phasen];ph[pi]={...ph[pi],items:ph[pi].items.map((it,x)=>x===ii?e.target.value:it)};return{...p,phasen:ph};})} placeholder={`Step ${ii+1}`} style={{ flex:1, padding:"6px 10px", borderRadius:8, border:`1px solid ${C.border}`, fontSize:13, fontFamily:"'DM Sans',sans-serif", background:"white" }}
                          onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();setNewProjekt(p=>{const ph=[...p.phasen];ph[pi]={...ph[pi],items:[...ph[pi].items,""]};return{...p,phasen:ph};});}}} />
                        <button onClick={()=>setNewProjekt(p=>{const ph=[...p.phasen];ph[pi]={...ph[pi],items:ph[pi].items.filter((_,x)=>x!==ii)};return{...p,phasen:ph};})} style={{ background:"none", border:"none", color:"#CCC", cursor:"pointer" }}>✕</button>
                      </div>
                    ))}
                    <button onClick={()=>setNewProjekt(p=>{const ph=[...p.phasen];ph[pi]={...ph[pi],items:[...ph[pi].items,""]};return{...p,phasen:ph};})} style={{ fontSize:12, color:C.accent, background:"none", border:"none", cursor:"pointer", padding:"4px 0" }}>+ Schritt</button>
                  </div>
                ))}
                <button onClick={()=>setNewProjekt(p=>({...p,phasen:[...p.phasen,{name:`Phase ${p.phasen.length+1}`,items:[""]}]}))} style={{ width:"100%", padding:"8px", borderRadius:10, border:`1px dashed ${C.border}`, background:"none", color:C.muted, cursor:"pointer", fontSize:13, marginBottom:12, fontFamily:"'DM Sans',sans-serif" }}>+ Phase hinzufuegen</button>
                <div style={{ display:"flex", gap:10 }}>
                  <button onClick={()=>{
                    if(!newProjekt.name.trim()) return;
                    const proj={...newProjekt,phasen:newProjekt.phasen.map(ph=>({...ph,items:ph.items.filter(i=>i.trim())})).filter(ph=>ph.items.length>0)};
                    if(proj.phasen.length===0) return;
                    const next=[...eigene,proj]; setEigene(next); saveLS(null,next);
                    setCreating(false); setNewProjekt({name:"",icon:"🏠",phasen:[{name:"Phase 1",items:[""]}]});
                    setSelectedPlan(proj.name); setOpenPhase(0); setAnsicht("plaene");
                  }} style={{ flex:2, padding:"12px", borderRadius:50, background:C.accent, color:"white", border:"none", fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Erstellen →</button>
                  <button onClick={()=>setCreating(false)} style={{ flex:1, padding:"12px", borderRadius:50, border:`1px solid ${C.border}`, background:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Cancel</button>
                </div>
              </div>
            )}
            <p style={{ fontSize:12, color:C.muted, textAlign:"center", fontStyle:"italic" }}>Enter = naechster Step · Phasen gruppieren verwandte Tasks</p>
          </div>
        )}
        {ansicht === "einkauf" && (
          savedMakeovers?.length > 0
            ? <EinkaufsListe savedMakeovers={savedMakeovers} />
            : <div style={{ textAlign:"center", padding:"40px 20px" }}>
                <p style={{ fontSize:32, marginBottom:12 }}>🛒</p>
                <p style={{ fontFamily:"'Playfair Display',serif", fontSize:16, marginBottom:8 }}>Noch keine Shopping list</p>
                <p style={{ fontSize:13, color:C.muted, lineHeight:1.6 }}>Generiere einen Makeover und druecke "Save to Planner" – dann erscheinen hier alle Materialien zum Abhaken.</p>
              </div>
        )}
      </div>
    </div>
  );
}


// ─── INSPO ANALYSE TAB ───────────────────────────────────────────────────────
function InspoTab({ plan, lang = "de" }) {
  const [imgFile, setImgFile] = useState(null);
  const [imgPreview, setImgPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const fileRef = useRef();

  const INSPO_LIMITS = { free: 0, basic: 30, pro: Infinity };
  const inspoLimit = INSPO_LIMITS[plan] ?? 0;
  const isFreeInspo = !plan || plan === "free";

  function getMonthlyInspoUsage() {
    try {
      const key = `mystorija_inspo_${new Date().getFullYear()}_${new Date().getMonth()}`;
      return parseInt(localStorage.getItem(key) || "0");
    } catch { return 0; }
  }
  function incrementInspoUsage() {
    try {
      const key = `mystorija_inspo_${new Date().getFullYear()}_${new Date().getMonth()}`;
      localStorage.setItem(key, String(getMonthlyInspoUsage() + 1));
    } catch {}
  }
  const inspoUsage = getMonthlyInspoUsage();
  const inspoLimitReached = inspoUsage >= inspoLimit;

  // Saved analyses laden
  useEffect(() => {
    try {
      const saved = localStorage.getItem("mystorija_inspo");
      if (saved) setHistory(JSON.parse(saved));
    } catch {}
  }, []);

  function saveToHistory(preview, result) {
    const entry = { id: Date.now(), preview, analysis: result, date: new Date().toLocaleDateString("de-DE") };
    setHistory(prev => {
      const next = [entry, ...prev].slice(0, 20); // max 20
      try { localStorage.setItem("mystorija_inspo", JSON.stringify(next)); } catch {}
      return next;
    });
  }

  function deleteFromHistory(id) {
    setHistory(prev => {
      const next = prev.filter(h => h.id !== id);
      try { localStorage.setItem("mystorija_inspo", JSON.stringify(next)); } catch {}
      return next;
    });
  }

  async function analyse(file, preview) {
    if (isFreeInspo || inspoLimitReached) {
      setError(isFreeInspo ? "Inspo analysis available from Basic Plan (€9.99/month)." : `Monthly limit reached (${inspoLimit} analyses).`);
      return;
    }
    setLoading(true); setAnalysis(null); setError(null); setShowHistory(false);
    try {
      const compressed = await compressImageFile(file);
      const res = await fetch("/api/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: compressed, mimeType: file.type, lang: "de" }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); }
      else {
        setAnalysis(data.analysis);
        saveToHistory(preview, data.analysis);
        incrementInspoUsage();
      }
    } catch (err) { setError(err.message); }
    setLoading(false);
  }

  function onFile(e) {
    const f = e.target.files[0]; if (!f) return;
    setImgFile(f);
    const r = new FileReader();
    r.onload = ev => { setImgPreview(ev.target.result); analyse(f, ev.target.result); };
    r.readAsDataURL(f);
  }

  const SCHWIERIGKEIT_COLOR = { "Easy": C.green, "Medium": C.accent, "Schwierig": "#B91C1C" };

  return (
    <div style={{ overflowY:"auto", height:"100%" }}>
      {/* Header */}
      <div style={{ padding:"16px 16px 12px", borderBottom:`1px solid ${C.border}`, background:C.card }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:20, marginBottom:4 }}>🔍 Analyze Inspo</h2>
            <p style={{ fontSize:13, color:C.muted, lineHeight:1.5 }}>Upload photo – KI erkennt Materialien, Stil und zeigt wie du es nachmachst.</p>
          </div>
          {history.length > 0 && (
            <button onClick={() => setShowHistory(!showHistory)} style={{ flexShrink:0, marginLeft:10, padding:"6px 12px", borderRadius:20, border:`1px solid ${C.border}`, background:showHistory?C.accent:C.card, color:showHistory?"white":C.muted, fontSize:12, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontWeight:600 }}>
              📚 {history.length}
            </button>
          )}
        </div>

        {/* Usage Display */}
        {!isFreeInspo && (
          <p style={{ fontSize:11, color: inspoLimitReached?"#B91C1C":C.muted, fontWeight:600, marginTop:6 }}>
            {inspoLimitReached ? "🔒 Limit reached" : `${inspoUsage} / ${plan==="pro"?"∞":inspoLimit} Analysen this month`}
          </p>
        )}

        {/* Hook Banner */}
        <div style={{ marginTop:12, background:"#1A1A1A", borderRadius:14, padding:"14px 16px", display:"flex", gap:12, alignItems:"center" }}>
          <div style={{ flexShrink:0, fontSize:24 }}>📱</div>
          <div style={{ flex:1 }}>
            <p style={{ fontSize:13, fontWeight:700, color:"white", marginBottom:3 }}>{T["en"].inspoHook}</p>
            <p style={{ fontSize:11, color:"#aaa", lineHeight:1.5 }}>{T["en"].inspoSub}</p>
          </div>
        </div>
      </div>

      {/* History Ansicht */}
      {showHistory && (
        <div style={{ padding:"14px 16px", borderBottom:`1px solid ${C.border}`, background:C.bg }}>
          <p style={{ fontSize:12, color:C.muted, marginBottom:10, fontStyle:"italic" }}>Saved analyses – tippe zum Wiederherstellen</p>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {history.map(h => (
              <div key={h.id} style={{ display:"flex", gap:10, background:C.card, border:`1px solid ${C.border}`, borderRadius:12, overflow:"hidden", cursor:"pointer" }}
                onClick={() => { setImgPreview(h.preview); setAnalysis(h.analysis); setShowHistory(false); }}>
                <img src={h.preview} alt="" style={{ width:64, height:56, objectFit:"cover", flexShrink:0 }} />
                <div style={{ flex:1, padding:"8px 10px" }}>
                  <p style={{ fontSize:13, fontWeight:700, color:C.text }}>{h.analysis?.stil || "Analyse"}</p>
                  <p style={{ fontSize:11, color:C.muted }}>{h.date} · {h.analysis?.budget || ""}</p>
                </div>
                <button onClick={e => { e.stopPropagation(); deleteFromHistory(h.id); }} style={{ background:"none", border:"none", color:"#CCC", cursor:"pointer", padding:"8px", fontSize:16, alignSelf:"center" }}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ padding:"14px 16px" }}>
        {/* Upload Area */}
        <div onClick={() => fileRef.current?.click()} style={{ border:`2px dashed ${imgPreview?C.accent:C.border}`, borderRadius:16, padding: imgPreview?"0":"32px 16px", cursor:"pointer", background:imgPreview?C.card:C.accentBg, marginBottom:14, overflow:"hidden", textAlign: imgPreview?"left":"center", position:"relative" }}>
          {imgPreview ? (
            <div style={{ position:"relative" }}>
              <img src={imgPreview} alt="" style={{ width:"100%", maxHeight:260, objectFit:"cover", display:"block" }} />
              <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)" }} />
              <div style={{ position:"absolute", bottom:12, left:14, right:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <p style={{ color:"white", fontWeight:700, fontSize:13 }}>📷 Foto hochgeladen</p>
                <button onClick={e => { e.stopPropagation(); setImgFile(null); setImgPreview(null); setAnalysis(null); }} style={{ background:"rgba(255,255,255,0.2)", border:"none", color:"white", borderRadius:20, padding:"4px 10px", fontSize:12, cursor:"pointer" }}>Different Photo</button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ fontSize:40, marginBottom:10 }}>📷</div>
              <p style={{ fontSize:15, fontWeight:700, color:C.accent, marginBottom:4 }}>Upload inspiration photo</p>
              <p style={{ fontSize:13, color:C.muted }}>Pinterest, Instagram, magazine – AI analyzes instantly</p>
            </>
          )}
        </div>
        <input type="file" ref={fileRef} accept="image/*" onChange={onFile} style={{ display:"none" }} />

        {/* Loading */}
        {loading && (
          <div className="fu" style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"20px 16px", textAlign:"center", marginBottom:14 }}>
            <div style={{ display:"flex", justifyContent:"center", gap:6, marginBottom:10 }}>
              {[0,1,2].map(j => <div key={j} style={{ width:10, height:10, borderRadius:"50%", background:C.accent, animation:`blink 1.2s ease ${j*0.2}s infinite` }} />)}
            </div>
            <p style={{ fontSize:14, fontWeight:600, color:C.text }}>AI analyzing materials...</p>
            <p style={{ fontSize:12, color:C.muted, marginTop:4 }}>Erkennt Fliesen, Holz, Armaturen, Farben</p>
          </div>
        )}

        {/* Error */}
        {error && <div style={{ background:"#FEF2F2", border:"1px solid #FCA5A5", borderRadius:12, padding:"12px 14px", marginBottom:14 }}><p style={{ color:"#B91C1C", fontSize:13 }}>❌ {error}</p></div>}

        {/* Analysis Result */}
        {analysis && (
          <div className="fu">
            {/* Stil & Stimmung */}
            <div style={{ background:`linear-gradient(135deg, ${C.accent}22, ${C.accentBg})`, border:`1px solid ${C.accent}44`, borderRadius:14, padding:"16px", marginBottom:14 }}>
              <p style={{ fontFamily:"'Playfair Display',serif", fontSize:20, color:C.text, marginBottom:6 }}>✨ {analysis.stil}</p>
              <p style={{ fontSize:13, color:C.text, lineHeight:1.65, marginBottom:12 }}>{analysis.stimmung}</p>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {analysis.farben?.map((f,i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <div style={{ width:24, height:24, borderRadius:6, background:f, border:"2px solid rgba(0,0,0,0.1)", flexShrink:0 }} />
                    <span style={{ fontSize:11, color:C.muted }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Eckdaten */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:14 }}>
              {[
                { label:"Budget", val:analysis.budget, icon:"💶" },
                { label:"Zeitaufwand", val:analysis.zeitaufwand, icon:"⏱" },
                { label:"Schwierigkeit", val:analysis.schwierigkeit, icon:"🔧" },
              ].map(({label,val,icon}) => (
                <div key={label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"10px 10px 8px", textAlign:"center" }}>
                  <p style={{ fontSize:16, marginBottom:4 }}>{icon}</p>
                  <p style={{ fontSize:10, color:C.muted, marginBottom:3 }}>{label}</p>
                  <p style={{ fontSize:12, fontWeight:700, color: label==="Schwierigkeit" ? (SCHWIERIGKEIT_COLOR[val]||C.text) : C.text, lineHeight:1.3 }}>{val}</p>
                </div>
              ))}
            </div>

            {/* Materialien */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, marginBottom:14, overflow:"hidden" }}>
              <div style={{ padding:"12px 14px", background:C.accentBg, borderBottom:`1px solid ${C.border}` }}>
                <p style={{ fontSize:14, fontWeight:700, color:C.accent }}>🪨 Detected Materials</p>
              </div>
              {analysis.materialien?.map((mat, i) => (
                <div key={i} style={{ padding:"12px 14px", borderBottom:i<analysis.materialien.length-1?`1px solid ${C.border}`:"none" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:2 }}>
                        <span style={{ fontSize:11, background:C.tag, color:C.muted, padding:"1px 7px", borderRadius:20, flexShrink:0 }}>{mat.bereich}</span>
                        {mat.farbe && <span style={{ fontSize:11, color:C.muted }}>{mat.farbe}</span>}
                      </div>
                      <p style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:2 }}>{mat.material}</p>
                      {mat.produkt && <p style={{ fontSize:12, color:C.muted }}>{mat.produkt}</p>}
                    </div>
                    {mat.preis && <span style={{ fontSize:12, fontWeight:600, color:C.green, flexShrink:0, marginLeft:10 }}>{mat.preis}</span>}
                  </div>
                  {mat.amazon && (
                    <a href={`https://www.amazon.de/s?k=${encodeURIComponent(mat.amazon)}&tag=${AFFILIATE_TAG}`} target="_blank" rel="noopener noreferrer"
                      style={{ display:"inline-flex", alignItems:"center", gap:4, marginTop:4, background:C.greenBg, color:C.green, borderRadius:20, padding:"4px 11px", fontSize:12, textDecoration:"none", fontWeight:600 }}>
                      🛒 {mat.amazon}
                    </a>
                  )}
                </div>
              ))}
            </div>

            {/* So machst du es nach */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, marginBottom:14, overflow:"hidden" }}>
              <div style={{ padding:"12px 14px", background:"#F0F7FF", borderBottom:`1px solid ${C.border}` }}>
                <p style={{ fontSize:14, fontWeight:700, color:"#1E40AF" }}>🔨 So machst du es nach</p>
              </div>
              <div style={{ padding:"12px 14px" }}>
                {analysis.umsetzung?.map((schritt, i) => (
                  <div key={i} style={{ display:"flex", gap:10, marginBottom:i<analysis.umsetzung.length-1?10:0 }}>
                    <div style={{ width:24, height:24, borderRadius:"50%", background:C.accent, color:"white", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, flexShrink:0 }}>{i+1}</div>
                    <p style={{ fontSize:13, color:C.text, lineHeight:1.55, flex:1, paddingTop:3 }}>{schritt.replace(/^Step \d+:\s*/,"")}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Profi-Tipps */}
            {analysis.profi_tipps?.length > 0 && (
              <div style={{ background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:14, padding:"14px", marginBottom:14 }}>
                <p style={{ fontSize:13, fontWeight:700, color:"#B45309", marginBottom:8 }}>⚡ Profi-Tipps</p>
                {analysis.profi_tipps.map((tip,i) => (
                  <p key={i} style={{ fontSize:13, color:"#7C4A03", lineHeight:1.6, marginBottom:i<analysis.profi_tipps.length-1?6:0 }}>• {tip}</p>
                ))}
              </div>
            )}

            {/* Sofort-Upgrades */}
            {analysis.sofort_upgrades?.length > 0 && (
              <div style={{ background:C.greenBg, border:`1px solid ${C.green}44`, borderRadius:14, padding:"14px", marginBottom:14 }}>
                <p style={{ fontSize:13, fontWeight:700, color:C.green, marginBottom:8 }}>✅ Guenstige Sofort-Upgrades</p>
                {analysis.sofort_upgrades.map((up,i) => (
                  <p key={i} style={{ fontSize:13, color:"#1A4731", lineHeight:1.6, marginBottom:i<analysis.sofort_upgrades.length-1?6:0 }}>• {up}</p>
                ))}
              </div>
            )}

            {/* Neues Foto */}
            <button onClick={() => fileRef.current?.click()} style={{ width:"100%", padding:"13px", borderRadius:50, border:`2px solid ${C.accent}`, background:C.accentBg, color:C.accent, fontWeight:700, cursor:"pointer", fontSize:14, fontFamily:"'DM Sans',sans-serif" }}>
              📷 Naechstes Foto analysieren
            </button>
          </div>
        )}

        {/* Hinweis wenn noch kein Foto */}
        {!imgPreview && !loading && (
          <div style={{ marginTop:8 }}>
            <p style={{ fontSize:12, color:C.muted, marginBottom:12, textAlign:"center", fontStyle:"italic" }}>Examples of what you can upload:</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {[
                { emoji:"🚿", text:"Dream bathroom from Pinterest" },
                { emoji:"🍳", text:"Kitchen from magazine" },
                { emoji:"🛋️", text:"Living room inspo" },
                { emoji:"🛏️", text:"Bedroom idea" },
              ].map(({emoji,text}) => (
                <div key={text} onClick={() => fileRef.current?.click()} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"14px", textAlign:"center", cursor:"pointer" }}>
                  <div style={{ fontSize:24, marginBottom:6 }}>{emoji}</div>
                  <p style={{ fontSize:12, color:C.muted }}>{text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── IDEEN TAB ────────────────────────────────────────────────────────────────
const TRENDS = [
  // ── BATHROOM (15) ─────────────────────────────────────────────────────────────
  { cat:"Bathroom", title:"Walk-In Rain Shower", desc:"Floor-level shower with 30×30cm ceiling rain head. 1.5% fall screed, Schlüter KERDI waterproofing, 8mm toughened glass. No breaking out if built from scratch.", how:"Plumber + DIY", budget:"1.500–5.000€", emoji:"🚿", img:"https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&h=220&fit=crop&q=80", amazon:"walk-in shower rain head glass screen 8mm" },
  { cat:"Bathroom", title:"Freestanding Bathtub", desc:"Freestanding acrylic tub with floor-mounted tap – the statement piece of any bathroom. Installation: only drain and supply needed, no building in.", how:"Plumber", budget:"800–3.000€", emoji:"🛁", img:"https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=600&h=220&fit=crop&q=80", amazon:"freestanding bathtub white acrylic oval" },
  { cat:"Bathroom", title:"Microcement Spa Bathroom", desc:"Seamless concrete look directly over existing tiles. 3 coats + 2× PU sealer. Antibacterial, easy to clean – looks like a 5-star hotel.", how:"DIY with practice", budget:"60–120€/m²", emoji:"🏛️", img:"https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=600&h=220&fit=crop&q=80", amazon:"microcement kit bathroom floor wall complete" },
  { cat:"Bathroom", title:"Matte Black Tap Set", desc:"Grohe Essence or Hansgrohe Metropol in matte black. Swap a tap = 2h DIY job. Paired with a wooden vanity = perfect contrast.", how:"DIY – 2 hours", budget:"200–600€", emoji:"🖤", img:"https://images.unsplash.com/photo-1575844611782-6c3a7d57ae3d?w=600&h=220&fit=crop&q=80", amazon:"grohe tap matte black bathroom set" },
  { cat:"Bathroom", title:"Handmade Zellige Tiles", desc:"Moroccan 10×10cm tiles – each one unique. Go over old tiles with C2 flex adhesive. As a feature wall or shower accent.", how:"DIY – weekend", budget:"40–120€/m²", emoji:"🟤", img:"https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&h=220&fit=crop&q=80", amazon:"zellige tiles handmade 10x10 bathroom" },
  { cat:"Bathroom", title:"Large Format 120×60cm Porcelain", desc:"Fewer grout lines = more luxury. Makes bathrooms look larger. Back-buttering essential! Use levelling system for tiles >60×60.", how:"Tiler", budget:"35–70€/m²", emoji:"⬛", img:"https://images.unsplash.com/photo-1620626011761-996317702782?w=600&h=220&fit=crop&q=80", amazon:"porcelain tiles 120x60 anthracite bathroom" },
  { cat:"Bathroom", title:"Floating Wooden Vanity", desc:"Teak or oak, wall-hung. Build a drywall void if no hollow wall. Makes floor look larger – instant spa feeling.", how:"Plumber + DIY", budget:"400–1.200€", emoji:"🪵", img:"https://images.unsplash.com/photo-1604709177225-055f99402ea3?w=600&h=220&fit=crop&q=80", amazon:"vanity unit oak teak floating wall-hung" },
  { cat:"Bathroom", title:"Backlit LED Mirror", desc:"IP44 rated, dimmable, anti-fog. Plug-in = no electrician needed. Instant wow effect for under €150.", how:"DIY – 30 min", budget:"80–400€", emoji:"💡", img:"https://images.unsplash.com/photo-1600147831337-1f7ea73a3e40?w=600&h=220&fit=crop&q=80", amazon:"led mirror bathroom backlit ip44 dimmable" },
  { cat:"Bathroom", title:"Marble-Look Large Format", desc:"Marble-effect porcelain – easier to maintain than real marble. 80×160cm for maximum luxury effect.", how:"Tiler", budget:"45–90€/m²", emoji:"🏔️", img:"https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&h=220&fit=crop&q=80", amazon:"marble look tiles large format bathroom" },
  { cat:"Bathroom", title:"Indirect LED Ceiling Lighting", desc:"LED cove lighting in the bathroom = spa atmosphere around the clock. IP44, 2700K, dimmable. Drywall box frame on ceiling.", how:"DIY + Electrician", budget:"200–500€", emoji:"✨", img:"https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=600&h=220&fit=crop&q=80", amazon:"led strip 2700k bathroom ceiling ip44 cove" },
  { cat:"Bathroom", title:"Japandi Minimalist Bathroom", desc:"Wood, concrete, green plant – stripped to the essentials. Tadelakt walls or microcement, hinoki wood stool, floor-to-ceiling windows.", how:"Medium project", budget:"2.000–6.000€", emoji:"🎋", img:"https://images.unsplash.com/photo-1604709177225-055f99402ea3?w=600&h=220&fit=crop&q=80", amazon:"japandi bathroom wood stool tadelakt" },
  { cat:"Bathroom", title:"Built-In Bath with Shelf", desc:"Built-in tub with a tiled shelf/bench alongside. Integrates storage and seating. Concrete or wood look possible.", how:"Tiler", budget:"1.500–4.000€", emoji:"🛀", img:"https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=600&h=220&fit=crop&q=80", amazon:"built-in bath surround tiles porcelain" },
  { cat:"Bathroom", title:"Double Basin Vanity", desc:"Two basins side by side on a long vanity unit. Ideal for couples. Saves time in the morning.", how:"Plumber", budget:"600–2.000€", emoji:"👫", img:"https://images.unsplash.com/photo-1575844611782-6c3a7d57ae3d?w=600&h=220&fit=crop&q=80", amazon:"double basin vanity unit 120cm set" },
  { cat:"Bathroom", title:"Towel Radiator as Design Feature", desc:"Heated towel rail in matte black or brushed gold as a statement piece. Saves space and dries towels.", how:"Plumber", budget:"150–500€", emoji:"🔥", img:"https://images.unsplash.com/photo-1600147831337-1f7ea73a3e40?w=600&h=220&fit=crop&q=80", amazon:"towel radiator matte black design bathroom" },
  { cat:"Bathroom", title:"Illuminated Shower Niche", desc:"Cut a niche into the shower wall: shelf for shampoo and candles. With LED strip behind = showpiece highlight.", how:"Tiler", budget:"200–600€", emoji:"💎", img:"https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&h=220&fit=crop&q=80", amazon:"shower niche stainless steel recessed led" },

  // ── KITCHEN (15) ──────────────────────────────────────────────────────────────
  { cat:"Kitchen", title:"Navy Blue Shaker Kitchen", desc:"Dark blue with brass handles and marble countertop. RAL 5011 steel blue or F&B Hague Blue. Classic and timeless.", how:"DIY 2-3 days", budget:"150–500€", emoji:"🔵", img:"https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=220&fit=crop&q=80", amazon:"kitchen cabinet paint navy blue primer satin" },
  { cat:"Kitchen", title:"Open Oak Shelves", desc:"Remove wall units, replace with floating 4cm solid wood boards. Room feels instantly larger. Hardware store cuts to size.", how:"DIY – half day", budget:"100–350€", emoji:"📚", img:"https://images.unsplash.com/photo-1556909211-36987e6e9a65?w=600&h=220&fit=crop&q=80", amazon:"solid wood shelf oak 4cm floating kitchen" },
  { cat:"Kitchen", title:"KALLAX Kitchen Island", desc:"IKEA KALLAX + thick solid wood top = affordable island. Add bar stools = family gathering spot. Under €600.", how:"DIY – weekend", budget:"300–700€", emoji:"🏝️", img:"https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=600&h=220&fit=crop&q=80", amazon:"kitchen island solid wood top oak ikea kallax" },
  { cat:"Kitchen", title:"Zellige Metro Tile Backsplash", desc:"Handmade 7.5×15cm tiles as kitchen backsplash. Directly over old tiles. White, cream or sage green.", how:"DIY – 1 day", budget:"50–150€", emoji:"⬜", img:"https://images.unsplash.com/photo-1556909048-f0a46d7c3c0a?w=600&h=220&fit=crop&q=80", amazon:"metro tiles zellige kitchen backsplash" },
  { cat:"Kitchen", title:"Brass & Copper Hardware", desc:"Handles, tap and pendant lights in brushed brass. Swap 128mm bar handles = 30 min, huge impact.", how:"DIY – 30 min", budget:"40–200€", emoji:"✨", img:"https://images.unsplash.com/photo-1556910638-6cdac31d8c23?w=600&h=220&fit=crop&q=80", amazon:"kitchen handles brass brushed set 20 pack" },
  { cat:"Kitchen", title:"Butcher Block Worktop", desc:"Solid wood (beech/oak/walnut) as contrast to dark fronts. Annual Osmo oil treatment. Seal cut edges IMMEDIATELY!", how:"DIY on swap", budget:"80–350€", emoji:"🪵", img:"https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=600&h=220&fit=crop&q=80", amazon:"solid wood worktop kitchen oak beech oiled" },
  { cat:"Kitchen", title:"LED Strip Under Wall Units", desc:"2700K warm white under all wall units = task lighting + atmosphere. Makes food look more appetising. Full kit with driver from €30.", how:"DIY – 1 hour", budget:"30–80€", emoji:"💡", img:"https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=220&fit=crop&q=80", amazon:"led strip kitchen under cabinet 2700k warm white" },
  { cat:"Kitchen", title:"Sage Green Shaker Fronts", desc:"Sage green (RAL 6021) with brass handles and a live-edge shelf above. Warm, grounded, Instagram-worthy.", how:"DIY 2-3 days", budget:"100–400€", emoji:"🌿", img:"https://images.unsplash.com/photo-1556910638-6cdac31d8c23?w=600&h=220&fit=crop&q=80", amazon:"kitchen cabinet paint sage green primer satin" },
  { cat:"Kitchen", title:"Pendant Lights Over Island", desc:"3 pendants equally spaced over island or table. Height: 65–75cm from surface. Globe, sputnik or industrial style.", how:"Electrician", budget:"100–600€", emoji:"💫", img:"https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=600&h=220&fit=crop&q=80", amazon:"pendant light kitchen island set 3 gold" },
  { cat:"Kitchen", title:"Handleless J-Pull Fronts", desc:"Routed channel at top of door instead of handles = clean minimalist look. Tip-on or J-pull profile possible.", how:"Carpenter / Fitting", budget:"300–800€", emoji:"🤍", img:"https://images.unsplash.com/photo-1556909048-f0a46d7c3c0a?w=600&h=220&fit=crop&q=80", amazon:"handleless kitchen doors j-pull modern" },
  { cat:"Kitchen", title:"Concrete Look Kitchen Floor", desc:"Large-format porcelain tiles in concrete look for the kitchen floor. Easy to clean, timeless. Can go over old tiles.", how:"Tiler", budget:"25–50€/m²", emoji:"🔲", img:"https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=600&h=220&fit=crop&q=80", amazon:"concrete look tiles kitchen porcelain grey" },
  { cat:"Kitchen", title:"Statement Extractor Hood", desc:"Stainless steel chimney or wall hood in matte black as a design feature rather than hidden away. Chimney or bell shape.", how:"Fitting", budget:"300–1.500€", emoji:"🏭", img:"https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=600&h=220&fit=crop&q=80", amazon:"extractor hood wall-mounted matte black design" },
  { cat:"Kitchen", title:"Quartz Stone Worktop", desc:"Quartz (Silestone, Compac) – natural stone look with no sealing needed. Heat and scratch resistant. 2cm or slim 1.2cm edge.", how:"Professional fit", budget:"400–1.200€", emoji:"💎", img:"https://images.unsplash.com/photo-1556909211-36987e6e9a65?w=600&h=220&fit=crop&q=80", amazon:"quartz worktop kitchen silestone white grey" },
  { cat:"Kitchen", title:"Pantry Storage Cupboard", desc:"Tall larder unit next to the fridge with pull-out inserts and internal LED lighting. Double your storage space.", how:"Carpenter / IKEA", budget:"300–1.000€", emoji:"📦", img:"https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=220&fit=crop&q=80", amazon:"pantry larder unit kitchen storage pull-out" },
  { cat:"Kitchen", title:"Microcement Kitchen Backsplash", desc:"Seamless microcement backsplash instead of tiles. Easy to clean, extraordinary look. Anthracite or warm greige.", how:"Intermediate DIY", budget:"80–200€/m²", emoji:"🏛️", img:"https://images.unsplash.com/photo-1556910638-6cdac31d8c23?w=600&h=220&fit=crop&q=80", amazon:"microcement kitchen backsplash work area" },

  // ── LIVING ROOM (15) ──────────────────────────────────────────────────────────
  { cat:"Living Room", title:"Dark Green Feature Wall", desc:"One wall in bottle green RAL 6009. Lambswool roller, 2 coats. €30–60 for the biggest visual impact in the whole room.", how:"DIY – 1 day", budget:"30–80€", emoji:"🌿", img:"https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=220&fit=crop&q=80", amazon:"wall paint dark green matt living room" },
  { cat:"Living Room", title:"Fluted Panel TV Wall", desc:"Grooved MDF slats behind the TV, LED strip behind. Pre-oil or paint before fitting. Magazine look for €150.", how:"DIY – half day", budget:"80–250€", emoji:"📺", img:"https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=220&fit=crop&q=80", amazon:"mdf fluted panel wall wood effect" },
  { cat:"Living Room", title:"Ceiling Cove LED Lighting", desc:"15cm timber frame at ceiling line, 2700K LED strip behind. Warmest possible light = hotel feeling. Driver behind the box.", how:"DIY – weekend", budget:"150–400€", emoji:"✨", img:"https://images.unsplash.com/photo-1600210492493-0946911123ea?w=600&h=220&fit=crop&q=80", amazon:"led strip 2700k cove box ceiling living room" },
  { cat:"Living Room", title:"Earth Tones Rattan & Jute 2026", desc:"Terracotta, ochre, sandstone. Rattan armchair, jute rug 200×300, handmade ceramics. No contractor needed.", how:"Immediately", budget:"200–600€", emoji:"🍂", img:"https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=220&fit=crop&q=80", amazon:"rattan armchair jute rug terracotta living room" },
  { cat:"Living Room", title:"Limewash Textured Wall", desc:"Lime plaster look with living texture. Works over normal paint. Warm greige, dusty pink, dove blue – every wall unique.", how:"DIY – 1 day", budget:"40–120€", emoji:"🏺", img:"https://images.unsplash.com/photo-1558882224-dda166733046?w=600&h=220&fit=crop&q=80", amazon:"limewash paint lime plaster effect textured" },
  { cat:"Living Room", title:"Floor-to-Ceiling Built-In Shelving", desc:"MDF shelving wall to wall. LED strip in the cove behind. White painted or oak veneered.", how:"2 weekends", budget:"400–1.500€", emoji:"📖", img:"https://images.unsplash.com/photo-1509644851169-2acc08aa25b5?w=600&h=220&fit=crop&q=80", amazon:"built-in shelving mdf living room floor ceiling" },
  { cat:"Living Room", title:"Curved Bouclé Sofa", desc:"Curved bouclé sofa in cream or light grey. The sofa trend of 2026. Paired with a terracotta wall = perfect.", how:"Purchase", budget:"800–3.000€", emoji:"🛋️", img:"https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=220&fit=crop&q=80", amazon:"bouclé sofa curved cream living room" },
  { cat:"Living Room", title:"Botanical Living Room", desc:"Large monstera, fiddle leaf fig, olive tree as main elements – not just accessories. Baskets as pots, bright corners.", how:"Immediately", budget:"100–400€", emoji:"🌱", img:"https://images.unsplash.com/photo-1416879595882-b3d065a0e45d?w=600&h=220&fit=crop&q=80", amazon:"monstera large plant rattan pot living room" },
  { cat:"Living Room", title:"Smart Home Lighting (Shelly)", desc:"Shelly relay behind the light switch – app-controlled, no electrician. Works with Alexa/Google Home. Set up scenes.", how:"DIY – 30 min", budget:"20–60€", emoji:"📱", img:"https://images.unsplash.com/photo-1600210492493-0946911123ea?w=600&h=220&fit=crop&q=80", amazon:"shelly dimmer smart home light switch" },
  { cat:"Living Room", title:"Herringbone Wood Floor", desc:"Engineered parquet laid in herringbone – the most elegant pattern. Visually widens the room. Oiled oak, 12cm wide.", how:"DIY – weekend", budget:"40–80€/m²", emoji:"⬛", img:"https://images.unsplash.com/photo-1562663474-6cbb3eaa4d14?w=600&h=220&fit=crop&q=80", amazon:"engineered oak herringbone parquet living room" },
  { cat:"Living Room", title:"XXL Brass Arc Floor Lamp", desc:"Large arc lamp in brushed brass or black = instant luxury effect. No electrician – just plug in.", how:"Purchase + assemble", budget:"150–600€", emoji:"🌙", img:"https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=220&fit=crop&q=80", amazon:"arc floor lamp brass large living room" },
  { cat:"Living Room", title:"Dark Velvet Curtains", desc:"Floor-to-ceiling velvet curtains make every room more sumptuous. Always hang 20cm wider than the window!", how:"Hang up", budget:"80–300€", emoji:"🎭", img:"https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&h=220&fit=crop&q=80", amazon:"velvet curtains dark floor length eyelet" },
  { cat:"Living Room", title:"Gallery Wall", desc:"5–9 pictures in different sizes as a wall arrangement. Lay out on the floor first, then hang with spirit level.", how:"DIY", budget:"50–200€", emoji:"🖼️", img:"https://images.unsplash.com/photo-1509644851169-2acc08aa25b5?w=600&h=220&fit=crop&q=80", amazon:"picture frames set gallery wall mixed sizes" },
  { cat:"Living Room", title:"Stone-Effect Feature Wall", desc:"Lightweight 3D wall panels in natural stone look (limestone, slate). Glue on – no drilling. Fireplace or TV wall.", how:"DIY – 2 hours", budget:"30–80€/m²", emoji:"🪨", img:"https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?w=600&h=220&fit=crop&q=80", amazon:"3d wall panels stone effect slate limestone" },

  // ── BEDROOM (12) ──────────────────────────────────────────────────────────────
  { cat:"Bedroom", title:"DIY Bouclé Headboard", desc:"MDF cut to size + 5cm RG35 foam + staple bouclé fabric. Hotel feeling for €150. Paint wall behind in terracotta.", how:"DIY – 4h", budget:"80–200€", emoji:"🛏️", img:"https://images.unsplash.com/photo-1617325247661-675ab4b64ae2?w=600&h=220&fit=crop&q=80", amazon:"bouclé fabric cream upholstery headboard foam" },
  { cat:"Bedroom", title:"Midnight Blue Ceiling", desc:"Only the ceiling in Hague Blue or midnight blue. Walls white. Cosy feeling like sleeping under the night sky.", how:"DIY – 3h", budget:"25–60€", emoji:"🌙", img:"https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&h=220&fit=crop&q=80", amazon:"ceiling paint midnight blue dark matt" },
  { cat:"Bedroom", title:"Swing-Arm Wall Lights", desc:"Both sides of the bed, 2200K, plug-in version = no electrician. Brass or matte black. Replaces bedside lamps.", how:"DIY – 30 min", budget:"60–250€", emoji:"💡", img:"https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=600&h=220&fit=crop&q=80", amazon:"swing arm wall light bedroom brass reading" },
  { cat:"Bedroom", title:"Japandi Bedroom", desc:"Vertical wood slats on the wall, low platform bed, greige tones, one large branch as décor. Pure zen.", how:"DIY – 1 day", budget:"100–400€", emoji:"🎋", img:"https://images.unsplash.com/photo-1540518614846-7eded433c457?w=600&h=220&fit=crop&q=80", amazon:"japandi bedroom wood slats platform bed low" },
  { cat:"Bedroom", title:"Walk-In Wardrobe", desc:"Turn a corner or small room into a walk-in closet. IKEA PAX system or custom built. Many people's dream.", how:"Weekend", budget:"400–2.000€", emoji:"👗", img:"https://images.unsplash.com/photo-1617325247661-675ab4b64ae2?w=600&h=220&fit=crop&q=80", amazon:"walk-in wardrobe system pax fitted storage" },
  { cat:"Bedroom", title:"Linen Bedding & Layers", desc:"Quality linen bedding + cotton throws + cushions in 3 tones. Hotel feeling without any renovation.", how:"Immediately", budget:"80–250€", emoji:"🛌", img:"https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&h=220&fit=crop&q=80", amazon:"linen bedding set natural washed linen" },
  { cat:"Bedroom", title:"Dark Luxury Bedroom", desc:"Charcoal walls, brass accents, velvet rug, floor-length curtains. Moody looks are the trend of 2026.", how:"Paint + purchase", budget:"200–800€", emoji:"🌑", img:"https://images.unsplash.com/photo-1540518614846-7eded433c457?w=600&h=220&fit=crop&q=80", amazon:"wall paint dark charcoal anthracite bedroom" },
  { cat:"Bedroom", title:"Cassette Blackout Blind", desc:"Cassette blind directly on the window sash – completely dark even in summer. Essential for sleep quality.", how:"DIY – 30 min", budget:"30–120€", emoji:"🌚", img:"https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=600&h=220&fit=crop&q=80", amazon:"blackout blind cassette adhesive no-drill" },
  { cat:"Bedroom", title:"Terracotta Feature Wall", desc:"Only the wall behind the bed in terracotta. Rest of walls white. Add bouclé cushions to complete.", how:"DIY – 2h", budget:"20–45€", emoji:"🔶", img:"https://images.unsplash.com/photo-1617325247661-675ab4b64ae2?w=600&h=220&fit=crop&q=80", amazon:"wall paint terracotta warm orange bedroom" },
  { cat:"Bedroom", title:"Raw Wood Headboard", desc:"Solid oak or walnut headboard – organic form, no sanding needed. Characterful and unique.", how:"Purchase/DIY", budget:"150–600€", emoji:"🌲", img:"https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&h=220&fit=crop&q=80", amazon:"headboard solid wood oak walnut natural" },
  { cat:"Bedroom", title:"Fitted Wardrobe with Sliding Door", desc:"Frameless sliding door with mirror panel = room looks twice as large. Frame in matte black or white.", how:"Carpenter", budget:"800–3.000€", emoji:"🪞", img:"https://images.unsplash.com/photo-1540518614846-7eded433c457?w=600&h=220&fit=crop&q=80", amazon:"sliding wardrobe door mirror frameless fitted" },
  { cat:"Bedroom", title:"Floating Wall-Mounted Bedside", desc:"Floating bedside table directly on the wall – no legs, minimalist, easy to clean. Oak or white.", how:"DIY – 1h", budget:"60–250€", emoji:"🛋️", img:"https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=600&h=220&fit=crop&q=80", amazon:"bedside table wall-mounted floating oak white" },

  // ── DINING (8) ────────────────────────────────────────────────────────────────
  { cat:"Dining", title:"Solid Wood & Steel Dining Table", desc:"Oak slab on black steel legs = industrial look. 220cm seats 8 people. Robust, scratch-resistant, timeless.", how:"Purchase", budget:"500–2.000€", emoji:"🍽️", img:"https://images.unsplash.com/photo-1549187774-b4e9b0445b41?w=600&h=220&fit=crop&q=80", amazon:"dining table solid wood oak steel legs industrial" },
  { cat:"Dining", title:"Pendant Lights Over Table", desc:"3 ball pendants or 1 long linear bar above the table. Height: 65–75cm from table surface. Warm 2700K.", how:"Electrician", budget:"100–800€", emoji:"💡", img:"https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=600&h=220&fit=crop&q=80", amazon:"pendant light dining table linear set gold 3" },
  { cat:"Dining", title:"Bench & Chair Combo", desc:"Bench on one side, chairs on the other = cosier and more space-efficient. Bench in wood or upholstered.", how:"Purchase", budget:"300–1.200€", emoji:"🪑", img:"https://images.unsplash.com/photo-1549187774-b4e9b0445b41?w=600&h=220&fit=crop&q=80", amazon:"dining bench oak wood upholstered" },
  { cat:"Dining", title:"Green Plant Wall in Dining Room", desc:"Vertical plant picture as a living wallpaper. Or simply 3 large pots in a corner. Brings life to the room.", how:"Immediately", budget:"50–300€", emoji:"🌱", img:"https://images.unsplash.com/photo-1416879595882-b3d065a0e45d?w=600&h=220&fit=crop&q=80", amazon:"vertical plant wall indoor dining room" },
  { cat:"Dining", title:"Marble Statement Table", desc:"Real Calacatta marble or affordable porcelain version. Rectangular or oval. Pair with leather chairs.", how:"Purchase", budget:"600–3.000€", emoji:"💎", img:"https://images.unsplash.com/photo-1556918134-66e57c2f28e3?w=600&h=220&fit=crop&q=80", amazon:"dining table marble oval white calacatta" },
  { cat:"Dining", title:"Timber Cladding on Dining Wall", desc:"Fluted wood panels or simple pine battens vertically. Oil natural colour or paint white. Warms any room.", how:"DIY – weekend", budget:"100–400€", emoji:"🪵", img:"https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=220&fit=crop&q=80", amazon:"wood battens vertical wall dining fluted" },
  { cat:"Dining", title:"Velvet Chairs as Colour Accent", desc:"Velvet chairs in mustard yellow, dark green or terracotta next to a plain table. One colour accent is enough.", how:"Purchase", budget:"200–800€", emoji:"🪑", img:"https://images.unsplash.com/photo-1549187774-b4e9b0445b41?w=600&h=220&fit=crop&q=80", amazon:"velvet dining chair green terracotta mustard" },
  { cat:"Dining", title:"Open Wine Rack Room Divider", desc:"Metal or wood rack visually divides living and dining areas without walls. Wine bottles as décor.", how:"DIY/Purchase", budget:"150–600€", emoji:"🍷", img:"https://images.unsplash.com/photo-1558618049-6b1cdd80a2e2?w=600&h=220&fit=crop&q=80", amazon:"wine rack wall room divider open wood metal" },

  // ── HALLWAY (8) ───────────────────────────────────────────────────────────────
  { cat:"Hallway", title:"Dark Dramatic Hallway", desc:"Paint hallway fully dark (anthracite or midnight blue). Light floor = drama effect. Wall mirror makes it larger.", how:"DIY – 2h", budget:"25–60€", emoji:"🚪", img:"https://images.unsplash.com/photo-1558882224-dda166733046?w=600&h=220&fit=crop&q=80", amazon:"wall paint anthracite hallway matt dark" },
  { cat:"Hallway", title:"Round Mirror Statement", desc:"Large round mirror (80–100cm) instantly makes the hallway look bigger. Brass or matte black frame.", how:"Hang up", budget:"80–400€", emoji:"🪞", img:"https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=600&h=220&fit=crop&q=80", amazon:"round mirror large brass hallway 80cm" },
  { cat:"Hallway", title:"Wooden Coat Rail", desc:"Solid wood board with iron hooks – simple and functional. Alternative: IKEA Brimnes or driftwood DIY.", how:"DIY – 1h", budget:"30–150€", emoji:"🧥", img:"https://images.unsplash.com/photo-1600210492493-0946911123ea?w=600&h=220&fit=crop&q=80", amazon:"coat rail solid wood hooks hallway" },
  { cat:"Hallway", title:"Herringbone Tile Floor", desc:"Classic herringbone floor in black-white or terracotta for the hallway. Timeless and adds value.", how:"Tiler", budget:"35–70€/m²", emoji:"♟️", img:"https://images.unsplash.com/photo-1574739782594-db4ead022697?w=600&h=220&fit=crop&q=80", amazon:"herringbone tiles hallway black white terracotta" },
  { cat:"Hallway", title:"Statement Wallpaper", desc:"Botanical or geometric wallpaper on one wall only = artwork. The hallway becomes the first wow impression.", how:"DIY – 2h", budget:"50–200€", emoji:"🌺", img:"https://images.unsplash.com/photo-1558882224-dda166733046?w=600&h=220&fit=crop&q=80", amazon:"botanical wallpaper hallway statement feature" },
  { cat:"Hallway", title:"Storage Bench + Shoe Rack Combo", desc:"Entrance bench with shoe storage below and hooks above. IKEA Hemnes hack or custom built.", how:"IKEA/DIY", budget:"100–400€", emoji:"👟", img:"https://images.unsplash.com/photo-1600147831337-1f7ea73a3e40?w=600&h=220&fit=crop&q=80", amazon:"entrance bench shoe storage hooks hallway" },
  { cat:"Hallway", title:"LED Skirting Night Lighting", desc:"LED strip in the skirting board or ceiling = orientation light at night without a switch. Motion sensor.", how:"DIY", budget:"30–80€", emoji:"🔆", img:"https://images.unsplash.com/photo-1600210492493-0946911123ea?w=600&h=220&fit=crop&q=80", amazon:"led skirting light hallway orientation motion sensor" },
  { cat:"Hallway", title:"Console Table Entrance Set", desc:"Slim console table with a plant, mirror above and a tray for keys. First impressions count.", how:"Immediately", budget:"80–300€", emoji:"🌿", img:"https://images.unsplash.com/photo-1416879595882-b3d065a0e45d?w=600&h=220&fit=crop&q=80", amazon:"console table narrow hallway with mirror set" },

  // ── HOME OFFICE (5) ───────────────────────────────────────────────────────────
  { cat:"Home Office", title:"Floating Wall Desk", desc:"Floating desk board in oak or MDF – 180cm wide, 60cm deep. No legs, more floor space, clean look.", how:"DIY – 2h", budget:"80–250€", emoji:"💻", img:"https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600&h=220&fit=crop&q=80", amazon:"floating wall desk oak mounted shelf office" },
  { cat:"Home Office", title:"Bookshelf as Video Call Background", desc:"Full bookshelf as a Zoom background makes an impression. Built-in Billy hack or custom shelving.", how:"IKEA/Carpenter", budget:"200–800€", emoji:"📚", img:"https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&h=220&fit=crop&q=80", amazon:"bookshelf built-in wall home office" },
  { cat:"Home Office", title:"Acoustic Felt Panels", desc:"Felt or foam acoustic panels significantly reduce echo – important for video calls. Also decorative.", how:"DIY – 1h", budget:"50–200€", emoji:"🎵", img:"https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=600&h=220&fit=crop&q=80", amazon:"acoustic panels felt home office sound" },
  { cat:"Home Office", title:"Pegboard Wall Organiser", desc:"Perforated board system for tools, pens, notes. IKEA Skadis or custom. Flexible and decorative.", how:"DIY – 1h", budget:"30–100€", emoji:"📌", img:"https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=600&h=220&fit=crop&q=80", amazon:"pegboard wall organiser office tools" },
  { cat:"Home Office", title:"Plant Wall Behind Desk", desc:"A real or artificial plant wall as a background. Reduces stress and improves air quality.", how:"DIY/Purchase", budget:"100–500€", emoji:"🌿", img:"https://images.unsplash.com/photo-1416879595882-b3d065a0e45d?w=600&h=220&fit=crop&q=80", amazon:"vertical plant wall home office artificial" },

  // ── FLOORING (8) ──────────────────────────────────────────────────────────────
  { cat:"Flooring", title:"SPC Vinyl Over Existing Tiles", desc:"100% waterproof, click system over old tiles. No breaking out, no adhesive. Finished in a day.", how:"DIY – 1 day", budget:"15–35€/m²", emoji:"🪵", img:"https://images.unsplash.com/photo-1574739782594-db4ead022697?w=600&h=220&fit=crop&q=80", amazon:"spc vinyl click flooring waterproof over tiles" },
  { cat:"Flooring", title:"Herringbone Oak Parquet", desc:"Boards in herringbone pattern – the most elegant laying method. Oiled oak 12cm wide. Adds value.", how:"DIY/Pro", budget:"40–80€/m²", emoji:"⬛", img:"https://images.unsplash.com/photo-1562663474-6cbb3eaa4d14?w=600&h=220&fit=crop&q=80", amazon:"engineered oak parquet herringbone flooring" },
  { cat:"Flooring", title:"Epoxy Resin Concrete Look", desc:"Seamless industrial floor over existing surface. Very durable, ideal for kitchen and hallway. Preparation is everything.", how:"Intermediate", budget:"20–50€/m²", emoji:"🔘", img:"https://images.unsplash.com/photo-1574739782594-db4ead022697?w=600&h=220&fit=crop&q=80", amazon:"epoxy resin floor concrete look self-levelling kit" },
  { cat:"Flooring", title:"Terracotta Mediterranean Tiles", desc:"Handmade terracotta floor tiles – warm, Mediterranean, timeless. Must be sealed.", how:"Tiler", budget:"20–60€/m²", emoji:"🔶", img:"https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&h=220&fit=crop&q=80", amazon:"terracotta tiles handmade floor mediterranean" },
  { cat:"Flooring", title:"Cement Tile Vintage Pattern", desc:"Colourful patterned tiles in black-white or multicolour. For kitchen, bathroom or hallway. Can go over old tiles.", how:"Tiler", budget:"30–80€/m²", emoji:"🎨", img:"https://images.unsplash.com/photo-1574739782594-db4ead022697?w=600&h=220&fit=crop&q=80", amazon:"cement tiles pattern vintage colourful" },
  { cat:"Flooring", title:"Large Rug as Zone Definer", desc:"Big rug (300×400) defines the seating area. Jute, wool or outdoor rug. All furniture legs on it.", how:"Lay down", budget:"80–600€", emoji:"🟫", img:"https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=220&fit=crop&q=80", amazon:"large area rug living room jute wool 300x400" },
  { cat:"Flooring", title:"Dark Wood Floor Drama", desc:"Dark oak parquet (smoked oak, walnut) + light walls = maximum contrast effect.", how:"Lay", budget:"45–100€/m²", emoji:"⬛", img:"https://images.unsplash.com/photo-1562663474-6cbb3eaa4d14?w=600&h=220&fit=crop&q=80", amazon:"smoked oak parquet dark floor boards" },
  { cat:"Flooring", title:"White Marble Floor Luxury", desc:"Large-format white marble tiles or marble-effect porcelain. Makes rooms larger and lighter. Porcelain is easier to maintain than real marble.", how:"Tiler", budget:"40–120€/m²", emoji:"🤍", img:"https://images.unsplash.com/photo-1620626011761-996317702782?w=600&h=220&fit=crop&q=80", amazon:"marble tiles white large format luxury porcelain" },

  // ── TERRACE (12) ──────────────────────────────────────────────────────────────
  { cat:"Terrace", title:"Composite WPC Decking", desc:"Low-maintenance WPC boards on adjustable pedestals. Clip fixing is invisible. Lays directly over concrete.", how:"DIY – weekend", budget:"35–65€/m²", emoji:"🌴", img:"https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600&h=220&fit=crop&q=80", amazon:"wpc composite decking terrace clips pedestals" },
  { cat:"Terrace", title:"Polyrattan Outdoor Lounge", desc:"Modular polyrattan lounge set with Sunbrella cushions. UV-resistant, weatherproof. Outdoor rug as a base.", how:"Assemble", budget:"400–1.500€", emoji:"☀️", img:"https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=220&fit=crop&q=80", amazon:"outdoor lounge polyrattan sunbrella terrace" },
  { cat:"Terrace", title:"DIY Douglas Fir Pergola", desc:"Freestanding pergola in Douglas fir – weatherproof without treatment. Train climbing plants over it.", how:"Weekend", budget:"400–1.500€", emoji:"🌿", img:"https://images.unsplash.com/photo-1416879595882-b3d065a0e45d?w=600&h=220&fit=crop&q=80", amazon:"pergola kit douglas fir DIY garden" },
  { cat:"Terrace", title:"Built-In Outdoor Gas BBQ", desc:"Modular outdoor kitchen with built-in gas grill, porcelain worktop. The upgrade for sociable evenings.", how:"Pro", budget:"1.000–5.000€", emoji:"🔥", img:"https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=220&fit=crop&q=80", amazon:"outdoor kitchen gas grill built-in garden" },
  { cat:"Terrace", title:"Mediterranean Olive Tree Oasis", desc:"Olive trees in terracotta pots, lavender as privacy screen, climbing roses. No contractor needed.", how:"Immediately", budget:"200–600€", emoji:"🫒", img:"https://images.unsplash.com/photo-1558882224-dda166733046?w=600&h=220&fit=crop&q=80", amazon:"olive tree terrace terracotta pot large" },
  { cat:"Terrace", title:"Solar Fairy Lights 2200K", desc:"Warm white solar fairy lights above the terrace. No cable, no electricity. Automatic on/off. 10m from €20.", how:"Hang up", budget:"20–80€", emoji:"✨", img:"https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600&h=220&fit=crop&q=80", amazon:"solar fairy lights 2200k warm white outdoor" },
  { cat:"Terrace", title:"Bamboo Privacy Screen", desc:"Bamboo screening mats on the fence = instant privacy. 3 mats = approx. €45. Natural look.", how:"30 min", budget:"30–80€", emoji:"🎋", img:"https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=220&fit=crop&q=80", amazon:"bamboo privacy screen balcony fence terrace" },
  { cat:"Terrace", title:"Outdoor Rug as Base", desc:"Outdoor rug under the lounge set defines the area and makes it cosier. UV-resistant, washable.", how:"Lay down", budget:"50–300€", emoji:"🟫", img:"https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=600&h=220&fit=crop&q=80", amazon:"outdoor rug terrace weatherproof uv resistant" },
  { cat:"Terrace", title:"Raised Vegetable Bed", desc:"Raised bed in larch wood – vegetables in minimal space. No bending over. Fill: soil + compost 40:60.", how:"DIY – 2h", budget:"80–300€", emoji:"🌱", img:"https://images.unsplash.com/photo-1416879595882-b3d065a0e45d?w=600&h=220&fit=crop&q=80", amazon:"raised garden bed larch wood vegetable herbs" },
  { cat:"Terrace", title:"Inflatable Pool & Lounge", desc:"Inflatable pool from €50 + lounge chair + sun sail = holiday at home. For kids and adults.", how:"Set up", budget:"100–500€", emoji:"💦", img:"https://images.unsplash.com/photo-1558905923-6fe62de33bc3?w=600&h=220&fit=crop&q=80", amazon:"inflatable pool terrace sun sail paddling" },
  { cat:"Terrace", title:"Balcony City Garden DIY", desc:"Possible on just 6m²: privacy screen, 1 chair + table, 3 pots. Use wall shelves for plants.", how:"1 day", budget:"100–300€", emoji:"🌇", img:"https://images.unsplash.com/photo-1416879595882-b3d065a0e45d?w=600&h=220&fit=crop&q=80", amazon:"balcony privacy screen city garden pots" },
  { cat:"Terrace", title:"Fire Basket & Evening Atmosphere", desc:"Cast iron fire basket or bowl + bio-ethanol in a terracotta dish. Campfire feeling on your own terrace.", how:"Purchase", budget:"50–300€", emoji:"🔥", img:"https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600&h=220&fit=crop&q=80", amazon:"fire basket cast iron terrace outdoor bowl" },
];

const KATEGORIEN = ["All", "Bathroom", "Kitchen", "Living Room", "Bedroom", "Dining", "Hallway", "Home Office", "Flooring", "Terrace"];

function IdeenTab({ lang = "de" }) {
  const [kat, setKat] = useState("All");
  const [openTrend, setOpenTrend] = useState(null);
  const gefiltert = kat === "All" ? TRENDS : TRENDS.filter(t => t.cat === kat);

  return (
    <div style={{ overflowY:"auto", height:"100%" }}>
      {/* Filter */}
      <div style={{ padding:"14px 16px 10px", position:"sticky", top:0, background:C.bg, zIndex:10, borderBottom:`1px solid ${C.border}` }}>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:20, marginBottom:10 }}>Ideas & Trends 2026</h2>
        <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:2 }}>
          {KATEGORIEN.map(k => (
            <button key={k} onClick={() => setKat(k)} style={{ padding:"6px 13px", borderRadius:20, border:`1px solid ${kat===k?C.accent:C.border}`, background:kat===k?C.accent:"white", color:kat===k?"white":C.muted, fontSize:12, cursor:"pointer", fontWeight:kat===k?600:400, fontFamily:"'DM Sans',sans-serif", flexShrink:0 }}>{k}</button>
          ))}
        </div>
      </div>

      <div style={{ padding:"12px 16px 20px" }}>
        <p style={{ fontSize:12, color:C.muted, marginBottom:14, fontStyle:"italic" }}>{gefiltert.length} Ideen – tap for more details</p>
        {gefiltert.map((trend, i) => (
          <div key={i} className="fu" style={{ background:C.card, border:`1px solid ${openTrend===i?C.accent:C.border}`, borderRadius:16, marginBottom:12, overflow:"hidden", animationDelay:`${i*0.03}s` }}>
            {/* Bild */}
            <div style={{ position:"relative", height:170, overflow:"hidden", cursor:"pointer" }} onClick={() => setOpenTrend(openTrend===i?null:i)}>
              <img src={trend.img} alt={trend.title} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
              <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 55%)" }} />
              <div style={{ position:"absolute", top:10, right:10 }}>
                <span style={{ background:"rgba(255,255,255,0.9)", color:C.accent, borderRadius:20, padding:"3px 9px", fontSize:11, fontWeight:700 }}>{trend.cat}</span>
              </div>
              <div style={{ position:"absolute", bottom:12, left:14, right:14 }}>
                <p style={{ color:"white", fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700, marginBottom:4 }}>{trend.emoji} {trend.title}</p>
                <div style={{ display:"flex", gap:6 }}>
                  <span style={{ background:"rgba(255,255,255,0.2)", color:"white", borderRadius:20, padding:"2px 8px", fontSize:11 }}>💶 {trend.budget}</span>
                  <span style={{ background:"rgba(255,255,255,0.2)", color:"white", borderRadius:20, padding:"2px 8px", fontSize:11 }}>🔨 {trend.how}</span>
                </div>
              </div>
            </div>

            {/* Ausgeklappt */}
            {openTrend === i && (
              <div className="fu" style={{ padding:"14px 16px" }}>
                <p style={{ fontSize:14, color:C.text, lineHeight:1.7, marginBottom:12 }}>{trend.desc}</p>
                <div style={{ display:"flex", gap:8 }}>
                  <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(trend.title + " Anleitung DIY")}`} target="_blank" rel="noopener noreferrer" style={{ flex:1, textAlign:"center", padding:"8px", borderRadius:9, background:"#FDEEEC", color:"#C0392B", fontSize:12, textDecoration:"none", fontWeight:600 }}>▶ YouTube Tutorial</a>
                  <a href={`https://www.amazon.de/s?k=${encodeURIComponent(trend.amazon)}&tag=${AFFILIATE_TAG}`} target="_blank" rel="noopener noreferrer" style={{ flex:1, textAlign:"center", padding:"8px", borderRadius:9, background:C.accentBg, color:C.accent, fontSize:12, textDecoration:"none", fontWeight:600 }}>🛒 Material kaufen</a>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PAYWALL / PRICING ───────────────────────────────────────────────────────
function PricingModal({ onClose, onSuccess, freeUsed }) {
  const [loading, setLoading] = useState(null);
  const [email, setEmail] = useState("");

  async function checkout(plan) {
    setLoading(plan);
    try {
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, email }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert("Error: " + (data.error || "Unknown"));
    } catch (e) {
      alert("Verbindungsfehler. Bitte erneut versuchen.");
    }
    setLoading(null);
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:1000, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <div className="fu" style={{ background:C.card, borderRadius:"24px 24px 0 0", padding:"28px 22px 40px", width:"100%", maxWidth:600 }}>
        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
          <div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:C.text }}>Mystorija upgraden</h2>
            <p style={{ fontSize:13, color:C.muted, marginTop:3 }}>
              {freeUsed >= 3 ? "Du hast alle 3 gratis Makeovers genutzt." : `Noch ${3 - freeUsed} gratis Makeover${3-freeUsed!==1?"s":""} uebrig.`}
            </p>
          </div>
          {onClose && <button onClick={onClose} style={{ background:"none", border:"none", fontSize:20, color:C.muted, cursor:"pointer", padding:"4px" }}>✕</button>}
        </div>

        {/* Email */}
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Deine E-Mail-Adresse" type="email"
          style={{ width:"100%", padding:"11px 14px", borderRadius:10, border:`1.5px solid ${C.border}`, fontSize:14, fontFamily:"'DM Sans',sans-serif", background:C.bg, marginBottom:16, marginTop:12 }} />

        {/* Plans */}
        <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:16 }}>

          {/* Basic */}
          <div style={{ border:`2px solid ${C.border}`, borderRadius:16, padding:"16px 18px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <div>
                <p style={{ fontWeight:700, fontSize:16, color:C.text }}>Basic</p>
                <p style={{ fontSize:12, color:C.muted }}>For occasional renovators</p>
              </div>
              <div style={{ textAlign:"right" }}>
                <p style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:C.text, fontWeight:700 }}>9,99€</p>
                <p style={{ fontSize:11, color:C.muted }}>/month</p>
              </div>
            </div>
            <div style={{ fontSize:13, color:C.text, lineHeight:1.8, marginBottom:12 }}>
              {["✓ 20 AI Makeovers pro Monat", "✓ Alle Stilvorlagen", "✓ Materialien + Amazon-Links", "✓ Anleitungen & Chat"].map(f => <div key={f}>{f}</div>)}
            </div>
            <button onClick={() => checkout("basic")} disabled={!!loading} style={{ width:"100%", padding:"12px", borderRadius:50, background:loading==="basic"?C.border:C.text, color:"white", border:"none", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
              {loading==="basic" ? "Wird geladen…" : "Basic starten →"}
            </button>
          </div>

          {/* Pro */}
          <div style={{ border:`2px solid ${C.accent}`, borderRadius:16, padding:"16px 18px", background:C.accentBg, position:"relative" }}>
            <div style={{ position:"absolute", top:-12, left:"50%", transform:"translateX(-50%)", background:C.accent, color:"white", borderRadius:20, padding:"3px 14px", fontSize:11, fontWeight:700, whiteSpace:"nowrap" }}>⭐ MEISTGEWAeHLT</div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <div>
                <p style={{ fontWeight:700, fontSize:16, color:C.text }}>Pro</p>
                <p style={{ fontSize:12, color:C.muted }}>For serious renovators</p>
              </div>
              <div style={{ textAlign:"right" }}>
                <p style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:C.accent, fontWeight:700 }}>19,99€</p>
                <p style={{ fontSize:11, color:C.muted }}>/month</p>
              </div>
            </div>
            <div style={{ fontSize:13, color:C.text, lineHeight:1.8, marginBottom:12 }}>
              {["✓ Unbegrenzte AI Makeovers", "✓ Flux Pro – bessere Bildqualitaet", "✓ Alle Basic Features", "✓ Priority generation"].map(f => <div key={f} style={{ fontWeight: f.includes("Pro") ? 600 : 400 }}>{f}</div>)}
            </div>
            <button onClick={() => checkout("pro")} disabled={!!loading} style={{ width:"100%", padding:"13px", borderRadius:50, background:loading==="pro"?C.border:C.accent, color:"white", border:"none", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
              {loading==="pro" ? "Wird geladen…" : "Pro starten →"}
            </button>
          </div>
        </div>

        <p style={{ fontSize:11, color:C.muted, textAlign:"center" }}>
          Monatlich kuendbar · Zahlung ueber Stripe gesichert · Keine versteckten Kosten
        </p>
      </div>
    </div>
  );
}
// Tab labels
const TABS = [
  { id:"makeover", labelDE:"Makeover", labelEN:"Makeover", icon:"✨" },
  { id:"chat",     labelDE:"Chat",     labelEN:"Chat",     icon:"💬" },
  { id:"inspo",    labelDE:"Inspo",    labelEN:"Inspo",    icon:"🔍" },
  { id:"ideen",    labelDE:"Ideen",    labelEN:"Ideas",    icon:"💡" },
  { id:"anleit",   labelDE:"Anleit.",  labelEN:"Guides",   icon:"📋" },
  { id:"planer",   labelDE:"Planer",   labelEN:"Planner",  icon:"📅" },
  { id:"profis",   labelDE:"Profis",   labelEN:"Pros",     icon:"🔨" },
];





const T = {
  de: {
    makeover: "✨ Makeover", chat: "💬 Chat", inspo: "🔍 Inspo",
    ideen: "💡 Ideen", anleit: "📋 Anleit.", planer: "📅 Planer", profis: "🔨 Profis",
    generateBtn: "✨ Generate Makeover", uploadHint: "Upload photo",
    uploadSub: "Bathroom, kitchen, living room, terrace...",
    wishPlaceholder: "z.B. Dunkle Fliesen, Walk-In Dusche...",
    generating: "AI is generating your makeover...", materials: "Materials used:",
    save: "💾 Save", newMakeover: "🔄 New",
    loginBtn: "Sign in", logoutBtn: "Sign out",
    freePlan: "Basic plan required", limitReached: "🔒 Limit reached",
    inspoHook: "Seen a beautiful image somewhere?",
    inspoSub: "Upload screenshot – Mystorija instantly recognizes all materials and colors.",
    analyzeBtn: "🔍 Analyze", trending: "Trends 2026",
    refineTitle: "✏️ Refine – what should change?",
    refinePlaceholder: "z.B. Darker tiles, Spiegel hinzufuegen...",
    savedBtn: "Saved!", plannerSaved: "Saved to Planner!",
    newBtn: "🔄 New", saveBtn: "💾 Save",
    toolsLabel: "Tools needed:", tipsLabel: "Pro tips:",
    warningLabel: "⚠️ Watch out:",
    stepsLabel: "steps:", diffLabel: "Schwierigkeit:",
    costLabel: "Budget:", timeLabel: "Zeit:",
    guidesTitle: "DIY Guides", ideasTitle: "Ideas & Trends 2026",
    plannerTitle: "Planer", prosTitle: "Find Pros",
    chatTitle: "Renovation Expert", inspoTitle: "Analyze Inspo",
    makeoverTitle: "KI Makeover",
    upgradeMsg: "Ab Basic Plan – jetzt upgraden",
    limitMsg: "Monthly limit reached – upgrade auf Pro",
    dimensionsLabel: "Room dimensions (optional)",
    lengthPh: "Length m", widthPh: "Width m", heightPh: "Height m",
    tipsBtn: "💡 Tips & Templates",
    viewHistory: "📚 History",
  },
  en: {
    makeover: "✨ Makeover", chat: "💬 Chat", inspo: "🔍 Inspo",
    ideen: "💡 Ideas", anleit: "📋 Guides", planer: "📅 Planner", profis: "🔨 Pros",
    generateBtn: "✨ Generate Makeover", uploadHint: "Upload a photo",
    uploadSub: "Bathroom, kitchen, living room, terrace...",
    wishPlaceholder: "e.g. Dark tiles, walk-in shower, matte black fixtures...",
    generating: "AI is generating your makeover...", materials: "Materials used:",
    save: "💾 Save", newMakeover: "🔄 New",
    loginBtn: "Sign in", logoutBtn: "Sign out",
    freePlan: "Basic plan required", limitReached: "🔒 Limit reached",
    inspoHook: "Seen a beautiful image somewhere?",
    inspoSub: "Take a screenshot of any image – Pinterest, Instagram, magazines. Mystorija instantly recognizes all materials and colors.",
    analyzeBtn: "🔍 Analyze", trending: "Trends 2026",
    refineTitle: "✏️ Refine – what should change?",
    refinePlaceholder: "e.g. Make tiles darker, add mirror...",
    savedBtn: "Saved!", plannerSaved: "Saved to Planner!",
    newBtn: "🔄 New", saveBtn: "💾 Save",
    toolsLabel: "Tools needed:", tipsLabel: "Pro Tips:",
    warningLabel: "⚠️ Watch out:",
    stepsLabel: "Steps:", diffLabel: "Difficulty:",
    costLabel: "Budget:", timeLabel: "Time:",
    guidesTitle: "DIY Guides", ideasTitle: "Ideas & Trends 2026",
    plannerTitle: "Planner", prosTitle: "Find Pros",
    chatTitle: "Renovation Expert", inspoTitle: "Inspo Analyzer",
    makeoverTitle: "AI Makeover",
    upgradeMsg: "Upgrade to Basic to generate makeovers",
    limitMsg: "Monthly limit reached – upgrade to Pro",
    dimensionsLabel: "Room dimensions (optional)",
    lengthPh: "Length m", widthPh: "Width m", heightPh: "Height m",
    tipsBtn: "💡 Tips & Templates",
    viewHistory: "📚 History",
  }
};

export default function HomeEN() {
  const [activeTab, setActiveTab] = useState("makeover");
  const [savedMakeovers, setSavedMakeovers] = useState([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [lang, setLang] = useState("en");
  const [secretTaps, setSecretTaps] = useState(0);
  const [showSecretInput, setShowSecretInput] = useState(false);
  const [secretInput, setSecretInput] = useState("");

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    setSubscription(null);
    try { localStorage.removeItem("mystorija_subscription"); localStorage.removeItem("mystorija_dev"); } catch {}
  }

  function handleSecretCode(code) {
    if (code === "STORIJA2026") {
      try { localStorage.setItem("mystorija_dev", "STORIJA2026"); } catch {}
      setSubscription({ plan: "pro", sessionId: "dev", activated: true });
      setShowSecretInput(false);
      setSecretInput("");
      alert("✅ Pro access activated!");
    } else {
      alert("❌ Wrong code");
    }
  }
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);

  // Service Worker + PWA Install
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e); setShowInstall(true); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);
  const [freeUsed, setFreeUsed] = useState(0);
  const [chatMessages, setChatMessages] = useState([{
    role:"assistant",
    text:"Hey! 👋 I'm your personal renovation expert – ask me anything about bathrooms, kitchens, living rooms, flooring, lighting and more.\n\nI'll give you **concrete answers** with product names, prices and step-by-step guides. Or upload a 📷 photo and I'll analyze your room instantly!",
  }]);

  useEffect(() => {
    // Onboarding
    try { if (!localStorage.getItem("mystorija_onboarding_done")) setShowOnboarding(true); } catch {}

    // Free usage counter
    try { setFreeUsed(parseInt(localStorage.getItem("mystorija_free_used") || "0")); } catch {}

    // Secret dev code check
    try {
      const devCode = localStorage.getItem("mystorija_dev");
      if (devCode === "STORIJA2026") {
        setSubscription({ plan: "pro", sessionId: "dev", activated: true });
      }
    } catch {}

    // Auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
      // Load subscription from user metadata
      if (session?.user?.user_metadata?.plan) {
        setSubscription({ plan: session.user.user_metadata.plan, activated: true });
      }
    });
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user?.user_metadata?.plan) {
        setSubscription({ plan: session.user.user_metadata.plan, activated: true });
      }
    });
    return () => authSub.unsubscribe();

    // Subscription aus localStorage
    try {
      const saved = localStorage.getItem("mystorija_subscription");
      if (saved) {
        const parsed = JSON.parse(saved);
        setSubscription(parsed);
        // Verify still active
        fetch("/api/verify-subscription", {
          method: "POST", headers: {"Content-Type":"application/json"},
          body: JSON.stringify({ sessionId: parsed.sessionId }),
        }).then(r => r.json()).then(data => {
          if (!data.valid) {
            setSubscription(null);
            localStorage.removeItem("mystorija_subscription");
          }
        }).catch(() => {});
      }
    } catch {}

    // Nach Stripe Redirect
    const params = new URLSearchParams(window.location.search);
    const stripeStatus = params.get("subscription");
    const plan = params.get("plan");
    const sessionId = params.get("session_id");

    if (stripeStatus === "success" && plan && sessionId) {
      const sub = { plan, sessionId, activatedAt: Date.now() };
      setSubscription(sub);
      try { localStorage.setItem("mystorija_subscription", JSON.stringify(sub)); } catch {}
      // URL saeubern
      window.history.replaceState({}, "", "/");
      setShowPricing(false);
    }
  }, []);

  function finishOnboarding() {
    setShowOnboarding(false);
    try { localStorage.setItem("mystorija_onboarding_done", "1"); } catch {}
  }

  function incrementFreeUsed() {
    const next = freeUsed + 1;
    setFreeUsed(next);
    try { localStorage.setItem("mystorija_free_used", String(next)); } catch {}
  }

  function canGenerate() {
    return true; // Kein Limit – Paywall spaeter via Stripe
  }

  const planLabel = subscription?.plan === "pro" ? "Pro ⭐" : subscription?.plan === "basic" ? "Basic" : null;

  return (
    <>
      {showOnboarding && <Onboarding onDone={finishOnboarding} />}
      {showPricing && <PricingModal onClose={() => setShowPricing(false)} freeUsed={freeUsed} />}
      <Head>
        <title>Mystorija – KI-Renovierung & Inspo</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="description" content="Mystorija – KI-Renovierung, Inspiration & DIY Guides fuer dein Zuhause" />
        <meta name="theme-color" content="#C4622D" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Mystorija" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <style dangerouslySetInnerHTML={{ __html:globalCSS }} />
      </Head>
      <div style={{ display:"flex", flexDirection:"column", height:"100vh", background:C.bg, maxWidth:600, margin:"0 auto" }}>
        <div style={{ background:C.card, borderBottom:`1px solid ${C.border}`, padding:"13px 18px", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <span onClick={() => { const t = secretTaps+1; setSecretTaps(t); if(t>=5){setShowSecretInput(true);setSecretTaps(0);} }} style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, cursor:"default", userSelect:"none" }}>My<span style={{ color:C.accent }}>storija</span></span>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            {showInstall && (
              <button onClick={async () => { if (installPrompt) { installPrompt.prompt(); const r = await installPrompt.userChoice; if (r.outcome==="accepted") setShowInstall(false); }}} style={{ fontSize:11, color:C.green, fontWeight:700, background:C.greenBg, padding:"5px 10px", borderRadius:20, border:`1px solid ${C.green}33`, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                📲 Installieren
              </button>
            )}
<button onClick={() => window.location.href="/app"} style={{ fontSize:11, fontWeight:700, color:C.muted, background:C.bg, padding:"5px 10px", borderRadius:20, border:`1px solid ${C.border}`, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                🇩🇪 DE
              </button>
            {user ? (
              <button onClick={handleLogout} style={{ fontSize:11, color:C.muted, fontWeight:600, background:C.bg, padding:"5px 10px", borderRadius:20, border:`1px solid ${C.border}`, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                {T["en"].logoutBtn}
              </button>
            ) : (
              <a href="/en/login" style={{ fontSize:11, color:C.accent, fontWeight:700, background:C.accentBg, padding:"5px 10px", borderRadius:20, border:`1px solid ${C.accent}33`, textDecoration:"none" }}>
                {T["en"].loginBtn}
              </a>
            )}
            {planLabel ? (
              <span style={{ fontSize:12, color:C.accent, fontWeight:700, background:C.accentBg, padding:"4px 10px", borderRadius:20 }}>{planLabel}</span>
            ) : (
              <button onClick={() => setShowPricing(true)} style={{ fontSize:12, color:"white", fontWeight:700, background:C.accent, padding:"5px 12px", borderRadius:20, border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                Upgrade ✨
              </button>
            )}
            
          </div>
        </div>
        <div style={{ flex:1, overflow:"hidden", position:"relative" }}>
          <div style={{ display:activeTab==="makeover"?"flex":"none", height:"100%", overflow:"hidden" }}>
            <MakeoverTab
              onSaveToPlaner={m => setSavedMakeovers(prev=>[m,...prev])}
              savedMakeovers={savedMakeovers}
              plan={subscription?.plan || "free"}
              canGenerate={canGenerate()}
              freeUsed={freeUsed}
              onNeedUpgrade={() => setShowPricing(true)}
              onGenerated={incrementFreeUsed}
            />
          </div>
          <div style={{ display:activeTab==="chat"?"flex":"none", flexDirection:"column", height:"100%" }}>
            <ChatTab messages={chatMessages} setMessages={setChatMessages} />
          </div>
          {activeTab==="inspo" && <InspoTab plan={subscription?.plan} lang={lang} />}
          {activeTab==="ideen" && <IdeenTab lang={lang} />}
          {activeTab==="anleit" && <AnleitungenTab lang={lang} />}
          {activeTab==="planer" && <PlanerTab savedMakeovers={savedMakeovers} lang={lang} />}
          {activeTab==="profis" && <HandwerkerTab lang={lang} />}
        </div>
        <div style={{ background:C.card, borderTop:`1px solid ${C.border}`, display:"grid", gridTemplateColumns:"repeat(7, 1fr)", flexShrink:0, overflowX:"auto" }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ background:"none", border:"none", cursor:"pointer", padding:"7px 1px 10px", display:"flex", flexDirection:"column", alignItems:"center", gap:2, borderTop:`2.5px solid ${activeTab===tab.id?C.accent:"transparent"}`, transition:"border-color 0.2s", minWidth:0 }}>
              <span style={{ fontSize:17 }}>{tab.icon}</span>
              <span style={{ fontSize:9, fontWeight:600, color:activeTab===tab.id?C.accent:C.muted, fontFamily:"'DM Sans',sans-serif", whiteSpace:"nowrap" }}>{tab.labelDE}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Secret Dev Code Modal */}
      {showSecretInput && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div style={{ background:C.card, borderRadius:20, padding:28, width:"100%", maxWidth:320, textAlign:"center" }}>
            <p style={{ fontFamily:"'Playfair Display',serif", fontSize:20, marginBottom:8 }}>🔐 Activation code</p>
            <p style={{ fontSize:13, color:C.muted, marginBottom:16 }}>Enter code to unlock Pro</p>
            <input value={secretInput} onChange={e => setSecretInput(e.target.value)} onKeyDown={e => e.key==="Enter" && handleSecretCode(secretInput)} placeholder="Code eingeben..." style={{ width:"100%", padding:"11px 14px", borderRadius:12, border:`2px solid ${C.border}`, fontSize:15, marginBottom:12, fontFamily:"'DM Sans',sans-serif", textAlign:"center", letterSpacing:2 }} autoFocus />
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={() => { setShowSecretInput(false); setSecretInput(""); }} style={{ flex:1, padding:"11px", borderRadius:50, border:`1px solid ${C.border}`, background:C.bg, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:14 }}>Cancel</button>
              <button onClick={() => handleSecretCode(secretInput)} style={{ flex:1, padding:"11px", borderRadius:50, background:C.accent, color:"white", border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:700 }}>Activate</button>
            </div>
          </div>
        </div>
      )}
      <Analytics />
    </>
  );
}
