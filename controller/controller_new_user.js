// 회원가입 화면의 라우터의 컨트롤러
// 예시 유저 정보(기존에 존재하는 유저 데이터)
const db = require("../a_mymodule/db");
const moment = require("../a_mymodule/date_time");
const crypto = require("crypto");
// mysql 모듈
const mysql = require("mysql");
const { compare } = require("bcrypt");
const bcrypt = require("bcrypt");
const { encryption } = require("../a_mymodule/crypto");
// TODO 프론트 때 할 듯?
// 회원가입 약관확인
const signUpGuide = function (req, res) {
  // 약관동의 체크박스(예시 body)
  const example_body = {
    checkBox1: false,
    checkBox2: false,
    checkBox3: false,
  };

  const is_agreed = req.body;
  // 약관확인에서 세 개의 체크박스에 모두 체크를 했을 때
  if (is_agreed.checkBox1 && is_agreed.checkBox2 && is_agreed.checkBox3) return res.status(200).end();
  // 체크박스에 체크하지 않았을 때
  res.status(400).json({ state: "안내사항을 읽고 동의해주세요." });
};

// 회원가입 요청
const signUp = function (req, res) {
  // 기존에 아이디가 있나 확인할 쿼리문
  const query = "SELECT id,nickName FROM USER WHERE id = " + mysql.escape(req.body.id) + "OR nickName = " + mysql.escape(req.body.nickName);
  // 쿼리문 실행
  db.db_connect.query(query, [req.body.id], function (err, results) {
    if (err) {
      console.log(("signUp 메서드 mysql 모듈사용 실패:" + err).red.bold);
      return res.status(500).json({ state: "signUp 메서드 mysql 모듈사용 실패:" + err });
    }
    console.log(("CLIENT IP: " + req.ip + "\nDATETIME: " + moment().format("YYYY-MM-DD HH:mm:ss") + "\nQUERY: " + query).blue.bold);
    if (results[0] !== undefined) {
      // 1. 기존에 존재하는 아이디가 있을 때
      if (results[0].id === req.body.id || results[1].id === req.body.id)
        return res.status(400).json({ state: "기존에 존재하는 아이디입니다." });
      // 2. 기존에 존재하는 닉네임이 있을 때
      if (results[0].nickName === req.body.nickName || results[1].nickName === req.body.nickName)
        return res.status(400).json({ state: "기존에 존재하는 닉네임입니다." });
    }
    // 3. 비밀번호 유효성 검사
    // 입력한 비밀번호와 비밀번호 확인이 다를 때 ( 둘다 해싱된 값)
    const hashed_pw = encryption(req.body.pw);
    const hashed_confirm_pw = encryption(req.body.confirmPw);
    if (!bcrypt.compare(hashed_pw, hashed_confirm_pw));
    return res.status(400).json({ state: "'비밀번호'와 '비밀번호 확인'이 일치하지 않습니다." });

    // 모든 유효성 검사 통과
    const new_query =
      "INSERT INTO USER(id,pw,name,gender,phoneNumber,nickName) VALUES (" +
      mysql.escape(req.body.id) +
      "," +
      mysql.escape(hashed_pw) + // 라우터에서 해싱된 pw값 insert
      "," +
      mysql.escape(req.body.name) +
      "," +
      mysql.escape(req.body.gender) +
      "," +
      mysql.escape(req.body.phoneNumber) +
      "," +
      mysql.escape(req.body.nickName) +
      ")";

    // 쿼리문 실행
    db.db_connect.query(new_query, function (err) {
      if (err) {
        console.log(("signUp 메서드 mysql 모듈사용 실패:" + err).red.bold);
        return res.status(500).json({ state: "signUp 메서드 mysql 모듈사용 실패:" + err });
      }
      console.log(("CLIENT IP: " + req.ip + "\nDATETIME: " + moment().format("YYYY-MM-DD HH:mm:ss") + "\nQUERY: " + query).blue.bold);
      return res.status(201).end();
    });
  });
};

module.exports = {
  signUpGuide: signUpGuide,
  signUp: signUp,
};
