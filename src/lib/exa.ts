interface ExaResult {
  title: string;
  url: string;
  publishedDate?: string;
  author?: string;
  text?: string;
}

interface ExaSearchResponse {
  results: ExaResult[];
}

export async function searchAINews(
  query: string,
  numResults: number = 10,
): Promise<ExaResult[]> {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) {
    throw new Error("EXA_API_KEY is not set");
  }

  const response = await fetch("https://api.exa.ai/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      query,
      numResults,
      type: "auto",
      useAutoprompt: true,
      text: { maxCharacters: 1000 },
      category: "news",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Exa API error (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as ExaSearchResponse;
  return data.results ?? [];
}
