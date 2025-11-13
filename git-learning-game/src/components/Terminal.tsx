import { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, Maximize2, Minimize2, Copy, Check } from 'lucide-react';

interface TerminalProps {
  onCommand: (command: string) => Promise<string>;
}

interface TerminalLine {
  type: 'input' | 'output' | 'error' | 'success';
  content: string;
  timestamp: Date;
}

export function Terminal({ onCommand }: TerminalProps) {
  const [lines, setLines] = useState<TerminalLine[]>([
    { type: 'success', content: '✨ Welcome to Git Learning Game Terminal!', timestamp: new Date() },
    { type: 'output', content: 'Type git commands here. Try "git status" to begin.', timestamp: new Date() },
    { type: 'output', content: 'Use ↑ and ↓ arrows to navigate command history.', timestamp: new Date() },
    { type: 'output', content: 'You can also drag command cards here!\n', timestamp: new Date() },
  ]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
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
    setLines(prev => [...prev, {
      type: 'input',
      content: `$ ${input}`,
      timestamp: new Date()
    }]);

    // Add to history
    setHistory(prev => [...prev, input]);
    setHistoryIndex(-1);

    const currentInput = input;
    setInput('');

    // Handle built-in terminal commands first
    const trimmedInput = currentInput.trim();

    // Handle 'clear' command
    if (trimmedInput === 'clear' || trimmedInput === 'cls') {
      setLines([{
        type: 'success',
        content: '✨ Terminal cleared',
        timestamp: new Date()
      }]);
      return;
    }

    // Execute command
    try {
      const output = await onCommand(currentInput);
      const isError = output.toLowerCase().includes('error') || output.toLowerCase().includes('fatal') || output.toLowerCase().includes('unknown command');
      const isSuccess = output.toLowerCase().includes('success') || output.includes('✓') || output.includes('✅');

      setLines(prev => [...prev, {
        type: isError ? 'error' : isSuccess ? 'success' : 'output',
        content: output,
        timestamp: new Date()
      }]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setLines(prev => [...prev, {
        type: 'error',
        content: `❌ Error: ${message}`,
        timestamp: new Date()
      }]);
    }
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
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setLines([{ 
        type: 'output', 
        content: 'Terminal cleared.',
        timestamp: new Date()
      }]);
    }
  };

  const copyToClipboard = async () => {
    const terminalText = lines.map(line => line.content).join('\n');
    try {
      await navigator.clipboard.writeText(terminalText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const command = e.dataTransfer.getData('command');
    if (command) {
      // Build the git command based on the card type
      let gitCommand = '';
      switch (command) {
        case 'commit':
          gitCommand = 'git commit -m "Update"';
          break;
        case 'add':
          gitCommand = 'git add .';
          break;
        case 'branch':
          gitCommand = 'git branch new-branch';
          break;
        case 'checkout':
          gitCommand = 'git checkout new-branch';
          break;
        case 'merge':
          gitCommand = 'git merge new-branch';
          break;
        default:
          gitCommand = `git ${command}`;
      }

      // Add to terminal as if typed
      setLines(prev => [...prev, {
        type: 'input',
        content: `$ ${gitCommand}`,
        timestamp: new Date()
      }]);

      setHistory(prev => [...prev, gitCommand]);

      // Execute the command
      try {
        const output = await onCommand(gitCommand);
        const isError = output.toLowerCase().includes('error') || output.toLowerCase().includes('fatal') || output.toLowerCase().includes('unknown command');
        const isSuccess = output.toLowerCase().includes('success') || output.includes('✓') || output.includes('✅');

        setLines(prev => [...prev, {
          type: isError ? 'error' : isSuccess ? 'success' : 'output',
          content: output,
          timestamp: new Date()
        }]);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        setLines(prev => [...prev, {
          type: 'error',
          content: `❌ Error: ${message}`,
          timestamp: new Date()
        }]);
      }
    }
  };

  const getLineStyle = (type: TerminalLine['type']) => {
    switch (type) {
      case 'input':
        return 'text-green-400 font-semibold';
      case 'error':
        return 'text-red-400';
      case 'success':
        return 'text-emerald-400';
      default:
        return 'text-gray-300';
    }
  };

  return (
    <div
      className={`bg-gray-950 rounded-xl overflow-hidden shadow-2xl border transition-all duration-300 ${
        isExpanded ? 'fixed inset-4 z-50' : ''
      } ${isDragOver ? 'border-green-400 border-4 ring-4 ring-green-400/50' : 'border-gray-700'}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-3">
          <TerminalIcon size={18} className="text-green-400" />
          <span className="text-gray-200 font-mono text-sm font-semibold">Terminal</span>
          <span className="text-xs text-gray-500">
            {lines.length} {lines.length === 1 ? 'line' : 'lines'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyToClipboard}
            className="p-1.5 hover:bg-gray-700 rounded transition-colors"
            aria-label="Copy terminal content"
            title="Copy terminal content"
          >
            {isCopied ? (
              <Check size={16} className="text-green-400" />
            ) : (
              <Copy size={16} className="text-gray-400" />
            )}
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 hover:bg-gray-700 rounded transition-colors"
            aria-label={isExpanded ? 'Minimize terminal' : 'Maximize terminal'}
            title={isExpanded ? 'Minimize' : 'Maximize'}
          >
            {isExpanded ? (
              <Minimize2 size={16} className="text-gray-400" />
            ) : (
              <Maximize2 size={16} className="text-gray-400" />
            )}
          </button>
        </div>
      </div>
      
      <div
        ref={outputRef}
        className={`p-4 overflow-y-auto font-mono text-sm cursor-text relative ${
          isExpanded ? 'h-[calc(100vh-8rem)]' : 'h-64'
        }`}
        onClick={() => inputRef.current?.focus()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.focus();
          }
        }}
        role="log"
        aria-live="polite"
        aria-label="Terminal output"
        tabIndex={0}
      >
        {/* Drag overlay */}
        {isDragOver && (
          <div className="absolute inset-0 bg-green-500/20 backdrop-blur-sm flex items-center justify-center z-10 pointer-events-none">
            <div className="text-green-300 text-2xl font-bold flex items-center gap-3 animate-pulse">
              <span className="text-4xl">🎯</span>
              Drop command here to execute!
            </div>
          </div>
        )}
        {lines.map((line, index) => (
          <div
            key={`line-${index}-${line.timestamp.getTime()}`}
            className={`${getLineStyle(line.type)} whitespace-pre-wrap break-words`}
          >
            {line.content}
          </div>
        ))}
        
        <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-2">
          <span className="text-green-400 animate-pulse">$</span>
          <label htmlFor="terminal-input" className="sr-only">
            Command input
          </label>
          <input
            id="terminal-input"
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-gray-300 outline-none caret-green-400"
            placeholder="Type a git command..."
            autoComplete="off"
            spellCheck="false"
            aria-label="Terminal command input"
          />
        </form>
      </div>
      
      {/* Terminal hints */}
      <div className="bg-gray-900/50 px-4 py-2 border-t border-gray-800 text-xs text-gray-500 font-mono flex items-center gap-4 flex-wrap">
        <span>💡 Tip: Use ↑/↓ for history</span>
        <span>•</span>
        <span>Type 'clear' to clear</span>
        <span>•</span>
        <span>Type 'help' for commands</span>
      </div>
    </div>
  );
}

