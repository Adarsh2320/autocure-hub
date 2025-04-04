const express = require("express");
const router = express.Router();
const db = require("../db");

// Fetch notifications (only incomplete bookings)
router.get("/", async (req, res) => {
  try {
    const query = `
            SELECT 
    b.booking_id, 
    b.user_name, 
    b.booking_date, 
    b.booking_time, 
    s.service_name, 
    bs.status,
    TIMESTAMPDIFF(MINUTE, b.created_at, NOW()) AS time_elapsed
FROM booking_services bs
JOIN bookings b ON bs.booking_id = b.booking_id
JOIN services s ON bs.service_id = s.service_id
WHERE bs.status NOT IN ('completed', 'cancelled', 'confirmed') -- Exclude confirmed bookings
ORDER BY b.booking_date ASC, b.booking_time ASC;
        `;

    const [rows] = await db.execute(query);

    // Convert time elapsed into a human-readable format
    const notifications = rows.map((row) => ({
      ...row,
      time_ago: formatTimeAgo(row.time_elapsed),
    }));

    res.json(notifications);
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).send("Server Error");
  }
});

// Helper function to format time ago
function formatTimeAgo(minutes) {
  if (minutes < 60) return `${minutes} minutes ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} hours ago`;
  return `${Math.floor(minutes / 1440)} days ago`;
}

//confirm booking
router.post("/confirm/:id", async (req, res) => {
  try {
    const { managerId, service_name } = req.body;
    const bookingId = req.params.id;

    // Fetch service name
    const [serviceRows] = await db.execute(
      "SELECT service_id FROM services WHERE service_name = ?",
      [service_name]
    );

    const service_id = serviceRows[0].service_id;

    // Update booking_services table instead of bookings
    await db.execute(
      "UPDATE booking_services SET status = 'confirmed', manager_confirmed = TRUE, manager_id = ? WHERE booking_id = ? AND service_id = ?",
      [managerId, bookingId, service_id]
    );

    // Insert into tasks table with the actual service name
    await db.execute(
      "INSERT INTO tasks (task_name, assigned_to, status, booking_id) VALUES (?, NULL, 'pending', ?)",
      [service_name, bookingId]
    );

    res.send("Booking confirmed and task created.");
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ error: "Server Error" });
  }
});

// Change booking time
router.post("/change-time/:id", async (req, res) => {
  try {
    const { booking_date, booking_time } = req.body;
    const bookingId = req.params.id;

    // Update booking time in the bookings table
    await db.execute(
      "UPDATE bookings SET booking_date = ?, booking_time = ? WHERE booking_id = ?",
      [booking_date, booking_time, bookingId]
    );

    res.send("Booking time updated.");
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
