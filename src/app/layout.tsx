import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Railcross - GitHub Branch Protection Scheduler',
  description:
    'Prevent teams from merging pull requests outside of merge windows by automatically locking branch protection rules.',
  robots: 'noindex, nofollow',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
