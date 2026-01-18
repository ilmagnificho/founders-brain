import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
    const { data } = await supabase.from("knowledge_base").select("video_id, video_title");
    const unique = new Map<string, string>();
    data?.forEach((r) => unique.set(r.video_id, r.video_title));

    console.log("Videos in database:");
    unique.forEach((title, id) => console.log(`  ${id}: ${title}`));
    console.log("");
    console.log("Total unique videos:", unique.size);
}

check().catch(console.error);
