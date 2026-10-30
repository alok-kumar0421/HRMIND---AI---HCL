from sqlalchemy.orm import Session
from app.core.database import SessionLocal, Base, engine
from app.models.user import User, Role
from app.core.security import get_password_hash

def init_db(db: Session):
    Base.metadata.create_all(bind=engine)
    user = db.query(User).filter(User.email == "admin@hrmind.com").first()
    if not user:
        user = User(
            email="admin@hrmind.com",
            full_name="System Admin",
            hashed_password=get_password_hash("admin123"),
            role=Role.HR,
            is_active=True,
            is_temporary_password=False
        )
        db.add(user)
        db.commit()
        print("Initial HR user created: admin@hrmind.com / admin123")

if __name__ == "__main__":
    db = SessionLocal()
    init_db(db)
    db.close()

