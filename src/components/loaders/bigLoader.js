export default function BigLoader() {
  return (
    <div className="flex items-center justify-center gap-2 py-4" aria-label="Loading">
      <span className="h-4 w-4 animate-bounce rounded-full bg-rose-500 [animation-delay:-0.2s]" />
      <span className="h-4 w-4 animate-bounce rounded-full bg-amber-400 [animation-delay:-0.1s]" />
      <span className="h-4 w-4 animate-bounce rounded-full bg-emerald-500" />
    </div>
  );
}
  
