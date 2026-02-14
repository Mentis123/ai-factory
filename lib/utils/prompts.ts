import { readFileSync } from "fs";
import { join } from "path";

const promptCache = new Map<string, string>();

export function loadPrompt(filename: string): string {
  if (promptCache.has(filename)) return promptCache.get(filename)!;
  const content = readFileSync(
    join(process.cwd(), "prompts", filename),
    "utf-8"
  );
  promptCache.set(filename, content);
  return content;
}

export function fillTemplate(
  template: string,
  vars: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  return result;
}
