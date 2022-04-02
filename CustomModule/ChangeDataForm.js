// 조회수/좋아요 수 단위바꿔주기
import { moment } from "./DateTime";

export async function changeUnit(viewOrFavoriteCount) {
  const length = viewOrFavoriteCount.toString().length;
  // 1억이상일 때
  if (viewOrFavoriteCount >= 100000000) {
    // 천만 단위에서 반올림
    const roundCount = Math.round(viewOrFavoriteCount / 100000000) * 100000000;
    // '억'으로 단위변경
    return roundCount.toString().substring(0, length - 8) + " 억";
  }
  // 1억 이하 1000만 이상일 때
  else if (viewOrFavoriteCount < 100000000 && viewOrFavoriteCount >= 10000000) {
    // 백만 단위에서 반올림
    const roundCount = Math.round(viewOrFavoriteCount / 10000000) * 10000000;
    return roundCount.toString().substring(0, length - 7) + " 천만";
  }
  // 1000만 이하 100만 이상일 때
  else if (viewOrFavoriteCount < 10000000 && viewOrFavoriteCount >= 1000000) {
    // 십만 단위에서 반올림
    const roundCount = Math.round(viewOrFavoriteCount / 1000000) * 1000000;
    return roundCount.toString().substring(0, length - 6) + " 백만";
  }
  // 100만 이하 10만 이상일 때
  else if (viewOrFavoriteCount < 1000000 && viewOrFavoriteCount >= 100000) {
    // 만 단위에서 반올림
    const roundCount = Math.round(viewOrFavoriteCount / 100000) * 100000;
    return roundCount.toString().substring(0, length - 5) + " 십만";
  }
  // 10만 이하 만 이상일 때
  else if (viewOrFavoriteCount < 100000 && viewOrFavoriteCount >= 10000) {
    // 천 단위에서 반올림
    const roundCount = Math.round(viewOrFavoriteCount / 10000) * 10000;
    return roundCount.toString().substring(0, length - 4) + " 만";
  }
  // 만 이하 천 이상일 때
  else if (viewOrFavoriteCount < 10000 && viewOrFavoriteCount >= 1000) {
    // 백 단위에서 반올림
    const roundCount = Math.round(viewOrFavoriteCount / 1000) * 1000;
    return roundCount.toString().substring(0, length - 3) + " 천";
  }
  // 천 이하는 단위변경 x
  else return viewOrFavoriteCount;
}

// DateTime yyyy-mm-dd 형태로 변경해주는 메서드
export async function changeDateTimeForm(dateTime) {
  let tempDateTime = moment(dateTime, "YYYY-MM-DD").toDate();
  const stringDateTime =
    tempDateTime.getFullYear().toString() +
    "년 " +
    (tempDateTime.getMonth() + 1).toString() +
    "월 " +
    tempDateTime.getDate().toString() +
    "일";
  return stringDateTime;
}

// 도서관 후기 평균 평점 정보 가공
export async function changeGradeForm(grade) {
  // 후기가 없을 때
  if (grade === 0) return "후기없음";
  // 평점이 일의자리수만 있으면 .0 붙여주기
  else if (grade.toString().length === 1) return "★ " + grade.toString() + ".0 / 5 점";
  // 평점의 소수점 1의자리까지 있다면 문자열화만 해주기
  else return "★ " + grade.toString() + " / 5점";
}
// 도서관 정보 글자수 자르기
export async function changeLibraryDataForm(libraryData) {
  // 도서관명이 15글자 이상일 때 자르기
  if (libraryData.libraryName.length >= 15) {
    libraryData.libraryName = libraryData.libraryName.substring(0, 15) + "...";
  }
  // 도서관 유형이 10글자 이상일때 자르기
  if (libraryData.libraryType.length >= 10) {
    libraryData.libraryType = libraryData.libraryType.substring(0, 10) + "...";
  }
  // 휴관일이 15글자 이상일때 자르기
  if (libraryData.closeDay.length >= 15) {
    libraryData.closeDay = libraryData.closeDay.substring(0, 15) + "...";
  }
  // 시작, 종료시간 5글자까지일떄 자르기(00:00 형태)
  libraryData.openWeekday = libraryData.openWeekday.toString().substring(0, 5);
  libraryData.endWeekday = libraryData.endWeekday.toString().substring(0, 5);
  libraryData.openSaturday = libraryData.openSaturday.toString().substring(0, 5);
  libraryData.endSaturday = libraryData.endSaturday.toString().substring(0, 5);
  libraryData.openHoliday = libraryData.openHoliday.toString().substring(0, 5);
  libraryData.endHoliday = libraryData.endHoliday.toString().substring(0, 5);

  // 주소 20글자까지 자르기

  if (libraryData.address.length >= 20) {
    libraryData.address = libraryData.address.substring(0, 20) + "...";
  }

  return libraryData;
}
