// 게시판 모델
// 필요모듈
const mysql = require("mysql2/promise");
const db = require("../my_module/db");
const moment = require("../my_module/date_time");
const { queryFail, querySuccessLog } = require("../my_module/query_log");
/*
1. 게시글 조회
2. 게시글 작성/수정/삭제
3. 좋아요/검색 기능
 */
// 1. 게시글 조회
// 1-1. 최신글 정보 가져오기
async function getRecentPostModel(ip) {
  // 최신글 자유게시판 글 5개/공부인증샷 글 4개 불러오기
  const query =
    "SELECT postTitle,nickName,viewCount,favoriteCount FROM BOARD LEFT JOIN USER ON BOARD.userIndex=USER.userIndex WHERE BOARD.deleteDateTime IS NULL AND BOARD.boardIndex IS NOT NULL AND category = ? order by boardIndex DESC limit 5;" +
    "SELECT postTitle,nickName,viewCount,favoriteCount FROM BOARD LEFT JOIN USER ON BOARD.userIndex=USER.userIndex WHERE BOARD.deleteDateTime IS NULL AND BOARD.boardIndex IS NOT NULL AND category = ? order by boardIndex DESC limit 4;";
  // 성공시
  try {
    const [results, fields] = await db.pool.query(query, ["자유게시판", "공부인증샷"]);
    // 성공 로그찍기
    await querySuccessLog(ip, query);
    return { state: "최신글정보", data: results };
    // 쿼리문 실행시 에러발생
  } catch (err) {
    await queryFail(err, ip, query);
    return { state: "mysql 사용실패" };
  }
}
// 1-2. 전체 게시글 정보 (글제목, 글쓴이(닉네임), 조회수, 좋아요 수, 작성날짜)
async function entireBoardModel(category, page, ip) {
  // 카테고리에 맞는 전체 게시글 정보 가져오기
  const query =
    "SELECT boardIndex,postTitle,viewCount,favoriteCount,nickName,createDateTime FROM BOARD LEFT JOIN USER ON BOARD.userIndex = User.userIndex WHERE BOARD.deleteDateTime IS NULL AND BOARD.category =" +
    mysql.escape(category) +
    "ORDER BY boardIndex DESC LIMIT " +
    10 * (page - 1) +
    ", 10";
  // 성공시
  try {
    const [results, fields] = await db.pool.query(query);
    if (results[0] === undefined) {
      return { state: "존재하지않는정보" };
    }
    // 성공 로그찍기
    await querySuccessLog(ip, query);
    // 가져온 게시글 정보 return
    return { state: "전체게시글", data: results };
    // 쿼리문 실행시 에러발생
  } catch (err) {
    await queryFail(err, ip, query);
    return { state: "mysql 사용실패" };
  }
}

// 1-3. 특정 게시글 상세보기
async function detailBoardModel(category, board_index, page, ip, user_index) {
  // 해당 인덱스의 게시글/태그 정보 가져오는 쿼리문
  let query =
    "SELECT boardIndex,postTitle,postContent,viewCount,favoriteCount,BOARD.createDateTime,USER.nickName FROM BOARD LEFT JOIN USER ON BOARD.userIndex = USER.userIndex WHERE BOARD.deleteDateTime IS NULL AND BOARD.category=" +
    mysql.escape(category) +
    "AND boardIndex =" +
    mysql.escape(board_index);
  // 성공시
  try {
    // 게시글 정보가져오는 쿼리 메서드
    let [results, fields] = await db.pool.query(query);
    // 성공 로그찍기
    await querySuccessLog(ip, query);
    // 요청한 게시글 인덱스의 게시물이 존재하지 않을 때
    if (results[0] === undefined) {
      return { state: "존재하지않는게시글" };
    }
    query =
      "SELECT boardIndex,postTitle,postContent,viewCount,favoriteCount,BOARD.createDateTime,USER.nickName FROM BOARD LEFT JOIN USER ON BOARD.userIndex = USER.userIndex WHERE BOARD.deleteDateTime IS NULL AND BOARD.category=" +
      mysql.escape(category) +
      "AND boardIndex =" +
      mysql.escape(board_index) +
      ";" +
      "SELECT tag FROM TAG WHERE deleteDateTime IS NULL AND TAG IS NOT NULL AND boardIndex =" +
      mysql.escape(board_index) +
      ";" +
      "SELECT commentContent, createDateTime FROM COMMENT WHERE deleteDateTime IS NULL AND commentIndex IS NOT NULL AND boardIndex =" +
      mysql.escape(board_index) +
      "ORDER BY commentIndex DESC LIMIT " +
      5 * (page - 1) +
      ",5;";

    // 게시글 정보가져오는 쿼리 메서드
    [results, fields] = await db.pool.query(query);
    // 성공 로그찍기
    await querySuccessLog(ip, query);
    // 조회수 중복증가 여부 체크해서 반영해주는 메서드
    await increaseViewCount(board_index, user_index, ip);

    // 성공적으로 게시글 정보 조회
    return { state: "게시글상세보기", data: results };

    // 쿼리문 실행시 에러발생
  } catch (err) {
    await queryFail(err, ip, query);
    return { state: "mysql 사용실패" };
  }
}

// 2. 게시글 작성/수정/삭제
// 2-1. 게시글 최초 작성
async function writePostModel(category, input_write, user_index, ip) {
  let query;
  // 게시글 작성 쿼리문
  query =
    "INSERT INTO BOARD(category,userIndex,postTitle,postContent,createDateTime,viewCount,favoriteCount) VALUES (" +
    mysql.escape(category) +
    "," +
    mysql.escape(user_index) +
    "," +
    mysql.escape(input_write.postTitle) +
    "," +
    mysql.escape(input_write.postContent) +
    "," +
    mysql.escape(moment().format("YYYY-MM-DD HH:mm:ss")) +
    ",0,0);"; // 조회수, 좋아하는 유저수는 처음에 0으로 등록
  // 성공시
  try {
    await db.pool.query("START TRANSACTION");
    const [results, fields] = await db.pool.query(query);
    // 쿼리문 성공로그
    await querySuccessLog(ip, query);
    // 태그 추가 쿼리문
    // 태그 쿼리문 추가, 태그 배열이 비어있으면 해당 반복문은 작동하지 않음
    let tag_query = "";
    for (const temp_tag of input_write.tags) {
      tag_query +=
        "INSERT INTO TAG(boardIndex,tag,updateDateTime) VALUES (" +
        mysql.escape(results.insertId) + // 생성될 게시글의 인덱스
        "," +
        mysql.escape(temp_tag.content) +
        "," +
        mysql.escape(moment().format("YYYY-MM-DD HH:mm:ss")) +
        ");";
    }

    // 태그가 있다면 DB에 태그 정보 추가
    if (tag_query !== "") await db.pool.query(tag_query);
    // 성공 로그찍기, 커밋하기
    await querySuccessLog(ip, tag_query);
    await db.pool.query("COMMIT");
    return { state: "게시글작성완료" };
  } catch (err) {
    // 쿼리문 실행시 에러발생
    await queryFail(err, ip, query);
    await db.pool.query("ROLLBACK");
    return { state: "mysql 사용실패" };
  }
}
// 2-2. 게시글 수정시 기존 게시글 정보 불러오기
async function getWriteModel(board_index, user_index, ip) {
  // 해당 인덱스의 게시글 정보 가져오기 + 해당 게시글인덱스의 태그 가져오기
  const query =
    "SELECT postTitle,postContent,viewCount,favoriteCount,createDateTime FROM BOARD WHERE deleteDateTime IS NULL AND boardIndex = " +
    mysql.escape(board_index) +
    ";" +
    "SELECT tag FROM TAG WHERE deleteDateTime IS NULL AND boardIndex=" +
    mysql.escape(board_index) +
    ";";
  // 성공시
  try {
    const [results, fields] = await db.pool.query(query);
    // 쿼리문 성공로그
    await querySuccessLog(ip, query);
    // 해당 게시글이 없을 때
    if (results[0] === undefined) {
      return { state: "존재하지않는게시글" };
    }
    return { state: "게시글정보로딩", data: results };
  } catch (err) {
    // 쿼리문 실행시 에러발생
    await queryFail(err, ip, query);
    return { state: "mysql 사용실패" };
  }
}
// 2-3. 게시글 수정 요청
async function revisePost(input_write, board_index, user_index, ip) {
  // 게시글 정보 수정 요청 쿼리문
  let query =
    "UPDATE BOARD SET postTitle = " +
    mysql.escape(input_write.postTitle) +
    ",postContent=" +
    mysql.escape(input_write.postContent) +
    "WHERE boardIndex = " +
    mysql.escape(board_index) +
    "AND userIndex=" +
    mysql.escape(user_index) +
    "AND category=" +
    mysql.escape(input_write.category) +
    ";";
  // 기존 태그 삭제
  query += "DELETE FROM TAG WHERE boardIndex = " + mysql.escape(board_index) + ";";
  // 성공시
  try {
    await db.pool.query("START TRANSACTION");
    await db.pool.query(query);
    // 쿼리 성공로그
    await querySuccessLog(ip, query);
    // 태그 추가 쿼리문
    // 태그 쿼리문 추가, 태그 배열이 비어있으면 해당 반복문은 작동하지 않음
    let tag_query = "";
    for (const temp_tag of input_write.tags) {
      tag_query +=
        "INSERT INTO TAG(boardIndex,tag,updateDateTime) VALUES (" +
        mysql.escape(board_index) +
        "," +
        mysql.escape(temp_tag.content) +
        "," +
        mysql.escape(moment().format("YYYY-MM-DD HH:mm:ss")) +
        ");";
    }
    // 태그가 있다면 DB에 태그 정보 추가
    if (tag_query !== "") await db.pool.query(tag_query);
    // 성공 로그찍기, 커밋하기
    await querySuccessLog(ip, tag_query);
    await db.pool.query("COMMIT");
    return { state: "게시글수정" };
  } catch (err) {
    await queryFail(err, ip, query);
    await db.pool.query("ROLLBACK");
    return { state: "mysql 사용실패" };
  }
}

// 2-4. 게시글 삭제 요청
async function deletePostModel(board_index, user_index, ip) {
  // 해당 인덱스 게시글 삭제
  const query =
    // 게시글 삭제 쿼리문
    "UPDATE BOARD SET deleteDateTime = " +
    mysql.escape(moment().format("YYYY-MM-DD HH:mm:ss")) +
    " WHERE boardIndex = " +
    mysql.escape(board_index) +
    "AND userIndex = " +
    mysql.escape(user_index) +
    ";" +
    "UPDATE Tag SET deleteDateTime =" + // 해당 게시글인덱스에 해당하는 태그 삭제 쿼리문
    mysql.escape(moment().format("YYYY-MM-DD HH:mm:ss")) +
    "WHERE boardIndex=" +
    mysql.escape(board_index) +
    ";" +
    "UPDATE FAVORITEPOST SET deleteDateTime = " + // 해당 게시글인덱스에 해당하는 좋아요 누른 유저 정보 삭제 쿼리문
    mysql.escape(moment().format("YYYY-MM-DD HH:mm:ss")) +
    "WHERE boardIndex=" +
    mysql.escape(board_index) +
    ";" +
    "UPDATE COMMENT SET deleteDateTime = " + // 해당 게시글인덱스에 해당하는 댓글 삭제 쿼리문
    mysql.escape(moment().format("YYYY-MM-DD HH:mm:ss")) +
    "WHERE boardIndex=" +
    mysql.escape(board_index) +
    ";" +
    "UPDATE VIEWPOST SET deleteDateTime = " + // 해당 게시글인덱스에 해당하는 조회한 유저 정보 삭제 쿼리문
    mysql.escape(moment().format("YYYY-MM-DD HH:mm:ss")) +
    "WHERE boardIndex=" +
    mysql.escape(board_index) +
    ";";
  // 성공시
  try {
    await db.pool.query(query);
    // 성공 로그찍기
    await querySuccessLog(ip, query);
    return { state: "게시글삭제" };
    // 쿼리문 실행시 에러발생
  } catch (err) {
    queryFail(err, ip, query);
    return { state: "mysql 사용실패" };
  }
}

// 3. 좋아요 요청/검색기능
// 3-1. 게시글 좋아요 요청
async function likePostModel(board_index, user_index, ip) {
  // 좋아요한 유저 테이블에 해당게시글에 좋아요 누른 유저인덱스 추가하는 쿼리문
  let query =
    "SELECT userIndex FROM FAVORITEPOST WHERE boardIndex=" + mysql.escape(board_index) + "AND userIndex = " + mysql.escape(user_index);
  // 성공시
  try {
    await db.pool.query("START TRANSACTION");
    const [results, fields] = await db.pool.query(query);
    // 성공 로그찍기
    await querySuccessLog(ip, query);
    // 좋아요를 이미 누른 경우
    if (results[0] !== undefined) {
      await db.pool.query("ROLLBACK");
      return { state: "좋아요 중복요청" };
    }

    // 해당 게시글에 좋아요를 한번도 누르지 않은 유저의 경우 좋아요 1 증가, 좋아요 누른 사람 목록에 해당 유저 추가
    query =
      " Update BOARD SET favoriteCount = favoriteCount + 1 WHERE boardIndex = " +
      mysql.escape(board_index) +
      ";" +
      "INSERT INTO favoritePost(boardIndex,userIndex,updateDateTime) VALUES(?,?,?)";
    // 쿼리문 실행
    await db.pool.query(query, [board_index, user_index, moment().format("YYYY-MM-DD HH:mm:ss")]);
    // 성공 로그찍기
    await querySuccessLog(ip, query);
    // 정상적으로 좋아요 수 1증가
    await db.pool.query("COMMIT");
    return { state: "좋아요+1" };
    // 쿼리문 실행시 에러발생
  } catch (err) {
    await queryFail(err, ip, query);
    await db.pool.query("ROLLBACK");
    return { state: "mysql 사용실패" };
  }
}

// 3-2. 게시글 검색 기능
async function searchModel(search_option, search_content, category, ip) {
  // 검색 옵션에 맞는 게시글 정보 select 해오는 쿼리문 작성 (글제목, 글쓴이(닉네임), 조회수, 좋아요 수, 작성날짜)
  let query;
  // 제목만 검색한다고 옵션설정했을 때 검색해주는 쿼리문
  if (search_option === "제목만") {
    query =
      "SELECT boardIndex,postTitle,viewCount,favoriteCount,nickName,createDateTime FROM BOARD LEFT JOIN USER ON BOARD.userIndex = User.userIndex WHERE BOARD.deleteDateTime IS NULL AND BOARD.category =" +
      mysql.escape(category) +
      " AND postTitle LIKE " +
      mysql.escape("%" + search_content + "%");
    // 내용만 검색한다고 옵션설정했을 때 검색해주는 쿼리문
  } else if (search_option === "내용만") {
    query =
      "SELECT boardIndex,postTitle,viewCount,favoriteCount,nickName,createDateTime FROM BOARD LEFT JOIN USER ON BOARD.userIndex = User.userIndex WHERE BOARD.deleteDateTime IS NULL AND BOARD.category =" +
      mysql.escape(category) +
      " AND postContent LIKE " +
      mysql.escape("%" + search_content + "%");

    // 제목+내용 검색한다고 옵션설정했을 때 검색해주는 쿼리문
  } else if (search_option === "제목 + 내용") {
    query =
      "SELECT boardIndex,postTitle,viewCount,favoriteCount,nickName,createDateTime FROM BOARD LEFT JOIN USER ON BOARD.userIndex = User.userIndex WHERE BOARD.deleteDateTime IS NULL AND BOARD.category =" +
      mysql.escape(category) +
      " AND postContent LIKE " +
      mysql.escape("%" + search_content + "%") +
      "OR postContent LIKE" +
      mysql.escape("%" + search_content + "%");
    // 일치하는 닉네임 검색한다고 옵션설정했을 때 검색해주는 쿼리문
  } else if (search_option === "닉네임") {
    query =
      "SELECT boardIndex,postTitle,viewCount,favoriteCount,nickName,createDateTime FROM BOARD LEFT JOIN USER ON BOARD.userIndex = User.userIndex WHERE BOARD.deleteDateTime IS NULL AND BOARD.category =" +
      mysql.escape(category) +
      " AND nickName LIKE " +
      mysql.escape("%" + search_content + "%");
  }
  // 성공시
  try {
    const [results, fields] = await db.pool.query(query);
    await querySuccessLog(ip, query);
    // 검색결과가 없을 때
    if (results[0] === undefined) {
      return { state: "검색결과없음" };
    }
    // 검색결과가 있을 때
    return { state: "검색글정보", data: results };
    // 쿼리문 실행시 에러발생
  } catch (err) {
    await queryFail(err, ip, query);
    return { state: "mysql 사용실패" };
  }
}

// +) board model에서만 쓰일 메서드
// 특정 게시글을 봤을 때 조회수 중복증가 여부 체크해서 반영해주는 메서드 (해당 model 안에서만 사용)
const increaseViewCount = async function (board_index, user_index, ip) {
  // 기존에 요청 유저 ip로 게시글 조회한 기록이 있는지 확인하는 쿼리문
  let query;

  try {
    // 로그인한 유저가 글 조회했을 때
    if (user_index !== null) {
      // 해당 유저인덱스로 조회 기록이 있는지 확인하는 쿼리문 + 해당 ip로 조회 기록이 있는지 확인하는 쿼리문
      query =
        "SELECT userIndex FROM VIEWPOST WHERE deleteDateTime IS NULL AND boardIndex=" +
        mysql.escape(board_index) +
        " AND userIndex =" +
        mysql.escape(user_index) +
        ";" +
        "SELECT ip FROM VIEWPOST WHERE deleteDateTime IS NULL AND boardIndex=" +
        mysql.escape(board_index) +
        "AND ip =" +
        mysql.escape(ip) +
        ";";
    }
    // 로그인 안한 유저가 글 조회했을 때
    else if (user_index === null) {
      // 해당 ip로 조회 기록이 있는지 확인하는 쿼리문
      query =
        "SELECT ip FROM VIEWPOST WHERE deleteDateTime IS NULL AND boardIndex=" + mysql.escape(board_index) + "AND ip =" + mysql.escape(ip);
    }
    // 해당 게시글을 조회한 기록이 있는지 확인하는 쿼리 메서드
    const [results, fields] = await db.pool.query(query);
    await querySuccessLog(ip, query);

    // 해당 ip로 해당 게시글 조회한 기록이 없으면 조회수 1 증가
    if (results[0] === undefined) {
      // 로그인한 유저일 경우 쿼리문 - 조회한 ip와 user_index 정보 둘다 추가
      if (user_index !== null) {
        query =
          "UPDATE BOARD SET viewCount = viewCount + 1 WHERE boardIndex = " +
          mysql.escape(board_index) +
          ";" +
          "INSERT INTO VIEWPOST(boardIndex,ip,userIndex,updateDateTime) VALUES(" +
          mysql.escape(board_index) +
          "," +
          mysql.escape(ip) +
          "," +
          mysql.escape(user_index) +
          "," +
          mysql.escape(moment().format("YYYY-MM-DD HH:mm:ss")) +
          ");";
      }
      // 로그인안한 유저일 경우 쿼리문 - 조회한 ip 정보 추가
      else if (user_index === null) {
        query =
          "UPDATE BOARD SET viewCount = viewCount + 1 WHERE boardIndex = " +
          mysql.escape(board_index) +
          ";" +
          "INSERT INTO VIEWPOST(boardIndex,ip,updateDateTime) VALUES(" +
          mysql.escape(board_index) +
          "," +
          mysql.escape(ip) +
          "," +
          mysql.escape(moment().format("YYYY-MM-DD HH:mm:ss")) +
          ");";
      }
      // 해당 게시글 조회수 1 증가하는 쿼리문
      await db.pool.query(query);
      // 성공 로그찍기, data return
      await querySuccessLog(ip, query);
      return { state: "조회수증복증가여부체크완료" };
    }
    // 쿼리문 실행시 에러발생
  } catch (err) {
    await queryFail(err, ip, query);
    await db.pool.query("ROLLBACK");
    return { state: "mysql 사용실패" };
  }
};
module.exports = {
  getRecentPostModel: getRecentPostModel,
  entireBoardModel: entireBoardModel,
  detailBoardModel: detailBoardModel,
  writePostModel: writePostModel,
  getWriteModel: getWriteModel,
  revisePost: revisePost,
  deletePostModel: deletePostModel,
  likePostModel: likePostModel,
  searchModel: searchModel,
};
