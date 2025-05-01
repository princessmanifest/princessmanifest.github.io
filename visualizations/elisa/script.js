import { Plotly } from "https://cdn.plot.ly/plotly-2.26.0.min.js";

fetch("haunted_objects_chart.json")
  .then(response => response.json())
  .then(fig => {
    // Force white font and dark background if not already applied in Python
    fig.layout.paper_bgcolor = 'rgba(0,0,0,0)';
    fig.layout.plot_bgcolor = 'rgba(0,0,0,0)';
    fig.layout.font = { color: 'white' };
    fig.layout.title = '';  // Remove duplicate title
    fig.layout.yaxis = fig.layout.yaxis || {};
    fig.layout.yaxis.range = [0, 0.4]; // Fix Y-axis scale

    Plotly.newPlot("chart", fig.data, fig.layout, { responsive: true });
  })
  .catch(error => console.error("Error loading chart JSON:", error));
