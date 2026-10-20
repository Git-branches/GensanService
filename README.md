# Andam GenSan

A web-based service information platform that helps residents of General Santos City find government service requirements, document checklists, application procedures, and official resources in one convenient place.

## About the Project

Andam GenSan is an independent community information platform designed to make government service information easier to understand and access.

Instead of searching across multiple websites, users can browse organized guides for services offered by agencies such as SSS, PhilHealth, Pag-IBIG, PSA, and verified local government offices.

**Important:** This is an independent information platform. It is not an official government website and does not represent or replace any government agency.

## Objectives

- Provide accessible government service information for General Santos City residents.
- Organize requirements and procedures into easy-to-follow guides.
- Provide document checklists to help users prepare before visiting an office.
- Link users to official government websites and resources.
- Maintain accurate information through source references and verification dates.
- Allow authorized administrators to manage and update published information.

## Main Features

### Public Features
- Homepage with service search.
- Browse services by category or government agency.
- Detailed service guides and requirements.
- Step-by-step application instructions.
- Document preparation checklists.
- Agency and local office directory.
- Official website links and contact information.
- Mobile-responsive interface.

### Optional User Features
- User registration and login.
- Save favorite services.
- Save checklist progress.
- View previously saved guides.

Public service information should remain accessible without requiring an account.

### Administrator Features
- Secure administrator login.
- Create, edit, publish, and archive service guides.
- Manage categories, agencies, and office branches.
- Manage requirements and application steps.
- Record source URLs and last-verified dates.
- Review reported incorrect information.
- Maintain administrator activity logs.

## Technology Stack

### Frontend
- React
- Vite
- Tailwind CSS
- React Router
- Fetch API
- Lucide React

### Backend
- PHP 8.2 or newer
- REST API
- PDO
- Composer

### Database
- MySQL 8+ or a compatible MariaDB version

### Development Tools
- Visual Studio Code
- XAMPP
- Node.js LTS and npm
- Git and GitHub

## Project Structure

```text
gensan-service-navigator/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── contexts/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── vite.config.js
│   └── package.json
├── backend/
│   ├── public/
│   │   └── api/
│   ├── routes/
│   ├── app/
│   │   ├── Controllers/
│   │   ├── Services/
│   │   ├── Models/
│   │   ├── Middleware/
│   │   └── Validators/
│   ├── config/
│   ├── storage/
│   │   └── logs/
│   └── composer.json
├── database/
│   ├── migrations/
│   ├── seeders/
│   └── schema.sql
├── docs/
│   └── system-requirements.md
├── .gitignore
└── README.md
```

*Note: This is the planned structure. Some folders and files will be created as development progresses.*

## Installation and Setup

### Prerequisites

Install the following:
- Node.js LTS and npm
- XAMPP with PHP and MySQL/MariaDB
- Composer
- Git
- Visual Studio Code

### 1. Set Up the Frontend

Open a terminal in the project directory.

If you have not created the React project yet:

```bash
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm install tailwindcss @tailwindcss/vite react-router-dom lucide-react
```

Choose **ESLint** when prompted to select a linter.

Configure `vite.config.js` to use the React and Tailwind Vite plugins. During local development, configure the `/api` proxy to forward requests to the PHP server at `http://127.0.0.1:8000`.

In `src/index.css`, add:

```css
@import "tailwindcss";
```

### 2. Set Up the Backend

Create the backend folders shown in the project structure.

Start the PHP development server from the project root on Windows:

```bash
C:\xampp\php\php.exe -S 127.0.0.1:8000 -t backend\public
```

Create a basic API health endpoint at:

```text
backend/public/api/health.php
```

Use it to verify that the PHP API is responding before connecting the frontend.

### 3. Start the Frontend

Open another terminal:

```bash
cd frontend
npm run dev
```

Open the local development URL displayed by Vite, usually:

```text
http://localhost:5173
```

### 4. Configure the Database

1. Start MySQL using the XAMPP Control Panel.
2. Create the project database.
3. Add the database schema in `database/schema.sql`.
4. Configure the database connection using environment-specific settings.
5. Use PDO prepared statements for database queries.

Do not commit production passwords, API keys, or other secrets to GitHub.

## Development Roadmap

- [ ] Phase 1: Project setup and database design
- [ ] Phase 2: Public homepage, search, and categories
- [ ] Phase 3: Service guide pages and office directory
- [ ] Phase 4: PHP REST API and database integration
- [ ] Phase 5: Administrator content management
- [ ] Phase 6: Optional user accounts and saved checklists
- [ ] Phase 7: Security checks, testing, and deployment
- [ ] Phase 8: Verify published service information and official links

## Information Accuracy

Every published service guide should include, where available:

- The government agency or office responsible.
- Required documents and eligibility conditions.
- Clear application steps.
- Official source links.
- Applicable fees and processing times only when verified.
- A last-verified date.

Requirements can change. Users should be encouraged to confirm important details with the responsible agency.

## Security and Privacy

- Use secure password hashing and verification.
- Use PDO prepared statements.
- Enforce authorization on the backend.
- Validate and sanitize incoming data.
- Use HTTPS in production.
- Apply appropriate session, cookie, CSRF, and rate-limiting protections.
- Collect only the personal information necessary for optional features.
- Never request government account passwords or one-time passwords (OTPs).

## Project Status

**Status:** In Development

## License

A license has not yet been selected. Add a suitable license before publicly distributing the source code.
