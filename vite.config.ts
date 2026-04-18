import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

function json(res: { setHeader: (name: string, value: string) => void; end: (body: string) => void }, status: number, body: unknown) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function stripCodeFence(text: string) {
  return text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "").trim();
}

async function readRequestBody(req: NodeJS.ReadableStream) {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf8");
}

async function fetchAISongRecommendation() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY가 설정되지 않았어요. .env 파일에 키를 넣어주세요.");
  }

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      tools: [{ type: "web_search_preview" }],
      tool_choice: "auto",
      text: {
        format: {
          type: "json_object",
        },
      },
      input:
        "You are a J-pop music recommendation assistant. Use web search to find one currently popular or recently high-profile J-pop song with strong public recognition. Return JSON only with keys title, artist, reason, tag. reason must be 1-2 Korean sentences. tag must be a short Korean label such as 최신 인기곡, 화제성 높음, 대중 인기곡, 지명도 높음. Do not include markdown.",
    }),
  });

  const data = (await response.json()) as {
    output_text?: string;
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(data.error?.message ?? "OpenAI 호출에 실패했어요.");
  }

  const rawText = data.output_text?.trim();

  if (!rawText) {
    throw new Error("AI 응답을 읽지 못했어요.");
  }

  const parsed = JSON.parse(stripCodeFence(rawText)) as {
    title?: string;
    artist?: string;
    reason?: string;
    tag?: string;
  };

  if (!parsed.title || !parsed.artist || !parsed.reason || !parsed.tag) {
    throw new Error("AI 응답 형식이 올바르지 않아요.");
  }

  return parsed;
}

function aiRecommendationPlugin() {
  const handleRequest = async (
    req: {
      method?: string;
      url?: string;
      on?: (event: string, cb: (err: Error) => void) => void;
      [Symbol.asyncIterator]?: NodeJS.ReadableStream[typeof Symbol.asyncIterator];
    },
    res: { statusCode: number; setHeader: (name: string, value: string) => void; end: (body: string) => void },
  ) => {
    if (req.method !== "POST" || req.url !== "/api/recommend-song") {
      return false;
    }

    try {
      await readRequestBody(req as NodeJS.ReadableStream);
      const song = await fetchAISongRecommendation();
      res.statusCode = 200;
      json(res, 200, { song });
    } catch (error) {
      res.statusCode = 500;
      json(res, 500, {
        error:
          error instanceof Error
            ? error.message
            : "AI 추천을 불러오지 못했어요.",
      });
    }

    return true;
  };

  return {
    name: "ai-recommendation-plugin",
    configureServer(server: {
      middlewares: {
        use: (
          handler: (
            req: Parameters<typeof handleRequest>[0],
            res: Parameters<typeof handleRequest>[1],
            next: () => void,
          ) => void,
        ) => void;
      };
    }) {
      server.middlewares.use(async (req, res, next) => {
        const handled = await handleRequest(req, res);
        if (!handled) next();
      });
    },
    configurePreviewServer(server: {
      middlewares: {
        use: (
          handler: (
            req: Parameters<typeof handleRequest>[0],
            res: Parameters<typeof handleRequest>[1],
            next: () => void,
          ) => void,
        ) => void;
      };
    }) {
      server.middlewares.use(async (req, res, next) => {
        const handled = await handleRequest(req, res);
        if (!handled) next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), aiRecommendationPlugin()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
  },
});
