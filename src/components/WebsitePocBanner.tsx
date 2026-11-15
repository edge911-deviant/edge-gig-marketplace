// Keep the original mobile app on main. The overhaul is a separate branch and
// preview deployment; this link is the only connection between their UIs.
// Renew its Firebase preview channel before expiry to preserve the URL.
export function WebsitePocBanner() {
  return (
    <aside aria-label="Website overhaul preview" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-b border-black/15 bg-[#d7ff3f] px-4 py-3 text-center text-xs font-medium text-black">
      <strong className="font-mono uppercase tracking-wider">Website POC</strong>
      <span>Explore the website redesign with sample content.</span>
      <a
        className="font-bold underline underline-offset-4"
        href="https://edge-gig-marketplace--website-poc-0mrk8o41.web.app/"
        target="_blank"
        rel="noopener noreferrer"
      >
        Open website preview ↗
      </a>
    </aside>
  );
}
