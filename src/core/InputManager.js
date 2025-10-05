const DEFAULT_INPUT_STATE = {
  w: false,
  a: false,
  s: false,
  d: false,
  mouseX: 0,
  mouseY: 0,
  mouseDown: false
};

function createState() {
  return { ...DEFAULT_INPUT_STATE };
}

export class InputManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.state = createState();
    this._setupListeners();
  }

  _setupListeners() {
    this.keyDownHandler = (event) => {
      if (event.repeat) return;
      const key = event.key.toLowerCase();
      if (key in this.state) {
        this.state[key] = true;
      }
    };

    this.keyUpHandler = (event) => {
      const key = event.key.toLowerCase();
      if (key in this.state) {
        this.state[key] = false;
      }
    };

    this.mouseMoveHandler = (event) => {
      const rect = this.canvas.getBoundingClientRect();
      this.state.mouseX = event.clientX - rect.left;
      this.state.mouseY = event.clientY - rect.top;
    };

    this.mouseDownHandler = (event) => {
      if (event.button === 0) {
        this.state.mouseDown = true;
      }
    };

    this.mouseUpHandler = (event) => {
      if (event.button === 0) {
        this.state.mouseDown = false;
      }
    };

    window.addEventListener('keydown', this.keyDownHandler);
    window.addEventListener('keyup', this.keyUpHandler);
    this.canvas.addEventListener('mousemove', this.mouseMoveHandler);
    this.canvas.addEventListener('mousedown', this.mouseDownHandler);
    window.addEventListener('mouseup', this.mouseUpHandler);
  }

  getState() {
    return { ...this.state };
  }

  dispose() {
    window.removeEventListener('keydown', this.keyDownHandler);
    window.removeEventListener('keyup', this.keyUpHandler);
    this.canvas.removeEventListener('mousemove', this.mouseMoveHandler);
    this.canvas.removeEventListener('mousedown', this.mouseDownHandler);
    window.removeEventListener('mouseup', this.mouseUpHandler);
  }
}
