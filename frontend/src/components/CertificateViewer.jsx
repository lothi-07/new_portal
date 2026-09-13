import React, { useState, useEffect } from 'react'

export default function CertificateViewer({ certificateUrl, studentName, eventName, eventType, prize, eventDate, onClose }) {
  const [isImage, setIsImage] = useState(true)

  useEffect(() => {
    if (certificateUrl) {
      setIsImage(!certificateUrl.endsWith('.pdf'))
    }
  }, [certificateUrl])

  return (
    <div style={styles.modalBackdrop} onClick={onClose}>
      <div style={styles.certificateContainer} onClick={e => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={onClose}>✕</button>

        {/* Certificate Display Area */}
        <div style={styles.displayArea}>
          {isImage ? (
            <img
              src={certificateUrl}
              alt="Certificate"
              style={styles.certificateImage}
            />
          ) : (
            <iframe src={certificateUrl} style={styles.pdfViewer} />
          )}
        </div>

        {/* Certificate Info Overlay */}
        <div style={styles.infoOverlay}>
          <div style={styles.infoCard}>
            <div style={styles.infoHeader}>
              <h3 style={styles.infoTitle}>Certificate Details</h3>
            </div>

            <div style={styles.infoContent}>
              {studentName && (
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Student:</span>
                  <span style={styles.infoValue}>{studentName}</span>
                </div>
              )}

              {eventName && (
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Event:</span>
                  <span style={styles.infoValue}>{eventName}</span>
                </div>
              )}

              {eventType && (
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Type:</span>
                  <span style={styles.infoValue}>{eventType}</span>
                </div>
              )}

              {prize && (
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Achievement:</span>
                  <span style={{ ...styles.infoValue, ...styles.prizeValue }}>
                    {prize}
                  </span>
                </div>
              )}

              {eventDate && (
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Date:</span>
                  <span style={styles.infoValue}>{eventDate}</span>
                </div>
              )}
            </div>

            <div style={styles.infoFooter}>
              <a
                href={certificateUrl}
                download
                style={styles.downloadBtn}
              >
                ⬇️ Download Certificate
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  modalBackdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 20,
    backdropFilter: 'blur(4px)',
  },

  certificateContainer: {
    width: '100%',
    maxWidth: 1000,
    height: 'auto',
    maxHeight: '85vh',
    background: '#fff',
    borderRadius: 28,
    boxShadow: '0 40px 80px rgba(0, 0, 0, 0.35)',
    position: 'relative',
    display: 'grid',
    gridTemplateColumns: '1fr 360px',
    gap: 0,
    overflow: 'hidden',
    border: '2px solid rgba(26, 36, 105, 0.08)',
  },

  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    border: 'none',
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '50%',
    fontSize: 28,
    cursor: 'pointer',
    zIndex: 101,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)',
    transition: 'all 0.2s ease',
  },

  displayArea: {
    background: '#f5f7fc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    overflow: 'auto',
    borderRight: '1px solid rgba(26, 36, 105, 0.1)',
  },

  certificateImage: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
    borderRadius: 12,
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
  },

  pdfViewer: {
    width: '100%',
    height: '100%',
    border: 'none',
    borderRadius: 12,
  },

  infoOverlay: {
    background: 'linear-gradient(135deg, #f8f9ff 0%, #fffdfb 100%)',
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    overflowY: 'auto',
    borderLeft: '1px solid rgba(26, 36, 105, 0.08)',
  },

  infoCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },

  infoHeader: {
    paddingBottom: 12,
    borderBottom: '2px solid rgba(26, 36, 105, 0.1)',
  },

  infoTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 800,
    color: '#1a2469',
    letterSpacing: '-0.02em',
  },

  infoContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },

  infoRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },

  infoLabel: {
    fontSize: 11,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    fontWeight: 800,
    color: '#697490',
  },

  infoValue: {
    fontSize: 15,
    fontWeight: 600,
    color: '#1a2469',
    lineHeight: 1.5,
    wordBreak: 'break-word',
  },

  prizeValue: {
    background: 'linear-gradient(135deg, #f7e7b1, #d7ad34)',
    color: '#2a2104',
    padding: '6px 10px',
    borderRadius: 8,
    fontWeight: 800,
    fontSize: 13,
    display: 'inline-block',
    width: 'fit-content',
  },

  infoFooter: {
    paddingTop: 12,
    borderTop: '2px solid rgba(26, 36, 105, 0.1)',
    marginTop: 6,
  },

  downloadBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 16px',
    background: 'linear-gradient(135deg, #f6c55a, #d9a836)',
    color: '#2a2104',
    fontWeight: 800,
    fontSize: 13,
    borderRadius: 10,
    textDecoration: 'none',
    transition: 'all 0.2s ease',
    boxShadow: '0 8px 16px rgba(246, 197, 90, 0.25)',
    border: 'none',
    cursor: 'pointer',
  },
}
