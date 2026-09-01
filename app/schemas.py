from pydantic import BaseModel, EmailStr
from typing import Optional, List


class AchievementBase(BaseModel):
    event_name: str
    event_type: Optional[str] = None
    prize_type: Optional[str] = None
    event_date: Optional[str] = None
    organizer: Optional[str] = None


class AchievementCreate(AchievementBase):
    student_id: int


class AchievementOut(AchievementBase):
    id: int
    student_id: int
    source: Optional[str] = "manual"
    certificate_upload_path: Optional[str] = None
    output_type: Optional[str] = None
    output_path: Optional[str] = None

    class Config:
        from_attributes = True


class StudentBase(BaseModel):
    roll_no: str
    reg_no: Optional[str] = None
    first_name: str
    last_name: Optional[str] = None
    gender: Optional[str] = None
    dob: Optional[str] = None
    blood_group: Optional[str] = None
    mobile_number: Optional[str] = None
    email: Optional[str] = None
    year: Optional[str] = "I"
    department: Optional[str] = "AI & DS"
    section: str
    photo_path: Optional[str] = None


class StudentCreate(StudentBase):
    pass


class StudentOut(StudentBase):
    id: int
    achievement_count: Optional[int] = 0

    class Config:
        from_attributes = True


class StudentDetail(StudentOut):
    achievements: List[AchievementOut] = []

    class Config:
        from_attributes = True


class AdminSignup(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None


class AdminLogin(BaseModel):
    email: EmailStr
    password: str


class StaffCreate(AdminSignup):
    pass


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    email: str
    name: Optional[str] = None
    role: str = "admin"
