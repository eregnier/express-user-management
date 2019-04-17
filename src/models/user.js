const crypto = require('crypto');
const jwt = require('jsonwebtoken');

class UsersSchema {
  //email: '',
  //hash: '',
  //salt: '',
  constructor(data) {
    const dataKeys = Object.keys(data);
    for (let i = 0; i < dataKeys.length; i++) {
      this[dataKeys[i]] = data[dataKeys[i]];
    }
  }

  setPassword(password) {
    this.salt = crypto.randomBytes(16).toString('hex');
    this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
  }

  validatePassword(password) {
    const hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
    return this.hash === hash;
  }

  generateJWT() {
    const today = new Date();
    const expirationDate = new Date(today);
    expirationDate.setDate(today.getDate() + 60);

    return jwt.sign({
      email: this.email,
      username: this.username,
      id: this._id,
      exp: parseInt(expirationDate.getTime() / 1000, 10),
    }, 'secret');
  }

  toAuthJSON() {
    return {
      _id: this._id,
      email: this.email,
      username: this.username,
      plan: this.plan,
      token: this.generateJWT(),
    };
  }
}

module.exports = UsersSchema;