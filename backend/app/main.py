from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import List

from . import models, schemas, auth
from .database import engine, SessionLocal
from datetime import datetime

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Zealthy EMR & Patient Portal API")
from fastapi.middleware.cors import CORSMiddleware 
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"]) 


# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Auth
@app.post("/token", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

async def get_current_user(token: str = Depends(auth.oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = auth.jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = schemas.TokenData(email=email)
    except auth.JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.email == token_data.email).first()
    if user is None:
        raise credentials_exception
    return user


# Admin routes (No auth required per instructions)
@app.get("/admin/users", response_model=List[schemas.User])
def read_users(db: Session = Depends(get_db)):
    users = db.query(models.User).all()
    return users

@app.get("/admin/users/{user_id}", response_model=schemas.User)
def read_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.post("/admin/users", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(email=user.email, name=user.name, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.patch("/admin/users/{user_id}", response_model=schemas.User)
def update_user(user_id: int, user_update: schemas.UserUpdate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
         raise HTTPException(status_code=404, detail="User not found")
    if user_update.name: db_user.name = user_update.name
    if user_update.email: db_user.email = user_update.email
    if user_update.password: db_user.hashed_password = auth.get_password_hash(user_update.password)
    db.commit()
    db.refresh(db_user)
    return db_user

# Admin CRUD for Prescriptions
@app.post("/admin/users/{user_id}/prescriptions", response_model=schemas.Prescription)
def create_prescription(user_id: int, prescription: schemas.PrescriptionCreate, db: Session = Depends(get_db)):
    db_presc = models.Prescription(**prescription.dict(), user_id=user_id)
    db.add(db_presc)
    db.commit()
    db.refresh(db_presc)
    return db_presc

@app.patch("/admin/prescriptions/{presc_id}", response_model=schemas.Prescription)
def update_prescription(presc_id: int, presc_update: schemas.PrescriptionCreate, db: Session = Depends(get_db)):
    db_presc = db.query(models.Prescription).filter(models.Prescription.id == presc_id).first()
    if not db_presc:
         raise HTTPException(status_code=404, detail="Prescription not found")
    for key, value in presc_update.dict().items():
        setattr(db_presc, key, value)
    db.commit()
    db.refresh(db_presc)
    return db_presc

@app.delete("/admin/prescriptions/{presc_id}")
def delete_prescription(presc_id: int, db: Session = Depends(get_db)):
    db_presc = db.query(models.Prescription).filter(models.Prescription.id == presc_id).first()
    db.delete(db_presc)
    db.commit()
    return {"ok": True}

# Admin CRUD for Appointments
@app.post("/admin/users/{user_id}/appointments", response_model=schemas.Appointment)
def create_appointment(user_id: int, appt: schemas.AppointmentCreate, db: Session = Depends(get_db)):
    db_appt = models.Appointment(**appt.dict(), user_id=user_id)
    db.add(db_appt)
    db.commit()
    db.refresh(db_appt)
    return db_appt

@app.patch("/admin/appointments/{appt_id}", response_model=schemas.Appointment)
def update_appointment(appt_id: int, appt_update: schemas.AppointmentCreate, db: Session = Depends(get_db)):
    db_appt = db.query(models.Appointment).filter(models.Appointment.id == appt_id).first()
    if not db_appt:
         raise HTTPException(status_code=404, detail="Appointment not found")
    for key, value in appt_update.dict().items():
        setattr(db_appt, key, value)
    db.commit()
    db.refresh(db_appt)
    return db_appt

@app.delete("/admin/appointments/{appt_id}")
def delete_appointment(appt_id: int, db: Session = Depends(get_db)):
    db_appt = db.query(models.Appointment).filter(models.Appointment.id == appt_id).first()
    db.delete(db_appt)
    db.commit()
    return {"ok": True}

@app.get("/admin/medications")
def get_medications(db: Session = Depends(get_db)):
    return [m.name for m in db.query(models.MedicationDropdown).all()]

@app.get("/admin/dosages")
def get_dosages(db: Session = Depends(get_db)):
    return [d.amount for d in db.query(models.DosageDropdown).all()]

# Patient Portal routes 
@app.get("/portal/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user
