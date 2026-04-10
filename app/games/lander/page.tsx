import { LanderGame } from '@/components/lander-game';

export default function LanderPage() {
  return (
    <div className="min-h-screen w-full bg-background text-foreground flex items-start justify-center p-4 py-16">
      <div className="w-full max-w-md pt-6">
        <LanderGame />
      </div>
    </div>
  );
}
