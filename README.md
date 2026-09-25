Student Support & Ticket Management

A web-based student support and ticket management system designed to help students raise administrative requests and enable support staff to manage, prioritize, assign, track, and resolve those requests.

Problem

Students often need help with administrative matters such as:

Fees & payments

Attendance

ID cards

Documents

Certificates

Examination

Hostel

Transport

The system provides a central place for students to submit requests and track their progress while allowing support staff to manage tickets through a structured workflow.

Key Features
Student

Student authentication

Create support tickets

Select support category

Set ticket priority

View submitted tickets

View ticket details

Track ticket status

View ticket activity/history

View ticket ageing

Receive resolution information

Staff

Staff authentication

Department-based ticket visibility

View tickets assigned to their department

Search and filter tickets

View ticket details

Assign tickets

Change ticket status

Change ticket priority

Add comments

Put tickets into pending states

Resolve tickets

Close and reopen tickets

View SLA status

View ticket activity history

Ticket Management
Statuses

Tickets support the following statuses:

NEW → ASSIGNED → IN_PROGRESS → PENDING_* → RESOLVED → CLOSED


Pending states include:

PENDING_STUDENT

PENDING_INTERNAL

Priorities

LOW

MEDIUM

HIGH

URGENT

The system also calculates:

Ticket ageing

Resolution SLA

SLA status

Pending state

Resolution information

Activity history

Roles

The current implementation uses two primary operational roles:

Role	Responsibility
Student	Creates and tracks their own support requests
Staff	Manages tickets belonging to their department

The system uses department-level ownership so staff members do not automatically gain access to tickets outside their department.

Ticket Workflow

A typical ticket follows this lifecycle:

Student creates ticket
        ↓
       NEW
        ↓
    ASSIGNED
        ↓
   IN_PROGRESS
        ↓
 ┌──────┴─────────┐
 ↓                ↓
PENDING        RESOLVED
 ↓                ↓
RESUMED           ↓
 ↓                ↓
IN_PROGRESS      CLOSED


Tickets can also be reopened when additional work is required.

SLA

Different priorities have different resolution targets:

Priority	Resolution SLA
LOW	72 hours
MEDIUM	48 hours
HIGH	24 hours
URGENT	8 hours

The system identifies tickets as:

ON_TRACK

AT_RISK

BREACHED

COMPLETED

NO_SLA

Older tickets without stored SLA information can have their SLA deadline calculated from the ticket creation time and priority.

Activity History

Important ticket actions are recorded in ticket activity history.

Examples include:

Ticket created

Ticket assigned

Ticket reassigned

Status changed

Priority changed

Comment added

Ticket moved to pending

Ticket resumed

Ticket resolved

Ticket reopened

Ticket closed

Ticket escalated

This provides an audit trail of how a ticket was handled.

Technical Stack

Next.js

TypeScript

React

Tailwind CSS

MongoDB

Mongoose

pnpm

Architecture

The application follows a full-stack Next.js architecture:

Frontend
   ↓
Next.js API Routes
   ↓
Authentication / Authorization
   ↓
Database Logic
   ↓
MongoDB


Core MongoDB entities include:

User
Department
Ticket
TicketActivity


Tickets reference students, staff members, and departments using MongoDB ObjectIds.

Authorization

Authorization is handled on the server side.

Students can access their own tickets.

Staff members can access tickets belonging to their department.

Staff assignment is restricted according to department ownership.

Ticket update permissions are validated by the API.

Authorization does not rely only on frontend visibility.

Important Edge Cases

The implementation considers several failure and edge cases:

Unauthenticated users

Inactive users

Invalid ticket IDs

Non-existent tickets

Unauthorized ticket access

Staff without a department

Inactive assigned staff

Invalid status values

Invalid priority values

Invalid departments

Tickets without SLA information

Reassignment between departments

Reopening resolved/closed tickets

Pending and resumed workflows

Resolution without an existing SLA

Missing ticket relationships

Validation

The application was tested through:

Authentication flows

Student ticket creation

Ticket listing

Ticket detail pages

Staff ticket listing

Department-based access

Ticket assignment

Status changes

Priority changes

Pending/resume workflow

Resolution workflow

Activity history

SLA calculation

Invalid requests

Unauthorized requests

Database seeding is available through:

pnpm exec tsx scripts/seed.ts

Running Locally
1. Install dependencies
pnpm install

2. Configure environment variables

Create a .env.local file containing the required environment variables.

Do not commit .env.local or database credentials to the repository.

3. Seed the database
pnpm exec tsx scripts/seed.ts

4. Start the development server
pnpm dev


The application will be available at:

https://student-support-vms7.vercel.app/

Seed Data

The seed script creates or updates the required departments and test users.

Student
Email: student@example.com
Password: test123

Staff
Email: staff@example.com
Password: test123


These credentials are for local/demo use only and should not be used in production.

Trade-offs & Assumptions

The project prioritizes a clear working prototype over introducing unnecessary infrastructure.

Key assumptions:

A ticket belongs to one department at a time.

Staff ownership is department-based.

Students can only manage their own tickets.

SLA targets are determined by ticket priority.

Activity history records important ticket changes.

MongoDB is sufficient for the expected prototype scale.

Authentication is session-based.

For a production implementation, additional capabilities could include notifications, background SLA escalation jobs, richer reporting, file attachments, and more granular permission management.

AI Usage

AI-assisted development was used during implementation for:

Debugging TypeScript and Mongoose issues

Reviewing API authorization logic

Improving ticket workflow implementation

Identifying edge cases

Refining UI and API code

AI-generated code was reviewed and tested manually before being incorporated into the project.

One issue identified during development was a Mongoose model-registration/population problem involving the Department model. The problem was identified from the runtime error and corrected by ensuring the required model was registered before population.

Future Improvements

If the project were developed further, possible improvements include:

Email and in-app notifications

Automatic SLA escalation

Dashboard analytics

File attachments

Advanced reporting

Bulk ticket operations

Staff workload distribution

More granular permissions

Production-grade audit logging

Author

Built as a pre-drive product engineering assignment for the Student Support & Ticket Management problem.