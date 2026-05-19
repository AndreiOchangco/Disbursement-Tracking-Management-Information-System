# Disbursement Tracking Management Information System (DTMIS)

A web-based **Disbursement Tracking Management Information System (DTMIS)** developed for the **Local Government Unit (LGU) of Luna, La Union** to improve the efficiency, accessibility, transparency, and accuracy of disbursement monitoring and financial record management.

This project was developed as part of the requirements for **ELECT COG 3 – Research Methods for IT** at **Saint Louis College**.

---

<details>
<summary><strong>Project Overview</strong></summary>

## Project Overview

Local government financial operations often rely on manual documentation and spreadsheet-based monitoring, resulting in delayed processing, fragmented records, repetitive follow-ups, and difficulty retrieving financial documents.

The **Disbursement Tracking Management Information System (DTMIS)** addresses these operational challenges through a centralized digital platform that streamlines the processing, monitoring, and management of disbursement transactions using workflow-based processing and role-based access control.

The system enables authorized departments to monitor disbursement vouchers from creation up to completion while maintaining accountability, transparency, and auditability throughout the workflow lifecycle.

</details>

---

<details>
<summary><strong>Key Features</strong></summary>

## Key Features

## Core Financial Features

- Centralized disbursement management
- Workflow-based approval processing
- Disbursement voucher tracking
- Journal entry management
- Budget monitoring
- Dashboard analytics
- Financial reporting
- Audit trail logging
- Transaction history monitoring
- Status-based workflow management
- Department-specific approval routing

</details>

---

<details>
<summary><strong>Workflow Management</strong></summary>

## Workflow Management

The system supports complete workflow tracking across multiple departments:

1. Accounting
2. Budget
3. Treasurer
4. BAC/GSO
5. Mayor’s Office
6. Completion

Supported workflow actions:

- Draft
- Submitted
- Approved
- Disapproved
- Resubmitted
- Archived
- Completed

Each workflow action stores:

- User activity
- Action timestamps
- Approval remarks
- Department information
- Transaction history

</details>

---

<details><strong>Responsive Frontend System</strong></summary>

## Responsive Frontend System

The frontend follows a **mobile-first responsive architecture** optimized for:

- Mobile Phones
- Tablets
- Laptops
- Desktop Monitors
- Large Displays

### Responsive Breakpoints

| Device Type | Screen Width |
|---|---|
| Small Phones | Below 360px |
| Phones | 360px – 767px |
| Tablets | 768px – 1023px |
| Desktops | 1024px – 1439px |
| Large Desktops | 1440px and above |

</details>

---

## Frontend Features

### Responsive Layout System

#### Sidebar Navigation
- Horizontal navigation on mobile devices
- Vertical sidebar layout on tablets and desktops

#### Responsive Forms
- Single-column forms on mobile
- Two-column layout on tablets
- Multi-column layout on desktop

#### Responsive Tables
- Horizontal scrolling support
- Sticky table headers
- Responsive spacing and touch support

#### Responsive Dashboard
- Adaptive dashboard card layouts
- Auto-adjusting grid system
- Responsive chart containers

#### Responsive Modals
- Dynamic modal scaling
- Touch-friendly controls
- Optimized scrolling behavior

---

## Accessibility Improvements

- Minimum 44px touch targets
- Responsive typography scaling
- Improved mobile readability
- Reduced-motion support
- Landscape mode optimization
- Cross-device spacing consistency

---

# Technology Stack

## Frontend

- React.js
- CSS3
- Flexbox
- CSS Grid
- Responsive Mobile-First Design

---

## Backend

- Django
- Django REST Framework (DRF)
- JWT Authentication
- RESTful API Architecture

---

## Database

- SQLite (Development)
- MySQL Compatible
- PostgreSQL Compatible

---

# System Users

| Role | Responsibilities |
|---|---|
| System Administrator | System management and user administration |
| Accountant | Creates and manages disbursement vouchers |
| Budget Officer | Budget verification and approval |
| Treasurer | Payment verification and fund release |
| BAC/GSO Officer | Procurement and supply verification |
| Mayor’s Secretary | Mayor’s office approval processing |
| Technical Officer | Reports and monitoring oversight |

---

# System Workflow

The system processes disbursement transactions through the following workflow:

1. Transaction Request Submission
2. DV Encoding
3. Budget Verification
4. Treasurer Verification
5. BAC/GSO Review
6. Mayor’s Office Approval
7. Completion and Reporting

---

# API Documentation

# Authentication API

## Login

```http
POST /api/auth/login/
```

Authenticates a user and returns a JWT access token.

### Sample Request

```json
{
  "email": "user@email.com",
  "password": "your_password"
}
```

### Sample Response

```json
{
  "access_token": "jwt_token",
  "user": {
    "id": 1,
    "full_name": "Juan Dela Cruz",
    "email": "user@email.com",
    "department": "accounting",
    "status": "active"
  }
}
```

---

## Current User

```http
GET /auth/me/
```

Returns authenticated user information.

Authorization Header:

```http
Authorization: Bearer <access_token>
```

---

# User Management API

## Register User

```http
POST /api/auth/signup/
```

Creates a new user account.

---

## Fetch Users

```http
GET /api/users/
```

Returns all registered system users.

---

# Disbursement Voucher API

## Fetch All DVs

```http
GET /api/dv/
```

Returns:

- Workflow history
- Journal entries
- Payment records
- DV particulars
- Approval history
- Archive information

---

# Dashboard API

## Dashboard Summary

```http
GET /api/dashboard/
```

Returns dashboard statistics including:

- Total transactions
- Pending transactions
- Draft transactions
- Completed transactions
- Archived transactions
- Recent DVs
- Pending workflow actions

---

# Latest System Improvements

## Responsive Design Refactor

The latest frontend update introduced a full responsive redesign using a mobile-first architecture.

### Improvements Added

- Mobile-first CSS architecture
- Dynamic responsive layouts
- Responsive typography scaling
- Adaptive dashboard grids
- Responsive modals
- Touch-friendly buttons
- Horizontal mobile navigation
- Sticky responsive tables
- Flexible form layouts
- Reduced layout shifting
- Improved Core Web Vitals
- Cross-browser responsive support

---

## Performance Improvements

### Frontend Optimizations

- Reduced layout shifts
- Progressive responsive enhancement
- Optimized media queries
- Improved rendering on smaller devices
- Better responsive spacing behavior

---

## Browser Compatibility

| Browser | Support |
|---|---|
| Google Chrome | Full Support |
| Mozilla Firefox | Full Support |
| Microsoft Edge | Full Support |
| Safari | Full Support |
| Android Chrome | Full Support |
| iOS Safari | Full Support |

---

# Project Structure

## Frontend Structure

```plaintext
frontend/
├── src/
│   ├── components/
│   ├── css/
│   ├── hooks/
│   ├── pages/
│   ├── services/
│   ├── utils/
│   └── assets/
```

---

## Backend Structure

```plaintext
backend/
├── api/
├── authentication/
├── dashboard/
├── dv/
├── users/
├── media/
├── manage.py
└── requirements.txt
```

---

# Installation Guide

# Backend Setup

## 1. Clone Repository

```bash
git clone <repository_url>
```

---

## 2. Navigate to Backend Directory

```bash
cd backend
```

---

## 3. Create Virtual Environment

```bash
python -m venv venv
```

---

## 4. Activate Virtual Environment

### Windows

```bash
venv\Scripts\activate
```

### Linux/MacOS

```bash
source venv/bin/activate
```

---

## 5. Install Dependencies

```bash
pip install -r requirements.txt
```

---

## 6. Run Migrations

```bash
python manage.py migrate
```

---

## 7. Start Backend Server

```bash
python manage.py runserver
```

Backend URL:

```plaintext
http://127.0.0.1:8000
```

---

# Frontend Setup

## 1. Navigate to Frontend Directory

```bash
cd frontend
```

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Start Development Server

```bash
npm run dev
```

Frontend URL:

```plaintext
http://localhost:5173
```

---

# Development Notes

## Recommended Responsive Testing Sizes

- 320px
- 360px
- 375px
- 768px
- 1024px
- 1440px
- 1920px

---

## Recommended Test Devices

- iPhone SE
- iPhone 12/13
- Samsung Galaxy S21
- iPad
- iPad Pro
- Desktop 1366px
- Desktop 1920px

---

# System Scope

The system focuses on:

- Disbursement voucher processing
- Budget monitoring
- Workflow approval management
- Dashboard analytics
- Financial reporting
- Audit trail management

---

# System Limitations

The system is not intended to function as a full accounting platform.

The following are outside the current project scope:

- General Ledger Management
- Payroll Processing
- Revenue Collection
- Automated Accounting Posting
- Banking Integration
- National Government System Integration

Financial data must still be manually encoded by authorized personnel.

---

# Research Methodology

## Descriptive Research Design

Used to analyze the existing disbursement monitoring workflow and identify operational inefficiencies.

---

## Developmental Research Design

Used for the design and development of the proposed information system.

---

## Data Collection Methods

- Interviews with LGU personnel
- Review of financial documents
- Spreadsheet workflow analysis
- Office process observation

---

# Ethical Considerations

The study followed strict ethical standards:

- Informed consent from LGU personnel
- Voluntary participation during interviews
- Confidential handling of financial records
- Compliance with the Data Privacy Act of 2012
- Secure storage of collected research materials

---

# Future Improvements

Planned future enhancements include:

- Cloud deployment infrastructure
- Advanced analytics dashboards
- Real-time notifications
- SMS and email alerts
- Automated journal entries
- Full accounting module
- File attachment support
- Digital signatures
- Multi-office reporting tools
- Government financial system integration

---

# Project Team

Developed by:

- Kathleen Anne A. De Guzman
- Jem Vladimir L. Negranza
- Andrei Luise E. Ochangco
- Louis Ricardo G. Servito
- Jhuneille Mark A. Milan
- John Michael N. Rivera

---

# Adviser

Marie Ann G. Fontanilla, MIT

---

# Institution

Saint Louis College  
City of San Fernando, La Union  
Philippines

---

# License

Copyright © 2026

Licensed under the Apache License, Version 2.0.

You may obtain a copy of the License at:

```plaintext
http://www.apache.org/licenses/LICENSE-2.0
```

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.