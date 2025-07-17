import React, { useRef } from 'react';
import { Plus, Minus, Lock, Unlock } from 'lucide-react';

interface NumberStepperProps {
  value: number;
  onChange: (val: number | ((prev: number) => number)) => void;
  locked: boolean;
  onToggleLock: () => void;
  className?: string;
  showLock?: boolean;
}

const NumberStepper: React.FC<NumberStepperProps> = ({ value, onChange, locked, onToggleLock, className='', showLock = true }) => {
  const intervalRef = useRef<NodeJS.Timeout>();
  const stepRef = useRef(1);

  const change = (delta: number) => {
    onChange((prev: number) => prev + delta);
  };

  const start = (dir: number) => {
    change(dir);
    stepRef.current = 1;
    intervalRef.current = setInterval(() => {
      const step = stepRef.current;
      change(dir * step);
      if (stepRef.current < 10) stepRef.current += 1;
      else if (stepRef.current < 100) stepRef.current += 10;
    }, 200);
  };

  const stop = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <button type="button" onMouseDown={() => start(-1)} onMouseUp={stop} onMouseLeave={stop} className="px-1 py-0.5 border rounded" aria-label="Diminuer">
        <Minus size={14} />
      </button>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        className="w-20 px-2 py-1 border rounded text-center bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
      />
      <button type="button" onMouseDown={() => start(1)} onMouseUp={stop} onMouseLeave={stop} className="px-1 py-0.5 border rounded" aria-label="Augmenter">
        <Plus size={14} />
      </button>
      {showLock && (
        <button type="button" onClick={onToggleLock} className="ml-1 text-gray-600 dark:text-gray-300" aria-label="Verrouiller">
          {locked ? <Lock size={16} /> : <Unlock size={16} />}
        </button>
      )}
    </div>
  );
};

export default NumberStepper;
