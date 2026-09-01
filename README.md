# Student Achievement Portal - ESEC

A modern web application for managing student achievements, certificates, and event participation at Erode Sengunthar Engineering College.

## Features

- ✅ **Modern Dashboard**: Tabbed interface with Student Details, Participation, and Certificates
- ✅ **Student Login**: Secure roll number + mobile authentication
- ✅ **Welcome Screen**: Personalized greeting after login
- ✅ **Certificate Management**: Upload and view certificates with full-screen modal viewer
- ✅ **Achievement Tracking**: Track participation and prizes
- ✅ **Dark Theme**: Modern dark navy and golden accent design
- ✅ **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

### Frontend
- React 18+ with Hooks
- Vite (build tool)
- CSS-in-JS (inline styles)
- Google OAuth

### Backend
- FastAPI (Python)
- PostgreSQL (Supabase)
- SQLAlchemy ORM
- Email notifications

## Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 16+
- PostgreSQL (or Supabase account)
- Google OAuth credentials

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd new_portal
   ```

2. **Create virtual environment**
   ```bash
   python -m venv .venv
   .venv\Scripts\activate  # Windows
   source .venv/bin/activate  # macOS/Linux
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase and database credentials
   ```

5. **Initialize database**
   ```bash
   python seed.py
   ```

6. **Run backend server**
   ```bash
   python app/main.py
   # Server runs on http://localhost:8000
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Google OAuth Client ID
   ```

4. **Start development server**
   ```bash
   npm run dev
   # App runs on http://localhost:5173
   ```

5. **Build for production**
   ```bash
   npm run build
   # Output in dist/ folder
   ```

## Usage

### For Students

1. Navigate to `http://localhost:5173`
2. Click "Student" button
3. Enter your Roll Number and Mobile Number
4. View the welcome screen with your name
5. Click "Go to Dashboard" to access:
   - **Student Details**: View your information (roll no, year, department, etc.)
   - **Participation**: Upload event vouchers and add achievements
   - **Certificates**: Upload and view your certificates

### For Staff

1. Click "Staff" button on login page
2. Sign in with Google or email
3. Access admin features (implementation in progress)

## File Structure

```
new_portal/
├── app/                    # Backend (FastAPI)
│   ├── main.py            # Main application
│   ├── models.py          # Database models
│   ├── schemas.py         # Data schemas
│   ├── routers/           # API routes
│   ├── auth.py            # Authentication
│   └── database.py        # Database connection
├── frontend/              # Frontend (React + Vite)
│   ├── src/
│   │   ├── App.jsx        # Main component
│   │   ├── LoginPage.jsx  # Login interface
│   │   ├── StudentView.jsx # Student dashboard
│   │   ├── StaffView.jsx  # Staff dashboard
│   │   └── api.js         # API client
│   └── package.json
├── .env.example           # Environment variables template
├── .gitignore            # Git ignore rules
└── README.md             # This file
```

## Environment Variables

### Backend (.env)
```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
SECRET_KEY=your_secret_key
DATABASE_URL=your_database_url
```

### Frontend (frontend/.env)
```
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_API_URL=http://localhost:8000
```

## Security Notes

⚠️ **IMPORTANT**: Never commit `.env` files to Git!
- Use `.env.example` as a template
- Keep `.env` files in `.gitignore` (already configured)
- Never share or commit API keys, secrets, or credentials
- Rotate secrets regularly in production

## Development

### Running Tests
```bash
# Backend
cd app && pytest

# Frontend
cd frontend && npm test
```

### Code Quality
```bash
# Backend linting
pylint app/

# Frontend linting
npm run lint
```

## Deployment

### Production Checklist
- [ ] Set all environment variables securely
- [ ] Use production database URL
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Set up CI/CD pipeline
- [ ] Test all authentication flows
- [ ] Backup database before deployment
- [ ] Set up error logging and monitoring

## Support

For issues or feature requests, please contact the development team.

## License

This project is proprietary software for ESEC. Unauthorized copying or distribution is prohibited.

---

**Last Updated**: September 2026
**Version**: 1.0.0
