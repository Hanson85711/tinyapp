const express = require("express");
const app = express();
const { findUser } = require('./helpers');
const { generateRandomString } = require('./helpers');
const { urlsForUser } = require('./helpers');
let cookieSession = require('cookie-session');
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(cookieSession({
  name: 'session',
  keys: ['mysecretkey', 'secretrotatedkey'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

const bcrypt = require("bcryptjs");

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};


const exampleUser = {
  id: "random",
  email: "random@example.com",
  password: "randompasswordexample",
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

app.use(express.urlencoded({ extended: true }));

//POST function for creating new URLs
app.post("/urls", (req, res) => {
  if (!users[req.session.user_id]) {
    res.send('Cannot create short URLs without logging in first');
    res.redirect("/login");
  }
  console.log(req.body); // Log the POST request body to the console
  const newid = generateRandomString();
  urlDatabase[newid] = { longURL: req.body['longURL'], userID: req.session.user_id};
  res.redirect(`/urls/${newid}`);
});

//POST function for editing existing URL
app.post("/urls/:id", (req, res) => {
  if (!users[req.session.user_id]) {
    res.send('Please login first to see URLs');
  }
  if (!urlDatabase[req.params.id]) {
    res.send('This shortened url does not exist.');
  }
  if (req.session.user_id !== urlDatabase[req.params.id].userID) {
    res.send('Cannot view edit url page because you do not own the url');
  }
  if (req.params.id)
    console.log(req.body); // Log the POST request body to the console
  urlDatabase[req.params.id] = { longURL: req.body['longURL'], userID: req.session.user_id};
  res.redirect(`/urls`);
});

//POST function for deleting an url from the database
app.post("/urls/:id/delete", (req, res) => {
  if (!users[req.session.user_id]) {
    res.send('Please login first to delete URLs');
  }
  if (!urlDatabase[req.params.id]) {
    res.send('This shortened url does not exist.');
  }
  if (req.session.user_id !== urlDatabase[req.params.id].userID) {
    res.send('Cannot delete this url because you do not own the url');
  }
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

//POST function for logging in
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  //Checks if email exists in user database
  if (!findUser(email, users)) {
    res.status(403).send('User cannot be found');
  }

  if (findUser(email, users)) {
    const passwordCheck = users[findUser(email, users)].password;
    if (bcrypt.compareSync(password, passwordCheck)) { //Checks that the password given matches database
      req.session.user_id = findUser(email, users);
      res.redirect('/urls');
    } else {
      res.status(403).send('Incorrect Password');
    }
  }
});

//POST function for registering a new account
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);

  //Checks if input fields are empty
  if (!email || !password) {
    res.status(400).send('Missing email or password');
  }

  //Checks if email exists in database already
  if (findUser(email, users) !== undefined) {
    res.status(400).send('Email is already in use');
  }

  
  //Creates new account with inputted information and adds it to user database
  let newid = generateRandomString();
  users[newid] = Object.create(exampleUser);
  Object.assign(users[newid], {id: newid, email: email, password: hashedPassword});
  req.session.user_id = newid;
  res.redirect('urls');
});

//POST function for logging out by clearing cookies
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

//Redirects user to login page if not logged in, otherwise login page redirects back to /urls
app.get("/", (req, res) => {
  res.redirect("/login");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

//Main page for displaying URLs database that user has access to
app.get("/urls", (req, res) => {
  if (!users[req.session.user_id]) {  //Sends back HTML response if user is not logged in
    res.send('Please login first to see URLs');
  }
  const templateVars = { user_id: users[req.session.user_id], urls: urlsForUser(req.session.user_id, urlDatabase) };
  res.render("urls_index", templateVars);
});

//Account registration page 
app.get("/register", (req, res) => {
  if (users[req.session.user_id]) { //If user is already logged in, automatically redirects to /urls
    res.redirect("/urls");
  }
  const templateVars = { user_id: users[req.session.user_id], urls: urlDatabase };
  res.render("register", templateVars);
});

//Login page
app.get("/login", (req, res) => {
  if (users[req.session.user_id]) { //If user is logged in, automatically redirects to urls
    res.redirect("/urls");
  }
  const templateVars = { user_id: users[req.session.user_id], urls: urlDatabase };
  res.render("login", templateVars);
});

//Page for creating new URLs
app.get("/urls/new", (req, res) => {
  if (!users[req.session.user_id]) { //Users who are not logged in will instead be redirected to login
    res.redirect("/login");
  }
  const templateVars = { id: req.params.id, user_id: users[req.session.user_id] };
  res.render("urls_new", templateVars);
});

//Page for viewing the edit existing URL page
app.get("/urls/:id", (req, res) => {
  if (!users[req.session.user_id]) { //Users who are not logged in will receive HTML message
    res.send('Please login first to see URLs');
  }
  if (req.session.user_id !== urlDatabase[req.params.id].userID) { //Logged in users will not be able to view edit page for URLs that they do not own
    res.send('Cannot view edit url page because you do not own the url');
  }
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id].longURL, user_id: users[req.session.user_id] };
  res.render("urls_show", templateVars);
});

//Redirects the short URL to the long URL
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id].longURL;
  if (!urlDatabase[req.params.id]) {
    res.send('This shortened url does not exist.');
  }
  if (longURL.slice(0,7) !== 'http://') {
    res.redirect('http://' + longURL);
  }
  res.redirect(longURL);
});


