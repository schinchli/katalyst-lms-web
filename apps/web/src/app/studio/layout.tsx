// Bypass the root body styling so the Sanity Studio can fill the full viewport.
export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
