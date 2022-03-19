// 댓글 최초 작성
const comment_model = require("../model/comment");
const check_authority_model = require("../model/check_authority");
const writeComment = async function (req, res) {
  /*
  params: boardIndex
  req.body
    content: 댓글내용
   */
  // 로그인 여부 검사
  const login_cookie = req.signedCookies.user;
  if (!login_cookie) return res.status(401).json({ state: "해당 서비스 이용을 위해서는 로그인을 해야합니다." });
  // 댓글 작성 모델 실행 결과
  const model_results = await comment_model.writeCommentModel(req.params.boardIndex, login_cookie, req.body, req.ip);
  // mysql query 메서드 실패
  if (model_results.state === "mysql 사용실패") return res.status(500).json(model_results);
  // 게시글이 존재하지 않을 때
  else if (model_results.state === "존재하지않는게시글") return res.status(404).json(model_results);
  // 성공적으로 댓글 작성 요청 수행
  else if (model_results.state === "댓글작성") return res.status(201).end();
};
// 수정시 기존 댓글 정보 불러오기
const getComment = async function (req, res) {
  // 로그인 여부 검사
  const login_cookie = req.signedCookies.user;
  if (!login_cookie) return res.status(401).json({ state: "해당 서비스 이용을 위해서는 로그인을 해야합니다." });
  // 해당 댓글에 대한 유저의 권한 체크
  const check_authority = await check_authority_model.isCommentAuthorModel(
    req.params.boardIndex,
    req.query.commentIndex,
    login_cookie,
    req.ip,
  );
  // mysql query 메서드 실패
  if (check_authority.state === "mysql 사용실패") return res.status(500).json(check_authority);
  // 해당 boardIndex와 일치하는 로우가 없을 때
  else if (check_authority.state === "존재하지않는댓글") return res.status(404).json(check_authority);
  // 로그인돼있는 유저와 해당 게시물 작성 유저가 일치하지 않을 때
  else if (check_authority.state === "접근권한없음") return res.status(403).json(check_authority);
  // 해당 게시물 작성한 유저와 로그인한 유저가 일치할 때
  else if (check_authority.state === "접근성공") {
    // 해당 인덱스의 댓글 정보 가져오기
    const model_results = await comment_model.getCommentModel(req.query.commentIndex, login_cookie, req.ip);
    // mysql query 메서드 실패
    if (model_results.state === "mysql 사용실패") return res.status(500).json(model_results);
    // 해당 commentIndex와 일치하는 로우가 없을 때
    else if (model_results.state === "존재하지않는댓글") return res.status(404).json(model_results);
    // 성공적으로 댓글 정보 가져왔을 때
    else if (model_results.state === "댓글정보로딩") return res.status(200).json(model_results.data);
  }
};
// 댓글 수정 요청
const reviseComment = async function (req, res) {
  // req.body - content (댓글내용)
  // 로그인 여부 검사
  const login_cookie = req.signedCookies.user;
  if (!login_cookie) return res.status(401).json({ state: "해당 서비스 이용을 위해서는 로그인을 해야합니다." });
  // 해당 댓글에 대한 유저의 권한 체크
  const check_authority = await check_authority_model.isCommentAuthorModel(
    req.params.boardIndex,
    req.query.commentIndex,
    login_cookie,
    req.ip,
  );
  // mysql query 메서드 실패
  if (check_authority.state === "mysql 사용실패") return res.status(500).json(check_authority);
  // 해당 게시글이 없을 때
  else if (check_authority.state === "존재하지않는게시글") return res.status(404).json(check_authority);
  // 해당 commentIndex와 일치하는 로우가 없을 때
  else if (check_authority.state === "존재하지않는댓글") return res.status(404).json(check_authority);
  // 로그인돼있는 유저와 해당 게시물 작성 유저가 일치하지 않을 때
  else if (check_authority.state === "접근권한없음") return res.status(403).json(check_authority);
  // 해당 게시물 작성한 유저와 로그인한 유저가 일치할 때
  else if (check_authority.state === "접근성공") {
    // 댓글수정 모델 실행 결과
    const model_results = await comment_model.reviseCommentModel(req.query.commentIndex, login_cookie, req.body, req.ip);
    // mysql query 메서드 실패
    if (model_results.state === "mysql 사용실패") return res.status(500).json(model_results);
    // 성공적으로 댓글삭제 요청 수행
    else if (model_results.state === "댓글수정") return res.status(200).end();
  }
};
// 댓글 삭제
const deleteComment = async function (req, res) {
  // params: boardIndex
  // 로그인 여부 검사
  const login_cookie = req.signedCookies.user;
  if (!login_cookie) return res.status(401).json({ state: "해당 서비스 이용을 위해서는 로그인을 해야합니다." });
  // 해당 commentIndex에 대한 유저의 권한 체크
  const check_authority = await check_authority_model.isCommentAuthorModel(
    req.params.boardIndex,
    req.query.commentIndex,
    login_cookie,
    req.ip,
  );
  // mysql query 메서드 실패
  if (check_authority.state === "mysql 사용실패") return res.status(500).json(check_authority);
  // 해당 commentIndex와 일치하는 로우가 없을 때
  else if (check_authority.state === "존재하지않는댓글") return res.status(404).json(check_authority);
  // 로그인돼있는 유저와 해당 게시물 작성 유저가 일치하지 않을 때
  else if (check_authority.state === "접근권한없음") return res.status(403).json(check_authority);
  // 해당 게시물 작성한 유저와 로그인한 유저가 일치할 때
  else if (check_authority.state === "접근성공") {
    // 댓글삭제 모델 실행 결과
    const model_results = await comment_model.deleteCommentModel(req.query.commentIndex, login_cookie, req.ip);
    // mysql query 메서드 실패
    if (model_results.state === "mysql 사용실패") return res.status(500).json(model_results);
    // 성공적으로 댓글삭제 요청 수행
    else if (model_results.state === "댓글삭제") return res.status(204).end();
  }
};

module.exports = {
  writeComment: writeComment,
  getComment: getComment,
  reviseComment: reviseComment,
  deleteComment: deleteComment,
};
