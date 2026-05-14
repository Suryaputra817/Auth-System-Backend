# Secure Backend Authentication System

A robust, production-ready backend authentication API built with **Node.js, Express, and MongoDB**. 

This system implements modern security practices including JWT-based authentication, HTTP-only cookies for stateful refresh tokens, session management (allowing "logout from all devices"), and OTP-based email verification.

## 🚀 Features

* **User Registration & Login:** Secure password handling and authentication.
* **Email Verification (OTP):** Generates and sends a 6-digit OTP via email to verify new accounts.
* **Dual-Token System:** 
  * Short-lived **Access Tokens** (15 mins) sent in the JSON response.
  * Long-lived **Refresh Tokens** (7 days) stored securely in `httpOnly` cookies to prevent XSS attacks.
* **Advanced Session Management:**
  * Tracks user sessions in the database.
  * `Logout`: Revokes the current device's refresh token.
  * `Logout All`: Revokes all active sessions across all devices for the user.
* **Current User Profile:** Protected route to fetch the currently authenticated user's details.

## 🛠️ Tech Stack

* **Runtime:** Node.js
* **Framework:** Express.js
* **Database:** MongoDB (via Mongoose)
* **Authentication:** JSON Web Tokens (`jsonwebtoken`)
* **Security:** `crypto` (hashing), `cookie-parser` (secure cookies), `cors`
* **Email Service:** Nodemailer

## 📦 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd <project-folder>
