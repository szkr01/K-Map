import React, { useMemo } from 'react';
import { CellState, KMapConfig, CellPosition, KMapTerm } from '../types';
import { getGrayCodeSequence, calculateCellIndex, formatCellState, getTermRects, getVarNames } from '../utils/logic';
import { HelpCircle, MousePointerClick } from 'lucide-react';

interface KMapGridProps {
  config: KMapConfig;
  cells: CellState[];
  groups: KMapTerm[];
  onCellClick: (index: number) => void;
  hoveredIndex: number | null;
  setHoveredIndex: (index: number | null) => void;
  focusedGroupIndex: number | null;
}

const GROUP_STYLES = [
  { border: 'border-red-500', bg: 'bg-red-500/10', text: 'text-red-600' },
  { border: 'border-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-600' },
  { border: 'border-green-500', bg: 'bg-green-500/10', text: 'text-green-600' },
  { border: 'border-amber-500', bg: 'bg-amber-500/10', text: 'text-amber-600' },
  { border: 'border-purple-500', bg: 'bg-purple-500/10', text: 'text-purple-600' },
  { border: 'border-pink-500', bg: 'bg-pink-500/10', text: 'text-pink-600' },
];

const KMapGrid: React.FC<KMapGridProps> = ({ 
  config, 
  cells, 
  groups,
  onCellClick, 
  hoveredIndex, 
  setHoveredIndex, 
  focusedGroupIndex
}) => {
  const rowGrayCodes = getGrayCodeSequence(config.rowVars.length);
  const colGrayCodes = getGrayCodeSequence(config.colVars.length);
  const varNames = useMemo(() => getVarNames(config.vars), [config.vars]);

  // Generate grid structure
  const gridCells = useMemo(() => {
    const grid: CellPosition[][] = [];
    for (let r = 0; r < config.rowCount; r++) {
      const rowArr: CellPosition[] = [];
      for (let c = 0; c < config.colCount; c++) {
        rowArr.push(calculateCellIndex(r, c, rowGrayCodes, colGrayCodes));
      }
      grid.push(rowArr);
    }
    return grid;
  }, [config, rowGrayCodes, colGrayCodes]);

  return (
    <div className="flex flex-col xl:flex-row items-start justify-center gap-8 w-full">
      
      {/* LEFT PANEL: Derivation Logic */}
      <div className="w-full xl:w-72 flex-shrink-0 order-2 xl:order-1 space-y-4">
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
             <h3 className="text-sm font-bold text-slate-700 mb-1">項の導出プロセス</h3>
             <p className="text-xs text-slate-500 leading-relaxed">
               グループ内で値が変化しない変数は残り、変化する(0と1両方)変数は消去されます。
             </p>
        </div>
        
        <div className="space-y-3">
            {groups.length === 0 && (
                <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                    <MousePointerClick className="mx-auto mb-2 opacity-50" size={24}/>
                    <p className="text-xs">1のセルを作成すると<br/>解説が表示されます</p>
                </div>
            )}
            
            {groups.map((group, idx) => {
                const style = GROUP_STYLES[idx % GROUP_STYLES.length];
                const isFocused = focusedGroupIndex === null || focusedGroupIndex === idx;
                
                return (
                    <div 
                        key={idx} 
                        className={`
                            bg-white rounded-xl border-2 transition-all duration-300 overflow-hidden
                            ${isFocused ? style.border : 'border-slate-100 opacity-40 grayscale'}
                            ${isFocused ? 'shadow-md translate-x-1' : ''}
                        `}
                    >
                        <div className={`px-3 py-2 border-b ${style.border} ${style.bg} border-opacity-20 flex justify-between items-center`}>
                            <span className={`text-xs font-bold ${style.text}`}>Group {idx + 1}</span>
                            <code className={`text-sm font-bold ${style.text}`}>{group.expression}</code>
                        </div>
                        <div className="p-2.5 grid gap-1.5">
                            {varNames.map((v, vIdx) => {
                                const bit = group.mask[vIdx];
                                if (bit === '-') {
                                    return (
                                        <div key={v} className="flex items-center text-xs justify-between group/row">
                                            <div className="flex items-center gap-2">
                                                <span className="w-5 h-5 flex items-center justify-center bg-slate-100 text-slate-400 rounded text-[10px] font-mono">0/1</span>
                                                <span className="text-slate-400 font-mono line-through decoration-slate-300">{v}</span>
                                            </div>
                                            <span className="text-[10px] text-slate-400">変化→消去</span>
                                        </div>
                                    );
                                }
                                const isZero = bit === '0';
                                return (
                                    <div key={v} className="flex items-center text-xs justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-5 h-5 flex items-center justify-center rounded text-[10px] font-mono font-bold ${isZero ? 'bg-slate-100 text-slate-600' : 'bg-brand-50 text-brand-600'}`}>
                                                {bit}
                                            </span>
                                            <span className="font-mono font-bold text-slate-700">
                                                {v}{isZero && "'"}
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-brand-600 font-medium">固定→残る</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )
            })}
        </div>
      </div>

      {/* RIGHT PANEL: K-Map Visualization */}
      <div className="flex flex-col items-center flex-grow order-1 xl:order-2 w-full">
        {/* Header Variables */}
        <div className="flex items-end mb-2 text-brand-600 font-mono text-sm sm:text-base">
          <div className="mr-2 font-bold">{config.rowVars.join('')} \ {config.colVars.join('')}</div>
        </div>

        <div className="overflow-x-auto max-w-full p-2 relative">
          <div className="grid gap-1 bg-slate-200 border-2 border-slate-300 rounded-lg shadow-lg relative p-1"
               style={{ 
                 gridTemplateColumns: `auto repeat(${config.colCount}, minmax(3.5rem, 1fr))`,
                 gridTemplateRows: `auto repeat(${config.rowCount}, auto)`,
               }}>
            
            {/* Top-left corner (empty) */}
            <div className="bg-slate-100 rounded-md" style={{ gridColumn: 1, gridRow: 1 }}></div>

            {/* Column Headers (Gray Codes) */}
            {colGrayCodes.map((code, i) => (
              <div 
                  key={`col-header-${i}`} 
                  className="bg-slate-100 text-slate-600 font-mono text-xs sm:text-sm p-2 flex items-center justify-center font-bold rounded-md"
                  style={{ gridColumn: i + 2, gridRow: 1 }}
              >
                {code}
              </div>
            ))}

            {/* Rows */}
            {gridCells.map((row, rIndex) => (
              <React.Fragment key={`row-${rIndex}`}>
                {/* Row Header */}
                <div 
                    className="bg-slate-100 text-slate-600 font-mono text-xs sm:text-sm p-2 flex items-center justify-center font-bold rounded-md"
                    style={{ gridColumn: 1, gridRow: rIndex + 2 }}
                >
                  {rowGrayCodes[rIndex]}
                </div>

                {/* Cells */}
                {row.map((cell) => {
                  const cellValue = cells[cell.index];
                  const isOne = cellValue === CellState.ONE;
                  const isDC = cellValue === CellState.DONT_CARE;
                  const isHovered = hoveredIndex === cell.index;

                  return (
                    <button
                      key={`cell-${cell.index}`}
                      onClick={() => onCellClick(cell.index)}
                      onMouseEnter={() => setHoveredIndex(cell.index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      className={`
                        relative h-12 sm:h-16 w-12 sm:w-16 flex items-center justify-center 
                        text-xl sm:text-2xl font-bold font-mono transition-all duration-200 rounded-md
                        ${isHovered ? 'ring-2 ring-brand-500 z-30' : 'z-10'}
                        ${isOne 
                          ? 'bg-white text-brand-600 font-extrabold hover:bg-brand-50' 
                          : isDC 
                            ? 'bg-slate-50 text-purple-600 font-bold hover:bg-purple-50'
                            : 'bg-slate-50 text-slate-300 hover:bg-slate-100'}
                      `}
                      style={{ gridRow: rIndex + 2, gridColumn: cell.col + 2 }}
                    >
                      {formatCellState(cellValue)}
                      
                      {/* Tiny index number */}
                      <span className="absolute bottom-0.5 right-1 text-[8px] sm:text-[10px] text-slate-400 font-sans opacity-70">
                        {cell.index}
                      </span>
                    </button>
                  );
                })}
              </React.Fragment>
            ))}

            {/* Group Visualization Overlay */}
            {groups.map((group, idx) => {
                const isFocused = focusedGroupIndex === idx || focusedGroupIndex === null;
                const opacityClass = focusedGroupIndex !== null && !isFocused ? 'opacity-10' : 'opacity-100';
                const style = GROUP_STYLES[idx % GROUP_STYLES.length];
                
                const { rects, rowWraps, colWraps } = getTermRects(group.mask, config.rowVars.length, config.colVars.length);

                const insetPx = 4 + (idx % 3) * 3; 

                return (
                    <React.Fragment key={`group-${idx}`}>
                        {rects.map((rect, rIdx) => {
                            const isLeftEdge = rect.colStart === 0;
                            const isRightEdge = rect.colEnd === config.colCount - 1;
                            const isTopEdge = rect.rowStart === 0;
                            const isBottomEdge = rect.rowEnd === config.rowCount - 1;

                            const noLeftBorder = colWraps && isLeftEdge;
                            const noRightBorder = colWraps && isRightEdge;
                            const noTopBorder = rowWraps && isTopEdge;
                            const noBottomBorder = rowWraps && isBottomEdge;

                            // Updated Border Radius (rounded-xl)
                            const roundedClass = `
                              ${noLeftBorder || noTopBorder ? 'rounded-tl-none' : 'rounded-tl-xl'}
                              ${noRightBorder || noTopBorder ? 'rounded-tr-none' : 'rounded-tr-xl'}
                              ${noLeftBorder || noBottomBorder ? 'rounded-bl-none' : 'rounded-bl-xl'}
                              ${noRightBorder || noBottomBorder ? 'rounded-br-none' : 'rounded-br-xl'}
                            `;
                            
                            // Updated Border Width (3px)
                            const borderClass = `
                               border-[3px]
                               ${noLeftBorder ? 'border-l-0' : 'border-l-[3px]'}
                               ${noRightBorder ? 'border-r-0' : 'border-r-[3px]'}
                               ${noTopBorder ? 'border-t-0' : 'border-t-[3px]'}
                               ${noBottomBorder ? 'border-b-0' : 'border-b-[3px]'}
                            `;

                            return (
                              <div
                                  key={`group-${idx}-rect-${rIdx}`}
                                  className={`
                                      pointer-events-none absolute z-20 
                                      transition-all duration-300 
                                      ${style.border} ${style.bg} ${opacityClass}
                                      ${borderClass} ${roundedClass}
                                  `}
                                  style={{
                                      gridRowStart: rect.rowStart + 2,
                                      gridRowEnd: rect.rowEnd + 3,
                                      gridColumnStart: rect.colStart + 2,
                                      gridColumnEnd: rect.colEnd + 3,
                                      top: `${insetPx}px`,
                                      bottom: `${insetPx}px`,
                                      left: `${insetPx}px`,
                                      right: `${insetPx}px`,
                                      margin: '0', 
                                      width: 'auto',
                                      height: 'auto'
                                  }}
                              />
                            );
                        })}
                    </React.Fragment>
                );
            })}

          </div>
        </div>
        
        <div className="mt-4 flex gap-4 text-xs sm:text-sm text-slate-600 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-brand-600 rounded-sm"></div>
            <span>1 (High)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-slate-200 border border-slate-300 rounded-sm"></div>
            <span>0 (Low)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-purple-200 rounded-sm"></div>
            <span>X (不定)</span>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-500 flex items-center gap-1">
          <HelpCircle size={12} /> クリックで切り替え: 0 → 1 → X → 0
        </p>
      </div>
    </div>
  );
};

export default KMapGrid;