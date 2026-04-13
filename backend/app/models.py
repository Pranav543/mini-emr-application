from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)

    appointments = relationship("Appointment", back_populates="patient")
    prescriptions = relationship("Prescription", back_populates="patient")

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    provider = Column(String, index=True)
    datetime = Column(DateTime)
    repeat = Column(String)  # e.g., 'weekly', 'monthly' or null
    user_id = Column(Integer, ForeignKey("users.id"))

    patient = relationship("User", back_populates="appointments")

class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True, index=True)
    medication = Column(String, index=True)
    dosage = Column(String)
    quantity = Column(Integer)
    refill_on = Column(String) # Date string for simplicity or DateTime
    refill_schedule = Column(String)  # 'monthly', etc.
    user_id = Column(Integer, ForeignKey("users.id"))

    patient = relationship("User", back_populates="prescriptions")

# Static data tables (for dropdowns)
class MedicationDropdown(Base):
    __tablename__ = "medications"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)

class DosageDropdown(Base):
    __tablename__ = "dosages"
    
    id = Column(Integer, primary_key=True, index=True)
    amount = Column(String, unique=True, index=True)
