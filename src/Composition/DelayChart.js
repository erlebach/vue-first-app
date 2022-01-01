import { ref } from "vue";
import * as g2p from "@antv/g2plot";
import * as dp from "../Composition/delayPropagationGraphImpl.js";
import * as u from "../Composition/utils.js";

let chart = null;
const portrait = ref(true);
const chartPortrait = ref(true);

//--------------------------------------------------------
export function toggleChartOrientation(delayObj) {
  chartPortrait.value = chartPortrait.value === true ? false : true;
  if (delayObj) {
    drawDelayChart(delayObj);
  }
}

//--------------------------------------------------------
const chartConfiguration = dp.setupConfiguration({
  container: "mountEndpointsChart",
  width: 1200,
  height: 900,
});

//--------------------------------------------------------
// function initializeChart(data) {
export function initializeChart() {
  // Does not work with autoFit=true
  if (chartPortrait.value === true) {
    chart = new g2p.Column("mountEndpointsChart", { autoFit: true });
  } else {
    chart = new g2p.Bar("mountEndpointsChart", { autoFit: true });
  }
}

//--------------------------------------------------------
const _chartPortrait = {
  xField: "od",
  yField: "fracFlightsDelayed",
  groupField: "initArrDelay",
  seriesField: "initArrDelay",
  isGroup: "true", // not clear what isGroup does
  label: {
    visible: true,
    position: "top",
  },
  title: {
    visible: true,
    text: "This is the title",
  },
  legend: {
    position: "top-left",
  },
  xAxis: {
    label: {
      autorotate: false,
      offset: 50,
      rotate: 45,
      style: {
        fontSize: 18,
      },
    },
  },
  columnStyle: {
    radius: [20, 20, 0, 0],
  },
};

//--------------------------------------------------------
const _chartLandscape = {
  yField: "od",
  xField: "fracFlightsDelayed",
  seriesField: "initArrDelay",
  isGroup: "true", // not clear what isGroup does
  label: {
    visible: true,
    position: "right",
  },
  title: {
    visible: true,
    text: "This is the title",
  },
  legend: {
    position: "top-left",
  },
  xAxis: {
    label: {
      autorotate: false,
      offset: 50,
      rotate: 45,
      style: {
        fontSize: 18,
      },
    },
  },
  columnStyle: {
    radius: [20, 20, 0, 0],
  },
};
//--------------------------------------------------------
export function drawDelayChart(data) {
  console.log("==> drawDelayChart");
  data.forEach((r) => {
    r.od = r.id.slice(10, 13) + "-" + r.id.slice(13, 16);
  });
  // destroy all resources
  if (chart) chart.destroy();
  if (chartPortrait.value === true) {
    chart = new g2p.Column("mountEndpointsChart", { autoFit: true });
    console.log("chart => portrait");
    u.print("data", data);
    u.print("_chartPortrait", _chartPortrait);
    chart.update({ data });
    chart.update(_chartPortrait);
  } else {
    chart = new g2p.Bar("mountEndpointsChart", { autoFit: true });
    console.log("chart => landscape");
    chart.update({ data });
    chart.update(_chartLandscape);
  }
}

//--------------------------------------------------------
