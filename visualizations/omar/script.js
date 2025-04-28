import * as topojson from "https://cdn.skypack.dev/topojson-client@3";

// --- Data Fetching ---
async function _jsonData() {
  const response = await fetch('/visualizations/omar/data/omar_json_data.json');
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

async function _us() {
  // Fetch US states TopoJSON data
  const response = await fetch('https://cdn.jsdelivr.net/npm/us-atlas@3/states-albers-10m.json');
  if (!response.ok) {
    throw new Error(`US map data fetch failed: ${response.status}`);
  }
  return await response.json();
}

// --- Data Processing ---

// Simple mapping from state abbreviation to FIPS code
function _stateAbbrToFips() {
  return {
    "AL": "01", "AK": "02", "AZ": "04", "AR": "05", "CA": "06", "CO": "08", "CT": "09", "DE": "10", "FL": "12", "GA": "13",
    "HI": "15", "ID": "16", "IL": "17", "IN": "18", "IA": "19", "KS": "20", "KY": "21", "LA": "22", "ME": "23", "MD": "24",
    "MA": "25", "MI": "26", "MN": "27", "MS": "28", "MO": "29", "MT": "30", "NE": "31", "NV": "32", "NH": "33", "NJ": "34",
    "NM": "35", "NY": "36", "NC": "37", "ND": "38", "OH": "39", "OK": "40", "OR": "41", "PA": "42", "RI": "44", "SC": "45",
    "SD": "46", "TN": "47", "TX": "48", "UT": "49", "VT": "50", "VA": "51", "WA": "53", "WV": "54", "WI": "55", "WY": "56",
    "DC": "11", "PR": "72"
  };
}

// Process the raw JSON data into a more useful format
// Output: Map<state_fips, { eventType1: count1, eventType2: count2, ..., total: totalCount, state_abbrev: 'XX' }>
function _processedData(jsonData, stateAbbrToFips) {
  const dataByState = new Map();
  const eventTypes = new Set();

  // Invert mapping for easy lookup
  const fipsToAbbr = Object.fromEntries(Object.entries(stateAbbrToFips).map(([k, v]) => [v, k]));

  for (const event of jsonData) {
    const eventType = event.eventType;
    eventTypes.add(eventType);
    for (const stateData of event.values) {
      const stateAbbrev = stateData.state_abbrev;
      const fips = stateAbbrToFips[stateAbbrev];
      if (!fips) {
        console.warn(`No FIPS code found for abbreviation: ${stateAbbrev}`);
        continue; // Skip if no FIPS mapping
      }

      if (!dataByState.has(fips)) {
        dataByState.set(fips, { total: 0, state_abbrev: stateAbbrev });
      }
      const stateEntry = dataByState.get(fips);
      stateEntry[eventType] = (stateEntry[eventType] || 0) + stateData.count;
      stateEntry.total += stateData.count;
    }
  }
  return { dataByState, eventTypes: Array.from(eventTypes).sort() };
}

// --- State Bar Chart Function ---
function _createStateBarChart(d3, stateData, eventTypes, stateName, containerSelector = "#state-barchart") {
  const container = d3.select(containerSelector);
  container.selectAll("*").remove(); // Clear previous chart

  if (!stateData) {
    container.append("p").text("No data available for this state.");
    return;
  }

  // Prepare data for bars: [{eventType: 'Murder', count: 10}, ...]
  const barData = eventTypes.map(type => ({
    eventType: type,
    count: stateData[type] || 0 // Default to 0 if event type not present for this state
  })).sort((a, b) => b.count - a.count); // Sort bars by count desc


  // Dimensions 
  const containerWidth = container.node().getBoundingClientRect().width;
  const width = containerWidth;
  const height = 220;
  const marginTop = 25;
  const marginRight = 15;
  const marginBottom = 90;
  const marginLeft = 35;

  // Scales
  const x = d3.scaleBand()
    .domain(barData.map(d => d.eventType))
    .range([marginLeft, width - marginRight])
    .padding(0.1);

  const y = d3.scaleLinear()
    .domain([0, d3.max(barData, d => d.count)]).nice()
    .range([height - marginBottom, marginTop]);

  // Define colors
   const customColors = [
    "#e41a1c", "#377eb8", "#4daf4a", "#984ea3", "#ff7f00",
    "#ffff33", "#a65628", "#f781bf", "#999999"
  ];
  const color = d3.scaleOrdinal()
    .domain(eventTypes) // Use all possible event types for consistent coloring
    .range(customColors.slice(0, eventTypes.length)); // Use subset of colors


  // SVG Container
  const svg = container.append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto; background: none;"); // Ensure no SVG background

  // Title (already white via CSS)
  svg.append("text")
      .attr("class", "chart-title")
      .attr("x", width / 2)
      .attr("y", marginTop / 2)
      .text(`Events in ${stateName}`);

  // Bars
  svg.append("g")
    .selectAll("rect")
    .data(barData)
    .join("rect")
      .attr("class", "bar")
      .attr("x", d => x(d.eventType))
      .attr("y", d => y(d.count))
      .attr("height", d => y(0) - y(d.count))
      .attr("width", x.bandwidth())
      .attr("fill", d => color(d.eventType))
      .append("title") 
         .text(d => `${d.eventType}: ${d.count.toLocaleString()}`);

  // X-axis (text color/size via CSS)
  svg.append("g")
      .attr("transform", `translate(0,${height - marginBottom})`)
      .call(d3.axisBottom(x).tickSizeOuter(0))
      .selectAll("text")
          .attr("transform", "rotate(-45)")
          .style("text-anchor", "end")
          .attr("dx", "-.8em")
          .attr("dy", ".25em"); 

  // Y-axis (text color/size via CSS)
  svg.append("g")
      .attr("transform", `translate(${marginLeft},0)`)
      .call(d3.axisLeft(y).ticks(4, "s")) 
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll(".tick line").clone()
          .attr("x2", width - marginLeft - marginRight)
          .attr("stroke-opacity", 0.1))
      .call(g => g.append("text")
          .attr("x", -marginLeft)
          .attr("y", 10)
          .attr("fill", "currentColor") 
          .attr("text-anchor", "start")
          .attr("font-size", "10px") 
          .text("Count"));
          

}


// --- Choropleth Map Chart ---
function _mapChart(d3, us, processedData, topojson) {
  const { dataByState, eventTypes } = processedData;

  // Dimensions
  const width = 975;
  const height = 610;

  // Map setup
  const path = d3.geoPath();
  const states = topojson.feature(us, us.objects.states);
  const fipsToName = new Map(states.features.map(d => [d.id, d.properties.name]));

  // Color scale
  const maxTotal = d3.max(Array.from(dataByState.values()), d => d.total);
  const baseColor = d3.scaleQuantize([0, maxTotal || 1], d3.schemeOranges[9]); 
  const defaultFillColor = "#444"; 

  // Keep track of the active state path
  let activeStatePath = null;

  // SVG Container
  const svg = d3.create("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "width: 100%; height: auto; background: none;");

  // State paths
  const statePaths = svg.append("g")
    .selectAll("path")
    .data(states.features)
    .join("path")
      .attr("class", "state")
      .attr("fill", d => { // Set initial orange color
          const stateInfo = dataByState.get(d.id);
          return stateInfo ? baseColor(stateInfo.total) : defaultFillColor;
      })
      .attr("d", path)
      .on("click", (event, d) => {
          const currentPath = d3.select(event.currentTarget);
          const currentStateId = d.id;
          if (activeStatePath && activeStatePath.datum().id !== currentStateId) {
              const previousStateId = activeStatePath.datum().id;
              const previousStateInfo = dataByState.get(previousStateId);
              const originalColor = previousStateInfo ? baseColor(previousStateInfo.total) : defaultFillColor;
              activeStatePath.attr("fill", originalColor).classed("active", false).classed("state-hover", false); 
          }
          currentPath.attr("fill", "red").classed("active", true).classed("state-hover", false); 
          activeStatePath = currentPath;
          const stateInfo = dataByState.get(currentStateId);
          const stateName = fipsToName.get(currentStateId) || "Unknown State";
          _createStateBarChart(d3, stateInfo, eventTypes, stateName);
      })
      .on("mouseover", function(event, d) {
          const currentPath = d3.select(this);
          // Add hover class only if not active
          if (!currentPath.classed("active")) {
              currentPath.classed("state-hover", true);
              currentPath.raise(); // Bring to front
          }
      })
      .on("mouseout", function(event, d) {
          // Always remove hover class on mouseout
          d3.select(this).classed("state-hover", false);
       });

   // Tooltips
   statePaths.append("title")
       .text(d => {
           const stateInfo = dataByState.get(d.id);
           const stateName = fipsToName.get(d.id);
           const total = stateInfo ? stateInfo.total : 0;
           return `${stateName}\nTotal Events: ${total.toLocaleString()}`;
       });

  // State borders overlay
  svg.append("path")
      .datum(topojson.mesh(us, us.objects.states, (a, b) => a !== b))
      .attr("fill", "none")
      .attr("stroke", "white") // Keep white borders between states
      .attr("stroke-linejoin", "round")
      .attr("d", path);

  // Initial bar chart and state highlight
  let maxStateFips = null;
  let maxStateTotal = -1;
  for (const [fips, data] of dataByState.entries()) {
      if (data.total > maxStateTotal) {
          maxStateTotal = data.total;
          maxStateFips = fips;
      }
  }
  if (maxStateFips) {
      const initialStateInfo = dataByState.get(maxStateFips);
      const initialStateName = fipsToName.get(maxStateFips);
      _createStateBarChart(d3, initialStateInfo, eventTypes, initialStateName);

      // Find and set the initial active path
      let initialActivePath = statePaths.filter(d => d.id === maxStateFips);
      if (!initialActivePath.empty()) {
          initialActivePath.attr("fill", "red").classed("active", true);
          activeStatePath = initialActivePath; // Set initial active state
      }
  } else {
     _createStateBarChart(d3, null, eventTypes, "");
  }

  return svg.node();
}


// --- Observable Definition ---
export default function define(runtime, observer) {
  const main = runtime.module();

  // Define dependencies first
  main.variable(observer()).define("topojson", topojson); // Make topojson library available
  main.variable(observer("d3")).define("d3", ["require"], require => require("d3@7")); // Ensure D3 v7

  // Data sources
  main.variable(observer("jsonData")).define("jsonData", _jsonData);
  main.variable(observer("us")).define("us", _us); // US map TopoJSON

  // Processed data
  main.variable(observer("stateAbbrToFips")).define("stateAbbrToFips", _stateAbbrToFips);
  main.variable(observer("processedData")).define("processedData", ["jsonData", "stateAbbrToFips"], _processedData);

  // Main map chart - remove createStateBarChart dependency
  main.variable(observer("mapChart")).define("mapChart", ["d3", "us", "processedData", "topojson"], _mapChart);

  return main;
}
