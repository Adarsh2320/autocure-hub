const express = require("express");
const router = express.Router();
const db = require("../db");

// Fetch all tasks with employee names
router.get("/", async (req, res) => {
    try {
        const [tasks] = await db.execute(`
            SELECT 
    t.id, 
    t.task_name, 
    t.status, 
    p.name AS employee_name, 
    p.id AS employee_id, 
    b.user_name AS owner_name,  -- Fetching owner name from the bookings table
    b.car_number, 
    b.contact_number 
FROM tasks t
LEFT JOIN people p ON t.assigned_to = p.id
LEFT JOIN bookings b ON t.booking_id = b.booking_id; -- Ensure correct linkage

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
        const [employees] = await db.execute("SELECT id, name FROM people WHERE role = 'employee'");
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
        await db.execute("UPDATE tasks SET assigned_to = ? WHERE id = ?", [employeeId, taskId]);
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
        await db.execute("UPDATE tasks SET status = ? WHERE id = ?", [status, taskId]);
        res.json({ message: "Task status updated successfully" });
    } catch (error) {
        console.error("Error updating task status:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Delete a task by ID
router.delete("/:id", (req, res) => {
    const taskId = req.params.id;

    db.query("DELETE FROM tasks WHERE id = ?", [taskId], (err, result) => {
        if (err) {
            console.error("Error deleting task:", err);
            return res.status(500).json({ error: "Internal Server Error" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Task not found" });
        }

        res.json({ message: "Task deleted successfully" });
    });
});

router.get("/counts", async (req, res) => {
    try {
        const [[pending], [active]] = await Promise.all([
            db.execute("SELECT COUNT(*) AS pending FROM tasks WHERE status = 'pending'"),
            db.execute("SELECT COUNT(*) AS active FROM tasks WHERE status = 'in progress'")
        ]);

        res.json({
            pending: pending[0].pending,
            active: active[0].active
        });

    } catch (error) {
        console.error("Database Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/assigned/:employeeId", async (req, res) => {
    const { employeeId } = req.params;

    try {
        const [tasks] = await db.execute(
            `SELECT t.task_id, t.task_name, t.status, e.employee_name
             FROM tasks t
             JOIN employees e ON t.assigned_to = e.employee_id
             WHERE t.assigned_to = ?`, 
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
        const [[assigned], [completed], [pending]] = await Promise.all([
            db.execute("SELECT COUNT(*) AS assigned FROM tasks WHERE assigned_to = ?", [employeeId]),
            db.execute("SELECT COUNT(*) AS completed FROM tasks WHERE assigned_to = ? AND status = 'completed'", [employeeId]),
            db.execute("SELECT COUNT(*) AS pending FROM tasks WHERE assigned_to = ? AND status = 'pending'", [employeeId])
        ]);
       
        res.json({
            assigned: assigned[0].assigned,
            completed: completed[0].completed,
            pending: pending[0].pending
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
        // Fetch tasks assigned to the employee along with the car number from the bookings table
        const [tasks] = await db.execute(
            `SELECT t.id, t.task_name, b.car_number, t.status
FROM tasks t
JOIN bookings b ON t.booking_id = b.booking_id
WHERE t.assigned_to = ? 
AND t.status IN ('pending', 'in-progress') 
ORDER BY t.id DESC;`,
            [employeeId]
        );

        res.json(tasks);
    } catch (error) {
        console.error("Error fetching tasks:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


module.exports = router;
