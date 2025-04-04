const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const db = require("./db"); // Database connection
require("dotenv").config();

const app = express();
const port = 8080;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import Routes
const userRoutes = require("./routes/userRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const galleryRoutes = require("./routes/gallery");
const employeeRoutes = require("./routes/employee");
const taskRoutes = require("./routes/task");
const bookingRoutes = require("./routes/bookings");
const notificationRoutes = require("./routes/notifications");

// Use Routes
app.use("/users", userRoutes);
app.use("/services", serviceRoutes);
app.use("/reviews", reviewRoutes);
app.use("/gallery", galleryRoutes);
app.use("/employees", employeeRoutes);
app.use("/tasks", taskRoutes);
app.use("/bookings", bookingRoutes);
app.use("/notifications", notificationRoutes);

// **Start Server**
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  
});
