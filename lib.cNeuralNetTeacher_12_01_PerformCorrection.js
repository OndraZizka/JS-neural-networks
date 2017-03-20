	/*********************************************************************************
	  cNeuralNetTeacher::PerformCorrection()                                          
		Pøizpùsobení sítì: Porovnání rozdílu a oprava vah. 
		
		Koncept procházení sítí:
		
		- Jsou dvì mnoiny:              (lib.cSet.js)
		  - setDoneNeurons - uchovává neurony se spoètenım errorem 
		  - setNextNeurons - obsahuje kandidáty na vıpoèet v dalším kole (while)
		- V kadém kole se projdou kandidáti a zjistí se, jestli všechny jejich 
		  odchozí synapse vedou do ji spoètenıch neuronù (setDoneNeurons.has(...)).
		  - Pokud ne, neuron se ponechá mezi kandidáty.
		  - Pokud ano, neuron se spoète (dError),
		    odstraní se z kandidátù (setNextNeurons.remove(...)),
		    vloí se do spoètenıch (setDoneNeurons.put()),
		    a neurony do nìj vcházející se pøidají do kandidátù (setNextNeurons.put()).
		- Tento algoritmus nefunguje, pokud sí obsahuje smyèky.
		- Plánuju algoritmus dát pøímo do cNeuralNetwork, kde by mìl za úkol rozhodnout
		  o tom, jestli sí obsahuje smyèky, a pokud ne, sestavit poøadí vıpoètu.
		
	- Tato verze u pouívá pøedvypoètené poøadí zpracování neuronù, ale stále 
	  obsahuje
	*********************************************************************************/
cNeuralNetTeacher.prototype.PerformCorrection = function(){
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
		if(_dw) _dw.Write("Vıstupní hodnoty: [" + s + "]"); ///

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
		
		
		/* ----------------- Vıstupní vrstva ----------------- */
		
		if(_dw) _dw.Write("."); ///
		if(_dw) _dw.Write("Starting backprop round # -1  - output layer"); ///
			
		// Pro všechny vıstupní neurony sítì - nastavíme jim Error. 
		for( var i in oNeuralNet.aoOutputNeurons ){
			var oCurNeuron  = oNeuralNet.aoOutputNeurons[i];
			  if(_dw) _dw.Write("- Correcting "+(oCurNeuron.toStringFull())+""); ///
			setDoneNeurons.put(oCurNeuron);

			// -- http://www.tek271.com/articles/neuralNet/IntoToNeuralNets.html -- 
			        /* derivace Sigmoidy */          /* dDiff */
			// e =  (   z * (1 – z)       )     *     ( y – z );    z == dOutReal,  y == dOutWant 
			
			// Rozdíl mezi vstupem a vıstupem 
			var dOutReal = oCurNeuron.dValue;
			var dDiff = adVystupyWant[i] - dOutReal;
			// Chyba tohoto vıst. neur.
			oCurNeuron.dError = oCurNeuron.fFunc.derivation(dOutReal) * dDiff;
			  if(_dw) _dw.Write("("+oCurNeuron.id+") diff: "+Round(dDiff, 5)+" err: "+Round(oCurNeuron.dError, 5)); ///
			dErrorSum += Math.abs(oCurNeuron.dError);

			// Dq = e * lambda;
			var dPom = oCurNeuron.dError * this.dLearn;
			  if(_dw) _dw.Write("("+oCurNeuron.id+") err * lambda: " +Round(dPom, 5)); ///
			
			for( var j in oCurNeuron.aRecep ){
				var oSynapseIn = oCurNeuron.aRecep[j];
				// Dw[i] = Dq * vstup_neuronu[i]; 
				oSynapseIn.dWeight += dPom * oSynapseIn.GetInput(); /// Dáno do neuronu 
				setNextNeurons.put(oSynapseIn.oFrom);
			}
			if(_dw) _dw.Write("+ Corrected "+(oCurNeuron.toStringFull())+""); ///
		}
		aoCurNeurons = setNextNeurons.getMembers();
		//setNextNeurons.clear();     // Neurony se odstraòují, kdy jsou spoètené. 


		// --- Zpracování error sum --- //
		this.dLastErrorSum = dErrorSum;
  		if(_dw) _dw.Write("Error Sum: " +Round(dErrorSum, 5)); ///
		this.adErrorSums.push(dErrorSum);
		if(dErrorSum < this.dTargetError)
			; // Nìco udìlat. 
			
		
		
		aoCurNeurons = this.oNetAdapter.oNeuralNet.aoNeuronsOrder;
		// Neurony z vıstupní vrstvy u poèítat nebudeme. 
		var aoCurNeurons2 = new Array();
		for( var i in aoCurNeurons ){
			if( !setDoneNeurons.has(aoCurNeurons[i]) )
				aoCurNeurons2.push( aoCurNeurons[i] );
		}/**/
		aoCurNeurons = aoCurNeurons2;
		
		

		/* ----------------- Zbylé vrstvy... ----------------- */

		// Dokud jsou ve frontì na vıpoèet nìjaké neurony... 
		while(aoCurNeurons.length > 0) {
			if(_dw) _dw.Write("."); ///
			if(_dw) _dw.Write("Starting backprop round #"+(_iRounds++)+""); ///

			try{
			// Pro všechny neurony ve frontì na vıpoèet v tomto kole... 
			for_aoCurNeurons:
			for( var i in aoCurNeurons ){
				oCurNeuron = aoCurNeurons[i];
				  if(_dw) _dw.Write("- Correcting "+(oCurNeuron.toStringFull())+""); ///
					
				// Pokud u je neuron hotovı, vyndáme ho z fronty a pøeskoèíme.
				// Tıká se vıstupní vrstvy - poøadí vıpoètu je vypoètené pøedem. 
				// if( !setDoneNeurons.has(oCurNeuron) ) continue;
				// Tak nakonec ne - vyfiltruju si to u pøed cyklem.
				
				// Seèteme errory z navazujících neuronù, vynásobené vahami synapsí do nich  [ g = SUM( m[i] * e[i] ) ]
				var dErrorSum = 0.0;
				for( var j in oCurNeuron.aTrans ){
					var oSynapseOut = oCurNeuron.aTrans[j];
					// Pokud neuron ještì nemá spoèten dError, pøeskoèíme ho, a necháme ho ještì ve frontì na zpracování. 
					if( !setDoneNeurons.has(oSynapseOut.oTo) ){
							if(_dw) _dw.Write("-- Skipping - has synapse to non-ready neuron."); ///
						break for_aoCurNeurons;
					}
					dErrorSum += oSynapseOut.oTo.dError * oSynapseOut.dWeight;
				}
				
				// Uloení chyby tohoto vıst. neur.
				oCurNeuron.dError = dErrorSum * oCurNeuron.fFunc.derivation(oCurNeuron.dValue);
					if(_dw) _dw.Write("("+oCurNeuron.id+")  err: "+Round(oCurNeuron.dError, 5)); ///
				setDoneNeurons.put(oCurNeuron);     // Pøidáme zpracovávanı neuron mezi hotové (má spoètenı error). 
				setNextNeurons.remove(oCurNeuron);  // Odstraníme zpracovávanı neuron z fronty na zpracování.
				

				var dPom  = oCurNeuron.dError * this.dLearn;

					//if(_dw) _dw.Write("- Following: [ "+(oCurNeuron.aRecep)+" ]"); ///
			
				// Pro všechny pøedcházející neurony... 
				for( var j in oCurNeuron.aRecep ){
					var oFromNeuron = oCurNeuron.aRecep[j].oFrom;
					if( oFromNeuron == null )  continue;
					
					// upravíme váhy synapsí vedoucích z nìj sem, 
					oCurNeuron.aRecep[j].dWeight += oFromNeuron.dValue * dPom;
					// a pokud u není upravenı, 
					if( !setDoneNeurons.has(oFromNeuron) ){						
						// pøidáme ho do fronty na vıpoèet v dalším kole. 
						setNextNeurons.put(oFromNeuron);
					}
				}
				
				if(_dw) _dw.Write("+ Corrected "+(oCurNeuron.toStringFull())+""); ///
				
			}// for( var i in aoCurNeurons )			
			}catch(e){ _dw.Write("... Exception " + e); throw e; }
			
			// V setNextNeurons máme mnoinu neuronù na další kolo backpropagation. 
			aoCurNeurons = setNextNeurons.getMembers();
			//setNextNeurons.clear();     // Neurony se odstraòují, kdy jsou spoètené. 

		}// while()
		
		
		this.iLastTimeMs = (new Date()).getTime() - oTimeStart.getTime();
		this.oAvgCorrectionTime.AddSample( this.iLastTimeMs );
		
		if(_dw) _dw.Write("."); ///
		if(window._dw) window._dw.Write("Correcting finished. Time: "+this.iLastTimeMs+" ms; Overall avg time: "+this.oAvgCorrectionTime+" ms"); ///
		
		
		return true;

	}; // cNeuralNetTeacher.prototype.PerformCorrection() 