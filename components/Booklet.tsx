import React, { useState, useEffect } from 'react';
import { BookletData, WeatherType } from '../types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import WeatherBackground from './WeatherBackground';
import { ArrowLeft, ArrowRight, MapPin, Calendar, DollarSign, Clock, Plane, Bed, Utensils, Camera, ShoppingBag, Sparkles, ChevronRight, ChevronLeft } from 'lucide-react';

interface BookletProps {
  data: BookletData;
  onReset: () => void;
}

// Expanded high-contrast color palette
const COLORS = [
  '#ef4444', // Red (Airfare?)
  '#3b82f6', // Blue (Housing?)
  '#10b981', // Emerald (Food?)
  '#f59e0b', // Amber (Shopping?)
  '#8b5cf6', // Violet (Gifts?)
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#6366f1', // Indigo
  '#d946ef', // Fuchsia
  '#14b8a6', // Teal
  '#f97316', // Orange
];

const HighlightCarousel = ({ highlights }: { highlights: string[] }) => {
  const [index, setIndex] = useState(0);

  const next = () => setIndex((i) => (i + 1) % highlights.length);
  const prev = () => setIndex((i) => (i - 1 + highlights.length) % highlights.length);

  // Auto-advance
  useEffect(() => {
    const timer = setInterval(next, 8000); // 8 seconds per highlight
    return () => clearInterval(timer);
  }, [highlights.length]);

  return (
    <div className="flex flex-col w-full min-h-[320px] bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden text-white relative group shadow-2xl ring-1 ring-black/5">
      <div className="bg-black/20 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-300" />
            <h3 className="font-bold uppercase tracking-widest text-sm text-white/90">Daily Highlights</h3>
        </div>
        <div className="flex gap-1">
            {highlights.map((_, i) => (
            <div 
                key={i} 
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === index ? 'bg-white' : 'bg-white/30'}`}
            />
            ))}
        </div>
      </div>
      
      <div className="flex-1 relative flex items-center justify-center p-8 md:p-10">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30 pointer-events-none" />
        
        <p className="text-xl md:text-2xl font-serif italic leading-relaxed text-center w-full drop-shadow-md relative z-10 transition-all duration-500 ease-in-out">
          "{highlights[index]}"
        </p>

        {/* Navigation Overlays */}
        {highlights.length > 1 && (
            <>
                <button 
                    onClick={prev}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-3 rounded-full hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100 z-20"
                >
                    <ChevronLeft className="w-6 h-6 text-white/90" />
                </button>
                <button 
                    onClick={next}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100 z-20"
                >
                    <ChevronRight className="w-6 h-6 text-white/90" />
                </button>
            </>
        )}
      </div>
    </div>
  );
};

const Booklet: React.FC<BookletProps> = ({ data, onReset }) => {
  const [currentPage, setCurrentPage] = useState(0);

  // Total pages = 1 (Cover) + days
  const totalPages = 1 + data.days.length;

  const handleNext = () => {
    if (currentPage < totalPages - 1) setCurrentPage(p => p + 1);
  };

  const handlePrev = () => {
    if (currentPage > 0) setCurrentPage(p => p - 1);
  };

  const renderCover = () => (
    <div className="flex w-full h-full bg-stone-900 text-white relative overflow-hidden">
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-rose-900/30 to-transparent pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex-1 flex flex-col justify-center p-12 md:p-20 relative z-10">
        <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-1 bg-rose-500"></div>
            <span className="text-rose-400 font-mono tracking-widest uppercase text-sm">Trip Report</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 leading-tight">
          {data.destination}
        </h1>
        <p className="text-stone-400 text-lg max-w-md">
          A curated itinerary of adventures, flavors, and memories.
        </p>
      </div>

      <div className="w-1/3 min-w-[350px] bg-stone-800/50 backdrop-blur-sm border-l border-white/5 flex flex-col p-8">
        <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-6 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-rose-500" /> Budget Overview
        </h3>
        <div className="flex-1 relative">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                <Pie
                    data={data.spendBreakdown as any}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="amount"
                    nameKey="category"
                    stroke="none"
                >
                    {data.spendBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip 
                    formatter={(value: number) => `$${value.toLocaleString()}`}
                    contentStyle={{ backgroundColor: '#1c1917', borderRadius: '12px', border: 'none', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                />
                <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    formatter={(value) => <span className="text-xs text-stone-300 font-medium ml-1">{value}</span>}
                />
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                <span className="text-xs text-stone-500 uppercase tracking-widest">Total</span>
                <span className="text-2xl font-bold text-white">${data.totalSpend.toLocaleString()}</span>
            </div>
        </div>
      </div>
    </div>
  );

  const getEventIcon = (desc: string) => {
      const lower = desc.toLowerCase();
      if (lower.includes('flight') || lower.includes('airport') || lower.includes('train')) return <Plane className="w-4 h-4" />;
      if (lower.includes('hotel') || lower.includes('check-in') || lower.includes('room')) return <Bed className="w-4 h-4" />;
      if (lower.includes('eat') || lower.includes('dinner') || lower.includes('lunch') || lower.includes('breakfast') || lower.includes('food')) return <Utensils className="w-4 h-4" />;
      if (lower.includes('shop') || lower.includes('store') || lower.includes('mall')) return <ShoppingBag className="w-4 h-4" />;
      return <Camera className="w-4 h-4" />;
  };

  const renderDayPage = (dayIndex: number) => {
    const day = data.days[dayIndex];
    return (
      <WeatherBackground weather={day.weather}>
        <div className="flex flex-col h-full p-6 md:p-10 relative z-10 text-stone-800">
            {/* Header */}
            <div className="flex items-end justify-between mb-8 shrink-0">
                <div>
                    <span className="text-xs font-bold uppercase tracking-widest opacity-60 mb-1 block">Day {dayIndex + 1}</span>
                    <h2 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 drop-shadow-sm">{day.date}</h2>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 min-h-0">
                
                {/* Left Column: Schedule (Scrollable) */}
                <div className="h-full flex flex-col bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 overflow-hidden">
                    <div className="p-4 border-b border-stone-100/50 bg-white/40 shrink-0">
                         <h3 className="text-sm font-bold uppercase tracking-wider text-stone-600 flex items-center gap-2">
                            <Clock className="w-4 h-4" /> Schedule
                        </h3>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {day.events.map((event, idx) => {
                            const timeStr = event.time || '';
                            const timeParts = timeStr.split(' ');
                            const mainTime = timeParts[0] || '';
                            const ampm = timeParts[1] || '';

                            return (
                                <div key={idx} className="flex gap-4 p-3 rounded-xl hover:bg-white/60 transition-colors group">
                                    <div className="flex flex-col items-center min-w-[60px] pt-1">
                                        <span className="text-sm font-bold text-stone-600 font-mono">{mainTime}</span>
                                        <span className="text-[10px] text-stone-400 font-mono uppercase leading-none">{ampm}</span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5 p-1.5 rounded-lg bg-stone-100 text-stone-600 group-hover:bg-rose-100 group-hover:text-rose-600 transition-colors">
                                                {getEventIcon(event.description)}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-stone-800 text-sm md:text-base leading-snug">{event.description}</p>
                                                {event.location && (
                                                    <p className="flex items-center gap-1 text-xs text-stone-500 mt-1">
                                                        <MapPin className="w-3 h-3" />
                                                        {event.location}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {day.events.length === 0 && (
                             <div className="text-center p-12 text-stone-400 italic text-sm">Free day! No events scheduled.</div>
                        )}
                        {/* Bottom padding to prevent last item from feeling cramped */}
                        <div className="h-4"></div>
                    </div>
                </div>

                {/* Right Column: Highlights Carousel (Centered) */}
                <div className="h-full flex flex-col justify-center">
                    <HighlightCarousel highlights={day.highlights && day.highlights.length > 0 ? day.highlights : ["Enjoying the local atmosphere and relaxing."]} />
                </div>
            </div>
        </div>
      </WeatherBackground>
    );
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-neutral-900 p-4 md:p-8">
      
      {/* Slide Container (16:9 Aspect Ratio) */}
      <div className="w-full max-w-7xl aspect-video bg-stone-50 rounded-3xl shadow-2xl overflow-hidden relative flex flex-col ring-1 ring-white/10">
        
        {/* Content Area */}
        <div className="flex-1 relative overflow-hidden">
             {currentPage === 0 ? renderCover() : renderDayPage(currentPage - 1)}
        </div>

        {/* Navigation Bar (Floating at bottom) */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-6 z-50">
           <button 
                onClick={handlePrev} 
                disabled={currentPage === 0}
                className="w-12 h-12 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
            >
                <ArrowLeft className="w-5 h-5" />
           </button>

           <div className="bg-black/40 backdrop-blur-md text-white/90 px-4 py-2 rounded-full text-sm font-mono tracking-widest border border-white/10">
                {currentPage === 0 ? 'START' : `${currentPage} / ${totalPages - 1}`}
           </div>

           {currentPage < totalPages - 1 ? (
                <button 
                    onClick={handleNext}
                    className="w-12 h-12 rounded-full bg-white text-black hover:bg-stone-200 flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg"
                >
                    <ArrowRight className="w-5 h-5" />
                </button>
           ) : (
               <button 
                    onClick={onReset}
                    className="px-6 h-12 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold uppercase tracking-wider text-xs shadow-lg flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                >
                    Finish
               </button>
           )}
        </div>

      </div>
    </div>
  );
};

export default Booklet;