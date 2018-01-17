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

export function PomodoroTimer (pomoSetting) {
  /* Takes a PomodoroSetting and three callback functions for state changes as arguments.
  TODO:
    1. Vibrate on every interval state change
    2. Skip function
    3. Recover from closed
  */
  this.pomoSetting = pomoSetting

  /* Methods */
  // Reset/Initialize internal states
  this._resetInternalState = () => {
    this.timerState = PomoTimerState.idle
    this.intvlState = PomoIntvlState.work
    this.doneIntvls = 0  // Whenever a high interval is finished, it will be increased by 1
    this.startedAt = null
    this.pausedAt = null
    this.countdown = this.pomoSetting.work // Initialized to the time of work interval
    this.intvlMarker = null
  }
  this._resetInternalState()

  this.toggle = () => {
    switch (this.timerState) {
      case PomoTimerState.idle: // Start from idle
        this.timerState = PomoTimerState.running
        this.startedAt = Date.now()
        this.intvlMarker = this.pomoSetting.getMarkers(this.startedAt)
        break
      case PomoTimerState.paused: // Start from paused
        this.timerState = PomoTimerState.running
        let now = Date.now()
        let newStartedAt = this.startedAt + now - this.pausedAt
        this.startedAt = newStartedAt
        this.intvlMarker = this.pomoSetting.getMarkers(newStartedAt)
        this.pausedAt = null
        this.update(now)
        break
      case PomoTimerState.running: // Pause
        this.timerState = PomoTimerState.paused
        this.pausedAt = Date.now()
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
    if (this.timerState === PomoTimerState.running) {
      // Find closest timestamp in markers to now
      let closest = 0
      for (closest = 0; closest < this.intvlMarker.length; closest++) {
        if (now <= this.intvlMarker.ts[closest]) {
          break
        }
      }
      if (closest !== this.intvlMarker.length) {
        this.countdown = this.intvlMarker.ts[closest] - now // Update countdown value
        this.intvlState = this.intvlMarker.state[closest] // Update interval state
        this.doneIntvls = this.intvlMarker.intvl[closest]
      } else { // End
        console.log('Timer end')
        this._resetInternalState()
      }
    }
  }
}
