import { useEffect, useRef, useState } from 'react';
import { ArrowRight, HelpCircle, Mail, MessageSquare, X } from 'lucide-react';

const topics = [
  { id: 'purpose', question: 'What is EDGE building?' },
  { id: 'roles', question: 'Which profile is for me?' },
  { id: 'demo', question: 'How does this preview work?' },
  { id: 'contact', question: 'Contact the EDGE team' },
] as const;
type Topic = (typeof topics)[number]['id'];

export function HelpNode() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState<Topic>('purpose');

  useEffect(() => {
    if (open && dialog.current && !dialog.current.open) dialog.current.showModal();
  }, [open]);
  const close = () => dialog.current?.close();

  return (
    <>
      <button type="button" className="help-node-launcher" aria-label="Open EDGE help" aria-haspopup="dialog" onClick={() => setOpen(true)}><MessageSquare size={17} aria-hidden="true" /><span>EDGE / HELP</span><i aria-hidden="true" /></button>
      <dialog className="help-node-dialog" ref={dialog} aria-labelledby="help-node-title" onClose={() => setOpen(false)} onClick={(event) => { if (event.target === event.currentTarget) close(); }}>
        {open && <div className="help-node-content">
          <div className="help-node-top"><span><HelpCircle size={13} aria-hidden="true" />HELP_NODE / 01</span><button type="button" aria-label="Close EDGE help" onClick={close}><X size={18} aria-hidden="true" /></button></div>
          <div className="help-node-intro"><div><span>Need a hand?</span><h2 id="help-node-title">Find your<br />way into EDGE.</h2><p>A quick guide to the network.</p></div><img className="help-node-mascot" src={`${import.meta.env.BASE_URL}edge-help-node.png`} alt="" width={120} height={120} /></div>
          <div className="help-node-topics" aria-label="Help topics">{topics.map(({ id, question }) => <button type="button" key={id} aria-pressed={topic === id} aria-controls="help-node-answer" onClick={() => setTopic(id)}>{question}<ArrowRight size={14} aria-hidden="true" /></button>)}</div>
          <section id="help-node-answer" className="help-node-answer" aria-live="polite" aria-atomic="true" aria-label="Help answer">
            {topic === 'purpose' && <><h3>From an open stage to a discovered show.</h3><p>EDGE is building a structured network for live performance. Artists find and apply for work. Organisers and venues manage clear briefs and bookings. Audiences discover artists and nearby live moments.</p><a href="#how-it-works" onClick={close}>See the booking journey<ArrowRight size={14} aria-hidden="true" /></a></>}
            {topic === 'roles' && <><h3>Four roles. Different tools.</h3><dl><div><dt>Artist</dt><dd>Find performance work and track applications.</dd></div><div><dt>Organiser</dt><dd>Produce events and manage artist bookings.</dd></div><div><dt>Venue</dt><dd>Host shows and programme your space.</dd></div><div><dt>Audience</dt><dd>Explore artists and live moments around you.</dd></div></dl><a href="#for-every-side" onClick={close}>Explore every role<ArrowRight size={14} aria-hidden="true" /></a></>}
            {topic === 'demo' && <><h3>Explore first. Join when you are ready.</h3><p>The public signal board uses fictional listings. Choose a city, try a demo PIN or switch between work and shows. “Use demo location” simulates Kolkata; it does not request device location.</p><p>EDGE is pre-alpha. An account is required for real booking actions. Public event publishing and ticketing are still being developed.</p><a href="#opportunities" onClick={close}>Try the local demo<ArrowRight size={14} aria-hidden="true" /></a></>}
            {topic === 'contact' && <><h3>Talk to the people building EDGE.</h3><p>Have a question, a venue to programme, or an idea for the network? Email the team. Your mail app opens a draft; nothing is sent automatically.</p><a className="help-node-email" href="mailto:edge911info@gmail.com"><Mail size={16} aria-hidden="true" />edge911info@gmail.com</a></>}
          </section>
          <p className="help-node-footnote">Guided help · no live agent or AI chat connected</p>
        </div>}
      </dialog>
    </>
  );
}
