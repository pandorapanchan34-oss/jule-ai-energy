# AspidosAI → Jule Migration Spec

## Overview

`jule-ai-energy` uses `IAspidosAIAdapter` as an interface
to the `aspidos-ai` package.
This document defines what needs to be implemented in
`aspidos-ai` to complete the integration.

## Interface to Implement

```typescript
interface IAspidosAIAdapter {
  evaluateCategory(content: string): Promise<{
    category: string;
    k:        number;
    reason:   string | null;
  }>;
  signEntry(entry: AuditLogEntry): AuditLogEntry;
  verifyEntry(entry: AuditLogEntry): boolean;
  pushTelemetry(entry: AuditLogEntry): void;
}
