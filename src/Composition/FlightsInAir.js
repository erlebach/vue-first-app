import * as u from "./utils.js";
import * as d from "./dates.js";
import store from "../store/index.js";
//import hash from "object-hash";

/** @param {yyyy-mm-dd} curDay
 *  @param {hh-mm} curTime Time of analysis
 *  @param {int} minDelay in minutes, Keep flights with departure delay greater than minDelay
 *  @param {int} timeShift: keep flights on the grounds departing within
 *     timeShift of curTime
 */
export function flightsInAir(nodes, curDay, curTime, minDelay, timeShift = 8) {
  // console.log("inside flightsInAir");
  // u.print("curTime", curTime);
  // u.print("data", nodes);
  //d.testTimeMethods();
  const ns2ms = 1e-6;
  const hr2ms = 3600 * 1000;
  const min2ms = 60 * 1000;

  //u.print("hash nodes[0:3]", hash(nodes.slice(0,1)));
  //u.print("enter hash(nodes)", hash(nodes));

  const curZ = d.datetimeZToTimestamp(curDay, curTime);
  //u.print("curZ", curZ);
  const flights = [];

  // FIGURE OUT WHY THERE ARE NO DEPARTED FLIGHTS!! SOMETHING WRONG.

  const sumobj = {
    hasNotArrived: 0,
    hasDeparted: 0,
    inFlight: 0,
    notDeparted: 0,
    depDelayed: 0,
  };
  const arr = [];

  nodes.forEach((n) => {
    // ETA and ETD are not defined
    //const n = node.getModel(); // only use model if working on a graph

    // In reality, the delay is computed from ETA and ETD, not the other way
    // around
    const arrDelay = n.arrDelay; // in minutes
    const depDelay = n.depDelay; // in minutes
    const flight = n.id.slice(21); // in minutes
    const STD = n.schDepZ * ns2ms;
    const STA = n.schArrZ * ns2ms;
    const ETD = STD + depDelay * min2ms; // change to a time-dependent value eventually
    const ETA = STA + arrDelay * min2ms; // change to a time-dependent value
    const hasNotArrived = curZ - ETA < 0;
    const hasDeparted = ETD - curZ < 0;
    // only consider non-departed flights in timeshift-hour window
    const hasNotDeparted = 0 < ETD - curZ && ETD - curZ < timeShift * hr2ms;
    let inFlight = hasDeparted && hasNotArrived;
    const depDelayed = n.depDelay > minDelay;
    const keep = (inFlight || hasNotDeparted) && depDelayed;
    const arrStatus = arrDelay > 0 ? "LATE" : "EARLY";
    const O = n.id.slice(10, 13);
    const D = n.id.slice(13, 16);
    const id = n.id;
    const tail = n.tail;
    const rotAvail = n.rot_avail;
    const rotPlanned = n.rot_planned;
    const rotReal = n.rot_real;
    const schDepZ = d.timestampToDateTimeZ(n.schDepZ * ns2ms).tmz;
    const schArrZ = d.timestampToDateTimeZ(n.schArrZ * ns2ms).tmz;

    // Include color information for the following fields:
    // depDelay, arrDelay, arrStatus
    let depDelayColor;
    let arrDelayColor;
    let arrStatusColor;

    arrStatusColor = arrStatus === "LATE" ? "red" : "green";

    if (arrDelay < 0) {
      arrDelayColor = "green";
    } else if (arrDelay < 15) {
      arrDelayColor = "orange";
    } else if (arrDelay < 30) {
      arrDelayColor = "red";
    } else if (arrDelay < 45) {
      arrDelayColor = "brown";
    }

    if (depDelay < 0) {
      depDelayColor = "green";
    } else if (depDelay < 15) {
      depDelayColor = "orange";
    } else if (depDelay < 30) {
      depDelayColor = "red";
    } else if (depDelay < 45) {
      depDelayColor = "brown";
    }

    const obj = {
      id,
      O,
      D,
      tail,
      STD,
      STA,
      ETA,
      ETD,
      flight,
      depDelay,
      arrDelay,
      hasNotArrived,
      hasDeparted,
      hasNotDeparted,
      inFlight: inFlight === false ? "AIR" : "GROUND",
      depDelayed,
      keep,
      arrStatus,
      schDepZ,
      schArrZ,
      arrStatusColor,
      arrDelayColor,
      depDelayColor,
      rotAvail,
      rotPlanned,
      rotReal,
    };
    flights.push(obj);

    // Only keep non-departed flights within x hours of the current time

    sumobj.hasNotArrived += hasNotArrived;
    sumobj.hasDeparted += hasDeparted;
    sumobj.hasNotDeparted += hasNotDeparted;
    sumobj.inFlight += inFlight;
    sumobj.depDelayed += depDelayed;
    sumobj.keep += keep;

    arr.push({
      id: n.id,
      inFlight: obj.inFlight,
      depDelayed: obj.depDelayed,
      hasNotDeparted: obj.hasNotDeparted,
      hasDeparted: obj.hasDeparted,
      keep: obj.keep,
    });
    //return (inFlight || notDeparted) && depDelayed;
  });

  const keptFlights = [];

  flights.forEach((n) => {
    if (n.keep) {
      keptFlights.push(n);
    }
  });

  // u.print("All departed flights: ", flights);
  // u.print("nb flights: ", flights.length);
  // u.print("arr: ", arr);
  // u.print("keptFlights: ", keptFlights);
  // u.print(">>>> sumobj: ", sumobj);

  //const filter = (obj, predicate) =>
  //Object.fromEntries(Object.entries(obj).filter(predicate));

  // graph not defined yet
  //return graph.findAll("node", fct);

  //u.print("exit hash(nodes)", hash(nodes));
  return { keptFlights };
}
//----------------------------------------------
