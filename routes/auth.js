const express = require("express");
const router = express.Router();
const User = require("../models/User");

// ===========================
// LOGIN PAGE
// ===========================
router.get("/login", (req, res) => {
  if (req.session.user) return res.redirect("/dashboard");
  res.render("login", { title: "Login" });
});

// ===========================
// LOGIN POST
// ===========================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      req.session.error = "Invalid email or password";
      return res.redirect("/login");
    }

    // 2️⃣ Verify password (hashed)
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      req.session.error = "Invalid email or password";
      return res.redirect("/login");
    }

    // 3️⃣ Store user in session
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    req.session.success = `Welcome back, ${user.name}!`;
    res.redirect("/dashboard");
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    req.session.error = "Login failed. Try again.";
    res.redirect("/login");
  }
});

// ===========================
// SIGNUP PAGE
// ===========================
router.get("/signup", (req, res) => {
  if (req.session.user) return res.redirect("/dashboard");
  res.render("signup", { title: "Signup" });
});

// ===========================
// SIGNUP POST
// ===========================
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, phone, address, role } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      req.session.error = "Email already registered";
      return res.redirect("/signup");
    }

    // Create new user (password automatically hashed in User model)
    const user = new User({
      name,
      email,
      password,
      phone,
      address,
      role: role || "customer",
    });

    await user.save();

    req.session.success = "Signup successful! Please login.";
    res.redirect("/login");
  } catch (error) {
    console.error("SIGNUP ERROR:", error);
    req.session.error = "Registration failed. Try again.";
    res.redirect("/signup");
  }
});

// ===========================
// LOGOUT
// ===========================
router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});

module.exports = router;
