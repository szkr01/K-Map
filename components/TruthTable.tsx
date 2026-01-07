import React from 'react';
import { CellState, VariableCount } from '../types';
import { formatCellState } from '../utils/logic';

interface TruthTableProps {
  vars: VariableCount;
  cells: CellState[];
  onRowClick: (index: number) => void;
  hoveredIndex: number | null;
  setHoveredIndex: (index: number | null) => void;
}

const TruthTable: React.FC<TruthTableProps> = ({ 
  vars, 
  cells, 
  onRowClick,
  hoveredIndex,
  setHoveredIndex
}) => {
  // Generate headers: A, B, (C, D), Output
  const headers = [];
  if (vars >= 2) { headers.push('A'); headers.push('B'); }
  if (vars >= 3) headers.push('C');
  if (vars >= 4) headers.push('D');
  headers.push('F');

  // Generate binary data for all possible combinations 0 to 2^n - 1
  const rowData = Array.from({ length: Math.pow(2, vars) }, (_, i) => {
    // Create binary string padded to var length (e.g., 5 -> "101" -> ['1','0','1'])
    const binary = i.toString(2).padStart(vars, '0').split('');
    return {
      index: i,
      inputs: binary,
      output: cells[i]
    };
  });

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-slate-200 shadow-md overflow-hidden max-h-[500px]">
      <div className="bg-slate-100 p-3 border-b border-slate-200">
        <h3 className="text-sm font-semibold text-slate-700">真理値表 (Truth Table)</h3>
      </div>
      
      <div className="overflow-y-auto flex-1">
        <table className="w-full text-center text-sm">
          <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="py-2 px-1 text-slate-400 font-mono text-xs w-8">#</th>
              {headers.map((h, i) => (
                <th key={h} className={`py-2 px-2 text-slate-600 font-mono ${h === 'F' ? 'text-brand-600 font-bold border-l border-slate-200' : ''}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rowData.map((row) => {
               const isHovered = hoveredIndex === row.index;
               const outputVal = row.output;
               
               return (
                <tr 
                  key={row.index} 
                  className={`
                    cursor-pointer transition-colors duration-150 font-mono
                    ${isHovered ? 'bg-brand-50' : 'hover:bg-slate-50'}
                  `}
                  onMouseEnter={() => setHoveredIndex(row.index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => onRowClick(row.index)}
                >
                  <td className="py-1 text-slate-400 text-xs">{row.index}</td>
                  {row.inputs.map((bit, j) => (
                    <td key={j} className="py-1 text-slate-600">{bit}</td>
                  ))}
                  <td className={`
                    py-1 font-bold border-l border-slate-100
                    ${outputVal === CellState.ONE ? 'text-brand-600' : 
                      outputVal === CellState.DONT_CARE ? 'text-purple-500' : 'text-slate-400'}
                  `}>
                    {formatCellState(outputVal)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TruthTable;