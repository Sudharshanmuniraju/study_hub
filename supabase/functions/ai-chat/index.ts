import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYSTEM_PROMPT =
  "You are a friendly, encouraging AI study assistant for students. " +
  "Help with brainstorming, concept explanations, summarization, and practice questions. " +
  "Keep answers clear, concise, and well-structured. Use bullet points and numbered lists when helpful. " +
  "When a topic is ambiguous, ask what subject it is for so you can tailor the answer.";

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

function errorResponse(message: string, status = 500) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Fallback simulated response used when no Gemini key is configured. */
function simulatedResponse(userText: string): string {
  const lower = userText.toLowerCase();
  if (lower.includes("recursion")) {
    return "Recursion is when a function calls itself to solve a smaller version of the same problem.\n\nThink of Russian nesting dolls: to open the biggest one, you open it, find a smaller doll inside, and repeat until you reach the tiniest doll that doesn't open. That last doll is the \"base case\" — the stopping point.\n\nIn code, every recursive function needs:\n1. A base case (when to stop)\n2. A recursive case (calling itself with a smaller input)\n\nWithout a base case, the function calls itself forever — like an infinite loop that eventually crashes with a stack overflow.";
  }
  return "That's a great question! Here's how I'd approach it:\n\nFirst, let's break the topic into its core components. Understanding the fundamentals gives you a solid foundation. Then, we can look at how those components connect and build on each other.\n\nIf you can share more specifics about what you're studying, I can give you a more tailored explanation with examples, analogies, and practice questions. What subject is this for?";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const messages: ChatTurn[] = Array.isArray(body?.messages) ? body.messages : [];
    const userText = messages.filter((m) => m.role === "user").pop()?.content ?? "";

    if (!userText) {
      return errorResponse("No user message provided.", 400);
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");

    // No key configured — stream a simulated response so the UI still works.
    if (!apiKey) {
      const full = simulatedResponse(userText);
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          const words = full.split(/(\s+)/);
          let i = 0;
          const timer = setInterval(() => {
            if (i >= words.length) {
              controller.close();
              clearInterval(timer);
              return;
            }
            controller.enqueue(encoder.encode(words[i]));
            i += 1;
          }, 24);
        },
      });
      return new Response(stream, {
        headers: { ...corsHeaders, "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    // Gemini uses "contents" with user/model roles (no system role in contents).
    // The system instruction goes in a separate field.
    const contents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800,
          },
        }),
      },
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini error:", geminiRes.status, errText);
      return errorResponse("The AI service is unavailable. Please try again later.", 502);
    }

    if (!geminiRes.body) {
      return errorResponse("Empty response from AI service.", 502);
    }

    // Transform the SSE stream: extract text from candidates[0].content.parts[0].text
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const reader = geminiRes.body!.getReader();
        let buffer = "";
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith("data:")) continue;
              const data = trimmed.slice(5).trim();
              if (data === "[DONE]") {
                controller.close();
                return;
              }
              try {
                const json = JSON.parse(data);
                const delta = json?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (delta) {
                  controller.enqueue(encoder.encode(delta));
                }
              } catch {
                // skip malformed JSON lines
              }
            }
          }
          controller.close();
        } catch (err) {
          console.error("Stream error:", err);
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err) {
    console.error("Function error:", err);
    return errorResponse("Something went wrong. Please try again.", 500);
  }
});
