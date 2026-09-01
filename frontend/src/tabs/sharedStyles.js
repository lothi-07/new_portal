const NAVY = '#1a2469'
const GOLD = '#c9a227'
const GREEN = '#2e7d5b'

export const shared = {
  /* Page headers */
  pageTitle: { fontSize: 22, fontWeight: 800, color: NAVY, margin: 0 },
  pageTitleUnderline: { width: 48, height: 3, background: GOLD, borderRadius: 2, marginTop: 6, marginBottom: 20 },
  sectionTitle: { fontSize: 17, fontWeight: 700, color: NAVY, margin: '0 0 4px' },
  sectionSub: { fontSize: 13, color: '#888', margin: '0 0 18px' },

  /* Cards */
  card: {
    background: '#fff', borderRadius: 14, padding: 24,
    boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
  },

  /* Filter bar */
  filterBar: { display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' },

  /* Inputs */
  select: {
    padding: '8px 12px', borderRadius: 7, border: '1.5px solid #ddd',
    background: '#fff', color: '#333', fontSize: 13, outline: 'none',
  },
  input: {
    padding: '8px 14px', borderRadius: 7, border: '1.5px solid #ddd', fontSize: 13,
    flex: 1, minWidth: 180, outline: 'none', background: '#fff',
  },

  /* Buttons */
  btnPrimary: {
    padding: '8px 18px', borderRadius: 7, border: 'none', background: NAVY,
    color: '#fff', fontWeight: 600, fontSize: 13,
  },
  btnGold: {
    padding: '8px 18px', borderRadius: 7, border: 'none', background: GOLD,
    color: '#fff', fontWeight: 600, fontSize: 13,
  },
  btnGreen: {
    padding: '8px 18px', borderRadius: 7, border: 'none', background: GREEN,
    color: '#fff', fontWeight: 600, fontSize: 13,
  },
  btnGhost: {
    padding: '8px 18px', borderRadius: 7, border: '1.5px solid #ddd', background: '#fff',
    color: '#444', fontWeight: 600, fontSize: 13,
  },
  btnSmall: {
    padding: '5px 12px', borderRadius: 6, border: 'none', fontSize: 12.5, fontWeight: 600,
  },

  /* Table */
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13.5 },
  th: {
    textAlign: 'left', padding: '11px 14px', background: NAVY, color: '#fff',
    fontWeight: 700, fontSize: 11.5, letterSpacing: 0.5,
  },
  td: { padding: '10px 14px', borderBottom: '1px solid #f0f0f5', color: '#333', verticalAlign: 'middle' },

  /* Badge */
  badge: (color) => ({
    display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11.5,
    fontWeight: 700, background: color + '22', color: color,
  }),

  /* States */
  emptyState: { textAlign: 'center', padding: '60px 20px', color: '#bbb', fontSize: 14 },

  /* Modals */
  modalBackdrop: {
    position: 'fixed', inset: 0, background: 'rgba(20,20,40,0.55)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 100,
  },
  modal: {
    background: '#fff', borderRadius: 14, padding: 28, width: 440, maxHeight: '88vh',
    overflowY: 'auto', animation: 'fadeIn 0.25s ease',
  },
  modalInput: {
    display: 'block', width: '100%', padding: '10px 12px', marginBottom: 12, borderRadius: 8,
    border: '1.5px solid #e2e2ea', boxSizing: 'border-box', fontSize: 13.5, outline: 'none',
  },
}
