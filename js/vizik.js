const svg = d3.select("#vis");

// let chain = null;

// function setup() {
  class Bone {
    constructor(x,y,angle,length, ptid, child) {
      this.x = x;
      this.y = y;
      this.length = length;
      this.angle = angle;
      this.id = ptid;
      this.child = child;
    }

    updateWorldCoords() {
      // push();
      let currpt = this;

      let childcoords = translatePoint(rotatePoint([currpt.child.x, currpt.child.y], currpt.angle), currpt.x, currpt.y);
      pointData[currpt.child.id].x = childcoords[0];
      pointData[currpt.child.id].y = childcoords[1];

      // while (currpt) {
      //   console.log(currpt)
      //   pointData[currpt.id].x = currpt.x;
      //   pointData[currpt.id].y = currpt.y;
      //   if (! currpt.child) break;
      //   // TODO fix transformations here, only works for one round
      //   // let nextpt = currpt.child;
      //   // let nextcoords = rotatePoint(translatePoint([currpt.x, currpt.y], currpt.x, currpt.y), currpt.angle);
      //
      //   currpt = currpt.child;
      //   // currpt.x = nextcoords[0];
      //   // currpt.y = nextcoords[1];
      // }

      // strokeWeight(this.length/5);
      // stroke(0);
      // line(0,0,this.length,0);
      // this.child && this.child.draw();
      // pop();
    }

    // takes in: a target point in the parent coordinate space
    // returns:  the endpoint of the chain, in that same parent
    //           coordinate space
    updateIK(target) {
      // console.log(this.id)
      // convert from parent to local coordinates
      const localTarget = rotatePoint(translatePoint(target, -this.x, -this.y), -this.angle);

      let endPoint;
      if (this.child) {
        // console.log(localTarget)
        endPoint = this.child.updateIK(localTarget);
      } else {
        // base case:  the end point is the end of the current bone
        endPoint = [this.length, 0];
      }

      // point towards the endpoint
      const shiftAngle = angle(localTarget) - angle(endPoint);
      // console.log(shiftAngle)
      this.angle += shiftAngle;


      // convert back to parent coordinate space
      return translatePoint(rotatePoint(endPoint, this.angle), this.x, this.y);
    }
  }

  // todo call this in the drag callback , on our bones. rarm.updateIK, then figure out how to update pointsData


  // chain1 = new Bone(200, 200, 0, 100,
  //   new Bone(100, 0, 0, 90,
  //     // new Bone(90, 0, 0, 80,
  //     //   new Bone(80, 0, 0, 70)
  //     // )
  //   )
  // );

  // chain2 = new Bone(200, 200, 0, 100,
  //   new Bone(100, 0, 0, 90,
  //     // new Bone(90, 0, 0, 80,
  //     //   new Bone(80, 0, 0, 70)
  //     // )
  //   )
  // );
  // createCanvas(windowWidth, windowHeight);
  //
  // chain1.updateIK([300, 50]);
  // chain2.updateIK([100, 50]);
// }
//
// function windowResized() {
// 	resizeCanvas(windowWidth, windowHeight);
// }
//
// function draw() {
//   clear();
//   chain1.draw();
//   chain2.draw();
// }
//
// function mouseDragged() {
//   for (let i = 0; i < 5; i++) {
//     console.log(event)
//     chain1.updateIK([mouseX, mouseY]);
//     // chain2.updateIK([mouseX, mouseY]);
//   }
// }

// convenience methods for transforming points
// because P5.js doesn't have matrix classes :'(
function rotatePoint(point, angle) {
  const [x, y] = point;
  return [
    x*Math.cos(angle) - y*Math.sin(angle),
    x*Math.sin(angle) + y*Math.cos(angle)
  ];
}
function translatePoint(point, h, v) {
  const [x, y] = point;
  return [x+h, y+v];
}
function angle(point) {
  const [x, y] = point;
  return Math.atan2(y, x);
}




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
let rArm;

function main() {

    pointData = loadPointData();
    initializeSkeleton();
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

function initializeSkeleton() {
  // const pointIDPairs = [[0,0], //placeholder to avoid bug where first edge doesn't update when dragged
  //     [0, 1],[0, 15],[0, 16],[1, 2],[1, 5],[1, 8],[2, 3],[3, 4],[5, 6],[6, 7],[8, 9],
  //     [8, 12],[9, 10],[10, 11],[11, 22],[11, 24],[12, 13],[13, 14],[14, 19],
  //     [14, 21],[15, 17],[16, 18],[19, 20],[22, 23]
  // ];
  // left arm: shoulder, elbow, wrist
  let rShoulder = pointData[2];
  let rElbow = pointData[3];
  let rWrist = pointData[4];
  rArm = new Bone(rShoulder.x, rShoulder.y, angle([rElbow.x - rShoulder.x, rElbow.y - rShoulder.y]),
         euclideanDist(rShoulder, rElbow),2, // TODO CHECK ANGLE PARAMS
              new Bone(rElbow.x - rShoulder.x, rElbow.y-rShoulder.y,  angle([rWrist.x - rElbow.x, rWrist.y - rElbow.y]),
              euclideanDist(rElbow, rWrist), 3));


  // console.log(rArm);
}
// Point data looks like:
// [
//     {x: 5, y: 10, id: 10, chain: (bone(x,y,correct angle, correctlength, ptindex, childbone(...)))},
//     {x: 5, y: 69, id: 4},
//     {x: 5, y: 69, id: 10},
//     {x: 565, y: 10, id: 10},
//     {x: 5, y: 10, id: 432},
//
// ]
//


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
  if (d.id === 4) { //rwrist
      rArm.updateIK([d3.event.x, d3.event.y]);
      rArm.updateWorldCoords();
      // lockEngaged = True;

  }
   // . for class, # for id
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
