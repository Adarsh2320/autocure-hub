const express = require("express");
const router = express.Router();
const db = require("../db"); // Import database connection

router.post("/", async (req, res) => {
    
    const {userId, ownerName, carNumber, contactNumber, serviceDate, serviceTime, selectedServices } = req.body;

    try {
        const [result] = await db.query(
            "INSERT INTO bookings (user_id, user_name, car_number, contact_number, booking_date, booking_time) VALUES (?, ?, ?, ?, ?, ?)",
            [userId, ownerName, carNumber, contactNumber, serviceDate, serviceTime]
        );

        const bookingId = result.insertId;

        const serviceInsertPromises = selectedServices.map(serviceId =>
            db.query("INSERT INTO booking_services (booking_id, service_id) VALUES (?, ?)", [bookingId, serviceId])
        );

        await Promise.all(serviceInsertPromises);

        res.status(201).json({ message: "Booking created successfully!", bookingId });
    } catch (error) {
        console.error("Error creating booking:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Update task status
router.put("/status/:taskId", async (req, res) => {
    const { taskId } = req.params;
    const { status } = req.body;

    try {
        // Step 1: Fetch booking_id from tasks table
        const [[task]] = await db.execute("SELECT booking_id FROM tasks WHERE id = ?", [taskId]);

        if (!task || !task.booking_id) {
            return res.status(404).json({ error: "Task not found or booking ID is missing" });
        }

        const bookingId = task.booking_id;

        // Step 2: Check if there are other tasks associated with this booking_id
        const [otherTasks] = await db.execute("SELECT id FROM tasks WHERE booking_id = ? AND id != ?", [bookingId, taskId]);

        // If other tasks exist for the same booking_id, do nothing
        if (otherTasks.length > 0) {
            return res.json({ message: "Other tasks exist for this booking. Status not updated." });
        }

        // Step 3: If no other tasks exist, update status in booking_services table
        await db.execute("UPDATE booking_services SET status = ? WHERE booking_id = ?", [status, bookingId]);

        res.json({ message: "Booking status updated successfully", bookingId });
    } catch (error) {
        console.error("Error updating task status:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/customers", async (req, res) => {
  
    try {
        const [customers] = await db.execute(
            `SELECT p.id, p.name, 
                    (SELECT rating FROM reviews WHERE user_id = p.id ORDER BY created_at DESC LIMIT 1) AS latest_review 
             FROM people p 
             WHERE p.role = 'user'`
        );
 
  
        if (!customers || customers.length === 0) {
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
