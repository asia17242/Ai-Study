import React, { useTransition } from 'react';
import { Trash2 } from 'lucide-react';

interface ClearButtonProps {
    onClear: () => Promise<void> | void;
}

export default function ClearButton({ onClear }: ClearButtonProps) {
    const [isPending, startTransition] = useTransition();

    const handleClick = () => {
        startTransition(async () => {
            await onClear();
        });
    };

    return (
        <button
            onClick={handleClick}
            disabled={isPending}
            className="absolute top-6 right-6 z-50 flex items-center gap-2 px-4 py-2 bg-red-500/90 hover:bg-red-600 disabled:bg-gray-400 text-white text-sm font-semibold rounded-full shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 backdrop-blur-sm ring-1 ring-white/20"
            title="清除儀表板數據"
        >
            <Trash2 
                size={16} 
                strokeWidth={2.5} 
                className={isPending ? "animate-spin" : ""} 
            />
            <span>{isPending ? "正在清除..." : "一鍵清除"}</span>
        </button>
    );
}