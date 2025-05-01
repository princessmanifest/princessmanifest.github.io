// Load Plotly
import { Plotly } from "https://cdn.plot.ly/plotly-2.26.0.min.js";

// Load the chart JSON and render it
fetch("haunted_objects_chart.json")
  .then(response => response.json())
  .then(fig => {
    // Ensure text and layout matches dark theme
    fig.layout.paper_bgcolor = 'rgba(0,0,0,0)';
    fig.layout.plot_bgcolor = 'rgba(0,0,0,0)';
    fig.layout.font = { color: "white" };

    Plotly.newPlot("chart", fig.data, fig.layout, { responsive: true });
  })
  .catch(error => console.error("Error loading chart JSON:", error));
