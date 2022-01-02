import { ref } from "vue";
//import * as g2 from "@antv/g2";
import G2 from "@antv/g2";
import * as dp from "../Composition/delayPropagationGraphImpl.js";
import * as u from "../Composition/utils.js";

let chart = null;
const portrait = ref(true);
const chartPortrait = ref(true);

// Ideally, mountEndpointsG2Chart should be a parameter.

//--------------------------------------------------------
export function toggleChartOrientation(data) {
  chartPortrait.value = chartPortrait.value === true ? false : true;
  u.print("G2::toggleChartOrientation::delayObj", data);
  if (data) {
    console.log("G2::drawPortrait");
    drawPortraitChart(data);
  }
}

//--------------------------------------------------------
const chartConfiguration = dp.setupConfiguration({
  container: "mountEndpointsG2Chart",
  width: 1200,
  height: 900,
});

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
  const chart = new G2.Chart({
    container: "mountEndpointsG2Chart",
    width: 500,
    height: 500,
  });

  chart.data(data);
  chart
    .interval()
    .position("genre*sold")
    .color("genre");
  chart.render();
}

//--------------------------------------------------------
// THE FUNCTION IS NOT DISPLAYING TO THE SCREEN. WHY NOT? I CANNOT FIGURE THIS OUT!
function drawPortraitChart(data) {
  chart.destroy();
  chart = new G2.Chart({
    container: "mountEndpointsG2Chart",
    autoFit: true,
    width: 1200,
    height: 600,
  });
  chart.data(data);

  chart.coordinate().scale("fracFlightsDelayed", {
    nice: true,
  });

  chart
    .interval()
    .position("od*fracFlightsDelayed")
    .color("initArrDelay");

  chart.render();
}

//--------------------------------------------------------
function drawLandscapeChart(chart, data) {
  chart.data(data);

  chart
    .coordinate()
    .transpose()
    .scale(1, -1);

  chart.axis("value", {
    position: "right",
  });
  chart.axis("label", {
    label: {
      offset: 12,
    },
  });

  chart.tooltip({
    shared: true,
    showMarkers: false,
  });

  chart
    .interval()
    .position("label*value")
    .color("type")
    .adjust([
      {
        type: "dodge",
        marginRatio: 0,
      },
    ]);

  u.print("before render: chart", chart);
  chart.interaction("active-region");
  chart.render();
  u.print("after render: chart", chart);
}

//--------------------------------------------------------

//--------------------------------------------------------

//--------------------------------------------------------
