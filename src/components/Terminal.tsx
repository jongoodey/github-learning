import { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, HelpCircle } from 'lucide-react';

interface TerminalProps {
  onCommand: (command: string) => Promise<string>;
}

interface TerminalLine {
  type: 'input' | 'output' | 'error' | 'success';
  content: string;
}

// Initial terminal state - what the terminal looks like when cleared
const INITIAL_LINES: TerminalLine[] = [
  { type: 'success', content: '╔══════════════════════════════════════════════════════════╗' },
  { type: 'success', content: '║        Welcome to Git Learning Terminal! 🎮              ║' },
  { type: 'success', content: '╚══════════════════════════════════════════════════════════╝' },
  { type: 'output', content: 'Type "help" to see all available commands.' },
  { type: 'output', content: 'Try: git status, git log, ls, or any Unix/Git command!\n' },
];

// Command suggestions for autocomplete
const COMMAND_SUGGESTIONS = [
  'git status', 'git add', 'git commit -m', 'git branch', 'git checkout',
  'git log', 'git log --oneline', 'git merge', 'git stash', 'git stash list',
  'git stash pop', 'git stash apply', 'git push origin', 'git pull',
  'git remote', 'gh pr create --title', 'ls', 'cat', 'pwd', 'mkdir',
  'touch', 'echo', 'help', 'clear'
];

export function Terminal({ onCommand }: TerminalProps) {
  const [lines, setLines] = useState<TerminalLine[]>(INITIAL_LINES);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [lines]);

  // Update suggestions when input changes
  useEffect(() => {
    if (input.trim()) {
      const filtered = COMMAND_SUGGESTIONS.filter(cmd =>
        cmd.toLowerCase().startsWith(input.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 5));
      setSelectedSuggestion(0);
    } else {
      setSuggestions([]);
    }
  }, [input]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const trimmedInput = input.trim();

    // Handle built-in terminal commands first (before adding to lines)
    if (trimmedInput === 'clear' || trimmedInput === 'cls') {
      // Add the command to history but don't show it in output
      setHistory(prev => [...prev, trimmedInput]);
      setHistoryIndex(-1);
      setInput('');
      setSuggestions([]);

      // Clear terminal by resetting to initial state
      setLines(INITIAL_LINES);
      return;
    }

    // Add input to lines
    setLines(prev => [...prev, { type: 'input', content: `$ ${input}` }]);

    // Add to history
    setHistory(prev => [...prev, input]);
    setHistoryIndex(-1);
    setSuggestions([]);

    // Execute command
    try {
      const output = await onCommand(input);

      // Determine line type based on output
      const lineType: TerminalLine['type'] =
        output.includes('Error:') || output.includes('error:') ? 'error' :
        output.includes('✓') || output.includes('success') ? 'success' :
        'output';

      setLines(prev => [...prev, { type: lineType, content: output + '\n' }]);
    } catch (error: any) {
      setLines(prev => [...prev, { type: 'error', content: `Error: ${error.message}\n` }]);
    }

    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Tab for autocomplete
    if (e.key === 'Tab') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setInput(suggestions[selectedSuggestion]);
        setSuggestions([]);
      }
    }
    // Up/Down arrows for suggestion navigation
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setSelectedSuggestion(prev =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
      } else if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setSelectedSuggestion(prev =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
      } else if (historyIndex > 0) {
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
    <div className="bg-gray-950 rounded-lg overflow-hidden shadow-2xl border border-gray-800 relative">
      <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-2">
          <TerminalIcon size={16} className="text-green-400" />
          <span className="text-gray-300 font-mono text-sm">Interactive Terminal</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <HelpCircle size={12} />
          <span>Press Tab for autocomplete, ↑↓ for history</span>
        </div>
      </div>
      <div
        ref={outputRef}
        className="p-4 h-80 overflow-y-auto font-mono text-sm relative"
        onClick={() => inputRef.current?.focus()}
      >
        {lines.map((line, index) => (
          <div
            key={index}
            className={
              line.type === 'input' ? 'text-green-400 font-bold' :
              line.type === 'error' ? 'text-red-400' :
              line.type === 'success' ? 'text-green-300' :
              'text-gray-300'
            }
            style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
          >
            {line.content}
          </div>
        ))}

        {/* Autocomplete suggestions */}
        {suggestions.length > 0 && (
          <div className="absolute bg-gray-800 border border-gray-600 rounded mt-1 shadow-lg z-10">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className={`px-3 py-1 cursor-pointer ${
                  index === selectedSuggestion
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
                onClick={() => {
                  setInput(suggestion);
                  setSuggestions([]);
                  inputRef.current?.focus();
                }}
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-1">
          <span className="text-green-400">$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-gray-300 outline-none"
            autoFocus
            spellCheck={false}
            autoComplete="off"
          />
        </form>
      </div>
    </div>
  );
}

