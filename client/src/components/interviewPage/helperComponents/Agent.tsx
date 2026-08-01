"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/features/userStore";
import { vapi } from "@/services/interviewServices/vapiService";
import { useRouter } from "next/navigation";
import AgentNavbar from "./AgentNavbar";
import { useInterviewStore } from "@/features/interviewStore";
import { interviewer } from "../interviewPageData/data";
import MicPermissionDialog, {
  MicPermissionStatus,
} from "./MicPermissionDialog";

type agentProps = { type: string; id: number | null };

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

const Agent: React.FC<agentProps> = ({ type, id }) => {
  const router = useRouter();
  const { checkAuth, userData } = useUserStore();
  const { getInterviewDetails, interview, getFeedback } = useInterviewStore();

  useEffect(() => {
    checkAuth();
    if (type === "practice") {
      getInterviewDetails(id);
    }
  }, [checkAuth, getInterviewDetails, type, id]);

  const questions = interview?.questions;

  const userName = userData?.name;
  const userId = userData?.id;
  const userPicture = userData?.picture;
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [message, setMessage] = useState<SavedMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
  const [micStatus, setMicStatus] = useState<MicPermissionStatus>("unknown");

  useEffect(() => {
    const onCallStart = () => {
      setCallStatus(CallStatus.ACTIVE);
      setError(null);
    };
    const onCallEnd = () => setCallStatus(CallStatus.FINISHED);

    const onMessage = (message: Message) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        console.log("User response:", message.transcript);
        const newMessage: SavedMessage = {
          role: message.role,
          content: message.transcript,
        };
        setMessage((prev) => [...prev, newMessage]);

        if (message.role === "user") {
          setIsUserSpeaking(true);
          setTimeout(() => setIsUserSpeaking(false), 1000); // Reset after 1 second
        }
      }
    };

    const onSpeechStart = () => setIsAISpeaking(true);
    const onSpeechEnd = () => setIsAISpeaking(false);

    const onError = (error: any) => {
      console.error("VAPI Error:", error);
      setError(error.errorMsg || "Call failed");

      if (
        error.error?.type === "ejected" ||
        error.errorMsg?.includes("ended")
      ) {
        setCallStatus(CallStatus.FINISHED);
      } else {
        setCallStatus(CallStatus.INACTIVE);
      }
    };

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("message", onMessage);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("error", onError);

    return () => {
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("message", onMessage);
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
      vapi.off("error", onError);
    };
  }, []);

  const handleGeneratedFeedback = async () => {
    try {
      const response = await getFeedback(id, message);

      if (response?.success && response.feedback?.interviewId) {
        console.log(
          "Pushing to feedback page with ID:",
          response.feedback.interviewId,
        );
        router.push(
          `/interview/feedback/${response.feedback.interviewId}?source=user`,
        );
      } else {
        console.log("Feedback generation failed or no ID returned:", response);
      }
    } catch (error) {
      console.error("error", error);
    }
  };

  useEffect(() => {
    if (callStatus === CallStatus.FINISHED) {
      if (type === "generate") {
        router.push("/interview");
      } else {
        handleGeneratedFeedback();
      }
    }
  }, [message, callStatus, type, userId]);

  const requestMicPermission = async (): Promise<boolean> => {
    setMicStatus("checking");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setMicStatus("granted");
      return true;
    } catch (err: any) {
      const isDenied =
        err.name === "NotAllowedError" || err.name === "PermissionDeniedError";
      setMicStatus(isDenied ? "denied" : "unknown");
      setPermissionDialogOpen(true);
      return false;
    }
  };

  const startVapiCall = async () => {
    if (type === "generate") {
      try {
        await vapi.start(process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID, {
          variableValues: { username: userName },
        });
      } catch (err) {
        console.error("Call failed:", JSON.stringify(err, null, 2));
        setCallStatus(CallStatus.INACTIVE);
        setError("Failed to start call. Please try again.");
      }
    } else {
      const formattedQuestions = questions
        ? questions.map((q) => `- ${q}`).join("\n")
        : "";
      await vapi.start(interviewer, {
        variableValues: { questions: formattedQuestions },
      });
    }
  };

  const handleRetryPermission = async () => {
    const granted = await requestMicPermission();
    if (granted) {
      setPermissionDialogOpen(false);
      await startVapiCall();
    }
  };

  const handleCall = async () => {
    setCallStatus(CallStatus.CONNECTING);
    setError(null);
    const granted = await requestMicPermission();
    if (!granted) {
      setCallStatus(CallStatus.INACTIVE);
      return;
    }
    await startVapiCall();
  };

  const handleDisconnect = async () => {
    try {
      await vapi.stop();
    } catch (err) {
      console.error("Error ending call:", err);
    } finally {
      setCallStatus(CallStatus.FINISHED);
    }
  };

  const latestMessage = message[message.length - 1]?.content;

  return (
    <>
      <div className="w-full px-8 pb-16 pt-4">
        <AgentNavbar type={type} />
        <div className="flex flex-row w-full justify-between items-stretch gap-5">
          {/*AI Interviewer*/}
          <div
            className={cn(
              "flex flex-col items-center justify-center w-1/2 gap-3.5 p-7 h-[300px] rounded-2xl border flex-1 relative overflow-hidden transition-all",
              isAISpeaking && "shadow-[0_0_0_1px_rgba(34,197,94,0.12),0_18px_40px_-20px_var(--brand-glow)]",
            )}
            style={{
              background: "linear-gradient(160deg, #202024 0%, #141416 100%)",
              borderColor: isAISpeaking ? "var(--brand-dim)" : "var(--border)",
              borderWidth: isAISpeaking ? 1 : 1,
              borderStyle: "solid",
            }}
          >
            <div
              className="z-10 flex items-center justify-center rounded-full size-[110px] relative border"
              style={{
                background: "linear-gradient(145deg,#2c2c30,#1a1a1c)",
                borderColor: "#3a3a3e",
              }}
            >
              {isAISpeaking && (
                <span
                  className="absolute -inset-1.5 rounded-full animate-ping"
                  style={{ border: "2px solid var(--brand)" }}
                />
              )}
              <Image
                src="/ai-avatar.png"
                alt="vapi"
                width={75}
                height={65}
                className="object-cover relative z-10"
              />
            </div>
            <p className="text-[15px] font-medium text-foreground/90 z-10">
              AI interviewer
            </p>
            <small className="text-xs text-muted-foreground z-10">
              {isAISpeaking ? "speaking…" : "listening"}
            </small>
          </div>
          {/*Human Interviewee*/}
          <div
            className={cn(
              "flex flex-col items-center justify-center w-1/2 gap-3.5 p-7 h-[300px] rounded-2xl border flex-1 relative overflow-hidden transition-all",
              isUserSpeaking && "shadow-[0_0_0_1px_rgba(34,197,94,0.12),0_18px_40px_-20px_var(--brand-glow)]",
            )}
            style={{
              background: "linear-gradient(160deg, #202024 0%, #141416 100%)",
              borderColor: isUserSpeaking ? "var(--brand-dim)" : "var(--border)",
              borderWidth: 1,
              borderStyle: "solid",
            }}
          >
            <div
              className="z-10 flex items-center justify-center rounded-full size-[110px] relative border overflow-hidden"
              style={{
                background: "linear-gradient(145deg,#2c2c30,#1a1a1c)",
                borderColor: "#3a3a3e",
              }}
            >
              {isUserSpeaking && (
                <span
                  className="absolute -inset-1.5 rounded-full animate-ping"
                  style={{ border: "2px solid var(--brand)" }}
                />
              )}
              {userPicture ? (
                <Image
                  src={userPicture}
                  alt="User profile picture"
                  fill
                  className="object-cover relative z-10"
                />
              ) : (
                <Image
                  src="/Default_pfp.png"
                  alt="vapi"
                  fill
                  className="object-cover relative z-10"
                />
              )}
            </div>
            <p className="text-[15px] font-medium text-foreground/90 z-10">You</p>
            <small className="text-xs text-muted-foreground z-10">
              {isUserSpeaking ? "speaking…" : "listening"}
            </small>
          </div>
        </div>

        {message.length > 0 && (
          <div
            className="p-px rounded-2xl w-full mt-6"
            style={{
              background:
                "linear-gradient(180deg, var(--brand-glow), rgba(34,197,94,0.03))",
            }}
          >
            <div
              className="rounded-[15px] min-h-12 px-5 py-3.5 flex items-center justify-center"
              style={{
                background: "linear-gradient(180deg,#151517,#0d0d0f)",
              }}
            >
              <p
                key={latestMessage}
                className={cn(
                  "text-[15px] text-center text-foreground/90",
                  "transition-opacity duration-500 opacity-0",
                  "animate-fadeIn opacity-100",
                )}
              >
                {latestMessage}
              </p>
            </div>
          </div>
        )}

        <div className="w-full flex justify-center mt-10">
          {callStatus === "ACTIVE" ? (
            <Button
              className="w-52 h-16 px-7 py-3 rounded-full shadow-sm focus:outline-none focus:shadow-2xl text-lg font-semibold text-white border border-transparent transition-transform hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(135deg,#f75353,#c44141)",
                boxShadow: "0 12px 30px -12px rgba(247,83,83,0.5)",
              }}
              onClick={handleDisconnect}
            >
              End call
            </Button>
          ) : (
            <Button
              className="relative w-52 h-16 px-7 py-3 rounded-full shadow-sm focus:outline-none focus:shadow-2xl text-lg font-semibold text-white border border-transparent transition-transform hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(135deg, var(--brand), var(--brand-dim))",
                boxShadow: "0 12px 30px -12px var(--brand-glow)",
              }}
              onClick={handleCall}
              disabled={callStatus === CallStatus.CONNECTING}
            >
              {callStatus === "CONNECTING" ? (
                <div className="flex items-center justify-center h-full w-full">
                  <span className="animate-pulse">Connecting...</span>
                </div>
              ) : (
                <span>Start call</span>
              )}
            </Button>
          )}
        </div>
      </div>
      <MicPermissionDialog
        open={permissionDialogOpen}
        onOpenChange={setPermissionDialogOpen}
        micStatus={micStatus}
        onRetry={handleRetryPermission}
      />
    </>
  );
};
export default Agent;
