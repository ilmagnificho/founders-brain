import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function test() {
    console.log("=== Direct Co-Founder Search Test ===\n");

    // Generate embedding for co-founder query
    const query = "co-founder how to find";
    console.log("Query (English):", query);

    const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await embeddingModel.embedContent(query);
    const embedding = result.embedding.values;
    console.log("Embedding dimensions:", embedding.length);

    // Direct search
    const { data, error } = await supabase.rpc("match_knowledge", {
        query_embedding: embedding,
        match_threshold: 0.0, // No threshold - get everything
        match_count: 10,
    });

    if (error) {
        console.log("\nRPC Error:", error);
        return;
    }

    console.log("\nResults:", data?.length || 0);
    data?.forEach((r: any, i: number) => {
        console.log(`\n[${i + 1}] ${r.video_title}`);
        console.log(`    Video ID: ${r.video_id}`);
        console.log(`    Similarity: ${r.similarity?.toFixed(4)}`);
    });

    // Also try Korean query
    console.log("\n\n--- Korean Query ---");
    const queryKo = "공동창업자 찾기";
    console.log("Query:", queryKo);

    const resultKo = await embeddingModel.embedContent(queryKo);
    const embeddingKo = resultKo.embedding.values;

    const { data: dataKo, error: errorKo } = await supabase.rpc("match_knowledge", {
        query_embedding: embeddingKo,
        match_threshold: 0.0,
        match_count: 10,
    });

    if (errorKo) {
        console.log("\nRPC Error:", errorKo);
        return;
    }

    console.log("\nResults:", dataKo?.length || 0);
    dataKo?.forEach((r: any, i: number) => {
        console.log(`\n[${i + 1}] ${r.video_title}`);
        console.log(`    Similarity: ${r.similarity?.toFixed(4)}`);
    });
}

test().catch(console.error);
