import React, { useState } from 'react';
import { CellState, VariableCount } from '../types';
import { explainKMap } from '../services/geminiService';
import { Bot, Sparkles, AlertTriangle, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface GeminiTutorProps {
  cells: CellState[];
  vars: VariableCount;
}

const GeminiTutor: React.FC<GeminiTutorProps> = ({ cells, vars }) => {
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExplain = async () => {
    setLoading(true);
    setExplanation(null);
    setError(null);

    // Basic heuristic: check if at least one 1 exists
    if (!cells.includes(CellState.ONE) && !cells.includes(CellState.DONT_CARE)) {
        setLoading(false);
        setExplanation("マップが空（すべて0）です。論理式は **0** になります。");
        return;
    }

    try {
      const result = await explainKMap(cells, vars);
      setExplanation(result);
    } catch (e) {
      setError("解説の取得に失敗しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col shadow-lg">
      <div className="p-4 bg-gradient-to-r from-brand-50 to-white border-b border-slate-200 flex justify-between items-center">
        <div className="flex items-center gap-2 text-brand-700">
          <Bot className="text-brand-500" size={24} />
          <h2 className="font-semibold text-lg">AI 論理回路チューター</h2>
        </div>
        {!process.env.API_KEY && (
             <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded border border-red-200 flex items-center gap-1">
                <AlertTriangle size={12}/> APIキー未設定
             </span>
        )}
      </div>

      <div className="p-6 flex flex-col gap-4">
        {!explanation && !loading && (
          <div className="text-center py-8 text-slate-500">
            <p className="mb-4 text-sm">上のKマップを設定して、AIに簡略化と解説を依頼しましょう。</p>
            <button
              onClick={handleExplain}
              disabled={!process.env.API_KEY}
              className={`
                group relative inline-flex items-center justify-center px-6 py-3 overflow-hidden font-medium text-white transition duration-300 ease-out rounded-lg shadow-md
                ${!process.env.API_KEY ? 'bg-slate-300 cursor-not-allowed' : 'bg-brand-600 hover:bg-brand-500 cursor-pointer shadow-brand-200'}
              `}
            >
              <span className="flex items-center gap-2">
                <Sparkles size={18} />
                解説を作成する
              </span>
            </button>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-10 text-brand-500 animate-pulse">
            <Loader2 className="animate-spin mb-3" size={32} />
            <span className="text-sm font-medium">論理式を分析・簡略化しています...</span>
          </div>
        )}

        {explanation && (
          <div className="bg-slate-50 rounded-lg p-5 text-slate-700 text-sm leading-relaxed border border-slate-200">
            <div className="prose prose-sm max-w-none prose-slate">
                <ReactMarkdown>{explanation}</ReactMarkdown>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200 flex justify-end">
                <button 
                    onClick={handleExplain}
                    className="text-xs text-brand-600 hover:text-brand-500 flex items-center gap-1 font-medium"
                >
                    <Sparkles size={12}/> 再生成
                </button>
            </div>
          </div>
        )}

        {error && (
           <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
              <AlertTriangle size={16} />
              {error}
           </div>
        )}
      </div>
    </div>
  );
};

export default GeminiTutor;
