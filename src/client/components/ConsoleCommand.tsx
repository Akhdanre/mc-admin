import { useState, type SubmitEvent } from "react";

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
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-6">
      <h2 className="text-lg font-bold text-white mb-2">Execute RCON Command</h2>
      <p className="text-xs text-slate-400 mb-4">
        Send Minecraft commands directly to the server (e.g. <code>list</code>, <code>say hello</code>, <code>time query day</code>).
      </p>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="e.g. list"
          disabled={isExecuting}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
        />
        <button
          type="submit"
          disabled={isExecuting}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs px-4 py-2 rounded-lg transition cursor-pointer"
        >
          {isExecuting ? "Running..." : "Run"}
        </button>
      </form>

      <div className="bg-slate-950 rounded-lg p-3 border border-slate-800/60 font-mono text-xs text-slate-300 min-h-[70px] overflow-x-auto whitespace-pre-wrap">
        {output}
      </div>
    </div>
  );
}
