import { CreateWorkflowDTO } from "@vapi-ai/web/dist/api";

export const generator: CreateWorkflowDTO = {
  name: "InterviewAI",
  nodes: [
    {
      name: "introduction",
      type: "conversation",
      isStart: true,
      metadata: {
        position: {
          x: -267.57101294137914,
          y: -673.3500263605216,
        },
      },
      prompt:
        "Greet the user. Inform them that you will get some information from them, to create a perfect interview. Ask the caller for data required to extract. Ask the questions one by one, and await an answer.",
      variableExtractionPlan: {
        output: [
          {
            enum: [],
            type: "string",
            title: "role",
            description:
              "What role are you interviewing for? (e.g., Frontend, Backend, UX)",
          },
          {
            enum: [],
            type: "string",
            title: "level",
            description: "The job experience level.",
          },
          {
            enum: [],
            type: "number",
            title: "amount",
            description:
              "How many questions would you like to generate? do not give the user an example number like 5 or 10",
          },
          {
            enum: ["TECHNICAL", "BEHAVIORAL", "MIXED"],
            type: "string",
            title: "type",
            description: "What type of the interview should it be?",
          },
          {
            enum: [],
            type: "string",
            title: "techstack",
            description:
              "A list of technologies to cover during the job interview. For example, React, Next.js, Express.js, Node and so on…",
          },
        ],
      },
      messagePlan: {
        firstMessage:
          "Hello, {{username}}! Let's prepare your\ninterview. I'll ask you a few questions and\ngenerate a perfect interview. Are you ready?",
      },
      toolIds: [],
    },
    {
      name: "apiRequest_1754157808390",
      type: "tool",
      metadata: {
        position: {
          x: -272.1059407751419,
          y: -65.4313046586575,
        },
      },
      tool: {
        url: "https://c0a181e2a4f2.ngrok-free.app/api/interview/generate-interview",
        body: {
          type: "object",
          required: [],
          properties: {
            role: {
              type: "string",
              default: "{{role}}",
              description: "",
            },
            type: {
              type: "string",
              default: "{{type}}",
              description: "",
            },
            level: {
              type: "string",
              default: "{{level}}",
              description: "",
            },
            amount: {
              type: "number",
              default: "{{amount}}",
              description: "",
            },
            techstack: {
              type: "string",
              default: "{{techstack}}",
              description: "",
            },
          },
        },
        name: "getUserData",
        type: "apiRequest",
        method: "POST",
        function: {
          name: "api_request_tool",
          parameters: {
            type: "object",
            required: [],
            properties: {},
          },
          description: "API request tool",
        },
        messages: [
          {
            type: "request-start",
            content: "Please hold on, I am generating your interview",
            blocking: true,
          },
          {
            role: "assistant",
            type: "request-complete",
            content:
              "Your interview has been generated. Thank you for the call! Bye!",
            endCallAfterSpokenEnabled: true,
          },
          {
            type: "request-failed",
            content:
              "Oops! Looks like something went wrong when generating your interview! please try again.",
            endCallAfterSpokenEnabled: true,
          },
        ],
        variableExtractionPlan: {
          schema: {
            type: "object",
            required: [],
            properties: {},
          },
          aliases: [],
        },
      },
    },
    {
      name: "hangup_1754159867687",
      type: "tool",
      metadata: {
        position: {
          x: -273.7652591537104,
          y: 223.53545370993857,
        },
      },
      tool: {
        type: "endCall",
        function: {
          name: "untitled_tool",
          parameters: {
            type: "object",
            required: [],
            properties: {},
          },
        },
        messages: [
          {
            type: "request-start",
            content:
              "Thank the user for the call and tell them that their interview has been generated",
            blocking: true,
          },
        ],
      },
    },
  ],
  edges: [
    {
      from: "apiRequest_1754157808390",
      to: "hangup_1754159867687",
    },
    {
      from: "introduction",
      to: "apiRequest_1754157808390",
    },
  ],
  globalPrompt:
    "You are a voice assistant helping with creating new AI interviewers. Your task is to collect data from the user. Remember that this is a voice conversation - do not use any special characters.",
};
