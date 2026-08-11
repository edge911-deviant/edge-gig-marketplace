export function assertFirebaseAppArtifact(html) {
  const moduleScripts = html.match(/<script\b[^>]*>/gi) ?? [];
  const hasApplicationBundle = moduleScripts.some((tag) => (
    /\btype=["']module["']/i.test(tag)
    && /\bsrc=["']\/assets\/index-[^"']+\.js["']/i.test(tag)
  ));

  if (!hasApplicationBundle || !/<div\b[^>]*\bid=["']root["'][^>]*>/i.test(html)) {
    throw new Error('Firebase Hosting artifact is missing the compiled EDGE application bundle.');
  }

  if (
    html.includes("window.location.replace('https://edge-gig-marketplace.web.app/')")
    || /http-equiv=["']refresh["'][^>]+edge-gig-marketplace\.web\.app/i.test(html)
  ) {
    throw new Error('Refusing to deploy the GitHub Pages forwarder as the Firebase Hosting application.');
  }
}
