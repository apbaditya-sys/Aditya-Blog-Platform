# Aditya Blog Platform

A complete full-stack blogging website created for **B. Aditya**.

## Features

- User registration and login
- JWT authentication
- Secure password hashing with bcrypt
- Create, edit and delete your own posts
- Browse all community posts
- Search posts
- Category filtering
- Interactive likes
- Comments
- Delete your own comments
- Responsive modern UI
- PostgreSQL database
- RESTful APIs

## Technology

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js + Express.js
- Database: PostgreSQL
- Authentication: JWT + bcrypt

## 1. Requirements

Install:

- Node.js
- PostgreSQL
- pgAdmin 4
- VS Code

## 2. Create PostgreSQL database

Open pgAdmin.

Create a database named:

`aditya_blog`

Then open Query Tool for `aditya_blog`.

Open `database.sql`, copy all SQL, and execute it.

This creates:

- users
- posts
- comments

## 3. Configure environment

Copy:

`.env.example`

and rename the copy to:

`.env`

Edit `.env`:

```env
PORT=3000
DATABASE_URL=postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/aditya_blog
JWT_SECRET=aditya_blog_secret_change_this
```

Replace `YOUR_POSTGRES_PASSWORD` with your real PostgreSQL password.

## 4. Install packages

Open this project folder in VS Code.

Open the Terminal and run:

```bash
npm install
```

## 5. Start the application

Run:

```bash
npm start
```

If successful you should see:

```text
Connected to PostgreSQL
Aditya Blog is running at http://localhost:3000
```

Open:

`http://localhost:3000`

## Main REST APIs

### Authentication

- POST `/api/auth/register`
- POST `/api/auth/login`

### Posts

- GET `/api/posts`
- GET `/api/posts/:id`
- POST `/api/posts`
- PUT `/api/posts/:id`
- DELETE `/api/posts/:id`
- POST `/api/posts/:id/like`

### Comments

- POST `/api/comments/post/:postId`
- DELETE `/api/comments/:id`

## Suggested Demo

1. Register User 1.
2. Publish a blog post.
3. Logout.
4. Register User 2.
5. Open User 1's post.
6. Like it and add a comment.
7. Login again as User 1.
8. Edit the post.
9. Show that only the owner can edit/delete it.
