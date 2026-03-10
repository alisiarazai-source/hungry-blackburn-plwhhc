import { useState, useMemo } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";

/* ─────────────────────────────────────────────────────────────
   DESIGN  —  Navy from the PPTX
───────────────────────────────────────────────────────────── */
const C = {
  bg:      "#0C1929", navyMid: "#112236", navyCard: "#162D45",
  border:  "#1E3A55", accent:  "#2E6DA4", bright:   "#4E9FD4",
  green:   "#2ECC8A", greenDim:"#1A5E3F", red:      "#E05555",
  amber:   "#D4961A", white:   "#FFFFFF",
  t1: "#FFFFFF", t2: "#A8C4DC", t3: "#5A7E9A", t4: "#304A62",
};

const GS = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html,body{background:${C.bg};color:${C.t1};font-family:'Inter',sans-serif}
    ::-webkit-scrollbar{width:3px;background:${C.bg}}
    ::-webkit-scrollbar-thumb{background:${C.border};border-radius:2px}
    input[type="number"]{
      width:100%;background:#0A1826;border:1.5px solid ${C.border};
      border-radius:8px;padding:10px 13px;
      font-family:'DM Mono',monospace;font-size:13px;color:${C.t1};
      outline:none;transition:border-color .15s,box-shadow .15s;
      -moz-appearance:textfield;
    }
    input[type="number"]::-webkit-inner-spin-button,
    input[type="number"]::-webkit-outer-spin-button{-webkit-appearance:none}
    input[type="number"]:focus{border-color:${C.bright};box-shadow:0 0 0 3px rgba(78,159,212,.12)}
    input[type="text"]{
      background:transparent;border:none;border-bottom:1.5px solid ${C.border};
      padding:5px 0;font-family:'Inter',sans-serif;font-size:14px;font-weight:600;
      color:${C.t1};outline:none;width:100%;
    }
    input[type="text"]:focus{border-bottom-color:${C.bright}}
    .btn-cta{
      background:linear-gradient(135deg,#2E6DA4,#1A4F80);color:#fff;
      border:none;border-radius:10px;padding:13px 32px;
      font-family:'Inter',sans-serif;font-size:14px;font-weight:600;
      cursor:pointer;letter-spacing:.02em;
      box-shadow:0 4px 16px rgba(46,109,164,.3);
      transition:opacity .15s,transform .1s;
    }
    .btn-cta:hover{opacity:.9;transform:translateY(-1px)}
    .btn-cta:disabled{opacity:.3;cursor:not-allowed;transform:none}
    .btn-ghost{
      background:transparent;color:${C.t3};
      border:1.5px solid ${C.border};border-radius:10px;
      padding:13px 24px;font-family:'Inter',sans-serif;
      font-size:14px;cursor:pointer;transition:all .15s;
    }
    .btn-ghost:hover{border-color:${C.bright};color:${C.t2}}
    .card{background:${C.navyCard};border:1px solid ${C.border};border-radius:16px;padding:26px 28px}
    .stitle{font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;
      color:${C.accent};margin-bottom:14px;padding-bottom:8px;border-bottom:1px solid ${C.border}}
    .flabel{font-size:12.5px;font-weight:500;color:${C.t2};margin-bottom:4px;display:block}
    .fhint{font-size:11px;color:${C.t3};line-height:1.5;margin-bottom:8px}
    .unit{font-family:'DM Mono',monospace;font-size:10.5px;color:${C.t4};white-space:nowrap}
    .g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
    .g2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
    .fadein{animation:fi .3s ease both}
    @keyframes fi{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
    .rtoggle{width:38px;height:22px;border-radius:99px;cursor:pointer;position:relative;transition:background .2s;flex-shrink:0;border:none}
    .rthumb{position:absolute;top:3px;width:16px;height:16px;border-radius:50%;background:#fff;transition:left .2s;box-shadow:0 1px 4px rgba(0,0,0,.5)}
  `}</style>
);

/* decorative circle motif from the PPTX */
const Orbs = () => (
  <div style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none"}}>
    <div style={{position:"absolute",top:"-15%",right:"-5%",width:380,height:380,borderRadius:"50%",
      background:"radial-gradient(circle,rgba(46,109,164,.22) 0%,transparent 65%)"}}/>
    <div style={{position:"absolute",bottom:"-20%",right:"10%",width:250,height:250,borderRadius:"50%",
      background:"radial-gradient(circle,rgba(30,70,120,.18) 0%,transparent 70%)"}}/>
    <div style={{position:"absolute",top:"35%",left:"-8%",width:200,height:200,borderRadius:"50%",
      background:"radial-gradient(circle,rgba(20,55,100,.12) 0%,transparent 70%)"}}/>
  </div>
);

/* ─────────────────────────────────────────────────────────────
   SIMULATION ENGINE
───────────────────────────────────────────────────────────── */
function tri(a,b,c){
  const lo=Math.min(a,b,c),hi=Math.max(a,b,c),mid=a+b+c-lo-hi;
  if(lo===hi)return lo;
  const u=Math.random(),fc=(mid-lo)/(hi-lo);
  return u<fc?lo+Math.sqrt(u*(hi-lo)*(mid-lo)):hi-Math.sqrt((1-u)*(hi-lo)*(hi-mid));
}

function simulate(d, N=14000){
  /* ---  operational efficiency benefits  --- */
  const opBenefits=[];
  for(let i=0;i<N;i++){
    const iR=tri(d.internalRateMin,d.internalRateLikely,d.internalRateMax);
    const eR=tri(d.externalRateMin,d.externalRateLikely,d.externalRateMax);
    const au=tri(d.auditsMin,d.auditsLikely,d.auditsMax);
    const sm=au*(d.distSmall/100),me=au*(d.distMedium/100),la=au*(d.distLarge/100);
    const auHrs=sm*tri(d.hoursSmallMin,d.hoursSmallLikely,d.hoursSmallMax)
              +me*tri(d.hoursMediumMin,d.hoursMediumLikely,d.hoursMediumMax)
              +la*tri(d.hoursLargeMin,d.hoursLargeLikely,d.hoursLargeMax);
    const ev=tri(d.evidenceMin,d.evidenceLikely,d.evidenceMax);
    const cTE=tri(d.curTimeEvidMin,d.curTimeEvidLikely,d.curTimeEvidMax);
    const fTE=d.futTimeEvid/60;
    const cC=tri(d.curCoordMin,d.curCoordLikely,d.curCoordMax);
    const autoPct=tri(d.automationPercentMin,d.automationPercentLikely,d.automationPercentMax)/100;
    const autoEff=tri(d.automationEffectMin,d.automationEffectLikely,d.automationEffectMax)/100;
    const cRed=tri(d.coordRedMin,d.coordRedLikely,d.coordRedMax)/100;
    const dRed=tri(d.dupRedMin,d.dupRedLikely,d.dupRedMax)/100;
    const extRed=tri(d.extAudRedMin,d.extAudRedLikely,d.extAudRedMax)/100;
    const curEH=au*ev*cTE;
    const opSav= au*ev*Math.max(0,cTE-fTE)*iR
               + au*cC*cRed*iR
               + (auHrs+curEH+au*cC)*dRed*iR
               + curEH*autoPct*autoEff*iR
               + tri(d.grcHoursMin,d.grcHoursLikely,d.grcHoursMax)*iR
               + tri(d.otherHoursMin,d.otherHoursLikely,d.otherHoursMax)*iR
               + au*cC*0.15*extRed*eR;
    opBenefits.push(opSav);
  }

  /* ---  risk loss distributions  --- */
  const lossBefore=[], lossAfter=[];
  for(let i=0;i<N;i++){
    let lb=0,la=0;
    for(const r of d.risks){
      if(!r.active)continue;
      const freq=Math.min(0.99,r.freqLikely/100);
      if(Math.random()<freq){
        const impact=tri(r.impMin*1e6,r.impLikely*1e6,r.impMax*1e6);
        lb+=impact;
        la+=impact*(1-r.reduction/100);
      }
    }
    lossBefore.push(lb);
    lossAfter.push(la);
  }

  /* ---  combined ROI  --- */
  const rois=[],nets=[],paybacks=[];
  for(let i=0;i<N;i++){
    const annualLicense=tri(d.licenseMin,d.licenseLikely,d.licenseMax);
    const implCost=tri(d.implMin,d.implLikely,d.implMax);
    const totalCost=annualLicense*d.years+implCost;
    const rY1=tri(d.rampY1Min,d.rampY1Likely,d.rampY1Max)/100;
    const rY2=tri(d.rampY2Min,d.rampY2Likely,d.rampY2Max)/100;
    const rY3=tri(d.rampY3Min,d.rampY3Likely,d.rampY3Max)/100;
    const delay=Math.max(0,(12-tri(d.delayMin,d.delayLikely,d.delayMax))/12);
    const annualBen=opBenefits[i]+(lossBefore[i]-lossAfter[i]);
    let tb=0;
    for(let y=1;y<=d.years;y++) tb+=annualBen*(y===1?rY1*delay:y===2?rY2:rY3);
    const net=tb-totalCost;
    rois.push(totalCost>0?(net/totalCost)*100:0);
    nets.push(net);
    paybacks.push(annualBen>0?(tri(d.licenseMin,d.licenseLikely,d.licenseMax)+tri(d.implMin,d.implLikely,d.implMax)/d.years)/annualBen:99);
  }

  const sort=arr=>[...arr].sort((a,b)=>a-b);
  const pct=(arr,p)=>arr[Math.floor(Math.max(0,Math.min(arr.length-1,p*arr.length)))];
  const avg=arr=>arr.reduce((s,v)=>s+v,0)/arr.length;

  const sLB=sort(lossBefore),sLA=sort(lossAfter),sR=sort(rois),sN=sort(nets),sP=sort(paybacks);

  // histogram of BEFORE loss
  const histLoss=(arr,lo,hi,bins=44)=>{
    const bw=(hi-lo)/bins;
    const h=Array.from({length:bins},(_,i)=>({x:(lo+i*bw)/1e6,count:0}));
    for(const v of arr){if(v<lo||v>hi)continue;h[Math.min(bins-1,Math.floor((v-lo)/bw))].count++;}
    return h;
  };
  const lMax=pct(sLB,.97);
  const histBefore=histLoss(sLB,0,lMax);
  const histAfter =histLoss(sLA,0,lMax);

  // ROI histogram
  const rLo=pct(sR,.01),rHi=pct(sR,.99),BINS=44,bw2=(rHi-rLo)/BINS;
  const roiHist=Array.from({length:BINS},(_,i)=>({x:rLo+i*bw2,count:0}));
  for(const v of sR){if(v<rLo||v>rHi)continue;roiHist[Math.min(BINS-1,Math.floor((v-rLo)/bw2))].count++;}

  // risk appetite check
  const appetiteProb=(arr,threshold)=>arr.filter(v=>v>threshold).length/arr.length*100;

  return {
    eal: { before:avg(lossBefore), after:avg(lossAfter) },
    p90: { before:pct(sLB,.90), after:pct(sLA,.90) },
    p95: { before:pct(sLB,.95), after:pct(sLA,.95) },
    roi: { p10:pct(sR,.10), p50:pct(sR,.50), p90:pct(sR,.90) },
    net: { p10:pct(sN,.10), p50:pct(sN,.50), p90:pct(sN,.90) },
    payback: pct(sP,.50),
    positiveRate: sR.filter(v=>v>0).length/N*100,
    opSav: avg(opBenefits),
    histBefore, histAfter, roiHist,
    appetiteProb, lossBefore: sLB, lossAfter: sLA, N,
  };
}

/* ─────────────────────────────────────────────────────────────
   FORMAT
───────────────────────────────────────────────────────────── */
const fM=v=>{
  if(isNaN(v)||v===null)return"–";
  const a=Math.abs(v);
  const s=a>=1e9?`${(a/1e9).toFixed(1)}B`:a>=1e6?`${(a/1e6).toFixed(0)}M`:a>=1e3?`${(a/1e3).toFixed(0)}K`:`${Math.round(a)}`;
  return(v<0?"−":"")+s+" SEK";
};
const fR=v=>isNaN(v)?"–":`${v>=0?"+":""}${Math.round(v)}%`;
const fHrs=v=>v>=1000?`${(v/1000).toFixed(1)}k hrs`:`${Math.round(v)} hrs`;

/* ─────────────────────────────────────────────────────────────
   UI ATOMS
───────────────────────────────────────────────────────────── */
function TriRow({label,hint,min,likely,max,onMin,onLikely,onMax,unit}){
  return(
    <div style={{marginBottom:20}}>
      <label className="flabel">{label}</label>
      {hint&&<p className="fhint">{hint}</p>}
      <div className="g3">
        {[{l:"Lowest",v:min,s:onMin,hi:false},{l:"Most likely",v:likely,s:onLikely,hi:true},{l:"Highest",v:max,s:onMax,hi:false}].map(c=>(
          <div key={c.l}>
            <div style={{fontSize:9.5,fontWeight:c.hi?700:400,letterSpacing:".08em",textTransform:"uppercase",
              color:c.hi?C.bright:C.t4,marginBottom:5}}>{c.l}</div>
            <input type="number" value={c.v} onChange={e=>c.s(+e.target.value)} placeholder="0"
              style={{borderColor:c.hi?C.accent:undefined}}/>
          </div>
        ))}
      </div>
      {unit&&<div style={{textAlign:"right",marginTop:4}}><span className="unit">{unit}</span></div>}
    </div>
  );
}
function SF({label,hint,value,onChange,unit}){
  return(
    <div style={{marginBottom:20}}>
      <label className="flabel">{label}</label>
      {hint&&<p className="fhint">{hint}</p>}
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <input type="number" value={value} onChange={e=>onChange(+e.target.value)} placeholder="0"/>
        {unit&&<span className="unit">{unit}</span>}
      </div>
    </div>
  );
}
function YrPicker({v,onChange}){
  return(
    <div style={{marginBottom:20}}>
      <label className="flabel">Analysis horizon</label>
      <p className="fhint">Typically 3 years for a pilot, 5 years for a strategic investment.</p>
      <div style={{display:"flex",gap:8}}>
        {[1,2,3,4,5].map(y=>(
          <button key={y} onClick={()=>onChange(y)} style={{
            flex:1,padding:"10px 0",borderRadius:8,cursor:"pointer",transition:"all .15s",
            border:v===y?`2px solid ${C.bright}`:`1.5px solid ${C.border}`,
            background:v===y?C.accent:"transparent",
            color:v===y?C.white:C.t3,
            fontFamily:"'Inter',sans-serif",fontSize:14,fontWeight:v===y?600:400,
          }}>{y}yr</button>
        ))}
      </div>
    </div>
  );
}
function Dots({current,total}){
  return(
    <div style={{display:"flex",gap:5,justifyContent:"center",marginBottom:28}}>
      {Array.from({length:total}).map((_,i)=>(
        <div key={i} style={{width:i===current?24:6,height:6,borderRadius:99,transition:"all .3s",
          background:i===current?C.bright:i<current?C.accent:C.t4}}/>
      ))}
    </div>
  );
}

/* Step header: dark left panel with title + orbs, right panel with context */
function Hdr({step,total,title,context}){
  return(
    <div style={{display:"flex",borderRadius:16,overflow:"hidden",marginBottom:22,minHeight:108}}>
      <div style={{flex:"0 0 40%",background:"linear-gradient(135deg,#08131E 0%,#162D45 100%)",
        padding:"24px 26px",position:"relative",overflow:"hidden",display:"flex",flexDirection:"column",justifyContent:"center"}}>
        <Orbs/>
        <div style={{position:"relative",zIndex:1}}>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:9.5,color:C.t3,letterSpacing:".12em",
            textTransform:"uppercase",marginBottom:7}}>Step {step} of {total}</div>
          <div style={{fontFamily:"'Inter',sans-serif",fontSize:21,fontWeight:700,color:C.white,lineHeight:1.25}}>{title}</div>
        </div>
      </div>
      <div style={{flex:1,background:C.navyMid,padding:"24px 26px",display:"flex",alignItems:"center",
        borderLeft:`1px solid ${C.border}`}}>
        <p style={{fontSize:13,color:C.t2,lineHeight:1.8}}>{context}</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   DEFAULTS
───────────────────────────────────────────────────────────── */
const DEF={
  licenseMin:500000,licenseLikely:900000,licenseMax:1400000,
  implMin:300000,implLikely:500000,implMax:800000,years:3,
  internalRateMin:1500,internalRateLikely:1500,internalRateMax:1500,
  externalRateMin:1500,externalRateLikely:1800,externalRateMax:4000,
  auditsMin:80,auditsLikely:85,auditsMax:100,
  distSmall:28,distMedium:51,distLarge:21,
  hoursSmallMin:70,hoursSmallLikely:80,hoursSmallMax:100,
  hoursMediumMin:180,hoursMediumLikely:200,hoursMediumMax:300,
  hoursLargeMin:550,hoursLargeLikely:600,hoursLargeMax:800,
  evidenceMin:150,evidenceLikely:200,evidenceMax:250,
  curTimeEvidMin:0.083,curTimeEvidLikely:2,curTimeEvidMax:3,
  curCoordMin:180,curCoordLikely:200,curCoordMax:300,
  futTimeEvid:5,futCoordHours:100,
  automationPercentMin:20,automationPercentLikely:25,automationPercentMax:30,
  automationEffectMin:70,automationEffectLikely:98,automationEffectMax:100,
  coordRedMin:40,coordRedLikely:50,coordRedMax:60,
  dupRedMin:40,dupRedLikely:50,dupRedMax:60,
  extAudRedMin:15,extAudRedLikely:17,extAudRedMax:20,
  grcHoursMin:250,grcHoursLikely:320,grcHoursMax:500,
  otherHoursMin:400,otherHoursLikely:500,otherHoursMax:600,
  risks:[
    {id:1,name:"AI Act fines",      active:true, freqLikely:5, impMin:50,  impLikely:150,impMax:400,reduction:50},
    {id:2,name:"PII Data breach",   active:true, freqLikely:8, impMin:100, impLikely:200,impMax:500,reduction:50},
    {id:3,name:"Ransomware",        active:true, freqLikely:5, impMin:55,  impLikely:60, impMax:65, reduction:50},
    {id:4,name:"Disaster Recovery", active:false,freqLikely:5, impMin:55,  impLikely:60, impMax:65, reduction:50},
  ],
  riskAppetiteThreshold:50,riskAppetiteProb:10,
  delayMin:1,delayLikely:2,delayMax:4,
  rampY1Min:50,rampY1Likely:55,rampY1Max:60,
  rampY2Min:60,rampY2Likely:75,rampY2Max:90,
  rampY3Min:100,rampY3Likely:120,rampY3Max:140,
};

const STEPS=8;

/* ─────────────────────────────────────────────────────────────
   APP
───────────────────────────────────────────────────────────── */
export default function App(){
  const [step,setStep]=useState(-1); // -1 = landing
  const [d,setD]=useState(DEF);
  const [result,setResult]=useState(null);
  const [running,setRunning]=useState(false);
  const [resTab,setResTab]=useState("risk");

  const upd=k=>v=>setD(p=>({...p,[k]:v}));
  const updR=(id,k,v)=>setD(p=>({...p,risks:p.risks.map(r=>r.id===id?{...r,[k]:v}:r)}));
  const addR=()=>setD(p=>({...p,risks:[...p.risks,{id:Date.now(),name:"New risk",active:true,freqLikely:5,impMin:10,impLikely:30,impMax:100,reduction:50}]}));
  const delR=id=>setD(p=>({...p,risks:p.risks.filter(r=>r.id!==id)}));

  function next(){
    if(step===STEPS-2){
      setRunning(true);
      setTimeout(()=>{setResult(simulate(d,14000));setRunning(false);setStep(STEPS-1);},40);
    } else setStep(s=>s+1);
  }
  function restart(){setStep(-1);setResult(null);}

  /* ── Risk appetite evaluation ── */
  const appetiteCheck=useMemo(()=>{
    if(!result)return null;
    const thr=d.riskAppetiteThreshold*1e6;
    const target=d.riskAppetiteProb;
    const probBefore=result.appetiteProb(result.lossBefore,thr);
    const probAfter =result.appetiteProb(result.lossAfter, thr);
    const met=probAfter<=target;
    return{probBefore,probAfter,met,target,thr};
  },[result,d.riskAppetiteThreshold,d.riskAppetiteProb]);

  /* ── Loss chart data — overlay before/after ── */
  const lossChartData=useMemo(()=>{
    if(!result)return[];
    return result.histBefore.map((b,i)=>({
      x:b.x, before:b.count, after:result.histAfter[i]?.count||0,
    }));
  },[result]);

  return(
    <div style={{minHeight:"100vh",background:C.bg}}>
      <GS/>

      {/* HEADER BAR */}
      <div style={{borderBottom:`1px solid ${C.border}`,background:C.navyMid,padding:"13px 0",position:"sticky",top:0,zIndex:10}}>
        <div style={{maxWidth:760,margin:"0 auto",padding:"0 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:30,height:30,borderRadius:7,background:C.accent,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:12,fontWeight:500,color:"#fff"}}>MC</span>
            </div>
            <div>
              <div style={{fontSize:14,fontWeight:700,color:C.t1,lineHeight:1}}>Cyber Risk Business Case Builder</div>
              <div style={{fontSize:10.5,color:C.t3,marginTop:2}}>Monte Carlo · ASR Input · {d.years}-year horizon</div>
            </div>
          </div>
          {step>=0&&step<STEPS-1&&<span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:C.t4}}>{step+1}/{STEPS-1}</span>}
          {step===STEPS-1&&<button onClick={restart} className="btn-ghost" style={{padding:"7px 16px",fontSize:12}}>Start over</button>}
        </div>
      </div>

      <div style={{maxWidth:760,margin:"0 auto",padding:"36px 24px 70px"}}>

        {/* ══ LANDING ══════════════════════════════════════ */}
        {step===-1&&(
          <div className="fadein">
            {/* Hero */}
            <div style={{position:"relative",background:"linear-gradient(135deg,#08131E 0%,#1A3354 100%)",
              borderRadius:20,padding:"52px 52px 48px",marginBottom:20,overflow:"hidden",textAlign:"center"}}>
              <Orbs/>
              <div style={{position:"relative",zIndex:1}}>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:C.t3,letterSpacing:".14em",
                  textTransform:"uppercase",marginBottom:16}}>Cybersecurity Investment · Monte Carlo Simulation</div>
                <h1 style={{fontFamily:"'Inter',sans-serif",fontSize:38,fontWeight:700,color:C.white,
                  lineHeight:1.2,marginBottom:18}}>
                  Quantify your cyber risk.<br/>
                  <span style={{color:C.bright}}>Build your business case.</span>
                </h1>
                <p style={{fontSize:14.5,color:C.t2,lineHeight:1.85,maxWidth:520,margin:"0 auto 32px"}}>
                  Cybersecurity cannot be valued using traditional ROI — its value lies in <strong style={{color:C.white}}>risk reduction</strong>.
                  This tool converts that risk into monetary terms (EAL, P90/P95) so you can present a credible business case at the ASR process.
                </p>
                <button onClick={()=>setStep(0)} className="btn-cta" style={{fontSize:15,padding:"15px 42px"}}>
                  Build my business case →
                </button>
              </div>
            </div>

            {/* 3-column what you get */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:20}}>
              {[
                {icon:"📊",title:"Risk in monetary terms",body:"See your Expected Annual Loss (EAL) and worst-case P90/P95 levels — before and after the investment."},
                {icon:"🎯",title:"Risk appetite check",body:"Define your organisation's risk appetite threshold. The tool tells you if the investment brings you within it."},
                {icon:"📋",title:"ASR-ready output",body:"The results are structured to support the Annual Strategy Review process — clear, quantified, decision-ready."},
              ].map(c=>(
                <div key={c.title} className="card" style={{padding:"22px 22px"}}>
                  <div style={{fontSize:22,marginBottom:12}}>{c.icon}</div>
                  <div style={{fontSize:13.5,fontWeight:700,color:C.t1,marginBottom:8}}>{c.title}</div>
                  <p style={{fontSize:12,color:C.t3,lineHeight:1.7}}>{c.body}</p>
                </div>
              ))}
            </div>

            {/* How it works */}
            <div className="card">
              <div className="stitle">How it works</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:0}}>
                {[
                  {n:"1",l:"Investment cost",d:"License, implementation, internal effort"},
                  {n:"2",l:"Current state",d:"Audit volumes, hours, coordination"},
                  {n:"3",l:"Future state",d:"Automation, time savings, process gains"},
                  {n:"4",l:"Risk events",d:"Frequencies, impact ranges, mitigations"},
                ].map((s,i)=>(
                  <div key={s.n} style={{display:"flex",alignItems:"flex-start",gap:12,padding:"14px 16px",
                    borderRight:i<3?`1px solid ${C.border}`:"none"}}>
                    <div style={{width:26,height:26,borderRadius:"50%",background:C.accent,flexShrink:0,
                      display:"flex",alignItems:"center",justifyContent:"center",
                      fontFamily:"'DM Mono',monospace",fontSize:12,fontWeight:700,color:"#fff"}}>{s.n}</div>
                    <div>
                      <div style={{fontSize:12.5,fontWeight:600,color:C.t1,marginBottom:4}}>{s.l}</div>
                      <div style={{fontSize:11,color:C.t3,lineHeight:1.5}}>{s.d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {step>=0&&step<STEPS-1&&<Dots current={step} total={STEPS-1}/>}

        {/* ══ STEP 0: INVESTMENT COST ══════════════════════ */}
        {step===0&&(
          <div className="fadein">
            <Hdr step={1} total={7} title="Investment cost"
              context="Enter the annual license fee and one-time implementation cost. Use lowest / most likely / highest to capture the uncertainty in your estimates."/>
            <div className="card">
              <TriRow label="Annual license / subscription fee" hint="What you pay the vendor per year."
                min={d.licenseMin} likely={d.licenseLikely} max={d.licenseMax}
                onMin={upd("licenseMin")} onLikely={upd("licenseLikely")} onMax={upd("licenseMax")} unit="SEK / yr"/>
              <TriRow label="One-time implementation cost" hint="Consultants, onboarding, internal setup time."
                min={d.implMin} likely={d.implLikely} max={d.implMax}
                onMin={upd("implMin")} onLikely={upd("implLikely")} onMax={upd("implMax")} unit="SEK"/>
              <YrPicker v={d.years} onChange={upd("years")}/>
              {d.licenseLikely>0&&(
                <div style={{background:"#0A1826",borderRadius:10,border:`1px solid ${C.border}`,padding:"12px 16px",fontSize:12,color:C.t3}}>
                  Total investment (most likely):&nbsp;
                  <strong style={{color:C.t1}}>{fM(d.licenseLikely*d.years+d.implLikely)}</strong> over {d.years} years
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ STEP 1: HOURLY RATES ═════════════════════════ */}
        {step===1&&(
          <div className="fadein">
            <Hdr step={2} total={7} title="Hourly rates"
              context="These rates convert saved hours into monetary value for the model. Include salary, social costs, and overhead in your estimates."/>
            <div className="card">
              <TriRow label="Internal hourly rate"
                hint="Average fully-loaded cost per hour for internal staff doing audit and compliance work."
                min={d.internalRateMin} likely={d.internalRateLikely} max={d.internalRateMax}
                onMin={upd("internalRateMin")} onLikely={upd("internalRateLikely")} onMax={upd("internalRateMax")} unit="SEK / hr"/>
              <TriRow label="External auditor hourly rate"
                hint="Cost per hour for external auditors."
                min={d.externalRateMin} likely={d.externalRateLikely} max={d.externalRateMax}
                onMin={upd("externalRateMin")} onLikely={upd("externalRateLikely")} onMax={upd("externalRateMax")} unit="SEK / hr"/>
            </div>
          </div>
        )}

        {/* ══ STEP 2: AUDIT VOLUME ════════════════════════ */}
        {step===2&&(
          <div className="fadein">
            <Hdr step={3} total={7} title="Audit volume & current state"
              context="Describe your current baseline — number of audits, their size distribution, and how long each task takes today. This is what the investment is measured against."/>
            <div className="card">
              <div className="section" style={{marginBottom:24}}>
                <div className="stitle">Audit volume & size distribution</div>
                <TriRow label="Total audits per year"
                  min={d.auditsMin} likely={d.auditsLikely} max={d.auditsMax}
                  onMin={upd("auditsMin")} onLikely={upd("auditsLikely")} onMax={upd("auditsMax")} unit="audits/yr"/>
                <div style={{marginBottom:20}}>
                  <label className="flabel">Size distribution</label>
                  <p className="fhint">Small (e.g. internal reviews), Medium (e.g. PCI Store), Large (e.g. ISO, AI Act). Must sum to 100%.</p>
                  <div className="g3">
                    {[{l:"Small %",k:"distSmall"},{l:"Medium %",k:"distMedium"},{l:"Large %",k:"distLarge"}].map(c=>(
                      <div key={c.k}>
                        <div style={{fontSize:10,color:C.t4,marginBottom:5,textTransform:"uppercase",letterSpacing:".07em"}}>{c.l}</div>
                        <input type="number" value={d[c.k]} onChange={e=>upd(c.k)(+e.target.value)}/>
                      </div>
                    ))}
                  </div>
                  <div style={{textAlign:"right",marginTop:6,fontSize:11,
                    color:Math.abs(d.distSmall+d.distMedium+d.distLarge-100)<1?C.t3:C.red}}>
                    Total: {d.distSmall+d.distMedium+d.distLarge}%
                    {Math.abs(d.distSmall+d.distMedium+d.distLarge-100)>=1&&" — must equal 100%"}
                  </div>
                </div>
                <TriRow label="Hours per small audit" min={d.hoursSmallMin} likely={d.hoursSmallLikely} max={d.hoursSmallMax}
                  onMin={upd("hoursSmallMin")} onLikely={upd("hoursSmallLikely")} onMax={upd("hoursSmallMax")} unit="hrs"/>
                <TriRow label="Hours per medium audit" min={d.hoursMediumMin} likely={d.hoursMediumLikely} max={d.hoursMediumMax}
                  onMin={upd("hoursMediumMin")} onLikely={upd("hoursMediumLikely")} onMax={upd("hoursMediumMax")} unit="hrs"/>
                <TriRow label="Hours per large audit" min={d.hoursLargeMin} likely={d.hoursLargeLikely} max={d.hoursLargeMax}
                  onMin={upd("hoursLargeMin")} onLikely={upd("hoursLargeLikely")} onMax={upd("hoursLargeMax")} unit="hrs"/>
              </div>
              <div>
                <div className="stitle">Evidence & coordination — current state</div>
                <TriRow label="Evidence items per audit" min={d.evidenceMin} likely={d.evidenceLikely} max={d.evidenceMax}
                  onMin={upd("evidenceMin")} onLikely={upd("evidenceLikely")} onMax={upd("evidenceMax")} unit="items"/>
                <TriRow label="Time per evidence item today" hint="5 min = 0.083 hr, 1 hr = 1.0"
                  min={d.curTimeEvidMin} likely={d.curTimeEvidLikely} max={d.curTimeEvidMax}
                  onMin={upd("curTimeEvidMin")} onLikely={upd("curTimeEvidLikely")} onMax={upd("curTimeEvidMax")} unit="hr/item"/>
                <TriRow label="Coordination hours per audit today"
                  min={d.curCoordMin} likely={d.curCoordLikely} max={d.curCoordMax}
                  onMin={upd("curCoordMin")} onLikely={upd("curCoordLikely")} onMax={upd("curCoordMax")} unit="hrs/audit"/>
              </div>
            </div>
          </div>
        )}

        {/* ══ STEP 3: FUTURE STATE ════════════════════════ */}
        {step===3&&(
          <div className="fadein">
            <Hdr step={4} total={7} title="Future state"
              context="What changes after the investment? Enter target process times, automation coverage, and the hours freed up for each team. Be conservative."/>
            <div className="card">
              <div className="section" style={{marginBottom:24}}>
                <div className="stitle">Time targets after investment</div>
                <SF label="Target: time per evidence item" hint="e.g. 5 minutes with automated collection"
                  value={d.futTimeEvid} onChange={upd("futTimeEvid")} unit="min/item"/>
                <SF label="Target: coordination hours per audit" hint="e.g. 100 hrs once workflow is automated"
                  value={d.futCoordHours} onChange={upd("futCoordHours")} unit="hrs/audit"/>
              </div>
              <div className="section" style={{marginBottom:24}}>
                <div className="stitle">Automation effects</div>
                <TriRow label="Share of evidence collection that can be automated"
                  min={d.automationPercentMin} likely={d.automationPercentLikely} max={d.automationPercentMax}
                  onMin={upd("automationPercentMin")} onLikely={upd("automationPercentLikely")} onMax={upd("automationPercentMax")} unit="%"/>
                <TriRow label="Time reduction on automated items" hint="98% = near-fully automated"
                  min={d.automationEffectMin} likely={d.automationEffectLikely} max={d.automationEffectMax}
                  onMin={upd("automationEffectMin")} onLikely={upd("automationEffectLikely")} onMax={upd("automationEffectMax")} unit="%"/>
                <TriRow label="Reduction in duplicate work"
                  min={d.dupRedMin} likely={d.dupRedLikely} max={d.dupRedMax}
                  onMin={upd("dupRedMin")} onLikely={upd("dupRedLikely")} onMax={upd("dupRedMax")} unit="%"/>
                <TriRow label="Reduction in external auditor time"
                  min={d.extAudRedMin} likely={d.extAudRedLikely} max={d.extAudRedMax}
                  onMin={upd("extAudRedMin")} onLikely={upd("extAudRedLikely")} onMax={upd("extAudRedMax")} unit="%"/>
              </div>
              <div>
                <div className="stitle">Hours freed per year (by role)</div>
                <TriRow label="GRC analysts & Policy Owners"
                  min={d.grcHoursMin} likely={d.grcHoursLikely} max={d.grcHoursMax}
                  onMin={upd("grcHoursMin")} onLikely={upd("grcHoursLikely")} onMax={upd("grcHoursMax")} unit="hrs/yr"/>
                <TriRow label="Control Owners & other units"
                  min={d.otherHoursMin} likely={d.otherHoursLikely} max={d.otherHoursMax}
                  onMin={upd("otherHoursMin")} onLikely={upd("otherHoursLikely")} onMax={upd("otherHoursMax")} unit="hrs/yr"/>
              </div>
            </div>
          </div>
        )}

        {/* ══ STEP 4: RISK EVENTS ═════════════════════════ */}
        {step===4&&(
          <div className="fadein">
            <Hdr step={5} total={7} title="Risk events"
              context="These are the cyber risk events this investment helps mitigate. The model simulates whether each event occurs each year. Frequency = annual probability — be conservative."/>
            <div className="card">
              <div style={{background:"rgba(212,150,26,.08)",border:"1px solid rgba(212,150,26,.25)",
                borderRadius:10,padding:"12px 16px",marginBottom:20,fontSize:12,color:"#C8A84A",lineHeight:1.6}}>
                ⚠️ <strong>Frequency is annual probability.</strong> If an event occurs roughly every 10 years = <strong>10% per year</strong>. The EAL and P90 calculations depend heavily on this — overestimating makes the business case unreliable.
              </div>
              {d.risks.map(r=>(
                <div key={r.id} style={{background:C.navyMid,border:`1px solid ${C.border}`,borderRadius:12,padding:"16px 18px",marginBottom:10}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:r.active?16:0}}>
                    <button className="rtoggle" style={{background:r.active?C.accent:C.t4}}
                      onClick={()=>updR(r.id,"active",!r.active)}>
                      <div className="rthumb" style={{left:r.active?19:3}}/>
                    </button>
                    <input type="text" value={r.name} onChange={e=>updR(r.id,"name",e.target.value)} style={{flex:1}}/>
                    <button onClick={()=>delR(r.id)} style={{background:"none",border:"none",cursor:"pointer",color:C.t4,fontSize:15,padding:4}}>✕</button>
                  </div>
                  {r.active&&(
                    <div style={{display:"grid",gridTemplateColumns:"1fr 2fr 1fr",gap:14}}>
                      <div>
                        <label className="flabel" style={{fontSize:11.5}}>Annual probability</label>
                        <div style={{position:"relative"}}>
                          <input type="number" value={r.freqLikely} min={0} max={100} onChange={e=>updR(r.id,"freqLikely",+e.target.value)}/>
                          <span style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",fontFamily:"'DM Mono',monospace",fontSize:11,color:C.t4}}>%/yr</span>
                        </div>
                      </div>
                      <div>
                        <label className="flabel" style={{fontSize:11.5}}>Cost if it occurs (MSEK)</label>
                        <div className="g3">
                          {[{l:"Low",k:"impMin"},{l:"Likely",k:"impLikely"},{l:"High",k:"impMax"}].map(f=>(
                            <div key={f.k}>
                              <div style={{fontSize:9,color:C.t4,marginBottom:4,textTransform:"uppercase",letterSpacing:".06em"}}>{f.l}</div>
                              <input type="number" value={r[f.k]} onChange={e=>updR(r.id,f.k,+e.target.value)}/>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="flabel" style={{fontSize:11.5}}>Risk reduction</label>
                        <p style={{fontSize:10,color:C.t3,marginBottom:6}}>How much does this investment reduce the risk?</p>
                        <div style={{position:"relative"}}>
                          <input type="number" value={r.reduction} min={0} max={100} onChange={e=>updR(r.id,"reduction",+e.target.value)}/>
                          <span style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",fontFamily:"'DM Mono',monospace",fontSize:11,color:C.t4}}>%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <button onClick={addR} style={{background:"none",border:`1.5px dashed ${C.border}`,borderRadius:10,
                padding:"11px",color:C.t4,fontFamily:"'Inter',sans-serif",fontSize:13,fontWeight:500,cursor:"pointer",width:"100%"}}>
                + Add risk event
              </button>
            </div>
          </div>
        )}

        {/* ══ STEP 5: RISK APPETITE ════════════════════════ */}
        {step===5&&(
          <div className="fadein">
            <Hdr step={6} total={7} title="Risk appetite"
              context="Define your organisation's risk appetite — the maximum acceptable loss level and probability. The model will tell you whether this investment brings you within it."/>
            <div className="card">
              <div style={{background:"#0A1826",border:`1px solid ${C.border}`,borderRadius:12,padding:"20px 22px",marginBottom:24}}>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:C.bright,letterSpacing:".06em",marginBottom:12}}>
                  EXAMPLE: "We accept at most a 10% probability of losing more than 10 MSEK in a given year."
                </div>
                <div style={{fontSize:12.5,color:C.t3,lineHeight:1.7}}>
                  This is your <strong style={{color:C.t2}}>risk appetite statement</strong> — the threshold against which this investment will be evaluated.
                  If the investment brings the probability below your stated maximum, it passes the risk appetite test.
                </div>
              </div>
              <div className="g2">
                <SF label="Maximum acceptable loss"
                  hint='The loss level in MSEK that you are trying to stay below (e.g. "10 MSEK")'
                  value={d.riskAppetiteThreshold} onChange={upd("riskAppetiteThreshold")} unit="MSEK"/>
                <SF label="Maximum acceptable probability"
                  hint='The probability of exceeding that loss (e.g. "10% per year")'
                  value={d.riskAppetiteProb} onChange={upd("riskAppetiteProb")} unit="% / yr"/>
              </div>
              <div style={{background:"#0A1826",borderRadius:10,border:`1px solid ${C.border}`,padding:"13px 16px",fontSize:12,color:C.t3,marginTop:4}}>
                Statement: "We accept at most a <strong style={{color:C.t2}}>{d.riskAppetiteProb}%</strong> probability of losing more than <strong style={{color:C.t2}}>{d.riskAppetiteThreshold} MSEK</strong> in a given year."
              </div>
            </div>
          </div>
        )}

        {/* ══ STEP 6: RAMP-UP ══════════════════════════════ */}
        {step===6&&(
          <div className="fadein">
            <Hdr step={7} total={7} title="Value ramp-up"
              context="Most investments take time to implement and adopt. Enter how many months until you are operational, and what percentage of full value you expect each year."/>
            <div className="card">
              <div style={{marginBottom:24}}>
                <div className="stitle">Implementation delay</div>
                <TriRow label="Months from contract to active use"
                  hint="How long until the tool is actually being used and generating value?"
                  min={d.delayMin} likely={d.delayLikely} max={d.delayMax}
                  onMin={upd("delayMin")} onLikely={upd("delayLikely")} onMax={upd("delayMax")} unit="months"/>
              </div>
              <div>
                <div className="stitle">Annual value realisation (% of full potential)</div>
                <div style={{background:"#0A1826",borderRadius:10,border:`1px solid ${C.border}`,padding:"12px 16px",fontSize:11.5,color:C.t3,marginBottom:20}}>
                  100% = you capture the full value you estimated. 120% = the investment outperforms expectations.
                </div>
                {[
                  {l:"Year 1",minK:"rampY1Min",lK:"rampY1Likely",maxK:"rampY1Max",hint:"Typically lower — learning curve and rollout."},
                  {l:"Year 2",minK:"rampY2Min",lK:"rampY2Likely",maxK:"rampY2Max",hint:"Adoption grows, more value captured."},
                  {l:"Year 3+",minK:"rampY3Min",lK:"rampY3Likely",maxK:"rampY3Max",hint:"Full effect — can exceed 100% with additional use cases."},
                ].map(r=>(
                  <TriRow key={r.l} label={r.l} hint={r.hint}
                    min={d[r.minK]} likely={d[r.lK]} max={d[r.maxK]}
                    onMin={upd(r.minK)} onLikely={upd(r.lK)} onMax={upd(r.maxK)} unit="%"/>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ RESULTS ══════════════════════════════════════ */}
        {step===7&&result&&appetiteCheck&&(
          <div>
            {/* Risk appetite verdict — top of page */}
            <div className="fadein" style={{
              background:appetiteCheck.met
                ?"linear-gradient(135deg,#0A1E10,#0F3020)"
                :"linear-gradient(135deg,#1E0A0A,#300F0F)",
              border:`1px solid ${appetiteCheck.met?"#1A5030":"#501A1A"}`,
              borderRadius:16,padding:"24px 28px",marginBottom:18,
              display:"flex",alignItems:"center",gap:24}}>
              <div style={{width:56,height:56,borderRadius:"50%",flexShrink:0,
                background:appetiteCheck.met?"#1A5030":"#501A1A",
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:26}}>{appetiteCheck.met?"✓":"!"}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:20,fontWeight:700,
                  color:appetiteCheck.met?C.green:C.red,marginBottom:6}}>
                  {appetiteCheck.met
                    ?"Risk appetite is met — investment is justified"
                    :"Risk appetite is not yet met — review your assumptions"}
                </div>
                <p style={{fontSize:13,color:appetiteCheck.met?"#5AAA80":"#AA6060",lineHeight:1.6}}>
                  Without investment: <strong>{appetiteCheck.probBefore.toFixed(0)}%</strong> probability of exceeding {d.riskAppetiteThreshold} MSEK loss per year.
                  {" "}After investment: <strong>{appetiteCheck.probAfter.toFixed(0)}%</strong>.
                  {" "}Your stated appetite: ≤{d.riskAppetiteProb}%.
                  {appetiteCheck.met
                    ?" This investment brings you within your risk appetite."
                    :" This investment alone does not bring you within your risk appetite."}
                </p>
              </div>
            </div>

            {/* Tab bar */}
            <div className="fadein" style={{display:"flex",gap:3,background:C.navyCard,border:`1px solid ${C.border}`,
              borderRadius:13,padding:4,marginBottom:18}}>
              {[{id:"risk",l:"Risk reduction"},{id:"roi",l:"ROI & payback"},{id:"ba",l:"Before & after"},{id:"assumptions",l:"Assumptions"}].map(t=>(
                <button key={t.id} onClick={()=>setResTab(t.id)} style={{
                  flex:1,padding:"10px 0",borderRadius:9,border:"none",cursor:"pointer",transition:"all .15s",
                  background:resTab===t.id?C.accent:"transparent",
                  color:resTab===t.id?C.white:C.t3,
                  fontFamily:"'Inter',sans-serif",fontSize:13,fontWeight:resTab===t.id?600:400,
                }}>{t.l}</button>
              ))}
            </div>

            {/* ── TAB: RISK REDUCTION ── */}
            {resTab==="risk"&&(
              <div>
                {/* EAL + P90 cards */}
                <div className="fadein" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                  {[
                    {label:"Expected Annual Loss (EAL)",before:result.eal.before,after:result.eal.after,desc:"Average loss per year across all simulations"},
                    {label:"Worst-case loss (P90)",before:result.p90.before,after:result.p90.after,desc:"Loss level exceeded in only 10% of years"},
                  ].map(m=>(
                    <div key={m.label} className="card fadein" style={{padding:"20px 22px"}}>
                      <div style={{fontSize:10,fontWeight:700,letterSpacing:".09em",textTransform:"uppercase",color:C.t3,marginBottom:12}}>{m.label}</div>
                      <div style={{display:"flex",gap:0,marginBottom:10}}>
                        <div style={{flex:1,paddingRight:14,borderRight:`1px solid ${C.border}`}}>
                          <div style={{fontSize:10,color:C.t4,marginBottom:5,textTransform:"uppercase",letterSpacing:".07em"}}>Before</div>
                          <div style={{fontFamily:"'Inter',sans-serif",fontSize:22,fontWeight:700,color:"#E07070",lineHeight:1}}>{fM(m.before)}</div>
                        </div>
                        <div style={{flex:1,paddingLeft:14}}>
                          <div style={{fontSize:10,color:C.t4,marginBottom:5,textTransform:"uppercase",letterSpacing:".07em"}}>After</div>
                          <div style={{fontFamily:"'Inter',sans-serif",fontSize:22,fontWeight:700,color:C.green,lineHeight:1}}>{fM(m.after)}</div>
                        </div>
                      </div>
                      <div style={{background:"#0A1826",borderRadius:8,padding:"8px 12px",fontSize:11.5,
                        color:C.bright,fontWeight:600,fontFamily:"'DM Mono',monospace"}}>
                        reduction: {fM(m.before-m.after)}
                      </div>
                      <div style={{fontSize:10.5,color:C.t3,marginTop:8}}>{m.desc}</div>
                    </div>
                  ))}
                </div>

                {/* P95 */}
                <div className="fadein card" style={{marginBottom:14,padding:"18px 22px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <div style={{fontSize:10,fontWeight:700,letterSpacing:".09em",textTransform:"uppercase",color:C.t3,marginBottom:4}}>Worst-case loss (P95)</div>
                      <div style={{fontSize:11.5,color:C.t3}}>Loss level exceeded in only 5% of years — the "catastrophic" scenario</div>
                    </div>
                    <div style={{display:"flex",gap:24,alignItems:"center"}}>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:10,color:C.t4,marginBottom:3}}>Before</div>
                        <div style={{fontFamily:"'Inter',sans-serif",fontSize:20,fontWeight:700,color:"#E07070"}}>{fM(result.p95.before)}</div>
                      </div>
                      <div style={{fontSize:18,color:C.t4}}>→</div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:10,color:C.t4,marginBottom:3}}>After</div>
                        <div style={{fontFamily:"'Inter',sans-serif",fontSize:20,fontWeight:700,color:C.green}}>{fM(result.p95.after)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Loss distribution chart — BEFORE vs AFTER overlay */}
                <div className="fadein card" style={{padding:"24px 28px"}}>
                  <div style={{fontSize:16,fontWeight:700,color:C.t1,marginBottom:4}}>Risk distribution — before vs after</div>
                  <p style={{fontSize:11.5,color:C.t3,marginBottom:18}}>
                    How likely is each loss level? Red = current exposure · Blue = after investment. The leftward shift shows risk reduction.
                  </p>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={lossChartData} margin={{top:4,right:0,left:0,bottom:0}}>
                      <defs>
                        <linearGradient id="gB" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#E05555" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#E05555" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={C.bright} stopOpacity={0.4}/>
                          <stop offset="95%" stopColor={C.bright} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="x" tickFormatter={v=>`${v.toFixed(0)}M`}
                        tick={{fontFamily:"'DM Mono',monospace",fontSize:9,fill:C.t4}}
                        tickLine={false} axisLine={false} interval="preserveStartEnd"/>
                      <YAxis hide/>
                      <Tooltip content={({active,payload})=>active&&payload?.length
                        ?<div style={{background:C.navyCard,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 12px",fontFamily:"'DM Mono',monospace",fontSize:11,color:C.t2}}>
                          {payload[0]?.payload?.x?.toFixed(0)} MSEK loss
                        </div>:null}/>
                      {d.riskAppetiteThreshold>0&&(
                        <ReferenceLine x={d.riskAppetiteThreshold} stroke={C.amber} strokeDasharray="4 3"
                          label={{value:"Appetite",position:"insideTopRight",fontSize:9,fill:C.amber}}/>
                      )}
                      <Area type="monotone" dataKey="before" fill="url(#gB)" stroke="#E05555" strokeWidth={1.5} dot={false}/>
                      <Area type="monotone" dataKey="after"  fill="url(#gA)" stroke={C.bright} strokeWidth={1.5} dot={false}/>
                    </AreaChart>
                  </ResponsiveContainer>
                  <div style={{display:"flex",gap:20,marginTop:10,justifyContent:"center"}}>
                    {[{c:"#E05555",l:"Before investment"},{c:C.bright,l:"After investment"},{c:C.amber,l:"Risk appetite threshold"}].map(i=>(
                      <div key={i.l} style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:C.t3}}>
                        <div style={{width:24,height:3,borderRadius:2,background:i.c,opacity:i.c===C.amber?0.8:1}}/>
                        {i.l}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB: ROI ── */}
            {resTab==="roi"&&(
              <div>
                <div className="fadein" style={{display:"flex",gap:10,marginBottom:14}}>
                  {[
                    {l:"Expected ROI",main:fR(result.roi.p50),sub:`Pessimistic: ${fR(result.roi.p10)} · Optimistic: ${fR(result.roi.p90)}`,c:result.roi.p50>=0?C.green:C.red},
                    {l:`Net value (${d.years} yrs)`,main:fM(result.net.p50),sub:`Pessimistic: ${fM(result.net.p10)} · Optimistic: ${fM(result.net.p90)}`,c:"#8A9EC4"},
                  ].map(k=>(
                    <div key={k.l} style={{flex:1,background:C.navyCard,border:`1px solid ${C.border}`,borderLeft:`4px solid ${k.c}`,borderRadius:"0 12px 12px 0",padding:"16px 20px"}}>
                      <div style={{fontSize:10,fontWeight:600,letterSpacing:".08em",textTransform:"uppercase",color:C.t3,marginBottom:6}}>{k.l}</div>
                      <div style={{fontFamily:"'Inter',sans-serif",fontSize:28,fontWeight:700,color:k.c,lineHeight:1}}>{k.main}</div>
                      <div style={{fontFamily:"'DM Mono',monospace",fontSize:9.5,color:C.t4,marginTop:6}}>{k.sub}</div>
                    </div>
                  ))}
                </div>
                <div className="fadein" style={{display:"flex",gap:10,marginBottom:14}}>
                  {[
                    {l:"Probability of positive return",main:`${result.positiveRate.toFixed(0)}%`,sub:"of simulated scenarios are profitable",c:result.positiveRate>=70?C.green:C.amber},
                    {l:"Estimated payback",main:`${result.payback.toFixed(1)} yrs`,sub:`against a ${d.years}-year horizon`,c:"#8A6AB8"},
                    {l:"Annual operational savings",main:fM(result.opSav),sub:"from efficiency gains only (excl. risk)",c:C.accent},
                  ].map(k=>(
                    <div key={k.l} style={{flex:1,background:C.navyCard,border:`1px solid ${C.border}`,borderLeft:`4px solid ${k.c}`,borderRadius:"0 12px 12px 0",padding:"14px 18px"}}>
                      <div style={{fontSize:9.5,fontWeight:600,letterSpacing:".08em",textTransform:"uppercase",color:C.t3,marginBottom:5}}>{k.l}</div>
                      <div style={{fontFamily:"'Inter',sans-serif",fontSize:22,fontWeight:700,color:k.c,lineHeight:1}}>{k.main}</div>
                      <div style={{fontFamily:"'DM Mono',monospace",fontSize:9.5,color:C.t4,marginTop:5}}>{k.sub}</div>
                    </div>
                  ))}
                </div>

                {/* ROI histogram */}
                <div className="fadein card" style={{padding:"22px 26px"}}>
                  <div style={{fontSize:15,fontWeight:700,color:C.t1,marginBottom:3}}>Distribution of ROI outcomes</div>
                  <p style={{fontSize:11.5,color:C.t3,marginBottom:16}}>Based on {result.N.toLocaleString()} simulations. Blue = profitable scenarios.</p>
                  <ResponsiveContainer width="100%" height={170}>
                    <BarChart data={result.roiHist} barCategoryGap="2%">
                      <XAxis dataKey="x" tickFormatter={v=>`${Math.round(v)}%`}
                        tick={{fontFamily:"'DM Mono',monospace",fontSize:9,fill:C.t4}}
                        tickLine={false} axisLine={false} interval={Math.floor(result.roiHist.length/5)}/>
                      <YAxis hide/>
                      <Tooltip content={({active,payload})=>active&&payload?.length
                        ?<div style={{background:C.navyCard,border:`1px solid ${C.border}`,borderRadius:7,padding:"6px 11px",fontFamily:"'DM Mono',monospace",fontSize:10,color:C.t2}}>
                          ROI ≈ {Math.round(payload[0]?.payload?.x)}%
                        </div>:null}/>
                      <ReferenceLine x={result.roiHist.find(h=>h.x>=0)?.x} stroke={C.border} strokeDasharray="3 3"/>
                      <Bar dataKey="count" radius={[2,2,0,0]}>
                        {result.roiHist.map((h,i)=><Cell key={i} fill={h.x>=0?C.accent:C.t4}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* ── TAB: BEFORE & AFTER ── */}
            {resTab==="ba"&&(
              <div className="fadein">
                {/* Summary panels */}
                <div style={{display:"flex",gap:10,marginBottom:14}}>
                  {[
                    {label:"Without investment",bg:"#1A0C0C",border:"#4A2020",eal:fM(result.eal.before),p90:fM(result.p90.before),c:"#E07070"},
                    {label:"With investment",  bg:"#0A1A10",border:"#1A4028",eal:fM(result.eal.after), p90:fM(result.p90.after), c:C.green},
                  ].map(s=>(
                    <div key={s.label} style={{flex:1,background:s.bg,border:`1px solid ${s.border}`,borderRadius:14,padding:"22px 24px",position:"relative",overflow:"hidden"}}>
                      <div style={{position:"absolute",top:"-25%",right:"-8%",width:160,height:160,borderRadius:"50%",
                        background:`radial-gradient(circle,${s.c}18 0%,transparent 70%)`}}/>
                      <div style={{fontSize:10,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:s.c,opacity:.7,marginBottom:14}}>{s.label}</div>
                      <div style={{marginBottom:12}}>
                        <div style={{fontSize:10,color:C.t4,marginBottom:3}}>Expected Annual Loss</div>
                        <div style={{fontFamily:"'Inter',sans-serif",fontSize:26,fontWeight:700,color:s.c,lineHeight:1}}>{s.eal}</div>
                      </div>
                      <div>
                        <div style={{fontSize:10,color:C.t4,marginBottom:3}}>Worst-case / year (P90)</div>
                        <div style={{fontFamily:"'Inter',sans-serif",fontSize:20,fontWeight:600,color:s.c,opacity:.85,lineHeight:1}}>{s.p90}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Comparison table */}
                <div className="card" style={{marginBottom:14}}>
                  <div className="stitle">Risk metrics — side by side</div>
                  <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:0}}>
                    {["Metric","Before","After","Reduction"].map(h=>(
                      <div key={h} style={{fontSize:9.5,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",
                        color:C.t4,paddingBottom:10,borderBottom:`1.5px solid ${C.border}`}}>{h}</div>
                    ))}
                    {[
                      {l:"Expected Annual Loss (EAL)",b:result.eal.before,a:result.eal.after},
                      {l:"P90 — worst-case / yr",b:result.p90.before,a:result.p90.after},
                      {l:"P95 — catastrophic loss",b:result.p95.before,a:result.p95.after},
                      {l:`Prob. of loss > ${d.riskAppetiteThreshold} MSEK`,b:appetiteCheck.probBefore,a:appetiteCheck.probAfter,pct:true},
                    ].map(r=>[
                      <div key={r.l+"l"} style={{padding:"9px 0",borderBottom:`1px solid ${C.border}`,fontSize:12.5,color:C.t2}}>{r.l}</div>,
                      <div key={r.l+"b"} style={{padding:"9px 0",borderBottom:`1px solid ${C.border}`,fontFamily:"'DM Mono',monospace",fontSize:11.5,color:"#C07070"}}>{r.pct?`${r.b.toFixed(1)}%`:fM(r.b)}</div>,
                      <div key={r.l+"a"} style={{padding:"9px 0",borderBottom:`1px solid ${C.border}`,fontFamily:"'DM Mono',monospace",fontSize:11.5,color:C.green}}>{r.pct?`${r.a.toFixed(1)}%`:fM(r.a)}</div>,
                      <div key={r.l+"d"} style={{padding:"9px 0",borderBottom:`1px solid ${C.border}`,fontFamily:"'DM Mono',monospace",fontSize:11.5,fontWeight:600,color:C.bright}}>{r.pct?`-${(r.b-r.a).toFixed(1)}pp`:fM(r.b-r.a)}</div>,
                    ])}
                  </div>
                </div>

                {/* Operational savings */}
                <div className="card">
                  <div className="stitle">Operational savings — detail</div>
                  <p style={{fontSize:12,color:C.t3,marginBottom:16}}>Annual savings from efficiency gains (separate from risk mitigation)</p>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    {[
                      {l:"Evidence collection",icon:"📋"},
                      {l:"Coordination savings",icon:"📅"},
                      {l:"Duplicate work eliminated",icon:"🔄"},
                      {l:"Automation efficiency",icon:"⚡"},
                      {l:"GRC team hours freed",icon:"👥"},
                      {l:"Other units hours freed",icon:"🏢"},
                    ].map(i=>(
                      <div key={i.l} style={{background:C.navyMid,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 14px",display:"flex",gap:10,alignItems:"center"}}>
                        <span style={{fontSize:16}}>{i.icon}</span>
                        <div style={{fontSize:12.5,color:C.t2}}>{i.l}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{marginTop:14,padding:"13px 16px",background:"#0A1826",borderRadius:10,border:`1px solid ${C.border}`,
                    display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:13,fontWeight:600,color:C.t1}}>Total annual operational savings</span>
                    <span style={{fontFamily:"'DM Mono',monospace",fontSize:17,fontWeight:700,color:C.green}}>{fM(result.opSav)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB: ASSUMPTIONS ── */}
            {resTab==="assumptions"&&(
              <div className="fadein">
                <div style={{background:"#0A1826",border:`1px solid ${C.border}`,borderRadius:12,
                  padding:"14px 18px",marginBottom:18,fontSize:12,color:C.t3,lineHeight:1.7}}>
                  {"📋 All assumptions entered into this business case. Ranged values show: "}
                  <span style={{color:C.t3}}>lowest</span>{" · "}
                  <span style={{fontFamily:"'DM Mono',monospace",fontWeight:700,color:C.bright}}>most likely</span>
                  {" · "}<span style={{color:C.t3}}>highest</span>
                  {". Use this view to fact-check before presenting to leadership."}
                </div>

                {[
                  {title:"Investment cost", rows:[
                    {l:"Annual license fee",              v:[d.licenseMin.toLocaleString(), d.licenseLikely.toLocaleString(), d.licenseMax.toLocaleString()], u:"SEK/yr"},
                    {l:"Implementation cost (one-time)",  v:[d.implMin.toLocaleString(), d.implLikely.toLocaleString(), d.implMax.toLocaleString()], u:"SEK"},
                    {l:"Analysis horizon",                s:String(d.years)+" years"},
                  ]},
                  {title:"Hourly rates", rows:[
                    {l:"Internal hourly rate",            v:[d.internalRateMin, d.internalRateLikely, d.internalRateMax], u:"SEK/hr"},
                    {l:"External auditor rate",           v:[d.externalRateMin, d.externalRateLikely, d.externalRateMax], u:"SEK/hr"},
                  ]},
                  {title:"Audit volume & current state", rows:[
                    {l:"Total audits per year",           v:[d.auditsMin, d.auditsLikely, d.auditsMax], u:"audits/yr"},
                    {l:"Size distribution",               s:d.distSmall+"% Small · "+d.distMedium+"% Medium · "+d.distLarge+"% Large"},
                    {l:"Hours per small audit",           v:[d.hoursSmallMin, d.hoursSmallLikely, d.hoursSmallMax], u:"hrs"},
                    {l:"Hours per medium audit",          v:[d.hoursMediumMin, d.hoursMediumLikely, d.hoursMediumMax], u:"hrs"},
                    {l:"Hours per large audit",           v:[d.hoursLargeMin, d.hoursLargeLikely, d.hoursLargeMax], u:"hrs"},
                    {l:"Evidence items per audit",        v:[d.evidenceMin, d.evidenceLikely, d.evidenceMax], u:"items"},
                    {l:"Time per evidence item — today",  v:[d.curTimeEvidMin, d.curTimeEvidLikely, d.curTimeEvidMax], u:"hr/item"},
                    {l:"Coordination hrs/audit — today",  v:[d.curCoordMin, d.curCoordLikely, d.curCoordMax], u:"hrs/audit"},
                  ]},
                  {title:"Future state after investment", rows:[
                    {l:"Target: time per evidence item",  s:d.futTimeEvid+" min/item"},
                    {l:"Target: coordination hrs/audit",  s:d.futCoordHours+" hrs/audit"},
                    {l:"Automation coverage",             v:[d.automationPercentMin, d.automationPercentLikely, d.automationPercentMax], u:"%"},
                    {l:"Time reduction on automated items",v:[d.automationEffectMin, d.automationEffectLikely, d.automationEffectMax], u:"%"},
                    {l:"Duplicate work reduction",        v:[d.dupRedMin, d.dupRedLikely, d.dupRedMax], u:"%"},
                    {l:"External auditor time reduction",  v:[d.extAudRedMin, d.extAudRedLikely, d.extAudRedMax], u:"%"},
                    {l:"GRC team hours freed per year",   v:[d.grcHoursMin, d.grcHoursLikely, d.grcHoursMax], u:"hrs/yr"},
                    {l:"Other units hours freed per year",v:[d.otherHoursMin, d.otherHoursLikely, d.otherHoursMax], u:"hrs/yr"},
                  ]},
                  {title:"Risk appetite", rows:[
                    {l:"Maximum acceptable loss",         s:d.riskAppetiteThreshold+" MSEK"},
                    {l:"Maximum acceptable probability",  s:d.riskAppetiteProb+"% per year"},
                    {l:"Full appetite statement",         s:"≤"+d.riskAppetiteProb+"% probability of loss > "+d.riskAppetiteThreshold+" MSEK / yr"},
                  ]},
                  {title:"Value ramp-up", rows:[
                    {l:"Implementation delay",            v:[d.delayMin, d.delayLikely, d.delayMax], u:"months"},
                    {l:"Year 1 value realisation",        v:[d.rampY1Min+"%", d.rampY1Likely+"%", d.rampY1Max+"%"]},
                    {l:"Year 2 value realisation",        v:[d.rampY2Min+"%", d.rampY2Likely+"%", d.rampY2Max+"%"]},
                    {l:"Year 3+ value realisation",       v:[d.rampY3Min+"%", d.rampY3Likely+"%", d.rampY3Max+"%"]},
                  ]},
                ].map(section=>(
                  <div key={section.title} className="card" style={{marginBottom:12,padding:"20px 24px"}}>
                    <div className="stitle">{section.title}</div>
                    {section.rows.map((row,i,arr)=>(
                      <div key={row.l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                        padding:"9px 0",borderBottom:i<arr.length-1?`1px solid ${C.border}`:"none",gap:16}}>
                        <span style={{fontSize:12.5,color:C.t2}}>{row.l}</span>
                        {row.v
                          ? <div style={{display:"flex",gap:7,alignItems:"center",flexShrink:0}}>
                              <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:C.t3}}>{row.v[0]}</span>
                              <span style={{fontSize:9,color:C.t4}}>·</span>
                              <span style={{fontFamily:"'DM Mono',monospace",fontSize:13,fontWeight:700,color:C.bright}}>{row.v[1]}</span>
                              <span style={{fontSize:9,color:C.t4}}>·</span>
                              <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:C.t3}}>{row.v[2]}</span>
                              {row.u&&<span style={{fontSize:10,color:C.t4,marginLeft:2}}>{row.u}</span>}
                            </div>
                          : <span style={{fontFamily:"'DM Mono',monospace",fontSize:12,fontWeight:600,color:C.bright,flexShrink:0}}>{row.s}</span>
                        }
                      </div>
                    ))}
                  </div>
                ))}

                {/* Risk events */}
                <div className="card" style={{marginBottom:12,padding:"20px 24px"}}>
                  <div className="stitle">Risk events</div>
                  {d.risks.filter(r=>r.active).length===0
                    ? <p style={{fontSize:12,color:C.t4,fontStyle:"italic"}}>No active risk events.</p>
                    : d.risks.filter(r=>r.active).map((r,i,arr)=>(
                        <div key={r.id} style={{paddingBottom:i<arr.length-1?18:0,marginBottom:i<arr.length-1?18:0,
                          borderBottom:i<arr.length-1?`1px solid ${C.border}`:"none"}}>
                          <div style={{fontSize:13,fontWeight:600,color:C.t1,marginBottom:10}}>{r.name}</div>
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                            {[
                              {l:"Annual probability", val:r.freqLikely+"% / yr"},
                              {l:"Impact range",       val:r.impMin+" – "+r.impLikely+" – "+r.impMax+" MSEK"},
                              {l:"Risk reduction",     val:r.reduction+"%"},
                            ].map(f=>(
                              <div key={f.l} style={{background:C.navyMid,border:`1px solid ${C.border}`,borderRadius:9,padding:"10px 13px"}}>
                                <div style={{fontSize:9.5,color:C.t4,textTransform:"uppercase",letterSpacing:".07em",marginBottom:6}}>{f.l}</div>
                                <div style={{fontFamily:"'DM Mono',monospace",fontSize:13,fontWeight:600,color:C.bright}}>{f.val}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                  }
                  {d.risks.filter(r=>!r.active).length>0&&(
                    <div style={{marginTop:14,paddingTop:12,borderTop:`1px solid ${C.border}`,fontSize:11,color:C.t4}}>
                      Inactive (excluded): {d.risks.filter(r=>!r.active).map(r=>r.name).join(", ")}
                    </div>
                  )}
                </div>

                <div style={{display:"flex",justifyContent:"center",marginTop:8,marginBottom:4}}>
                  <button onClick={()=>setStep(0)} className="btn-ghost" style={{fontSize:12}}>
                    ✏️ Edit assumptions
                  </button>
                </div>
              </div>
            )}

            <div style={{display:"flex",justifyContent:"center",marginTop:24}}>
              <button onClick={restart} className="btn-ghost">← Rebuild business case</button>
            </div>
          </div>
        )}

        {/* NAVIGATION */}
        {step>=0&&step<STEPS-1&&(
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:26}}>
            <button onClick={()=>setStep(s=>s-1)} className="btn-ghost" style={{visibility:step===0?"hidden":"visible"}}>← Back</button>
            <button onClick={next} disabled={running} className="btn-cta">
              {step===STEPS-2?(running?"Simulating...":"Run simulation →"):"Next →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}