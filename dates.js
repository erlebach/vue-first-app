// Provisional data/time library to handle integer time stamps (ms),
// in PTY and Zulu (UDC) time.

export function timestampToDateTimeZ(stamp) {
  /// Input: an integer (number in Javascript) time stamp  (ms)
  /// return:  an array with date and time in Zulu (UTC)
  const datetimeZ = new Date(stamp).toISOString();
  const dtz = datetimeZ.slice(0, 10);
  const tmz = datetimeZ.slice(11, 16);
  return { dtz, tmz };
}
//-------------------------------------------------
export function localCurrentDateTimeToTimestamp() {
  // return ms since jan 0, 1970 at 00h00
  // Result depends on where the code is run
  // I do not recommend using this routine
  const date = new Date();
  const now_utc = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds()
  );
  return now_utc;
}
//-------------------------------------------------
export function datetimeZToTimestamp(dtz, tmz) {
  // dtz: date in formation yyyy-mm-dd
  // tmz: time in hh:mm
  // Date and time are Zulu
  // Returns: a timestamp UTC (Zulu) in ms
  const year = dtz.slice(0, 4);
  const month = dtz.slice(5, 7);
  const day = dtz.slice(8, 10);
  const hour = tmz.slice(0, 2);
  const min = tmz.slice(3, 5);
  // Month is zero-based in Javacript. 1-based in Python
  const timestamp = Date.UTC(year, month - 1, day, hour, min);
  return timestamp;

  // console.log("function timestampZ");
  // console.log(d);
  // const zulu = timestamptoZulu(d);
  // console.log("zulu");
  // console.log(zulu);
  // return 0;
}
//-------------------------------------------------
export function datetimePTYtoTimestamp(dtl, tml) {
  // dtl: date in formation yyyy-mm-dd
  // tml: time in hh:mm,
  // Date and time are PTY (local time in Panama City, Panama)
  // Returns: a timestamp UTC (Zulu)
  // Approach: assume arguments are Zulu time. Add 5 hours, remembering
  // that the timestamp is in ms.
  const fiveHoursInMillisec = 5 * 3600 * 1000;
  const timestamp = datetimeZToTimestamp(dtl, tml) + fiveHoursInMillisec;
  return timestamp;
}
//----------------------------------------------
export function testTimeMethods() {
  console.log("");
  // const utcDate = new Date(Date.UTC(2021, 08, 06, 11, 26, 45));
  //const utcDate = _now();
  console.log("==== BEGIN TEST DATES ====");
  //console.log(utcDate.toUTCString());

  const date = new Date();
  const now_utc = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds()
  );
  console.log(`date: ${date}`);
  console.log(`now_utc: ${now_utc}`);
  console.log(new Date(now_utc));
  console.log("------- after now_utc ------");

  console.log("before timestampZ");
  const timestamp1 = datetimePTYtoTimestamp("2019-10-01", "16:30");
  const timestamp2 = datetimeZToTimestamp("2019-10-01", "16:30");
  console.log("(timestamp1 - timestamp2) in hours");
  console.log((timestamp1 - timestamp2) / 1000 / 3600);
  const dt1 = timestampToDateTimeZ(timestamp1);
  const dt2 = timestampToDateTimeZ(timestamp2);
  console.log(`t1 = ${dt1.dtz}, ${dt1.tmz}`); // Data off by one month
  console.log(`t2 = ${dt2.dtz}, ${dt2.tmz}`);

  // numbers > 2**53 have smaller granularity but can be used
  const outZ = 1569946980000000000 / 1000000; // ns
  const depTMZ = "16:23";
  const date1 = "oct 1, 2019";
  console.log(`outZ: ${outZ}`);
  console.log(`date1: ${date1}`);
  // Converts to local date/time (in Tallahassee)
  // I want to convert to Zulu time
  console.log(new Date(outZ).toISOString()); // Only gives a date
  console.log("==== END TEST DATES ====");
}
