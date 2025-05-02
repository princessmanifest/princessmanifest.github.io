document.addEventListener('DOMContentLoaded', function() {
    const chartDivId = 'plotlyChartElisa';
    const chartDiv = document.getElementById(chartDivId);
    const dataPath = 'visualizations/elisa/data/haunted_objects_chart.json';

    if (!chartDiv) {
        console.error(`Error: Chart container with ID '${chartDivId}' not found.`);
        return;
    }
    chartDiv.innerHTML = '<div style="color: #e6e6e6; text-align:center; padding-top: 50px;">Loading and processing data...</div>';

    // --- Helper Functions ---
    function extract_primary_object(text) {
        if (text === null || text === undefined || typeof text !== 'string') return null;
        const objects = text.split(';');
        if (!objects || objects.length === 0) return null;
        const first_object = objects[0].trim();
        const match = first_object.match(/^([a-zA-Z0-9 \-']+)/);
        if (match && match[1]) {
            return match[1].split(',')[0].trim();
        }
        return null;
    }

    function categorize_object(obj) {
        if (obj === null || obj === undefined) return "other";
        const name = obj.toLowerCase();
        if ([ "hat", "shirt", "sandal", "gown", "helmet", "jacket", "suit", "clothing"].some(k => name.includes(k))) return "clothing";
        if ([ "gun", "rifle", "pistol", "six-gun", "weapon", "revolver", "knife"].some(k => name.includes(k))) return "weapon";
        if ([ "dog", "cat", "beaver", "cow", "horse", "animal"].some(k => name.includes(k))) return "animal";
        if ([ "computer", "keyboard", "monitor", "screen", "laptop", "projector"].some(k => name.includes(k))) return "electronics";
        if ([ "phone", "cellphone", "telephone"].some(k => name.includes(k))) return "communication";
        if ([ "hammer", "tool", "wrench", "saw", "drill", "plow"].some(k => name.includes(k))) return "tool";
        if ([ "bathtub", "sink", "shower", "tub"].some(k => name.includes(k))) return "bathroom fixture";
        if ([ "mailbox", "post", "fence", "door"].some(k => name.includes(k))) return "infrastructure";
        if ([ "mask", "gasmask", "helmet", "respirator"].some(k => name.includes(k))) return "protective gear";
        if ([ "book", "paper", "teller", "board", "pad", "sharpen", "notebook"].some(k => name.includes(k))) return "stationery";
        return "other";
    }

    // --- Main Data Fetching and Processing ---
    fetch(dataPath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status} fetching ${dataPath}`);
            }
            return response.json();
        })
        .then(data => {
            // Assuming data is an array of objects {detected_objects: "...", "Haunted Score": ... , ...}
            if (!Array.isArray(data)) {
                throw new Error('Fetched data is not an array as expected.');
            }

            chartDiv.innerHTML = '<div style="color: #e6e6e6; text-align:center; padding-top: 50px;">Processing data...</div>';

            // 1. Add primary_object and object_type
            const processedData = data.map(item => {
                const primary_object = extract_primary_object(item.detected_objects);
                const object_type = categorize_object(primary_object);
                return { ...item, primary_object, object_type };
            }).filter(item => item.primary_object !== null); // Filter out items where primary object couldn't be extracted

            // 2. Group and Aggregate (JavaScript equivalent of pandas groupby.agg)
            const groupedMap = new Map();
            processedData.forEach(item => {
                const key = `${item.primary_object}___${item.object_type}`; // Composite key
                if (!groupedMap.has(key)) {
                    groupedMap.set(key, { primary_object: item.primary_object, object_type: item.object_type, scores: [], count: 0 });
                }
                const group = groupedMap.get(key);
                // Ensure 'Haunted Score' exists and is a number
                const score = parseFloat(item['Haunted Score']);
                if (!isNaN(score)) {
                     group.scores.push(score);
                }
                group.count += 1;
            });

            let aggregatedData = Array.from(groupedMap.values()).map(group => ({
                primary_object: group.primary_object,
                object_type: group.object_type,
                "Haunted Score": group.scores.length > 0 ? group.scores.reduce((a, b) => a + b, 0) / group.scores.length : 0, // Calculate mean
                object_count: group.count
            }));

            // 3. Sort by Haunted Score descending
            aggregatedData.sort((a, b) => b["Haunted Score"] - a["Haunted Score"]);

            // 4. Prepare Plotly Data and Layout (mimicking px.bar)
            const traces = [];
            const uniqueTypes = [...new Set(aggregatedData.map(item => item.object_type))];

            uniqueTypes.forEach(type => {
                const typeData = aggregatedData.filter(item => item.object_type === type);
                traces.push({
                    type: 'bar',
                    name: type, // Legend entry
                    x: typeData.map(item => item.primary_object),
                    y: typeData.map(item => item["Haunted Score"]),
                    customdata: typeData.map(item => ({ object_type: item.object_type, object_count: item.object_count })), // For hover
                    hovertemplate: 
                        '<b>%{x}</b><br>' +
                        'Avg. Haunted Score: %{y:.2f}<br>' +
                        'Object Type: %{customdata.object_type}<br>' +
                        'Object Count: %{customdata.object_count}<extra></extra>',
                    
                });
            });

            const layout = {
                title: 'Average Haunted Score by Primary Object (Colored by Object Type)',
                xaxis: {
                    title: 'Primary Detected Object',
                    tickangle: -45,
                    color: '#e6e6e6'
                },
                yaxis: {
                    title: 'Average Haunted Score',
                    color: '#e6e6e6'
                },
                height: 750,
                margin: { l: 40, r: 40, t: 60, b: 180 },
                barmode: 'stack',
                hovermode: 'closest',
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)',
                legend: {
                    font: {
                        color: '#e6e6e6'
                    }
                },
                titlefont: {
                    color: '#e6e6e6'
                },
                autosize: true
            };

            Plotly.newPlot(chartDivId, traces, layout, {responsive: true});

        })
        .catch(error => {
            console.error('Error processing data or rendering chart:', error);
            chartDiv.innerHTML = 
                `<div style="color: #f05454; text-align:center; padding: 20px;">
                    <strong>Error processing data or rendering chart:</strong> ${error.message}<br>
                    Please check the data file format and the browser console for details.
                    Path tried: ${dataPath}
                </div>`;
        });

    window.addEventListener('resize', () => {
        if (document.getElementById(chartDivId)) {
            Plotly.Plots.resize(chartDivId);
        }
    });
});
