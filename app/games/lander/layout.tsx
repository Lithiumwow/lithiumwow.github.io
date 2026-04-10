import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lunar Lander | Trance 24x7',
  description: 'Artemis-style lander with a local top-3 leaderboard.',
};

export default function LanderSectionLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
