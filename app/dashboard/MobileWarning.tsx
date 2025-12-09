export default function MobileWarning() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 space-y-6 text-center sm:hidden bg-muted/50">
      <div className="flex flex-row items-center justify-center gap-4 text-center">
        <img src="/favicon.png" alt="MixFlip" className="size-16" />
        <h1 className="text-4xl font-bold">MixFlip</h1>
      </div>
      <p className="">
        For the time being, MixFlip is only available on desktop. We're sorry
        for the inconvenience.
      </p>
    </div>
  );
}
