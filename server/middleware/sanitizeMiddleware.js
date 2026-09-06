const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== "object") return obj;

  for (const key of Object.keys(obj)) {
    if (key.startsWith("$") || key.includes(".")) {
      delete obj[key];
      continue;
    }

    if (typeof obj[key] === "object") {
      sanitizeObject(obj[key]);
    }
  }

  return obj;
};

const sanitizeInput = (req, res, next) => {
  sanitizeObject(req.body);
  sanitizeObject(req.params);

  next();
};

module.exports = sanitizeInput;