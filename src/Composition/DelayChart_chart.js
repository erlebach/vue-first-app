import * as d3 from "d3"; // "https://cdn.skypack.dev/d3@7";
//import { groupBy, flow, pairs, map, value } from "lodash";
import * as _ from "lodash";
import { ref } from "vue";
import * as ch from "chart.js";
import Chart from "chart.js/auto";
// import * as dp from "../Composition/delayPropagationGraphImpl.js";
import * as u from "../Composition/utils.js";
// import { objectToString } from "@vue/shared";
// import { values } from "core-js/core/array";

let chart = null;
const portrait = ref(true);
const chartPortrait = ref(true);

//--------------------------------------------------------
export function toggleChartOrientation(data) {
  chartPortrait.value = chartPortrait.value === true ? false : true;
  u.print("Chart.js::toggleChartOrientation::delayObj", data);
  if (data) {
    console.log("Chart.js::drawPortrait");
    drawPortraitChart(data);
  }
}

//--------------------------------------------------------
//--------------------------------------------------------
// NOT DISPLAYING
export function initializeChart() {
  // Data from https://github.com/liximomo/g2
  const data = [
    { genre: "Sports", sold: 275 },
    { genre: "Strategy", sold: 1150 },
    { genre: "Action", sold: 120 },
    { genre: "Shooter", sold: 350 },
    { genre: "Other", sold: 150 },
  ];
  console.log("chart::initializeChart");
  //  const ctx = 'mountEndpointsChChart';
  const ctx = document.getElementById("mountEndpointsChChart");
  u.print("ctx: ", ctx);
  let config = {
    type: "bar",
  };
  chart = new ch.Chart(ctx, config);
}

//--------------------------------------------------------
// Transformed to work with grouped charts
// Each od pair is a single dataset
function transformDataOld(data) {
  let newData = { labels: [], datasets: [] };
  let datasets = newData.datasets;
  newData.labels = [30, 45, 60]; // 3 bars per group
  const set = new Set(); // to get a unique set of od pairs
  data.forEach((r) => {
    set.add(r.od);
  });
  set.forEach((od) => {
    datasets.push({ od: od, values: [], data: [] });
  });
  datasets = u.createMapping(datasets, "od");

  data.forEach((r) => {
    datasets[r.od].data.push({
      initArrDelay: r.initArrDelay,
      fracFlightsDelayed: r.fracFlightsDelayed,
    });
    datasets[r.od].values.push(r.fracFlightsDelayed);
  });
  return newData;
}
//--------------------------------------------------------
// Transformed to work with grouped charts
// Each od pair is a single dataset
function transformData(data) {
  const yyy = _.groupBy(data, (x) => x.od);
  u.print("yyy", yyy);
  const fct = _.flow(_.groupBy((x) => x.od)); // (data);
  u.print("fct", fct);
  const xxx = fct(data);

  u.print("xxx", xxx);
  let newData = { labels: [], datasets: [] };
  const ods = new Set(); // to get a unique set of od pairs
  data.forEach((r) => {
    ods.add(r.od);
  });
  newData.labels = [...ods];

  datasets = u.createMapping(datasets, "od");
  let datasets = newData.datasets;
  newData.labels = [30, 45, 60]; // 3 bars per group

  data.forEach((r) => {
    datasets[r.od].data.push({
      initArrDelay: r.initArrDelay,
      fracFlightsDelayed: r.fracFlightsDelayed,
    });
    datasets[r.od].values.push(r.fracFlightsDelayed);
  });
  return newData;
}
//--------------------------------------------------------
function newTransformData(myData, xAttr, yAttr, groupAttr) {
  // create the labels as group ids
  const bdelays = d3.group(myData, (x) => x[groupAttr]); // map
  const b = d3.group(myData, (x) => x[xAttr]); // map
  const labels = _.sortBy([...b.keys()]);
  const datasets = [];

  // each Dataset corresponds to an arrival delay.
  bdelays.forEach((r) => {
    const s = _.sortBy(r, xAttr);
    const t = s.map((x) => x[yAttr]);
    const t1 = s.map((x) => x[groupAttr]);
    datasets.push({ label: t1[0], data: t });
  });
  const data = { datasets, labels };
  return data;
}
//--------------------------------------------------------
// I get x and y axis, no data
function drawPortraitChart(myData) {
  if (chart) chart.destroy();
  // u.print("before newTransformData, myData", myData);
  //let newData = newTransformData(myData);
  let newData = newTransformData(
    myData,
    "id",
    "fracFlightsDelayed",
    "initArrDelay"
  );
  newData.datasets[0].backgroundColor = "lightgreen";
  newData.datasets[1].backgroundColor = "lightred";
  newData.datasets[2].backgroundColor = "red";
  // u.print("newData", newData);
  // newData.datasets = u.createMapping(newData.datasets, "od");
  // delete newData.datasets["CUN-PTY"]; // 6 entries
  // delete newData.datasets["PUJ-PTY"]; // 6 entries
  // delete newData.datasets["BOG-PTY"]; // 6 entries
  // const n = [];
  // Object.values(newData.datasets).forEach((v) => {
  // n.push(v);
  // });
  // newData.datasets = n;

  // newData.datasets.forEach((r) => {
  // r.label = r.od;
  // delete r.od;
  // });

  const ctx = document.getElementById("mountEndpointsChChart");
  u.print("drawPortraitChart, ctx", ctx);
  u.print("newData", newData);
  let options = {
    plugins: {
      title: {
        display: true,
        text: "Chart.js Title",
      },
    },
  };
  let data = newData;
  // data.datasets.parsing = {
  //   xAxisKey: "labels",
  //   yAxiskey: "values", //"fracFlightsDelayed",
  // };
  // u.print("data", data);

  let config = {
    type: "bar",
    options: options,
    data: data,
  };
  chart = new Chart(ctx, config);
  u.print("chart", chart);
}
//--------------------------------------------------------
