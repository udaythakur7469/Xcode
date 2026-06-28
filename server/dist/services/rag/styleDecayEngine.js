// server/src/services/rag/styleDecayEngine.ts
//
// Pure deterministic function — no DB calls, no LLM calls, no side effects.
// Takes the previous style state + situational signals, returns the next state.
//
// This is the ONLY place where refusal style changes.
// It is completely separate from permission decisions — permissions
// are set by processSolutionIntent and never touched here.
import { RefusalStyle, } from "./types.js";
// After this many milliseconds without a denial, style resets to NEUTRAL.
// 6 hours — prevents permanent harsh tone across long sessions.
export const STYLE_COOLDOWN_MS = 1000 * 60 * 60 * 6;
// The neutral baseline intensity — what the system resets to after
// topic change, problem solve, or cooldown expiry.
const NEUTRAL_INTENSITY = 2;
// First-denial intensity — new users / new problems start at ENCOURAGING.
const INITIAL_INTENSITY = 3;
// ============================================================
// mapIntensityToStyle
//
// Converts the numeric intensity to the RefusalStyle enum value
// used by the denial prompt builder.
// ============================================================
export const mapIntensityToStyle = (intensity) => {
    switch (intensity) {
        case 3: return RefusalStyle.ENCOURAGING;
        case 2: return RefusalStyle.NEUTRAL;
        case 1: return RefusalStyle.DIRECT;
        case 0: return RefusalStyle.MINIMAL;
    }
};
// ============================================================
// computeNextStyleState
//
// The core decay algorithm. Call this every time a denial fires,
// BEFORE calling the denial response generator.
//
// Input signals and where they come from:
//
//   previousState    — read from RefusalState table via refusalStateRepository
//   repeatedAttempt  — previousState.denialCount >= 1
//   confidenceLow    — intentConfidence < 0.5 from detectSolutionIntent
//   isNewTopic       — topicShiftResult.isNewTopic from topicShiftDetection
//   userSolved       — problemContext.userSolved from getProblemContext
//   cooldownExpired  — Date.now() - previousState.lastUpdatedAt > STYLE_COOLDOWN_MS
//
// Output: the new StyleState to persist, plus the RefusalStyle to use
// when building the denial prompt.
// ============================================================
export const computeNextStyleState = (input) => {
    const { previousState, repeatedAttempt, confidenceLow, isNewTopic, userSolved, cooldownExpired, } = input;
    // ── HARD RESET CONDITIONS ──────────────────────────────────────────
    // Any of these signals means the user has made legitimate progress
    // or enough time has passed. Reset to NEUTRAL baseline, zero count.
    //
    // ORDER MATTERS: check resets before decays.
    if (userSolved || isNewTopic || cooldownExpired) {
        return {
            intensity: NEUTRAL_INTENSITY,
            denialCount: 0,
            lastUpdatedAt: new Date(),
        };
    }
    // ── FIRST DENIAL (no previous state) ─────────────────────────────
    // Brand new denial for this user+problem. Start warm at ENCOURAGING.
    if (previousState === null) {
        return {
            intensity: INITIAL_INTENSITY,
            denialCount: 1,
            lastUpdatedAt: new Date(),
        };
    }
    // ── DECAY ─────────────────────────────────────────────────────────
    // Intensity drops by 1 (never below 0) on:
    //   - repeated attempt (user tried again after denial)
    //   - low confidence (ambiguous request — be conservative)
    //
    // If neither trigger fires, intensity stays the same.
    // (User asked once legitimately, got denied, and the topic is the same.
    //  We don't punish them further without evidence of persistence.)
    let nextIntensity = previousState.intensity;
    if (repeatedAttempt || confidenceLow) {
        nextIntensity = Math.max((previousState.intensity - 1), 0);
    }
    return {
        intensity: nextIntensity,
        denialCount: previousState.denialCount + 1,
        lastUpdatedAt: new Date(),
    };
};
