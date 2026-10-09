import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const allowedOrigins = new Set(["https://barangviral.store", "https://www.barangviral.store"]);
const baseHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};
function response(body: unknown, status: number, origin?: string | null) {
  const headers = new Headers(baseHeaders);
  headers.set("Content-Type", "application/json");
  if (origin && allowedOrigins.has(origin)) headers.set("Access-Control-Allow-Origin", origin);
  return new Response(JSON.stringify(body), { status, headers });
}
async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function normalize(value: unknown): string {
  return String(value ?? "").toLocaleLowerCase().normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}
Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") {
    if (origin && !allowedOrigins.has(origin)) return response({ error: "Origin not allowed" }, 403, origin);
    return new Response("ok", { headers: { ...baseHeaders, ...(origin && allowedOrigins.has(origin) ? { "Access-Control-Allow-Origin": origin } : {}) } });
  }
  if (req.method !== "POST") return response({ error: "POST required" }, 405, origin);
  if (origin && !allowedOrigins.has(origin)) return response({ error: "Origin not allowed" }, 403, origin);
  try {
    const body = await req.json();
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
    if (!prompt || prompt.length > 500) return response({ error: "prompt must be 1–500 characters" }, 400, origin);

    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!geminiKey || !supabaseUrl || !serviceKey) {
      console.error("AI Shopping server secrets missing");
      return response({ error: "Server configuration incomplete" }, 500, origin);
    }

    const forwarded = req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const ipHash = await sha256(forwarded + ":" + supabaseUrl);
    const limitRes = await fetch(supabaseUrl + "/rest/v1/rpc/consume_ai_shopping_rate_limit", {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: serviceKey, Authorization: "Bearer " + serviceKey },
      body: JSON.stringify({ p_ip_hash: ipHash, p_max_requests: 10, p_window_seconds: 3600 })
    });
    if (!limitRes.ok) {
      console.error("Rate-limit service unavailable", limitRes.status, (await limitRes.text()).slice(0, 200));
      return response({ error: "AI Shopping is temporarily unavailable. Please try again later." }, 503, origin);
    }
    if (await limitRes.json() !== true) return response({ error: "Request limit reached. Please try again in about an hour." }, 429, origin);

    const model = "gemini-3.5-flash-lite";
    const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: "You parse shopping requests for a Malaysian e-commerce catalogue. Never invent products or prices. Return JSON only with fields category (short string), keywords (array of 2-6 short terms in English/Malay), product_names (array of exact product names explicitly mentioned for comparison; empty if none), intent_type (search, compare, or other), max_budget_myr (number or null), and intent (short string). Understand Malay and English and extract RM budgets accurately. If user asks to compare named products, include only those names in product_names and set intent_type to compare. Do not add substitute products to a comparison request. For ordinary search, product_names should be empty. If category is unclear, use a broad category." }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              category: { type: "STRING" },
              keywords: { type: "ARRAY", items: { type: "STRING" } },
              product_names: { type: "ARRAY", items: { type: "STRING" } },
              intent_type: { type: "STRING", enum: ["search", "compare", "other"] },
              max_budget_myr: { type: "NUMBER", nullable: true },
              intent: { type: "STRING" }
            },
            required: ["category", "keywords", "product_names", "intent_type", "max_budget_myr", "intent"]
          },
          temperature: 0.1,
          maxOutputTokens: 280
        }
      })
    });
    if (!aiRes.ok) {
      console.error("Gemini request failed", aiRes.status, (await aiRes.text()).slice(0, 400));
      return response({ error: "AI request failed. Please try again." }, 502, origin);
    }
    const aiData = await aiRes.json();
    const raw = aiData?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof raw !== "string") return response({ error: "AI returned no structured result" }, 502, origin);
    let parsed: { category: string; keywords: string[]; product_names: string[]; intent_type: string; max_budget_myr: number | null; intent: string };
    try { parsed = JSON.parse(raw); } catch { return response({ error: "AI returned invalid JSON" }, 502, origin); }

    const dbRes = await fetch(`${supabaseUrl}/rest/v1/products?select=id,name,brand,image_url,current_price,original_price,discount_percent,rating,review_count,sold_count,description,viral_score,source,product_url&order=viral_score.desc,created_at.desc&limit=100`, {
      headers: { apikey: serviceKey, Authorization: "Bearer " + serviceKey }
    });
    if (!dbRes.ok) {
      console.error("Catalogue request failed", dbRes.status, (await dbRes.text()).slice(0, 200));
      return response({ error: "Catalogue lookup failed" }, 502, origin);
    }
    const products = await dbRes.json();
    const budget = typeof parsed.max_budget_myr === "number" && Number.isFinite(parsed.max_budget_myr)
      ? Math.max(0, Math.min(parsed.max_budget_myr, 100000)) : null;

    // Deterministically detect full catalogue product names explicitly written in the user's prompt.
    // This prevents the language model from substituting unrelated recommendations in comparison requests.
    const normalizedPrompt = normalize(prompt);
    const explicitCatalogueMatches = (Array.isArray(products) ? products : [])
      .filter((p: any) => {
        const productName = normalize(p.name);
        return productName.length >= 5 && normalizedPrompt.includes(productName);
      });
    const isExplicitCatalogueComparison = explicitCatalogueMatches.length >= 2;
    let ranked: any[] = [];
    if (isExplicitCatalogueComparison) {
      ranked = explicitCatalogueMatches;
      if (budget !== null) ranked = ranked.filter((p: any) => p.current_price !== null && Number(p.current_price) <= budget);
    } else if (parsed.intent_type === "compare" && Array.isArray(parsed.product_names) && parsed.product_names.length > 0) {
      const requested = parsed.product_names.map(normalize).filter(Boolean);
      ranked = (Array.isArray(products) ? products : []).filter((p: any) => {
        const name = normalize(p.name);
        return requested.some((q) => name === q || name.includes(q) || q.includes(name));
      });
      if (budget !== null) ranked = ranked.filter((p: any) => p.current_price !== null && Number(p.current_price) <= budget);
      ranked = ranked.slice(0, 5);
    } else {
      const terms = [...new Set([parsed.category, ...(Array.isArray(parsed.keywords) ? parsed.keywords : [])]
        .filter((v) => typeof v === "string" && v.trim())
        .flatMap((v) => normalize(v).split(" ").filter((word) => word.length > 2)))];
      const asksForHeadphones = /\b(headphones?|earphones?|earbuds?|buds|headset|fon kepala|fon telinga|earfon)\b/i.test(prompt);
      const asksForSpeakers = /\b(speakers?|pembesar suara|loudspeakers?)\b/i.test(prompt);
      const strictAudioType = asksForHeadphones !== asksForSpeakers
        ? (asksForHeadphones ? "headphones" : "speakers")
        : null;
      const eligible = (Array.isArray(products) ? products : [])
        .filter((p: any) => budget === null || (p.current_price !== null && Number(p.current_price) <= budget))
        .filter((p: any) => {
          if (!strictAudioType) return true;
          const productText = normalize([p.name, p.brand, p.description].filter(Boolean).join(" "));
          return strictAudioType === "headphones"
            ? /\b(headphones?|earphones?|earbuds?|buds|headset|fon kepala|fon telinga|earfon)\b/.test(productText)
            : /\b(speakers?|pembesar suara|loudspeakers?)\b/.test(productText);
        });
      const valueIntent = /berbaloi|nilai|value|jimat|murah|bajet|budget/i.test(prompt);
      const scored = eligible.map((p: any) => {
        const haystack = normalize([p.name, p.brand, p.description].filter(Boolean).join(" "));
        const expandedTerms = terms.flatMap((term) => {
          if (["rumah", "home", "kegunaan", "harian", "everyday"].includes(term)) return ["speaker", "tag", "watch", "band", "buds", "headphones", "pad", "tv"];
          if (["fon", "headphone", "headphones", "telinga"].includes(term)) return ["headphone", "headphones", "earphone", "earphones", "earbud", "earbuds", "buds", "headset"];
          if (["speaker", "speakers", "pembesar", "suara"].includes(term)) return ["speaker", "speakers", "pembesar", "suara"];
          if (["audio", "muzik", "music"].includes(term)) return ["headphone", "buds", "speaker", "audio"];
          if (["jam", "pintar", "fitness", "kesihatan", "watch"].includes(term)) return ["watch", "band"];
          if (["jejak", "tracker", "kunci", "tag"].includes(term)) return ["tag", "tracker"];
          return [term];
        });
        const hits = [...new Set(expandedTerms)].filter((term) => term.length > 2 && haystack.includes(term)).length;
        return { ...p, _match_score: hits };
      });
      const matched = scored.filter((p: any) => terms.length === 0 || p._match_score > 0);
      if (matched.length > 0) {
        ranked = matched.sort((a: any, b: any) =>
          b._match_score - a._match_score ||
          (valueIntent ? Number(a.current_price || 0) - Number(b.current_price || 0) : Number(b.viral_score || 0) - Number(a.viral_score || 0))
        ).slice(0, 3).map(({ _match_score, ...p }: any) => p);
      } else if (budget !== null && eligible.length > 0) {
        // Honest fallback: show affordable catalogue alternatives when the catalogue has no exact category match.
        ranked = eligible.sort((a: any, b: any) =>
          (valueIntent ? Number(a.current_price || 0) - Number(b.current_price || 0) : Number(b.viral_score || 0) - Number(a.viral_score || 0))
        ).slice(0, 3);
      } else {
        ranked = [];
      }
    }

    return response({
      ok: true,
      interpretation: {
        category: parsed.category,
        keywords: parsed.keywords,
        product_names: isExplicitCatalogueComparison ? explicitCatalogueMatches.map((p: any) => p.name) : (parsed.product_names || []),
        intent_type: isExplicitCatalogueComparison ? "compare" : (parsed.intent_type || "search"),
        max_budget_myr: budget,
        intent: parsed.intent
      },
      recommendations: ranked,
      count: ranked.length,
      source: "supabase_catalogue"
    }, 200, origin);
  } catch (error) {
    console.error("AI Shopping error", error instanceof Error ? error.message : String(error));
    return response({ error: "Unexpected AI Shopping error" }, 500, origin);
  }
});