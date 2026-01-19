/**
 * Check Supabase for video IDs in knowledge base
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkVideoIds() {
    console.log("Checking video IDs in Supabase...\n");

    // Get distinct video_id and video_title combinations
    const { data, error } = await supabase
        .from("knowledge_base")
        .select("video_id, video_title")
        .order("video_title");

    if (error) {
        console.error("Error:", error);
        return;
    }

    // Group by unique combinations
    const uniqueVideos = new Map<string, string>();
    for (const row of data) {
        if (!uniqueVideos.has(row.video_id)) {
            uniqueVideos.set(row.video_id, row.video_title);
        }
    }

    console.log("Found", uniqueVideos.size, "unique videos:\n");
    for (const [id, title] of uniqueVideos) {
        const testUrl = `https://www.youtube.com/watch?v=${id}`;
        console.log(`ID: ${id}`);
        console.log(`Title: ${title}`);
        console.log(`URL: ${testUrl}`);
        console.log("---");
    }
}

checkVideoIds();
