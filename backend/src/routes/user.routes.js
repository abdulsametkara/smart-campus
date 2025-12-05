const express = require('express');
const {
  getMe,
  updateMe,
  uploadProfilePicture,
  listUsers,
} = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { updateProfile, listUsers: listUsersSchema } = require('../validators/user.schema');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/me', authenticate, getMe);
router.put('/me', authenticate, validate(updateProfile), updateMe);

const uploadProfilePictureMiddleware = (req, res, next) => {
  const handler = upload.single('profilePicture');
  handler(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    return next();
  });
};

router.post('/me/profile-picture', authenticate, uploadProfilePictureMiddleware, uploadProfilePicture);

router.get('/', authenticate, authorize('admin'), validate(listUsersSchema), listUsers);

module.exports = router;
