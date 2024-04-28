const config = {
  video: { width: 800, height: 600, fps: 30 }
}

const PIXEL_TO_CENTIMETER_RATIO_HEIGHT = 15.79
const PIXEL_TO_CENTIMETER_RATIO_WIDTH = 11.81

const landmarkColors = {
  thumb: 'red',
  index: 'blue',
  middle: 'yellow',
  ring: 'green',
  pinky: 'pink',
  wrist: 'white'
}

const usedKeypoints = ['thumb_ip','middle_finger_tip', 'pinky_finger_mcp', 'wrist']

const getKeyPointPostition = (keypoints, keyPointName) => keypoints.map(keypoint => keypoint.name).indexOf(keyPointName)

const filterKeypoints = (keypoints) => keypoints.filter(keypoint => usedKeypoints.includes(keypoint.name))

async function createDetector() {
  return window.handPoseDetection.createDetector(
    window.handPoseDetection.SupportedModels.MediaPipeHands,
    {
      runtime: "mediapipe",
      modelType: "full",
      maxHands: 1,
      solutionPath: `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915`,
    }
  )
}

async function main() {

  const video = document.querySelector("#pose-video")
  const canvas = document.querySelector("#pose-canvas")
  const ctx = canvas.getContext("2d")

  const detector = await createDetector()

  const estimateHands = async () => {
    ctx.clearRect(0, 0, config.video.width, config.video.height)

    const hands = await detector.estimateHands(video, {
      flipHorizontal: true
    })
    for (const hand of hands) {
      const filteredKeypoints = filterKeypoints(hand.keypoints)
      for (const keypoint of filteredKeypoints) {
        const name = keypoint.name.split('_')[0].toString().toLowerCase()
        const color = landmarkColors[name]
        drawPoint(ctx, keypoint.x, keypoint.y, 3, color)
        
      }
      drawLineBetweenKeyPoints(ctx, 'thumb_ip', 'pinky_finger_mcp', 'white', filteredKeypoints)
      drawLineBetweenKeyPoints(ctx, 'middle_finger_tip', 'wrist', 'white', filteredKeypoints)

    }
    setTimeout(() => { estimateHands() }, 1000 / config.video.fps)
  }

  estimateHands()
  console.log("Starting predictions")
}

async function initCamera(width, height, fps) {

  const constraints = {
    audio: false,
    video: {
      facingMode: "user",
      width: width,
      height: height,
      frameRate: { max: fps }
    }
  }

  const video = document.querySelector("#pose-video")
  video.width = width
  video.height = height

  const stream = await navigator.mediaDevices.getUserMedia(constraints)
  video.srcObject = stream

  return new Promise(resolve => {
    video.onloadedmetadata = () => { resolve(video) }
  })
}

function drawPoint(ctx, x, y, r, color) {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, 2 * Math.PI)
  ctx.fillStyle = color
  ctx.fill()
}

function drawText(ctx, text, x, y) {
  ctx.font = '14px Arial';
  ctx.fillStyle = 'black';
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y);
}

function drawLine(ctx, startPoint, endPoint, color, ratioToUse) {
  ctx.beginPath();
  ctx.moveTo(startPoint.x, startPoint.y);
  ctx.lineTo(endPoint.x, endPoint.y);
  ctx.strokeStyle = color;
  ctx.stroke();

  const length = Math.sqrt(Math.pow(endPoint.x - startPoint.x, 2) + Math.pow(endPoint.y - startPoint.y, 2));
  const lengthInCm = length / ratioToUse
  drawText(ctx, lengthInCm.toFixed(2) + ' cm', (startPoint.x + endPoint.x) / 2  , (startPoint.y + endPoint.y) / 2)
  drawText(ctx, length.toFixed(2) + ' px', ((startPoint.x + endPoint.x) / 2) + 100, ((startPoint.y + endPoint.y) / 2))
}

function getKeyPointByName(keypointName, filteredKeypoints) {
  return filteredKeypoints[getKeyPointPostition(filteredKeypoints, keypointName)]
}

function drawLineBetweenKeyPoints(ctx, keypoint1Name, keypoint2Name, color, filteredKeypoints) {
  const keypoint1 = getKeyPointByName(keypoint1Name, filteredKeypoints)
  const keypoint2 = getKeyPointByName(keypoint2Name, filteredKeypoints)
  const ratioToUse = [keypoint1Name, keypoint2Name].includes('wrist') ? PIXEL_TO_CENTIMETER_RATIO_HEIGHT : PIXEL_TO_CENTIMETER_RATIO_WIDTH
  drawLine(ctx, keypoint1, keypoint2, color, ratioToUse)
}

function updateDebugInfo(data, hand) {
  const summaryTable = `#summary-${hand}`
  for (let fingerIdx in data) {
    document.querySelector(`${summaryTable} span#curl-${fingerIdx}`).innerHTML = data[fingerIdx][1]
    document.querySelector(`${summaryTable} span#dir-${fingerIdx}`).innerHTML = data[fingerIdx][2]
  }
}

window.addEventListener("DOMContentLoaded", () => {
  initCamera(
    config.video.width, config.video.height, config.video.fps
  ).then(video => {
    video.play()
    video.addEventListener("loadeddata", event => {
      console.log("Camera is ready")
      main()
    })
  })

  const canvas = document.querySelector("#pose-canvas")
  canvas.width = config.video.width
  canvas.height = config.video.height
  console.log("Canvas initialized")
})
