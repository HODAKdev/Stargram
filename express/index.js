const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcrypt");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const {
  Pool
} = require("pg");

const app = express();
const port = 8080;
const saltRounds = 10;

require("dotenv").config();

// configure PostgreSQL connection
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

const JWT_SECRET = process.env.JWT_SECRET;

app.use(cors({
  origin: "http://localhost:3000", // Your client origin
  credentials: true                // Allows credentials (like cookies)
}));
app.use(bodyParser.json());
app.use(cookieParser());

async function hashPassword(password) {
  try {
    const hash = await bcrypt.hash(password, saltRounds);
    //console.log("Hashed Password:", hash);
    return hash;
  } catch (error) {
    console.error("Error generating hash:", error);
  }
}

async function getUserById(userId) {
  const query = "SELECT first_name, last_name, username, email FROM users WHERE id = $1";
  const values = [userId];

  try {
    const result = await pool.query(query, values); // Use `pool` here
    return result.rows[0]; // Return the first row if found
  } catch (error) {
    console.error("Error fetching user:", error);
    throw error; // Rethrow the error to handle it in the calling function
  }
}

app.post("/api/register", async (req, res) => {
  const {
    firstName,
    lastName,
    username,
    email,
    password,
    confirmPassword
  } = req.body;

  // validation
  if (!firstName || !lastName || !username || !email || !password || !confirmPassword) {
    return res.status(400).json({
      message: "All fields are required."
    });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json({
      message: "Invalid email format."
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      message: "Password is too short."
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({
      message: "Passwords do not match."
    });
  }

  try {
    // check if username already exists
    const usernameCheckQuery = `SELECT * FROM users WHERE username = $1;`;
    const usernameCheckResult = await pool.query(usernameCheckQuery, [username]);

    if (usernameCheckResult.rows.length > 0) {
      return res.status(400).json({
        message: "Username already exists."
      });
    }

    // check if email already exists
    const emailCheckQuery = `SELECT * FROM users WHERE email = $1;`;
    const emailCheckResult = await pool.query(emailCheckQuery, [email]);

    if (emailCheckResult.rows.length > 0) {
      return res.status(400).json({
        message: "Email already exists."
      });
    }

    const hash = await hashPassword(password);

    // insert the user data into the database
    const query = `
      INSERT INTO users (first_name, last_name, username, email, password_hash)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id;
    `;
    const values = [firstName, lastName, username, email, hash];
    const result = await pool.query(query, values);

  // Generate token with only the userId
const token = jwt.sign(
  { userId: result.rows[0].id },
  JWT_SECRET,
  { expiresIn: "1h" } // Token expiration time
);

res.cookie("authToken", token, {
  httpOnly: false,        // Adjust based on your security requirements
  secure: false,          // Set to true in production with HTTPS
  sameSite: "Strict",     // Helps prevent CSRF attacks
  maxAge: 60 * 60 * 1000, // Cookie expiration time (same as token expiry)
  path: "/"               // Ensures the cookie is accessible site-wide
});

    // success response
    res.status(201).json({
      message: "Registration successful",
      userId: result.rows[0].id
    });

    // masked password
    let maskedPassword = "";
    for (let i = 0; i < password.length; i++) {
      maskedPassword += "*";
    }

    // console logs
    console.log("First Name:", firstName);
    console.log("Last Name:", lastName);
    console.log("Email:", email);
    console.log("Password:", maskedPassword);
    console.log("----------------");

  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({
      message: "An error occurred during registration."
    });
  }
});

app.post("/api/login", async (req, res) => {
  const { usernameOrEmail, password } = req.body;

  // Check if both fields are provided
  if (!usernameOrEmail || !password) {
    return res.status(400).json({ message: "Username/Email and password are required." });
  }

  try {
    // Find the user by username or email
    const query = "SELECT * FROM users WHERE username = $1 OR email = $1";
    const values = [usernameOrEmail];
    const result = await pool.query(query, values);

    // Check if the user exists
    if (result.rows.length === 0) {
      return res.status(400).json({ message: "User not found." });
    }

    const user = result.rows[0];

    // Check if the provided password matches the stored hash
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(400).json({ message: "Incorrect password." });
    }

    // Generate JWT token if authentication succeeds
    const token = jwt.sign(
      { userId: user.id },
      JWT_SECRET,
      { expiresIn: "1h" } // Token expiry time
    );

    // Set the token as a cookie
    res.cookie("authToken", token, {
      httpOnly: true,       // Makes the cookie inaccessible to JavaScript in the browser
      secure: process.env.NODE_ENV === "production", // Ensures it's only sent over HTTPS in production
      sameSite: "Strict",    // CSRF protection; adjust based on your app's requirements
      maxAge: 60 * 60 * 1000 // 1 hour in milliseconds
    });

    // Send a success response
    res.status(200).json({ message: "Login successful" });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "An error occurred during login." });
  }
});


app.get("/api/verify-token", async (req, res) => {
  console.log("verify-token");
  console.log(req.cookies);
  const token = req.cookies.authToken;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    // Verify and decode the token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Fetch additional user info from the database based on userId
    const user = await getUserById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Send user data as a response
    res.json({
      firstName: user.first_name, // Assuming your database has these fields
      lastName: user.last_name,
      username: user.username,
      email: user.email
    });
  } catch (error) {
    console.error("Error verifying token:", error);
    return res.status(401).json({ error: "Token is invalid or expired" });
  }
});

app.delete("/api/deleteacc", async (req, res) => {
  console.log("deleteacc");
  const token = req.cookies.authToken;
  
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Verify and decode the token to get the userId
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    // Delete the user from the database
    const deleteQuery = "DELETE FROM users WHERE id = $1";
    await pool.query(deleteQuery, [userId]);

    // Clear the auth cookie
    res.clearCookie("authToken", {
      path: "/", 
      sameSite: "Strict", 
      secure: false // Set to true in production with HTTPS
    });

    res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({ error: "Failed to delete account" });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});