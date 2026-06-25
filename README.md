# ADL

A comprehensive enrollment CRM for Kuwait Technical College (ktech) built with Next.js 16 and Supabase.

## Features

### MVP Modules
- **Dashboard** - Overview with stats, pipeline funnel, recent leads, and today's appointments
- **Leads** - Full lead management with pipeline stages, filtering, and detail views
- **Students** - Student profiles with payment tracking, placement tests, and PUC flow
- **Calendar** - Appointment scheduling with day/week/month views

### Key Features
- Kuwait-specific validations (Civil ID, Phone, GPA)
- Role-based access control (Admin vs Agent)
- Pipeline stage management (10 stages from New to Enrolled)
- Payment tracking with auto-calculated status
- Arabic/RTL support structure
- Real-time updates (Supabase)

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS
- **UI Components**: Radix UI primitives with custom styling
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Validation**: Zod

## Getting Started

### Prerequisites
- Node.js 20+
- npm or yarn
- Supabase account

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

3. Set up the database:
   - Go to your Supabase project
   - Navigate to SQL Editor
   - Run the contents of `supabase/schema.sql`

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
adl/
├── app/
│   ├── (auth)/login/         # Authentication pages
│   ├── (dashboard)/          # Protected dashboard pages
│   │   ├── dashboard/        # Main dashboard
│   │   ├── leads/            # Leads module
│   │   ├── students/         # Students module
│   │   ├── calendar/         # Calendar module
│   │   └── settings/         # Settings page
│   └── api/                  # API routes
├── components/
│   ├── ui/                   # UI components (Button, Input, Card, etc.)
│   └── layout/               # Layout components (Sidebar, Header)
├── lib/
│   ├── supabase/             # Supabase client configuration
│   └── utils.ts              # Utility functions
├── types/                    # TypeScript types
└── supabase/
    └── schema.sql            # Database schema
```

## Kuwait-Specific Validations

- **Civil ID**: 12 digits, must start with 2 or 3
- **Phone**: 8 digits, must start with 5, 6, or 9
- **GPA**: Number between 0-100

## Pipeline Stages

1. New
2. Contacted
3. Appointed
4. Visited
5. Applied
6. Tested
7. Application
8. Payment
9. Enrolled
10. Lost

## User Roles

| Role | Permissions |
|------|-------------|
| Agent | View/edit own leads, book appointments, view own calendar |
| Admin | Full access to all leads, students, reports, team management |

## Payment Status

| Amount (KD) | Status |
|-------------|--------|
| < 150 | Pending |
| 150 - 549 | Seat Reserved |
| >= 550 | Full Tuition |

## Deployment

The app can be deployed to Vercel:

```bash
npm run build
```

## License

Private - Kuwait Technical College
