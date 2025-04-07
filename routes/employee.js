const express = require("express");
const router = express.Router();
const db = require("../db"); // PostgreSQL connection setup

// Fetch all employees
router.get("/", async (req, res) => {
    try {
        const { rows } = await db.query(`
            SELECT p.id, p.name, e.status 
            FROM people p 
            JOIN employee_details e ON p.id = e.employee_id
        `);
        res.json(rows);
    } catch (error) {
        console.error("Error fetching employees:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Get full details for one employee
router.get("/details/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const { rows } = await db.query(
            `SELECT p.id, p.name, p.email, p.mobile, p.role, e.status, e.security_key
             FROM people p 
             LEFT JOIN employee_details e ON p.id = e.employee_id
             WHERE p.id = $1`, 
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: "Employee not found" });
        }

        res.json(rows[0]); // Return first record
    } catch (error) {
        console.error("Error fetching employee details:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Toggle employee status
router.put("/:id/toggle-status", async (req, res) => {
    const { id } = req.params;

    try {
        // Get current status
        const { rows } = await db.query(
            "SELECT status FROM employee_details WHERE employee_id = $1",
            [id]
        );

        if (rows.length === 0) return res.status(404).json({ error: "Employee not found" });

        const currentStatus = rows[0].status;
        const newStatus = currentStatus === "Active" ? "Inactive" : "Active";

        // Update status
        await db.query(
            "UPDATE employee_details SET status = $1 WHERE employee_id = $2",
            [newStatus, id]
        );

        res.json({ message: "Status updated successfully", newStatus });
    } catch (error) {
        console.error("Error updating employee status:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Remove employee
router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        await db.query("DELETE FROM people WHERE id = $1", [id]);
        res.json({ message: "Employee removed successfully" });
    } catch (error) {
        console.error("Error removing employee:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
