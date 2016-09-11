import express = require("express");
import evernote = require("evernote");

var router = express.Router();

// GET home page.
router.get('/', (req, res) => {
  res.render("index");
});

export default router;
