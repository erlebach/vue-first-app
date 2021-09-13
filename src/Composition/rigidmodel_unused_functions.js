import * as u from "../Composition/utils.js";
import * as d from "./dates.js";
//--------------------------------------------------------------------
// Function for debugging different types of rotations
function checkRotations(FSUm, bookings, tails) {
  const nano2min = 1 / 1e9 / 60;
  bookings.forEach((e) => {
    e.fsu_f = FSUm[e.id_f];
    e.fsu_nf = FSUm[e.id_nf];
    // u.print("e", e);
    // rotation only exists for fixed tails
    if (e.fsu_f !== undefined && e.fsu_nf !== undefined) {
      const plannedRot_f = e.fsu_f.ROTATION_PLANNED_TM; // not equal
      const plannedRot_nf = e.fsu_nf.ROTATION_PLANNED_TM; // not equal
      const realRot_f = e.fsu_f.ROTATION_REAL_TM; // not equal
      const realRot_nf = e.fsu_nf.ROTATION_REAL_TM; // not equal
      const availRot_f = e.fsu_f.ROTATION_AVAILABLE_TM; // not equal
      const availRot_nf = e.fsu_nf.ROTATION_AVAILABLE_TM; // not equal
      const calcRealRot = (e.fsu_nf.OUT_DTMZ - e.fsu_f.IN_DTMZ) * nano2min; // not equal
      const calcAvailRot = (e.fsu_nf.SCH_DEP_DTMZ - e.fsu_f.IN_DTMZ) * nano2min; // not equal
      const calcPlannedRot =
        (e.fsu_nf.SCH_DEP_DTMZ - e.fsu_f.SCH_ARR_DTMZ) * nano2min; // not equal
      // const calcPlannedRot1 =
      // (e.b_nf.SCH_DEP_DTMZ - e.b_f.SCH_ARR_DTMZ) * nano2min; // not equal
      // const calcRot_f = e.b_f
      // Compute rotation manually to check.
      // planned rotation is sched_dep_nf - sched_arr_f
      if (e.TAIL_f === e.TAIL_nf) {
        // u.print("e", e);
        u.print("plannedRot_f", plannedRot_f); // different values for _f and _nf
        u.print("plannedRot_nf", plannedRot_nf);
        u.print("realRot_f", realRot_f); // different values for _f and _nf
        u.print("realRot_nf", realRot_nf);
        u.print("availRot_f", availRot_f); // different values for _f and _nf
        u.print("availRot_nf", availRot_nf);
        u.print("calcPlannedRot", calcPlannedRot);
        u.print("calcRealRot", calcRealRot);
        u.print("calcAvailRot", calcAvailRot);
      }
    }
  });

  u.print("tails", tails);
  // Tail pairs at station are not in te bookings database since there are no passengers
  // tails contains rotations at PTY and at stations
  tails.forEach((e) => {
    e.fsu_f = e.b_f;
    e.fsu_nf = e.b_nf;
    const plannedRot_f = e.fsu_f.ROTATION_PLANNED_TM; // not equal
    const plannedRot_nf = e.fsu_nf.ROTATION_PLANNED_TM; // not equal
    const realRot_f = e.fsu_f.ROTATION_REAL_TM; // not equal
    const realRot_nf = e.fsu_nf.ROTATION_REAL_TM; // not equal
    const availRot_f = e.fsu_f.ROTATION_AVAILABLE_TM; // not equal
    const availRot_nf = e.fsu_nf.ROTATION_AVAILABLE_TM; // not equal
    const calcRealRot = (e.fsu_nf.OUT_DTMZ - e.fsu_f.IN_DTMZ) * nano2min; // not equal
    const calcAvailRot = (e.fsu_nf.SCH_DEP_DTMZ - e.fsu_f.IN_DTMZ) * nano2min; // not equal
    const calcPlannedRot =
      (e.fsu_nf.SCH_DEP_DTMZ - e.fsu_f.SCH_ARR_DTMZ) * nano2min; // not equal

    u.print("Tail, id_f, id_nf: ", `${e.id_f}, ${e.id_nf}`);
    //u.print("tail plannedRot_f", plannedRot_f); // different values for _f and _nf
    u.print("tail plannedRot_nf", plannedRot_nf);
    //u.print("tail realRot_f", realRot_f); // different values for _f and _nf
    u.print("tail realRot_nf", realRot_nf);
    //u.print("tail availRot_f", availRot_f); // different values for _f and _nf
    u.print("tail availRot_nf", availRot_nf);
    u.print("tail calcPlannedRot", calcPlannedRot);
    u.print("tail calcRealRot", calcRealRot);
    u.print("tail calcAvailRot", calcAvailRot);
  });
}
//-----------------------------------------------------------------
function initializePredictedDelaysAndSlacks(dFSU, dTailsSta) {
  const day = "2019/10/01";
  Object.values(dTailsSta).forEach((v) => {
    const milli2min = 1 / 1e3 / 60;
    const arr_f_ts = d.datetimeZToTimestamp(day, v.arr_f); // scheduled
    const dep_nf_ts = d.datetimeZToTimestamp(day, v.dep_nf); // scheduled
    // Rotation slack (i.e., rotation to spare)
    v.rotSlackPlanned = (dep_nf_ts - arr_f_ts) * milli2min - 60; // planned initial
    v.rotSlackP = v.rotSlackPlanned; // correct
  });

  return; // dTailsSta is mutable  (it is the value of a ref)
}
//------------------------------------------------------------------
function handleBookingsIn(bookings_in, sources, id) {
  let ids = [];
  // Analyze bookings_in versus sources[id] <<<<< TODO
  if (bookings_in !== undefined && bookings_in[id] !== undefined) {
    // u.print("=> bookings_in", bookings_in);
    bookings_in[id].forEach((b) => {
      // ids.push(`in: id_f, id_nf, ${b.id_f}, ${b.id_nf}`);
      ids.push([b.id_f, b.id_nf]);
      // console.log(`inxx: id_f, id_nf: ${b.id_f}, ${b.id_nf}`);
      // console.log(b);
      // if (id.slice(10, 13) !== "PTY") {
      //   u.print(`handle, bookings_in, Sta-PTY, defined, id: ${id}`); // none
      // } else {
      //   u.print(`handle, bookings_in, PTY-Sta, defined, id: ${id}`); // yes, many
      // }
    });
    u.print("=> bookings_in (id_f,id_nf): ", ids);
  } else {
    if (id.slice(10, 13) !== "PTY") {
      u.print(`handle, bookings_in, Sta-PTY, undefined, id: ${id}`); // yes
    } else {
      u.print(`handle, bookings_in, PTY-Sta, undefined, id: ${id}`); // none
    }
  }
}
//------------------------------------------------------------
function handleBookingsOut(bookings_out, targets, id) {
  let ids = [];
  if (bookings_out !== undefined && bookings_out[id] !== undefined) {
    // u.print("=> bookings_out", bookings_out);
    bookings_out[id].forEach((b) => {
      ids.push([b.id_f, b.id_nf]);
      // console.log(`outxx: id_f, id_nf: ${b.id_f}, ${b.id_nf}`);
      // console.log(b);
    });
    u.print("=> bookings_out (id_f,id_nf): ", ids);
    const len_bookings_out = ids.length;
    const len_targets = targets[id].length;
    if (len_bookings_out !== len_targets) {
      // LENGTHS ALWAYS MATCH!!
      u.print("len_bookings_out and len_targets do not match!!");
    }
    if (len_bookings_out === 1) {
      console.log("len_bookings_out is unity (1)");
    }
    console.log(`bookings_out length: ${id} ==> ${len_bookings_out}`);
  } else {
    if (id.slice(10, 13) !== "PTY") {
      console.log(`Undefined flight not from PTY. IMPOSSIBLE, id: ${id}`);
      // I found some impossible cases.
    }
    console.log(`bookings_out undefined, id: ${id}`);
  }
}
//--------------------------------------------------------------------------
//------------------------------------------------------------------
//------------------------------------------------------------------
//------------------------------------------------------------------
//------------------------------------------------------------------
//------------------------------------------------------------------
//------------------------------------------------------------------
//------------------------------------------------------------------
//------------------------------------------------------------------
//------------------------------------------------------------------
//------------------------------------------------------------------
//------------------------------------------------------------------
//-------------------------------------------------------------------
//------------------------------------------------------------------
