"use client";
import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";

/* ══════════════════════════════════════════════════
   DESIGN TOKENS — Color Palette #04
   #95B1EE (biru muda) · #FFFDF5 (putih krem) · #E7F1A8 (hijau muda) · #364C84 (biru tua)
══════════════════════════════════════════════════ */
const C = {
  // Backgrounds — lebih gelap supaya card putih kontras
  bg:       "#E8EDF5",   // biru abu muda — cukup beda dari putih
  bg2:      "#DDE4F0",
  bg3:      "#D0DAF0",
  surface:  "#FFFFFF",
  surface2: "#F4F6FC",
  card:     "#FFFFFF",

  // Borders — lebih tegas
  line:     "rgba(54,76,132,0.18)",
  line2:    "rgba(54,76,132,0.32)",

  // Text — berbasis biru tua
  white:    "#FFFFFF",
  light:    "#364C84",
  soft:     "#5A6E9E",
  muted:    "#8A98BA",

  // Accent utama — biru tua
  blue:     "#364C84",
  blueD:    "#253660",
  blueL:    "rgba(54,76,132,0.1)",
  blueM:    "rgba(54,76,132,0.18)",

  // Biru muda
  sky:      "#95B1EE",
  skyL:     "rgba(149,177,238,0.2)",
  skyM:     "rgba(149,177,238,0.35)",

  // Hijau muda
  lime:     "#5A7A1A",
  limeL:    "rgba(231,241,168,0.7)",
  limeB:    "#E7F1A8",

  // Status
  amber:    "#8A6200",
  amberL:   "rgba(200,160,0,0.15)",
  rose:     "#B03020",
  roseL:    "rgba(176,48,32,0.1)",
  violet:   "#5B4A9E",
  violetL:  "rgba(91,74,158,0.12)",

  // Kategori
  teal:     "#364C84",
  tealL:    "rgba(149,177,238,0.25)",
  gold:     "#6A5510",
  goldL:    "rgba(231,241,168,0.6)",
};

const KS = {
  "RZ KAW":  { c:"#364C84", l:"rgba(149,177,238,0.2)", icon:"🌊", label:"Rencana Zonasi Kawasan Antarwilayah" },
  "RTR KSN": { c:"#5B4A9E", l:"rgba(149,177,238,0.15)", icon:"📍", label:"RTR Kawasan Strategis Nasional" },
  "RTRWP":   { c:"#1E6B5A", l:"rgba(231,241,168,0.5)", icon:"🏛️", label:"RTR Wilayah Provinsi" },
  "RTRWN":   { c:"#253660", l:"rgba(54,76,132,0.12)", icon:"🗺️", label:"RTR Wilayah Nasional" },
};

const ST = {
  Selesai: { c:"#2D7A3A", l:"rgba(231,241,168,0.6)", dot:"#7BA02A", ic:"✓" },
  Proses:  { c:"#8A6500", l:"rgba(255,200,80,0.15)", dot:"#C8A000", ic:"◑" },
  Belum:   { c:"#8A98BA", l:"rgba(54,76,132,0.06)", dot:"#B0BАДА", ic:"○" },
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

    .fade-in{animation:fadeIn .3s ease both;}
    .slide-up{animation:slideUp .4s cubic-bezier(.16,1,.3,1) both;}

    /* ── LAYOUT ── */
    .app-wrap{min-height:100vh;background:${C.bg};display:flex;flex-direction:column;}

    /* ── TOPBAR ── */
    .topbar{
      height:52px;padding:0 16px;
      display:flex;align-items:center;justify-content:space-between;
      border-bottom:1px solid ${C.line};
      background:rgba(232,237,245,0.97);
      position:sticky;top:0;z-index:40;
      backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
    }
    @media(min-width:640px){.topbar{padding:0 24px;height:56px;}}

    /* ── NAV BAR ── */
    .nav-bar{
      position:fixed;bottom:0;left:0;right:0;
      background:rgba(232,237,245,0.97);
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
    .nav-item.on{background:${C.skyL};}
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
      overflow:hidden;box-shadow:0 2px 8px rgba(54,76,132,0.1),0 1px 2px rgba(54,76,132,0.08);
    }
    .card-hover{cursor:pointer;transition:border-color .15s,box-shadow .15s;-webkit-tap-highlight-color:transparent;}
    .card-hover:hover{border-color:${C.sky};box-shadow:0 4px 16px rgba(54,76,132,0.15);}
    .card-hover:active{background:${C.surface2};}

    /* ── ENTRY CARD ── */
    .entry-card{
      background:${C.card};border:1px solid ${C.line};border-radius:14px;
      padding:16px;cursor:pointer;
      box-shadow:0 2px 8px rgba(54,76,132,0.1),0 1px 2px rgba(54,76,132,0.08);
      transition:border-color .15s,box-shadow .15s,transform .15s;
      -webkit-tap-highlight-color:transparent;
    }
    .entry-card:hover{border-color:${C.sky};box-shadow:0 4px 16px rgba(54,76,132,0.15);}
    .entry-card:active{transform:scale(.99);}

    /* ── SHEET ── */
    .sheet{
      position:fixed;bottom:0;left:0;right:0;
      background:#FFFFFF;border-top:1.5px solid ${C.line2};
      border-radius:20px 20px 0 0;
      max-height:92vh;display:flex;flex-direction:column;
      box-shadow:0 -8px 40px rgba(54,76,132,0.2);
      animation:sheetUp .3s cubic-bezier(.16,1,.3,1) both;
      z-index:100;
    }
    .sheet-handle{width:32px;height:3px;border-radius:2px;background:${C.line2};margin:10px auto 0;flex-shrink:0;}
    .sheet-scroll{overflow-y:auto;flex:1;}
    .overlay{position:fixed;inset:0;background:rgba(36,56,100,0.35);z-index:99;animation:fadeIn .2s ease;}

    /* ── PROGRESS BAR ── */
    .pbar-wrap{position:relative;height:6px;background:${C.line};border-radius:99px;overflow:hidden;}
    .pbar-fill{height:100%;border-radius:99px;transition:width .8s cubic-bezier(.4,0,.2,1);}

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
      background:#FFFFFF;border:1.5px solid ${C.line};border-radius:10px;
      font-size:15px;color:${C.light};outline:none;
      transition:border-color .15s;-webkit-appearance:none;
    }
    .field:focus{border-color:${C.sky};box-shadow:0 0 0 3px rgba(149,177,238,0.2);}
    .field::placeholder{color:${C.muted};}
    select.field{cursor:pointer;}

    /* ── BUTTONS ── */
    .btn-primary{
      display:flex;align-items:center;justify-content:center;gap:8px;
      width:100%;padding:13px;border:none;border-radius:12px;
      background:${C.blue};color:#FFFDF5;font-size:14px;font-weight:800;
      cursor:pointer;transition:all .15s;-webkit-tap-highlight-color:transparent;
    }
    .btn-primary:hover{background:${C.blueD};}
    .btn-primary:active{opacity:.85;transform:scale(.99);}
    .btn-ghost{
      display:flex;align-items:center;justify-content:center;gap:8px;
      padding:12px 20px;border:1.5px solid ${C.line2};border-radius:12px;
      background:transparent;color:${C.soft};font-size:14px;font-weight:600;
      cursor:pointer;-webkit-tap-highlight-color:transparent;transition:all .15s;
    }
    .btn-ghost:hover{border-color:${C.sky};color:${C.blue};}
    .btn-icon{
      display:flex;align-items:center;justify-content:center;
      width:36px;height:36px;border-radius:10px;border:none;
      background:${C.bg2};cursor:pointer;font-size:16px;
      -webkit-tap-highlight-color:transparent;transition:background .12s;
      color:${C.soft};
    }
    .btn-icon:hover{background:${C.skyL};}

    /* ── PILL FILTER ── */
    .pill{
      padding:7px 14px;border-radius:99px;font-size:11px;font-weight:700;
      border:1.5px solid ${C.line};background:${C.surface};color:${C.soft};
      cursor:pointer;white-space:nowrap;transition:all .15s;letter-spacing:.03em;
      -webkit-tap-highlight-color:transparent;
    }
    .pill.on{background:${C.blue};border-color:${C.blue};color:#FFFDF5;}
    .pill:hover:not(.on){border-color:${C.sky};color:${C.blue};}

    /* ── DIVIDER ── */
    .divider{height:1px;background:${C.line};margin:0;}

    /* ── TABLE ROW ── */
    .t-row{
      display:flex;align-items:center;gap:14px;padding:14px 16px;
      cursor:pointer;transition:background .12s;
      -webkit-tap-highlight-color:transparent;
    }
    .t-row:hover{background:${C.bg2};}
    .t-row+.t-row{border-top:1px solid ${C.line};}

    /* ── SPINNER ── */
    .spinner{width:24px;height:24px;border:2px solid ${C.line};border-top-color:${C.sky};border-radius:50%;animation:spin .7s linear infinite;}

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
              {title&&<div style={{fontSize:17,fontWeight:800,color:C.light}}>{title}</div>}
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
            <div className="nav-icon" style={{color:on?C.blue:C.muted,fontFamily:"monospace",fontWeight:700,fontSize:18}}>{n.icon}</div>
            <span className="nav-label" style={{color:on?C.blue:C.muted}}>{n.label}</span>
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
            <button className="btn-icon" onClick={onBack} style={{fontSize:18,color:C.blue,background:C.blueL}}>←</button>
          )}
          <span style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:800,color:C.blue,letterSpacing:".02em"}}>{title}</span>
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
        <div style={{fontSize:22,fontWeight:800,color:C.light,marginTop:10,lineHeight:1.2}}>{entry.nama}</div>

        {/* Circular progress + stats */}
        <div style={{display:"flex",alignItems:"center",gap:20,marginTop:16}}>
          <div style={{position:"relative",flexShrink:0}}>
            <CircProgress p={p} color={ks.c} size={72} stroke={5}/>
            <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{fontSize:15,fontWeight:800,color:ks.c}}>{p}%</span>
            </div>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:24,fontWeight:800,color:C.light,lineHeight:1}}>{done}<span style={{fontSize:13,color:C.muted,fontWeight:500}}>/{entry.steps.length} tahap</span></div>
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
function ProductCarousel({data}){
  const [idx,setIdx]=useState(0);
  const ref=useRef(null);

  // Semua produk yang sudah ditetapkan, urutkan terbaru
  function parseTgl(tgl){
    if(!tgl) return 0;
    const b={Januari:1,Februari:2,Maret:3,April:4,Mei:5,Juni:6,Juli:7,Agustus:8,September:9,Oktober:10,November:11,Desember:12};
    const p=tgl.split(" ");
    if(p.length===3){return parseInt(p[2])*10000+(b[p[1]]||0)*100+parseInt(p[0]);}
    return 0;
  }
  const produk=[...data]
    .filter(d=>d.produk&&calcP(d)===100)
    .sort((a,b)=>{
      const ta=a.steps[a.steps.length-1]?.tanggal||"";
      const tb=b.steps[b.steps.length-1]?.tanggal||"";
      return parseTgl(tb)-parseTgl(ta);
    });

  if(produk.length===0) return null;

  function scrollTo(i){
    setIdx(i);
    if(ref.current){
      const card=ref.current.children[i];
      if(card) card.scrollIntoView({behavior:"smooth",block:"nearest",inline:"center"});
    }
  }

  function handleScroll(){
    if(!ref.current) return;
    const {scrollLeft,offsetWidth}=ref.current;
    const cardW=ref.current.children[0]?.offsetWidth+12||200;
    const newIdx=Math.round(scrollLeft/cardW);
    setIdx(Math.min(newIdx,produk.length-1));
  }

  return(
    <div>
      <div className="sec-hdr" style={{marginBottom:12}}>
        <div className="label">Produk Terbaru</div>
        <div style={{fontSize:11,color:C.muted,fontWeight:600}}>{idx+1}/{produk.length}</div>
      </div>

      {/* Carousel scroll */}
      <div ref={ref} onScroll={handleScroll}
        style={{display:"flex",gap:12,overflowX:"auto",scrollSnapType:"x mandatory",paddingBottom:4,WebkitOverflowScrolling:"touch"}}
        className="scroll-x">
        {produk.map((e,i)=>{
          const ks=KS[e.kategori];
          const tgl=e.steps[e.steps.length-1]?.tanggal||"";
          return(
            <div key={e.id}
              onClick={()=>e.link_produk&&window.open(e.link_produk,"_blank")}
              style={{
                flexShrink:0,
                width:"calc(85vw - 32px)",
                maxWidth:320,
                background:"linear-gradient(135deg,"+ks.c+"22 0%,"+ks.c+"08 100%)",
                border:"1.5px solid "+ks.c+"40",
                borderRadius:16,
                padding:"18px 16px",
                scrollSnapAlign:"start",
                cursor:e.link_produk?"pointer":"default",
                transition:"transform .15s",
              }}>
              {/* Kategori chip + nomor */}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                <KatChip k={e.kategori} size="lg"/>
                <div style={{width:28,height:28,borderRadius:8,background:ks.c+"20",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:ks.c}}>{i+1}</div>
              </div>

              {/* Nama kawasan */}
              <div style={{fontSize:15,fontWeight:800,color:C.light,lineHeight:1.3,marginBottom:8}}>{e.nama}</div>

              {/* Produk */}
              <div style={{display:"flex",alignItems:"center",gap:6,padding:"8px 10px",background:"#fff",borderRadius:8,marginBottom:10}}>
                <span style={{fontSize:14}}>📎</span>
                <span style={{fontSize:12,fontWeight:700,color:ks.c,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.produk}</span>
                {e.link_produk&&<span style={{fontSize:10,color:C.blue,fontWeight:700,flexShrink:0}}>Buka ↗</span>}
              </div>

              {/* Tanggal */}
              {tgl&&(
                <div style={{fontSize:10,color:ks.c,fontWeight:700}}>📅 {tgl}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Dot indicators */}
      <div style={{display:"flex",gap:5,justifyContent:"center",marginTop:10}}>
        {produk.map((_,i)=>(
          <div key={i} onClick={()=>scrollTo(i)}
            style={{width:i===idx?20:6,height:6,borderRadius:99,background:i===idx?C.blue:C.line2,transition:"all .3s ease",cursor:"pointer"}}/>
        ))}
      </div>
    </div>
  );
}

function HomeTab({data, loading, onGoStatus, onGoDb}){
  const totalDone=data.filter(d=>calcP(d)===100).length;
  const totalProses=data.filter(d=>{const p=calcP(d);return p>0&&p<100;}).length;
  const pct=data.length?Math.round(totalDone/data.length*100):0;

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
      <div style={{background:"linear-gradient(135deg,#364C84 0%,#253660 100%)",border:"none",borderRadius:18,padding:"24px",position:"relative",overflow:"hidden"}}>
        {/* decorative */}
        <div style={{position:"absolute",right:-60,top:-60,width:200,height:200,borderRadius:"50%",background:"rgba(149,177,238,0.15)",pointerEvents:"none"}}/>
        <div style={{position:"absolute",right:20,bottom:-80,width:160,height:160,borderRadius:"50%",background:"rgba(231,241,168,0.08)",pointerEvents:"none"}}/>

        <div style={{position:"relative"}}>
          <div style={{fontSize:9,fontWeight:800,color:"rgba(231,241,168,0.8)",letterSpacing:".15em",textTransform:"uppercase",marginBottom:8}}>Sistem Informasi Monitoring</div>
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:"clamp(28px,6vw,40px)",fontWeight:800,color:"#FFFDF5",lineHeight:.95,letterSpacing:"-.02em"}}>SIMPLER</div>
          <div style={{fontSize:13,color:"rgba(149,177,238,0.85)",marginTop:6,marginBottom:20}}>Penyelesaian Penataan Ruang Laut</div>

          {/* Big progress */}
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <div style={{position:"relative",flexShrink:0}}>
              <CircProgress p={pct} color="#E7F1A8" size={80} stroke={6}/>
              <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:17,fontWeight:800,color:"#E7F1A8",lineHeight:1}}>{pct}%</div>
                </div>
              </div>
            </div>
            <div>
              <div style={{fontSize:28,fontWeight:800,color:"#FFFDF5",lineHeight:1}}>{totalDone}<span style={{fontSize:14,color:"rgba(149,177,238,0.7)",fontWeight:500}}>/{data.length}</span></div>
              <div style={{fontSize:12,color:"rgba(149,177,238,0.8)",marginTop:3}}>entri telah ditetapkan</div>
              <div style={{display:"flex",gap:12,marginTop:8}}>
                <span style={{fontSize:11,color:"#E7F1A8",fontWeight:700}}>⏳ {totalProses} proses</span>
                <span style={{fontSize:11,color:"rgba(149,177,238,0.6)",fontWeight:700}}>○ {data.length-totalDone-totalProses} belum</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Carousel Produk */}
      {!loading&&<ProductCarousel data={data}/>}

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
            <button onClick={onGoDb} style={{background:"none",border:"none",color:C.blue,fontSize:12,fontWeight:700,cursor:"pointer"}}>Semua →</button>
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
                    <div style={{fontSize:13,fontWeight:700,color:C.light,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.nama}</div>
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
      <div className="card" style={{padding:"20px"}}>
        {/* Logo + nama */}
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
          <img
            src="/simpler-logo.jpg"
            alt="SIMPLER Logo"
            style={{width:52,height:52,borderRadius:12,objectFit:"contain",background:"#fff",border:"1px solid "+C.line,flexShrink:0}}
            onError={e=>{e.target.style.display="none";}}
          />
          <div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:800,color:C.blue,lineHeight:1}}>SIMPLER</div>
            <div style={{fontSize:10,color:C.muted,marginTop:3,lineHeight:1.4}}>Sistem Informasi Monitoring<br/>Penyelesaian Penataan Ruang Laut</div>
          </div>
        </div>

        <div className="label" style={{marginBottom:8}}>Tentang SIMPLER</div>
        <div style={{fontSize:13,color:C.soft,lineHeight:1.8}}>
          SIMPLER adalah sebuah aplikasi yang berfungsi sebagai dashboard monitoring progres penyelesaian perencanaan ruang laut yang diinisiasi oleh <strong style={{color:C.light}}>Deputi Bidang Koordinasi Sumber Daya Maritim</strong>, Kementerian Koordinator Bidang Pangan.
        </div>
        <div style={{marginTop:8,fontSize:13,color:C.soft,lineHeight:1.8}}>
          Aplikasi ini memuat informasi progres penetapan <strong style={{color:C.light}}>RTRWN, RTR KSN, RZ KAW,</strong> dan <strong style={{color:C.light}}>RTRWP</strong> secara terpadu dan dapat diakses oleh publik.
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:12}}>
          {KATEGORI.map(k=><KatChip key={k} k={k}/>)}
        </div>

        {/* Instansi */}
        <div style={{marginTop:14,padding:"10px 12px",background:C.bg,borderRadius:10,display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:18}}>🏛️</span>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:C.light}}>Deputi Bidang Koordinasi Sumber Daya Maritim</div>
            <div style={{fontSize:10,color:C.muted,marginTop:1}}>Kemenko Bidang Kemaritiman dan Investasi</div>
          </div>
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
                <div style={{fontSize:15,fontWeight:800,color:C.light,lineHeight:1.3}}>{e.nama}</div>
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
                  <div style={{fontSize:12,fontWeight:700,color:C.light,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.nama}</div>
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
function AddHukumSheet({onAdd, onClose}){
  const [f,setF]=useState({nama:"",tentang:"",ikon:"📄",link:""});
  const [saving,setSaving]=useState(false);
  async function handleSave(){
    if(!f.nama.trim()) return;
    setSaving(true);
    try{
      const {data,error}=await supabase.from("hukum").insert({nama:f.nama,tentang:f.tentang,ikon:f.ikon||"📄",link:f.link}).select().single();
      if(error) throw error;
      onAdd(data);
    }catch(err){alert("Gagal: "+err.message);}
    finally{setSaving(false);}
  }
  return(
    <Sheet onClose={onClose} title="Tambah Dasar Hukum">
      <div style={{padding:"16px",display:"flex",flexDirection:"column",gap:12}}>
        <div><div className="label" style={{marginBottom:6}}>Nama Peraturan <span style={{color:C.rose}}>*</span></div><input value={f.nama} onChange={e=>setF(p=>({...p,nama:e.target.value}))} className="field" placeholder="cth: UU No. 26 Tahun 2007"/></div>
        <div><div className="label" style={{marginBottom:6}}>Tentang</div><input value={f.tentang} onChange={e=>setF(p=>({...p,tentang:e.target.value}))} className="field" placeholder="cth: Tentang Penataan Ruang"/></div>
        <div><div className="label" style={{marginBottom:6}}>Ikon (emoji)</div><input value={f.ikon} onChange={e=>setF(p=>({...p,ikon:e.target.value}))} className="field" placeholder="📄" style={{maxWidth:80}}/></div>
        <div><div className="label" style={{marginBottom:6}}>Link Google Drive (PDF)</div><input value={f.link} onChange={e=>setF(p=>({...p,link:e.target.value}))} className="field" placeholder="https://drive.google.com/file/d/..."/></div>
      </div>
      <div style={{padding:"0 16px calc(16px + env(safe-area-inset-bottom))",display:"flex",gap:10}}>
        <button className="btn-ghost" onClick={onClose} style={{flex:1}}>Batal</button>
        <button className="btn-primary" onClick={handleSave} style={{flex:2,opacity:saving?.7:1}}>{saving?"Menyimpan...":"+ Tambah"}</button>
      </div>
    </Sheet>
  );
}

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
  const [adding,setAdding]=useState(false);

  useEffect(()=>{
    async function fetchHukum(){
      const {data}=await supabase.from("hukum").select("*").order("id");
      if(data) setHukum(data);
      setLoading(false);
    }
    fetchHukum();
  },[]);

  const fl=hukum.filter(d=>d.nama.toLowerCase().includes(q.toLowerCase())||d.tentang.toLowerCase().includes(q.toLowerCase()));

  async function handleDelete(id){
    if(!confirm("Hapus peraturan ini?")) return;
    await supabase.from("hukum").delete().eq("id",id);
    setHukum(p=>p.filter(h=>h.id!==id));
  }

  return(
    <div className="inner" style={{display:"flex",flexDirection:"column",gap:14}}>
      {/* Search + tombol tambah */}
      <div style={{display:"flex",gap:8}}>
        <div style={{position:"relative",flex:1}}>
          <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:14,color:C.muted}}>⌕</span>
          <input value={q} onChange={e=>setQ(e.target.value)} className="field" placeholder="Cari peraturan..." style={{paddingLeft:36}}/>
        </div>
        <button onClick={()=>setAdding(true)}
          style={{height:46,padding:"0 16px",background:C.blue,color:"#FFFDF5",border:"none",borderRadius:10,fontSize:18,fontWeight:800,cursor:"pointer",flexShrink:0}}>+</button>
      </div>

      <div className="label">{hukum.length} peraturan</div>

      <div className="card">
        {loading?<Spinner/>:fl.length===0?<Empty icon="⚖️" text="Tidak ditemukan"/>:
          fl.map((d,i)=>(
            <div key={d.id} className="t-row"
              onClick={()=>d.link?window.open(d.link,"_blank"):null}
              style={{cursor:d.link?"pointer":"default"}}>
              <div style={{width:36,height:36,borderRadius:8,background:C.blueL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{d.ikon||"📄"}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:700,color:C.light}}>{d.nama}</div>
                <div style={{fontSize:11,color:C.muted,marginTop:2,lineHeight:1.4}}>{d.tentang}</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                {d.link&&<span style={{fontSize:11,color:C.blue,fontWeight:700}}>Buka ↗</span>}
                <button onClick={e=>{e.stopPropagation();setEditing(d);}}
                  style={{background:C.surface,border:"1px solid "+C.line,borderRadius:7,padding:"4px 8px",fontSize:10,cursor:"pointer",color:C.soft,fontWeight:700}}>Edit</button>
                <button onClick={e=>{e.stopPropagation();handleDelete(d.id);}}
                  style={{background:"transparent",border:"none",fontSize:14,cursor:"pointer",color:C.muted,padding:"4px"}}>🗑</button>
              </div>
            </div>
          ))
        }
      </div>

      {/* Add Sheet */}
      {adding&&(
        <AddHukumSheet
          onAdd={item=>{setHukum(p=>[...p,item]);setAdding(false);}}
          onClose={()=>setAdding(false)}
        />
      )}
      {editing&&<EditHukumSheet item={editing} onSave={u=>setHukum(p=>p.map(h=>h.id===u.id?u:h))} onClose={()=>setEditing(null)}/>}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   ABOUT TAB
══════════════════════════════════════════════════ */
function AboutTab(){
  const menus=[
    {icon:"📊",title:"Status RTR",desc:"Dashboard utama yang memuat informasi progres penyelesaian RTRWN, RTR KSN, RZ KAW, dan RTRWP. Pengguna dapat melihat status penyelesaian masing-masing rencana sesuai dengan tahapannya."},
    {icon:"📄",title:"Produk Hukum",desc:"Daftar Rencana Tata Ruang Laut yang telah mendapatkan penetapan baik berupa PP, Perpres, maupun Perda. Pengguna dapat mengakses file produk RTR melalui tautan yang tersedia."},
    {icon:"⚖️",title:"Dasar Hukum",desc:"Daftar peraturan perundangan yang terkait dengan perencanaan ruang laut. Pengguna dapat mengakses file peraturan melalui tautan yang tersedia pada menu ini."},
  ];
  return(
    <div className="inner" style={{display:"flex",flexDirection:"column",gap:16}}>
      <div className="card" style={{padding:"28px 20px",textAlign:"center"}}>
        <img
          src="/simpler-logo.jpg"
          alt="SIMPLER Logo"
          style={{width:80,height:80,borderRadius:16,objectFit:"contain",background:"#fff",border:"1px solid "+C.line,marginBottom:14}}
        />
        <div style={{fontFamily:"'Syne',sans-serif",fontSize:28,fontWeight:800,color:C.blue,letterSpacing:"-.01em"}}>SIMPLER</div>
        <div style={{fontSize:11,color:C.muted,marginTop:4,letterSpacing:".06em",textTransform:"uppercase",lineHeight:1.6}}>Sistem Informasi Monitoring Penyelesaian<br/>Penataan Ruang Laut</div>
        <div style={{marginTop:16,padding:"10px 16px",background:C.blueL,borderRadius:10,display:"inline-block"}}>
          <div style={{fontSize:11,color:C.blue,fontWeight:700}}>Deputi Bidang Koordinasi Sumber Daya Maritim</div>
          <div style={{fontSize:11,color:C.soft,marginTop:2}}>Kemenko Bidang Kemaritiman dan Investasi</div>
        </div>
      </div>

      <div className="card" style={{padding:"16px"}}>
        <div className="label" style={{marginBottom:10}}>Tentang Aplikasi</div>
        <div style={{fontSize:13,color:C.soft,lineHeight:1.8}}>
          SIMPLER adalah sebuah aplikasi yang berfungsi sebagai <strong style={{color:C.light}}>dashboard monitoring progres penyelesaian perencanaan ruang laut</strong> yang diinisiasi oleh Deputi Bidang Koordinasi Sumber Daya Maritim, Kementerian Koordinator Bidang Pangan.
        </div>
        <div style={{marginTop:10,fontSize:13,color:C.soft,lineHeight:1.8}}>
          Aplikasi SIMPLER terdiri dari beberapa menu yaitu: <strong style={{color:C.light}}>Status RTR, Produk Hukum, Dasar Hukum, dan Tentang</strong>.
        </div>
      </div>

      <div className="label">Fitur Utama</div>
      {menus.map((m,i)=>(
        <div key={i} className="card" style={{padding:"16px"}}>
          <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
            <div style={{width:40,height:40,borderRadius:10,background:C.blueL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{m.icon}</div>
            <div>
              <div style={{fontSize:14,fontWeight:800,color:C.light,marginBottom:5}}>Menu {m.title}</div>
              <div style={{fontSize:13,color:C.soft,lineHeight:1.7}}>{m.desc}</div>
            </div>
          </div>
        </div>
      ))}

      <div className="card" style={{padding:"16px"}}>
        <div className="label" style={{marginBottom:10}}>Cakupan Monitoring</div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {[
            {k:"RZ KAW",target:"20 kawasan laut"},
            {k:"RTR KSN",target:"28 kawasan"},
            {k:"RTRWP",target:"38 provinsi"},
            {k:"RTRWN",target:"1 dokumen"},
          ].map(({k,target})=>{
            const ks=KS[k];
            return(
              <div key={k} style={{display:"flex",gap:12,alignItems:"center",padding:"10px 12px",background:C.bg,borderRadius:10}}>
                <div style={{fontSize:22,flexShrink:0}}>{ks.icon}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:700,color:ks.c}}>{k}</div>
                  <div style={{fontSize:11,color:C.soft,marginTop:1}}>{ks.label}</div>
                </div>
                <div style={{fontSize:11,fontWeight:700,color:C.muted,flexShrink:0}}>{target}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{textAlign:"center",padding:"8px",color:C.muted,fontSize:11}}>
        SIMPLER v2.0 · © 2025 Deputi SDM Maritim
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   LOGIN SHEET
══════════════════════════════════════════════════ */
function LoginSheet({onLogin, onClose}){
  const [email,setEmail]=useState("");
  const [pass,setPass]=useState("");
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState("");

  async function handleLogin(){
    if(!email||!pass) return;
    setLoading(true);setErr("");
    try{
      const {data,error}=await supabase.auth.signInWithPassword({email,password:pass});
      if(error) throw error;
      onLogin(data.user);
      onClose();
    }catch(e){
      setErr("Email atau password salah.");
    }finally{setLoading(false);}
  }

  return(
    <Sheet onClose={onClose} title="Login Admin">
      <div style={{padding:"16px",display:"flex",flexDirection:"column",gap:12}}>
        <div style={{padding:"12px 14px",background:C.blueL,borderRadius:10,fontSize:13,color:C.blue,lineHeight:1.5}}>
          🔐 Halaman ini khusus untuk admin yang berwenang mengedit data SIMPLER.
        </div>
        <div>
          <div className="label" style={{marginBottom:6}}>Email</div>
          <input value={email} onChange={e=>setEmail(e.target.value)} className="field" placeholder="admin@email.com" type="email"/>
        </div>
        <div>
          <div className="label" style={{marginBottom:6}}>Password</div>
          <input value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} className="field" placeholder="••••••••" type="password"/>
        </div>
        {err&&<div style={{fontSize:13,color:C.rose,fontWeight:600,padding:"8px 12px",background:C.roseL,borderRadius:8}}>⚠️ {err}</div>}
      </div>
      <div style={{padding:"0 16px calc(16px + env(safe-area-inset-bottom))",display:"flex",gap:10}}>
        <button className="btn-ghost" onClick={onClose} style={{flex:1}}>Batal</button>
        <button className="btn-primary" onClick={handleLogin} style={{flex:2,opacity:loading?.7:1}}>
          {loading?"Masuk...":"🔐 Masuk"}
        </button>
      </div>
    </Sheet>
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
  const [user,setUser]=useState(null);
  const [showLogin,setShowLogin]=useState(false);
  const isAdmin=!!user;

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>setUser(session?.user||null));
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_,session)=>setUser(session?.user||null));
    return()=>subscription.unsubscribe();
  },[]);

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
  async function handleLogout(){await supabase.auth.signOut();setUser(null);setShowDb(false);}

  const filteredDb=useMemo(()=>data.filter(d=>{
    const mq=d.nama.toLowerCase().includes(dbSearch.toLowerCase())||d.kategori.toLowerCase().includes(dbSearch.toLowerCase());
    const mk=dbKat==="Semua"||d.kategori===dbKat;
    const p=calcP(d);
    const ms=dbSt==="Semua"||(dbSt==="Selesai"&&p===100)||(dbSt==="Proses"&&p>0&&p<100)||(dbSt==="Belum"&&p===0);
    return mq&&mk&&ms;
  }),[data,dbSearch,dbKat,dbSt]);

  if(showDb&&isAdmin) return(
    <>
      <GS/>
      <AppShell title="Dashboard Admin" hideNav onBack={()=>setShowDb(false)}
        rightBtn={
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <button className="btn-icon" onClick={()=>exportCSV(data)} style={{fontSize:14,color:C.blue}}>↓</button>
            <button onClick={()=>setAdding(true)} style={{height:36,padding:"0 14px",background:C.blue,color:"#FFFDF5",border:"none",borderRadius:10,fontSize:13,fontWeight:800,cursor:"pointer"}}>+ Tambah</button>
            <button onClick={handleLogout} style={{height:36,padding:"0 12px",background:C.roseL,color:C.rose,border:"none",borderRadius:10,fontSize:12,fontWeight:700,cursor:"pointer"}}>Keluar</button>
          </div>
        }>
        <div style={{background:C.bg,borderBottom:"1px solid "+C.line,padding:"12px 16px",position:"sticky",top:52,zIndex:30}}>
          <div style={{position:"relative",marginBottom:10}}>
            <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:14,color:C.muted}}>⌕</span>
            <input value={dbSearch} onChange={e=>setDbSearch(e.target.value)} className="field" placeholder="Cari kawasan..." style={{paddingLeft:36}}/>
          </div>
          <div className="scroll-x" style={{marginBottom:8}}>
            {["Semua",...KATEGORI].map(k=>{const on=dbKat===k;const ks=KS[k];return <button key={k} className={"pill"+(on?" on":"")} onClick={()=>setDbKat(k)} style={on&&ks?{background:ks.c,borderColor:ks.c,color:"#FFFDF5"}:{}}>{k}</button>;})}
          </div>
          <div className="scroll-x">
            {["Semua","✓ Selesai","◑ Proses","○ Belum"].map((s,i)=>{const val=["Semua","Selesai","Proses","Belum"][i];const on=dbSt===val;return <button key={val} className={"pill"+(on?" on":"")} onClick={()=>setDbSt(val)}>{s}</button>;})}
            <span style={{marginLeft:6,fontSize:11,color:C.muted,alignSelf:"center",whiteSpace:"nowrap",fontWeight:600}}>{filteredDb.length} entri</span>
          </div>
        </div>
        <div className="inner">
          {loading?<Spinner/>:(
            <div className="card-grid">
              {filteredDb.map(e=>{const p=calcP(e);const ks=KS[e.kategori];const next=e.steps.find(s=>s.status!=="Selesai");return(
                <div key={e.id} className="entry-card" onClick={()=>setDetail(e)}>
                  <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10,marginBottom:10}}>
                    <div style={{flex:1,minWidth:0}}><KatChip k={e.kategori}/><div style={{fontSize:14,fontWeight:800,color:C.light,marginTop:6,lineHeight:1.3}}>{e.nama}</div></div>
                    <div style={{position:"relative",flexShrink:0}}><CircProgress p={p} color={ks.c} size={40} stroke={3}/><div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:8,fontWeight:800,color:p===100?ks.c:C.soft}}>{p}%</span></div></div>
                  </div>
                  <StepDots steps={e.steps} color={ks.c}/>
                  {next&&<div style={{marginTop:6,fontSize:10,color:C.muted}}>⏭ {next.nama}</div>}
                </div>
              );})}
              {filteredDb.length===0&&!loading&&<div style={{gridColumn:"1/-1"}}><Empty/></div>}
            </div>
          )}
        </div>
        {detail&&!editing&&<DetailSheet entry={detail} onEdit={()=>{setEditing(detail);setDetail(null);}} onClose={()=>setDetail(null)}/>}
        {editing&&<EditSheet entry={editing} onSave={updateEntry} onClose={()=>setEditing(null)}/>}
        {adding&&<AddSheet onAdd={addEntry} onClose={()=>setAdding(false)}/>}
      </AppShell>
    </>
  );

  const NAV5=[
    {id:"home",icon:"⊙",label:"Beranda"},
    {id:"status",icon:"◫",label:"Status"},
    {id:"produk",icon:"◈",label:"Produk"},
    {id:"hukum",icon:"◉",label:"Hukum"},
    {id:"tentang",icon:"ℹ",label:"Tentang"},
  ];
  const titles={home:"SIMPLER",status:"Status RTR",produk:"Produk Hukum",hukum:"Dasar Hukum",tentang:"Tentang SIMPLER"};
  const rightBtn=isAdmin
    ?<div style={{display:"flex",gap:6,alignItems:"center"}}>
        <button className="btn-icon" onClick={()=>setShowDb(true)} style={{fontSize:14,color:C.blue,background:C.blueL,fontWeight:700}}>⚙</button>
        <button onClick={handleLogout} style={{height:32,padding:"0 10px",background:C.roseL,color:C.rose,border:"none",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer"}}>Keluar</button>
      </div>
    :<button onClick={()=>setShowLogin(true)} style={{height:32,padding:"0 12px",background:C.blueL,color:C.blue,border:"1px solid "+C.line2,borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer"}}>
        🔐 Admin
      </button>;

  return(
    <>
      <GS/>
      <div className="app-wrap fade-in">
        <div style={{height:"env(safe-area-inset-top,0px)",background:C.bg}}/>
        <div className="topbar">
          <span style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:800,color:C.blue,letterSpacing:".02em"}}>{titles[tab]}</span>
          {rightBtn}
        </div>
        <div className="content">
          {tab==="home"&&<HomeTab data={data} loading={loading} onGoStatus={k=>{setStatusKat(k);setTab("status");}} onGoDb={isAdmin?()=>setShowDb(true):null}/>}
          {tab==="status"&&<StatusTab data={data} loading={loading} initKat={statusKat}/>}
          {tab==="produk"&&<ProdukTab data={data} loading={loading}/>}
          {tab==="hukum"&&<HukumTab/>}
          {tab==="tentang"&&<AboutTab/>}
        </div>
        <div className="nav-bar">
          {NAV5.map(n=>{const on=tab===n.id;return(
            <div key={n.id} className={"nav-item"+(on?" on":"")} onClick={()=>{setTab(n.id);setStatusKat(null);}}>
              <div className="nav-icon" style={{color:on?C.blue:C.muted,fontFamily:"monospace",fontWeight:700,fontSize:18}}>{n.icon}</div>
              <span className="nav-label" style={{color:on?C.blue:C.muted}}>{n.label}</span>
            </div>
          );})}
        </div>
      </div>
      {showLogin&&<LoginSheet onLogin={u=>setUser(u)} onClose={()=>setShowLogin(false)}/>}
    </>
  );
}