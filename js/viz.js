function love_you() {
    const TYLER_IS_THE_BEST = true;
    for (let i = 0; i < 3; i++) {
        console.log("Heidi! is l o v e l y and " + TYLER_IS_THE_BEST);
    }

}

const svg = d3.select("#vis");
const xscale = d3.scaleLinear().domain([0, 6]).range([0, 400]);
const yscale = d3.scaleLinear().domain([0, 6]).range([400, 0]);

const COLORS = [
    '#1F77B4', '#FF7F0E', '#2CA02C', '#D62728', '#9467BD',
    '#8C564B', '#CFECF9', '#7F7F7F', '#BCBD22', '#17BECF'
]; // Tableau-10

function squaredDist(a, b) {
    return Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2);
}

function getRandInt(min, max) {
    // Includes min and max.
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandFloat(min, max) {
    // Includes min and max.
    return Math.random() * (max - min + 1) + min;
}


const NUM_POINTS = 10;


function main() {
    const pointData = createRandomPoints();
    drawLines(pointData);
    drawPoints(pointData);

}


function createRandomPoints() {
    let pointData = [];
    for (let i = 0; i < NUM_POINTS; i++) {
        const newPoint = {
            x: getRandFloat(1, 9),
            y: getRandFloat(-5, 4),
            color: COLORS[getRandInt(0, COLORS.length - 1)],
            id: i,
        }
        pointData.push(newPoint);
    }
    return pointData;
}

/*
Point data looks like:
[
    {x: 5, y: 10, id: 10},
    {x: 5, y: 69, id: 69},
    {x: 5, y: 69, id: 10},
    {x: 565, y: 10, id: 10},
    {x: 5, y: 10, id: 432},

]

*/


function drawLines(pointData) {
    // This is a List of pairs. TODO
    let allPointPairs = d3.cross(pointData, pointData).filter(z => z[0].id < 1);
    // allPointPairs = [
    //     [{x: 5, y: 1, id: 432}, {x: 5, y: 1, id: 432}],
    //     [{x: 5, y: 1, id: 432}, {x: 5, y: 1, id: 432}]
    // ];
    svg.selectAll(".lines").data(allPointPairs, d => d.id).join(
        enter => enter.append("line")
            .attr("class", "lines")
            .attr("stroke", "black")
            .attr("strokewidth", 5)
            .attr("x1", d => xscale(d[0].x))
            .attr("y1", d => yscale(d[0].y))
            .attr("x2", d => xscale(d[1].x))
            .attr("y2", d => yscale(d[1].y))
    );
}


function drawPoints(pointData) {
    const DOTSIZE = 10;

    // .join() is the best way I've found to use d3. The first line uses selectAll(), which
    // finds all of the elements on the page with class "points". If there are none, it creates them.

    // .data() allows you to input the graph data. Easiest way is a List of dicts.
    // d => d.id maps each newly created element to an id so that it updates rather than rerenders.
    svg.selectAll(".points").data(pointData, d => d.id).join(
        enter => {
            // enter is like a context - this is the element(s) that is about to be added to the page.
            // you can add attributes very simliar to HTML ones.
            enter.append("circle")
            .attr("id", d => "circle" + d.id)
            .attr("class", "points") // Make sure this matches the selectAll().
            .style("fill", d => d.color)
            .attr("cx", d => xscale(d.x))  // Make sure you scale all distances correctly.
            .attr("cy", d => yscale(d.y))
            .attr("r", DOTSIZE) // All of these functions come with a callback function that is the row of data it is processing, e.g. {x: 5, y: 10, id: 10}

            // You can also do onClick handling stuffs.
            .on("click", d => {
                // DO stuff!
                console.log("Hi", d);
            })

            .on("mouseover", function(_) {
                // Needs to be a function to have access to "this".
                d3.select(this).style("fill", COLORS[0]);
            })
            .on("mouseout", function(_) {
                // Needs to be a function to have access to "this".
                d3.select(this).style("fill", d => d.color);
            });
            enter.append("text")
                .attr("class", d => "label" + d.id)
                .style("text-anchor", "middle")
                .attr("x", d => xscale(d.x) + 20)
                .attr("y", d => yscale(d.y) + 10)
                .text((_, i) => i);
        },
        // update allows you to call drawPoints() again, and instead of creating brand new points,
        // skip the enter => code and do just this instead. raise() moves the points to the top layer of the SVG
        // kind of like z-index
        update => update.raise()
        // You can also add a custom remove => function
        // remove => remove.do sstuff
    );
}

main();
