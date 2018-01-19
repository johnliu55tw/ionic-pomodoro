function findNextClosest (arr, elem) {
  if (findNextClosest.lastFoundIdx > 0 &&
      elem > arr[findNextClosest.lastFoundIdx - 1] &&
      elem <= arr[findNextClosest.lastFoundIdx]) {
    return findNextClosest.lastFoundIdx
  }
  let closest = 0
  for (closest = 0; closest < arr.length; closest++) {
    if (elem <= arr[closest]) {
      break
    }
  }
  if (closest === arr.length) {
    // Not found
    findNextClosest.lastFoundIdx = -1
    return -1
  } else {
    findNextClosest.lastFoundIdx = closest
    return closest
  }
}
findNextClosest.lastFoundIdx = 0

export const PomoIntvlState = {
  work: 'work',
  rest: 'rest',
  longRest: 'longRest'
}

export const PomoTimerState = {
  running: 'running',
  paused: 'paused',
  idle: 'idle'
}

export function PomodoroSetting (work, rest, longRest, longRestAfter, totalIntervals) {
  /* Input in minutes, stores in ms */
  this.work = work * 60000
  this.rest = rest * 60000
  this.longRest = longRest * 60000
  this.longRestAfter = longRestAfter
  this.totalIntervals = totalIntervals

  this.getMarkers = (offsetMin = 0) => {
    // Return time markers are in ms
    let timeMarkers = []
    let stateMarkers = []
    let intvlMarkers = []
    for (var i = 1; i <= this.totalIntervals; i++) {
      if (i % this.longRestAfter !== 0) {
        if (i === 1) {  // First one of markers, add either smallest value or useless value
          timeMarkers.push(offsetMin)
          stateMarkers.push(null)
          intvlMarkers.push(0)
        }
        timeMarkers.push(timeMarkers[timeMarkers.length - 1] + this.work)
        stateMarkers.push(PomoIntvlState.work)
        timeMarkers.push(timeMarkers[timeMarkers.length - 1] + this.rest)
        stateMarkers.push(PomoIntvlState.rest)
      } else { // Time for long rest
        timeMarkers.push(timeMarkers[timeMarkers.length - 1] + this.work)
        stateMarkers.push(PomoIntvlState.work)
        timeMarkers.push(timeMarkers[timeMarkers.length - 1] + this.longRest)
        stateMarkers.push(PomoIntvlState.longRest)
      }
      // Calculating markers for done intervals count
      intvlMarkers.push(intvlMarkers[intvlMarkers.length - 1])
      intvlMarkers.push(intvlMarkers[intvlMarkers.length - 1] + 1)
    }
    return {
      length: timeMarkers.length,
      ts: timeMarkers,
      state: stateMarkers,
      intvl: intvlMarkers
    }
  }
}

export function PomodoroTimer (pomoSetting, notifyCallback) {
  /* Takes a PomodoroSetting and three callback functions for state changes as arguments.
  TODO:
    1. Skip function
    2. Recover from closed
  */
  this.pomoSetting = pomoSetting
  this.notifyCallback = notifyCallback

  /* Methods */
  // Reset/Initialize internal states
  this._resetInternalState = () => {
    if (this.notifyTimerHandler) {
      clearTimeout(this.notifyTimerHandler)
    }
    this.notifyTimerHandler = null
    this.timerState = PomoTimerState.idle
    this.intvlState = PomoIntvlState.work
    this.doneIntvls = 0  // Whenever a high interval is finished, it will be increased by 1
    this.startedAt = null
    this.pausedAt = null
    this.countdown = this.pomoSetting.work // Initialized to the time of work interval
    this.intvlMarker = null
  }
  this._resetInternalState()

  this.notify = () => {
    if (this.notifyCallback) {
      this.notifyCallback()
    }
    this.notifyTimerHandler = null
  }

  this.toggle = () => {
    switch (this.timerState) {
      case PomoTimerState.idle: // Start from idle
        this.timerState = PomoTimerState.running
        this.startedAt = Date.now()
        this.intvlMarker = this.pomoSetting.getMarkers(this.startedAt)
        this.notifyTimerHandler = setTimeout(this.notify, this.pomoSetting.work)
        break
      case PomoTimerState.paused: // Start from paused
        this.timerState = PomoTimerState.running
        let now = Date.now()
        let newStartedAt = this.startedAt + now - this.pausedAt
        this.startedAt = newStartedAt
        this.intvlMarker = this.pomoSetting.getMarkers(newStartedAt)
        this.pausedAt = null
        this.update(now)
        this.notifyTimerHandler = setTimeout(this.notify, this.countdown)
        break
      case PomoTimerState.running: // Pause
        this.timerState = PomoTimerState.paused
        this.pausedAt = Date.now()
        clearTimeout(this.notifyTimerHandler)
        this.notifyTimerHandler = null
        break
    }
  }

  this.skip = () => {
    console.log('Not implemented: skip')
  }

  this.reset = () => {
    console.log('Timer reset')
    this._resetInternalState()
  }

  this.update = (now) => {
    if (!now) {
      now = Date.now()
    }
    if (this.timerState === PomoTimerState.running) {
      // Find closest timestamp in markers to now
      let closest = findNextClosest(this.intvlMarker.ts, now)
      if (closest > 0) {
        this.countdown = this.intvlMarker.ts[closest] - now // Update countdown value
        this.intvlState = this.intvlMarker.state[closest] // Update interval state
        this.doneIntvls = this.intvlMarker.intvl[closest]
      } else { // End
        console.log('Timer end')
        this._resetInternalState()
      }
      // Setup notification
      if (!this.notifyTimerHandler) {
        console.log('Setup notify handler countdown for: ' + this.countdown.toString())
        // Note: When the notify() method awaked the screen and caused this
        // method got called, the current timestamp might haven't passed the
        // time that marked the interval change, so the countdown will be a very
        // small value. So we set a handler here that if the countdown is
        // smaller than 2 seconds, call update again later.
        if (this.countdown < 2000) {
          console.log('Countdown < 2 secs: ' + this.countdown.toString() + ', call later!')
          setTimeout(this.update, 2000)
        } else {
          this.notifyTimerHandler = setTimeout(this.notify, this.countdown)
        }
      }
    }
  }
}
