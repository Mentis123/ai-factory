import { GoogleGenAI, Type } from "@google/genai";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

let _ai: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!_ai) {
    _ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  }
  return _ai;
}

function getModel(): string {
  return process.env.GEMINI_MODEL || "gemini-2.0-flash";
}

// Map JSON Schema type strings to Gemini Type enum
const TYPE_MAP: Record<string, Type> = {
  string: Type.STRING,
  number: Type.NUMBER,
  integer: Type.INTEGER,
  boolean: Type.BOOLEAN,
  array: Type.ARRAY,
  object: Type.OBJECT,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adaptSchema(jsonSchema: any): any {
  if (!jsonSchema || typeof jsonSchema !== "object") return jsonSchema;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = {};

  for (const [key, value] of Object.entries(jsonSchema)) {
    // Strip JSON Schema meta fields Gemini doesn't understand
    if (["$schema", "additionalProperties", "$ref", "default"].includes(key)) {
      continue;
    }

    if (key === "type" && typeof value === "string") {
      result.type = TYPE_MAP[value] || value;
    } else if (key === "properties" && typeof value === "object" && value !== null) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const props: Record<string, any> = {};
      for (const [propName, propSchema] of Object.entries(value)) {
        props[propName] = adaptSchema(propSchema);
      }
      result.properties = props;
    } else if (key === "items") {
      result.items = adaptSchema(value);
    } else {
      result[key] = value;
    }
  }

  return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function zodToGeminiSchema(zodSchema: any) {
  const jsonSchema = zodToJsonSchema(zodSchema, { target: "openApi3" });
  return adaptSchema(jsonSchema);
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateJson<T>(
  systemPrompt: string,
  userPrompt: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  zodSchema: z.ZodType<T> & { parse: (data: unknown) => T } & Record<string, any>,
  options?: { temperature?: number; model?: string }
): Promise<T> {
  const geminiSchema = zodToGeminiSchema(zodSchema);
  const model = options?.model || getModel();

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      await sleep(1000 * Math.pow(2, attempt));
    }

    try {
      const response = await getAI().models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        config: {
          systemInstruction: systemPrompt,
          temperature: options?.temperature ?? 0.3,
          responseMimeType: "application/json",
          responseSchema: geminiSchema,
        },
      });

      const text = response.text;
      if (!text) throw new Error("Empty response from Gemini");

      const parsed = JSON.parse(text);
      const validated = zodSchema.parse(parsed);
      return validated as T;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.error(`Gemini attempt ${attempt + 1} failed:`, lastError.message);
    }
  }

  throw new Error(`Gemini call failed after 3 attempts: ${lastError?.message}`);
}

export async function generateText(
  systemPrompt: string,
  userPrompt: string,
  options?: { temperature?: number; model?: string }
): Promise<string> {
  const model = options?.model || getModel();

  const response = await getAI().models.generateContent({
    model,
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    config: {
      systemInstruction: systemPrompt,
      temperature: options?.temperature ?? 0.3,
    },
  });

  const text = response.text;
  if (!text) throw new Error("Empty response from Gemini");
  return text;
}
