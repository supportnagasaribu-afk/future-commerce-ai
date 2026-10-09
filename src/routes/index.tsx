import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState, useMemo, type FormEvent } from 'react';
import { ArrowRight, ArrowUpRight, ArrowUp, Sparkles, BrainCircuit, ScanSearch, Network, ShoppingBag, Music2, Smartphone, Footprints, TrendingUp, Radar, Check, SlidersHorizontal, Menu, X, Play, Store, Package, Megaphone, ShieldCheck, Fingerprint, Layers, Database, RefreshCw, Box, ChartNoAxesCombined, GitCompareArrows, ChevronRight, CircleDot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
const logoUrl = '/BarangViral%20Speed%20Shopping%20Logo.png';
const footerLogoUrl = '/footer.png';
import heroImage from '@/assets/commerce-hero.jpg';
import lampImage from '@/assets/product-0.jpg';
import fanImage from '@/assets/product-1.jpg';
import organizerImage from '@/assets/product-2.jpg';

export const Route = createFileRoute('/')({
 head: () => ({ meta: [
 {title:'BarangViral.Store — AI-Powered Commerce. Smarter Decisions.'},
 {name:'description',content:'Discover the future of intelligent commerce. Explore AI shopping, Viral Radar, and smarter opportunities for buyers, sellers, suppliers, and partners.'},
 {property:'og:title',content:'BarangViral.Store — AI-Powered Commerce'},
 {property:'og:description',content:'From intelligence to discovery, matching, and commerce. Explore the BarangViral.Store marketplace concept.'},
 {property:'og:type',content:'website'}, {name:'twitter:card',content:'summary_large_image'},
 ]}), component: Index,
});
const steps = [
 {name:'AI',title:'Understand Intent',description:'AI understands what buyers, sellers, suppliers and partners need.',icon:BrainCircuit},
 {name:'INTELLIGENCE',title:'Turn Data Into Opportunity',description:'Transform commerce signals into useful intelligence.',icon:ChartNoAxesCombined},
 {name:'DISCOVERY',title:'Find What Matters',description:'Discover trending products, emerging opportunities and relevant products.',icon:ScanSearch},
 {name:'MATCHING',title:'Connect the Right People',description:'Match buyers, sellers, suppliers and partners intelligently.',icon:Network},
 {name:'COMMERCE',title:'Turn Opportunities Into Sales',description:'Convert better recommendations and connections into real commerce.',icon:ShoppingBag},
];
type ShoppingProduct = {
 id:string; name:string; brand:string|null; image_url:string|null; current_price:number|null;
 original_price:number|null; discount_percent:number|null; rating:number|null; review_count:number;
 sold_count:number; description:string|null; category_name:string|null; source:string|null;
 product_url:string|null; viral_score:number;
};

const audiences = [
 {id:'buyers',label:'FOR BUYERS',title:'Shop Smarter With AI',icon:ShoppingBag,features:['AI product recommendations','Product comparison','Personalized discovery','Smart search','AI shopping assistant'],cta:'Find your next discovery'},
 {id:'sellers',label:'FOR SELLERS',title:'Sell Smarter With AI',icon:Store,features:['AI product optimization','Pricing intelligence','Product analysis','Marketing ideas','Campaign assistance','AI sales insights'],cta:'Explore seller intelligence'},
 {id:'suppliers',label:'FOR SUPPLIERS',title:'Find New Commerce Opportunities',icon:Package,features:['Product opportunity discovery','Market intelligence','Seller matching','Partner matching','Demand signals'],cta:'Discover opportunities'},
 {id:'partners',label:'FOR VIRAL PARTNERS',title:'Know What To Promote',icon:Megaphone,features:['Trending product discovery','Opportunity scoring','AI content ideas','Product recommendations','Performance insights'],cta:'Explore partner opportunities'},
];
const wheel = [{name:'PRODUCT',icon:Box},{name:'DATA',icon:Database},{name:'AI INTELLIGENCE',icon:BrainCircuit},{name:'DISCOVERY',icon:ScanSearch},{name:'MATCHING',icon:Network},{name:'TRANSACTION',icon:ShoppingBag},{name:'MORE DATA',icon:Layers},{name:'SMARTER AI',icon:RefreshCw}];
const nav = [{label:'Home',href:'#home'},{label:'Discover',href:'#discover'},{label:'AI Shopping',href:'#ai-shopping'},{label:'Viral Radar',href:'#viral-radar'},{label:'For Sellers',href:'#sellers'},{label:'For Partners',href:'#partners'}];
const productImages = [lampImage, fanImage, organizerImage];
type RadarProduct = { product_id:string; name:string; brand:string|null; image_url:string|null; current_price:number|null; currency:string; viral_score:number; radar_status:string; trend_direction:string|null; google_score:number; tiktok_score:number; social_score:number; sales_score:number; growth_score:number; engagement_score:number; commerce_score:number; signal_source:string|null; signal_is_proxy:boolean; proxy_basis:string|null; signal_recorded_at:string|null };
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://bzrhhuupcnfgxejndxjo.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_MzM7ufbE0ajl9uk4eowbtw_eJNpjofH';

function AdSlot() {
 return <section className="ad-slot" aria-label="Advertisement">
  <div className="container-wide ad-slot-inner">
   <span className="ad-slot-label">ADVERTISEMENT</span>
   <div id="container-27e550765092d2708883eee468b3a67f" />
  </div>
 </section>;
}

function InPagePushSlot() {
 const banners = [
  {name:'SkillUp',label:'LEARNING',href:'https://invl.app/clo2wt5',logo:'https://img.involve.asia/rpss/campaigns_banners/1785915861-o6Y3wIEkPSbgQvBRvwoa2zmc6aYuRBul.png'},
  {name:"Kiehl's",label:'BEAUTY',href:'https://invl.us/clo2wsx',logo:'https://img.involve.asia/rpss/campaigns_banners/1786592557-eYGnGzDK3lJVZqI2TmDIkzTActjr8HHw.jpg'},
  {name:"Domino's Pizza",label:'FOOD & DELIVERY',href:'https://invl.me/clo2wtn',logo:'https://img.involve.asia/rpss/campaigns_banners/1751339076-WkpULRGhkxItbQ8QN8oqcEYgXUXbk6oX.png'},
  {name:'JD Sports',label:'SPORT & STYLE',href:'https://invl.me/clo2wms',logo:'https://img.involve.asia/rpss/campaigns_banners/38283-F6wDTqEGPyg3fu4ajrl3FTsB9UY8nAk9.jpeg'},
 ];
 return <section className="inpage-push-slot" aria-label="Sponsored banner advertisements">
  <div className="container-wide inpage-push-inner">
   <span className="inpage-push-label">ADVERTISEMENT</span>
   <div className="ad-banner-grid">
    {banners.map((banner)=><a key={banner.name} className="ad-banner-card" href={banner.href} target="_blank" rel="noopener noreferrer" aria-label={`Open ${banner.name} offer`}>
      <div className="ad-banner-art"><img src={banner.logo} alt={`${banner.name} logo`} loading="lazy"/><span>{banner.name}</span></div>
      <div className="ad-banner-copy"><strong>{banner.name}</strong><span>{banner.label} · SPONSORED</span></div>
    </a>)}
   </div>
   <div id="inpage-push-ad-slot" />
  </div>
 </section>;
}
function ProductVisual({product}:{product:ShoppingProduct}) {return <div className="product-visual">{product.image_url ? <img src={product.image_url} alt={product.name} width={512} height={512} loading="lazy"/> : <div className="radar-image-placeholder"><Package size={22}/><span>Product image unavailable</span></div>}</div>}

function Eyebrow({children}:{children:React.ReactNode}) {return <div className="eyebrow"><span className="eyebrow-dot"/>{children}</div>}
function Index() {
 useEffect(() => {
  const containerId = 'container-27e550765092d2708883eee468b3a67f';
  const scriptSrc = 'https://bauval.org/21/27e550765092d2708883eee468b3a67f';
  if (document.querySelector('script[data-barangviral-ad="bauval"]')) return;
  const script = document.createElement('script');
  script.async = true;
  script.setAttribute('data-cfasync', 'false');
  script.setAttribute('data-barangviral-ad', 'bauval');
  script.src = scriptSrc;
  const container = document.getElementById(containerId);
  if (container) container.appendChild(script);
  return () => script.remove();
 }, []);

 useEffect(() => {
  let cancelled=false;
  async function loadShoppingProducts() {
   try {
    const res=await fetch(SUPABASE_URL+'/rest/v1/products?select=id,name,brand,image_url,current_price,original_price,discount_percent,rating,review_count,sold_count,description,viral_score,source,product_url&order=viral_score.desc,created_at.desc&limit=50',{headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+SUPABASE_KEY}});
    if(!res.ok) throw new Error('Shopping product request failed');
    const data=await res.json();
    const mapped=Array.isArray(data)?data.map((p:any)=>({...p,category_name:null})):[]; 
    if(!cancelled) setShoppingProducts(mapped);
   } catch { if(!cancelled) setShoppingProducts([]); }
   finally { if(!cancelled) setShoppingLoading(false); }
  }
  loadShoppingProducts();
  return ()=>{cancelled=true};
 }, []);

 useEffect(() => {
  let cancelled = false;
  async function loadRadar() {
   try {
    const res = await fetch(SUPABASE_URL + '/rest/v1/viral_radar_v1?select=*&signal_source=eq.Xiaomi%20Official%20Store%20Commerce%20Proxy&order=viral_score.desc&limit=3', {headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+SUPABASE_KEY}});
    if (!res.ok) throw new Error('Radar request failed');
    const data = await res.json();
    if (!cancelled) setRadarProducts(Array.isArray(data) ? data : []);
   } catch { if (!cancelled) setRadarProducts([]); }
   finally { if (!cancelled) setRadarLoading(false); }
  }
  loadRadar();
  return () => { cancelled = true; };
 }, []);


 const [mobileOpen,setMobileOpen] = useState(false);
 const [input,setInput] = useState('');
 const [request,setRequest] = useState('Find me the best products under RM100 for a small home.');
 const [submitted,setSubmitted] = useState(false);
 const [shoppingProducts,setShoppingProducts] = useState<ShoppingProduct[]>([]);
 const [shoppingLoading,setShoppingLoading] = useState(true);
 const [modal,setModal] = useState<{type:string;index?:number;title?:string}|null>(null);
 const [radarProducts,setRadarProducts] = useState<RadarProduct[]>([]);
 const [radarLoading,setRadarLoading] = useState(true);

 function parseBudget(text:string) {
  const m=text.match(/(?:under|below|less than|max(?:imum)?|budget(?: of)?)\s*RM?\s*(\d+(?:\.\d+)?)/i) || text.match(/RM\s*(\d+(?:\.\d+)?)/i);
  return m ? Number(m[1]) : null;
 }
 function scoreShoppingProduct(p:ShoppingProduct,text:string) {
  const q=text.toLowerCase(), words=q.split(/[^a-z0-9]+/).filter(w=>w.length>2);
  const hay=[p.name,p.brand,p.description,p.category_name].filter(Boolean).join(' ').toLowerCase();
  let score=0;
  for(const w of words) if(hay.includes(w)) score+=18;
  const budget=parseBudget(text);
  if(budget!==null && p.current_price!==null) score += p.current_price<=budget ? 35 : -45;
  if(/small|compact|space|room|home|house|desk/i.test(q) && /tag|speaker|band|watch|bud|headphone|essential/i.test(hay)) score+=12;
  if(/audio|music|speaker|sound/i.test(q) && /speaker|buds|headphone/i.test(hay)) score+=30;
  if(/fitness|health|watch|band/i.test(q) && /band|watch/i.test(hay)) score+=30;
  if(/tablet|ipad|screen|study/i.test(q) && /pad|tablet/i.test(hay)) score+=30;
  if(/tv|television/i.test(q) && /tv|television/i.test(hay)) score+=30;
  if(p.rating) score+=Math.min(10,p.rating*2);
  score+=Math.min(10,p.viral_score/10);
  return score;
 }
 function recommendationReason(p:ShoppingProduct,text:string,budget:number|null) {
  const r:string[]=[];
  if(budget!==null && p.current_price!==null && p.current_price<=budget) r.push('within RM'+budget+' budget');
  if(/small|compact|space|room|home/i.test(text) && /tag|speaker|band|watch|bud|headphone/i.test(p.name.toLowerCase())) r.push('compact everyday use');
  if(/audio|music|sound/i.test(text) && /speaker|buds|headphone/i.test(p.name.toLowerCase())) r.push('matches your audio need');
  if(/fitness|health|watch|band/i.test(text) && /band|watch/i.test(p.name.toLowerCase())) r.push('matches your fitness need');
  if(!r.length) r.push(p.category_name ? 'matches '+p.category_name.toLowerCase() : 'matches your request');
  return r.slice(0,2).join(' · ');
 }
 function submit(e:FormEvent) {e.preventDefault();if(!input.trim())return;setRequest(input.trim());setInput('');setSubmitted(true)}
 function scrollTo(id:string) {document.getElementById(id)?.scrollIntoView({behavior:'smooth'});setMobileOpen(false)}
 const budget=parseBudget(request);
 const recommendedProducts=useMemo(()=>{const eligible=budget===null?shoppingProducts:shoppingProducts.filter(p=>p.current_price!==null&&p.current_price<=budget);return [...eligible].sort((a,b)=>scoreShoppingProduct(b,request)-scoreShoppingProduct(a,request)).slice(0,3)},[shoppingProducts,request,budget]);
 const selected=modal?.index!==undefined ? recommendedProducts[modal.index] : undefined;
 return <>
 <header className="site-header" id="home"><div className="container-wide header-inner">
 <a href="#home" aria-label="BarangViral.Store home"><img className="brand-image" src={logoUrl} alt="BarangViral.Store" width={1920} height={640}/></a>
 <nav className="desktop-nav" aria-label="Main navigation">{nav.map((n,i)=><a key={n.label} className={i===0?'active':''} href={n.href}>{n.label}</a>)}</nav>
 <Button variant="commerce" className="header-cta" onClick={()=>scrollTo('ai-shopping')}>Explore with AI <ArrowUpRight/></Button>
 <Button variant="light" size="icon" className="mobile-menu-toggle" aria-label={mobileOpen?'Close menu':'Open menu'} aria-expanded={mobileOpen} onClick={()=>setMobileOpen(!mobileOpen)}>{mobileOpen?<X/>:<Menu/>}</Button>
 </div>{mobileOpen&&<nav className="mobile-nav" aria-label="Mobile navigation">{nav.map(n=><a key={n.label} href={n.href} onClick={()=>setMobileOpen(false)}>{n.label}</a>)}</nav>}</header>
 <main>
 <section className="hero"><img src={heroImage} className="hero-art" alt="Products connected by a sculptural orange commerce orbit" width={1920} height={1024} fetchPriority="high"/>
 <div className="container-wide hero-copy"><Eyebrow>THE NEXT GENERATION OF AI COMMERCE</Eyebrow>
 <h1>AI-Powered Commerce.<br/><span>Smarter Decisions.</span></h1>
 <p className="hero-description">Discover products, identify opportunities, connect the right people,<br className="hidden sm:block"/> and turn intelligence into commerce.</p>
 <div className="hero-actions"><Button variant="commerce" onClick={()=>scrollTo('ai-shopping')}><Sparkles/>Explore AI Commerce<ArrowUpRight/></Button><Button variant="light" onClick={()=>scrollTo('discover')}><Play size={13}/>See How It Works</Button></div>
 <div className="hero-flow" aria-label="AI to intelligence to discovery to matching to commerce">{steps.map((s,i)=><span key={s.name} className="contents"><span className={`flow-word ${i===0?'first':''}`}><s.icon/>{s.name}</span>{i<4&&<ArrowRight className="flow-arrow"/>}</span>)}</div>
 </div><div className="hero-footnote">INTELLIGENCE AT THE CORE. COMMERCE AT THE EDGE.</div></section>
 <AdSlot />
 <section className="journey" id="discover"><div className="container-wide"><div className="section-heading centered"><Eyebrow>ONE CONNECTED JOURNEY</Eyebrow><h2>From intent to opportunity. From opportunity to commerce.</h2><p>Five intelligent stages. One seamlessly connected ecosystem.</p></div><div className="journey-grid">{steps.map((s,i)=><article className="journey-stage" key={s.name}><div className="stage-icon"><s.icon size={20} strokeWidth={1.5}/></div>{i<4&&<div className="stage-line"><ChevronRight/></div>}<div className="stage-number">STEP 0{i+1}</div><h3>{s.name}</h3><h4>{s.title}</h4><p>{s.description}</p></article>)}</div></div></section>
 <section className="section assistant-section" id="ai-shopping"><div className="container-wide"><div className="section-topline"><div className="section-heading"><Eyebrow>YOUR INTELLIGENT SHOPPING COMPANION</Eyebrow><h2>Not just search. Understanding.</h2><p>A shopping experience that starts with what you need — not what you type.</p></div><span className="demo-tag"><CircleDot size={11}/>{shoppingLoading?'CONNECTING TO PRODUCT DATA':'LIVE PRODUCT DATA · V1'}</span></div>
 <div className="assistant-window"><div className="assistant-titlebar"><div className="assistant-name"><span className="ai-mark"><Sparkles size={16}/></span>BarangViral AI<span className="text-muted-foreground font-normal hidden sm:inline">/ Shopping assistant</span></div><span className="assistant-status"><span className="eyebrow-dot"/>{shoppingLoading?'CONNECTING':'LIVE MATCHING'}</span></div>
 <div className="assistant-body"><div className="chat-side"><div className="user-message">{request}</div><div className="ai-message"><span className="ai-mark shrink-0"><Sparkles size={15}/></span><div><strong>{submitted?'Here’s what matches your request.':'Try describing what you need.'}</strong><p>{shoppingLoading?'Loading the current BarangViral product catalogue…':shoppingProducts.length?'I matched your request against '+shoppingProducts.length+' products in our live catalogue. The ranking uses your wording, budget and product attributes — no paid AI API is required.':'Product data is temporarily unavailable. Please try again shortly.'}</p>{!shoppingLoading&&shoppingProducts.length>0&&<div className="intent-chips"><span><Check size={9} className="inline mr-1"/>{budget!==null?'Under RM'+budget:'Budget understood'}</span><span>Product matching</span><span>BarangViral catalogue</span></div>}</div></div><div className="assistant-tip"><BrainCircuit size={14} className="inline mr-2 text-primary"/>Rule-based intelligence first: understand intent, match products, rank options.</div>
 <form className="chat-input" onSubmit={submit}><input aria-label="Ask the AI shopping assistant" value={input} onChange={e=>setInput(e.target.value)} placeholder="Tell me what you’re looking for…"/><Button variant="commerce" size="icon" aria-label="Send request" type="submit" disabled={!input.trim()||shoppingLoading}><ArrowUp/></Button></form></div>
 <div className="suggestions"><div className="suggestions-heading">MATCHED FOR YOU <span>{shoppingLoading?'Loading…':recommendedProducts.length+' recommendations'}</span></div>{shoppingLoading?[0,1,2].map(i=><div className="product-row" key={i}><div className="product-visual"/><div className="min-w-0"><h4>Finding products…</h4><p>Reading live catalogue data</p></div><span className="product-price">—</span></div>):recommendedProducts.map((p)=><div className="product-row" key={p.id}><ProductVisual product={p}/><div className="min-w-0"><h4>{p.name}</h4><p>{recommendationReason(p,request,budget)}</p><small><Check size={10}/>Matched from live catalogue</small></div><span className="product-price">{p.current_price!==null?'RM'+Number(p.current_price).toFixed(0):'—'}</span></div>)}{!shoppingLoading&&!recommendedProducts.length&&<div className="dialog-note">No matching products found yet. Try a broader request such as “products under RM100” or “something for fitness”.</div>}<div className="compare-action"><span>Powered by Supabase product data · No paid AI API</span>{recommendedProducts.length>1&&<Button variant="outline" size="sm" onClick={()=>setModal({type:'compare'})}><GitCompareArrows/>Compare options</Button>}</div></div></div></div>
 </div></section>
 <InPagePushSlot />
 <section className="sponsored-offers" aria-label="Sponsored offers">
  <div className="container-wide sponsored-offers-inner">
   <div>
    <span className="sponsored-offers-label">SPONSORED OFFERS</span>
    <h3>Discover more offers selected for you.</h3>
    <p>Explore additional offers and discoveries beyond the products shown above.</p>
   </div>
   <a className="sponsored-offers-cta" href="https://invl.app/clo2wif" target="_blank" rel="noopener noreferrer">Explore Offers <ArrowUpRight size={14}/></a>
  </div>
 </section>
 <section className="section" id="viral-radar"><div className="container-wide"><div className="section-topline"><div className="section-heading"><Eyebrow><Radar size={13}/>SIGNALS. NOT GUESSWORK.</Eyebrow><h2>Viral Radar <span className="text-primary">AI</span></h2><p>Discover products before the trend becomes obvious.</p></div><span className="demo-tag"><SlidersHorizontal size={11}/>LIVE SIGNAL ENGINE · V1</span></div><div className="radar-grid">{radarLoading ? [0,1,2].map(i=><article className="radar-card" key={i}><div className="radar-content"><span className="radar-category">VIRAL RADAR</span><h3>Loading intelligence…</h3><div className="metrics"><div className="metric"><span>Viral Score</span><strong>—</strong></div><div className="metric"><span>Growth</span><strong>—</strong></div><div className="metric"><span>Demand</span><strong>—</strong></div></div></div></article>) : radarProducts.length ? radarProducts.map((p)=><article className="radar-card" key={p.product_id}><div className="radar-image">{p.image_url ? <div className="product-visual"><img src={p.image_url} alt={p.name} width={512} height={1024} loading="lazy"/></div> : <div className="radar-image-placeholder"><Package size={28}/><span>Official Store Signal</span></div>}<span className="radar-label"><TrendingUp size={11}/>{p.signal_is_proxy ? 'COMMERCE SIGNAL' : p.radar_status}</span></div><div className="radar-content"><span className="radar-category">{p.brand || 'PRODUCT SIGNAL'}</span><h3>{p.name}</h3>{p.current_price !== null && <div className="radar-price">RM{Number(p.current_price).toFixed(2)}</div>}<div className="metrics">{p.signal_is_proxy ? <><div className="metric"><span>Commerce Signal</span><strong className="metric-positive">{Number(p.commerce_score||0).toFixed(0)}/100</strong></div><div className="metric"><span>Discount</span><strong>Store data</strong></div><div className="metric"><span>Availability</span><strong>Official</strong></div></> : <><div className="metric"><span>Viral Score</span><strong className="metric-positive">{Number(p.viral_score).toFixed(0)}/100</strong></div><div className="metric"><span>Growth Score</span><strong>{Number(p.growth_score||0).toFixed(0)}/100</strong></div><div className="metric"><span>Demand Signal</span><strong>{Number(p.sales_score||0).toFixed(0)}/100</strong></div><div className="metric"><span>Engagement</span><strong>{Number(p.engagement_score||0).toFixed(0)}/100</strong></div><div className="metric"><span>Search</span><strong>{Number(p.google_score||0).toFixed(0)}/100</strong></div><div className="metric"><span>Social</span><strong>{Number(p.social_score||0).toFixed(0)}/100</strong></div></>}</div><div className="recommendation"><strong><Sparkles size={11}/>{p.signal_is_proxy ? 'COMMERCE SIGNAL' : 'RADAR SIGNAL'}</strong>{p.signal_is_proxy ? 'Based on observed official-store commerce data. This is not a viral or social-trend measurement.' : (p.trend_direction ? `Status: ${p.trend_direction}. The score is calculated from the latest available signals.` : 'The radar is ready for incoming product signals.')}</div><Button variant="ghost" className="insight-button" onClick={()=>setModal({type:'radar',title:p.name})}>View product intelligence<ArrowUpRight/></Button></div></article>) : <article className="radar-card"><div className="radar-content"><span className="radar-category">SIGNAL ENGINE V1</span><h3>No live product signals yet.</h3><p>Viral Radar is connected to Supabase and will populate as products and trend signals enter the system.</p></div></article>}</div></div></section>
 <section className="section audience-section"><div className="container-wide"><div className="section-heading centered"><Eyebrow>BUILT FOR EVERY SIDE OF COMMERCE</Eyebrow><h2>Different ambitions. One intelligent ecosystem.</h2><p>The right intelligence for the role you play.</p></div><div className="audience-grid">{audiences.map(a=><article className="audience" id={a.id} key={a.id}><a.icon className="audience-icon" size={27} strokeWidth={1.5}/><div className="audience-label">{a.label}</div><h3>{a.title}</h3><ul>{a.features.map(f=><li key={f}><Check/>{f}</li>)}</ul><Button variant="ghost" onClick={()=>a.id==='buyers'?scrollTo('ai-shopping'):setModal({type:'audience',title:a.label})}>{a.cta}<ArrowUpRight/></Button></article>)}</div></div></section>
 <section className="section flywheel-section" id="ai-commerce"><div className="container-wide flywheel-layout"><div className="section-heading"><Eyebrow>THE AI COMMERCE FLYWHEEL</Eyebrow><h2>Every connection.<br/>A smarter ecosystem.</h2><p>Products create data. Data creates intelligence. Intelligence creates better discovery, stronger matches, and more meaningful commerce.</p><div className="flywheel-note">And with every transaction, the cycle begins again — making the next experience smarter than the last.</div></div><div><div className="flywheel"><div className="flywheel-ring"/><div className="flywheel-center"><BrainCircuit/><span>INTELLIGENT<br/>COMMERCE</span></div>{wheel.map((w,i)=><div className={`wheel-node wheel-node-${i}`} key={w.name}><w.icon strokeWidth={1.5}/><span>{w.name}</span><em aria-hidden="true">↘</em></div>)}</div><div className="flywheel-caption">A CONTINUOUS CYCLE OF COMMERCE INTELLIGENCE</div></div></div></section>
 <section className="vision" id="about"><div className="container-wide vision-inner"><div className="section-heading"><Eyebrow>OUR VISION</Eyebrow><h2>The Future of Commerce<br/>Is Intelligent.</h2></div><div className="vision-copy"><p>BarangViral.Store is being built to connect people, products, data and opportunities through AI. Not simply another marketplace — an intelligent foundation for how commerce discovers, connects and grows.</p><p>A future where better understanding leads to better decisions. For everyone.</p><div className="vision-principles"><span><ShieldCheck/>Trust by design</span><span><Fingerprint/>Human-centered AI</span><span><Network/>Connected opportunities</span></div></div></div></section>
 <section className="final-cta"><Eyebrow>INTELLIGENCE MEETS OPPORTUNITY</Eyebrow><h2>Welcome to the Next<br/>Generation of Commerce.</h2><p>A smarter way to discover. A better way to connect. A new way to grow.</p><div className="hero-actions"><Button variant="secondary" className="primary-final" onClick={()=>scrollTo('ai-shopping')}>Explore BarangViral<ArrowUpRight/></Button><Button variant="outline" className="secondary-final" onClick={()=>setModal({type:'coming'})}>Join the Coming Marketplace<ArrowRight/></Button></div></section>
 </main>
 <footer className="footer"><div className="container-wide"><div className="footer-top"><div><a href="#home" aria-label="BarangViral.Store home"><img src={footerLogoUrl} className="brand-image footer-brand-image" alt="BarangViral.Store" width={1920} height={640} loading="lazy"/></a><p>AI E-Commerce Marketplace</p></div><nav className="footer-links" aria-label="Footer navigation"><a href="#about">About</a><a href="#ai-commerce">AI Commerce</a><a href="#buyers">For Buyers</a><a href="#sellers">For Sellers</a><a href="#suppliers">For Suppliers</a><a href="#partners">For Partners</a>{['Contact','Privacy','Terms'].map(t=><Button variant="link" key={t} onClick={()=>setModal({type:'info',title:t})}>{t}</Button>)}</nav></div><div className="footer-bottom"><span>© 2026 BarangViral.Store. All rights reserved.</span><span>UI/UX concept · Not a live marketplace</span><span>AI → Intelligence → Discovery → Matching → Commerce</span></div></div></footer>
 <Dialog open={modal!==null} onOpenChange={open=>{if(!open)setModal(null)}}><DialogContent className="max-w-xl w-[calc(100%-32px)] rounded-lg"><DialogTitle>{modal?.type==='compare'?'Compare your matched products':modal?.type==='insight'?selected?.name:modal?.type==='coming'?'The next generation is taking shape.':modal?.type==='audience'?`${modal.title?.replace('FOR ','')} · Coming marketplace`:modal?.title}</DialogTitle><DialogDescription>{modal?.type==='compare'?'Illustrative product comparison · Concept/demo data':modal?.type==='insight'?'Viral Radar AI · Illustrative intelligence, not live market analysis':modal?.type==='coming'?'BarangViral.Store is a UI/UX concept. Marketplace registration is not open yet.':modal?.type==='audience'?'A preview of the intelligence tools planned for the future marketplace.':'BarangViral.Store · Marketplace concept'}</DialogDescription>
 {modal?.type==='compare'&&<><div className="overflow-x-auto"><table className="comparison-table"><thead><tr><th>Product</th><th>Price</th><th>Why it matched</th></tr></thead><tbody>{recommendedProducts.map(p=><tr key={p.id}><td>{p.name}</td><td>{p.current_price!==null?'RM'+Number(p.current_price).toFixed(2):'—'}</td><td>{recommendationReason(p,request,budget)}</td></tr>)}</tbody></table></div><p className="dialog-note">These are live catalogue products from BarangViral. Matching is based on your request, budget and available product attributes.</p></>}
 {modal?.type==='insight'&&selected&&<><div className="metrics py-4"><div className="metric"><span>Price</span><strong>{selected.current_price!==null?'RM'+Number(selected.current_price).toFixed(2):'—'}</strong></div><div className="metric"><span>Rating</span><strong>{selected.rating?selected.rating.toFixed(1):'—'}</strong></div><div className="metric"><span>Reviews</span><strong>{selected.review_count||0}</strong></div><div className="metric"><span>Viral Score</span><strong>{Number(selected.viral_score||0).toFixed(0)}/100</strong></div></div><div className="recommendation"><strong><Sparkles size={12}/>MATCHING REASON</strong>{recommendationReason(selected,request,budget)}</div><p className="dialog-note">This recommendation comes from the BarangViral product catalogue. No paid AI API is used for this V1 matching engine.</p><Button variant="commerce" onClick={()=>{setModal(null);scrollTo('ai-shopping')}}>Back to AI Shopping<ArrowRight/></Button></>}

 {modal?.type==='offer'&&<><p className="dialog-note">This is a concept offer preview. Offer details, seller information and purchase links will be connected when the marketplace is operational.</p><Button variant="commerce" onClick={()=>{setModal(null);scrollTo('ai-shopping')}}>Explore with AI<ArrowRight/></Button></>}
 {modal?.type==='coming'&&<><p className="dialog-note">Explore the shopping assistant, product intelligence, and connected commerce journey today. Accounts, seller onboarding, and transactions will come in a future phase. No personal information is collected by this prototype.</p><Button variant="commerce" onClick={()=>{setModal(null);scrollTo('discover')}}>Explore the vision<ArrowRight/></Button></>}
 {modal?.type==='audience'&&<><ul className="space-y-3 my-3">{audiences.find(a=>a.label===modal.title)?.features.map(f=><li key={f} className="flex items-center gap-2 text-sm"><Check size={14} className="text-primary"/>{f}</li>)}</ul><p className="dialog-note">These capabilities are planned concepts, not active services. Explore Viral Radar to see an illustrative intelligence experience.</p><Button variant="commerce" onClick={()=>{setModal(null);scrollTo('viral-radar')}}>Explore Viral Radar<ArrowRight/></Button></>}
 {modal?.type==='info'&&<p className="dialog-note">{modal.title==='Contact'?'Official contact details will be added when confirmed by the BarangViral.Store team. No contact form submissions are collected in this concept.':modal.title==='Privacy'?'This prototype does not offer accounts or collect shopping requests on a server. The assistant interactions stay in this page and reset on reload. A complete privacy policy will be provided before the marketplace launches.':'This is a design demonstration, not an operational marketplace. Sample products, prices, and scores are illustrative only. No purchases or registrations are available. Marketplace terms will be provided before launch.'}</p>}
 </DialogContent></Dialog>
 </>
}
