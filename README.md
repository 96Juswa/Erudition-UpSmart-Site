
**JRUPSMART** is a secure web-based platform designed specifically for Jose Rizal University students to connect, exchange services, and develop professional skills in a monitored environment. The platform features an automated trust rating system and is moderated by the Student Development Office to ensure compliance with university rules and regulations.

# Features

**Peer-to-Peer Service Marketplace** - Students can offer and request services across multiple categories

**Trust Rating & Ranking System** - Automated credibility scoring based on user interactions, ratings, completion rates, and profile completeness

**Dual User Roles** - Switch seamlessly between Client and Provider roles

**Content Moderation** - All service listings and portfolios are reviewed by administrators before public viewing

**Portfolio Management** - Providers can showcase their work and skills

**Service Request System** - Post specific service requests when needed services aren't listed

**Messaging & Contracts** - Built-in communication and contract creation tools

**Reporting System** - Report content that violates university policies

# Service Categories

**Creative Services** (Graphic design, photography, art commissions)

**Technical Services** (App/software development, coding, testing)

**Educational Services** (Tutoring, proofreading, editing)

**Marketing & Administration** (Social media management, virtual assistance)

**Performing Arts** (Singing, acting, modeling, dancing)

# Tech Stack

Frontend/Backend: React
Authentication: Google Sign-In/Sign-Up
Email Service: Resend (for password reset)
Recommended Hosting: Railway

# Prerequisites

Node.js and npm installed
Google OAuth credentials for sign-in functionality
Resend API key for email functionality
Database (local or live)

# Local Development Setup

Clone the repository:

bashgit clone [your-repo-url]
cd jrupsmart

Install dependencies:

bashnpm install

Configure environment variables:
Create a .env file in the root directory with the following variables:

env# Database Configuration
DATABASE_URL=your_database_url

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Resend Email Service
RESEND_API_KEY=your_resend_api_key

# Other configurations
NODE_ENV=development

Run the development server:

bashnpm run dev

Open your browser and navigate to http://localhost:3000 (or the port specified)

Deployment (Railway)

Connect Repository to Railway

Sign up/login to Railway
Create a new project
Connect your GitHub account and select this repository


Configure Environment Variables

In Railway dashboard, go to your project settings
Add all environment variables from your .env file
Update DATABASE_URL to use your live database


Set Up Database

Provision a database through Railway or connect your existing database
Update the DATABASE_URL environment variable accordingly


Configure Google OAuth

Go to Google Cloud Console
Add your Railway deployment URL to authorized redirect URIs
Update OAuth credentials in Railway environment variables


Configure Resend

Ensure your Resend API key is added to Railway environment variables
Verify your domain in Resend dashboard if using custom domain


Update DNS Records

If using a custom domain, update your DNS records to point to Railway
Add CNAME or A records as specified by Railway


Deploy

Railway will automatically deploy your application
Monitor the deployment logs for any errors



# Default Administrator Account
Once deployed, you can access the administrator panel using:

Email: admin@my.jru.edu
Password: Admin@JRU2024!

⚠️ Important: Change the default admin password immediately after first login for security purposes.

# User Roles
Client

Browse and search services
Post service requests
Avail services and communicate with providers
Create contracts for service agreements
Report content violations

Provider

Create and manage service listings
Build and maintain portfolio
Respond to service requests
Manage bookings and complete transactions
Report content violations

Note: All users start as Clients. Once they create a service listing, they automatically gain Provider role and can toggle between roles using the navigation bar.
Administrator/Moderator (Student Development Office)

Review and respond to user reports
Approve service listings and portfolio submissions before public viewing
Monitor platform content for policy compliance
Suspend or delete accounts when necessary
Enforce university rules and regulations

Trust Rating System
The platform employs an automated trust rating and ranking system that evaluates users based on:

User ratings and reviews
Transaction completion rates
Cancellation rates
Profile completeness
Response time and professionalism

Ratings are automatically updated after each completed transaction, helping both Clients and Providers assess the trustworthiness of their potential transaction partners.
Project Team - Group Erudition (A.Y. 2025-2026)

Jean Larhyz P. Borja - Developer, Project Lead
Cedrick Leonard O. Bello - Project Manager
Psalmiel Joshua C. Jose - Lead Developer
Karl Ernest N. Ricafrente - Technical Writer

Contact
For questions, issues, or support:

cedrickleonard.bello@my.jru.edu
jeanlarhyz.borja@my.jru.edu
psalmieljoshua.jose@my.jru.edu
karlnernest.ricafrente@my.jru.edu

Current Version: 1.0























This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```
erudition-ml-integreated-production.up.railway.app

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
