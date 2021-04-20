class Renderer {
  constructor(scale) {
    this.cols = 64;
    this.rows = 32;
    this.scale = scale;

    this.canvas = document.getElementById('screen');
    this.ctx = this.canvas.getContext('2d');

    this.canvas.width = this.cols * this.scale;
    this.canvas.height = this.rows * this.scale;

    this.display = new Array(this.cols * this.rows);

  }

  setPixel(x, y, value) {
    let pixelLoc = x + (y * this.cols);
    this.display[pixelLoc] ^= value;

    return !this.display[pixelLoc];
  }

  // drawPixel(x, y, value) {
  //   // If collision, will return true
  //   const collision = this.frameBuffer[y][x] & value
  //   // Will XOR value to position x, y
  //   this.frameBuffer[y][x] ^= value

  //   if (this.frameBuffer[y][x]) {
  //     this.context.fillStyle = COLOR
  //     this.context.fillRect(
  //       x * this.multiplier,
  //       y * this.multiplier,
  //       this.multiplier,
  //       this.multiplier
  //     )
  //   } else {
  //     this.context.fillStyle = 'black'
  //     this.context.fillRect(
  //       x * this.multiplier,
  //       y * this.multiplier,
  //       this.multiplier,
  //       this.multiplier
  //     )
  //   }

  //   return collision
  // }

  clear() {
    this.display = new Array(this.cols * this.rows);
  }

  render() {
    // Clears the display every render cycle. Typical for a render loop.
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Loop through our display array
    for (let i = 0; i < this.cols * this.rows; i++) {
      // Grabs the x position of the pixel based off of `i`
      let x = (i % this.cols) * this.scale;

      // Grabs the y position of the pixel based off of `i`
      let y = Math.floor(i / this.cols) * this.scale;

      // If the value at this.display[i] == 1, then draw a pixel.
      if (this.display[i]) {
        // Set the pixel color to GREEN
        this.ctx.fillStyle = '#0F0';

        // Place a pixel at position (x, y) with a width and height of scale
        this.ctx.fillRect(x, y, this.scale, this.scale);
      }
    }
  }

  drawSprite(x, y, spriteData) {
    let unset = false;
    for (let i = 0; i < spriteData.length; i++) {
      const line = spriteData[i];
      let bit = 0;
      for (let k = 7; k >= 0; k -= 1) {
        let mask = 1 << k;
        if ((line & mask) != 0) {
          unset = this.setPixel(x+bit, y+i);
        }
        bit += 1;
      }
    }
    return unset;
  }


  testRender() {
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
    // let char = [];
    for (let index = 0; index < FONT.length - 15; index += 5) {
      this.drawSprite(index, 14, FONT.slice(index, index + 5));
    }
  }

  testCollision() {
    console.log('SET PIX', this.setPixel(10, 10));
    console.log('SET PIX AGIN', this.setPixel(10, 10));
    this.setPixel(20,20);
    this.render();

  }
}

export default Renderer;