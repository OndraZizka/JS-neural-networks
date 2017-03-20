/**************************************************************
  Trida pro pravidelnou sit rozprostrenou v prostorech         
**************************************************************/
function cNeuralNetCube(iSideLength, iDimensions){
	this.iDimensions = iDimensions;
	this.iSideLength = iSideLength;
	this.iCellsNum = Math.pow(iSideLength, iDimensions);
	//this.CreateNeurons(Math.pow(iSideLength, iDimensions));
	//this.ConnectNeurons(iDepth);
	//this.aNeurons;
	//this.cNeuralNet(Math.pow(iSideLength, iDimensions));
	cNeuralNet.call(this, this.iCellsNum);
}
cNeuralNetCube.prototype = new cNeuralNet();
//cNeuralNetCube.prototype.cNeuralNet = cNeuralNet;
cNeuralNetCube.prototype.constructor = cNeuralNetCube;


// Vrati neuron na zadanych souradnicich nebo null //
cNeuralNetCube.prototype.GetNeuronAt = function(aCoords){
	return this.aNeurons[this.GetScalarFromCoords(aCoords)];
}

//debugger;
//DumpObjectEx(cNeuralNetCube.prototype);


// Prevede cislo na souradnice //
cNeuralNetCube.prototype.GetCoordsFromScalar = function(iScalar){
	if(iScalar < 0 || iScalar >= this.iCellsNum) return null;
	var a = new Array(this.iDimensions);
	var iMocnina = this.iSideLength;
	// Pro jednotlive souradnice, odzadu (od nejnizsiho radu) //
	for(var i = this.iDimensions-1; i >= 0; i--){
		a[i] = (iScalar % iMocnina);
		iScalar = Math.floor(iScalar / iMocnina);
	}
	return a;
}

// Prevede souradnice na cislo //
cNeuralNetCube.prototype.GetScalarFromCoords = function(aCoords){
	if(typeof(aCoords) != "object") return false;

	var iMocnina = 1;
	var iScalar  = 0;
	// Pro jednotlive souradnice, odzadu (od nejnizsiho radu) //
	for(var i = this.iDimensions-1; i >= 0; i--){
		if(aCoords[i] < 0 || aCoords[i] >= this.iSideLength) return -1;
		iScalar += aCoords[i] * iMocnina;
		iMocnina *= this.iSideLength;
	}
	return iScalar;
}

// Zvetsi souradnice o 1 nebo proste porad dal //
cNeuralNetCube.prototype.IncreaseCoords = function(aCoords){
	if(typeof(aCoords) != "object") return false;

	// Pro jednotlive souradnice, odzadu (od nejnizsiho radu) //
	for(var i = this.iDimensions-1; i >= 0; i--){
		if(aCoords[i] < this.iSideLength-1){
			aCoords[i]++; break;
		}else{
			aCoords[i] = 0;
		}
	}
	return i != -1;  // pokud uz nebylo kam zvysit - preteceni 
}

// Propoji navzajem sousedni neurony //
cNeuralNetCube.prototype.ConnectNeurons = function(iDepth){
	// Udelame array [0,0,...] //
	var aCoordsCur = new Array();
	for(var i = 0; i < this.iDimensions; i++)
		aCoordsCur[i] = 0;
	// A pak vzdy spojime a jdeme na dalsi bunku. //
	do{
		this.ConnectNeuronAtCoords(aCoordsCur, iDepth);
	}while(this.IncreaseCoords(aCoordsCur));
}

// Propoji dany neuron se sousednimi //
cNeuralNetCube.prototype.ConnectNeuronAtCoords = function(aCoords, iDepth){
	var oNeuron;
	if(typeof(aCoords) != "object") return false;
	if(_dw) _dw.Write("<b>ConnectNeuronAtCoords(aCoords:["+aCoords.join()+"]);</b>");
	
	oNeuron = this.GetNeuronAt(aCoords);
	this.ConnectNeuronAtCoordsRec(oNeuron, aCoords, iDepth, this.iDimensions-1);
	
	return true;
}

// Pomocna rekurzivni funkce //
cNeuralNetCube.prototype.ConnectNeuronAtCoordsRec = function(oNeuron, aCoords, iDepth, iCurDimension){
	if(_dw){
		_dw.Write("Rec(aCoords:["+aCoords.join()+"], iCurDimension:"+iCurDimension+"){");
		//_dw.WritePlain('<div style="padding-left: 1ex; color: red;">\r\n');
	}
	// Udelame kopii pole souradnic - budeme ho menit //
	var aCoordsCopy = (new Array()).concat(aCoords);
	// Projedeme vsechny souradnice tohoto rozmeru a volame podrozmery //
	for(var j = -iDepth; j <= iDepth; j++){
		//if(_dw) _dw.Write("j == "+j+";");
		// Momentalni souradnice: Jako vychozi, akorat zmenime polozku momentalniho rozmeru //
		aCoordsCopy[iCurDimension] = aCoords[iCurDimension] + j;
		// Pokud jsme se prostromeckovali az k jednotlive bunce, spojme ji s vychozim neuronem.
		if(iCurDimension == 0) this.ConnectFromTo(oNeuron, this.GetNeuronAt(aCoordsCopy));
		else this.ConnectNeuronAtCoordsRec(oNeuron, aCoordsCopy, iDepth, iCurDimension-1);
	}
	if(_dw){
		//_dw.WritePlain("</div>\r\n");
		_dw.Write("}");
	}
}




/*
	var iSideLength = 8, iDimensions = 4, iDepth = 1;
	window.status = "Generating "+iSideLength+" ^ "+iDimensions+" = "+Math.pow(iSideLength, iDimensions)+" neurons...";
	net = new cNeuralNetCube(iSideLength, iDimensions);
	window.status = "Done - generated  "+iSideLength+" ^ "+iDimensions+" = "+net.iCellsNum+" neurons.";
	//net.GetScalarFromCoords(net.GetCoordsFromScalar(165)); /// super, funguje 
	//net.IncreaseCoords(net.GetCoordsFromScalar(399));
	net.ConnectNeurons(1);
*/