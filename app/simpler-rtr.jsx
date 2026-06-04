"use client";
import { useState, useMemo, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

/* ══════════════════════════════════════════════════
   DESIGN TOKENS
══════════════════════════════════════════════════ */
const C = {
  bg:      "#F2F4F8",
  surface: "#FFFFFF",
  card:    "#FFFFFF",
  border:  "#E8ECF2",
  border2: "#D0D8E4",
  text:    "#0F1923",
  sub:     "#5A6475",
  muted:   "#9BA5B4",
  blue:    "#1A73E8",
  blue2:   "#1557B0",
  blueL:   "#E8F0FD",
  teal:    "#00A896",
  tealL:   "#E0F7F5",
  gold:    "#F59E0B",
  goldL:   "#FEF3C7",
  rose:    "#EF4444",
  roseL:   "#FEE2E2",
  violet:  "#7C3AED",
  violetL: "#EDE9FE",
  green:   "#10B981",
  greenL:  "#D1FAE5",
};

const KS = {
  "RZ KAW":  { c:C.teal,   l:C.tealL,   icon:"🌊", label:"Rencana Zonasi Kawasan Antarwilayah" },
  "RTR KSN": { c:C.gold,   l:C.goldL,   icon:"📍", label:"RTR Kawasan Strategis Nasional" },
  "RTRWP":   { c:C.rose,   l:C.roseL,   icon:"🏛️", label:"RTR Wilayah Provinsi" },
  "RTRWN":   { c:C.violet, l:C.violetL, icon:"🗺️", label:"RTR Wilayah Nasional" },
};

const ST = {
  Selesai: { c:C.green,  l:C.greenL,  ic:"✓" },
  Proses:  { c:C.gold,   l:C.goldL,   ic:"⟳" },
  Belum:   { c:C.rose,   l:C.roseL,   ic:"✕" },
};

const KATEGORI = ["RZ KAW","RTR KSN","RTRWP","RTRWN"];
const TAHAPAN = {
  "RZ KAW":  ["Pembentukan PAK","Dokumen Awal","Dokumen Antara","Dokumen Final","Legal Drafting","Pembahasan PAK","Harmonisasi","Penetapan Perpres"],
  "RTR KSN": ["Materi Teknis Ruang Darat & Perairan","Integrasi Muatan Materi Teknis","Persetujuan Substansi","Rapat PAK","Harmonisasi","Permohonan Paraf K/L","Penetapan Perpres"],
  "RTRWP":   ["Materi Teknis Ruang Darat & Laut","Proses Integrasi","Validasi KLHS","Pembahasan Ranperda di DPRD","Lintas Sektor","Persetujuan Substansi","Persetujuan DPRD","Evaluasi Dagri","Penetapan Perda"],
  "RTRWN":   ["Penyusunan Materi Teknis RTRL & RTRWN","Integrasi Muatan Materi Teknis","Sinkronisasi Muatan RTRWN","Penyusunan RPP RTRWN","Penyusunan Dokumen KLHS","Penetapan Peraturan Pemerintah"],
};

/* ══════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════ */
const calcP = e => {
  if (!e.steps || e.steps.length === 0) return 0;
  return Math.round(e.steps.filter(s => s.status === "Selesai").length / e.steps.length * 100);
};

// Convert Supabase flat data to app format
function formatEntry(entry, allSteps) {
  const steps = (allSteps || [])
    .filter(s => s.entry_id === entry.id)
    .sort((a, b) => a.urutan - b.urutan)
    .map(s => ({
      id: s.id,
      nama: s.nama,
      status: s.status || "Belum",
      tanggal: s.tanggal || "",
      keterangan: s.keterangan || "",
    }));
  return {
    id: entry.id,
    nama: entry.nama,
    kategori: entry.kategori,
    produk: entry.produk || "",
    link_produk: entry.link_produk || "",
    steps,
  };
}

function exportCSV(data) {
  const maxS = Math.max(...data.map(d => d.steps.length));
  const hdr = ["ID","Nama","Kategori","Progress (%)","Produk","Link Produk",
    ...Array.from({length:maxS},(_,i) => ["T"+(i+1)+" Nama","T"+(i+1)+" Status","T"+(i+1)+" Tanggal","T"+(i+1)+" Keterangan"]).flat()];
  const rows = data.map(d => {
    const b = [d.id,d.nama,d.kategori,calcP(d),d.produk,d.link_produk];
    const s = [];
    for (let i = 0; i < maxS; i++) {
      const t = d.steps[i];
      if (t) s.push(t.nama,t.status,t.tanggal,t.keterangan);
      else s.push("","","","");
    }
    return [...b,...s];
  });
  const csv = [hdr,...rows].map(r => r.map(c => '"'+String(c).replace(/"/g,'""')+'"').join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
  a.download = "data_rtr.csv";
  a.click();
}

/* ══════════════════════════════════════════════════
   GLOBAL STYLES
══════════════════════════════════════════════════ */
const GS = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    html,body{font-family:'Nunito',sans-serif;background:${C.bg};color:${C.text};-webkit-text-size-adjust:100%;overscroll-behavior:none;}
    ::-webkit-scrollbar{width:0;height:0;}
    input,select,button,textarea{font-family:'Nunito',sans-serif;}
    @keyframes slideUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    @keyframes pop{0%{transform:scale(.92);opacity:0}100%{transform:scale(1);opacity:1}}
    @keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
    @keyframes spin{to{transform:rotate(360deg)}}
    .app-enter{animation:fadeIn .25s ease both;}
    .t-row{display:flex;align-items:center;gap:14px;padding:14px 16px;cursor:pointer;background:${C.surface};transition:background .12s;-webkit-tap-highlight-color:transparent;}
    .t-row:active{background:#F0F4FF;}
    .t-row+.t-row{border-top:1px solid ${C.border};}
    .app-card{background:${C.card};border-radius:16px;box-shadow:0 1px 4px rgba(0,0,0,0.06),0 4px 16px rgba(0,0,0,0.04);overflow:hidden;-webkit-tap-highlight-color:transparent;}
    .entry-card{background:${C.card};border-radius:16px;padding:16px;box-shadow:0 1px 4px rgba(0,0,0,0.06),0 4px 16px rgba(0,0,0,0.04);cursor:pointer;transition:transform .15s ease,box-shadow .15s ease;-webkit-tap-highlight-color:transparent;}
    .entry-card:active{transform:scale(.98);box-shadow:0 1px 4px rgba(0,0,0,.04);}
    .chip{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:99px;font-size:11px;font-weight:700;}
    .icon-box{display:flex;align-items:center;justify-content:center;border-radius:14px;flex-shrink:0;}
    .sheet{position:fixed;bottom:0;left:0;right:0;background:${C.surface};border-radius:24px 24px 0 0;max-height:90vh;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 -8px 40px rgba(0,0,0,0.15);animation:sheetUp .32s cubic-bezier(.16,1,.3,1) both;z-index:100;}
    .sheet-handle{width:36px;height:4px;border-radius:2px;background:${C.border2};margin:10px auto 0;}
    .overlay{position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:99;animation:fadeIn .2s ease;}
    .field{width:100%;padding:13px 16px;background:${C.bg};border:1.5px solid ${C.border};border-radius:12px;font-size:16px;color:${C.text};outline:none;transition:border-color .15s;-webkit-appearance:none;}
    .field:focus{border-color:${C.blue};}
    .field::placeholder{color:${C.muted};}
    .btn-primary{width:100%;padding:14px;border:none;border-radius:14px;background:${C.blue};color:#fff;font-size:15px;font-weight:800;cursor:pointer;transition:opacity .15s;-webkit-tap-highlight-color:transparent;}
    .btn-primary:active{opacity:.85;}
    .btn-ghost{padding:10px 18px;border:1.5px solid ${C.border2};border-radius:12px;background:transparent;color:${C.sub};font-size:14px;font-weight:700;cursor:pointer;-webkit-tap-highlight-color:transparent;}
    .btn-ghost:active{background:${C.bg};}
    .btn-icon{display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:12px;border:none;background:${C.bg};cursor:pointer;font-size:18px;-webkit-tap-highlight-color:transparent;transition:background .12s;}
    .btn-icon:active{background:${C.border};}
    .pill{padding:8px 16px;border-radius:99px;font-size:12px;font-weight:700;border:1.5px solid ${C.border};background:${C.surface};color:${C.sub};cursor:pointer;white-space:nowrap;transition:all .15s;-webkit-tap-highlight-color:transparent;}
    .pill.on{background:${C.blue};border-color:${C.blue};color:#fff;}
    .nav-bar{position:fixed;bottom:0;left:0;right:0;background:rgba(255,255,255,0.95);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-top:1px solid ${C.border};display:flex;align-items:center;justify-content:space-around;padding:8px 0 calc(8px + env(safe-area-inset-bottom));z-index:50;}
    .nav-item{display:flex;flex-direction:column;align-items:center;gap:3px;padding:6px 14px;cursor:pointer;border-radius:12px;transition:background .12s;-webkit-tap-highlight-color:transparent;min-width:60px;}
    .nav-label{font-size:10px;font-weight:700;letter-spacing:.01em;}
    .pbar-track{background:${C.border};border-radius:99px;overflow:hidden;}
    .pbar-fill{height:100%;border-radius:99px;transition:width .6s cubic-bezier(.4,0,.2,1);}
    .step-item{display:flex;align-items:flex-start;gap:12px;padding:12px 16px;}
    .step-item+.step-item{border-top:1px solid ${C.border};}
    .scroll-x{display:flex;gap:8px;overflow-x:auto;padding:2px 1px;}
    .scroll-x::-webkit-scrollbar{height:0;}
    .card-grid{display:grid;gap:12px;grid-template-columns:1fr;}
    @media(min-width:480px){.card-grid{grid-template-columns:1fr 1fr;}}
    @media(min-width:800px){.card-grid{grid-template-columns:repeat(3,1fr);}}
    @media(min-width:1080px){.card-grid{grid-template-columns:repeat(4,1fr);}}
    .sec-label{font-size:11px;font-weight:800;color:${C.muted};letter-spacing:.08em;text-transform:uppercase;}
    .pb-safe{padding-bottom:calc(72px + env(safe-area-inset-bottom));}
    .spinner{width:32px;height:32px;border:3px solid ${C.border};border-top-color:${C.blue};border-radius:50%;animation:spin .7s linear infinite;}
  `}</style>
);

/* ══════════════════════════════════════════════════
   ATOMS
══════════════════════════════════════════════════ */
function PBar({p,color,h=6}){
  return(
    <div className="pbar-track" style={{height:h}}>
      <div className="pbar-fill" style={{width:p+"%",background:color,height:"100%"}}/>
    </div>
  );
}

function KatChip({k,size="sm"}){
  const ks=KS[k];
  const pad = size==="sm"?"3px 9px":"5px 12px";
  const fs  = size==="sm"?10:12;
  return(
    <span className="chip" style={{background:ks.l,color:ks.c,padding:pad,fontSize:fs}}>
      <span style={{fontSize:fs+2}}>{ks.icon}</span>{k}
    </span>
  );
}

function StChip({st}){
  const s=ST[st]||ST["Belum"];
  return(
    <span className="chip" style={{background:s.l,color:s.c,padding:"3px 9px",fontSize:10}}>
      {s.ic} {st}
    </span>
  );
}

function IconBox({emoji,color,size=44}){
  return(
    <div className="icon-box" style={{width:size,height:size,background:color,fontSize:size*.45}}>
      {emoji}
    </div>
  );
}

function Spinner(){
  return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"60px 20px"}}>
      <div className="spinner"/>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SHEET
══════════════════════════════════════════════════ */
function Sheet({children,onClose,title}){
  return(
    <>
      <div className="overlay" onClick={onClose}/>
      <div className="sheet">
        <div className="sheet-handle"/>
        {title&&(
          <div style={{padding:"14px 20px 0",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{fontSize:17,fontWeight:800,color:C.text}}>{title}</div>
            <button className="btn-icon" onClick={onClose} style={{fontSize:16}}>✕</button>
          </div>
        )}
        <div style={{overflowY:"auto",flex:1}}>{children}</div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════
   NAV BAR
══════════════════════════════════════════════════ */
const NAV_ITEMS = [
  {id:"home",   emoji:"🏠", label:"Beranda"},
  {id:"status", emoji:"📊", label:"Status RTR"},
  {id:"produk", emoji:"📄", label:"Produk"},
  {id:"hukum",  emoji:"⚖️", label:"Dasar Hukum"},
];

function NavBar({active,onTab}){
  return(
    <div className="nav-bar">
      {NAV_ITEMS.map(n=>{
        const on=active===n.id;
        return(
          <div key={n.id} className="nav-item" onClick={()=>onTab(n.id)}>
            <div style={{fontSize:22,filter:on?"":"grayscale(1) opacity(.5)"}}>{n.emoji}</div>
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
function AppShell({title,children,rightBtn,onBack,tab,onTab,hideNav}){
  return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column"}} className="app-enter">
      <div style={{height:"env(safe-area-inset-top,0px)",background:C.surface}}/>
      <div style={{background:C.surface,padding:"0 16px",height:56,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:40,borderBottom:"1px solid "+C.border}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {onBack&&(
            <button className="btn-icon" onClick={onBack} style={{fontSize:20,color:C.blue}}>←</button>
          )}
          <div style={{fontSize:18,fontWeight:800,color:C.text}}>{title}</div>
        </div>
        {rightBtn&&rightBtn}
      </div>
      <div style={{flex:1,overflowY:"auto"}} className={hideNav?"":"pb-safe"}>
        {children}
      </div>
      {!hideNav&&tab&&<NavBar active={tab} onTab={onTab}/>}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   DETAIL SHEET
══════════════════════════════════════════════════ */
function DetailSheet({entry,onEdit,onClose}){
  const p=calcP(entry);const ks=KS[entry.kategori];
  return(
    <Sheet onClose={onClose}>
      <div style={{padding:"20px 20px 16px",borderBottom:"1px solid "+C.border}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12}}>
          <div style={{flex:1}}>
            <KatChip k={entry.kategori} size="md"/>
            <div style={{fontSize:21,fontWeight:800,color:C.text,marginTop:8,lineHeight:1.25}}>{entry.nama}</div>
          </div>
          <div style={{textAlign:"right",flexShrink:0}}>
            <div style={{fontSize:30,fontWeight:900,color:p===100?ks.c:C.blue,lineHeight:1}}>{p}%</div>
            <div style={{fontSize:11,color:C.muted,marginTop:2}}>{entry.steps.filter(s=>s.status==="Selesai").length}/{entry.steps.length} tahap</div>
          </div>
        </div>
        <div style={{marginTop:14}}><PBar p={p} color={ks.c} h={8}/></div>
        {entry.produk&&(
          <div style={{marginTop:12,padding:"10px 14px",background:ks.l,borderRadius:12,display:"flex",alignItems:"center",gap:8,cursor:entry.link_produk?"pointer":"default"}}
            onClick={()=>entry.link_produk&&window.open(entry.link_produk,"_blank")}>
            <span style={{fontSize:16}}>🔗</span>
            <span style={{fontSize:13,fontWeight:700,color:ks.c}}>{entry.produk}</span>
            {entry.link_produk&&<span style={{fontSize:11,color:ks.c,marginLeft:"auto"}}>Buka →</span>}
          </div>
        )}
      </div>
      <div style={{padding:"16px 20px 8px"}}>
        <div className="sec-label" style={{marginBottom:10}}>Tahapan Penetapan</div>
      </div>
      <div className="app-card" style={{margin:"0 16px",borderRadius:16}}>
        {entry.steps.map((s,i)=>(
          <div key={i} className="step-item">
            <div style={{width:28,height:28,borderRadius:99,background:ST[s.status]?.l||ST.Belum.l,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:13,color:ST[s.status]?.c||ST.Belum.c,fontWeight:800}}>{i+1}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:600,color:C.text,lineHeight:1.4}}>{s.nama}</div>
              {s.keterangan&&<div style={{fontSize:11,color:C.muted,marginTop:2}}>{s.keterangan}</div>}
              {s.tanggal&&<div style={{fontSize:11,color:C.blue,fontWeight:600,marginTop:2}}>📅 {s.tanggal}</div>}
            </div>
            <StChip st={s.status}/>
          </div>
        ))}
      </div>
      <div style={{padding:"16px 16px calc(16px + env(safe-area-inset-bottom))",display:"flex",gap:10}}>
        <button className="btn-ghost" onClick={onClose} style={{flex:1}}>Tutup</button>
        <button className="btn-primary" onClick={onEdit} style={{flex:2,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
          <span>✏️</span> Edit Data
        </button>
      </div>
    </Sheet>
  );
}

/* ══════════════════════════════════════════════════
   EDIT SHEET — saves to Supabase
══════════════════════════════════════════════════ */
function EditSheet({entry,onSave,onClose}){
  const [f,setF]=useState(JSON.parse(JSON.stringify(entry)));
  const [saving,setSaving]=useState(false);
  const ks=KS[f.kategori];

  async function handleSave(){
    setSaving(true);
    try{
      // Update entry
      await supabase.from("entries").update({
        produk: f.produk,
        link_produk: f.link_produk,
        updated_at: new Date().toISOString(),
      }).eq("id",f.id);

      // Update each step
      for(const step of f.steps){
        await supabase.from("steps").update({
          status: step.status,
          tanggal: step.tanggal,
          keterangan: step.keterangan,
        }).eq("id",step.id);
      }
      onSave(f);
      onClose();
    }catch(err){
      alert("Gagal menyimpan: "+err.message);
    }finally{
      setSaving(false);
    }
  }

  const ss=(i,k,v)=>setF(p=>{const s=[...p.steps];s[i]={...s[i],[k]:v};return{...p,steps:s};});

  return(
    <Sheet onClose={onClose} title={"Edit — "+f.nama}>
      <div style={{padding:"16px"}}>
        <div className="sec-label" style={{marginBottom:8}}>Produk Hukum</div>
        <input value={f.produk} onChange={e=>setF(p=>({...p,produk:e.target.value}))}
          className="field" placeholder="cth: Perpres No 40 Tahun 2022" style={{marginBottom:10}}/>
        <div className="sec-label" style={{marginBottom:8}}>Link Google Drive (PDF)</div>
        <input value={f.link_produk} onChange={e=>setF(p=>({...p,link_produk:e.target.value}))}
          className="field" placeholder="https://drive.google.com/file/d/..." style={{marginBottom:20}}/>
        <div className="sec-label" style={{marginBottom:10}}>Tahapan</div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {f.steps.map((step,i)=>(
            <div key={i} className="app-card" style={{padding:"14px 16px"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                <div style={{width:24,height:24,borderRadius:99,background:ks.l,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:ks.c,flexShrink:0}}>{i+1}</div>
                <div style={{fontSize:13,fontWeight:700,color:C.text,lineHeight:1.3}}>{step.nama}</div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                <div>
                  <div className="sec-label" style={{marginBottom:5}}>Status</div>
                  <select value={step.status} onChange={e=>ss(i,"status",e.target.value)} className="field" style={{cursor:"pointer"}}>
                    {["Belum","Proses","Selesai"].map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <div className="sec-label" style={{marginBottom:5}}>Tanggal</div>
                  <input value={step.tanggal} onChange={e=>ss(i,"tanggal",e.target.value)} className="field" placeholder="cth: 15 Mei 2023"/>
                </div>
              </div>
              <div className="sec-label" style={{marginBottom:5}}>Keterangan</div>
              <input value={step.keterangan} onChange={e=>ss(i,"keterangan",e.target.value)} className="field" placeholder="Keterangan tambahan..."/>
            </div>
          ))}
        </div>
      </div>
      <div style={{padding:"12px 16px calc(16px + env(safe-area-inset-bottom))",display:"flex",gap:10}}>
        <button className="btn-ghost" onClick={onClose} style={{flex:1}}>Batal</button>
        <button className="btn-primary" onClick={handleSave} style={{flex:2,opacity:saving?0.7:1}}>
          {saving?"Menyimpan...":"Simpan Perubahan"}
        </button>
      </div>
    </Sheet>
  );
}

/* ══════════════════════════════════════════════════
   ADD SHEET — saves to Supabase
══════════════════════════════════════════════════ */
function AddSheet({onAdd,onClose}){
  const [kat,setKat]=useState("RZ KAW");
  const [nama,setNama]=useState("");
  const [saving,setSaving]=useState(false);

  async function handleAdd(){
    if(!nama.trim()) return;
    setSaving(true);
    try{
      // Insert entry
      const {data:entry,error:entryErr} = await supabase
        .from("entries")
        .insert({nama:nama.trim(), kategori:kat, produk:"", link_produk:""})
        .select().single();
      if(entryErr) throw entryErr;

      // Insert steps
      const tahapan = TAHAPAN[kat];
      const stepsToInsert = tahapan.map((t,i)=>({
        entry_id: entry.id,
        urutan: i+1,
        nama: t,
        status: "Belum",
        tanggal: "",
        keterangan: "",
      }));
      const {error:stepsErr} = await supabase.from("steps").insert(stepsToInsert);
      if(stepsErr) throw stepsErr;

      const newEntry = {
        ...entry,
        steps: stepsToInsert.map((s,i)=>({...s, id:null, nama:s.nama, status:"Belum", tanggal:"", keterangan:""})),
      };
      onAdd(newEntry);
      onClose();
    }catch(err){
      alert("Gagal menambah entri: "+err.message);
    }finally{
      setSaving(false);
    }
  }

  return(
    <Sheet onClose={onClose} title="Tambah Kawasan Baru">
      <div style={{padding:"16px",display:"flex",flexDirection:"column",gap:14}}>
        <div>
          <div className="sec-label" style={{marginBottom:8}}>Kategori RTR</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {KATEGORI.map(k=>{
              const ks=KS[k];const on=kat===k;
              return(
                <div key={k} onClick={()=>setKat(k)}
                  style={{padding:"12px",borderRadius:14,border:"2px solid "+(on?ks.c:C.border),
                    background:on?ks.l:C.surface,cursor:"pointer",transition:"all .15s",textAlign:"center"}}>
                  <div style={{fontSize:22,marginBottom:4}}>{ks.icon}</div>
                  <div style={{fontSize:11,fontWeight:800,color:on?ks.c:C.sub}}>{k}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div>
          <div className="sec-label" style={{marginBottom:8}}>Nama Kawasan / Provinsi</div>
          <input value={nama} onChange={e=>setNama(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&handleAdd()}
            className="field" placeholder="Masukkan nama..."/>
        </div>
      </div>
      <div style={{padding:"0 16px calc(16px + env(safe-area-inset-bottom))"}}>
        <button className="btn-primary" onClick={handleAdd} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,opacity:saving?0.7:1}}>
          {saving?"Menambahkan...":"➕ Tambah Entri"}
        </button>
      </div>
    </Sheet>
  );
}

/* ══════════════════════════════════════════════════
   HOME TAB
══════════════════════════════════════════════════ */
function HomeTab({data,loading,onGoStatus,onGoDb}){
  const totalDone=data.filter(d=>calcP(d)===100).length;
  const totalProses=data.filter(d=>{const p=calcP(d);return p>0&&p<100;}).length;
  const overallPct=data.length?Math.round(totalDone/data.length*100):0;
  const recent=[...data].sort((a,b)=>calcP(b)-calcP(a)).slice(0,3);

  return(
    <div style={{padding:"16px",display:"flex",flexDirection:"column",gap:16}}>
      {/* hero card */}
      <div style={{background:"linear-gradient(135deg,#1A73E8 0%,#0D47A1 100%)",borderRadius:24,padding:"24px 20px",color:"#fff",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",right:-30,top:-30,width:120,height:120,borderRadius:"50%",background:"rgba(255,255,255,0.08)"}}/>
        <div style={{position:"absolute",right:20,bottom:-40,width:180,height:180,borderRadius:"50%",background:"rgba(255,255,255,0.05)"}}/>
        <div style={{position:"relative",zIndex:1}}>
          <div style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.7)",letterSpacing:".1em",textTransform:"uppercase",marginBottom:4}}>Sistem Informasi Monitoring</div>
          <div style={{fontSize:28,fontWeight:900,lineHeight:1.2,marginBottom:4}}>SIMPLER</div>
          <div style={{fontSize:13,color:"rgba(255,255,255,0.8)",marginBottom:20}}>Penyelesaian Penataan Ruang Laut</div>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
            <div style={{flex:1,background:"rgba(255,255,255,0.2)",borderRadius:99,height:8,overflow:"hidden"}}>
              <div style={{width:overallPct+"%",height:"100%",background:"#fff",borderRadius:99,transition:"width .6s ease"}}/>
            </div>
            <span style={{fontSize:15,fontWeight:900}}>{overallPct}%</span>
          </div>
          <div style={{fontSize:12,color:"rgba(255,255,255,0.75)"}}>{totalDone} dari {data.length} entri telah ditetapkan</div>
        </div>
      </div>

      {/* quick stats */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
        {[
          {emoji:"✅",val:totalDone,label:"Ditetapkan",bg:C.greenL,c:C.green},
          {emoji:"⏳",val:totalProses,label:"Dalam Proses",bg:C.goldL,c:C.gold},
          {emoji:"📋",val:data.length,label:"Total Entri",bg:C.blueL,c:C.blue},
        ].map((s,i)=>(
          <div key={i} className="app-card" style={{padding:"14px 12px",textAlign:"center"}}>
            <div style={{fontSize:22,marginBottom:4}}>{s.emoji}</div>
            <div style={{fontSize:22,fontWeight:900,color:s.c,lineHeight:1}}>{s.val}</div>
            <div style={{fontSize:10,color:C.muted,marginTop:3,fontWeight:600}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* per-kategori */}
      <div>
        <div className="sec-label" style={{marginBottom:10}}>Progress per Kategori</div>
        <div className="app-card">
          {loading?<Spinner/>:KATEGORI.map((k,i)=>{
            const ks=KS[k];
            const es=data.filter(d=>d.kategori===k);
            const done=es.filter(d=>calcP(d)===100).length;
            const p=es.length?Math.round(done/es.length*100):0;
            return(
              <div key={k} onClick={()=>onGoStatus(k)}
                style={{padding:"14px 16px",display:"flex",alignItems:"center",gap:14,cursor:"pointer",borderBottom:i<3?"1px solid "+C.border:"none",transition:"background .12s"}}
                onMouseEnter={e=>e.currentTarget.style.background=C.bg}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <IconBox emoji={ks.icon} color={ks.l} size={42}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                    <span style={{fontSize:13,fontWeight:700,color:C.text}}>{k}</span>
                    <span style={{fontSize:12,fontWeight:800,color:ks.c}}>{done}/{es.length}</span>
                  </div>
                  <PBar p={p} color={ks.c} h={5}/>
                </div>
                <span style={{color:C.muted,fontSize:16}}>›</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* recent */}
      {recent.length>0&&(
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div className="sec-label">Terbaru Ditetapkan</div>
            <button onClick={onGoDb} style={{fontSize:12,fontWeight:700,color:C.blue,background:"none",border:"none",cursor:"pointer"}}>Lihat Semua →</button>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {recent.map(e=>{
              const p=calcP(e);const ks=KS[e.kategori];
              return(
                <div key={e.id} className="app-card" style={{padding:"14px 16px",display:"flex",alignItems:"center",gap:14}}>
                  <IconBox emoji={ks.icon} color={ks.l} size={44}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:700,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.nama}</div>
                    <KatChip k={e.kategori}/>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontSize:16,fontWeight:900,color:p===100?ks.c:C.blue}}>{p}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* about */}
      <div>
        <div className="sec-label" style={{marginBottom:10}}>Tentang Aplikasi</div>
        <div className="app-card" style={{padding:"16px"}}>
          <div style={{fontSize:14,color:C.sub,lineHeight:1.75}}>
            SIMPLER adalah dashboard monitoring progres penyelesaian perencanaan ruang laut yang diinisiasi oleh <strong style={{color:C.text}}>Deputi Bidang Koordinasi Sumber Daya Maritim</strong>, Kementerian Koordinator Bidang Kemaritiman dan Investasi.
          </div>
          <div style={{marginTop:12,display:"flex",gap:8,flexWrap:"wrap"}}>
            {["RZ KAW","RTR KSN","RTRWP","RTRWN"].map(k=><KatChip key={k} k={k} size="md"/>)}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   STATUS TAB
══════════════════════════════════════════════════ */
function StatusTab({data,loading,initKat}){
  const [kat,setKat]=useState(initKat||null);
  const [detail,setDetail]=useState(null);
  const [editing,setEditing]=useState(null);
  const [localData,setLocalData]=useState(null);

  const displayData = localData||data;

  useEffect(()=>{ setKat(initKat||null); },[initKat]);

  if(!kat) return(
    <div style={{padding:"16px",display:"flex",flexDirection:"column",gap:12}}>
      <div className="app-card" style={{padding:"16px"}}>
        <div className="sec-label" style={{marginBottom:12}}>Progres Rencana Tata Ruang</div>
        {loading?<Spinner/>:[
          {kat:"RTRWN",label:"PP RTRWN",max:1},
          {kat:"RTR KSN",label:"Perpres RTR KSN",max:28},
          {kat:"RZ KAW",label:"Perpres RZ KAW",max:20},
          {kat:"RTRWP",label:"Perda RTRWP",max:38},
        ].map(({kat:k,label,max})=>{
          const done=displayData.filter(d=>d.kategori===k&&calcP(d)===100).length;
          const p=Math.round(done/max*100);
          const ks=KS[k];
          return(
            <div key={k} style={{marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                <span style={{fontSize:13,fontWeight:600,color:C.text}}>{label}</span>
                <span style={{fontSize:12,fontWeight:700,color:ks.c}}>{done}/{max}</span>
              </div>
              <PBar p={p} color={ks.c} h={7}/>
            </div>
          );
        })}
      </div>
      <div className="sec-label" style={{marginBottom:4}}>Pilih Kategori</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        {KATEGORI.map(k=>{
          const ks=KS[k];
          const es=displayData.filter(d=>d.kategori===k);
          const done=es.filter(d=>calcP(d)===100).length;
          const p=es.length?Math.round(done/es.length*100):0;
          return(
            <div key={k} className="app-card" onClick={()=>setKat(k)}
              style={{padding:"18px 16px",cursor:"pointer"}}>
              <div style={{fontSize:36,marginBottom:8}}>{ks.icon}</div>
              <KatChip k={k} size="md"/>
              <div style={{marginTop:10}}>
                <div style={{fontSize:24,fontWeight:900,color:ks.c,lineHeight:1}}>{done}<span style={{fontSize:13,color:C.muted,fontWeight:500}}>/{es.length}</span></div>
                <div style={{marginTop:6}}><PBar p={p} color={ks.c} h={4}/></div>
                <div style={{fontSize:11,color:C.muted,marginTop:4,fontWeight:600}}>ditetapkan</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const entries=displayData.filter(d=>d.kategori===kat);
  const ks=KS[kat];

  return(
    <div style={{padding:"16px",display:"flex",flexDirection:"column",gap:12}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <button className="btn-icon" onClick={()=>setKat(null)} style={{color:C.blue,fontSize:20}}>←</button>
        <KatChip k={kat} size="md"/>
        <div style={{fontSize:13,fontWeight:700,color:C.sub,marginLeft:"auto"}}>{entries.length} kawasan</div>
      </div>
      {loading?<Spinner/>:entries.map(e=>{
        const p=calcP(e);
        const next=e.steps.find(s=>s.status!=="Selesai");
        return(
          <div key={e.id} className="entry-card" onClick={()=>setDetail(e)}>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10,marginBottom:10}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:15,fontWeight:800,color:C.text,lineHeight:1.3}}>{e.nama}</div>
                {e.produk&&<div style={{fontSize:11,color:ks.c,fontWeight:600,marginTop:3}}>🔗 {e.produk}</div>}
              </div>
              <div style={{fontSize:20,fontWeight:900,color:p===100?ks.c:C.blue,flexShrink:0}}>{p}%</div>
            </div>
            <PBar p={p} color={ks.c} h={5}/>
            <div style={{display:"flex",gap:2,marginTop:8}}>
              {e.steps.map((s,i)=><div key={i} style={{flex:1,height:4,borderRadius:2,background:s.status==="Selesai"?ks.c:s.status==="Proses"?C.gold:C.border}}/>)}
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8}}>
              <span style={{fontSize:11,color:C.muted}}>{e.steps.filter(s=>s.status==="Selesai").length}/{e.steps.length} tahap</span>
              {next&&<span style={{fontSize:10,color:C.sub,maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>⏭ {next.nama}</span>}
            </div>
          </div>
        );
      })}
      {detail&&<DetailSheet entry={detail}
        onEdit={()=>{setEditing(detail);setDetail(null);}}
        onClose={()=>setDetail(null)}/>}
      {editing&&<EditSheet entry={editing}
        onSave={(updated)=>{
          setLocalData(prev=>(prev||displayData).map(e=>e.id===updated.id?updated:e));
          setDetail(null);
        }}
        onClose={()=>setEditing(null)}/>}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   PRODUK TAB
══════════════════════════════════════════════════ */
function ProdukTab({data,loading}){
  const [q,setQ]=useState("");
  const items=data.filter(d=>d.produk&&(d.nama.toLowerCase().includes(q.toLowerCase())||d.produk.toLowerCase().includes(q.toLowerCase())));
  return(
    <div style={{padding:"16px",display:"flex",flexDirection:"column",gap:12}}>
      <div style={{position:"relative"}}>
        <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:16,color:C.muted}}>🔍</span>
        <input value={q} onChange={e=>setQ(e.target.value)} className="field" placeholder="Cari produk hukum..." style={{paddingLeft:40}}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {KATEGORI.map(k=>{
          const ks=KS[k];
          const cnt=data.filter(d=>d.kategori===k&&d.produk).length;
          return(
            <div key={k} className="app-card" style={{padding:"14px 16px",display:"flex",alignItems:"center",gap:12}}>
              <IconBox emoji={ks.icon} color={ks.l} size={40}/>
              <div>
                <div style={{fontSize:20,fontWeight:900,color:ks.c,lineHeight:1}}>{cnt}</div>
                <div style={{fontSize:10,fontWeight:700,color:C.muted,marginTop:2}}>{k}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="sec-label" style={{marginBottom:4}}>Daftar Produk</div>
      <div className="app-card">
        {loading?<Spinner/>:items.length===0?
          <div style={{padding:"24px",textAlign:"center",color:C.muted,fontSize:14}}>Tidak ada produk ditemukan</div>:
          items.map((d,i)=>{
            const ks=KS[d.kategori];
            return(
              <div key={d.id} className="t-row"
                onClick={()=>d.link_produk&&window.open(d.link_produk,"_blank")}
                style={{cursor:d.link_produk?"pointer":"default"}}>
                <IconBox emoji={ks.icon} color={ks.l} size={40}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.nama}</div>
                  <div style={{fontSize:12,color:ks.c,fontWeight:600,marginTop:2}}>{d.produk}</div>
                </div>
                {d.link_produk&&<span style={{color:C.blue,fontSize:16,flexShrink:0}}>↗</span>}
              </div>
            );
          })
        }
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   DASAR HUKUM TAB
══════════════════════════════════════════════════ */
const HUKUM=[
  {nama:"UU No. 26 Tahun 2007",tentang:"Tentang Penataan Ruang",ikon:"📜"},
  {nama:"UU No. 27 Tahun 2007",tentang:"Tentang Pengelolaan Wilayah Pesisir dan Pulau-Pulau Kecil",ikon:"🏖️"},
  {nama:"UU No. 32 Tahun 2014",tentang:"Tentang Kelautan",ikon:"⚓"},
  {nama:"UU No. 6 Tahun 2023",tentang:"Tentang Penetapan PP Pengganti UU No. 2 Tahun 2022 (Cipta Kerja)",ikon:"📋"},
  {nama:"PP No. 26 Tahun 2008",tentang:"Tentang Rencana Tata Ruang Wilayah Nasional",ikon:"🗺️"},
  {nama:"PP No. 32 Tahun 2019",tentang:"Tentang Rencana Tata Ruang Laut",ikon:"🌊"},
  {nama:"PP No. 21 Tahun 2021",tentang:"Tentang Penyelenggaraan Penataan Ruang",ikon:"🏛️"},
  {nama:"Permen ATR/KBPN No. 10 Tahun 2021",tentang:"Pedoman Penyusunan, Peninjauan Kembali, dan Revisi RTR",ikon:"📐"},
  {nama:"Permen ATR/KBPN No. 11 Tahun 2021",tentang:"Tata Cara Penyusunan dan Penerbitan Persetujuan Substansi RTR",ikon:"✅"},
];

function HukumTab(){
  const [q,setQ]=useState("");
  const fl=HUKUM.filter(d=>d.nama.toLowerCase().includes(q.toLowerCase())||d.tentang.toLowerCase().includes(q.toLowerCase()));
  return(
    <div style={{padding:"16px",display:"flex",flexDirection:"column",gap:12}}>
      <div style={{position:"relative"}}>
        <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:16,color:C.muted}}>🔍</span>
        <input value={q} onChange={e=>setQ(e.target.value)} className="field" placeholder="Cari peraturan..." style={{paddingLeft:40}}/>
      </div>
      <div className="app-card">
        {fl.map((d,i)=>(
          <div key={i} className="t-row">
            <div className="icon-box" style={{width:44,height:44,background:C.blueL,fontSize:20,borderRadius:12}}>{d.ikon}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:700,color:C.text}}>{d.nama}</div>
              <div style={{fontSize:12,color:C.muted,marginTop:2,lineHeight:1.4}}>{d.tentang}</div>
            </div>
            <span style={{color:C.muted,fontSize:16,flexShrink:0}}>›</span>
          </div>
        ))}
        {fl.length===0&&<div style={{padding:"24px",textAlign:"center",color:C.muted,fontSize:14}}>Tidak ditemukan</div>}
      </div>
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

  // Fetch data from Supabase
  const fetchData = useCallback(async()=>{
    setLoading(true);
    try{
      const {data:entries,error:eErr} = await supabase
        .from("entries").select("*").order("nama");
      if(eErr) throw eErr;

      const {data:steps,error:sErr} = await supabase
        .from("steps").select("*").order("urutan");
      if(sErr) throw sErr;

      const formatted = entries.map(e=>formatEntry(e,steps));
      setData(formatted);
    }catch(err){
      console.error("Error fetching data:",err);
    }finally{
      setLoading(false);
    }
  },[]);

  useEffect(()=>{ fetchData(); },[fetchData]);

  function updateEntry(updated){
    setData(prev=>prev.map(e=>e.id===updated.id?updated:e));
  }

  function addEntry(newEntry){
    setData(prev=>[...prev,newEntry]);
    fetchData(); // refresh to get proper IDs
  }

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
      <AppShell title="Dashboard" hideNav
        onBack={()=>setShowDb(false)}
        rightBtn={
          <div style={{display:"flex",gap:8}}>
            <button className="btn-icon" onClick={()=>exportCSV(data)} title="Export CSV">⬇️</button>
            <button className="btn-icon" onClick={()=>setAdding(true)}
              style={{background:C.blue,color:"#fff",fontSize:20}}>+</button>
          </div>
        }>
        {/* filters */}
        <div style={{padding:"12px 16px",background:C.surface,borderBottom:"1px solid "+C.border}}>
          <div style={{position:"relative",marginBottom:10}}>
            <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:16,color:C.muted}}>🔍</span>
            <input value={dbSearch} onChange={e=>setDbSearch(e.target.value)} className="field" placeholder="Cari kawasan..." style={{paddingLeft:40}}/>
          </div>
          <div className="scroll-x">
            {["Semua",...KATEGORI].map(k=>{
              const on=dbKat===k;const ks=KS[k];
              return <button key={k} className={"pill"+(on?" on":"")} onClick={()=>setDbKat(k)}
                style={on&&ks?{background:ks.c,borderColor:ks.c}:{}}>{on&&ks?ks.icon+" ":""}{k}</button>;
            })}
          </div>
          <div className="scroll-x" style={{marginTop:8}}>
            {["Semua","✅ Selesai","⏳ Proses","❌ Belum"].map((s,i)=>{
              const val=["Semua","Selesai","Proses","Belum"][i];
              const on=dbSt===val;
              return <button key={val} className={"pill"+(on?" on":"")} onClick={()=>setDbSt(val)}>{s}</button>;
            })}
            <span style={{marginLeft:4,fontSize:12,color:C.muted,alignSelf:"center",whiteSpace:"nowrap",fontWeight:600}}>{filteredDb.length} entri</span>
          </div>
        </div>
        {/* grid */}
        <div style={{padding:"16px"}}>
          {loading?<Spinner/>:(
            <div className="card-grid">
              {filteredDb.map(e=>{
                const p=calcP(e);const ks=KS[e.kategori];
                const next=e.steps.find(s=>s.status!=="Selesai");
                return(
                  <div key={e.id} className="entry-card" onClick={()=>setDetail(e)}>
                    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8,marginBottom:10}}>
                      <div style={{flex:1,minWidth:0}}>
                        <KatChip k={e.kategori}/>
                        <div style={{fontSize:15,fontWeight:800,color:C.text,marginTop:5,lineHeight:1.3}}>{e.nama}</div>
                      </div>
                      <div style={{fontSize:20,fontWeight:900,color:p===100?ks.c:C.blue,flexShrink:0}}>{p}%</div>
                    </div>
                    <PBar p={p} color={ks.c} h={5}/>
                    <div style={{display:"flex",gap:2,marginTop:7}}>
                      {e.steps.map((s,i)=><div key={i} style={{flex:1,height:3,borderRadius:2,background:s.status==="Selesai"?ks.c:s.status==="Proses"?C.gold:C.border}}/>)}
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:7}}>
                      <span style={{fontSize:10,color:C.muted,fontWeight:600}}>{e.steps.filter(s=>s.status==="Selesai").length}/{e.steps.length} tahap</span>
                      {next&&<span style={{fontSize:10,color:C.sub,maxWidth:150,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>⏭ {next.nama}</span>}
                    </div>
                  </div>
                );
              })}
              {filteredDb.length===0&&!loading&&(
                <div style={{gridColumn:"1/-1",textAlign:"center",padding:"60px 20px"}}>
                  <div style={{fontSize:48,marginBottom:12}}>🔍</div>
                  <div style={{fontSize:15,fontWeight:700,color:C.sub}}>Tidak ada entri</div>
                </div>
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

  // TAB VIEW
  const tabTitles={home:"SIMPLER",status:"Status RTR",produk:"Produk Hukum",hukum:"Dasar Hukum"};
  const dbBtn=(
    <button className="btn-icon" onClick={()=>setShowDb(true)} title="Dashboard & Edit" style={{fontSize:18}}>⚙️</button>
  );

  return(
    <>
      <GS/>
      <AppShell title={tabTitles[tab]} tab={tab} onTab={t=>{setTab(t);setStatusKat(null);}} rightBtn={dbBtn}>
        {tab==="home"&&<HomeTab data={data} loading={loading} onGoStatus={k=>{setStatusKat(k);setTab("status");}} onGoDb={()=>setShowDb(true)}/>}
        {tab==="status"&&<StatusTab data={data} loading={loading} initKat={statusKat}/>}
        {tab==="produk"&&<ProdukTab data={data} loading={loading}/>}
        {tab==="hukum"&&<HukumTab/>}
      </AppShell>
    </>
  );
}