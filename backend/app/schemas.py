from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

class AppointmentBase(BaseModel):
    provider: str
    datetime: datetime
    repeat: Optional[str] = None

class AppointmentCreate(AppointmentBase):
    pass

class Appointment(AppointmentBase):
    id: int
    user_id: int
    class Config:
        from_attributes = True

class PrescriptionBase(BaseModel):
    medication: str
    dosage: str
    quantity: int
    refill_on: str
    refill_schedule: Optional[str] = None

class PrescriptionCreate(PrescriptionBase):
    pass

class Prescription(PrescriptionBase):
    id: int
    user_id: int
    class Config:
        from_attributes = True

class UserBase(BaseModel):
    name: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    appointments: List[Appointment] = []
    prescriptions: List[Prescription] = []
    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
