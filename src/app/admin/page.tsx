'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

/* ── Brand ──────────────────────────────────────────────────── */
const L = '#1D6296', O = '#F3650A', Y = '#12273C';
const S = { sidebar: '#0f1923', sidebarBorder: '#1e2d3d', card: '#fff', cardBorder: '#e5e7eb', bg: '#f4f6f9' };

/* ── Types ──────────────────────────────────────────────────── */
type Panel = 'overview'|'sections'|'flags'|'users'|'content'|'announcements'|'settings'|'audit';

interface CMSSection { id:string; section_key:string; title:string; description:string; is_visible:boolean; display_order:number; config:Record<string,string>; }
interface FeatureFlag { id:string; flag_key:string; display_name:string; description:string; is_enabled:boolean; applies_to:string[]; }
interface Announcement { id:string; title_en:string; title_ar:string; body_en:string; body_ar:string; type:string; target_roles:string[]; is_active:boolean; is_dismissible:boolean; starts_at:string; ends_at:string|null; }
interface UserRow { id:string; full_name_en:string; full_name_ar:string|null; role:string; created_at:string; language_preference:string; }
interface Article { id:string; category:string; title_en:string; title_ar:string; status:string; published_at:string|null; }
interface Setting { key:string; value:string; }
interface AuditEntry { id:string; actor_id:string; action:string; target_type:string|null; target_id:string|null; created_at:string; }

/* ── Toast ──────────────────────────────────────────────────── */
function Toast({ msg, ok, onClose }: { msg:string; ok:boolean; onClose:()=>void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, []);
  return (
    <div style={{ position:'fixed', bottom:24, right:24, zIndex:9999, background: ok?'#16a34a':'#dc2626', color:'#fff', borderRadius:12, padding:'12px 20px', fontSize:13, fontWeight:600, boxShadow:'0 4px 20px rgba(0,0,0,.2)', display:'flex', alignItems:'center', gap:8 }}>
      {ok?'✓':'✗'} {msg}
      <button onClick={onClose} style={{ background:'none', border:'none', color:'rgba(255,255,255,.7)', cursor:'pointer', fontSize:16, marginLeft:4 }}>×</button>
    </div>
  );
}

/* ── Modal ──────────────────────────────────────────────────── */
function Modal({ title, children, onClose }: { title:string; children:import('react').ReactNode; onClose:()=>void }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ background:'#fff', borderRadius:18, width:'100%', maxWidth:560, maxHeight:'85vh', display:'flex', flexDirection:'column', boxShadow:'0 20px 60px rgba(0,0,0,.2)' }}>
        <div style={{ padding:'18px 22px', borderBottom:'1px solid #f3f4f6', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h3 style={{ fontSize:16, fontWeight:700, color:Y, margin:0 }}>{title}</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, color:'#9ca3af' }}>×</button>
        </div>
        <div style={{ padding:'20px 22px', overflowY:'auto', flex:1 }}>{children}</div>
      </div>
    </div>
  );
}

/* ── Field ──────────────────────────────────────────────────── */
const FLD: React.CSSProperties = { width:'100%', padding:'9px 12px', borderRadius:8, border:'1.5px solid #e5e7eb', fontSize:14, outline:'none', fontFamily:'inherit', boxSizing:'border-box', background:'#f9fafb' };
const LBL: React.CSSProperties = { display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:5 };

/* ── Badge ──────────────────────────────────────────────────── */
function Badge({ label, color }: { label:string; color:string }) {
  return <span style={{ fontSize:11, padding:'2px 9px', borderRadius:100, background:`${color}20`, color, border:`1px solid ${color}44`, fontWeight:600 }}>{label}</span>;
}

/* ── Overview Panel ─────────────────────────────────────────── */
function OverviewPanel({ stats }: { stats: Record<string,number> }) {
  const cards = [
    { label:'Total patients',    value: stats.patients    ?? 0, icon:'👥', color:'#1D6296' },
    { label:'Clinicians',        value: stats.clinicians  ?? 0, icon:'🩺', color:'#7c3aed' },
    { label:'Mood logs',         value: stats.mood_logs   ?? 0, icon:'📊', color:'#ea580c' },
    { label:'Assessments done',  value: stats.submissions ?? 0, icon:'📋', color:'#16a34a' },
    { label:'Articles published',value: stats.articles    ?? 0, icon:'📚', color:'#ca8a04' },
    { label:'Active alerts',     value: stats.alerts      ?? 0, icon:'⚠️', color:'#dc2626' },
  ];
  return (
    <div>
      <h2 style={{ fontSize:20, fontWeight:800, color:Y, marginBottom:20 }}>Platform overview</h2>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:28 }}>
        {cards.map(c => (
          <div key={c.label} style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:14, padding:'18px 16px', borderTop:`3px solid ${c.color}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <div style={{ fontSize:28, fontWeight:800, color:c.color }}>{c.value.toLocaleString()}</div>
                <div style={{ fontSize:12, color:'#6b7280', marginTop:3 }}>{c.label}</div>
              </div>
              <span style={{ fontSize:24 }}>{c.icon}</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:14, padding:'18px 20px' }}>
        <h3 style={{ fontSize:14, fontWeight:700, color:Y, marginBottom:14 }}>Quick actions</h3>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          {[
            { label:'Go to live site', href:'/', icon:'🌐' },
            { label:'Open library', href:'/library', icon:'📚' },
            { label:'Self-screening', href:'/screen', icon:'🧭' },
            { label:'Clinician portal', href:'/clinician', icon:'🩺' },
          ].map(a => (
            <a key={a.href} href={a.href} target="_blank" style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:8, border:'1px solid #e5e7eb', background:'#f9fafb', color:'#374151', textDecoration:'none', fontSize:13, fontWeight:500 }}>
              {a.icon} {a.label} ↗
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Sections Panel ─────────────────────────────────────────── */
function SectionsPanel({ supabase, toast }: { supabase: ReturnType<typeof createClient>; toast:(m:string,ok:boolean)=>void }) {
  const [sections, setSections] = useState<CMSSection[]>([]);
  const [loading, setLoading]   = useState(true);
  const [editing, setEditing]   = useState<CMSSection|null>(null);
  const [editConfig, setEditConfig] = useState<Record<string,string>>({});

  async function load() {
    const { data } = await supabase.from('cms_sections').select('*').order('display_order');
    setSections(data ?? []); setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function toggleVisible(s: CMSSection) {
    const { error } = await supabase.from('cms_sections').update({ is_visible: !s.is_visible, updated_at: new Date().toISOString() }).eq('id', s.id);
    if (!error) { toast(s.is_visible ? `"${s.title}" hidden` : `"${s.title}" visible`, true); load(); }
    else toast('Error updating section', false);
  }

  async function move(s: CMSSection, dir: 'up'|'down') {
    const idx    = sections.indexOf(s);
    const target = dir === 'up' ? sections[idx-1] : sections[idx+1];
    if (!target) return;
    const updates = [
      { id: s.id,      display_order: target.display_order },
      { id: target.id, display_order: s.display_order },
    ];
    for (const u of updates) await supabase.from('cms_sections').update({ display_order: u.display_order }).eq('id', u.id);
    toast('Order updated', true); load();
  }

  async function saveConfig() {
    if (!editing) return;
    const { error } = await supabase.from('cms_sections').update({ config: editConfig, updated_at: new Date().toISOString() }).eq('id', editing.id);
    if (!error) { toast('Section config saved', true); setEditing(null); load(); }
    else toast('Save failed', false);
  }

  const CONFIG_FIELDS: Record<string, {key:string; label:string}[]> = {
    hero: [
      { key:'headline_ar', label:'Headline (Arabic)' },
      { key:'headline_en', label:'Headline (English)' },
      { key:'subtext_ar',  label:'Subtext (Arabic)' },
      { key:'subtext_en',  label:'Subtext (English)' },
    ],
    screen_cta: [
      { key:'headline_ar', label:'Headline (Arabic)' },
      { key:'headline_en', label:'Headline (English)' },
    ],
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h2 style={{ fontSize:20, fontWeight:800, color:Y, margin:0 }}>Section builder</h2>
          <p style={{ fontSize:13, color:'#9ca3af', margin:'3px 0 0' }}>Control what appears on the public landing page and in what order.</p>
        </div>
        <a href="/" target="_blank" style={{ padding:'8px 16px', borderRadius:8, border:`1px solid ${L}`, background:'#eff6ff', color:L, fontSize:13, fontWeight:600, textDecoration:'none' }}>
          Preview live site ↗
        </a>
      </div>

      {loading ? <div style={{ color:'#9ca3af', fontSize:13 }}>Loading sections…</div> : (
        <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:14, overflow:'hidden' }}>
          <div style={{ padding:'11px 18px', background:'#f9fafb', borderBottom:'1px solid #e5e7eb', display:'grid', gridTemplateColumns:'28px 1fr auto auto auto', gap:12, alignItems:'center' }}>
            <span style={{ fontSize:11, fontWeight:600, color:'#9ca3af' }}>#</span>
            <span style={{ fontSize:11, fontWeight:600, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'.05em' }}>Section</span>
            <span style={{ fontSize:11, fontWeight:600, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'.05em' }}>Visible</span>
            <span style={{ fontSize:11, fontWeight:600, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'.05em' }}>Order</span>
            <span style={{ fontSize:11, fontWeight:600, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'.05em' }}>Config</span>
          </div>
          {sections.map((s, i) => (
            <div key={s.id} style={{ padding:'13px 18px', borderBottom:'1px solid #f3f4f6', display:'grid', gridTemplateColumns:'28px 1fr auto auto auto', gap:12, alignItems:'center', background: s.is_visible ? '#fff' : '#fafafa', opacity: s.is_visible ? 1 : .6 }}>
              <span style={{ fontSize:12, fontWeight:700, color:'#d1d5db' }}>{i+1}</span>
              <div>
                <div style={{ fontSize:14, fontWeight:600, color: s.is_visible ? Y : '#9ca3af' }}>{s.title}</div>
                <div style={{ fontSize:11, color:'#9ca3af', marginTop:1 }}>{s.description}</div>
              </div>
              {/* Toggle */}
              <div onClick={() => toggleVisible(s)} style={{ width:42, height:24, borderRadius:12, background: s.is_visible ? '#16a34a' : '#d1d5db', cursor:'pointer', position:'relative', transition:'background .2s', flexShrink:0 }}>
                <div style={{ position:'absolute', top:3, left: s.is_visible?20:3, width:18, height:18, borderRadius:'50%', background:'#fff', boxShadow:'0 1px 3px rgba(0,0,0,.15)', transition:'left .2s' }} />
              </div>
              {/* Order buttons */}
              <div style={{ display:'flex', gap:3 }}>
                <button onClick={() => move(s,'up')}   disabled={i===0}               style={{ padding:'4px 8px', borderRadius:6, border:'1px solid #e5e7eb', background:'#f9fafb', cursor: i===0?'not-allowed':'pointer', fontSize:12, opacity: i===0?.3:1 }}>↑</button>
                <button onClick={() => move(s,'down')} disabled={i===sections.length-1} style={{ padding:'4px 8px', borderRadius:6, border:'1px solid #e5e7eb', background:'#f9fafb', cursor: i===sections.length-1?'not-allowed':'pointer', fontSize:12, opacity: i===sections.length-1?.3:1 }}>↓</button>
              </div>
              {/* Edit config */}
              <button onClick={() => { setEditing(s); setEditConfig({...s.config}); }}
                disabled={!CONFIG_FIELDS[s.section_key]}
                style={{ padding:'5px 12px', borderRadius:7, border:`1px solid ${L}`, background:'#eff6ff', color:L, fontSize:12, fontWeight:600, cursor: CONFIG_FIELDS[s.section_key]?'pointer':'not-allowed', opacity: CONFIG_FIELDS[s.section_key]?1:.3 }}>
                Edit
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Config modal */}
      {editing && CONFIG_FIELDS[editing.section_key] && (
        <Modal title={`Configure: ${editing.title}`} onClose={() => setEditing(null)}>
          {CONFIG_FIELDS[editing.section_key].map(f => (
            <div key={f.key} style={{ marginBottom:14 }}>
              <label style={LBL}>{f.label}</label>
              <input style={FLD} value={editConfig[f.key] ?? ''} onChange={e => setEditConfig(prev => ({...prev,[f.key]:e.target.value}))} />
            </div>
          ))}
          <div style={{ display:'flex', gap:8, marginTop:20 }}>
            <button onClick={() => setEditing(null)} style={{ flex:1, padding:11, borderRadius:9, border:'1px solid #e5e7eb', background:'#f9fafb', fontSize:14, cursor:'pointer' }}>Cancel</button>
            <button onClick={saveConfig} style={{ flex:2, padding:11, borderRadius:9, border:'none', background:L, color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer' }}>Save config</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ── Feature Flags Panel ────────────────────────────────────── */
function FlagsPanel({ supabase, toast }: { supabase: ReturnType<typeof createClient>; toast:(m:string,ok:boolean)=>void }) {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  useEffect(() => { supabase.from('feature_flags').select('*').order('display_name').then(({ data }) => setFlags(data ?? [])); }, []);

  async function toggle(f: FeatureFlag) {
    await supabase.from('feature_flags').update({ is_enabled: !f.is_enabled, updated_at: new Date().toISOString() }).eq('id', f.id);
    setFlags(prev => prev.map(ff => ff.id===f.id ? {...ff, is_enabled:!ff.is_enabled} : ff));
    toast(`${f.display_name} ${f.is_enabled?'disabled':'enabled'}`, true);
  }

  const ROLE_COLORS: Record<string,string> = { patient:'#1D6296', clinician:'#7c3aed', public:'#16a34a', admin:'#dc2626', superadmin:'#ca8a04' };

  return (
    <div>
      <h2 style={{ fontSize:20, fontWeight:800, color:Y, marginBottom:6 }}>Feature flags</h2>
      <p style={{ fontSize:13, color:'#9ca3af', marginBottom:20 }}>Enable or disable platform features by user role. Changes take effect immediately.</p>
      <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:14, overflow:'hidden' }}>
        {flags.map((f, i) => (
          <div key={f.id} style={{ padding:'14px 18px', borderBottom: i < flags.length-1 ? '1px solid #f3f4f6' : 'none', display:'flex', alignItems:'center', gap:14 }}>
            <div onClick={() => toggle(f)} style={{ width:42, height:24, borderRadius:12, background: f.is_enabled?'#16a34a':'#d1d5db', cursor:'pointer', position:'relative', transition:'background .2s', flexShrink:0 }}>
              <div style={{ position:'absolute', top:3, left: f.is_enabled?20:3, width:18, height:18, borderRadius:'50%', background:'#fff', transition:'left .2s' }} />
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:600, color: f.is_enabled ? Y : '#9ca3af', display:'flex', alignItems:'center', gap:8 }}>
                {f.display_name}
                {!f.is_enabled && <Badge label="DISABLED" color="#dc2626" />}
              </div>
              <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>{f.description}</div>
            </div>
            <div style={{ display:'flex', gap:5, flexWrap:'wrap', justifyContent:'flex-end' }}>
              {f.applies_to.map(r => <Badge key={r} label={r} color={ROLE_COLORS[r]??'#6b7280'} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Users Panel ────────────────────────────────────────────── */
function UsersPanel({ supabase, toast }: { supabase: ReturnType<typeof createClient>; toast:(m:string,ok:boolean)=>void }) {
  const [users, setUsers]     = useState<UserRow[]>([]);
  const [filter, setFilter]   = useState<'all'|'patient'|'clinician'|'admin'>('all');
  const [search, setSearch]   = useState('');
  const [editing, setEditing] = useState<UserRow|null>(null);
  const [newRole, setNewRole] = useState('');

  useEffect(() => {
    supabase.from('profiles').select('id, full_name_en, full_name_ar, role, created_at, language_preference').order('created_at', { ascending:false }).then(({ data }) => setUsers(data ?? []));
  }, []);

  const visible = users.filter(u => {
    const matchRole = filter === 'all' || u.role === filter;
    const matchSearch = !search || u.full_name_en.toLowerCase().includes(search.toLowerCase()) || u.full_name_ar?.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  async function updateRole() {
    if (!editing || !newRole) return;
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', editing.id);
    if (!error) { toast(`Role updated to ${newRole}`, true); setUsers(prev => prev.map(u => u.id===editing.id ? {...u,role:newRole} : u)); setEditing(null); }
    else toast('Update failed', false);
  }

  const ROLE_COLOR: Record<string,string> = { patient:'#1D6296', clinician:'#7c3aed', admin:'#dc2626', superadmin:'#ca8a04' };

  return (
    <div>
      <h2 style={{ fontSize:20, fontWeight:800, color:Y, marginBottom:16 }}>User management</h2>
      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name…" style={{ ...FLD, maxWidth:240, flex:1 }} />
        <div style={{ display:'flex', gap:6 }}>
          {(['all','patient','clinician','admin'] as const).map(r => (
            <button key={r} onClick={() => setFilter(r)} style={{ padding:'7px 14px', borderRadius:8, border:`1px solid ${filter===r?L:'#e5e7eb'}`, background: filter===r?'#eff6ff':'#fff', color: filter===r?L:'#6b7280', fontWeight: filter===r?600:400, fontSize:13, cursor:'pointer', textTransform:'capitalize' }}>
              {r} ({r==='all'?users.length:users.filter(u=>u.role===r).length})
            </button>
          ))}
        </div>
      </div>
      <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:14, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'#f9fafb' }}>
              {['Name','Role','Language','Joined','Actions'].map(h => (
                <th key={h} style={{ padding:'9px 14px', textAlign:'left', fontSize:11, fontWeight:600, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'.05em', borderBottom:'1px solid #e5e7eb' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr><td colSpan={5} style={{ padding:'32px', textAlign:'center', color:'#9ca3af', fontSize:13 }}>No users found</td></tr>
            ) : visible.map(u => (
              <tr key={u.id} style={{ borderBottom:'1px solid #f3f4f6' }}>
                <td style={{ padding:'11px 14px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                    <div style={{ width:30, height:30, borderRadius:'50%', background:`${ROLE_COLOR[u.role]??L}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:ROLE_COLOR[u.role]??L, flexShrink:0 }}>
                      {u.full_name_en.split(' ').map(w=>w[0]).slice(0,2).join('')}
                    </div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color:Y }}>{u.full_name_en}</div>
                      {u.full_name_ar && <div style={{ fontSize:11, color:'#9ca3af', direction:'rtl' }}>{u.full_name_ar}</div>}
                    </div>
                  </div>
                </td>
                <td style={{ padding:'11px 14px' }}><Badge label={u.role} color={ROLE_COLOR[u.role]??'#6b7280'} /></td>
                <td style={{ padding:'11px 14px', fontSize:12, color:'#6b7280', textTransform:'uppercase' }}>{u.language_preference}</td>
                <td style={{ padding:'11px 14px', fontSize:12, color:'#9ca3af' }}>{new Date(u.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</td>
                <td style={{ padding:'11px 14px' }}>
                  <button onClick={() => { setEditing(u); setNewRole(u.role); }} style={{ padding:'5px 12px', borderRadius:7, border:'1px solid #e5e7eb', background:'#f9fafb', color:'#374151', fontSize:12, cursor:'pointer' }}>
                    Change role
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && (
        <Modal title={`Change role: ${editing.full_name_en}`} onClose={() => setEditing(null)}>
          <label style={LBL}>New role</label>
          <select value={newRole} onChange={e => setNewRole(e.target.value)} style={FLD}>
            {['patient','clinician','admin','superadmin'].map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <div style={{ background:'#fef3f2', border:'1px solid #fca5a5', borderRadius:8, padding:'10px 12px', fontSize:12, color:'#991b1b', margin:'14px 0' }}>
            ⚠️ Changing a user's role affects what they can access. Superadmin role grants full platform control.
          </div>
          <div style={{ display:'flex', gap:8, marginTop:8 }}>
            <button onClick={() => setEditing(null)} style={{ flex:1, padding:11, borderRadius:9, border:'1px solid #e5e7eb', background:'#f9fafb', fontSize:14, cursor:'pointer' }}>Cancel</button>
            <button onClick={updateRole} style={{ flex:2, padding:11, borderRadius:9, border:'none', background:L, color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer' }}>Save</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ── Content Panel ──────────────────────────────────────────── */
function ContentPanel({ supabase, toast }: { supabase: ReturnType<typeof createClient>; toast:(m:string,ok:boolean)=>void }) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title_en:'', title_ar:'', category:'anxiety', body_en:'', body_ar:'' });

  async function load() { const { data } = await supabase.from('content_articles').select('id, category, title_en, title_ar, status, published_at').order('created_at', { ascending:false }); setArticles(data ?? []); }
  useEffect(() => { load(); }, []);

  async function toggleStatus(a: Article) {
    if (a.status === 'published') {
      await supabase.from('content_articles').update({ status:'draft' }).eq('id', a.id);
      toast(`"${a.title_en}" set to draft`, true);
    } else {
      await supabase.from('content_articles').update({ status:'published', published_at: new Date().toISOString(), reviewed_at: new Date().toISOString() }).eq('id', a.id);
      toast(`"${a.title_en}" published`, true);
    }
    load();
  }

  async function createArticle() {
    if (!form.title_en || !form.title_ar) return;
    const { error } = await supabase.from('content_articles').insert({ ...form, status:'draft', version:1, body_en: form.body_en || '(Content to be added)', body_ar: form.body_ar || '(محتوى يُضاف لاحقاً)' });
    if (!error) { toast('Article created', true); setCreating(false); setForm({ title_en:'', title_ar:'', category:'anxiety', body_en:'', body_ar:'' }); load(); }
    else toast('Create failed', false);
  }

  async function deleteArticle(a: Article) {
    if (!confirm(`Delete "${a.title_en}"?`)) return;
    await supabase.from('content_articles').delete().eq('id', a.id);
    toast('Article deleted', true); load();
  }

  const STATUS_COLOR: Record<string,string> = { draft:'#6b7280', under_review:'#ca8a04', published:'#16a34a' };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <h2 style={{ fontSize:20, fontWeight:800, color:Y, margin:0 }}>Content library</h2>
        <button onClick={() => setCreating(true)} style={{ padding:'8px 18px', borderRadius:9, border:'none', background:L, color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer' }}>+ New article</button>
      </div>
      <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:14, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'#f9fafb' }}>
              {['Title','Category','Status','Published','Actions'].map(h => (
                <th key={h} style={{ padding:'9px 14px', textAlign:'left', fontSize:11, fontWeight:600, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'.05em', borderBottom:'1px solid #e5e7eb' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {articles.map(a => (
              <tr key={a.id} style={{ borderBottom:'1px solid #f3f4f6' }}>
                <td style={{ padding:'11px 14px' }}>
                  <div style={{ fontSize:13, fontWeight:600, color:Y }}>{a.title_en}</div>
                  <div style={{ fontSize:11, color:'#9ca3af', direction:'rtl', textAlign:'right' }}>{a.title_ar}</div>
                </td>
                <td style={{ padding:'11px 14px' }}><Badge label={a.category.replace('_',' ')} color={L} /></td>
                <td style={{ padding:'11px 14px' }}><Badge label={a.status} color={STATUS_COLOR[a.status]??'#6b7280'} /></td>
                <td style={{ padding:'11px 14px', fontSize:12, color:'#9ca3af' }}>{a.published_at ? new Date(a.published_at).toLocaleDateString('en-GB',{day:'numeric',month:'short'}) : '—'}</td>
                <td style={{ padding:'11px 14px', display:'flex', gap:6 }}>
                  <button onClick={() => toggleStatus(a)} style={{ padding:'5px 12px', borderRadius:7, border:'1px solid #e5e7eb', background:'#f9fafb', color:'#374151', fontSize:12, cursor:'pointer' }}>
                    {a.status === 'published' ? 'Unpublish' : 'Publish'}
                  </button>
                  <button onClick={() => deleteArticle(a)} style={{ padding:'5px 10px', borderRadius:7, border:'1px solid #fca5a5', background:'#fef2f2', color:'#dc2626', fontSize:12, cursor:'pointer' }}>
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {creating && (
        <Modal title="New article" onClose={() => setCreating(false)}>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div>
                <label style={LBL}>Title (English)</label>
                <input style={FLD} value={form.title_en} onChange={e => setForm(f=>({...f,title_en:e.target.value}))} placeholder="Article title…" />
              </div>
              <div>
                <label style={LBL}>Title (Arabic)</label>
                <input style={{...FLD, direction:'rtl'}} value={form.title_ar} onChange={e => setForm(f=>({...f,title_ar:e.target.value}))} placeholder="عنوان المقال…" />
              </div>
            </div>
            <div>
              <label style={LBL}>Category</label>
              <select style={FLD} value={form.category} onChange={e => setForm(f=>({...f,category:e.target.value}))}>
                {['anxiety','depression','sleep','stress','relationships','stigma_culture'].map(c => <option key={c} value={c}>{c.replace('_',' ')}</option>)}
              </select>
            </div>
            <div>
              <label style={LBL}>Body (English) — use ## for headings, blank lines for paragraphs</label>
              <textarea style={{...FLD, minHeight:120, resize:'vertical'}} value={form.body_en} onChange={e => setForm(f=>({...f,body_en:e.target.value}))} placeholder="Article content…" />
            </div>
            <div>
              <label style={LBL}>Body (Arabic)</label>
              <textarea style={{...FLD, minHeight:120, resize:'vertical', direction:'rtl'}} value={form.body_ar} onChange={e => setForm(f=>({...f,body_ar:e.target.value}))} placeholder="محتوى المقال…" />
            </div>
            <div style={{ display:'flex', gap:8, marginTop:8 }}>
              <button onClick={() => setCreating(false)} style={{ flex:1, padding:11, borderRadius:9, border:'1px solid #e5e7eb', background:'#f9fafb', fontSize:14, cursor:'pointer' }}>Cancel</button>
              <button onClick={createArticle} style={{ flex:2, padding:11, borderRadius:9, border:'none', background:L, color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer' }}>Create article</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ── Announcements Panel ────────────────────────────────────── */
function AnnouncementsPanel({ supabase, toast }: { supabase: ReturnType<typeof createClient>; toast:(m:string,ok:boolean)=>void }) {
  const [anns, setAnns] = useState<Announcement[]>([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title_en:'', title_ar:'', body_en:'', body_ar:'', type:'info', target_roles:['patient'], is_dismissible:true, ends_at:'' });

  async function load() { const { data } = await supabase.from('platform_announcements').select('*').order('created_at', { ascending:false }); setAnns(data ?? []); }
  useEffect(() => { load(); }, []);

  async function toggleActive(a: Announcement) {
    await supabase.from('platform_announcements').update({ is_active: !a.is_active }).eq('id', a.id);
    toast(a.is_active ? 'Announcement deactivated' : 'Announcement activated', true); load();
  }

  async function create() {
    if (!form.title_en || !form.title_ar) return;
    const payload: Record<string,unknown> = { ...form, target_roles: form.target_roles };
    if (!form.ends_at) delete payload.ends_at;
    const { error } = await supabase.from('platform_announcements').insert(payload);
    if (!error) { toast('Announcement created', true); setCreating(false); load(); }
    else toast('Create failed', false);
  }

  async function deleteAnn(a: Announcement) {
    if (!confirm(`Delete "${a.title_en}"?`)) return;
    await supabase.from('platform_announcements').delete().eq('id', a.id);
    toast('Deleted', true); load();
  }

  const TYPE_COLORS: Record<string,string> = { info:'#1D6296', warning:'#ca8a04', success:'#16a34a', maintenance:'#7c3aed', critical:'#dc2626' };
  const TYPE_ICONS:  Record<string,string> = { info:'ℹ️', warning:'⚠️', success:'✅', maintenance:'🔧', critical:'🚨' };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h2 style={{ fontSize:20, fontWeight:800, color:Y, margin:0 }}>Announcements</h2>
          <p style={{ fontSize:13, color:'#9ca3af', margin:'3px 0 0' }}>Site-wide banners shown to users on their dashboard.</p>
        </div>
        <button onClick={() => setCreating(true)} style={{ padding:'8px 18px', borderRadius:9, border:'none', background:L, color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer' }}>+ New announcement</button>
      </div>

      {anns.length === 0 ? (
        <div style={{ textAlign:'center', padding:'48px', color:'#9ca3af', fontSize:13, background:'#fff', borderRadius:14, border:'1px solid #e5e7eb' }}>No announcements yet.</div>
      ) : anns.map(a => (
        <div key={a.id} style={{ background:'#fff', border:`1px solid ${a.is_active?TYPE_COLORS[a.type]+'30':'#e5e7eb'}`, borderRadius:14, padding:'16px 18px', marginBottom:10, display:'flex', alignItems:'flex-start', gap:14, opacity: a.is_active?1:.6 }}>
          <span style={{ fontSize:22, flexShrink:0 }}>{TYPE_ICONS[a.type]??'ℹ️'}</span>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
              <span style={{ fontSize:14, fontWeight:700, color:Y }}>{a.title_en}</span>
              <Badge label={a.type} color={TYPE_COLORS[a.type]??L} />
              {a.is_active && <Badge label="ACTIVE" color="#16a34a" />}
            </div>
            {a.body_en && <p style={{ fontSize:12, color:'#6b7280', margin:'0 0 6px' }}>{a.body_en}</p>}
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {a.target_roles.map(r => <Badge key={r} label={r} color="#6b7280" />)}
              {a.ends_at && <span style={{ fontSize:11, color:'#9ca3af' }}>Expires: {new Date(a.ends_at).toLocaleDateString('en-GB')}</span>}
            </div>
          </div>
          <div style={{ display:'flex', gap:6, flexShrink:0 }}>
            <button onClick={() => toggleActive(a)} style={{ padding:'6px 12px', borderRadius:7, border:'1px solid #e5e7eb', background:'#f9fafb', color:'#374151', fontSize:12, cursor:'pointer' }}>
              {a.is_active?'Deactivate':'Activate'}
            </button>
            <button onClick={() => deleteAnn(a)} style={{ padding:'6px 10px', borderRadius:7, border:'1px solid #fca5a5', background:'#fef2f2', color:'#dc2626', fontSize:12, cursor:'pointer' }}>×</button>
          </div>
        </div>
      ))}

      {creating && (
        <Modal title="New announcement" onClose={() => setCreating(false)}>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div><label style={LBL}>Title (EN)</label><input style={FLD} value={form.title_en} onChange={e => setForm(f=>({...f,title_en:e.target.value}))} /></div>
              <div><label style={LBL}>Title (AR)</label><input style={{...FLD,direction:'rtl'}} value={form.title_ar} onChange={e => setForm(f=>({...f,title_ar:e.target.value}))} /></div>
            </div>
            <div><label style={LBL}>Body (EN)</label><textarea style={{...FLD,minHeight:60,resize:'vertical'}} value={form.body_en} onChange={e => setForm(f=>({...f,body_en:e.target.value}))} /></div>
            <div><label style={LBL}>Body (AR)</label><textarea style={{...FLD,minHeight:60,resize:'vertical',direction:'rtl'}} value={form.body_ar} onChange={e => setForm(f=>({...f,body_ar:e.target.value}))} /></div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div>
                <label style={LBL}>Type</label>
                <select style={FLD} value={form.type} onChange={e => setForm(f=>({...f,type:e.target.value}))}>
                  {['info','success','warning','maintenance','critical'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={LBL}>Expires (optional)</label>
                <input type="datetime-local" style={FLD} value={form.ends_at} onChange={e => setForm(f=>({...f,ends_at:e.target.value}))} />
              </div>
            </div>
            <div>
              <label style={LBL}>Target roles</label>
              <div style={{ display:'flex', gap:10 }}>
                {['patient','clinician','admin'].map(r => (
                  <label key={r} style={{ display:'flex', alignItems:'center', gap:5, fontSize:13, cursor:'pointer' }}>
                    <input type="checkbox" checked={form.target_roles.includes(r)} onChange={e => setForm(f=>({...f,target_roles: e.target.checked ? [...f.target_roles,r] : f.target_roles.filter(x=>x!==r)}))} />
                    {r}
                  </label>
                ))}
              </div>
            </div>
            <div style={{ display:'flex', gap:8, marginTop:8 }}>
              <button onClick={() => setCreating(false)} style={{ flex:1, padding:11, borderRadius:9, border:'1px solid #e5e7eb', background:'#f9fafb', fontSize:14, cursor:'pointer' }}>Cancel</button>
              <button onClick={create} style={{ flex:2, padding:11, borderRadius:9, border:'none', background:L, color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer' }}>Create</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ── Settings Panel ─────────────────────────────────────────── */
function SettingsPanel({ supabase, toast }: { supabase: ReturnType<typeof createClient>; toast:(m:string,ok:boolean)=>void }) {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [dirty, setDirty]       = useState<Record<string,string>>({});

  useEffect(() => { supabase.from('platform_settings').select('key, value').order('key').then(({ data }) => setSettings(data ?? [])); }, []);

  async function saveAll() {
    const updates = Object.entries(dirty).map(([key, value]) => supabase.from('platform_settings').update({ value, updated_at: new Date().toISOString() }).eq('key', key));
    await Promise.all(updates);
    toast('Settings saved', true);
    setDirty({});
    const { data } = await supabase.from('platform_settings').select('key, value').order('key');
    setSettings(data ?? []);
  }

  const LABELS: Record<string,{label:string;description:string}> = {
    phq9_high_risk_threshold:     { label:'PHQ-9 high-risk threshold',           description:'Score at or above this triggers a clinician alert' },
    gad7_high_risk_threshold:     { label:'GAD-7 high-risk threshold',           description:'Score at or above this triggers a clinician alert' },
    polypharmacy_threshold:       { label:'Polypharmacy threshold',              description:'Number of concurrent medications that triggers an alert' },
    invitation_expiry_hours:      { label:'Invitation expiry (hours)',            description:'How long a patient invitation link stays valid' },
    magic_link_expiry_minutes:    { label:'Magic link expiry (minutes)',          description:'How long a sign-in magic link stays valid' },
    medication_interaction_check_enabled: { label:'Drug interaction checking',    description:'Enable DrugBank API calls for new medications' },
    sms_notifications_enabled:    { label:'SMS notifications',                   description:'Send SMS alerts for high-risk assessments' },
    public_library_enabled:       { label:'Public library access',               description:'Allow unauthenticated access to the library' },
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <h2 style={{ fontSize:20, fontWeight:800, color:Y, margin:0 }}>Platform settings</h2>
        {Object.keys(dirty).length > 0 && (
          <button onClick={saveAll} style={{ padding:'8px 20px', borderRadius:9, border:'none', background:'#16a34a', color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer' }}>
            Save {Object.keys(dirty).length} change{Object.keys(dirty).length>1?'s':''}
          </button>
        )}
      </div>
      <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:14, overflow:'hidden' }}>
        {settings.map((s, i) => {
          const meta = LABELS[s.key];
          const val  = dirty[s.key] ?? s.value;
          const isBool = val === 'true' || val === 'false';
          return (
            <div key={s.key} style={{ padding:'14px 18px', borderBottom: i<settings.length-1?'1px solid #f3f4f6':'none', display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600, color:Y }}>{meta?.label ?? s.key}</div>
                {meta?.description && <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>{meta.description}</div>}
                {dirty[s.key] && <div style={{ fontSize:10, color:O, marginTop:3, fontWeight:600 }}>● Unsaved</div>}
              </div>
              {isBool ? (
                <div onClick={() => setDirty(d => ({...d, [s.key]: val==='true'?'false':'true'}))}
                  style={{ width:42, height:24, borderRadius:12, background: val==='true'?'#16a34a':'#d1d5db', cursor:'pointer', position:'relative', transition:'background .2s', flexShrink:0 }}>
                  <div style={{ position:'absolute', top:3, left: val==='true'?20:3, width:18, height:18, borderRadius:'50%', background:'#fff', transition:'left .2s' }} />
                </div>
              ) : (
                <input type="number" value={val} onChange={e => setDirty(d => ({...d, [s.key]: e.target.value}))}
                  style={{ ...FLD, width:90, textAlign:'center' }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main Admin Component ───────────────────────────────────── */
export default function AdminPage() {
  const [panel, setPanel]       = useState<Panel>('overview');
  const [stats, setStats]       = useState<Record<string,number>>({});
  const [ready, setReady]       = useState(false);
  const [adminName, setAdminName] = useState('');
  const [toast_, setToast]      = useState<{msg:string;ok:boolean}|null>(null);
  const router = useRouter();
  const supabase = createClient();

  const toast = useCallback((msg: string, ok: boolean) => { setToast({ msg, ok }); }, []);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/sign-in'); return; }
      const { data: prof } = await supabase.from('profiles').select('role, full_name_en').eq('id', user.id).single();
      if (!prof || !['admin','superadmin'].includes(prof.role)) { router.push('/home'); return; }
      setAdminName(prof.full_name_en?.split(' ')[0] ?? 'Admin');
      setReady(true);

      // Load stats
      const [patients, clinicians, mood_logs, submissions, articles, alerts] = await Promise.all([
        supabase.from('profiles').select('id', { count:'exact', head:true }).eq('role','patient'),
        supabase.from('profiles').select('id', { count:'exact', head:true }).eq('role','clinician'),
        supabase.from('mood_logs').select('id', { count:'exact', head:true }),
        supabase.from('assessment_submissions').select('id', { count:'exact', head:true }),
        supabase.from('content_articles').select('id', { count:'exact', head:true }).eq('status','published'),
        supabase.from('medication_alerts').select('id', { count:'exact', head:true }).is('acknowledged_at', null),
      ]);
      setStats({ patients: patients.count??0, clinicians: clinicians.count??0, mood_logs: mood_logs.count??0, submissions: submissions.count??0, articles: articles.count??0, alerts: alerts.count??0 });
    }
    init();
  }, []);

  if (!ready) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f4f6f9', fontFamily:'Segoe UI,system-ui,sans-serif' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:36, marginBottom:12 }}>⚙️</div>
        <p style={{ color:'#6b7280', fontSize:14 }}>Loading admin panel…</p>
      </div>
    </div>
  );

  const NAV: { id:Panel; icon:string; label:string; badge?:number }[] = [
    { id:'overview',      icon:'⊞',  label:'Overview' },
    { id:'sections',      icon:'⊟',  label:'Section builder' },
    { id:'flags',         icon:'🚩',  label:'Feature flags' },
    { id:'users',         icon:'👥',  label:'Users',     badge: stats.patients },
    { id:'content',       icon:'📚',  label:'Content',   badge: stats.articles },
    { id:'announcements', icon:'📣',  label:'Announcements' },
    { id:'settings',      icon:'⚙️',  label:'Settings' },
  ];

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', fontFamily:'Segoe UI,system-ui,sans-serif', background: S.bg }}>

      {/* Sidebar */}
      <aside style={{ width:218, background: S.sidebar, display:'flex', flexDirection:'column', flexShrink:0, borderRight:`1px solid ${S.sidebarBorder}` }}>
        <div style={{ padding:'18px 16px', borderBottom:`1px solid ${S.sidebarBorder}` }}>
          <div style={{ fontSize:17, fontWeight:800, color:'#fff', marginBottom:2 }}>Vwelfare</div>
          <div style={{ fontSize:10, color:'rgba(255,255,255,.35)', fontWeight:500, letterSpacing:'.06em', textTransform:'uppercase' }}>Super Admin</div>
        </div>
        <nav style={{ flex:1, padding:'10px 8px', overflowY:'auto' }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setPanel(n.id)}
              style={{ width:'100%', padding:'9px 10px', borderRadius:9, border:'none', background: panel===n.id?'rgba(29,98,150,.25)':'transparent', color: panel===n.id?'#7dc3f0':'rgba(255,255,255,.55)', fontWeight: panel===n.id?600:400, fontSize:13, cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:9, marginBottom:2, transition:'all .15s', fontFamily:'inherit' }}>
              <span style={{ fontSize:15 }}>{n.icon}</span>
              <span style={{ flex:1 }}>{n.label}</span>
              {n.badge !== undefined && n.badge > 0 && (
                <span style={{ fontSize:10, background: panel===n.id?'rgba(255,255,255,.2)':'rgba(255,255,255,.1)', color:'rgba(255,255,255,.7)', padding:'1px 7px', borderRadius:100 }}>{n.badge}</span>
              )}
            </button>
          ))}
        </nav>
        <div style={{ padding:'14px 16px', borderTop:`1px solid ${S.sidebarBorder}` }}>
          <div style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,.6)', marginBottom:2 }}>{adminName}</div>
          <div style={{ fontSize:10, color:'rgba(255,255,255,.3)' }}>Superadmin</div>
          <button onClick={() => router.push('/home')} style={{ marginTop:10, width:'100%', padding:'7px', borderRadius:7, border:`1px solid ${S.sidebarBorder}`, background:'transparent', color:'rgba(255,255,255,.4)', fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>
            ← Back to app
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex:1, overflowY:'auto', padding:'28px 32px' }}>
        {panel === 'overview'      && <OverviewPanel stats={stats} />}
        {panel === 'sections'      && <SectionsPanel      supabase={supabase} toast={toast} />}
        {panel === 'flags'         && <FlagsPanel         supabase={supabase} toast={toast} />}
        {panel === 'users'         && <UsersPanel         supabase={supabase} toast={toast} />}
        {panel === 'content'       && <ContentPanel       supabase={supabase} toast={toast} />}
        {panel === 'announcements' && <AnnouncementsPanel supabase={supabase} toast={toast} />}
        {panel === 'settings'      && <SettingsPanel      supabase={supabase} toast={toast} />}
      </main>

      {toast_ && <Toast msg={toast_.msg} ok={toast_.ok} onClose={() => setToast(null)} />}
    </div>
  );
}
