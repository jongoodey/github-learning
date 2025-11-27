import { useEffect, useState, useCallback } from 'react';
import { GitGraph } from './components/GitGraph';
// import { GitGraphP5 } from './components/GitGraphP5'; // Temporarily disabled due to dependency issues
import { FileTree } from './components/FileTree';
import { Terminal } from './components/Terminal';
import { CommandCard } from './components/CommandCard';
import { useGameStore } from './store/gameStore';
import { levels } from './data/levels';
import { ChevronLeft, ChevronRight, Trophy, Info, PartyPopper, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

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
  const [terminalAutofill, setTerminalAutofill] = useState('');
  const [showCourseComplete, setShowCourseComplete] = useState(false);
  const [hasShownCelebration, setHasShownCelebration] = useState(false);

  const level = levels[currentLevel];

  // Check if all levels are completed
  const allLevelsComplete = completedLevels.size === levels.length;

  // Trigger confetti celebration
  const triggerCelebration = useCallback(() => {
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      // Confetti from both sides
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#FFD700', '#FFA500', '#FF6347', '#7B68EE', '#00CED1', '#32CD32'],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#FFD700', '#FFA500', '#FF6347', '#7B68EE', '#00CED1', '#32CD32'],
      });
    }, 250);
  }, []);

  useEffect(() => {
    setCurrentLevel(0);
  }, [setCurrentLevel]);

  // Show celebration when all levels are complete
  useEffect(() => {
    if (allLevelsComplete && !hasShownCelebration) {
      setShowCourseComplete(true);
      setHasShownCelebration(true);
      triggerCelebration();
    }
  }, [allLevelsComplete, hasShownCelebration, triggerCelebration]);

  // Also trigger celebration when completing the last level
  useEffect(() => {
    if (isLevelComplete && currentLevel === levels.length - 1 && !hasShownCelebration) {
      setShowCourseComplete(true);
      setHasShownCelebration(true);
      triggerCelebration();
    }
  }, [isLevelComplete, currentLevel, hasShownCelebration, triggerCelebration]);

  const handleCardClick = (command: string) => {
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
      case 'merge':
        cmd = 'git merge ';
        break;
      case 'status':
        cmd = 'git status';
        break;
      case 'log':
        cmd = 'git log';
        break;
      case 'push':
        cmd = 'git push origin main';
        break;
      case 'stash':
        cmd = 'git stash';
        break;
      case 'remote':
        cmd = 'git remote';
        break;
      default:
        cmd = `git ${command}`;
    }
    
    if (cmd) {
      setTerminalAutofill(cmd);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 p-6">
      {/* Course Complete Modal */}
      {showCourseComplete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-gradient-to-br from-yellow-900/90 via-purple-900/90 to-blue-900/90 rounded-2xl p-8 max-w-lg mx-4 border-2 border-yellow-500/50 shadow-2xl animate-bounce-in">
            <div className="text-center">
              <div className="flex justify-center gap-2 mb-4">
                <PartyPopper className="text-yellow-400 animate-bounce" size={48} />
                <Sparkles className="text-purple-400 animate-pulse" size={48} />
                <PartyPopper className="text-yellow-400 animate-bounce" size={48} style={{ animationDelay: '0.2s' }} />
              </div>
              <h2 className="text-4xl font-bold text-white mb-4">
                🎉 Congratulations! 🎉
              </h2>
              <p className="text-xl text-yellow-300 mb-6">
                You've completed the entire Git Learning Course!
              </p>
              <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
                <p className="text-gray-300 mb-2">You've mastered:</p>
                <ul className="text-left text-green-400 space-y-1">
                  <li>✓ Creating and managing commits</li>
                  <li>✓ Working with files</li>
                  <li>✓ Branching and merging</li>
                  <li>✓ Stashing changes</li>
                  <li>✓ Working with remotes</li>
                  <li>✓ Creating Pull Requests</li>
                  <li>✓ Complete Git workflow</li>
                </ul>
              </div>
              <p className="text-gray-400 mb-6">
                You're now ready to use Git like a pro! Keep practicing in the sandbox mode.
              </p>
              <button
                onClick={() => setShowCourseComplete(false)}
                className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 
                         text-gray-900 font-bold rounded-lg transition-all transform hover:scale-105 shadow-lg"
              >
                Continue Exploring
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <header className="mb-6 relative z-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                <span className="text-5xl">🎮</span>
                Git Learning Game
              </h1>
              <div className="text-yellow-400 text-sm font-mono bg-yellow-900/30 px-3 py-1 rounded-full flex items-center gap-2">
                Level {currentLevel + 1} of {levels.length}
                {allLevelsComplete && <Trophy className="text-yellow-400" size={16} />}
              </div>
              {/* Progress bar */}
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500"
                    style={{ width: `${(completedLevels.size / levels.length) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400">{completedLevels.size}/{levels.length}</span>
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
                disabled={currentLevel === levels.length - 1 || !isLevelComplete}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-800 disabled:opacity-50 
                         text-white rounded-lg flex items-center gap-2 transition-colors"
                title={!isLevelComplete ? "Complete this level first!" : ""}
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
          {/* Left Column - Terminal & Visualization */}
          <div className="xl:col-span-2 space-y-6">
            {/* Command Cards */}
            {level.cards && level.cards.length > 0 && (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                  <span className="text-2xl">🎴</span>
                  Available Commands
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  Click on these command cards to add them to the terminal below. You can then modify or execute them as needed.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
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

            <Terminal 
              onCommand={executeCommand} 
              autofillCommand={terminalAutofill}
              onAutofillUsed={() => setTerminalAutofill('')}
            />

            <div className="relative">
              {/* Temporarily disabled toggle button due to P5 dependency issues */}
              {/* <button
                onClick={() => setUseP5Visualization(!useP5Visualization)}
                className="absolute top-4 right-4 z-10 px-3 py-1 bg-purple-600 hover:bg-purple-700
                         text-white rounded-lg flex items-center gap-2 text-sm transition-colors shadow-lg"
                title={useP5Visualization ? "Switch to D3 visualization" : "Switch to interactive p5.js visualization"}
              >
                <Sparkles size={14} />
                {useP5Visualization ? 'D3 Mode' : 'Interactive Mode'}
              </button> */}

              <GitGraph commits={commits} refs={refs} />
            </div>
          </div>

          {/* Right Column - File Tree */}
          <div className="space-y-6">
            <FileTree tree={fileTree} />
            
            {/* Progress */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                Progress
                {allLevelsComplete && (
                  <span className="text-xs bg-gradient-to-r from-yellow-500 to-orange-500 text-gray-900 px-2 py-0.5 rounded-full font-bold animate-pulse">
                    COMPLETE!
                  </span>
                )}
              </h3>
              <div className="space-y-2">
                {levels.map((lvl, idx) => (
                  <button
                    key={idx}
                    onClick={() => completedLevels.has(idx) || idx <= currentLevel ? setCurrentLevel(idx) : null}
                    disabled={!completedLevels.has(idx) && idx > currentLevel}
                    className={`flex items-center justify-between p-2 rounded w-full text-left transition-all duration-300 ${
                      idx === currentLevel
                        ? 'bg-purple-600 ring-2 ring-purple-400 ring-offset-1 ring-offset-gray-900'
                        : completedLevels.has(idx)
                        ? 'bg-green-900/30 hover:bg-green-900/50 cursor-pointer'
                        : 'bg-gray-700/30 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        completedLevels.has(idx)
                          ? 'bg-green-500 text-white'
                          : idx === currentLevel
                          ? 'bg-purple-400 text-white'
                          : 'bg-gray-600 text-gray-400'
                      }`}>
                        {completedLevels.has(idx) ? '✓' : idx + 1}
                      </span>
                      <span className={`text-sm ${
                        completedLevels.has(idx) ? 'text-green-300' : 'text-gray-200'
                      }`}>
                        {lvl.title}
                      </span>
                    </div>
                    {completedLevels.has(idx) && (
                      <Trophy className="text-yellow-400 animate-bounce-subtle" size={16} />
                    )}
                  </button>
                ))}
              </div>
              
              {/* Final celebration indicator */}
              {allLevelsComplete && (
                <div className="mt-4 p-3 bg-gradient-to-r from-yellow-900/30 to-orange-900/30 rounded-lg border border-yellow-500/30">
                  <div className="flex items-center gap-2 text-yellow-400">
                    <PartyPopper size={20} />
                    <span className="text-sm font-bold">Course Completed!</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Click any level to revisit or continue in sandbox mode.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
