// 패스워드 암호화 메서드
const bcrypt = require("bcrypt");
const saltRounds = 10;

const encryption = function (body_pw) {
  return bcrypt.hashSync(body_pw, saltRounds).toString();
};

module.exports = {
  encryption: encryption,
};