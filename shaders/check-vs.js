const shader = `
attribute vec4 a_position;

void main() {
   gl_Position = a_position;
}`;

export { shader };
