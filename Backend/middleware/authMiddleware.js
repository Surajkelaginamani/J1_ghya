const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // 1. Get the token from the request header
  // (The frontend will send it as "Bearer <token>")
  let token = req.header('Authorization');

  // 2. Check if no token was sent
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied. Please log in.' });
  }

  try {
    // 3. Remove the word "Bearer " if it exists, leaving just the token string
    if (token.startsWith('Bearer ')) {
      token = token.slice(7, token.length).trimLeft();
    }

    // 4. Verify the token using your secret key from the .env file
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 5. Attach the decoded user data (like userId and role) to the request
    req.user = decoded;
    
    // 6. Move on to the actual route handler!
    next(); 
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid or has expired.' });
  }
};