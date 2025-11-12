import { useEffect, useState } from 'react';
import { GitGraph } from './components/GitGraph';
import { FileTree } from './components/FileTree';
import { Terminal } from './components/Terminal';
import { CommandCard } from './components/CommandCard';
import { useGameStore } from './store/gameStore';
import { levels } from './data/levels';
import { ChevronLeft, ChevronRight, Trophy, Info, Award, Zap, HelpCircle } from 'lucide-react';

function App() {
  const {
    currentLevel,
    completedLevels,
    commits,
    refs,
    fileTree,
    isLevelComplete,
    setCurrentLevel,
    nextLevel,
    previousLevel,
    executeCommand,
  } = useGameStore();

  const [showInfo, setShowInfo] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);

  const level = levels[currentLevel];

  useEffect(() => {
    // Initialize the first level
    const init = async () => {
      await setCurrentLevel(0);
    };
    init();
  }, [setCurrentLevel]);

  const handleCardClick = async (command: string) => {
    let cmd = '';
    switch (command) {
      case 'commit':
        cmd = 'git commit -m "Update"';
        break;
      case 'add':
        const files = fileTree.children?.map(c => c.name) || [];
        if (files.length > 0) {
          cmd = `git add ${files[0]}`;
        } else {
          cmd = 'git add .';
        }
        break;
      case 'branch':
        cmd = 'git branch new-branch';
        break;
      case 'checkout':
        cmd = 'git checkout new-branch';
        break;
      default:
        cmd = `git ${command}`;
    }
    
    if (cmd) {
      await executeCommand(cmd);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 p-6" role="main">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                <span className="text-5xl" role="img" aria-label="Game controller">🎮</span>
                Git Learning Game
              </h1>
              <div className="text-yellow-400 text-sm font-mono bg-yellow-900/30 px-3 py-1 rounded-full flex items-center gap-2">
                <Zap size={14} />
                Level {currentLevel + 1} of {levels.length}
              </div>
              {completedLevels.size > 0 && (
                <div className="text-green-400 text-sm font-mono bg-green-900/30 px-3 py-1 rounded-full flex items-center gap-2">
                  <Award size={14} />
                  {completedLevels.size} completed
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowTutorial(true)}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                aria-label="Show tutorial"
              >
                <HelpCircle size={20} />
                Help
              </button>
              <button
                onClick={previousLevel}
                disabled={currentLevel === 0}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 
                         text-white rounded-lg flex items-center gap-2 transition-all
                         disabled:cursor-not-allowed"
                aria-label="Go to previous level"
              >
                <ChevronLeft size={20} />
                Previous
              </button>
              <button
                onClick={nextLevel}
                disabled={currentLevel === levels.length - 1}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-800 disabled:opacity-50 
                         text-white rounded-lg flex items-center gap-2 transition-all
                         disabled:cursor-not-allowed"
                aria-label="Go to next level"
              >
                Next
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Level Info */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                {level.title}
                {completedLevels.has(currentLevel) && (
                  <Trophy className="text-yellow-400 animate-bounce" size={24} aria-label="Level completed" />
                )}
              </h2>
              <button
                onClick={() => setShowInfo(!showInfo)}
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg"
                aria-label={showInfo ? 'Hide level information' : 'Show level information'}
                aria-expanded={showInfo}
              >
                <Info size={20} />
              </button>
            </div>

            {showInfo && (
              <>
                <p className="text-gray-300 mb-4 whitespace-pre-line text-lg leading-relaxed">{level.description}</p>
                {level.cli && (
                  <div className="bg-gray-900/50 rounded-lg p-4 border-l-4 border-blue-500">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-blue-400 text-sm font-semibold">💻 CLI Tip</span>
                    </div>
                    <p className="text-gray-400 text-sm whitespace-pre-line">{level.cli}</p>
                  </div>
                )}
              </>
            )}

            {isLevelComplete && (
              <div className="mt-4 bg-green-900/30 border-2 border-green-500 rounded-xl p-4 animate-pulse">
                <p className="text-green-300 font-bold flex items-center gap-2 text-lg">
                  <Trophy size={24} className="animate-bounce" />
                  🎉 Level Complete!
                </p>
                <p className="text-green-200 mt-2">{level.congrats}</p>
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column - Visualization */}
          <div className="xl:col-span-2 space-y-6">
            <GitGraph commits={commits} refs={refs} />
            
            {/* Command Cards */}
            {level.cards && level.cards.length > 0 && (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 shadow-xl">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                  <span className="text-2xl" role="img" aria-label="Cards">🎴</span>
                  Available Commands
                  <span className="text-xs text-gray-400 font-normal ml-2">(click or drag to use)</span>
                </h3>
                <div className="flex flex-wrap gap-4" role="toolbar" aria-label="Git commands">
                  {level.cards.map(card => (
                    <CommandCard
                      key={card}
                      command={card}
                      description=""
                      onClick={() => handleCardClick(card)}
                    />
                  ))}
                </div>
              </div>
            )}

            <Terminal onCommand={executeCommand} />
          </div>

          {/* Right Column - File Tree */}
          <div className="space-y-6">
            <FileTree tree={fileTree} />
            
            {/* Progress */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 shadow-xl">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                📊 Progress
                <span className="text-xs text-gray-400 font-normal">
                  {completedLevels.size}/{levels.length}
                </span>
              </h3>
              <div className="space-y-2" role="list" aria-label="Level progress">
                {levels.map((lvl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentLevel(idx)}
                    disabled={idx === currentLevel}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                      idx === currentLevel
                        ? 'bg-purple-600 cursor-default ring-2 ring-purple-400'
                        : completedLevels.has(idx)
                        ? 'bg-green-900/30 hover:bg-green-900/50 cursor-pointer'
                        : 'bg-gray-700/30 hover:bg-gray-700/50 cursor-pointer'
                    }`}
                    role="listitem"
                    aria-label={`Level ${idx + 1}: ${lvl.title}${completedLevels.has(idx) ? ' - completed' : ''}${idx === currentLevel ? ' - current' : ''}`}
                  >
                    <span className={`text-sm ${idx === currentLevel ? 'text-white font-bold' : 'text-gray-200'}`}>
                      {idx + 1}. {lvl.title}
                    </span>
                    {completedLevels.has(idx) && (
                      <Trophy className="text-yellow-400" size={16} aria-label="Completed" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tutorial Modal */}
        {showTutorial && (
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowTutorial(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="tutorial-title"
          >
            <div 
              className="bg-gray-800 rounded-xl p-8 max-w-2xl w-full shadow-2xl border border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 id="tutorial-title" className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                <HelpCircle size={32} className="text-blue-400" />
                How to Play
              </h2>
              
              <div className="space-y-6 text-gray-300">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    🎴 Command Cards
                  </h3>
                  <p className="text-gray-300">
                    Click on command cards to execute Git commands. You can also drag them for future features!
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    💻 Terminal
                  </h3>
                  <p className="text-gray-300">
                    Type Git commands directly into the terminal for a more authentic experience. 
                    Use ↑/↓ arrows to navigate command history. Press Ctrl+L to clear.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    🌳 Git Graph
                  </h3>
                  <p className="text-gray-300">
                    Watch commits appear in real-time with physics-based animations. 
                    Drag nodes to rearrange them. Hover over commits to see details.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    📁 File Browser
                  </h3>
                  <p className="text-gray-300">
                    View your working directory and see files as you create them.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    ♿ Accessibility
                  </h3>
                  <p className="text-gray-300">
                    Keyboard navigation supported throughout. Use Tab to navigate, Enter/Space to activate buttons.
                    Screen reader compatible.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowTutorial(false)}
                className="mt-8 w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors"
                aria-label="Close tutorial"
              >
                Got it! Let's Play 🚀
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
