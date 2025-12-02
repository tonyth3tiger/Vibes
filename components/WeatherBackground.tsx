import React, { useEffect, useState } from 'react';
import { WeatherType } from '../types';
import { Cloud, CloudRain, Sun, Snowflake } from 'lucide-react';

interface WeatherBackgroundProps {
  weather: WeatherType;
  children: React.ReactNode;
}

const WeatherBackground: React.FC<WeatherBackgroundProps> = ({ weather, children }) => {
  const [raindrops, setRaindrops] = useState<number[]>([]);

  useEffect(() => {
    if (weather === WeatherType.Rainy) {
      setRaindrops(Array.from({ length: 50 }, (_, i) => i));
    } else {
      setRaindrops([]);
    }
  }, [weather]);

  const getBackgroundClass = () => {
    switch (weather) {
      case WeatherType.Sunny:
        return 'bg-gradient-to-br from-blue-400 via-sky-300 to-yellow-100 text-slate-800';
      case WeatherType.Rainy:
        return 'bg-gradient-to-b from-slate-700 to-slate-500 text-white';
      case WeatherType.Cloudy:
        return 'bg-gradient-to-br from-slate-300 to-gray-400 text-slate-800';
      case WeatherType.Snowy:
        return 'bg-gradient-to-b from-blue-100 to-white text-slate-700';
      default:
        return 'bg-white text-black';
    }
  };

  const getIcon = () => {
    switch (weather) {
        case WeatherType.Sunny: return <Sun className="w-8 h-8 text-yellow-500 animate-spin-slow" />;
        case WeatherType.Rainy: return <CloudRain className="w-8 h-8 text-blue-200" />;
        case WeatherType.Cloudy: return <Cloud className="w-8 h-8 text-gray-600" />;
        case WeatherType.Snowy: return <Snowflake className="w-8 h-8 text-blue-300 animate-pulse" />;
    }
  }

  return (
    <div className={`relative w-full h-full overflow-hidden transition-all duration-700 ${getBackgroundClass()}`}>
      {/* Weather Animation Layers */}
      {weather === WeatherType.Rainy && (
        <div className="absolute inset-0 pointer-events-none z-0">
          {raindrops.map((i) => (
            <div
              key={i}
              className="rain-drop"
              style={{
                left: `${Math.random() * 100}%`,
                animationDuration: `${0.5 + Math.random() * 0.5}s`,
                animationDelay: `${Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}
      
      {weather === WeatherType.Sunny && (
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-yellow-300 rounded-full blur-3xl opacity-40 animate-pulse" />
      )}

      {/* Content Layer */}
      <div className="relative z-10 w-full h-full flex flex-col">
        <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full shadow-sm">
            <span className="text-sm font-medium">{weather}</span>
            {getIcon()}
        </div>
        {children}
      </div>
    </div>
  );
};

export default WeatherBackground;