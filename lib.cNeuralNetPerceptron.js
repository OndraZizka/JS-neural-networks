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

	// -- Za�azen� do vrstev a propojen� -- //
	
	// Pro v�echny vrstvy 
	for(var i = 0; i < aiLevels.length; i++){
		this.aaLayers[i] = new Array(aiLevels[i]);
		// Pro v�echen po�et neuron� ve vrstv� 
		for( var j = 0; j < aiLevels[i]; j++ ){
			// vezmeme dal�� (dosud voln�) neuron ze s�t� a p�i�ad�me ho vrstv� 
			oCurNeuron = this.aaLayers[i][j] = this.aNeurons[iNeuron++];
			// Pro v�echny neurony p�edchoz� vrstvy 
			if(i > 0)
			for( var k = 0; k < this.aaLayers[i-1].length; k++ ){
				// spoj�me s nimi tento nov� neuron.
				this.ConnectFromTo(this.aaLayers[i-1][k], oCurNeuron);
			}
		}
	}
	
	// Pro v�echny neurony prvn� vrstvy - d�me je do seznamu vstupn�ch neuron� 
	//for( var k = 0; k < this.aaLayers[0].length; k++ ){
	for( var k in this.aaLayers[0] ){
		this.aoInputNeurons.push( this.aaLayers[0][k] );
	}
	// To sam� pro posledn� vrstvu - do seznamu v�stupn�ch neuron� 
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