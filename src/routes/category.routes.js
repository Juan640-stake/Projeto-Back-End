const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  search,
  getById,
  create,
  update,
  remove,
} = require('../controllers/category.controller');

router.get('/search', search);
router.get('/:id', getById);
router.post('/', auth, create);
router.put('/:id', auth, update);
router.delete('/:id', auth, remove);

module.exports = router;