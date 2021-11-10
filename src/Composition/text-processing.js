const API_URL = "http://35.223.143.175/api/dmhit";

import { saveAs } from "file-saver";
import { post } from "axios";
import moment from "moment";

const PWD = "M$h`52NQV4_%N}mvc$w)-z*EuZ`_^bf3";

// I removed aynch () . No progress. Still 400 Bad request
const GetTableData = () => {
  let data = post(
    "http://35.223.143.175/api/dmhit",
    //JSON.stringify({
    {
      pwd: "M$h`52NQV4_%N}mvc$w)-z*EuZ`_^bf3",
      arr_DTL: "2021-11-07",
      days: 1,
    },
    //}),
    {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        //"Access-Control-Allow-Origin": "*",
        // "Access-Control-Allow-Credentials": "true",
        // "Access-Control-Allow-Headers": "Content-Type",
        // "Access-Control-Allow-Methods": "Post",
      },
    }
  )
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      console.log(error);
      return undefined;
    });
  return data;
};

function saveData() {
  const keptRows = [];
  GetTableData().then((response) => {
    //console.log(response[0])
    //console.log(response[1])
    //console.log("Ignore all rows where both ETD and ETA are null (there are many)")
    //console.log("ORIG_CD, DEST_CD, FLT_NUM, NEXT_FLT_NUM, SCH_DEP_DTMZ, SCH_ARR_DTMZ, ETD, ETA");
    response[0].forEach((e) => {
      if (e.ETA !== null) {
        //console.log(`${e.ORIG_CD}, ${e.DEST_CD}, ${e.FLT_NUM}, ${e.SCH_DEP_DTMZ}, ${e.SCH_ARR_DTMZ}, ${e.ETD}, ${e.ETA}`);
        const row = {
          orig: e.ORIG_CD,
          dest: e.DEST_CD,
          fltnum: e.FLT_NUM,
          sch_dep_dtmz: e.SCH_DEP_DTMZ,
          sch_arr_dtmz: e.SCH_ARR_DTMZ,
          etd: e.ETD,
          eta: e.ETA,
        };
        keptRows.push(row);
      }
    });
    //console.log("ORIG_CD, DEST_CD, FLT_NUM, SCH_DEP_DTMZ, SCH_ARR_DTMZ, ETD, ETA");
    //console.log("Ignore all rows where both ETD and ETA are null (there are many)")
  });
  return keptRows;
}

const allUpdates = [];

export function saveAtIntervals(nbSec) {
  setInterval(() => {
    const keptRows = saveData();
    console.log("keptRows");
    console.log(keptRows);
    allUpdates.push(keptRows);
    const now = moment().calendar();
    console.log(`time: ${now}`);
    console.log(allUpdates);
    const filenm = "/data/flight_data_" + now + ".txt";
    saveAs(new File(allUpdates, filenm, { type: "text/plain; charset=utf-8" }));
    //console.log(filenm);
    //console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
  }, nbSec * 1000); // ms
}
