const Joi = require('joi');

const email = Joi.string().email().max(255).required();
const password = Joi.string()
  .min(8)
  .max(128)
  .pattern(/[A-Z]/, 'uppercase')
  .pattern(/[0-9]/, 'digit')
  .required()
  .messages({
    'string.pattern.name': 'Password must contain at least one {#name}',
  });

const register = Joi.object({
  body: Joi.object({
    email,
    password,
    role: Joi.string().valid('student', 'faculty', 'admin').optional(),
    full_name: Joi.string().max(150).optional(),
    phone_number: Joi.string().max(30).optional(),
    // Rol bazlı diğer alanlar
    department_id: Joi.number().integer().optional(),
    student_number: Joi.string().optional(),
    employee_number: Joi.string().optional(),
  }),
  query: Joi.object().empty({}),
  params: Joi.object().empty({}),
});

const login = Joi.object({
  body: Joi.object({
    email,
    password,
  }),
  query: Joi.object().empty({}),
  params: Joi.object().empty({}),
});

const refresh = Joi.object({
  body: Joi.object({
    refreshToken: Joi.string().required(),
  }),
  query: Joi.object().empty({}),
  params: Joi.object().empty({}),
});

const logout = refresh;

const verifyEmail = Joi.object({
  body: Joi.object({
    token: Joi.string().required(),
  }),
  query: Joi.object().empty({}),
  params: Joi.object().empty({}),
});

const forgotPassword = Joi.object({
  body: Joi.object({
    email,
  }),
  query: Joi.object().empty({}),
  params: Joi.object().empty({}),
});

const resetPassword = Joi.object({
  body: Joi.object({
    token: Joi.string().required(),
    password,
  }),
  query: Joi.object().empty({}),
  params: Joi.object().empty({}),
});

module.exports = {
  register,
  login,
  refresh,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
};
