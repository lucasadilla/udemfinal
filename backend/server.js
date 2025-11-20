const mongoose = require('mongoose');

const comiteUserSchema = new mongoose.Schema({
  name: String,
  email: String,
  // ...add other fields as needed...
});

module.exports = mongoose.model('ComiteUser', comiteUserSchema);

