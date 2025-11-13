import { useEffect, useState } from 'react';
import { GitGraph } from './components/GitGraph';
import { GitGraphP5 } from './components/GitGraphP5';
import { FileTree } from './components/FileTree';
import { Terminal } from './components/Terminal';
import { CommandCard } from './components/CommandCard';
import { useGameStore } from './store/gameStore';
import { levels } from './data/levels';
import { ChevronLeft, ChevronRight, Trophy, Info, Sparkles } from 'lucide-react';

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
  const [useP5Visualization, setUseP5Visualization] = useState(true);

  const level = levels[currentLevel];

  useEffect(() => {
    setCurrentLevel(0);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 p-6">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                <span className="text-5xl">🎮</span>
                Git Learning Game
              </h1>
              <div className="text-yellow-400 text-sm font-mono bg-yellow-900/30 px-3 py-1 rounded-full">
                Level {currentLevel + 1} of {levels.length}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={previousLevel}
                disabled={currentLevel === 0}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 
                         text-white rounded-lg flex items-center gap-2 transition-colors"
              >
                <ChevronLeft size={20} />
                Previous
              </button>
              <button
                onClick={nextLevel}
                disabled={currentLevel === levels.length - 1}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-800 disabled:opacity-50 
                         text-white rounded-lg flex items-center gap-2 transition-colors"
              >
                Next
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Level Info */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                {level.title}
                {completedLevels.has(currentLevel) && (
                  <Trophy className="text-yellow-400" size={24} />
                )}
              </h2>
              <button
                onClick={() => setShowInfo(!showInfo)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Info size={20} />
              </button>
            </div>

            {showInfo && (
              <>
                <p className="text-gray-300 mb-4 whitespace-pre-line">{level.description}</p>
                {level.cli && (
                  <div className="bg-gray-900/50 rounded-lg p-4 border-l-4 border-blue-500">
                    <p className="text-gray-400 text-sm whitespace-pre-line">{level.cli}</p>
      </div>
                )}
              </>
            )}

            {isLevelComplete && (
              <div className="mt-4 bg-green-900/30 border border-green-500 rounded-lg p-4">
                <p className="text-green-300 font-bold flex items-center gap-2">
                  <Trophy size={20} />
                  Level Complete!
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
            <div className="relative">
              <button
                onClick={() => setUseP5Visualization(!useP5Visualization)}
                className="absolute top-4 right-4 z-10 px-3 py-1 bg-purple-600 hover:bg-purple-700
                         text-white rounded-lg flex items-center gap-2 text-sm transition-colors shadow-lg"
                title={useP5Visualization ? "Switch to D3 visualization" : "Switch to interactive p5.js visualization"}
              >
                <Sparkles size={14} />
                {useP5Visualization ? 'D3 Mode' : 'Interactive Mode'}
              </button>

              {useP5Visualization ? (
                <GitGraphP5 commits={commits} refs={refs} />
              ) : (
                <GitGraph commits={commits} refs={refs} />
              )}
            </div>
            
            {/* Command Cards */}
            {level.cards && level.cards.length > 0 && (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                  <span className="text-2xl">🎴</span>
                  Available Commands
                </h3>
                <div className="flex flex-wrap gap-4">
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
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <h3 className="text-white font-bold mb-4">Progress</h3>
              <div className="space-y-2">
                {levels.map((lvl, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-2 rounded ${
                      idx === currentLevel
                        ? 'bg-purple-600'
                        : completedLevels.has(idx)
                        ? 'bg-green-900/30'
                        : 'bg-gray-700/30'
                    }`}
                  >
                    <span className="text-gray-200 text-sm">{lvl.title}</span>
                    {completedLevels.has(idx) && (
                      <Trophy className="text-yellow-400" size={16} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
