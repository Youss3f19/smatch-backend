const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  orderDate: { type: Date, default: Date.now },
  total: Number
});

module.exports = mongoose.model('Order', orderSchema);
