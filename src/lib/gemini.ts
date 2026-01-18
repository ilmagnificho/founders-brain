import { GoogleGenerativeAI } from "@google/generative-ai";

// Environment validation
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY environment variable");
}

// Initialize the Gemini client
const genAI = new GoogleGenerativeAI(apiKey);

/**
 * Gemini model for chat/completion
 * Using Gemini 3 Flash as specified in PRD for cost efficiency
 */
export const chatModel = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
});

/**
 * Gemini model for embeddings
 * text-embedding-004 produces 768-dimensional vectors
 */
export const embeddingModel = genAI.getGenerativeModel({
    model: "text-embedding-004",
});

/**
 * Generate embeddings for a single text
 * @param text - The text to generate embeddings for
 * @returns A 768-dimensional vector
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    const result = await embeddingModel.embedContent(text);
    return result.embedding.values;
}

/**
 * Generate embeddings for multiple texts in batch
 * More efficient than calling generateEmbedding multiple times
 * @param texts - Array of texts to generate embeddings for
 * @returns Array of 768-dimensional vectors
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];

    // Process in batches to avoid rate limits
    const batchSize = 100;
    for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);

        // Process batch concurrently
        const batchResults = await Promise.all(
            batch.map((text) => generateEmbedding(text))
        );

        embeddings.push(...batchResults);

        // Small delay between batches to respect rate limits
        if (i + batchSize < texts.length) {
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
    }

    return embeddings;
}

/**
 * Generate a chat response using Gemini
 * @param systemPrompt - The system instructions
 * @param userMessage - The user's message
 * @param context - Optional context chunks from RAG retrieval
 */
export async function generateChatResponse(
    systemPrompt: string,
    userMessage: string,
    context?: string
): Promise<string> {
    const fullPrompt = context
        ? `${systemPrompt}\n\n## Context:\n${context}\n\n## User Question:\n${userMessage}`
        : `${systemPrompt}\n\n## User Question:\n${userMessage}`;

    const result = await chatModel.generateContent(fullPrompt);
    const response = result.response;

    return response.text();
}

// Export the client for advanced usage
export { genAI };
