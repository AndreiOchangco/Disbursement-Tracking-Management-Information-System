# Disbursement Tracking Management Information System (DTMIS)

A web-based **Disbursement Tracking Management Information System (DTMIS)** developed for the **Local Government Unit (LGU) of Luna, La Union** to improve the efficiency, accessibility, transparency, and accuracy of disbursement monitoring and financial record management.

This project was developed as part of the requirements for **ELECT COG 3 – Research Methods for IT** at **Saint Louis College**.

---

<details open>
<summary><strong>Project Overview</strong></summary>

# Project Overview 

Local government financial operations often rely on manual documentation and spreadsheet-based monitoring, resulting in delayed processing, fragmented records, repetitive follow-ups, and difficulty retrieving financial documents.

The **Disbursement Tracking Management Information System (DTMIS)** addresses these operational challenges through a centralized digital platform that streamlines the processing, monitoring, and management of disbursement transactions using workflow-based processing and role-based access control.

The system enables authorized departments to monitor disbursement vouchers from creation up to completion while maintaining accountability, transparency, and auditability throughout the workflow lifecycle.

</details>

---

<details>
<summary><strong>Key Features</strong></summary>

# Key Features

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

# Workflow Management

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

<details>
<summary><strong>Responsive Frontend System</strong></summary>

# Responsive Frontend System

The frontend follows a **mobile-first responsive architecture** optimized for:

- Mobile Phones
- Tablets
- Laptops
- Desktop Monitors
- Large Displays

## Responsive Breakpoints

| Device Type | Screen Width |
|---|---|
| Small Phones | Below 360px |
| Phones | 360px – 767px |
| Tablets | 768px – 1023px |
| Desktops | 1024px – 1439px |
| Large Desktops | 1440px and above |

</details>

---

<details>
<summary><strong>Frontend Features</strong></summary>

# Frontend Features

## Responsive Layout System

### Sidebar Navigation
- Horizontal navigation on mobile devices
- Vertical sidebar layout on tablets and desktops

### Responsive Forms
- Single-column forms on mobile
- Two-column layout on tablets
- Multi-column layout on desktop

### Responsive Tables
- Horizontal scrolling support
- Sticky table headers
- Responsive spacing and touch support

### Responsive Dashboard
- Adaptive dashboard card layouts
- Auto-adjusting grid system
- Responsive chart containers

### Responsive Modals
- Dynamic modal scaling
- Touch-friendly controls
- Optimized scrolling behavior

</details>

---

<details>
<summary><strong>Accessibility Improvements</strong></summary>

# Accessibility Improvements

- Minimum 44px touch targets
- Responsive typography scaling
- Improved mobile readability
- Reduced-motion support
- Landscape mode optimization
- Cross-device spacing consistency

</details>

---

<details>
<summary><strong>Technology Stack</strong></summary>

# Technology Stack

## Frontend

- React.js
- CSS3
- Flexbox
- CSS Grid
- Responsive Mobile-First Design

## Backend

- Django
- Django REST Framework (DRF)
- JWT Authentication
- RESTful API Architecture

## Database

- SQLite (Development)
- MySQL Compatible
- PostgreSQL Compatible

</details>

---

<details>
<summary><strong>System Users</strong></summary>

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

</details>

---

<details>
<summary><strong>System Workflow</strong></summary>

# System Workflow

The system processes disbursement transactions through the following workflow:

1. Transaction Request Submission
2. DV Encoding
3. Budget Verification
4. Treasurer Verification
5. BAC/GSO Review
6. Mayor’s Office Approval
7. Completion and Reporting

</details>

---

<details>
<summary><strong>API Documentation</strong></summary>

# API Documentation

## Authentication API

### Login

```http
POST /api/auth/login/
```

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

## Current User

```http
GET /auth/me/
```

Authorization Header:

```http
Authorization: Bearer <access_token>
```

## Register User

```http
POST /api/auth/signup/
```

## Fetch Users

```http
GET /api/users/
```

## Fetch All DVs

```http
GET /api/dv/
```

## Dashboard Summary

```http
GET /api/dashboard/
```

</details>

---

<details>
<summary><strong>Latest System Improvements</strong></summary>

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

</details>

---

<details>
<summary><strong>Project Structure</strong></summary>

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

</details>

---

<details>
<summary><strong>Installation Guide</strong></summary>

# Installation Guide

## Backend Setup

### Clone Repository

```bash
git clone <repository_url>
```

### Navigate to Backend

```bash
cd backend
```

### Create Virtual Environment (Optional)

```bash
python -m venv venv
```

### Activate Virtual Environment

#### Windows

```bash
venv\Scripts\activate
```

#### Linux/MacOS

```bash
source venv/bin/activate
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Run Migrations

```bash
python manage.py migrate
```

### Start Backend Server

```bash
python manage.py runserver
```

Backend URL:

```plaintext
http://127.0.0.1:8000
```

## Frontend Setup

### Navigate to Frontend

```bash
cd frontend
```

### Install Dependencies

```bash
npm cli
```

### Start Development Server

```bash
npm run dev
```

Frontend URL:

```plaintext
http://localhost:5173
```

</details>

---

<details>
<summary><strong>Development Notes</strong></summary>

# Development Notes

## Recommended Responsive Testing Sizes

- 320px
- 360px
- 375px
- 768px
- 1024px
- 1440px
- 1920px

## Recommended Test Devices

- iPhone SE
- iPhone 12/13
- Samsung Galaxy S21
- iPad
- iPad Pro
- Desktop 1366px
- Desktop 1920px

</details>

---

<details>
<summary><strong>System Scope and Limitations</strong></summary>

# System Scope

The system focuses on:

- Disbursement voucher processing
- Budget monitoring
- Workflow approval management
- Dashboard analytics
- Financial reporting
- Audit trail management

## System Limitations

The system is not intended to function as a full accounting platform.

The following are outside the current project scope:

- General Ledger Management
- Payroll Processing
- Revenue Collection
- Automated Accounting Posting
- Banking Integration
- National Government System Integration

</details>

---

<details>
<summary><strong>Research Methodology</strong></summary>

# Research Methodology

## Descriptive Research Design

Used to analyze the existing disbursement monitoring workflow and identify operational inefficiencies.

## Developmental Research Design

Used for the design and development of the proposed information system.

## Data Collection Methods

- Interviews with LGU personnel
- Review of financial documents
- Spreadsheet workflow analysis
- Office process observation

</details>

---

<details>
<summary><strong>Ethical Considerations</strong></summary>

# Ethical Considerations

- Informed consent from LGU personnel
- Voluntary participation during interviews
- Confidential handling of financial records
- Compliance with the Data Privacy Act of 2012
- Secure storage of collected research materials

</details>

---

<details>
<summary><strong>Future Improvements</strong></summary>

# Future Improvements

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

</details>

---

<details>
<summary><strong>Project Team</strong></summary>

# Project Team

Developed by:

- Kathleen Anne A. De Guzman (Assistant)
- Jem Vladimir L. Negranza (Backend Developer)
- Andrei Luise E. Ochangco (Leader)
- Louis Ricardo G. Servito (Frontend Developer)
- Jhuneille Mark A. Milan (Assistant)
- John Michael N. Rivera (Assistant)

## Adviser

Marie Ann G. Fontanilla, MIT

</details>

---

<details>
<summary><strong>Institution</strong></summary>

# Institution

Saint Louis College  
City of San Fernando, La Union  
Philippines

</details>

---

<details>
<summary><strong>License</strong></summary>

# License

Copyright © 2026 DTMIS Developers

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this project except in compliance with the License.
You may obtain a copy of the License at:

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.

See the License for the specific language governing permissions and
limitations under the License.

---

## Additional Project Terms

The following additional notices apply specifically to DTMIS:

### 1. Trademark and Naming Restrictions

The names **DTMIS**, associated organizational names, logos, seals,
branding assets, and government identifiers may not be used to imply
official endorsement, affiliation, or authorization without prior
written permission from the project maintainers or owning organization.

---

### 2. Security and Misuse Restrictions

This software may not be used for:

- Unauthorized access to systems or data
- Fraudulent financial transactions
- Bypassing government procedures or auditing systems
- Malicious exploitation of vulnerabilities
- Illegal surveillance or data harvesting
- Distribution of malware or malicious modifications

Any malicious use automatically terminates permissions granted under
this repository in addition to any applicable legal consequences.

---

### 3. Contribution Policy

By submitting code, documentation, or other contributions to DTMIS,
you agree that your contribution may be modified, redistributed, and
licensed under the Apache License 2.0 as part of the project.

Contributors are responsible for ensuring that submitted code does not:

- Infringe third-party intellectual property
- Contain malicious code or hidden functionality
- Expose confidential or sensitive information

---

### 4. Government and Organizational Compliance

Organizations deploying DTMIS are responsible for ensuring compliance
with their own:

- Data privacy regulations
- Cybersecurity policies
- Procurement and auditing procedures
- Records retention policies
- Local government operational standards

The maintainers of DTMIS are not liable for improper deployment,
misconfiguration, or policy violations by third parties.

---

### 5. No Warranty

DTMIS is provided strictly on an "AS IS" basis without guarantees of:

- Continuous availability
- Regulatory compliance
- Compatibility with all infrastructures
- Error-free operation
- Protection against all security threats

Production deployments should undergo independent security review,
testing, and validation before operational use.

---

## Full Apache License Terms

The complete Apache License Version 2.0 terms apply below.

### TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

#### 1. Definitions

"License" shall mean the terms and conditions for use, reproduction,
and distribution as defined by Sections 1 through 9 of this document.

"Licensor" shall mean the copyright owner or entity authorized by
the copyright owner that is granting the License.

"Legal Entity" shall mean the union of the acting entity and all
other entities that control, are controlled by, or are under common
control with that entity.

"Source" form shall mean the preferred form for making modifications,
including but not limited to software source code, documentation
source, and configuration files.

"Object" form shall mean any form resulting from mechanical
transformation or translation of a Source form.

---

#### 2. Grant of Copyright License

Subject to the terms and conditions of this License, each Contributor
hereby grants to You a perpetual, worldwide, non-exclusive, no-charge,
royalty-free, irrevocable copyright license to reproduce, prepare
Derivative Works of, publicly display, publicly perform, sublicense,
and distribute the Work and such Derivative Works in Source or Object form.

---

#### 3. Grant of Patent License

Subject to the terms and conditions of this License, each Contributor
hereby grants to You a perpetual, worldwide, non-exclusive, no-charge,
royalty-free, irrevocable (except as stated in this section) patent
license to make, have made, use, offer to sell, sell, import, and
otherwise transfer the Work.

If You institute patent litigation against any entity alleging that the
Work or a Contribution incorporated within the Work constitutes direct
or contributory patent infringement, then any patent licenses granted
to You under this License for that Work shall terminate as of the date
such litigation is filed.

---

#### 4. Redistribution

You may reproduce and distribute copies of the Work or Derivative Works
thereof in any medium, with or without modifications, and in Source or
Object form, provided that You meet the following conditions:

- You must give any other recipients of the Work or Derivative Works a
  copy of this License.

- You must cause any modified files to carry prominent notices stating
  that You changed the files.

- You must retain all copyright, patent, trademark, and attribution
  notices from the Source form of the Work.

- If the Work includes a `NOTICE` file, any Derivative Works distributed
  must include a readable copy of the attribution notices contained
  within such NOTICE file.

You may add Your own copyright statement to Your modifications and may
provide additional or different license terms for Your modifications,
provided Your use and distribution of the Work otherwise complies with
this License.

---

#### 5. Submission of Contributions

Unless You explicitly state otherwise, any Contribution intentionally
submitted for inclusion in the Work by You to the Licensor shall be
under the terms and conditions of this License, without any additional
terms or conditions.

Nothing herein shall supersede or modify the terms of any separate
license agreement You may have executed with the Licensor regarding
such Contributions.

---

#### 6. Trademarks

This License does not grant permission to use the trade names,
trademarks, service marks, or product names of the Licensor, except
as required for reasonable and customary use in describing the origin
of the Work and reproducing the content of the NOTICE file.

---

#### 7. Disclaimer of Warranty

Unless required by applicable law or agreed to in writing, Licensor
provides the Work (and each Contributor provides its Contributions)
on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
either express or implied, including, without limitation, any warranties
or conditions of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS
FOR A PARTICULAR PURPOSE.

You are solely responsible for determining the appropriateness of using
or redistributing the Work and assume any risks associated with Your
exercise of permissions under this License.

---

#### 8. Limitation of Liability

In no event and under no legal theory, whether in tort (including
negligence), contract, or otherwise, unless required by applicable law,
shall any Contributor be liable to You for damages, including any direct,
indirect, special, incidental, or consequential damages of any character
arising as a result of this License or out of the use or inability to use
the Work.

This includes but is not limited to damages for:

- Loss of goodwill
- Work stoppage
- Computer failure or malfunction
- Data corruption
- Commercial damages or losses

Even if such Contributor has been advised of the possibility of such damages.

---

#### 9. Accepting Warranty or Additional Liability

While redistributing the Work or Derivative Works thereof, You may choose
to offer and charge a fee for acceptance of support, warranty, indemnity,
or other liability obligations consistent with this License.

However, in accepting such obligations, You may act only on Your own
behalf and on Your sole responsibility, not on behalf of any other
Contributor.

You agree to indemnify, defend, and hold each Contributor harmless for
any liability incurred by, or claims asserted against, such Contributor
by reason of your accepting any such warranty or additional liability.

---

# END OF TERMS AND CONDITIONS

## APPENDIX: How to Apply the Apache License to Your Work

To apply the Apache License to your work, attach the following notice,
with the fields enclosed by brackets `[]` replaced with your own
identifying information.

```text
Copyright [yyyy] [name of copyright owner]

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.

See the License for the specific language governing permissions and
limitations under the License.
```

</details>