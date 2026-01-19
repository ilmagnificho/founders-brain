/**
 * Fix malformed video IDs in Supabase
 * Removes 'video-id-' prefix and lowercase transformation issues
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ID_MAPPING: Record<string, string> = {
    // Malformed ID -> Correct ID (from video_map.json)
    "video-id-7kh-fpxp1yy": "7Kh_fpxP1yY",
    "video-id-bjjsfno5jto": "BJjsfNO5JTo",
    "video-id-dh7revnq1y4": "DH7REvnQ1y4",
    "video-id-fk9bcr5pltu": "Fk9BCr5pLTU", // How To Find A Co-Founder
    "video-id-i-pjjxknpa4": "i_PjjXKNpA4", // Hiring First Engineers
    "video-id-wh3tkpallw4": "wH3TKpALlw4", // Key Terms
    "video-id-z1akrhrnvnk": "z1aKRhRnVNk",
};

async function fixVideoIds() {
    console.log("Fixing video IDs in Supabase...\n");

    for (const [badId, correctId] of Object.entries(ID_MAPPING)) {
        console.log(`Fixing ${badId} -> ${correctId}...`);

        const { error, count, data } = await supabase
            .from("knowledge_base")
            .update({ video_id: correctId })
            .eq("video_id", badId)
            .select();

        if (error) {
            console.error(`Status: FAILED - ${error.message}`);
        } else {
            console.log(`Status: SUCCESS - Updated ${data.length} rows`);
        }
    }

    console.log("\nDone!");
}

fixVideoIds();
