// Import necessary modules
const express = require('express');
const bodyParser = require('body-parser');
const mariadb = require('mariadb');
const path = require('path'); // Import the path module

// Create a new express application
const app = express();

// Set up body parser middleware
app.use(bodyParser.urlencoded({ extended: true }));

// Connect to MariaDB database
const pool = mariadb.createPool({
  host: 'localhost',
  user: 'deepak',
  password: '12345',
  database: 'my_node_app_db'
});

// Serve static files from the current working directory
app.use(express.static(path.join(__dirname, 'public')));

// Define routes
app.get('/', (req, res) => {
  // Check if the user has been logged in for more than 6 hours
  const lastLoginTime = req.session.lastLoginTime || 0;
  const currentTime = new Date().getTime();
  const timeSinceLastLogin = currentTime - lastLoginTime;
  if (timeSinceLastLogin > 6 * 60 * 60 * 1000) {
    // Redirect to login page if the user has not been logged in for more than 6 hours
    res.redirect('/login.html');
  } else {
    // Redirect to home page if the user has been logged in within the last 6 hours
    res.redirect('/home.html');
  }
});

app.get('/login', (req, res) => {
  // Render login page from the public directory
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  // Validate username and password
  // Check credentials in the database
  const conn = await pool.getConnection();
  try {
    const user = await conn.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);
    if (user.length > 0) {
      // Redirect to home page if login is successful
      res.redirect('/home.html');
    } else {
      // Handle invalid credentials
      res.send('Invalid username or password');
    }
  } catch (err) {
    // Handle database error
    console.error(err);
    res.status(500).send('Internal Server Error');
  } finally {
    conn.release(); // Release the connection
  }
});

app.get('/signup', (req, res) => {
  // Render signup page from the public directory
  res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

app.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  // Save login data to MariaDB database
  const conn = await pool.getConnection();
  try {
    await conn.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, password]);
    res.send('Signup successful');
  } catch (err) {
    // Handle database error
    console.error(err);
    res.status(500).send('Internal Server Error');
  } finally {
    conn.release(); // Release the connection
  }
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
