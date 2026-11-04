import { useState, useEffect, useRef, useCallback } from 'react';

type GameState = 'waiting' | 'flying' | 'crashed';

interface GameHistory {
  id: number;
  multiplier: number;
}

function generateCrashPoint(): number {
  const e = 2 ** 32;
  const h = Math.floor(Math.random() * e);
  if (h % 33 === 0) return 1.0;
  return Math.max(1.0, Math.floor((100 * e - h) / (e - h)) / 100);
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>('waiting');
  const [multiplier, setMultiplier] = useState(1.0);
  const [betAmount, setBetAmount] = useState(10);
  const [balance, setBalance] = useState(1000);
  const [hasBet, setHasBet] = useState(false);
  const [hasCashedOut, setHasCashedOut] = useState(false);
  const [cashOutMultiplier, setCashOutMultiplier] = useState(0);
  const [history, setHistory] = useState<GameHistory[]>([]);
  const [countdown, setCountdown] = useState(5);
  const [elephantY, setElephantY] = useState(0);
  const [showWin, setShowWin] = useState(false);

  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const crashPointRef = useRef<number>(2.0);
  const historyIdRef = useRef<number>(0);
  const gameStateRef = useRef<GameState>('waiting');
  const hasBetRef = useRef(false);
  const hasCashedOutRef = useRef(false);
  const betAmountRef = useRef(10);
  const multiplierRef = useRef(1.0);

  // Keep refs in sync
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { hasBetRef.current = hasBet; }, [hasBet]);
  useEffect(() => { hasCashedOutRef.current = hasCashedOut; }, [hasCashedOut]);
  useEffect(() => { betAmountRef.current = betAmount; }, [betAmount]);
  useEffect(() => { multiplierRef.current = multiplier; }, [multiplier]);

  const startFlying = useCallback(() => {
    setGameState('flying');
    crashPointRef.current = generateCrashPoint();
    startTimeRef.current = Date.now();

    const animate = () => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const currentMultiplier = Math.pow(Math.E, 0.07 * elapsed);

      if (currentMultiplier >= crashPointRef.current) {
        setMultiplier(crashPointRef.current);
        setGameState('crashed');
        setElephantY(0);

        historyIdRef.current++;
        setHistory(prev => [{
          id: historyIdRef.current,
          multiplier: crashPointRef.current,
        }, ...prev].slice(0, 20));

        setTimeout(() => {
          setHasBet(false);
          startCountdown();
        }, 3000);
        return;
      }

      setMultiplier(currentMultiplier);
      setElephantY(Math.min(elapsed * 12, 280));
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
  }, []);

  const startCountdown = useCallback(() => {
    setCountdown(5);
    setGameState('waiting');
    setMultiplier(1.0);
    setHasCashedOut(false);
    setCashOutMultiplier(0);
    setElephantY(0);
    setShowWin(false);

    let count = 5;
    const interval = setInterval(() => {
      count--;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(interval);
        startFlying();
      }
    }, 1000);
  }, [startFlying]);

  useEffect(() => {
    startCountdown();
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [startCountdown]);

  const placeBet = () => {
    if (gameState !== 'waiting' || hasBet) return;
    if (betAmount > balance || betAmount <= 0) return;
    setBalance(prev => prev - betAmount);
    setHasBet(true);
  };

  const cashOut = () => {
    if (gameState !== 'flying' || !hasBet || hasCashedOut) return;
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    setHasCashedOut(true);
    setCashOutMultiplier(multiplierRef.current);
    const winnings = betAmountRef.current * multiplierRef.current;
    setBalance(prev => prev + winnings);
    setShowWin(true);
  };

  const getMultiplierColor = () => {
    if (gameState === 'crashed') return 'text-red-500';
    if (multiplier < 2) return 'text-blue-400';
    if (multiplier < 5) return 'text-green-400';
    if (multiplier < 10) return 'text-yellow-400';
    return 'text-purple-400';
  };

  const getMultiplierBgGlow = () => {
    if (gameState === 'crashed') return 'drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]';
    if (multiplier < 2) return 'drop-shadow-[0_0_20px_rgba(96,165,250,0.5)]';
    if (multiplier < 5) return 'drop-shadow-[0_0_20px_rgba(74,222,128,0.5)]';
    if (multiplier < 10) return 'drop-shadow-[0_0_20px_rgba(250,204,21,0.5)]';
    return 'drop-shadow-[0_0_20px_rgba(192,132,252,0.5)]';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-indigo-950 to-gray-900 text-white font-sans">
      {/* Header */}
      <header className="border-b border-indigo-800/50 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🐘</span>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Elephant Aviator
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-gray-800 rounded-xl px-4 py-2 border border-indigo-700/50">
              <span className="text-gray-400 text-xs block">Balance</span>
              <p className="text-green-400 font-bold text-lg">${balance.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Game History Bar */}
        <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          <span className="text-gray-400 text-sm whitespace-nowrap font-medium">History:</span>
          {history.map((h) => (
            <span
              key={h.id}
              className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold whitespace-nowrap border ${
                h.multiplier < 2 ? 'bg-red-900/30 text-red-400 border-red-800/50' :
                h.multiplier < 5 ? 'bg-green-900/30 text-green-400 border-green-800/50' :
                'bg-purple-900/30 text-purple-400 border-purple-800/50'
              }`}
            >
              {h.multiplier.toFixed(2)}x
            </span>
          ))}
          {history.length === 0 && <span className="text-gray-500 text-sm italic">No games yet...</span>}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Game Area */}
          <div className="lg:col-span-2">
            <div className="relative bg-gradient-to-b from-gray-800/80 to-gray-900/80 rounded-2xl border border-indigo-800/30 overflow-hidden h-[480px] flex flex-col items-center justify-center">
              {/* Background stars */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {Array.from({ length: 40 }, (_, i) => (
                  <div
                    key={i}
                    className="absolute rounded-full bg-white animate-pulse"
                    style={{
                      width: `${Math.random() * 2 + 1}px`,
                      height: `${Math.random() * 2 + 1}px`,
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 3}s`,
                      animationDuration: `${Math.random() * 2 + 2}s`,
                      opacity: Math.random() * 0.6 + 0.2,
                    }}
                  />
                ))}
              </div>

              {/* Gradient floor */}
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-indigo-900/30 to-transparent" />

              {/* Game State Display */}
              {gameState === 'waiting' && (
                <div className="text-center z-10 animate-float">
                  <div className="text-7xl mb-6">🐘</div>
                  <p className="text-xl text-gray-300 mb-3">Next round starting in...</p>
                  <div className="relative inline-block">
                    <p className="text-6xl font-bold text-indigo-400">{countdown}</p>
                    <div className="absolute -inset-4 bg-indigo-500/10 rounded-full blur-xl" />
                  </div>
                  {hasBet && (
                    <div className="mt-6 bg-green-900/30 border border-green-700/50 rounded-xl px-6 py-3 inline-block">
                      <p className="text-green-400 font-medium">✓ Bet placed: ${betAmount.toFixed(2)}</p>
                    </div>
                  )}
                </div>
              )}

              {gameState === 'flying' && (
                <div className="text-center z-10">
                  {/* Flying elephant */}
                  <div
                    className="text-7xl mb-6 transition-all duration-100"
                    style={{
                      transform: `translateY(-${elephantY}px) rotate(-${Math.min(elephantY / 15, 15)}deg)`,
                    }}
                  >
                    🐘
                  </div>

                  {/* Trail effect */}
                  {elephantY > 30 && (
                    <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: `${100 + elephantY * 0.3}px` }}>
                      <div
                        className="w-1 bg-gradient-to-t from-transparent via-indigo-500/40 to-indigo-400/60 rounded-full"
                        style={{ height: `${Math.min(elephantY * 0.8, 150)}px` }}
                      />
                    </div>
                  )}

                  {/* Multiplier */}
                  <p className={`text-7xl font-black ${getMultiplierColor()} ${getMultiplierBgGlow()} transition-colors duration-200`}>
                    {multiplier.toFixed(2)}x
                  </p>

                  {hasCashedOut && showWin && (
                    <div className="mt-6 bg-green-900/50 border border-green-500/50 rounded-xl px-8 py-4 inline-block animate-bounce">
                      <p className="text-green-400 font-bold text-xl">
                        💰 Cashed out at {cashOutMultiplier.toFixed(2)}x!
                      </p>
                      <p className="text-green-300 text-lg mt-1">
                        Won: ${(betAmount * cashOutMultiplier).toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {gameState === 'crashed' && (
                <div className="text-center z-10">
                  <div className="text-7xl mb-6 animate-shake">💥🐘</div>
                  <p className="text-5xl font-black text-red-500 mb-3 drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]">
                    CRASHED!
                  </p>
                  <p className={`text-4xl font-bold ${getMultiplierColor()}`}>
                    {multiplier.toFixed(2)}x
                  </p>

                  {hasBet && !hasCashedOut && (
                    <div className="mt-6 bg-red-900/40 border border-red-500/50 rounded-xl px-8 py-4 inline-block">
                      <p className="text-red-400 font-bold text-lg">You lost: -${betAmount.toFixed(2)}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Betting Panel */}
          <div className="space-y-4">
            {/* Bet Controls */}
            <div className="bg-gray-800/60 rounded-2xl border border-indigo-800/30 p-6 backdrop-blur-sm">
              <h3 className="text-lg font-bold text-gray-200 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                Place Your Bet
              </h3>

              <div className="mb-4">
                <label className="text-sm text-gray-400 mb-2 block font-medium">Bet Amount</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setBetAmount(prev => Math.max(1, Math.floor(prev / 2)))}
                    className="bg-gray-700 hover:bg-gray-600 px-3 py-2.5 rounded-lg text-sm font-bold transition-colors border border-gray-600"
                  >
                    ½
                  </button>
                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(Math.max(0, Number(e.target.value)))}
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-center text-lg font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    disabled={hasBet || gameState === 'flying'}
                  />
                  <button
                    onClick={() => setBetAmount(prev => Math.min(balance, prev * 2))}
                    className="bg-gray-700 hover:bg-gray-600 px-3 py-2.5 rounded-lg text-sm font-bold transition-colors border border-gray-600"
                  >
                    2×
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-5">
                {[5, 10, 25, 50].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setBetAmount(amount)}
                    disabled={hasBet || gameState === 'flying'}
                    className="bg-gray-700 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-gray-700 px-2 py-2.5 rounded-lg text-sm font-bold transition-all border border-gray-600 hover:border-indigo-500"
                  >
                    ${amount}
                  </button>
                ))}
              </div>

              {/* Action Button */}
              {gameState === 'waiting' && !hasBet && (
                <button
                  onClick={placeBet}
                  disabled={betAmount > balance || betAmount <= 0}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-green-900/30"
                >
                  Place Bet (${betAmount.toFixed(2)})
                </button>
              )}

              {gameState === 'waiting' && hasBet && (
                <div className="w-full bg-green-900/30 border border-green-700/50 text-green-400 font-bold py-4 rounded-xl text-lg text-center">
                  ✓ Bet Placed — Waiting...
                </div>
              )}

              {gameState === 'flying' && hasBet && !hasCashedOut && (
                <button
                  onClick={cashOut}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white font-bold py-4 rounded-xl text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-orange-900/30 animate-pulse"
                >
                  💰 Cash Out (${(betAmount * multiplier).toFixed(2)})
                </button>
              )}

              {gameState === 'flying' && hasBet && hasCashedOut && (
                <div className="w-full bg-green-900/30 border border-green-700/50 text-green-400 font-bold py-4 rounded-xl text-lg text-center">
                  ✓ Won ${(betAmount * cashOutMultiplier).toFixed(2)}!
                </div>
              )}

              {gameState === 'flying' && !hasBet && (
                <div className="w-full bg-gray-700/50 border border-gray-600/50 text-gray-400 font-bold py-4 rounded-xl text-lg text-center">
                  ⏳ Next round...
                </div>
              )}

              {gameState === 'crashed' && (
                <div className="w-full bg-red-900/20 border border-red-700/30 text-red-400 font-bold py-4 rounded-xl text-lg text-center">
                  💥 Crashed! Next round soon...
                </div>
              )}
            </div>

            {/* How to Play */}
            <div className="bg-gray-800/60 rounded-2xl border border-indigo-800/30 p-6 backdrop-blur-sm">
              <h3 className="text-lg font-bold text-gray-200 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                How to Play
              </h3>
              <div className="space-y-3 text-sm text-gray-400">
                <div className="flex items-start gap-3">
                  <span className="bg-indigo-900/60 text-indigo-400 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border border-indigo-700/50">1</span>
                  <p>Place your bet during the waiting phase</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-indigo-900/60 text-indigo-400 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border border-indigo-700/50">2</span>
                  <p>Watch the elephant fly and the multiplier increase</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-indigo-900/60 text-indigo-400 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border border-indigo-700/50">3</span>
                  <p>Cash out before the elephant crashes to win!</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-indigo-900/60 text-indigo-400 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border border-indigo-700/50">4</span>
                  <p>Higher multiplier = bigger wins, but more risk!</p>
                </div>
              </div>
            </div>

            {/* Session Stats */}
            <div className="bg-gray-800/60 rounded-2xl border border-indigo-800/30 p-6 backdrop-blur-sm">
              <h3 className="text-lg font-bold text-gray-200 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Session Stats
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-700/50 rounded-xl p-3 text-center border border-gray-600/30">
                  <p className="text-gray-400 text-xs mb-1">Games</p>
                  <p className="text-2xl font-bold text-indigo-400">{history.length}</p>
                </div>
                <div className="bg-gray-700/50 rounded-xl p-3 text-center border border-gray-600/30">
                  <p className="text-gray-400 text-xs mb-1">Best</p>
                  <p className="text-2xl font-bold text-purple-400">
                    {history.length > 0 ? Math.max(...history.map(h => h.multiplier)).toFixed(2) : '—'}x
                  </p>
                </div>
                <div className="bg-gray-700/50 rounded-xl p-3 text-center border border-gray-600/30">
                  <p className="text-gray-400 text-xs mb-1">Avg</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {history.length > 0 ? (history.reduce((a, b) => a + b.multiplier, 0) / history.length).toFixed(2) : '—'}x
                  </p>
                </div>
                <div className="bg-gray-700/50 rounded-xl p-3 text-center border border-gray-600/30">
                  <p className="text-gray-400 text-xs mb-1">Profit</p>
                  <p className={`text-2xl font-bold ${balance >= 1000 ? 'text-green-400' : 'text-red-400'}`}>
                    {balance >= 1000 ? '+' : ''}${(balance - 1000).toFixed(0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-indigo-800/30 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-500 text-sm">🐘 Elephant Aviator — A crash game for entertainment purposes only</p>
          <p className="mt-1 text-gray-600 text-xs">This is a demo game with virtual currency. No real money involved.</p>
        </div>
      </footer>
    </div>
  );
}
