class Debuger {
  constructor(debugRegistersElement, debugTraceElement, decodeElement) {
    this.debugRegistersElement = debugRegistersElement;
    this.decodeElement = decodeElement;
    this.debugTraceElement = debugTraceElement;
    this.enabled = true;
    this.logCount = 0;
    this.programData = new Uint8Array(4096 - 0x200);
  }
  setProgramData(programData) {
    for (let i = programData.length; i >= 0 ; i -= 2) {
      const byte1 = programData[i];
      const byte2 = programData[i + 1];
      const value16 = byte1 << 8 | byte2;
      this.decodeElement.innerHTML = `<span id="PD${i}">${value16.toString(16)}</span><br />${this.decodeElement.innerHTML}`
    }
  }
  setPC(pc) {
    this.pc = pc;
    // console.log(pc)
  }

  disable() {
    this.enabled = false;
  }

  updateRegisters(registers) {
    if (this.enabled) {
      this.debugRegistersElement.innerHTML = registers.join('|');
    }
  }


  log(message) {
    if (this.enabled) {
      this.logCount += 1;
      if (this.logCount >= 5) {
        this.logCount = 0;
        this.debugTraceElement.innerHTML = `${message}`;
      } else {
        this.debugTraceElement.innerHTML = `${message}<br/>${this.debugTraceElement.innerHTML}`;
      }
    }
  }
}

export default Debuger;