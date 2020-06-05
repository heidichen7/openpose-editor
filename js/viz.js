const svg = d3.select("#vis");
// const xscale = d3.scaleLinear().domain([0, 6]).range([0, 400]);
// const yscale = d3.scaleLinear().domain([0, 6]).range([400, 0]);
//
// const xscale_inv = d3.scaleLinear().domain([0, 400]).range([0, 6]);
// const yscale_inv = d3.scaleLinear().domain([0, 400]).range([6, 0]);
let lengthsLocked = false;
const COLORS = [ 'black', //placeholder
    '#dc143c', '#ff00ff', '#9400d3', '#ff8c00', '#adff2f', '#ff0000', '#ffa500', '#ffff00',
    '#7cfc00', '#00ff00', '#32cd32', '#1e90ff', '#00ff7f', '#40e0d0', '#40e0d0', '#40e0d0',
    '#4169e1', '#0000ff', '#0000ff', '#0000ff', '#ff00ff', '#4b0082', '#0000ff', '#40e0d0'
]; // matplotlib hexes, eyeballed

//not const: implementing optional locking. this config is the default.
let BODYPARTS = {0: "head", 15: "head", 16: "head", 17:"head", 18: "head",
  11: "rfoot", 24: "rfoot", 22: "rfoot", 23: "rfoot",
  14: "lfoot", 21: "lfoot", 19: "lfoot", 20: "lfoot",
  8: "hips", 9: "hips", 12: "hips",
  
}

let GROUPTOID = { "head": [0, 15, 16, 17, 18], "rfoot": [11, 24, 22, 23],
"lfoot": [14, 19, 20, 21], "hips": [8, 9, 12]

}
const DOTSIZE = 6;

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

const NUM_POINTS = 24;
let pointData;

function main() {

    pointData = loadPointData();
    setBackground();
    drawLines();
    drawPoints();

}

function setBackground() {
  svg.append("rect")
  .attr("width", "100%")
  .attr("height", "100%")
  .attr("fill", "black");
}

function loadPointData() {
  // // as default, provide standard pose
  var req = new XMLHttpRequest();
  let pointData = [];
  req.onload = function(_) {
    const coordsPerKeyPoint = 3;
    let openposeData = JSON.parse(this.responseText);
    let pose = openposeData['people'][0]['pose_keypoints_2d'];
    for (let i = 0; i < pose.length / coordsPerKeyPoint; i += 1) { // 0 to 25
       let startIndex = i * coordsPerKeyPoint; // every 3 indices is start of next coordinate triple (x,y,conf)
       let currPoint = {'x': pose[startIndex], 'y': pose[startIndex + 1], 'id': i};
       pointData.push(currPoint);
     }
     return pointData;
  };
  req.open('GET', 'defaultpose.json', false);
  req.send();
  return pointData;

  // later, allow user option to upload starting pose to edit from
  // don't forget to normalize data
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

function drawLines() {
    // This is a List of pairs. hard coded for convenience for now, ref body25
    // example format of allPointPairs = [
    //     [{x: 5, y: 1, id: 432}, {x: 5, y: 1, id: 432}],
    //     [{x: 5, y: 1, id: 432}, {x: 5, y: 1, id: 432}]
    // ];

    const pointIDPairs = [[0,0], //placeholder to avoid bug where first edge doesn't update when dragged
        [0, 1],[0, 15],[0, 16],[1, 2],[1, 5],[1, 8],[2, 3],[3, 4],[5, 6],[6, 7],[8, 9],
        [8, 12],[9, 10],[10, 11],[11, 22],[11, 24],[12, 13],[13, 14],[14, 19],
        [14, 21],[15, 17],[16, 18],[19, 20],[22, 23]
    ];
    let allPointPairs = [];
    for (let i = 0; i < pointIDPairs.length; i++) {
      let ids = pointIDPairs[i];
      let currPair = [pointData[ids[0]], pointData[ids[1]]];
      allPointPairs.push(currPair);
    }
    svg.selectAll(".lines").data(allPointPairs, d => d.id).join(
        enter => enter.append("line")
            .attr("class", "lines")
            .attr("stroke", (_, i) => COLORS[i])
            .attr("stroke-width", 5)
            .attr("x1", d => (d[0].x))
            .attr("y1", d => (d[0].y))
            .attr("x2", d => (d[1].x))
            .attr("y2", d => (d[1].y))
    );
}

function dragCallback(d) {

   //. for class, # for id

    d3.select("#circle" + d.id) //circles are uniquely identifiable, so circles have id. labels are just relatively placed.
        .attr("cx", d => {
          if (d.id in BODYPARTS) { // ex: 23 is in dict of {23: "rfoot"}
            let bodypart = BODYPARTS[d.id]; // ex: "rfoot"
            let dx = d3.event.x - d.x; // translation
            for (let idx of GROUPTOID[bodypart])  // ex:GROUPTOID["rfoot"] = [11, 22, 23]
              pointData[idx].x += dx;
            return d3.event.x;
          } else {
            d.x = d3.event.x;
            return d3.event.x;
          }
      })
        .attr("cy", d => {
          if (d.id in BODYPARTS) {
            let bodypart = BODYPARTS[d.id];
            let dy = d3.event.y - d.y
            for (let idx of GROUPTOID[bodypart])
              pointData[idx].y += dy;
            return d3.event.y;
        } else {
          d.y = d3.event.y;
          return d3.event.y;
        }
      });
    //
    // d3.select(".label" + d.id)
    //     .attr("x", d => (d.x + DOTSIZE*2))
    //     .attr("y", d => (d.y + DOTSIZE*2));



    drawLines();
    drawPoints();

}


function drawPoints() {
    // .join() is the best way I've found to use d3. The first line uses selectAll(), which
    // finds all of the elements on the page with class "points". If there are none, it creates them.

    // .data() allows you to input the graph data. Easiest way is a List of dicts.
    // d => d.id maps each newly created element to an id so that it updates rather than rerenders.
    // console.log(pointData[22])
    svg.selectAll(".points").data(pointData, d => d.id).join(
        enter => {
            // enter is like a context - this is the element(s) that is about to be added to the page.
            // you can add attributes very simliar to HTML ones.
            enter.append("circle")
            .attr("id", d => "circle" + d.id)
            .attr("class", "points") // Make sure this matches the selectAll().
            .attr("cx", d => d.x)  // Make sure you scale all distances correctly.
            .attr("cy", d => (d.y))
            .attr("r", DOTSIZE) // All of these functions come with a callback function that is the row of data it is processing, e.g. {x: 5, y: 10, id: 10}
            .style("cursor", "pointer")
            .style("fill", "white")
            // You can also do onClick handling stuffs.
            .on("click", d => {
              console.log(d)
            })
            .on("mouseover", function(_) {
                d3.select(this).style("fill", COLORS[1]);
            })
            .on("mouseout", function(_) {
                // Needs to be a function to have access to "this".
                d3.select(this).style("fill", "white");
            })
            .call(d3.drag().on("drag", dragCallback));
            // enter.append("text")
            //     .attr("class", d => "label" + d.id)
            //     .style("text-anchor", "middle")
            //     .style("user-select", "none")
            //     .attr("x", d => (d.x) + 20)
            //     .attr("y", d => (d.y) + 10)
            //     .text((_, i) => i);
        },
        // update allows you to call drawPoints() again, and instead of creating brand new points,
        // skip the enter => code and do just this instead. raise() moves the points to the top layer of the SVG
        // kind of like z-index
        update => {
          svg.selectAll(".points")
                  .attr("cx", d => d.x)  // Make sure you scale all distances correctly.
                  .attr("cy", d => (d.y))

          update.raise()
        }
        // You can also add a custom remove => function
        // remove => remove.do sstuff
    );
}

function lockLengths() {

}

main();
