import OpenAI from "openai";
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
export const generateEmbedding = async (normalizedQuery) => {
    try {
        const response = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: normalizedQuery.replace(/\n/g, " "),
        });
        return response.data[0].embedding;
    }
    catch (error) {
        console.error("Error generating embedding", error);
        throw error;
    }
};
