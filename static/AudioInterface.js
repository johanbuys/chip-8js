class AudioInterface {
  constructor() {
    this.context = new window.AudioContext();
    this.currentOscillator = null;
    this.volume = this.context.createGain();
    this.volume.gain.value = 0.5;
    this.volume.connect(this.context.destination);
  }

  emitTone() {

    /* Create the objects needed to play a tone */
    console.log('Beep!');


    this.volume.gain.value = 0.5;
    this.currentOscillator = this.context.createOscillator();
    this.currentOscillator.type = "square";
    this.currentOscillator.connect(this.volume);
    this.currentOscillator.frequency.value = "400";
    this.currentOscillator.start();
    
  }

  stopTone() {
    if (this.currentOscillator) {
      this.volume.gain.value = 0;
      this.currentOscillator.stop(this.context.currentTime);
    }
  }
}

export default AudioInterface;
