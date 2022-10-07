//Checks if user exists in database based on email input
function findUser(email, database) {
  let user = null; 
  for (const userId in database) {
    const userDbEmail = database[userId].email;
    if (userDbEmail === email ) {
      user = userId;
    }
  }

  return user;
}

function generateRandomString() {
  let result = '';
  const length = 6;
  for ( let i = 0; i < length; i++ ) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return result;
}

function urlsForUser(id) {
  let matchingUrls = {};
  for (const userurl in urlDatabase) {
    const userid = urlDatabase[userurl].userID;
    if (userid === id) {
      matchingUrls[userurl] = urlDatabase[userurl];
    }
  }

  return matchingUrls;
}

module.exports = {findUser, generateRandomString, urlsForUser};