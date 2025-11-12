import { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon } from 'lucide-react';

interface TerminalProps {
  onCommand: (command: string) => Promise<string>;
}

interface TerminalLine {
  type: 'input' | 'output';
  content: string;
}

export function Terminal({ onCommand }: TerminalProps) {
  const [lines, setLines] = useState<TerminalLine[]>([
    { type: 'output', content: 'Welcome to Git Learning Game Terminal!' },
    { type: 'output', content: 'Type git commands here. Try "git status" to begin.\n' },
  ]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [lines.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add input to lines
    setLines(prev => [...prev, { type: 'input', content: `$ ${input}` }]);
    
    // Add to history
    setHistory(prev => [...prev, input]);
    setHistoryIndex(-1);

    // Execute command
    try {
      const output = await onCommand(input);
      setLines(prev => [...prev, { type: 'output', content: `${output}\n` }]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setLines(prev => [...prev, { type: 'output', content: `Error: ${message}\n` }]);
    }

    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  return (
    <div className="bg-gray-950 rounded-lg overflow-hidden shadow-2xl border border-gray-800">
      <div className="bg-gray-800 px-4 py-2 flex items-center gap-2 border-b border-gray-700">
        <TerminalIcon size={16} className="text-green-400" />
        <span className="text-gray-300 font-mono text-sm">Terminal</span>
      </div>
      <div
        ref={outputRef}
        className="p-4 h-64 overflow-y-auto font-mono text-sm cursor-text"
        onClick={() => inputRef.current?.focus()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            inputRef.current?.focus();
          }
        }}
        role="button"
        tabIndex={0}
      >
        {lines.map((line, index) => (
          <div
            key={`line-${index}-${line.content.substring(0, 10)}`}
            className={line.type === 'input' ? 'text-green-400' : 'text-gray-300'}
          >
            {line.content}
          </div>
        ))}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-1">
          <span className="text-green-400">$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-gray-300 outline-none"
          />
        </form>
      </div>
    </div>
  );
}

