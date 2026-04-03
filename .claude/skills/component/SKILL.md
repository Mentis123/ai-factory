# /component

Generate a new React component.

## Arguments

- `name` — The component name (e.g., "ReportCard", "DashboardHeader")

## Steps

1. Create the component file at `src/components/[Name].tsx`
2. Generate the scaffold with:
   - Typed props interface
   - Functional component with explicit return type
   - Mobile-first responsive structure
   - Loading and error state handling
   - Accessibility attributes (ARIA labels, semantic HTML)
3. Create a test file in `tests/`
4. Report the created files

## Template

```typescript
interface ComponentNameProps {
  // Define props
}

export function ComponentName({ ...props }: ComponentNameProps) {
  return (
    <div>
      {/* Component content */}
    </div>
  );
}
```
