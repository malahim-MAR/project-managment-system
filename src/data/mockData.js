export const projects = [
    {
        id: 1,
        name: "AI-Powered Analytics Platform",
        status: "In Progress",
        createdAt: "2023-10-15",
        updatedAt: "2023-10-28",
        description: "A comprehensive analytics dashboard using machine learning to predict user trends.",
        commits: [
            { id: 101, message: "Initial setup of the machine learning model", author: "Alice Johnson", date: "2023-10-15" },
            { id: 102, message: "Added data visualization components", author: "Bob Smith", date: "2023-10-20" },
            { id: 103, message: "Optimized database queries for faster load", author: "Alice Johnson", date: "2023-10-28" }
        ]
    },
    {
        id: 2,
        name: "E-Commerce Mobile App",
        status: "Review",
        createdAt: "2023-09-01",
        updatedAt: "2023-10-25",
        description: "A cross-platform mobile application for a large retail chain.",
        commits: [
            { id: 201, message: "Implemented authentication flow", author: "Charlie Brown", date: "2023-09-02" },
            { id: 202, message: "Fixed cart update bug", author: "Bob Smith", date: "2023-09-15" },
            { id: 203, message: "UI polish and checkout integration", author: "Charlie Brown", date: "2023-10-25" }
        ]
    },
    {
        id: 3,
        name: "Internal HR Portal",
        status: "Completed",
        createdAt: "2023-08-10",
        updatedAt: "2023-09-30",
        description: "An internal portal for employee management and leave requests.",
        commits: [
            { id: 301, message: "Setup database schema", author: "David Wilson", date: "2023-08-10" },
            { id: 302, message: "Frontend dashboard implementation", author: "Eve Davis", date: "2023-08-25" },
            { id: 303, message: "Final testing and deployment scripts", author: "David Wilson", date: "2023-09-30" }
        ]
    }
];

export const services = [
    {
        id: "project-management",
        title: "Project Management System",
        description: "Track projects, tasks, and code commits in real-time.",
        icon: "LayoutDashboard", // Helper for dynamic icon loading
        active: true
    },
    {
        id: "attendance",
        title: "Attendance System",
        description: "Monitor employee attendance and work hours.",
        icon: "Clock",
        active: false
    },
    {
        id: "salary",
        title: "Salary Pay System",
        description: "Manage payroll, deductions, and overtime calculations.",
        icon: "DollarSign",
        active: false
    }
];
