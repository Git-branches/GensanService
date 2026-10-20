# System Requirements

## 1. System Overview

**System Name:** Andam GenSan

**System Type:** Web-Based Government Service Information Platform

**Target Users:** Residents of General Santos City, visitors seeking local service information, and authorized system administrators.

Andam GenSan provides organized information about government services, document requirements, application procedures, and relevant office details. It is an independent information platform and is not an official government portal.

## 2. Functional Requirements

### 2.1 Public Access

The system shall:

- Allow visitors to access published service information without registering.
- Display a homepage with search and service categories.
- Allow users to browse services by category and government agency.
- Display service details, requirements, eligibility conditions, and application steps.
- Provide links to official agency websites and source references.
- Display the last-verified date for service information when available.
- Provide a directory of verified agencies, branches, and local offices.
- Support desktop, tablet, and mobile screen sizes.

### 2.2 Search and Navigation

The system shall:

- Allow users to search for services by name or relevant keywords.
- Allow users to filter services by category or agency.
- Display relevant results in a readable format.
- Provide navigation between service guides and related agencies.

### 2.3 Document Checklist

The system shall:

- Display required documents for each service.
- Allow users to mark checklist items as completed during their session.
- Support saving checklist progress for authenticated users if accounts are implemented.
- Explain that checklist completion does not guarantee government application approval.

### 2.4 User Accounts (Optional)

If user accounts are implemented, the system shall:

- Allow users to register, log in, and log out.
- Allow authenticated users to save favorite services.
- Allow authenticated users to save and retrieve checklist progress.
- Protect personal information and prevent unauthorized access to saved data.

### 2.5 Administrator Management

The system shall:

- Provide a secure administrator login.
- Allow authorized administrators to create, edit, publish, and archive service guides.
- Allow administrators to manage agencies, office branches, and service categories.
- Allow administrators to manage document requirements and application steps.
- Store official source URLs and verification dates.
- Allow administrators to review reports of incorrect or outdated information.
- Record important administrative actions in an activity log.
- Restrict administrative functions through backend authorization.

### 2.6 Content Accuracy

The system shall:

- Identify the responsible agency for each service.
- Provide official references whenever available.
- Avoid publishing unverified fees, processing times, addresses, or requirements as confirmed facts.
- Support the review and updating of potentially outdated information.
- Clearly state that the platform is independent and not an official government website.

## 3. Non-Functional Requirements

### 3.1 Performance

- Pages should load efficiently on typical internet connections.
- Search results should appear within a reasonable response time under normal operating conditions.
- Database queries should use appropriate indexes where needed.
- Images and other static assets should be optimized.

### 3.2 Usability

- The interface should be clear, consistent, and easy to navigate.
- Requirements and procedures should use simple language.
- Application steps should be presented in a logical order.
- Important links and buttons should be easy to identify.
- Forms should provide clear validation and error messages.

### 3.3 Accessibility

- Text should have sufficient contrast against its background.
- Form fields should have descriptive labels.
- Interactive controls should support keyboard navigation where practical.
- Images conveying information should include appropriate alternative text.
- The layout should remain usable at different screen sizes.

### 3.4 Security

- Passwords must be hashed using PHP password-hashing functions.
- Database access must use PDO prepared statements.
- Backend endpoints must validate and authorize protected operations.
- Input validation must be performed on the server.
- Production deployment must use HTTPS.
- Authentication sessions and cookies must be configured securely.
- CSRF protection, rate limiting, and other applicable safeguards must be implemented.
- Sensitive configuration values must be stored outside public source code.
- The system must not collect government account passwords or OTPs.

### 3.5 Reliability and Maintainability

- The application should separate frontend, backend, and database responsibilities.
- The backend should return consistent JSON responses.
- Errors should be logged without exposing sensitive information to users.
- Database backups should be maintained for production deployments.
- Code should use a consistent structure and naming convention.

### 3.6 Compatibility

The system should support recent versions of commonly used browsers, including:

- Google Chrome
- Microsoft Edge
- Mozilla Firefox
- Safari

The system should be responsive on desktop computers, laptops, tablets, and smartphones.

## 4. Technical Requirements

### 4.1 Frontend Technologies

| Technology | Purpose |
|---|---|
| React | User interface development |
| Vite | Development server and build tooling |
| Tailwind CSS | Responsive styling |
| React Router | Client-side navigation |
| Fetch API | Communication with the backend |
| Lucide React | Interface icons |

### 4.2 Backend Technologies

| Technology | Purpose |
|---|---|
| PHP 8.2+ | Server-side application logic |
| REST API | Communication between frontend and backend |
| PDO | Database connectivity |
| Composer | PHP dependency management |

### 4.3 Database

| Technology | Purpose |
|---|---|
| MySQL 8+ or compatible MariaDB | Store service, agency, user, and administrative data |

### 4.4 Development Tools

- Visual Studio Code
- XAMPP
- Node.js LTS
- npm
- Composer
- Git and GitHub
- A modern web browser

## 5. Hardware Requirements

These are recommended development and usage specifications, not strict minimums.

### 5.1 Development Computer

- Processor: Dual-core processor or better
- RAM: 8 GB recommended
- Storage: At least 5 GB of free space for the project and dependencies
- Operating System: Windows 10/11, macOS, or a compatible Linux distribution
- Internet connection: Recommended for downloading dependencies and verifying official sources

### 5.2 End-User Device

- Desktop computer, laptop, tablet, or smartphone
- Updated web browser
- Internet connection
- Screen capable of displaying the responsive interface

## 6. Software and Environment Requirements

### 6.1 Local Development

- Frontend development server: Vite
- Backend development server: PHP built-in server or Apache
- Database server: MySQL or compatible MariaDB
- Database administration: phpMyAdmin or another compatible tool

### 6.2 Production Deployment

The production environment should provide:

- A web server configured for PHP.
- A supported PHP version and required extensions.
- A MySQL-compatible database.
- HTTPS with a valid TLS certificate.
- Environment-specific configuration and secret management.
- Database backup and recovery procedures.
- Appropriate server permissions and access controls.

The frontend can be built into static assets and served separately or through the same hosting environment as the PHP API.

## 7. Database Requirements

The database is expected to support the following data groups:

- Service categories
- Government agencies
- Office branches and contact details
- Service guides
- Eligibility conditions
- Document requirements
- Application steps
- Official sources and verification dates
- Optional user accounts
- Optional saved checklists and favorites
- Administrator accounts and roles
- Administrative activity logs
- Reports about inaccurate or outdated information

The final table structure will be defined during database design.

## 8. API Requirements

The backend should expose JSON-based endpoints for:

- Retrieving published services and service details
- Retrieving service categories and agency information
- Authenticating users, if accounts are implemented
- Saving and retrieving user checklists, if supported
- Managing service content through authorized administrator endpoints
- Reviewing content reports and administrative activity

All protected operations must be validated and authorized on the backend.

## 9. Constraints and Assumptions

- The system provides information and guidance; it does not submit applications to government agencies.
- Government requirements and policies may change without notice.
- Official government sources should be prioritized for verification.
- Office contact information and opening hours must be verified before publication.
- Some services may require an in-person visit or use of an official government portal.
- Availability of user accounts and saved checklists depends on the final implementation.
- The platform does not guarantee the approval of any government application.

## 10. Acceptance Criteria

The system may be considered ready for an initial release when:

- Visitors can browse and search published service guides.
- Service pages display requirements and application steps clearly.
- Agency details and official source links are available where verified.
- Administrators can securely manage service content.
- Protected backend endpoints reject unauthorized requests.
- The interface works on desktop and mobile screens.
- Important workflows have been tested.
- Published information includes source references and verification dates where available.
- The system clearly identifies itself as an independent information platform.
