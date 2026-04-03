# /pipeline

Generate a new AI agent pipeline scaffold.

## Arguments

- `name` — The pipeline name (e.g., "research-ingestion", "report-generation")

## Steps

1. Create the pipeline file at `src/pipelines/[name].ts`
2. Generate the scaffold with:
   - Pipeline configuration type (name, description, stages)
   - Input schema (typed interface)
   - Output schema (typed interface)
   - Stage definitions with typed inputs/outputs
   - Error handling with fail-fast and partial result support
   - Retry logic for external API calls
   - Logging for observability
3. Create corresponding types in `src/types/`
4. Create a test file in `tests/`
5. Report the created files

## Template

```typescript
import type { PipelineConfig, PipelineResult } from "@/types/pipeline";

interface InputSchema {
  // Define pipeline input
}

interface OutputSchema {
  // Define pipeline output
}

export const config: PipelineConfig = {
  name: "pipeline-name",
  description: "Pipeline description",
  stages: [],
};

export async function execute(input: InputSchema): Promise<PipelineResult<OutputSchema>> {
  // Pipeline execution logic
}
```
