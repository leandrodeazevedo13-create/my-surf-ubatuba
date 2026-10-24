
import { useState, useEffect } from "react";
type Cam = { id: string; praia: string; label: string; liveUrl: string; plataforma: "youtube" | "instagram"; };
const PRAIAS = ["Itamambuca","Vermelha do Norte","Vermelha do Centro","Félix","Prumirim","Toninhas","Tenório","Praia Grande","Perequê Açú","Domingas Dias","Sununga"];
export default function Adm(){
  const [cams,setCams]=useState<Cam[]>(()=>{const s=localStorage.getItem("ms-ubatuba-cams-v3"); return s?JSON.parse(s):[];});
  const [praia,setPraia]=useState(PRAIAS[2]);
  const [url,setUrl]=useState("");
  const [plataforma,setPlataforma]=useState<"youtube"|"instagram">("youtube");
  const [label,setLabel]=useState("");
  useEffect(()=>{localStorage.setItem("ms-ubatuba-cams-v3",JSON.stringify(cams));},[cams]);
  const add=()=>{if(!url){alert("Cola a URL!"); return;} const nova:Cam={id:Date.now().toString(),praia,label:label||`${praia.toUpperCase()} - AO VIVO`,liveUrl:url,plataforma}; setCams([nova,...cams]); setUrl(""); setLabel("");};
  const remove=(id:string)=>setCams(cams.filter(c=>c.id!==id));
  const limpar=()=>{if(confirm("Limpar todas as lives?")){setCams([]); localStorage.removeItem("ms-ubatuba-cams-v3");}};
  return (
    <div className="min-h-screen bg-[#f4f5e8] p-6"><div className="max-w-3xl mx-auto"><div className="flex justify-between items-center mb-6"><h1 className="font-black text-xl">🛡️ Adm - Lives (limpo - só seu)</h1><div className="flex gap-2"><button onClick={limpar} className="px-3 py-2 rounded-full bg-red-100 text-red-700 text-xs font-bold">🧹 Limpar tudo</button><a href="/" className="px-4 py-2 rounded-full bg-slate-900 text-white text-sm font-bold">← Voltar</a></div></div>
      <div className="bg-white rounded-[20px] border p-6 shadow-sm"><h2 className="font-bold mb-2">Adicionar live - YouTube ou Instagram - aparece automático no App</h2>
        <div className="grid grid-cols-2 gap-3"><div><label className="text-[11px] font-bold">Praia</label><select value={praia} onChange={e=>setPraia(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm mt-1">{PRAIAS.map(p=><option key={p}>{p}</option>)}</select></div><div><label className="text-[11px] font-bold">Plataforma</label><select value={plataforma} onChange={e=>setPlataforma(e.target.value as any)} className="w-full rounded-lg border px-3 py-2 text-sm mt-1"><option value="youtube">YouTube</option><option value="instagram">Instagram</option></select></div></div>
        <div className="mt-3"><label className="text-[11px] font-bold">Título</label><input value={label} onChange={e=>setLabel(e.target.value)} placeholder="Ex: VERMELHA DO CENTRO - AO VIVO" className="w-full rounded-lg border px-3 py-2 text-sm mt-1"/></div>
        <div className="mt-3"><label className="text-[11px] font-bold text-red-600">URL *</label><input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://youtube.com/watch?v=... ou IG" className="w-full rounded-lg border-2 border-red-200 bg-red-50 px-3 py-3 text-sm mt-1"/></div>
        <button onClick={add} className="w-full mt-4 rounded-full bg-red-600 text-white font-bold py-3">➕ Adicionar</button>
      </div>
      <div className="bg-white rounded-[20px] border p-6 shadow-sm mt-6"><h2 className="font-bold mb-3">Lives cadastradas ({cams.length}) - só estas aparecem no App, quadro azul só aparece se tiver live</h2><div className="space-y-2">{cams.map(c=><div key={c.id} className="flex justify-between items-center p-3 border rounded-xl"><div><p className="font-bold text-sm">{c.label} - {c.praia}</p><p className="text-xs opacity-60 truncate">{c.plataforma.toUpperCase()} - {c.liveUrl}</p></div><button onClick={()=>remove(c.id)} className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs">Remover</button></div>)}{cams.length===0 && <p className="text-xs opacity-60">Nenhuma live. Está limpo como pediu. Quadro azul não aparece no App até você adicionar.</p>}</div></div>
    </div></div>
  );
}
