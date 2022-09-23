const express           = require('express');
const router            = express.Router();
const bookController    = require('../controller/bookController');

// router.route('/').get(async (req, res)=>await bookController.getBookNew(req, res));
router.route('/').get(bookController.getBook);
router.route('/').post(bookController.setBook);
router.route('/delete/:book').get(bookController.deleteBook);
router.route('/:book').get(bookController.getBookDetail);

module.exports = router;