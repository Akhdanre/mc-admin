"use client";

import { useState, type SubmitEvent } from "react";
import { Button, Card, Input } from "@/components/ui";

interface ConsoleCommandProps {
  onExecute: (command: string) => Promise<string>;
}

export function ConsoleCommand({ onExecute }: ConsoleCommandProps) {
  const [command, setCommand] = useState("");
  const [output, setOutput] = useState("Awaiting command...");
  const [isExecuting, setIsExecuting] = useState(false);

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const clean = command.trim();
    if (!clean) return;

    setIsExecuting(true);
    setOutput(`Executing "${clean}"...`);
    try {
      const result = await onExecute(clean);
      setOutput(result);
      setCommand("");
    } catch (err: unknown) {
      setOutput(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <Card padding="lg">
      <h2 className="text-lg font-bold text-heading mb-2">Execute RCON Command</h2>
      <p className="text-xs text-muted-foreground mb-4">
        Send Minecraft commands directly to the server (e.g. <code>list</code>, <code>say hello</code>, <code>time query day</code>).
      </p>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <Input
          mono
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="e.g. list"
          disabled={isExecuting}
          className="flex-1"
        />
        <Button type="submit" variant="primary" disabled={isExecuting}>
          {isExecuting ? "Running..." : "Run"}
        </Button>
      </form>

      <div className="bg-overlay rounded-lg p-3 border border-border/60 font-mono text-xs text-slate-300 min-h-[70px] overflow-x-auto whitespace-pre-wrap">
        {output}
      </div>
    </Card>
  );
}
