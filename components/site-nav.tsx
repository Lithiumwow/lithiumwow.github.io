import Link from 'next/link';

import { cn } from '@/lib/utils';

type SiteNavProps = {
  className?: string;
};

export function SiteNav({ className }: SiteNavProps) {
  return (
    <nav
      className={cn(
        'fixed top-4 right-4 z-50 flex max-w-[min(100%-2rem,calc(100vw-2rem))] flex-wrap items-center justify-end gap-x-4 gap-y-2 text-sm',
        className,
      )}
      aria-label="Site links"
    >
      <Link
        href="/"
        className="text-muted-foreground transition-colors hover:text-accent"
      >
        Radio
      </Link>
      <Link
        href="/games/lander/"
        className="text-muted-foreground transition-colors hover:text-accent"
      >
        Lander
      </Link>
      <a
        href="/photography/"
        className="text-muted-foreground transition-colors hover:text-accent"
      >
        Photography
      </a>
    </nav>
  );
}
