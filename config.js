export const config = {
  video: { width: 640, height: 480, fps: 30 }
}

export const PIXEL_TO_CENTIMETER_RATIO_HEIGHT = 15.79
export const PIXEL_TO_CENTIMETER_RATIO_WIDTH = 11.81

export const recommendations = {
  small: ['hyperx-pulsefire.jpg', 'mx-master-3s.jpg'],
  medium: ['razer-deathadder.jpg', 'logitech-g502x.jpg'],
  large: ['glorious-model-o.jpg', 'steelseries-rival600.jpg'],
}

export const landmarkColors = {
  thumb: 'red',
  index: 'blue',
  middle: 'yellow',
  ring: 'green',
  pinky: 'pink',
  wrist: 'white'
}

export const usedKeypoints = ['thumb_ip', 'middle_finger_tip', 'pinky_finger_mcp', 'wrist']


export async function initCamera(width, height, fps) {

  const constraints = {
    audio: false,
    video: {
      facingMode: "environment",
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