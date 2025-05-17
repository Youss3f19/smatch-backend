const Product = require('../models/Product');

// Create a new product
exports.createProduct = async (req, res) => {
  try {
    const productData = { ...req.body };

    // Handle photo upload
    if (req.file) {
      productData.photo = req.file.path; // e.g., Uploads/1717498895.jpg
    }

    const product = new Product(productData);
    const saved = await product.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ message: 'Error creating product', error: err.message });
  }
};

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate('category', 'name'); // Populate category if it’s an ObjectId reference

    // Transform photo paths to full URLs
    const productsWithUrls = products.map(product => {
      const productObj = product.toObject();
      if (productObj.photo) {
        // Ensure the path starts with /uploads and includes the full filename
        const photoPath = productObj.photo.startsWith('/Uploads') 
          ? productObj.photo.replace('/Uploads', '/uploads') 
          : `/uploads/${productObj.photo.split('/').pop()}`; // Extract filename
        productObj.photo = `${req.protocol}://${req.get('host')}${photoPath}`;
      }
      return productObj;
    });

    res.status(200).json(productsWithUrls);
  } catch (err) {
    console.error('Error retrieving products:', err);
    res.status(500).json({ message: 'Error retrieving products', error: err.message });
  }
};

// Get a product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name'); 
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.status(200).json(product);
  } catch (err) {
    console.error('Error retrieving product:', err);
    res.status(500).json({ message: 'Error retrieving product', error: err.message });
  }
};

// Update a product
exports.updateProduct = async (req, res) => {
  try {
    const updateData = { ...req.body };

    // Handle photo upload
    if (req.file) {
      updateData.photo = req.file.path; 
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('category', 'name'); 
    if (!updated) return res.status(404).json({ message: 'Product not found' });
    res.status(200).json(updated);
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ message: 'Error updating product', error: err.message });
  }
};

// Delete a product
exports.deleteProduct = async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Product not found' });
    res.status(200).json({ message: 'Deleted' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ message: 'Error deleting product', error: err.message });
  }
};

// Get products by category
exports.getProductsByCategory = async (req, res) => {
  try {
    const products = await Product.find({ category: req.params.categoryId })
      .populate('category', 'name');
    res.status(200).json(products);
  } catch (err) {
    console.error('Error retrieving products by category:', err);
    res.status(500).json({ message: 'Error retrieving products by category', error: err.message });
  }
};