# LabOdc 
**English:** LabOdc - A System for Managing Enterprise-Student Collaborations at UTH on Real-World Projects
**Vietnamese:** LabOdc - Hệ thống quản lý kết nối doanh nghiệp với sinh viên UTH trong dự án thực tế.
**Abbreviation:** LabOdc.

## 3.2. Context & Problem Statement
- In the era of digital transformation and globalization, the demand for high-quality IT talent is rapidly increasing. However, enterprises—especially SMEs and startups—face challenges adopting the ODC model due to limited resources, talent–experience gap, and lack of a transparent collaboration platform:
  - **Limited resources:** SMEs and startups often require technology projects but lack sufficient budget and manpower.
  - **Talent–experience gap:** UTH University students possess strong theoretical knowledge but have limited real-world project experience, making it difficult to meet enterprise expectations.
  - **Labor market mismatch:** Enterprises seek experienced IT professionals, while fresh graduates struggle to meet industry standards.
  - **No official connection platform:** There is currently no transparent channel for enterprises and students to collaborate effectively.
  - **High project risks:** Many projects stall due to high costs, unreliable human resources, and the absence of a fair and transparent funding mechanism.

## 3.3. Our Solution
- LabOdc provides a non-profit Lab-based ODC System designed specifically for UTH University, enabling enterprises and students across multiple disciplines to collaborate on real-world projects with transparency and accountability.
  - **Project Connection & Validation:** Enterprises submit projects, Lab validates information before publishing.
  - **Team Formation:** Students voluntarily join projects; teams are recorded with clear lead and mentor roles.
  - **Supervised Operation:** Mentors oversee progress and submit monthly/phase reports to Lab. Task breakdown and tracking are performed using standardized Excel/Docs templates provided by LabOdc, ensuring consistency without relying on external project management platforms (e.g., Jira, Trello).
  - **Transparent Fund & Payment:** Enterprise contributions are distributed under a fixed 70/20/10 rule (Team/Mentor/Lab), visible to all stakeholders.
  - **Hybrid Fund Support:** In case enterprises delay payments, Lab temporarily advances support to ensure students and mentors still receive allowances on time.
  - **Risk & Contribution Recording:** The system records deliverables, late payments, cancellations, and team contributions for accountability.

- **Benefits for Businesses:**
  - With LabOdc, businesses can:
    - Cost-effective access to IT talent.
    - Transparency in fund allocation and project progress.
    - Reduced risk: Lab enforces rules on payments, cancellations, and reporting.
    - Flexibility: Engage in small-scale projects without handling training or HR processes.

- **Key Features of LabOdc include:**

### 3.3.1. Enterprise Dashboard
- Register & manage business profile.
- Submit projects for validation.
- Make payments, request cancellations/scope changes.
- View reports, acceptance results, and evaluations.

### 3.3.2. Candidate Portal
- Manage personal profile (skills, certifications, portfolio).
- Join approved projects, view assigned tasks.
- Talent Leader: manage fund redistribution, submit performance reports.

### 3.3.3. Mentor Dashboard
- Accept project invitations, interview candidates (if required).
- Break down tasks using LabOdc Excel templates.
- Evaluate talents, compile & submit reports.
- Confirm redistribution & appoint team lead.

*Note: Task breakdown and tracking are performed using standardized Excel/Docs templates officially provided by LabOdc. This guarantees a consistent process across all projects, without requiring integration with external project management platforms such as Jira or Trello.*

### 3.3.4. Lab Admin Dashboard
- Manage enterprises, projects, mentors, and talents.
- Validate proposals & allocate funds (70/20/10).
- Publish transparency reports & monthly summaries.
- Approve/disapprove scope change requests.

### 3.3.5. System Admin Dashboard
- Configure system settings.
- Manage roles, permissions, and technical users.
- Maintain Excel templates.

## 3.4. Actors

### 3.4.1. System Administrator
- Manage system configuration, roles, permissions, and Excel templates.

### 3.4.2. Company (Enterprise)
- Register business account, propose projects, make payments, request scope changes/cancellation, evaluate results.

### 3.4.3. Talent (Candidate)
- Register, join projects, view assigned tasks, receive mentor feedback.

### 3.4.4. Talent Leader 
*(A designated Talent role, appointed by the Mentor or elected by the team)*
- Redistribute funds to members, submit team reports, represent team in communications.

### 3.4.5. Mentor
- Guide teams, assign tasks, evaluate performance, compile reports, confirm redistribution, optionally appoint team lead.

### 3.4.6. Lab Administrator
- Validate enterprises/projects, manage businesses/projects/mentors/talents, allocate funds, publish reports.

## 3.5. Non-functional requirements
- **System Reliability:** 99.0% uptime for both the candidate/enterprise portal and admin dashboard.
- **Performance:** The portal and dashboard must be responsive, with job/project listings loading under 5 seconds; payment processing under 3 seconds.
- **Scalability:** The system must support hundreds of concurrent users and a high volume of applications and training sessions during recruitment or onboarding peaks.
- **Security:** All user data, especially payment information, must be encrypted.
- **User Experience (UX):** The portal must have an intuitive, professional interface for candidates and enterprises. The admin dashboard must be straightforward for administrators and trainers.

## 3.6. Main Proposal Content (System Requirements and Deliverables)

### 3.6.1. Documentation Requirements
- Complete software development lifecycle documentation using UML 2.0.
- Required documents:
  - User Requirements Document (URD)
  - Software Requirements Specification (SRS)
  - Software Architecture Document (SAD)
  - Detailed Design Document (DDD)
  - Implementation Documentation
  - Test Documentation
  - Installation Guide
  - Source Code Documentation
  - Deployment Package Documentation

### 3.6.2. Technical Stack
- **Backend:** NodeJS, NestJS
- **Database:** PostgreSQL, Redis, Elasticsearch
- **Mobile App (Frontend):** Flutter
- **Web (Frontend):** ReactJs with Typescript
- **Third-party Services:** PayOS, Cloudinary
- **Deployment:** Docker, AWS

### 3.6.3. System Components
- **Applications:**
  - **LabOdc Portal:** For candidates and enterprises (web-based).
  - **Admin Dashboard:** A web-based application for administrators and trainers.
  - **Backend Services:** RESTful APIs to handle all data and business logic.
- **Data Storage:**
  - **PostgreSQL:** To store user data, job/project information, transactions (payments/rewards), and training modules.
  - **Cloudinary:** To store user avatars, training documents, and portfolio images.
- **Architecture:**
  - **RESTful API:** For communication between the mobile app, dashboard, and backend.
  - **Authentication:** JWT (JSON Web Tokens) for secure user sessions.