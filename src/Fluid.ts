const N = 600;

const XI = (x: number, y: number) => {
	return x + (N + 2) * y;
};

export default class Fluid {
	size: number = (N + 2) * (N + 2);
	u: Array<number> = new Array(this.size).fill(0);
	v: Array<number> = new Array(this.size).fill(0);
	u_prev: Array<number> = new Array(this.size).fill(0);
	v_prev: Array<number> = new Array(this.size).fill(0);
	density: Array<number> = new Array(this.size).fill(0);
	density_prev: Array<number> = new Array(this.size).fill(0);

	constructor() {}

  
	addSource(N: number, x: Array<number>, s: Array<number>, dt: number) {
		var size = (N + 2) * (N + 2);
		for (var i = 0; i < size; i++) {
			x[i] += dt * s[i];
		}
	}
}
