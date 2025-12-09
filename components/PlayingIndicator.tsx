export default function PlayingIndicator({
  isVisible = false,
  isPlaying = false
}) {
  const barClass = isVisible && isPlaying ? 'bg-white' : 'bg-transparent';

  return (
    <div className="flex items-center justify-center gap-0.5 w-4">
      <div className={`w-0.5 h-3 ${barClass} animate-analyzer-bar-1`}></div>
      <div className={`w-0.5 h-3 ${barClass} animate-analyzer-bar-2`}></div>
      <div className={`w-0.5 h-3 ${barClass} animate-analyzer-bar-3`}></div>
      <div className={`w-0.5 h-3 ${barClass} animate-analyzer-bar-4`}></div>
    </div>
  );
}
