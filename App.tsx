import React, { useState, useRef } from 'react';
import { parseItinerary } from './services/geminiService';
import Booklet from './components/Booklet';
import { BookletData, AppState } from './types';
import { SAMPLE_DATA } from './constants';
import { TEMPLATE_CSV, README_CONTENT } from './assets';
import { Loader2, Wand2, FileSpreadsheet, DollarSign, Upload, FileText, X, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

const App: React.FC = () => {
  const [input, setInput] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [state, setState] = useState<AppState>({
    step: 'input',
    data: null,
    error: null,
  });

  const cleanCSV = (csvData: string): string => {
    // Split by new line, filter out lines that contain only commas or whitespace
    return csvData
      .split('\n')
      .filter(line => {
        // Remove all commas and whitespace, check if anything remains
        const content = line.replace(/,/g, '').trim();
        return content.length > 0;
      })
      .join('\n');
  };

  const processFile = async (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (e) => {
      const data = e.target?.result;
      if (!data) return;

      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        try {
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const rawCsv = XLSX.utils.sheet_to_csv(sheet);
          const cleanedCsv = cleanCSV(rawCsv);
          setInput(cleanedCsv);
        } catch (err) {
            setState(prev => ({...prev, error: "Failed to parse Excel file."}));
        }
      } else {
        // Assume CSV/Text
        const rawText = data as string;
        const cleanedText = cleanCSV(rawText);
        setInput(cleanedText);
      }
    };

    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      reader.readAsBinaryString(file);
    } else {
      reader.readAsText(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleGenerate = async () => {
    if (!input.trim()) return;

    setState(prev => ({ ...prev, step: 'loading', error: null }));

    try {
      const data = await parseItinerary(input);
      setState({ step: 'view', data, error: null });
    } catch (err: any) {
      setState({
        step: 'input',
        data: null,
        error: err.message || "Something went wrong. Please check your API key and input.",
      });
    }
  };

  const loadSample = () => {
    setInput(cleanCSV(SAMPLE_DATA));
    setFileName("sample_thailand_trip.csv");
  };

  const clearFile = () => {
      setInput('');
      setFileName(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (state.step === 'loading') {
    return (
      <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center p-4">
        <div className="text-center">
            <Loader2 className="w-12 h-12 text-rose-500 animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-serif font-bold text-stone-800">Crafting your summary...</h2>
            <p className="text-stone-500 mt-2">Analyzing costs, predicting weather, and writing highlights.</p>
        </div>
      </div>
    );
  }

  if (state.step === 'view' && state.data) {
    return <Booklet data={state.data} onReset={() => setState({ step: 'input', data: null, error: null })} />;
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans text-stone-900">
      
      {/* Header */}
      <header className="bg-white border-b border-stone-200 py-6 px-6 md:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-500 rounded-lg flex items-center justify-center shadow-lg transform -rotate-3">
                <FileSpreadsheet className="text-white w-6 h-6" />
            </div>
            <h1 className="text-2xl font-serif font-bold tracking-tight">Travel Summary Generator</h1>
        </div>
        <a href="https://ai.google.dev/" target="_blank" rel="noreferrer" className="text-xs font-medium text-stone-400 hover:text-stone-600 transition-colors">
            Powered by Gemini
        </a>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 max-w-5xl mx-auto w-full">
        
        <div className="text-center mb-10 max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-stone-800 mb-4 leading-tight">
                Turn your spreadsheet <br/> <span className="text-rose-500 italic">into a story.</span>
            </h2>
            <p className="text-lg text-stone-600 leading-relaxed">
                Transform your spreadsheet itinerary into a polished, interactive travel summary. Visualize your budget, organize daily schedules, and enjoy AI-curated highlights—perfect for sharing with travel companions or keeping as a digital keepsake.
            </p>
        </div>

        <div className="w-full max-w-3xl flex flex-col gap-6">
            
            {/* Action Bar: Downloads */}
            <div className="flex justify-center gap-4">
                <button 
                    onClick={() => downloadFile(TEMPLATE_CSV, 'itinerary_template.csv', 'text/csv')}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-lg text-sm font-medium text-stone-600 hover:text-rose-600 hover:border-rose-200 shadow-sm transition-all"
                >
                    <Download className="w-4 h-4" />
                    Download Template
                </button>
                <button 
                    onClick={() => downloadFile(README_CONTENT, 'README.txt', 'text/plain')}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-lg text-sm font-medium text-stone-600 hover:text-rose-600 hover:border-rose-200 shadow-sm transition-all"
                >
                    <FileText className="w-4 h-4" />
                    Formatting Instructions
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-stone-200 p-6 md:p-8">
                
                {/* File Upload Area */}
                {!input ? (
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer transition-all ${
                            isDragging ? 'border-rose-500 bg-rose-50' : 'border-stone-300 hover:border-rose-400 hover:bg-stone-50'
                        }`}
                    >
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            accept=".csv, .xlsx, .xls" 
                            className="hidden" 
                        />
                        <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-4">
                            <Upload className="w-8 h-8 text-stone-400" />
                        </div>
                        <p className="text-lg font-medium text-stone-700">Click to upload or drag and drop</p>
                        <p className="text-sm text-stone-400 mt-2">Supports .CSV, .XLSX, .XLS</p>
                    </div>
                ) : (
                    <div className="border border-stone-200 rounded-xl p-6 bg-stone-50 relative">
                        <button onClick={clearFile} className="absolute top-4 right-4 text-stone-400 hover:text-red-500">
                            <X className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center">
                                <FileText className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-stone-800">{fileName || "Raw Data Input"}</h3>
                                <p className="text-xs text-stone-500">{input.length} characters loaded</p>
                            </div>
                        </div>
                        <div className="max-h-32 overflow-y-auto p-3 bg-white border border-stone-200 rounded-lg text-xs font-mono text-stone-500 whitespace-pre-wrap">
                            {input.slice(0, 500)}...
                        </div>
                    </div>
                )}
                
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6">
                    <button 
                        onClick={loadSample}
                        className="text-sm font-medium text-stone-500 hover:text-rose-600 underline underline-offset-4 transition-colors"
                    >
                        Load sample data
                    </button>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        {state.error && (
                            <span className="text-sm text-red-500 font-medium">{state.error}</span>
                        )}
                        <button
                            onClick={handleGenerate}
                            disabled={!input.trim()}
                            className="w-full md:w-auto px-8 py-3 bg-rose-600 hover:bg-rose-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg shadow-rose-200 transition-all flex items-center justify-center gap-2"
                        >
                            <Wand2 className="w-5 h-5" />
                            Generate Summary
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 w-full text-stone-600 max-w-4xl">
            <div className="flex flex-col items-center text-center p-4">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3">
                    <FileSpreadsheet className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-stone-800 mb-1">Smart Parsing</h3>
                <p className="text-sm">Automatically finds locations and dates from messy spreadsheet data.</p>
            </div>
            <div className="flex flex-col items-center text-center p-4">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
                    <DollarSign className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-stone-800 mb-1">Cost Breakdown</h3>
                <p className="text-sm">Visualizes spending from columns I, K, and L instantly.</p>
            </div>
             <div className="flex flex-col items-center text-center p-4">
                <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mb-3">
                    <Wand2 className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-stone-800 mb-1">AI Enrichment</h3>
                <p className="text-sm">Generates daily highlights and weather predictions for a better experience.</p>
            </div>
        </div>

      </main>
    </div>
  );
};

export default App;