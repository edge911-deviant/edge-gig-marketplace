import { ArrowRight, BriefcaseBusiness, Building2, UserRoundSearch, UsersRound } from 'lucide-react';
import { SiteRole, siteRoles } from './siteModel';

const icons = { artist: UserRoundSearch, organiser: BriefcaseBusiness, venue: Building2, audience: UsersRound };
const roles = siteRoles.map((role) => ({ ...role, icon: icons[role.id] }));

export function RoleCircuit({ selected, onSelect }: { selected: SiteRole; onSelect: (role: SiteRole) => void }) {
  const role = roles.find((item) => item.id === selected)!;

  return (
    <section className="network-topology" aria-labelledby="network-topology-title">
      <div className="topology-copy"><span className="section-kicker">Network topology</span><h2 id="network-topology-title">Four roles.<br /><span>One live circuit.</span></h2><p>Tap a role. See your part in the network.</p></div>
      <div className="topology-map" aria-label="Explore EDGE’s four roles">
        <div className="topology-axis topology-axis-horizontal" aria-hidden="true" /><div className="topology-axis topology-axis-vertical" aria-hidden="true" />
        <span key={selected} className={`topology-packet topology-packet-${selected}`} aria-hidden="true" />
        {roles.map(({ id, label, verb, icon: Icon }) => <button type="button" key={id} className={`topology-node topology-node-${id}`} aria-pressed={selected === id} aria-controls="role-circuit-detail" onClick={() => onSelect(id)}><Icon size={18} aria-hidden="true" /><span>{label}</span><small>{verb}</small></button>)}
        <div className="topology-core"><img src={`${import.meta.env.BASE_URL}edge-app-icon-transparent.png`} alt="" /><strong>EDGE</strong><small>CONNECTED ROLES</small></div>
      </div>
      <div className="topology-role-detail" id="role-circuit-detail" aria-live="polite" aria-atomic="true"><span className="topology-role-code">ROLE/{role.id.toUpperCase()}</span><h3>{role.label}</h3><p>{role.detail}</p><a href={`#role-${role.id}`}>{role.action}<ArrowRight size={15} aria-hidden="true" /></a><div className="topology-ledger"><span><i />04 role nodes</span><span><i />One connected booking journey</span></div></div>
    </section>
  );
}
