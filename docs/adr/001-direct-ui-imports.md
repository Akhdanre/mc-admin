# ADR 001: Direct UI Imports over Barrel Exports

## Status
Accepted

## Context
The project previously contained `src/components/ui/index.ts` re-exporting all UI primitives (`Button`, `Card`, `Badge`, `Table`, etc.) alongside direct imports like `@/components/ui/Button`. Barrel files in Next.js/Turbopack projects can cause:
1. Increased build and compile times by pulling in unrelated components into every module chunk.
2. Cyclic dependency risks when components cross-reference sibling components.
3. Inconsistent import conventions across feature teams.

## Decision
Remove `src/components/ui/index.ts`. All components must import UI primitives directly from their source files:
```ts
// Approved
import { Button } from "@/components/ui/Button";
import { Table, TableHeader, TableRow, TableCell } from "@/components/ui/Table";

// Prohibited
import { Button, Table } from "@/components/ui";
```

## Consequences
- Clean tree shaking and fast compilation in Turbopack.
- Explicit, unambiguous dependency declarations in every file.
