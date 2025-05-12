# Project Title Upv-Calendar

## 📖 Table of Contents

- [About The Project](#about-the-project)
  - [Description](#description)
  - [Built With](#built-with)
- [✨ Features](#features)
- [🚀 Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Project](#running-the-project)
- [⚙️ Configuration](#configuration)


## <a name="about-the-project"></a>🌐 About The Project

![image](https://github.com/user-attachments/assets/845923f9-0058-4051-962c-1b0e6bf5a431)


### <a name="description"></a>Description

(Provide a detailed description of your project. What problem does it solve? Who is it for? What are its key goals?)

This project its a UPV (Universitat Politècnica de València) Exam Calendar application. It allows users to view, filter, and save exam schedules. It includes a frontend built with Next.js and a backend using Spring Boot . Users can authenticate, save their personalized calendars, and view exam details based on various filters like school, degree, year, semester, and subject.

### <a name="built-with"></a>Built With

This project utilizes a modern tech stack:

**Frontend:**
*   [Next.js](https://nextjs.org/) (React Framework)
*   [TypeScript](https://www.typescriptlang.org/)
*   [Tailwind CSS](https://tailwindcss.com/)
*   [Supabase](https://supabase.io/) (Backend as a Service - for auth and database)

**Backend (Deduced from `backend` directory):**
*   [Spring Boot](https://spring.io/projects/spring-boot) (Java Framework)
*   [Java](https://www.java.com/)
*   [Maven](https://maven.apache.org/) (Build tool)
*   [PostgreSQL](https://www.postgresql.org/) (Database - likely via Supabase)
*   [JPA/Hibernate](https://hibernate.org/orm/) (Object-Relational Mapping)

**Tools:**
*   [pnpm](https://pnpm.io/)

## <a name="features"></a>✨ Features

*   **Exam Viewing:** Display exam schedules in calendar and list views.
*   **Advanced Filtering:** Filter exams by school, degree, year, semester, subject, and search query.
*   **Saved Calendars:** Authenticated users can save their filtered exam views as personalized calendars.
*   **Responsive Design:** Adapts to different screen sizes (mobile-friendly UI components are used).
*   **Theme Toggle:** Light and Dark mode support.
*   **Real-time Updates:** Supabase subscriptions can provide real-time updates for database changes.

![image](https://github.com/user-attachments/assets/4b9b035b-08ae-41d9-8904-718fde278a94)


## <a name="getting-started"></a>🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### <a name="prerequisites"></a>Prerequisites

*   Node.js (Version specified in `package.json` or latest LTS)
*   pnpm (or npm/yarn, though pnpm seems to be used)
    ```bash
    npm install -g pnpm
    ```
*   Java JDK (Version 17, as specified in `backend/pom.xml`)
*   Maven
*   Supabase Account (for database and authentication)

### <a name="installation"></a>Installation

1.  **Clone the repository:**
    ```bash
    git clone https://your-repository-url.git
    cd your-project-directory
    ```
2.  **Frontend Setup:**
    *   Navigate to the project root (if not already there).
    *   Install frontend dependencies:
        ```bash
        pnpm install
        ```
    *   Create a `.env.local` file in the root directory and add your Supabase credentials and other environment variables. Based on `start-services.bat` and Supabase usage, you'll likely need:
        ```env
        # Supabase Project URL and Anon Key (for frontend)
        NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
        NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

        # Supabase Database Connection Info (for backend, if you run it)
        SUPABASE_DB_URL=your_database_url # e.g., postgresql://postgres:[YOUR-PASSWORD]@[YOUR-HOST]:5432/postgres
        SUPABASE_DB_USER=your_database_user # usually 'postgres'
        SUPABASE_DB_PASSWORD=your_database_password

        # Potentially other variables like JWT secret if not handled by Supabase SDK directly
        # SUPABASE_JWT_SECRET=your-supabase-jwt-secret
        ```
        **Note:** The `SUPABASE_DB_URL`, `SUPABASE_DB_USER`, and `SUPABASE_DB_PASSWORD` are specifically mentioned for the Java backend in `start-services.bat`. The Next.js frontend typically only needs `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

3.  **Backend Setup (Spring Boot):**
    *   Navigate to the `backend` directory:
        ```bash
        cd backend
        ```
    *   Ensure your `.env.local` in the root directory has the `SUPABASE_DB_URL`, `SUPABASE_DB_USER`, and `SUPABASE_DB_PASSWORD` variables correctly set, as the `application.properties` file references these.
    *   (Optional but recommended) Build the project with Maven:
        ```bash
        mvn clean install
        ```

### <a name="running-the-project"></a>Running the Project

You can use the provided `start-services.bat` script on Windows, or run the services manually.

**Using `start-services.bat` (Windows):**
1.  Ensure your `.env.local` file is correctly set up in the project root.
2.  Double-click `start-services.bat` or run it from your terminal:
    ```bash
    ./start-services.bat
    ```
    This will attempt to start both the Spring Boot backend and the Next.js frontend.

**Manual Startup:**

1.  **Start the Spring Boot Backend (Optional, if you intend to use it):**
    *   Open a terminal in the `backend` directory.
    *   Run the application:
        ```bash
        mvn spring-boot:run
        ```
    *   The backend should be available at `http://localhost:8080` (or the port configured in `application.properties`).

2.  **Start the Next.js Frontend:**
    *   Open a terminal in the project root directory.
    *   Run the development server:
        ```bash
        pnpm dev
        ```
    *   The frontend should be available at `http://localhost:3000`.
  
      
## <a name="api-documentation"></a>📄 API Documentation

The primary data interaction is with Supabase. The `APIdocs.md` file in the repository provides detailed information about the Supabase tables:




