const express = require("express");
const app = express();
var cookieParser = require('cookie-parser');
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(cookieParser());

const characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const exampleUser = {
  id: "random",
  email: "random@example.com",
  password: "randompasswordexample",
}

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

function generateRandomString() {
  let result = '';
  const length = 6;
  for ( let i = 0; i < length; i++ ) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return result;
}

app.use(express.urlencoded({ extended: true }));

app.post("/urls", (req, res) => {
  console.log(req.body); // Log the POST request body to the console
  const newid = generateRandomString();
  urlDatabase[newid] = req.body['longURL'];
  res.redirect(`/urls/${newid}`);
});

app.post("/urls/:id", (req, res) => {
  console.log(req.body); // Log the POST request body to the console
  urlDatabase[req.params.id] = req.body['longURL'];
  res.redirect(`/urls`);
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
})

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (!findUser(email)) {
    res.status(403).send('User cannot be found');
  }
  if (findUser(email)) {
    const passwordCheck = users[findUser(email)].password;
    console.log(findUser(email));
    if (passwordCheck === password) {
      res.cookie('user_id', findUser(email));
      res.redirect('/urls');
    } else {
      res.status(403).send('Incorrect Password');
    }
  }
})

//Checks if user exists in database based on email input
const findUser = function (email) {
  let user = null; 
  for (const userId in users) {
    const userDbEmail = users[userId].email;
    if (userDbEmail === email ) {
      user = userId;
    }
  }

  return user;
}

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  //Checks if input fields are empty
  if (!email || !password) {
    res.status(400).send('Missing email or password');
  }

  //Checks if email exists in database already
  if (findUser(email) !== null) {
    console.log('reached');
    res.status(400).send('Email is already in use');
  }

  

  let newid = generateRandomString();
  users[newid] = Object.create(exampleUser);
  Object.assign(users[newid], {id: newid, email: email, password: password});
  res.cookie("user_id", newid);
  res.redirect('urls');
})

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect('/urls');
})

app.post("/urls/:id", (req, res) => {
  console.log(req.body); // Log the POST request body to the console
  urlDatabase[req.params.id] = req.body['longURL'];
  res.redirect("/urls/:id");
});

app.get("/", (req, res) => {
  res.send("Hello!");
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

app.get("/urls", (req, res) => {
  const templateVars = { user_id: users[req.cookies["user_id"]], urls: urlDatabase };
  res.render("urls_index", templateVars);
})

app.get("/register", (req, res) => {
  const templateVars = { user_id: users[req.cookies["user_id"]], urls: urlDatabase };
  res.render("register", templateVars);
})

app.get("/login", (req, res) => {
  const templateVars = { user_id: users[req.cookies["user_id"]], urls: urlDatabase };
  res.render("login", templateVars);
})

app.get("/urls/new", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id], user_id: users[req.cookies["user_id"]] };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id], user_id: users[req.cookies["user_id"]] };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  if (!longURL.includes('http://')) {
    res.redirect('http://' + longURL);
  }
  res.redirect(longURL);
});


