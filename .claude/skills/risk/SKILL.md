# /risk

Manually evaluate the risk of a planned operation.

## Arguments

- `operation` — Description of the planned operation

## Steps

1. Analyze the operation description
2. Delegate to the `risk-evaluator` agent
3. The agent evaluates:
   - Severity (1-5 scale)
   - Blast radius (how many users/clients affected)
   - Reversibility (can it be undone?)
   - Data loss potential
   - Cost impact (API usage charges)
4. Return the risk assessment with a recommendation

## Agent

Delegates to: `.claude/agents/risk-evaluator.md`

## Severity Scale

1. **Minimal**: Read-only, local changes
2. **Low**: Non-destructive writes
3. **Medium**: Schema changes, bulk operations
4. **High**: Destructive ops, production changes
5. **Critical**: Data deletion, mass sends, credential changes
