const { pool } = require('../config/db');

// Main dashboard aggregation endpoint
const getDashboardMetrics = async (req, res) => {
    try {
        // 1. Total Students
        const totalStudentsResult = await pool.query(`SELECT COUNT(*) as count FROM students`);
        const totalStudents = parseInt(totalStudentsResult.rows[0].count);

        // 2. Active Classes
        const activeClassesResult = await pool.query(`SELECT COUNT(*) as count FROM classes`);
        const totalClasses = parseInt(activeClassesResult.rows[0].count);

        // 4. Fees Collected
        const feesCollectedResult = await pool.query(`SELECT COALESCE(SUM(amount_paid), 0) as total FROM payments`);
        const feesCollected = parseFloat(feesCollectedResult.rows[0].total);

        // 5. New Students This Month
        const newStudentsResult = await pool.query(`
            SELECT COUNT(*) as count 
            FROM users u
            JOIN students s ON u.id = s.user_id
            WHERE DATE_TRUNC('month', u.created_at) = DATE_TRUNC('month', CURRENT_DATE)
        `);
        const newStudents = parseInt(newStudentsResult.rows[0].count);

        // 6. Pending Fees
        const pendingFeesResult = await pool.query(`
            SELECT COALESCE(SUM(sf.amount - sf.discount - (
                SELECT COALESCE(SUM(amount_paid), 0) FROM payments WHERE student_fee_id = sf.id
            )), 0) as total
            FROM student_fees sf
            WHERE sf.status IN ('UNPAID', 'PARTIALLY_PAID', 'OVERDUE')
        `);
        const pendingFees = parseFloat(pendingFeesResult.rows[0].total);

        // 8. Inactive Students
        const inactiveStudentsResult = await pool.query(`
            SELECT COUNT(*) as count 
            FROM users u
            JOIN students s ON u.id = s.user_id
            WHERE u.status = 'INACTIVE'
        `);
        const inactiveStudents = parseInt(inactiveStudentsResult.rows[0].count);

        // --- CHARTS DATA ---

        // A. Monthly Student Enrollment (Last 6 months)
        const enrollmentTrendResult = await pool.query(`
            SELECT 
                TO_CHAR(u.created_at, 'Mon') as month,
                COUNT(*) as students
            FROM users u
            JOIN students s ON u.id = s.user_id
            WHERE u.created_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months'
            GROUP BY TO_CHAR(u.created_at, 'Mon'), DATE_TRUNC('month', u.created_at)
            ORDER BY DATE_TRUNC('month', u.created_at)
        `);
        const enrollmentTrend = enrollmentTrendResult.rows;

        // B. Class wise students distribution
        const classDistributionResult = await pool.query(`
            SELECT 
                c.subject as name,
                COUNT(e.student_id) as value
            FROM classes c
            LEFT JOIN enrollments e ON c.id = e.class_id
            GROUP BY c.id, c.subject
        `);
        const classDistribution = classDistributionResult.rows;

        // D. Monthly fees collection
        const monthlyFeesResult = await pool.query(`
            SELECT 
                TO_CHAR(date, 'Mon') as month,
                SUM(amount_paid) as collection
            FROM payments
            WHERE date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months'
            GROUP BY TO_CHAR(date, 'Mon'), DATE_TRUNC('month', date)
            ORDER BY DATE_TRUNC('month', date)
        `);
        const monthlyFeesCollection = monthlyFeesResult.rows;

        // --- SECTION DATA ---

        // Recent Activity (Mocked from latest created students and payments for simplicity)
        const recentStudentsResult = await pool.query(`
            SELECT s.first_name, s.last_name, u.created_at, 'student_registered' as type 
            FROM students s JOIN users u ON s.user_id = u.id 
            ORDER BY u.created_at DESC LIMIT 3
        `);
        const recentPaymentsResult = await pool.query(`
            SELECT p.amount_paid, s.first_name, s.last_name, p.date as created_at, 'fee_paid' as type
            FROM payments p 
            JOIN student_fees f ON p.student_fee_id = f.id
            JOIN students s ON f.student_id = s.id
            ORDER BY p.date DESC LIMIT 3
        `);
        let recentActivity = [...recentStudentsResult.rows, ...recentPaymentsResult.rows]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 5)
            .map(item => {
                if (item.type === 'student_registered') {
                    return { message: `Student ${item.first_name} ${item.last_name} registered`, timestamp: item.created_at, icon: 'UserPlus', color: 'text-blue-500' };
                } else {
                    return { message: `Fees received from ${item.first_name} ${item.last_name} ($${item.amount_paid})`, timestamp: item.created_at, icon: 'DollarSign', color: 'text-emerald-500' };
                }
            });

        // Add some mock recent activity if DB is empty to make UI look good
        if (recentActivity.length === 0) {
            recentActivity = [
                { message: 'Notice published for Class 10', timestamp: new Date(Date.now() - 3600000), icon: 'Bell', color: 'text-amber-500' },
                { message: 'System updated', timestamp: new Date(Date.now() - 86400000), icon: 'Settings', color: 'text-slate-500' }
            ];
        }

        // Class Overview (combining class list with student count)
        const classOverviewResult = await pool.query(`
                    SELECT
                    c.id, c.subject as class_name,
                        COUNT(e.student_id) as students
            FROM classes c
            LEFT JOIN enrollments e ON c.id = e.class_id
            GROUP BY c.id, c.subject
            LIMIT 5
                        `);
        const classOverview = classOverviewResult.rows;

        // System Summary
        const latestNoticeRes = await pool.query('SELECT title, created_at FROM notices ORDER BY is_pinned DESC, created_at DESC LIMIT 1');
        const latestNotice = latestNoticeRes.rows.length > 0 ? latestNoticeRes.rows[0] : null;

        const systemSummary = {
            totalClasses,
            totalNotices: parseInt((await pool.query('SELECT COUNT(*) as count FROM notices')).rows[0].count),
            latestNotice
        };

        res.json({
            metrics: {
                totalStudents,
                totalClasses,
                feesCollected,
                newStudents,
                pendingFees,
                inactiveStudents
            },
            charts: {
                enrollmentTrend,
                classDistribution,
                monthlyFeesCollection
            },
            sections: {
                recentActivity,
                classOverview,
                systemSummary
            }
        });

    } catch (error) {
        console.error("Dashboard Metrics Error:", error);
        res.status(500).json({ message: "Server error while fetching dashboard metrics" });
    }
};

module.exports = {
    getDashboardMetrics
};
