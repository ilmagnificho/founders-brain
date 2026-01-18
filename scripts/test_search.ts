/**
 * Complete debug test - end to end
 */
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const geminiKey = process.env.GEMINI_API_KEY!;

console.log("=== DEBUG TEST ===");
console.log("Supabase URL:", supabaseUrl);
console.log("Supabase Key present:", !!supabaseKey);
console.log("Gemini Key present:", !!geminiKey);

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenerativeAI(geminiKey);

async function test() {
    // First check if data exists
    console.log("\n[1] Checking database content...");
    const { data: countData, error: countError } = await supabase
        .from("knowledge_base")
        .select("*", { count: "exact", head: true });

    if (countError) {
        console.log("Count error:", countError);
    }

    const { count } = await supabase
        .from("knowledge_base")
        .select("*", { count: "exact", head: true });

    console.log("Total rows in database:", count);

    // Get sample data
    const { data: sampleData, error: sampleError } = await supabase
        .from("knowledge_base")
        .select("video_id, video_title, content")
        .limit(3);

    if (sampleError) {
        console.log("Sample error:", sampleError);
    } else {
        console.log("\nSample data:");
        sampleData?.forEach((row, i) => {
            console.log(`  [${i + 1}] ${row.video_title}`);
            console.log(`      Video ID: ${row.video_id}`);
            console.log(`      Content: ${row.content?.substring(0, 80)}...`);
        });
    }

    // Now test search
    const query = "공동 창업자는 어떤 기준으로 찾아야해";
    console.log("\n[2] Testing search...");
    console.log("Query:", query);

    try {
        const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const result = await embeddingModel.embedContent(query);
        const embedding = result.embedding.values;
        console.log("Embedding generated, length:", embedding.length);

        // Test the RPC function
        console.log("\n[3] Calling match_knowledge RPC...");
        const { data, error } = await supabase.rpc("match_knowledge", {
            query_embedding: embedding,
            match_threshold: 0.1,
            match_count: 5,
        });

        if (error) {
            console.log("RPC Error:", error);
            console.log("Error message:", error.message);
            console.log("Error details:", error.details);
            console.log("Error hint:", error.hint);
        } else {
            console.log("\nSearch results:", data?.length || 0);
            data?.forEach((r: any, i: number) => {
                console.log(`\n  [${i + 1}] ${r.video_title}`);
                console.log(`      Video ID: ${r.video_id}`);
                console.log(`      Similarity: ${r.similarity?.toFixed(4)}`);
            });
        }
    } catch (e) {
        console.log("Exception:", e);
    }
}

test().catch(console.error);
