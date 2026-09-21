export const NAVY = '#0f172a'
export const PRIMARY = '#2563eb'
export const PRIMARY_HOVER = '#1d4ed8'
export const PRIMARY_LIGHT = '#eff6ff'
export const GOLD = '#d97706'
export const GOLD_BG = '#fef3c7'
export const GREEN = '#059669'
export const GREEN_BG = '#ecfdf5'
export const DANGER = '#dc2626'
export const DANGER_BG = '#fef2f2'
export const BORDER = '#e2e8f0'
export const BORDER_FOCUS = '#2563eb'
export const TEXT_MAIN = '#0f172a'
export const TEXT_MUTED = '#64748b'
export const BG_PAGE = '#f8fafc'

export const shared = {
  /* Page headers */
  pageTitle: {
    fontSize: 24,
    fontWeight: 800,
    color: '#0f172a',
    margin: 0,
    letterSpacing: '-0.025em',
  },
  pageTitleUnderline: {
    width: 44,
    height: 4,
    background: 'linear-gradient(90deg, #2563eb, #38bdf8)',
    borderRadius: 4,
    marginTop: 8,
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 700,
    color: '#0f172a',
    margin: '0 0 4px',
    letterSpacing: '-0.01em',
  },
  sectionSub: {
    fontSize: 13.5,
    color: '#64748b',
    margin: '0 0 18px',
    lineHeight: 1.5,
  },

  /* Cards */
  card: {
    background: '#ffffff',
    borderRadius: 16,
    padding: '24px 28px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.05), 0 2px 4px -2px rgba(15, 23, 42, 0.03)',
  },

  /* Filter bar */
  filterBar: {
    display: 'flex',
    gap: 12,
    marginBottom: 20,
    flexWrap: 'wrap',
    alignItems: 'center',
  },

  /* Inputs */
  select: {
    padding: '9px 14px',
    borderRadius: 9,
    border: '1.5px solid #cbd5e1',
    background: '#ffffff',
    color: '#1e293b',
    fontSize: 13,
    fontWeight: 500,
    outline: 'none',
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
    cursor: 'pointer',
  },
  input: {
    padding: '9px 14px',
    borderRadius: 9,
    border: '1.5px solid #cbd5e1',
    fontSize: 13,
    flex: 1,
    minWidth: 200,
    outline: 'none',
    background: '#ffffff',
    color: '#1e293b',
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
  },

  /* Buttons */
  btnPrimary: {
    padding: '9px 20px',
    borderRadius: 9,
    border: 'none',
    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
    color: '#ffffff',
    fontWeight: 600,
    fontSize: 13,
    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.28)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    cursor: 'pointer',
  },
  btnGold: {
    padding: '9px 20px',
    borderRadius: 9,
    border: 'none',
    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
    color: '#ffffff',
    fontWeight: 600,
    fontSize: 13,
    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.28)',
    cursor: 'pointer',
  },
  btnGreen: {
    padding: '9px 20px',
    borderRadius: 9,
    border: 'none',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    color: '#ffffff',
    fontWeight: 600,
    fontSize: 13,
    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
    cursor: 'pointer',
  },
  btnGhost: {
    padding: '9px 18px',
    borderRadius: 9,
    border: '1.5px solid #cbd5e1',
    background: '#ffffff',
    color: '#334155',
    fontWeight: 600,
    fontSize: 13,
    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
    cursor: 'pointer',
  },
  btnSmall: {
    padding: '6px 14px',
    borderRadius: 7,
    border: 'none',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
  },

  /* Table */
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 13.5,
  },
  th: {
    textAlign: 'left',
    padding: '12px 16px',
    background: '#0f172a',
    color: '#f8fafc',
    fontWeight: 700,
    fontSize: 11.5,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  td: {
    padding: '12px 16px',
    borderBottom: '1px solid #f1f5f9',
    color: '#334155',
    verticalAlign: 'middle',
  },

  /* Badge */
  badge: (color) => ({
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 999,
    fontSize: 11.5,
    fontWeight: 700,
    background: color === '#c9a227' || color === '#d4a017' ? '#fef3c7' : color + '18',
    color: color === '#c9a227' || color === '#d4a017' ? '#b45309' : color,
    border: `1px solid ${color === '#c9a227' || color === '#d4a017' ? '#fde68a' : color + '33'}`,
  }),

  /* States */
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: 500,
  },

  /* Modals */
  modalBackdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(5px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: 20,
  },
  modal: {
    background: '#ffffff',
    borderRadius: 18,
    padding: 30,
    width: 460,
    maxHeight: '88vh',
    overflowY: 'auto',
    boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
    border: '1px solid #e2e8f0',
    animation: 'scaleUp 0.2s ease',
  },
  modalInput: {
    display: 'block',
    width: '100%',
    padding: '10px 14px',
    marginBottom: 14,
    borderRadius: 9,
    border: '1.5px solid #cbd5e1',
    boxSizing: 'border-box',
    fontSize: 13.5,
    outline: 'none',
    color: '#0f172a',
    background: '#ffffff',
  },
}
