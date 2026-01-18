import { createClient } from "@supabase/supabase-js";

// Environment validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
        "Missing Supabase environment variables. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
}

/**
 * Supabase client for browser/client-side usage
 * Uses the anon key which respects Row Level Security (RLS)
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Create a Supabase admin client for server-side operations
 * Uses the service role key which bypasses RLS
 * ⚠️ Only use this in server-side code (API routes, scripts)
 */
export function createAdminClient() {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
        throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
    }

    // supabaseUrl is validated at module load time, so we can safely assert it's defined
    return createClient(supabaseUrl!, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}

// Type definitions for the knowledge_base table
export interface KnowledgeBaseRow {
    id: string;
    content: string;
    embedding: number[] | null;
    source_origin: string;
    source_type: string;
    video_id: string | null;
    video_title: string | null;
    video_url: string | null;
    start_time: number;
    end_time: number | null;
    duration: number | null;
    chunk_index: number;
    total_chunks: number | null;
    metadata: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

export interface KnowledgeBaseInsert {
    content: string;
    embedding?: number[];
    source_origin: string;
    source_type?: string;
    video_id?: string;
    video_title?: string;
    video_url?: string;
    start_time: number;
    end_time?: number;
    duration?: number;
    chunk_index?: number;
    total_chunks?: number;
    metadata?: Record<string, unknown>;
}

// Type for the match_knowledge RPC response
export interface MatchKnowledgeResult {
    id: string;
    content: string;
    source_origin: string;
    video_id: string;
    video_title: string;
    start_time: number;
    metadata: Record<string, unknown>;
    similarity: number;
}
