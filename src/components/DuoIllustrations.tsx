import React, { useState } from 'react';
import {
  Coffee,
  BookOpen,
  FileText,
  CreditCard,
  Printer,
  Cpu,
  MapPin,
} from 'lucide-react';

/**
 * 3D Mascot & Sculptural Intelligence Visuals
 * Uses the user's provided 3D lime character with glasses (/assets/aistudio/image_99fcca0a.png)
 * instead of the clock with the hand!
 */
export const SculpturalRibbonSphere: React.FC = () => {
  const [mouseOffset, setMouseOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 16;
    const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 16;
    setMouseOffset({ x: nx, y: ny });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setMouseOffset({ x: 0, y: 0 })}
      className="relative w-full max-w-[540px] mx-auto flex items-center justify-center select-none"
    >
      <div
        className="w-full rounded-[28px] overflow-hidden border-2 border-[#08090B] shadow-[0_8px_0_#08090B,0_20px_40px_rgba(8,9,11,0.22)] bg-[#08090B] transition-transform duration-200 ease-out animate-duo-float"
        style={{
          transform: `translate(${mouseOffset.x * 0.5}px, ${mouseOffset.y * 0.5}px)`,
        }}
      >
        <img
          src="/assets/aistudio/image_99fcca0a.png"
          alt="TIME TAX 3D Intelligence Mascot and Live Metrics"
          referrerPolicy="no-referrer"
          className="w-full h-auto block object-cover"
        />
      </div>
    </div>
  );
};

/**
 * Friendly 3D Lime Mascot with Glasses from /assets/aistudio/image_99fcca0a.png
 * Replaces the SVG clock with the waving hand across all pages and headers!
 */
export const TickyMascot: React.FC<{ size?: number; mood?: 'happy' | 'fast' | 'celebrate' }> = ({
  size = 110,
}) => {
  return (
    <div
      className="relative inline-flex items-center justify-center select-none shrink-0 animate-duo-pop"
      style={{ width: size, height: size }}
    >
      <div className="w-full h-full rounded-full overflow-hidden border-2 border-[#08090B] shadow-[0_4px_0_#08090B] bg-[#08090B] flex items-center justify-center animate-duo-float">
        <img
          src="/assets/aistudio/image_99fcca0a.png"
          alt="TIME TAX Mascot"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center scale-[2.15]"
        />
      </div>
    </div>
  );
};

/**
 * Illustrated Queue Shrink Visual
 */
export const QueueShrinkIllustration: React.FC = () => {
  return (
    <div className="flex items-center justify-center gap-3 py-2 select-none" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`w-12 h-12 rounded-2xl border-2 border-[#08090B] shadow-[0_3px_0_#08090B] flex items-center justify-center font-mono font-extrabold text-sm animate-duo-float ${
            i === 0
              ? 'bg-[#CDF22B] text-[#08090B]'
              : i === 1
              ? 'bg-[#ECFFB6] text-[#08090B]'
              : 'bg-white text-[#08090B]'
          }`}
          style={{ animationDelay: `${i * 0.2}s` }}
        >
          {i === 0 ? '2m' : i === 1 ? '5m' : '10m'}
        </div>
      ))}
    </div>
  );
};

/**
 * Friendly Category Illustration Badge for Campus Areas
 */
export const AreaCategoryBadge: React.FC<{ category: string; size?: 'sm' | 'md' | 'lg' }> = ({
  category,
  size = 'md',
}) => {
  const lower = category.toLowerCase();
  let bg = 'bg-[#CDF22B] text-[#08090B]';
  let Icon = MapPin;

  if (lower.includes('dining') || lower.includes('food') || lower.includes('canteen')) {
    bg = 'bg-[#D6FB00] text-[#08090B]';
    Icon = Coffee;
  } else if (lower.includes('academic') || lower.includes('library')) {
    bg = 'bg-[#CDF22B] text-[#08090B]';
    Icon = BookOpen;
  } else if (lower.includes('admin') || lower.includes('student')) {
    bg = 'bg-[#ECFFB6] text-[#08090B]';
    Icon = FileText;
  } else if (lower.includes('finance') || lower.includes('fee')) {
    bg = 'bg-[#00545F] text-[#FAF8F3]';
    Icon = CreditCard;
  } else if (lower.includes('print')) {
    bg = 'bg-[#ECFFB6] text-[#08090B]';
    Icon = Printer;
  } else if (lower.includes('lab') || lower.includes('innovation')) {
    bg = 'bg-[#08090B] text-[#CDF22B]';
    Icon = Cpu;
  }

  const dims =
    size === 'lg'
      ? 'w-14 h-14 rounded-2xl'
      : size === 'sm'
      ? 'w-10 h-10 rounded-xl'
      : 'w-12 h-12 rounded-2xl';

  const iconDims = size === 'lg' ? 'w-7 h-7' : size === 'sm' ? 'w-5 h-5' : 'w-6 h-6';

  return (
    <div
      className={`${dims} ${bg} border-2 border-[#08090B] shadow-[0_3px_0_#08090B] flex items-center justify-center shrink-0`}
    >
      <Icon className={iconDims} />
    </div>
  );
};
