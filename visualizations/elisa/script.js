fetch('haunted_objects_chart.json')
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    Plotly.newPlot('bar-chart', data.data, data.layout, {responsive: true});
  })
  .catch(error => {
    console.error('Error loading chart:', error);
    const chartContainer = document.getElementById('bar-chart');
    chartContainer.innerHTML = `<p style="color:white">Error loading chart: ${error.message}<br>Please check the JSON file path or format.</p>`;
  });


