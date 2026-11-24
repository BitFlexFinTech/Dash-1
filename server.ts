import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function callOpenRouterText(modelId: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const openRouterKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!openRouterKey) {
    throw new Error('OPENROUTER_API_KEY is not configured on the server.');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openRouterKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://mercenta-bws.local',
      'X-Title': 'MERCENTA BWS Platform',
    },
    body: JSON.stringify({
      model: modelId,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${errText}`);
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error('OpenRouter returned an empty completion.');
  }
  return content;
}

function extractJsonObject(raw: string): Record<string, unknown> {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  return JSON.parse(candidate) as Record<string, unknown>;
}

function formatAiError(error: unknown, fallback: string): { status: number; message: string } {
  const raw = error instanceof Error ? error.message : fallback;
  if (raw.includes('503') || raw.includes('UNAVAILABLE')) {
    return {
      status: 503,
      message: 'AI Studio Gemini is temporarily experiencing high demand (503). Please try again in a few seconds.',
    };
  }
  if (raw.includes('429') || raw.includes('RESOURCE_EXHAUSTED')) {
    return {
      status: 429,
      message: 'AI Studio Gemini rate limit reached (429). Please wait a moment and retry.',
    };
  }
  return { status: 500, message: raw };
}

async function generateJsonWithGemini(
  ai: GoogleGenAI,
  params: {
    contents: string;
    systemInstruction: string;
    responseSchema: Record<string, unknown>;
  }
): Promise<{ parsed: Record<string, unknown>; modelUsed: string }> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: params.contents,
      config: {
        systemInstruction: params.systemInstruction,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: params.responseSchema,
      },
    });
    return {
      parsed: extractJsonObject(response.text ?? '{}'),
      modelUsed: 'gemini-4-hydrogen',
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const isTransient = msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('429');
    if (!isTransient) throw err;

    await new Promise((r) => setTimeout(r, 800));
    const fallbackResponse = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: params.contents,
      config: {
        systemInstruction: params.systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: params.responseSchema,
      },
    });
    return {
      parsed: extractJsonObject(fallbackResponse.text ?? '{}'),
      modelUsed: 'gemini-3.1-flash-lite',
    };
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/ai/status', (_req, res) => {
    const geminiConfigured = Boolean(process.env.GEMINI_API_KEY?.trim());
    const openrouterConfigured = Boolean(process.env.OPENROUTER_API_KEY?.trim());
    res.json({
      geminiConfigured,
      aiStudioActive: geminiConfigured,
      openrouterConfigured,
      lockedCampaignEngine: 'gemini-4-hydrogen',
      activeBuildProvider: 'AI Studio Built-in Gemini (gemini-4-hydrogen)',
      runtimeMode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    });
  });

  app.post('/api/campaigns/generate', async (req, res) => {
    try {
      const { brand, skus, format, channel, objective, toneNote } = req.body as {
        brand?: Record<string, unknown>;
        skus?: Record<string, unknown>[];
        format?: Record<string, unknown>;
        channel?: Record<string, unknown>;
        objective?: string;
        toneNote?: string;
      };

      if (!brand || !format || !channel) {
        res.status(400).json({ error: 'Missing required brand, format, or channel context.' });
        return;
      }

      if (channel.eligibilityStatus === 'prohibited') {
        res.status(422).json({
          error: `${String(channel.name)} is prohibited for UK alcohol advertising under Amazon UK Alcohol Policy. Select an 18+ eligible surface (Amazon Store, Prime Video, Live Sports, Fire TV, IMDb, Amazon Music, or Wondery).`,
        });
        return;
      }

      const ai = getGeminiClient();
      if (!ai) {
        res.status(503).json({
          error: 'GEMINI_API_KEY is not configured in server environment secrets. Add it in Settings > Secrets to generate AI campaigns.',
        });
        return;
      }

      const maxHeadlineChars = Number(format.maxHeadlineChars || 50);
      const maxBodyChars = Number(format.maxBodyChars || 100);

      const systemInstruction = `You are the senior Amazon Advertising UK Strategist & Compliance Officer for MERCENTA BWS, managing an Amazon Vendor Central UK (1P wholesale) Beer, Wine & Spirits account.
NEVER treat this as US Amazon (where hard liquor ads are restricted) and NEVER mention FBA (Mercenta operates strictly via Amazon Vendor Central UK 1P).

MANDATORY LEGAL & PLATFORM RULES FOR AMAZON UK ALCOHOL ADS (Amazon Ads UK Policy + UK ASA / CAP Code Section 18):
1. Vendor Central UK 1P BWS Compliance: All advertised SKUs must display accurate ABV (%) and UK alcohol unit awareness; never invent or alter ABV% or GBP prices outside the supplied product data.
2. Strict 18+ Targeting: Only propose UK 18+ adult search/audience targeting. Explicitly list negative/excluded minor-related keywords.
3. 25+ Visual Rule: Every creative visual direction note MUST explicitly require that any human model depicted is and appears at least 25 years old (or recommend bottle-only / provenance table settings).
4. ASA / CAP Code Section 18 Prohibited Claims: Strictly FORBIDDEN to mention or imply social confidence, popularity, sexual or romantic success, toughness, daring, athletic/sports performance, health/therapeutic benefits, driving/machinery, binge/irresponsible drinking, or unsubstantiated superlatives (#1, Best in the World).
5. Streaming / Video / Conditional Channels (Prime Video, Live Sports, Fire TV, Twitch, IMDb, Kindle): Always include content rating exclusions (NR, TV-Y, TV-Y7, G, PG / TV-PG, UK BBFC U and PG) and mature/18+ environment notes.
6. Non-Alcoholic / <=0.5% ABV: If product ABV <= 0.5%, explicitly state "Alcohol-Free" clearly in copy while keeping adult placement safeguards.
7. Respect character budgets strictly: headline <= ${maxHeadlineChars} characters; bodyCopy <= ${maxBodyChars} characters.`;

      const prompt = `Generate a compliant, conversion-ready Amazon UK campaign concept grounded strictly in the following brand and product catalogue data:

BRAND CONTEXT:
- Brand Name: ${String(brand.name)}
- Legal Brand Owner / Producer: ${String(brand.brandOwner)} / ${String(brand.manufacturer)}
- Origin: ${String(brand.region)}, ${String(brand.countryName)}
- Story & Range Summary: ${String(brand.description)} | ${String(brand.productRangeSummary)}
- Amazon Vendor Central UK Status: ${String(brand.amazonUkPresence)}

SELECTED SKU(S):
${(skus && skus.length > 0 ? skus : [])
  .map(
    (s) =>
      `- ${String(s.name)} | Category: ${String(s.category)} (${String(s.productType)}) | Size: ${String(s.bottleSize)} | ABV: ${String(s.abv)} | UK RRP: £${String(s.illustrativeRrpGbp)} | Packaging: ${String(s.packagingInfo)} | Tasting/Notes: ${String(s.tastingNotes || s.packagingInfo)}`
  )
  .join('\n')}

TARGET FORMAT & ECOSYSTEM CHANNEL:
- Ad Format: ${String(format.name)} (${String(format.billingModel)}) — Specs: ${String(format.dimensions)} — Headline max ${maxHeadlineChars} chars, Body/Caption max ${maxBodyChars} chars
- Target Channel: ${String(channel.name)} (${String(channel.eligibilityLabel)}) — Channel Rule: ${String(channel.alcoholRuleNote)}
- Campaign Objective: ${objective || 'Retail Conversion & Vendor Central 1P Sell-Through'}
- Additional Brand Tone Direction: ${toneNote || 'Authentic provenance, craftsmanship, and gifting clarity'}`;

      const { parsed, modelUsed } = await generateJsonWithGemini(ai, {
        contents: prompt,
        systemInstruction,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            headline: {
              type: Type.STRING,
              description: `Compliant Amazon ad headline strictly <= ${maxHeadlineChars} characters.`,
            },
            subheadline: {
              type: Type.STRING,
              description: 'Short UK 18+ provenance sub-line under 65 characters.',
            },
            bodyCopy: {
              type: Type.STRING,
              description: `Concise caption/copy <= ${maxBodyChars} characters respecting CAP Code Section 18.`,
            },
            audioScript: {
              type: Type.STRING,
              description: '20-second UK English audio/video voiceover script noting Enjoy Responsibly.',
            },
            ctaLabel: {
              type: Type.STRING,
              description: 'Clean Amazon UK button CTA such as Shop now or Explore Range.',
            },
            targetKeywords18Plus: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '5 relevant 18+ UK buyer search keywords or audience segments.',
            },
            excludedYouthKeywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '4 explicit minor/prohibited negative keywords or audience exclusions.',
            },
            videoRatingExclusions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Streaming content ratings excluded (NR, TV-Y, TV-Y7, G, PG, UK U/PG).',
            },
            creativeVisualBrief25Plus: {
              type: Type.STRING,
              description: 'Creative brief enforcing 25+ models or architectural packshot lighting.',
            },
            abvAndUnitsComplianceLine: {
              type: Type.STRING,
              description: 'Exact ABV% & responsible UK alcohol unit signpost line.',
            },
            complianceNotes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3 concise compliance checks verified for Vendor Central UK & ASA/CAP.',
            },
          },
          required: [
            'headline',
            'subheadline',
            'bodyCopy',
            'audioScript',
            'ctaLabel',
            'targetKeywords18Plus',
            'excludedYouthKeywords',
            'videoRatingExclusions',
            'creativeVisualBrief25Plus',
            'abvAndUnitsComplianceLine',
            'complianceNotes',
          ],
        },
      });

      res.json({
        engineUsed: `${modelUsed} (AI Studio Built-in)`,
        ...parsed,
      });
    } catch (error) {
      const formatted = formatAiError(error, 'Failed to generate compliant AI campaign.');
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  app.post('/api/outreach/generate', async (req, res) => {
    try {
      const {
        brand,
        distillerContact,
        outreachLog,
        amazonListing,
        ukDistribution,
        opportunityAssessment,
        mutualBenefit,
        skus,
        pitchType,
        selectedModelId,
      } = req.body as {
        brand?: Record<string, unknown>;
        distillerContact?: Record<string, unknown>;
        outreachLog?: Record<string, unknown>;
        amazonListing?: Record<string, unknown>;
        ukDistribution?: Record<string, unknown>;
        opportunityAssessment?: Record<string, unknown>;
        mutualBenefit?: Record<string, unknown>;
        skus?: Record<string, unknown>[];
        pitchType?: string;
        selectedModelId?: string;
      };

      if (!brand) {
        res.status(400).json({ error: 'Missing brand details for outreach generation.' });
        return;
      }

      const skuSummary =
        skus && skus.length > 0
          ? skus
              .slice(0, 4)
              .map(
                (s) =>
                  `${String(s.name)} (${String(s.bottleSize)}, ${String(s.abv)}, Wholesale £${String(
                    s.illustrativeWholesaleGbp
                  )} / RRP £${String(s.illustrativeRrpGbp)})`
              )
              .join('; ')
          : 'No SKU sheet attached';

      const primarySku = skus && skus.length > 0 ? skus[0] : undefined;
      const amazonBuyBoxSignal = amazonListing
        ? `${String(amazonListing.listingStatus || brand.amazonUkPresence)} (${String(
            amazonListing.sellerClassification || 'Observed Seller'
          )}: ${String(amazonListing.sellerName || 'Marketplace Seller')}) | ASIN ${String(
            amazonListing.asin
          )} | Displayed Price ${
            amazonListing.displayedPriceGbp !== null && amazonListing.displayedPriceGbp !== undefined
              ? `£${String(amazonListing.displayedPriceGbp)}`
              : 'Unlisted'
          }${
            primarySku?.illustrativeRrpGbp
              ? ` vs Target UK RRP £${String(primarySku.illustrativeRrpGbp)}`
              : ''
          } | Range Coverage ${String(amazonListing.rangeCoveragePct)}% | Content: ${String(
            amazonListing.listingQualityScore || 'Audit Pending'
          )} | Observation: ${String(amazonListing.brandPresentationNote || '')}`
        : `Amazon UK Status: ${String(brand.amazonUkPresence)}`;

      const mutualBrandGains =
        mutualBenefit?.brandGains && typeof mutualBenefit.brandGains === 'object'
          ? (mutualBenefit.brandGains as Record<string, unknown>)
          : null;
      const mutualMercentaGains =
        mutualBenefit?.mercentaGains && typeof mutualBenefit.mercentaGains === 'object'
          ? (mutualBenefit.mercentaGains as Record<string, unknown>)
          : null;

      const systemPrompt = `You are the Commercial Director at MERCENTA BWS (UK), writing razor-sharp, evidence-backed B2B outreach emails to international Beer, Wine & Spirits producers, winemakers, brewers, and distillers.
CRITICAL COMMERCIAL MODEL RULES:
- Mercenta Partners operates strictly as a UK wholesale importer & Amazon Vendor Central UK (1P) partner — NEVER mention Amazon FBA.
- Explain clearly WHY the "Sold by Amazon" signal matters: when a product listing on Amazon.co.uk lacks "Dispatched from and sold by Amazon" in the Buy Box and instead shows only 3P resellers or fragmented listings, the brand is losing pricing control, Brand Store storytelling, A+ Content, Subscribe & Save eligibility, and direct 1P PO volume. Conversely, where "Sold by Amazon" already appears or partial listings exist, focus on range expansion, 1P Retail Media (AMS/DSP), and stopping 3P grey-market Buy Box leakage.
- Explicitly articulate HOW partnering with Mercenta is MUTUALLY BENEFICIAL:
  1. What the Brand Wins (Buy Box & RRP pricing recovery, zero FBA overhead via direct 1P wholesale POs, Brand Registry & A+ uplift, and clean co-existence with existing UK hospitality/on-trade distributors).
  2. Why Mercenta Wants the Partnership (strong 1P wholesale-to-RRP margin headroom, repeat Vendor Central PO velocity, and filling UK category demand).
- Mention Mercenta's concrete UK infrastructure: direct UK VAT-registered 1P Vendor Central POs, DHL UK Business Credit Account (direct-ship PO fulfilment with selectable lead times), WePrep UK Vendor Central prep + 3P wet-bond intake (EHD London / Seabrook / LCB), and full ASA/CAP 18+ compliance & Amazon Ads UK campaign execution.
- Ground the pitch specifically in the brand's actual Amazon.co.uk ASIN/Buy Box data, UK distributor status, wholesale/RRP pricing, and estimated 1P annual wholesale upside.

Return valid JSON only matching this exact schema:
{
  "subject": "string (specific to brand + UK Amazon 1P / retail opportunity)",
  "emailBody": "string (tailored, persuasive B2B email citing their real origin, UK status, specific Amazon.co.uk Buy Box/3P observation, concrete two-way mutual benefit, and respectful clear CTA)",
  "talkingPoints": ["string", "string", "string"],
  "followUpSuggestion": "string",
  "amazonUkAudit": {
    "buyBoxSignal": "string (e.g. No 'Sold by Amazon' — 3P Resellers Only on ASIN ... or Active 'Sold by Amazon' + 3P Leakage)",
    "resellerLeakageRisk": "string (High / Moderate / Controlled + exact pricing or grey-market note)",
    "listingQualityGap": "string (concrete assessment of A+ Content, imagery, range coverage %)",
    "estimatedAnnual1pUpsideGbp": "string (e.g. £110,000 – £155,000 annual 1P wholesale PO potential)",
    "keyOpportunities": ["string", "string", "string"]
  }
}`;

      const userPrompt = `Draft a ${pitchType || 'First Commercial Outreach'} pitch & Amazon.co.uk Brand Audit for:
Brand: ${String(brand.name)} (${String(brand.countryName)} · ${String(brand.region)} · ${String(brand.primaryCategory)})
Brand Owner / Producer: ${String(brand.brandOwner)} / ${String(brand.manufacturer)}
Brand Description: ${String(brand.description)}
UK Distribution Reality: ${String(brand.ukPresenceStatus)} — Importer/Distributor: ${String(
        brand.ukImporterOrDistributor
      )} | Arrangement: ${String(brand.ukArrangementType)}${
        ukDistribution
          ? ` | Audited UK Org: ${String(ukDistribution.organisation)} (${String(
              ukDistribution.commercialRole
            )} · ${String(ukDistribution.relationshipType)}) | Evidence: ${String(
              ukDistribution.evidenceSummary
            )}`
          : ''
      }
Amazon.co.uk Storefront Signal ("Sold by Amazon" Check): ${amazonBuyBoxSignal}
Flagship SKUs & Economics: ${skuSummary}
Est. Annual UK 1P Wholesale Pipeline: £${Number(brand.illustrativePipelineValueGbp || 75000).toLocaleString()}${
        opportunityAssessment
          ? ` | Strategic Score: ${String(opportunityAssessment.overallScore)}/100 | Rationale: ${String(
              opportunityAssessment.summaryRationale
            )} | Next Step: ${String(opportunityAssessment.recommendedNextAction)}`
          : ''
      }${
        mutualBenefit
          ? `\nTwo-Way Mutual Benefit Summary (Fit ${String(mutualBenefit.objectiveFitScore)}/100):
- Brand Wins: ${String(mutualBrandGains?.headline || '')} | Pricing: ${String(
              mutualBrandGains?.priceIntegrityRecovery || ''
            )} | Logistics: ${String(mutualBrandGains?.channelAndLogisticsWin || '')} | Coexistence: ${String(
              mutualBrandGains?.distributorCoexistence || ''
            )}
- Mercenta Wins: ${String(mutualMercentaGains?.headline || '')} | Margin: ${String(
              mutualMercentaGains?.marginSpreadSummary || ''
            )} | Volume: ${String(mutualMercentaGains?.poVolumeSummary || '')}`
          : ''
      }
Target Contact: ${String(outreachLog?.contactPerson || distillerContact?.exportContactRole || 'Export & Commercial Director')} (${String(
        outreachLog?.contactEmail || distillerContact?.exportContactEmail || 'Trade Desk'
      )})
Current Outreach Stage: ${String(outreachLog?.outreachStatus || 'Not Contacted')}
Logged Notes: ${String(outreachLog?.discussionNotes || 'None logged yet')}`;

      const openRouterKey = process.env.OPENROUTER_API_KEY?.trim();
      const useOpenRouter =
        Boolean(openRouterKey) &&
        Boolean(selectedModelId) &&
        selectedModelId !== 'google/gemini-4-hydrogen';

      if (useOpenRouter && selectedModelId) {
        const raw = await callOpenRouterText(selectedModelId, systemPrompt, userPrompt);
        const parsed = extractJsonObject(raw);
        res.json({ engineUsed: `OpenRouter · ${selectedModelId}`, ...parsed });
        return;
      }

      const ai = getGeminiClient();
      if (!ai) {
        res.status(503).json({
          error: 'No AI key configured on server. Set GEMINI_API_KEY or OPENROUTER_API_KEY in server environment secrets.',
        });
        return;
      }

      const { parsed, modelUsed } = await generateJsonWithGemini(ai, {
        contents: userPrompt,
        systemInstruction: systemPrompt,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING },
            emailBody: { type: Type.STRING },
            talkingPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            followUpSuggestion: { type: Type.STRING },
            amazonUkAudit: {
              type: Type.OBJECT,
              properties: {
                buyBoxSignal: { type: Type.STRING },
                resellerLeakageRisk: { type: Type.STRING },
                listingQualityGap: { type: Type.STRING },
                estimatedAnnual1pUpsideGbp: { type: Type.STRING },
                keyOpportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: [
                'buyBoxSignal',
                'resellerLeakageRisk',
                'listingQualityGap',
                'estimatedAnnual1pUpsideGbp',
                'keyOpportunities',
              ],
            },
          },
          required: ['subject', 'emailBody', 'talkingPoints', 'followUpSuggestion', 'amazonUkAudit'],
        },
      });

      res.json({
        engineUsed:
          selectedModelId && !openRouterKey
            ? `AI Studio Gemini (${modelUsed} · Saved Post-Build: ${selectedModelId})`
            : `AI Studio Gemini (${modelUsed})`,
        ...parsed,
      });
    } catch (error) {
      const formatted = formatAiError(error, 'Failed to generate outreach pitch.');
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  app.post('/api/research/brief', async (req, res) => {
    try {
      const { brand, briefType, selectedModelId } = req.body as {
        brand?: Record<string, unknown>;
        briefType?: 'distribution' | 'compliance' | 'vendor-central';
        selectedModelId?: string;
      };

      if (!brand) {
        res.status(400).json({ error: 'Missing brand details for AI research brief.' });
        return;
      }

      const systemPrompt = `You are a UK Alcohol Imports & Amazon Vendor Central UK (1P) Market Analyst at MERCENTA BWS.
Never mention Amazon FBA. Always account for UK AWRS, GB EORI, HMRC excise duty (including 3rd-party wet bond such as EHD London / Seabrook / LCB vs WePrep UK duty-paid Vendor Central prep), and realistic 1P Vendor Central vs 3P dynamics.
Return valid JSON only with keys: summary, ukRouteRecommendation, vendorCentralStrategy, complianceFlags (array of 3 strings), nextSteps (array of 3 strings).`;

      const userPrompt = `Produce a structured ${briefType || 'distribution'} commercial brief for:
Brand: ${String(brand.name)} (${String(brand.countryName)})
Owner / Producer: ${String(brand.brandOwner)} / ${String(brand.manufacturer)}
Category & Range: ${String(brand.primaryCategory)} — ${String(brand.productRangeSummary)}
UK Importer Observed: ${String(brand.ukImporterOrDistributor)} (${String(brand.ukArrangementType)})
Amazon UK Observation: ${String(brand.amazonUkPresence)}
Est. Annual UK Pipeline: £${String(brand.illustrativePipelineValueGbp)}`;

      const openRouterKey = process.env.OPENROUTER_API_KEY?.trim();
      const useOpenRouter =
        Boolean(openRouterKey) &&
        Boolean(selectedModelId) &&
        selectedModelId !== 'google/gemini-4-hydrogen';

      if (useOpenRouter && selectedModelId) {
        const raw = await callOpenRouterText(selectedModelId, systemPrompt, userPrompt);
        const parsed = extractJsonObject(raw);
        res.json({ engineUsed: `OpenRouter · ${selectedModelId}`, ...parsed });
        return;
      }

      const ai = getGeminiClient();
      if (!ai) {
        res.status(503).json({
          error: 'No AI key configured on server. Set GEMINI_API_KEY or OPENROUTER_API_KEY in server environment secrets.',
        });
        return;
      }

      const { parsed, modelUsed } = await generateJsonWithGemini(ai, {
        contents: userPrompt,
        systemInstruction: systemPrompt,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            ukRouteRecommendation: { type: Type.STRING },
            vendorCentralStrategy: { type: Type.STRING },
            complianceFlags: { type: Type.ARRAY, items: { type: Type.STRING } },
            nextSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: [
            'summary',
            'ukRouteRecommendation',
            'vendorCentralStrategy',
            'complianceFlags',
            'nextSteps',
          ],
        },
      });

      res.json({
        engineUsed:
          selectedModelId && !openRouterKey
            ? `AI Studio Gemini (${modelUsed} · Saved Post-Build: ${selectedModelId})`
            : `AI Studio Gemini (${modelUsed})`,
        ...parsed,
      });
    } catch (error) {
      const formatted = formatAiError(error, 'Failed to generate AI research brief.');
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  app.post('/api/discovery/lookup', async (req, res) => {
    try {
      const { query, countryHint } = req.body as {
        query?: string;
        countryHint?: string;
      };

      if (!query || !query.trim()) {
        res.status(400).json({ error: 'Enter a real beer, wine, or spirits brand or producer name.' });
        return;
      }

      const ai = getGeminiClient();
      if (!ai) {
        res.status(503).json({
          error: 'Built-in AI Studio key is not configured on the server.',
        });
        return;
      }

      const systemInstruction = `You are the Senior Global Beverage Sourcing Analyst for MERCENTA BWS (UK).
Mercenta operates strictly as a UK wholesale importer & Amazon Vendor Central UK (1P) partner — NEVER mention Amazon FBA.
Given an international Beer, Wine, or Spirits brand, brewery, winery, or distiller name, return accurate real-world commercial facts in JSON:
- Identify the actual brand name, legal manufacturer/producer, parent company (or Independent), country/region, official website domain, export contact role & likely/public trade email format, primary drink category from strictly one of: "Wine", "Sparkling Wine", "Beer", "Vodka", "Rum", "Whisky & Whiskey", "Gin", "Agave Spirits", "Liqueurs & Aperitifs", "Sake & Specialty".
- Identify known UK importer/distributor (e.g., Budweiser Brewing Group UK&I, Heineken UK, Diageo GB, Pernod Ricard UK, Asahi UK, Carlsberg Britvic, Campari Group UK, Speciality Brands, Bibendum, Seckford Agencies, Hallgarten, Liberty Wines, etc.) or note if UK distribution appears fragmented/unverified.
- For amazonUkPresence, return strictly one of:
  "Sold by Amazon (1P Vendor Central Active)" (when "Dispatched from and sold by Amazon" is typically present on Amazon.co.uk),
  "Sold by Amazon + 3P Resellers" (partial 1P with 3P leakage),
  "Sold by 3P Resellers Only (No 'Sold by Amazon' — 1P Target)" (no "Sold by Amazon" Buy Box owner — prime 1P pitch target), or
  "3P Fragmented / Unclaimed (No 'Sold by Amazon')".
- Provide one flagship real SKU with realistic UK bottle size, ABV%, pack format, wholesale cost GBP, and UK RRP GBP.`;

      const userPrompt = `Lookup full producer, UK distributor, and Amazon Vendor Central UK (1P) opportunity profile for:
Brand / Producer Query: ${query.trim()}
Country Hint (if provided): ${countryHint?.trim() || 'Auto-detect origin'}`;

      const [{ parsed, modelUsed }, offImageUrl] = await Promise.all([
        generateJsonWithGemini(ai, {
          contents: userPrompt,
          systemInstruction,
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              brandName: { type: Type.STRING },
              countryName: { type: Type.STRING },
              region: { type: Type.STRING },
              brandOwner: { type: Type.STRING },
              parentCompany: { type: Type.STRING },
              manufacturer: { type: Type.STRING },
              productionLocation: { type: Type.STRING },
              website: { type: Type.STRING },
              description: { type: Type.STRING },
              primaryCategory: { type: Type.STRING },
              productRangeSummary: { type: Type.STRING },
              ukPresenceStatus: { type: Type.STRING },
              ukImporterOrDistributor: { type: Type.STRING },
              ukArrangementType: { type: Type.STRING },
              amazonUkPresence: { type: Type.STRING },
              opportunityStatus: { type: Type.STRING },
              nextAction: { type: Type.STRING },
              exportContactRole: { type: Type.STRING },
              exportContactEmail: { type: Type.STRING },
              ukDistributorWebsite: { type: Type.STRING },
              ukDistributorContact: { type: Type.STRING },
              ukRepresentationStatus: { type: Type.STRING },
              flagshipSkuName: { type: Type.STRING },
              flagshipSkuType: { type: Type.STRING },
              flagshipBottleSize: { type: Type.STRING },
              flagshipAbv: { type: Type.STRING },
              flagshipPackFormat: { type: Type.STRING },
              flagshipTastingNotes: { type: Type.STRING },
              flagshipWholesaleGbp: { type: Type.NUMBER },
              flagshipRrpGbp: { type: Type.NUMBER },
            },
            required: [
              'brandName',
              'countryName',
              'region',
              'brandOwner',
              'parentCompany',
              'manufacturer',
              'productionLocation',
              'website',
              'description',
              'primaryCategory',
              'productRangeSummary',
              'ukPresenceStatus',
              'ukImporterOrDistributor',
              'ukArrangementType',
              'amazonUkPresence',
              'opportunityStatus',
              'nextAction',
              'exportContactRole',
              'exportContactEmail',
              'ukDistributorWebsite',
              'ukDistributorContact',
              'ukRepresentationStatus',
              'flagshipSkuName',
              'flagshipSkuType',
              'flagshipBottleSize',
              'flagshipAbv',
              'flagshipPackFormat',
              'flagshipTastingNotes',
              'flagshipWholesaleGbp',
              'flagshipRrpGbp',
            ],
          },
        }),
        (async (): Promise<string> => {
          try {
            const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
              query.trim()
            )}&search_simple=1&action=process&json=1&page_size=5`;
            const offRes = await fetch(url, { signal: AbortSignal.timeout(3500) });
            if (!offRes.ok) return '';
            const offJson = (await offRes.json()) as {
              products?: { image_front_url?: string; image_url?: string }[];
            };
            const firstMatch = offJson.products?.find((p) => p.image_front_url || p.image_url);
            return firstMatch?.image_front_url || firstMatch?.image_url || '';
          } catch {
            return '';
          }
        })(),
      ]);

      res.json({
        engineUsed: `AI Studio Gemini (${modelUsed})`,
        flagshipImageUrl: offImageUrl,
        ...parsed,
      });
    } catch (error) {
      const formatted = formatAiError(error, 'Failed to look up brand & distributor.');
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  app.post('/api/discovery/scout', async (req, res) => {
    try {
      const { regionOrCountry, category, objectiveCriterion, excludeBrandNames } = req.body as {
        regionOrCountry?: string;
        category?: string;
        objectiveCriterion?: string;
        excludeBrandNames?: string[];
      };

      const ai = getGeminiClient();
      if (!ai) {
        res.status(503).json({
          error: 'Built-in AI Studio key is not configured on the server.',
        });
        return;
      }

      const excludedList = (excludeBrandNames || []).slice(0, 95).join(', ');
      const systemInstruction = `You are an unbiased Senior Beverage Acquisition Strategist for MERCENTA BWS (UK).
Mercenta operates strictly as a UK wholesale importer & Amazon Vendor Central UK (1P) partner — NEVER mention Amazon FBA.
Your task is to OBJECTIVELY scout 4 real-world international Beer, Wine, or Spirits brands matching the user's market/category gap criterion.
CRITICAL ANTI-BIAS RULES:
- Do NOT return or repeat any brand in the excluded list: [${excludedList}].
- Never favor a brand unless it objectively fits the requested market, category, and UK Amazon Vendor Central (1P) criteria.
- Prefer real, respected, commercially viable producers with clear UK demand or 3P marketplace leakage ("No 'Sold by Amazon'") rather than obvious UK supermarket mega-conglomerates that already run tight 1P accounts.
- For each candidate, quantify the TWO-WAY MUTUAL BENEFIT:
  1. brandWinSummary: concrete gain for the producer (e.g. eliminating 3P price erosion, zero-FBA 1P wholesale POs, Brand Registry/A+ uplift, or UK on-trade distributor coexistence).
  2. mercentaWinSummary: concrete gain for Mercenta (e.g. wholesale-to-RRP margin spread %, recurring PO velocity, category whitespace).
  3. mutualBenefitVerdict: 1-sentence commercial synthesis.
- primaryCategory MUST be strictly one of: "Wine", "Sparkling Wine", "Beer", "Vodka", "Rum", "Whisky & Whiskey", "Gin", "Agave Spirits", "Liqueurs & Aperitifs", "Sake & Specialty".
- amazonUkPresence MUST be strictly one of: "Sold by 3P Resellers Only (No 'Sold by Amazon' — 1P Target)", "3P Fragmented / Unclaimed (No 'Sold by Amazon')", "Sold by Amazon + 3P Resellers", or "Sold by Amazon (1P Vendor Central Active)".`;

      const userPrompt = `Scout 4 net-new real international BWS brands objectively matching:
- Target Market / Region: ${regionOrCountry || 'Any Global Market'}
- Drink Category: ${category || 'Any Drink Category'}
- Objective Selection Criterion: ${objectiveCriterion || "No 'Sold by Amazon' 1P Buy Box (3P Reseller Leakage)"}
Ensure all 4 are distinct producers NOT in the excluded brand list, with realistic UK GBP wholesale cost vs UK RRP figures and objectiveScore (65-96).`;

      const { parsed, modelUsed } = await generateJsonWithGemini(ai, {
        contents: userPrompt,
        systemInstruction,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            candidates: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  brandName: { type: Type.STRING },
                  countryName: { type: Type.STRING },
                  region: { type: Type.STRING },
                  brandOwner: { type: Type.STRING },
                  parentCompany: { type: Type.STRING },
                  manufacturer: { type: Type.STRING },
                  productionLocation: { type: Type.STRING },
                  website: { type: Type.STRING },
                  description: { type: Type.STRING },
                  primaryCategory: { type: Type.STRING },
                  productRangeSummary: { type: Type.STRING },
                  ukPresenceStatus: { type: Type.STRING },
                  ukImporterOrDistributor: { type: Type.STRING },
                  ukArrangementType: { type: Type.STRING },
                  amazonUkPresence: { type: Type.STRING },
                  opportunityStatus: { type: Type.STRING },
                  nextAction: { type: Type.STRING },
                  exportContactRole: { type: Type.STRING },
                  exportContactEmail: { type: Type.STRING },
                  ukDistributorWebsite: { type: Type.STRING },
                  ukDistributorContact: { type: Type.STRING },
                  ukRepresentationStatus: { type: Type.STRING },
                  flagshipSkuName: { type: Type.STRING },
                  flagshipSkuType: { type: Type.STRING },
                  flagshipBottleSize: { type: Type.STRING },
                  flagshipAbv: { type: Type.STRING },
                  flagshipPackFormat: { type: Type.STRING },
                  flagshipTastingNotes: { type: Type.STRING },
                  flagshipWholesaleGbp: { type: Type.NUMBER },
                  flagshipRrpGbp: { type: Type.NUMBER },
                  objectiveScore: { type: Type.NUMBER },
                  brandWinSummary: { type: Type.STRING },
                  mercentaWinSummary: { type: Type.STRING },
                  mutualBenefitVerdict: { type: Type.STRING },
                },
                required: [
                  'brandName',
                  'countryName',
                  'region',
                  'brandOwner',
                  'parentCompany',
                  'manufacturer',
                  'productionLocation',
                  'website',
                  'description',
                  'primaryCategory',
                  'productRangeSummary',
                  'ukPresenceStatus',
                  'ukImporterOrDistributor',
                  'ukArrangementType',
                  'amazonUkPresence',
                  'opportunityStatus',
                  'nextAction',
                  'exportContactRole',
                  'exportContactEmail',
                  'ukDistributorWebsite',
                  'ukDistributorContact',
                  'ukRepresentationStatus',
                  'flagshipSkuName',
                  'flagshipSkuType',
                  'flagshipBottleSize',
                  'flagshipAbv',
                  'flagshipPackFormat',
                  'flagshipTastingNotes',
                  'flagshipWholesaleGbp',
                  'flagshipRrpGbp',
                  'objectiveScore',
                  'brandWinSummary',
                  'mercentaWinSummary',
                  'mutualBenefitVerdict',
                ],
              },
            },
          },
          required: ['candidates'],
        },
      });

      res.json({
        engineUsed: `AI Studio Gemini (${modelUsed})`,
        candidates: Array.isArray(parsed.candidates) ? parsed.candidates : [],
      });
    } catch (error) {
      const formatted = formatAiError(error, 'Failed to run unbiased AI Market Scout.');
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  const distDir = path.resolve(__dirname, 'dist');
  const isProd = process.env.NODE_ENV === 'production' && fs.existsSync(distDir);

  if (isProd) {
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MERCENTA BWS full-stack server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start MERCENTA BWS server:', err);
  process.exit(1);
});
