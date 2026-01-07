import React, { useState, useEffect, useCallback, useMemo } from 'react';
import KMapGrid from './components/KMapGrid';
import TruthTable from './components/TruthTable';
import GeminiTutor from './components/GeminiTutor';
import { CellState, KMapConfig, VariableCount } from './types';
import { getKMapConfig, getSimplifiedExpression } from './utils/logic';
import { Cpu, RotateCcw, Share2, Grid3X3, Layers, Box } from 'lucide-react';

const App: React.FC = () => {
  const [variableCount, setVariableCount] = useState<VariableCount>(3);
  const [cells, setCells] = useState<CellState[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [focusedGroupIndex, setFocusedGroupIndex] = useState<number | null>(null);

  // Initialize or reset cells when variable count changes
  useEffect(() => {
    const totalCells = Math.pow(2, variableCount);
    setCells(new Array(totalCells).fill(CellState.ZERO));
  }, [variableCount]);

  const config: KMapConfig = getKMapConfig(variableCount);

  const toggleCell = useCallback((index: number) => {
    setCells(prev => {
      const newCells = [...prev];
      // Cycle: 0 -> 1 -> X -> 0
      const current = newCells[index];
      if (current === CellState.ZERO) newCells[index] = CellState.ONE;
      else if (current === CellState.ONE) newCells[index] = CellState.DONT_CARE;
      else newCells[index] = CellState.ZERO;
      return newCells;
    });
  }, []);

  const resetMap = () => {
    setCells(new Array(Math.pow(2, variableCount)).fill(CellState.ZERO));
  };

  // Calculate simplified expression in real-time
  const { expression: simplifiedExpression, terms } = useMemo(() => {
    return getSimplifiedExpression(cells, variableCount);
  }, [cells, variableCount]);

  const GROUP_TEXT_COLORS = [
    'text-red-600',
    'text-blue-600',
    'text-green-600',
    'text-amber-600',
    'text-purple-600',
    'text-pink-600',
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-brand-100">
      
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 backdrop-blur-md bg-opacity-80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-brand-500 p-2 rounded-lg shadow-md shadow-brand-500/20">
              <Cpu className="text-white" size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">
              K-Map <span className="text-brand-600">Master</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
             {/* Variable Selector */}
             <div className="hidden sm:flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button 
                  onClick={() => setVariableCount(2)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${variableCount === 2 ? 'bg-brand-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  2変数
                </button>
                <button 
                  onClick={() => setVariableCount(3)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${variableCount === 3 ? 'bg-brand-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  3変数
                </button>
                <button 
                  onClick={() => setVariableCount(4)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${variableCount === 4 ? 'bg-brand-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  4変数
                </button>
             </div>
             
             <a href="https://github.com" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-slate-600 transition-colors">
               <Share2 size={20} />
             </a>
          </div>
        </div>
      </nav>

      {/* Mobile Variable Selector */}
      <div className="sm:hidden px-4 py-3 bg-white border-b border-slate-200 flex justify-center gap-2 shadow-sm">
          {[2, 3, 4].map((v) => (
             <button
                key={v}
                onClick={() => setVariableCount(v as VariableCount)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium ${
                    variableCount === v 
                    ? 'bg-brand-50 border-brand-200 text-brand-700' 
                    : 'bg-white border-slate-200 text-slate-500'
                }`}
             >
                {v === 2 && <Box size={14} />}
                {v === 3 && <Layers size={14} />}
                {v === 4 && <Grid3X3 size={14} />}
                {v} 変数
             </button>
          ))}
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Col: K-Map Visualization */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xl shadow-slate-200/50">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800">カルノー図 (K-Map)</h2>
                        <p className="text-sm text-slate-500">グリッドをクリックして真理値を設定してください。</p>
                    </div>
                    <button 
                        onClick={resetMap}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-500 bg-slate-50 hover:bg-slate-100 hover:text-slate-700 rounded-md transition-colors border border-slate-200"
                    >
                        <RotateCcw size={14} /> リセット
                    </button>
                </div>

                <KMapGrid 
                  config={config} 
                  cells={cells} 
                  groups={terms}
                  onCellClick={toggleCell}
                  hoveredIndex={hoveredIndex}
                  setHoveredIndex={setHoveredIndex}
                  focusedGroupIndex={focusedGroupIndex}
                />
            </div>
            
            {/* Expression Preview */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-md">
                <div className="flex flex-col w-full">
                    <span className="text-xs text-slate-500 font-bold mb-2 uppercase tracking-wide">現在の論理式 (最小積和形)</span>
                    <div className="font-mono text-lg sm:text-xl font-medium break-all tracking-tight bg-slate-50 p-3 rounded-lg border border-slate-200 min-h-[3.5rem] flex flex-wrap items-center">
                        <span className="text-slate-400 mr-2 select-none">f =</span>
                        {terms.length === 0 && <span className="text-slate-600">{simplifiedExpression}</span>}
                        {terms.length > 0 && terms.map((term, i) => (
                           <React.Fragment key={i}>
                               {i > 0 && <span className="text-slate-400 mx-2">+</span>}
                               <span 
                                 className={`${GROUP_TEXT_COLORS[i % GROUP_TEXT_COLORS.length]} cursor-pointer hover:underline transition-all font-bold px-1 rounded hover:bg-slate-200/50`}
                                 onMouseEnter={() => setFocusedGroupIndex(i)}
                                 onMouseLeave={() => setFocusedGroupIndex(null)}
                               >
                                 {term.expression}
                               </span>
                           </React.Fragment>
                        ))}
                    </div>
                    {terms.length > 0 && (
                        <p className="text-xs text-slate-400 mt-2 text-right">※ 項にカーソルを合わせるとグループを強調表示します</p>
                    )}
                </div>
            </div>

            {/* AI Tutor Component */}
            <GeminiTutor cells={cells} vars={variableCount} />
          </div>

          {/* Right Col: Truth Table */}
          <div className="lg:col-span-5 h-full">
            <TruthTable 
               vars={variableCount} 
               cells={cells} 
               onRowClick={toggleCell}
               hoveredIndex={hoveredIndex}
               setHoveredIndex={setHoveredIndex}
            />
          </div>

        </div>
      </main>
      
    </div>
  );
};

export default App;
