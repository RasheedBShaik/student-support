
# 🎓 Student Support & Ticket Management System

A full-stack web application that helps students raise administrative support requests and enables staff to manage, prioritize, assign, track, and resolve tickets through a structured workflow.

🌐 **Live Demo:** [Open Student Support](https://student-support-vms7.vercel.app/)

---

## 📌 Overview

The Student Support & Ticket Management System provides a centralized platform for handling student requests related to fees, attendance, ID cards, certificates, examinations, hostel services, transport, and other administrative needs.

Students can submit requests and track their progress, while staff members can manage tickets assigned to their departments.

## ✨ Key Features

### 👨‍🎓 Student Features

- Student authentication
- Create support tickets
- Select ticket categories and priorities
- View submitted tickets and ticket details
- Track ticket status and activity history
- View ticket ageing and resolution information

### 🧑‍💼 Staff Features

- Staff authentication
- Department-based ticket access
- Search and filter tickets
- Assign and reassign tickets
- Update ticket status and priority
- Add comments and activity updates
- Resolve, close, and reopen tickets
- Monitor service-level agreement (SLA) status

### 🔄 Ticket Workflow

Tickets can move through the following lifecycle:

```text
NEW
  ↓
ASSIGNED
  ↓
IN_PROGRESS
  ↓
PENDING / RESOLVED
  ↓
RESUMED / CLOSED
```

Pending states include:

- `PENDING_STUDENT`
- `PENDING_INTERNAL`

Tickets can also be reopened when additional work is required.

### ⏱️ SLA Management

The application uses priority-based resolution targets:

| Priority | Resolution Target |
|---|---:|
| Low | 72 hours |
| Medium | 48 hours |
| High | 24 hours |
| Urgent | 8 hours |

SLA status can indicate whether a ticket is on track, at risk, breached, completed, or has no SLA.

### 🔐 Access Control

- Students can access their own support tickets.
- Staff members can access tickets belonging to their department.
- Ticket assignments and updates are validated on the server.
- Ticket activity history records important actions.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Next.js | Full-stack web framework |
| React | User interface |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| MongoDB | Database |
| Mongoose | MongoDB object modeling |
| pnpm | Package management |

## 🏗️ Architecture

The application follows a full-stack Next.js architecture.

```text
Student / Staff
      │
      ▼
Next.js User Interface
      │
      ▼
API Routes
      │
      ▼
Authentication & Authorization
      │
      ▼
Database Logic
      │
      ▼
MongoDB
```

Core data entities include:

- User
- Department
- Ticket
- TicketActivity

## ⚙️ Getting Started

### Prerequisites

Make sure you have installed:

- Node.js
- pnpm
- MongoDB or an accessible MongoDB database
- Git (optional)

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/RasheedBShaik/student-support.git
```

**2. Navigate to the project directory**

```bash
cd student-support
```

**3. Install dependencies**

```bash
pnpm install
```

**4. Configure environment variables**

Create a `.env.local` file in the project root and configure the environment variables required by the application.

Use the variable names expected by the project configuration. Keep database credentials and other secrets private.

**5. Seed the database**

```bash
pnpm exec tsx scripts/seed.ts
```

Run the seed script only against an appropriate development or demo database.

**6. Start the development server**

```bash
pnpm dev
```

Open the local URL displayed in your terminal.

## 📁 Project Structure

```text
student-support/
├── app/                  # Application routes and UI
├── lib/                  # Shared utilities and application logic
├── models/               # Data models
├── public/               # Static assets
├── scripts/              # Utility and database seed scripts
│
├── .gitignore            # Git ignore rules
├── next.config.ts        # Next.js configuration
├── package.json          # Dependencies and scripts
├── pnpm-lock.yaml        # Locked dependency versions
├── pnpm-workspace.yaml   # pnpm workspace configuration
├── postcss.config.mjs    # PostCSS configuration
├── proxy.ts              # Request proxy configuration
├── tsconfig.json         # TypeScript configuration
└── README.md             # Project documentation
```

## 🔑 Demo Credentials

The repository's existing README documents the following seeded demo accounts.

### Student Account

- **Email:** `student@example.com`
- **Password:** `test123`

### Staff Account

- **Email:** `staff@example.com`
- **Password:** `test123`

### Admin Account

- **Username:** `admin`
- **Password:** `password`

> **Important:** The admin credentials above are included as requested, but their availability has not been verified. Use them only if an administrator demo account with these credentials is actually configured. Never expose a real administrator account or privileged production credentials in a public repository. Replace weak demo credentials with a dedicated, restricted demo account before publishing them.

If the demo accounts do not work on the deployed website, check the database seed configuration and the application's authentication requirements.

## 🧪 Validation

The project documentation covers testing of important workflows, including:

- Authentication
- Student ticket creation and listing
- Ticket details and activity history
- Staff ticket assignment
- Department-based access control
- Status and priority updates
- Pending and resume workflows
- Ticket resolution and reopening
- SLA calculation
- Invalid and unauthorized requests

## 🚀 Future Improvements

Potential enhancements include:

- Email and in-app notifications
- Automated SLA escalation
- Dashboard analytics and reporting
- File attachments
- Bulk ticket management
- Staff workload distribution
- More granular permissions
- Enhanced audit logging

## 👨‍💻 Author

**Shaik Rasheed Basha**

- GitHub: [@RasheedBShaik](https://github.com/RasheedBShaik)

## 📄 License

No license has been specified in this README. Refer to the repository's license file, if one exists, for applicable usage terms.
