
function cAverage(){
	
}

cAverage.prototype = {
	iSamples: 0,
	dCurAvg: 0,
	adSamples: []
}

cAverage.prototype.toString = function(){ return "cAverage{ avg:" + this.dCurAvg + ", samples: "+this.iSamples+" }"; }


cAverage.prototype.GetAverage = function(){ return this.dCurAvg; }

cAverage.prototype.AddSample = function(dSample){
	this.dCurAvg = (this.dCurAvg * this.iSamples + dSample) / (this.iSamples + 1);
	this.iSamples++;
}

cAverage.prototype.RemSample = function(dSample){
	this.dCurAvg = (this.dCurAvg * this.iSamples - dSample) / (this.iSamples - 1);
	this.iSamples--;
}



//cAverage.prototype. = function(){}
 
/*

	var oAvg = new cAverage();
	oAvg.AddSample(1.0);
	oAvg.AddSample(2.0);
	_dw.Write(oAvg);
	oAvg.AddSample(4.0);
	_dw.Write(oAvg);
	oAvg.RemSample(1.0);
	_dw.Write(oAvg);


	Output: 
	
cAverage{ avg:1.5, samples: 2 }
cAverage{ avg:2.3333333333333335, samples: 3 }
cAverage{ avg:3, samples: 2 }
*/