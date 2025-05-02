fetch("haunted_objects_chart.json")
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  })
  .then(chartData => {
    Plotly.newPlot('chart', chartData.data, chartData.layout);
  })
  .catch(error => {
    document.getElementById("chart").innerHTML =
      `Error loading chart: ${error.message}<br>Please refresh the page or try again later.`;
    console.error("Chart loading error:", error);
  });
