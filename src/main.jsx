import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { CalendarDays, ChevronRight, Droplets, Heart, History, Menu, Moon, Plus, RefreshCw, Sparkles, Sun, Trash2, X } from "lucide-react";
import { supabase } from "./lib/supabase";
import "./styles.css";

const moods = ["😊","🥰","😌","😴","🥺","😤","🤍"];
const symptoms = ["Cramps","Bloating","Headache","Backache","Fatigue","Tenderness"];
const formatLong = value => new Intl.DateTimeFormat("en-IN",{weekday:"long",day:"numeric",month:"long"}).format(new Date(value));
const formatDate = value => value ? new Intl.DateTimeFormat("en-IN",{day:"numeric",month:"short",year:"numeric"}).format(new Date(value+"T00:00:00")) : "·";
const daysBetween = (a,b) => Math.round((new Date(b+"T00:00:00")-new Date(a+"T00:00:00"))/86400000);
const todayString = () => new Date().toISOString().slice(0,10);
function getPhase(day){ if(day<=5)return{name:"Menstrual",icon:"🌸",note:"Slow down, rest, and be gentle with yourself."}; if(day<=13)return{name:"Follicular",icon:"🌱",note:"Energy may gradually start to rise."}; if(day<=16)return{name:"Ovulation",icon:"✨",note:"A brighter, more social part of the cycle for many people."}; return{name:"Luteal",icon:"🌙",note:"A softer phase · listen to what your body asks for."}; }
function getCycleDay(start){ return Math.max(1,daysBetween(start,todayString())+1); }

function App(){
  const [tab,setTab]=useState("today"),[cycles,setCycles]=useState([]),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[deleting,setDeleting]=useState(null),[error,setError]=useState(""),[user,setUser]=useState(null);
  const [periodStart,setPeriodStart]=useState(""),[periodEnd,setPeriodEnd]=useState(""),[showLogger,setShowLogger]=useState(false);
  const [mood,setMood]=useState(()=>localStorage.getItem("hls-mood")||"🥰"),[selectedSymptoms,setSelectedSymptoms]=useState(()=>JSON.parse(localStorage.getItem("hls-symptoms")||"[]"));
  const [dark,setDark]=useState(()=>localStorage.getItem("hls-theme")==="dark"),[menu,setMenu]=useState(false);

  const latest=cycles[0],previous=cycles[1];
  const cycleLength=latest&&previous?daysBetween(previous.period_start,latest.period_start):28;
  const currentDay=latest?getCycleDay(latest.period_start):0;
  const phase=latest?getPhase(currentDay):getPhase(1);
  const nextPeriod=latest?new Date(latest.period_start+"T00:00:00"):new Date();
  if(latest)nextPeriod.setDate(nextPeriod.getDate()+cycleLength);
  const averageLength=useMemo(()=>{if(cycles.length<2)return cycleLength;const lengths=cycles.slice(0,-1).map((c,i)=>daysBetween(cycles[i+1].period_start,c.period_start)).filter(n=>n>0&&n<100);return lengths.length?Math.round(lengths.reduce((a,b)=>a+b,0)/lengths.length):cycleLength;},[cycles,cycleLength]);
  const chartData=useMemo(()=>cycles.slice(0,-1).map((c,i)=>({id:c.id,start:c.period_start,length:daysBetween(cycles[i+1].period_start,c.period_start)})).filter(x=>x.length>0&&x.length<100).reverse().slice(-8),[cycles]);
  const chartMin=chartData.length?Math.max(1,Math.min(...chartData.map(x=>x.length))-4):24;
  const chartMax=chartData.length?Math.max(...chartData.map(x=>x.length),averageLength)+4:32;

  useEffect(()=>{document.documentElement.dataset.theme=dark?"dark":"light";localStorage.setItem("hls-theme",dark?"dark":"light");localStorage.setItem("hls-mood",mood);localStorage.setItem("hls-symptoms",JSON.stringify(selectedSymptoms));},[dark,mood,selectedSymptoms]);

  useEffect(()=>{
    let mounted=true;
    async function init(){
      setLoading(true);setError("");
      const {data:sessionData,error:sessionError}=await supabase.auth.getSession();
      if(sessionError){if(mounted)setError(sessionError.message);setLoading(false);return;}
      let currentUser=sessionData.session?.user;
      if(!currentUser){
        const {data,error:signInError}=await supabase.auth.signInAnonymously();
        if(signInError){if(mounted)setError("Supabase anonymous sign-in is not enabled yet. Enable it in Authentication → Providers → Anonymous Sign-Ins.");setLoading(false);return;}
        currentUser=signIn.data.user;
      }
      if(mounted){setUser(currentUser);await loadCycles(currentUser.id);}
    }
    init();
    const {data:listener}=supabase.auth.onAuthStateChange((_event,session)=>{if(mounted&&session?.user){setUser(session.user);loadCycles(session.user.id);}});
    return()=>{mounted=false;listener.subscription.unsubscribe();};
  },[]);

  async function loadCycles(userId){
    const {data,error:queryError}=await supabase.from("period_cycles").select("id,user_id,period_start,period_end,created_at").eq("user_id",userId).order("period_start",{ascending:false});
    if(queryError){setError(queryError.message);setCycles([]);}else setCycles(data||[]);
    setLoading(false);
  }
  async function addCycle(e){
    e.preventDefault();if(!user||!periodStart)return;
    if(periodEnd&&periodEnd<periodStart){setError("Period end date cannot be before the start date.");return;}
    setSaving(true);setError("");
    const {data,error:insertError}=await supabase.from("period_cycles").insert({user_id:user.id,period_start:periodStart,period_end:periodEnd||null}).select().single();
    if(insertError)setError(insertError.message);else{setCycles(c=>[data,...c].sort((a,b)=>b.period_start.localeCompare(a.period_start)));setPeriodStart("");setPeriodEnd("");setShowLogger(false);setTab("today");}
    setSaving(false);
  }
  async function deleteCycle(id){
    if(!user)return;setDeleting(id);setError("");
    const {error:deleteError}=await supabase.from("period_cycles").delete().eq("id",id);
    if(deleteError)setError(deleteError.message);else setCycles(c=>c.filter(x=>x.id!==id));setDeleting(null);
  }
  const openLogger=()=>{setPeriodStart(todayString());setPeriodEnd("");setShowLogger(true);};
  const nav=next=>{setTab(next);setMenu(false);window.scrollTo({top:0,behavior:"smooth"});};

  return <div className="app-shell">
    <div className="ambient a1"/><div className="ambient a2"/>
    <header className="topbar">
      <button className="brand brand-button" onClick={()=>nav("today")} aria-label="Go home"><div className="brand-mark"><Heart size={19} fill="currentColor"/></div><div><div className="brand-name">Harini's Little Space</div><div className="brand-sub">a private rhythm, made gently</div></div></button>
      <nav className={menu?"nav-links open":"nav-links"}><button className={tab==="today"?"active":""} onClick={()=>nav("today")}>Today</button><button className={tab==="history"?"active":""} onClick={()=>nav("history")}>Cycle History</button></nav>
      <div className="top-actions"><button className="icon-btn" onClick={()=>setDark(v=>!v)} aria-label="Toggle theme">{dark?<Sun size={18}/>:<Moon size={18}/>}</button><button className="icon-btn menu-btn" onClick={()=>setMenu(v=>!v)} aria-label="Open menu">{menu?<X size={18}/>:<Menu size={18}/>}</button></div>
    </header>

    {error&&<div className="error-banner"><span>{error}</span><button onClick={()=>setError("")}><X size={15}/></button></div>}

    <main className="content">
      {tab==="today"?<>
        <section className="hero" id="today">
          <div><div className="eyebrow"><Sparkles size={14}/> good evening, Harini</div><h1>Your body has a rhythm.<br/><span>Let’s move with it.</span></h1><p className="hero-text">A soft little space to notice your cycle, check in with yourself, and keep the everyday things that matter close.</p>
          {latest?<div className="hero-meta"><div><span>Today</span><strong>{formatLong(todayString())}</strong></div><div><span>Next period · estimated</span><strong>{formatDate(nextPeriod.toISOString().slice(0,10))}</strong></div></div>:<button className="primary-btn" onClick={openLogger}><Plus size={16}/> Log her first period</button>}</div>
          <div className="cycle-card"><div className="card-top"><span>Current rhythm</span>{latest&&<span className="phase-chip">{phase.icon} {phase.name}</span>}</div>
          {latest?<><div className="cycle-ring" style={{"--progress":(Math.min(currentDay/Math.max(cycleLength,1),1)*360)+"deg"}}><div className="ring-inner"><strong>{currentDay}</strong><span>cycle day</span></div></div><p>{phase.note}</p></>:<div className="empty-cycle"><div>🌷</div><strong>Your cycle starts here.</strong><p>Log the first day of her period to begin tracking.</p><button className="secondary-btn" onClick={openLogger}>Add period</button></div>}</div>
        </section>

        <section className="mini-grid"><article className="stat-card peach"><div className="stat-icon"><Droplets size={18}/></div><div><span>Latest period</span><strong>{latest?formatDate(latest.period_start):"Not logged"}</strong></div></article><article className="stat-card lilac"><div className="stat-icon"><Heart size={18}/></div><div><span>Mood</span><strong>{mood}</strong></div></article><article className="stat-card cream"><div className="stat-icon"><CalendarDays size={18}/></div><div><span>Average cycle</span><strong>{averageLength} days</strong></div></article></section>

        <section className="section"><div className="heading"><div><span className="kicker">Daily check-in</span><h2>How are you feeling today?</h2></div><small>mood and symptoms stay on this device</small></div><div className="check-grid">
          <div className="panel"><label>Mood</label><div className="mood-row">{moods.map(x=><button key={x} className={x===mood?"mood active":"mood"} onClick={()=>setMood(x)}>{x}</button>)}</div><div className="note">{mood==="🥰"?"Feeling loved & cozy.":"Thanks for checking in with yourself."}</div></div>
          <div className="panel"><label>Anything to note?</label><div className="symptom-row">{symptoms.map(x=><button key={x} className={selectedSymptoms.includes(x)?"symptom active":"symptom"} onClick={()=>setSelectedSymptoms(s=>s.includes(x)?s.filter(v=>v!==x):[...s,x])}>{x}</button>)}</div><div className="note">{selectedSymptoms.length?selectedSymptoms.length+" thing"+(selectedSymptoms.length>1?"s":"")+" logged today.":"Nothing logged yet."}</div></div>
        </div></section>

        <section className="section quick-history"><div className="heading"><div><span className="kicker">Recent cycles</span><h2>A record that grows with her.</h2></div><button className="text-btn" onClick={()=>nav("history")}>View all <ChevronRight size={15}/></button></div>
          {cycles.length?<div className="recent-list">{cycles.slice(0,3).map((c,i)=><div className="recent-row" key={c.id}><div className="recent-month">{new Intl.DateTimeFormat("en-IN",{month:"short"}).format(new Date(c.period_start+"T00:00:00"))}<strong>{new Date(c.period_start+"T00:00:00").getDate()}</strong></div><div className="recent-main"><strong>{formatDate(c.period_start)}</strong><span>{c.period_end?"Ended "+formatDate(c.period_end):"Currently logged"}</span></div><div className="recent-length">{cycles[i+1]?daysBetween(cycles[i+1].period_start,c.period_start)+" days":i===0?"Current":"·"}</div></div>)}</div>:<div className="empty-panel">No cycle history yet. Add the first period to start building her history.</div>}
        </section>
      </>:<section className="history-page">
        <div className="history-header"><div><span className="kicker">Her rhythm</span><h1>Cycle history</h1><p>A quiet record of every month.</p></div><button className="primary-btn" onClick={openLogger}><Plus size={16}/> Log period</button></div>
        {loading?<div className="loading"><RefreshCw className="spin" size={20}/> Loading her history…</div>:cycles.length===0?<div className="empty-panel large"><div className="empty-icon">🌷</div><h2>Her story starts here.</h2><p>Once you log a period, each month will appear here with its dates and cycle length.</p><button className="secondary-btn" onClick={openLogger}>Log first period</button></div>:
        <>{chartData.length>0&&<section className="cycle-chart"><div className="chart-heading"><div><span className="kicker">Visual history</span><h2>Her cycle, month by month · visual rhythm.</h2></div><div className="chart-average"><span>Average</span><strong>{averageLength} days</strong></div></div><div className="chart-wrap"><div className="chart-scale"><span>{chartMax}d</span><span>{Math.round((chartMax+chartMin)/2)}d</span><span>{chartMin}d</span></div><div className="chart-area"><div className="chart-average-line" style={{bottom:`${((averageLength-chartMin)/(chartMax-chartMin))*100}%`}}><span>{averageLength} day average</span></div><div className="chart-bars">{chartData.map(item=>{const height=Math.max(8,Math.min(100,((item.length-chartMin)/(chartMax-chartMin))*100));return <div className="chart-column" key={item.id}><div className="chart-value">{item.length}</div><div className="chart-bar-track"><div className="chart-bar" style={{height:`${height}%`}}/></div><span>{new Intl.DateTimeFormat("en-IN",{month:"short"}).format(new Date(item.start+"T00:00:00"))}</span></div>})}</div></div></div><p className="chart-caption">Each bar shows the number of days from one period start to the next. It helps you spot changes in rhythm without turning the history into a spreadsheet.</p></section>}
        <div className="history-list">{cycles.map((c,i)=>{const length=cycles[i+1]?daysBetween(cycles[i+1].period_start,c.period_start):null;const duration=c.period_end?daysBetween(c.period_start,c.period_end)+1:null;return <article className="history-card" key={c.id}><div className="history-date"><span>{new Intl.DateTimeFormat("en-IN",{month:"short"}).format(new Date(c.period_start+"T00:00:00"))}</span><strong>{new Date(c.period_start+"T00:00:00").getDate()}</strong><small>{new Intl.DateTimeFormat("en-IN",{year:"numeric"}).format(new Date(c.period_start+"T00:00:00"))}</small></div><div className="history-details"><div><strong>{formatDate(c.period_start)}</strong><span>{c.period_end?"Period ended "+formatDate(c.period_end):"End date not recorded"}</span></div><div className="history-metrics">{length&&<div><small>Cycle</small><strong>{length} days</strong></div>}{duration&&<div><small>Period</small><strong>{duration} days</strong></div>}</div></div><button className="delete-btn" disabled={deleting===c.id} onClick={()=>deleteCycle(c.id)} aria-label="Delete cycle">{deleting===c.id?<RefreshCw className="spin" size={15}/>:<Trash2 size={15}/>}</button></article>})}</div></>}
        </div>
        <div className="history-note"><History size={17}/><span>Cycle length is calculated from one period start to the next. Predictions are estimates and can naturally vary.</span></div>
      </section>}
    </main>

    <footer className="footer"><span>Made with a little extra care for Harini ♡</span><span>Harini's Little Space · {new Date().getFullYear()}</span></footer>

    {showLogger&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setShowLogger(false)}}><form className="modal" onSubmit={addCycle}><div className="modal-header"><div><span className="kicker">Monthly check-in</span><h2>Log her period</h2></div><button type="button" className="icon-btn" onClick={()=>setShowLogger(false)}><X size={17}/></button></div><p className="modal-copy">Add the actual period dates. Her cycle history and future estimates will update automatically.</p><label><span>Period started</span><input required type="date" value={periodStart} max={todayString()} onChange={e=>setPeriodStart(e.target.value)}/></label><label><span>Period ended <em>optional</em></span><input type="date" value={periodEnd} max={todayString()} min={periodStart||undefined} onChange={e=>setPeriodEnd(e.target.value)}/></label><div className="modal-actions"><button type="button" className="secondary-btn" onClick={()=>setShowLogger(false)}>Cancel</button><button className="primary-btn" disabled={saving||!user}>{saving?<><RefreshCw className="spin" size={15}/> Saving…</>:<><Heart size={15}/> Save period</>}</button></div></form></div>}
  </div>;
}
createRoot(document.getElementById("root")).render(<React.StrictMode><App/></React.StrictMode>);
