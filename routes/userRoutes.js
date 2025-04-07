const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db");
const router = express.Router();

// **User Signup**
router.post("/signup", async (req, res) => {
    const { name, email, mobile, password, role, securityKey } = req.body;
   console.log(req.body);
    try {
        const { rows: existingUser } = await db.query(
            "SELECT * FROM people WHERE email = $1",
            [email]
        );
        if (existingUser.length > 0) {
            return res.status(400).json({ message: "Email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query(
            "INSERT INTO people (name, email, mobile, password, role) VALUES ($1, $2, $3, $4, $5)",
            [name, email, mobile, hashedPassword, role]
        );

        if (role === "manager") {
            const { rows: manager } = await db.query("SELECT * FROM people WHERE email = $1", [email]);
            await db.query("INSERT INTO manager_details (manager_id, security_key) VALUES ($1, $2)", [manager[0].id, securityKey]);

        } else if (role === "employee") {
            const { rows: employee } = await db.query("SELECT * FROM people WHERE email = $1", [email]);
            await db.query("INSERT INTO employee_details (employee_id, security_key) VALUES ($1, $2)", [employee[0].id, securityKey]);
        }

        res.status(201).json({ message: "User registered successfully" });

    } catch (error) {
        console.error("Error during signup:", error);
        res.status(500).json({ message: "Server error. Try again later." });
    }
});

// **User Login**
router.post("/login", async (req, res) => {
    const { role, email, password, securityKey } = req.body;

    try {
        if (role === "manager") {
            const { rows: manager } = await db.query("SELECT * FROM people WHERE email = $1", [email]);
            const { rows: managerKey } = await db.query("SELECT * FROM manager_details WHERE manager_id = $1", [manager[0].id]);

            if (securityKey !== managerKey[0].security_key) {
                return res.status(401).json({ message: "You cannot signup as Manager!" });
            }

        } else if (role === "employee") {
            const { rows: employee } = await db.query("SELECT * FROM people WHERE email = $1", [email]);
            const { rows: employeeKey } = await db.query("SELECT security_key FROM employee_details WHERE employee_id = $1", [employee[0].id]);

            if (securityKey !== employeeKey[0].security_key) {
                return res.status(401).json({ message: "You cannot signup as Employee!" });
            }
        }

        const { rows: user } = await db.query("SELECT * FROM people WHERE email = $1", [email]);
        if (user.length === 0) {
            return res.status(401).json({ message: "Email does not exist" });
        }

        const validPassword = await bcrypt.compare(password, user[0].password);
        if (!validPassword) {
            return res.status(401).json({ message: "Incorrect Password, Try again" });
        }

        res.status(200).json({ message: "Login successful", user: user[0] });

    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ message: "Server error. Try again later." });
    }
});

// **User Info + Booking Data**
router.get('/:id', async (req, res) => {
    try {
        const userId = req.params.id;

        const { rows: user } = await db.query(
            "SELECT id, name, email, mobile, role, user_image FROM people WHERE id = $1",
            [userId]
        );
        if (!user.length) {
            return res.status(404).json({ message: "User not found" });
        }

        const { rows: currentBookings } = await db.query(
            `SELECT b.booking_id, b.car_number, b.contact_number, b.booking_date, b.booking_time, bs.status, s.service_name
             FROM bookings b
             JOIN booking_services bs ON b.booking_id = bs.booking_id
             JOIN services s ON bs.service_id = s.service_id
             WHERE b.user_id = $1 AND bs.status IN ('pending', 'confirmed', 'in progress')
             ORDER BY b.booking_date DESC`,
            [userId]
        );

        const { rows: bookingHistory } = await db.query(
            `SELECT b.booking_id, b.car_number, b.contact_number, b.booking_date, b.booking_time, bs.status, s.service_name
             FROM bookings b
             JOIN booking_services bs ON b.booking_id = bs.booking_id
             JOIN services s ON bs.service_id = s.service_id
             WHERE b.user_id = $1 AND bs.status IN ('completed', 'cancelled')
             ORDER BY b.booking_date DESC`,
            [userId]
        );

        return res.json({
            user: user[0],
            currentBookings,
            bookingHistory
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// **Customer Info + Reviews**
router.get("/customer/:id", async (req, res) => {
    try {
        const customerId = req.params.id;

        const { rows: customer } = await db.query(
            "SELECT id, name, email, mobile, role, user_image FROM people WHERE id = $1",
            [customerId]
        );
        if (!customer.length) {
            return res.status(404).json({ message: "Customer not found" });
        }

        const { rows: reviews } = await db.query(
            "SELECT rating FROM reviews WHERE user_id = $1",
            [customerId]
        );

        const { rows: currentBookings } = await db.query(
            `SELECT b.booking_id, b.car_number, b.contact_number, b.booking_date, b.booking_time, bs.status, s.service_name
             FROM bookings b
             JOIN booking_services bs ON b.booking_id = bs.booking_id
             JOIN services s ON bs.service_id = s.service_id
             WHERE b.user_id = $1 AND bs.status IN ('pending', 'confirmed', 'in progress')
             ORDER BY b.booking_date DESC`,
            [customerId]
        );

        const { rows: bookingHistory } = await db.query(
            `SELECT b.booking_id, b.car_number, b.contact_number, b.booking_date, b.booking_time, bs.status, s.service_name
             FROM bookings b
             JOIN booking_services bs ON b.booking_id = bs.booking_id
             JOIN services s ON bs.service_id = s.service_id
             WHERE b.user_id = $1 AND bs.status IN ('completed', 'cancelled')
             ORDER BY b.booking_date DESC`,
            [customerId]
        );

        res.json({
            customer: customer[0],
            reviews: reviews.map(r => r.rating) || ["No Reviews"],
            currentBookings,
            bookingHistory
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;
