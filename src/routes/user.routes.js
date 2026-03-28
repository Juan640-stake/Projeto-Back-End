const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getById,
  create,
  update,
  remove,
  generateToken,
} = require('../controllers/user.controller');

router.post('/token', generateToken);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', auth, update);
router.delete('/:id', auth, remove);

module.exports = router;