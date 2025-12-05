const Joi = require('joi');

const updateProfile = Joi.object({
  body: Joi.object({
    full_name: Joi.string().min(2).max(150).optional(),
    phone_number: Joi.string()
      .pattern(/^[0-9+\-().\s]{6,30}$/)
      .message('phone_number must be a valid phone number')
      .optional(),
  }).min(1),
  query: Joi.object().empty({}),
  params: Joi.object().empty({}),
});

const listUsers = Joi.object({
  body: Joi.object().empty({}),
  params: Joi.object().empty({}),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    role: Joi.string().valid('student', 'faculty', 'admin').optional(),
    departmentId: Joi.number().integer().optional(),
    search: Joi.string().max(255).optional(),
  }),
});

module.exports = {
  updateProfile,
  listUsers,
};
