"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { formatCPF, validateCPF } from "@/lib/cpf";

/* ── Types ─────────────────────────────────────── */
interface DebtResult {
  found: boolean; debtorId: number | null;
  name: string; cpf: string;
  amount: number; discountedAmount: number;
  description: string; status: string;
  discount: number; score: number; scoreAfterPay: number;
  checkoutUrl: string;
}
interface Cfg {
  companyName: string; companyLogo: string; logoHeight: number;
  primaryColor: string; secondaryColor: string;
  headerTitle: string; headerSubtitle: string;
  urgencyText: string; ctaText: string; footerText: string;
  bannerImages: string[];
}
const DEF: Cfg = {
  companyName:"NegociAI", companyLogo:"", logoHeight:44,
  primaryColor:"#6366f1", secondaryColor:"#8b5cf6",
  headerTitle:"Regularize sua situação financeira",
  headerSubtitle:"Quite sua dívida com até 60% de desconto",
  urgencyText:"Oferta por tempo limitado", ctaText:"Pagar via PIX",
  footerText:"Seus dados estão protegidos. Ambiente 100% seguro.",
  bannerImages:[],
};

/* ── Helpers ────────────────────────────────────── */
const BRL = (v:number) => v.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});

function useCountUp(to:number, ms=1600){
  const [v,setV]=useState(0);
  useEffect(()=>{
    let n=0; const step=to/(ms/16);
    const id=setInterval(()=>{n+=step; if(n>=to){setV(to);clearInterval(id);}else setV(Math.floor(n));},16);
    return()=>clearInterval(id);
  },[to,ms]);
  return v;
}

/* ── Countdown ──────────────────────────────────── */
function Countdown(){
  const [t,setT]=useState({h:1,m:47,s:23});
  useEffect(()=>{
    const id=setInterval(()=>setT(p=>{
      let{h,m,s}=p;
      if(--s<0){s=59;if(--m<0){m=59;if(--h<0)h=2;}}
      return{h,m,s};
    }),1000);
    return()=>clearInterval(id);
  },[]);
  const p=(n:number)=>String(n).padStart(2,"0");
  return <span className="font-mono font-bold tabular-nums" style={{color:"#f97316"}}>{p(t.h)}:{p(t.m)}:{p(t.s)}</span>;
}

/* ── Hero carousel ──────────────────────────────── */
function Hero({images,grad,children}:{images:string[];grad:string;children:React.ReactNode}){
  const [cur,setCur]=useState(0);
  const next=useCallback(()=>setCur(c=>(c+1)%images.length),[images.length]);
  useEffect(()=>{if(images.length<=1)return;const id=setInterval(next,5000);return()=>clearInterval(id);},[next,images.length]);
  const hasBanner=images.length>0;
  return(
    <section className="pub-hero">
      {/* Background */}
      {hasBanner?(
        <>
          {images.map((s,i)=>(
            <div key={i} className="pub-banner-slide" style={{backgroundImage:`url(${s})`,opacity:i===cur?1:0}}/>
          ))}
          <div className="pub-banner-overlay"/>
        </>
      ):(
        <>
          <div className="pub-hero-bg"/>
          <div className="pub-hero-mesh anim-mesh"/>
          <div className="pub-hero-grid"/>
        </>
      )}
      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col">{children}</div>
      {/* Carousel controls */}
      {images.length>1&&(
        <>
          <button onClick={()=>setCur(c=>(c-1+images.length)%images.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full flex items-center justify-center text-white text-lg transition-all"
            style={{background:"rgba(0,0,0,.35)",backdropFilter:"blur(8px)"}}>‹</button>
          <button onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full flex items-center justify-center text-white text-lg transition-all"
            style={{background:"rgba(0,0,0,.35)",backdropFilter:"blur(8px)"}}>›</button>
          <div className="absolute bottom-4 inset-x-0 flex justify-center gap-2 z-20">
            {images.map((_,i)=>(
              <button key={i} onClick={()=>setCur(i)}
                className="rounded-full transition-all duration-300"
                style={{width:i===cur?28:8,height:8,background:i===cur?"white":"rgba(255,255,255,.4)"}}/>
            ))}
          </div>
          <div className="absolute top-0 left-0 h-px w-full z-20" style={{background:"rgba(255,255,255,.12)"}}>
            <div key={cur} className="h-full" style={{background:"rgba(255,255,255,.5)",animation:"progress 5s linear forwards"}}/>
          </div>
        </>
      )}
    </section>
  );
}

/* ── Score Meter ────────────────────────────────── */
function ScoreMeter({score,afterPay,primaryColor}:{score:number;afterPay:number;primaryColor:string}){
  const [pct,setPct]=useState(0);
  const [showAfter,setShowAfter]=useState(false);
  const scorePct=Math.round((score/1000)*100);
  const afterPct=Math.round((afterPay/1000)*100);
  const numVal=useCountUp(score);
  const color=score<400?"#ef4444":score<600?"#f59e0b":"#22c55e";
  const label=score<400?"Crítico":score<600?"Regular":"Bom";
  useEffect(()=>{
    const t1=setTimeout(()=>setPct(scorePct),400);
    const t2=setTimeout(()=>setShowAfter(true),3200);
    return()=>{clearTimeout(t1);clearTimeout(t2);};
  },[scorePct]);
  return(
    <div>
      {/* Score number + label */}
      <div className="flex items-end gap-3 mb-4">
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{color:"#94a3b8",letterSpacing:".1em"}}>Score de Crédito</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-5xl font-black tracking-tight" style={{color,lineHeight:1}}>{numVal}</span>
            <span className="text-sm font-medium" style={{color:"#94a3b8"}}>/1000</span>
          </div>
        </div>
        <div className="mb-1 ml-auto">
          <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{background:color+"18",color}}>{label}</span>
        </div>
      </div>
      {/* Meter track */}
      <div className="relative mb-1">
        <div className="score-meter-track">
          <div className="score-meter-thumb" style={{left:`${pct}%`,color}}/>
        </div>
      </div>
      <div className="flex justify-between text-xs mt-1.5" style={{color:"#94a3b8"}}>
        <span>Crítico</span><span>Regular</span><span>Bom</span><span>Excelente</span>
      </div>
      {/* After pay preview */}
      <div className={`mt-4 rounded-xl p-4 transition-all duration-700 ${showAfter?"opacity-100":"opacity-0 translate-y-2"}`}
        style={{background:"linear-gradient(135deg,#f0fdf4,#dcfce7)",border:"1.5px solid #86efac"}}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold" style={{color:"#166534"}}>Após regularizar</span>
          <span className="text-xs font-black px-2 py-0.5 rounded-full" style={{background:"#16a34a",color:"white"}}>+{afterPay-score} pts</span>
        </div>
        <div className="flex items-baseline gap-1.5 mb-2">
          <span className="text-3xl font-black tracking-tight" style={{color:"#16a34a",lineHeight:1}}>{afterPay}</span>
          <span className="text-xs" style={{color:"#4ade80"}}>/1000 pontos</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{background:"rgba(34,197,94,.15)"}}>
          <div className="h-full rounded-full transition-all duration-[1600ms] ease-out" style={{width:`${showAfter?afterPct:0}%`,background:"#16a34a"}}/>
        </div>
        <p className="text-xs mt-2" style={{color:"#166534"}}>Desbloqueie crédito, financiamentos e taxas melhores</p>
      </div>
    </div>
  );
}

/* ── Main Page ──────────────────────────────────── */
export default function Page(){
  const [cfg,setCfg]=useState<Cfg>(DEF);
  const [name,setName]=useState("");
  const [cpf,setCpf]=useState("");
  const [cpfOk,setCpfOk]=useState<boolean|null>(null);
  const [loading,setLoading]=useState(false);
  const [result,setResult]=useState<DebtResult|null>(null);
  const [error,setError]=useState("");
  const resultRef=useRef<HTMLDivElement>(null);

  useEffect(()=>{
    fetch("/api/settings").then(r=>r.json()).then(d=>{
      const imgs=Array.isArray(d.bannerImages)?d.bannerImages:
        (typeof d.bannerImages==="string"?JSON.parse(d.bannerImages||"[]"):[]);
      setCfg(s=>({...s,...d,bannerImages:imgs,logoHeight:d.logoHeight??44}));
    }).catch(()=>{});
  },[]);

  function onCPF(v:string){
    const f=formatCPF(v);setCpf(f);
    const c=f.replace(/\D/g,"");
    setCpfOk(c.length===11?validateCPF(f):null);
  }

  async function onSubmit(e:React.FormEvent){
    e.preventDefault();setError("");
    if(!name.trim()||name.trim().length<3)return setError("Informe seu nome completo.");
    if(!validateCPF(cpf))return setError("CPF inválido. Verifique os dígitos.");
    setLoading(true);
    try{
      const res=await fetch("/api/consult",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,cpf})});
      const data=await res.json();
      if(!res.ok)setError(data.error||"Erro ao consultar.");
      else{setResult(data);setTimeout(()=>resultRef.current?.scrollIntoView({behavior:"smooth",block:"start"}),100);}
    }catch{setError("Erro de conexão. Tente novamente.");}
    finally{setLoading(false);}
  }

  async function onPay(){
    if(!result)return;
    fetch("/api/track",{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({name:result.name,cpf:result.cpf,event:"CLIQUE_PAGAMENTO",debtorId:result.debtorId})
    }).catch(()=>{});
    if(result.checkoutUrl)window.open(result.checkoutUrl,"_blank");
    else alert("Link de pagamento não configurado.");
  }

  const grad=`linear-gradient(135deg,${cfg.primaryColor} 0%,${cfg.secondaryColor} 100%)`;

  return(
    <div style={{background:"#F0F4F8",minHeight:"100vh"}}>

      {/* ── HERO ──────────────────────────────── */}
      <Hero images={cfg.bannerImages} grad={grad}>
        <div className="max-w-6xl mx-auto px-5 w-full flex flex-col h-full" style={{paddingTop:24,paddingBottom:80}}>

          {/* Navbar */}
          <nav className="flex items-center justify-between mb-auto pb-14">
            <div className="flex items-center gap-3">
              {cfg.companyLogo?(
                <img src={cfg.companyLogo} alt={cfg.companyName} className="object-contain" style={{height:cfg.logoHeight,filter:"drop-shadow(0 2px 8px rgba(0,0,0,.4))"}}/>
              ):(
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white shadow-lg text-sm" style={{background:grad}}>{cfg.companyName[0]}</div>
                  <span className="font-bold text-white text-lg tracking-tight">{cfg.companyName}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold text-white"
                style={{background:"rgba(255,255,255,.1)",backdropFilter:"blur(12px)",border:"1px solid rgba(255,255,255,.15)"}}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>Sistema Online
              </div>
              <div className="hidden md:flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold text-white"
                style={{background:"rgba(255,255,255,.1)",backdropFilter:"blur(12px)",border:"1px solid rgba(255,255,255,.15)"}}>
                <span>🔒</span>100% Seguro
              </div>
            </div>
          </nav>

          {/* Hero copy */}
          <div className="text-center max-w-2xl mx-auto">
            {/* Urgency pill */}
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-6 urgency-badge"
              style={{background:"rgba(249,115,22,.15)",border:"1px solid rgba(249,115,22,.35)"}}>
              <span className="w-2 h-2 rounded-full" style={{background:"#f97316",boxShadow:"0 0 6px #f97316"}}/>
              <span className="text-xs font-bold tracking-wide" style={{color:"#fed7aa"}}>{cfg.urgencyText.toUpperCase()}</span>
            </div>

            <h1 className="font-black text-white mb-4 anim-fade-up"
              style={{fontSize:"clamp(2rem,5vw,3.75rem)",lineHeight:1.05,letterSpacing:"-0.03em",
                textShadow:"0 2px 24px rgba(0,0,0,.5)"}}>
              {cfg.headerTitle}
            </h1>
            <p className="anim-fade-up-1 mb-10" style={{color:"rgba(255,255,255,.7)",fontSize:"1.1rem",lineHeight:1.6}}>
              {cfg.headerSubtitle}
            </p>

            {/* Stats strip */}
            <div className="grid grid-cols-3 gap-3 anim-fade-up-2">
              {[{v:"47.832+",l:"Dívidas regularizadas"},{v:"60%",l:"Desconto médio"},{v:"99,8%",l:"Aprovação imediata"}].map(s=>(
                <div key={s.l} className="stat-pill">
                  <p className="text-white font-black text-2xl tracking-tight">{s.v}</p>
                  <p className="text-xs mt-0.5" style={{color:"rgba(255,255,255,.5)"}}>{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Hero>

      {/* ── FORM CARD ─────────────────────────── */}
      <div className="max-w-lg mx-auto px-4" style={{marginTop:-56,position:"relative",zIndex:20}}>
        <div className="consult-card anim-scale-in">
          <div className="consult-card-bar" style={{background:grad}}/>
          <div className="p-7 md:p-8">
            <div className="mb-6">
              <h2 className="font-black text-gray-900" style={{fontSize:"1.2rem",letterSpacing:"-0.02em"}}>Consulte sua dívida</h2>
              <p className="text-sm mt-1" style={{color:"#94a3b8"}}>Rápido, gratuito e 100% seguro</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nome completo</label>
                <input type="text" value={name} onChange={e=>setName(e.target.value)}
                  placeholder="Ex: João Carlos Silva" autoComplete="off" className="input-field"
                  style={{borderColor:"#e2e8f0",background:"#fafbfc"}}/>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">CPF</label>
                <div className="relative">
                  <input type="text" value={cpf} onChange={e=>onCPF(e.target.value)}
                    placeholder="000.000.000-00" maxLength={14} autoComplete="off"
                    className="input-field"
                    style={{
                      borderColor:cpfOk===true?"#22c55e":cpfOk===false?"#ef4444":"#e2e8f0",
                      background:cpfOk===true?"#f0fdf4":cpfOk===false?"#fff5f5":"#fafbfc",
                      paddingRight:cpfOk!==null?44:undefined
                    }}/>
                  {cpfOk!==null&&(
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white"
                      style={{background:cpfOk?"#22c55e":"#ef4444"}}>
                      {cpfOk?"✓":"✗"}
                    </div>
                  )}
                </div>
                {cpfOk===false&&<p className="text-xs mt-1.5 font-medium" style={{color:"#ef4444"}}>CPF inválido. Verifique os dígitos.</p>}
              </div>

              {error&&(
                <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium"
                  style={{background:"#fff5f5",border:"1px solid #fecaca",color:"#dc2626"}}>
                  <span>⚠</span>{error}
                </div>
              )}

              <button type="submit" disabled={loading} className="cta-btn" style={{
                background:grad,boxShadow:`0 8px 24px ${cfg.primaryColor}55`,marginTop:4
              }}>
                {loading?(
                  <><svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>Consultando...</>
                ):"Consultar agora →"}
              </button>
            </form>

            <div className="flex items-center justify-center gap-5 pt-5 mt-5" style={{borderTop:"1px solid #f1f5f9"}}>
              {[["🔒","Criptografado"],["🛡","LGPD"],["✓","Verificado"]].map(([i,t])=>(
                <span key={t} className="flex items-center gap-1.5 text-xs font-medium" style={{color:"#94a3b8"}}>{i} {t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── RESULTADO ────────────────────────── */}
      {result&&(
        <div ref={resultRef} className="max-w-3xl mx-auto px-4 mt-6 pb-20 space-y-4 anim-fade-up">

          {/* Alert */}
          <div className="alert-urgent">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{background:"#fef2f2",border:"1px solid #fecaca"}}>
                <span style={{fontSize:18}}>⚠</span>
              </div>
              <div>
                <p className="font-bold text-sm" style={{color:"#991b1b"}}>Pendência localizada em seu CPF</p>
                <p className="text-xs mt-0.5" style={{color:"#b91c1c"}}>Oferta exclusiva expira em <Countdown/></p>
              </div>
            </div>
            <span className="text-xs font-black px-3 py-1.5 rounded-full flex-shrink-0"
              style={{background:"#ef4444",color:"white",letterSpacing:".05em"}}>URGENTE</span>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Dados */}
            <div style={{background:"white",borderRadius:16,border:"1px solid #e2e8f0",overflow:"hidden"}}>
              <div className="px-5 py-4 flex items-center gap-2.5" style={{borderBottom:"1px solid #f1f5f9"}}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{background:"#eef2ff"}}>📋</div>
                <span className="font-bold text-sm text-gray-800">Dados da Pendência</span>
              </div>
              <div className="p-5 space-y-0">
                {[{l:"Nome",v:result.name},{l:"CPF",v:result.cpf},{l:"Descrição",v:result.description}].map(item=>(
                  <div key={item.l} className="flex justify-between py-2.5" style={{borderBottom:"1px solid #f8f9ff"}}>
                    <span className="text-sm" style={{color:"#94a3b8"}}>{item.l}</span>
                    <span className="text-sm font-semibold text-gray-800 text-right max-w-[55%]">{item.v}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-2.5">
                  <span className="text-sm" style={{color:"#94a3b8"}}>Status</span>
                  <span className="text-xs font-bold px-3 py-1 rounded-full" style={{background:"#fff7ed",color:"#c2410c",border:"1px solid #fed7aa"}}>
                    {result.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Score */}
            <div style={{background:"white",borderRadius:16,border:"1px solid #e2e8f0",overflow:"hidden"}}>
              <div className="px-5 py-4 flex items-center gap-2.5" style={{borderBottom:"1px solid #f1f5f9"}}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{background:"#f5f3ff"}}>📊</div>
                <span className="font-bold text-sm text-gray-800">Análise de Crédito</span>
              </div>
              <div className="p-5">
                <ScoreMeter score={result.score} afterPay={result.scoreAfterPay} primaryColor={cfg.primaryColor}/>
              </div>
            </div>
          </div>

          {/* Oferta */}
          <div style={{background:"white",borderRadius:16,border:"1px solid #e2e8f0",overflow:"hidden"}}>
            <div className="h-0.5 w-full" style={{background:grad}}/>
            <div className="p-6 md:p-8">
              <div className="flex items-start gap-4 mb-6 pb-6" style={{borderBottom:"1px solid #f1f5f9"}}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm flex-shrink-0" style={{background:grad}}>
                  <span style={{filter:"brightness(10)"}}>✦</span>
                </div>
                <div>
                  <h3 className="font-black text-gray-900" style={{fontSize:"1.2rem",letterSpacing:"-0.02em"}}>
                    Proposta Especial de Quitação
                  </h3>
                  <p className="text-sm mt-0.5" style={{color:"#94a3b8"}}>
                    Quite sua dívida definitivamente com desconto exclusivo
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-5 gap-6">
                {/* Pricing — 2 cols */}
                <div className="md:col-span-2 space-y-3">
                  <div className="p-4 rounded-xl" style={{background:"#f8f9fc",border:"1px solid #e2e8f0"}}>
                    <p className="text-xs font-semibold tracking-wide uppercase mb-2" style={{color:"#94a3b8",letterSpacing:".08em"}}>Valor original</p>
                    <p className="price-original">{BRL(result.amount)}</p>
                  </div>
                  <div className="p-4 rounded-xl relative overflow-hidden" style={{background:"linear-gradient(135deg,#f0fdf4,#dcfce7)",border:"1.5px solid #86efac"}}>
                    <div className="absolute top-0 right-0 text-white text-xs font-black px-2.5 py-1 rounded-bl-xl"
                      style={{background:"#16a34a",letterSpacing:".05em"}}>
                      {Math.round(result.discount)}% OFF
                    </div>
                    <p className="text-xs font-semibold tracking-wide uppercase mb-1.5" style={{color:"#166534",letterSpacing:".08em"}}>Você paga apenas</p>
                    <p className="price-discounted" style={{color:"#15803d"}}>{BRL(result.discountedAmount)}</p>
                    <p className="text-xs mt-2 font-semibold" style={{color:"#16a34a"}}>
                      Economia de <strong>{BRL(result.amount-result.discountedAmount)}</strong>
                    </p>
                  </div>
                </div>

                {/* Benefits — 3 cols */}
                <div className="md:col-span-3">
                  <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{color:"#94a3b8",letterSpacing:".1em"}}>O que você conquista</p>
                  {[
                    ["#eef2ff","#4f46e5","✓","Quitação definitiva registrada em cartório"],
                    ["#f0fdf4","#16a34a","↑","Score de crédito aumenta imediatamente"],
                    ["#f5f3ff","#7c3aed","◎","Saída dos cadastros de inadimplentes"],
                    ["#fffbeb","#d97706","★","Aprovação facilitada em crédito e financiamentos"],
                    ["#f0fdf4","#059669","⚡","Pagamento via PIX instantâneo"],
                  ].map(([bg,color,icon,text])=>(
                    <div key={text} className="benefit-row">
                      <div className="benefit-icon" style={{background:bg}}>
                        <span className="text-sm font-bold" style={{color}}>{icon}</span>
                      </div>
                      <span className="text-sm text-gray-700">{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-6" style={{borderTop:"1px solid #f1f5f9"}}>
                <button onClick={onPay} className="cta-btn" style={{background:grad,boxShadow:`0 8px 28px ${cfg.primaryColor}50`,fontSize:"1.05rem"}}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                  </svg>
                  {cfg.ctaText}
                </button>
                <div className="flex items-center justify-center gap-6 mt-4">
                  {[["🔒","Pagamento seguro"],["⚡","PIX instantâneo"],["📄","Comprovante digital"]].map(([i,t])=>(
                    <span key={t} className="flex items-center gap-1.5 text-xs font-medium" style={{color:"#94a3b8"}}>{i} {t}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Prova social */}
          <div className="p-5 rounded-2xl text-center" style={{background:"linear-gradient(135deg,#eef2ff,#f5f3ff)",border:"1px solid #c7d2fe"}}>
            <p className="text-sm leading-relaxed" style={{color:"#3730a3"}}>
              <strong>Mais de 47 mil brasileiros</strong> regularizaram suas pendências e hoje têm{" "}
              <strong>crédito aprovado, financiamentos acessíveis e novas oportunidades</strong>.
              Não deixe uma dívida antiga comprometer o seu futuro. <strong>Regularize agora.</strong>
            </p>
          </div>
        </div>
      )}

      {/* ── FOOTER ────────────────────────────── */}
      <footer className="pub-footer mt-16">
        {/* Trust strip */}
        <div style={{borderBottom:"1px solid rgba(255,255,255,.05)"}}>
          <div className="max-w-5xl mx-auto px-6 py-4 flex flex-wrap justify-center gap-8">
            {[["🔒","SSL 256-bit"],["🛡","LGPD Compliant"],["✓","Empresa Registrada"],["⚡","Atendimento Ágil"],["🏦","Ambiente Regulado"]].map(([i,t])=>(
              <span key={t} className="flex items-center gap-2 text-xs font-medium" style={{color:"rgba(255,255,255,.3)"}}><span>{i}</span>{t}</span>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="max-w-5xl mx-auto px-6 py-14">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
            {/* Brand */}
            <div className="md:col-span-5">
              {cfg.companyLogo?(
                <img src={cfg.companyLogo} alt={cfg.companyName}
                  style={{height:Math.min(cfg.logoHeight,48),filter:"brightness(0) invert(1)",opacity:.8}}
                  className="object-contain mb-5"/>
              ):(
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-sm" style={{background:grad}}>{cfg.companyName[0]}</div>
                  <span className="font-bold text-white text-lg">{cfg.companyName}</span>
                </div>
              )}
              <p className="text-sm leading-relaxed mb-3 max-w-xs" style={{color:"rgba(255,255,255,.4)"}}>{cfg.footerText}</p>
              <p className="text-xs leading-relaxed max-w-xs" style={{color:"rgba(255,255,255,.2)"}}>
                Empresa especializada em recuperação de crédito, operando em conformidade com o Banco Central do Brasil, CDC e LGPD.
              </p>
              <div className="flex gap-2 mt-5">
                {[["f","Facebook"],["in","LinkedIn"],["ig","Instagram"]].map(([s,l])=>(
                  <div key={l} title={l} className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                    style={{background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.1)"}}>
                    <span className="text-xs font-bold" style={{color:"rgba(255,255,255,.4)"}}>{s}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-3">
              <p className="text-xs font-bold tracking-widest uppercase mb-5" style={{color:"rgba(255,255,255,.35)",letterSpacing:".12em"}}>Informações</p>
              <ul className="space-y-3">
                {["Como funciona","Política de Privacidade","Termos de Uso","Proteção de Dados","Fale Conosco"].map(l=>(
                  <li key={l}><span className="footer-link">{l}</span></li>
                ))}
              </ul>
            </div>

            <div className="md:col-span-4">
              <p className="text-xs font-bold tracking-widest uppercase mb-5" style={{color:"rgba(255,255,255,.35)",letterSpacing:".12em"}}>Contato</p>
              <ul className="space-y-3">
                {[["📧","contato@empresa.com.br"],["📱","0800 000 0000"],["⏰","Seg–Sex, 8h às 20h"],["📍","Brasil"]].map(([i,v])=>(
                  <li key={v} className="flex items-center gap-2.5">
                    <span className="text-sm" style={{color:"rgba(255,255,255,.2)"}}>{i}</span>
                    <span className="text-sm" style={{color:"rgba(255,255,255,.35)"}}>{v}</span>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2 mt-5">
                {[["PROCON","Registrado"],["BACEN","Regulado"],["PGFN","Autorizado"]].map(([t,s])=>(
                  <div key={t} className="px-2.5 py-2 rounded-lg text-center" style={{border:"1px solid rgba(255,255,255,.08)"}}>
                    <p className="text-xs font-black" style={{color:"rgba(255,255,255,.5)"}}>{t}</p>
                    <p className="text-xs mt-0.5" style={{color:"rgba(255,255,255,.2)"}}>{s}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div style={{borderTop:"1px solid rgba(255,255,255,.05)"}}>
          <div className="max-w-5xl mx-auto px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-xs" style={{color:"rgba(255,255,255,.18)"}}>
              © {new Date().getFullYear()} {cfg.companyName}. Todos os direitos reservados. CNPJ 00.000.000/0001-00
            </p>
            <div className="flex items-center gap-5">
              {["Privacidade","Termos","Cookies"].map(l=>(
                <span key={l} className="footer-link">{l}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
