export function FAB({ onClick }: { onClick?: () => void }) {
    return (
        <button
            onClick={onClick}
            aria-label="Add transaction"
            className="fixed right-6 bottom-[calc(7rem+env(safe-area-inset-bottom))] w-14 h-14 bg-primary text-on-primary rounded-2xl shadow-2xl flex items-center justify-center active:scale-90 transition-transform z-40"
        >
            <span className="material-symbols-outlined text-2xl">add</span>
        </button>
    );
}
