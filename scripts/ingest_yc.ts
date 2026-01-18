/**
 * FoundersBrain - YouTube Transcript Ingestion Script
 *
 * This script fetches transcripts from YouTube videos, chunks them,
 * generates embeddings via Gemini, and stores them in Supabase.
 *
 * Usage:
 *   npx tsx scripts/ingest_yc.ts                    # Ingest all YC playlist
 *   npx tsx scripts/ingest_yc.ts --video VIDEO_ID   # Single video
 *   npx tsx scripts/ingest_yc.ts --test             # Test mode (1 video)
 *
 * Designed to be source-agnostic - can be adapted for other content sources.
 */

import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from .env.local (Next.js convention)
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { YoutubeTranscript } from "youtube-transcript";

// =============================================================================
// Configuration
// =============================================================================

interface IngestionConfig {
    sourceOrigin: string;
    sourceType: string;
    playlistId?: string;
    videoIds?: string[];
    chunkSize: number; // Target tokens per chunk (~4 chars per token)
    chunkOverlap: number; // Overlap between chunks for context
    batchSize: number; // Embeddings per batch
    rateLimitDelayMs: number; // Delay between API calls
}

const DEFAULT_CONFIG: IngestionConfig = {
    sourceOrigin: "yc_startup_school",
    sourceType: "youtube",
    playlistId: "PLQ-uHSnFig5M9fW16o2l35jrfdsxGknNB", // YC Startup School playlist
    chunkSize: 500,
    chunkOverlap: 50,
    batchSize: 20,
    rateLimitDelayMs: 200,
};

// YC Startup School video IDs (fallback if playlist fetch fails)
const YC_VIDEO_IDS = [
    "XcTvIO4hZ9k", // How to Get Startup Ideas
    "ii1jcLg-eIQ", // How to Find Product Market Fit
    "0MGNf1BNQfw", // How to Talk to Users
    "C27RVio2rOs", // How to Launch
    "SHAh6WKBgiE", // How to Set KPIs and Goals
    "hBh2H4D0dDs", // How to Prioritize Your Time
    "g3NQnZi9hUw", // How to Raise a Seed Round
    "hyYCn_kAngI", // How to Pitch Your Startup
    "yP176MBG9Tk", // How to Split Equity Among Co-Founders
    "lKiev5GVrXk", // How to Work Together
    // Add more video IDs as needed
];

// =============================================================================
// Types
// =============================================================================

interface TranscriptSegment {
    text: string;
    offset: number; // Start time in ms
    duration: number; // Duration in ms
}

interface Chunk {
    content: string;
    startTime: number; // In seconds
    endTime: number; // In seconds
    chunkIndex: number;
}

interface VideoMetadata {
    videoId: string;
    title: string;
    url: string;
}

// Client types for type safety
interface IngestionClients {
    supabase: SupabaseClient;
    embeddingModel: GenerativeModel;
}

// =============================================================================
// Initialize Clients
// =============================================================================

function initClients(): IngestionClients {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!supabaseUrl || !supabaseKey) {
        throw new Error("Missing Supabase environment variables");
    }
    if (!geminiKey) {
        throw new Error("Missing GEMINI_API_KEY environment variable");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const genAI = new GoogleGenerativeAI(geminiKey);
    const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

    return { supabase, embeddingModel };
}

// =============================================================================
// Transcript Fetching
// =============================================================================

async function fetchTranscript(videoId: string): Promise<TranscriptSegment[]> {
    // Use Python youtube-transcript-api via subprocess for better compatibility
    const { execSync } = await import("child_process");
    const scriptPath = path.resolve(__dirname, "fetch_transcript.py");

    try {
        const result = execSync(`python "${scriptPath}" "${videoId}"`, {
            encoding: "utf-8",
            maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large transcripts
        });

        const parsed = JSON.parse(result);

        // Check for error response
        if (parsed.error) {
            throw new Error(parsed.error);
        }

        // Map Python output to our format (start -> offset in ms)
        return parsed.map((item: { text: string; start: number; duration: number }) => ({
            text: item.text,
            offset: item.start * 1000, // Convert to milliseconds
            duration: item.duration * 1000,
        }));
    } catch (error) {
        console.error(`Failed to fetch transcript for ${videoId}:`, error);
        throw error;
    }
}

// =============================================================================
// Chunking Logic
// =============================================================================

function chunkTranscript(
    segments: TranscriptSegment[],
    config: IngestionConfig
): Chunk[] {
    const chunks: Chunk[] = [];
    let currentChunk: string[] = [];
    let currentCharCount = 0;
    let chunkStartTime = segments[0]?.offset || 0;
    let chunkEndTime = 0;
    let chunkIndex = 0;

    // Target character count (approx 4 chars per token)
    const targetChars = config.chunkSize * 4;

    for (const segment of segments) {
        const segmentText = segment.text.trim();
        const segmentChars = segmentText.length;

        // If adding this segment exceeds target, finalize current chunk
        if (currentCharCount + segmentChars > targetChars && currentChunk.length > 0) {
            chunks.push({
                content: currentChunk.join(" "),
                startTime: chunkStartTime / 1000, // Convert to seconds
                endTime: chunkEndTime / 1000,
                chunkIndex: chunkIndex++,
            });

            // Keep overlap for context continuity
            const overlapText = currentChunk.slice(-2).join(" ");
            currentChunk = overlapText ? [overlapText] : [];
            currentCharCount = overlapText.length;
            chunkStartTime = segment.offset;
        }

        currentChunk.push(segmentText);
        currentCharCount += segmentChars + 1; // +1 for space
        chunkEndTime = segment.offset + segment.duration;
    }

    // Don't forget the last chunk
    if (currentChunk.length > 0) {
        chunks.push({
            content: currentChunk.join(" "),
            startTime: chunkStartTime / 1000,
            endTime: chunkEndTime / 1000,
            chunkIndex: chunkIndex,
        });
    }

    return chunks;
}

// =============================================================================
// Embedding Generation
// =============================================================================

async function generateEmbedding(
    embeddingModel: GenerativeModel,
    text: string
): Promise<number[]> {
    const result = await embeddingModel.embedContent(text);
    return result.embedding.values;
}

async function generateEmbeddingsWithDelay(
    embeddingModel: GenerativeModel,
    texts: string[],
    delayMs: number
): Promise<number[][]> {
    const embeddings: number[][] = [];

    for (let i = 0; i < texts.length; i++) {
        const embedding = await generateEmbedding(embeddingModel, texts[i]);
        embeddings.push(embedding);

        // Progress indicator
        if ((i + 1) % 10 === 0) {
            console.log(`  Generated ${i + 1}/${texts.length} embeddings`);
        }

        // Delay to respect rate limits
        if (i < texts.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
    }

    return embeddings;
}

// =============================================================================
// Database Operations
// =============================================================================

async function upsertChunks(
    supabase: SupabaseClient,
    chunks: Chunk[],
    embeddings: number[][],
    videoMeta: VideoMetadata,
    config: IngestionConfig
): Promise<void> {
    const rows = chunks.map((chunk, i) => ({
        content: chunk.content,
        embedding: embeddings[i],
        source_origin: config.sourceOrigin,
        source_type: config.sourceType,
        video_id: videoMeta.videoId,
        video_title: videoMeta.title,
        video_url: videoMeta.url,
        start_time: chunk.startTime,
        end_time: chunk.endTime,
        duration: chunk.endTime - chunk.startTime,
        chunk_index: chunk.chunkIndex,
        total_chunks: chunks.length,
        metadata: {
            playlist_id: config.playlistId,
            ingested_at: new Date().toISOString(),
        },
    }));

    // Delete existing chunks for this video (upsert behavior)
    await supabase
        .from("knowledge_base")
        .delete()
        .eq("video_id", videoMeta.videoId)
        .eq("source_origin", config.sourceOrigin);

    // Insert new chunks in batches
    const batchSize = 50;
    for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const { error } = await supabase.from("knowledge_base").insert(batch);

        if (error) {
            console.error("Insert error:", error);
            throw error;
        }
    }

    console.log(`  Inserted ${rows.length} chunks for video ${videoMeta.videoId}`);
}

// =============================================================================
// Video Ingestion
// =============================================================================

async function ingestVideo(
    videoId: string,
    config: IngestionConfig,
    clients: IngestionClients
): Promise<void> {
    console.log(`\nProcessing video: ${videoId}`);

    // 1. Fetch transcript
    console.log("  Fetching transcript...");
    const transcript = await fetchTranscript(videoId);
    console.log(`  Found ${transcript.length} segments`);

    // 2. Chunk the transcript
    console.log("  Chunking transcript...");
    const chunks = chunkTranscript(transcript, config);
    console.log(`  Created ${chunks.length} chunks`);

    // 3. Generate embeddings
    console.log("  Generating embeddings...");
    const embeddings = await generateEmbeddingsWithDelay(
        clients.embeddingModel,
        chunks.map((c) => c.content),
        config.rateLimitDelayMs
    );

    // 4. Prepare video metadata
    const videoMeta: VideoMetadata = {
        videoId,
        title: `YC Startup School - ${videoId}`, // Can be enhanced with YouTube API
        url: `https://www.youtube.com/watch?v=${videoId}`,
    };

    // 5. Store in Supabase
    console.log("  Storing in database...");
    await upsertChunks(clients.supabase, chunks, embeddings, videoMeta, config);

    console.log(`✓ Completed video: ${videoId}`);
}

// =============================================================================
// Main Entry Point
// =============================================================================

async function main() {
    console.log("╔════════════════════════════════════════════════════════════╗");
    console.log("║     FoundersBrain - YouTube Transcript Ingestion           ║");
    console.log("╚════════════════════════════════════════════════════════════╝");

    // Parse command line arguments
    const args = process.argv.slice(2);
    const isTestMode = args.includes("--test");
    const videoArgIndex = args.indexOf("--video");
    const singleVideoId = videoArgIndex >= 0 ? args[videoArgIndex + 1] : null;

    // Determine source from --source arg or default to YC
    const sourceArgIndex = args.indexOf("--source");
    const sourceOrigin = sourceArgIndex >= 0 ? args[sourceArgIndex + 1] : "yc_startup_school";

    const config: IngestionConfig = {
        ...DEFAULT_CONFIG,
        sourceOrigin,
    };

    console.log(`\nConfiguration:`);
    console.log(`  Source: ${config.sourceOrigin}`);
    console.log(`  Mode: ${isTestMode ? "TEST (1 video)" : singleVideoId ? "Single video" : "Full playlist"}`);

    // Initialize clients
    const clients = initClients();
    console.log(`  ✓ Clients initialized`);

    // Determine which videos to process
    let videoIds: string[];
    if (singleVideoId) {
        videoIds = [singleVideoId];
    } else if (isTestMode) {
        videoIds = [YC_VIDEO_IDS[0]]; // Just the first video for testing
    } else {
        videoIds = YC_VIDEO_IDS;
    }

    console.log(`\nVideos to process: ${videoIds.length}`);

    // Process each video
    let successCount = 0;
    let failCount = 0;

    for (const videoId of videoIds) {
        try {
            await ingestVideo(videoId, config, clients);
            successCount++;
        } catch (error) {
            console.error(`✗ Failed to process ${videoId}:`, error);
            failCount++;
        }
    }

    // Summary
    console.log("\n════════════════════════════════════════════════════════════");
    console.log(`Ingestion Complete!`);
    console.log(`  ✓ Success: ${successCount} videos`);
    if (failCount > 0) {
        console.log(`  ✗ Failed: ${failCount} videos`);
    }
    console.log("════════════════════════════════════════════════════════════\n");
}

// Run the script
main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
