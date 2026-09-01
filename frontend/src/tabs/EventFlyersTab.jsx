import { useEffect, useState } from 'react'
import { API_BASE, deleteEventFlyer, listEventFlyers, uploadEventFlyer } from '../api'

export default function EventFlyersTab({ canManage }) {
  const [flyers, setFlyers] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', event_date: '', registration_deadline: '', organizer: '' })
  const [file, setFile] = useState(null)
  const load = async () => { setLoading(true); try { setFlyers((await listEventFlyers()).data) } catch (e) { alert(e.response?.data?.detail || 'Unable to load flyers') } finally { setLoading(false) } }
  useEffect(() => { load() }, [])
  const publish = async () => {
    if (!form.title.trim() || !file) return alert('Event title and flyer file are required.')
    const data = new FormData(); Object.entries(form).forEach(([key, value]) => data.append(key, value)); data.append('file', file)
    setUploading(true)
    try { await uploadEventFlyer(data); setForm({ title: '', description: '', event_date: '', registration_deadline: '', organizer: '' }); setFile(null); document.getElementById('event-flyer-file').value = ''; await load() }
    catch (e) { alert(e.response?.data?.detail || 'Unable to upload flyer') } finally { setUploading(false) }
  }
  const remove = async (id) => { if (!confirm('Remove this event flyer?')) return; try { await deleteEventFlyer(id); await load() } catch (e) { alert(e.response?.data?.detail || 'Unable to remove flyer') } }
  return <div style={s.wrap}>
    <h1 style={s.title}>Available Academic Events</h1><p style={s.subtitle}>View event notices, registration deadlines, and organiser details.</p>
    {canManage && <div style={s.formCard}><h2 style={s.formTitle}>Publish an Event Flyer</h2><div style={s.formGrid}>
      <input style={s.input} placeholder="Event title *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
      <input style={s.input} placeholder="Organizer" value={form.organizer} onChange={e => setForm({ ...form, organizer: e.target.value })} />
      <label style={s.label}>Event date<input style={s.input} type="date" value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })} /></label>
      <label style={s.label}>Registration deadline<input style={s.input} type="date" value={form.registration_deadline} onChange={e => setForm({ ...form, registration_deadline: e.target.value })} /></label>
    </div><textarea style={{ ...s.input, minHeight: 70 }} placeholder="Event details / eligibility" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
      <div style={s.uploadRow}><input id="event-flyer-file" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={e => setFile(e.target.files[0])} /><button style={s.publishBtn} onClick={publish} disabled={uploading}>{uploading ? 'Publishing...' : 'Publish Flyer'}</button></div>
    </div>}
    {loading ? <p style={s.empty}>Loading flyers...</p> : flyers.length === 0 ? <div style={s.empty}>No event flyers have been published yet.</div> : <div style={s.grid}>{flyers.map(flyer => <article key={flyer.id} style={s.card}>
      {flyer.flyer_content_type === 'application/pdf' ? <a href={`${API_BASE}${flyer.flyer_path}`} target="_blank" rel="noreferrer" style={s.pdf}>View PDF Flyer</a> : <img src={`${API_BASE}${flyer.flyer_path}`} alt={`${flyer.title} flyer`} style={s.image} />}
      <div style={s.body}><h2 style={s.cardTitle}>{flyer.title}</h2>{flyer.description && <p style={s.description}>{flyer.description}</p>}{flyer.organizer && <p style={s.meta}>Organizer: {flyer.organizer}</p>}{flyer.event_date && <p style={s.meta}>Event: {flyer.event_date}</p>}{flyer.registration_deadline && <p style={s.deadline}>Register by: {flyer.registration_deadline}</p>}{canManage && <button style={s.deleteBtn} onClick={() => remove(flyer.id)}>Remove</button>}</div>
    </article>)}</div>}
  </div>
}
const s = { wrap: { animation: 'fadeIn .3s ease' }, title: { margin: 0, color: '#1a2469', fontSize: 22, fontWeight: 800 }, subtitle: { margin: '6px 0 18px', color: '#666', fontSize: 13.5 }, formCard: { background: '#fff', borderRadius: 12, padding: 20, marginBottom: 18, boxShadow: '0 1px 6px rgba(0,0,0,.06)' }, formTitle: { margin: '0 0 14px', fontSize: 16, color: '#1a2469' }, formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10, marginBottom: 10 }, input: { padding: '9px 10px', borderRadius: 7, border: '1.5px solid #ddd', fontSize: 13, boxSizing: 'border-box', width: '100%' }, label: { fontSize: 12, color: '#666', display: 'grid', gap: 5 }, uploadRow: { display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 10, flexWrap: 'wrap' }, publishBtn: { padding: '9px 16px', border: 'none', borderRadius: 7, background: '#1a2469', color: '#fff', fontWeight: 600 }, grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }, card: { background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,.08)' }, image: { width: '100%', height: 220, objectFit: 'cover', display: 'block' }, pdf: { display: 'flex', height: 150, alignItems: 'center', justifyContent: 'center', background: '#f5f1e7', color: '#1a2469', fontWeight: 700, textDecoration: 'none' }, body: { padding: 15 }, cardTitle: { margin: 0, color: '#1a2469', fontSize: 16 }, description: { color: '#555', fontSize: 13, lineHeight: 1.45 }, meta: { margin: '5px 0', color: '#666', fontSize: 12.5 }, deadline: { margin: '8px 0', color: '#b36b00', fontSize: 12.5, fontWeight: 700 }, deleteBtn: { marginTop: 8, border: '1px solid #f0c4c4', background: '#fff', color: '#c0392b', borderRadius: 6, padding: '6px 10px', fontWeight: 600 }, empty: { padding: 32, textAlign: 'center', color: '#999', background: '#fff', borderRadius: 12 } }
