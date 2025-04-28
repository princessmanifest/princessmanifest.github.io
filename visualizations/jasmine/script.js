// Set up dimensions
const width = 975, height = 610;

// Create an SVG container
const svg = d3.select("#map-container")
  .append("svg")
  .attr("viewBox", [0, 0, width, height]);

// Tooltip setup
const tooltip = d3.select("#map-container")
  .append("div")
  .attr("class", "tooltip")
  .style("position", "absolute")
  .style("background", "#fff")
  .style("border", "1px solid #ccc")
  .style("padding", "5px")
  .style("border-radius", "4px")
  .style("visibility", "hidden");

// Dropdown setup
const dropdown = d3.select("#death-select");

// Main load
Promise.all([
  d3.json("data/counties-albers-10m.json"),
  d3.csv("data/data.csv")
]).then(([us, data]) => {
  const states = topojson.feature(us, us.objects.states).features;

  // Attach initial selectedDeathType
  let selectedDeathType = dropdown.property("value");

  // Draw the map once
  drawMap(states, data, selectedDeathType);

  // Dropdown listener
  dropdown.on("change", function () {
    selectedDeathType = this.value;
    updateMap(states, data, selectedDeathType);
  });
});

// Draw map function
function drawMap(states, data, selectedDeathType) {
  const path = d3.geoPath();

  svg.selectAll(".state")
    .data(states)
    .join("path")
    .attr("class", "state")
    .attr("d", path)
    .attr("fill", d => {
      const stateName = d.properties.name;
      const normalizedValue = data.find(row => row.state === stateName)?.[selectedDeathType];
      const colorScale = d3.scaleLinear()
        .domain([0, 1])
        .range(getColorRange(selectedDeathType));

      return normalizedValue ? colorScale(normalizedValue) : "#ccc";
    })
    .on("mouseover", (event, d) => {
  const stateName = d.properties.name;
  const row = data.find(row => row.state === stateName);

  // Map selected normalized column to its death rate column
  const deathRate = getDeathRate(row, selectedDeathType);

  tooltip.style("visibility", "visible")
    .text(`State: ${stateName}, Death Rate: ${deathRate ? deathRate.toFixed(1) : "N/A"} per 100k`);
})
    .on("mousemove", (event) => {
      tooltip.style("top", `${event.pageY + 10}px`)
        .style("left", `${event.pageX + 10}px`);
    })
    .on("mouseout", () => tooltip.style("visibility", "hidden"));
}

// Update map function
function updateMap(states, data, selectedDeathType) {
  const colorScale = d3.scaleLinear()
    .domain([0, 1])
    .range(getColorRange(selectedDeathType));

  svg.selectAll(".state")
    .transition()
    .duration(750)
    .attr("fill", d => {
      const stateName = d.properties.name;
      const normalizedValue = data.find(row => row.state === stateName)?.[selectedDeathType];
      return normalizedValue ? colorScale(normalizedValue) : "#ccc";
    });
}
//Helper function for deathr rate on mouseover
function getDeathRate(row, selectedDeathType) {
  if (!row) return null;

  switch (selectedDeathType) {
    case 'alzh_normalized':
      return parseFloat(row.alzh_death_rate);
    case 'overd_normalized':
      return parseFloat(row.overd_death_rate);
    case 'alc_normalized':
      return parseFloat(row['total deaths']); // Assuming this is alcohol-related deaths, otherwise adjust
    default:
      return null;
  }
}

// Helper function for color ranges
function getColorRange(deathType) {
  switch (deathType) {
    case 'alzh_normalized':
      return ["#e0e0e0", "#5a189a"]; // Alzheimer's
    case 'overd_normalized':
      return ["#e0e0e0", "#1f77b4"]; // Overdose
    case 'alc_normalized':
      return ["#e0e0e0", "#e07b00"]; // Alcohol Abuse
    default:
      return ["#e0e0e0", "#5a189a"];
  }
}
