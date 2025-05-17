const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/ProductController');
const { upload } = require("../middleware/multerMiddleware");

router.post('/',upload.single('file'), ProductController.createProduct);
router.get('/', ProductController.getAllProducts);
router.get('/:id', ProductController.getProductById);
router.put('/:id',upload.single('file'),ProductController.updateProduct);
router.delete('/:id', ProductController.deleteProduct);
router.get('/category/:categoryId', ProductController.getProductsByCategory);

module.exports = router;
