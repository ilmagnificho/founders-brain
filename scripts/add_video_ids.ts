/**
 * Add video_id to TXT file headers and reconvert
 */

import * as fs from "fs";
import * as path from "path";

const TRANSCRIPTS_DIR = "./data/transcripts";

const videoIds: Record<string, string> = {
    "01. The Startup Playbook for Hiring Your First Engineers and AEs": "i_PjjXKNpA4",
    "02. The Sales Playbook For Founders  Startup School": "DH7REvnQ1y4",
    "03. How To Get The Most Out Of Vibe Coding  Startup School": "BJjsfNO5JTo",
    "04. How To Start A Dev Tools Company  Startup School": "z1aKRhRnVNk",
    "05. Starting A Company The Key Terms You Should Know  Startup School": "wH3TKpALlw4",
    "06. How To Find A Co-Founder  Startup School": "Fk9BCr5pLTU",
    "07. How To Convert Customers With Cold Emails  Startup School": "7Kh_fpxP1yY",
};

// Read TXT files and add video_id to header
const txtFiles = fs.readdirSync(TRANSCRIPTS_DIR)
    .filter(f => f.endsWith(".txt"))
    .map(f => path.join(TRANSCRIPTS_DIR, f));

for (const filePath of txtFiles) {
    const baseName = path.basename(filePath, ".txt");
    const videoId = videoIds[baseName];

    if (!videoId) {
        console.log(`Skipping: ${baseName} (no video_id)`);
        continue;
    }

    let content = fs.readFileSync(filePath, "utf-8");

    // Check if already has header
    if (content.startsWith("---")) {
        // Update existing header with video_id
        const headerEnd = content.indexOf("---", 3);
        if (headerEnd >= 0) {
            const header = content.substring(3, headerEnd);
            if (!header.includes("video_id:")) {
                // Add video_id to header
                content = "---\nvideo_id: " + videoId + "\n" + header + "---" + content.substring(headerEnd + 3);
                fs.writeFileSync(filePath, content, "utf-8");
                console.log(`Added video_id to: ${baseName}`);
            } else {
                console.log(`Already has video_id: ${baseName}`);
            }
        }
    } else {
        console.log(`No header in: ${baseName}`);
    }
}

console.log("\nDone! Now run: npm run convert && npm run ingest:files");
