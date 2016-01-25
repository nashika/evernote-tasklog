import * as express from 'express';

import www from '../lib/www';

var router = express.Router();

router.get('/', (req, res, next) => {
    www.sync(req.session['evernote'].user.username, (err) => {
        if (err) return res.status(500).send(err);
        res.json('OK');
    });
});

export default router;
