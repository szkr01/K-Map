export type VariableCount = 2 | 3 | 4;

export enum CellState {
  ZERO = 0,
  ONE = 1,
  DONT_CARE = 2
}

export interface KMapConfig {
  vars: VariableCount;
  rowVars: string[]; // e.g., ['A', 'B']
  colVars: string[]; // e.g., ['C', 'D']
  rowCount: number;
  colCount: number;
}

export interface CellPosition {
  row: number;
  col: number;
  index: number; // The generic index (0 to 2^n - 1) based on standard binary order
  grayRow: string; // Binary string for row (Gray code)
  grayCol: string; // Binary string for col (Gray code)
}

export interface KMapTerm {
  mask: string;
  minterms: number[];
  expression: string;
  colorIndex?: number;
}

export interface SimplificationResult {
  expression: string;
  terms: KMapTerm[];
}
