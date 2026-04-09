import { useState, useEffect, useRef } from "react";

// ── Jule Core Logic (browser port) ──────────────
const GENRES = ["PHYSICS","MATH","AI_SAFETY","ECONOMICS","CONSCIOUSNESS","ENGINEERING","CROSS","OTHER"];
const GENRE_KEYWORDS = {
  PHYSICS:       ["galaxy","rotation","quantum","spacetime","entropy","pandora","tau","sparc"],
  MATH:          ["proof","theorem","equation","derive","axiom","convergence","fixed point"],
  AI_SAFETY:     ["hallucination","alignment","safety","audit","burn","aspidos","jule"],
  ECONOMICS:     ["token","economy","incentive","market","capital","reward"],
  CONSCIOUSNESS: ["consciousness","qualia","awareness","omega","unitas"],
  ENGINEERING:   ["code","implement","deploy","api","function","architecture"],
};

function detectGenre(text) {
  const lower = text.toLowerCase();
  const scores = {};
  for (const [genre, kws] of Object.entries(GENRE_KEYWORDS)) {
    const hits = kws.filter(k => lower.includes(k)).length;
    if (hits > 0) scores[genre] = hits;
  }
  const detected = Object.entries(scores);
  if (detected.length === 0) return "OTHER";
  if (detected.length >= 3) return "CROSS";
  return detected.sort((a,b) => b[1]-a[1])[0][0];
}

function jaccard(a, b) {
  const A = new Set(a.split(" "));
  const B = new Set(b.split(" "));
  const inter = [...A].filter(x => B.has(x)).length;
  return inter / (A.size + B.size - inter);
}

function calculateSigma(vScores) {
  if (vScores.length <= 1) return 1.0;
  const mean = vScores.reduce((a,b) => a+b, 0) / vScores.length;
  const variance = vScores.reduce((a,b) => a+(b-mean)**2, 0) / vScores.length;
  return Math.exp(-variance / 100);
}

function calculatePhi(contentHash, historyHashes) {
  if (historyHashes.length === 0) return 0.0;
  const avg = historyHashes.map(h => jaccard(contentHash, h))
    .reduce((a,b) => a+b, 0) / historyHashes.length;
  return 1 - Math.exp(-2.0 * avg);
}

function calculateDeltaHPrime(deltaH, usefulRatio, sigma) {
  return deltaH * usefulRatio * sigma;
}

function calculateDecay(count) {
  return Math.pow(0.5, count);
}

function calculateJule({ v, delta_h, reputation, k }) {
  return Math.tanh(v / 50) * delta_h * reputation * k * 100;
}

const GENRE_COLOR = {
  PHYSICS:       "#00f5ff",
  MATH:          "#a78bfa",
  AI_SAFETY:     "#34d399",
  ECONOMICS:     "#fbbf24",
  CONSCIOUSNESS: "#f472b6",
  ENGINEERING:   "#60a5fa",
  CROSS:         "#ff6b35",
  OTHER:         "#6b7280",
};

const K_MAP = { "SAFE":1.0,"OVERLOAD":0.5,"ADVERSARIAL":0.3,"LOGIC_COLLAPSE":0.1,"ETHICS_VIOLATION":0.0 };
const K_LABEL = { "SAFE":"安全","OVERLOAD":"既知情報","ADVERSARIAL":"情緒過多","LOGIC_COLLAPSE":"論理破綻","ETHICS_VIOLATION":"反社会的" };

// ── Gauge Component ──────────────────────────────
function Gauge({ label, value, max = 1, color = "#00f5ff", unit = "" }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="mb-4">
      <div className="flex justify-between mb-1.5">
        <span className="text-[#8892a4] text-[10px] tracking-[0.08em] uppercase">{label}</span>
        <span className="text-[12px] font-bold font-mono" style={{color}}>
          {typeof value === "number" ? value.toFixed(3) : value}{unit}
        </span>
      </div>
      <div className="h-1 bg-[#1a2030] rounded overflow-hidden">
        <div 
          className="h-full rounded transition-all duration-700 ease-out shadow-[0_0_8px]"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}88, ${color})`,
            boxShadow: `0 0 8px ${color}66`,
          }}
        />
      </div>
    </div>
  );
}

// ── Responsive HexRadar ─────────────────────────
function HexRadar({ axes }) {
  const size = 180; // スマホでも見やすいベースサイズ（コンテナでスケール）
  const cx = size / 2, cy = size / 2, r = size * 0.36;
  const n = axes.length;
  const pts = (scale) => axes.map((_,i) => {
    const angle = (Math.PI * 2 * i / n) - Math.PI / 2;
    return [cx + r * scale * Math.cos(angle), cy + r * scale * Math.sin(angle)];
  });
  const gridLevels = [0.25, 0.5, 0.75, 1.0];
  const dataPoints = pts(1).map(([x,y],i) => {
    const v = axes[i].value;
    const angle = (Math.PI * 2 * i / n) - Math.PI / 2;
    return [cx + r * v * Math.cos(angle), cy + r * v * Math.sin(angle)];
  });
  const toPath = (points) => points.map((p,i) => `${i===0?"M":"L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ") + " Z";

  return (
    <div className="flex justify-center">
      <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} className="max-w-[260px] mx-auto">
        {gridLevels.map(scale => (
          <polygon key={scale}
            points={pts(scale).map(p=>p.join(",")).join(" ")}
            fill="none" stroke="#1e2d40" strokeWidth={1.2}
          />
        ))}
        {pts(1).map(([x,y], i) => (
          <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#1e2d40" strokeWidth={1.2}/>
        ))}
        <path d={toPath(dataPoints)} fill="#00f5ff22" stroke="#00f5ff" strokeWidth={2}
          style={{ filter:"drop-shadow(0 0 6px #00f5ff88)" }}/>
        {dataPoints.map(([x,y],i) => (
          <circle key={i} cx={x} cy={y} r={3.5} fill={axes[i].color || "#00f5ff"}
            style={{ filter:`drop-shadow(0 0 4px ${axes[i].color || "#00f5ff"})` }}/>
        ))}
        {pts(1).map(([x,y],i) => {
          const dx = x - cx, dy = y - cy;
          const len = Math.sqrt(dx*dx+dy*dy) || 1;
          const lx = x + (dx/len)*14, ly = y + (dy/len)*11;
          return (
            <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
              fill={axes[i].color || "#8892a4"} fontSize={9} fontFamily="'Courier New', monospace" fontWeight={500}>
              {axes[i].label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

// ── Terminal Log ─────────────────────────────────
function TermLog({ lines }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [lines]);
  return (
    <div ref={ref} className="bg-[#090e14] border border-[#1e2d40] rounded-xl p-4 h-[140px] overflow-y-auto text-xs font-mono leading-relaxed">
      {lines.map((l,i) => (
        <div key={i} style={{ color: l.color || "#4a6080" }}>
          <span className="text-[#2a3a50] select-none">{l.time} </span>
          {l.text}
        </div>
      ))}
      {lines.length === 0 && <span className="text-[#2a3a50]">awaiting transmission...</span>}
    </div>
  );
}

// ── Main Demo ────────────────────────────────────
export default function JuleDemo() {
  const [text, setText]         = useState("");
  const [v, setV]               = useState(72);
  const [usefulRatio, setUR]    = useState(0.75);
  const [reputation, setRep]    = useState(0.5);
  const [category, setCategory] = useState("SAFE");
  const [repetition, setRep2]   = useState(0);
  const [result, setResult]     = useState(null);
  const [log, setLog]           = useState([]);
  const [history, setHistory]   = useState([]);
  const [pulse, setPulse]       = useState(false);

  const addLog = (text, color = "#4a8060") => {
    const time = new Date().toTimeString().slice(0,8);
    setLog(l => [...l.slice(-30), { text, color, time }]);
  };

  const runAudit = () => {
    if (!text.trim()) { addLog("ERROR: empty transmission", "#ef4444"); return; }

    addLog("── AUDIT INITIATED ──", "#2a3a50");
    addLog(`TX: "${text.slice(0,45)}${text.length>45?"...":""}"`, "#8892a4");

    const k = K_MAP[category] ?? 1.0;

    if (k === 0.0) {
      addLog("L1 BURN → 反社会的 (k=0.0)", "#ef4444");
      setResult({ status:"BURN", reason:"反社会的", jule:0, net:-10 });
      setPulse(true); setTimeout(()=>setPulse(false), 600);
      return;
    }
    addLog(`L1 PASS → k=${k} (${K_LABEL[category]})`, "#34d399");

    const contentHash = text.split(" ").slice(0,8).join("_"); // 少し長めに
    const phi = calculatePhi(contentHash, history);
    addLog(`Φ inertia = ${phi.toFixed(3)}${phi > 0.95 ? " → BURN (duplicate)" : " ✓"}`,
      phi > 0.95 ? "#ef4444" : "#60a5fa");

    if (phi > 0.95) {
      setResult({ status:"BURN", reason:"Duplicate Fingerprint", jule:0, net:-10 });
      setPulse(true); setTimeout(()=>setPulse(false), 600);
      return;
    }

    const vScores = [v, Math.max(0,v-8), Math.min(100,v+5)];
    const sigma = calculateSigma(vScores);
    addLog(`Σ singularity = ${sigma.toFixed(3)}`, "#a78bfa");

    const genre = detectGenre(text);
    const genreBonus = genre === "CROSS" ? 1.2 : 1.0;
    addLog(`γ genre = ${genre}${genreBonus > 1 ? " (+20% CROSS bonus)" : ""}`,
      GENRE_COLOR[genre] || "#8892a4");

    const deltaH = v / 100;
    const deltaHPrime = calculateDeltaHPrime(deltaH, usefulRatio, sigma);

    const decay = calculateDecay(repetition);
    const deltaHFinal = deltaHPrime * decay * genreBonus;
    if (repetition > 0) addLog(`γ decay = (1/2)^${repetition} = ${decay.toFixed(4)}`, "#fbbf24");

    if (repetition >= 11) {
      addLog("BURN → Echo Chamber (11-loop)", "#ef4444");
      setResult({ status:"BURN", reason:"Echo Chamber", jule:0, net:-10 });
      return;
    }

    const jule = calculateJule({ v, delta_h: deltaHFinal, reputation, k });
    const net  = jule - 10;

    addLog(`J = tanh(${v}/50) × ${deltaHFinal.toFixed(3)} × ${reputation.toFixed(2)} × ${k} × 100`, "#8892a4");
    addLog(`J = ${jule.toFixed(2)} Jule  |  net = ${net.toFixed(2)}`,
      net >= 0 ? "#34d399" : "#ef4444");
    addLog(net >= 0 ? "STATUS: ISSUED ✓" : "STATUS: BURN (net < 0)", net >= 0 ? "#00f5ff" : "#ef4444");

    const fp = { v, sigma, phi, deltaHPrime: deltaHFinal, k, genre };
    setResult({ status: net >= 0 ? "ISSUED" : "BURN", jule, net, fp, genre });
    setHistory(h => [...h.slice(-9), contentHash]);
    setPulse(true); setTimeout(()=>setPulse(false), 600);
  };

  const radarAxes = result?.fp ? [
    { label:"V",   value: result.fp.v / 100,          color:"#00f5ff" },
    { label:"ΔH'", value: Math.min(1, result.fp.deltaHPrime * 5), color:"#34d399" },
    { label:"Σ",   value: result.fp.sigma,             color:"#a78bfa" },
    { label:"Φ",   value: 1 - result.fp.phi,           color:"#60a5fa" },
    { label:"k",   value: result.fp.k,                 color:"#fbbf24" },
    { label:"γ",   value: result.fp.genre === "CROSS" ? 1 : 0.6, color: GENRE_COLOR[result.fp.genre] },
  ] : null;

  return (
    <div className="min-h-screen bg-[#060b10] text-[#c8d8e8] font-mono pb-8"
      style={{
        backgroundImage: "radial-gradient(ellipse at 20% 20%, #0a1628 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, #0d1420 0%, transparent 60%)",
      }}>
      {/* Header */}
      <div className="text-center pt-8 pb-6 px-4">
        <div className="text-[10px] text-[#2a4060] tracking-[0.3em] mb-1">PANDORA ECONOMY PROTOCOL v0.1</div>
        <div className="text-3xl font-black tracking-[0.05em] bg-gradient-to-r from-[#00f5ff] via-[#60a5fa] to-[#a78bfa] bg-clip-text text-transparent">
          THE SHREDDER
        </div>
        <div className="text-[10px] text-[#4a6080] mt-1 tracking-widest">JULE AUDIT ENGINE · 6-AXIS FINGERPRINT</div>
      </div>

      <div className="max-w-lg mx-auto px-4 space-y-5">
        {/* Input Area */}
        <div className="bg-[#0a1018] border border-[#1e2d40] rounded-2xl p-5">
          <div className="text-[10px] text-[#4a6080] tracking-widest mb-2">TRANSMISSION INPUT</div>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Enter your thought, theory, or code here..."
            className="w-full bg-[#060b10] border border-[#1a2535] rounded-xl text-sm p-4 min-h-[88px] resize-y focus:outline-none focus:border-[#00f5ff] placeholder:text-[#4a6080]"
          />

          {/* Sliders */}
          <div className="grid grid-cols-1 gap-5 mt-6">
            {[
              { label:`V score: ${v}`, val:v, set:setV, min:0, max:100, step:1 },
              { label:`Useful ratio: ${usefulRatio.toFixed(2)}`, val:usefulRatio, set:setUR, min:0, max:1, step:0.01 },
              { label:`Reputation R: ${reputation.toFixed(2)}`, val:reputation, set:setRep, min:0, max:1, step:0.01 },
              { label:`Repetition: ${repetition}x`, val:repetition, set:setRep2, min:0, max:12, step:1 },
            ].map(({label,val,set,min,max,step}) => (
              <div key={label}>
                <div className="text-[10px] text-[#4a6080] mb-2">{label}</div>
                <input type="range" min={min} max={max} step={step} value={val}
                  onChange={e => set(Number(e.target.value))}
                  className="w-full accent-[#00f5ff]"
                />
              </div>
            ))}
          </div>

          {/* Category Buttons */}
          <div className="mt-6">
            <div className="text-[10px] text-[#4a6080] mb-3">CATEGORY (L1 filter)</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(K_LABEL).map(([key, label]) => (
                <button key={key} onClick={() => setCategory(key)}
                  className={`px-4 py-2 text-xs rounded-xl border transition-all ${
                    category===key 
                      ? "border-[#00f5ff] bg-[#001820] text-[#00f5ff] shadow-[0_0_10px_#00f5ff44]" 
                      : "border-[#1e2d40] hover:border-[#4a6080]"
                  }`}>
                  {label} ({K_MAP[key]})
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={runAudit}
            className={`mt-6 w-full py-4 rounded-2xl text-sm font-bold tracking-widest transition-all duration-300 ${
              pulse ? "bg-[#00f5ff22] border-[#00f5ff] shadow-[0_0_25px_#00f5ff66]" : "bg-[#001820] border border-[#1e3050]"
            } text-[#00f5ff]`}
          >
            ▶ RUN AUDIT
          </button>
        </div>

        {/* Audit Log */}
        <div>
          <div className="text-[10px] text-[#4a6080] tracking-widest mb-2 pl-1">AUDIT LOG</div>
          <TermLog lines={log} />
        </div>

        {/* Result */}
        {result && (
          <div className={`border rounded-3xl p-6 transition-all ${
            result.status==="ISSUED" 
              ? "border-[#00f5ff44] shadow-[0_0_25px_#00f5ff11]" 
              : "border-[#ef444444] shadow-[0_0_25px_#ef444411]"
          }`}>
            <div className="flex justify-between items-center mb-5">
              <div className={`text-lg font-black tracking-widest ${result.status==="ISSUED" ? "text-[#00f5ff]" : "text-[#ef4444]"}`}>
                {result.status==="ISSUED" ? "✓ ISSUED" : "✗ BURN"}
              </div>
              {result.genre && (
                <div className="px-4 py-1 text-xs rounded-lg border" style={{
                  borderColor: GENRE_COLOR[result.genre] + "44",
                  color: GENRE_COLOR[result.genre]
                }}>
                  {result.genre}
                </div>
              )}
            </div>

            {result.fp && (
              <>
                <Gauge label="V score"        value={result.fp.v}           max={100} color="#00f5ff" />
                <Gauge label="ΔH' (final)"    value={result.fp.deltaHPrime} max={1}   color="#34d399" />
                <Gauge label="Σ singularity"  value={result.fp.sigma}       max={1}   color="#a78bfa" />
                <Gauge label="Φ inertia"      value={result.fp.phi}         max={1}   color="#60a5fa" />
                <Gauge label="k reality"      value={result.fp.k}           max={1}   color="#fbbf24" />
              </>
            )}

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-[#060b10] rounded-2xl p-5 text-center border border-[#1e2d40]">
                <div className="text-[10px] text-[#4a6080] tracking-widest mb-1">JULE ISSUED</div>
                <div className="text-4xl font-black text-[#00f5ff] tracking-tighter">{result.jule?.toFixed(1)}</div>
              </div>
              <div className="bg-[#060b10] rounded-2xl p-5 text-center border border-[#1e2d40]">
                <div className="text-[10px] text-[#4a6080] tracking-widest mb-1">NET (−10 cost)</div>
                <div className={`text-4xl font-black tracking-tighter ${ (result.net??0) >= 0 ? "text-[#34d399]" : "text-[#ef4444]" }`}>
                  {(result.net??0) >= 0 ? "+" : ""}{result.net?.toFixed(1)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Radar */}
        {radarAxes && (
          <div className="bg-[#0a1018] border border-[#1e2d40] rounded-3xl p-6">
            <div className="text-[10px] text-[#4a6080] tracking-widest mb-4">6-AXIS FINGERPRINT</div>
            <HexRadar axes={radarAxes} />
            <div className="grid grid-cols-3 gap-3 mt-6 text-center text-xs">
              {radarAxes.map(a => (
                <div key={a.label}>
                  <div style={{color: a.color}} className="font-medium tracking-widest">{a.label}</div>
                  <div className="text-[#c8d8e8] font-mono">{a.value.toFixed(3)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Formula */}
        <div className="bg-[#0a1018] border border-[#1e2d40] rounded-2xl p-5 text-xs leading-relaxed text-[#4a6080]">
          <div className="text-[#2a4060] mb-2 tracking-widest">FORMULA</div>
          <div><span className="text-[#00f5ff]">J</span> = tanh(<span className="text-[#fbbf24]">V</span>/50) × <span className="text-[#34d399]">ΔH'</span> × <span className="text-[#a78bfa]">R</span> × <span className="text-[#fbbf24]">k</span> × 100</div>
          <div className="mt-2"><span className="text-[#34d399]">ΔH'</span> = ΔH × useful_ratio × <span className="text-[#a78bfa]">Σ</span> × decay × γ_bonus</div>
          <div className="mt-3 text-[#2a4060]">posting_cost = 10 · net = J − 10</div>
        </div>
      </div>

      <div className="text-center mt-12 text-[9px] text-[#1e2d40] tracking-widest">
        JULE-AI-ENERGY · PANDORA THEORY FRAGMENT · MIT LICENSE
      </div>
    </div>
  );
}
// This is a fragment of Pandora Theory.
// Take it if you want. Build on it if you can.
// The rest is up to you. Follow the fragments.
