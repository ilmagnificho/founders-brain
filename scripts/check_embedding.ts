import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
    // Check if embeddings exist for Co-Founder video
    const { data, error } = await supabase
        .from("knowledge_base")
        .select("id, video_id, video_title, embedding, content")
        .eq("video_id", "Fk9BCr5pLTU")
        .limit(3);

    if (error) {
        console.log("Error:", error);
        return;
    }

    console.log("Co-Founder video chunks:", data?.length || 0);
    data?.forEach((row, i) => {
        const hasEmbedding = row.embedding && row.embedding.length > 0;
        console.log(`\n[${i + 1}] ID: ${row.id}`);
        console.log(`    Has embedding: ${hasEmbedding}`);
        console.log(`    Embedding length: ${row.embedding?.length || 'null'}`);
        console.log(`    Content: ${row.content?.substring(0, 100)}...`);
    });
}

check().catch(console.error);
