const express = require("express");
const router = express.Router();
const db = require("../db"); // Assuming you have a MySQL connection setup in db.js

// Fetch all employees
router.get("/", async (req, res) => {
    try {
        const [employees] = await db.execute(`
            SELECT p.id, p.name, e.status 
            FROM people p 
            JOIN employee_details e ON p.id = e.employee_id
        `);
        res.json(employees);
    } catch (error) {
        console.error("Error fetching employees:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/details/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const [employee] = await db.execute(
            `SELECT p.id, p.name, p.email, p.mobile, p.role, e.status, e.security_key
             FROM people p 
             LEFT JOIN employee_details e ON p.id = e.employee_id
             WHERE p.id = ?`, 
            [id]
        );

        if (employee.length === 0) {
            return res.status(404).json({ error: "Employee not found" });
        }

        res.json(employee[0]); // Send first record as JSON response
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
        const [employee] = await db.execute(
            "SELECT status FROM employee_details WHERE employee_id = ?",
            [id]
        );
        if (employee.length === 0) return res.status(404).json({ error: "Employee not found" });

        const newStatus = employee[0].status === "Active" ? "Inactive" : "Active";

        // Update status
        await db.execute(
            "UPDATE employee_details SET status = ? WHERE employee_id = ?",
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
        await db.execute("DELETE FROM people WHERE id = ?", [id]);
        res.json({ message: "Employee removed successfully" });
    } catch (error) {
        console.error("Error removing employee:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


module.exports = router;
