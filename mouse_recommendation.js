import { config, recommendations } from './config.js'
import { run, drawLineBetweenKeypoints } from './index.js'

function onEstimateHands(ctx, filteredKeypoints) {
  drawLineBetweenKeypoints(ctx, 'thumb_ip', 'pinky_finger_mcp', 'white', filteredKeypoints)
  const handLengthInCm = drawLineBetweenKeypoints(ctx, 'middle_finger_tip', 'wrist', 'white', filteredKeypoints)
  renderRecommendedMice(getRecommendedMice(handLengthInCm))
}
function renderRecommendedMice(recommendedMice) {
  const recommendationsDiv = document.getElementById("recommendation-list")
  if (!recommendationsDiv) return
  recommendationsDiv.innerHTML = ''
  recommendedMice.forEach(recomendedMouse => {
    recommendationsDiv.innerHTML += `<img class="recommendation_item" src="./public/assets/${recomendedMouse}"/>`
  })
}

function getRecommendedMice(handLengthInCm) {
  if (handLengthInCm < 18) {
    return recommendations.small
  }
  if (handLengthInCm >= 18 && handLengthInCm < 20) {
    return recommendations.medium
  }
  return recommendations.large
}

run(config, onEstimateHands)