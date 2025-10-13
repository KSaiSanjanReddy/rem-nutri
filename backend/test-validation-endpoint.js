const express = require('express');
const { body, validationResult } = require('express-validator');

const app = express();
app.use(express.json());

// Test validation rules
const testValidation = [
  body('full_name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Full name must be between 2 and 50 characters'),
  body('date_of_birth')
    .isISO8601()
    .withMessage('Please provide a valid date of birth')
];

app.post('/test-validation', testValidation, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  
  res.json({
    status: 'success',
    message: 'Validation passed',
    data: req.body
  });
});

app.listen(3001, () => {
  console.log('Test validation server running on port 3001');
  console.log('Test with: curl -X POST http://localhost:3001/test-validation -H "Content-Type: application/json" -d \'{"full_name":"Test","date_of_birth":"1990-01-01"}\'');
});
