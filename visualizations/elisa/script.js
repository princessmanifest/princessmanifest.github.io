import { Plotly } from "https://cdn.plot.ly/plotly-2.26.0.min.js";

// Fetch the chart JSON and render it
fetch("haunted_objects_chart.json")
  .then(response => response.json())
  .then(fig => {
    Plotly.newPlot("chart", fig.data, fig.layout, { responsive: true });
  })
  .catch(error => console.error("Error loading chart JSON:", error));

