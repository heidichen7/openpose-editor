const svg = d3.select("#vis");

// Grouping bools / data fields
let isCustomGroup = false;
let customGroup = [];
const ALL_BODYPARTS = {0: "head", 15: "head", 16: "head", 17:"head", 18: "head",
  11: "rfoot", 24: "rfoot", 22: "rfoot", 23: "rfoot",
  14: "lfoot", 21: "lfoot", 19: "lfoot", 20: "lfoot",
  8: "hips", 9: "hips", 12: "hips",

}
let DEFAULTGROUPS = {};// = ALL_BODYPARTS;
let DEFAULTGROUPTOID = { "head": [0, 15, 16, 17, 18], "rfoot": [11, 24, 22, 23],
"lfoot": [14, 19, 20, 21], "hips": [8, 9, 12]
}

// Locked limb length bools / data fields
let lockEngaged = false;
let lockId = -1;
let lockPairId = -1;
let lockLength = -1;

// display consts (color, dot size)
const COLORS = [ 'black', //placeholder
    '#dc143c', '#ff00ff', '#9400d3', '#ff8c00', '#adff2f', '#ff0000', '#ffa500', '#ffff00',
    '#7cfc00', '#00ff00', '#32cd32', '#1e90ff', '#00ff7f', '#40e0d0', '#40e0d0', '#40e0d0',
    '#4169e1', '#0000ff', '#0000ff', '#0000ff', '#ff00ff', '#4b0082', '#0000ff', '#40e0d0'
]; // matplotlib hexes, eyeballed

const LOCKCOLOR = "blue";
const DOTSIZE = 6;

// edge pairs
const pointIDPairs = [[0,0], //placeholder to avoid bug where first edge doesn't update when dragged
    [0, 1],[0, 15],[0, 16],[1, 2],[1, 5],[1, 8],[2, 3],[3, 4],[5, 6],[6, 7],[8, 9],
    [8, 12],[9, 10],[10, 11],[11, 22],[11, 24],[12, 13],[13, 14],[14, 19],
    [14, 21],[15, 17],[16, 18],[19, 20],[22, 23]
];

const lockPairs = { // edges w/ id pairs ordered to ensure correct pivoting - aka, ordered outisdemost to insidemost within a pair
0: 1, 2: 1, 3: 2, 4: 3,  5: 1, 6: 5, 7: 6, 1: 8, 8: 1, 9: 8, 10: 9, 11: 10,
12: 8, 13: 12, 14: 13, 17: 15, 15: 0, 18: 16, 16: 0, 24: 11, 22: 11, 23: 22,
21: 14, 19: 21, 20: 19
};

function euclideanDist(a, b) {
    return Math.pow(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2), .5);
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
  const TRANSLATION = {"x": -25, "y":-150}
  req.onload = function(_) {
    const coordsPerKeyPoint = 3;
    let openposeData = JSON.parse(this.responseText);
    let pose = openposeData['people'][0]['pose_keypoints_2d'];
    for (let i = 0; i < pose.length / coordsPerKeyPoint; i += 1) { // 0 to 25
       let startIndex = i * coordsPerKeyPoint; // every 3 indices is start of next coordinate triple (x,y,conf)
       let currPoint = {'x': pose[startIndex] + TRANSLATION.x, 'y': pose[startIndex + 1] + TRANSLATION.y, 'id': i};
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

function getTranslation(d) { // handles locking
  if (lockEngaged && lockId === d.id) { // locked limb length
    let limbStartPt = pointData[lockPairId];
    let dist = euclideanDist(limbStartPt, d3.event);
    let scaled_x = lockLength / dist * (d3.event.x - limbStartPt.x) + limbStartPt.x;
    let scaled_y = lockLength / dist * (d3.event.y - limbStartPt.y) + limbStartPt.y;
    // d.x = scaled_x;
    return {'x': scaled_x - d.x, 'y': scaled_y - d.y};
  } else {
    return  {'x': d3.event.x - d.x, 'y': d3.event.y - d.y};
  }

}
function dragGroupX(d) {
  let dx = getTranslation(d).x;
  if (isCustomGroup && customGroup.includes(d.id)) { // custom group
      console.log(customGroup)
      for (let idx of customGroup)
        pointData[idx].x += dx;
      return d3.event.x;
  } else if (d.id in DEFAULTGROUPS) { // default joints
      let bodypart = DEFAULTGROUPS[d.id];
      for (let idx of DEFAULTGROUPTOID[bodypart])
        pointData[idx].x += dx;
      return d3.event.x;
  } else { // no groups
      d.x += dx;
      return d.x;
  }
}

function dragGroupY(d) {
  let dy = getTranslation(d).y;
  if (isCustomGroup && customGroup.includes(d.id)) { // custom group
        for (let idx of customGroup)
        pointData[idx].y += dy;
      return d3.event.y;
  } else if (d.id in DEFAULTGROUPS) {// ex: 23 is in dict of {23: "rfoot"}
    let bodypart = DEFAULTGROUPS[d.id]; // ex: "rfoot"
    for (let idx of DEFAULTGROUPTOID[bodypart])  // ex:DEFAULTGROUPTOID["rfoot"] = [11, 22, 23]
      pointData[idx].y += dy;
    return d3.event.y;
  } else { // no groups
    d.y += dy;
    return d.y;
  }
}

function dragCallback(d) {

   //. for class, # for id
    d3.select("#circle" + d.id) //circles are uniquely identifiable, so circles have id. labels are just relatively placed.
        .attr("cx", d => dragGroupX(d))
        .attr("cy", d => dragGroupY(d));
    // update labels
    d3.select(".label" + d.id)
        .attr("x", d => (d.x - DOTSIZE*2))
        .attr("y", d => (d.y - DOTSIZE));

    drawLines();
    drawPoints();

}

function getLockLength(id) { // TODO remove function since it can be replaced w/ one liner
  lockPairId = lockPairs[id];
  return euclideanDist(pointData[lockPairId], pointData[id]);
}

// TODO  remove once I figure out how defining functions across scripts works
function updateIDText(ids) {
  console.log("update?");
  let elem = document.getElementById("groupidtext");
  elem.style.visibility = 'visible';
  elem.innerHTML = "Grouped Joint Ids:" + JSON.stringify(ids);
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
            .on("click", function(d) {
              if (lockEngaged) {
                if (lockId != d.id) { // selecting new lock point

                  lockId = d.id;
                  lockLength = getLockLength(d.id);
                  d3.select(this).style("fill", LOCKCOLOR);
                  console.log(lockId)
                  console.log(lockLength);
                } else {
                    d3.select(this).style("fill", "white");
                    lockId = -1;
                    lockLength = -1;
                }
              } else if (isCustomGroup) {
                if (customGroup.includes(d.id)) {
                  customGroup.splice(customGroup.indexOf(d.id));
                  d3.select(this).style("fill", "white");
                } else {
                  customGroup.push(d.id);
                  d3.select(this).style("fill", COLORS[1]);
                }
                // console.log(customGroup)
                updateIDText(customGroup);
              }

            })
            .on("mouseover", function(_) {
                if (lockEngaged) d3.select(this).style("fill", LOCKCOLOR);
                else d3.select(this).style("fill", COLORS[1]);
            })
            .on("mouseout", function(d) {
                // Needs to be a function to have access to "this".
                if (!(isCustomGroup && customGroup.includes(d.id)) && !(lockEngaged && lockId == d.id))
                  d3.select(this).style("fill", "white");
            })
            .call(d3.drag().on("drag", dragCallback));

            enter.append("text")
                .attr("class", d => "label" + d.id)
                .style("text-anchor", "middle")
                .style("user-select", "none")
                .attr("x", d => (d.x  - DOTSIZE*2))
                .attr("y", d => (d.y  - DOTSIZE))
                .style("stroke", "white")
                .style("opacity", 0)
                .text((_, i) => i);
        },
        // update allows you to call drawPoints() again, and instead of creating brand new points,
        // skip the enter => code and do just this instead. raise() moves the points to the top layer of the SVG
        // kind of like z-index
        update => {
          svg.selectAll(".points")
                  .attr("cx", d => d.x)  // Make sure you scale all distances correctly.
                  .attr("cy", d => (d.y))
          svg.selectAll("text")
                .attr("x", d => (d.x - DOTSIZE*2))
                .attr("y", d => (d.y - DOTSIZE));

          update.raise()
        }
        // You can also add a custom remove => function
        // remove => remove.do sstuff
    );
}

function lockLengths() {

}

main();
