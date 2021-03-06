const async = require('async');
const crypto = require('crypto');
const Handlebars = require('handlebars');

const db = require('../db');
const optionsManager = require('../../../options');
const mailer = require('../../../mailer');

module.exports = (req, res, next) => {
  const options = optionsManager.get();
  async.waterfall([
    (done) => {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    (token, done) => {
      db.collection(options.usersTable).find({ email: req.body.email }).toArray((err, docs) => {
        let user = docs[0];
        if (!user) {
          //req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000;

        db.collection(options.usersTable).update({
          email: req.body.email
        }, user, (err, user) => {
          done(err, token, user);
        });
      });
    },
    (token, user, done) => {
      const mailBodyTemplate = Handlebars.compile(options.mails.passwordReset.body);

      var mailOptions = {
        to: req.body.email,
        from: options.mails.passwordReset.sender,
        subject: options.mails.passwordReset.subject,
        text: mailBodyTemplate({
          ...options,
          token,
        }),
      };

      mailer.send(mailOptions, function(err) {
        console.log('mail sent');
      });

      res.send({ success: true });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
};
