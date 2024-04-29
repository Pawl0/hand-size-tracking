import { config, PIXEL_TO_CENTIMETER_RATIO_HEIGHT, PIXEL_TO_CENTIMETER_RATIO_WIDTH, landmarkColors, usedKeypoints, initCamera } from './config.js'

export const getKeyPointPostition = (keypoints, keyPointName) => keypoints.map(keypoint => keypoint.name).indexOf(keyPointName)

export const filterKeypoints = (keypoints) => keypoints.filter(keypoint => usedKeypoints.includes(keypoint.name))

export async function createDetector() {
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

export async function main(onEstimateHands) {

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
      console.log({ onEstimateHands })
      if (onEstimateHands) {
        onEstimateHands(ctx, filteredKeypoints)
      } else {
        drawLineBetweenKeypoints(ctx, 'thumb_ip', 'pinky_finger_mcp', 'white', filteredKeypoints)
        drawLineBetweenKeypoints(ctx, 'middle_finger_tip', 'wrist', 'white', filteredKeypoints)
      }

    }
    setTimeout(() => { estimateHands() }, 1000 / config.video.fps)
  }

  estimateHands(onEstimateHands)
  console.log("Starting predictions")
}

export function drawPoint(ctx, x, y, r, color) {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, 2 * Math.PI)
  ctx.fillStyle = color
  ctx.fill()
}

export function drawText(ctx, text, x, y) {
  ctx.font = '14px Arial';
  ctx.fillStyle = 'black';
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y);
}

export function drawLine(ctx, startPoint, endPoint, color, ratioToUse) {
  ctx.beginPath();
  ctx.moveTo(startPoint.x, startPoint.y);
  ctx.lineTo(endPoint.x, endPoint.y);
  ctx.strokeStyle = color;
  ctx.stroke();

  const handLength = Math.sqrt(Math.pow(endPoint.x - startPoint.x, 2) + Math.pow(endPoint.y - startPoint.y, 2));
  const handLengthInCm = handLength / ratioToUse
  drawText(ctx, handLengthInCm.toFixed(2) + ' cm', (startPoint.x + endPoint.x) / 2, (startPoint.y + endPoint.y) / 2)
  drawText(ctx, handLength.toFixed(2) + ' px', ((startPoint.x + endPoint.x) / 2) + 100, ((startPoint.y + endPoint.y) / 2))

  return handLengthInCm
}

export function getKeyPointByName(keypointName, filteredKeypoints) {
  return filteredKeypoints[getKeyPointPostition(filteredKeypoints, keypointName)]
}

export function drawLineBetweenKeypoints(ctx, keypoint1Name, keypoint2Name, color, filteredKeypoints) {
  const keypoint1 = getKeyPointByName(keypoint1Name, filteredKeypoints)
  const keypoint2 = getKeyPointByName(keypoint2Name, filteredKeypoints)
  const ratioToUse = [keypoint1Name, keypoint2Name].includes('wrist') ? PIXEL_TO_CENTIMETER_RATIO_HEIGHT : PIXEL_TO_CENTIMETER_RATIO_WIDTH
  return drawLine(ctx, keypoint1, keypoint2, color, ratioToUse)
}

export const run = (config, onEstimateHands) => {
  window.addEventListener("DOMContentLoaded", () => {
    initCamera(
      config.video.width, config.video.height, config.video.fps
    ).then(video => {
      video.play()
      video.addEventListener("loadeddata", event => {
        console.log("Camera is ready")
        main(onEstimateHands)
      })
    })

    const canvas = document.querySelector("#pose-canvas")
    canvas.width = config.video.width
    canvas.height = config.video.height
    console.log("Canvas initialized")
  })
}

run(config)
