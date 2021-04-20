import Display from './display';
/*
  0x000-0x1FF - Chip 8 interpreter (contains font set in emu)
  0x050-0x0A0 - Used for the built in 4x5 pixel font set (0-F)
  0x200-0xFFF - Program ROM and work RAM
*/

class Cpu {
  constructor(dbg, SCALE_FACTOR) {
    this.dbg = dbg;
    // this.renderer = renderer;
    this.display = new Display(SCALE_FACTOR);
    this.reset();
  }

  toggleDebug() {
    this.dbg.enabled = !this.dbg.enabled;
  }

  loadFonts() {
    const FONT = [
      0xF0, 0x90, 0x90, 0x90, 0xF0, // 0

      0x20, 0x60, 0x20, 0x20, 0x70, // 1

      0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2

      0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3

      0x90, 0x90, 0xF0, 0x10, 0x10, // 4

      0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5

      0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6

      0xF0, 0x10, 0x20, 0x40, 0x40, // 7

      0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8

      0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9

      0xF0, 0x90, 0xF0, 0x90, 0x90, // A

      0xE0, 0x90, 0xE0, 0x90, 0xE0, // B

      0xF0, 0x80, 0x80, 0x80, 0xF0, // C

      0xE0, 0x90, 0x90, 0x90, 0xE0, // D

      0xF0, 0x80, 0xF0, 0x80, 0xF0, // E

      0xF0, 0x80, 0xF0, 0x80, 0x80, // F
    ];

    FONT.forEach((char, i) => {
      this.memory[i] = char;
    });
  }

  loadProgram(programData, config = { shift_quirk: true }) {
    this.memory.set(programData, 0x200);
    this.programLoaded = true;
    this.shift_quirk = config.shift_quirk;
  }

  reset() {
    this.memory = new Uint8Array(4096);
    this.loadFonts();
    this.programLoaded = false;
    this.v = new Uint8Array(16); // registers
    this.i = 0; // I Address
    this.pc = 0x200; // Program counter starts executing at 0x200
    this.opcode = 0; // Current OPCode
    this.stack = new Uint16Array(16);
    this.stackPointer = -1;
    this.opcodeLog = [];
    this.shift_quirk = true;


    this.soundTimer = 0;
    this.delayTimer = 0;
    if (this.display) {
      this.display.clear();
      this.display.update();
    }
  }

  cycle(cycles) {
    for (let index = 0; index <= cycles; index++) {
      this.step();
    }
  }

  onKeyDown(key) {
    this.currentKey = key;
  }
  
  onKeyUp(key) {
    this.currentKey = null;
  }

  getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
  }

  step() {
    // fetch();

    if (this.pc >= 4095) {
      console.log("Halt and catch fire");
      throw new Error("MEMORY OUT OF BOUNDS");
    } else {
      const byte1 = this.memory[this.pc];
      const byte2 = this.memory[this.pc + 1];
      this.pc += 2;
      const value16 = byte1 << 8 | byte2;
      this.opcode = value16;
      const opcprefix = this.opcode & 0xF000;
      const NNN = this.opcode & 0x0FFF;
      const NN =  this.opcode & 0x00FF;
      const N =   this.opcode & 0x000F;
      const X =  (this.opcode & 0x0F00) >> 8;
      const Y =  (this.opcode & 0x00F0) >> 4;
      this.dbg.updateRegisters(this.v);
      
      this.dbg.log(`PC: ${this.pc.toString(16)}: OPCODE: ${this.opcode.toString(16)} I: ${this.i.toString(16)} MEM: ${this.memory[this.i].toString(16)}`);
      this.dbg.addOpcodeToLog(value16.toString(16))

      switch (opcprefix) {
        case 0x0: {
          if (this.opcode === 0xe0) {
            this.display.clear()
            this.display.update();
          }
          if (this.opcode === 0x00EE) {
            this.pc = this.stack[this.stackPointer];
            this.stackPointer -= 1;
            // this.pc = this.stack.pop();
          }
          break;
        }
        case 0x1000: {
          // 1NNN	Jump to address NNN
          this.pc = NNN;
          break;
        }
        case 0x2000: {
          this.stackPointer += 1;
          this.stack[this.stackPointer] = this.pc;
          // this.stack.push(this.pc);
          this.pc = NNN;
          break;
        }
        case 0x3000: {
          // 3XNN	Skip the following instruction if the value of register VX equals NN
          if (this.v[X] === NN) {
            this.pc += 2;
          }
          break;
        }
        case 0x4000: {
          // 4XNN	Skip the following instruction if the value of register VX is not equal to NN
          if (this.v[X] !== NN) {
            this.pc += 2;
          }
          break;
        }
        case 0x5000: {
          // 5XY0	Skip the following instruction if the value of register VX is equal to the value of register VY
          if (this.v[X] === this.v[Y]) {
            this.pc += 2;
          }
          break;
        }
        case 0x6000: {
          // 6XNN	Store number NN in register VX
          this.v[X] = NN;
          break;
        }
        case 0x7000: {
          // 7XNN Add the value NN to register VX
          this.v[X] = this.v[X] + NN;
          break;
        }
        case 0x8000: {
          // 7XNN Add the value NN to register VX
          switch (this.opcode & 0x000F) {
            case 0x0: {
              // 8XY0	Store the value of register VY in register VX
              this.v[X] = this.v[Y];
              break;
            }
            case 0x1: {
              // 8XY1	Set VX to VX OR VY
              this.v[X] = this.v[X] | this.v[Y];
              break;
            }
            case 0x2: {
              // 8XY2	Set VX to VX AND VY
              this.v[X] = this.v[X] & this.v[Y];
              break;
            }
            case 0x3: {
              // 8XY3	Set VX to VX XOR VY
              this.v[X] = this.v[X] ^ this.v[Y];
              break;
            }
            case 0x4: {
              /*
                  8XY4
                  Add the value of register VY to register VX
                  Set VF to 01 if a carry occurs
                  Set VF to 00 if a carry does not occur
               */
              if (this.v[X] + this.v[Y] > 255) {
                this.v[0xF] = 1;
              } else {
                this.v[0xF] = 0;
              }
              this.v[X] += this.v[Y];
              
              break;
            }
            case 0x5: {
              /*
                  8XY5
                  Subtract the value of register VY from register VX
                  Set VF to 00 if a borrow occurs
                  Set VF to 01 if a borrow does not occur
              */
              if (this.v[X] > this.v[Y]) {
                this.v[0xF] = 1;
              } else if (this.v[X] - this.v[Y] < 0) {
                this.v[0xF] = 0;
              }
              this.v[X] = this.v[X] - this.v[Y];
              break;
            }
            case 0x6: {
              // 8XY6
              // Store the value of register VY shifted right one bit in register VX¹
              // Set register VF to the least significant bit prior to the shift
              // VY is unchanged
              /*
              Step by step:
                1. (Optional, or configurable) Set VX to the value of VY
                2. Shift the value of VX one bit to the right (8XY6) or left ( 8XYE`)
                3. Set VF to 1 if the bit that was shifted out was 1, or 0 if it was 0
              */
              // this.dbg.log("8XY6 ", this.opcode.toString(16), X, Y);
              let y = this.shift_quirk ? X : Y;
              this.v[0xF] = this.v[y] & 0x01;

              let temporary = this.v[y] >> 1;
              this.v[X] = temporary;

              // let mask = 1 << 8;
              // this.v[X] = this.v[Y];
              // this.v[0xF] = this.v[X] & mask;
              // this.v[X] = this.v[X] >> 1
              break;
            }
            case 0x7: {
              /*
                8XY7	Set register VX to the value of VY minus VX
                      Set VF to 00 if a borrow occurs
                      Set VF to 01 if a borrow does not occur
              */
              if (this.v[Y] > this.v[X]) {
                this.v[0xF] = 1;
              } else if (this.v[Y] - this.v[X] < 0) {
                this.v[0xF] = 0;
              }
              this.v[X] = this.v[Y] - this.v[X];
              break;
            }
            case 0xE: {
              /*
                8XYE	Store the value of register VY shifted left one bit in register VX¹
                      Set register VF to the most significant bit prior to the shift
                      VY is unchanged
              */
              let y = this.shift_quirk ? X : Y;
              this.v[0xF] = this.v[y] & 0x01;
              let temporary = this.v[y] << 1;
              this.v[X] = temporary;
              break;
            }
            default:
              this.dbg.log("UNKOWN OP", this.opcode.toString(16));
              console.log("UNKOWN OP", this.opcode.toString(16));
              break;
          }
          break;
        }
        case 0x9000: {
          // 9XY0	Skip the following instruction if the value of register VX is not equal to the value of register VY
          if (this.v[X] !== this.v[Y]) {
            this.pc += 2;
          }
          break;
        }
        case 0xA000: {
          this.i = NNN;
          break;
        }
        case 0xB000: {
          // BNNN	Jump to address NNN + V0
          this.pc = NNN + this.v[0];
          break;
        }
        case 0xC000: {
          // CXNN	Set VX to a random number with a mask of NN
          const rand = this.getRandomInt(0, 255);
          this.v[X] = rand & NN;
          break;
        }
        case 0xD000: {
          /*
          Draw a sprite at position VX, VY with N bytes of sprite data starting at the address stored in I
          Set VF to 01 if any set pixels are changed to unset, and 00 otherwise
          */
          // this.v[0xF] = 
          // this.renderer.drawSprite(this.v[X], this.v[Y], this.memory.slice(this.i, this.i + N));
          
          // const spriteData = this.memory.slice(this.i, this.i + N);
          this.v[0xf] = 0;
          // drawSprite(x, y, spriteData) {

          for (let i = 0; i < N; i++) {
            let line = this.memory[this.i + i]
            // Each byte is a line of eight pixels
            for (let position = 0; position < 8; position++) {
              // Get the byte to set by position
              let value = line & (1 << (7 - position)) ? 1 : 0
              // If this causes any pixels to be erased, VF is set to 1
              const xCord = (this.v[X] + position) % 64 // wrap around width
              const yCord = (this.v[Y] + i) % 32;
              if (this.display.setPixel(xCord, yCord, value)) {
                this.v[0xf] = 1
              }
            }
          }


            // for (let i = 0; i < N; i++) {
            //   const line = this.memory[this.i + i];
            //   let bit = 0;
            //   for (let k = 7; k >= 0; k -= 1) {
            //     let mask = 1 << k;
            //     let value = line & mask;
            //     if (this.display.setPixel(xCord + bit, yCord + i, value)) {
            //       this.v[0xf] = 1;
            //     }
            //     bit += 1;
            //   }
            // }
          //   return unset;
          // }
          this.display.update();
          break;
        }
        case 0xE000: {
          switch (this.opcode & 0x000F) {
            case 0xE: {
              /*
                EX9E	Skip the following instruction if the key corresponding to the hex value currently stored in register VX is pressed
              */
              if (this.v[X] === this.currentKey) {
                this.pc += 2;
              }
              break;
            }
            case 0x1: {
              /*
                EXA1 skips if the key corresponding to the value in VX is not pressed.
              */
              if (this.v[X] !== this.currentKey) {
                this.pc += 2;
              }
              break;
            }
            default:
              this.dbg.log("UNKOWN OP", this.opcode.toString(16));
              console.log("UNKOWN OP", this.opcode.toString(16));
              break;
          }

          break;
        }
        case 0xF000: {
          switch (this.opcode & 0x00FF) {
            case 0x07: {
              this.v[X] = this.delayTimer;
              break;
            }
            case 0x15: {
              this.delayTimer = this.v[X];
              break;
            }
            case 0x18: {
              this.soundTimer = this.v[X];
              break;
            }
            case 0x1E: {
              this.i += this.v[X];
              break;
            }
            case 0x0A: {
              if (this.currentKey) {
                this.v[X] = this.currentKey
              } else {
                this.pc -= 2;
              }
              break;
            }
            case 0x29: {
              const char = this.v[X];
              this.i = char * 5;
              break;
            }
            case 0x33: {
              // FX33	Store the binary-coded decimal equivalent of the value stored in register VX at addresses I, I + 1, and I + 2
              let hundredes = Math.floor((this.v[X] / 100) % 10);
              let tens = Math.floor((this.v[X] / 10) % 10);
              let ones = Math.floor(this.v[X] % 10);
              this.memory[this.i] = hundredes;
              this.memory[this.i + 1] = tens;
              this.memory[this.i + 2] = ones;
              break;
            }
            case 0x55: {
              // FX55	Store the values of registers V0 to VX inclusive in memory starting at address I
              //      I is set to I + X + 1 after operation²
              this.memory.set(this.v.slice(0, X+1), this.i);
              break;
            }
            case 0x65: {
              // FX55	Fill registers V0 to VX inclusive with the values stored in memory starting at address I
              //      I is set to I + X + 1 after operation²
              this.v.set(this.memory.slice(this.i, this.i + X + 1), 0);
              break;
            }

            //1E
            default:
              this.dbg.log("UNKOWN OP", this.opcode.toString(16));
              console.log("UNKOWN OP", this.opcode.toString(16));
              break;
          }
          break;
        }

      
        default:
          this.dbg.log("UNKOWN OP", this.opcode.toString(16));
          console.log("UNKOWN OP", this.opcode.toString(16));
          break;
      }
    }
  }
}

export default Cpu;