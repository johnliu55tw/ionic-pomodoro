import document from 'document'
import * as utils from '../common/utils.js'

export function datetime (date) {
  /* Takes a Date object to update time related views */
  dateText().text = date.toISOString().substr(5, 5)
  hoursText().text = utils.toMonoDigits(date.getHours(), true)
  minsText().text = utils.toMonoDigits(date.getMinutes(), true)
}

export function pomodoro (counter, finished, total, bgColor) {
  /* Takes counter in seconds, finished intervals and total intervals to update related view. */
  pomoTime().text = utils.secondsToClock(counter, true)
  pomoSets().text = utils.toMonoDigits(finished, false) + '/' + utils.toMonoDigits(total, false)
  if (bgColor) {
    pomoBackground().style.fill = bgColor
  }
}

export function stat (type, value, bgColor) {
  statBackground().style.fill = bgColor
  switch (type) {
    case 'h':
      // Heart rate
      statIcon().href = 'images/stat_hr_solid_32px.png'
      // null is possible!
      if (value === null) {
        statValue().text = '--'
      } else {
        statValue().text = value.toString()
      }
      break
    case 'c':
      // Calories
      statIcon().href = 'images/stat_cals_solid_32px.png'
      statValue().text = value.toString()
      break
    case 's':
      // Steps
      statIcon().href = 'images/stat_steps_solid_32px.png'
      statValue().text = value.toString()
      break
    default:
      console.error("Unrecognized stat type: '" + type + "'")
  }
}

/* Helper functions for getting the elements */
let dateText = () => document.getElementById('date')
let hoursText = () => document.getElementById('hours')
let minsText = () => document.getElementById('mins')
let pomoBackground = () => document.getElementById('pomo-bg')
let pomoTime = () => document.getElementById('pomo-time')
let pomoSets = () => document.getElementById('pomo-sets')
let statBackground = () => document.getElementById('stat-bg')
let statIcon = () => document.getElementById('stat-icon')
let statValue = () => document.getElementById('stat-value')
