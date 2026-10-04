import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, BookOpen } from 'lucide-react';
import { Subject } from '../types';

interface SubjectSelectProps {
  subjects: Subject[];
  selectedSubject: Subject | null;
  onSelect: (subject: Subject) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export const SubjectSelect: React.FC<SubjectSelectProps> = ({
  subjects,
  selectedSubject,
  onSelect,
  className = '',
  size = 'md',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const isSmall = size === 'sm';

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-full font-semibold transition-all duration-200 outline-none ${
          isSmall
            ? 'px-3 py-1.5 text-xs bg-slate-900/90 hover:bg-slate-800/90 border border-white/10'
            : 'px-4 py-2 text-xs bg-slate-900/80 hover:bg-slate-850 border border-white/15 shadow-xl backdrop-blur-xl'
        }`}
        style={{
          boxShadow: selectedSubject
            ? `0 4px 20px ${selectedSubject.color}15, inset 0 1px 0 rgba(255,255,255,0.1)`
            : undefined,
        }}
      >
        {selectedSubject ? (
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
            style={{
              backgroundColor: selectedSubject.color,
              boxShadow: `0 0 8px ${selectedSubject.color}99`,
            }}
          />
        ) : (
          <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        )}

        <span className="truncate max-w-[140px] text-slate-100 font-medium tracking-wide">
          {selectedSubject?.name || 'Select subject'}
        </span>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-white' : ''
          }`}
        />
      </button>

      {/* Pop-up List */}
      {isOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 p-1.5 bg-slate-950/95 border border-white/15 rounded-2xl shadow-2xl backdrop-blur-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/5 mb-1 flex items-center justify-between">
            <span>Study Subjects</span>
            <span className="text-[9px] text-slate-400 font-normal">({subjects.length})</span>
          </div>

          <div className="max-h-56 overflow-y-auto space-y-0.5 custom-scroll">
            {subjects.map((sub) => {
              const isSelected = selectedSubject?.id === sub.id;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => {
                    onSelect(sub);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-white/10 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: sub.color,
                        boxShadow: isSelected ? `0 0 8px ${sub.color}` : 'none',
                      }}
                    />
                    <span className="truncate">{sub.name}</span>
                  </div>

                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-rose-400 shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
