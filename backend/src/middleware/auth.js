const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET);
    req.user = {
      id: payload.sub,
      role: payload.role,
    };
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  // Debug logging
  console.log('[Authorize Middleware]', {
    user: req.user ? { id: req.user.id, role: req.user.role } : 'No user',
    requiredRoles: roles,
    hasAccess: req.user && roles.includes(req.user.role)
  });

  if (!req.user) {
    return res.status(403).json({ message: 'Forbidden: No user found' });
  }

  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ 
      message: 'Forbidden', 
      details: `Required roles: ${roles.join(', ')}, Your role: ${req.user.role}` 
    });
  }

  return next();
};

module.exports = {
  authenticate,
  authorize,
};
