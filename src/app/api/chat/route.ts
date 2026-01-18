/**
 * RAG Chat API Route
 * 
 * POST /api/chat
 * - Receives user question
 * - Searches for relevant chunks in Supabase
 * - Generates answer using Gemini with context
 * - Returns answer with source citations
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

// =============================================================================
// Types
// =============================================================================

interface ChatRequest {
    message: string;
    locale?: "ko" | "en";
}

interface Source {
    title: string;
    url: string;
    timestamp: number;
    speaker?: string;
}

interface ChatResponse {
    answer: string;
    sources: Source[];
}

interface MatchResult {
    id: string;
    content: string;
    video_title: string;
    video_url: string;
    video_id: string;
    start_time: number;
    metadata: {
        speaker?: { name: string; title?: string };
        description?: string;
    };
    similarity: number;
}

// =============================================================================
// Initialize Clients
// =============================================================================

function getClients() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const geminiKey = process.env.GEMINI_API_KEY!;

    const supabase = createClient(supabaseUrl, supabaseKey);
    const genAI = new GoogleGenerativeAI(geminiKey);

    return { supabase, genAI };
}

// =============================================================================
// RAG Pipeline Functions
// =============================================================================

/**
 * Delay helper for rate limiting
 */
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry wrapper with exponential backoff for rate limit handling
 */
async function withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
): Promise<T> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error: unknown) {
            const err = error as { status?: number; message?: string };

            // If rate limited (429), wait and retry
            if (err.status === 429 || (err.message && err.message.includes("429"))) {
                const waitTime = baseDelay * Math.pow(2, attempt); // Exponential backoff
                console.log(`Rate limited. Waiting ${waitTime}ms before retry ${attempt + 1}/${maxRetries}...`);
                await delay(waitTime);
                continue;
            }

            // For other errors, throw immediately
            throw error;
        }
    }
    throw new Error("Max retries exceeded");
}

/**
 * Translate Korean query to English for better embedding match
 */
async function translateQueryForEmbedding(
    genAI: GoogleGenerativeAI,
    query: string
): Promise<string> {
    // Only translate if the query contains Korean characters
    const hasKorean = /[\u3131-\u318E\uAC00-\uD7A3]/.test(query);
    if (!hasKorean) return query;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `Translate this Korean startup/business question to English for semantic search. Only output the English translation, nothing else:

${query}`;

    try {
        const result = await withRetry(() => model.generateContent(prompt));
        const translated = result.response.text().trim();
        console.log("Query translated:", query, "->", translated);
        return translated;
    } catch (e) {
        console.log("Translation failed, using original query");
        return query;
    }
}

/**
 * Generate embedding for the user's question
 */
async function generateQueryEmbedding(
    genAI: GoogleGenerativeAI,
    query: string
): Promise<number[]> {
    // Translate Korean to English for better embedding match
    const translatedQuery = await translateQueryForEmbedding(genAI, query);

    const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await withRetry(() => embeddingModel.embedContent(translatedQuery));
    return result.embedding.values;
}

/**
 * Search for relevant chunks using vector similarity
 */
async function searchRelevantChunks(
    supabase: ReturnType<typeof createClient>,
    embedding: number[],
    limit: number = 5
): Promise<MatchResult[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc("match_knowledge", {
        query_embedding: embedding,
        match_threshold: 0.15, // Lowered for cross-language search
        match_count: limit,
    });

    if (error) {
        console.error("Search error:", error);
        throw error;
    }

    return data || [];
}

/**
 * Build context string from retrieved chunks
 */
function buildContext(chunks: MatchResult[]): string {
    return chunks
        .map((chunk, i) => {
            const speaker = chunk.metadata?.speaker?.name || "Speaker";
            return `[Source ${i + 1}] ${speaker} in "${chunk.video_title}":\n${chunk.content}`;
        })
        .join("\n\n---\n\n");
}

/**
 * Generate answer using Gemini with RAG context
 */
async function generateAnswer(
    genAI: GoogleGenerativeAI,
    question: string,
    context: string,
    locale: "ko" | "en",
    speaker: string
): Promise<string> {
    const chatModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const systemPromptBase = locale === "ko"
        ? `당신은 YC의 파트너인 **${speaker}**입니다.
창업자와 1:1 오피스 아워(Office Hour)를 진행하고 있다고 생각하고 조언을 해주세요.

## 핵심 페르소나 (Persona)
- **자아**: 당신은 AI가 아니라 **${speaker}** 본인입니다.
- **화법**: **1인칭 시점**("저의 경험으로는...", "제가 조언드리고 싶은 것은...")을 사용하세요.
- **톤앤매너**: 친절하지만 직설적이고(Direct), 창업자의 성공을 진심으로 바라는 멘토의 태도를 유지하세요.

## 답변 원칙
1. **철저한 근거 기반**: 모든 조언은 제공된 컨텍스트(영상 내용)에 기반해야 합니다.
2. **구체적 사례**: "제가 영상에서 언급했듯이..." 또는 "YC의 다른 파트너들이 말했듯이..."와 같이 구체적인 사례를 드세요.
3. **실명 언급**: 본인이 말하는 것처럼 자연스럽게 이야기하되, 다른 파트너의 의견을 인용할 때는 그들의 이름을 언급하세요.
4. **용어 병기**: 핵심 스타트업 용어는 한국어 뒤에 괄호로 영어를 병기하세요. 예: "시장 적합성 (Product-Market Fit)".

## 출력 형식 (마크다운)

### 💡 ${speaker}의 인사이트 (Insight)
질문에 대한 핵심 조언을 1인칭으로 작성하세요.

### 📋 실행 가이드 (Actionable Steps)
1. **[핵심 전략 1]**
   - 저의 조언: "..."

2. **[핵심 전략 2]**
   - 구체적 실행 방법: ...

### 🎯 창업자에게 (Note)
> "..." (당신의 핵심 메시지를 인용구로 강조)

### 🔗 더 깊이 알아보기 (Explore Deeper)
- "제가 이 기회에 더 말씀드리고 싶은 것은..." (후속 질문 제안)
`
        : `You are **${speaker}**, a Group Partner at Y Combinator.
Act as if you are conducting a 1:1 Office Hour session with a founder.

## Persona
- **Identity**: You are **${speaker}**. You are NOT an AI.
- **Perspective**: Speak in the **first person** ("I suggest...", "In my experience...").
- **Tone**: Helpful, direct, and mentor-like.

## Principles
1. **Evidence-Based**: Base all advice on the provided context.
2. **Concrete Examples**: Say "As I mentioned in the video..." or "As discussed...".
3. **Bilingual Support**: If the user asks in Korean, respond in Korean with English terms in parentheses.

## Output Format (Markdown)

### 💡 ${speaker}'s Insight
Summary of the answer in the first person.

### 📋 Actionable Steps
1. **[Strategy 1]**
   - My Advice: "..."

2. **[Strategy 2]**
   - How to execute: ...

### 🎯 Founder's Note
> "Quote from me..."

### 🔗 Explore Deeper
- Suggest follow-up questions.
`;

    const finalPrompt = `${systemPromptBase}

---
**Context:**
${context}

---
**Question:**
${question}`;

    const result = await withRetry(() => chatModel.generateContent(finalPrompt));
    return result.response.text();
}

/**
 * Format sources with YouTube timestamp links
 */
function formatSources(chunks: MatchResult[]): Source[] {
    // Deduplicate by video_id, keep highest similarity
    const uniqueVideos = new Map<string, MatchResult>();

    for (const chunk of chunks) {
        const existing = uniqueVideos.get(chunk.video_id);
        if (!existing || chunk.similarity > existing.similarity) {
            uniqueVideos.set(chunk.video_id, chunk);
        }
    }

    return Array.from(uniqueVideos.values()).map((chunk) => {
        // Build YouTube URL from video_id
        // Handle non-youtube IDs (slugs)
        let youtubeUrl = chunk.video_url;
        if (!youtubeUrl.includes("http")) {
            youtubeUrl = `https://www.youtube.com/watch?v=${chunk.video_id}&t=${Math.floor(chunk.start_time)}`;
        }

        return {
            title: chunk.video_title,
            url: youtubeUrl,
            timestamp: chunk.start_time,
            speaker: chunk.metadata?.speaker?.name,
        };
    });
}

// =============================================================================
// API Route Handler
// =============================================================================

export async function POST(request: NextRequest) {
    try {
        const body: ChatRequest = await request.json();
        const { message, locale = "ko" } = body;

        console.log("\n========== RAG PIPELINE START ==========");
        console.log("Message:", message);
        console.log("Locale:", locale);

        if (!message || message.trim().length === 0) {
            return NextResponse.json(
                { error: "Message is required" },
                { status: 400 }
            );
        }

        const { supabase, genAI } = getClients();

        // 1. Generate embedding for the question
        console.log("\n[1] Generating query embedding...");
        const embedding = await generateQueryEmbedding(genAI, message);
        console.log("Embedding length:", embedding.length);

        // 2. Search for relevant chunks
        console.log("\n[2] Searching relevant chunks...");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const chunks = await searchRelevantChunks(supabase as any, embedding, 8);
        console.log("Chunks found:", chunks.length);

        // Log each chunk for debugging
        chunks.forEach((chunk, i) => {
            console.log(`  [Chunk ${i + 1}]`);
            console.log(`    Title: ${chunk.video_title}`);
            console.log(`    Video ID: ${chunk.video_id}`);
            console.log(`    Similarity: ${chunk.similarity?.toFixed(4) || 'N/A'}`);
            console.log(`    Content preview: ${chunk.content?.substring(0, 100)}...`);
        });

        if (chunks.length === 0) {
            console.log("WARNING: No chunks found!");
            return NextResponse.json({
                answer: locale === "ko"
                    ? "죄송합니다, 관련된 내용을 찾지 못했습니다."
                    : "Sorry, I couldn't find relevant content.",
                sources: [],
            });
        }

        // 3. Build context from chunks
        console.log("\n[3] Building context...");
        const context = buildContext(chunks);
        console.log("Context length:", context.length);
        console.log("Context preview:", context.substring(0, 500));

        // Determine dominant speaker
        const speakers = chunks
            .map(c => c.metadata?.speaker?.name)
            .filter((s): s is string => !!s);

        let dominantSpeaker = "YC Partner";
        if (speakers.length > 0) {
            const counts: Record<string, number> = {};
            speakers.forEach(s => { counts[s] = (counts[s] || 0) + 1; });
            dominantSpeaker = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
        }
        console.log("Dominant Speaker:", dominantSpeaker);

        // 4. Generate answer using Gemini
        console.log("\n[4] Generating answer...");
        const answer = await generateAnswer(genAI, message, context, locale, dominantSpeaker);
        console.log("Answer preview:", answer.substring(0, 200));

        // 5. Format sources
        console.log("\n[5] Formatting sources...");
        const sources = formatSources(chunks);
        console.log("Sources:", JSON.stringify(sources, null, 2));

        console.log("\n========== RAG PIPELINE END ==========\n");

        const response: ChatResponse = { answer, sources };
        return NextResponse.json(response);

    } catch (error: unknown) {
        console.error("Chat API error:", error);

        // Log detailed error for debugging
        if (error instanceof Error) {
            console.error("Error name:", error.name);
            console.error("Error message:", error.message);
            console.error("Error stack:", error.stack);
        }

        // Check for rate limit error
        const err = error as { status?: number; message?: string };
        if (err.status === 429) {
            return NextResponse.json({
                answer: "API 요청 한도에 도달했습니다. 잠시 후 다시 시도해주세요. (약 1분 대기)",
                sources: [],
            }, { status: 200 }); // Return 200 so UI shows the message
        }

        // Return user-friendly error with debug info in dev
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            {
                error: "Failed to process request",
                details: process.env.NODE_ENV === "development" ? errorMessage : undefined
            },
            { status: 500 }
        );
    }
}
