const createValidator = (schema) => {
  return (req, res, next) => {
    const data = {
      body: req.body,
      query: req.query,
      params: req.params,
    };

    const { error, value } = schema.validate(data, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({
        message: 'Validation error',
        details: error.details.map((d) => d.message),
      });
    }

    // overwrite with sanitized values
    req.body = value.body || {};
    req.query = value.query || {};
    req.params = value.params || {};

    return next();
  };
};

module.exports = createValidator;
