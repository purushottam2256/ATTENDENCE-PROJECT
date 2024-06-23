const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware to parse incoming request bodies
app.use(bodyParser.urlencoded({ extended: true }));

// Set the view engine to EJS
app.set('view engine', 'ejs');

// Define the path to the users.json file
const userLoginFilePath = path.join(__dirname, 'data/users.json');
const studentDetailsFilePath = path.join(__dirname, 'data/students-info.json');
const scheduleDetailsFilePath = path.join(__dirname, 'data/time-table.json');
app.use("/", express.static(path.join(__dirname, 'public')));

// Middleware to ensure the users.json file exists
app.use((req, res, next) => {
    if (!fs.existsSync(userLoginFilePath)) {
        fs.writeFileSync(userLoginFilePath, JSON.stringify({}));
    }
    if (!fs.existsSync(studentDetailsFilePath)) {
        fs.writeFileSync(studentDetailsFilePath, JSON.stringify({}));
    }
    if (!fs.existsSync(scheduleDetailsFilePath)) {
        fs.writeFileSync(scheduleDetailsFilePath, JSON.stringify({}));
    }
    next();
});

// Set up session management
app.use(session({
    secret: 'your-secret-key', // Replace with a strong secret key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Route for the login page
app.get('/login', (req, res) => {
    res.render('login');
});

// Handle login form submission
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Read existing user data from JSON file
    const usersData = fs.readFileSync(userLoginFilePath);
    const users = JSON.parse(usersData);
    // Check if the user exists and the password matches
    if (users.includes(username) && users.includes(password)) {
        // Store user info in session
        req.session.username = username;
        console.log(username);
        res.redirect(`/${username}`);
    } else {
        res.send('Invalid username or password');
    }
});

// Route for the user-specific page
app.get('/:username', (req, res) => {
    const { username } = req.params;
    let student = {};
    let schedule = {};
    if (username) {
        const studentData = fs.readFileSync(studentDetailsFilePath);
        const studentDetails = JSON.parse(studentData);
        student = studentDetails.find(student => student["roll-number"] === username);
    
        const scheduleData = fs.readFileSync(scheduleDetailsFilePath);
        const scheduleDetails = JSON.parse(scheduleData);
        schedule = scheduleDetails.find(schedule => schedule["class"] === student["section"]);
        console.log(student);
        console.log(schedule);
    }

    if (req.session.username === username) {
        res.render('user', { username, student, schedule });
    } else {
        res.redirect('/login');
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
