fetch("haunted_objects_chart_grouped_by_type.json")
  .then((response) => {
    if (!response.ok) {
      throw new Error("Failed to load JSON");
    }
    return response.json();
  })
  .then((data) => {
    Plotly.newPlot("chart", data.data, data.layout, { responsive: true });
  })
  .catch((error) => {
    document.getElementById("chart").innerHTML =
      `<div class="error">Error loading chart: ${error.message}<br>Please refresh or check file name.</div>`;
    console.error("Chart load error:", error);
  });
