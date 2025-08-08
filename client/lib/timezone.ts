/**
 * 클라이언트 시간대 처리 유틸리티
 * 사용자 시간대 기준 날짜/시간을 UTC 시간으로 변환하여 서버에 전송
 * 서버의 UTC 시간을 사용자 시간대로 변환하여 표시
 */

// 사용자의 로컬 시간대 가져오기
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function getUserDateTimeAsUTC(userDate: string, userTime: string = "00:00:00"): string {
  // 현지 시간 문자열로 Date 객체를 만들고, toISOString()으로 바로 UTC 변환
  return new Date(`${userDate}T${userTime}`).toISOString();
}


// 사용자 시간대의 특정 날짜 범위를 UTC 시간 범위로 변환
export function getUserDateRangeAsUTC(userDate: string): {
  start: string;
  end: string;
} {
  const startUTC = getUserDateTimeAsUTC(userDate, "00:00:00");
  const endUTC = getUserDateTimeAsUTC(userDate, "23:59:59");
  
  return {
    start: startUTC,
    end: endUTC
  };
}

// 사용자 시간대의 특정 날짜를 UTC 시간 범위로 변환 (일기 조회용)
export function getUserDateAsUTCRange(userDate: string): {
  start_datetime: string;
  end_datetime: string;
} {
  // 사용자 현지시각 기준 해당 날짜의 00:00:00 ~ 23:59:59를 UTC로 변환
  const startLocal = new Date(`${userDate}T00:00:00`); // 현지시각 자정
  const endLocal = new Date(`${userDate}T23:59:59.999`); // 현지시각 23:59:59
  
  console.log(`현지시각 범위: ${startLocal.toLocaleString()} ~ ${endLocal.toLocaleString()}`);
  
  // UTC로 변환
  const startUTC = startLocal.toISOString();
  const endUTC = endLocal.toISOString();
  
  console.log(`UTC 변환 범위: ${startUTC} ~ ${endUTC}`);
  
  return {
    start_datetime: startUTC,
    end_datetime: endUTC
  };
}

// 현재 시간을 UTC ISO 문자열로 변환 (일기 작성용)
export function getCurrentDateTimeAsUTC(): string {
  return new Date().toISOString();
}

// UTC ISO 문자열을 사용자 시간대로 포맷
export function formatUTCDateTimeToUser(utcISOString: string, format: 'date' | 'datetime' = 'date'): string {
  const utcDateTime = new Date(utcISOString);
  console.log(`UTC 문자열: ${utcISOString}`);
  console.log(`사용자 시간대: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
  
  if (format === 'date') {
    // UTC 시간을 현지시각으로 변환하여 날짜 추출
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const localDate = utcDateTime.toLocaleDateString('sv-SE', { timeZone }); // YYYY-MM-DD 형식
    const localDateTime = utcDateTime.toLocaleString('ko-KR', { timeZone }); // 현지시간 확인용
    
    console.log(`UTC -> 현지시간: ${localDateTime}`);
    console.log(`날짜 변환: ${utcISOString} (UTC) -> ${localDate} (현지시각 날짜)`);
    
    return localDate;
  } else {
    return utcDateTime.toLocaleString('ko-KR');
  }
}

