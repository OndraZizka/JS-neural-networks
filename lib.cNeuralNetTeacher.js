

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
	this.dMomentum = dMomentum ? dMomentum : 0.05;             // Momentum - net's momentum (setrva�nost)    
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

	// Jedno kolo u�en� - vybr�n� vstupu a v�po�et. 
	Turn: function(){
		this.iTurns++;
		this.oCurTrainSetItem = this.oTrainSet.GetRandom();
		//this.oCurTrainSetItem = this.oTrainSet.GetAt(2);
		if(_dw) _dw.Write("Vstupn� hodnoty: [" + this.oCurTrainSetItem.adI + "]"); ///
		if(_dw) _dw.Write("Cht�n�  hodnoty: [" + this.oCurTrainSetItem.adO + "]"); ///

		this.oNetAdapter.SetInputValues(this.oCurTrainSetItem.adI);
		this.oNetAdapter.oNeuralNet.Compute();
	},
	

	
	/*********************************************************************************
	  cNeuralNetTeacher::PerformCorrection()                                          
		P�izp�soben� s�t�: Porovn�n� rozd�lu a oprava vah. 
		
		Koncept proch�zen� s�t�:
		
		- Jsou dv� mno�iny:              (lib.cSet.js)
		  - setDoneNeurons - uchov�v� neurony se spo�ten�m errorem 
		  - setNextNeurons - obsahuje kandid�ty na v�po�et v dal��m kole (while)
		- V ka�d�m kole se projdou kandid�ti a zjist� se, jestli v�echny jejich 
		  odchoz� synapse vedou do ji� spo�ten�ch neuron� (setDoneNeurons.has(...)).
		  - Pokud ne, neuron se ponech� mezi kandid�ty.
		  - Pokud ano, neuron se spo�te (dError),
		    odstran� se z kandid�t� (setNextNeurons.remove(...)),
		    vlo�� se do spo�ten�ch (setDoneNeurons.put()),
		    a neurony do n�j vch�zej�c� se p�idaj� do kandid�t� (setNextNeurons.put()).
		- Tento algoritmus nefunguje, pokud s� obsahuje smy�ky.
		- Pl�nuju algoritmus d�t p��mo do cNeuralNetwork, kde by m�l za �kol rozhodnout
		  o tom, jestli s� obsahuje smy�ky, a pokud ne, sestavit po�ad� v�po�tu.
		
	*********************************************************************************/
	PerformCorrection: function(){
		this.iCorrections++;
		//var _dw = null;
		
		var oTimeStart = new Date();
	
		var oNeuralNet = this.oNetAdapter.oNeuralNet;
		
		// Z�sk�n� hodnot 
		var adVystupyReal = this.oNetAdapter.GetOutputValues();
		var adVystupyWant = this.oCurTrainSetItem.adO;
		if(adVystupyWant.length < adVystupyReal.length)
			return false;
			
		var s = ArrayMap( adVystupyReal, function(d){ return Round(d,4); } );
		if(_dw) _dw.Write("V�stupn� hodnoty: [" + s + "]"); ///

		//var adVystupyDiff = new Array();
		//var adWeightDeltas = new Array();
		var dErrorSum = 0;
		
		/*for( var i in adVystupyReal ){
			//dErrorSum += adVystupyDiff[i] = adVystupyWant[i] - adVystupyReal[i];
			//adWeightDeltas[i] = this.oNetAdapter.oNeuralNet.fFunc( adVystupyReal[i] ) * adVystupyDiff[i];
			// error = OutReal * (1 � OutReal) * (OutWant � OutReal)
		}/**/
			

		// Pracovn� prostor... 
		var aoCurNeurons;
		var setNextNeurons = new cSet();
		var setDoneNeurons = new cSet();
		var oCurNeuron;
		var _iRounds = 0;
		
		
		/* ----------------- V�stupn� vrstva ----------------- */
		
		if(_dw) _dw.Write("."); ///
		if(_dw) _dw.Write("Starting backprop round # -1  - output layer"); ///
			
		// Pro v�echny v�stupn� neurony s�t� - nastav�me jim Error. 
		for( var i in oNeuralNet.aoOutputNeurons ){
			var oCurNeuron  = oNeuralNet.aoOutputNeurons[i];
			  if(_dw) _dw.Write("- Correcting "+(oCurNeuron.toStringFull())+""); ///
			setDoneNeurons.put(oCurNeuron);

			// -- http://www.tek271.com/articles/neuralNet/IntoToNeuralNets.html -- 
			        /* derivace Sigmoidy */          /* dDiff */
			// e =  (   z * (1 � z)       )     *     ( y � z );    z == dOutReal,  y == dOutWant 
			
			// Rozd�l mezi vstupem a v�stupem 
			var dOutReal = oCurNeuron.dValue;
			var dDiff = adVystupyWant[i] - dOutReal;
			// Chyba tohoto v�st. neur.
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
				oSynapseIn.dWeight += dPom * oSynapseIn.GetInput(); /// D�no do neuronu 
				setNextNeurons.put(oSynapseIn.oFrom);
			}
			if(_dw) _dw.Write("+ Corrected "+(oCurNeuron.toStringFull())+""); ///
		}
		aoCurNeurons = setNextNeurons.getMembers();
		//setNextNeurons.clear();     // Neurony se odstra�uj�, kdy� jsou spo�ten�. 



		// --- Zpracov�n� error sum --- //
		this.dLastErrorSum = dErrorSum;
  		if(_dw) _dw.Write("Error Sum: " +Round(dErrorSum, 5)); ///
		this.adErrorSums.push(dErrorSum);
		if(dErrorSum < this.dTargetError)
			; // N�co ud�lat. 
			
		
		
		aoCurNeurons = this.oNetAdapter.oNeuralNet.aoNeuronsOrder;
		// Neurony z v�stupn� vrstvy u� po��tat nebudeme. 
		var aoCurNeurons2 = new Array();
		for( var i in aoCurNeurons ){
			if( !setDoneNeurons.has(aoCurNeurons[i]) )
				aoCurNeurons2.push( aoCurNeurons[i] );
		}/**/
		aoCurNeurons = aoCurNeurons2;
		
		

		/* ----------------- Zbyl� vrstvy... ----------------- */

		// Dokud jsou ve front� na v�po�et n�jak� neurony... 
		while(aoCurNeurons.length > 0) {
			if(_dw) _dw.Write("."); ///
			if(_dw) _dw.Write("Starting backprop round #"+(_iRounds++)+""); ///

			try{
			// Pro v�echny neurony ve front� na v�po�et v tomto kole... 
			for_aoCurNeurons:
			for( var i in aoCurNeurons ){
				oCurNeuron = aoCurNeurons[i];
				  if(_dw) _dw.Write("- Correcting "+(oCurNeuron.toStringFull())+""); ///
					
				// Pokud u� je neuron hotov�, vynd�me ho z fronty a p�esko��me.
				// T�k� se v�stupn� vrstvy - po�ad� v�po�tu je vypo�ten� p�edem. 
				// if( !setDoneNeurons.has(oCurNeuron) ) continue;
				// Tak nakonec ne - vyfiltruju si to u� p�ed cyklem.
				
				// Se�teme errory z navazuj�c�ch neuron�, vyn�soben� vahami synaps� do nich  [ g = SUM( m[i] * e[i] ) ]
				var dErrorSum = 0.0;
				for( var j in oCurNeuron.aTrans ){
					var oSynapseOut = oCurNeuron.aTrans[j];
					dErrorSum += oSynapseOut.oTo.dError * oSynapseOut.dWeight;
				}
				
				// Ulo�en� chyby tohoto v�st. neur.
				oCurNeuron.dError = dErrorSum * oCurNeuron.fFunc.derivation(oCurNeuron.dValue);
					//if(_dw) _dw.Write("("+oCurNeuron.id+")  err: "+Round(oCurNeuron.dError, 5)); ///

				var dPom  = oCurNeuron.dError * this.dLearn;

				oCurNeuron.dBias += dPom;

					//if(_dw) _dw.Write("- Following: [ "+(oCurNeuron.aRecep)+" ]"); ///
				// Pro v�echny p�edch�zej�c� neurony... 
				for( var j in oCurNeuron.aRecep ){
					var oFromNeuron = oCurNeuron.aRecep[j].oFrom;
					if( oFromNeuron == null )  continue;
					// uprav�me v�hy synaps� vedouc�ch z n�j sem, 
					oCurNeuron.aRecep[j].dWeight += oFromNeuron.dValue * dPom;
				}
				
				if(_dw) _dw.Write("+ Corrected "+(oCurNeuron.toStringFull())+""); ///
				
			}// for( var i in aoCurNeurons )			
			}catch(e){ _dw.Write("... Exception " + e); throw e; }
			
			// V setNextNeurons m�me mno�inu neuron� na dal�� kolo backpropagation. 
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
	
	
	/** Vrac� pr�m�r z posledn�ch iCorrections opravov�n�. */
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
	
	_dw.Write("Vstupn� hodnoty: [" + oVzor.adI + "]"); ///

	oNetAdapter.SetInputValues(oVzor.adI);
	oNetAdapter.oNeuralNet.Compute();

	var adVystupyReal = oNetAdapter.GetOutputValues();
	var dError = oNetAdapter.GetError();

	var s = ArrayMap( adVystupyReal, function(d){ return RoundPrec(d, 100); } );
	_dw.Write("V�stupn� hodnoty: " + s); ///
	
	for( var i = 0; i < 10; i++){
		if(_dw) _dw.Write("--- oNetTeacher.Turn(); ---"); ///
		oNetTeacher.Turn();
		if(_dw) _dw.Write("--- oNetTeacher.PerformCorrection(); ---"); ///
		oNetTeacher.PerformCorrection();
	}
*/