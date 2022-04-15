// 게시판 모델
// 필요모듈
// 외장모듈
import mysql from "mysql2/promise";
// 내장모듈
import { myPool } from "../CustomModule/Db";
import { queryFailLog, querySuccessLog } from "../CustomModule/QueryLog";
import { changeTimestampForm, changeUnit, checkExistUser } from "../CustomModule/ChangeDataForm";
/*
 * 1. 게시글 조회
 * 2. 게시글 작성/수정/삭제
 * 3. 좋아요/검색 기능
 */

// 1. 게시글 조회
// 1-1. 최신글 정보 가져오기
export async function getRecentBoardModel(ip) {
  const freeBoardData = [];
  const studyBoardData = [];
  // 최신글 자유게시판 글 5개/공부인증샷 글 4개 불러오기
  const query =
    "SELECT postTitle,nickname FROM BOARD LEFT JOIN USER ON BOARD.userIndex=USER.userIndex WHERE BOARD.deleteTimestamp IS NULL AND BOARD.boardIndex IS NOT NULL AND category = 0 order by boardIndex DESC limit 5;" +
    "SELECT postTitle,nickname,viewCount,favoriteCount FROM BOARD LEFT JOIN USER ON BOARD.userIndex=USER.userIndex WHERE BOARD.deleteTimestamp IS NULL AND BOARD.boardIndex IS NOT NULL AND category = 1 order by boardIndex DESC limit 4;";
  // 성공시
  try {
    const [results, fields] = await myPool.query(query);
    // 성공 로그찍기
    await querySuccessLog(ip, query);
    // 자유게시판 최신글 파싱
    for (const index in results[0]) {
      // 게시글 제목의 글자수가 15자 이하일 때
      if (results[0][index].postTitle.length <= 15) {
        const tempData = {
          postTitle: results[0][index].postTitle,
          nickname: await checkExistUser(results[0][index].nickname),
        };
        freeBoardData.push(tempData);
      }
      // 게시글 제목의 글자수가 15자 초과일 때
      else if (results[0][index].postTitle.length > 15) {
        const tempData = {
          postTitle: results[0][index].postTitle.substring(0, 15) + "...",
          nickname: await checkExistUser(results[0][index].nickname),
        };
        freeBoardData.push(tempData);
      }
    }

    // 공부인증샷 최신글 파싱
    for (const index in results[1]) {
      // 게시글 제목의 글자수가 10자 이하일 때
      if (results[1][index].postTitle.length <= 10) {
        const tempData = {
          postTitle: results[1][index].postTitle,
          nickname: await checkExistUser(results[1][index].nickname),
          viewCount: await changeUnit(results[1][index].viewCount),
          favoriteCount: await changeUnit(results[1][index].favoriteCount),
        };
        studyBoardData.push(tempData);
        // 게시글 제목의 글자수가 10자 초과일 때
      } else if (results[1][index].postTitle.length > 10) {
        const tempData = {
          postTitle: results[1][index].postTitle.substring(0, 10) + "...",
          nickname: await checkExistUser(results[1][index].nickname),
          viewCount: await changeUnit(results[1][index].viewCount),
          favoriteCount: await changeUnit(results[1][index].favoriteCount),
        };
        studyBoardData.push(tempData);
      }
    }

    return { state: "최신글정보", dataOfFreeBoard: freeBoardData, dataOfStudyBoard: studyBoardData };
    // 쿼리문 실행시 에러발생
  } catch (err) {
    await queryFailLog(err, ip, query);
    return { state: "mysql 사용실패" };
  }
}
// 1-2. 전체 게시글 정보 (글제목, 글쓴이(닉네임), 조회수, 좋아요 수, 작성날짜)
export async function entireBoardModel(category, page, ip) {
  const boardData = [];
  // 카테고리에 맞는 전체 게시글 정보 가져오기
  const query =
    "SELECT postTitle,viewCount,favoriteCount,nickname,BOARD.createTimestamp FROM BOARD LEFT JOIN USER ON BOARD.userIndex = User.userIndex WHERE BOARD.deleteTimestamp IS NULL AND BOARD.category =" +
    mysql.escape(category) +
    " ORDER BY boardIndex DESC LIMIT " +
    10 * (page - 1) +
    ", 10";
  // 성공시
  try {
    const [results, fields] = await myPool.query(query);
    // 성공 로그찍기
    await querySuccessLog(ip, query);
    // 게시글 정보가 없을 때
    if (results[0] === undefined) {
      return { state: "존재하지않는정보" };
    }
    // 게시글 정보 파싱
    for (const index in results) {
      // 게시글 제목의 글자수가 25자 미만일 때
      if (results[index].postTitle.length <= 25) {
        const tempData = {
          postTitle: results[index].postTitle,
          nickname: await checkExistUser(results[index].nickname),
          viewCount: await changeUnit(results[index].viewCount),
          favoriteCount: await changeUnit(results[index].favoriteCount),
          createDate: await changeTimestampForm(results[index].createTimestamp),
        };
        boardData.push(tempData);
      }
      // 게시글 제목의 글자수가 25자 이상일 때
      else if (results[index].postTitle.length > 25) {
        const tempData = {
          postTitle: results[index].postTitle.substring(0, 25) + "...",
          nickname: await checkExistUser(results[index].nickname),
          viewCount: await changeUnit(results[index].viewCount),
          favoriteCount: await changeUnit(results[index].favoriteCount),
          createDate: await changeTimestampForm(results[index].createTimestamp),
        };
        boardData.push(tempData);
      }
    }

    // 가져온 게시글 정보 return
    return { state: "전체게시글", dataOfBoard: boardData };
    // 쿼리문 실행시 에러발생
  } catch (err) {
    await queryFailLog(err, ip, query);
    return { state: "mysql 사용실패" };
  }
}

// 1-3. 특정 게시글 상세보기
export async function detailBoardModel(category, boardIndex, ip, isViewDuplicated) {
  const tagData = [];
  let boardData;
  // 해당 인덱스의 게시글/태그 정보 가져오는 쿼리문
  let query =
    "SELECT postTitle,postContent,viewCount,favoriteCount,BOARD.createTimestamp,USER.nickname FROM BOARD LEFT JOIN USER ON BOARD.userIndex = USER.userIndex WHERE BOARD.deleteTimestamp IS NULL AND BOARD.category=" +
    mysql.escape(category) +
    " AND boardIndex =" +
    mysql.escape(boardIndex);
  // 성공시
  try {
    // 게시글 정보가져오는 쿼리 메서드
    let [results, fields] = await myPool.query(query);
    // 성공 로그찍기
    await querySuccessLog(ip, query);
    // 요청한 게시글 인덱스의 게시물이 존재하지 않을 때
    if (results[0] === undefined) {
      return { state: "존재하지않는게시글" };
    }
    query =
      "SELECT postTitle,USER.nickname,postContent,viewCount,favoriteCount,BOARD.createTimestamp FROM BOARD LEFT JOIN USER ON BOARD.userIndex = USER.userIndex WHERE BOARD.deleteTimestamp IS NULL AND BOARD.category=" +
      mysql.escape(category) + // 해당 게시글 정보
      " AND boardIndex =" +
      mysql.escape(boardIndex) +
      ";" +
      "SELECT tag FROM TAG WHERE deleteTimestamp IS NULL AND TAG IS NOT NULL AND boardIndex =" + // 태그 정보
      mysql.escape(boardIndex) +
      ";";
    // 게시글 정보가져오는 쿼리 메서드
    [results, fields] = await myPool.query(query);
    // 성공 로그찍기
    await querySuccessLog(ip, query);
    // 최초 조회시 게시글 조회수 +1
    if (isViewDuplicated === false) {
      query = `UPDATE BOARD SET viewCount = viewCount +1 WHERE boardIndex = ${boardIndex}`;
      await myPool.query(query);
      // 성공 로그찍기
      await querySuccessLog(ip, query);
    }
    // 해당 게시글의 데이터 파싱
    // 게시글 데이터
    boardData = {
      postTitle: results[0][0].postTitle,
      nickname: await checkExistUser(results[0][0].nickname),
      postContent: results[0][0].postContent,
      viewCount: await changeUnit(results[0][0].viewCount),
      favoriteCount: await changeUnit(results[0][0].favoriteCount),
      createDate: await changeTimestampForm(results[0][0].createTimestamp),
    };
    // 태그 데이터
    for (let tagIndex in results[1]) {
      tagData.push({ tag: results[1][tagIndex].tag });
    }

    // 성공적으로 게시글 정보 조회
    return { state: "게시글상세보기", dataOfBoard: boardData, dataOfTag: tagData };

    // 쿼리문 실행시 에러발생
  } catch (err) {
    await queryFailLog(err, ip, query);
    return { state: "mysql 사용실패" };
  }
}

// 2. 게시글 작성/수정/삭제
// 2-1. 게시글 최초 작성
export async function writeBoardModel(category, inputWrite, userIndex, ip) {
  let query;
  let tagQuery = "";
  let tagSequence = 1;
  // DB에 저장될 형식(TINYINT)으로 변경
  if (category === "자유게시판") category = 0;
  else if (category === "공부인증샷") category = 1;
  // 게시글 작성 쿼리문
  query =
    "INSERT INTO BOARD(category,userIndex,postTitle,postContent,createTimestamp,viewCount,favoriteCount) VALUES (" +
    mysql.escape(category) +
    "," +
    mysql.escape(userIndex) +
    "," +
    mysql.escape(inputWrite.postTitle) +
    "," +
    mysql.escape(inputWrite.postContent) +
    ",NOW(),0,0);"; // 조회수, 좋아하는 유저수는 처음에 0으로 등록
  // 성공시
  try {
    await myPool.query("START TRANSACTION");
    const [results, fields] = await myPool.query(query);
    // 쿼리문 성공로그
    await querySuccessLog(ip, query);
    // 태그 추가 쿼리문
    // 태그 쿼리문 추가, 태그 배열이 비어있으면 해당 반복문은 작동하지 않음
    for (const tagIndex in inputWrite.tags) {
      tagQuery +=
        "INSERT INTO TAG(boardIndex,tag,tagSequence,updateTimestamp) VALUES (" +
        mysql.escape(results.insertId) + // 생성될 게시글의 인덱스
        "," +
        mysql.escape(inputWrite.tags[tagIndex].content) +
        "," +
        mysql.escape(tagSequence) +
        ",NOW());";
      ++tagSequence;
    }
    // 태그가 5개 이하라면 비어있는 태그 sequence 만들어줌 (tagCount 는 마지막 (tagIndex(범위: 0~4) + 1)(범위: 1~5) +1)
    for (; tagSequence <= 5; ++tagSequence) {
      tagQuery +=
        "INSERT INTO TAG(boardIndex,tagSequence,updateTimestamp) VALUES (" +
        mysql.escape(results.insertId) + // 생성될 게시글의 인덱스
        "," +
        mysql.escape(tagSequence) +
        ",NOW());";
    }
    // 태그가 있다면 DB에 태그 정보 추가
    if (tagQuery !== "") await myPool.query(tagQuery);
    // 성공 로그찍기, 커밋하기
    await querySuccessLog(ip, tagQuery);
    await myPool.query("COMMIT");
    return { state: "게시글작성완료" };
  } catch (err) {
    // 쿼리문 실행시 에러발생
    await myPool.query("ROLLBACK");
    await queryFailLog(err, ip, query);
    return { state: "mysql 사용실패" };
  }
}
// 2-2. 게시글 수정시 기존 게시글 정보 불러오기
export async function getWriteModel(boardIndex, userIndex, ip) {
  const tagData = [];
  // 해당 인덱스의 게시글 정보 가져오기 + 해당 게시글인덱스의 태그 가져오기
  const query =
    "SELECT category,postTitle,postContent FROM BOARD WHERE deleteTimestamp IS NULL AND boardIndex = " +
    mysql.escape(boardIndex) +
    ";" +
    "SELECT tag FROM TAG WHERE tag IS NOT NULL AND deleteTimestamp IS NULL AND boardIndex = " +
    mysql.escape(boardIndex) +
    " ORDER BY tagSequence ASC;";
  // 성공시
  try {
    const [results, fields] = await myPool.query(query);
    // 쿼리문 성공로그
    await querySuccessLog(ip, query);
    // 해당 게시글이 없을 때
    if (results[0] === undefined) {
      return { state: "존재하지않는게시글" };
    }
    // DB에 TINYINT로 저장된 정보 문자열로 변경
    if (results[0][0].category === 0) results[0][0].category = "자유게시판";
    else if (results[0][0].category === 1) results[0][0].category = "공부인증샷";
    // 게시글 데이터
    const boardData = {
      category: results[0][0].category,
      postTitle: results[0][0].postTitle,
      postContent: results[0][0].postConten,
    };
    // 태그 데이터
    for (let tagIndex in results[1]) {
      tagData.push({ tag: results[1][tagIndex].tag });
    }

    return { state: "게시글정보로딩", dataOfBoard: boardData, dataOfTag: tagData };
  } catch (err) {
    // 쿼리문 실행시 에러발생
    await queryFailLog(err, ip, query);
    return { state: "mysql 사용실패" };
  }
}
// 2-3. 게시글 수정 요청
export async function editBoardModel(inputWrite, boardIndex, userIndex, ip) {
  // body.category 의 문자열 DB에 저장될 형식(TINYINT)으로 변경
  if (inputWrite.category === "자유게시판") inputWrite.category = 0;
  else if (inputWrite.category === "공부인증샷") inputWrite.category = 1;
  // 게시글 정보 수정 요청 쿼리문
  let query =
    "UPDATE BOARD SET postTitle = " +
    mysql.escape(inputWrite.postTitle) +
    ",postContent=" +
    mysql.escape(inputWrite.postContent) +
    ", updateTimestamp = NOW() WHERE boardIndex = " +
    mysql.escape(boardIndex) +
    " AND userIndex=" +
    mysql.escape(userIndex) +
    " AND category=" +
    mysql.escape(inputWrite.category) +
    ";";
  let tagQuery = "";
  let tagSequence = 1;
  // 성공시
  try {
    await myPool.query("START TRANSACTION");
    await myPool.query(query);
    // 쿼리 성공로그
    await querySuccessLog(ip, query);
    // 태그 변경 쿼리문
    // 태그 쿼리문 추가, 태그 배열이 비어있으면 해당 반복문은 작동하지 않음
    for (const tagIndex in inputWrite.tags) {
      tagQuery +=
        "UPDATE TAG SET tag = " +
        mysql.escape(inputWrite.tags[tagIndex].content) +
        ",updateTimestamp = NOW() WHERE boardIndex =" +
        mysql.escape(boardIndex) +
        " AND tagSequence = " +
        mysql.escape(tagSequence) +
        ";";
      ++tagSequence;
    }
    // 태그가 5개 이하라면 비어있는 태그 sequence 만들어줌
    for (; tagSequence <= 5; ++tagSequence) {
      tagQuery +=
        "UPDATE TAG SET tag = NULL, tagSequence =" +
        mysql.escape(tagSequence) +
        ",updateTimestamp = NOW() WHERE boardIndex =" +
        mysql.escape(boardIndex) +
        "AND tagSequence =" +
        mysql.escape(tagSequence) +
        ";";
    }
    // 태그 정보 변경
    await myPool.query(tagQuery);
    // 성공 로그찍기, 커밋하기
    await querySuccessLog(ip, tagQuery);
    await myPool.query("COMMIT");
    return { state: "게시글수정" };
  } catch (err) {
    await queryFailLog(err, ip, query + tagQuery);
    await myPool.query("ROLLBACK");
    return { state: "mysql 사용실패" };
  }
}

// 2-4. 게시글 삭제 요청
export async function deleteBoardModel(boardIndex, userIndex, ip) {
  // 해당 인덱스 게시글 삭제
  const query =
    // 게시글 삭제 쿼리문
    "UPDATE BOARD SET deleteTimestamp = NOW() WHERE boardIndex = " +
    mysql.escape(boardIndex) +
    "AND userIndex = " +
    mysql.escape(userIndex) +
    ";" +
    "UPDATE Tag SET deleteTimestamp = NOW() WHERE boardIndex=" +
    mysql.escape(boardIndex) +
    ";" +
    "UPDATE FAVORITEPOST SET boardDeleteTimestamp = NOW() WHERE boardIndex=" + // 좋아요 테이블의 게시글 삭제날짜 컬럼에 값 넣는 쿼리문
    mysql.escape(boardIndex) +
    ";" +
    "UPDATE COMMENT SET boardDeleteTimestamp = NOW() WHERE boardIndex=" + // 댓글 테이블의 게시글 삭제날짜 컬럼에 값 넣는 쿼리문
    mysql.escape(boardIndex) +
    ";";
  // 성공시
  try {
    await myPool.query("START TRANSACTION");
    await myPool.query(query);
    // 성공 로그찍기
    await querySuccessLog(ip, query);
    await myPool.query("COMMIT");
    return { state: "게시글삭제" };
    // 쿼리문 실행시 에러발생
  } catch (err) {
    await myPool.query("ROLLBACK");
    await queryFailLog(err, ip, query);
    return { state: "mysql 사용실패" };
  }
}

// 3. 좋아요 요청/검색기능
// 3-1. 게시글 좋아요 요청
export async function favoriteBoardModel(boardIndex, userIndex, ip) {
  let query = "SELECT postTitle FROM BOARD WHERE deleteTimestamp IS NULL AND boardIndex=" + mysql.escape(boardIndex);
  // 성공시
  try {
    let [results, fields] = await myPool.query(query);
    if (results[0] === undefined) return { state: "존재하지않는게시글" };
    // 좋아요한 유저 테이블에 해당게시글에 좋아요 누른 유저인덱스 추가하는 쿼리문
    query =
      "SELECT favoriteFlag FROM FAVORITEPOST WHERE boardIndex=" +
      mysql.escape(boardIndex) +
      "AND userIndex = " +
      mysql.escape(userIndex);
    [results, fields] = await myPool.query(query);
    // 성공 로그찍기
    await querySuccessLog(ip, query);
    // 좋아요 최초 요청
    if (results[0] === undefined) {
      // 해당 게시글에 좋아요를 한번도 누르지 않은 유저의 경우 좋아요 1 증가, 좋아요 누른 사람 목록에 해당 유저 추가
      query =
        " Update BOARD SET favoriteCount = favoriteCount + 1 WHERE boardIndex = " +
        mysql.escape(boardIndex) +
        ";" +
        "INSERT INTO favoritePost(boardIndex,userIndex,favoriteFlag,updateTimestamp) VALUES(?,?,?,NOW())";
      // 쿼리문 실행
      await myPool.query(query, [boardIndex, userIndex, 0]);
      // 성공 로그찍기
      await querySuccessLog(ip, query);
      // 정상적으로 좋아요 수 1증가
      return { state: "좋아요+1" };
      // 좋아요를 이미 누른 적이 있고 favoriteFlag 컬럼값이 TRUE 일 때, favoriteFlag 컬럼값 FALSE 로 바꿔주기 (게시글 조회시 favoriteFlag의 값이 TRUE 로 돼있는 수만큼만 좋아요 수 집계, 0: FALSE, 1: TRUE)
    } else if (results[0] !== undefined) {
      if (results[0].favoriteFlag === 1) {
        query =
          " Update BOARD SET favoriteCount = favoriteCount - 1 WHERE boardIndex = " +
          mysql.escape(boardIndex) +
          ";" +
          "UPDATE FAVORITEPOST SET updateTimestamp = NOW(), favoriteFlag = 0 WHERE boardIndex =" +
          mysql.escape(boardIndex) +
          " AND userIndex = " +
          mysql.escape(userIndex);
        // 쿼리문 실행
        await myPool.query(query);
        // 성공 로그찍기
        await querySuccessLog(ip, query);
        // 좋아요 취소
        return { state: "좋아요 취소" };
        // 좋아요를 이미 누른 적이 있고 favoriteFlag 컬럼값이 FALSE 일 때, favoriteFlag 컬럼값 TRUE 로 바꿔주기 (게시글 조회시 favoriteFlag의 값이 TRUE 로 돼있는 수만큼만 좋아요 수 집계, 0: FALSE, 1: TRUE)
      } else if (results[0].favoriteFlag === 0) {
        query =
          " Update BOARD SET favoriteCount = favoriteCount + 1 WHERE boardIndex = " +
          mysql.escape(boardIndex) +
          ";" +
          "UPDATE FAVORITEPOST SET updateTimestamp= NOW(), favoriteFlag = 1 WHERE boardIndex =" +
          mysql.escape(boardIndex) +
          " AND userIndex = " +
          mysql.escape(userIndex);
        // 쿼리문 실행
        await myPool.query(query);
        // 성공 로그찍기
        await querySuccessLog(ip, query);
        // 좋아요 +1
        return { state: "좋아요+1" };
      }
    }
    // 쿼리문 실행시 에러발생
  } catch (err) {
    await queryFailLog(err, ip, query);
    return { state: "mysql 사용실패" };
  }
}

// 3-2. 게시글 검색 기능
export async function searchBoardModel(searchOption, searchContent, category, page, ip) {
  const boardData = [];
  // 검색 옵션에 맞는 게시글 정보 select 해오는 쿼리문 작성 (글제목, 글쓴이(닉네임), 조회수, 좋아요 수, 작성날짜)
  let query;
  // 제목만 검색한다고 옵션설정했을 때 검색해주는 쿼리문
  if (searchOption === "제목만") {
    query =
      "SELECT postTitle,viewCount,favoriteCount,nickname,createTimestamp FROM BOARD LEFT JOIN USER ON BOARD.userIndex = User.userIndex WHERE BOARD.deleteTimestamp IS NULL AND BOARD.category =" +
      mysql.escape(category) +
      " AND postTitle LIKE " +
      mysql.escape("%" + searchContent + "%") +
      "ORDER BY boardIndex DESC LIMIT " +
      10 * (page - 1) +
      ", 10";
    // 내용만 검색한다고 옵션설정했을 때 검색해주는 쿼리문
  } else if (searchOption === "내용만") {
    query =
      "SELECT postTitle,viewCount,favoriteCount,nickname,createTimestamp FROM BOARD LEFT JOIN USER ON BOARD.userIndex = User.userIndex WHERE BOARD.deleteTimestamp IS NULL AND BOARD.category =" +
      mysql.escape(category) +
      " AND postContent LIKE " +
      mysql.escape("%" + searchContent + "%") +
      "ORDER BY boardIndex DESC LIMIT " +
      10 * (page - 1) +
      ", 10";

    // 제목+내용 검색한다고 옵션설정했을 때 검색해주는 쿼리문
  } else if (searchOption === "제목 + 내용") {
    query =
      "SELECT postTitle,viewCount,favoriteCount,nickname,createTimestamp FROM BOARD LEFT JOIN USER ON BOARD.userIndex = User.userIndex WHERE BOARD.deleteTimestamp IS NULL AND BOARD.category =" +
      mysql.escape(category) +
      " AND postContent LIKE " +
      mysql.escape("%" + searchContent + "%") +
      "OR postContent LIKE" +
      mysql.escape("%" + searchContent + "%") +
      "ORDER BY boardIndex DESC LIMIT " +
      10 * (page - 1) +
      ", 10";
    // 일치하는 닉네임 검색한다고 옵션설정했을 때 검색해주는 쿼리문
  } else if (searchOption === "닉네임") {
    query =
      "SELECT postTitle,viewCount,favoriteCount,nickname,createTimestamp FROM BOARD LEFT JOIN USER ON BOARD.userIndex = User.userIndex WHERE BOARD.deleteTimestamp IS NULL AND BOARD.category =" +
      mysql.escape(category) +
      " AND nickname LIKE " +
      mysql.escape("%" + searchContent + "%") +
      "ORDER BY boardIndex DESC LIMIT " +
      10 * (page - 1) +
      ", 10";
  }
  // 성공시
  try {
    const [results, fields] = await myPool.query(query);
    await querySuccessLog(ip, query);
    // 검색결과가 없을 때
    if (results[0] === undefined) {
      return { state: "검색결과없음" };
    }
    // 게시글 정보 파싱
    for (const index in results) {
      // 게시글 제목의 글자수가 25자 미만일 때
      if (results[index].postTitle.length <= 25) {
        const tempData = {
          postTitle: results[index].postTitle,
          nickname: await checkExistUser(results[index].nickname),
          viewCount: await changeUnit(results[index].viewCount),
          favoriteCount: await changeUnit(results[index].favoriteCount),
          createDate: await changeTimestampForm(results[index].createTimestamp),
        };
        boardData.push(tempData);
      }
      // 게시글 제목의 글자수가 25자 이상일 때
      else if (results[index].postTitle.length > 25) {
        const tempData = {
          postTitle: results[index].postTitle.substring(0, 25) + "...",
          nickname: await checkExistUser(results[index].nickname),
          viewCount: await changeUnit(results[index].viewCount),
          favoriteCount: await changeUnit(results[index].favoriteCount),
          createDate: await changeTimestampForm(results[index].createTimestamp),
        };
        boardData.push(tempData);
      }
    }
    // 검색결과가 있을 때
    return { state: "검색글정보", dataOfBoard: boardData };
    // 쿼리문 실행시 에러발생
  } catch (err) {
    await queryFailLog(err, ip, query);
    return { state: "mysql 사용실패" };
  }
}
