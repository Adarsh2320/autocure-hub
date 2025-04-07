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
        EXTRACT(EPOCH FROM (NOW() - b.created_at)) / 60 AS time_elapsed
      FROM booking_services bs
      JOIN bookings b ON bs.booking_id = b.booking_id
      JOIN services s ON bs.service_id = s.service_id
      WHERE bs.status NOT IN ('completed', 'cancelled', 'confirmed')
      ORDER BY b.booking_date ASC, b.booking_time ASC;
    `;

    const { rows } = await db.query(query);

    const notifications = rows.map((row) => ({
      ...row,
      time_ago: formatTimeAgo(Math.floor(row.time_elapsed)),
    }));

    res.json(notifications);
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).send("Server Error");
  }
});

// Helper: human-readable time formatter
function formatTimeAgo(minutes) {
  if (minutes < 60) return `${minutes} minutes ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} hours ago`;
  return `${Math.floor(minutes / 1440)} days ago`;
}

// Confirm booking
router.post("/confirm/:id", async (req, res) => {
  try {
    const { managerId, service_name } = req.body;
    const bookingId = req.params.id;

    const { rows: serviceRows } = await db.query(
      "SELECT service_id FROM services WHERE service_name = $1",
      [service_name]
    );

    if (serviceRows.length === 0) {
      return res.status(404).json({ message: "Service not found" });
    }

    const service_id = serviceRows[0].service_id;

    await db.query(
      `UPDATE booking_services
       SET status = 'confirmed', manager_confirmed = TRUE, manager_id = $1
       WHERE booking_id = $2 AND service_id = $3`,
      [managerId, bookingId, service_id]
    );

    await db.query(
      `INSERT INTO tasks (task_name, assigned_to, status, booking_id)
       VALUES ($1, NULL, 'pending', $2)`,
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

    await db.query(
      `UPDATE bookings
       SET booking_date = $1, booking_time = $2
       WHERE booking_id = $3`,
      [booking_date, booking_time, bookingId]
    );

    res.send("Booking time updated.");
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
