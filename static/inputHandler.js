class InputHandler {
  constructor() {
    window.addEventListener("keydown", function (event) {
      console.log(event.key);
    }, true);

  }
  handleInput() {

  }
}

export default InputHandler;