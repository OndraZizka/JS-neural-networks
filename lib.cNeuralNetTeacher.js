

/**  class cNeuralTrainSetItem **/
function cNeuralTrainSetItem(adInputValues, adOutputValuesWanted){
	this.adI = adInputValues;
	this.adO = adOutputValuesWanted;
}
cNeuralTrainSetItem.prototype = {
	GetDifference: function(adOutputValuesReal){
		var dSumReal = 0;
		for( var i in adOutputValuesReal )
			dSumReal += adOutputValuesReal[i];
	}
};


/**  class cNeuralTrainSet **/
function cNeuralTrainSet(){
	this.aoItems = new Array();
	this._iIndex = 0;
}
cNeuralTrainSet.prototype = {
	Add: function(oTrainSetItem){
		this.aoItems.push(oTrainSetItem);
	},
	Clear: function(){ this.aoItems = new Array(); this._iIndex = 0; },
	
	GetAt: function(iIndex){
		if( iIndex < this.aoItems.length )
			return this.aoItems[iIndex];
	},
	GetRandom: function(){
		var iIndex = Math.floor(Math.random() * this.aoItems.length) % this.aoItems.length;
		return this.aoItems[iIndex];
	},


	// Iterator related 
	resetIterator: function(){ this._iIndex = 0; },
	hasNext:       function(){ return ( this._iIndex < this.aoItems.length ); },
	next:          function(){ return this.aoItems[this._iIndex++]; }
};





/**************************************************************
    class cNeuralNetTeacher                                    
	Implementation of supervised learning with backpropagation   
**************************************************************/
function cNeuralNetTeacher(oNeuralNetIOAdapter, oTrainSet, dLearn, dMomentum, dTargetError, iMaxRepeats){

	this.oNetAdapter = oNeuralNetIOAdapter;
	this.oTrainSet   = oTrainSet;
	this.oCurTrainSetItem = null;
	
	this.dLearn = dLearn ? dLearn : 0.2;                       // Learning rate - correction amount (LAMBDA) 
	this.dMomentum = dMomentum ? dMomentum : 0.05;             // Momentum - net's momentum (setrvaènost)    
	this.iMaxRepeats  = iMaxRepeats ? iMaxRepeats : 1000;      // Maximum mumber of repeats of training step 
	this.dTargetError = dTargetError ? dTargetError : 0.03;    // Target error - stop training when reached  
	
	
	this.iTurns = 0;
	this.iCorrections = 0;
	this.dLastErrorSum = null;
	this.adErrorSums = new Array();
	this.oAvgErrorSums = new cAverage();
		
	this.oAvgCorrectionTime = new cAverage();
	this.iLastTimeMs = 0;
	
}
cNeuralNetTeacher.prototype = {
	GetNet:      function(){ return this.oNetAdapter.oNeuralNet; },
	GetErrorSum: function(){ return this.dLastErrorSum; },

	GetTurnsCount: function(){ return this.iTurns; },
	GetCorrectionsCount: function(){ return this.iCorrections; },
	ResetCounters: function(){ this.iTurns  = 0; this.iCorrections = 0; },

	// Jedno kolo uèení - vybrání vstupu a výpoèet. 
	Turn: function(){
		this.iTurns++;
		this.oCurTrainSetItem = this.oTrainSet.GetRandom();
		//this.oCurTrainSetItem = this.oTrainSet.GetAt(2);
		if(_dw) _dw.Write("Vstupní hodnoty: [" + this.oCurTrainSetItem.adI + "]"); ///
		if(_dw) _dw.Write("Chtìné  hodnoty: [" + this.oCurTrainSetItem.adO + "]"); ///

		this.oNetAdapter.SetInputValues(this.oCurTrainSetItem.adI);
		this.oNetAdapter.oNeuralNet.Compute();
	},
	

	
	/*********************************************************************************
	  cNeuralNetTeacher::PerformCorrection()                                          
		Pøizpùsobení sítì: Porovnání rozdílu a oprava vah. 
		
		Koncept procházení sítí:
		
		- Jsou dvì množiny:              (lib.cSet.js)
		  - setDoneNeurons - uchovává neurony se spoèteným errorem 
		  - setNextNeurons - obsahuje kandidáty na výpoèet v dalším kole (while)
		- V každém kole se projdou kandidáti a zjistí se, jestli všechny jejich 
		  odchozí synapse vedou do již spoètených neuronù (setDoneNeurons.has(...)).
		  - Pokud ne, neuron se ponechá mezi kandidáty.
		  - Pokud ano, neuron se spoète (dError),
		    odstraní se z kandidátù (setNextNeurons.remove(...)),
		    vloží se do spoètených (setDoneNeurons.put()),
		    a neurony do nìj vcházející se pøidají do kandidátù (setNextNeurons.put()).
		- Tento algoritmus nefunguje, pokud sí obsahuje smyèky.
		- Plánuju algoritmus dát pøímo do cNeuralNetwork, kde by mìl za úkol rozhodnout
		  o tom, jestli sí obsahuje smyèky, a pokud ne, sestavit poøadí výpoètu.
		
	*********************************************************************************/
	PerformCorrection: function(){
		this.iCorrections++;
		//var _dw = null;
		
		var oTimeStart = new Date();
	
		var oNeuralNet = this.oNetAdapter.oNeuralNet;
		
		// Získání hodnot 
		var adVystupyReal = this.oNetAdapter.GetOutputValues();
		var adVystupyWant = this.oCurTrainSetItem.adO;
		if(adVystupyWant.length < adVystupyReal.length)
			return false;
			
		var s = ArrayMap( adVystupyReal, function(d){ return Round(d,4); } );
		if(_dw) _dw.Write("Výstupní hodnoty: [" + s + "]"); ///

		//var adVystupyDiff = new Array();
		//var adWeightDeltas = new Array();
		var dErrorSum = 0;
		
		/*for( var i in adVystupyReal ){
			//dErrorSum += adVystupyDiff[i] = adVystupyWant[i] - adVystupyReal[i];
			//adWeightDeltas[i] = this.oNetAdapter.oNeuralNet.fFunc( adVystupyReal[i] ) * adVystupyDiff[i];
			// error = OutReal * (1 – OutReal) * (OutWant – OutReal)
		}/**/
			

		// Pracovní prostor... 
		var aoCurNeurons;
		var setNextNeurons = new cSet();
		var setDoneNeurons = new cSet();
		var oCurNeuron;
		var _iRounds = 0;
		
		
		/* ----------------- Výstupní vrstva ----------------- */
		
		if(_dw) _dw.Write("."); ///
		if(_dw) _dw.Write("Starting backprop round # -1  - output layer"); ///
			
		// Pro všechny výstupní neurony sítì - nastavíme jim Error. 
		for( var i in oNeuralNet.aoOutputNeurons ){
			var oCurNeuron  = oNeuralNet.aoOutputNeurons[i];
			  if(_dw) _dw.Write("- Correcting "+(oCurNeuron.toStringFull())+""); ///
			setDoneNeurons.put(oCurNeuron);

			// -- http://www.tek271.com/articles/neuralNet/IntoToNeuralNets.html -- 
			        /* derivace Sigmoidy */          /* dDiff */
			// e =  (   z * (1 – z)       )     *     ( y – z );    z == dOutReal,  y == dOutWant 
			
			// Rozdíl mezi vstupem a výstupem 
			var dOutReal = oCurNeuron.dValue;
			var dDiff = adVystupyWant[i] - dOutReal;
			// Chyba tohoto výst. neur.
			oCurNeuron.dError = oCurNeuron.fFunc.derivation(dOutReal) * dDiff;
			  if(_dw) _dw.Write("("+oCurNeuron.id+") diff: "+Round(dDiff, 5)+" err: "+Round(oCurNeuron.dError, 5)); ///
			dErrorSum += Math.abs(oCurNeuron.dError);

			// Dq = e * lambda;
			var dPom = oCurNeuron.dError * this.dLearn;
			  if(_dw) _dw.Write("("+oCurNeuron.id+") err * lambda: " +Round(dPom, 5)); ///
				
			oCurNeuron.dBias += dPom;
			
			for( var j in oCurNeuron.aRecep ){
				var oSynapseIn = oCurNeuron.aRecep[j];
				// Dw[i] = Dq * vstup_neuronu[i]; 
				oSynapseIn.dWeight += dPom * oSynapseIn.GetInput(); /// Dáno do neuronu 
				setNextNeurons.put(oSynapseIn.oFrom);
			}
			if(_dw) _dw.Write("+ Corrected "+(oCurNeuron.toStringFull())+""); ///
		}
		aoCurNeurons = setNextNeurons.getMembers();
		//setNextNeurons.clear();     // Neurony se odstraòují, když jsou spoètené. 



		// --- Zpracování error sum --- //
		this.dLastErrorSum = dErrorSum;
  		if(_dw) _dw.Write("Error Sum: " +Round(dErrorSum, 5)); ///
		this.adErrorSums.push(dErrorSum);
		if(dErrorSum < this.dTargetError)
			; // Nìco udìlat. 
			
		
		
		aoCurNeurons = this.oNetAdapter.oNeuralNet.aoNeuronsOrder;
		// Neurony z výstupní vrstvy už poèítat nebudeme. 
		var aoCurNeurons2 = new Array();
		for( var i in aoCurNeurons ){
			if( !setDoneNeurons.has(aoCurNeurons[i]) )
				aoCurNeurons2.push( aoCurNeurons[i] );
		}/**/
		aoCurNeurons = aoCurNeurons2;
		
		

		/* ----------------- Zbylé vrstvy... ----------------- */

		// Dokud jsou ve frontì na výpoèet nìjaké neurony... 
		while(aoCurNeurons.length > 0) {
			if(_dw) _dw.Write("."); ///
			if(_dw) _dw.Write("Starting backprop round #"+(_iRounds++)+""); ///

			try{
			// Pro všechny neurony ve frontì na výpoèet v tomto kole... 
			for_aoCurNeurons:
			for( var i in aoCurNeurons ){
				oCurNeuron = aoCurNeurons[i];
				  if(_dw) _dw.Write("- Correcting "+(oCurNeuron.toStringFull())+""); ///
					
				// Pokud už je neuron hotový, vyndáme ho z fronty a pøeskoèíme.
				// Týká se výstupní vrstvy - poøadí výpoètu je vypoètené pøedem. 
				// if( !setDoneNeurons.has(oCurNeuron) ) continue;
				// Tak nakonec ne - vyfiltruju si to už pøed cyklem.
				
				// Seèteme errory z navazujících neuronù, vynásobené vahami synapsí do nich  [ g = SUM( m[i] * e[i] ) ]
				var dErrorSum = 0.0;
				for( var j in oCurNeuron.aTrans ){
					var oSynapseOut = oCurNeuron.aTrans[j];
					dErrorSum += oSynapseOut.oTo.dError * oSynapseOut.dWeight;
				}
				
				// Uložení chyby tohoto výst. neur.
				oCurNeuron.dError = dErrorSum * oCurNeuron.fFunc.derivation(oCurNeuron.dValue);
					//if(_dw) _dw.Write("("+oCurNeuron.id+")  err: "+Round(oCurNeuron.dError, 5)); ///

				var dPom  = oCurNeuron.dError * this.dLearn;

				oCurNeuron.dBias += dPom;

					//if(_dw) _dw.Write("- Following: [ "+(oCurNeuron.aRecep)+" ]"); ///
				// Pro všechny pøedcházející neurony... 
				for( var j in oCurNeuron.aRecep ){
					var oFromNeuron = oCurNeuron.aRecep[j].oFrom;
					if( oFromNeuron == null )  continue;
					// upravíme váhy synapsí vedoucích z nìj sem, 
					oCurNeuron.aRecep[j].dWeight += oFromNeuron.dValue * dPom;
				}
				
				if(_dw) _dw.Write("+ Corrected "+(oCurNeuron.toStringFull())+""); ///
				
			}// for( var i in aoCurNeurons )			
			}catch(e){ _dw.Write("... Exception " + e); throw e; }
			
			// V setNextNeurons máme množinu neuronù na další kolo backpropagation. 
			//aoCurNeurons = setNextNeurons.getMembers();
			break;

		}// while()
		
		
		this.iLastTimeMs = (new Date()).getTime() - oTimeStart.getTime();
		this.oAvgCorrectionTime.AddSample( this.iLastTimeMs );
		this.oAvgErrorSums.AddSample( this.dLastErrorSum );
		if( this.iCorrections >= 20 )
			this.oAvgErrorSums.RemSample( this.adErrorSums[this.adErrorSums.length-20] );
		
		
		
		if(_dw) _dw.Write("."); ///
		if(window._dw) window._dw.Write("Correcting finished. Time: "+this.iLastTimeMs+" ms; Overall avg time: "+this.oAvgCorrectionTime+" ms"); ///
		
		return true;

	}, // cNeuralNetTeacher.prototype.PerformCorrection() 
	
	
	/** Vrací prùmìr z posledních iCorrections opravování. */
	GetErrorSumsAvg: function(iCorrections, iBackOffset){
		if(iCorrections == null){
			return this.oAvgErrorSums.GetAverage();
		}
	
		if(iBackOffset == null) iBackOffset = 0;
		var iIndex1 = Math.max(0, this.adErrorSums.length - iCorrections - iBackOffset);
		var iIndex2 = Math.max(0, this.adErrorSums.length - 1 - iBackOffset);
		
		var dAvg = 0.0;
		for( var i = iIndex1; i < iIndex2; i++ ){
			dAvg += this.adErrorSums[i];
		}
		return dAvg / (iIndex2 - iIndex1 + 1);
	}
	
	
	
}; // class cNeuralNetTeacher prototype





/*
	oVzor = oTrainSet.GetRandom();
	oVzor = aoadVzory[2];
	
	_dw.Write("Vstupní hodnoty: [" + oVzor.adI + "]"); ///

	oNetAdapter.SetInputValues(oVzor.adI);
	oNetAdapter.oNeuralNet.Compute();

	var adVystupyReal = oNetAdapter.GetOutputValues();
	var dError = oNetAdapter.GetError();

	var s = ArrayMap( adVystupyReal, function(d){ return RoundPrec(d, 100); } );
	_dw.Write("Výstupní hodnoty: " + s); ///
	
	for( var i = 0; i < 10; i++){
		if(_dw) _dw.Write("--- oNetTeacher.Turn(); ---"); ///
		oNetTeacher.Turn();
		if(_dw) _dw.Write("--- oNetTeacher.PerformCorrection(); ---"); ///
		oNetTeacher.PerformCorrection();
	}
*/