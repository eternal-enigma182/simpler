"use client";
import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";
import { getPilihan } from "../lib/pilihan-steps";
import { motion, AnimatePresence } from "motion/react";
import {
  Home, BarChart2, FileText, Scale, Info,
  Settings, LogOut, Lock, ChevronRight,
  MapPin, Waves, Landmark, Globe, Download,
  CheckCircle2, Clock, Circle, ArrowLeft,
  Plus, Pencil, Trash2, Search, ExternalLink,
  Building2, ScrollText, X, TriangleAlert,
  SortAsc, SortDesc, Filter
} from "lucide-react";

const C = {
  bg:       "#E8EDF5",
  bg2:      "#DDE4F0",
  bg3:      "#D0DAF0",
  surface:  "#FFFFFF",
  surface2: "#F4F6FC",
  card:     "#FFFFFF",
  line:     "rgba(54,76,132,0.18)",
  line2:    "rgba(54,76,132,0.32)",
  white:    "#FFFFFF",
  light:    "#364C84",
  soft:     "#5A6E9E",
  muted:    "#8A98BA",
  blue:     "#364C84",
  blueD:    "#253660",
  blueL:    "rgba(54,76,132,0.1)",
  blueM:    "rgba(54,76,132,0.18)",
  sky:      "#95B1EE",
  skyL:     "rgba(149,177,238,0.2)",
  skyM:     "rgba(149,177,238,0.35)",
  lime:     "#5A7A1A",
  limeL:    "rgba(231,241,168,0.7)",
  limeB:    "#E7F1A8",
  amber:    "#8A6200",
  amberL:   "rgba(200,160,0,0.15)",
  rose:     "#B03020",
  roseL:    "rgba(176,48,32,0.1)",
  violet:   "#5B4A9E",
  violetL:  "rgba(91,74,158,0.12)",
  teal:     "#364C84",
  tealL:    "rgba(149,177,238,0.25)",
  gold:     "#6A5510",
  goldL:    "rgba(231,241,168,0.6)",
};

const KS = {
  "RZ KAW":  { c:"#1D6FA4", l:"rgba(29,111,164,0.12)",  Icon:Waves,    label:"Rencana Zonasi Kawasan Antarwilayah" },
  "RTR KSN": { c:"#5B4A9E", l:"rgba(91,74,158,0.12)",   Icon:MapPin,   label:"RTR Kawasan Strategis Nasional" },
  "RTRWP":   { c:"#1E6B5A", l:"rgba(30,107,90,0.12)",   Icon:Landmark, label:"RTR Wilayah Provinsi" },
  "RTRWN":   { c:"#253660", l:"rgba(37,54,96,0.12)",    Icon:Globe,    label:"RTR Wilayah Nasional" },
};

const ST = {
  Selesai: { c:"#2D7A3A", l:"rgba(231,241,168,0.6)", dot:"#7BA02A", ic:"✓", Icon:CheckCircle2 },
  Proses:  { c:"#8A6500", l:"rgba(255,200,80,0.15)", dot:"#C8A000", ic:"◑", Icon:Clock },
  Belum:   { c:"#8A98BA", l:"rgba(54,76,132,0.06)", dot:"#B0BADA", ic:"○", Icon:Circle },
};

const KATEGORI = ["RZ KAW","RTR KSN","RTRWP","RTRWN"];
const TAHAPAN = {
  "RZ KAW":  ["Pembentukan PAK","Dokumen Awal","Dokumen Antara","Dokumen Final","Legal Drafting","Pembahasan PAK","Harmonisasi","Penetapan Perpres"],
  "RTR KSN": ["Materi Teknis Ruang Darat & Perairan","Integrasi Muatan Materi Teknis","Persetujuan Substansi","Rapat PAK","Harmonisasi","Permohonan Paraf K/L","Penetapan Perpres"],
  "RTRWP":   ["Materi Teknis Ruang Darat & Laut","Proses Integrasi","Validasi KLHS","Pembahasan Ranperda di DPRD","Lintas Sektor","Persetujuan Substansi","Persetujuan DPRD","Evaluasi Dagri","Penetapan Perda"],
  "RTRWN":   ["Penyusunan Materi Teknis RTRL & RTRWN","Integrasi Muatan Materi Teknis","Sinkronisasi Muatan RTRWN","Penyusunan RPP RTRWN","Penyusunan Dokumen KLHS","Penetapan Peraturan Pemerintah"],
};

function getStepState(status) {
  if (!status || status === "Belum") return "Belum";
  if (status.toLowerCase().startsWith("proses") || status.toLowerCase().startsWith("belum")) return "Proses";
  return "Selesai";
}

const calcP = e => {
  if (!e.steps || e.steps.length === 0) return 0;
  const done = e.steps.filter(s => getStepState(s.status) === "Selesai").length;
  return Math.round(done / e.steps.length * 100);
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

    .fade-in{animation:fadeIn .3s ease both;}
    .slide-up{animation:slideUp .4s cubic-bezier(.16,1,.3,1) both;}

    .app-wrap{min-height:100vh;background:${C.bg};display:flex;flex-direction:column;}

    .topbar{
      height:52px;padding:0 16px;
      display:flex;align-items:center;justify-content:space-between;
      border-bottom:1px solid ${C.line};
      background:rgba(232,237,245,0.97);
      position:sticky;top:0;z-index:40;
      backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
    }
    @media(min-width:640px){.topbar{padding:0 24px;height:56px;}}

    .topbar-logo{
      display:flex;align-items:center;gap:8px;
    }
    .topbar-logo img{
      width:28px;height:28px;border-radius:7px;object-fit:contain;
      background:#fff;border:1px solid ${C.line};flex-shrink:0;
    }

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
      min-width:64px;position:relative;
    }
    .nav-label{font-size:9px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;}

    .content{flex:1;overflow-y:auto;padding-bottom:calc(72px + env(safe-area-inset-bottom));}
    .content.no-nav{padding-bottom:0;}
    .inner{max-width:960px;margin:0 auto;padding:16px;}
    @media(min-width:640px){.inner{padding:24px;}}
    @media(min-width:960px){.inner{padding:32px;}}

    .card{
      background:${C.card};border:1px solid ${C.line};border-radius:14px;
      overflow:hidden;box-shadow:0 2px 8px rgba(54,76,132,0.1),0 1px 2px rgba(54,76,132,0.08);
    }
    .card-hover{cursor:pointer;transition:border-color .15s,box-shadow .15s;-webkit-tap-highlight-color:transparent;}
    .card-hover:hover{border-color:${C.sky};box-shadow:0 4px 16px rgba(54,76,132,0.15);}
    .card-hover:active{background:${C.surface2};}

    .entry-card{
      background:${C.card};border:1px solid ${C.line};border-radius:14px;
      padding:16px;cursor:pointer;
      box-shadow:0 2px 8px rgba(54,76,132,0.1),0 1px 2px rgba(54,76,132,0.08);
      transition:border-color .15s,box-shadow .15s,transform .15s;
      -webkit-tap-highlight-color:transparent;
    }
    .entry-card:hover{border-color:${C.sky};box-shadow:0 4px 16px rgba(54,76,132,0.15);}
    .entry-card:active{transform:scale(.99);}

    .sheet{
      position:fixed;bottom:0;left:0;right:0;
      background:#FFFFFF;border-top:1.5px solid ${C.line2};
      border-radius:20px 20px 0 0;
      max-height:92vh;display:flex;flex-direction:column;
      box-shadow:0 -8px 40px rgba(54,76,132,0.2);
      z-index:100;
    }
    .sheet-handle{width:32px;height:3px;border-radius:2px;background:${C.line2};margin:10px auto 0;flex-shrink:0;}
    .sheet-scroll{overflow-y:auto;flex:1;}
    .overlay{position:fixed;inset:0;background:rgba(36,56,100,0.35);z-index:99;animation:fadeIn .2s ease;}

    .pbar-wrap{position:relative;height:6px;background:${C.line};border-radius:99px;overflow:hidden;}
    .pbar-fill{height:100%;border-radius:99px;transition:width .8s cubic-bezier(.4,0,.2,1);}

    .cprog{transform:rotate(-90deg);}
    .cprog-track{fill:none;}
    .cprog-fill{fill:none;stroke-linecap:round;transition:stroke-dashoffset .8s cubic-bezier(.4,0,.2,1);}

    .step-dots{display:flex;gap:3px;align-items:center;}
    .step-dot{height:5px;border-radius:99px;transition:all .3s ease;flex-shrink:0;}

    .chip{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:99px;font-size:10px;font-weight:700;letter-spacing:.04em;}

    /* STATUS CHIP — full text, no truncate */
    .status-chip{
      display:inline-flex;align-items:center;gap:4px;
      padding:4px 8px;border-radius:8px;
      font-size:10px;font-weight:600;line-height:1.4;
      white-space:normal;word-break:break-word;
      max-width:180px;
    }

    .field{
      width:100%;padding:12px 14px;
      background:#FFFFFF;border:1.5px solid ${C.line};border-radius:10px;
      font-size:15px;color:${C.light};outline:none;
      transition:border-color .15s;-webkit-appearance:none;
    }
    .field:focus{border-color:${C.sky};box-shadow:0 0 0 3px rgba(149,177,238,0.2);}
    .field::placeholder{color:${C.muted};}
    select.field{cursor:pointer;}

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
      background:${C.bg2};cursor:pointer;
      -webkit-tap-highlight-color:transparent;transition:background .12s;
      color:${C.soft};flex-shrink:0;
    }
    .btn-icon:hover{background:${C.skyL};}

    .pill{
      padding:7px 14px;border-radius:99px;font-size:11px;font-weight:700;
      border:1.5px solid ${C.line};background:${C.surface};color:${C.soft};
      cursor:pointer;white-space:nowrap;transition:all .15s;letter-spacing:.03em;
      -webkit-tap-highlight-color:transparent;
    }
    .pill.on{background:${C.blue};border-color:${C.blue};color:#FFFDF5;}
    .pill:hover:not(.on){border-color:${C.sky};color:${C.blue};}

    .t-row{
      display:flex;align-items:center;gap:14px;padding:14px 16px;
      cursor:pointer;transition:background .12s;
      -webkit-tap-highlight-color:transparent;
    }
    .t-row:hover{background:${C.bg2};}
    .t-row+.t-row{border-top:1px solid ${C.line};}

    .card-grid{display:grid;gap:10px;grid-template-columns:1fr;}
    @media(min-width:480px){.card-grid{grid-template-columns:1fr 1fr;}}
    @media(min-width:768px){.card-grid{grid-template-columns:repeat(3,1fr);}}
    @media(min-width:1024px){.card-grid{grid-template-columns:repeat(4,1fr);}}

    .scroll-x{display:flex;gap:6px;overflow-x:auto;padding:2px 1px;}
    .scroll-x::-webkit-scrollbar{height:0;}

    .label{font-size:9px;font-weight:800;color:${C.muted};letter-spacing:.12em;text-transform:uppercase;}
    .sec-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;}

    /* PRODUK CARD GRID */
    .produk-grid{display:grid;gap:12px;grid-template-columns:1fr;}
    @media(min-width:480px){.produk-grid{grid-template-columns:1fr 1fr;}}
    @media(min-width:768px){.produk-grid{grid-template-columns:repeat(3,1fr);}}

    /* ADMIN FILTER BAR — sticky top, full height accounted */
    .admin-filter{
      background:${C.bg};
      border-bottom:1px solid ${C.line};
      padding:10px 16px;
      position:sticky;
      top:52px;
      z-index:30;
    }
    @media(min-width:640px){.admin-filter{top:56px;}}

    /* ADMIN CONTENT — padd top so filter doesn't cover cards */
    .admin-content{padding:16px;}
  `}</style>
);

/* ══════════════════════════════════════════════════
   ATOMS
══════════════════════════════════════════════════ */
function PBar({p, color, h=5}){
  return(
    <div className="pbar-wrap" style={{height:h}}>
      <div className="pbar-fill" style={{width:p+"%", background:color}}/>
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

function StepDots({steps}){
  const total = steps.length;
  const maxShow = Math.min(total, 12);
  return(
    <div className="step-dots">
      {steps.slice(0,maxShow).map((s,i)=>{
        const state = getStepState(s.status);
        const st = ST[state]||ST.Belum;
        const w = state==="Selesai" ? 10 : 5;
        return <div key={i} className="step-dot" style={{width:w, background:st.dot}}/>;
      })}
      {total>maxShow&&<span style={{fontSize:9,color:C.muted,fontWeight:700}}>+{total-maxShow}</span>}
    </div>
  );
}

/* ── Status chip — full text, wraps ── */
function StatusChip({st}){
  const state = getStepState(st);
  const s = ST[state]||ST.Belum;
  const {Icon} = s;
  return(
    <span className="status-chip" style={{background:s.l, color:s.c}}>
      <Icon size={10} strokeWidth={2.5} style={{flexShrink:0, marginTop:1}}/>
      {st}
    </span>
  );
}

function KatIcon({k, size=28, bg=true}){
  const ks=KS[k];
  const [hovered,setHovered]=useState(false);
  const animMap={
    "RZ KAW":{y:hovered?-3:0,scale:hovered?1.15:1,rotate:0},
    "RTR KSN":{y:hovered?-4:0,scale:hovered?1.2:1,rotate:0},
    "RTRWP":{y:hovered?-2:0,scale:hovered?1.1:1,rotate:0},
    "RTRWN":{rotate:hovered?180:0,scale:hovered?1.1:1,y:0},
  };
  const anim=animMap[k]||{y:0,scale:1,rotate:0};
  return(
    <motion.div onHoverStart={()=>setHovered(true)} onHoverEnd={()=>setHovered(false)}
      style={{width:bg?size+16:size,height:bg?size+16:size,borderRadius:bg?12:0,background:bg?ks.l:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
      <motion.div animate={anim} transition={{type:"spring",stiffness:400,damping:20}}>
        <ks.Icon size={size} color={ks.c} strokeWidth={1.8}/>
      </motion.div>
    </motion.div>
  );
}

function KatChip({k, size="sm"}){
  const ks=KS[k];
  const [hovered,setHovered]=useState(false);
  return(
    <motion.span className="chip" onHoverStart={()=>setHovered(true)} onHoverEnd={()=>setHovered(false)}
      style={{background:ks.l,color:ks.c,fontSize:size==="lg"?11:9}}>
      <motion.div animate={{scale:hovered?1.2:1,rotate:k==="RTRWN"&&hovered?180:0}} transition={{type:"spring",stiffness:400,damping:18}} style={{display:"flex",alignItems:"center"}}>
        <ks.Icon size={size==="lg"?12:10} strokeWidth={2} color={ks.c}/>
      </motion.div>
      {k}
    </motion.span>
  );
}

function Spinner(){
  return(
    <div style={{display:"flex",justifyContent:"center",padding:"48px 0"}}>
      <motion.div animate={{rotate:360}} transition={{duration:.7,repeat:Infinity,ease:"linear"}}>
        <Circle size={24} color={C.sky} strokeWidth={2}/>
      </motion.div>
    </div>
  );
}

function Empty({text="Tidak ada data"}){
  return(
    <div style={{textAlign:"center",padding:"48px 20px",color:C.muted}}>
      <Search size={36} color={C.line2} strokeWidth={1.5} style={{margin:"0 auto 12px"}}/>
      <div style={{fontSize:14,fontWeight:600}}>{text}</div>
    </div>
  );
}

/* Logo SIMPLER kecil inline */
function SimplerLogo({size=24}){
  return(
    <img src="/simpler-logo.jpg" alt="SIMPLER"
      style={{width:size,height:size,borderRadius:Math.round(size*0.28),objectFit:"contain",background:"#fff",border:"1px solid "+C.line,flexShrink:0}}
      onError={e=>{e.target.style.display="none";}}/>
  );
}

/* ══════════════════════════════════════════════════
   SHEET
══════════════════════════════════════════════════ */
function Sheet({children, onClose, title, subtitle}){
  return(
    <AnimatePresence>
      <motion.div key="overlay" className="overlay" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose}/>
      <motion.div key="sheet" className="sheet" initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}} transition={{type:"spring",stiffness:320,damping:36,mass:.9}}>
        <div className="sheet-handle"/>
        {(title||subtitle)&&(
          <div style={{padding:"16px 20px 0",display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexShrink:0}}>
            <div>
              {title&&<div style={{fontSize:17,fontWeight:800,color:C.light}}>{title}</div>}
              {subtitle&&<div style={{fontSize:12,color:C.muted,marginTop:2}}>{subtitle}</div>}
            </div>
            <motion.button whileTap={{scale:.88}} className="btn-icon" onClick={onClose} style={{marginTop:-2}}>
              <X size={16} strokeWidth={2} color={C.soft}/>
            </motion.button>
          </div>
        )}
        <div className="sheet-scroll">{children}</div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ══════════════════════════════════════════════════
   NAV BAR
══════════════════════════════════════════════════ */
const NAV5 = [
  {id:"home",    Icon:Home,     label:"Beranda"},
  {id:"status",  Icon:BarChart2,label:"Status"},
  {id:"produk",  Icon:FileText, label:"Produk"},
  {id:"hukum",   Icon:Scale,    label:"Hukum"},
  {id:"tentang", Icon:Info,     label:"Tentang"},
];

function NavBar({active, onTab}){
  return(
    <div className="nav-bar">
      {NAV5.map(n=>{
        const on=active===n.id;
        return(
          <motion.div key={n.id} className={"nav-item"+(on?" on":"")} onClick={()=>onTab(n.id)} whileTap={{scale:.85}} style={{position:"relative"}}>
            {on&&<motion.div layoutId="nav-pill" style={{position:"absolute",inset:0,background:C.skyL,borderRadius:10}} transition={{type:"spring",stiffness:380,damping:30}}/>}
            <motion.div animate={{y:on?-1:0,scale:on?1.08:1}} transition={{type:"spring",stiffness:380,damping:22}} style={{position:"relative",zIndex:1}}>
              <n.Icon size={20} strokeWidth={on?2.5:1.8} color={on?C.blue:C.muted}/>
            </motion.div>
            <span className="nav-label" style={{color:on?C.blue:C.muted,position:"relative",zIndex:1,fontWeight:on?800:600,transition:"color .2s"}}>{n.label}</span>
          </motion.div>
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
            <motion.button whileTap={{scale:.88}} className="btn-icon" onClick={onBack} style={{color:C.blue,background:C.blueL}}>
              <ArrowLeft size={18} strokeWidth={2}/>
            </motion.button>
          )}
          <div className="topbar-logo">
            <SimplerLogo size={28}/>
            <span style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:800,color:C.blue,letterSpacing:".02em"}}>{title}</span>
          </div>
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
  const p=calcP(entry);
  const ks=KS[entry.kategori];
  const done=entry.steps.filter(s=>getStepState(s.status)==="Selesai").length;
  return(
    <Sheet onClose={onClose}>
      <div style={{padding:"20px 20px 0"}}>
        <KatChip k={entry.kategori} size="lg"/>
        <div style={{fontSize:22,fontWeight:800,color:C.light,marginTop:10,lineHeight:1.2}}>{entry.nama}</div>
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
            <div style={{marginTop:6}}><StepDots steps={entry.steps}/></div>
          </div>
        </div>
        {entry.produk&&(
          <div style={{marginTop:14,padding:"10px 14px",background:ks.l,borderRadius:10,display:"flex",alignItems:"center",gap:10,cursor:entry.link_produk?"pointer":"default",border:"1px solid "+(ks.c+"30")}}
            onClick={()=>entry.link_produk&&window.open(entry.link_produk,"_blank")}>
            <span style={{fontSize:16}}>📎</span>
            <span style={{fontSize:13,fontWeight:700,color:ks.c,flex:1}}>{entry.produk}</span>
            {entry.link_produk&&<span style={{fontSize:11,color:ks.c,fontWeight:700}}>Buka ↗</span>}
          </div>
        )}
      </div>
      <div style={{padding:"20px 20px 8px"}}>
        <div className="label" style={{marginBottom:12}}>Tahapan Penetapan</div>
      </div>
      <div className="card" style={{margin:"0 16px",borderRadius:12}}>
        {entry.steps.map((s,i)=>{
          const state=getStepState(s.status);
          const st=ST[state]||ST.Belum;
          const isLast=i===entry.steps.length-1;
          return(
            <div key={i} style={{display:"flex",gap:14,padding:"12px 16px",borderBottom:isLast?"none":"1px solid "+C.line}}>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",flexShrink:0}}>
                <div style={{width:22,height:22,borderRadius:"50%",background:st.l,border:"1.5px solid "+st.dot,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:st.dot,fontWeight:800}}>{i+1}</div>
                {!isLast&&<div style={{width:1,flex:1,background:C.line,margin:"3px 0"}}/>}
              </div>
              <div style={{flex:1,minWidth:0,paddingBottom:isLast?0:8}}>
                <div style={{fontSize:12,fontWeight:600,color:state==="Selesai"?C.light:C.soft,lineHeight:1.4,marginBottom:6}}>{s.nama}</div>
                {/* Status full text — tidak dipotong */}
                <StatusChip st={s.status}/>
                {s.tanggal&&<div style={{fontSize:10,color:C.lime,fontWeight:600,marginTop:6}}>📅 {s.tanggal}</div>}
                {s.keterangan&&<div style={{fontSize:11,color:C.muted,marginTop:3}}>{s.keterangan}</div>}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{padding:"16px 16px calc(16px + env(safe-area-inset-bottom))",display:"flex",gap:10}}>
        <motion.button whileTap={{scale:.97}} className="btn-ghost" onClick={onClose} style={{flex:1}}>Tutup</motion.button>
        <motion.button whileTap={{scale:.97}} className="btn-primary" onClick={onEdit} style={{flex:2,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><Pencil size={14}/> Edit Data</motion.button>
      </div>
    </Sheet>
  );
}

/* ══════════════════════════════════════════════════
   EDIT SHEET — dropdown pilihan spesifik
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
    <Sheet onClose={onClose} title="Edit" subtitle={f.nama}>
      <div style={{padding:"16px",display:"flex",flexDirection:"column",gap:12}}>
        <div>
          <div className="label" style={{marginBottom:6}}>Produk Hukum</div>
          <input value={f.produk} onChange={e=>setF(p=>({...p,produk:e.target.value}))} className="field" placeholder="cth: Perpres No 40 Tahun 2022"/>
        </div>
        <div>
          <div className="label" style={{marginBottom:6}}>Link Dokumen (PDF)</div>
          <input value={f.link_produk} onChange={e=>setF(p=>({...p,link_produk:e.target.value}))} className="field" placeholder="https://drive.google.com/file/d/..."/>
        </div>
        <div className="label" style={{marginTop:4}}>Tahapan</div>
        {f.steps.map((step,i)=>{
          const pilihan=getPilihan(f.kategori, step.nama);
          return(
            <div key={i} className="card" style={{padding:"14px 16px",borderRadius:12}}>
              <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:12}}>
                <div style={{width:22,height:22,borderRadius:"50%",background:ks.l,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:ks.c,flexShrink:0}}>{i+1}</div>
                <div style={{fontSize:12,fontWeight:600,color:C.light,lineHeight:1.3}}>{step.nama}</div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                <div>
                  <div className="label" style={{marginBottom:5}}>Status</div>
                  <select value={step.status} onChange={e=>ss(i,"status",e.target.value)} className="field" style={{fontSize:12}}>
                    {pilihan.map(s=><option key={s} value={s}>{s}</option>)}
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
          );
        })}
      </div>
      <div style={{padding:"12px 16px calc(16px + env(safe-area-inset-bottom))",display:"flex",gap:10}}>
        <motion.button whileTap={{scale:.97}} className="btn-ghost" onClick={onClose} style={{flex:1}}>Batal</motion.button>
        <motion.button whileTap={{scale:.97}} className="btn-primary" onClick={handleSave} style={{flex:2,opacity:saving?.7:1}}>{saving?"Menyimpan...":"Simpan"}</motion.button>
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
                  style={{padding:"12px 14px",borderRadius:12,border:"1px solid "+(on?ks.c:C.line),background:on?ks.l:"transparent",cursor:"pointer",transition:"all .15s"}}>
                  <KatIcon k={k} size={22} bg={false}/>
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
        <motion.button whileTap={{scale:.97}} className="btn-primary" onClick={handleAdd} style={{opacity:saving?.7:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><Plus size={15}/>{saving?"Menambahkan...":"Tambah Entri"}</motion.button>
      </div>
    </Sheet>
  );
}

/* ══════════════════════════════════════════════════
   HOME TAB — Produk carousel + grid card
══════════════════════════════════════════════════ */
function ProdukCard({e, index}){
  const ks=KS[e.kategori];
  const tgl=e.steps[e.steps.length-1]?.tanggal||"";
  return(
    <motion.div
      onClick={()=>e.link_produk&&window.open(e.link_produk,"_blank")}
      whileHover={{y:-4,boxShadow:"0 8px 24px rgba(54,76,132,0.18)"}}
      whileTap={{scale:.97}}
      style={{
        background:"linear-gradient(135deg,"+ks.c+"18 0%,"+ks.c+"05 100%)",
        border:"1.5px solid "+ks.c+"35",
        borderRadius:16,
        padding:"16px",
        cursor:e.link_produk?"pointer":"default",
        position:"relative",
        overflow:"hidden",
      }}>
      {/* nomor badge */}
      <div style={{position:"absolute",top:12,right:12,width:24,height:24,borderRadius:6,background:ks.c+"20",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:ks.c}}>{index+1}</div>

      <KatChip k={e.kategori} size="lg"/>
      <div style={{fontSize:14,fontWeight:800,color:C.light,lineHeight:1.3,marginTop:8,marginBottom:10,paddingRight:28}}>{e.nama}</div>

      <div style={{display:"flex",alignItems:"center",gap:6,padding:"7px 10px",background:"rgba(255,255,255,0.85)",borderRadius:8,marginBottom:tgl?8:0}}>
        <span style={{fontSize:13}}>📎</span>
        <span style={{fontSize:11,fontWeight:700,color:ks.c,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.produk}</span>
        {e.link_produk&&<ExternalLink size={11} color={ks.c} strokeWidth={2} style={{flexShrink:0}}/>}
      </div>
      {tgl&&<div style={{fontSize:10,color:ks.c,fontWeight:700}}>📅 {tgl}</div>}
    </motion.div>
  );
}

function ProdukSection({data}){
  const [showAll,setShowAll]=useState(false);

  function parseTgl(tgl){
    if(!tgl) return 0;
    const b={Januari:1,Februari:2,Maret:3,April:4,Mei:5,Juni:6,Juli:7,Agustus:8,September:9,Oktober:10,November:11,Desember:12};
    const p=tgl.split(" ");
    if(p.length===3) return parseInt(p[2])*10000+(b[p[1]]||0)*100+parseInt(p[0]);
    return 0;
  }

  const produk=[...data]
    .filter(d=>d.produk&&calcP(d)===100)
    .sort((a,b)=>parseTgl(b.steps[b.steps.length-1]?.tanggal||"")-parseTgl(a.steps[a.steps.length-1]?.tanggal||""));

  if(produk.length===0) return null;
  const displayed=showAll?produk:produk.slice(0,6);

  return(
    <div>
      <div className="sec-hdr">
        <div className="label">Produk Telah Ditetapkan ({produk.length})</div>
        {produk.length>6&&(
          <motion.button whileTap={{scale:.9}} onClick={()=>setShowAll(p=>!p)}
            style={{background:"none",border:"none",color:C.blue,fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:3}}>
            {showAll?"Sembunyikan":"Semua"} <ChevronRight size={13} strokeWidth={2.5} style={{transform:showAll?"rotate(90deg)":"rotate(0deg)",transition:"transform .2s"}}/>
          </motion.button>
        )}
      </div>
      <div className="produk-grid">
        <AnimatePresence>
          {displayed.map((e,i)=>(
            <motion.div key={e.id}
              initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-5}}
              transition={{delay:i*0.04,duration:.25}}>
              <ProdukCard e={e} index={i}/>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function HomeTab({data, loading, onGoStatus, onGoDb}){
  const totalDone=data.filter(d=>calcP(d)===100).length;
  const totalProses=data.filter(d=>{const p=calcP(d);return p>0&&p<100;}).length;
  const pct=data.length?Math.round(totalDone/data.length*100):0;

  return(
    <div className="inner" style={{display:"flex",flexDirection:"column",gap:20}}>
      {/* Hero */}
      <div style={{background:"linear-gradient(135deg,#364C84 0%,#253660 100%)",borderRadius:18,padding:"24px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",right:-60,top:-60,width:200,height:200,borderRadius:"50%",background:"rgba(149,177,238,0.15)",pointerEvents:"none"}}/>
        <div style={{position:"absolute",right:20,bottom:-80,width:160,height:160,borderRadius:"50%",background:"rgba(231,241,168,0.08)",pointerEvents:"none"}}/>
        <div style={{position:"relative"}}>
          <div style={{fontSize:9,fontWeight:800,color:"rgba(231,241,168,0.8)",letterSpacing:".15em",textTransform:"uppercase",marginBottom:8}}>Sistem Informasi Monitoring</div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
            <img src="/simpler-logo.jpg" alt="SIMPLER" style={{width:36,height:36,borderRadius:9,objectFit:"contain",background:"rgba(255,255,255,0.9)",border:"1px solid rgba(255,255,255,0.3)",flexShrink:0}} onError={e=>{e.target.style.display="none";}}/>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:"clamp(28px,6vw,40px)",fontWeight:800,color:"#FFFDF5",lineHeight:.95,letterSpacing:"-.02em"}}>SIMPLER</div>
          </div>
          <div style={{fontSize:13,color:"rgba(149,177,238,0.85)",marginBottom:20}}>Penyelesaian Penataan Ruang Laut</div>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <div style={{position:"relative",flexShrink:0}}>
              <CircProgress p={pct} color="#E7F1A8" size={80} stroke={6}/>
              <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <div style={{fontSize:17,fontWeight:800,color:"#E7F1A8",lineHeight:1}}>{pct}%</div>
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

      {/* Progress per kategori */}
      <div>
        <div className="sec-hdr"><div className="label">Progress per Kategori</div></div>
        <div className="card">
          {loading?<Spinner/>:KATEGORI.map((k,i)=>{
            const ks=KS[k];
            const es=data.filter(d=>d.kategori===k);
            const done=es.filter(d=>calcP(d)===100).length;
            const p=es.length?Math.round(done/es.length*100):0;
            return(
              <motion.div key={k} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:i*0.06,duration:.3}}
                onClick={()=>onGoStatus(k)}
                style={{padding:"14px 16px",display:"flex",alignItems:"center",gap:14,cursor:"pointer",borderBottom:i<3?"1px solid "+C.line:"none"}}
                whileHover={{background:C.surface2}} whileTap={{background:C.surface2}}>
                <KatIcon k={k} size={18}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}>
                    <span style={{fontSize:13,fontWeight:700,color:C.light}}>{k}</span>
                    <span style={{fontSize:12,fontWeight:800,color:ks.c}}>{done}<span style={{color:C.muted,fontWeight:500}}>/{es.length}</span></span>
                  </div>
                  <PBar p={p} color={ks.c} h={4}/>
                </div>
                <ChevronRight size={16} color={C.muted} strokeWidth={1.8}/>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Produk grid */}
      {!loading&&<ProdukSection data={data}/>}

      {/* About card */}
      <div className="card" style={{padding:"20px"}}>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
          <img src="/simpler-logo.jpg" alt="SIMPLER Logo" style={{width:52,height:52,borderRadius:12,objectFit:"contain",background:"#fff",border:"1px solid "+C.line,flexShrink:0}} onError={e=>{e.target.style.display="none";}}/>
          <div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:800,color:C.blue,lineHeight:1}}>SIMPLER</div>
            <div style={{fontSize:10,color:C.muted,marginTop:3,lineHeight:1.4}}>Sistem Informasi Monitoring<br/>Penyelesaian Penataan Ruang Laut</div>
          </div>
        </div>
        <div className="label" style={{marginBottom:8}}>Tentang SIMPLER</div>
        <div style={{fontSize:13,color:C.soft,lineHeight:1.8}}>
          SIMPLER adalah dashboard monitoring progres penyelesaian perencanaan ruang laut yang diinisiasi oleh <strong style={{color:C.light}}>Deputi Bidang Koordinasi Sumber Daya Maritim</strong>, Kementerian Koordinator Bidang Kemaritiman dan Investasi.
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:12}}>
          {KATEGORI.map(k=><KatChip key={k} k={k}/>)}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   STATUS TAB — dengan search + sort + filter
══════════════════════════════════════════════════ */
function StatusTab({data, loading, initKat}){
  const [kat,setKat]=useState(initKat||null);
  const [detail,setDetail]=useState(null);
  const [editing,setEditing]=useState(null);
  const [localData,setLocalData]=useState(null);
  const [search,setSearch]=useState("");
  const [sort,setSort]=useState("nama-asc"); // nama-asc | nama-desc | progress-asc | progress-desc
  const [filterSt,setFilterSt]=useState("Semua");

  const displayData=localData||data;
  useEffect(()=>{setKat(initKat||null);},[initKat]);

  if(!kat) return(
    <div className="inner" style={{display:"flex",flexDirection:"column",gap:16}}>
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
            <motion.div key={k} initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} style={{marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <span style={{fontSize:12,fontWeight:600,color:C.light}}>{label}</span>
                <span style={{fontSize:12,fontWeight:700,color:ks.c}}>{done}<span style={{color:C.muted,fontWeight:400}}>/{max}</span></span>
              </div>
              <PBar p={p} color={ks.c} h={5}/>
            </motion.div>
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
            <motion.div key={k} className="card card-hover" onClick={()=>setKat(k)} style={{padding:"18px 16px"}}
              whileHover={{y:-3,boxShadow:"0 8px 24px rgba(54,76,132,0.15)"}} whileTap={{scale:.97}}
              initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:KATEGORI.indexOf(k)*0.07}}>
              <div style={{marginBottom:10}}><KatIcon k={k} size={28} bg={false}/></div>
              <KatChip k={k}/>
              <div style={{marginTop:12}}>
                <div style={{fontFamily:"'Syne',sans-serif",fontSize:26,fontWeight:800,color:ks.c,lineHeight:1}}>{done}<span style={{fontSize:13,color:C.muted,fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:500}}>/{es.length}</span></div>
                <div style={{marginTop:8}}><PBar p={p} color={ks.c} h={4}/></div>
                <div style={{marginTop:6}}><StepDots steps={es.flatMap(e=>e.steps).slice(0,8)}/></div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );

  // Filter + sort entries
  let entries=displayData.filter(d=>d.kategori===kat);
  if(search) entries=entries.filter(e=>e.nama.toLowerCase().includes(search.toLowerCase())||e.produk.toLowerCase().includes(search.toLowerCase()));
  if(filterSt==="Selesai") entries=entries.filter(e=>calcP(e)===100);
  else if(filterSt==="Proses") entries=entries.filter(e=>{const p=calcP(e);return p>0&&p<100;});
  else if(filterSt==="Belum") entries=entries.filter(e=>calcP(e)===0);
  entries=[...entries].sort((a,b)=>{
    if(sort==="nama-asc") return a.nama.localeCompare(b.nama);
    if(sort==="nama-desc") return b.nama.localeCompare(a.nama);
    if(sort==="progress-desc") return calcP(b)-calcP(a);
    if(sort==="progress-asc") return calcP(a)-calcP(b);
    return 0;
  });

  const ks=KS[kat];
  const allEntries=displayData.filter(d=>d.kategori===kat);
  const done=allEntries.filter(e=>calcP(e)===100).length;

  return(
    <div className="inner" style={{display:"flex",flexDirection:"column",gap:12}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <motion.button whileTap={{scale:.88}} className="btn-icon" onClick={()=>setKat(null)} style={{color:C.blue,background:C.blueL}}><ArrowLeft size={18} strokeWidth={2}/></motion.button>
        <div style={{flex:1}}>
          <KatChip k={kat} size="lg"/>
          <div style={{fontSize:11,color:C.muted,marginTop:3}}>{done}/{allEntries.length} ditetapkan</div>
        </div>
      </div>

      {/* Search + Sort + Filter */}
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        <div style={{position:"relative",flex:1,minWidth:160}}>
          <Search size={14} color={C.muted} style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} className="field" placeholder="Cari..." style={{paddingLeft:34,height:40,fontSize:13}}/>
        </div>
        <select value={sort} onChange={e=>setSort(e.target.value)} className="field" style={{width:"auto",height:40,fontSize:12,paddingLeft:10,paddingRight:10}}>
          <option value="nama-asc">A–Z</option>
          <option value="nama-desc">Z–A</option>
          <option value="progress-desc">Progress ↓</option>
          <option value="progress-asc">Progress ↑</option>
        </select>
        <select value={filterSt} onChange={e=>setFilterSt(e.target.value)} className="field" style={{width:"auto",height:40,fontSize:12,paddingLeft:10,paddingRight:10}}>
          <option value="Semua">Semua</option>
          <option value="Selesai">✓ Selesai</option>
          <option value="Proses">◑ Proses</option>
          <option value="Belum">○ Belum</option>
        </select>
      </div>
      <div style={{fontSize:11,color:C.muted,fontWeight:600}}>{entries.length} entri</div>

      {loading?<Spinner/>:entries.length===0?<Empty text="Tidak ditemukan"/>:entries.map((e,i)=>{
        const p=calcP(e);
        const next=e.steps.find(s=>getStepState(s.status)!=="Selesai");
        return(
          <motion.div key={e.id} className="entry-card"
            initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.04,duration:.25}}
            whileHover={{y:-2,boxShadow:"0 6px 20px rgba(54,76,132,0.14)"}} whileTap={{scale:.98}}
            onClick={()=>setDetail(e)}>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12,marginBottom:12}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:15,fontWeight:800,color:C.light,lineHeight:1.3}}>{e.nama}</div>
                {e.produk&&<div style={{fontSize:10,color:ks.c,fontWeight:600,marginTop:4,display:"flex",alignItems:"center",gap:3}}><FileText size={9} strokeWidth={2}/>{e.produk}</div>}
              </div>
              <div style={{position:"relative",flexShrink:0}}>
                <CircProgress p={p} color={ks.c} size={44} stroke={3.5}/>
                <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <span style={{fontSize:9,fontWeight:800,color:p===100?ks.c:C.soft}}>{p}%</span>
                </div>
              </div>
            </div>
            <StepDots steps={e.steps}/>
            {next&&<div style={{marginTop:8,fontSize:10,color:C.soft,display:"flex",alignItems:"center",gap:4}}><ChevronRight size={10} strokeWidth={2} color={C.muted}/>{next.nama}</div>}
          </motion.div>
        );
      })}
      {detail&&<DetailSheet entry={detail} onEdit={()=>{setEditing(detail);setDetail(null);}} onClose={()=>setDetail(null)}/>}
      {editing&&<EditSheet entry={editing} onSave={u=>{setLocalData(p=>(p||displayData).map(e=>e.id===u.id?u:e));}} onClose={()=>setEditing(null)}/>}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   PRODUK TAB — dengan search + filter + sort
══════════════════════════════════════════════════ */
function ProdukTab({data, loading}){
  const [q,setQ]=useState("");
  const [katFilter,setKatFilter]=useState("Semua");
  const [sort,setSort]=useState("nama-asc");

  let items=data.filter(d=>d.produk);
  if(q) items=items.filter(d=>d.nama.toLowerCase().includes(q.toLowerCase())||d.produk.toLowerCase().includes(q.toLowerCase()));
  if(katFilter!=="Semua") items=items.filter(d=>d.kategori===katFilter);
  items=[...items].sort((a,b)=>{
    if(sort==="nama-asc") return a.nama.localeCompare(b.nama);
    if(sort==="nama-desc") return b.nama.localeCompare(a.nama);
    if(sort==="kat") return a.kategori.localeCompare(b.kategori);
    return 0;
  });

  return(
    <div className="inner" style={{display:"flex",flexDirection:"column",gap:14}}>
      {/* Search + sort */}
      <div style={{display:"flex",gap:8}}>
        <div style={{position:"relative",flex:1}}>
          <Search size={15} color={C.muted} style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}/>
          <input value={q} onChange={e=>setQ(e.target.value)} className="field" placeholder="Cari produk hukum..." style={{paddingLeft:36}}/>
        </div>
        <select value={sort} onChange={e=>setSort(e.target.value)} className="field" style={{width:"auto",fontSize:12,paddingLeft:10,paddingRight:10}}>
          <option value="nama-asc">A–Z</option>
          <option value="nama-desc">Z–A</option>
          <option value="kat">Kategori</option>
        </select>
      </div>

      {/* Filter kategori pills */}
      <div className="scroll-x">
        {["Semua",...KATEGORI].map(k=>{
          const on=katFilter===k;
          const ks=KS[k];
          return(
            <button key={k} className={"pill"+(on?" on":"")} onClick={()=>setKatFilter(k)}
              style={on&&ks?{background:ks.c,borderColor:ks.c,color:"#fff"}:{}}>
              {k}
            </button>
          );
        })}
      </div>

      {/* Summary mini */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {KATEGORI.map(k=>{
          const ks=KS[k];
          const cnt=data.filter(d=>d.kategori===k&&d.produk).length;
          return(
            <div key={k} onClick={()=>setKatFilter(k)} style={{background:C.card,border:"1px solid "+C.line,borderRadius:12,padding:"12px 14px",display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}
              onClick={()=>setKatFilter(katFilter===k?"Semua":k)}>
              <KatIcon k={k} size={16}/>
              <div>
                <div style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:800,color:ks.c,lineHeight:1}}>{cnt}</div>
                <div style={{fontSize:9,color:C.muted,fontWeight:700,letterSpacing:".06em"}}>{k}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="label">{items.length} produk</div>
      <div className="card">
        {loading?<Spinner/>:items.length===0?<Empty text="Tidak ada produk"/>:
          items.map((d,i)=>{
            const ks=KS[d.kategori];
            return(
              <motion.div key={d.id} className="t-row" whileTap={{scale:.99}}
                onClick={()=>d.link_produk&&window.open(d.link_produk,"_blank")}
                style={{cursor:d.link_produk?"pointer":"default"}}>
                <KatIcon k={d.kategori} size={16}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:700,color:C.light,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.nama}</div>
                  <div style={{fontSize:11,color:ks.c,fontWeight:600,marginTop:2}}>{d.produk}</div>
                </div>
                {d.link_produk
                  ?<div style={{display:"flex",alignItems:"center",gap:3,flexShrink:0}}><ExternalLink size={11} color={C.blue} strokeWidth={2}/><span style={{fontSize:10,color:C.blue,fontWeight:700}}>Buka</span></div>
                  :<ChevronRight size={14} color={C.muted} strokeWidth={1.8}/>
                }
              </motion.div>
            );
          })
        }
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   HUKUM TAB
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
        <div><div className="label" style={{marginBottom:6}}>Nama Peraturan *</div><input value={f.nama} onChange={e=>setF(p=>({...p,nama:e.target.value}))} className="field" placeholder="cth: UU No. 26 Tahun 2007"/></div>
        <div><div className="label" style={{marginBottom:6}}>Tentang</div><input value={f.tentang} onChange={e=>setF(p=>({...p,tentang:e.target.value}))} className="field" placeholder="cth: Tentang Penataan Ruang"/></div>
        <div><div className="label" style={{marginBottom:6}}>Ikon (emoji)</div><input value={f.ikon} onChange={e=>setF(p=>({...p,ikon:e.target.value}))} className="field" placeholder="📄" style={{maxWidth:80}}/></div>
        <div><div className="label" style={{marginBottom:6}}>Link Dokumen</div><input value={f.link} onChange={e=>setF(p=>({...p,link:e.target.value}))} className="field" placeholder="https://..."/></div>
      </div>
      <div style={{padding:"0 16px calc(16px + env(safe-area-inset-bottom))",display:"flex",gap:10}}>
        <button className="btn-ghost" onClick={onClose} style={{flex:1}}>Batal</button>
        <motion.button whileTap={{scale:.97}} className="btn-primary" onClick={handleSave} style={{flex:2,opacity:saving?.7:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><Plus size={14}/>{saving?"Menyimpan...":"Tambah"}</motion.button>
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
        <div><div className="label" style={{marginBottom:6}}>Link Dokumen</div><input value={f.link} onChange={e=>setF(p=>({...p,link:e.target.value}))} className="field" placeholder="https://..."/></div>
      </div>
      <div style={{padding:"0 16px calc(16px + env(safe-area-inset-bottom))",display:"flex",gap:10}}>
        <motion.button whileTap={{scale:.97}} className="btn-ghost" onClick={onClose} style={{flex:1}}>Batal</motion.button>
        <motion.button whileTap={{scale:.97}} className="btn-primary" onClick={handleSave} style={{flex:2,opacity:saving?.7:1}}>{saving?"Menyimpan...":"Simpan"}</motion.button>
      </div>
    </Sheet>
  );
}

function HukumTab({isAdmin}){
  const [q,setQ]=useState("");
  const [hukum,setHukum]=useState([]);
  const [loading,setLoading]=useState(true);
  const [editing,setEditing]=useState(null);
  const [adding,setAdding]=useState(false);

  useEffect(()=>{
    supabase.from("hukum").select("*").order("id").then(({data})=>{if(data)setHukum(data);setLoading(false);});
  },[]);

  const fl=hukum.filter(d=>d.nama.toLowerCase().includes(q.toLowerCase())||(d.tentang||"").toLowerCase().includes(q.toLowerCase()));

  async function handleDelete(id){
    if(!confirm("Hapus peraturan ini?")) return;
    await supabase.from("hukum").delete().eq("id",id);
    setHukum(p=>p.filter(h=>h.id!==id));
  }

  return(
    <div className="inner" style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"flex",gap:8}}>
        <div style={{position:"relative",flex:1}}>
          <Search size={15} color={C.muted} style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}/>
          <input value={q} onChange={e=>setQ(e.target.value)} className="field" placeholder="Cari peraturan..." style={{paddingLeft:36}}/>
        </div>
        {isAdmin&&(
          <motion.button whileTap={{scale:.9}} onClick={()=>setAdding(true)}
            style={{height:46,padding:"0 16px",background:C.blue,color:"#FFFDF5",border:"none",borderRadius:10,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center"}}>
            <Plus size={20}/>
          </motion.button>
        )}
      </div>
      <div className="label">{hukum.length} peraturan</div>
      <div className="card">
        {loading?<Spinner/>:fl.length===0?<Empty text="Tidak ditemukan"/>:
          fl.map((d,i)=>(
            <motion.div key={d.id} className="t-row" whileTap={{scale:.99}} whileHover={{background:C.bg2}}
              onClick={()=>d.link?window.open(d.link,"_blank"):null}
              style={{cursor:d.link?"pointer":"default"}}>
              <div style={{width:36,height:36,borderRadius:8,background:C.blueL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{d.ikon||"📄"}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:700,color:C.light}}>{d.nama}</div>
                <div style={{fontSize:11,color:C.muted,marginTop:2,lineHeight:1.4}}>{d.tentang}</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                {d.link&&<div style={{display:"flex",alignItems:"center",gap:3}}><ExternalLink size={12} color={C.blue} strokeWidth={2}/><span style={{fontSize:10,color:C.blue,fontWeight:700}}>Buka</span></div>}
                {!d.link&&!isAdmin&&<ChevronRight size={16} color={C.muted} strokeWidth={1.8}/>}
                {isAdmin&&<>
                  <motion.button whileTap={{scale:.85}} onClick={e=>{e.stopPropagation();setEditing(d);}} style={{background:C.blueL,border:"none",borderRadius:7,padding:"4px 8px",fontSize:10,cursor:"pointer",color:C.blue,fontWeight:700,display:"flex",alignItems:"center",gap:3}}><Pencil size={10} strokeWidth={2}/> Edit</motion.button>
                  <motion.button whileTap={{scale:.85}} onClick={e=>{e.stopPropagation();handleDelete(d.id);}} style={{background:"transparent",border:"none",cursor:"pointer",color:C.muted,padding:"4px",display:"flex"}}><Trash2 size={14} strokeWidth={1.8}/></motion.button>
                </>}
              </div>
            </motion.div>
          ))
        }
      </div>
      {isAdmin&&adding&&<AddHukumSheet onAdd={item=>{setHukum(p=>[...p,item]);setAdding(false);}} onClose={()=>setAdding(false)}/>}
      {isAdmin&&editing&&<EditHukumSheet item={editing} onSave={u=>setHukum(p=>p.map(h=>h.id===u.id?u:h))} onClose={()=>setEditing(null)}/>}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   ABOUT TAB — logo tengah + logo di setiap SIMPLER
══════════════════════════════════════════════════ */
function AboutTab(){
  const menus=[
    {icon:"📊",title:"Status RTR",desc:"Dashboard utama yang memuat informasi progres penyelesaian RTRWN, RTR KSN, RZ KAW, dan RTRWP. Pengguna dapat melihat status penyelesaian masing-masing rencana sesuai dengan tahapannya."},
    {icon:"📄",title:"Produk Hukum",desc:"Daftar Rencana Tata Ruang Laut yang telah mendapatkan penetapan baik berupa PP, Perpres, maupun Perda. Pengguna dapat mengakses file produk RTR melalui tautan yang tersedia."},
    {icon:"⚖️",title:"Dasar Hukum",desc:"Daftar peraturan perundangan yang terkait dengan perencanaan ruang laut. Pengguna dapat mengakses file peraturan melalui tautan yang tersedia pada menu ini."},
  ];
  return(
    <div className="inner" style={{display:"flex",flexDirection:"column",gap:16}}>

      {/* Hero card — logo ditengah */}
      <div className="card" style={{padding:"32px 20px",textAlign:"center"}}>
        <div style={{display:"flex",justifyContent:"center",marginBottom:16}}>
          <img src="/simpler-logo.jpg" alt="SIMPLER Logo"
            style={{width:96,height:96,borderRadius:22,objectFit:"contain",background:"#fff",border:"2px solid "+C.line,boxShadow:"0 4px 20px rgba(54,76,132,0.15)"}}
            onError={e=>{e.target.style.display="none";}}/>
        </div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:4}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:28,fontWeight:800,color:C.blue,letterSpacing:"-.01em"}}>SIMPLER</div>
        </div>
        <div style={{fontSize:11,color:C.muted,letterSpacing:".06em",textTransform:"uppercase",lineHeight:1.6}}>
          Sistem Informasi Monitoring Penyelesaian<br/>Penataan Ruang Laut
        </div>
        <div style={{marginTop:16,padding:"10px 16px",background:C.blueL,borderRadius:10,display:"inline-block"}}>
          <div style={{fontSize:11,color:C.blue,fontWeight:700}}>Deputi Bidang Koordinasi Sumber Daya Maritim</div>
          <div style={{fontSize:11,color:C.soft,marginTop:2}}>Kemenko Bidang Kemaritiman dan Investasi</div>
        </div>
      </div>

      <div className="card" style={{padding:"16px"}}>
        <div className="label" style={{marginBottom:10}}>Tentang Aplikasi</div>
        <div style={{fontSize:13,color:C.soft,lineHeight:1.8}}>
          <span style={{display:"inline-flex",alignItems:"center",gap:5,verticalAlign:"middle"}}>
            <SimplerLogo size={16}/>
            <strong style={{color:C.light}}>SIMPLER</strong>
          </span>{" "}
          adalah sebuah aplikasi yang berfungsi sebagai <strong style={{color:C.light}}>dashboard monitoring progres penyelesaian perencanaan ruang laut</strong> yang diinisiasi oleh Deputi Bidang Koordinasi Sumber Daya Maritim, Kementerian Koordinator Bidang Kemaritiman dan Investasi.
        </div>
        <div style={{marginTop:10,fontSize:13,color:C.soft,lineHeight:1.8}}>
          Aplikasi{" "}
          <span style={{display:"inline-flex",alignItems:"center",gap:4,verticalAlign:"middle"}}>
            <SimplerLogo size={14}/>
            <strong style={{color:C.light}}>SIMPLER</strong>
          </span>{" "}
          terdiri dari beberapa menu yaitu: <strong style={{color:C.light}}>Status RTR, Produk Hukum, Dasar Hukum, dan Tentang</strong>.
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
                <KatIcon k={k} size={20} bg={false}/>
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
      onLogin(data.user);onClose();
    }catch(e){setErr("Email atau password salah.");}
    finally{setLoading(false);}
  }

  return(
    <Sheet onClose={onClose} title="Login Admin">
      <div style={{padding:"16px",display:"flex",flexDirection:"column",gap:12}}>
        <div style={{padding:"12px 14px",background:C.blueL,borderRadius:10,fontSize:13,color:C.blue,lineHeight:1.5}}>
          🔐 Halaman ini khusus untuk admin yang berwenang mengedit data SIMPLER.
        </div>
        <div><div className="label" style={{marginBottom:6}}>Email</div><input value={email} onChange={e=>setEmail(e.target.value)} className="field" placeholder="admin@email.com" type="email"/></div>
        <div><div className="label" style={{marginBottom:6}}>Password</div><input value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} className="field" placeholder="••••••••" type="password"/></div>
        {err&&<div style={{fontSize:13,color:C.rose,fontWeight:600,padding:"8px 12px",background:C.roseL,borderRadius:8,display:"flex",alignItems:"center",gap:6}}><TriangleAlert size={14}/>{err}</div>}
      </div>
      <div style={{padding:"0 16px calc(16px + env(safe-area-inset-bottom))",display:"flex",gap:10}}>
        <motion.button whileTap={{scale:.97}} className="btn-ghost" onClick={onClose} style={{flex:1}}>Batal</motion.button>
        <motion.button whileTap={{scale:.97}} className="btn-primary" onClick={handleLogin} style={{flex:2,opacity:loading?.7:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><Lock size={14}/>{loading?"Masuk...":"Masuk"}</motion.button>
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
  const [dbSort,setDbSort]=useState("nama-asc");
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

  const filteredDb=useMemo(()=>{
    let d=data.filter(e=>{
      const mq=e.nama.toLowerCase().includes(dbSearch.toLowerCase())||e.kategori.toLowerCase().includes(dbSearch.toLowerCase());
      const mk=dbKat==="Semua"||e.kategori===dbKat;
      const p=calcP(e);
      const ms=dbSt==="Semua"||(dbSt==="Selesai"&&p===100)||(dbSt==="Proses"&&p>0&&p<100)||(dbSt==="Belum"&&p===0);
      return mq&&mk&&ms;
    });
    d=[...d].sort((a,b)=>{
      if(dbSort==="nama-asc") return a.nama.localeCompare(b.nama);
      if(dbSort==="nama-desc") return b.nama.localeCompare(a.nama);
      if(dbSort==="progress-desc") return calcP(b)-calcP(a);
      if(dbSort==="progress-asc") return calcP(a)-calcP(b);
      return 0;
    });
    return d;
  },[data,dbSearch,dbKat,dbSt,dbSort]);

  /* ── ADMIN DASHBOARD ── */
  if(showDb&&isAdmin) return(
    <>
      <GS/>
      <div className="app-wrap fade-in">
        <div style={{height:"env(safe-area-inset-top,0px)",background:C.bg}}/>
        {/* Topbar */}
        <div className="topbar">
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <motion.button whileTap={{scale:.88}} className="btn-icon" onClick={()=>setShowDb(false)} style={{color:C.blue,background:C.blueL}}>
              <ArrowLeft size={18} strokeWidth={2}/>
            </motion.button>
            <div className="topbar-logo">
              <SimplerLogo size={28}/>
              <span style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:800,color:C.blue}}>Dashboard Admin</span>
            </div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <motion.button whileTap={{scale:.9}} className="btn-icon" onClick={()=>exportCSV(data)} style={{color:C.blue}}><Download size={15} strokeWidth={2}/></motion.button>
            <motion.button whileTap={{scale:.95}} onClick={()=>setAdding(true)} style={{height:36,padding:"0 14px",background:C.blue,color:"#FFFDF5",border:"none",borderRadius:10,fontSize:13,fontWeight:800,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}><Plus size={14}/> Tambah</motion.button>
            <motion.button whileTap={{scale:.9}} onClick={handleLogout} style={{height:36,padding:"0 12px",background:C.roseL,color:C.rose,border:"none",borderRadius:10,fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}><LogOut size={13}/> Keluar</motion.button>
          </div>
        </div>

        {/* Filter bar — sticky, tidak menutup card */}
        <div className="admin-filter">
          <div style={{display:"flex",gap:8,marginBottom:8}}>
            <div style={{position:"relative",flex:1}}>
              <Search size={14} color={C.muted} style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}/>
              <input value={dbSearch} onChange={e=>setDbSearch(e.target.value)} className="field" placeholder="Cari kawasan..." style={{paddingLeft:32,height:38,fontSize:13}}/>
            </div>
            <select value={dbSort} onChange={e=>setDbSort(e.target.value)} className="field" style={{width:"auto",height:38,fontSize:12,paddingLeft:10,paddingRight:10,flexShrink:0}}>
              <option value="nama-asc">A–Z</option>
              <option value="nama-desc">Z–A</option>
              <option value="progress-desc">Progress ↓</option>
              <option value="progress-asc">Progress ↑</option>
            </select>
          </div>
          <div className="scroll-x" style={{marginBottom:6}}>
            {["Semua",...KATEGORI].map(k=>{const on=dbKat===k;const ks=KS[k];return <button key={k} className={"pill"+(on?" on":"")} onClick={()=>setDbKat(k)} style={on&&ks?{background:ks.c,borderColor:ks.c,color:"#FFFDF5"}:{}}>{k}</button>;})}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div className="scroll-x" style={{flex:1}}>
              {["Semua","✓ Selesai","◑ Proses","○ Belum"].map((s,i)=>{const val=["Semua","Selesai","Proses","Belum"][i];const on=dbSt===val;return <button key={val} className={"pill"+(on?" on":"")} onClick={()=>setDbSt(val)}>{s}</button>;})}
            </div>
            <span style={{fontSize:11,color:C.muted,fontWeight:600,flexShrink:0,whiteSpace:"nowrap"}}>{filteredDb.length} entri</span>
          </div>
        </div>

        {/* Cards — padding atas sudah dari .admin-content */}
        <div className="content no-nav">
          <div className="admin-content">
            {loading?<Spinner/>:(
              <div className="card-grid">
                {filteredDb.map((e,i)=>{
                  const p=calcP(e);const ks=KS[e.kategori];
                  const next=e.steps.find(s=>getStepState(s.status)!=="Selesai");
                  return(
                    <motion.div key={e.id} className="entry-card"
                      initial={{opacity:0,scale:.97}} animate={{opacity:1,scale:1}} transition={{delay:Math.min(i*0.03,.3),duration:.25}}
                      whileHover={{y:-2,boxShadow:"0 6px 20px rgba(54,76,132,0.14)"}} whileTap={{scale:.98}}
                      onClick={()=>setDetail(e)}>
                      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10,marginBottom:10}}>
                        <div style={{flex:1,minWidth:0}}><KatChip k={e.kategori}/><div style={{fontSize:14,fontWeight:800,color:C.light,marginTop:6,lineHeight:1.3}}>{e.nama}</div></div>
                        <div style={{position:"relative",flexShrink:0}}>
                          <CircProgress p={p} color={ks.c} size={40} stroke={3}/>
                          <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:8,fontWeight:800,color:p===100?ks.c:C.soft}}>{p}%</span></div>
                        </div>
                      </div>
                      <StepDots steps={e.steps}/>
                      {next&&<div style={{marginTop:6,fontSize:10,color:C.muted,display:"flex",alignItems:"center",gap:3}}><ChevronRight size={10} strokeWidth={2}/>{next.nama}</div>}
                    </motion.div>
                  );
                })}
                {filteredDb.length===0&&!loading&&<div style={{gridColumn:"1/-1"}}><Empty/></div>}
              </div>
            )}
          </div>
        </div>

        {detail&&!editing&&<DetailSheet entry={detail} onEdit={()=>{setEditing(detail);setDetail(null);}} onClose={()=>setDetail(null)}/>}
        {editing&&<EditSheet entry={editing} onSave={updateEntry} onClose={()=>setEditing(null)}/>}
        {adding&&<AddSheet onAdd={addEntry} onClose={()=>setAdding(false)}/>}
      </div>
    </>
  );

  const titles={home:"SIMPLER",status:"Status RTR",produk:"Produk Hukum",hukum:"Dasar Hukum",tentang:"Tentang SIMPLER"};
  const rightBtn=isAdmin
    ?<div style={{display:"flex",gap:6,alignItems:"center"}}>
        <motion.button whileTap={{scale:.9}} className="btn-icon" onClick={()=>setShowDb(true)} style={{color:C.blue,background:C.blueL}}><Settings size={16} strokeWidth={2}/></motion.button>
        <motion.button whileTap={{scale:.9}} onClick={handleLogout} style={{height:32,padding:"0 10px",background:C.roseL,color:C.rose,border:"none",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}><LogOut size={13}/> Keluar</motion.button>
      </div>
    :<motion.button whileTap={{scale:.95}} onClick={()=>setShowLogin(true)} style={{height:32,padding:"0 12px",background:C.blueL,color:C.blue,border:"1px solid "+C.line2,borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}><Lock size={13}/> Admin</motion.button>;

  return(
    <>
      <GS/>
      <div className="app-wrap">
        <div style={{height:"env(safe-area-inset-top,0px)",background:C.bg}}/>
        <div className="topbar">
          <div className="topbar-logo">
            <SimplerLogo size={28}/>
            <span style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:800,color:C.blue,letterSpacing:".02em"}}>{titles[tab]}</span>
          </div>
          {rightBtn}
        </div>
        <div className="content">
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:.25,ease:[.16,1,.3,1]}} style={{height:"100%"}}>
              {tab==="home"&&<HomeTab data={data} loading={loading} onGoStatus={k=>{setStatusKat(k);setTab("status");}} onGoDb={isAdmin?()=>setShowDb(true):null}/>}
              {tab==="status"&&<StatusTab data={data} loading={loading} initKat={statusKat}/>}
              {tab==="produk"&&<ProdukTab data={data} loading={loading}/>}
              {tab==="hukum"&&<HukumTab isAdmin={isAdmin}/>}
              {tab==="tentang"&&<AboutTab/>}
            </motion.div>
          </AnimatePresence>
        </div>
        <NavBar active={tab} onTab={t=>{setTab(t);setStatusKat(null);}}/>
      </div>
      {showLogin&&<LoginSheet onLogin={u=>setUser(u)} onClose={()=>setShowLogin(false)}/>}
    </>
  );
}
