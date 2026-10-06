import { mock } from "bun:test";

// Mock server-only in test environment so server modules can be tested cleanly
mock.module("server-only", () => ({}));
