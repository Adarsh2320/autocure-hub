const express = require("express");
const router = express.Router();
const db = require("../db"); // PostgreSQL connection

// Create a new booking and associated services
router.post("/", async (req, res) => {
  const {
    userId,
    ownerName,
    carNumber,
    contactNumber,
    serviceDate,
    serviceTime,
    selectedServices,
  } = req.body;

  try {
    const insertBookingQuery = `
      INSERT INTO bookings (user_id, user_name, car_number, contact_number, booking_date, booking_time)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;

    const { rows } = await db.query(insertBookingQuery, [
      userId,
      ownerName,
      carNumber,
      contactNumber,
      serviceDate,
      serviceTime,
    ]);

    const bookingId = rows[0].id;

    const serviceInsertPromises = selectedServices.map((serviceId) =>
      db.query(
        "INSERT INTO booking_services (booking_id, service_id) VALUES ($1, $2)",
        [bookingId, serviceId]
      )
    );

    await Promise.all(serviceInsertPromises);

    res.status(201).json({ message: "Booking created successfully!", bookingId });
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update task status and booking status if needed
router.put("/status/:taskId", async (req, res) => {
  const { taskId } = req.params;
  const { status } = req.body;

  try {
    // Step 1: Get booking_id from tasks
    const {
      rows: taskRows,
    } = await db.query("SELECT booking_id FROM tasks WHERE id = $1", [taskId]);

    if (!taskRows.length || !taskRows[0].booking_id) {
      return res.status(404).json({ error: "Task not found or booking ID is missing" });
    }

    const bookingId = taskRows[0].booking_id;

    // Step 2: Check if other tasks exist
    const {
      rows: otherTasks,
    } = await db.query(
      "SELECT id FROM tasks WHERE booking_id = $1 AND id != $2",
      [bookingId, taskId]
    );

    if (otherTasks.length > 0) {
      return res.json({ message: "Other tasks exist for this booking. Status not updated." });
    }

    // Step 3: Update booking_services status
    await db.query(
      "UPDATE booking_services SET status = $1 WHERE booking_id = $2",
      [status, bookingId]
    );

    res.json({ message: "Booking status updated successfully", bookingId });
  } catch (error) {
    console.error("Error updating task status:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get all customers with their latest review
router.get("/customers", async (req, res) => {
  try {
    const { rows: customers } = await db.query(
      `SELECT p.id, p.name,
              (SELECT rating FROM reviews WHERE user_id = p.id ORDER BY created_at DESC LIMIT 1) AS latest_review
       FROM people p
       WHERE p.role = 'user'`
    );

    if (!customers.length) {
      console.log("No customers found in DB!");
      return res.status(404).json({ error: "User not found" });
    }

    res.json(customers);
  } catch (err) {
    console.error("Error fetching customers:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
