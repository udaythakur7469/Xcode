// server/src/services/rag/generalResponseAssembler.ts
//
// Takes fetched DB data (or platform feature Pinecone docs) and produces
// a natural-language response via Gemini.
//
// For GREETING and GENERAL_CS — goes straight to LLM with no DB data.
// For DB-backed intents — formats the data and prompts LLM to narrate it.
// For PLATFORM_FEATURE — uses Pinecone docs from the platform-howto namespace.
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import logger from "../../configs/loggerConfig.js";
// ─── Constants ────────────────────────────────────────────────────────────────
const ASSEMBLER_MODEL = "gemini-2.5-flash";
const MAX_TOKENS = 600;
// ─── Greeting responses (no LLM — instant) ───────────────────────────────────
const GREETING_RESPONSES = [
    "Hey! I'm your Xcode AI assistant. I can help you with coding problems, explain algorithms, review your code, answer questions about your submissions and notes, or help you prep for mock interviews. What would you like to work on?",
    "Hi there! Ready to help — whether it's debugging code, understanding algorithms, reviewing your submissions, or checking your sticky notes. What's up?",
    "Hello! I can help you solve problems, explain concepts, look up your submission history, search your sticky notes, or review mock interview feedback. What do you need?",
];
// ─── Main assembler ───────────────────────────────────────────────────────────
export async function assembleGeneralResponse(input) {
    const { intent, userMessage, dbResult, pineconeContext, userName } = input;
    try {
        // ── GREETING: instant response, no LLM ──────────────────────────────────
        if (intent === "GREETING") {
            const greeting = userName ? `Hey ${userName}! ` : "";
            const base = GREETING_RESPONSES[Math.floor(Math.random() * GREETING_RESPONSES.length)];
            return {
                response: greeting + base,
                shortCircuit: true,
            };
        }
        // ── GENERAL_CS: pure LLM, no data ───────────────────────────────────────
        if (intent === "GENERAL_CS") {
            const { text } = await generateText({
                model: google(ASSEMBLER_MODEL),
                temperature: 0.4,
                maxTokens: MAX_TOKENS,
                messages: [
                    {
                        role: "system",
                        content: `You are an expert computer science tutor embedded in a coding practice platform.
Answer the user's CS concept question clearly and concisely.
Use concrete examples. Keep answers under 300 words unless depth is truly needed.
Do not mention the platform or suggest problems — just answer the concept question.`,
                    },
                    { role: "user", content: userMessage },
                ],
            });
            return { response: text, shortCircuit: true };
        }
        // ── PLATFORM_FEATURE: use Pinecone docs ──────────────────────────────────
        if (intent === "PLATFORM_FEATURE") {
            const context = pineconeContext ?? "No specific documentation found.";
            const { text } = await generateText({
                model: google(ASSEMBLER_MODEL),
                temperature: 0.3,
                maxTokens: MAX_TOKENS,
                messages: [
                    {
                        role: "system",
                        content: `You are a helpful assistant explaining features of Xcode, a LeetCode-style coding practice platform.
Use the provided documentation context to answer the user's question.
Be concise, friendly, and practical. If the docs don't cover the question, say so honestly.

Documentation context:
${context}`,
                    },
                    { role: "user", content: userMessage },
                ],
            });
            return { response: text, shortCircuit: true };
        }
        // ── DB-backed intents: narrate the data ──────────────────────────────────
        if (!dbResult) {
            return {
                response: "I couldn't find the data you're looking for. Please try again.",
                shortCircuit: true,
            };
        }
        if (!dbResult.found) {
            return {
                response: dbResult.summary,
                shortCircuit: true,
            };
        }
        // Format DB data compactly for the LLM
        const dataStr = formatDataForPrompt(intent, dbResult.data);
        const { text } = await generateText({
            model: google(ASSEMBLER_MODEL),
            temperature: 0.3,
            maxTokens: MAX_TOKENS,
            messages: [
                {
                    role: "system",
                    content: `You are a helpful AI assistant on a coding practice platform called Xcode.
The user asked a personal data question. Here is the data retrieved from the database.
Summarize it in a clear, friendly, conversational way. 
Do not invent data. Only use what's provided.
Keep your response under 250 words. Use simple formatting — avoid markdown tables.

User's question: "${userMessage}"
Data summary: ${dbResult.summary}

Raw data:
${dataStr}`,
                },
                { role: "user", content: "Please summarize this for me." },
            ],
        });
        return { response: text, shortCircuit: true };
    }
    catch (err) {
        logger.error("[generalResponseAssembler] failed", err);
        // Fall back to the DB summary string if LLM fails
        return {
            response: dbResult?.summary ?? "Sorry, I couldn't process that request. Please try again.",
            shortCircuit: true,
        };
    }
}
// ─── Data formatter ───────────────────────────────────────────────────────────
// Converts DB result to a compact string for the LLM prompt.
// We deliberately omit huge fields (full post content, full code) to stay within token budget.
function formatDataForPrompt(intent, data) {
    try {
        switch (intent) {
            case "MY_SUBMISSIONS": {
                const subs = data.submissions ?? [];
                const lines = subs.slice(0, 8).map((s) => `- ${s.problem?.title ?? "?"}: ${s.status} | ${s.language} | ${s.runtime}ms | ${s.testCasesPassed}/${s.totalTestCases} tests | ${new Date(s.createdAt).toLocaleDateString()}`);
                return lines.join("\n") || "No submissions.";
            }
            case "MY_STATS": {
                const s = data;
                return `Total: ${s.totalSolved} | Easy: ${s.easySolved} | Medium: ${s.mediumSolved} | Hard: ${s.hardSolved}`;
            }
            case "MY_STICKY_NOTES": {
                const notes = data.notes ?? [];
                const lines = notes.map((n) => `- "${n.title ?? "Untitled"}": ${(n.content ?? "").slice(0, 120)}${(n.content?.length ?? 0) > 120 ? "..." : ""} (updated ${new Date(n.updatedAt).toLocaleDateString()})`);
                return lines.join("\n") || "No notes.";
            }
            case "MY_POSTS": {
                const posts = data.posts ?? [];
                const lines = posts.map((p) => `- "${p.title}" on ${p.problem?.title ?? "?"} | ${p._count?.comments ?? 0} comments | ${p.isDraftPost ? "draft" : "published"}`);
                return lines.join("\n") || "No posts.";
            }
            case "MY_COMMENTS": {
                const comments = data.comments ?? [];
                const lines = comments.map((c) => `- On "${c.post?.title ?? "?"}": "${(c.content ?? "").slice(0, 100)}..."`);
                return lines.join("\n") || "No comments.";
            }
            case "MY_INTERVIEW_HISTORY": {
                const interviews = data.interviews ?? [];
                const lines = interviews.map((i) => {
                    const fb = i.feedback?.[0];
                    return `- ${i.role} | ${i.type} | ${i.level} | ${fb ? `Score: ${fb.totalScore}, Verdict: ${fb.finalVerdict}` : "No feedback yet"} | ${new Date(i.createdAt).toLocaleDateString()}`;
                });
                return lines.join("\n") || "No interviews.";
            }
            case "MY_PROFILE": {
                const u = data.user;
                return `Name: ${u.name ?? "not set"}\nEmail: ${u.email}\nBio: ${u.description ?? "not set"}\nInstitution: ${u.institution ?? "not set"}\nLinks: ${u.links?.map((l) => `${l.key}: ${l.value}`).join(", ") || "none"}`;
            }
            case "PROBLEM_POSTS": {
                const posts = data.posts ?? [];
                const lines = posts.map((p) => `- "${p.title}" by ${p.author?.name ?? "?"} | ${p._count?.comments ?? 0} comments | ${new Date(p.createdAt).toLocaleDateString()}`);
                return lines.join("\n") || "No posts.";
            }
            case "TEST_CASES": {
                const examples = data.examples ?? [];
                const lines = examples.map((e, i) => `Example ${i + 1}: Input: ${e.input} → Output: ${e.output}${e.explanation ? ` (${e.explanation})` : ""}`);
                return lines.join("\n") || "No examples.";
            }
            case "PROBLEM_STATS": {
                const s = data;
                return `Problem: ${s.problem?.title} (${s.problem?.difficulty})\nAttempts: ${s.totalAttempts}\nSolved: ${s.totalSolved}\nAcceptance: ${(s.acceptanceRate * 100).toFixed(1)}%`;
            }
            default:
                return JSON.stringify(data, null, 2).slice(0, 1000);
        }
    }
    catch {
        return "Data formatting error.";
    }
}
