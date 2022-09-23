const express = require('express');
const router = express.Router();
const authorController = require('../controller/authorController');

router.route('/').get(authorController.getAuthor);
router.route('/').post(authorController.setAuthor);
router.route('/:author').get(authorController.getAuthorBook);
router.route('/').get(authorController.updateAuthor);


module.exports = router;