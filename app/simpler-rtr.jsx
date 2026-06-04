"use client";
import { useState, useMemo, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

/* ══════════════════════════════════════════════════
   DESIGN TOKENS — Dark Premium (inspired by Ringkes)
══════════════════════════════════════════════════ */
const C = {
  // Backgrounds
  bg:       "#0A0F0A",
  bg2:      "#111711",
  bg3:      "#161D16",
  surface:  "#1C251C",
  surface2: "#222D22",
  card:     "#1A221A",

  // Borders
  line:     "rgba(255,255,255,0.07)",
  line2:    "rgba(255,255,255,0.12)",

  // Text
  white:    "#F0F4F0",
  light:    "#C8D4C8",
  soft:     "#8FA88F",
  muted:    "#576857",

  // Accent — Ocean Green (maritime)
  green:    "#3DD68C",
  greenD:   "#2AAF71",
  greenL:   "rgba(61,214,140,0.12)",
  greenM:   "rgba(61,214,140,0.2)",

  // Category colors
  teal:     "#2DD4BF",
  tealL:    "rgba(45,212,191,0.12)",
  amber:    "#F59E0B",
  amberL:   "rgba(245,158,11,0.12)",
  rose:     "#F87171",
  roseL:    "rgba(248,113,113,0.12)",
  violet:   "#A78BFA",
  violetL:  "rgba(167,139,250,0.12)",
  blue:     "#60A5FA",
  blueL:    "rgba(96,165,250,0.12)",
};

const KS = {
  "RZ KAW":  { c:C.teal,   l:C.tealL,   icon:"🌊", label:"Rencana Zonasi Kawasan Antarwilayah" },
  "RTR KSN": { c:C.amber,  l:C.amberL,  icon:"📍", label:"RTR Kawasan Strategis Nasional" },
  "RTRWP":   { c:C.rose,   l:C.roseL,   icon:"🏛️", label:"RTR Wilayah Provinsi" },
  "RTRWN":   { c:C.violet, l:C.violetL, icon:"🗺️", label:"RTR Wilayah Nasional" },
};

const ST = {
  Selesai: { c:C.green,  l:C.greenL,  dot:"#3DD68C", ic:"✓" },
  Proses:  { c:C.amber,  l:C.amberL,  dot:"#F59E0B", ic:"◑" },
  Belum:   { c:C.muted,  l:"rgba(87,104,87,0.15)", dot:"#576857", ic:"○" },
};

const KATEGORI = ["RZ KAW","RTR KSN","RTRWP","RTRWN"];
const TAHAPAN = {
  "RZ KAW":  ["Pembentukan PAK","Dokumen Awal","Dokumen Antara","Dokumen Final","Legal Drafting","Pembahasan PAK","Harmonisasi","Penetapan Perpres"],
  "RTR KSN": ["Materi Teknis Ruang Darat & Perairan","Integrasi Muatan Materi Teknis","Persetujuan Substansi","Rapat PAK","Harmonisasi","Permohonan Paraf K/L","Penetapan Perpres"],
  "RTRWP":   ["Materi Teknis Ruang Darat & Laut","Proses Integrasi","Validasi KLHS","Pembahasan Ranperda di DPRD","Lintas Sektor","Persetujuan Substansi","Persetujuan DPRD","Evaluasi Dagri","Penetapan Perda"],
  "RTRWN":   ["Penyusunan Materi Teknis RTRL & RTRWN","Integrasi Muatan Materi Teknis","Sinkronisasi Muatan RTRWN","Penyusunan RPP RTRWN","Penyusunan Dokumen KLHS","Penetapan Peraturan Pemerintah"],
};

const calcP = e => {
  if (!e.steps || e.steps.length === 0) return 0;
  return Math.round(e.steps.filter(s => s.status === "Selesai").length / e.steps.length * 100);
};

function formatEntry(entry, allSteps) {
  const steps = (allSteps || [])
    .filter(s => s.entry_id === entry.id)
    .sort((a, b) => a.urutan - b.urutan)
    .map(s => ({ id:s.id, nama:s.nama, status:s.status||"Belum", tanggal:s.tanggal||"", keterangan:s.keterangan||"" }));
  return { id:entry.id, nama:entry.nama, kategori:entry.kategori, produk:entry.produk||"", link_produk:entry.link_produk||"", steps };
}

function exportCSV(data) {
  const maxS = Math.max(...data.map(d => d.steps.length));
  const hdr = ["ID","Nama","Kategori","Progress (%)","Produk","Link Produk",...Array.from({length:maxS},(_,i)=>["T"+(i+1)+" Nama","T"+(i+1)+" Status","T"+(i+1)+" Tanggal","T"+(i+1)+" Keterangan"]).flat()];
  const rows = data.map(d => { const b=[d.id,d.nama,d.kategori,calcP(d),d.produk,d.link_produk]; const s=[]; for(let i=0;i<maxS;i++){const t=d.steps[i];if(t)s.push(t.nama,t.status,t.tanggal,t.keterangan);else s.push("","","","");} return[...b,...s]; });
  const csv=[hdr,...rows].map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(",")).join("\n");
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="data_rtr.csv";a.click();
}

/* ══════════════════════════════════════════════════
   GLOBAL STYLES
══════════════════════════════════════════════════ */
const GS = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Syne:wght@700;800&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    html,body{font-family:'Plus Jakarta Sans',sans-serif;background:${C.bg};color:${C.light};-webkit-text-size-adjust:100%;overscroll-behavior:none;}
    ::-webkit-scrollbar{width:3px;height:3px;}
    ::-webkit-scrollbar-track{background:transparent;}
    ::-webkit-scrollbar-thumb{background:${C.line2};border-radius:2px;}
    input,select,button,textarea{font-family:'Plus Jakarta Sans',sans-serif;}

    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
    @keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
    @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}

    .fade-in{animation:fadeIn .3s ease both;}
    .slide-up{animation:slideUp .4s cubic-bezier(.16,1,.3,1) both;}

    /* ── LAYOUT ── */
    .app-wrap{min-height:100vh;background:${C.bg};display:flex;flex-direction:column;}

    /* ── TOPBAR ── */
    .topbar{
      height:52px;padding:0 16px;
      display:flex;align-items:center;justify-content:space-between;
      border-bottom:1px solid ${C.line};
      background:${C.bg};
      position:sticky;top:0;z-index:40;
      backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
    }
    @media(min-width:640px){.topbar{padding:0 24px;height:56px;}}

    /* ── NAV BAR ── */
    .nav-bar{
      position:fixed;bottom:0;left:0;right:0;
      background:rgba(10,15,10,0.92);
      backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);
      border-top:1px solid ${C.line};
      display:flex;align-items:center;justify-content:space-around;
      padding:8px 0 calc(8px + env(safe-area-inset-bottom));
      z-index:50;
    }
    .nav-item{
      display:flex;flex-direction:column;align-items:center;gap:4px;
      padding:6px 16px;cursor:pointer;border-radius:10px;
      transition:all .15s;-webkit-tap-highlight-color:transparent;
      min-width:64px;
    }
    .nav-item.on{background:${C.greenL};}
    .nav-icon{font-size:20px;transition:transform .15s;}
    .nav-item.on .nav-icon{transform:scale(1.1);}
    .nav-label{font-size:9px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;}

    /* ── CONTENT AREA ── */
    .content{flex:1;overflow-y:auto;padding-bottom:calc(72px + env(safe-area-inset-bottom));}
    .content.no-nav{padding-bottom:0;}
    .inner{max-width:960px;margin:0 auto;padding:16px;}
    @media(min-width:640px){.inner{padding:24px;}}
    @media(min-width:960px){.inner{padding:32px;}}

    /* ── CARDS ── */
    .card{
      background:${C.card};border:1px solid ${C.line};border-radius:14px;
      overflow:hidden;
    }
    .card-hover{cursor:pointer;transition:border-color .15s,background .15s;-webkit-tap-highlight-color:transparent;}
    .card-hover:hover{border-color:${C.line2};background:${C.surface};}
    .card-hover:active{background:${C.surface2};}

    /* ── ENTRY CARD ── */
    .entry-card{
      background:${C.card};border:1px solid ${C.line};border-radius:14px;
      padding:16px;cursor:pointer;
      transition:border-color .15s,background .15s,transform .15s;
      -webkit-tap-highlight-color:transparent;
    }
    .entry-card:hover{border-color:${C.line2};background:${C.surface};}
    .entry-card:active{transform:scale(.99);background:${C.surface2};}

    /* ── SHEET ── */
    .sheet{
      position:fixed;bottom:0;left:0;right:0;
      background:${C.bg2};border-top:1px solid ${C.line2};
      border-radius:20px 20px 0 0;
      max-height:92vh;display:flex;flex-direction:column;
      box-shadow:0 -20px 60px rgba(0,0,0,0.5);
      animation:sheetUp .3s cubic-bezier(.16,1,.3,1) both;
      z-index:100;
    }
    .sheet-handle{width:32px;height:3px;border-radius:2px;background:${C.line2};margin:10px auto 0;flex-shrink:0;}
    .sheet-scroll{overflow-y:auto;flex:1;}
    .overlay{position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:99;animation:fadeIn .2s ease;}

    /* ── PROGRESS BAR ── */
    .pbar-wrap{position:relative;height:6px;background:${C.line};border-radius:99px;overflow:hidden;}
    .pbar-fill{height:100%;border-radius:99px;transition:width .8s cubic-bezier(.4,0,.2,1);}
    .pbar-glow{position:absolute;right:0;top:50%;transform:translateY(-50%);width:6px;height:6px;border-radius:50%;box-shadow:0 0 8px 2px currentColor;}

    /* ── CIRCULAR PROGRESS ── */
    .cprog{transform:rotate(-90deg);}
    .cprog-track{fill:none;stroke:${C.line};}
    .cprog-fill{fill:none;stroke-linecap:round;transition:stroke-dashoffset .8s cubic-bezier(.4,0,.2,1);}

    /* ── STEP DOTS ── */
    .step-dots{display:flex;gap:3px;align-items:center;}
    .step-dot{height:5px;border-radius:99px;transition:all .3s ease;flex-shrink:0;}

    /* ── CHIP ── */
    .chip{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:99px;font-size:10px;font-weight:700;letter-spacing:.04em;}

    /* ── INPUTS ── */
    .field{
      width:100%;padding:12px 14px;
      background:${C.bg3};border:1px solid ${C.line};border-radius:10px;
      font-size:15px;color:${C.white};outline:none;
      transition:border-color .15s;-webkit-appearance:none;
    }
    .field:focus{border-color:${C.green};}
    .field::placeholder{color:${C.muted};}
    select.field{cursor:pointer;}

    /* ── BUTTONS ── */
    .btn-primary{
      display:flex;align-items:center;justify-content:center;gap:8px;
      width:100%;padding:13px;border:none;border-radius:12px;
      background:${C.green};color:#0A0F0A;font-size:14px;font-weight:800;
      cursor:pointer;transition:all .15s;-webkit-tap-highlight-color:transparent;
    }
    .btn-primary:hover{background:${C.greenD};}
    .btn-primary:active{opacity:.85;transform:scale(.99);}
    .btn-ghost{
      display:flex;align-items:center;justify-content:center;gap:8px;
      padding:12px 20px;border:1px solid ${C.line2};border-radius:12px;
      background:transparent;color:${C.soft};font-size:14px;font-weight:600;
      cursor:pointer;-webkit-tap-highlight-color:transparent;transition:all .15s;
    }
    .btn-ghost:hover{border-color:${C.soft};color:${C.light};}
    .btn-icon{
      display:flex;align-items:center;justify-content:center;
      width:36px;height:36px;border-radius:10px;border:none;
      background:${C.surface};cursor:pointer;font-size:16px;
      -webkit-tap-highlight-color:transparent;transition:background .12s;
      color:${C.soft};
    }
    .btn-icon:hover{background:${C.surface2};}

    /* ── PILL FILTER ── */
    .pill{
      padding:7px 14px;border-radius:99px;font-size:11px;font-weight:700;
      border:1px solid ${C.line};background:transparent;color:${C.soft};
      cursor:pointer;white-space:nowrap;transition:all .15s;letter-spacing:.03em;
      -webkit-tap-highlight-color:transparent;
    }
    .pill.on{background:${C.green};border-color:${C.green};color:#0A0F0A;}
    .pill:hover:not(.on){border-color:${C.line2};color:${C.light};}

    /* ── DIVIDER ── */
    .divider{height:1px;background:${C.line};margin:0;}

    /* ── TABLE ROW ── */
    .t-row{
      display:flex;align-items:center;gap:14px;padding:14px 16px;
      cursor:pointer;transition:background .12s;
      -webkit-tap-highlight-color:transparent;
    }
    .t-row:hover{background:${C.surface};}
    .t-row+.t-row{border-top:1px solid ${C.line};}

    /* ── SPINNER ── */
    .spinner{width:24px;height:24px;border:2px solid ${C.line};border-top-color:${C.green};border-radius:50%;animation:spin .7s linear infinite;}

    /* ── GRID ── */
    .card-grid{display:grid;gap:10px;grid-template-columns:1fr;}
    @media(min-width:480px){.card-grid{grid-template-columns:1fr 1fr;}}
    @media(min-width:768px){.card-grid{grid-template-columns:repeat(3,1fr);}}
    @media(min-width:1024px){.card-grid{grid-template-columns:repeat(4,1fr);}}

    /* ── SCROLL X ── */
    .scroll-x{display:flex;gap:6px;overflow-x:auto;padding:2px 1px;}
    .scroll-x::-webkit-scrollbar{height:0;}

    /* ── LABEL ── */
    .label{font-size:9px;font-weight:800;color:${C.muted};letter-spacing:.12em;text-transform:uppercase;}

    /* ── STAT BOX ── */
    .stat-box{background:${C.card};border:1px solid ${C.line};border-radius:14px;padding:16px;text-align:center;}

    /* ── SECTION HEADER ── */
    .sec-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;}
  `}</style>
);

/* ══════════════════════════════════════════════════
   ATOMS
══════════════════════════════════════════════════ */
function PBar({p, color, h=5, glow=false}){
  return(
    <div className="pbar-wrap" style={{height:h}}>
      <div className="pbar-fill" style={{width:p+"%", background:color, height:"100%"}}/>
    </div>
  );
}

function CircProgress({p, color, size=56, stroke=4}){
  const r = (size - stroke*2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (p/100)*circ;
  return(
    <svg width={size} height={size} className="cprog">
      <circle className="cprog-track" cx={size/2} cy={size/2} r={r} strokeWidth={stroke} stroke={C.line}/>
      <circle className="cprog-fill" cx={size/2} cy={size/2} r={r} strokeWidth={stroke}
        stroke={color} strokeDasharray={circ} strokeDashoffset={offset}/>
    </svg>
  );
}

function StepDots({steps, color}){
  const total = steps.length;
  const maxShow = Math.min(total, 12);
  return(
    <div className="step-dots">
      {steps.slice(0,maxShow).map((s,i)=>{
        const st = ST[s.status]||ST.Belum;
        const w = s.status==="Selesai" ? 10 : 5;
        return <div key={i} className="step-dot" style={{width:w, background:st.dot}}/>;
      })}
      {total>maxShow&&<span style={{fontSize:9,color:C.muted,fontWeight:700}}>+{total-maxShow}</span>}
    </div>
  );
}

function KatChip({k, size="sm"}){
  const ks=KS[k];
  return(
    <span className="chip" style={{background:ks.l,color:ks.c,fontSize:size==="lg"?11:9}}>
      {ks.icon} {k}
    </span>
  );
}

function StatusChip({st}){
  const s=ST[st]||ST.Belum;
  return(
    <span className="chip" style={{background:s.l,color:s.c}}>
      {s.ic} {st}
    </span>
  );
}

function Spinner(){
  return <div style={{display:"flex",justifyContent:"center",padding:"48px 0"}}><div className="spinner"/></div>;
}

function Empty({icon="🔍",text="Tidak ada data"}){
  return(
    <div style={{textAlign:"center",padding:"48px 20px",color:C.muted}}>
      <div style={{fontSize:40,marginBottom:12,opacity:.4}}>{icon}</div>
      <div style={{fontSize:14,fontWeight:600}}>{text}</div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SHEET WRAPPER
══════════════════════════════════════════════════ */
function Sheet({children, onClose, title, subtitle}){
  return(
    <>
      <div className="overlay" onClick={onClose}/>
      <div className="sheet">
        <div className="sheet-handle"/>
        {(title||subtitle)&&(
          <div style={{padding:"16px 20px 0",display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexShrink:0}}>
            <div>
              {title&&<div style={{fontSize:17,fontWeight:800,color:C.white}}>{title}</div>}
              {subtitle&&<div style={{fontSize:12,color:C.muted,marginTop:2}}>{subtitle}</div>}
            </div>
            <button className="btn-icon" onClick={onClose} style={{marginTop:-2}}>✕</button>
          </div>
        )}
        <div className="sheet-scroll">{children}</div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════
   NAV BAR
══════════════════════════════════════════════════ */
const NAV = [
  {id:"home",   icon:"⊙", label:"Beranda"},
  {id:"status", icon:"◫", label:"Status"},
  {id:"produk", icon:"◈", label:"Produk"},
  {id:"hukum",  icon:"◉", label:"Hukum"},
];

function NavBar({active, onTab}){
  return(
    <div className="nav-bar">
      {NAV.map(n=>{
        const on = active===n.id;
        return(
          <div key={n.id} className={"nav-item"+(on?" on":"")} onClick={()=>onTab(n.id)}>
            <div className="nav-icon" style={{color:on?C.green:C.muted,fontFamily:"monospace",fontWeight:700,fontSize:18}}>{n.icon}</div>
            <span className="nav-label" style={{color:on?C.green:C.muted}}>{n.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   APP SHELL
══════════════════════════════════════════════════ */
function AppShell({title, children, rightBtn, onBack, tab, onTab, hideNav}){
  return(
    <div className="app-wrap fade-in">
      <div style={{height:"env(safe-area-inset-top,0px)",background:C.bg}}/>
      <div className="topbar">
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {onBack&&(
            <button className="btn-icon" onClick={onBack} style={{fontSize:18}}>←</button>
          )}
          <span style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:800,color:C.white,letterSpacing:".02em"}}>{title}</span>
        </div>
        {rightBtn&&rightBtn}
      </div>
      <div className={"content"+(hideNav?" no-nav":"")}>
        {children}
      </div>
      {!hideNav&&tab&&<NavBar active={tab} onTab={onTab}/>}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   DETAIL SHEET
══════════════════════════════════════════════════ */
function DetailSheet({entry, onEdit, onClose}){
  const p = calcP(entry);
  const ks = KS[entry.kategori];
  const done = entry.steps.filter(s=>s.status==="Selesai").length;
  return(
    <Sheet onClose={onClose}>
      {/* Hero */}
      <div style={{padding:"20px 20px 0"}}>
        <KatChip k={entry.kategori} size="lg"/>
        <div style={{fontSize:22,fontWeight:800,color:C.white,marginTop:10,lineHeight:1.2}}>{entry.nama}</div>

        {/* Circular progress + stats */}
        <div style={{display:"flex",alignItems:"center",gap:20,marginTop:16}}>
          <div style={{position:"relative",flexShrink:0}}>
            <CircProgress p={p} color={ks.c} size={72} stroke={5}/>
            <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{fontSize:15,fontWeight:800,color:ks.c}}>{p}%</span>
            </div>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:24,fontWeight:800,color:C.white,lineHeight:1}}>{done}<span style={{fontSize:13,color:C.muted,fontWeight:500}}>/{entry.steps.length} tahap</span></div>
            <div style={{marginTop:8}}><PBar p={p} color={ks.c} h={5}/></div>
            <div style={{marginTop:6}}><StepDots steps={entry.steps} color={ks.c}/></div>
          </div>
        </div>

        {/* Produk */}
        {entry.produk&&(
          <div style={{marginTop:14,padding:"10px 14px",background:ks.l,borderRadius:10,display:"flex",alignItems:"center",gap:10,cursor:entry.link_produk?"pointer":"default",border:"1px solid "+(ks.c+"30")}}
            onClick={()=>entry.link_produk&&window.open(entry.link_produk,"_blank")}>
            <span style={{fontSize:16}}>📎</span>
            <span style={{fontSize:13,fontWeight:700,color:ks.c,flex:1}}>{entry.produk}</span>
            {entry.link_produk&&<span style={{fontSize:11,color:ks.c,fontWeight:700}}>Buka ↗</span>}
          </div>
        )}
      </div>

      {/* Steps */}
      <div style={{padding:"20px 20px 8px"}}>
        <div className="label" style={{marginBottom:12}}>Tahapan Penetapan</div>
      </div>
      <div className="card" style={{margin:"0 16px",borderRadius:12}}>
        {entry.steps.map((s,i)=>{
          const st = ST[s.status]||ST.Belum;
          const isLast = i===entry.steps.length-1;
          return(
            <div key={i} style={{display:"flex",gap:14,padding:"12px 16px",borderBottom:isLast?"none":"1px solid "+C.line}}>
              {/* Timeline dot */}
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",flexShrink:0}}>
                <div style={{width:22,height:22,borderRadius:"50%",background:st.l,border:"1.5px solid "+st.dot,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:st.dot,fontWeight:800}}>{i+1}</div>
                {!isLast&&<div style={{width:1,flex:1,background:C.line,margin:"3px 0"}}/>}
              </div>
              <div style={{flex:1,minWidth:0,paddingBottom:isLast?0:8}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
                  <span style={{fontSize:12,fontWeight:600,color:s.status==="Selesai"?C.light:C.soft,lineHeight:1.4}}>{s.nama}</span>
                  <StatusChip st={s.status}/>
                </div>
                {s.tanggal&&<div style={{fontSize:10,color:C.green,fontWeight:600,marginTop:4}}>📅 {s.tanggal}</div>}
                {s.keterangan&&<div style={{fontSize:11,color:C.muted,marginTop:3}}>{s.keterangan}</div>}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{padding:"16px 16px calc(16px + env(safe-area-inset-bottom))",display:"flex",gap:10}}>
        <button className="btn-ghost" onClick={onClose} style={{flex:1}}>Tutup</button>
        <button className="btn-primary" onClick={onEdit} style={{flex:2}}>✏️ Edit Data</button>
      </div>
    </Sheet>
  );
}

/* ══════════════════════════════════════════════════
   EDIT SHEET
══════════════════════════════════════════════════ */
function EditSheet({entry, onSave, onClose}){
  const [f,setF]=useState(JSON.parse(JSON.stringify(entry)));
  const [saving,setSaving]=useState(false);
  const ks=KS[f.kategori];
  const ss=(i,k,v)=>setF(p=>{const s=[...p.steps];s[i]={...s[i],[k]:v};return{...p,steps:s};});

  async function handleSave(){
    setSaving(true);
    try{
      await supabase.from("entries").update({produk:f.produk,link_produk:f.link_produk,updated_at:new Date().toISOString()}).eq("id",f.id);
      for(const step of f.steps){
        await supabase.from("steps").update({status:step.status,tanggal:step.tanggal,keterangan:step.keterangan}).eq("id",step.id);
      }
      onSave(f);onClose();
    }catch(err){alert("Gagal: "+err.message);}
    finally{setSaving(false);}
  }

  return(
    <Sheet onClose={onClose} title={"Edit"} subtitle={f.nama}>
      <div style={{padding:"16px",display:"flex",flexDirection:"column",gap:12}}>

        <div>
          <div className="label" style={{marginBottom:6}}>Produk Hukum</div>
          <input value={f.produk} onChange={e=>setF(p=>({...p,produk:e.target.value}))} className="field" placeholder="cth: Perpres No 40 Tahun 2022"/>
        </div>

        <div>
          <div className="label" style={{marginBottom:6}}>Link Google Drive (PDF)</div>
          <input value={f.link_produk} onChange={e=>setF(p=>({...p,link_produk:e.target.value}))} className="field" placeholder="https://drive.google.com/file/d/..."/>
        </div>

        <div className="label" style={{marginTop:4}}>Tahapan</div>

        {f.steps.map((step,i)=>(
          <div key={i} className="card" style={{padding:"14px 16px",borderRadius:12}}>
            <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:12}}>
              <div style={{width:22,height:22,borderRadius:"50%",background:ks.l,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:ks.c,flexShrink:0}}>{i+1}</div>
              <div style={{fontSize:12,fontWeight:600,color:C.light,lineHeight:1.3}}>{step.nama}</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
              <div>
                <div className="label" style={{marginBottom:5}}>Status</div>
                <select value={step.status} onChange={e=>ss(i,"status",e.target.value)} className="field" style={{fontSize:13}}>
                  {["Belum","Proses","Selesai"].map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <div className="label" style={{marginBottom:5}}>Tanggal</div>
                <input value={step.tanggal} onChange={e=>ss(i,"tanggal",e.target.value)} className="field" placeholder="15 Mei 2023" style={{fontSize:13}}/>
              </div>
            </div>
            <div className="label" style={{marginBottom:5}}>Keterangan</div>
            <input value={step.keterangan} onChange={e=>ss(i,"keterangan",e.target.value)} className="field" placeholder="Keterangan..." style={{fontSize:13}}/>
          </div>
        ))}
      </div>
      <div style={{padding:"12px 16px calc(16px + env(safe-area-inset-bottom))",display:"flex",gap:10}}>
        <button className="btn-ghost" onClick={onClose} style={{flex:1}}>Batal</button>
        <button className="btn-primary" onClick={handleSave} style={{flex:2,opacity:saving?.7:1}}>{saving?"Menyimpan...":"Simpan"}</button>
      </div>
    </Sheet>
  );
}

/* ══════════════════════════════════════════════════
   ADD SHEET
══════════════════════════════════════════════════ */
function AddSheet({onAdd, onClose}){
  const [kat,setKat]=useState("RZ KAW");
  const [nama,setNama]=useState("");
  const [saving,setSaving]=useState(false);

  async function handleAdd(){
    if(!nama.trim()) return;
    setSaving(true);
    try{
      const {data:entry,error:eErr}=await supabase.from("entries").insert({nama:nama.trim(),kategori:kat,produk:"",link_produk:""}).select().single();
      if(eErr) throw eErr;
      const stepsToInsert=TAHAPAN[kat].map((t,i)=>({entry_id:entry.id,urutan:i+1,nama:t,status:"Belum",tanggal:"",keterangan:""}));
      await supabase.from("steps").insert(stepsToInsert);
      onAdd({...entry,steps:stepsToInsert.map(s=>({...s,id:null}))});
      onClose();
    }catch(err){alert("Gagal: "+err.message);}
    finally{setSaving(false);}
  }

  return(
    <Sheet onClose={onClose} title="Tambah Kawasan">
      <div style={{padding:"16px",display:"flex",flexDirection:"column",gap:14}}>
        <div>
          <div className="label" style={{marginBottom:10}}>Kategori RTR</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {KATEGORI.map(k=>{
              const ks=KS[k];const on=kat===k;
              return(
                <div key={k} onClick={()=>setKat(k)}
                  style={{padding:"12px 14px",borderRadius:12,border:"1px solid "+(on?ks.c:C.line),
                    background:on?ks.l:"transparent",cursor:"pointer",transition:"all .15s"}}>
                  <div style={{fontSize:20,marginBottom:5}}>{ks.icon}</div>
                  <div style={{fontSize:11,fontWeight:800,color:on?ks.c:C.soft,letterSpacing:".03em"}}>{k}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div>
          <div className="label" style={{marginBottom:6}}>Nama Kawasan / Provinsi</div>
          <input value={nama} onChange={e=>setNama(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleAdd()} className="field" placeholder="Masukkan nama..."/>
        </div>
      </div>
      <div style={{padding:"0 16px calc(16px + env(safe-area-inset-bottom))"}}>
        <button className="btn-primary" onClick={handleAdd} style={{opacity:saving?.7:1}}>{saving?"Menambahkan...":"+ Tambah Entri"}</button>
      </div>
    </Sheet>
  );
}

/* ══════════════════════════════════════════════════
   HOME TAB
══════════════════════════════════════════════════ */
function HomeTab({data, loading, onGoStatus, onGoDb}){
  const totalDone=data.filter(d=>calcP(d)===100).length;
  const totalProses=data.filter(d=>{const p=calcP(d);return p>0&&p<100;}).length;
  const pct=data.length?Math.round(totalDone/data.length*100):0;

  // Hanya entry yang 100% (sudah Perda/Perpres), urutkan tanggal penetapan terbaru
  function getTanggalPenetapan(e){
    const last=e.steps[e.steps.length-1];
    return last?.tanggal||"";
  }
  function parseTanggal(tgl){
    if(!tgl) return 0;
    const bulan={Januari:1,Februari:2,Maret:3,April:4,Mei:5,Juni:6,Juli:7,Agustus:8,September:9,Oktober:10,November:11,Desember:12};
    const p=tgl.split(" ");
    if(p.length===3){const b=bulan[p[1]]||0;return parseInt(p[2])*10000+b*100+parseInt(p[0]);}
    return 0;
  }
  const recent=[...data]
    .filter(d=>calcP(d)===100)
    .sort((a,b)=>parseTanggal(getTanggalPenetapan(b))-parseTanggal(getTanggalPenetapan(a)))
    .slice(0,6);

  return(
    <div className="inner" style={{display:"flex",flexDirection:"column",gap:20}}>

      {/* Hero */}
      <div style={{background:C.surface,border:"1px solid "+C.line,borderRadius:18,padding:"24px",position:"relative",overflow:"hidden"}}>
        {/* decorative */}
        <div style={{position:"absolute",right:-60,top:-60,width:200,height:200,borderRadius:"50%",background:C.greenL,pointerEvents:"none"}}/>
        <div style={{position:"absolute",right:20,bottom:-80,width:160,height:160,borderRadius:"50%",background:"rgba(61,214,140,0.04)",pointerEvents:"none"}}/>

        <div style={{position:"relative"}}>
          <div className="label" style={{marginBottom:8,color:C.green}}>Sistem Informasi Monitoring</div>
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:"clamp(28px,6vw,40px)",fontWeight:800,color:C.white,lineHeight:.95,letterSpacing:"-.02em"}}>SIMPLER</div>
          <div style={{fontSize:13,color:C.soft,marginTop:6,marginBottom:20}}>Penyelesaian Penataan Ruang Laut</div>

          {/* Big progress */}
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <div style={{position:"relative",flexShrink:0}}>
              <CircProgress p={pct} color={C.green} size={80} stroke={6}/>
              <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:17,fontWeight:800,color:C.green,lineHeight:1}}>{pct}%</div>
                </div>
              </div>
            </div>
            <div>
              <div style={{fontSize:28,fontWeight:800,color:C.white,lineHeight:1}}>{totalDone}<span style={{fontSize:14,color:C.muted,fontWeight:500}}>/{data.length}</span></div>
              <div style={{fontSize:12,color:C.soft,marginTop:3}}>entri telah ditetapkan</div>
              <div style={{display:"flex",gap:12,marginTop:8}}>
                <span style={{fontSize:11,color:C.amber,fontWeight:700}}>⏳ {totalProses} proses</span>
                <span style={{fontSize:11,color:C.muted,fontWeight:700}}>○ {data.length-totalDone-totalProses} belum</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Per kategori */}
      <div>
        <div className="sec-hdr">
          <div className="label">Progress per Kategori</div>
        </div>
        <div className="card">
          {loading?<Spinner/>:KATEGORI.map((k,i)=>{
            const ks=KS[k];
            const es=data.filter(d=>d.kategori===k);
            const done=es.filter(d=>calcP(d)===100).length;
            const p=es.length?Math.round(done/es.length*100):0;
            return(
              <div key={k} onClick={()=>onGoStatus(k)}
                style={{padding:"14px 16px",display:"flex",alignItems:"center",gap:14,cursor:"pointer",borderBottom:i<3?"1px solid "+C.line:"none",transition:"background .12s"}}
                onMouseEnter={e=>e.currentTarget.style.background=C.surface}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <div style={{width:38,height:38,borderRadius:10,background:ks.l,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{ks.icon}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}>
                    <span style={{fontSize:13,fontWeight:700,color:C.light}}>{k}</span>
                    <span style={{fontSize:12,fontWeight:800,color:ks.c}}>{done}<span style={{color:C.muted,fontWeight:500}}>/{es.length}</span></span>
                  </div>
                  <PBar p={p} color={ks.c} h={4}/>
                </div>
                <span style={{color:C.muted,fontSize:14,flexShrink:0}}>›</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Terbaru Ditetapkan */}
      {recent.length>0&&(
        <div>
          <div className="sec-hdr">
            <div className="label">Terbaru Ditetapkan</div>
            <button onClick={onGoDb} style={{background:"none",border:"none",color:C.green,fontSize:12,fontWeight:700,cursor:"pointer"}}>Semua →</button>
          </div>
          <div className="card">
            {recent.map((e,i)=>{
              const ks=KS[e.kategori];
              const tgl=getTanggalPenetapan(e);
              return(
                <div key={e.id} style={{
                  display:"flex",alignItems:"center",gap:14,padding:"13px 16px",
                  borderBottom:i<recent.length-1?"1px solid "+C.line:"none",
                  cursor:"pointer",transition:"background .12s"
                }}
                  onMouseEnter={e=>e.currentTarget.style.background=C.surface}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  {/* rank number */}
                  <div style={{width:28,height:28,borderRadius:8,background:ks.l,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:ks.c,flexShrink:0}}>{i+1}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:700,color:C.white,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.nama}</div>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginTop:3}}>
                      <KatChip k={e.kategori}/>
                      {e.produk&&<span style={{fontSize:10,color:C.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>· {e.produk}</span>}
                    </div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    {tgl
                      ?<div style={{fontSize:10,color:C.green,fontWeight:700}}>📅 {tgl}</div>
                      :<div style={{fontSize:11,color:ks.c,fontWeight:800}}>✓ Ditetapkan</div>
                    }
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* About */}
      <div className="card" style={{padding:"16px"}}>
        <div className="label" style={{marginBottom:8}}>Tentang SIMPLER</div>
        <div style={{fontSize:13,color:C.soft,lineHeight:1.75}}>
          Dashboard monitoring progres penyelesaian perencanaan ruang laut oleh <strong style={{color:C.light}}>Deputi Bidang Koordinasi Sumber Daya Maritim</strong>, Kemenko Bidang Kemaritiman dan Investasi.
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:12}}>
          {KATEGORI.map(k=><KatChip key={k} k={k}/>)}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   STATUS TAB
══════════════════════════════════════════════════ */
function StatusTab({data, loading, initKat}){
  const [kat,setKat]=useState(initKat||null);
  const [detail,setDetail]=useState(null);
  const [editing,setEditing]=useState(null);
  const [localData,setLocalData]=useState(null);
  const displayData=localData||data;
  useEffect(()=>{setKat(initKat||null);},[initKat]);

  if(!kat) return(
    <div className="inner" style={{display:"flex",flexDirection:"column",gap:16}}>
      {/* Summary card */}
      <div className="card" style={{padding:"16px"}}>
        <div className="label" style={{marginBottom:14}}>Progres Nasional</div>
        {loading?<Spinner/>:[
          {k:"RTRWN",label:"PP RTRWN",max:1},
          {k:"RTR KSN",label:"Perpres RTR KSN",max:28},
          {k:"RZ KAW",label:"Perpres RZ KAW",max:20},
          {k:"RTRWP",label:"Perda RTRWP",max:38},
        ].map(({k,label,max})=>{
          const ks=KS[k];
          const done=displayData.filter(d=>d.kategori===k&&calcP(d)===100).length;
          const p=Math.round(done/max*100);
          return(
            <div key={k} style={{marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <span style={{fontSize:12,fontWeight:600,color:C.light}}>{label}</span>
                <span style={{fontSize:12,fontWeight:700,color:ks.c}}>{done}<span style={{color:C.muted,fontWeight:400}}>/{max}</span></span>
              </div>
              <PBar p={p} color={ks.c} h={5}/>
            </div>
          );
        })}
      </div>

      <div className="label">Pilih Kategori</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {KATEGORI.map(k=>{
          const ks=KS[k];
          const es=displayData.filter(d=>d.kategori===k);
          const done=es.filter(d=>calcP(d)===100).length;
          const p=es.length?Math.round(done/es.length*100):0;
          return(
            <div key={k} className="card card-hover" onClick={()=>setKat(k)} style={{padding:"18px 16px"}}>
              <div style={{fontSize:32,marginBottom:10}}>{ks.icon}</div>
              <KatChip k={k}/>
              <div style={{marginTop:12}}>
                <div style={{fontFamily:"'Syne',sans-serif",fontSize:26,fontWeight:800,color:ks.c,lineHeight:1}}>{done}<span style={{fontSize:13,color:C.muted,fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:500}}>/{es.length}</span></div>
                <div style={{marginTop:8}}><PBar p={p} color={ks.c} h={4}/></div>
                <div style={{marginTop:6}}><StepDots steps={es.flatMap(e=>e.steps).slice(0,8)} color={ks.c}/></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const entries=displayData.filter(d=>d.kategori===kat);
  const ks=KS[kat];
  const done=entries.filter(e=>calcP(e)===100).length;

  return(
    <div className="inner" style={{display:"flex",flexDirection:"column",gap:12}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <button className="btn-icon" onClick={()=>setKat(null)} style={{fontSize:18}}>←</button>
        <div style={{flex:1}}>
          <KatChip k={kat} size="lg"/>
          <div style={{fontSize:11,color:C.muted,marginTop:3}}>{done}/{entries.length} ditetapkan</div>
        </div>
      </div>
      {loading?<Spinner/>:entries.map(e=>{
        const p=calcP(e);
        const next=e.steps.find(s=>s.status!=="Selesai");
        return(
          <div key={e.id} className="entry-card" onClick={()=>setDetail(e)}>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12,marginBottom:12}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:15,fontWeight:800,color:C.white,lineHeight:1.3}}>{e.nama}</div>
                {e.produk&&<div style={{fontSize:10,color:ks.c,fontWeight:600,marginTop:4}}>📎 {e.produk}</div>}
              </div>
              <div style={{position:"relative",flexShrink:0}}>
                <CircProgress p={p} color={ks.c} size={44} stroke={3.5}/>
                <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <span style={{fontSize:9,fontWeight:800,color:p===100?ks.c:C.soft}}>{p}%</span>
                </div>
              </div>
            </div>
            <StepDots steps={e.steps} color={ks.c}/>
            {next&&(
              <div style={{marginTop:8,fontSize:10,color:C.muted}}>
                ⏭ <span style={{color:C.soft}}>{next.nama}</span>
              </div>
            )}
          </div>
        );
      })}
      {detail&&<DetailSheet entry={detail} onEdit={()=>{setEditing(detail);setDetail(null);}} onClose={()=>setDetail(null)}/>}
      {editing&&<EditSheet entry={editing} onSave={u=>{setLocalData(p=>(p||displayData).map(e=>e.id===u.id?u:e));}} onClose={()=>setEditing(null)}/>}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   PRODUK TAB
══════════════════════════════════════════════════ */
function ProdukTab({data, loading}){
  const [q,setQ]=useState("");
  const items=data.filter(d=>d.produk&&(d.nama.toLowerCase().includes(q.toLowerCase())||d.produk.toLowerCase().includes(q.toLowerCase())));
  return(
    <div className="inner" style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{position:"relative"}}>
        <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:14,color:C.muted}}>⌕</span>
        <input value={q} onChange={e=>setQ(e.target.value)} className="field" placeholder="Cari produk hukum..." style={{paddingLeft:36}}/>
      </div>

      {/* Summary */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {KATEGORI.map(k=>{
          const ks=KS[k];
          const cnt=data.filter(d=>d.kategori===k&&d.produk).length;
          return(
            <div key={k} style={{background:C.card,border:"1px solid "+C.line,borderRadius:12,padding:"12px 14px",display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:32,height:32,borderRadius:8,background:ks.l,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{ks.icon}</div>
              <div>
                <div style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:800,color:ks.c,lineHeight:1}}>{cnt}</div>
                <div style={{fontSize:9,color:C.muted,fontWeight:700,letterSpacing:".06em"}}>{k}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="label">Daftar Produk</div>
      <div className="card">
        {loading?<Spinner/>:items.length===0?<Empty icon="📄" text="Tidak ada produk"/>:
          items.map((d,i)=>{
            const ks=KS[d.kategori];
            return(
              <div key={d.id} className="t-row" onClick={()=>d.link_produk&&window.open(d.link_produk,"_blank")} style={{cursor:d.link_produk?"pointer":"default"}}>
                <div style={{width:36,height:36,borderRadius:8,background:ks.l,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{ks.icon}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:700,color:C.white,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.nama}</div>
                  <div style={{fontSize:11,color:ks.c,fontWeight:600,marginTop:2}}>{d.produk}</div>
                </div>
                {d.link_produk
                  ?<span style={{fontSize:11,color:C.blue,fontWeight:700,flexShrink:0}}>Buka ↗</span>
                  :<span style={{color:C.muted,fontSize:14}}>›</span>
                }
              </div>
            );
          })
        }
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   DASAR HUKUM TAB — dari Supabase
══════════════════════════════════════════════════ */
function EditHukumSheet({item, onSave, onClose}){
  const [f,setF]=useState({...item});
  const [saving,setSaving]=useState(false);
  async function handleSave(){
    setSaving(true);
    try{
      await supabase.from("hukum").update({nama:f.nama,tentang:f.tentang,ikon:f.ikon,link:f.link}).eq("id",f.id);
      onSave(f);onClose();
    }catch(err){alert("Gagal: "+err.message);}
    finally{setSaving(false);}
  }
  return(
    <Sheet onClose={onClose} title="Edit Dasar Hukum">
      <div style={{padding:"16px",display:"flex",flexDirection:"column",gap:12}}>
        <div><div className="label" style={{marginBottom:6}}>Nama Peraturan</div><input value={f.nama} onChange={e=>setF(p=>({...p,nama:e.target.value}))} className="field"/></div>
        <div><div className="label" style={{marginBottom:6}}>Tentang</div><input value={f.tentang} onChange={e=>setF(p=>({...p,tentang:e.target.value}))} className="field"/></div>
        <div><div className="label" style={{marginBottom:6}}>Ikon</div><input value={f.ikon} onChange={e=>setF(p=>({...p,ikon:e.target.value}))} className="field" style={{maxWidth:80}}/></div>
        <div><div className="label" style={{marginBottom:6}}>Link Google Drive (PDF)</div><input value={f.link} onChange={e=>setF(p=>({...p,link:e.target.value}))} className="field" placeholder="https://drive.google.com/file/d/..."/></div>
      </div>
      <div style={{padding:"0 16px calc(16px + env(safe-area-inset-bottom))",display:"flex",gap:10}}>
        <button className="btn-ghost" onClick={onClose} style={{flex:1}}>Batal</button>
        <button className="btn-primary" onClick={handleSave} style={{flex:2,opacity:saving?.7:1}}>{saving?"Menyimpan...":"Simpan"}</button>
      </div>
    </Sheet>
  );
}

function HukumTab(){
  const [q,setQ]=useState("");
  const [hukum,setHukum]=useState([]);
  const [loading,setLoading]=useState(true);
  const [editing,setEditing]=useState(null);

  useEffect(()=>{
    async function fetch(){
      const {data}=await supabase.from("hukum").select("*").order("id");
      if(data) setHukum(data);
      setLoading(false);
    }
    fetch();
  },[]);

  const fl=hukum.filter(d=>d.nama.toLowerCase().includes(q.toLowerCase())||d.tentang.toLowerCase().includes(q.toLowerCase()));

  return(
    <div className="inner" style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{position:"relative"}}>
        <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:14,color:C.muted}}>⌕</span>
        <input value={q} onChange={e=>setQ(e.target.value)} className="field" placeholder="Cari peraturan..." style={{paddingLeft:36}}/>
      </div>
      <div className="card">
        {loading?<Spinner/>:fl.length===0?<Empty icon="⚖️" text="Tidak ditemukan"/>:
          fl.map((d,i)=>(
            <div key={d.id} className="t-row"
              onClick={()=>d.link?window.open(d.link,"_blank"):null}
              style={{cursor:d.link?"pointer":"default"}}>
              <div style={{width:36,height:36,borderRadius:8,background:C.blueL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{d.ikon||"📄"}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:700,color:C.white}}>{d.nama}</div>
                <div style={{fontSize:11,color:C.muted,marginTop:2,lineHeight:1.4}}>{d.tentang}</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                {d.link?<span style={{fontSize:11,color:C.blue,fontWeight:700}}>Buka ↗</span>:<span style={{color:C.muted,fontSize:14}}>›</span>}
                <button onClick={e=>{e.stopPropagation();setEditing(d);}}
                  style={{background:C.surface,border:"1px solid "+C.line,borderRadius:7,padding:"4px 8px",fontSize:10,cursor:"pointer",color:C.soft,fontWeight:700}}>Edit</button>
              </div>
            </div>
          ))
        }
      </div>
      {editing&&<EditHukumSheet item={editing} onSave={u=>setHukum(p=>p.map(h=>h.id===u.id?u:h))} onClose={()=>setEditing(null)}/>}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   MAIN APP
══════════════════════════════════════════════════ */
export default function App(){
  const [data,setData]=useState([]);
  const [loading,setLoading]=useState(true);
  const [tab,setTab]=useState("home");
  const [statusKat,setStatusKat]=useState(null);
  const [showDb,setShowDb]=useState(false);
  const [detail,setDetail]=useState(null);
  const [editing,setEditing]=useState(null);
  const [adding,setAdding]=useState(false);
  const [dbSearch,setDbSearch]=useState("");
  const [dbKat,setDbKat]=useState("Semua");
  const [dbSt,setDbSt]=useState("Semua");

  const fetchData=useCallback(async()=>{
    setLoading(true);
    try{
      const {data:entries,error:eErr}=await supabase.from("entries").select("*").order("nama");
      if(eErr) throw eErr;
      const {data:steps,error:sErr}=await supabase.from("steps").select("*").order("urutan");
      if(sErr) throw sErr;
      setData(entries.map(e=>formatEntry(e,steps)));
    }catch(err){console.error(err);}
    finally{setLoading(false);}
  },[]);

  useEffect(()=>{fetchData();},[fetchData]);

  function updateEntry(u){setData(p=>p.map(e=>e.id===u.id?u:e));}
  function addEntry(n){setData(p=>[...p,n]);fetchData();}

  const filteredDb=useMemo(()=>data.filter(d=>{
    const mq=d.nama.toLowerCase().includes(dbSearch.toLowerCase())||d.kategori.toLowerCase().includes(dbSearch.toLowerCase());
    const mk=dbKat==="Semua"||d.kategori===dbKat;
    const p=calcP(d);
    const ms=dbSt==="Semua"||(dbSt==="Selesai"&&p===100)||(dbSt==="Proses"&&p>0&&p<100)||(dbSt==="Belum"&&p===0);
    return mq&&mk&&ms;
  }),[data,dbSearch,dbKat,dbSt]);

  // DASHBOARD VIEW
  if(showDb) return(
    <>
      <GS/>
      <AppShell title="Dashboard" hideNav onBack={()=>setShowDb(false)}
        rightBtn={
          <div style={{display:"flex",gap:8}}>
            <button className="btn-icon" onClick={()=>exportCSV(data)} title="Export CSV" style={{fontSize:14}}>↓ CSV</button>
            <button onClick={()=>setAdding(true)}
              style={{height:36,padding:"0 14px",background:C.green,color:C.bg,border:"none",borderRadius:10,fontSize:13,fontWeight:800,cursor:"pointer"}}>+ Tambah</button>
          </div>
        }>
        {/* Search + Filter */}
        <div style={{background:C.bg,borderBottom:"1px solid "+C.line,padding:"12px 16px",position:"sticky",top:52,zIndex:30}}>
          <div style={{position:"relative",marginBottom:10}}>
            <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:14,color:C.muted}}>⌕</span>
            <input value={dbSearch} onChange={e=>setDbSearch(e.target.value)} className="field" placeholder="Cari kawasan..." style={{paddingLeft:36}}/>
          </div>
          <div className="scroll-x" style={{marginBottom:8}}>
            {["Semua",...KATEGORI].map(k=>{
              const on=dbKat===k;const ks=KS[k];
              return <button key={k} className={"pill"+(on?" on":"")} onClick={()=>setDbKat(k)}
                style={on&&ks?{background:ks.c,borderColor:ks.c,color:C.bg}:{}}>{k}</button>;
            })}
          </div>
          <div className="scroll-x">
            {["Semua","✓ Selesai","◑ Proses","○ Belum"].map((s,i)=>{
              const val=["Semua","Selesai","Proses","Belum"][i];
              const on=dbSt===val;
              return <button key={val} className={"pill"+(on?" on":"")} onClick={()=>setDbSt(val)}>{s}</button>;
            })}
            <span style={{marginLeft:6,fontSize:11,color:C.muted,alignSelf:"center",whiteSpace:"nowrap",fontWeight:600}}>{filteredDb.length} entri</span>
          </div>
        </div>

        {/* Grid */}
        <div className="inner">
          {loading?<Spinner/>:(
            <div className="card-grid">
              {filteredDb.map(e=>{
                const p=calcP(e);const ks=KS[e.kategori];
                const next=e.steps.find(s=>s.status!=="Selesai");
                return(
                  <div key={e.id} className="entry-card" onClick={()=>setDetail(e)}>
                    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10,marginBottom:10}}>
                      <div style={{flex:1,minWidth:0}}>
                        <KatChip k={e.kategori}/>
                        <div style={{fontSize:14,fontWeight:800,color:C.white,marginTop:6,lineHeight:1.3}}>{e.nama}</div>
                      </div>
                      <div style={{position:"relative",flexShrink:0}}>
                        <CircProgress p={p} color={ks.c} size={40} stroke={3}/>
                        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                          <span style={{fontSize:8,fontWeight:800,color:p===100?ks.c:C.soft}}>{p}%</span>
                        </div>
                      </div>
                    </div>
                    <StepDots steps={e.steps} color={ks.c}/>
                    {next&&<div style={{marginTop:6,fontSize:10,color:C.muted}}>⏭ {next.nama}</div>}
                  </div>
                );
              })}
              {filteredDb.length===0&&!loading&&(
                <div style={{gridColumn:"1/-1"}}><Empty/></div>
              )}
            </div>
          )}
        </div>
        {detail&&!editing&&<DetailSheet entry={detail} onEdit={()=>{setEditing(detail);setDetail(null);}} onClose={()=>setDetail(null)}/>}
        {editing&&<EditSheet entry={editing} onSave={updateEntry} onClose={()=>setEditing(null)}/>}
        {adding&&<AddSheet onAdd={addEntry} onClose={()=>setAdding(false)}/>}
      </AppShell>
    </>
  );

  const titles={home:"SIMPLER",status:"Status RTR",produk:"Produk Hukum",hukum:"Dasar Hukum"};
  return(
    <>
      <GS/>
      <AppShell title={titles[tab]} tab={tab} onTab={t=>{setTab(t);setStatusKat(null);}}
        rightBtn={<button className="btn-icon" onClick={()=>setShowDb(true)} style={{fontSize:16}}>⚙</button>}>
        {tab==="home"&&<HomeTab data={data} loading={loading} onGoStatus={k=>{setStatusKat(k);setTab("status");}} onGoDb={()=>setShowDb(true)}/>}
        {tab==="status"&&<StatusTab data={data} loading={loading} initKat={statusKat}/>}
        {tab==="produk"&&<ProdukTab data={data} loading={loading}/>}
        {tab==="hukum"&&<HukumTab/>}
      </AppShell>
    </>
  );
}