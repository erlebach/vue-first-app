import { ref } from "vue";
import * as g2 from "@antv/g2";
import * as dp from "../Composition/delayPropagationGraphImpl.js";
import * as u from "../Composition/utils.js";

let chart = null;
const portrait = ref(true);
const chartPortrait = ref(true);

// Ideally, mountEndpointsG2Chart should be a parameter.

//--------------------------------------------------------
export function toggleChartOrientation(delayObj) {
  chartPortrait.value = chartPortrait.value === true ? false : true;
  u.print("G2::toggleChartOrientation::delayObj", delayObj);
  if (delayObj) {
    console.log("G2::drawPortrait");
    drawPortraitChart(chart, delayObj);
  }
}

//--------------------------------------------------------
const chartConfiguration = dp.setupConfiguration({
  container: "mountEndpointsG2Chart",
  width: 1200,
  height: 900,
});

//--------------------------------------------------------
export function initializeChart() {
  chart = new g2.Chart({
    container: "mountEndpointsG2Chart",
    autoFit: true,
    height: 500,
  });
  return chart;
}

//--------------------------------------------------------
function drawPortraitChart(chart, data) {
  chart.data(data);

  chart.coordinate().scale("od", {
    nice: true,
  });

  chart.tooltip({
    shared: true,
    showMarkers: true,
  });

  chart
    .interval()
    .position("od*fracFlightsDelayed")
    .color("initArrDelay")
    .adjust([
      {
        //type: "dodge",
        marginRatio: 0,
      },
    ]);
  chart.axis("od", {
    position: "bottom",
  });
  chart.axis("fracFlightsDelayed", {
    position: "left",
  });

  //chart.interaction("active-region");
  u.print("chart.render, G2");
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

  chart.interaction("active-region");
  chart.render();
}

//--------------------------------------------------------

//--------------------------------------------------------

//--------------------------------------------------------
