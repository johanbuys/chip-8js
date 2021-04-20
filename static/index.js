/*
Memory Map:
+---------------+= 0xFFF (4095) End of Chip-8 RAM
|               |
|               |
|               |
|               |
|               |
| 0x200 to 0xFFF|
|     Chip-8    |
| Program / Data|
|     Space     |
|               |
|               |
|               |
+- - - - - - - -+= 0x600 (1536) Start of ETI 660 Chip-8 programs
|               |
|               |
|               |
+---------------+= 0x200 (512) Start of most Chip-8 programs
| 0x000 to 0x1FF|
| Reserved for  |
|  interpreter  |
+---------------+= 0x000 (0) Start of Chip-8 RAM
*/
import Render from './renderer';
import Cpu from './cpu';
import Debuger from './debugView';

import IBM from 'url:./roms/ibm.c8';
import TEST from 'url:./roms/test_opcode.c8';
import TEST2 from 'url:./roms/c8_test.c8';
import maze from 'url:./roms/maze.c8';
import blinky from 'url:./roms/blinky.c8';
import octojam1 from 'url:./roms/octojam1title.ch8';
import davidmaze from 'url:./roms/mazeAlt.c8';
import Sierpinski from 'url:./roms/Sierpinski.ch8';
import ZeroDemo from 'url:./roms/ZeroDemo.ch8';

const CLOCK_FREQ_HZ = 60;
const SCALE_FACTOR = 10;

// UI
const stepButton = document.getElementById('step');
const startButton = document.getElementById('start');
const stopButton = document.getElementById('stop');
const resetButton = document.getElementById('reset');
const debugButton = document.getElementById('debug');

const debugRegistersEle = document.getElementById('debug-registers');
const debugTraceEle = document.getElementById('debug-trace');
const decodeElement = document.getElementById('decode-trace');
const dbg = new Debuger(debugRegistersEle, debugTraceEle, decodeElement);

// const renderer = new Render(SCALE_FACTOR);
// const display = new Display(SCALE_FACTOR);
const cpu = new Cpu(dbg, SCALE_FACTOR);
let runTimer;

const loadProgram = () => {
  fetch(ZeroDemo)
    .then(
      function (response) {
        if (response.status !== 200) {
          console.log('Looks like there was a problem. Status Code: ' +
            response.status);
          return;
        }

        // Examine the text in the response
        response.arrayBuffer().then(function (data) {
          var z = new Uint8Array(data);
          cpu.loadProgram(z);
        });
      }
    )
    .catch(function (err) {
      console.log('Fetch Error :-S', err);
    });
};


const keyMap = {
  'x': 0x0,
  '1': 0x1,
  '2': 0x2,
  '3': 0x3,
  'q': 0x4,
  'w': 0x5,
  'e': 0x6,
  'a': 0x7,
  's': 0x8,
  'd': 0x9,
  'z': 0xA,
  'c': 0xB,
  '4': 0xC,
  'r': 0xD,
  'f': 0xE,
  'v': 0xF,
}
window.addEventListener("keydown", function (event) {
  const key = keyMap[event.key];
  cpu.onKeyDown(key);
}, true);

window.addEventListener("keyup", function (event) {
  const key = keyMap[event.key];
  cpu.onKeyUp(key);
}, true);

const run = () => {
  runTimer = setInterval(() => {
    if (cpu.soundTimer > 0) {
      cpu.soundTimer -= 1;
    }
    if (cpu.delayTimer > 0) {
      cpu.delayTimer -= 1;
    }
    let cpuCycles = 600 /  CLOCK_FREQ_HZ; // 10 times clock
    cpu.cycle(cpuCycles);
  }, 1000 / CLOCK_FREQ_HZ);
};


const start = () => {
  stepButton.onclick = () => {
    cpu.step();
  };
  startButton.onclick = () => {
    if (!runTimer) {
      run();
    }
  };
  stopButton.onclick = () => {
    clearInterval(runTimer);
    runTimer = null;
  };
  resetButton.onclick = () => {
    clearInterval(runTimer);
    runTimer = null;
    cpu.reset();
    loadProgram();
  };
  debugButton.onclick = () => {
    cpu.toggleDebug();
  };
};

loadProgram();
const checkIfProgReady = () => {
  console.log('IS ready?');
  if (!cpu.programLoaded) {
    setTimeout(checkIfProgReady, 500);
  } else {
    start();
  }
};
setTimeout(checkIfProgReady, 1000);
