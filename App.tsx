
import React, { useState, useEffect, useRef } from 'react';
import { judgeDrawing } from './services/geminiService';
import { MathProblem, GameState, Operator } from './types';
import { ItemGrid } from './components/ItemGrid';
import { CrocodileMouth } from './components/CrocodileMouth';
import { DrawingCanvas } from './components/DrawingCanvas';
import { CuteCrocodile } from './components/CuteCrocodile';
import { Trophy, CheckCircle2, AlertCircle, ChevronRight, Home, Volume2, VolumeX, Lightbulb, XCircle, Star, Sparkles, Plus, Trash2 } from 'lucide-react';

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

  const [showParentGuide, setShowParentGuide] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const autoNextTimeoutRef = useRef<number | null>(null);

  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  const playSoundEffect = (type: 'win' | 'lose' | 'click' | 'pop') => {
    initAudio();
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.connect(g);
    g.connect(ctx.destination);
    
    if (type === 'win') {
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.1);
      g.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.start(); osc.stop(ctx.currentTime + 0.2);
    } else if (type === 'lose') {
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(50, ctx.currentTime + 0.3);
      g.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.start(); osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'pop') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.05);
      g.gain.setValueAtTime(0.1, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.05);
      osc.start(); osc.stop(ctx.currentTime + 0.05);
    } else {
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      g.gain.setValueAtTime(0.05, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.05);
      osc.start(); osc.stop(ctx.currentTime + 0.05);
    }
  };

  const createRandomProblems = (count: number): MathProblem[] => {
    return Array.from({ length: count }).map(() => {
      const emoji = EMOJI_POOL[Math.floor(Math.random() * EMOJI_POOL.length)];
      const a = Math.floor(Math.random() * 8) + 1;
      const b = Math.floor(Math.random() * 8) + 1;
      const op: Operator = a > b ? '>' : (a < b ? '<' : '=');
      
      // Ngẫu nhiên chọn cách hỏi: nhiều hơn, ít hơn, hoặc bằng nhau
      let qType: 'MORE' | 'LESS' | 'EQUAL' = 'MORE';
      if (a === b) {
        qType = 'EQUAL';
      } else {
        qType = Math.random() > 0.5 ? 'MORE' : 'LESS';
      }

      return {
        leftCount: a,
        rightCount: b,
        itemName: emoji.name,
        itemEmoji: emoji.char,
        correctOperator: op,
        questionType: qType,
        praise: PRAISES[Math.floor(Math.random() * PRAISES.length)],
        encouragement: "Cá sấu tham ăn lắm, nó luôn há miệng về phía có nhiều đồ ăn hơn đó!",
      };
    });
  };

  const nextProblem = () => {
    if (autoNextTimeoutRef.current) clearTimeout(autoNextTimeoutRef.current);
    
    if (gameState.currentProblemIndex + 1 < gameState.problems.length) {
      setGameState(prev => ({
        ...prev,
        currentProblemIndex: prev.currentProblemIndex + 1,
        status: prev.mode === 'choice' ? 'playing' : (prev.mode === 'drawing' ? 'drawing' : 'filling_game'),
        selectedOperator: null,
        isCorrect: null,
        fillingLeft: 0,
        fillingRight: 0,
        activeSide: 'left'
      }));
    } else {
      if (gameState.mode === 'choice') {
        setGameState(prev => ({ ...prev, status: 'drawing_intro' }));
      } else if (gameState.mode === 'drawing') {
        setGameState(prev => ({ ...prev, status: 'reward_ask' }));
      } else {
        setGameState(prev => ({ ...prev, status: 'finished' }));
      }
    }
  };

  const loadInitialGame = () => {
    initAudio();
    setGameState({
      score: 0,
      currentProblemIndex: 0,
      problems: createRandomProblems(10),
      status: 'playing',
      mode: 'choice',
      selectedOperator: null,
      isCorrect: null,
      fillingLeft: 0,
      fillingRight: 0,
      activeSide: 'left'
    });
  };

  const loadDrawingPhase = () => {
    setGameState(prev => ({
      ...prev,
      problems: createRandomProblems(10),
      currentProblemIndex: 0,
      status: 'drawing',
      mode: 'drawing',
      selectedOperator: null,
      isCorrect: null
    }));
  };

  const loadFillingPhase = () => {
    const problems = Array.from({ length: 10 }).map(() => {
      const emoji = EMOJI_POOL[Math.floor(Math.random() * EMOJI_POOL.length)];
      const op: Operator = Math.random() > 0.5 ? '>' : '<';
      return {
        leftCount: 0, rightCount: 0, itemName: emoji.name, itemEmoji: emoji.char,
        correctOperator: op, questionType: 'FILL_BOXES' as any,
        praise: "Bé gắp đồ giỏi quá!", encouragement: "Bé gắp lại cho đúng dấu nhé!"
      };
    });
    setGameState(prev => ({
      ...prev,
      problems,
      currentProblemIndex: 0,
      status: 'filling_game',
      mode: 'filling',
      fillingLeft: 0,
      fillingRight: 0,
      activeSide: 'left',
      selectedOperator: null,
      isCorrect: null
    }));
  };

  const handleOperatorSelect = async (operator: Operator) => {
    if (gameState.status !== 'playing') return;
    const correct = operator === gameState.problems[gameState.currentProblemIndex].correctOperator;
    setGameState(prev => ({ ...prev, status: 'feedback', selectedOperator: operator, isCorrect: correct, score: correct ? prev.score + 10 : prev.score }));
    if (correct) { playSoundEffect('win'); autoNextTimeoutRef.current = window.setTimeout(nextProblem, 2000); }
    else playSoundEffect('lose');
  };

  const handleDrawConfirm = async (base64: string) => {
    if (gameState.status !== 'drawing') return;
    setGameState(prev => ({ ...prev, status: 'loading' }));
    const isCorrect = await judgeDrawing(base64, gameState.problems[gameState.currentProblemIndex].correctOperator);
    setGameState(prev => ({ ...prev, status: 'feedback', isCorrect, score: isCorrect ? prev.score + 20 : prev.score }));
    if (isCorrect) { playSoundEffect('win'); autoNextTimeoutRef.current = window.setTimeout(nextProblem, 2000); }
    else playSoundEffect('lose');
  };

  const handleAddItemFromStore = () => {
    if (gameState.status !== 'filling_game') return;
    playSoundEffect('pop');
    setGameState(prev => ({
      ...prev,
      fillingLeft: prev.activeSide === 'left' ? Math.min(prev.fillingLeft + 1, 9) : prev.fillingLeft,
      fillingRight: prev.activeSide === 'right' ? Math.min(prev.fillingRight + 1, 9) : prev.fillingRight,
    }));
  };

  const handleClearSide = () => {
    playSoundEffect('click');
    setGameState(prev => ({
      ...prev,
      fillingLeft: prev.activeSide === 'left' ? 0 : prev.fillingLeft,
      fillingRight: prev.activeSide === 'right' ? 0 : prev.fillingRight,
    }));
  };

  const checkFillingResult = () => {
    const prob = gameState.problems[gameState.currentProblemIndex];
    let correct = false;
    if (prob.correctOperator === '>') correct = gameState.fillingLeft > gameState.fillingRight;
    if (prob.correctOperator === '<') correct = gameState.fillingLeft < gameState.fillingRight;
    if (prob.correctOperator === '=') correct = gameState.fillingLeft === gameState.fillingRight;

    setGameState(prev => ({ ...prev, status: 'feedback', isCorrect: correct, score: correct ? prev.score + 15 : prev.score }));
    if (correct) { playSoundEffect('win'); autoNextTimeoutRef.current = window.setTimeout(nextProblem, 2500); }
    else playSoundEffect('lose');
  };

  const goHome = () => {
    setGameState(prev => ({ ...prev, status: 'intro', score: 0 }));
  };

  const renderMiddleOperator = (op: Operator) => {
    const isRotate = op === '<';
    if (op === '=') {
      return (
        <div className="flex flex-col gap-1 w-8 items-center justify-center animate-in zoom-in duration-300">
          <div className="h-2 bg-green-500 rounded-full w-full"></div>
          <div className="h-2 bg-green-500 rounded-full w-full"></div>
        </div>
      );
    }
    return (
      <div className={`transition-all duration-500 animate-in zoom-in ${isRotate ? 'rotate-180' : 'rotate-0'}`}>
        <svg viewBox="0 0 100 100" className="w-14 h-14">
          <path d="M10 20 L90 50 L10 80" fill="none" stroke="#22c55e" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M25 25 L32 35 L40 28 L48 38 L56 31 L64 41 L72 34" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" />
          <path d="M25 75 L32 65 L40 72 L48 62 L56 69 L64 59 L72 66" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" />
          <circle cx="20" cy="20" r="8" fill="white" stroke="#166534" strokeWidth="2" />
          <circle cx="22" cy="20" r="4" fill="black" />
        </svg>
      </div>
    );
  };

  if (gameState.status === 'intro') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-green-50 p-6 text-center" onClick={initAudio}>
        <CuteCrocodile className="w-48 h-48 mb-6 animate-bounce" />
        <h1 className="text-3xl font-black text-green-900 mb-4 tracking-tighter">Cá sấu tham ăn 🐊</h1>
        <div className="bg-white p-6 rounded-[32px] shadow-xl border-4 border-green-400 mb-8 max-w-xs">
          <p className="text-gray-700 font-bold leading-relaxed">Cá sấu đang đói lắm, bé hãy giúp cá sấu chọn miệng há về phía đúng nhé!</p>
        </div>
        <button onClick={loadInitialGame} className="w-full max-w-xs bg-green-600 text-white font-black py-5 rounded-full text-2xl shadow-xl border-b-8 border-green-900 active:scale-95 transition-all">Bắt đầu chơi!</button>
      </div>
    );
  }

  if (gameState.status === 'drawing_intro') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 p-6 text-center">
        <h2 className="text-2xl font-black text-blue-900 mb-6 tracking-tighter">Thử thách tập vẽ ✍️</h2>
        <div className="bg-white p-8 rounded-[40px] shadow-2xl border-8 border-blue-400 mb-8 max-w-xs">
          <p className="text-lg font-bold text-gray-700">Bé hãy dùng tay vẽ miệng cá sấu há về phía đúng nhé!</p>
        </div>
        <button onClick={loadDrawingPhase} className="w-full max-w-xs bg-blue-600 text-white font-black py-4 rounded-full text-xl shadow-xl border-b-8 border-blue-900 active:scale-95">Con sẵn sàng!</button>
      </div>
    );
  }

  if (gameState.status === 'reward_ask') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-purple-50 p-6 text-center">
        <Star size={80} className="text-yellow-400 fill-current mb-4 animate-pulse" />
        <h2 className="text-2xl font-black text-purple-900 mb-4 tracking-tighter">Bé quá tuyệt vời!</h2>
        <div className="bg-white p-8 rounded-[40px] shadow-2xl border-8 border-purple-400 mb-8 max-w-xs">
          <p className="text-lg font-bold text-gray-700">Bé có muốn chơi trò "Gắp đồ vật" để nhận thêm kim cương không?</p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button onClick={loadFillingPhase} className="bg-purple-600 text-white font-black py-4 rounded-full text-xl shadow-xl flex items-center justify-center gap-2 border-b-8 border-purple-900">Luyện tiếp nhận thưởng! <Sparkles size={20}/></button>
          <button onClick={() => setGameState(prev => ({...prev, status: 'finished'}))} className="text-gray-400 font-bold underline mt-2">Con nghỉ xíu ạ</button>
        </div>
      </div>
    );
  }

  if (gameState.status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-green-50">
        <div className="w-20 h-20 border-8 border-green-200 border-t-green-600 rounded-full animate-spin" />
        <p className="mt-4 font-black text-green-800">Đợi tớ nhìn kỹ xíu...</p>
      </div>
    );
  }

  if (gameState.status === 'finished') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-yellow-50 p-6 text-center">
        <Trophy size={100} className="text-yellow-500 mb-4" />
        <h1 className="text-3xl font-black text-green-900 mb-6 tracking-tighter">Siêu nhân toán học!</h1>
        <div className="bg-white p-8 rounded-[40px] shadow-2xl border-8 border-green-400 mb-8 max-w-xs w-full">
           <p className="text-sm font-bold text-gray-400 mb-1 uppercase tracking-widest">Điểm của bé</p>
           <p className="text-7xl font-black text-green-600 math-font">{gameState.score}</p>
        </div>
        <button onClick={goHome} className="w-full max-w-xs bg-green-500 text-white font-black py-4 rounded-full text-xl shadow-xl border-b-8 border-green-900">Chơi lại từ đầu</button>
      </div>
    );
  }

  const currentProblem = gameState.problems[gameState.currentProblemIndex];
  const progress = ((gameState.currentProblemIndex + 1) / gameState.problems.length) * 100;

  // Cố định viền đồng nhất giữa hai ô
  const containerBaseClass = "flex-1 flex flex-col items-center p-3 rounded-3xl border-4 transition-all duration-300 bg-white border-gray-100 shadow-sm";
  const activeHighlightClass = "ring-4 ring-yellow-400 ring-offset-2 border-yellow-100 bg-yellow-50/30 scale-[1.02]";

  return (
    <div className="min-h-screen bg-green-50 flex flex-col items-center p-4">
      <div className="w-full max-w-sm bg-white p-3 rounded-[24px] shadow-lg mb-4">
        <div className="flex justify-between items-center mb-2">
          <button onClick={goHome} className="p-2 text-green-600 hover:scale-110 transition-transform"><Home size={24} /></button>
          <div className="bg-yellow-400 px-4 py-1 rounded-full font-black text-green-900 text-xs shadow-inner border border-white">{gameState.score} điểm</div>
          <button onClick={() => setShowParentGuide(true)} className="p-2 text-orange-500 hover:scale-110 transition-transform"><Lightbulb size={24} /></button>
        </div>
        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden border">
          <div className="bg-green-500 h-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <main className="w-full max-w-sm flex-1 flex flex-col gap-4">
        {/* Câu hỏi chi tiết theo yêu cầu */}
        <div className="text-center bg-white p-4 rounded-[24px] shadow-sm border-2 border-dashed border-green-300 min-h-[80px] flex items-center justify-center">
          <h2 className="text-lg font-black text-green-900 leading-tight">
            {gameState.mode === 'filling' ? (
              `Bé hãy gắp ${currentProblem.itemName} vào hai ô sao cho đúng nhé!`
            ) : (
              <>
                <span className="capitalize">{currentProblem.itemName}</span> bên nào {
                  currentProblem.questionType === 'MORE' ? 'nhiều hơn' : 
                  currentProblem.questionType === 'LESS' ? 'ít hơn' : 'bằng nhau'
                } hả bé?
              </>
            )}
          </h2>
        </div>

        <div className="flex flex-row items-stretch justify-between gap-2 mt-2">
          <div 
            className={`${containerBaseClass} ${gameState.mode === 'filling' && gameState.activeSide === 'left' ? activeHighlightClass : ''}`} 
            onClick={() => setGameState(prev => ({...prev, activeSide: 'left'}))}
          >
            <ItemGrid count={gameState.mode === 'filling' ? gameState.fillingLeft : currentProblem.leftCount} emoji={currentProblem.itemEmoji} label={currentProblem.itemName} isCompact />
          </div>

          <div className="w-16 flex flex-col items-center justify-center shrink-0">
            {gameState.status === 'feedback' && gameState.isCorrect ? (
              renderMiddleOperator(currentProblem.correctOperator)
            ) : gameState.mode === 'filling' ? (
              <div className="text-5xl font-black text-green-600 math-font drop-shadow-sm">{currentProblem.correctOperator}</div>
            ) : gameState.status === 'drawing' ? (
              <div className="bg-blue-50 p-3 rounded-2xl border-2 border-blue-200">
                <Plus size={24} className="text-blue-400" />
              </div>
            ) : (
              <div className="text-3xl font-black text-gray-200">?</div>
            )}
          </div>

          <div 
            className={`${containerBaseClass} ${gameState.mode === 'filling' && gameState.activeSide === 'right' ? activeHighlightClass : ''}`} 
            onClick={() => setGameState(prev => ({...prev, activeSide: 'right'}))}
          >
            <ItemGrid count={gameState.mode === 'filling' ? gameState.fillingRight : currentProblem.rightCount} emoji={currentProblem.itemEmoji} label={currentProblem.itemName} isCompact />
          </div>
        </div>

        <div className="mt-4 flex flex-col items-center">
          {gameState.mode === 'filling' ? (
            <div className="w-full flex flex-col items-center gap-4">
              <div className="w-full bg-white p-4 rounded-[32px] border-4 border-dashed border-purple-200 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-purple-500 text-white px-3 py-1 rounded-bl-xl text-[10px] font-black uppercase">Kho hàng</div>
                <div className="flex items-center justify-between">
                   <button 
                    onClick={handleAddItemFromStore}
                    className="w-24 h-24 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl shadow-md flex flex-col items-center justify-center border-2 border-purple-300 active:scale-90 transition-transform"
                   >
                     <span className="text-4xl mb-1">{currentProblem.itemEmoji}</span>
                     <span className="text-[10px] font-black text-purple-800 uppercase text-center px-1">Gắp 1 {currentProblem.itemName}</span>
                   </button>
                   <div className="flex-1 flex flex-col items-center gap-2 px-4">
                      <p className="text-[10px] font-bold text-gray-400 text-center uppercase leading-tight">Bé đang gắp vào: <br/><span className="text-purple-600 font-black">{gameState.activeSide === 'left' ? 'Ô BÊN TRÁI' : 'Ô BÊN PHẢI'}</span></p>
                      <button onClick={handleClearSide} className="p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-100 border border-red-200"><Trash2 size={20}/></button>
                   </div>
                </div>
              </div>
              <button onClick={checkFillingResult} className="w-full py-4 bg-purple-600 text-white font-black rounded-full text-xl shadow-xl border-b-8 border-purple-900 active:scale-95 transition-all">Kiểm tra kết quả!</button>
            </div>
          ) : gameState.status === 'drawing' ? (
            <div className="w-full bg-white p-4 rounded-[32px] border-4 border-blue-200 shadow-xl">
              <p className="font-black text-blue-800 text-sm mb-2 text-center uppercase tracking-tighter">Vẽ miệng cá sấu vào đây:</p>
              <DrawingCanvas onConfirm={handleDrawConfirm} disabled={gameState.status === 'loading'} />
            </div>
          ) : (
            <div className="flex flex-row gap-4 justify-center w-full p-4 bg-white/60 rounded-[32px] border shadow-inner">
              <CrocodileMouth operator=">" isActive={gameState.selectedOperator === '>'} onClick={() => handleOperatorSelect('>')} disabled={gameState.status !== 'playing'} />
              <CrocodileMouth operator="=" isActive={gameState.selectedOperator === '='} onClick={() => handleOperatorSelect('=')} disabled={gameState.status !== 'playing'} />
              <CrocodileMouth operator="<" isActive={gameState.selectedOperator === '<'} onClick={() => handleOperatorSelect('<')} disabled={gameState.status !== 'playing'} />
            </div>
          )}
        </div>

        {gameState.status === 'feedback' && (
          <div className="fixed inset-x-4 bottom-4 z-50 animate-in slide-in-from-bottom-10">
            <div className={`p-6 rounded-[32px] shadow-2xl flex flex-col items-center gap-3 border-4 ${gameState.isCorrect ? 'bg-green-100 border-green-500' : 'bg-orange-50 border-orange-400'}`}>
              <div className="flex items-center gap-4 w-full">
                {gameState.isCorrect ? <CheckCircle2 size={40} className="text-green-500" /> : <AlertCircle size={40} className="text-orange-500" />}
                <div className="flex-1">
                  <h3 className={`text-xl font-black ${gameState.isCorrect ? 'text-green-800' : 'text-orange-800'}`}>
                    {gameState.isCorrect ? "Đúng rồi! Giỏi quá!" : "Bé thử lại nhé!"}
                  </h3>
                  <p className="text-sm font-bold text-gray-600 leading-tight">{gameState.isCorrect ? currentProblem.praise : currentProblem.encouragement}</p>
                </div>
              </div>
              {!gameState.isCorrect && (
                <button onClick={nextProblem} className="w-full py-3 bg-orange-500 text-white rounded-full font-black text-lg border-b-4 border-orange-700">Làm câu tiếp theo <ChevronRight className="inline" size={24}/></button>
              )}
            </div>
          </div>
        )}
      </main>

      {showParentGuide && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xs rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="bg-green-600 p-4 text-white flex justify-between items-center">
              <h3 className="font-black uppercase text-sm tracking-tighter">Bí kíp cho ba mẹ</h3>
              <button onClick={() => setShowParentGuide(false)} className="hover:scale-110"><XCircle /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-700 font-medium leading-relaxed">Ba mẹ hãy dạy bé: <b>"Cá sấu rất tham ăn, nó luôn quay miệng há về phía nào có NHIỀU đồ ăn hơn"</b>.</p>
              <div className="bg-yellow-50 p-4 rounded-2xl border-2 border-dashed border-yellow-400 text-center font-black text-orange-600 text-lg">HÁ MIỆNG VỀ PHÍA NHIỀU!</div>
            </div>
            <div className="p-4 bg-gray-50 flex justify-center border-t">
              <button onClick={() => setShowParentGuide(false)} className="bg-green-600 text-white px-10 py-2 rounded-full font-black shadow-md">Đã hiểu ạ!</button>
            </div>
          </div>
        </div>
      )}
      <footer className="mt-auto py-2 text-green-900/10 text-[10px] font-black uppercase tracking-widest select-none">🐊 cá sấu luôn há miệng về phía nhiều đồ ăn!</footer>
    </div>
  );
};

export default App;
