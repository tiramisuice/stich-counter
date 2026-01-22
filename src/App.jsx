import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  Play, 
  RotateCcw, 
  ChevronRight, 
  ChevronLeft, 
  X,
  Repeat,
  Layers,
  CheckCircle,
  Heart,
  Sparkles,
  Scissors
} from 'lucide-react';

// --- Types & Constants ---

// Updated to a pastel/cozy color palette
const STITCH_TYPES = [
  { id: 'sc', label: 'Single Crochet', short: 'SC', color: 'bg-sky-100 text-sky-700 border-sky-200' },
  { id: 'inc', label: 'Increase', short: 'INC', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', countAs: 2 },
  { id: 'dec', label: 'Decrease', short: 'DEC', color: 'bg-rose-100 text-rose-700 border-rose-200' },
  { id: 'dc', label: 'Double Crochet', short: 'DC', color: 'bg-violet-100 text-violet-700 border-violet-200' },
  { id: 'hdc', label: 'Half Double', short: 'HDC', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  { id: 'slst', label: 'Slip Stitch', short: 'SL ST', color: 'bg-stone-100 text-stone-600 border-stone-200' },
  { id: 'ch', label: 'Chain', short: 'CH', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { id: 'other', label: 'Special', short: '*', color: 'bg-pink-100 text-pink-700 border-pink-200' },
];

const DEFAULT_PROJECT = {
  id: 'default',
  name: 'My Cozy Project',
  rounds: []
};

// --- Helper Functions ---

const generateId = () => Math.random().toString(36).substr(2, 9);

const flattenRound = (round) => {
  let flatStitches = [];
  
  if (!round || !round.sequences) return [];

  round.sequences.forEach((seq, seqIndex) => {
    for (let r = 0; r < seq.repeat; r++) {
      seq.steps.forEach((step, stepIndex) => {
        const stitchDef = STITCH_TYPES.find(s => s.id === step.type);
        const countAs = stitchDef?.countAs || 1;

        for (let c = 0; c < step.count; c++) {
          for (let k = 0; k < countAs; k++) {
            flatStitches.push({
              type: step.type,
              stepIndex: stepIndex,
              sequenceIndex: seqIndex,
              repeatIndex: r,
              countInStep: c + 1,
              totalInStep: step.count,
              sequenceTotalRepeat: seq.repeat,
              label: stitchDef?.label || 'Stitch',
              short: stitchDef?.short || 'ST',
              subIndex: k + 1,
              totalSub: countAs
            });
          }
        }
      });
    }
  });
  return flatStitches;
};

// --- Components ---

const StitchCard = ({ stitch, isCurrent, isNext, isPrev }) => {
  const styleInfo = STITCH_TYPES.find(t => t.id === stitch.type) || STITCH_TYPES[7];
  
  let scale = "scale-90 opacity-40 blur-[2px]";
  let position = "";
  
  if (isCurrent) {
    scale = "scale-100 opacity-100 z-10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)]";
  } else if (isPrev) {
    scale = "scale-90 opacity-30 -translate-x-6 rotate-[-6deg]";
  } else if (isNext) {
    scale = "scale-90 opacity-30 translate-x-6 rotate-[6deg]";
  } else {
    return null;
  }

  return (
    <div className={`transition-all duration-500 ease-out transform ${scale} ${position} flex flex-col items-center justify-center p-8 rounded-[2.5rem] border-4 border-dashed ${styleInfo.color} w-72 h-80 sm:w-80 sm:h-96 bg-white relative overflow-hidden`}>
      {/* Cute background decoration */}
      <div className={`absolute top-0 left-0 w-full h-4 opacity-20 ${styleInfo.color.split(' ')[0]}`} />
      
      <div className="text-xs font-bold uppercase tracking-widest mb-4 opacity-60 bg-white/50 px-3 py-1 rounded-full">
        Step {stitch.countInStep} of {stitch.totalInStep}
      </div>
      
      <div className="flex flex-col items-center mb-6 relative z-10">
        <div className="text-6xl sm:text-7xl font-black text-center leading-tight tracking-tight drop-shadow-sm text-stone-800">
          {styleInfo.short}
        </div>
        <div className="text-sm font-medium text-stone-400 mt-2">{styleInfo.label}</div>
        
        {stitch.totalSub > 1 && (
          <div className="mt-4 flex items-center gap-2 bg-stone-100 px-4 py-2 rounded-xl text-stone-600 font-bold text-sm">
            <span className="w-2 h-2 rounded-full bg-stone-400"></span>
            Count {stitch.subIndex} / {stitch.totalSub}
          </div>
        )}
      </div>

      <div className="absolute bottom-6 flex items-center gap-2 text-xs font-bold text-stone-400 bg-stone-50 px-4 py-2 rounded-full">
        <Repeat size={12} />
        Set {stitch.repeatIndex + 1} of {stitch.sequenceTotalRepeat}
      </div>
    </div>
  );
};

export default function App() {
  const [project, setProject] = useState(DEFAULT_PROJECT);
  const [activeRoundId, setActiveRoundId] = useState(null);
  const [currentStitchIndex, setCurrentStitchIndex] = useState(0);
  const [mode, setMode] = useState('setup'); 

  useEffect(() => {
    const saved = localStorage.getItem('crochet-app-data');
    if (saved) {
      try {
        setProject(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load saved data");
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('crochet-app-data', JSON.stringify(project));
  }, [project]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (mode !== 'play') return;
      if (e.code === 'Space' || e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        nextStitch();
      } else if (e.key === 'ArrowLeft') {
        prevStitch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, currentStitchIndex, activeRoundId, project]);

  const activeRound = project.rounds.find(r => r.id === activeRoundId);
  const flatStitches = activeRound ? flattenRound(activeRound) : [];
  const progress = flatStitches.length > 0 ? ((currentStitchIndex) / flatStitches.length) * 100 : 0;
  const isFinished = currentStitchIndex >= flatStitches.length;

  const nextStitch = () => {
    if (currentStitchIndex < flatStitches.length) setCurrentStitchIndex(prev => prev + 1);
  };

  const prevStitch = () => {
    if (currentStitchIndex > 0) setCurrentStitchIndex(prev => prev - 1);
  };

  const resetRound = () => {
    if (window.confirm("Start this round over?")) setCurrentStitchIndex(0);
  };

  const addRound = () => {
    const newRound = {
      id: generateId(),
      name: `Round ${project.rounds.length + 1}`,
      sequences: [{ id: generateId(), repeat: 1, steps: [{ type: 'sc', count: 1 }] }]
    };
    setProject({ ...project, rounds: [...project.rounds, newRound] });
    setActiveRoundId(newRound.id);
    setMode('setup');
  };

  const deleteRound = (id) => {
    if (window.confirm("Delete this round?")) {
      setProject({ ...project, rounds: project.rounds.filter(r => r.id !== id) });
      if (activeRoundId === id) setActiveRoundId(null);
    }
  };

  const updateRoundSequence = (roundId, seqIndex, field, value) => {
    const updatedRounds = project.rounds.map(r => {
      if (r.id !== roundId) return r;
      const newSeqs = [...r.sequences];
      newSeqs[seqIndex] = { ...newSeqs[seqIndex], [field]: value };
      return { ...r, sequences: newSeqs };
    });
    setProject({ ...project, rounds: updatedRounds });
  };

  const addStepToSequence = (roundId, seqIndex) => {
    const updatedRounds = project.rounds.map(r => {
      if (r.id !== roundId) return r;
      const newSeqs = [...r.sequences];
      newSeqs[seqIndex].steps.push({ type: 'inc', count: 1 });
      return { ...r, sequences: newSeqs };
    });
    setProject({ ...project, rounds: updatedRounds });
  };

  const updateStep = (roundId, seqIndex, stepIndex, field, value) => {
    const updatedRounds = project.rounds.map(r => {
      if (r.id !== roundId) return r;
      const newSeqs = [...r.sequences];
      const newSteps = [...newSeqs[seqIndex].steps];
      newSteps[stepIndex] = { ...newSteps[stepIndex], [field]: value };
      newSeqs[seqIndex] = { ...newSeqs[seqIndex], steps: newSteps };
      return { ...r, sequences: newSeqs };
    });
    setProject({ ...project, rounds: updatedRounds });
  };

  const removeStep = (roundId, seqIndex, stepIndex) => {
    const updatedRounds = project.rounds.map(r => {
      if (r.id !== roundId) return r;
      const newSeqs = [...r.sequences];
      const newSteps = newSeqs[seqIndex].steps.filter((_, i) => i !== stepIndex);
      newSeqs[seqIndex] = { ...newSeqs[seqIndex], steps: newSteps };
      return { ...r, sequences: newSeqs };
    });
    setProject({ ...project, rounds: updatedRounds });
  };

  const playRound = (id) => {
    setActiveRoundId(id);
    setMode('play');
    setCurrentStitchIndex(0);
  };

  // --- Render Functions ---

  const renderSetup = () => (
    <div className="max-w-3xl mx-auto pb-32">
      <div className="flex justify-between items-center mb-8 px-2">
        <div>
          <h2 className="text-3xl font-black text-stone-700 tracking-tight">Your Patterns</h2>
          <p className="text-stone-400 font-medium mt-1">Ready to craft something cute?</p>
        </div>
        <button 
          onClick={addRound}
          className="flex items-center gap-2 bg-rose-400 text-white px-5 py-3 rounded-2xl shadow-lg shadow-rose-200 hover:bg-rose-500 hover:scale-105 transition-all font-bold"
        >
          <Plus size={20} /> <span className="hidden sm:inline">Add Round</span>
        </button>
      </div>

      {project.rounds.length === 0 && (
        <div className="text-center py-16 bg-white rounded-[2rem] border-4 border-dashed border-stone-200 text-stone-400 mx-2">
          <div className="bg-stone-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Layers size={32} className="opacity-40" />
          </div>
          <p className="font-bold text-lg">No patterns yet!</p>
          <p className="text-sm mt-2 opacity-70">Tap "Add Round" to start your project</p>
        </div>
      )}

      <div className="space-y-6">
        {project.rounds.map((round) => (
          <div key={round.id} className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100 overflow-hidden transform transition hover:scale-[1.01]">
            {/* Round Header */}
            <div className="bg-rose-50/50 px-6 py-5 flex justify-between items-center border-b border-rose-100/50">
              <input 
                value={round.name}
                onChange={(e) => {
                  const newRounds = project.rounds.map(r => r.id === round.id ? { ...r, name: e.target.value } : r);
                  setProject({ ...project, rounds: newRounds });
                }}
                className="font-bold text-xl bg-transparent border-none focus:ring-0 text-stone-700 placeholder-stone-300 w-full"
                placeholder="Name this round..."
              />
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => deleteRound(round.id)}
                  className="w-10 h-10 flex items-center justify-center rounded-full text-stone-400 hover:bg-red-50 hover:text-red-400 transition"
                >
                  <Trash2 size={18} />
                </button>
                <button 
                  onClick={() => playRound(round.id)}
                  className="flex items-center gap-2 bg-emerald-400 text-white pl-4 pr-5 py-2.5 rounded-full font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-500 hover:shadow-xl transition-all active:scale-95"
                >
                  <Play size={18} fill="currentColor" /> Let's Stitch
                </button>
              </div>
            </div>

            {/* Sequences */}
            <div className="p-6 space-y-6">
              {round.sequences.map((seq, seqIdx) => (
                <div key={seq.id} className="relative pl-6 border-l-4 border-rose-200/60">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-rose-300 uppercase tracking-widest">
                        <Sparkles size={12} /> Sequence Pattern
                      </div>
                      
                      {/* Steps List */}
                      <div className="flex flex-wrap gap-2">
                        {seq.steps.map((step, stepIdx) => (
                          <div key={stepIdx} className="flex items-center bg-stone-50 rounded-2xl p-1.5 border border-stone-100">
                            <input 
                              type="number" 
                              min="1"
                              value={step.count}
                              onChange={(e) => updateStep(round.id, seqIdx, stepIdx, 'count', parseInt(e.target.value) || 0)}
                              className="w-12 p-2 bg-white rounded-xl text-center font-bold text-stone-700 border-none focus:ring-2 focus:ring-rose-200 text-sm"
                            />
                            <select 
                              value={step.type}
                              onChange={(e) => updateStep(round.id, seqIdx, stepIdx, 'type', e.target.value)}
                              className="mx-1 py-2 pl-2 pr-8 bg-transparent border-none focus:ring-0 text-sm font-medium text-stone-600 cursor-pointer"
                            >
                              {STITCH_TYPES.map(t => (
                                <option key={t.id} value={t.id}>{t.label}</option>
                              ))}
                            </select>
                            {seq.steps.length > 1 && (
                              <button 
                                onClick={() => removeStep(round.id, seqIdx, stepIdx)}
                                className="p-2 text-stone-300 hover:text-rose-400 transition rounded-full hover:bg-rose-50"
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>
                        ))}
                        
                        <button 
                          onClick={() => addStepToSequence(round.id, seqIdx)}
                          className="h-12 w-12 flex items-center justify-center rounded-2xl border-2 border-dashed border-rose-200 text-rose-300 hover:text-rose-500 hover:border-rose-400 hover:bg-rose-50 transition"
                        >
                          <Plus size={20} />
                        </button>
                      </div>
                    </div>

                    {/* Cute Repeater */}
                    <div className="bg-rose-50 p-4 rounded-3xl flex flex-col items-center justify-center min-w-[140px] border border-rose-100">
                      <span className="text-[10px] font-bold text-rose-400 uppercase mb-2 flex items-center gap-1">
                        Repeat Sequence
                      </span>
                      <div className="flex items-center gap-3">
                        <button 
                          className="w-8 h-8 rounded-full bg-white text-rose-400 shadow-sm flex items-center justify-center hover:bg-rose-100 hover:scale-110 transition font-bold"
                          onClick={() => updateRoundSequence(round.id, seqIdx, 'repeat', Math.max(1, seq.repeat - 1))}
                        >
                          -
                        </button>
                        <span className="text-2xl font-black text-stone-700">{seq.repeat}</span>
                        <button 
                          className="w-8 h-8 rounded-full bg-white text-rose-400 shadow-sm flex items-center justify-center hover:bg-rose-100 hover:scale-110 transition font-bold"
                          onClick={() => updateRoundSequence(round.id, seqIdx, 'repeat', seq.repeat + 1)}
                        >
                          +
                        </button>
                      </div>
                      <div className="mt-2 text-xs font-medium text-rose-400 bg-white/50 px-2 py-1 rounded-lg">
                        {seq.steps.reduce((acc, s) => {
                          const stitchDef = STITCH_TYPES.find(t => t.id === s.type);
                          return acc + (s.count * (stitchDef?.countAs || 1));
                        }, 0) * seq.repeat} sts total
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-stone-50/50 px-6 py-4 border-t border-stone-100 text-sm font-medium text-stone-400 flex justify-between items-center">
               <span className="flex items-center gap-2"><Scissors size={14} /> Round Total</span>
               <span className="bg-stone-200 text-stone-600 px-3 py-1 rounded-full text-xs font-bold">{flattenRound(round).length} Stitches</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPlay = () => {
    if (!activeRound) return null;

    const currentStitch = flatStitches[currentStitchIndex];
    const prevStitchData = currentStitchIndex > 0 ? flatStitches[currentStitchIndex - 1] : null;
    const nextStitchData = currentStitchIndex < flatStitches.length - 1 ? flatStitches[currentStitchIndex + 1] : null;

    return (
      <div className="fixed inset-0 bg-rose-50/80 flex flex-col z-50 backdrop-blur-sm">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md px-6 py-4 flex items-center justify-between z-20 shadow-sm">
          <button 
            onClick={() => setMode('setup')} 
            className="w-10 h-10 flex items-center justify-center rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 transition"
          >
            <X size={20} />
          </button>
          
          <div className="flex flex-col items-center">
            <div className="text-[10px] font-bold text-rose-400 tracking-widest uppercase">Currently Stitching</div>
            <div className="font-bold text-stone-800 text-lg truncate max-w-[200px]">{activeRound.name}</div>
          </div>
          
          <button 
            onClick={resetRound} 
            className="w-10 h-10 flex items-center justify-center rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 transition"
          >
            <RotateCcw size={18} />
          </button>
        </div>

        {/* Chunky Progress Bar */}
        <div className="px-6 py-4">
            <div className="h-4 bg-stone-200 w-full rounded-full overflow-hidden shadow-inner">
            <div 
                className="h-full bg-gradient-to-r from-rose-300 to-rose-400 transition-all duration-500 ease-out relative" 
                style={{ width: `${progress}%` }}
            >
                <div className="absolute top-0 left-0 w-full h-full bg-white opacity-20 animate-pulse"></div>
            </div>
            </div>
        </div>

        {/* Main Content Area - Clickable */}
        <div 
          className="flex-1 flex flex-col items-center justify-center relative overflow-hidden cursor-pointer select-none"
          onClick={nextStitch}
        >
          {isFinished ? (
            <div className="text-center animate-bounce-in p-8 max-w-sm mx-auto bg-white rounded-[3rem] shadow-xl border-4 border-stone-50">
              <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                <CheckCircle size={48} />
              </div>
              <h2 className="text-3xl font-black text-stone-800 mb-2">Round Complete!</h2>
              <p className="text-stone-400 font-medium mb-8">Yay! You finished {flatStitches.length} stitches perfectly.</p>
              <button 
                onClick={() => setMode('setup')}
                className="w-full bg-stone-800 text-white px-8 py-4 rounded-2xl font-bold shadow-lg hover:bg-stone-900 transition hover:scale-105 active:scale-95"
              >
                Back to Patterns
              </button>
            </div>
          ) : (
            <>
              {/* Previous Stitch Shadow */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none hidden md:block">
                 {prevStitchData && <StitchCard stitch={prevStitchData} isPrev />}
              </div>

              {/* Next Stitch Shadow */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 pointer-events-none hidden md:block">
                 {nextStitchData && <StitchCard stitch={nextStitchData} isNext />}
              </div>

              {/* Current Stitch */}
              <div className="relative z-10">
                <StitchCard stitch={currentStitch} isCurrent />
                
                <div className="mt-10 text-center text-rose-400/60 font-medium text-sm animate-pulse flex items-center justify-center gap-2">
                  <Sparkles size={14} /> Tap spacebar or screen to count
                </div>
              </div>

              {/* Total Progress Text */}
              <div className="absolute bottom-8 left-0 right-0 text-center">
                 <div className="inline-block bg-white/60 backdrop-blur-sm px-6 py-2 rounded-full text-stone-500 font-bold shadow-sm border border-white/50">
                    Total: {currentStitchIndex + 1} / {flatStitches.length}
                 </div>
              </div>
            </>
          )}
        </div>

        {/* Manual Controls Footer */}
        <div className="bg-white p-6 pb-8 flex justify-between items-center z-20 rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          <button 
            onClick={(e) => { e.stopPropagation(); prevStitch(); }}
            disabled={currentStitchIndex === 0}
            className="w-16 h-16 rounded-3xl bg-stone-100 text-stone-500 disabled:opacity-30 hover:bg-stone-200 transition flex items-center justify-center"
          >
            <ChevronLeft size={28} />
          </button>
          
          <div className="text-sm text-stone-400 font-bold uppercase tracking-wider">
             {Math.round(progress)}% Done
          </div>

          <button 
            onClick={(e) => { e.stopPropagation(); nextStitch(); }}
            disabled={isFinished}
            className="w-16 h-16 rounded-3xl bg-rose-400 text-white disabled:opacity-30 hover:bg-rose-500 shadow-lg shadow-rose-200 transition transform active:scale-90 flex items-center justify-center"
          >
            <ChevronRight size={28} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-orange-50/30 text-stone-800 font-sans selection:bg-rose-200 selection:text-rose-900">
      {mode === 'setup' && (
        <>
          <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-stone-100">
            <div className="max-w-3xl mx-auto px-6 h-20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-400 rounded-2xl rotate-3 flex items-center justify-center text-white shadow-lg shadow-rose-200">
                    <Heart size={20} fill="currentColor" />
                </div>
                <h1 className="font-black text-2xl tracking-tight text-stone-800">Crochet & Co.</h1>
              </div>
            </div>
          </nav>

          <main className="p-4 sm:p-6">
            {renderSetup()}
          </main>
        </>
      )}

      {mode === 'play' && renderPlay()}
    </div>
  );
}