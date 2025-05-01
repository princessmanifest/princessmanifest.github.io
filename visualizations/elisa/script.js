import { Plotly } from "https://cdn.plot.ly/plotly-2.26.0.min.js";

fetch("haunted_objects_chart.json")
  .then(response => response.json())
  .then(fig => {
    fig.layout.paper_bgcolor = 'rgba(0,0,0,0)';
    fig.layout.plot_bgcolor = 'rgba(0,0,0,0)';
    fig.layout.font = { color: 'white' };
    fig.layout.title = ''; // Optional, if title is already shown in HTML
    // fig.layout.yaxis.range = [0, 0.4]; // ❌ Remove or comment this out

    Plotly.newPlot("chart", fig.data, fig.layout, { responsive: true });
  })
  .catch(error => console.error("Error loading chart JSON:", error));

