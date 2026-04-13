# Mini EMR & Patient Portal

A full-stack, minimal Electronic Medical Records (EMR) system and Patient Portal. This application allows healthcare administrators to manage patient records, schedule appointments, and prescribe medications (including recurring schedules). Patients can log into their portal to view upcoming appointments, prescription refills.

## 🚀 Live Demo

- **Patient & Admin Portal**: [https://mini-emr-application.netlify.app](https://mini-emr-application.netlify.app)


*Note: The backend is hosted on a free Render tier and may take ~50 seconds to spin up if it has been inactive.*

## ✨ Features

**Admin Dashboard:**
- View and manage a list of all patients.
- Edit patient details (Name, Email).
- **Appointments:** Schedule, edit, and delete patient appointments. Support for recurring schedules (Weekly, Monthly).
- **Prescriptions:** Add, edit, and delete medication prescriptions. Supports dosage, quantity, and auto-refill scheduling.

**Patient Portal:**
- Secure login using JWT authentication.
- Welcome dashboard highlighting appointments and medication refills over the next 7 days.


## 🛠 Tech Stack

**Frontend:**
- Next.js (React)
- Tailwind CSS
- TypeScript


**Backend:**
- Python 3
- FastAPI
- SQLAlchemy (ORM)
- SQLite (Local/Default DB)
- JWT (JSON Web Tokens) & `bcrypt` for authentication/security

## 💻 Local Development Setup

To run this project locally, you will need **Node.js** and **Python 3** installed.

### 1. Clone the repository
```bash
git clone https://github.com/Pranav543/mini-emr-application.git
cd mini-emr-application
```

### 2. Backend Setup
```bash
cd backend

# Create a virtual environment (optional but recommended)
python3 -m venv .venv
source .venv/bin/activate  
# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server
uvicorn app.main:app --reload --port 8000
```
*The backend API will be available at `http://localhost:8000`.*

### 3. Frontend Setup
Open a new terminal window.
```bash
cd frontend

# Install dependencies
npm install

# Start the Next.js development server
npm run dev
```
*The frontend will be available at `http://localhost:3000`.*

### Environment Variables
For local development, the frontend automatically defaults to `http://127.0.0.1:8000`. If you wish to explicitly set it, you can create a `.env.local` file in the `frontend` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```
