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
import {PomodoroSetting, PomodoroTimer, PomoIntvlState, PomoTimerState} from 'pomodoro'
import {CONFIG} from 'config'

// App closing handler
me.addEventListener('unload', (evt) => {
  console.log('Customized closing handler function!')
})

let hrm = new HeartRateSensor()
hrm.start()

let pomoSetting = new PomodoroSetting(CONFIG.pomodoro.work,
                                      CONFIG.pomodoro.rest,
                                      CONFIG.pomodoro.longRest,
                                      CONFIG.pomodoro.longRestAfter,
                                      CONFIG.pomodoro.totalIntervals)
console.log('Loading PomodoroTimer from file...')
let pomo = PomodoroTimer.loadFromFile('pomo_timer')
if (!pomo) {
  console.log('Failed. Create new PomodoroTimer.')
  pomo = new PomodoroTimer(pomoSetting)
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
                  pomoSetting.totalIntervals,
                  color)
  } else {
    view.pomodoro(pomo.countdown / 1000,
                  pomo.doneIntvls,
                  pomoSetting.totalIntervals,
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
