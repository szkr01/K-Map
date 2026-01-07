import { GoogleGenAI } from "@google/genai";
import { CellState, VariableCount } from "../types";
import { getMintermString, getDontCareString } from "../utils/logic";

const getSystemPrompt = () => `
あなたはデジタル論理回路の先生です。カルノー図（K-Map）について、初心者にもわかりやすく日本語で解説することが目標です。
最小項（minterm）のセットが与えられた場合、以下の手順で回答してください：

1. 式を簡略化するために見つけた「グループ（主項）」を特定してリストアップしてください。
2. なぜそのグループを選んだのか（例：「四隅の1をまとめました」など）を簡潔に説明してください。
3. 最終的な簡略化された論理式（ブール代数式）を提示してください。
4. 解説は教育的かつ簡潔にまとめてください。
5. 表記法: NOT Aは A'、A AND Bは AB、A OR Bは A+B と表記してください。
`;

export const explainKMap = async (
  cells: CellState[],
  variableCount: VariableCount
): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please set process.env.API_KEY.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const minterms = getMintermString(cells);
  const dontCares = getDontCareString(cells);
  
  // Quick optimization: If map is empty or full
  const allZero = cells.every(c => c === CellState.ZERO);
  const allOne = cells.every(c => c === CellState.ONE);
  
  if (allZero) return "マップはすべて 0 です。出力は常に論理 0 (False) となります。";
  if (allOne) return "マップはすべて 1 です。出力は常に論理 1 (True) となります。";

  const prompt = `
    ${variableCount}変数のカルノー図があります。
    変数は ${variableCount === 2 ? 'A, B' : variableCount === 3 ? 'A, B, C' : 'A, B, C, D'} です。
    
    関数は次のように定義されています: f = ${minterms} ${dontCares}
    
    このK-Mapをステップバイステップで簡略化してください。日本語で回答してください。
    
    1. 見つけたグループをリストアップ（例：「グループ1: インデックス 0,1,4,5」）。
    2. 各グループに対応する項。
    3. 最終的な論理式。
    
    出力はMarkdown形式で整形し、最終的な答えは太字にしてください。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: getSystemPrompt(),
      }
    });

    return response.text || "解説を生成できませんでした。";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "AIチューターへの接続エラーが発生しました。APIキーを確認するか、後でもう一度お試しください。";
  }
};