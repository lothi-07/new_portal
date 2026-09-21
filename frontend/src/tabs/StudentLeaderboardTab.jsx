import { useEffect, useState } from 'react'
import { getLeaderboard } from '../api'

export default function StudentLeaderboardTab({ studentId }) {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getLeaderboard({ limit: 25 })
      .then(({ data }) => setStudents(Array.isArray(data) ? data : []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={styles.loadingWrap}>
        <div style={styles.spinner} />
        <p>Loading institutional leaderboard...</p>
      </div>
    )
  }

  const topThree = students.slice(0, 3)
  const remaining = students.slice(3)

  return (
    <div style={styles.wrap}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.badge}>INSTITUTIONAL RANKINGS</div>
        <h1 style={styles.title}>Campus Leaderboard</h1>
        <p style={styles.subtitle}>
          Celebrating academic excellence, competitive symposium victories, hackathons, and sports achievements across all engineering departments.
        </p>
      </div>

      {students.length === 0 ? (
        <div style={styles.emptyCard}>
          <div style={styles.emptyIcon}>🏆</div>
          <h3 style={styles.emptyTitle}>No Leaderboard Entries Yet</h3>
          <p style={styles.emptyDesc}>Be the first to record an achievement and claim the #1 spot!</p>
        </div>
      ) : (
        <>
          {/* ── Top 3 Podium Display ── */}
          {topThree.length > 0 && (
            <div style={styles.podiumGrid}>
              {/* Silver (2nd) */}
              {topThree[1] && (
                <div style={{ ...styles.podiumCard, order: 1 }}>
                  <div style={styles.podiumMedal}>🥈</div>
                  <div style={styles.podiumRank}>#2 Rank</div>
                  <div style={styles.podiumAvatar}>
                    {(topThree[1].name?.[0] || 'S').toUpperCase()}
                  </div>
                  <div style={styles.podiumName}>{topThree[1].name}</div>
                  <div style={styles.podiumRoll}>{topThree[1].roll_no}</div>
                  <div style={styles.podiumScore}>
                    {topThree[1].total_events || topThree[1].achievement_count || 0} Achievements
                  </div>
                  <div style={styles.podiumXp}>
                    {(topThree[1].total_points || topThree[1].achievement_count || 0) * 100} XP
                  </div>
                </div>
              )}

              {/* Gold (1st) */}
              {topThree[0] && (
                <div style={{ ...styles.podiumCard, ...styles.podiumCardFirst, order: 0 }}>
                  <div style={styles.crownIcon}>👑</div>
                  <div style={styles.podiumMedal}>🥇</div>
                  <div style={{ ...styles.podiumRank, color: '#b45309' }}>#1 Champion</div>
                  <div style={{ ...styles.podiumAvatar, ...styles.podiumAvatarFirst }}>
                    {(topThree[0].name?.[0] || 'S').toUpperCase()}
                  </div>
                  <div style={styles.podiumName}>{topThree[0].name}</div>
                  <div style={styles.podiumRoll}>{topThree[0].roll_no}</div>
                  <div style={styles.podiumScore}>
                    {topThree[0].total_events || topThree[0].achievement_count || 0} Achievements
                  </div>
                  <div style={styles.podiumXpFirst}>
                    {(topThree[0].total_points || topThree[0].achievement_count || 0) * 100} XP
                  </div>
                </div>
              )}

              {/* Bronze (3rd) */}
              {topThree[2] && (
                <div style={{ ...styles.podiumCard, order: 2 }}>
                  <div style={styles.podiumMedal}>🥉</div>
                  <div style={styles.podiumRank}>#3 Rank</div>
                  <div style={styles.podiumAvatar}>
                    {(topThree[2].name?.[0] || 'S').toUpperCase()}
                  </div>
                  <div style={styles.podiumName}>{topThree[2].name}</div>
                  <div style={styles.podiumRoll}>{topThree[2].roll_no}</div>
                  <div style={styles.podiumScore}>
                    {topThree[2].total_events || topThree[2].achievement_count || 0} Achievements
                  </div>
                  <div style={styles.podiumXp}>
                    {(topThree[2].total_points || topThree[2].achievement_count || 0) * 100} XP
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Remaining Rankings List ── */}
          <div style={styles.listCard}>
            <div style={styles.listHeaderRow}>
              <span style={{ width: 50 }}>RANK</span>
              <span style={{ flex: 1 }}>SCHOLAR</span>
              <span style={{ width: 140, textAlign: 'center' }}>ACHIEVEMENTS</span>
              <span style={{ width: 100, textAlign: 'right' }}>POINTS</span>
            </div>

            <div style={styles.rowsContainer}>
              {students.map((student, index) => {
                const isMe = student.id === studentId
                const rank = index + 1
                return (
                  <div
                    key={student.id || index}
                    style={{
                      ...styles.row,
                      ...(isMe ? styles.rowCurrent : {}),
                    }}
                  >
                    <div style={styles.rankCol}>
                      <span style={rank <= 3 ? styles.rankTopPill : styles.rankNormalPill}>
                        #{rank}
                      </span>
                    </div>

                    <div style={styles.nameCol}>
                      <div style={styles.studentInitial}>
                        {(student.name?.[0] || 'S').toUpperCase()}
                      </div>
                      <div>
                        <div style={styles.studentName}>
                          {student.name} {isMe && <span style={styles.meBadge}>You</span>}
                        </div>
                        <div style={styles.studentSub}>
                          {student.roll_no} • {student.year || 'I'} Year
                        </div>
                      </div>
                    </div>

                    <div style={styles.achieveCol}>
                      <span style={styles.achievePill}>
                        {student.total_events || student.achievement_count || 0} events
                      </span>
                    </div>

                    <div style={styles.pointsCol}>
                      <strong>{(student.total_points || student.achievement_count || 0) * 100}</strong>
                      <span>XP</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

/* ── Modern Styles ── */
const styles = {
  wrap: {
    maxWidth: 960,
    margin: '0 auto',
  },
  loadingWrap: {
    padding: 60,
    textAlign: 'center',
    color: '#64748b',
  },
  spinner: {
    width: 32,
    height: 32,
    border: '3px solid #e2e8f0',
    borderTopColor: '#2563eb',
    borderRadius: '50%',
    margin: '0 auto 16px',
  },
  header: {
    marginBottom: 28,
  },
  badge: {
    display: 'inline-block',
    fontSize: 10.5,
    fontWeight: 800,
    color: '#2563eb',
    background: '#eff6ff',
    padding: '4px 10px',
    borderRadius: 6,
    letterSpacing: '0.06em',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 800,
    color: '#0f172a',
    letterSpacing: '-0.025em',
    margin: '0 0 8px',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 1.55,
    margin: 0,
    maxWidth: 620,
  },
  emptyCard: {
    background: '#ffffff',
    borderRadius: 16,
    border: '1px solid #e2e8f0',
    padding: '60px 24px',
    textAlign: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 800,
    color: '#0f172a',
    margin: '0 0 6px',
  },
  emptyDesc: {
    fontSize: 13.5,
    color: '#64748b',
    margin: 0,
  },

  /* Podium */
  podiumGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 16,
    marginBottom: 24,
    alignItems: 'end',
  },
  podiumCard: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 18,
    padding: '24px 18px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    boxShadow: '0 4px 12px -2px rgba(15, 23, 42, 0.05)',
  },
  podiumCardFirst: {
    background: 'linear-gradient(180deg, #fffbeb 0%, #ffffff 100%)',
    borderColor: '#fde68a',
    boxShadow: '0 10px 25px -5px rgba(245, 158, 11, 0.15)',
    transform: 'translateY(-8px)',
  },
  crownIcon: {
    fontSize: 24,
    marginBottom: -8,
  },
  podiumMedal: {
    fontSize: 28,
  },
  podiumRank: {
    fontSize: 12,
    fontWeight: 800,
    color: '#64748b',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  podiumAvatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    background: '#f1f5f9',
    color: '#0f172a',
    fontSize: 20,
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '6px 0',
  },
  podiumAvatarFirst: {
    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
    color: '#ffffff',
    width: 60,
    height: 60,
    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)',
  },
  podiumName: {
    fontSize: 15,
    fontWeight: 800,
    color: '#0f172a',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '100%',
  },
  podiumRoll: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: 600,
  },
  podiumScore: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: 700,
    color: '#2563eb',
    background: '#eff6ff',
    padding: '3px 10px',
    borderRadius: 999,
  },
  podiumXp: {
    fontSize: 13,
    fontWeight: 800,
    color: '#059669',
  },
  podiumXpFirst: {
    fontSize: 14,
    fontWeight: 800,
    color: '#b45309',
  },

  /* List */
  listCard: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.05)',
  },
  listHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 20px',
    background: '#0f172a',
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.06em',
  },
  rowsContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    padding: '14px 20px',
    borderBottom: '1px solid #f1f5f9',
    transition: 'background 0.15s ease',
  },
  rowCurrent: {
    background: '#eff6ff',
  },
  rankCol: {
    width: 50,
  },
  rankNormalPill: {
    fontSize: 13,
    fontWeight: 700,
    color: '#64748b',
  },
  rankTopPill: {
    fontSize: 13,
    fontWeight: 800,
    color: '#2563eb',
  },
  nameCol: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  studentInitial: {
    width: 34,
    height: 34,
    borderRadius: 10,
    background: '#f1f5f9',
    color: '#334155',
    fontWeight: 700,
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentName: {
    fontSize: 14,
    fontWeight: 700,
    color: '#0f172a',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  meBadge: {
    fontSize: 9.5,
    fontWeight: 800,
    color: '#ffffff',
    background: '#2563eb',
    padding: '1px 7px',
    borderRadius: 999,
  },
  studentSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  achieveCol: {
    width: 140,
    textAlign: 'center',
  },
  achievePill: {
    fontSize: 12,
    fontWeight: 700,
    color: '#475569',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    padding: '4px 10px',
    borderRadius: 999,
  },
  pointsCol: {
    width: 100,
    textAlign: 'right',
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'flex-end',
    gap: 4,
    color: '#059669',
  },
}
