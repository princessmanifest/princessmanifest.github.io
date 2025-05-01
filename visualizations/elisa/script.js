fetch('haunted_objects_chart.json')
  .then(response => response.json())
  .then(fig => {
    Plotly.newPlot('chart', fig.data, fig.layout);
  })
  .catch(error => {
    console.error('Error loading the chart JSON:', error);
  });
