import React, { useState, useRef, useEffect } from "react";
import Head from "next/head";
import { Analytics } from "@vercel/analytics/next";
import { supabase } from "../../lib/supabase";

const SYSTEM = `You are Mystorija, a friendly DIY renovation expert. Your users are BEGINNERS. Always explain clearly, concretely, in English, encouragingly. Include specific product recommendations with prices in €. Warn clearly about electrical work, asbestos and load-bearing walls. Keep answers to 3-4 short paragraphs. Use emojis for readability.`;

const C = {
  bg:"#F8F5F0", card:"#FFFFFF", border:"#EDE8DF",
  accent:"#C4622D", accentBg:"#FFF0E8", text:"#1A1A1A",
  muted:"#888888", green:"#3A7A56", greenBg:"#EDF5F1", tag:"#F0EDE8",
};

const globalCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,600&family=DM+Sans:wght@300;400;500;600;700&display=swap');
  * { box-sizing:border-box; margin:0; padding:0; -webkit-tap-highlight-color:transparent; }
  body { font-family:'DM Sans',sans-serif; background:#F8F5F0; overscroll-behavior:none; }
  textarea,input,button { font-family:'DM Sans',sans-serif; }
  ::-webkit-scrollbar { width:3px; }
  ::-webkit-scrollbar-thumb { background:#EDE8DF; border-radius:3px; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes blink { 0%,80%,100%{opacity:.2;transform:scale(.8)} 40%{opacity:1;transform:scale(1)} }
  @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  .fu { animation:fadeUp 0.35s ease both; }
  .fi { animation:fadeIn 0.3s ease both; }
  .skeleton { background:linear-gradient(90deg,#f0ece6 25%,#e8e3dc 50%,#f0ece6 75%); background-size:200% 100%; animation:shimmer 1.5s infinite; border-radius:8px; }
`;

// ── DATA ─────────────────────────────────────────────────────────────────────

const GUIDES = [
  { id:"paint", emoji:"🖌️", title:"Paint Walls", difficulty:"Easy", time:"1–2 days", cost:"30–80€",
    img:"https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=120&q=80",
    tools:["Extension pole","Lambswool roller 12–18mm","Flat brush 5cm","Masking tape","Protective sheet"],
    steps:["Move furniture / cover floor, tape outlets","Fill cracks, sand, vacuum dust","Tape edges with spirit level – press tape firmly","Apply primer if surface is new or porous","First coat with roller evenly","Cut in edges and corners with brush","Let dry 4h, apply second coat","Remove tape immediately after last coat"],
    tips:["Lambswool roller 12–18mm = best surface without lint","No drafts while drying – slows drying unevenly","Always use painter's tape – saves cleanup time"],
    warning:"Check for lead paint in old buildings before sanding.",
    amazon:"wall paint roller set primer", obi:"wandfarbe rolle set" },

  { id:"skim", emoji:"🪣", title:"Skim Coat Walls", difficulty:"Medium", time:"2–3 days", cost:"40–120€",
    img:"https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=120&q=80",
    tools:["Plastering trowel 40cm","Mixing paddle","Drill","Sandpaper 120+180 grit","Joint tape"],
    steps:["Clean wall, apply deep primer","Apply joint tape at corners and joints","Mix filler (powder for Q1, ready-mix for Q2/Q3)","Apply first coat (Q1) 3–4mm, smooth with trowel","Let dry 12h, sand with 120 grit","Apply second coat (Q2) thinner","Final coat (Q3) very thin, sand with 180 grit","Vacuum dust, apply primer before painting"],
    tips:["Powder filler for base coat (stronger)","Ready-mix for top coats (better sandable)","Wet with squeegee after each coat"],
    warning:"Wear dust mask when sanding.",
    amazon:"wall filler skim coat plastering trowel set", obi:"spachtelmasse set glaettekelle" },

  { id:"tiles", emoji:"⬜", title:"Lay Tiles", difficulty:"Medium", time:"2–4 days", cost:"100–400€",
    img:"https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=120&q=80",
    tools:["Notched trowel 8mm","Tile cutter","Rubber mallet","Tile spacers 2–3mm","Grout float","Sponge"],
    steps:["Check substrate: flat, dry, load-bearing","Apply deep primer if needed","Mark center lines with chalk line","Mix tile adhesive","Lay tiles with notched trowel 8mm","Set spacers, check level with rubber mallet","Let dry 24h, remove spacers","Mix grout, apply diagonally with float","Clean surface with damp sponge","Apply sanitary silicone at transitions"],
    tips:["Large format tiles (60×60+) always need double bonding","Tap test: hollow tiles must be removed (>20% = redo)","Grout width 2–3mm looks cleanest"],
    warning:"Never tile on wet or flexing surfaces.",
    amazon:"tile adhesive grout float tile cutter set", obi:"fliesenkleber fugenmasse fliesenschneider" },

  { id:"silicone", emoji:"🔵", title:"Renew Silicone", difficulty:"Easy", time:"2–3 hours", cost:"10–25€",
    img:"https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=120&q=80",
    tools:["Utility knife","Grout rake","Isopropanol","Sanitary silicone","Masking tape","Smoothing tool"],
    steps:["Remove old silicone with utility knife + grout rake","Roughen surface with 80 grit sandpaper","Clean with isopropanol (degrease completely)","Apply masking tape on both sides close to joint","Apply silicone evenly into joint","Smooth with wet finger in one stroke","Remove tape immediately while silicone still wet","Do not use for 24h (curing time)"],
    tips:["Use only sanitary silicone (not acrylic) in wet areas","Isopropanol = perfect degreaser","One smooth stroke – no second chance"],
    warning:"Never apply over old silicone – always remove first.",
    amazon:"sanitary silicone bathroom white soudal", obi:"sanitaersilikon bad weiss" },

  { id:"laminate", emoji:"🪵", title:"Lay Laminate", difficulty:"Easy", time:"1 day", cost:"15–50€/m²",
    img:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=120&q=80",
    tools:["Jigsaw","Pull bar","Tapping block","Spacers 8–10mm","Underlay","Utility knife"],
    steps:["Acclimatize flooring 48h in room","Remove old flooring, check substrate level","Lay underlay fully without gaps","First row with spacers to wall (8–10mm)","Click groove into tongue, tap with block","Stagger joints like brickwork (min. 30cm offset)","Cut last row with jigsaw","Mount transition strips at doors","Remove all spacers, install skirting boards"],
    tips:["48h acclimatization prevents warping","Moisture barrier required on concrete floors","Never fill gaps – they're expansion joints"],
    warning:"Check for moisture in concrete before laying.",
    amazon:"laminate flooring click underlay set", obi:"laminat klick trittschalldaemmung" },

  { id:"panels", emoji:"📐", title:"Wall Panels / Fluted Panels", difficulty:"Easy", time:"4–8 hours", cost:"50–200€",
    img:"https://images.unsplash.com/photo-1600210492493-0946911123ea?w=120&q=80",
    tools:["Jigsaw or circular saw","Panel adhesive","Roller","Spirit level","Measuring tape"],
    steps:["Measure wall, plan panel layout","Cut panels to size with jigsaw","Apply panel adhesive with roller","Press panel to wall, hold 2 min","Check vertical with spirit level","Stagger joints like brickwork","Cut outlets with cardboard template + jigsaw","Mount skirting and trim strips"],
    tips:["Pre-drill MDF panels to avoid splitting","Let adhesive cure 24h before painting","Seal MDF edges with primer before painting"],
    warning:"Check for cables behind wall before drilling.",
    amazon:"wall panel mdf fluted slat accent wall", obi:"wandpaneele mdf nut feder" },

  { id:"led", emoji:"💡", title:"Install LED Lighting", difficulty:"Easy", time:"2–4 hours", cost:"30–150€",
    img:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=120&q=80",
    tools:["Aluminum profile","LED strip","LED driver","Dimmer (LED-compatible)","WAGO connectors","Wire stripper"],
    steps:["Measure strip length needed","Choose 24V system (fewer hot spots)","Fasten aluminum profile to surface","Insert LED strip in profile","Connect driver and dimmer","Use WAGO connectors instead of choc-block","Mount diffuser on profile","Test and adjust dimmer"],
    tips:["2700K = warm white (bathroom, bedroom)","4000K = neutral white (kitchen, office)","Always use LED-compatible dimmer (e.g. Casambi)","Cut strips only at solder points"],
    warning:"Switch off fuse before working on wiring. Use voltage tester.",
    amazon:"led strip 2700k aluminum profile dimmer", obi:"led-strip alu-profil dimmer" },

  { id:"mirror", emoji:"🪞", title:"Hang Mirror", difficulty:"Easy", time:"1–2 hours", cost:"10–30€",
    img:"https://images.unsplash.com/photo-1615529162924-f8605388461d?w=120&q=80",
    tools:["Hammer drill","Spirit level","Wall plugs","Screws","Pencil","Stud finder"],
    steps:["Mark fixing points with spirit level","Locate studs with stud finder","Drill holes, insert wall plugs","Drive screws (leave 5mm sticking out)","Hang mirror and align","Mount protective caps on screws"],
    tips:["For heavy mirrors: use mirror adhesive additionally","Always use spirit level – even a small tilt is visible","Two fixings minimum for safety"],
    warning:"Check for cables and pipes before drilling.",
    amazon:"mirror wall plugs heavy duty", obi:"spiegel duebel schrauben" },
];

const TRENDS = [
  // BATHROOM
  { cat:"Bathroom", title:"Walk-In Rain Shower", desc:"Level-floor shower with ceiling rain head 30×30cm. 1.5% gradient screed, Schlueter KERDI waterproofing, 8mm ESG glass. No hacking if built new.", how:"Plumber + DIY", budget:"1,500–5,000€", emoji:"🚿", img:"https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&h=220&fit=crop&q=80", amazon:"walk-in shower rain head glass panel set", obi:"walk-in dusche regendusche set" },
  { cat:"Bathroom", title:"Freestanding Bathtub", desc:"Classic with modern twist. Freestanding on floor, faucet centered or wall-mounted. Acrylic lighter than cast iron.", how:"Plumber", budget:"800–3,000€", emoji:"🛁", img:"https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&h=220&fit=crop&q=80", amazon:"freestanding bathtub acrylic oval white", obi:"freistehende badewanne acryl" },
  { cat:"Bathroom", title:"Microcement Spa Bathroom", desc:"Cement-polymer mix on all substrates. Seamless, waterproof, also possible over existing tiles. Warm grey tones.", how:"DIY with practice", budget:"60–120€/m²", emoji:"🏛️", img:"https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&h=220&fit=crop&q=80", amazon:"microcement kit bathroom floor wall complete", obi:"mikrozement set bad" },
  { cat:"Bathroom", title:"Matte Black Fixture Set", desc:"Grohe Essence or Hansgrohe Metris. Complete set: basin faucet, shower faucet, towel bar, soap dispenser.", how:"Plumber", budget:"200–600€", emoji:"🖤", img:"https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&h=220&fit=crop&q=80", amazon:"matte black bathroom faucet set grohe hansgrohe", obi:"mattschwarz armatur set bad" },
  { cat:"Bathroom", title:"Zellige Wall Tiles", desc:"Handmade Moroccan tiles, each unique. 7.5×15cm for walls, 10×10cm for floors. Grout width 3–5mm important.", how:"Tiler", budget:"40–80€/m²", emoji:"🟫", img:"https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&h=220&fit=crop&q=80", amazon:"zellige tiles white handmade moroccan bathroom", obi:"zellige fliesen bad metro" },
  { cat:"Bathroom", title:"Large Format Tiles", desc:"Porcelain 120×60cm or 80×80cm. Fewer grout lines = cleaner look. Professional installation required for large formats.", how:"Tiler", budget:"35–55€/m²", emoji:"⬜", img:"https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&h=220&fit=crop&q=80", amazon:"large format porcelain tiles grey 120x60", obi:"feinsteinzeug 120x60 grau" },
  { cat:"Bathroom", title:"Floating Oak Vanity", desc:"Solid wood or teak veneer. Wall-mounted 40–60cm height. Combine with undermount or vessel sink.", how:"Carpenter + Plumber", budget:"400–1,200€", emoji:"🪵", img:"https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&h=220&fit=crop&q=80", amazon:"floating oak vanity wall mounted bathroom", obi:"waschtisch eiche wandmontage" },
  { cat:"Bathroom", title:"LED Mirror IP44", desc:"Backlit with CCT setting (warm/cool). IP44 protection class for bathroom. Built-in touch dimmer.", how:"DIY", budget:"80–300€", emoji:"🔆", img:"https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&h=220&fit=crop&q=80", amazon:"led mirror bathroom ip44 backlit dimmable", obi:"led spiegel bad ip44 dimmbar" },
  // KITCHEN
  { cat:"Kitchen", title:"Navy Blue Kitchen", desc:"Color RAL 5011 or similar. Paint shaker fronts or buy new ones. Combined with brass or matte black handles.", how:"DIY", budget:"300–2,000€", emoji:"🔵", img:"https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=220&fit=crop&q=80", amazon:"kitchen cabinet paint navy blue satin", obi:"kueche lack navy blau seidenmatt" },
  { cat:"Kitchen", title:"Open Shelving", desc:"Remove wall cabinets, add floating oak shelves. More airy feel. Style with baskets, plants, books.", how:"DIY", budget:"50–300€", emoji:"📚", img:"https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=220&fit=crop&q=80", amazon:"floating shelves oak kitchen wall", obi:"wandregal massivholz eiche kueche" },
  { cat:"Kitchen", title:"Kitchen Island", desc:"Minimum width 90cm, depth 80–120cm. IKEA BROR or custom. Integrated power outlets very practical.", how:"DIY", budget:"200–800€", emoji:"🏝️", img:"https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=220&fit=crop&q=80", amazon:"kitchen island freestanding worktop storage", obi:"kueche insel arbeitstisch" },
  { cat:"Kitchen", title:"Zellige Backsplash", desc:"Handmade tiles from Morocco. 7.5×15cm or 10×10cm. White or grey grout. Heat-resistant, easy to clean.", how:"Tiler / DIY", budget:"40–80€/m²", emoji:"🟤", img:"https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=220&fit=crop&q=80", amazon:"zellige kitchen backsplash white handmade", obi:"zellige fliesen kueche" },
  { cat:"Kitchen", title:"Brass Hardware", desc:"Brushed gold or antique gold. Handles 96–160mm bore. Complete set: handles + hooks + towel bar.", how:"DIY", budget:"50–200€", emoji:"✨", img:"https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=220&fit=crop&q=80", amazon:"brass kitchen handles brushed gold set 20pcs", obi:"kuechen griffe messing gold brushed" },
  // LIVING ROOM
  { cat:"Living Room", title:"Dark Green Accent Wall", desc:"Forest green limewash or matte paint. Paint only the wall behind the sofa. Rest stays white.", how:"DIY", budget:"20–60€", emoji:"🌿", img:"https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=220&fit=crop&q=80", amazon:"wall paint dark green forest matte", obi:"wandfarbe dunkelgruen matt" },
  { cat:"Living Room", title:"Fluted MDF Panels", desc:"Fluted panels behind TV or as accent wall. MDF primed and painted. Creates hotel feel for 150€.", how:"DIY", budget:"30–60€/m²", emoji:"📐", img:"https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=220&fit=crop&q=80", amazon:"fluted mdf wall panel accent wall slat", obi:"wandpaneele mdf rillen akzent" },
  { cat:"Living Room", title:"Curved Bouclé Sofa", desc:"Curved bouclé sofa in cream or light grey. The sofa trend 2026. Combined with rattan and natural materials.", how:"Buy", budget:"800–3,000€", emoji:"🛋️", img:"https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=220&fit=crop&q=80", amazon:"bouclé sofa curved living room cream", obi:"bouclé sofa wohnzimmer" },
  { cat:"Living Room", title:"Cove LED Lighting", desc:"LED strip behind drop ceiling or in wall niches. 2700K ideal. Always use dimmer.", how:"DIY", budget:"50–200€", emoji:"💡", img:"https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=220&fit=crop&q=80", amazon:"led strip 2700k cove lighting dimmable warm white", obi:"led strip warmweiss cove decke" },
  // BEDROOM
  { cat:"Bedroom", title:"Terracotta Accent Wall", desc:"Warm terracotta venetian plaster or matte paint. Only the wall behind the bed. Rest white.", how:"DIY", budget:"20–80€", emoji:"🏺", img:"https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=600&h=220&fit=crop&q=80", amazon:"wall paint terracotta warm matte bedroom", obi:"wandfarbe terrakotta schlafzimmer" },
  { cat:"Bedroom", title:"DIY Bouclé Headboard", desc:"MDF cut to size + foam 5cm RG35 + bouclé fabric stapled. Hotel feeling for 150€.", how:"DIY", budget:"100–200€", emoji:"🛏️", img:"https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=600&h=220&fit=crop&q=80", amazon:"bouclé fabric cream upholstery headboard by meter", obi:"bouclé stoff meterware polster" },
  { cat:"Bedroom", title:"Midnight Blue Ceiling", desc:"Paint only the ceiling midnight blue. Walls stay white. Creates cozy, intimate atmosphere.", how:"DIY", budget:"20–50€", emoji:"🌙", img:"https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=600&h=220&fit=crop&q=80", amazon:"ceiling paint midnight blue navy dark", obi:"deckenfarbe nachtblau dunkel" },
  // TERRACE
  { cat:"Terrace", title:"WPC Decking", desc:"WPC decking with pedestal supports. No screws visible. Maintenance-free. Lifespan 25+ years.", how:"DIY", budget:"35–65€/m²", emoji:"🌴", img:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=220&fit=crop&q=80", amazon:"wpc decking terrace pedestal clips set", obi:"wpc dielen terrasse stelzlager" },
  { cat:"Terrace", title:"Outdoor Lounge Set", desc:"Poly rattan with weatherproof Sunbrella cushions. Add teak dining table with 4 designer chairs.", how:"Buy", budget:"400–1,500€", emoji:"☀️", img:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=220&fit=crop&q=80", amazon:"outdoor lounge set rattan sunbrella terrace", obi:"outdoor lounge polyrattan garten" },
  { cat:"Terrace", title:"Outdoor Kitchen", desc:"Modular outdoor kitchen with built-in gas grill, porcelain worktop. The ultimate terrace upgrade.", how:"Pro", budget:"1,000–5,000€", emoji:"🔥", img:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=220&fit=crop&q=80", amazon:"outdoor kitchen gas grill built-in stainless", obi:"aussenkueche gasgrill einbau" },
];

const CATEGORIES = ["All","Bathroom","Kitchen","Living Room","Bedroom","Terrace"];

const PLANS = [
  { id:"bad", emoji:"🚿", title:"Full Bathroom Renovation", duration:"3–6 weeks", budget:"3,000–15,000€",
    phases:[
      { title:"Planning", steps:["Define concept and dimensions","Check building permits","Get quotes from plumbers and tilers","Order materials (4 week lead time!)","Set budget: plumbing / tiling / electrics / finishes"] },
      { title:"Demolition", steps:["Remove old tiles and sanitary ware","Check walls for mold","Inspect and repair plumbing","Waterproof substrate","Install gradient for shower (1.5%)"] },
      { title:"Tiling", steps:["Lay floor tiles","Tile walls","Grout and seal joints","Silicone all transitions"] },
      { title:"Installation", steps:["Install shower / bathtub","Connect sink and toilet","Install electrical (LED mirror, heated towel rail)","Mount accessories"] },
      { title:"Finishing", steps:["Paint walls","Install mirror","Set up lighting","Decorate and style"] },
    ]
  },
  { id:"kueche", emoji:"🍳", title:"Kitchen Renovation", duration:"1–2 weeks", budget:"500–8,000€",
    phases:[
      { title:"Planning", steps:["Concept: just fronts or completely new?","Choose color concept (order samples!)","Select countertop","Order materials (4 week lead time!)","Split budget: fronts / countertop / lighting / decor"] },
      { title:"Fronts & Handles", steps:["Remove fronts","Sand with 80 then 180 grit","Apply primer (Zinsser BIN)","Apply satin lacquer 2 coats","Mount new handles"] },
      { title:"Countertop", steps:["Remove old countertop","Have new countertop cut to size","Have plumber disconnect/reconnect sink","Install backsplash"] },
      { title:"Lighting & Finishing", steps:["Install LED strip under cabinets","Adjust hinges","Reinstall appliances","Final styling"] },
    ]
  },
  { id:"wohnzimmer", emoji:"🛋️", title:"Living Room Redesign", duration:"3–7 days", budget:"200–2,000€",
    phases:[
      { title:"Planning", steps:["Choose wall color (buy testers!)","Plan furniture arrangement","Select lighting concept","Set budget"] },
      { title:"Walls & Structure", steps:["Paint accent wall","Build TV wall if needed","Install LED cove lighting"] },
      { title:"Furnishing", steps:["Assemble new furniture","Hang curtains and curtain rod","Lay rug"] },
      { title:"Styling", steps:["Arrange decor and plants","Hang pictures","Final touches"] },
    ]
  },
  { id:"terrasse", emoji:"🌿", title:"Terrace Project", duration:"1–2 weeks", budget:"500–5,000€",
    phases:[
      { title:"Planning", steps:["Measure terrace area","Check drainage (min. 1.5% gradient)","Choose material: WPC / tiles / wood","Get quotes","Order materials"] },
      { title:"Substrate", steps:["Check waterproofing","Set pedestal supports (level)","Plan drainage"] },
      { title:"Surface", steps:["Lay WPC decking or tiles","Click boards and trim","Mount end profiles"] },
      { title:"Furnishing", steps:["Set up lounge / dining set","Add plants and pots","Install lighting (solar)","Final styling"] },
    ]
  },
];

const MAKEOVER_STYLES = [
  { id:"bad-modern", label:"Modern Bathroom", prompt:"No bathtub, instead level-floor walk-in shower with ceiling rain head. Dark anthracite tiles 80x80cm floor and walls, matte black Grohe fixtures, floating oak vanity 80cm, backlit LED mirror, indirect ceiling lighting 2700K." },
  { id:"bad-warm", label:"Warm Bathroom", prompt:"Warm scandinavian bathroom, handmade white zellige subway tiles, natural oak floating vanity, brushed brass Hansgrohe faucet, herringbone marble floor, round brass mirror, green plant, warm 2200K lighting." },
  { id:"kueche-navy", label:"Navy Kitchen", prompt:"Stunning navy blue shaker kitchen, deep navy cabinets, brushed brass bin pulls, open floating white oak shelves, calacatta marble countertop, aged brass pendant lights, zellige white tile backsplash." },
  { id:"kueche-gruen", label:"Sage Green Kitchen", prompt:"Warm sage green shaker kitchen, sage green cabinets, aged brass cup pulls, live edge walnut open shelves, white zellige tile backsplash, butcher block island, rattan pendant lights." },
  { id:"wohn-gruen", label:"Dark Green Living Room", prompt:"Dramatic living room, deep forest green limewash feature wall, wide plank oak herringbone floor, curved cream bouclé sofa, large brass arc floor lamp, built-in bookshelves with warm LED cove lighting." },
  { id:"terrasse", label:"Mediterranean Terrace", prompt:"Stunning renovated Mediterranean terrace, premium large format 80x80cm sandstone porcelain outdoor tiles, modern outdoor lounge with thick weatherproof cushions, solid teak dining table, terracotta pots with olive trees, outdoor wall sconces 2200K." },
];

const CHAT_SUGGESTIONS = [
  "How do I renovate my bathroom on a budget?",
  "Best wall color for living room 2026?",
  "How to install SPC vinyl flooring myself?",
  "How much does a kitchen renovation cost?",
  "How to install LED lighting?",
  "Can you tile over existing tiles?",
  "How to apply microcement yourself?",
  "How to paint kitchen cabinet fronts?",
];

const INITIAL_MESSAGE = `Hey! 👋 I'm your personal renovation expert – ask me anything about bathroom, kitchen, living room, flooring, lighting and more.

I'll give you **concrete answers** with product names, prices and step-by-step guides. Or upload a 📷 photo and I'll analyze your room instantly!`;

// ── HELPERS ─────────────────────────────────────────────────────────────────

function amazonLink(q, qBau) {
  const bq = qBau || q;
  return {
    amzn: `https://www.amazon.de/s?k=${encodeURIComponent(q)}&tag=mystorija-21`,
    obi:  `https://www.obi.de/suche/${encodeURIComponent(bq)}/`,
    bh:   `https://www.bauhaus.info/search?q=${encodeURIComponent(bq)}`,
    hb:   `https://www.hornbach.de/s/${encodeURIComponent(bq)}/`,
  };
}

function ShopLinks({ amazon, obi }) {
  const l = amazonLink(amazon, obi);
  return (
    <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:8 }}>
      {[["Amazon", l.amzn, "#FF9900"],["OBI", l.obi, "#e63000"],["Bauhaus", l.bh, "#e30613"],["Hornbach", l.hb, "#f60"]].map(([name, href, color]) => (
        <a key={name} href={href} target="_blank" rel="noopener noreferrer"
          style={{ padding:"4px 10px", borderRadius:20, fontSize:11, fontWeight:700, color:"white", background:color, textDecoration:"none" }}>{name}</a>
      ))}
    </div>
  );
}

function BoldText({ text }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return <>{parts.map((p, i) => p.startsWith('**') ? <strong key={i}>{p.slice(2,-2)}</strong> : p)}</>;
}

function Pill({ label, color = C.accent, bg = C.accentBg }) {
  return <span style={{ background:bg, color, borderRadius:20, padding:"3px 10px", fontSize:11, fontWeight:700 }}>{label}</span>;
}

function LoadingDots() {
  return (
    <div style={{ display:"flex", gap:4, padding:"8px 0" }}>
      {[0,1,2].map(i => <div key={i} style={{ width:6, height:6, borderRadius:"50%", background:C.accent, animation:"blink 1.2s infinite", animationDelay:`${i*0.2}s` }} />)}
    </div>
  );
}

// ── TABS ────────────────────────────────────────────────────────────────────

const TABS = [
  { id:"makeover", labelEN:"Makeover", icon:"✨" },
  { id:"chat",     labelEN:"Chat",     icon:"💬" },
  { id:"inspo",    labelEN:"Inspo",    icon:"🔍" },
  { id:"ideas",    labelEN:"Ideas",    icon:"💡" },
  { id:"guides",   labelEN:"Guides",   icon:"📋" },
  { id:"planner",  labelEN:"Planner",  icon:"📅" },
  { id:"pros",     labelEN:"Pros",     icon:"🔨" },
];

// ── MAKEOVER TAB ─────────────────────────────────────────────────────────────

function MakeoverTab({ plan, canGenerate, freeUsed, onNeedUpgrade, onSaveToPlanner }) {
  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [wish, setWish] = useState("");
  const [materials, setMaterials] = useState(null);
  const [saved, setSaved] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [dimensions, setDimensions] = useState({ laenge:"", breite:"", hoehe:"" });
  const [showRefinement, setShowRefinement] = useState(false);
  const [refinement, setRefinement] = useState("");
  const fileRef = useRef();

  async function compressImage(file) {
    return new Promise(res => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 1200;
        let w = img.width, h = img.height;
        if (w > maxDim || h > maxDim) { if (w > h) { h = Math.round(h*maxDim/w); w = maxDim; } else { w = Math.round(w*maxDim/h); h = maxDim; } }
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        canvas.toBlob(b => { URL.revokeObjectURL(url); res(b); }, "image/jpeg", 0.85);
      };
      img.src = url;
    });
  }

  async function handleFile(file) {
    if (!file || !file.type.startsWith("image/")) return;
    const compressed = await compressImage(file);
    const url = URL.createObjectURL(compressed);
    setImage(url);
    const reader = new FileReader();
    reader.onload = e => setImageBase64(e.target.result);
    reader.readAsDataURL(compressed);
    setResult(null); setMaterials(null); setSaved(false);
  }

  async function generate(useWish) {
    if (!canGenerate) { onNeedUpgrade(); return; }
    if (!imageBase64) return;
    setLoading(true); setResult(null); setMaterials(null);
    try {
      const r = await fetch("/api/generate", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ imageBase64, chatContext: useWish || null, plan: plan || "free", dimensions }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      setResult(d.imageBase64 ? `data:image/jpeg;base64,${d.imageBase64}` : d.imageUrl);
      setMaterials(d.materials);
      setShowRefinement(true);
      incrementUsage();
    } catch(e) { alert("Error: " + e.message); }
    finally { setLoading(false); }
  }

  const isFree = !plan || plan === "free";

  function getMonthlyUsage() {
    try {
      const key = `mystorija_usage_${new Date().getFullYear()}_${new Date().getMonth()}`;
      return parseInt(localStorage.getItem(key) || "0");
    } catch { return 0; }
  }
  function incrementUsage() {
    try {
      const key = `mystorija_usage_${new Date().getFullYear()}_${new Date().getMonth()}`;
      localStorage.setItem(key, String(getMonthlyUsage() + 1));
    } catch {}
  }
  const LIMITS = { free: 0, basic: 50, pro: Infinity };
  const monthlyLimit = LIMITS[plan] ?? 0;
  const monthlyUsed = getMonthlyUsage();
  const limitReached = !isFree && monthlyUsed >= monthlyLimit;

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"hidden" }}>
      <div style={{ flex:1, overflowY:"auto", padding:"14px 16px" }}>

        {/* Upload area */}
        {!image && (
          <div onClick={() => fileRef.current?.click()} onDrop={e=>{e.preventDefault();handleFile(e.dataTransfer.files[0]);}} onDragOver={e=>e.preventDefault()}
            style={{ border:`2px dashed ${C.border}`, borderRadius:16, padding:"40px 20px", textAlign:"center", cursor:"pointer", background:C.card, marginBottom:16 }}>
            <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>handleFile(e.target.files[0])} />
            <div style={{ fontSize:32, marginBottom:8 }}>📷</div>
            <p style={{ fontWeight:700, fontSize:15 }}>Upload photo</p>
            <p style={{ fontSize:13, color:C.muted, marginTop:4 }}>Bathroom, kitchen, living room, terrace...</p>
          </div>
        )}

        {image && (
          <div style={{ position:"relative", marginBottom:12, borderRadius:16, overflow:"hidden" }}>
            <img src={image} alt="room" style={{ width:"100%", maxHeight:250, objectFit:"cover", display:"block" }} />
            <button onClick={()=>{setImage(null);setImageBase64(null);setResult(null);setMaterials(null);setShowRefinement(false);}}
              style={{ position:"absolute", top:8, right:8, background:"rgba(0,0,0,0.6)", color:"white", border:"none", borderRadius:20, padding:"4px 10px", fontSize:12, cursor:"pointer" }}>✕ New photo</button>
          </div>
        )}

        {/* Dimensions */}
        {image && (
          <div style={{ marginBottom:12 }}>
            <p style={{ fontSize:12, color:C.muted, marginBottom:6 }}>📐 Room dimensions (optional, improves result)</p>
            <div style={{ display:"flex", gap:8 }}>
              {[["Length","laenge"],["Width","breite"],["Height","hoehe"]].map(([label, key]) => (
                <div key={key} style={{ flex:1 }}>
                  <input type="number" placeholder={label} value={dimensions[key]} onChange={e=>setDimensions(d=>({...d,[key]:e.target.value}))}
                    style={{ width:"100%", padding:"8px 10px", borderRadius:10, border:`1px solid ${C.border}`, fontSize:13, background:C.bg }} />
                </div>
              ))}
              <span style={{ lineHeight:"36px", fontSize:12, color:C.muted }}>m</span>
            </div>
          </div>
        )}

        {/* Wish input */}
        {image && (
          <div style={{ marginBottom:12 }}>
            <textarea value={wish} onChange={e=>setWish(e.target.value)} rows={3} placeholder="e.g. No bathtub, add walk-in shower, dark tiles, matte black fixtures..."
              style={{ width:"100%", padding:"10px 12px", borderRadius:12, border:`1px solid ${C.border}`, fontSize:14, resize:"none", background:C.bg }} />
          </div>
        )}

        {/* Tips */}
        {image && (
          <div style={{ marginBottom:12 }}>
            <button onClick={()=>setShowTips(!showTips)} style={{ background:"none", border:"none", color:C.accent, fontSize:13, fontWeight:600, cursor:"pointer", padding:0 }}>
              💡 Tips & Templates for better results {showTips ? "▾" : "›"}
            </button>
            {showTips && (
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:14, marginTop:8 }}>
                <p style={{ fontSize:13, fontWeight:700, marginBottom:10 }}>How to get the best AI makeovers:</p>
                {[
                  ["🔄 Replace objects", 'Say what should GO and what should COME.\n✓ "No bathtub, instead walk-in shower with rain head"\n✗ "Shower"'],
                  ["🎨 Colors & Materials", 'Name specific materials.\n✓ "Anthracite porcelain 80x80cm, white grout, oak vanity"\n✗ "Other colors"'],
                  ["💡 Describe style", 'Name a style.\n✓ "Modern spa bathroom, indirect light, matte black fixtures"\n✗ "Modern"'],
                  ["📐 Combine changes", 'Separate with commas.\n✓ "Dark tiles, no bathtub, black fixtures, wall niche"\n✗ "Everything new"'],
                  ["🌿 Terrace & Outdoor", 'List furniture, plants, lighting separately.\n✓ "Add BBQ grill, pergola, olive tree, string lights"\n✗ "Make it nicer"'],
                ].map(([title, text]) => (
                  <div key={title} style={{ marginBottom:10 }}>
                    <p style={{ fontSize:12, fontWeight:700, color:C.accent }}>{title}</p>
                    {text.split('\n').map((l,i) => <p key={i} style={{ fontSize:11, color:C.muted, lineHeight:1.5 }}>{l}</p>)}
                  </div>
                ))}
                <div style={{ marginTop:10 }}>
                  <p style={{ fontSize:12, fontWeight:700, marginBottom:6 }}>Quick templates – tap to use:</p>
                  {MAKEOVER_STYLES.map(s => (
                    <button key={s.id} onClick={()=>{setWish(s.prompt);setShowTips(false);}}
                      style={{ display:"block", width:"100%", textAlign:"left", background:C.bg, border:`1px solid ${C.border}`, borderRadius:8, padding:"6px 10px", marginBottom:4, fontSize:12, cursor:"pointer", color:C.text }}>
                      <strong>{s.label}</strong>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Generate button */}
        {image && !result && (
          <button onClick={()=>generate(wish)} disabled={loading}
            style={{ width:"100%", padding:14, borderRadius:50, border:"none", background:loading?C.border:(isFree||limitReached?C.muted:C.accent), color:"white", fontSize:15, fontWeight:700, cursor:loading||isFree||limitReached?"not-allowed":"pointer", marginBottom:8 }}>
            {loading ? "AI is generating your makeover..." : isFree ? "🔒 Basic plan required" : limitReached ? `🔒 Monthly limit reached (${monthlyUsed}/${monthlyLimit})` : `✨ Generate Makeover`}
          </button>
        )}

        {isFree && image && (
          <div style={{ background:C.accentBg, border:`1px solid ${C.accent}33`, borderRadius:12, padding:"12px 14px", textAlign:"center", marginBottom:12 }}>
            <p style={{ fontSize:13, fontWeight:700, color:C.accent, marginBottom:4 }}>Upgrade to see your makeover</p>
            <button onClick={onNeedUpgrade} style={{ background:C.accent, color:"white", border:"none", borderRadius:50, padding:"8px 20px", fontSize:13, fontWeight:700, cursor:"pointer" }}>
              Upgrade – from 9.99€/month →
            </button>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="fu">
            <div style={{ borderRadius:16, overflow:"hidden", marginBottom:12 }}>
              <img src={result} alt="makeover" style={{ width:"100%", display:"block" }} />
            </div>

            {showRefinement && (
              <div style={{ marginBottom:12 }}>
                <p style={{ fontSize:12, fontWeight:700, color:C.accent, marginBottom:6 }}>✏️ Refine – what should change?</p>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:6 }}>
                  {["Darker tiles","Lighter color","Add mirror","Black fixtures","More wood","Warmer light"].map(s => (
                    <button key={s} onClick={()=>setRefinement(s)} style={{ padding:"4px 10px", borderRadius:20, border:`1px solid ${C.border}`, background:refinement===s?C.accent:C.bg, color:refinement===s?"white":C.text, fontSize:11, cursor:"pointer" }}>{s}</button>
                  ))}
                </div>
                <div style={{ display:"flex", gap:6 }}>
                  <input value={refinement} onChange={e=>setRefinement(e.target.value)} placeholder="e.g. Make tiles darker, add mirror..." style={{ flex:1, padding:"8px 12px", borderRadius:10, border:`1px solid ${C.border}`, fontSize:13, background:C.bg }} />
                  <button onClick={()=>generate(refinement)} style={{ padding:"8px 16px", borderRadius:10, border:"none", background:C.accent, color:"white", fontSize:13, fontWeight:700, cursor:"pointer" }}>↻</button>
                </div>
              </div>
            )}

            <div style={{ display:"flex", gap:8, marginBottom:16 }}>
              <button onClick={()=>{const a=document.createElement("a");a.href=result;a.download="mystorija-makeover.jpg";a.click();}}
                style={{ flex:1, padding:10, borderRadius:50, border:`1px solid ${C.border}`, background:C.bg, fontSize:13, fontWeight:600, cursor:"pointer" }}>💾 Save</button>
              <button onClick={()=>{if(onSaveToPlanner)onSaveToPlanner(result);setSaved(true);}}
                style={{ flex:1, padding:10, borderRadius:50, border:"none", background:saved?C.green:C.greenBg, color:saved?"white":C.green, fontSize:13, fontWeight:600, cursor:"pointer" }}>
                {saved ? "✓ Saved!" : "📅 To Planner"}
              </button>
              <button onClick={()=>{setResult(null);setShowRefinement(false);setWish("");}}
                style={{ padding:10, borderRadius:50, border:`1px solid ${C.border}`, background:C.bg, fontSize:13, cursor:"pointer" }}>🔄</button>
            </div>

            {materials && (
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"14px 16px" }}>
                <p style={{ fontWeight:700, fontSize:13, color:C.accent, marginBottom:8 }}>Materials used:</p>
                <div style={{ fontSize:13, lineHeight:1.8, whiteSpace:"pre-wrap" }}>
                  {materials.split('\n').map((line, i) => {
                    if (!line.trim()) return null;
                    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
                    const parts = []; let last = 0; let m;
                    while ((m = linkRegex.exec(line)) !== null) {
                      if (m.index > last) parts.push(line.slice(last, m.index));
                      parts.push(<a key={m.index} href={m[2]} target="_blank" rel="noopener noreferrer" style={{ color:C.accent, fontWeight:600 }}>{m[1]}</a>);
                      last = m.index + m[0].length;
                    }
                    if (last < line.length) parts.push(line.slice(last));
                    return <p key={i} style={{ marginBottom:4 }}>{parts}</p>;
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── CHAT TAB ─────────────────────────────────────────────────────────────────

function ChatTab({ plan }) {
  const [messages, setMessages] = useState([{ role:"assistant", content:INITIAL_MESSAGE }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [imgBase64, setImgBase64] = useState(null);
  const bottomRef = useRef();
  const fileRef = useRef();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text && !imgBase64) return;
    const newMsg = { role:"user", content: imgBase64 ? [{ type:"image_url", image_url:{ url:imgBase64 } }, { type:"text", text:text || "What do you see?" }] : text };
    const updated = [...messages, newMsg];
    setMessages(updated);
    setInput(""); setImgBase64(null); setLoading(true);
    try {
      const r = await fetch("/api/chat", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ messages: updated.map(m => ({ role:m.role, content:typeof m.content==="string"?m.content:m.content })), lang:"en", forceEnglish:true }),
      });
      const d = await r.json();
      setMessages(prev => [...prev, { role:"assistant", content: d.reply || d.content || d.error || "Sorry, something went wrong." }]);
    } catch(e) { setMessages(prev => [...prev, { role:"assistant", content:"Connection error. Please try again." }]); }
    finally { setLoading(false); }
  }

  function renderMsg(content) {
    if (typeof content !== "string") return JSON.stringify(content);
    return content.split('\n').map((line, i) => <p key={i} style={{ marginBottom:4, lineHeight:1.6 }}><BoldText text={line} /></p>);
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"hidden" }}>
      <div style={{ background:C.card, borderBottom:`1px solid ${C.border}`, padding:"10px 16px", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
        <div>
          <p style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700 }}>🔨 Renovation Expert</p>
          <p style={{ fontSize:11, color:C.green }}>● Online – AI-powered</p>
        </div>
        <button onClick={()=>setMessages([{ role:"assistant", content:INITIAL_MESSAGE }])} style={{ fontSize:11, color:C.muted, background:C.bg, border:`1px solid ${C.border}`, borderRadius:20, padding:"4px 10px", cursor:"pointer" }}>Clear</button>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"14px 16px" }}>
        {messages.length === 1 && (
          <div style={{ marginBottom:16 }}>
            <p style={{ fontSize:12, color:C.muted, marginBottom:8 }}>Common questions:</p>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {CHAT_SUGGESTIONS.map(s => (
                <button key={s} onClick={()=>{setInput(s);}}
                  style={{ padding:"6px 12px", borderRadius:20, border:`1px solid ${C.border}`, background:C.bg, fontSize:12, cursor:"pointer", color:C.text }}>{s}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className="fi" style={{ marginBottom:12, display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start" }}>
            {m.role==="assistant" && <div style={{ width:28, height:28, borderRadius:"50%", background:C.accent, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, marginRight:8, flexShrink:0 }}>🔨</div>}
            <div style={{ maxWidth:"85%", background:m.role==="user"?C.accent:C.card, color:m.role==="user"?"white":C.text, borderRadius:m.role==="user"?"18px 18px 4px 18px":"18px 18px 18px 4px", padding:"10px 14px", border:m.role==="assistant"?`1px solid ${C.border}`:"none" }}>
              {typeof m.content === "string" ? renderMsg(m.content) : <p style={{ fontSize:13 }}>[image uploaded]</p>}
            </div>
          </div>
        ))}
        {loading && <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
          <div style={{ width:28, height:28, borderRadius:"50%", background:C.accent, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>🔨</div>
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:"18px 18px 18px 4px", padding:"10px 14px" }}><LoadingDots /></div>
        </div>}
        <div ref={bottomRef} />
      </div>

      <div style={{ borderTop:`1px solid ${C.border}`, padding:"10px 12px", background:C.card, flexShrink:0 }}>
        {imgBase64 && <div style={{ marginBottom:6 }}><img src={imgBase64} alt="" style={{ height:50, borderRadius:8 }} /><button onClick={()=>setImgBase64(null)} style={{ marginLeft:6, fontSize:11, color:C.muted, background:"none", border:"none", cursor:"pointer" }}>✕</button></div>}
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={()=>fileRef.current?.click()} style={{ width:36, height:36, borderRadius:10, border:`1px solid ${C.border}`, background:C.bg, fontSize:16, cursor:"pointer", flexShrink:0 }}>📷</button>
          <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>setImgBase64(ev.target.result);r.readAsDataURL(f);}} />
          <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}} rows={1} placeholder="Ask me anything about renovation..."
            style={{ flex:1, padding:"8px 12px", borderRadius:10, border:`1px solid ${C.border}`, resize:"none", fontSize:14, background:C.bg }} />
          <button onClick={send} disabled={loading} style={{ width:36, height:36, borderRadius:10, border:"none", background:C.accent, color:"white", fontSize:16, cursor:"pointer", flexShrink:0 }}>→</button>
        </div>
        <p style={{ fontSize:10, color:C.muted, textAlign:"center", marginTop:4 }}>Enter to send · Shift+Enter new line · Upload photo for analysis</p>
      </div>
    </div>
  );
}

// ── INSPO TAB ─────────────────────────────────────────────────────────────────

function InspoTab({ plan }) {
  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();
  const canUse = plan === "basic" || plan === "pro";

  async function analyze() {
    if (!imageBase64) return;
    setLoading(true); setResult(null);
    try {
      const r = await fetch("/api/analyse", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ imageBase64, lang:"en" }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      // Handle both string analysis and structured JSON
      const analysis = d.analysis;
      if (typeof analysis === "object") {
        const lines = [];
        if (analysis.style) lines.push(`**Style:** ${analysis.style}`);
        if (analysis.mood) lines.push(`**Mood:** ${analysis.mood}`);
        if (analysis.materials?.length) {
          lines.push("\n**Materials:**");
          analysis.materials.forEach(m => lines.push(`• ${m.area}: ${m.material} – ${m.color} (~${m.price})`));
        }
        if (analysis.steps?.length) {
          lines.push("\n**How to recreate:**");
          analysis.steps.forEach((s,i) => lines.push(`${i+1}. ${s}`));
        }
        if (analysis.pro_tips?.length) {
          lines.push("\n**Pro tips:**");
          analysis.pro_tips.forEach(t => lines.push(`💡 ${t}`));
        }
        setResult(lines.join('\n'));
      } else {
        setResult(analysis || "Analysis complete.");
      }
    } catch(e) { setResult("Error: " + e.message); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"hidden" }}>
      <div style={{ flex:1, overflowY:"auto", padding:"14px 16px" }}>
        <div style={{ background:"linear-gradient(135deg, #1a1a2e, #2d2d4e)", borderRadius:14, padding:"14px 16px", marginBottom:16 }}>
          <p style={{ fontSize:13, fontWeight:700, color:"white", marginBottom:3 }}>Seen a beautiful image somewhere?</p>
          <p style={{ fontSize:11, color:"#aaa", lineHeight:1.5 }}>Take a screenshot of any image you like – Pinterest, Instagram, magazines, TV. Mystorija instantly recognizes all materials and colors.</p>
        </div>

        {!image && (
          <div onClick={()=>fileRef.current?.click()} style={{ border:`2px dashed ${C.border}`, borderRadius:16, padding:"40px 20px", textAlign:"center", cursor:"pointer", background:C.accentBg, marginBottom:16 }}>
            <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(!f)return;setImage(URL.createObjectURL(f));const r=new FileReader();r.onload=ev=>setImageBase64(ev.target.result);r.readAsDataURL(f);}} />
            <div style={{ fontSize:32, marginBottom:8 }}>🔍</div>
            <p style={{ fontWeight:700, color:C.accent }}>Upload inspiration photo</p>
            <p style={{ fontSize:12, color:C.muted, marginTop:4 }}>Pinterest, Instagram, magazine – AI analyzes instantly</p>
          </div>
        )}

        {!image && (
          <div>
            <p style={{ fontSize:12, color:C.muted, marginBottom:10, textAlign:"center", fontStyle:"italic" }}>Examples of what you can upload:</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {[["🛁","Dream bathroom from Pinterest"],["🍳","Kitchen from magazine"],["🛋️","Living room inspo"],["🛏️","Bedroom idea"]].map(([e,l]) => (
                <div key={l} onClick={()=>fileRef.current?.click()} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"14px 10px", textAlign:"center", cursor:"pointer" }}>
                  <div style={{ fontSize:24, marginBottom:4 }}>{e}</div>
                  <p style={{ fontSize:11, color:C.muted }}>{l}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {image && (
          <div>
            <div style={{ borderRadius:12, overflow:"hidden", marginBottom:12 }}>
              <img src={image} alt="inspo" style={{ width:"100%", maxHeight:200, objectFit:"cover" }} />
            </div>
            <button onClick={()=>{setImage(null);setImageBase64(null);setResult(null);}} style={{ fontSize:12, color:C.muted, background:"none", border:"none", cursor:"pointer", marginBottom:8 }}>✕ Remove photo</button>

            {!canUse && (
              <div style={{ background:C.accentBg, border:`1px solid ${C.accent}33`, borderRadius:12, padding:"12px 14px", textAlign:"center", marginBottom:12 }}>
                <p style={{ fontSize:13, fontWeight:700, color:C.accent }}>Upgrade to Basic to analyze inspo photos</p>
              </div>
            )}

            {canUse && !result && (
              <button onClick={analyze} disabled={loading} style={{ width:"100%", padding:13, borderRadius:50, border:"none", background:loading?C.border:C.accent, color:"white", fontSize:14, fontWeight:700, cursor:loading?"default":"pointer" }}>
                {loading ? "Analyzing..." : "🔍 Analyze photo"}
              </button>
            )}

            {result && (
              <div className="fu" style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"14px 16px" }}>
                <p style={{ fontWeight:700, fontSize:13, color:C.accent, marginBottom:8 }}>Analysis Result:</p>
                <div style={{ fontSize:13, lineHeight:1.7, whiteSpace:"pre-wrap" }}>{result}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── IDEAS TAB ─────────────────────────────────────────────────────────────────

function IdeasTab() {
  const [cat, setCat] = useState("All");
  const [selected, setSelected] = useState(null);
  const filtered = cat === "All" ? TRENDS : TRENDS.filter(t => t.cat === cat);

  if (selected) return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"hidden" }}>
      <div style={{ background:C.card, borderBottom:`1px solid ${C.border}`, padding:"12px 16px", display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
        <button onClick={()=>setSelected(null)} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer" }}>←</button>
        <p style={{ fontFamily:"'Playfair Display',serif", fontSize:16 }}>{selected.emoji} {selected.title}</p>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"16px" }}>
        <img src={selected.img} alt={selected.title} style={{ width:"100%", height:180, objectFit:"cover", borderRadius:12, marginBottom:16 }} />
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:12 }}>
          <Pill label={`💰 ${selected.budget}`} />
          <Pill label={`🔧 ${selected.how}`} color={C.green} bg={C.greenBg} />
          <Pill label={selected.cat} color={C.muted} bg={C.tag} />
        </div>
        <p style={{ fontSize:14, lineHeight:1.7, marginBottom:16 }}>{selected.desc}</p>
        <ShopLinks amazon={selected.amazon} obi={selected.obi} />
      </div>
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"hidden" }}>
      <div style={{ background:C.card, borderBottom:`1px solid ${C.border}`, padding:"12px 16px", flexShrink:0 }}>
        <p style={{ fontFamily:"'Playfair Display',serif", fontSize:18, marginBottom:10 }}>💡 Ideas & Trends 2026</p>
        <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:4 }}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={()=>setCat(c)} style={{ padding:"5px 12px", borderRadius:20, border:"none", cursor:"pointer", background:cat===c?C.accent:C.bg, color:cat===c?"white":C.muted, fontSize:12, fontWeight:600, whiteSpace:"nowrap", flexShrink:0 }}>{c}</button>
          ))}
        </div>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"12px 16px" }}>
        <p style={{ fontSize:12, color:C.muted, marginBottom:10 }}>{filtered.length} ideas – tap for more details</p>
        {filtered.map((t, i) => (
          <div key={i} className="fu" onClick={()=>setSelected(t)} style={{ position:"relative", borderRadius:16, overflow:"hidden", marginBottom:10, cursor:"pointer", animationDelay:`${i*0.04}s` }}>
            <img src={t.img} alt={t.title} style={{ width:"100%", height:130, objectFit:"cover", display:"block" }} />
            <div style={{ position:"absolute", inset:0, background:"linear-gradient(transparent 30%, rgba(0,0,0,0.7))" }} />
            <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"10px 12px" }}>
              <p style={{ color:"white", fontWeight:700, fontSize:15 }}>{t.emoji} {t.title}</p>
              <div style={{ display:"flex", gap:6, marginTop:4 }}>
                <span style={{ background:"rgba(255,255,255,0.2)", color:"white", borderRadius:20, padding:"2px 8px", fontSize:10 }}>💰 {t.budget}</span>
                <span style={{ background:"rgba(255,255,255,0.2)", color:"white", borderRadius:20, padding:"2px 8px", fontSize:10 }}>🔧 {t.how}</span>
              </div>
            </div>
            <div style={{ position:"absolute", top:8, right:8, background:C.accent, color:"white", borderRadius:20, padding:"2px 8px", fontSize:10, fontWeight:700 }}>{t.cat}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── GUIDES TAB ─────────────────────────────────────────────────────────────────

function GuidesTab() {
  const [selected, setSelected] = useState(null);
  const [checked, setChecked] = useState({});

  useEffect(() => {
    try { const s = localStorage.getItem("mystorija_en_guides"); if(s) setChecked(JSON.parse(s)); } catch {}
  }, []);

  function toggle(guideId, stepIdx) {
    const key = `${guideId}_${stepIdx}`;
    const next = { ...checked, [key]: !checked[key] };
    setChecked(next);
    try { localStorage.setItem("mystorija_en_guides", JSON.stringify(next)); } catch {}
  }

  const totalSteps = GUIDES.reduce((s, g) => s + g.steps.length, 0);
  const doneSteps = Object.values(checked).filter(Boolean).length;

  if (selected) {
    const g = selected;
    const stepsDone = g.steps.filter((_, i) => checked[`${g.id}_${i}`]).length;
    return (
      <div style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"hidden" }}>
        <div style={{ background:C.card, borderBottom:`1px solid ${C.border}`, padding:"12px 16px", flexShrink:0 }}>
          <button onClick={()=>setSelected(null)} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", marginBottom:4 }}>←</button>
          <p style={{ fontFamily:"'Playfair Display',serif", fontSize:18 }}>{g.emoji} {g.title}</p>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:6 }}>
            <Pill label={g.difficulty} color={g.difficulty==="Easy"?C.green:C.accent} bg={g.difficulty==="Easy"?C.greenBg:C.accentBg} />
            <Pill label={`⏱ ${g.time}`} color={C.muted} bg={C.tag} />
            <Pill label={`💰 ${g.cost}`} color={C.muted} bg={C.tag} />
          </div>
          <div style={{ marginTop:8, height:4, background:C.border, borderRadius:2 }}>
            <div style={{ width:`${(stepsDone/g.steps.length)*100}%`, height:"100%", background:C.green, borderRadius:2, transition:"width 0.3s" }} />
          </div>
          <p style={{ fontSize:11, color:C.muted, marginTop:4 }}>{stepsDone}/{g.steps.length} steps · {Math.round((stepsDone/g.steps.length)*100)}%</p>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"14px 16px" }}>
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"12px 14px", marginBottom:12 }}>
            <p style={{ fontSize:12, fontWeight:700, marginBottom:6 }}>🛠 Tools needed:</p>
            {g.tools.map((t,i) => <p key={i} style={{ fontSize:12, color:C.muted, lineHeight:1.6 }}>• {t}</p>)}
          </div>
          <p style={{ fontSize:12, fontWeight:700, color:C.accent, marginBottom:8 }}>Steps:</p>
          {g.steps.map((step, i) => (
            <div key={i} onClick={()=>toggle(g.id, i)} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"10px 12px", marginBottom:6, background:checked[`${g.id}_${i}`]?C.greenBg:C.card, border:`1px solid ${checked[`${g.id}_${i}`]?C.green+"44":C.border}`, borderRadius:10, cursor:"pointer" }}>
              <div style={{ width:20, height:20, borderRadius:"50%", border:`2px solid ${checked[`${g.id}_${i}`]?C.green:C.border}`, background:checked[`${g.id}_${i}`]?C.green:"white", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}>
                {checked[`${g.id}_${i}`] && <span style={{ color:"white", fontSize:11 }}>✓</span>}
              </div>
              <p style={{ fontSize:13, lineHeight:1.5, textDecoration:checked[`${g.id}_${i}`]?"line-through":"none", color:checked[`${g.id}_${i}`]?C.muted:C.text }}>
                <strong style={{ color:C.accent }}>Step {i+1}:</strong> {step}
              </p>
            </div>
          ))}
          {g.tips && (
            <div style={{ background:C.accentBg, border:`1px solid ${C.accent}22`, borderRadius:12, padding:"12px 14px", marginTop:8 }}>
              <p style={{ fontSize:12, fontWeight:700, color:C.accent, marginBottom:6 }}>💡 Pro tips:</p>
              {g.tips.map((t,i) => <p key={i} style={{ fontSize:12, color:C.text, lineHeight:1.6 }}>• {t}</p>)}
            </div>
          )}
          {g.warning && (
            <div style={{ background:"#FFF3CD", border:"1px solid #ffc107", borderRadius:12, padding:"10px 14px", marginTop:8 }}>
              <p style={{ fontSize:12, color:"#856404" }}>⚠️ {g.warning}</p>
            </div>
          )}
          <ShopLinks amazon={g.amazon} obi={g.obi} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"hidden" }}>
      <div style={{ background:C.card, borderBottom:`1px solid ${C.border}`, padding:"12px 16px", flexShrink:0 }}>
        <p style={{ fontFamily:"'Playfair Display',serif", fontSize:18, marginBottom:6 }}>📋 DIY Guides</p>
        <div style={{ background:C.bg, borderRadius:10, padding:"8px 12px" }}>
          <p style={{ fontSize:12, fontWeight:700 }}>Your Progress: {doneSteps}/{totalSteps} steps · {Math.round((doneSteps/totalSteps)*100)}%</p>
          <div style={{ height:4, background:C.border, borderRadius:2, marginTop:4 }}>
            <div style={{ width:`${(doneSteps/totalSteps)*100}%`, height:"100%", background:C.green, borderRadius:2, transition:"width 0.3s" }} />
          </div>
        </div>
        <p style={{ fontSize:11, color:C.muted, marginTop:6 }}>Tap a guide → check off steps as you work. Progress is saved.</p>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"12px 16px" }}>
        {GUIDES.map((g, i) => {
          const done = g.steps.filter((_, j) => checked[`${g.id}_${j}`]).length;
          return (
            <div key={g.id} className="fu" onClick={()=>setSelected(g)} style={{ display:"flex", alignItems:"center", gap:12, background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"12px 14px", marginBottom:8, cursor:"pointer", animationDelay:`${i*0.04}s` }}>
              <img src={g.img} alt={g.title} style={{ width:52, height:52, borderRadius:10, objectFit:"cover", flexShrink:0 }} />
              <div style={{ flex:1 }}>
                <p style={{ fontWeight:700, fontSize:14 }}>{g.emoji} {g.title}</p>
                <div style={{ display:"flex", gap:6, marginTop:4 }}>
                  <span style={{ background:g.difficulty==="Easy"?C.greenBg:C.accentBg, color:g.difficulty==="Easy"?C.green:C.accent, borderRadius:20, padding:"2px 8px", fontSize:10, fontWeight:600 }}>{g.difficulty}</span>
                  <span style={{ background:C.tag, color:C.muted, borderRadius:20, padding:"2px 8px", fontSize:10 }}>⏱ {g.time}</span>
                  <span style={{ background:C.tag, color:C.muted, borderRadius:20, padding:"2px 8px", fontSize:10 }}>💰 {g.cost}</span>
                </div>
                {done > 0 && <div style={{ marginTop:4, height:3, background:C.border, borderRadius:2 }}><div style={{ width:`${(done/g.steps.length)*100}%`, height:"100%", background:C.green, borderRadius:2 }} /></div>}
              </div>
              <span style={{ color:C.muted, fontSize:16 }}>›</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── PLANNER TAB ─────────────────────────────────────────────────────────────────

function PlannerTab({ savedMakeovers }) {
  const [view, setView] = useState("plans");
  const [selected, setSelected] = useState(null);
  const [checked, setChecked] = useState({});
  const [open, setOpen] = useState({});

  useEffect(() => {
    try { const s = localStorage.getItem("mystorija_en_planner"); if(s) setChecked(JSON.parse(s)); } catch {}
  }, []);

  function toggle(planId, phaseIdx, stepIdx) {
    const key = `${planId}_${phaseIdx}_${stepIdx}`;
    const next = { ...checked, [key]: !checked[key] };
    setChecked(next);
    try { localStorage.setItem("mystorija_en_planner", JSON.stringify(next)); } catch {}
  }

  if (selected) {
    const p = selected;
    const total = p.phases.reduce((s, ph) => s + ph.steps.length, 0);
    const done = p.phases.reduce((s, ph, pi) => s + ph.steps.filter((_, si) => checked[`${p.id}_${pi}_${si}`]).length, 0);
    return (
      <div style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"hidden" }}>
        <div style={{ background:C.card, borderBottom:`1px solid ${C.border}`, padding:"12px 16px", flexShrink:0 }}>
          <button onClick={()=>setSelected(null)} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer" }}>←</button>
          <p style={{ fontFamily:"'Playfair Display',serif", fontSize:18 }}>{p.emoji} {p.title}</p>
          <p style={{ fontSize:12, color:C.muted }}>{done}/{total} steps · {Math.round((done/total)*100)}% done</p>
          <div style={{ height:4, background:C.border, borderRadius:2, marginTop:6 }}>
            <div style={{ width:`${(done/total)*100}%`, height:"100%", background:C.accent, borderRadius:2, transition:"width 0.3s" }} />
          </div>
          <div style={{ display:"flex", gap:8, marginTop:8 }}>
            <Pill label={`⏱ ${p.duration}`} color={C.accent} bg={C.accentBg} />
            <Pill label={`💰 ${p.budget}`} color={C.muted} bg={C.tag} />
          </div>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"14px 16px" }}>
          {p.phases.map((ph, pi) => {
            const phDone = ph.steps.filter((_, si) => checked[`${p.id}_${pi}_${si}`]).length;
            const isOpen = open[`${p.id}_${pi}`] !== false;
            return (
              <div key={pi} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, marginBottom:10, overflow:"hidden" }}>
                <div onClick={()=>setOpen(o=>({...o,[`${p.id}_${pi}`]:!isOpen}))} style={{ padding:"12px 14px", display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:24, height:24, borderRadius:"50%", background:phDone===ph.steps.length?C.green:C.accent, color:"white", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, flexShrink:0 }}>{pi+1}</div>
                    <p style={{ fontWeight:700, fontSize:14 }}>{ph.title}</p>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <p style={{ fontSize:11, color:C.muted }}>{phDone}/{ph.steps.length}</p>
                    <span style={{ color:C.muted }}>{isOpen?"▾":"›"}</span>
                  </div>
                </div>
                {isOpen && (
                  <div style={{ borderTop:`1px solid ${C.border}`, padding:"6px 14px 10px" }}>
                    {ph.steps.map((step, si) => (
                      <div key={si} onClick={()=>toggle(p.id, pi, si)} style={{ display:"flex", alignItems:"flex-start", gap:8, padding:"7px 0", borderBottom:`1px solid ${C.border}`, cursor:"pointer" }}>
                        <div style={{ width:18, height:18, borderRadius:"50%", border:`2px solid ${checked[`${p.id}_${pi}_${si}`]?C.green:C.border}`, background:checked[`${p.id}_${pi}_${si}`]?C.green:"white", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}>
                          {checked[`${p.id}_${pi}_${si}`] && <span style={{ color:"white", fontSize:10 }}>✓</span>}
                        </div>
                        <p style={{ fontSize:13, lineHeight:1.5, textDecoration:checked[`${p.id}_${pi}_${si}`]?"line-through":"none", color:checked[`${p.id}_${pi}_${si}`]?C.muted:C.text }}>{step}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"hidden" }}>
      <div style={{ background:C.card, borderBottom:`1px solid ${C.border}`, padding:"12px 16px", flexShrink:0 }}>
        <p style={{ fontFamily:"'Playfair Display',serif", fontSize:18, marginBottom:8 }}>📅 Planner</p>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={()=>setView("plans")} style={{ padding:"5px 14px", borderRadius:20, border:"none", cursor:"pointer", background:view==="plans"?C.accent:C.bg, color:view==="plans"?"white":C.muted, fontSize:12, fontWeight:600 }}>Complete Plans</button>
          <button onClick={()=>setView("saved")} style={{ padding:"5px 14px", borderRadius:20, border:"none", cursor:"pointer", background:view==="saved"?C.accent:C.bg, color:view==="saved"?"white":C.muted, fontSize:12, fontWeight:600 }}>Saved Makeovers</button>
        </div>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"12px 16px" }}>
        {view === "plans" && PLANS.map((p, i) => {
          const total = p.phases.reduce((s, ph) => s + ph.steps.length, 0);
          const done = p.phases.reduce((s, ph, pi) => s + ph.steps.filter((_, si) => checked[`${p.id}_${pi}_${si}`]).length, 0);
          return (
            <div key={p.id} className="fu" onClick={()=>setSelected(p)} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"14px 16px", marginBottom:10, cursor:"pointer", animationDelay:`${i*0.06}s` }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                <p style={{ fontFamily:"'Playfair Display',serif", fontSize:16 }}>{p.emoji} {p.title}</p>
                <span style={{ color:C.muted }}>›</span>
              </div>
              <div style={{ display:"flex", gap:6, marginBottom:8 }}>
                <Pill label={`⏱ ${p.duration}`} color={C.muted} bg={C.tag} />
                <Pill label={`💰 ${p.budget}`} color={C.muted} bg={C.tag} />
              </div>
              {done > 0 && <><div style={{ height:4, background:C.border, borderRadius:2 }}><div style={{ width:`${(done/total)*100}%`, height:"100%", background:C.accent, borderRadius:2 }} /></div><p style={{ fontSize:11, color:C.muted, marginTop:3 }}>{done}/{total} steps</p></>}
            </div>
          );
        })}
        {view === "saved" && (
          savedMakeovers?.length > 0 ? savedMakeovers.map((src, i) => (
            <div key={i} style={{ borderRadius:12, overflow:"hidden", marginBottom:10 }}>
              <img src={src} alt="makeover" style={{ width:"100%", borderRadius:12 }} />
            </div>
          )) : (
            <div style={{ textAlign:"center", padding:"40px 20px" }}>
              <p style={{ fontSize:32, marginBottom:12 }}>📸</p>
              <p style={{ fontSize:15, fontWeight:600 }}>No saved makeovers yet</p>
              <p style={{ fontSize:13, color:C.muted }}>Generate a makeover and tap "To Planner"</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}

// ── PROS TAB ─────────────────────────────────────────────────────────────────

function ProsTab() {
  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"hidden" }}>
      <div style={{ background:C.card, borderBottom:`1px solid ${C.border}`, padding:"14px 16px 12px", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:20 }}>🔨 Find Pros</h2>
          <span style={{ background:C.accentBg, color:C.accent, borderRadius:20, padding:"4px 12px", fontSize:11, fontWeight:700 }}>Coming soon</span>
        </div>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"20px 16px" }}>
        <div style={{ background:"linear-gradient(135deg, #1a1a2e, #2d2d4e)", borderRadius:16, padding:"20px", marginBottom:20, textAlign:"center" }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🔨</div>
          <p style={{ color:"white", fontWeight:700, fontSize:16, marginBottom:8 }}>Are you a contractor?</p>
          <p style={{ color:"rgba(255,255,255,0.75)", fontSize:13, lineHeight:1.6, marginBottom:16 }}>Join the Mystorija contractor network. Direct inquiries from renovation-ready customers.</p>
          <div style={{ display:"flex", gap:8, justifyContent:"center", flexWrap:"wrap", marginBottom:12 }}>
            {["✓ Business profile","✓ Direct inquiries","✓ In-app advertising","✓ Reviews"].map(f => (
              <span key={f} style={{ background:"rgba(255,255,255,0.1)", color:"white", borderRadius:20, padding:"4px 12px", fontSize:11, fontWeight:600 }}>{f}</span>
            ))}
          </div>
          <a href="mailto:info@mystorija.com" style={{ display:"inline-block", background:C.accent, color:"white", borderRadius:50, padding:"11px 24px", fontSize:13, fontWeight:700, textDecoration:"none" }}>
            Apply now – €49.99/month →
          </a>
        </div>
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"30px 20px", textAlign:"center" }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🏗️</div>
          <p style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, marginBottom:10 }}>Contractor Directory</p>
          <p style={{ fontSize:14, color:C.muted, lineHeight:1.7, maxWidth:280, margin:"0 auto 20px" }}>We are building the directory. Soon you will find verified contractors near you.</p>
          <div style={{ background:C.greenBg, borderRadius:12, padding:"14px 16px" }}>
            <p style={{ fontSize:13, color:C.green, fontWeight:600 }}>💡 Coming soon – we carefully verify every business</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── PRICING MODAL ─────────────────────────────────────────────────────────────

function PricingModal({ onClose }) {
  const PRICES = [
    { id:"basic", name:"Basic", price:"9.99€", period:"/month", features:["50 AI makeovers/month","30 inspo analyses/month","All 100 ideas & trends","50 DIY guides","AI chat advisor","Planner & shopping list"], priceId:"price_1TYmT4DVVPgjSTdOkgRYVmXW", color:C.accent },
    { id:"pro", name:"Pro ✨", price:"19.99€", period:"/month", features:["Unlimited makeovers","Unlimited inspo analyses","Everything in Basic","Priority generation","Early access to new features"], priceId:"price_1TYmTTDVVPgjSTdOxYmpwNoc", color:"#6B21A8" },
  ];

  async function checkout(priceId) {
    try {
      const r = await fetch("/api/create-checkout", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ priceId }) });
      const d = await r.json();
      if (d.url) window.location.href = d.url;
    } catch(e) { alert("Error: " + e.message); }
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:1000, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <div style={{ background:C.card, borderRadius:"24px 24px 0 0", padding:"24px 20px 40px", width:"100%", maxWidth:480, maxHeight:"90vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
          <p style={{ fontFamily:"'Playfair Display',serif", fontSize:22 }}>Choose your plan</p>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:24, cursor:"pointer", color:C.muted }}>✕</button>
        </div>
        {PRICES.map(p => (
          <div key={p.id} style={{ border:`2px solid ${p.color}`, borderRadius:16, padding:"16px", marginBottom:12 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
              <p style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700 }}>{p.name}</p>
              <p style={{ fontSize:20, fontWeight:700, color:p.color }}>{p.price}<span style={{ fontSize:12, color:C.muted }}>{p.period}</span></p>
            </div>
            {p.features.map(f => <p key={f} style={{ fontSize:13, color:C.muted, lineHeight:1.7 }}>✓ {f}</p>)}
            <button onClick={()=>checkout(p.priceId)} style={{ marginTop:12, width:"100%", padding:12, borderRadius:50, border:"none", background:p.color, color:"white", fontSize:14, fontWeight:700, cursor:"pointer" }}>
              Get {p.name} →
            </button>
          </div>
        ))}
        <p style={{ fontSize:11, color:C.muted, textAlign:"center" }}>Cancel anytime · Secure payment via Stripe</p>
      </div>
    </div>
  );
}

// ── ONBOARDING ─────────────────────────────────────────────────────────────────

function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const steps = [
    { icon:"✨", title:"AI Makeover", desc:"Upload a photo. The AI shows you your renovated room in 20 seconds." },
    { icon:"🔍", title:"Inspo Analysis", desc:"Screenshot any beautiful image – Mystorija recognizes all materials, colors and costs." },
    { icon:"💡", title:"100 Ideas & Guides", desc:"100 renovation ideas for 2026 and 50 step-by-step DIY guides." },
  ];
  const s = steps[step];
  function next() { if(step < steps.length-1) setStep(s=>s+1); else onDone(); }

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:2000, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <div style={{ background:C.card, borderRadius:"24px 24px 0 0", padding:"32px 24px 48px", width:"100%", maxWidth:480, textAlign:"center" }}>
        <div style={{ display:"flex", justifyContent:"center", gap:6, marginBottom:24 }}>
          {steps.map((_,i) => <div key={i} style={{ width:i===step?24:8, height:8, borderRadius:4, background:i===step?C.accent:C.border, transition:"width 0.3s" }} />)}
        </div>
        <div style={{ fontSize:52, marginBottom:16 }}>{s.icon}</div>
        <p style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, marginBottom:10 }}>{s.title}</p>
        <p style={{ fontSize:15, color:C.muted, lineHeight:1.7, marginBottom:28 }}>{s.desc}</p>
        <button onClick={next} style={{ width:"100%", padding:14, borderRadius:50, border:"none", background:C.accent, color:"white", fontSize:15, fontWeight:700, cursor:"pointer" }}>
          {step < steps.length-1 ? "Next →" : "Get started ✨"}
        </button>
        <button onClick={onDone} style={{ marginTop:12, background:"none", border:"none", color:C.muted, fontSize:13, cursor:"pointer" }}>Skip</button>
      </div>
    </div>
  );
}

// ── MAIN APP ─────────────────────────────────────────────────────────────────

export default function HomeEN() {
  const [activeTab, setActiveTab] = useState("makeover");
  const [subscription, setSubscription] = useState(null);
  const [user, setUser] = useState(null);
  const [showPricing, setShowPricing] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [savedMakeovers, setSavedMakeovers] = useState([]);
  const [secretTaps, setSecretTaps] = useState(0);
  const [showSecretInput, setShowSecretInput] = useState(false);
  const [secretInput, setSecretInput] = useState("");

  useEffect(() => {
    // Onboarding
    try { if (!localStorage.getItem("mystorija_onboarded_en")) setShowOnboarding(true); } catch {}
    // Dev code
    try { if (localStorage.getItem("mystorija_dev") === "STORIJA2026") setSubscription({ plan:"pro", activated:true }); } catch {}
    // Subscription
    try {
      const saved = localStorage.getItem("mystorija_subscription");
      if (saved) {
        const parsed = JSON.parse(saved);
        setSubscription(parsed);
        fetch("/api/verify-subscription", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ sessionId: parsed.sessionId }) })
          .then(r => r.json()).then(d => { if (!d.active) setSubscription(null); }).catch(()=>{});
      }
    } catch {}
    // URL params
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true" && params.get("plan")) {
      const plan = params.get("plan");
      const sid = params.get("session_id");
      const sub = { plan, sessionId: sid, activated: true };
      setSubscription(sub);
      try { localStorage.setItem("mystorija_subscription", JSON.stringify(sub)); } catch {}
      window.history.replaceState({}, "", "/en/app");
    }
    // Auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user?.user_metadata?.plan) setSubscription({ plan: session.user.user_metadata.plan, activated:true });
    });
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => authSub.unsubscribe();
  }, []);

  function doneOnboarding() {
    setShowOnboarding(false);
    try { localStorage.setItem("mystorija_onboarded_en", "1"); } catch {}
  }

  function handleSecretCode(code) {
    if (code === "STORIJA2026") {
      try { localStorage.setItem("mystorija_dev", "STORIJA2026"); } catch {}
      setSubscription({ plan:"pro", activated:true });
      setShowSecretInput(false); setSecretInput("");
      alert("✅ Pro access activated!");
    } else { alert("❌ Wrong code"); }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null); setSubscription(null);
    try { localStorage.removeItem("mystorija_subscription"); localStorage.removeItem("mystorija_dev"); } catch {}
  }

  const plan = subscription?.plan || "free";
  const canGenerate = plan === "basic" || plan === "pro";

  return (
    <>
      <Head>
        <title>Mystorija – AI Home Renovation</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
        <meta name="description" content="Upload a photo – AI renovates your room in 20 seconds. 100 ideas, 50 DIY guides." />
      </Head>
      <style>{globalCSS}</style>

      <div style={{ display:"flex", flexDirection:"column", height:"100dvh", maxWidth:480, margin:"0 auto", background:C.bg, position:"relative" }}>

        {/* Header */}
        <div style={{ background:C.card, borderBottom:`1px solid ${C.border}`, padding:"10px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <span onClick={()=>{const t=secretTaps+1;setSecretTaps(t);if(t>=5){setShowSecretInput(true);setSecretTaps(0);}}} style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, cursor:"default", userSelect:"none" }}>My<span style={{ color:C.accent }}>storija</span></span>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <a href="/" style={{ fontSize:11, fontWeight:700, color:C.muted, background:C.bg, padding:"5px 10px", borderRadius:20, border:`1px solid ${C.border}`, textDecoration:"none" }}>🇩🇪 DE</a>
            {plan !== "free" && <span style={{ background:C.greenBg, color:C.green, borderRadius:20, padding:"4px 10px", fontSize:11, fontWeight:700 }}>{plan === "pro" ? "Pro ✨" : "Basic"}</span>}
            {plan === "free" && <button onClick={()=>setShowPricing(true)} style={{ background:C.accent, color:"white", borderRadius:20, padding:"5px 12px", fontSize:11, fontWeight:700, border:"none", cursor:"pointer" }}>Upgrade ✨</button>}
            {user ? <button onClick={handleLogout} style={{ fontSize:11, color:C.muted, background:C.bg, padding:"5px 10px", borderRadius:20, border:`1px solid ${C.border}`, cursor:"pointer" }}>Sign out</button>
                  : <a href="/en/login" style={{ fontSize:11, color:C.accent, fontWeight:700, background:C.accentBg, padding:"5px 10px", borderRadius:20, border:`1px solid ${C.accent}33`, textDecoration:"none" }}>Sign in</a>}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex:1, overflow:"hidden", position:"relative" }}>
          {activeTab==="makeover" && <MakeoverTab lang="en" plan={plan} canGenerate={canGenerate} onNeedUpgrade={()=>setShowPricing(true)} onSaveToPlanner={src=>setSavedMakeovers(m=>[...m,src])} />}
          {activeTab==="chat" && <ChatTab plan={plan} />}
          {activeTab==="inspo" && <InspoTab plan={plan} />}
          {activeTab==="ideas" && <IdeasTab />}
          {activeTab==="guides" && <GuidesTab />}
          {activeTab==="planner" && <PlannerTab savedMakeovers={savedMakeovers} />}
          {activeTab==="pros" && <ProsTab />}
        </div>

        {/* Bottom navigation */}
        <div style={{ background:C.card, borderTop:`1px solid ${C.border}`, display:"grid", gridTemplateColumns:"repeat(7,1fr)", flexShrink:0 }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={()=>setActiveTab(tab.id)} style={{ background:"none", border:"none", padding:"10px 2px 12px", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
              <span style={{ fontSize:20 }}>{tab.icon}</span>
              <span style={{ fontSize:9, fontWeight:600, color:activeTab===tab.id?C.accent:C.muted }}>{tab.labelEN}</span>
              {activeTab===tab.id && <div style={{ width:16, height:2, background:C.accent, borderRadius:1 }} />}
            </button>
          ))}
        </div>
      </div>

      {/* Modals */}
      {showOnboarding && <Onboarding onDone={doneOnboarding} />}
      {showPricing && <PricingModal onClose={()=>setShowPricing(false)} />}

      {showSecretInput && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div style={{ background:C.card, borderRadius:20, padding:28, width:"100%", maxWidth:320, textAlign:"center" }}>
            <p style={{ fontFamily:"'Playfair Display',serif", fontSize:20, marginBottom:8 }}>🔐 Activation code</p>
            <p style={{ fontSize:13, color:C.muted, marginBottom:16 }}>Enter code to unlock Pro</p>
            <input value={secretInput} onChange={e=>setSecretInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSecretCode(secretInput)} placeholder="Enter code..." autoFocus
              style={{ width:"100%", padding:"11px 14px", borderRadius:12, border:`2px solid ${C.border}`, fontSize:15, marginBottom:12, textAlign:"center", letterSpacing:2 }} />
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={()=>{setShowSecretInput(false);setSecretInput("");}} style={{ flex:1, padding:11, borderRadius:50, border:`1px solid ${C.border}`, background:C.bg, cursor:"pointer" }}>Cancel</button>
              <button onClick={()=>handleSecretCode(secretInput)} style={{ flex:1, padding:11, borderRadius:50, background:C.accent, color:"white", border:"none", cursor:"pointer", fontWeight:700 }}>Activate</button>
            </div>
          </div>
        </div>
      )}

      <Analytics />
    </>
  );
}
