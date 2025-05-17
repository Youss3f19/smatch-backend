const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/ProductController');
const { upload } = require("../middleware/multerMiddleware");
const auth = require('../middleware/auth'); 

router.post('/', auth, upload.single('file'), ProductController.createProduct);
router.get('/', ProductController.getAllProducts);
router.get('/:id', ProductController.getProductById);
router.put('/:id', auth, upload.single('file'), ProductController.updateProduct);
router.delete('/:id', auth, ProductController.deleteProduct);
router.get('/category/:categoryId', ProductController.getProductsByCategory);

module.exports = router;