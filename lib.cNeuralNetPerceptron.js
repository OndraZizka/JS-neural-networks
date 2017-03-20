/**************************************************************
  Trida pro perceptron                                         
**************************************************************/
function cNeuralNetPerceptron(aiLevels){
	var iCellsNum = 0;
	for(var iIndex in aiLevels) iCellsNum += aiLevels[iIndex];
	cNeuralNet.call(this, iCellsNum);
	
	this.aaLayers = new Array(aiLevels.length);
	var iNeuron = 0;
	var oCurNeuron;

	// -- Zaøazení do vrstev a propojení -- //
	
	// Pro všechny vrstvy 
	for(var i = 0; i < aiLevels.length; i++){
		this.aaLayers[i] = new Array(aiLevels[i]);
		// Pro všechen poèet neuronù ve vrstvì 
		for( var j = 0; j < aiLevels[i]; j++ ){
			// vezmeme další (dosud volný) neuron ze sítì a pøiøadíme ho vrstvì 
			oCurNeuron = this.aaLayers[i][j] = this.aNeurons[iNeuron++];
			// Pro všechny neurony pøedchozí vrstvy 
			if(i > 0)
			for( var k = 0; k < this.aaLayers[i-1].length; k++ ){
				// spojíme s nimi tento nový neuron.
				this.ConnectFromTo(this.aaLayers[i-1][k], oCurNeuron);
			}
		}
	}
	
	// Pro všechny neurony první vrstvy - dáme je do seznamu vstupních neuronù 
	//for( var k = 0; k < this.aaLayers[0].length; k++ ){
	for( var k in this.aaLayers[0] ){
		this.aoInputNeurons.push( this.aaLayers[0][k] );
	}
	// To samé pro poslední vrstvu - do seznamu výstupních neuronù 
	//for( var k = 0; k < this.aaLayers[this.aaLayers.length-1].length; k++ ){
	var oLastLayer = this.aaLayers[this.aaLayers.length-1];
	for( var k in oLastLayer ){
		this.aoOutputNeurons.push( oLastLayer[k] );
	}
	//_dw.Write(oLastLayer); ///
	
	
}
cNeuralNetPerceptron.prototype = new cNeuralNet();
cNeuralNetPerceptron.prototype.constructor = cNeuralNetPerceptron;
cNeuralNetPerceptron.prototype.CreateNeuron = function(dValue){
	return cNeuralNet.prototype.CreateNeuron(dValue);
}