class Display {
  constructor(scale) {
    this.cols = 64;
    this.rows = 32;
    this.scale = scale;

    this.canvas = document.getElementById('screen');
    this.ctx = this.canvas.getContext('2d');

    this.canvas.width = this.cols * this.scale;
    this.canvas.height = this.rows * this.scale;

    this.display = new Array(this.cols * this.rows).fill(0);
  }

  update() {
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

  setPixel(x, y, value) {
    const pixelLocation = x + (y * this.cols);
    const collision = this.display[pixelLocation] & value;
    this.display[pixelLocation] ^= value;
    return collision;
    // console.log('SETPIX, ', value, pixelLocation, this.display[pixelLocation]);
  }

  clear() {
    this.display = new Array(this.cols * this.rows).fill(0);
    this.update();
  }

}

export default Display;