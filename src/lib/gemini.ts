import { GoogleGenAI } from '@google/genai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string;

export const GEMINI_MODEL = 'gemini-flash-latest';

export const SYSTEM_INSTRUCTION = `You are Study Buddy, an expert AI study tutor integrated into Study Hub, a student productivity app.

Your role is to help students:
- Explain difficult concepts in simple, clear language with real-world analogies
- Summarize notes and study material concisely
- Quiz students with practice questions and check their answers
- Suggest effective study strategies and techniques

Guidelines:
- Be encouraging, friendly, and concise
- Use formatting (bullet points, numbered lists, bold) to make answers scannable
- When quizzing, ask one question at a time and wait for the student's answer
- Adapt your explanations to the student's apparent level
- Stay focused on academic help — gently redirect non-study topics back to learning`;

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!apiKey) {
    throw new Error('Missing VITE_GEMINI_API_KEY. Add it to your .env file.');
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

export type StreamChunk = {
  text: string;
  done: boolean;
};

export async function* streamChat(
  history: { role: 'user' | 'model'; text: string }[],
  userMessage: string,
): AsyncGenerator<StreamChunk> {
  const ai = getClient();

  const contents = [
    ...history.map((m) => ({
      role: m.role,
      parts: [{ text: m.text }],
    })),
    { role: 'user' as const, parts: [{ text: userMessage }] },
  ];

  const response = await ai.models.generateContentStream({
    model: GEMINI_MODEL,
    contents,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
    },
  });

  for await (const chunk of response) {
    const text = chunk.text ?? '';
    if (text) {
      yield { text, done: false };
    }
  }

  yield { text: '', done: true };
}
