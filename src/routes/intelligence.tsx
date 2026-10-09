import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { ArrowLeft, RefreshCw, Search, Youtube, TrendingUp, TrendingDown, Minus, ExternalLink, Radar, Clock3, Activity, Flame, Newspaper } from 'lucide-react';

export const Route = createFileRoute('/intelligence')({
  head: () => ({ meta: [
    { title: 'Market Intelligence | BarangViral.Store' },
    { name: 'description', content: 'Explore search discovery history and YouTube video growth signals for Malaysia.' },
  ] }),
  component: IntelligencePage,
});

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://bzrhhuupcnfgxejndxjo.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_MzM7ufbE0ajl9uk4eowbtw_eJNpjofH';

type SearchRow = {
  id?: number; query_text: string; result_title: string | null; result_url: string | null;
  result_snippet: string | null; current_position: number | null; result_source: string | null; latest_captured_at: string;
};
type SearchMovement = SearchRow & {
  previous_position?: number | null; position_change?: number | null; observation_count?: number;
  comparison_status?: string; latest_captured_at: string;
};
type TrendRow = { rank: number; title: string; approximate_traffic: string; published_at: string; search_url: string; related_news: { title: string; url: string; source: string }[] };
type VideoRow = {
  video_id: string; product_id: string | null; video_title: string | null; channel_title: string | null;
  video_url: string | null; thumbnail_url: string | null; latest_view_count: number | null;
  previous_view_count: number | null; views_gained: number | null; view_growth_percent: number | null;
  hours_between_snapshots: number | null; views_per_hour: number | null; latest_captured_at?: string;
  has_growth_comparison?: boolean;
};

async function getRows<T>(path: string): Promise<T[]> {
  const response = await fetch(SUPABASE_URL + '/rest/v1/' + path, {
    headers: { apikey: SUPABASE_KEY },
  });
  if (!response.ok) { const details = await response.text().catch(() => ''); throw new Error('Could not load intelligence data (' + response.status + ')' + (details ? ': ' + details.slice(0, 180) : '')); }
  const json = await response.json();
  return Array.isArray(json) ? json : [];
}
function timeAgo(value?: string) {
  if (!value) return 'Time not available';
  const mins = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (mins < 60) return mins + ' min ago';
  if (mins < 1440) return Math.floor(mins / 60) + ' hr ago';
  return Math.floor(mins / 1440) + ' days ago';
}
function formatNumber(value?: number | null) {
  return value == null ? '—' : new Intl.NumberFormat('en-MY', { notation: value >= 10000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(value);
}

function IntelligencePage() {
  const [searchRows, setSearchRows] = useState<SearchMovement[]>([]);
  const [videoRows, setVideoRows] = useState<VideoRow[]>([]);
  const [trendRows, setTrendRows] = useState<TrendRow[]>([]);
  const [trendError, setTrendError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  async function refresh() {
    setLoading(true); setError('');
    try {
      const [search, videos] = await Promise.all([
        getRows<SearchMovement>('serpapi_search_history_comparison?select=*&order=latest_captured_at.desc&limit=30'),
        getRows<VideoRow>('youtube_video_growth_v1?select=*&order=views_per_hour.desc.nullslast&limit=20'),
      ]);
      setSearchRows(search);
      setVideoRows(videos);
      setUpdatedAt(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Intelligence data is temporarily unavailable.');
    } finally { setLoading(false); }
  }
  useEffect(() => { void refresh(); }, []);

  async function refreshTrends() {
    setTrendError('');
    try {
      const response = await fetch(SUPABASE_URL + '/functions/v1/malaysia-trends-radar', { headers: { apikey: SUPABASE_KEY } });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) throw new Error(payload?.error || 'Malaysia trends are temporarily unavailable');
      setTrendRows(Array.isArray(payload.items) ? payload.items : []);
    } catch (e) { setTrendError(e instanceof Error ? e.message : 'Unable to load Google Trends'); }
  }
  useEffect(() => { void refreshTrends(); }, []);

  const movedUp = searchRows.filter(row => row.comparison_status === 'MOVED_UP').length;
  const videoComparisons = videoRows.filter(row => row.has_growth_comparison).length;
  const latestSearch = searchRows[0]?.latest_captured_at;
  const latestVideo = videoRows[0]?.latest_captured_at;
  const opportunityLeads = trendRows.map((trend) => {
    const title = trend.title.toLowerCase();
    const productMatch = /phone|smartphone|xiaomi|redmi|samsung|iphone|laptop|tablet|headphone|earbud|speaker|power bank|charger|smartwatch|camera|gaming|keyboard|mouse|air fryer|vacuum|beauty|skincare|serum|sunscreen|perfume|makeup|shampoo|baby|diaper|coffee|matcha|bag|shoe|sneaker|harga|review|unboxing|promosi|diskaun|telefon|kasut|beg/i.test(title);
    const shoppingIntent = /price|harga|review|unboxing|best|buy|sale|discount|promo|promosi|diskaun|vs\\b|worth it|launch|launched|release/i.test(title);
    const traffic = Number((trend.approximate_traffic || '').replace(/[^0-9]/g, '')) || 0;
    const score = Math.min(100, (productMatch ? 40 : 0) + (shoppingIntent ? 20 : 0) + (traffic >= 100000 ? 25 : traffic >= 20000 ? 18 : traffic >= 5000 ? 12 : traffic > 0 ? 5 : 0) + (trend.related_news?.length ? 10 : 0));
    return { ...trend, productMatch, score, status: score >= 60 ? 'RESEARCH PRIORITY' : score >= 30 ? 'CHECK PRODUCT FIT' : 'GENERAL TREND' };
  }).sort((a, b) => b.score - a.score);
  const productLeads = opportunityLeads.filter(item => item.productMatch);

  return <main className="min-h-screen bg-[#faf9f6] text-slate-900">
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
        <a href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-orange-600"><ArrowLeft size={16}/> BarangViral.Store</a>
        <button onClick={() => void refresh()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"><RefreshCw size={15} className={loading ? 'animate-spin' : ''}/> Refresh signals</button>
      </div>
    </header>
    <section className="mx-auto max-w-7xl px-5 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div><p className="mb-2 flex items-center gap-2 text-xs font-bold tracking-[.18em] text-orange-600"><Radar size={15}/> MARKET INTELLIGENCE · MALAYSIA</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Look beyond product cards.</h1>
          <p className="mt-3 max-w-2xl text-slate-600">Search discovery and video-view movement from collected observations. These are discovery signals—not proof that a product is viral.</p>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-slate-500"><Clock3 size={13}/> {updatedAt ? 'Dashboard checked ' + updatedAt.toLocaleTimeString('en-MY') : 'Connecting to signal history'}</p>
      </div>
      {error && <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{error}. Check that the dashboard views are readable through the Supabase API; this page does not change product viral scores.</div>}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-2 text-sm text-slate-500"><Search size={16}/> Search observations</div><p className="mt-3 text-3xl font-bold">{loading ? '—' : searchRows.length}</p><p className="mt-1 text-xs text-slate-500">Latest comparison rows · {timeAgo(latestSearch)}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-2 text-sm text-slate-500"><TrendingUp size={16}/> Results moved up</div><p className="mt-3 text-3xl font-bold">{loading ? '—' : movedUp}</p><p className="mt-1 text-xs text-slate-500">From previous captured search positions</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-2 text-sm text-slate-500"><Youtube size={16}/> Comparable videos</div><p className="mt-3 text-3xl font-bold">{loading ? '—' : videoComparisons}</p><p className="mt-1 text-xs text-slate-500">Videos with at least two snapshots · {timeAgo(latestVideo)}</p></div>
      </div>
      <section className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div><h2 className="flex items-center gap-2 font-bold"><Flame size={18} className="text-orange-500"/> Malaysia Trend Radar</h2><p className="mt-1 text-xs text-slate-500">Google Trends trending searches · refreshed from the public RSS feed</p></div>
          <div className="flex items-center gap-3"><a className="text-xs font-semibold text-orange-600 hover:underline" href="https://trends.google.com/trending?geo=MY" target="_blank" rel="noreferrer">Open Google Trends <ExternalLink size={11} className="inline"/></a><button onClick={() => void refreshTrends()} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold hover:border-orange-300">Refresh trends</button></div>
        </div>
        {trendError ? <div className="p-5 text-sm text-amber-800">{trendError}. You can still open Google Trends Malaysia directly above.</div> : trendRows.length ? <div className="grid gap-0 md:grid-cols-2 xl:grid-cols-3">{trendRows.slice(0,12).map((trend) => <article key={trend.rank + '-' + trend.title} className="border-b border-slate-100 p-4 md:border-r"><div className="flex items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-xs font-bold text-orange-700">#{trend.rank}</span><div className="min-w-0 flex-1"><a href={trend.search_url || 'https://trends.google.com/trending?geo=MY'} target="_blank" rel="noreferrer" className="font-semibold leading-snug hover:text-orange-600">{trend.title} <ExternalLink size={11} className="inline"/></a>{trend.approximate_traffic && <p className="mt-1 text-xs text-slate-500">Approx. search interest: {trend.approximate_traffic}</p>}{trend.related_news?.length > 0 && <div className="mt-2 space-y-1">{trend.related_news.slice(0,2).map((news) => <a key={news.url || news.title} href={news.url || trend.search_url} target="_blank" rel="noreferrer" className="block line-clamp-1 text-xs text-slate-500 hover:text-orange-600"><Newspaper size={10} className="mr-1 inline"/> {news.title}{news.source ? ' · ' + news.source : ''}</a>)}</div>}</div></div></article>)}</div> : <div className="p-5 text-sm text-slate-500">Loading Malaysia trending searches…</div>}
        <div className="border-t border-slate-100 bg-orange-50/60 px-5 py-3 text-xs text-slate-600">General trending topics can include news, sport and public events. Product relevance must be assessed separately; a trending topic is not automatically a product opportunity.</div>
      </section>
      <section className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div><h2 className="flex items-center gap-2 font-bold"><Activity size={18} className="text-orange-500"/> Product Opportunity Watchlist</h2><p className="mt-1 text-xs text-slate-500">A first-pass filter over current trends · heuristic score, not a sales forecast</p></div>
          <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">{productLeads.length} product-related leads</span>
        </div>
        {productLeads.length ? <div className="divide-y divide-slate-100">{productLeads.slice(0,8).map((item) => <article key={item.rank + item.title} className="flex flex-wrap items-center justify-between gap-3 p-4"><div className="min-w-0 flex-1"><p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-orange-600">{item.status}</p><a href={item.search_url || 'https://trends.google.com/trending?geo=MY'} target="_blank" rel="noreferrer" className="font-semibold hover:text-orange-600">{item.title} <ExternalLink size={11} className="inline"/></a><p className="mt-1 text-xs text-slate-500">{item.approximate_traffic ? 'Approx. search interest: ' + item.approximate_traffic + ' · ' : ''}Next: verify marketplace price, product availability and repeated growth.</p></div><div className="min-w-24 text-right"><p className="text-2xl font-bold">{item.score}</p><p className="text-[10px] text-slate-400">heuristic / 100</p></div></article>)}</div> : <div className="p-5"><p className="text-sm font-semibold text-slate-800">No product-specific leads detected in the current trending list.</p><p className="mt-1 text-sm text-slate-500">That is a useful result: current trends may be news or public events. Next, compare product-keyword search history and YouTube growth before selecting a product.</p></div>}
        <div className="border-t border-slate-100 bg-orange-50/60 px-5 py-3 text-xs text-slate-600">Evidence standard: a trend match is only a lead. Prioritize candidates only after confirming shopping intent, local availability and sustained growth across multiple observations.</div>
      </section>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="font-bold">Search Discovery</h2><p className="mt-1 text-xs text-slate-500">SerpApi Google Search · Malaysia query history</p></div><Search className="text-orange-500" size={19}/></div>
          {loading ? <div className="p-6 text-sm text-slate-500">Loading search history…</div> : searchRows.length ? <div className="divide-y divide-slate-100">{searchRows.slice(0,12).map((row,i)=><article key={row.id ?? row.result_url ?? i} className="p-4">
            <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-orange-600">{row.query_text || 'Search observation'}</p><a className="font-semibold leading-snug hover:text-orange-600" href={row.result_url || '#'} target="_blank" rel="noreferrer">{row.result_title || row.result_url || 'Untitled result'} <ExternalLink size={12} className="inline"/></a><p className="mt-1 line-clamp-2 text-xs text-slate-500">{row.result_snippet}</p></div><div className="shrink-0 text-right"><span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold">#{row.current_position ?? '—'}</span><p className="mt-2 flex items-center justify-end gap-1 text-[11px] text-slate-500">{row.comparison_status === 'MOVED_UP' ? <TrendingUp size={12} className="text-emerald-600"/> : row.comparison_status === 'MOVED_DOWN' ? <TrendingDown size={12} className="text-red-500"/> : <Minus size={12}/>} {row.comparison_status?.replaceAll('_',' ') || 'FIRST OBSERVATION'}</p></div></div>
            <p className="mt-2 text-[10px] text-slate-400">{timeAgo(row.latest_captured_at)}{row.observation_count ? ' · '+row.observation_count+' observations' : ''}</p>
          </article>)}</div> : <div className="p-6 text-sm text-slate-500">No search history available yet.</div>}
        </section>
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="font-bold">Video Growth Radar</h2><p className="mt-1 text-xs text-slate-500">YouTube view snapshots · growth only when comparable</p></div><Youtube className="text-red-500" size={19}/></div>
          {loading ? <div className="p-6 text-sm text-slate-500">Loading video snapshots…</div> : videoRows.length ? <div className="divide-y divide-slate-100">{videoRows.slice(0,12).map((video,i)=><article key={video.video_id ?? i} className="flex gap-3 p-4">
            {video.thumbnail_url ? <img src={video.thumbnail_url} alt="" loading="lazy" className="h-20 w-28 shrink-0 rounded-lg bg-slate-100 object-cover"/> : <div className="flex h-20 w-28 shrink-0 items-center justify-center rounded-lg bg-slate-100"><Youtube size={22} className="text-slate-400"/></div>}
            <div className="min-w-0 flex-1"><a href={video.video_url || '#'} target="_blank" rel="noreferrer" className="line-clamp-2 text-sm font-semibold hover:text-orange-600">{video.video_title || 'Untitled video'} <ExternalLink size={11} className="inline"/></a><p className="mt-1 truncate text-xs text-slate-500">{video.channel_title || 'Unknown channel'}</p><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs"><span><strong>{formatNumber(video.latest_view_count)}</strong> views</span><span className={(video.views_gained ?? 0) > 0 ? 'font-semibold text-emerald-700' : 'text-slate-500'}><Activity size={11} className="mr-1 inline"/>{video.views_gained == null ? 'Awaiting second snapshot' : '+'+formatNumber(video.views_gained)+' views'}</span>{video.views_per_hour != null && <span>{formatNumber(video.views_per_hour)}/hr</span>}</div><p className="mt-1 text-[10px] text-slate-400">{video.hours_between_snapshots ? 'Compared over '+Number(video.hours_between_snapshots).toFixed(1)+' hours' : 'First observation — collect another snapshot to measure growth'}</p></div>
          </article>)}</div> : <div className="p-6 text-sm text-slate-500">No video observations available yet.</div>}
        </section>
      </div>
      <div className="mt-6 flex items-start gap-3 rounded-xl border border-orange-100 bg-orange-50/70 p-4 text-sm text-slate-600"><Activity size={17} className="mt-0.5 shrink-0 text-orange-600"/><p><strong className="text-slate-800">How to read this dashboard:</strong> search ranking movement is not the same as search demand, and YouTube view growth is not automatically proof of a viral product. Compare repeated observations over meaningful time windows before making decisions. Existing product scores are left untouched.</p></div>
    </section>
  </main>;
}
