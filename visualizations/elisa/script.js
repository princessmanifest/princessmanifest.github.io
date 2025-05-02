document.addEventListener('DOMContentLoaded', function() {
    // Show loading indicator or message
    document.getElementById('chart').innerHTML = '<div style="color:white;text-align:center;padding-top:300px;">Loading chart...</div>';
    
    fetch('haunted_objects_chart.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(fig => {
            Plotly.newPlot('chart', fig.data, fig.layout);
        })
        .catch(error => {
            console.error('Error loading chart:', error);
            document.getElementById('chart').innerHTML = 
                `<div style="color:white;text-align:center;padding-top:300px;">
                    Error loading chart: ${error.message}<br>
                    Please refresh the page or try again later.
                </div>`;
        });
});

