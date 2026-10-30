from sqlalchemy.orm import Session
from datetime import datetime
import random
from app.models.grievance import Grievance, GrievanceMessage, Status
from app.schemas.grievance import GrievanceCreate
from app.core.database import SessionLocal

def generate_ticket_id():
    year = datetime.now().year
    rand_num = random.randint(1000, 9999)
    return f"GRV-{year}-{rand_num}"

def create_grievance_record(employee_id: int, grievance_data: GrievanceCreate, db: Session = None) -> Grievance:
    session = db or SessionLocal()
    try:
        ticket_id = generate_ticket_id()
        
        while session.query(Grievance).filter(Grievance.ticket_id == ticket_id).first():
            ticket_id = generate_ticket_id()
            
        db_grievance = Grievance(
            ticket_id=ticket_id,
            employee_id=employee_id,
            title=grievance_data.title,
            description=grievance_data.description,
            category=grievance_data.category,
            priority=grievance_data.priority,
            relevant_policy_id=grievance_data.relevant_policy_id,
            status=Status.OPEN
        )
        session.add(db_grievance)
        session.commit()
        session.refresh(db_grievance)
        
        init_message = GrievanceMessage(
            grievance_id=db_grievance.id,
            sender_id=employee_id,
            sender_role="EMPLOYEE",
            message=grievance_data.description
        )
        session.add(init_message)
        session.commit()
        session.refresh(db_grievance)
        
        return db_grievance
    finally:
        if db is None:
            session.close()
