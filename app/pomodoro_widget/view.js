import document from 'document'
import * as utils from '../../common/utils'
import {PomodoroState} from './pomodoro'

export function update (counter, finished, total, state) {
  /* Takes counter in seconds, finished intervals and total intervals to update
   related view.
   */
  pomoTime().text = utils.secondsToClock(counter, true)
  pomoSets().text = utils.toMonoDigits(finished, false) + '/' +
                    utils.toMonoDigits(total, false)
  switch (state) {
    case null:
      break
    case PomodoroState.WORK:
      pomoBg().style.fill = 'red'
      break
    case PomodoroState.REST:
      pomoBg().style.fill = 'green'
      break
    case PomodoroState.LONG_REST:
      pomoBg().style.fill = 'blue'
      break
    case PomodoroState.DONE:
      pomoBg().style.fill = 'powderblue'
      break
    default:
      console.log('Unrecognized state: ' + state)
  }
}

let pomoBg = () => document.getElementById('pomo-bg')
let pomoTime = () => document.getElementById('pomo-time')
let pomoSets = () => document.getElementById('pomo-sets')
