# /endpoint

Generate a new Next.js API route.

## Arguments

- `name` — The endpoint name/path (e.g., "reports", "agents/research")

## Steps

1. Create the route directory under `src/app/api/[name]/`
2. Generate `route.ts` with:
   - Proper HTTP method handlers (GET, POST, etc.)
   - Input validation with TypeScript types
   - Structured JSON response format
   - Error handling with appropriate status codes
   - JSDoc documentation
3. Create corresponding types in `src/types/` if needed
4. Create a test file in `tests/` for the new endpoint
5. Report the created files

## Template

```typescript
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Implementation
    return NextResponse.json({ data: null });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```
