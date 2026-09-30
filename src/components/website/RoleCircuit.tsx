import { useState } from 'react';
import { ArrowRight, BriefcaseBusiness, Building2, UserRoundSearch, UsersRound } from 'lucide-react';

const roles = [
  { id: 'artist', label: 'Artist', verb: 'Perform', icon: UserRoundSearch, detail: 'Find a stage that fits your sound. Apply with your profile and keep every booking state in view.', action: 'Explore artist tools' },
  { id: 'organiser', label: 'Organiser', verb: 'Produce', icon: BriefcaseBusiness, detail: 'Publish a clear brief, compare applicants, and take the booking from open to completed.', action: 'Explore organiser tools' },
  { id: 'venue', label: 'Venue', verb: 'Host', icon: Building2, detail: 'Turn available dates into a programme. Bring the right artists into your space and manage the booking.', action: 'Explore venue tools' },
  { id: 'audience', label: 'Audience', verb: 'Discover', icon: UsersRound, detail: 'Explore artists and nearby live moments by place and sound. Discovery gets its own place in the network.', action: 'Explore audience tools' },
] as const;

export function RoleCircuit() {
  const [selected, setSelected] = useState<(typeof roles)[number]['id']>('artist');
  const role = roles.find((item) => item.id === selected)!;

  return (
    <section className="network-topology" aria-labelledby="network-topology-title">
      <div className="topology-copy"><span className="section-kicker">Network topology</span><h2 id="network-topology-title">Four roles.<br /><span>One live circuit.</span></h2><p>Tap a role. See your part in the network.</p></div>
      <div className="topology-map" aria-label="Explore EDGE’s four roles">
        <div className="topology-axis topology-axis-horizontal" aria-hidden="true" /><div className="topology-axis topology-axis-vertical" aria-hidden="true" />
        <span key={selected} className={`topology-packet topology-packet-${selected}`} aria-hidden="true" />
        {roles.map(({ id, label, verb, icon: Icon }) => <button type="button" key={id} className={`topology-node topology-node-${id}`} aria-pressed={selected === id} aria-controls="role-circuit-detail" onClick={() => setSelected(id)}><Icon size={18} aria-hidden="true" /><span>{label}</span><small>{verb}</small></button>)}
        <div className="topology-core"><img src={`${import.meta.env.BASE_URL}edge-app-icon-transparent.png`} alt="" /><strong>EDGE</strong><small>CONNECTED ROLES</small></div>
      </div>
      <div className="topology-role-detail" id="role-circuit-detail" aria-live="polite" aria-atomic="true"><span className="topology-role-code">ROLE/{role.id.toUpperCase()}</span><h3>{role.label}</h3><p>{role.detail}</p><a href={`#role-${role.id}`}>{role.action}<ArrowRight size={15} aria-hidden="true" /></a><div className="topology-ledger"><span><i />04 role nodes</span><span><i />One connected booking journey</span></div></div>
    </section>
  );
}
