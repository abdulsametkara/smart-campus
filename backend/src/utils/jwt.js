const jwt = require('jsonwebtoken');

const signAccessToken = (payload) => {
  const secret = process.env.JWT_ACCESS_TOKEN_SECRET;
  const expiresIn = '15m';
  return jwt.sign(payload, secret, { expiresIn });
};

const signRefreshToken = (payload) => {
  const secret = process.env.JWT_REFRESH_TOKEN_SECRET;
  const expiresIn = '7d';
  return jwt.sign(payload, secret, { expiresIn });
};

const verifyToken = (token, type = 'access') => {
  const secret =
    type === 'refresh'
      ? process.env.JWT_REFRESH_TOKEN_SECRET
      : process.env.JWT_ACCESS_TOKEN_SECRET;
  return jwt.verify(token, secret);
};

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyToken,
};
