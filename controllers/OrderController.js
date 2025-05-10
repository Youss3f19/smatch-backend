const Order = require('../models/Order');

exports.createOrder = async (req, res) => {
  try {
    const order = new Order(req.body);
    const saved = await order.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: 'Error creating order', error: err });
  }
};

exports.getOrdersByUser = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.params.userId }).populate('products');
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching orders', error: err });
  }
};
exports.getAllOrders = async (req, res) => {
    try {
      const orders = await Order.find().populate('user products');
      res.json(orders);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
  exports.getOrderById = async (req, res) => {
    try {
      const order = await Order.findById(req.params.id).populate('user products');
      if (!order) return res.status(404).json({ message: "Not found" });
      res.json(order);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
  exports.updateOrder = async (req, res) => {
    try {
      const updated = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
  exports.deleteOrder = async (req, res) => {
    try {
      await Order.findByIdAndDelete(req.params.id);
      res.json({ message: 'Deleted' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
