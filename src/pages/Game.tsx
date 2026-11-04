import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

type GameState = 'waiting' | 'flying' | 'crashed';

interface BetState {
  active: boolean;
  amount: number;
  cashedOut: boolean;
  cashOutMultiplier: number;
}

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

export default function Game() {
  const { user, updateBalance } = useAuth();
  const [gameState, setGameState] = useState<GameState>('waiting');
  const [multiplier, setMultiplier] = useState(1.0);
  const [history, setHistory] = useState<GameHistory[]>([]);
  const [countdown, setCountdown] = useState(5);
  const [elephantY, setElephantY] = useState(0);

  // Dual bet states
  const [bet1, setBet1] = useState<BetState>({ active: false, amount: 10, cashedOut: false, cashOutMultiplier: 0 });
  const [bet2, setBet2] = useState<BetState>({ active: false, amount: 10, cashedOut: false, cashOutMultiplier: 0 });

  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const crashPointRef = useRef<number>(2.0);
  const historyIdRef = useRef<number>(0);
  const multiplierRef = useRef(1.0);
  const bet1Ref = useRef(bet1);
  const bet2Ref = useRef(bet2);

  useEffect(() => { bet1Ref.current = bet1; }, [bet1]);
  useEffect(() => { bet2Ref.current = bet2; }, [bet2]);
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
        }, ...prev].slice(0, 30));

        // Save game record for admin
        const records = JSON.parse(localStorage.getItem('elephant_game_records') || '[]');
        records.unshift({
          id: historyIdRef.current,
          multiplier: crashPointRef.current,
          timestamp: new Date().toISOString(),
          bets: [
            bet1Ref.current.active ? { userId: user?.id, amount: bet1Ref.current.amount, cashedOut: bet1Ref.current.cashedOut, cashOutAt: bet1Ref.current.cashOutMultiplier } : null,
            bet2Ref.current.active ? { userId: user?.id, amount: bet2Ref.current.amount, cashedOut: bet2Ref.current.cashedOut, cashOutAt: bet2Ref.current.cashOutMultiplier } : null,
          ].filter(Boolean),
        });
        localStorage.setItem('elephant_game_records', JSON.stringify(records.slice(0, 100)));

        setTimeout(() => {
          setBet1(prev => ({ ...prev, active: false, cashedOut: false, cashOutMultiplier: 0 }));
          setBet2(prev => ({ ...prev, active: false, cashedOut: false, cashOutMultiplier: 0 }));
          startCountdown();
        }, 3000);
        return;
      }

      setMultiplier(currentMultiplier);
      setElephantY(Math.min(elapsed * 12, 280));
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [user]);

  const startCountdown = useCallback(() => {
    setCountdown(5);
    setGameState('waiting');
    setMultiplier(1.0);
    setElephantY(0);

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

  const placeBet = (betNum: 1 | 2) => {
    if (gameState !== 'waiting' || !user) return;
    const bet = betNum === 1 ? bet1 : bet2;
    if (bet.active) return;
    const totalActive = (bet1.active ? bet1.amount : 0) + (bet2.active ? bet2.amount : 0);
    if (bet.amount + totalActive > user.balance || bet.amount <= 0) return;
    updateBalance(user.balance - bet.amount);
    if (betNum === 1) setBet1(prev => ({ ...prev, active: true }));
    else setBet2(prev => ({ ...prev, active: true }));
  };

  const cashOut = (betNum: 1 | 2) => {
    if (gameState !== 'flying' || !user) return;
    const bet = betNum === 1 ? bet1 : bet2;
    if (!bet.active || bet.cashedOut) return;
    if (animationRef.current) cancelAnimationFrame(animationRef.current);

    const currentMult = multiplierRef.current;
    const winnings = bet.amount * currentMult;
    updateBalance(user.balance + winnings);

    if (betNum === 1) setBet1(prev => ({ ...prev, cashedOut: true, cashOutMultiplier: currentMult }));
    else setBet2(prev => ({ ...prev, cashedOut: true, cashOutMultiplier: currentMult }));
  };

  const updateBetAmount = (betNum: 1 | 2, amount: number) => {
    if (betNum === 1) setBet1(prev => ({ ...prev, amount: Math.max(0, amount) }));
    else setBet2(prev => ({ ...prev, amount: Math.max(0, amount) }));
  };

  const getMultiplierColor = () => {
    if (gameState === 'crashed') return 'text-red-500';
    if (multiplier < 2) return 'text-blue-400';
    if (multiplier < 5) return 'text-green-400';
    if (multiplier < 10) return 'text-yellow-400';
    return 'text-purple-400';
  };

  const getMultiplierGlow = () => {
    if (gameState === 'crashed') return 'drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]';
    if (multiplier < 2) return 'drop-shadow-[0_0_20px_rgba(96,165,250,0.5)]';
    if (multiplier < 5) return 'drop-shadow-[0_0_20px_rgba(74,222,128,0.5)]';
    if (multiplier < 10) return 'drop-shadow-[0_0_20px_rgba(250,204,21,0.5)]';
    return 'drop-shadow-[0_0_20px_rgba(192,132,252,0.5)]';
  };

  const renderBetPanel = (betNum: 1 | 2) => {
    const bet = betNum === 1 ? bet1 : bet2;
    const label = betNum === 1 ? 'Bet 1' : 'Bet 2';
    const color = betNum === 1 ? 'indigo' : 'purple';

    return (
      <div className={`bg-gray-800/60 rounded-2xl border border-${color}-800/30 p-5 backdrop-blur-sm`}>
        <h3 className={`text-base font-bold text-gray-200 mb-3 flex items-center gap-2`}>
          <span className={`w-2 h-2 rounded-full bg-${color}-500`} />
          {label}
        </h3>

        <div className="mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateBetAmount(betNum, Math.max(1, Math.floor(bet.amount / 2)))}
              className="bg-gray-700 hover:bg-gray-600 px-2 py-2 rounded-lg text-xs font-bold transition-colors border border-gray-600"
              disabled={bet.active || gameState === 'flying'}
            >
              ½
            </button>
            <input
              type="number"
              value={bet.amount}
              onChange={(e) => updateBetAmount(betNum, Number(e.target.value))}
              className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-center text-sm font-bold focus:outline-none focus:border-indigo-500 transition-colors"
              disabled={bet.active || gameState === 'flying'}
            />
            <button
              onClick={() => updateBetAmount(betNum, bet.amount * 2)}
              className="bg-gray-700 hover:bg-gray-600 px-2 py-2 rounded-lg text-xs font-bold transition-colors border border-gray-600"
              disabled={bet.active || gameState === 'flying'}
            >
              2×
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-1.5 mb-4">
          {[5, 10, 25, 50].map((amount) => (
            <button
              key={amount}
              onClick={() => updateBetAmount(betNum, amount)}
              disabled={bet.active || gameState === 'flying'}
              className="bg-gray-700 hover:bg-indigo-700 disabled:opacity-50 px-1.5 py-2 rounded-lg text-xs font-bold transition-all border border-gray-600"
            >
              ${amount}
            </button>
          ))}
        </div>

        {gameState === 'waiting' && !bet.active && (
          <button
            onClick={() => placeBet(betNum)}
            disabled={bet.amount > (user?.balance || 0) || bet.amount <= 0}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl text-sm transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Place Bet (${bet.amount.toFixed(2)})
          </button>
        )}

        {gameState === 'waiting' && bet.active && (
          <div className="w-full bg-green-900/30 border border-green-700/50 text-green-400 font-bold py-3 rounded-xl text-sm text-center">
            ✓ Bet Placed
          </div>
        )}

        {gameState === 'flying' && bet.active && !bet.cashedOut && (
          <button
            onClick={() => cashOut(betNum)}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white font-bold py-3 rounded-xl text-sm transition-all transform hover:scale-[1.02] active:scale-[0.98] animate-pulse"
          >
            💰 Cash Out (${(bet.amount * multiplier).toFixed(2)})
          </button>
        )}

        {gameState === 'flying' && bet.active && bet.cashedOut && (
          <div className="w-full bg-green-900/30 border border-green-700/50 text-green-400 font-bold py-3 rounded-xl text-sm text-center">
            ✓ Won ${(bet.amount * bet.cashOutMultiplier).toFixed(2)}
          </div>
        )}

        {(gameState === 'flying' || gameState === 'crashed') && !bet.active && (
          <div className="w-full bg-gray-700/50 border border-gray-600/50 text-gray-400 font-bold py-3 rounded-xl text-sm text-center">
            No bet placed
          </div>
        )}

        {gameState === 'crashed' && (
          <div className="w-full bg-red-900/20 border border-red-700/30 text-red-400 font-bold py-3 rounded-xl text-sm text-center">
            💥 Crashed!
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Game History Bar */}
      <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2">
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
            {/* Stars */}
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

            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-indigo-900/30 to-transparent" />

            {gameState === 'waiting' && (
              <div className="text-center z-10 animate-float">
                <div className="text-7xl mb-6">🐘</div>
                <p className="text-xl text-gray-300 mb-3">Next round starting in...</p>
                <p className="text-6xl font-bold text-indigo-400">{countdown}</p>
              </div>
            )}

            {gameState === 'flying' && (
              <div className="text-center z-10">
                <div
                  className="text-7xl mb-6 transition-all duration-100"
                  style={{
                    transform: `translateY(-${elephantY}px) rotate(-${Math.min(elephantY / 15, 15)}deg)`,
                  }}
                >
                  🐘
                </div>
                <p className={`text-7xl font-black ${getMultiplierColor()} ${getMultiplierGlow()} transition-colors duration-200`}>
                  {multiplier.toFixed(2)}x
                </p>
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
              </div>
            )}
          </div>
        </div>

        {/* Betting Panels */}
        <div className="space-y-4">
          {renderBetPanel(1)}
          {renderBetPanel(2)}
        </div>
      </div>
    </div>
  );
}
