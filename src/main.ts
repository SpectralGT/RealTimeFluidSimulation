import P5 from "p5";
import Fluid from "./Fluid";

var fluid:Fluid;

const sketch = (p5: P5) => {
	p5.setup = () => {
		const canvas = p5.createCanvas(600, 600,p5.P2D);
		canvas.parent("app");
    p5.background(200);
    
    fluid = new Fluid();
	};
  
	p5.draw = () => {
    p5.background(200);
    if(p5.mouseIsPressed){
      fluid.add(p5.mouseX,p5.mouseY,100,p5);
    }
    
    fluid.step(0.01);
    fluid.renderD(p5);
    // fluid.renderV(p5);    
	};
};

new P5(sketch);
