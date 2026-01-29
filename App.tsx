
import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { judgeDrawing } from './services/geminiService';
import { MathProblem, GameState, Operator } from './types';
import { ItemGrid } from './components/ItemGrid';
import { CrocodileMouth } from './components/CrocodileMouth';
import { DrawingCanvas } from './components/DrawingCanvas';
import { CuteCrocodile } from './components/CuteCrocodile';
import { Trophy, CheckCircle2, AlertCircle, Home, Volume2, VolumeX, Lightbulb, XCircle, Star, PenTool, Sparkles } from 'lucide-react';

const EMOJI_POOL = [
  { char: "🍎", name: "quả táo" }, { char: "🍓", name: "quả dâu" }, { char: "🍊", name: "quả cam" },
  { char: "🍌", name: "quả chuối" }, { char: "🍬", name: "viên kẹo" }, { char: "⭐", name: "ngôi sao" },
  { char: "🎈", name: "bong bóng" }, { char: "🧸", name: "gấu bông" }, { char: "🍰", name: "bánh kem" },
  { char: "🐟", name: "con cá" }, { char: "🍦", name: "cây kem" }, { char: "⚽", name: "quả bóng" },
  { char: "🚗", name: "xe hơi" }, { char: "🥕", name: "củ cà rốt" }
];

const PRAISES = ["Giỏi quá!", "Xuất sắc!", "Bé thông minh quá!", "Tuyệt vời!", "Chính xác!", "Quá chuẩn!", "Bé siêu thế!"];

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    currentProblemIndex: 0,
    problems: [],
    status: 'intro',
    selectedOperator: null,
    isCorrect: null,
    mode: 'choice',
    fillingLeft: 0,
    fillingRight: 0,
    activeSide: 'left'
  });

  const [isMusicEnabled, setIsMusicEnabled] = useState(true);
  const [showParentGuide, setShowParentGuide] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const bgmIntervalRef = useRef<number | null>(null);
  const autoNextTimeoutRef = useRef<number | null>(null);

  const getAudioContext = async () => {
    if (!audioContextRef.current) {
      // @ts-ignore
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
    }
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    return audioContextRef.current;
  };

  const playMusic = async (type: 'intro' | 'game') => {
    if (!isMusicEnabled) return;
    const ctx = await getAudioContext();
    stopMusic();
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(type === 'intro' ? 0.5 : 0.3, ctx.currentTime);
    masterGain.connect(ctx.destination);
    const melody = type === 'intro' ? [392, 440, 494, 523, 587, 523, 494, 440] : [261, 329, 392, 329, 261, 392, 523, 392];
    const tempo = type === 'intro' ? 0.25 : 0.5;
    const playLoop = () => {
      const startTime = ctx.currentTime;
      melody.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = i % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, startTime + i * tempo);
        g.gain.setValueAtTime(0, startTime + i * tempo);
        g.gain.linearRampToValueAtTime(0.5, startTime + i * tempo + 0.05);
        g.gain.linearRampToValueAtTime(0, startTime + i * tempo + tempo - 0.05);
        osc.connect(g); g.connect(masterGain);
        osc.start(startTime + i * tempo); osc.stop(startTime + i * tempo + tempo);
      });
    };
    playLoop();
    bgmIntervalRef.current = window.setInterval(playLoop, melody.length * tempo * 1000);
  };

  const stopMusic = () => { if (bgmIntervalRef.current) { clearInterval(bgmIntervalRef.current); bgmIntervalRef.current = null; } };

  const playSoundEffect = async (type: 'win' | 'lose' | 'click' | 'pop') => {
    try {
      const ctx = await getAudioContext();
      const now = ctx.currentTime;
      const g = ctx.createGain(); g.gain.setValueAtTime(1.0, now); g.connect(ctx.destination);
      if (type === 'win') {
        [523, 659, 783, 1046].forEach((f, i) => {
          const o = ctx.createOscillator(); const og = ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(f, now + i * 0.07);
          og.gain.setValueAtTime(0, now + i * 0.07); og.gain.linearRampToValueAtTime(0.8, now + i * 0.07 + 0.02); og.gain.linearRampToValueAtTime(0, now + i * 0.07 + 0.15);
          o.connect(og); og.connect(g); o.start(now + i * 0.07); o.stop(now + i * 0.07 + 0.2);
        });
      } else if (type === 'lose') {
        const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(300, now); o.frequency.exponentialRampToValueAtTime(80, now + 0.5);
        const og = ctx.createGain(); og.gain.setValueAtTime(0.5, now); og.gain.linearRampToValueAtTime(0, now + 0.5); o.connect(og); og.connect(g); o.start(now); o.stop(now + 0.5);
      } else if (type === 'click' || type === 'pop') {
        const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(type === 'click' ? 1100 : 900, now);
        const og = ctx.createGain(); og.gain.setValueAtTime(0.3, now); og.gain.linearRampToValueAtTime(0, now + 0.05); o.connect(og); og.connect(g); o.start(now); o.stop(now + 0.05);
      }
    } catch (e) {}
  };

  const createRandomProblems = (count: number): MathProblem[] => {
    return Array.from({ length: count }).map(() => {
      const emoji = EMOJI_POOL[Math.floor(Math.random() * EMOJI_POOL.length)];
      const a = Math.floor(Math.random() * 8) + 1;
      const b = Math.random() > 0.8 ? a : Math.floor(Math.random() * 8) + 1;
      return {
        leftCount: a, rightCount: b, itemName: emoji.name, itemEmoji: emoji.char,
        correctOperator: a > b ? '>' : (a < b ? '<' : '='),
        questionType: a > b ? 'MORE' : (a < b ? 'LESS' : 'EQUAL'),
        praise: PRAISES[Math.floor(Math.random() * PRAISES.length)],
        encouragement: "Cá sấu luôn há miệng về phía nhiều hơn đó!",
      };
    });
  };

  const nextProblem = () => {
    if (autoNextTimeoutRef.current) clearTimeout(autoNextTimeoutRef.current);
    if (gameState.currentProblemIndex + 1 < gameState.problems.length) {
      setGameState(prev => ({
        ...prev,
        currentProblemIndex: prev.currentProblemIndex + 1,
        status: prev.mode === 'choice' ? 'playing' : 'drawing',
        selectedOperator: null, isCorrect: null
      }));
    } else {
      if (gameState.mode === 'choice') {
        setGameState(prev => ({ ...prev, status: 'drawing_intro' }));
      } else {
        setGameState(prev => ({ ...prev, status: 'finished' }));
      }
    }
  };

  const startChoiceGame = async () => {
    await getAudioContext(); playSoundEffect('click');
    setGameState({
      score: 0, currentProblemIndex: 0, problems: createRandomProblems(10), status: 'playing', mode: 'choice',
      selectedOperator: null, isCorrect: null, fillingLeft: 0, fillingRight: 0, activeSide: 'left'
    });
  };

  const startDrawingMode = async () => {
    await getAudioContext(); playSoundEffect('click');
    setGameState(prev => ({
      ...prev, currentProblemIndex: 0, problems: createRandomProblems(10), status: 'drawing', mode: 'drawing',
      selectedOperator: null, isCorrect: null
    }));
  };

  const handleOperatorSelect = async (op: Operator) => {
    if (gameState.status !== 'playing') return;
    const correct = op === gameState.problems[gameState.currentProblemIndex].correctOperator;
    setGameState(prev => ({ ...prev, status: 'feedback', selectedOperator: op, isCorrect: correct, score: correct ? prev.score + 10 : prev.score }));
    if (correct) { playSoundEffect('win'); autoNextTimeoutRef.current = window.setTimeout(nextProblem, 2000); }
    else { playSoundEffect('lose'); }
  };

  const handleDrawConfirm = async (base64: string) => {
    if (gameState.status !== 'drawing') return;
    setGameState(prev => ({ ...prev, status: 'loading' }));
    const isCorrect = await judgeDrawing(base64, gameState.problems[gameState.currentProblemIndex].correctOperator);
    setGameState(prev => ({ ...prev, status: 'feedback', isCorrect, score: isCorrect ? prev.score + 20 : prev.score }));
    if (isCorrect) { playSoundEffect('win'); autoNextTimeoutRef.current = window.setTimeout(nextProblem, 2000); }
    else { playSoundEffect('lose'); }
  };

  useEffect(() => {
    if (['playing', 'drawing'].includes(gameState.status)) playMusic('game');
    else if (gameState.status === 'finished') { stopMusic(); playSoundEffect('win'); }
    return () => stopMusic();
  }, [gameState.status, isMusicEnabled]);

  if (gameState.status === 'intro') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-green-50 p-6 text-center" onPointerDown={async () => { await getAudioContext(); if (!bgmIntervalRef.current) playMusic('intro'); }}>
        <div className="wobble-text"><CuteCrocodile className="w-64 h-64 mb-4" /></div>
        <h1 className="text-4xl sm:text-5xl font-black text-green-900 mb-6 tracking-tighter drop-shadow-lg">CÁ SẤU THAM ĂN 🐊</h1>
        <div className="bg-white p-8 rounded-[40px] shadow-2xl border-4 border-green-400 mb-10 max-w-xs scale-105">
          <p className="text-gray-800 font-black leading-tight text-lg">Cá sấu đói quá, bé hãy giúp cá sấu há miệng về phía có NHIỀU đồ ăn nhé!</p>
        </div>
        <button onClick={startChoiceGame} className="w-full max-w-xs bg-green-600 text-white font-black py-6 rounded-full text-3xl shadow-[0_12px_0_0_rgba(21,128,61,1)] active:shadow-none active:translate-y-3 transition-all animate-pulse">BẮT ĐẦU CHƠI!</button>
        <p className="mt-12 text-green-600/70 font-black text-sm uppercase tracking-widest animate-bounce">Chạm vào màn hình để bật nhạc</p>
      </div>
    );
  }

  if (gameState.status === 'drawing_intro') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 p-6 text-center">
        <PenTool size={100} className="text-blue-500 mb-6 animate-bounce" />
        <h1 className="text-4xl font-black text-blue-900 mb-6">SIÊU NHÂN VẼ!</h1>
        <div className="bg-white p-8 rounded-[40px] shadow-xl border-4 border-blue-400 mb-10 max-w-xs">
          <p className="text-gray-800 font-black text-xl">Bé đã chọn dấu rất giỏi! Bây giờ bé hãy tự tay vẽ dấu để cho cá sấu ăn nhé!</p>
        </div>
        <button onClick={startDrawingMode} className="w-full max-w-xs bg-blue-600 text-white font-black py-6 rounded-full text-3xl shadow-[0_12px_0_0_rgba(29,78,216,1)] active:translate-y-2 transition-all">BẮT ĐẦU VẼ!</button>
      </div>
    );
  }

  if (gameState.status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-green-50">
        <div className="w-24 h-24 border-8 border-green-200 border-t-green-600 rounded-full animate-spin" />
        <p className="mt-6 font-black text-green-800 text-2xl">Cá sấu đang nhìn kỹ...</p>
      </div>
    );
  }

  if (gameState.status === 'finished') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-yellow-50 p-6 text-center">
        <Trophy size={140} className="text-yellow-500 mb-6 animate-bounce" />
        <h1 className="text-4xl font-black text-green-900 mb-8 uppercase">Bé là thiên tài!</h1>
        <div className="bg-white p-10 rounded-[50px] shadow-2xl border-8 border-green-400 mb-10 max-w-xs w-full">
           <p className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-widest">Bé nhận được</p>
           <p className="text-8xl font-black text-green-600 math-font leading-none">{gameState.score}</p>
           <p className="text-2xl font-black text-green-800 mt-4">ĐIỂM</p>
        </div>
        <button onClick={() => setGameState(prev => ({...prev, status: 'intro'}))} className="w-full max-w-xs bg-green-500 text-white font-black py-5 rounded-full text-3xl shadow-xl border-b-8 border-green-900">CHƠI LẠI!</button>
      </div>
    );
  }

  const currentProb = gameState.problems[gameState.currentProblemIndex];
  const progress = ((gameState.currentProblemIndex + 1) / gameState.problems.length) * 100;

  return (
    <div className="min-h-screen bg-green-50 flex flex-col items-center p-4">
      {/* Header */}
      <div className="w-full max-w-xl bg-white p-4 rounded-[32px] shadow-lg mb-4 border-2 border-green-100">
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2">
            <button onClick={() => setGameState(prev => ({...prev, status: 'intro'}))} className="p-3 bg-green-50 text-green-600 rounded-2xl hover:scale-110"><Home size={28} /></button>
            <button onClick={() => { setIsMusicEnabled(!isMusicEnabled); playSoundEffect('click'); }} className="p-3 bg-green-50 text-green-600 rounded-2xl hover:scale-110">
              {isMusicEnabled ? <Volume2 size={28} /> : <VolumeX size={28} />}
            </button>
          </div>
          <div className="bg-yellow-400 px-6 py-2 rounded-full font-black text-green-900 text-lg shadow-md border-4 border-white flex items-center gap-2">
            <Star size={20} className="fill-current" /> {gameState.score}
          </div>
          <button onClick={() => setShowParentGuide(true)} className="p-3 bg-orange-50 text-orange-500 rounded-2xl"><Lightbulb size={28} /></button>
        </div>
        <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden border-2">
          <div className="bg-green-500 h-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <main className="w-full max-w-xl flex-1 flex flex-col gap-6">
        {/* Câu hỏi */}
        <div className="text-center bg-white p-6 rounded-[40px] shadow-md border-4 border-dashed border-green-300 min-h-[120px] flex items-center justify-center">
          <h2 className="text-2xl font-black text-green-900 leading-tight">
            {currentProb?.leftCount === currentProb?.rightCount ? (
              "Hai bên bằng nhau rồi, bé chọn dấu nào?"
            ) : (
              <><span className="capitalize text-green-600">{currentProb?.itemName}</span> bên nào {currentProb?.questionType === 'MORE' ? 'nhiều hơn' : 'ít hơn'} hả bé?</>
            )}
          </h2>
        </div>

        {/* Khu vực so sánh - SIDE BY SIDE GRID */}
        <div className="grid grid-cols-11 items-center gap-2 w-full mt-2">
          <div className="col-span-4 flex flex-col items-center p-4 rounded-[40px] border-4 bg-white min-h-[180px] sm:min-h-[220px] border-gray-100">
            <ItemGrid count={currentProb?.leftCount || 0} emoji={currentProb?.itemEmoji || '🍎'} label="" isCompact />
          </div>
          <div className="col-span-3 flex flex-col items-center justify-center">
            {gameState.status === 'feedback' && gameState.isCorrect ? (
              <div className="animate-in zoom-in duration-300 scale-150"><div className="text-7xl font-black text-green-600 math-font drop-shadow-md">{currentProb.correctOperator}</div></div>
            ) : (
              <div className="text-6xl font-black text-gray-200 drop-shadow-sm">?</div>
            )}
          </div>
          <div className="col-span-4 flex flex-col items-center p-4 rounded-[40px] border-4 bg-white min-h-[180px] sm:min-h-[220px] border-gray-100">
            <ItemGrid count={currentProb?.rightCount || 0} emoji={currentProb?.itemEmoji || '🍎'} label="" isCompact />
          </div>
        </div>

        {/* Tương tác */}
        <div className="mt-4 w-full flex justify-center">
          {gameState.mode === 'drawing' ? (
            <div className="w-full bg-white p-6 rounded-[50px] border-4 border-blue-200 shadow-2xl">
              <p className="font-black text-blue-800 text-lg mb-4 text-center uppercase tracking-tighter">Vẽ miệng cá sấu:</p>
              <DrawingCanvas onConfirm={handleDrawConfirm} disabled={gameState.status === 'loading'} />
            </div>
          ) : (
            <div className="flex flex-row gap-4 sm:gap-6 justify-center w-full p-8 bg-white/90 rounded-[50px] border-4 border-green-100 shadow-inner overflow-x-auto">
              <CrocodileMouth operator=">" isActive={gameState.selectedOperator === '>'} onClick={() => handleOperatorSelect('>')} disabled={gameState.status !== 'playing'} />
              <CrocodileMouth operator="=" isActive={gameState.selectedOperator === '='} onClick={() => handleOperatorSelect('=')} disabled={gameState.status !== 'playing'} />
              <CrocodileMouth operator="<" isActive={gameState.selectedOperator === '<'} onClick={() => handleOperatorSelect('<')} disabled={gameState.status !== 'playing'} />
            </div>
          )}
        </div>

        {/* Feedback */}
        {gameState.status === 'feedback' && (
          <div className="fixed inset-x-4 bottom-10 z-50 animate-in slide-in-from-bottom-32">
            <div className={`p-8 sm:p-10 rounded-[50px] shadow-2xl flex flex-col items-center gap-6 border-8 ${gameState.isCorrect ? 'bg-green-100 border-green-500' : 'bg-orange-50 border-orange-400'}`}>
              <div className="flex items-center gap-6 w-full">
                {gameState.isCorrect ? <CheckCircle2 size={72} className="text-green-600" /> : <AlertCircle size={72} className="text-orange-500" />}
                <div className="flex-1">
                  <h3 className={`text-3xl font-black ${gameState.isCorrect ? 'text-green-800' : 'text-orange-800'}`}>{gameState.isCorrect ? "TUYỆT VỜI!" : "BÉ THỬ LẠI NHÉ!"}</h3>
                  <p className="text-xl font-bold text-gray-600 leading-tight">{gameState.isCorrect ? currentProb.praise : currentProb.encouragement}</p>
                </div>
              </div>
              {!gameState.isCorrect && (
                <button onClick={nextProblem} className="w-full py-5 bg-orange-500 text-white rounded-full font-black text-2xl border-b-8 border-orange-800 active:translate-y-2">TIẾP THEO</button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Parent Guide */}
      {showParentGuide && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/70 backdrop-blur-xl">
          <div className="bg-white w-full max-w-sm rounded-[50px] overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="bg-green-600 p-6 text-white flex justify-between items-center"><h3 className="font-black uppercase text-lg">Mẹo nhỏ cho ba mẹ</h3><button onClick={() => setShowParentGuide(false)}><XCircle size={40}/></button></div>
            <div className="p-10 space-y-6">
              <p className="text-xl text-gray-700 font-bold">Hãy nhắc bé:<br/><b className="text-green-600 text-2xl">"Cá sấu tham ăn lắm, nó luôn quay miệng HÁ TO về phía có NHIỀU đồ ăn hơn!"</b></p>
              <div className="bg-yellow-50 p-8 rounded-[40px] border-4 border-dashed border-yellow-400 text-center font-black text-orange-600 text-2xl animate-pulse">HÁ MIỆNG VỀ PHÍA NHIỀU!</div>
            </div>
            <div className="p-8 bg-gray-50 flex justify-center border-t-2"><button onClick={() => setShowParentGuide(false)} className="bg-green-600 text-white px-16 py-4 rounded-full font-black text-2xl shadow-xl">ĐÃ RÕ!</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
