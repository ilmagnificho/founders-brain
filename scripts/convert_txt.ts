/**
 * Convert YouTube transcript TXT files to JSON format
 * 
 * Usage:
 *   npm run convert                    # Convert all .txt files
 *   npm run convert -- --file xxx.txt  # Convert single file
 * 
 * TXT Format (from YouTube):
 *   0:00
 *   First line of text
 *   0:07
 *   Second line of text
 *   ...
 * 
 * Or inline format:
 *   0:00 First line of text
 *   0:07 Second line of text
 */

import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

const TRANSCRIPTS_DIR = path.resolve(process.cwd(), "data/transcripts");

// =============================================================================
// Types
// =============================================================================

interface Segment {
    time: string;
    text: string;
}

interface Metadata {
    video_id?: string;
    title?: string;
    speaker_name?: string;
    speaker_title?: string;
    speaker_background?: string;
    description?: string;
    topics?: string[];
}

interface ParseResult {
    metadata: Metadata;
    segments: Segment[];
}

interface TranscriptJSON {
    video_id: string;
    title: string;
    url: string;
    source_origin: string;
    speaker?: {
        name: string;
        title?: string;
        background?: string;
    };
    description?: string;
    topics?: string[];
    segments: Segment[];
}

// =============================================================================
// Parsing Logic
// =============================================================================

function parseTranscriptText(content: string): ParseResult {
    const lines = content.split("\n");
    const metadata: Metadata = {};
    const segments: Segment[] = [];

    let inHeader = false;
    let headerEnded = false;
    let currentTime: string | null = null;
    let headerLines: string[] = [];

    // Time pattern: "0:00" or "1:23" or "1:23:45"
    const timePattern = /^(\d{1,2}:\d{2}(?::\d{2})?)$/;
    const inlinePattern = /^(\d{1,2}:\d{2}(?::\d{2})?)\s+(.+)$/;

    for (const rawLine of lines) {
        const line = rawLine.trim();

        // Check for header start/end
        if (line === "---") {
            if (!inHeader && !headerEnded) {
                inHeader = true;
                continue;
            } else if (inHeader) {
                inHeader = false;
                headerEnded = true;
                // Process collected header lines
                processHeader(headerLines, metadata);
                continue;
            }
        }

        // Collect header lines
        if (inHeader) {
            headerLines.push(line);
            continue;
        }

        // Skip empty lines
        if (!line) continue;

        // Check for inline format: "0:00 Text here"
        const inlineMatch = line.match(inlinePattern);
        if (inlineMatch) {
            segments.push({
                time: inlineMatch[1],
                text: inlineMatch[2],
            });
            continue;
        }

        // Check for standalone timestamp
        const timeMatch = line.match(timePattern);
        if (timeMatch) {
            currentTime = timeMatch[1];
            continue;
        }

        // If we have a pending timestamp, this is the text
        if (currentTime) {
            segments.push({
                time: currentTime,
                text: line,
            });
            currentTime = null;
        }
    }

    return { metadata, segments };
}

/**
 * Process header lines - supports both key:value format and free-form YouTube description
 */
function processHeader(lines: string[], metadata: Metadata): void {
    if (lines.length === 0) return;

    // Check if first non-empty line contains a colon (key:value format)
    const firstLine = lines.find(l => l.length > 0);
    const isKeyValueFormat = firstLine && /^[a-z_]+\s*:/i.test(firstLine);

    if (isKeyValueFormat) {
        // Parse key:value pairs
        for (const line of lines) {
            const colonIndex = line.indexOf(":");
            if (colonIndex > 0) {
                const key = line.substring(0, colonIndex).trim().toLowerCase();
                const value = line.substring(colonIndex + 1).trim();

                switch (key) {
                    case "video_id":
                        metadata.video_id = value;
                        break;
                    case "title":
                        metadata.title = value;
                        break;
                    case "speaker_name":
                    case "speaker":
                        metadata.speaker_name = value;
                        break;
                    case "speaker_title":
                        metadata.speaker_title = value;
                        break;
                    case "speaker_background":
                    case "background":
                        metadata.speaker_background = value;
                        break;
                    case "description":
                        metadata.description = value;
                        break;
                    case "topics":
                        metadata.topics = value.split(",").map(t => t.trim());
                        break;
                }
            }
        }
    } else {
        // Free-form format: first line = title, rest = description
        const nonEmptyLines = lines.filter(l => l.length > 0);

        if (nonEmptyLines.length > 0) {
            metadata.title = nonEmptyLines[0];
        }

        if (nonEmptyLines.length > 1) {
            metadata.description = nonEmptyLines.slice(1).join(" ").trim();

            // Try to extract speaker name from description
            // Pattern: "Speaker Name, Title at Company" or "Company's Speaker Name"
            const speakerPatterns = [
                /(?:co-?founder|CEO|founder|partner)\s+(?:&\s+(?:CEO|CTO))?\s*([A-Z][a-z]+\s+[A-Z][a-z]+)/i,
                /([A-Z][a-z]+\s+[A-Z][a-z]+)\s+(?:joins|shares|explains|discusses)/i,
                /YC['']s\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/i,
            ];

            for (const pattern of speakerPatterns) {
                const match = metadata.description.match(pattern);
                if (match) {
                    metadata.speaker_name = match[1];
                    break;
                }
            }
        }
    }
}

function extractVideoInfo(fileName: string): { video_id: string; title: string } {
    // Remove extension
    const baseName = path.basename(fileName, ".txt");

    // Try to extract video ID from filename patterns like:
    // "VIDEO_ID - Title" or "Title [VIDEO_ID]" or just "Title"
    const idPattern = /^([a-zA-Z0-9_-]{11})\s*[-–]\s*(.+)$/;
    const bracketPattern = /^(.+)\s*\[([a-zA-Z0-9_-]{11})\]$/;

    let match = baseName.match(idPattern);
    if (match) {
        return { video_id: match[1], title: match[2] };
    }

    match = baseName.match(bracketPattern);
    if (match) {
        return { video_id: match[2], title: match[1] };
    }

    // Default: use filename as title, placeholder for video_id
    return {
        video_id: "REPLACE_WITH_VIDEO_ID",
        title: baseName.replace(/_/g, " "),
    };
}

// =============================================================================
// File Operations
// =============================================================================

function convertFile(txtPath: string): boolean {
    const fileName = path.basename(txtPath);
    console.log(`\n📄 Converting: ${fileName}`);

    try {
        // Read TXT file
        const content = fs.readFileSync(txtPath, "utf-8");

        // Parse segments and metadata
        const { metadata, segments } = parseTranscriptText(content);

        if (segments.length === 0) {
            console.log("  ⚠️  No segments found - check file format");
            return false;
        }

        console.log(`  Found ${segments.length} segments`);
        if (metadata.speaker_name) {
            console.log(`  Speaker: ${metadata.speaker_name}`);
        }

        // Extract video info from filename (as fallback)
        const fileInfo = extractVideoInfo(fileName);

        // Use metadata if provided, fallback to filename extraction
        const video_id = metadata.video_id || fileInfo.video_id;
        const title = metadata.title || fileInfo.title;

        // Create JSON structure
        const json: TranscriptJSON = {
            video_id,
            title,
            url: video_id.startsWith("REPLACE")
                ? "https://www.youtube.com/watch?v=REPLACE_WITH_VIDEO_ID"
                : `https://www.youtube.com/watch?v=${video_id}`,
            source_origin: "yc_startup_school",
            segments,
        };

        // Add speaker info if provided
        if (metadata.speaker_name) {
            json.speaker = {
                name: metadata.speaker_name,
                title: metadata.speaker_title,
                background: metadata.speaker_background,
            };
        }

        // Add description and topics if provided
        if (metadata.description) {
            json.description = metadata.description;
        }
        if (metadata.topics) {
            json.topics = metadata.topics;
        }

        // Save JSON file
        const jsonPath = txtPath.replace(".txt", ".json");
        fs.writeFileSync(jsonPath, JSON.stringify(json, null, 2), "utf-8");

        console.log(`  ✅ Created: ${path.basename(jsonPath)}`);

        // Show reminder if video_id needs to be filled
        if (video_id.startsWith("REPLACE")) {
            console.log(`  ⚠️  video_id를 수정해주세요: ${path.basename(jsonPath)}`);
        }

        return true;
    } catch (error) {
        console.error(`  ❌ Error:`, error);
        return false;
    }
}

function listTxtFiles(): string[] {
    if (!fs.existsSync(TRANSCRIPTS_DIR)) {
        fs.mkdirSync(TRANSCRIPTS_DIR, { recursive: true });
        return [];
    }

    return fs.readdirSync(TRANSCRIPTS_DIR)
        .filter((f) => f.endsWith(".txt"))
        .map((f) => path.join(TRANSCRIPTS_DIR, f));
}

// =============================================================================
// Interactive Mode
// =============================================================================

async function interactiveMode(): Promise<void> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    const question = (prompt: string): Promise<string> => {
        return new Promise((resolve) => {
            rl.question(prompt, (answer) => resolve(answer.trim()));
        });
    };

    console.log("\n📝 Interactive Transcript Converter");
    console.log("====================================\n");

    // Get video info
    const video_id = await question("YouTube Video ID (예: dQw4w9WgXcQ): ");
    const title = await question("영상 제목: ");
    const fileName = await question("저장할 파일 이름 (예: hiring_engineers): ");

    console.log("\n스크립트를 붙여넣으세요 (완료 후 빈 줄에서 'END' 입력):\n");

    let content = "";
    for await (const line of rl) {
        if (line.trim().toUpperCase() === "END") {
            break;
        }
        content += line + "\n";
    }

    rl.close();

    // Parse and save
    const { segments } = parseTranscriptText(content);

    if (segments.length === 0) {
        console.log("❌ 세그먼트를 찾지 못했어요. 형식을 확인해주세요.");
        return;
    }

    const json: TranscriptJSON = {
        video_id,
        title,
        url: `https://www.youtube.com/watch?v=${video_id}`,
        source_origin: "yc_startup_school",
        segments,
    };

    const jsonPath = path.join(TRANSCRIPTS_DIR, `${fileName}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(json, null, 2), "utf-8");

    console.log(`\n✅ 저장 완료: ${jsonPath}`);
    console.log(`   Segments: ${segments.length}개`);
    console.log(`\n다음 명령어로 임베딩 생성: npm run ingest:files`);
}

// =============================================================================
// Main
// =============================================================================

async function main() {
    console.log("╔════════════════════════════════════════════════════════════╗");
    console.log("║   FoundersBrain - TXT to JSON Converter                    ║");
    console.log("╚════════════════════════════════════════════════════════════╝");

    const args = process.argv.slice(2);

    // Interactive mode
    if (args.includes("--interactive") || args.includes("-i")) {
        await interactiveMode();
        return;
    }

    // Single file mode
    const fileArgIndex = args.indexOf("--file");
    if (fileArgIndex >= 0) {
        const fileName = args[fileArgIndex + 1];
        const filePath = path.join(TRANSCRIPTS_DIR, fileName);
        if (!fs.existsSync(filePath)) {
            console.error(`❌ File not found: ${filePath}`);
            process.exit(1);
        }
        convertFile(filePath);
        return;
    }

    // Batch mode: convert all .txt files
    const txtFiles = listTxtFiles();

    if (txtFiles.length === 0) {
        console.log("\n⚠️  No .txt files found in data/transcripts/");
        console.log("   YouTube에서 스크립트를 복사해서 .txt 파일로 저장하세요.");
        console.log("\n💡 Interactive mode: npm run convert -- -i");
        return;
    }

    console.log(`\n📁 Found ${txtFiles.length} TXT file(s)\n`);

    let successCount = 0;
    for (const filePath of txtFiles) {
        if (convertFile(filePath)) {
            successCount++;
        }
    }

    console.log("\n════════════════════════════════════════════════════════════");
    console.log(`✅ Converted: ${successCount}/${txtFiles.length} files`);
    console.log("\n다음 단계: npm run ingest:files");
    console.log("════════════════════════════════════════════════════════════\n");
}

main().catch(console.error);
