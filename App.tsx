import React, { useState } from 'react';
import { InputForm } from './components/InputForm';
import { ResultsDashboard } from './components/ResultsDashboard';
import { calculateTax } from './taxCalculator';
import { generateStrategies } from './strategyEngine';
import { generateNarratives } from './services/geminiService';
import { AppState, TaxInputs, TaxStrategy } from './types';
import { Loader2, TrendingDown } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    step: 'input',
    inputs: null,
    taxResult: null,
    strategies: [],
    error: null,
  });

  const handleSubmit = async (inputs: TaxInputs) => {
    setState(prev => ({ ...prev, step: 'calculating', inputs, error: null }));

    try {
      // Step 1: Deterministic tax calculation (synchronous)
      const taxResult = calculateTax(inputs);

      // Step 2: Rule-based strategy selection (synchronous)
      const baseStrategies = generateStrategies(inputs, taxResult);

      // Step 3: Show results immediately with strategies in "loading narrative" state
      // Strategies get narrative: undefined to indicate loading
      const strategiesWithLoadingState: TaxStrategy[] = baseStrategies.map(s => ({
        ...s,
        narrative: undefined,
      }));

      setState({
        step: 'results',
        inputs,
        taxResult,
        strategies: strategiesWithLoadingState,
        error: null,
      });

      // Step 4: Fetch AI narratives asynchronously (non-blocking)
      const narratives = await generateNarratives(
        inputs.stateCode,
        taxResult.marginalRateLabel,
        inputs.filingStatus,
        inputs.rsuShares > 0,
        baseStrategies.map(s => ({ id: s.id, title: s.title })),
      );

      // Step 5: Patch strategies with AI narratives (empty string = use static description)
      setState(prev => ({
        ...prev,
        strategies: prev.strategies.map(s => ({
          ...s,
          narrative: narratives[s.id] ?? '',
        })),
      }));
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        step: 'input',
        error: err.message || 'Something went wrong. Please try again.',
      }));
    }
  };

  const handleReset = () => {
    setState({
      step: 'input',
      inputs: null,
      taxResult: null,
      strategies: [],
      error: null,
    });
  };

  if (state.step === 'calculating') {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-stone-800">Analyzing your tax situation...</h2>
          <p className="text-stone-500 mt-2">Calculating federal and state taxes, RSU impact, and strategies.</p>
        </div>
      </div>
    );
  }

  if (state.step === 'results' && state.taxResult && state.inputs) {
    return (
      <div className="min-h-screen bg-stone-50 font-sans">
        <header className="bg-white border-b border-stone-200 py-4 px-6 md:px-12 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow">
              <TrendingDown className="text-white w-5 h-5" />
            </div>
            <span className="text-lg font-bold text-stone-900 tracking-tight">TaxSaver</span>
          </div>
          <span className="text-xs text-stone-400">2024 Tax Year · For educational use only</span>
        </header>
        <main className="px-4 md:px-8 py-8">
          <ResultsDashboard
            inputs={state.inputs}
            result={state.taxResult}
            strategies={state.strategies}
            onReset={handleReset}
          />
        </main>
      </div>
    );
  }

  // Input step
  return (
    <div className="min-h-screen bg-stone-50 font-sans flex flex-col">
      <header className="bg-white border-b border-stone-200 py-4 px-6 md:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow">
            <TrendingDown className="text-white w-5 h-5" />
          </div>
          <span className="text-lg font-bold text-stone-900 tracking-tight">TaxSaver</span>
        </div>
        <span className="text-xs text-stone-400">2024 Tax Year</span>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="text-center mb-10 max-w-xl">
          <h1 className="text-4xl md:text-5xl font-bold text-stone-900 leading-tight mb-4">
            Pay less tax,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
              keep more of what you earn.
            </span>
          </h1>
          <p className="text-lg text-stone-500 leading-relaxed">
            Enter your income, RSU vesting, and location to see your estimated tax bill and a personalized
            set of tax-saving strategies — all calculated privately in your browser.
          </p>
        </div>

        {state.error && (
          <div className="mb-6 w-full max-w-2xl bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-sm text-red-700">
            {state.error}
          </div>
        )}

        <InputForm onSubmit={handleSubmit} />

        <p className="text-xs text-stone-400 mt-6 text-center max-w-md">
          No data is sent to our servers. All tax calculations run locally in your browser.
          For educational purposes only — not financial or tax advice.
        </p>
      </main>
    </div>
  );
};

export default App;
