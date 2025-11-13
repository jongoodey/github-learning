import { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, HelpCircle } from 'lucide-react';

interface TerminalProps {
  onCommand: (command: string) => Promise<string>;
  autofillCommand?: string;
  onAutofillUsed?: () => void;
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

export function Terminal({ onCommand, autofillCommand, onAutofillUsed }: TerminalProps) {
  const [lines, setLines] = useState<TerminalLine[]>(INITIAL_LINES);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const [lastHistoryInput, setLastHistoryInput] = useState(''); // Store input from history for comparison
  const [shouldSelectAll, setShouldSelectAll] = useState(false); // Flag to select all text after history navigation
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [lines]);

  // Select all text when shouldSelectAll is true (after history navigation)
  useEffect(() => {
    if (shouldSelectAll && inputRef.current) {
      inputRef.current.select();
      setShouldSelectAll(false);
    }
  }, [shouldSelectAll, input]);

  // Handle autofill from command cards
  useEffect(() => {
    if (autofillCommand && autofillCommand.trim()) {
      // Directly set the input value - React will handle the update
      setInput(autofillCommand);
      setHistoryIndex(-1);
      setLastHistoryInput(autofillCommand);
      inputRef.current?.focus();
      // Call onAutofillUsed after input is set
      onAutofillUsed?.();
    }
  }, [autofillCommand, onAutofillUsed]);

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
    // Enter key - autocomplete if suggestions are visible
    if (e.key === 'Enter' && suggestions.length > 0) {
      e.preventDefault();
      const newInput = suggestions[selectedSuggestion];
      setInput(newInput);
      setLastHistoryInput(newInput);
      setSuggestions([]);
      // Don't submit the form, just autocomplete
      return;
    }
    // Tab for autocomplete
    if (e.key === 'Tab') {
      e.preventDefault();
      if (suggestions.length > 0) {
        const newInput = suggestions[selectedSuggestion];
        setInput(newInput);
        setLastHistoryInput(newInput);
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
        const historyInput = history[history.length - 1 - newIndex];
        setHistoryIndex(newIndex);
        // Directly set the new input value - React will handle the update
        setInput(historyInput);
        setLastHistoryInput(historyInput);
        setShouldSelectAll(true);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setSelectedSuggestion(prev =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
      } else if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        const historyInput = history[history.length - 1 - newIndex];
        setHistoryIndex(newIndex);
        // Directly set the new input value - React will handle the update
        setInput(historyInput);
        setLastHistoryInput(historyInput);
        setShouldSelectAll(true);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
        setLastHistoryInput('');
      }
    }
  };

  // Reset history index when user manually types (not from history navigation)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // If user is typing and we're in history navigation mode, clear history index
    if (historyIndex >= 0 && newValue !== lastHistoryInput) {
      setHistoryIndex(-1);
      setLastHistoryInput('');
    }
    
    setInput(newValue);
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
          <span>Press Tab or Enter for autocomplete, ↑↓ for history</span>
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

        <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-1 relative">
          <span className="text-green-400">$</span>
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent text-gray-300 outline-none"
              autoFocus
              spellCheck={false}
              autoComplete="off"
            />
            {/* Autocomplete suggestions - positioned below input */}
            {suggestions.length > 0 && (
              <div 
                className="absolute bg-gray-800 border border-gray-600 rounded mt-1 shadow-lg z-50"
                style={{ top: '100%', left: 0, minWidth: '200px', maxWidth: '100%' }}
              >
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className={`px-3 py-1 cursor-pointer transition-colors ${
                      index === selectedSuggestion
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setInput(suggestion);
                      setLastHistoryInput(suggestion);
                      setSuggestions([]);
                      inputRef.current?.focus();
                    }}
                    onMouseDown={(e) => {
                      // Prevent form submission when clicking suggestion
                      e.preventDefault();
                    }}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

