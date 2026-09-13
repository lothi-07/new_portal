"""Gamification endpoints for student points, badges, and milestones."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from pydantic import BaseModel
from .. import models
from ..database import get_db
from ..auth import get_current_student_or_admin

router = APIRouter(prefix="/gamification", tags=["Gamification"])

# ==================== Pydantic Models ====================

class BadgeOut(BaseModel):
    id: int
    name: str
    emoji: str
    description: str
    milestone_events: int
    tier: int
    
    class Config:
        from_attributes = True


class StudentBadgeOut(BaseModel):
    badge: BadgeOut
    unlocked_at: str
    is_current: bool
    
    class Config:
        from_attributes = True


class StudentStatsOut(BaseModel):
    student_id: int
    total_points: int
    total_events: int
    current_badge: Optional[str]
    next_milestone_events: int  # Events needed to reach next badge
    next_milestone_points: int  # Points needed for next milestone
    progress_to_next: int  # Percentage 0-100
    badges_earned: list[BadgeOut]
    milestones_achieved: list[str]  # List of achieved milestone messages


class LeaderboardStudentOut(BaseModel):
    id: int
    roll_no: str
    first_name: str
    last_name: Optional[str]
    year: str
    section: str
    total_points: int
    total_events: int
    current_badge: Optional[str]
    rank: int


# ==================== Constants ====================

# Milestone badges
BADGES = [
    {
        "name": "First Step",
        "emoji": "🌱",
        "description": "You have taken your first step towards building your experience.",
        "milestone_events": 1,
        "tier": 1,
    },
    {
        "name": "Explorer",
        "emoji": "🥉",
        "description": "You have successfully participated in 3 events. Keep exploring and growing!",
        "milestone_events": 3,
        "tier": 2,
    },
    {
        "name": "Achiever",
        "emoji": "🥈",
        "description": "Amazing! You are actively developing your skills through competitions and events.",
        "milestone_events": 5,
        "tier": 3,
    },
    {
        "name": "Champion",
        "emoji": "🥇",
        "description": "Outstanding! Your continuous participation shows your dedication towards learning and growth.",
        "milestone_events": 10,
        "tier": 4,
    },
    {
        "name": "Elite Performer",
        "emoji": "💎",
        "description": "Incredible achievement! You are one of the most active participants.",
        "milestone_events": 20,
        "tier": 5,
    },
]

# Points system
POINTS_SYSTEM = {
    "Technical": 20,              # Hackathon, coding competition, etc.
    "Non-Technical": 15,          # Paper presentation, workshops, seminars
    "Sports": 10,                 # Sports events
    "Cultural": 10,               # Cultural events
    "Other": 5,                   # Other participation
}

PRIZE_MULTIPLIER = {
    "1st Prize": 2.5,
    "2nd Prize": 2.0,
    "3rd Prize": 1.5,
    "Participation": 1.0,
}


# ==================== Helper Functions ====================

def calculate_points(event_type: str, prize_type: str) -> int:
    """Calculate points for an achievement."""
    base_points = POINTS_SYSTEM.get(event_type, 5)
    multiplier = PRIZE_MULTIPLIER.get(prize_type, 1.0)
    return int(base_points * multiplier)


def get_achieved_badges(total_events: int) -> list[str]:
    """Get list of badge names achieved based on total events."""
    achieved = []
    for badge in BADGES:
        if total_events >= badge["milestone_events"]:
            achieved.append(badge["name"])
    return achieved


def get_next_milestone(total_events: int) -> tuple[int, str]:
    """Get events needed and next milestone name."""
    for badge in BADGES:
        if total_events < badge["milestone_events"]:
            return badge["milestone_events"], badge["name"]
    return 0, "Elite Performer"  # No more milestones


def update_student_stats(student_id: int, db: Session) -> None:
    """Recalculate and update student points and badges."""
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        return
    
    # Count achievements
    achievements = db.query(models.Achievement).filter(
        models.Achievement.student_id == student_id
    ).all()
    
    student.total_events = len(achievements)
    
    # Calculate total points
    total_points = 0
    for achievement in achievements:
        points = calculate_points(achievement.event_type or "Other", achievement.prize_type or "Participation")
        total_points += points
    student.total_points = total_points
    
    # Update current badge
    achieved_badges = get_achieved_badges(student.total_events)
    if achieved_badges:
        student.current_badge = achieved_badges[-1]  # Get highest badge
    
    db.add(student)
    db.commit()


# ==================== API Endpoints ====================

@router.get("/stats/{student_id}", response_model=StudentStatsOut)
def get_student_stats(student_id: int, db: Session = Depends(get_db)):
    """Get gamification stats for a student."""
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get achievements
    achievements = db.query(models.Achievement).filter(
        models.Achievement.student_id == student_id
    ).all()
    
    total_events = len(achievements)
    total_points = sum(
        calculate_points(a.event_type or "Other", a.prize_type or "Participation")
        for a in achievements
    )
    
    # Get achieved badges
    achieved = get_achieved_badges(total_events)
    current_badge = achieved[-1] if achieved else None
    
    # Get next milestone
    next_events, next_badge_name = get_next_milestone(total_events)
    events_to_next = max(0, next_events - total_events)
    progress = int((total_events / next_events * 100)) if next_events > 0 else 100
    
    return StudentStatsOut(
        student_id=student_id,
        total_points=total_points,
        total_events=total_events,
        current_badge=current_badge,
        next_milestone_events=events_to_next,
        next_milestone_points=0,  # Can be implemented for points-based milestones
        progress_to_next=progress,
        badges_earned=[
            BadgeOut(
                id=i,
                name=b["name"],
                emoji=b["emoji"],
                description=b["description"],
                milestone_events=b["milestone_events"],
                tier=b["tier"],
            )
            for i, b in enumerate(BADGES) if b["name"] in achieved
        ],
        milestones_achieved=[
            f"🎉 {b['emoji']} {b['name']}: {b['description']}"
            for b in BADGES if b["name"] in achieved
        ],
    )


@router.get("/leaderboard", response_model=list[LeaderboardStudentOut])
def get_leaderboard(
    year: Optional[str] = None,
    section: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """Get top students by points."""
    query = db.query(models.Student)
    if year:
        query = query.filter(models.Student.year == year)
    if section:
        query = query.filter(models.Student.section == section.upper())
    
    students = query.order_by(
        models.Student.total_points.desc(),
        models.Student.total_events.desc(),
    ).limit(limit).all()
    
    result = []
    for rank, student in enumerate(students, 1):
        result.append(LeaderboardStudentOut(
            id=student.id,
            roll_no=student.roll_no,
            first_name=student.first_name,
            last_name=student.last_name,
            year=student.year,
            section=student.section,
            total_points=student.total_points,
            total_events=student.total_events,
            current_badge=student.current_badge,
            rank=rank,
        ))
    
    return result


@router.get("/badges", response_model=list[BadgeOut])
def get_all_badges(db: Session = Depends(get_db)):
    """Get all available badges."""
    return [
        BadgeOut(
            id=i,
            name=b["name"],
            emoji=b["emoji"],
            description=b["description"],
            milestone_events=b["milestone_events"],
            tier=b["tier"],
        )
        for i, b in enumerate(BADGES)
    ]


@router.get("/motivational-message/{student_id}")
def get_motivational_message(student_id: int, db: Session = Depends(get_db)):
    """Get a personalized motivational message."""
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    total_events = student.total_events
    name = student.first_name
    
    if total_events == 0:
        message = f"🚀 Welcome, {name}! Start your journey by participating in your first event."
    elif total_events == 1:
        message = f"🎉 Great start, {name}! You have taken your first step towards building your experience."
    elif total_events == 3:
        message = f"🏆 Congratulations, {name}! You have successfully participated in 3 events. Keep exploring and growing!"
    elif total_events == 5:
        message = f"🚀 Amazing, {name}! You are actively developing your skills through competitions and events."
    elif total_events == 10:
        message = f"🔥 Outstanding, {name}! Your continuous participation shows your dedication towards learning and growth."
    elif total_events >= 20:
        message = f"👑 Incredible achievement, {name}! You are one of the most active participants. Keep inspiring others!"
    else:
        message = f"💪 Keep going, {name}! You're making great progress. {total_events} events down, more to go! 🚀"
    
    return {
        "message": message,
        "total_events": total_events,
        "current_badge": student.current_badge,
    }
