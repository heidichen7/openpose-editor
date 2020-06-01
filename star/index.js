// import interact from 'interactjs';


document.addEventListener('DOMContentLoaded', () => {
  const sns = 'http://www.w3.org/2000/svg'
  const xns = 'http://www.w3.org/1999/xlink'
  const root = document.getElementById('svg-edit-demo')
  // const lines = document.getElementById('edit-star')
  // console.log(lines1)
  const lines = document.querySelectorAll("[id^=edit-star]")
  console.log(lines)
  let rootMatrix
  const originalPoints = []
  let transformedPoints = []

  const dataIndexToPoint = {0: 0, 1: 1, 2: 0, 3: 15, 4: 0, 5: 16, 6: 1, 7: 2, 8: 1, 9: 5, 10: 1, 11: 8, 12: 2, 13: 3, 14: 3, 15: 4, 16: 5, 17: 6, 18: 6, 19: 7, 20: 8, 21: 9, 22: 8, 23: 12, 24: 9, 25: 10, 26: 10, 27: 11, 28: 11, 29: 22, 30: 11, 31: 24, 32: 12, 33: 13, 34: 13, 35: 14, 36: 14, 37: 19, 38: 14, 39: 21, 40: 15, 41: 17, 42: 16, 43: 18, 44: 19, 45: 20, 46: 22, 47: 23}
  const pointToAllDataIndices = {0: [0, 2, 4], 1: [1, 6, 8, 10], 2: [7, 12], 3: [13, 14], 4: [15], 5: [9, 16], 6: [17, 18], 7: [19], 8: [11, 20, 22], 9: [21, 24], 10: [25, 26], 11: [27, 28, 30], 12: [23, 32], 13: [33, 34], 14: [35, 36, 38], 15: [3, 40], 16: [5, 42], 17: [41], 18: [43], 19: [37, 44], 20: [45], 21: [39], 22: [29, 46], 23: [47], 24: [31]}
  for (let i = 0; i < lines.length; i++){
    for (let j = 0; j < 2; j++) {
      const handle = document.createElementNS(sns, 'use')
      const point = lines[i].points.getItem(j)
      // const point = star.points.getItem(i)
      const newPoint = root.createSVGPoint()

      handle.setAttributeNS(xns, 'href', '#point-handle')
      handle.setAttribute('class', 'point-handle')

      handle.x.baseVal.value = newPoint.x = point.x
      handle.y.baseVal.value = newPoint.y = point.y

      handle.setAttribute('data-index', i * 2 + j)

      originalPoints.push(newPoint)

      root.appendChild(handle)
    }

  }

  function applyTransforms (event) {
    rootMatrix = root.getScreenCTM()

    transformedPoints = originalPoints.map((point) => {
      return point.matrixTransform(rootMatrix)
    })

    interact('.point-handle').draggable({
      snap: {
        targets: transformedPoints,
        range: 20 * Math.max(rootMatrix.a, rootMatrix.d),
      },
    })

  }

  interact(root)
    .on('mousedown', applyTransforms)
    .on('touchstart', applyTransforms)

  interact('.point-handle')
    .draggable({
      onstart: function (event) {
        root.setAttribute('class', 'dragging')
      },
      onmove: function (event) {
        const i = event.target.getAttribute('data-index') | 0
        console.log(i)
        var edgeIndex = Math.floor(i / 2)
        var indexInEdge = i % 2
        const point = lines[edgeIndex].points.getItem(indexInEdge)
        point.x += event.dx / rootMatrix.a
        point.y += event.dy / rootMatrix.d

        // if ((edgeIndex == 0 && indexInEdge == 1)) {
        //   const point1 = lines[1].points.getItem(0)
        //   point1.x += event.dx / rootMatrix.a
        //   point1.y += event.dy / rootMatrix.d
        // }
        // if (edgeIndex == 1 && indexInEdge == 0) {
        //   const point1 = lines[0].points.getItem(1)
        //   point1.x += event.dx / rootMatrix.a
        //   point1.y += event.dy / rootMatrix.d
        // }

        // update that point in all edges containing that point
        var pointIndex = dataIndexToPoint[i]
        var copyPoints = pointToAllDataIndices[pointIndex]
        for (let j = 0; j < copyPoints.length; j++) {
          var dataIndex = copyPoints[j]
          if (dataIndex === i) continue;
          edgeIndex = Math.floor(dataIndex / 2)
          indexInEdge = dataIndex % 2
          const copyPoint = lines[edgeIndex].points.getItem(indexInEdge)
          copyPoint.x += event.dx / rootMatrix.a
          copyPoint.y += event.dy / rootMatrix.d

        }

        event.target.x.baseVal.value = point.x
        event.target.y.baseVal.value = point.y

      },
      onend: function (event) {
        root.setAttribute('class', '')
      },
      // snap: {
      //   targets: originalPoints,
      //   range: 10,
      //   relativePoints: [{ x: 0.5, y: 0.5 }],
      // },
      restrict: { restriction: document.rootElement },
    })
    // .styleCursor(false)

  document.addEventListener('dragstart', (event) => {
    event.preventDefault()
  })
})
