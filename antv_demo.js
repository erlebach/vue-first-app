import G6 from "@antv/g6";

function convertData() {
  const nodes = [{ id: "1" }, { id: "2" }, { id: "3" }, { id: "4" }];
  const edges = [
    { source: "1", target: "2" },
    { source: "3", target: "4" },
  ];
  const new_data = {
    nodes: nodes,
    edges: edges,
  };
  return new_data;
}

const setupConfiguration = () => {
  const graph = new G6.Graph({
    defaultNode: {
      size: 50,
      // selection of rects works. Circles have a halo around them. WHY?
      type: "rect",
      style: {
        fill: "steelBlue",
        stroke: "#666",
        lineWidth: 0.2,
      },
      labelCfg: {
        style: {
          fill: "#fff",
        },
      },
    },
    defaultEdge: {
      type: "line",
      style: {
        stroke: "orange",
        lineWidth: 5,
      },
    },
    labelCfg: {
      autoRotate: true,
    },
    nodeStateStyles: {
      hover: {
        fill: "red",
      },
    },
    edgeStateStyles: {
      hover: {
        stroke: "blue",
        lineWidth: 1.5,
      },
    },
    container: "mountNode",
    width: 800,
    height: 500,
    autofit: true,
    fitView: true,
  });
  return graph;
};

const graph = setupConfiguration();

// Mouse enter a node
graph.on("node:mouseenter", (e) => {
  const nodeItem = e.item; // Get the target item
  graph.setItemState(nodeItem, "hover", true); // Set the state 'hover' of the item to be true
});

// Mouse leave a node
graph.on("node:mouseleave", (e) => {
  const nodeItem = e.item; // Get the target item
  graph.setItemState(nodeItem, "hover", false); // Set the state 'hover' of the item to be false
});

graph.on("edge:mouseenter", (e) => {
  const edgeItem = e.item;
  graph.setItemState(edgeItem, "hover", true);
});

// Mouse leave an edge
graph.on("edge:mouseleave", (e) => {
  const edgeItem = e.item;
  graph.setItemState(edgeItem, "hover", false);
});

// Render
const data = convertData();

graph.data(data); // Read the data source in Step 2 to the graph
graph.render();

