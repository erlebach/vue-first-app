export function setupState(graph) {
  // Mouse enter a node
  graph.on("node:mouseenter", (e) => {
    // console.log("mouse enter");
    const nodeItem = e.item; // Get the target item
    graph.hoverItemId = nodeItem._cfg.id; // new element to access from main module
    // console.log("enable hoverItemId");
    // console.log(graph.hoverItemId);
    graph.setItemState(nodeItem, "hover", true); // Set the state 'hover' of the item to be true
  });

  // Mouse leave a node
  graph.on("node:mouseleave", (e) => {
    const nodeItem = e.item; // Get the target item
    graph.hoverItemId = null;
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
}