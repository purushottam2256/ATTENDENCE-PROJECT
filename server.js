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

const currentDate = new Date();
const formattedDate = `${currentDate.getDate()} ${currentDate.toLocaleString('default', { month: 'long' })} ${currentDate.getFullYear()}`;
const dayIndex = 2;
// const dayIndex = currentDate.getDay() - 1;

// Route for the login page
app.get('/login', (req, res) => {
    res.render('login');
});

// Handle login form submission
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (isValidUser(username, password)) {
        // Store user info in session
        req.session.username = username;
        console.log(username);
        res.redirect(`/${username}`);
    } else {
        res.send('Invalid username or password');
    }
});
app.get('/logout', (req, res) => {
    // Destroy the user session
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/');
        }
        res.clearCookie('connect.sid'); // Clears the session cookie
        res.redirect('/login'); // Redirect to login page after logout
    });
});
// Route for the user-specific page
app.get('/:username', (req, res) => {
    const { username } = req.params;
    let student = {};
    let schedule = {};
    if (isValidUser(username, username)) {
        const studentData = fs.readFileSync(studentDetailsFilePath);
        const studentDetails = JSON.parse(studentData);
        student = studentDetails.find(student => student["roll-number"] === username);
    
        const scheduleData = fs.readFileSync(scheduleDetailsFilePath);
        const scheduleDetails = JSON.parse(scheduleData);
        schedule = scheduleDetails.find(schedule => schedule["class"] === student["section"]);
        console.log(student);
        console.log(schedule);
    }
    const classes = (dayIndex == -1) ? [] : schedule["schedule"][dayIndex]["classes"];
    console.log(classes);

    if (req.session.username === username) {
        res.render('user', { username, student, formattedDate, classes , capitalizeEachWord });
    } else {
        res.redirect('/login');
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});


function capitalizeEachWord(str) {
    return str.split(' ').map(word => {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
  }

  function isValidUser(username, password) {
    const usersData = fs.readFileSync(userLoginFilePath);
    const users = JSON.parse(usersData);
    return users.includes(username) && users.includes(password);
}