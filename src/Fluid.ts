import P5 from "p5";

const N = 50;
const SCALE = 12;

const IX = (x: number, y: number) => {
	return x + (N + 2) * y;
};
function set_bnd(N: number, b: number, x: Array<number>) {
	var i;
	for (i = 1; i <= N; i++) {
		x[IX(0, i)] = b == 1 ? -x[IX(1, i)] : x[IX(1, i)];
		x[IX(N + 1, i)] = b == 1 ? -x[IX(N, i)] : x[IX(N, i)];
		x[IX(i, 0)] = b == 2 ? -x[IX(i, 1)] : x[IX(i, 1)];
		x[IX(i, N + 1)] = b == 2 ? -x[IX(i, N)] : x[IX(i, N)];
	}
	x[IX(0, 0)] = 0.5 * (x[IX(1, 0)] + x[IX(0, 1)]);
	x[IX(0, N + 1)] = 0.5 * (x[IX(1, N + 1)] + x[IX(0, N)]);
	x[IX(N + 1, 0)] = 0.5 * (x[IX(N, 0)] + x[IX(N + 1, 1)]);
	x[IX(N + 1, N + 1)] = 0.5 * (x[IX(N, N + 1)] + x[IX(N + 1, N)]);
}

function addSource(N: number, x: Array<number>, s: Array<number>, dt: number) {
	var size = (N + 2) * (N + 2);
	for (var i = 0; i < size; i++) {
		x[i] += dt * s[i];
	}
}

function diffuse(
	N: number,
	b: number,
	x: Array<number>,
	x0: Array<number>,
	diff: number,
	dt: number
) {
	var a = dt * diff * N * N;
	for (var k = 0; k < 20; k++) {
		for (var i = 1; i <= N; i++) {
			for (var j = 1; j <= N; j++) {
				x[IX(i, j)] =
					(x0[IX(i, j)] +
						a *
							(x[IX(i - 1, j)] +
								x[IX(i + 1, j)] +
								x[IX(i, j - 1)] +
								x[IX(i, j + 1)])) /
					(1 + 4 * a);
			}
		}
		set_bnd(N, b, x);
	}
}

function advect(
	N: number,
	b: number,
	d: Array<number>,
	d0: Array<number>,
	u: Array<number>,
	v: Array<number>,
	dt: number
) {
	var i, j, i0, j0, i1, j1;
	var x, y, s0, t0, s1, t1, dt0;
	dt0 = dt * N;
	for (i = 1; i <= N; i++) {
		for (j = 1; j <= N; j++) {
			x = i - dt0 * u[IX(i, j)];
			y = j - dt0 * v[IX(i, j)];
			//RECHECK
			if (x < 0.5) x = 0.5;
			if (x > N + 0.5) x = N + 0.5;
			i0 = Math.floor(x);
			i1 = i0 + 1;
			if (y < 0.5) y = 0.5;
			if (y > N + 0.5) y = N + 0.5;
			j0 = Math.floor(y);
			j1 = j0 + 1;
			// ^^ RECHECK ^^
			s1 = x - i0;
			s0 = 1 - s1;
			t1 = y - j0;
			t0 = 1 - t1;
			d[IX(i, j)] =
				s0 * (t0 * d0[IX(i0, j0)] + t1 * d0[IX(i0, j1)]) +
				s1 * (t0 * d0[IX(i1, j0)] + t1 * d0[IX(i1, j1)]);
		}
	}
	set_bnd(N, b, d);
}

function dens_step(
	N: number,
	x: Array<number>,
	x0: Array<number>,
	u: Array<number>,
	v: Array<number>,
	diff: number,
	dt: number
) {
	// addSource(N, x, x0, dt);

	//SWAP
	var temp = x0;
	x0 = x;
	x = temp;
	diffuse(N, 0, x, x0, diff, dt);

	//SWAP
	var temp = x0;
	x0 = x;
	x = temp;
	advect(N, 0, x, x0, u, v, dt);
}

function vel_step(
	N: number,
	u: Array<number>,
	v: Array<number>,
	u0: Array<number>,
	v0: Array<number>,
	visc: number,
	dt: number
) {
	addSource(N, u, u0, dt);
	addSource(N, v, v0, dt);
	//SWAP
	var temp = u0;
	u0 = u;
	u = temp;
	diffuse(N, 1, u, u0, visc, dt);

	//SWAP
	var temp = v0;
	v0 = v;
	v = temp;

	diffuse(N, 2, v, v0, visc, dt);
	project(N, u, v, u0, v0);

	//SWAP
	var temp = u0;
	u0 = u;
	u = temp;

	var temp = v0;
	v0 = v;
	v = temp;

	advect(N, 1, u, u0, u0, v0, dt);
	advect(N, 2, v, v0, u0, v0, dt);
	project(N, u, v, u0, v0);
}

function project(
	N: number,
	u: Array<number>,
	v: Array<number>,
	p: Array<number>,
	div: Array<number>
) {
	var i, j, k;
	var h;
	h = 1.0 / N;
	for (i = 1; i <= N; i++) {
		for (j = 1; j <= N; j++) {
			div[IX(i, j)] =
				-0.5 *
				h *
				(u[IX(i + 1, j)] - u[IX(i - 1, j)] + v[IX(i, j + 1)] - v[IX(i, j - 1)]);
			p[IX(i, j)] = 0;
		}
	}
	set_bnd(N, 0, div);
	set_bnd(N, 0, p);
	for (k = 0; k < 20; k++) {
		for (i = 1; i <= N; i++) {
			for (j = 1; j <= N; j++) {
				p[IX(i, j)] =
					(div[IX(i, j)] +
						p[IX(i - 1, j)] +
						p[IX(i + 1, j)] +
						p[IX(i, j - 1)] +
						p[IX(i, j + 1)]) /
					4;
			}
		}
		set_bnd(N, 0, p);
	}
	for (i = 1; i <= N; i++) {
		for (j = 1; j <= N; j++) {
			u[IX(i, j)] -= (0.5 * (p[IX(i + 1, j)] - p[IX(i - 1, j)])) / h;
			v[IX(i, j)] -= (0.5 * (p[IX(i, j + 1)] - p[IX(i, j - 1)])) / h;
		}
	}
	set_bnd(N, 1, u);
	set_bnd(N, 2, v);
}

export default class Fluid {
	size: number = (N + 2) * (N + 2);
	u: Array<number> = new Array(this.size).fill(0);
	v: Array<number> = new Array(this.size).fill(0);
	u_prev: Array<number> = new Array(this.size).fill(0);
	v_prev: Array<number> = new Array(this.size).fill(0);
	density: Array<number> = new Array(this.size).fill(0);
	density_prev: Array<number> = new Array(this.size).fill(0);
	visc: number = 0;
	diff: number = 0;

	constructor() {}

	step(dt: number) {
		// get_from_UI ( dens_prev, u_prev, v_prev );
		vel_step(N, this.u, this.v, this.u_prev, this.v_prev, this.visc, dt);
		dens_step(
			N,
			this.density,
			this.density_prev,
			this.u,
			this.v,
			this.diff,
			dt
		);

		// this.density.forEach((x,i)=>{x=x-x/2});
	}

	renderD(p5: P5) {
		for (var x = 0; x < N; x++) {
			for (var y = 0; y < N; y++) {
				p5.fill(this.density[IX(x, y)]);
				p5.rect(x * SCALE, y * SCALE, SCALE, SCALE);
			}
		}
	}

	renderV(p5: P5) {
		for (var x = 0; x < N; x++) {
			for (var y = 0; y < N; y++) {
				let xpos = x * SCALE;
				let ypos = y * SCALE;
				let vx = this.u[IX(x, y)];
				let vy = this.v[IX(x, y)];
				p5.stroke(0);

				// (dx, dy): vector form "posA" to "posB"
				let dx = vx;
				let dy = vy;

				// dist : euclidean distance, length of the vecotr
				let dist = Math.sqrt(dx * dx + dy * dy);

				// (ux, uy): unit vector form 'posA' in direction to 'posB', with length 1
				let ux = dx / dist;
				let uy = dy / dist;

				let x2 = xpos + ux * SCALE * 0.8;
				let y2 = ypos + uy * SCALE * 0.8;
				p5.line(xpos, ypos, x2, y2);
				// if (!(p5.abs(vx) < 0.1 && p5.abs(vy) <= 0.1)) {
				// }
			}
		}
	}

	add(x: number, y: number, amount: number,p5:P5) {
		this.density[IX(Math.floor(x / SCALE), Math.floor(y / SCALE))] += amount * 1000;

		this.u[IX(Math.floor(x / SCALE), Math.floor(y / SCALE))] += amount * Math.abs((p5.pmouseX-p5.mouseX))+1;
		this.v[IX(Math.floor(x / SCALE), Math.floor(y / SCALE))] += amount * Math.abs((p5.pmouseY-p5.mouseY))+1;

	}
}
