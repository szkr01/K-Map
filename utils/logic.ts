import { CellState, KMapConfig, VariableCount, CellPosition, KMapTerm, SimplificationResult } from '../types';

// Standard Gray Codes
const GRAY_CODE_2 = ["00", "01", "11", "10"];
const GRAY_CODE_1 = ["0", "1"];

export const getKMapConfig = (vars: VariableCount): KMapConfig => {
  switch (vars) {
    case 2:
      return {
        vars: 2,
        rowVars: ['A'],
        colVars: ['B'],
        rowCount: 2,
        colCount: 2
      };
    case 3:
      return {
        vars: 3,
        rowVars: ['A'],
        colVars: ['B', 'C'],
        rowCount: 2,
        colCount: 4
      };
    case 4:
      return {
        vars: 4,
        rowVars: ['A', 'B'],
        colVars: ['C', 'D'],
        rowCount: 4,
        colCount: 4
      };
  }
};

export const getGrayCodeSequence = (bitCount: number): string[] => {
  if (bitCount === 1) return GRAY_CODE_1;
  if (bitCount === 2) return GRAY_CODE_2;
  return [];
};

export const calculateCellIndex = (
  row: number, 
  col: number, 
  rowGrayCodes: string[], 
  colGrayCodes: string[]
): CellPosition => {
  const rowBin = rowGrayCodes[row];
  const colBin = colGrayCodes[col];
  const binaryString = rowBin + colBin;
  const index = parseInt(binaryString, 2);

  return {
    row,
    col,
    index,
    grayRow: rowBin,
    grayCol: colBin
  };
};

export const formatCellState = (state: CellState): string => {
  switch (state) {
    case CellState.ZERO: return '0';
    case CellState.ONE: return '1';
    case CellState.DONT_CARE: return 'X';
  }
};

export const getMintermString = (cells: CellState[]): string => {
  const ones = cells.map((val, idx) => val === CellState.ONE ? idx : -1).filter(i => i !== -1);
  return `Σm(${ones.join(', ')})`;
};

export const getDontCareString = (cells: CellState[]): string => {
  const dcs = cells.map((val, idx) => val === CellState.DONT_CARE ? idx : -1).filter(i => i !== -1);
  if (dcs.length === 0) return '';
  return ` + d(${dcs.join(', ')})`;
};

// --- Simplification Logic (Quine-McCluskey basic implementation) ---

interface InternalTerm {
  mask: string;     // e.g. "01-1"
  minterms: number[]; // covered minterms
  used: boolean;
}

export const getVarNames = (vars: VariableCount): string[] => {
  if (vars === 2) return ['A', 'B'];
  if (vars === 3) return ['A', 'B', 'C'];
  return ['A', 'B', 'C', 'D'];
};

const termToString = (mask: string, vars: VariableCount): string => {
  const names = getVarNames(vars);
  let res = "";
  for (let i = 0; i < mask.length; i++) {
    if (mask[i] !== '-') {
      res += names[i];
      if (mask[i] === '0') res += "'";
    }
  }
  return res === "" ? "1" : res;
};

const combineTerms = (t1: InternalTerm, t2: InternalTerm): InternalTerm | null => {
  let diff = 0;
  let resMask = "";
  for (let i = 0; i < t1.mask.length; i++) {
    if (t1.mask[i] !== t2.mask[i]) {
      diff++;
      resMask += "-";
    } else {
      resMask += t1.mask[i];
    }
  }
  
  if (diff === 1) {
    return {
      mask: resMask,
      minterms: Array.from(new Set([...t1.minterms, ...t2.minterms])).sort((a, b) => a - b),
      used: false
    };
  }
  return null;
};

export const getSimplifiedExpression = (cells: CellState[], vars: VariableCount): SimplificationResult => {
  const minterms: number[] = [];
  const dontCares: number[] = [];
  
  cells.forEach((cell, index) => {
    if (cell === CellState.ONE) minterms.push(index);
    else if (cell === CellState.DONT_CARE) dontCares.push(index);
  });

  if (minterms.length === 0) return { expression: "0", terms: [] };
  
  const allIndices = [...minterms, ...dontCares];
  if (allIndices.length === Math.pow(2, vars)) {
      return { 
          expression: "1", 
          terms: [{ mask: '-'.repeat(vars), minterms: allIndices, expression: "1", colorIndex: 0 }] 
      };
  }

  // 1. Initial groups
  let terms: InternalTerm[] = allIndices.map(m => ({
    mask: m.toString(2).padStart(vars, '0'),
    minterms: [m],
    used: false
  }));

  const primeImplicants: InternalTerm[] = [];

  // 2. Iteratively combine
  let currentTerms = terms;
  while (currentTerms.length > 0) {
    const nextTerms: InternalTerm[] = [];
    const mergedMasks = new Set<string>();

    for (let i = 0; i < currentTerms.length; i++) {
      for (let j = i + 1; j < currentTerms.length; j++) {
        const combined = combineTerms(currentTerms[i], currentTerms[j]);
        if (combined) {
          currentTerms[i].used = true;
          currentTerms[j].used = true;
          if (!mergedMasks.has(combined.mask)) {
            nextTerms.push(combined);
            mergedMasks.add(combined.mask);
          }
        }
      }
    }

    currentTerms.forEach(t => {
      if (!t.used) {
        if (!primeImplicants.some(pi => pi.mask === t.mask)) {
          primeImplicants.push(t);
        }
      }
    });

    currentTerms = nextTerms;
  }

  // 3. Find Essential PIs & Greedy Cover
  let uncoveredMinterms = new Set(minterms);
  const finalTerms: InternalTerm[] = [];

  const coverageMap = new Map<number, InternalTerm[]>();
  minterms.forEach(m => coverageMap.set(m, []));

  primeImplicants.forEach(pi => {
    pi.minterms.forEach(m => {
      if (coverageMap.has(m)) {
        coverageMap.get(m)?.push(pi);
      }
    });
  });

  // Essential PIs
  coverageMap.forEach((pis, m) => {
    if (pis.length === 1) {
      const essentialPI = pis[0];
      if (!finalTerms.includes(essentialPI)) {
        finalTerms.push(essentialPI);
        essentialPI.minterms.forEach(covered => uncoveredMinterms.delete(covered));
      }
    }
  });

  // Greedy
  while (uncoveredMinterms.size > 0) {
    let bestPI: InternalTerm | null = null;
    let maxCovered = -1;

    const candidates = primeImplicants.filter(pi => !finalTerms.includes(pi));
    if (candidates.length === 0) break;

    candidates.forEach(pi => {
      const count = pi.minterms.filter(m => uncoveredMinterms.has(m)).length;
      if (count > maxCovered) {
        maxCovered = count;
        bestPI = pi;
      }
    });

    if (bestPI && maxCovered > 0) {
      finalTerms.push(bestPI);
      (bestPI as InternalTerm).minterms.forEach(m => uncoveredMinterms.delete(m));
    } else {
        break; 
    }
  }

  // 4. Format Output with Terms
  const sortedTerms = finalTerms.sort((a, b) => {
      const strA = termToString(a.mask, vars);
      const strB = termToString(b.mask, vars);
      return strA.length - strB.length || strA.localeCompare(strB);
  });

  const kmapTerms: KMapTerm[] = sortedTerms.map((t, idx) => ({
    mask: t.mask,
    minterms: t.minterms,
    expression: termToString(t.mask, vars),
    colorIndex: idx
  }));

  return {
      expression: kmapTerms.map(t => t.expression).join(' + '),
      terms: kmapTerms
  };
};

// --- Visualization Helper ---

// Returns a list of rectangle ranges [start, end] for grid indices
const getRanges = (maskPart: string, grayCodes: string[]): Array<[number, number]> => {
  const matches: number[] = [];
  grayCodes.forEach((code, idx) => {
    let match = true;
    for (let i = 0; i < maskPart.length; i++) {
      if (maskPart[i] !== '-' && maskPart[i] !== code[i]) {
        match = false;
        break;
      }
    }
    if (match) matches.push(idx);
  });

  if (matches.length === 0) return [];

  matches.sort((a, b) => a - b);
  
  const ranges: Array<[number, number]> = [];
  let start = matches[0];
  let prev = matches[0];

  for (let i = 1; i < matches.length; i++) {
    // Check if contiguous
    if (matches[i] === prev + 1) {
        prev = matches[i];
    } else {
        ranges.push([start, prev]);
        start = matches[i];
        prev = matches[i];
    }
  }
  ranges.push([start, prev]);
  return ranges;
};

export interface GridRect {
    rowStart: number;
    rowEnd: number;
    colStart: number;
    colEnd: number;
}

export const getTermRects = (mask: string, rowVarCount: number, colVarCount: number): { rects: GridRect[], rowWraps: boolean, colWraps: boolean } => {
    const rowMask = mask.slice(0, rowVarCount);
    const colMask = mask.slice(rowVarCount);

    const rowGray = getGrayCodeSequence(rowVarCount);
    const colGray = getGrayCodeSequence(colVarCount);

    const rowRanges = getRanges(rowMask, rowGray);
    const colRanges = getRanges(colMask, colGray);

    // Check wrapping
    // If we have more than one range, it might be a wrap.
    // Specifically for K-Map:
    // If ranges are e.g. [0,0] and [3,3] for length 4, it wraps.
    // If ranges are [0,1] and [2,3], it's just the whole row (idx 0 to 3).
    
    // Logic: 
    // - A term in K-Map always forms a power-of-2 block (1, 2, 4 cells etc) in the toroidal grid.
    // - `getRanges` returns sorted segments.
    // - If we have multiple segments, it usually implies wrapping OR the term covers the whole axis but getRanges split it?
    //   Actually `getRanges` joins contiguous. So `0,1,2,3` becomes `[0,3]`.
    //   If we have `[0,0]` and `[3,3]`, that is a wrap.
    
    const isRowWrap = rowRanges.length > 1 && rowRanges[0][0] === 0 && rowRanges[rowRanges.length-1][1] === (1 << rowVarCount) - 1;
    const isColWrap = colRanges.length > 1 && colRanges[0][0] === 0 && colRanges[colRanges.length-1][1] === (1 << colVarCount) - 1;

    const rects: GridRect[] = [];

    rowRanges.forEach(rRange => {
        colRanges.forEach(cRange => {
            rects.push({
                rowStart: rRange[0],
                rowEnd: rRange[1],
                colStart: cRange[0],
                colEnd: cRange[1]
            });
        });
    });

    return {
        rects,
        rowWraps: isRowWrap,
        colWraps: isColWrap
    };
};
