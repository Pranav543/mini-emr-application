import json
import logging
from sqlalchemy.orm import Session
from app.database import engine, SessionLocal
from app.models import Base, User, Appointment, Prescription, MedicationDropdown, DosageDropdown
from app.auth import get_password_hash
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

Base.metadata.create_all(bind=engine)

def seed_db():
    db = SessionLocal()
    try:
        # Check if already seeded
        if db.query(User).first():
            logger.info("Database is already seeded.")
            return

        with open("data.json", "r") as f:
            data = json.load(f)

        for user_data in data.get("users", []):
            hashed_pwd = get_password_hash(user_data["password"])
            db_user = User(
                id=user_data["id"],
                name=user_data["name"],
                email=user_data["email"],
                hashed_password=hashed_pwd
            )
            db.add(db_user)
            db.flush()

            for appt_data in user_data.get("appointments", []):
                db_appt = Appointment(
                    id=appt_data["id"],
                    provider=appt_data["provider"],
                    datetime=datetime.fromisoformat(appt_data["datetime"]),
                    repeat=appt_data["repeat"],
                    user_id=db_user.id
                )
                db.add(db_appt)
            
            for presc_data in user_data.get("prescriptions", []):
                db_presc = Prescription(
                    id=presc_data["id"],
                    medication=presc_data["medication"],
                    dosage=presc_data["dosage"],
                    quantity=presc_data["quantity"],
                    refill_on=presc_data["refill_on"],
                    refill_schedule=presc_data["refill_schedule"],
                    user_id=db_user.id
                )
                db.add(db_presc)

        for med in data.get("medications", []):
            db.add(MedicationDropdown(name=med))
        
        for dosage in data.get("dosages", []):
            db.add(DosageDropdown(amount=dosage))

        db.commit()
        logger.info("Database successfully seeded.")
    except Exception as e:
        db.rollback()
        logger.error(f"Error seeding db: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
