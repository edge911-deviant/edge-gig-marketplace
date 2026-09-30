import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
  Check,
  Compass,
  Radio,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  UsersRound,
  UserRoundSearch,
} from 'lucide-react';
import { MotionConfig, motion } from 'motion/react';
import { GlitchWord, SignalCursor, SiteMotionControl, SiteScrollProgress, useSiteMotion } from './website/SiteMotion';
import { StageVisual } from './website/StageVisual';
import { RoleCircuit } from './website/RoleCircuit';
import { DiscoveryBoard } from './website/DiscoveryBoard';
import { HelpNode } from './website/HelpNode';
import './website/website.css';

const EDGE_MARK_SRC = `${import.meta.env.BASE_URL}edge-app-icon-transparent.png`;


const steps = [
  {
    number: '01',
    title: 'Publish a clear brief',
    body: 'Organisers and venues set the date, place, genre, budget and performance requirements up front.',
    icon: BriefcaseBusiness,
  },
  {
    number: '02',
    title: 'Find the right signal',
    body: 'Artists search real opportunities, filter by genre and apply once with their profile attached.',
    icon: Search,
  },
  {
    number: '03',
    title: 'Choose with context',
    body: 'Applications, fit, history and the gig brief stay together so organisers can decide clearly.',
    icon: UserRoundSearch,
  },
  {
    number: '04',
    title: 'Close the trust loop',
    body: 'Bookings become discoverable live signals for audiences, while completion and reviews build trust.',
    icon: CalendarCheck,
  },
];

type PublicLandingPageProps = {
  onSignIn: () => void;
  authError?: string | null;
  busy?: boolean;
  isSignedIn?: boolean;
  onOpenWorkspace?: () => void;
};

export function PublicLandingPage({
  onSignIn,
  authError,
  busy = false,
  isSignedIn = false,
  onOpenWorkspace,
}: PublicLandingPageProps) {
  const primaryAction = isSignedIn && onOpenWorkspace ? onOpenWorkspace : onSignIn;
  const primaryLabel = isSignedIn ? 'Open workspace' : 'Join EDGE';
  const siteMotion = useSiteMotion();

  return (
    <MotionConfig reducedMotion={siteMotion.enabled ? 'user' : 'always'}>
    <div className="public-site min-h-screen overflow-x-clip bg-[#f8f7f4] text-[#0a0a0a]" data-motion={siteMotion.enabled ? 'active' : 'paused'}>
      <SignalCursor enabled={siteMotion.enabled} />
      <SiteScrollProgress enabled={siteMotion.enabled} />
      <header className="site-nav-wrap">
        <nav className="site-nav" aria-label="Main navigation">
          <a href="#top" className="flex items-center gap-3" aria-label="EDGE home">
            <img className="h-10 w-10 rounded-xl object-contain" src={EDGE_MARK_SRC} alt="" />
            <span>
              <span className="block text-xl font-black leading-none tracking-[-0.08em]">EDGE</span>
              <span className="site-wordmark-meta">LIVE//BOOKING_OS</span>
            </span>
          </a>
          <div className="hidden items-center gap-8 text-xs font-bold uppercase tracking-[0.16em] text-slate-500 xl:flex">
            <a className="transition-colors hover:text-black" href="#opportunities">Opportunities</a>
            <a className="transition-colors hover:text-black" href="#how-it-works">How it works</a>
            <a className="transition-colors hover:text-black" href="#for-every-side">Who it is for</a>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
          <HelpNode />
          <SiteMotionControl enabled={siteMotion.enabled} reducedMotion={siteMotion.reducedMotion} onToggle={siteMotion.toggle} />
          <button type="button" onClick={primaryAction} disabled={busy} className="site-nav-cta" aria-label={primaryLabel}>
            <span className="sm:hidden">{isSignedIn ? 'Workspace' : primaryLabel}</span><span className="hidden sm:inline">{primaryLabel}</span><ArrowRight size={15} aria-hidden="true" />
          </button>
          </div>
        </nav>
      </header>

      <main id="top">
        <section className="hero-grid">
          <div className="hero-copy">
            <motion.div
              initial={siteMotion.enabled ? { opacity: 0, y: 10 } : false}
              animate={{ opacity: 1, y: 0 }}
              className="signal-pill"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Live performance network · Pre-alpha
            </motion.div>
            <motion.h1
              initial={siteMotion.enabled ? { opacity: 0, y: 18 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="hero-title"
            >
              Find the stage.<br />Book the right act.<br /><GlitchWord enabled={siteMotion.enabled} />
            </motion.h1>
            <motion.p
              initial={siteMotion.enabled ? { opacity: 0, y: 18 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14 }}
              className="hero-deck"
            >
              EDGE connects artists, organisers, venues, and audiences in one live-performance network—from a clear booking brief to a show people can discover.
            </motion.p>
            <motion.div
              initial={siteMotion.enabled ? { opacity: 0, y: 18 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col gap-3 sm:flex-row"
            >
              <button type="button" onClick={primaryAction} disabled={busy} className="hero-primary">
                {busy ? 'Opening secure sign-in…' : primaryLabel}<ArrowRight size={19} aria-hidden="true" />
              </button>
              <a href="#opportunities" className="hero-secondary">Explore the network</a>
            </motion.div>
            {authError && (
              <p role="alert" className="mt-5 max-w-xl rounded-2xl bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
                {authError}
              </p>
            )}
            <div className="hero-principles" aria-label="EDGE platform principles">
              <span><Check size={14} />One clear gig brief</span>
              <span><Check size={14} />One application per artist</span>
              <span><Check size={14} />Real booking history</span>
            </div>
          </div>

          <StageVisual enabled={siteMotion.enabled} />
        </section>

        <section className="signal-strip" aria-label="Product promise">
          <div>
            <Radio size={18} />
            <span>Open opportunities</span>
          </div>
          <p>One network for the people who perform, produce, host, and show up.</p>
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/50">EDGE_01 / Pre-alpha preview</span>
        </section>

        <RoleCircuit />

        <section id="opportunities" className="site-section">
          <div className="section-heading-row">
            <div>
              <span className="section-kicker">Signal board</span>
              <h2 className="section-title">See the opportunity.<br />Know what it needs.</h2>
            </div>
            <p className="section-intro">No vague social post, lost DM, or missing fee. EDGE keeps the useful details together so artists can decide, booking owners can choose, and audiences can find what is emerging nearby.</p>
          </div>
          <DiscoveryBoard enabled={siteMotion.enabled} onJoin={primaryAction} joinLabel={primaryLabel} />
        </section>

        <section id="how-it-works" className="site-section border-y border-black/5 bg-white">
          <div className="section-heading-row">
            <div>
              <span className="section-kicker">The protocol</span>
              <h2 className="section-title">From brief to encore,<br />without the guesswork.</h2>
            </div>
            <p className="section-intro">The network follows the real journey from an available stage to a discoverable live event. Each profile gets a clear job without flattening every participant into the same workflow.</p>
          </div>
          <div className="steps-grid">
            {steps.map(({ number, title, body, icon: Icon }) => (
              <article key={number} className="step-card">
                <div className="flex items-center justify-between">
                  <span className="step-number">{number}</span>
                  <span className="step-icon"><Icon size={20} /></span>
                </div>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="for-every-side" className="site-section">
          <div className="role-grid">
            <div className="role-panel role-panel-dark" id="role-artist">
              <div className="role-panel-heading"><span className="section-kicker text-white/50">For artists</span><span>A/01</span></div>
              <h2>More time performing.<br />Less time chasing replies.</h2>
              <ul>
                <li><Check size={16} />Search gigs by title, genre and place</li>
                <li><Check size={16} />Track every application and booking state</li>
                <li><Check size={16} />Build trust from completed work and reviews</li>
              </ul>
              <button type="button" onClick={primaryAction}>Find your next gig <ArrowRight size={17} /></button>
            </div>
            <div className="role-panel" id="role-organiser">
              <div className="role-panel-heading"><span className="section-kicker">For organisers</span><span>O/02</span></div>
              <h2>One control room for every live booking.</h2>
              <ul>
                <li><Check size={16} />Post a complete opportunity in minutes</li>
                <li><Check size={16} />Review artists with useful context attached</li>
                <li><Check size={16} />Manage hire, completion and review states</li>
              </ul>
              <button type="button" onClick={primaryAction}>Post a clear brief <ArrowRight size={17} /></button>
            </div>
            <div className="role-panel role-panel-accent" id="role-venue">
              <div className="role-panel-heading"><span className="section-kicker text-emerald-950/55">For venues</span><span>V/03</span></div>
              <div className="role-panel-icon"><Building2 size={22} /></div>
              <h2>Turn open dates into nights worth remembering.</h2>
              <ul>
                <li><Check size={16} />Publish programming needs for your space</li>
                <li><Check size={16} />Compare applications in one booking view</li>
                <li><Check size={16} />Build a visible record of hosted shows</li>
              </ul>
              <button type="button" onClick={primaryAction}>Program your venue <ArrowRight size={17} /></button>
            </div>
            <div className="role-panel" id="role-audience">
              <div className="role-panel-heading"><span className="section-kicker">For audiences</span><span>U/04</span></div>
              <div className="role-panel-icon"><UsersRound size={22} /></div>
              <h2>Find the artists and live moments around you.</h2>
              <ul>
                <li><Check size={16} />Explore live signals by place and genre</li>
                <li><Check size={16} />Shape discovery with your preferences</li>
                <li><Check size={16} />See public event details after host approval</li>
              </ul>
              <a href="#opportunities" className="role-link">Explore as a guest <Compass size={17} /></a>
            </div>
          </div>
          <div className="guest-note">
            <div><span className="h-2 w-2 rounded-full bg-emerald-500" /><strong>Guest view is live now</strong></div>
            <p>Anyone can explore EDGE’s public story and preview opportunities. Real marketplace records stay signed-in until hosts can explicitly publish an event for public discovery.</p>
          </div>
        </section>

        <section className="trust-section">
          <div className="trust-copy">
            <span className="section-kicker text-white/50">Trust is operational</span>
            <h2>A marketplace should remember more than a star rating.</h2>
            <p>EDGE keeps the important states visible: who owns the gig, who applied, what was accepted, whether the show was completed and what both sides said afterward.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><ShieldCheck /><span>Authenticated identity</span><small>Google sign-in and role-bound profiles</small></div>
              <div><Star /><span>Mutual reviews</span><small>Feedback after completed bookings</small></div>
              <div><CalendarCheck /><span>Booking lifecycle</span><small>Open, filled, completed or cancelled</small></div>
              <div><Sparkles /><span>Fit analysis</span><small>Contextual support, never a hidden decision</small></div>
            </div>
          </div>
          <div className="trust-console" aria-label="Example EDGE reliability summary">
            <div className="flex items-center justify-between border-b border-white/10 pb-5">
              <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/50">Artist reliability node</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
            </div>
            <div className="py-8">
              <span className="font-serif text-xs font-black italic uppercase tracking-[0.18em] text-white/40">History, not hype</span>
              <p className="mt-2 text-5xl font-black tracking-[-0.07em]">Every signal<br />has a source.</p>
            </div>
            <div className="space-y-3 border-t border-white/10 pt-5 text-sm">
              <p><span>Completed gigs</span><strong>Recorded</strong></p>
              <p><span>Cancellations</span><strong>Visible</strong></p>
              <p><span>Reviews</span><strong>Mutual</strong></p>
              <p><span>Reliability</span><strong>History-based</strong></p>
            </div>
          </div>
        </section>

        <section className="final-cta">
          <img src={EDGE_MARK_SRC} alt="" />
          <span className="section-kicker">EDGE network</span>
          <h2>Make the next booking<br />feel like progress.</h2>
          <p>Join the pre-alpha and help shape a clearer network for artists, organisers, venues, and audiences.</p>
          <button type="button" onClick={primaryAction} disabled={busy}>{primaryLabel}<ArrowRight size={18} /></button>
        </section>
      </main>

      <footer className="site-footer">
        <div className="flex items-center gap-3"><img src={EDGE_MARK_SRC} alt="" /><strong>EDGE</strong></div>
        <p>Structured performance booking protocol.</p>
        <nav aria-label="Public information">
          <a href={`${import.meta.env.BASE_URL}about.html`}>About</a>
          <a href={`${import.meta.env.BASE_URL}privacy.html`}>Privacy</a>
          <a href={`${import.meta.env.BASE_URL}terms.html`}>Terms</a>
        </nav>
      </footer>
    </div>
    </MotionConfig>
  );
}
