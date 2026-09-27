import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { CalendarDays, Droplets, Heart, Menu, Moon, Sparkles, Sun, X } from "lucide-react";
import "./styles.css";

const phases = [
  { name:"Menstrual", icon:"🌸", max:5, note:"Slow down, rest, and be gentle with yourself." },
  { name:"Follicular", icon:"🌱", max:13, note:"Energy may gradually start to rise." },
  { name:"Ovulation", icon:"✨", max:16, note:"A brighter, more social part of the cycle for many people." },
  { name:"Luteal", icon:"🌙", max:28, note:"A softer phase — listen to what your body asks for." }
];
const moods = ["😊","🥰","😌","😴","🥺","😤","🤍"];
const symptoms = ["Cramps","Bloating","Headache","Backache","Fatigue","Tenderness"];

function cycleDay(start, length){
  const d = Math.floor((Date.now()-new Date(start).getTime())/86400000);
  return ((d % length)+length)%length + 1;
}
function formatDate(value){
  return new Intl.DateTimeFormat("en-IN",{day:"numeric",month:"short"}).format(value);
}
function phaseFor(day){
  return phases.find(p=>day<=p.max) || phases[3];
}

function App(){
  const [cycleStart,setCycleStart] = useState(()=>localStorage.getItem("hls-start") || new Date().toISOString().slice(0,10));
  const [cycleLength,setCycleLength] = useState(()=>Number(localStorage.getItem("hls-length")) || 28);
  const [mood,setMood] = useState(()=>localStorage.getItem("hls-mood") || "🥰");
  const [selectedSymptoms,setSelectedSymptoms] = useState(()=>JSON.parse(localStorage.getItem("hls-symptoms") || "[]"));
  const [dark,setDark] = useState(()=>localStorage.getItem("hls-theme")==="dark");
  const [menu,setMenu] = useState(false);

  const day = cycleDay(cycleStart,cycleLength);
  const phase = useMemo(()=>phaseFor(day),[day]);
  const nextPeriod = useMemo(()=>{
    const start = new Date(cycleStart);
    const elapsed = Math.max(0,Math.floor((Date.now()-start.getTime())/86400000));
    const cycles = Math.floor(elapsed/cycleLength)+1;
    start.setDate(start.getDate()+cycles*cycleLength);
    return start;
  },[cycleStart,cycleLength]);

  useEffect(()=>{
    localStorage.setItem("hls-start",cycleStart);
    localStorage.setItem("hls-length",String(cycleLength));
    localStorage.setItem("hls-mood",mood);
    localStorage.setItem("hls-symptoms",JSON.stringify(selectedSymptoms));
    localStorage.setItem("hls-theme",dark?"dark":"light");
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  },[cycleStart,cycleLength,mood,selectedSymptoms,dark]);

  const toggle = item => setSelectedSymptoms(s=>s.includes(item)?s.filter(x=>x!==item):[...s,item]);
  const progress = Math.min(day/cycleLength,1);

  return <div className="app-shell">
    <div className="ambient a1"/><div className="ambient a2"/>
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark"><Heart size={19} fill="currentColor"/></div>
        <div><div className="brand-name">Harini's Little Space</div><div className="brand-sub">a little corner just for her</div></div>
      </div>
      <nav className={menu?"nav-links open":"nav-links"}>
        <a href="#today" onClick={()=>setMenu(false)}>Today</a>
        <a href="#check-in" onClick={()=>setMenu(false)}>Check-in</a>
        <a href="#settings" onClick={()=>setMenu(false)}>Settings</a>
      </nav>
      <div className="top-actions">
        <button className="icon-btn" onClick={()=>setDark(v=>!v)} aria-label="Toggle theme">{dark?<Sun size={18}/>:<Moon size={18}/>}</button>
        <button className="icon-btn menu-btn" onClick={()=>setMenu(v=>!v)} aria-label="Open menu">{menu?<X size={18}/>:<Menu size={18}/>}</button>
      </div>
    </header>

    <main className="content">
      <section className="hero" id="today">
        <div>
          <div className="eyebrow"><Sparkles size={14}/> good evening, Harini</div>
          <h1>Your body has a rhythm.<br/><span>Let's move with it.</span></h1>
          <p className="hero-text">A soft little space to notice your cycle, check in with yourself, and keep the everyday things that matter close.</p>
          <div className="hero-meta">
            <div><span>Today</span><strong>{new Intl.DateTimeFormat("en-IN",{weekday:"long",day:"numeric",month:"long"}).format(new Date())}</strong></div>
            <div><span>Next period</span><strong>{formatDate(nextPeriod)}</strong></div>
          </div>
        </div>
        <div className="cycle-card">
          <div className="card-top"><span>Cycle day</span><span className="phase-chip">{phase.icon} {phase.name}</span></div>
          <div className="cycle-ring" style={{"--progress":`${progress*360}deg`}}><div className="ring-inner"><strong>{day}</strong><span>of {cycleLength} days</span></div></div>
          <p>{phase.note}</p>
        </div>
      </section>

      <section className="mini-grid">
        <article className="stat-card peach"><div className="stat-icon"><Droplets size={18}/></div><div><span>Flow</span><strong>Not logged</strong></div></article>
        <article className="stat-card lilac"><div className="stat-icon"><Heart size={18}/></div><div><span>Mood</span><strong>{mood}</strong></div></article>
        <article className="stat-card cream"><div className="stat-icon"><CalendarDays size={18}/></div><div><span>Cycle length</span><strong>{cycleLength} days</strong></div></article>
      </section>

      <section className="section" id="check-in">
        <div className="heading"><div><span className="kicker">Daily check-in</span><h2>How are you feeling today?</h2></div><small>saved privately on this device</small></div>
        <div className="check-grid">
          <div className="panel"><label>Mood</label><div className="mood-row">{moods.map(x=><button key={x} className={x===mood?"mood active":"mood"} onClick={()=>setMood(x)}>{x}</button>)}</div><div className="note">{mood==="🥰"?"Feeling loved & cozy.":"Thanks for checking in with yourself."}</div></div>
          <div className="panel"><label>Anything to note?</label><div className="symptom-row">{symptoms.map(x=><button key={x} className={selectedSymptoms.includes(x)?"symptom active":"symptom"} onClick={()=>toggle(x)}>{x}</button>)}</div><div className="note">{selectedSymptoms.length?selectedSymptoms.length+" thing"+(selectedSymptoms.length>1?"s":"")+" logged today.":"Nothing logged yet."}</div></div>
        </div>
      </section>

      <section className="section" id="settings">
        <div className="heading"><div><span className="kicker">Your rhythm</span><h2>Keep the little details close.</h2></div></div>
        <div className="settings-card">
          <div className="settings-copy"><div className="soft-icon"><CalendarDays size={20}/></div><div><h3>Cycle settings</h3><p>Set the first day of your latest period and your usual cycle length. Everything stays on this device.</p></div></div>
          <div className="settings-form">
            <label><span>Latest period started</span><input type="date" value={cycleStart} onChange={e=>setCycleStart(e.target.value)}/></label>
            <label><span>Usual cycle length</span><select value={cycleLength} onChange={e=>setCycleLength(Number(e.target.value))}>{Array.from({length:12},(_,i)=>i+21).map(v=><option key={v} value={v}>{v} days</option>)}</select></label>
          </div>
        </div>
      </section>

      <section className="closing"><span>✿</span><div><strong>For the days you feel everything a little more.</strong><p>This space is a gentle guide, not a medical diagnosis. Bodies can be beautifully unpredictable.</p></div></section>
    </main>

    <footer className="footer"><span>Made with a little extra care for Harini ♡</span><span>Harini's Little Space · {new Date().getFullYear()}</span></footer>
  </div>;
}

createRoot(document.getElementById("root")).render(<React.StrictMode><App/></React.StrictMode>);
