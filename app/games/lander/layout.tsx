import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lunar Lander | Harry Bradrocco',
  description: 'Artemis-style lander with a local top-3 leaderboard.',
};

export default function LanderSectionLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
