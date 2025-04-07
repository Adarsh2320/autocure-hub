const express = require("express");
const router = express.Router();
const db = require("../db");

// Fetch all tasks with employee names
router.get("/", async (req, res) => {
    try {
        const { rows: tasks } = await db.query(`
            SELECT 
                t.id, 
                t.task_name, 
                t.status, 
                p.name AS employee_name, 
                p.id AS employee_id, 
                b.user_name AS owner_name,  
                b.car_number, 
                b.contact_number 
            FROM tasks t
            LEFT JOIN people p ON t.assigned_to = p.id
            LEFT JOIN bookings b ON t.booking_id = b.booking_id;
        `);
        res.json(tasks);
    } catch (error) {
        console.error("Error fetching tasks:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Fetch all employees for assignment dropdown
router.get("/employees", async (req, res) => {
    try {
        const { rows: employees } = await db.query("SELECT id, name FROM people WHERE role = 'employee'");
        res.json(employees);
    } catch (error) {
        console.error("Error fetching employees:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Assign task to an employee
router.put("/assign/:taskId", async (req, res) => {
    const { taskId } = req.params;
    const { employeeId } = req.body;

    try {
        await db.query("UPDATE tasks SET assigned_to = $1 WHERE id = $2", [employeeId, taskId]);
        res.json({ message: "Task assigned successfully" });
    } catch (error) {
        console.error("Error assigning task:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Update task status
router.put("/status/:taskId", async (req, res) => {
    const { taskId } = req.params;
    const { status } = req.body;
    
    try {
        await db.query("UPDATE tasks SET status = $1 WHERE id = $2", [status, taskId]);
        res.json({ message: "Task status updated successfully" });
    } catch (error) {
        console.error("Error updating task status:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Delete a task by ID
router.delete("/:id", async (req, res) => {
    const taskId = req.params.id;

    try {
        const result = await db.query("DELETE FROM tasks WHERE id = $1", [taskId]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Task not found" });
        }

        res.json({ message: "Task deleted successfully" });
    } catch (error) {
        console.error("Error deleting task:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/counts", async (req, res) => {
    try {
        const pendingResult = await db.query("SELECT COUNT(*) AS pending FROM tasks WHERE status = 'pending'");
        const activeResult = await db.query("SELECT COUNT(*) AS active FROM tasks WHERE status = 'in progress'");

        res.json({
            pending: parseInt(pendingResult.rows[0].pending),
            active: parseInt(activeResult.rows[0].active)
        });

    } catch (error) {
        console.error("Database Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/assigned/:employeeId", async (req, res) => {
    const { employeeId } = req.params;

    try {
        const { rows: tasks } = await db.query(
            `SELECT t.id as task_id, t.task_name, t.status, p.name as employee_name
             FROM tasks t
             JOIN people p ON t.assigned_to = p.id
             WHERE t.assigned_to = $1`, 
             [employeeId]
        );

        res.json(tasks);
    } catch (error) {
        console.error("Error fetching assigned tasks:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Get task counts for a specific employee
router.get("/counts/:employeeId", async (req, res) => {
    const { employeeId } = req.params;

    try {
        const assignedRes = await db.query("SELECT COUNT(*) AS assigned FROM tasks WHERE assigned_to = $1", [employeeId]);
        const completedRes = await db.query("SELECT COUNT(*) AS completed FROM tasks WHERE assigned_to = $1 AND status = 'completed'", [employeeId]);
        const pendingRes = await db.query("SELECT COUNT(*) AS pending FROM tasks WHERE assigned_to = $1 AND status = 'pending'", [employeeId]);

        res.json({
            assigned: parseInt(assignedRes.rows[0].assigned),
            completed: parseInt(completedRes.rows[0].completed),
            pending: parseInt(pendingRes.rows[0].pending)
        });

    } catch (error) {
        console.error("Database Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Get assigned tasks for a specific employee
router.get("/:employeeId", async (req, res) => {
    const { employeeId } = req.params;
    
    try {
        const { rows: tasks } = await db.query(
            `SELECT t.id, t.task_name, b.car_number, t.status
             FROM tasks t
             JOIN bookings b ON t.booking_id = b.booking_id
             WHERE t.assigned_to = $1 
             AND t.status IN ('pending', 'in-progress') 
             ORDER BY t.id DESC`,
            [employeeId]
        );

        res.json(tasks);
    } catch (error) {
        console.error("Error fetching tasks:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
