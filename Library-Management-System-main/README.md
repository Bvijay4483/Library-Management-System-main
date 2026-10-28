# School Library Management System

A beginner-friendly book catalog built with Spring Boot 3, Spring Data JPA, MySQL, React, Vite, and Axios.

## Requirements

- Java 17 or later
- MySQL 8
- Node.js 18 or later

## 1. Create the database

Start MySQL and create the schema:

```sql
CREATE DATABASE school_library;
```

The backend creates or updates the `books` table on startup. Set your database connection with environment variables if needed:

```bash
export DB_URL=jdbc:mysql://localhost:3306/school_library
export DB_USERNAME=root
export DB_PASSWORD=your_mysql_password
```

The defaults are `localhost:3306/school_library`, username `root`, an empty password, and backend port `8089`. Override the port with `SERVER_PORT`; override the allowed frontend origin with `FRONTEND_ORIGIN`.

## 2. Start the backend

From the project root:

```bash
./mvnw spring-boot:run
```

The REST API is available at `http://localhost:8089/api/books`. Run automated backend integration tests with:

```bash
./mvnw test
```

The tests use an in-memory H2 database; normal application runs use MySQL.

## 3. Start the frontend

In a second terminal:

```bash
cd school-library-frontend
npm install
npm run dev
```

Open the URL Vite prints (normally `http://localhost:5173`). The API base URL defaults to `http://localhost:8089/api`; copy `.env.example` to `.env` to override it using `VITE_API_BASE_URL`.

## API

| Method | Endpoint | Result |
| --- | --- | --- |
| GET | `/api/books` | List all books |
| GET | `/api/books/{id}` | Get one book |
| POST | `/api/books` | Create a book (`201 Created`) |
| PUT | `/api/books/{id}` | Update a book |
| DELETE | `/api/books/{id}` | Delete a book (`204 No Content`) |

Book requests use `title`, `author`, `isbn`, and `available`. Title, author, and ISBN are required; ISBNs are trimmed, checked in the service, and protected by a database unique constraint. Duplicate ISBNs return `409 Conflict` with the exact message `ISBN already exist`.
