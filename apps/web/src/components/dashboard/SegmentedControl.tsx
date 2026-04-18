import { useState } from 'react';
import clsx from 'clsx';

export function SegmentedControl() {
    const [active, setActive] = useState('Monthly');
    const options = ['Daily', 'Weekly', 'Monthly'];

    return (
        <div className="flex bg-surface-container rounded-2xl p-1 shadow-sm w-full">
            {options.map((option) => (
                <button
                    key={option}
                    onClick={() => setActive(option)}
                    className={clsx(
                        "flex-1 py-2 text-sm font-semibold rounded-xl transition-all duration-300",
                        active === option
                            ? "bg-white text-primary shadow-md"
                            : "text-on-surface-variant hover:bg-slate-50/50"
                    )}
                >
                    {option}
                </button>
            ))}
        </div>
    );
}
