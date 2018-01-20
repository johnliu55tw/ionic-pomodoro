import document from 'document'
import clock from 'clock'
import {HeartRateSensor} from 'heart-rate'
import {vibration} from 'haptics'
import {display} from 'display'
import {me} from 'appbit'
// My modules
import * as utils from '../common/utils'
import * as view from 'view'
import * as buttons from 'buttons'
import {PomodoroTimer, PomoIntvlState, PomoTimerState} from 'pomodoro'
import {CONFIG} from 'config'

/* DEBUGGING: Read and show stored pomo file. Uncomment this part if you need to
 * inspect the stored file.
import * as fs from 'fs'
try {
  let data = fs.readFileSync(CONFIG.pomodoroTimerPath, 'cbor')
  console.log(data.settings.work)
  console.log(data.settings.rest)
  console.log(data.settings.longRest)
  console.log(data.settings.longRestAfter)
  console.log(data.settings.totalIntervals)
  console.log(data.internalStates.notifyTimerHandler)
  console.log(data.internalStates.timerState)
  console.log(data.internalStates.intvlState)
  console.log(data.internalStates.doneIntvls)
  console.log(data.internalStates.startedAt)
  console.log(data.internalStates.pausedAt)
  console.log(data.internalStates.countdown)
  console.log(data.internalStates.intvlMarker.ts)
  console.log(data.internalStates.intvlMarker.state)
  console.log(data.internalStates.intvlMarker.intvl)
} catch (e) {
  console.log('DEBUGGING: Faild to load file.')
}
*/

// App closing handler
me.addEventListener('unload', (evt) => {
  console.log('App closing. Store current pomodoro state...')
  pomo.saveToFile(CONFIG.pomodoroTimerPath)
  console.log('Finished.')
})

let hrm = new HeartRateSensor()
hrm.start()

console.log('Loading PomodoroTimer from file...')
let pomo = PomodoroTimer.loadFromFile(CONFIG.pomodoroTimerPath)
if (!pomo) {
  console.log('Failed. Create new PomodoroTimer.')
  pomo = new PomodoroTimer(CONFIG.pomodoroSettings)
}
console.log('Adding notification handler to PomodoroTimer.')
pomo.onnotify = () => {
  console.log('NOTIFY!!!')
  vibration.start('nudge')
  display.on = true
}

var updateTimerAndHrmView = (evt) => {
  view.datetime(evt.date)
  view.stat('h', hrm.heartRate, '#8A2BE2')
}
var updatePomoView = (evt) => {
  pomo.update(evt.date.getTime())
  if (pomo.timerState === PomoTimerState.running) {
    let color = null
    switch (pomo.intvlState) {
      case PomoIntvlState.work:
        color = 'fb-yellow'
        break
      case PomoIntvlState.rest:
        color = 'fb-blue'
        break
      case PomoIntvlState.longRest:
        color = 'fb-mint'
        break
    }
    view.pomodoro(pomo.countdown / 1000,
                  pomo.doneIntvls,
                  pomo.totalIntervals,
                  color)
  } else {
    view.pomodoro(pomo.countdown / 1000,
                  pomo.doneIntvls,
                  pomo.totalIntervals,
                  'gray')
  }
}
clock.granularity = 'seconds'
clock.addEventListener('tick', updateTimerAndHrmView)
clock.addEventListener('tick', updatePomoView)

// Buttons and pop up menus
let pomoMenuTimeout = null
let pomoMenu = document.getElementById('pomo-menu')

utils.assignLongPressEventListener(buttons.pomoWidget(), (evt) => {
  vibration.start('confirmation')
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
  vibration.start('confirmation')
  pomo.toggle()
  pomo.update()
  updatePomoView({date: new Date()})
})

buttons.pomoMenuCancel().addEventListener('click', (evt) => {
  vibration.start('confirmation')
  pomoMenu.style.visibility = 'hidden'
})

buttons.pomoMenuSkip().addEventListener('click', (evt) => {
  console.log('skip')
  vibration.start('confirmation')
  pomoMenu.style.visibility = 'hidden'
  pomo.skip()
  pomo.update()
  updatePomoView({date: new Date()})
})

buttons.pomoMenuReset().addEventListener('click', (evt) => {
  console.log('button reset')
  vibration.start('confirmation')
  pomoMenu.style.visibility = 'hidden'
  pomo.reset()
  pomo.update()
  updatePomoView({date: new Date()})
})
