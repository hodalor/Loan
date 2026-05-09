export default function DefaultLoader() {
  return (
    <div className="flex items-center justify-center gap-1.5" aria-label="Loading">
      <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-rose-500 [animation-delay:-0.2s]" />
      <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-amber-400 [animation-delay:-0.1s]" />
      <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-emerald-500" />
    </div>
  );
}
