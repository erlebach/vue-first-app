import { ref } from "vue";
import * as ch from "chart.js";
// Not foundin documentation
//import { Chart, registerables } from 'chart.js'
//Chart.register(...registerables)
import Chart from 'chart.js/auto'
import * as dp from "../Composition/delayPropagationGraphImpl.js";
import * as u from "../Composition/utils.js";

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
  u.print("ctx: ", ctx)
  let config = {
    type: "bar",
  };
  chart = new ch.Chart(ctx, config);
}

//--------------------------------------------------------
// THE FUNCTION IS NOT DISPLAYING TO THE SCREEN. WHY NOT? I CANNOT FIGURE THIS OUT!
function drawPortraitChart(data) {
  if (chart) chart.destroy();
  //let ctx = document.getElementById('toggleChChartOrientation');
  //const ctx = "mountEndpointsChChart";
  const ctx = document.getElementById("mountEndpointsChChart");
  u.print("drawPortraitChart, ctx", ctx);
  u.print("data", data);
  let config = {
    type: "bar",
    data: {
      datasets: [
        {
          data: data,
        },
      ],
    },
  };
  chart = new Chart(ctx, config);
  u.print("chart", chart)
}
//--------------------------------------------------------
