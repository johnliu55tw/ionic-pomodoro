import document from 'document'
import clock from 'clock'
import {HeartRateSensor} from 'heart-rate'
import {vibration} from "haptics";
import {display} from 'display'
// App closing handler
import {me} from 'appbit'
me.addEventListener('unload', (evt) => {
  console.log('Customized closing handler function!')
})

// Debug: Reporting memory
import {memory} from 'system'
setInterval(() => {
  console.log("JS memory: " + memory.js.used + "/" + memory.js.total)
}, 5000)

// My modules
import * as utils from '../common/utils'
import * as view from 'view'
import * as buttons from 'buttons'
import {PomodoroSetting, PomodoroTimer, PomoIntvlState, PomoTimerState} from 'pomodoro'


let hrm = new HeartRateSensor()
hrm.start()

let pomoSetting = new PomodoroSetting(1, 1, 1, 4, 12)
let pomo = new PomodoroTimer(pomoSetting)

clock.granularity = "seconds"
clock.addEventListener('tick', (evt) => {
  view.datetime(evt.date)
  view.stat('h', hrm.heartRate, '#8A2BE2')
})

clock.addEventListener('tick', (evt) => {
  pomo.update(evt.date)
  if (pomo.timerState === PomoTimerState.running) {
    view.pomodoro(pomo.countdown / 1000,
                  pomo.doneIntvls,
                  pomoSetting.totalIntervals,
                  'green')
  } else if (pomo.timerState === PomoTimerState.paused) {
    view.pomodoro(pomo.countdown / 1000,
                  pomo.doneIntvls,
                  pomoSetting.totalIntervals,
                  'yellow')
  } else {
    view.pomodoro(pomo.countdown / 1000,
                  pomo.doneIntvls,
                  pomoSetting.totalIntervals,
                  'gray')
  }
})

// Testing pop menu
let pomoMenuTimeout = null
let pomoMenu = document.getElementById("pomo-menu")
let pomoBg = document.getElementById('pomo-bg')

utils.assignLongPressEventListener(buttons.pomoWidget(), (evt) => {
  pomoMenu.style.visibility = 'visible'
  // Close the menu after 5s
  if (pomoMenuTimeout) {
    clearTimeout(pomoMenuTimeout)
  }
  pomoMenuTimeout = setTimeout(() => {
    pomoMenu.style.visibility = 'hidden'
  }, 5000)
})

utils.addShortPressEventListener(buttons.pomoWidget(), (evt) => {
  pomo.toggle()
})

buttons.pomoMenuCancel().addEventListener('click', (evt) => {
  pomoMenu.style.visibility = 'hidden'
})

buttons.pomoMenuSkip().addEventListener('click', (evt) => {
  console.log('skip')
  pomoMenu.style.visibility = 'hidden'
})

buttons.pomoMenuReset().addEventListener('click', (evt) => {
  console.log('reset')
  clearTimeout(timeoutHandler)
  timeoutHandler = null
  remainedTime = null
  startTime = null
  endTime = null
  pomoMenu.style.visibility = 'hidden'
})