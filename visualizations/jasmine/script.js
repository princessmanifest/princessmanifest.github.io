d3.json("data/counties-albers-10m.json").then(us => {
  console.log("Loaded TopoJSON:", us),
  console.log("TopoJSON structure:", us.objects.states.geometries),
  console.log("Loaded TopoJSON States Object:", us.objects.states.geometries);
});

// Set up dimensions
const width = 975, height = 610;

// Create an SVG container
const svg = d3.select("#map-container")
  .append("svg")
  .attr("viewBox", [0, 0, width, height]);

// Define a color scale
const colorScale = d3.scaleSequential(d3.interpolateBlues)
  .domain([10, 50]); // Adjust the domain based on your data range

// Load data and map
Promise.all([
  d3.json("data/counties-albers-10m.json"),
  d3.csv("data/data.csv")
]).then(([us, data]) => {
  console.log("TopoJSON and Data Loaded:", us, data),
  console.log("TopoJSON structure:", us.objects.states.geometries),
  console.log("Loaded TopoJSON States Object:", us.objects.states.geometries);
  drawMap(us, data);
});

function drawMap(us, data) {
  const svg = d3.select("svg");
  const path = d3.geoPath();

  // Render the U.S. map
  svg.append("g")
    .selectAll("path")
    .data(topojson.feature(us, us.objects.states).features)
    .join("path")
    // .attr("fill", "#ccc")
    // .attr("stroke", "#333")
    .attr("fill", d => {
        const stateName = d.properties.name; // Full state name from TopoJSON
        const rate = data.find(row => row.state === stateName)?.alzh_death_rate;
        return rate ? colorScale(rate) : "#ccc"; // Use colorScale or default color
    })
    .attr("d", path);
}

d3.csv("data/data.csv").then(data => {
  // Log the entire dataset to inspect its structure
  console.log("Loaded data:", data);

  // Log a subset of the data (e.g., the first few rows)
  console.log("Subset of data:", data.slice(0, 5));

  // Log specific columns for verification
  data.forEach(d => {
    console.log(`State: ${d.state}, Alzheimer's Death Rate: ${d.alzh_death_rate}`);
  });
});

