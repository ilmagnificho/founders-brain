/**
 * FoundersBrain - File-Based Transcript Ingestion Script
 *
 * Reads transcript JSON files from data/transcripts/ folder,
 * generates embeddings, and stores them in Supabase.
 *
 * Usage:
 *   npm run ingest:files                           # Ingest all files
 *   npm run ingest:files -- --file hiring.json     # Single file
 *
 * File Format (JSON):
 * {
 *   "video_id": "xxx",
 *   "title": "Video Title",
 *   "url": "https://youtube.com/watch?v=xxx",
 *   "source_origin": "yc_startup_school",
 *   "segments": [
 *     { "time": "0:00", "text": "..." },
 *     { "time": "0:15", "text": "..." }
 *   ]
 * }
 */

import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

// =============================================================================
// Configuration
// =============================================================================

const TRANSCRIPTS_DIR = path.resolve(process.cwd(), "data/transcripts");
const DEFAULT_SOURCE_ORIGIN = "yc_startup_school";
const CHUNK_SIZE = 500; // Target tokens per chunk (~4 chars per token)

// =============================================================================
// Types
// =============================================================================

interface TranscriptSegment {
    time: string; // "0:00" or "1:23:45" format
    text: string;
}

interface Speaker {
    name: string;
    title?: string;
    background?: string;
}

interface TranscriptFile {
    video_id: string;
    title: string;
    url: string;
    source_origin?: string;
    speaker?: Speaker;
    description?: string;
    topics?: string[];
    segments: TranscriptSegment[];
}

interface Chunk {
    content: string;
    startTime: number;
    endTime: number;
    chunkIndex: number;
}

interface IngestionClients {
    supabase: SupabaseClient;
    embeddingModel: GenerativeModel;
}

// =============================================================================
// Utilities
// =============================================================================

/**
 * Convert time string (0:00, 1:23, 1:23:45) to seconds
 */
function parseTimeToSeconds(time: string): number {
    const parts = time.split(":").map(Number);

    if (parts.length === 2) {
        // MM:SS format
        return parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
        // HH:MM:SS format
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }

    return 0;
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
// File Reading
// =============================================================================

function listTranscriptFiles(): string[] {
    if (!fs.existsSync(TRANSCRIPTS_DIR)) {
        console.error(`❌ Transcripts directory not found: ${TRANSCRIPTS_DIR}`);
        return [];
    }

    return fs.readdirSync(TRANSCRIPTS_DIR)
        .filter(f => (f.endsWith(".json") || f.endsWith(".txt")) && !f.startsWith("_"))
        .map(f => path.join(TRANSCRIPTS_DIR, f));
}

// Load video map
const VIDEO_MAP_PATH = path.join(process.cwd(), "data", "video_map.json");
let VIDEO_MAP: Record<string, { videoId: string; speaker: string }> = {};

if (fs.existsSync(VIDEO_MAP_PATH)) {
    VIDEO_MAP = JSON.parse(fs.readFileSync(VIDEO_MAP_PATH, "utf-8"));
}

function parseTxtTranscript(content: string, fileName: string): TranscriptFile | null {
    try {
        const parts = content.split("---");
        if (parts.length < 3) return null;

        const headerLines = parts[1].trim().split("\n");
        const title = headerLines[0].trim();
        const description = headerLines.slice(1).join(" ").trim();

        // Check map for ID and Speaker
        const mappedData = VIDEO_MAP[fileName];
        let video_id = mappedData?.videoId;
        let speakerName = mappedData?.speaker;

        if (!video_id) {
            // Fallback: Generate ID from title slug
            video_id = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        }

        if (!speakerName) {
            // Fallback: Extract speaker from description (Simple heuristic)
            speakerName = "YC Partner";
            const speakerMatch = description.match(/Partner ([A-Z][a-z]+ [A-Z][a-z]+)/);
            if (speakerMatch) {
                speakerName = speakerMatch[1];
            }
        }

        const body = parts[2].trim().split("\n");
        const segments: TranscriptSegment[] = [];
        let currentTime = "0:00";
        let currentText: string[] = [];

        for (const line of body) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            // Check if line is timestamp (M:SS, MM:SS, H:MM:SS)
            if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(trimmed)) {
                // Save previous segment if exists
                if (currentText.length > 0) {
                    segments.push({
                        time: currentTime,
                        text: currentText.join(" ")
                    });
                    currentText = [];
                }
                currentTime = trimmed;
            } else if (!trimmed.startsWith("[") && !trimmed.startsWith("Key Insight") && !trimmed.startsWith("Intro")) {
                // Ignore headers/music indicators
                currentText.push(trimmed);
            }
        }

        // Add last segment
        if (currentText.length > 0) {
            segments.push({
                time: currentTime,
                text: currentText.join(" ")
            });
        }

        return {
            video_id,
            title,
            url: `https://www.youtube.com/watch?v=${video_id}`,
            description,
            speaker: { name: speakerName },
            segments,
            source_origin: DEFAULT_SOURCE_ORIGIN
        };
    } catch (error) {
        console.error("Txt parsing error:", error);
        return null;
    }
}

function readTranscriptFile(filePath: string): TranscriptFile | null {
    try {
        const content = fs.readFileSync(filePath, "utf-8");
        if (filePath.endsWith(".json")) {
            return JSON.parse(content) as TranscriptFile;
        } else if (filePath.endsWith(".txt")) {
            return parseTxtTranscript(content, path.basename(filePath));
        }
        return null;
    } catch (error) {
        console.error(`❌ Failed to read ${filePath}:`, error);
        return null;
    }
}

// =============================================================================
// Chunking Logic
// =============================================================================

function chunkTranscript(segments: TranscriptSegment[]): Chunk[] {
    const chunks: Chunk[] = [];
    let currentChunk: string[] = [];
    let currentCharCount = 0;
    let chunkStartTime = parseTimeToSeconds(segments[0]?.time || "0:00");
    let lastSegmentTime = chunkStartTime;
    let chunkIndex = 0;

    const targetChars = CHUNK_SIZE * 4;

    for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        const segmentText = segment.text.trim();
        const segmentChars = segmentText.length;
        const segmentTime = parseTimeToSeconds(segment.time);

        // If adding this segment exceeds target, finalize current chunk
        if (currentCharCount + segmentChars > targetChars && currentChunk.length > 0) {
            chunks.push({
                content: currentChunk.join(" "),
                startTime: chunkStartTime,
                endTime: lastSegmentTime,
                chunkIndex: chunkIndex++,
            });

            // Start new chunk with overlap (last 2 sentences)
            const overlapText = currentChunk.slice(-2).join(" ");
            currentChunk = overlapText ? [overlapText] : [];
            currentCharCount = overlapText.length;
            chunkStartTime = segmentTime;
        }

        currentChunk.push(segmentText);
        currentCharCount += segmentChars + 1;
        lastSegmentTime = segmentTime;
    }

    // Don't forget the last chunk
    if (currentChunk.length > 0) {
        chunks.push({
            content: currentChunk.join(" "),
            startTime: chunkStartTime,
            endTime: lastSegmentTime,
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
    delayMs: number = 200
): Promise<number[][]> {
    const embeddings: number[][] = [];

    for (let i = 0; i < texts.length; i++) {
        const embedding = await generateEmbedding(embeddingModel, texts[i]);
        embeddings.push(embedding);

        if ((i + 1) % 10 === 0) {
            console.log(`  Generated ${i + 1}/${texts.length} embeddings`);
        }

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
    transcript: TranscriptFile
): Promise<void> {
    const sourceOrigin = transcript.source_origin || DEFAULT_SOURCE_ORIGIN;

    const rows = chunks.map((chunk, i) => ({
        content: chunk.content,
        embedding: embeddings[i],
        source_origin: sourceOrigin,
        source_type: "youtube",
        video_id: transcript.video_id,
        video_title: transcript.title,
        video_url: transcript.url,
        start_time: chunk.startTime,
        end_time: chunk.endTime,
        duration: chunk.endTime - chunk.startTime,
        chunk_index: chunk.chunkIndex,
        total_chunks: chunks.length,
        metadata: {
            ingested_at: new Date().toISOString(),
            ingestion_method: "file",
            speaker: transcript.speaker || null,
            description: transcript.description || null,
            topics: transcript.topics || [],
        },
    }));

    // Delete existing chunks for this video (upsert behavior)
    await supabase
        .from("knowledge_base")
        .delete()
        .eq("video_id", transcript.video_id)
        .eq("source_origin", sourceOrigin);

    // Insert new chunks
    const batchSize = 50;
    for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const { error } = await supabase.from("knowledge_base").insert(batch);

        if (error) {
            console.error("Insert error:", error);
            throw error;
        }
    }

    console.log(`  ✓ Inserted ${rows.length} chunks`);
}

// =============================================================================
// File Ingestion
// =============================================================================

async function ingestFile(
    filePath: string,
    clients: IngestionClients
): Promise<boolean> {
    const fileName = path.basename(filePath);
    console.log(`\n📄 Processing: ${fileName}`);

    // Read file
    const transcript = readTranscriptFile(filePath);
    if (!transcript) {
        return false;
    }

    console.log(`  Title: ${transcript.title}`);
    console.log(`  Segments: ${transcript.segments.length}`);

    // Chunk
    console.log("  Chunking...");
    const chunks = chunkTranscript(transcript.segments);
    console.log(`  Created ${chunks.length} chunks`);

    // Generate embeddings
    console.log("  Generating embeddings...");
    const embeddings = await generateEmbeddingsWithDelay(
        clients.embeddingModel,
        chunks.map((c) => c.content)
    );

    // Store in database
    console.log("  Storing in database...");
    await upsertChunks(clients.supabase, chunks, embeddings, transcript);

    console.log(`✅ Completed: ${fileName}`);
    return true;
}

// =============================================================================
// Main Entry Point
// =============================================================================

async function main() {
    console.log("╔════════════════════════════════════════════════════════════╗");
    console.log("║   FoundersBrain - File-Based Transcript Ingestion          ║");
    console.log("╚════════════════════════════════════════════════════════════╝");

    // Parse arguments
    const args = process.argv.slice(2);
    const fileArgIndex = args.indexOf("--file");
    const singleFile = fileArgIndex >= 0 ? args[fileArgIndex + 1] : null;

    // Initialize clients
    console.log("\nInitializing...");
    const clients = initClients();
    console.log("  ✓ Clients ready");

    // Cleanup old 'Startup School' data to refresh with correct IDs
    console.log("Cleaning up old Startup School data...");
    await clients.supabase.from("knowledge_base").delete()
        .ilike("video_title", "%Startup School%");
    console.log("  ✓ Cleanup complete");

    // Get files to process
    let filePaths: string[];
    if (singleFile) {
        const fullPath = path.join(TRANSCRIPTS_DIR, singleFile);
        if (!fs.existsSync(fullPath)) {
            console.error(`❌ File not found: ${fullPath}`);
            process.exit(1);
        }
        filePaths = [fullPath];
    } else {
        filePaths = listTranscriptFiles();
    }

    if (filePaths.length === 0) {
        console.log("\n⚠️  No transcript files found in data/transcripts/");
        console.log("   Add .json files following the format in _example.json");
        process.exit(0);
    }

    console.log(`\nFiles to process: ${filePaths.length}`);

    // Process each file
    let successCount = 0;
    let failCount = 0;

    for (const filePath of filePaths) {
        try {
            const success = await ingestFile(filePath, clients);
            if (success) successCount++;
            else failCount++;
        } catch (error) {
            console.error(`❌ Failed: ${path.basename(filePath)}`, error);
            failCount++;
        }
    }

    // Summary
    console.log("\n════════════════════════════════════════════════════════════");
    console.log("Ingestion Complete!");
    console.log(`  ✓ Success: ${successCount} files`);
    if (failCount > 0) {
        console.log(`  ✗ Failed: ${failCount} files`);
    }
    console.log("════════════════════════════════════════════════════════════\n");
}

main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
