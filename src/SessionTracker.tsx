import { useState, useRef } from "react";
type Session = { id: string; data: string; remada: number; ondas: number; velMax: number; duracao: number; tamanho: string; };
export default function SessionTracker(){
  const [running,setRunning]=useState(false);
  const [remada,setRemada]=useState(0);
  const [ondas,setOndas]=useState(0);
  const [vel,setVel]=useState(0);
  const [velMax,setVelMax]=useState(0);
  const [tempo,setTempo]=useState(0);
  const [status,setStatus]=useState("Parado");
  const [permissao,setPermissao]=useState(false);
  const [historico,setHistorico]=useState<Session[]>(()=>{const s=localStorage.getItem("ms-ubatuba-sessions"); return s?JSON.parse(s):[];});
  const [dropTime,setDropTime]=useState(0);
  const [tamanhoEst,setTamanhoEst]=useState("meio metrinho");
  const watchId=useRef<number|null>(null);
  const lastPos=useRef<{lat:number,lng:number,time:number}|null>(null);
  const intervalRef=useRef<number|null>(null);
  const stateRef=useRef<"remando"|"dropando"|"surfando">("remando");
  const ondaStartRef=useRef<number>(0);
  const haversine = (a:{lat:number,lng:number}, b:{lat:number,lng:number})=>{
    const R=6371e3; const toRad=(d:number)=>d*Math.PI/180;
    const dLat=toRad(b.lat-a.lat); const dLng=toRad(b.lng-a.lng);
    const x=Math.sin(dLat/2)**2 + Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLng/2)**2;
    return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
  };
  const estimarTamanho = (vMax:number, dropT:number)=>{
    if(vMax<15 && dropT<0.9) return "meio metrinho maralzinho";
    if(vMax<20 && dropT<1.3) return "quase 1m glass";
    if(vMax<25 && dropT<1.7) return "1 metrinho cavado";
    return "1,5m pressão!";
  };
  const pedirPermissao = async ()=>{
    try{
      if((DeviceMotionEvent as any).requestPermission){
        const r = await (DeviceMotionEvent as any).requestPermission();
        if(r!=="granted") return;
      }
      setPermissao(true);
    }catch{ setPermissao(true); }
  };
  const iniciar = ()=>{
    setRunning(true); setRemada(0); setOndas(0); setVel(0); setVelMax(0); setTempo(0); setStatus("Remando...");
    lastPos.current=null; stateRef.current="remando"; ondaStartRef.current=0;
    if(navigator.geolocation){
      watchId.current = navigator.geolocation.watchPosition((pos)=>{
        const cur={lat:pos.coords.latitude,lng:pos.coords.longitude,time:Date.now()};
        const speed = pos.coords.speed ? pos.coords.speed*3.6 : 0;
        setVel(Math.round(speed*10)/10);
        if(speed>velMax) setVelMax(Math.round(Math.max(velMax,speed)*10)/10);
        if(lastPos.current){
          const dist = haversine(lastPos.current,cur);
          if(dist<50){
            if(speed<6) setRemada(r=>r+dist);
            if(stateRef.current==="remando" && speed>10){
              stateRef.current="dropando"; ondaStartRef.current=Date.now();
            }
            if(stateRef.current==="dropando" && speed>10){
              const dropDur = (Date.now()-ondaStartRef.current)/1000;
              if(dropDur>1){
                stateRef.current="surfando"; ondaStartRef.current=Date.now();
                setStatus("Na onda!");
              }
            }
            if(stateRef.current==="surfando" && speed<6){
              const surfDur = (Date.now()-ondaStartRef.current)/1000;
              if(surfDur>2){
                setOndas(o=>o+1);
                setTamanhoEst(estimarTamanho(speed,dropTime));
              }
              stateRef.current="remando"; setStatus("Remando...");
            }
          }
        }
        lastPos.current=cur;
      }, (e)=>{console.log(e);}, {enableHighAccuracy:true, maximumAge:0, timeout:5000});
    }
    intervalRef.current = window.setInterval(()=>{ setTempo(t=>t+1); },1000) as any;
    const onMotion=(e:DeviceMotionEvent)=>{
      const acc=e.accelerationIncludingGravity;
      if(!acc) return;
      const mag = Math.sqrt((acc.x||0)**2+(acc.y||0)**2+(acc.z||0)**2);
      if(mag>24){
        setDropTime(d=>d+0.1);
        if(stateRef.current==="remando"){
          stateRef.current="dropando"; ondaStartRef.current=Date.now();
        }
      }
    };
    window.addEventListener("devicemotion", onMotion);
    (window as any)._motionHandler=onMotion;
  };
  const finalizar=()=>{
    setRunning(false);
    if(watchId.current!==null) navigator.geolocation.clearWatch(watchId.current);
    if(intervalRef.current) clearInterval(intervalRef.current);
    window.removeEventListener("devicemotion",(window as any)._motionHandler);
    const sessao:Session={ id:Date.now().toString(), data:new Date().toISOString(), remada:Math.round(remada), ondas, velMax, duracao:tempo, tamanho:tamanhoEst };
    const novo=[sessao,...historico].slice(0,20);
    setHistorico(novo);
    localStorage.setItem("ms-ubatuba-sessions",JSON.stringify(novo));
  };
  const simular=()=>{
    setRunning(true); setTempo(0);
    let r=0,o=0,vm=0;
    const id=setInterval(()=>{
      r+=Math.random()*8; 
      const v=Math.random()*25;
      vm=Math.max(vm,v);
      setRemada(rr=>rr+Math.random()*8);
      setVel(Math.round(v*10)/10);
      setVelMax(Math.round(vm*10)/10);
      setTempo(t=>t+1);
      if(Math.random()>0.85){ o++; setOndas(o); setStatus("Na onda!"); setTimeout(()=>setStatus("Remando..."),800); }
      if(r>1200){ clearInterval(id); finalizar(); }
    },300);
  };
  const copiarParaApp=()=>{
    const texto = `vermelhinha do centro ${tamanhoEst} - ${ondas} ondas, ${Math.round(remada)}m remados, ${velMax} km/h máx - por relógio ⌚`;
    navigator.clipboard.writeText(texto);
    alert("Copiado! Cola no My Surf Ubatuba: "+texto);
  };
  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-mono">
      <div className="bg-[#111] border-b border-white/10 px-4 py-2 flex justify-between items-center">
        <span className="font-black text-[11px] tracking-widest">SESSION TRACKER • APARTE</span>
        <span className="text-[9px] bg-green-500 text-black px-2 py-0.5 rounded-full">{permissao?"GPS+MOTION OK":"SEM PERMISSÃO"}</span>
      </div>
      {!permissao && (
        <div className="p-4">
          <button onClick={pedirPermissao} className="w-full py-4 rounded-2xl bg-white text-black font-black text-sm">📱 Permitir GPS + Movimento</button>
          <p className="text-[10px] opacity-60 mt-2 text-center">Precisa permitir pra contar remada e ondas</p>
        </div>
      )}
      <div className="flex-1 flex flex-col items-center justify-center p-4 gap-4">
        <div className="w-full max-w-[320px] bg-[#1a1a1a] rounded-[24px] border border-white/10 p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-black rounded-xl p-3 border border-white/5"><p className="text-[8px] opacity-50">REMADA</p><p className="text-[20px] font-black text-[#7ee0a0]">{Math.round(remada)}<span className="text-[10px]">m</span></p></div>
            <div className="bg-black rounded-xl p-3 border border-white/5"><p className="text-[8px] opacity-50">ONDAS</p><p className="text-[20px] font-black text-[#ffcc00]">{ondas}</p></div>
            <div className="bg-black rounded-xl p-3 border border-white/5"><p className="text-[8px] opacity-50">VEL ATUAL</p><p className="text-[18px] font-black">{vel}<span className="text-[9px]"> km/h</span></p></div>
            <div className="bg-black rounded-xl p-3 border border-white/5"><p className="text-[8px] opacity-50">VEL MAX</p><p className="text-[18px] font-black text-[#5bb8e3]">{velMax}<span className="text-[9px]"> km/h</span></p></div>
          </div>
          <div className="mt-3 bg-black rounded-xl p-3 border border-white/5">
            <p className="text-[8px] opacity-50">STATUS • {Math.floor(tempo/60)}:{(tempo%60).toString().padStart(2,"0")}</p>
            <p className="text-[12px] font-bold mt-1">{status} • {tamanhoEst}</p>
            <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden"><div className="h-full bg-green-500 transition-all" style={{width: Math.min(100,(vel/30)*100)+"%",}}></div></div>
          </div>
        </div>
        <div className="w-full max-w-[320px] flex gap-2">
          {!running ? (
            <>
              <button onClick={iniciar} className="flex-1 py-4 rounded-full bg-[#22c55e] text-black font-black text-[14px]">▶ INICIAR SESSÃO</button>
              <button onClick={simular} className="px-4 py-4 rounded-full bg-white/10 border border-white/20 text-[10px] font-bold">SIMULAR</button>
            </>
          ) : (
            <button onClick={finalizar} className="flex-1 py-4 rounded-full bg-red-500 text-white font-black text-[14px] animate-pulse">■ FINALIZAR • {Math.floor(tempo/60)}:{(tempo%60).toString().padStart(2,"0")}</button>
          )}
        </div>
        {historico.length>0 && !running && (
          <div className="w-full max-w-[320px] bg-[#111] rounded-2xl border border-white/10 p-3">
            <p className="font-black text-[10px] mb-2">ÚLTIMA SESSÃO • {tamanhoEst}</p>
            <p className="text-[11px]">Você surfou {Math.round(remada)}m, {ondas} ondas, {velMax} km/h máx</p>
            <div className="flex gap-2 mt-3">
              <button onClick={copiarParaApp} className="flex-1 py-2 rounded-full bg-[#ffcc00] text-black font-black text-[10px]">📋 COPIAR PRO APP PRINCIPAL</button>
              <button onClick={()=>{localStorage.removeItem("ms-ubatuba-sessions"); setHistorico([]);}} className="px-3 py-2 rounded-full bg-white/10 text-[10px]">Limpar</button>
            </div>
          </div>
        )}
        <div className="w-full max-w-[320px] mt-2">
          <p className="text-[9px] opacity-40 text-center">App separado • Não mistura com My Surf Ubatuba principal<br/>GPS + Acelerômetro + Giroscópio • 100% offline</p>
        </div>
      </div>
    </div>
  );
}
