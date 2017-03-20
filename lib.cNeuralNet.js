/**************************************************************
  Koncept: 
					 
	  Kazdy neuron ma neomezeny pocet transmitteru (odchozich)
	a receptoru (prichozich vlaken). T a R se napojuji na sebe.
	Mezi dvema neurony muze byt i vice primych spojeni.
	  Kazdy T i R ma koeficient, jimz se ovlivnuje sila 
	prochazejiciho signalu. Pri kazdem projiti signalu se tento
	koeficient zmeni o danou konstantu. Podle uspechu bude tato
	konstanta nejen velika, ale take bud kladna, nebo zaporna.
**************************************************************/






/**************************************************************
  Trida pro jednoduchou synapsi                                
**************************************************************/
function cSynapse(oFrom, oTo, dWeight){
	if(null == dWeight)
		dWeight = ( Math.random() * (0.3 - 0.05) + 0.05 )  *  ((Math.random() < 0.5) ? -1 : 1);
	this.dWeight = dWeight;
	//this.dValue  = 0.0;
	this.oFrom = oFrom;            // z jakeho neuronu to prichazi 
	this.oTo   = oTo;              // na jaky neuron to odchazi 
}
cSynapse.prototype.toString = function(){
	return "cSy{ "+(this.oFrom?this.oFrom.id:"null")+"->"+(this.oTo?this.oTo.id:"null")+";"
	  +" W:"+Round(this.dWeight,4)+"; I:"+Round(this.GetInput(),4)+" }";
}

cSynapse.prototype.SetTo      = function(oTo)    { this.oTo = oTo; }
cSynapse.prototype.GetTo      = function()       { return this.oTo; }
cSynapse.prototype.SetFrom    = function(oFrom)  { this.oFrom = oFrom; }
cSynapse.prototype.GetFrom    = function()       { return this.oFrom; }
cSynapse.prototype.SetWeight  = function(dWeight){ this.dWeight = dWeight; }
//cSynapse.prototype.StoreValue = function(dValue){ this.dValue = dValue; }
cSynapse.prototype.GetValue   = function()       { return this.oFrom.dValue * this.dWeight; }
cSynapse.prototype.GetInput   = function()       { return this.oFrom.dValue; }
//cSynapse.prototype.GetRealValue = function()    { return this.oFrom.dValue; }





/**************************************************************
  Trida pro neuron                                             
**************************************************************/
function cNeuron(iID, dValue, dBias, sFuncID){
	this.id = iID ? iID : cNeuron.GetUniqueID();      /// for debug info 
	this.dValue = dValue ? dValue : 0.0;							// Vypoètená hodnota - pro Compute()
	this.dBias = dBias ? dBias : Math.random();       // Pøídavek ke vstupùm - Bias neboli Treshold neboli x0 neboli ...
	this.fFunc = sFuncID ? cNeuron.afFuncs[sFuncID] : cNeuron.Sigmoid;     // Defaultnì sigmoida 
	
	this.aRecep = new Array();        // receptors    
	this.aTrans = new Array();        // transmitters 
}

cNeuron.prototype.toStringFull = function(){ return "cNeuron { id: "+this.id+", v:"+Round(this.dValue,2)+", b:"+Round(this.dBias,2)+", recep: ["+this.aRecep+"], trans: ["+this.aTrans+"] }"; }
cNeuron.prototype.toStringShort = function(){ return "cNeuron #"+this.id+", v:"+Round(this.dValue,2)+" { b:"+Round(this.dBias,2)+", R["+this.aRecep.length+"], T["+this.aTrans.length+"] }"; }
cNeuron.prototype.toStringTiny = function(){ return "cNeuron #"+this.id; }
cNeuron.prototype.toStringAtom = function(){ return "("+this.id+")"; }
cNeuron.prototype.toString = cNeuron.prototype.toStringShort;

cNeuron.GetUniqueID = function(){
	if(null == this.iNextID) { this.iNextID = 2; return 1; }
	else return this.iNextID++;
}

cNeuron.prototype.AddRecep = function(oFromSynapse){
	this.aRecep.push(oFromSynapse);
}
cNeuron.prototype.AddTrans = function(oToSynapse){
	this.aTrans.push(oToSynapse);
}



// --- Funkce --- //
cNeuron.afFuncs = new Array();

// Logicka sigmoida 
cNeuron.Sigmoid = function(dX){
	//var dOutput = 1 + Math.pow(Math.E, (-1) * arguments.callee.LAMBDA * dX);
	var dOutput = 1 + Math.exp( dX * -arguments.callee.LAMBDA);
	return 1 / dOutput;
}
cNeuron.Sigmoid.LAMBDA = 1;
cNeuron.Sigmoid.derivation = function(x){ return x * (1 - x); };
cNeuron.Sigmoid.ID = "sig";
cNeuron.Sigmoid.toString = function(){ return "sig"; }
cNeuron.afFuncs[cNeuron.Sigmoid.ID] = cNeuron.Sigmoid;


// Bool - schod 
cNeuron.Step = function(dX){ return dx < 0 ? -1 : 1; }
cNeuron.Step.derivation = null;
cNeuron.Step.ID = "step";
cNeuron.Step.toString = function(){ return "step"; }
cNeuron.afFuncs[cNeuron.Step.ID] = cNeuron.Step;




// Spoètení výstupu neuronu 
cNeuron.prototype.Compute = function(){
	//var _s = "- Sum: "; ///

	var dSum = this.dBias;
	  //_s += "b:"+ Round(-this.dBias, 2); ///
	
	// Pro každou pøíchozí synapsi... 
	for(var i in this.aRecep){
		// ...z ní vytáhnem hodnotu a pøiètem. 
		dSum += this.aRecep[i].GetValue();
		  //_s += ", "
		  //  + (this.aRecep[i].oFrom ? this.aRecep[i].oFrom.id : "null")
		  //	+ ": " + Round(this.aRecep[i].GetInput(), 2)
		  //	+ "*"  + Round(this.aRecep[i].dWeight, 2); ///
	}
	
	
	  //_s += " => "+ Round(dSum, 2); ///
	
	var dOutput = this.fFunc(dSum);
	
	  //_s += " => "+ Round(dOutput, 2); ///
	  //if(_dw) _dw.Write(_s);
	
	
	// Pro každou odchozí synapsi... 
	/*for(var i in this.aTrans){
		// ... uložíme do ní výstup neuronu. 
		this.aTrans[i].StoreValue(dOutput);
	}*/
	// Novì: Hodnotu ukládáme do neuronu, synapse si to bere z nìj 
	this.dValue = dOutput;
		
	return dOutput;
}





/**************************************************************
  Trida pro neurcitou neuronovou sit                           
**************************************************************/
function cNeuralNet(iNumberOfNeurons, dMinWeight, dMaxWeight){
	this.CreateNeurons(iNumberOfNeurons);
	this.aoInputNeurons  = new Array();
	this.aoOutputNeurons = new Array();
	this.dMinWeight = dMinWeight ? dMinWeight : 0.05;
	this.dMaxWeight = dMaxWeight ? dMaxWeight : 0.30;
	this.aoNeuronsOrder  = null;                         // Poøadí výpoètu neuronù 
	this.bContainsCycles = null;                         // Jestli obsahuje cykly  
}

cNeuralNet.prototype.CreateNeuron = function(iID, dValue, dBias, sFuncID){
	return new cNeuron(iID, dValue, dBias, sFuncID);
}

cNeuralNet.prototype.CreateNeurons = function(iNumberOfNeurons){
	this.aNeurons = new Array();    // neurons    
	for(var i = iNumberOfNeurons; i > 0; i--){
		//this.aNeurons.push(new cNeuron());
		this.aNeurons.push(this.CreateNeuron());
	}
}


// Spoji dva neurony smerovanym spojenim - u jednoho prida transmitter, u druheho receptor //
cNeuralNet.prototype.ConnectFromTo = function(oNeuronFrom, oNeuronTo, dWeight){
	if(!oNeuronFrom || !oNeuronTo || oNeuronFrom == oNeuronTo) return false;
	if(_dw) _dw.Write("ConnectFromTo( "+(oNeuronFrom.id)+" -> "+(oNeuronTo.id)+" , W: "+dWeight+" )");
	
	this.aoNeuronsOrder  = null;   // Zrušíme pøípadnì spoèítané poøadí výpoètu neuronù 
	this.bContainsCycles = null;   // Zrušíme pøípadnì spoèítanou informaci, jestli obsahuje cykly 
	
	// Nahodná váha 
	if(!dWeight)
		dWeight = ( Math.random() * (this.dMaxWeight - this.dMinWeight) + this.dMinWeight )  *  ((Math.random() < 0.5) ? -1 : 1);

	var oSynapse = new cSynapse(oNeuronFrom, oNeuronTo, dWeight);
	oNeuronFrom.AddTrans(oSynapse);
	oNeuronTo.AddRecep(oSynapse);
	return true;
}



/**************************************************************
  Výpoèet neuronové sítì                                       
**************************************************************/
cNeuralNet.prototype.Compute = function(){
	var aoCurNeurons;
	var setNextNeurons = new cSet();
	var setDoneNeurons = new cSet();
	var oCurNeuron;
	
	var _iRounds = 0;
	
	aoCurNeurons = this.aoInputNeurons;
	
	// Dokud jsou ve frontì na výpoèet nìjaké neurony... 
	while(aoCurNeurons.length > 0) {
	
		//if(_dw) _dw.Write("."); ///
		if(_dw) _dw.Write("Starting computing round #"+(_iRounds++)+""); ///
	
		// Pro všechny neurony ve frontì na výpoèet v tomto kole... 
		for( var i in aoCurNeurons ){
			
			oCurNeuron = aoCurNeurons[i];
			  //if(_dw) _dw.Write("Computing neuron { "+(oCurNeuron.id)+" }"); ///
			oCurNeuron.Compute();
			setDoneNeurons.put(oCurNeuron);

			
		  //if(_dw) _dw.Write("- Following: [ "+(oCurNeuron.aTrans)+" ]"); ///
			
			// Pro všechny navazující neurony... 
			for( var j in oCurNeuron.aTrans ){
				var oToNeuron = oCurNeuron.aTrans[j].oTo;
				// ...pokud už navazující neuron není vypoètený, 
				if( oToNeuron != null  &&  !setDoneNeurons.has(oToNeuron) )
					// pøidáme ho do fronty na výpoèet v dalším kole. 
					setNextNeurons.put(oToNeuron);
			}
		}
		aoCurNeurons = setNextNeurons.getMembers();
		setNextNeurons.clear();
	}
	
	//if(_dw) _dw.Write("."); ///
	if(_dw) _dw.Write("Computing finished."); ///
	
}




/***************************************************************************************
	Rozhodnem, jestli sí obsahuje smyèky.                                                
	Pokud ne, vyhledá bezproblémové poøadí výpoètu neuronù.                               
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
***************************************************************************************/
cNeuralNet.prototype.FindComputingOrder = function(){
	var _dw = null;

	// Pracovní prostor... 
	var aoCurNeurons;
	var aoNeuronsOrder = new Array();
	var setNextNeurons = new cSet();
	var setDoneNeurons = new cSet();
	var oCurNeuron;
	var _iRounds = 0;

	aoCurNeurons = this.aoOutputNeurons;

	// Dokud jsou ve frontì na výpoèet nìjaké neurony... 
	while(aoCurNeurons.length > 0) {
		if(_dw) _dw.Write("."); ///
		if(_dw) _dw.Write("Starting backprop round #"+(_iRounds++)+""); ///
	
		try{
		// Pro všechny neurony ve frontì na výpoèet v tomto kole... 
		for_aoCurNeurons:
		for( var i in aoCurNeurons ){
			oCurNeuron = aoCurNeurons[i];
			  if(_dw) _dw.Write("- Traversing "+(oCurNeuron.toStringFull())+""); ///


			// Projedem navazující neurony 
			var bRefersToNonProcessedNeuron = false;
			for( var j in oCurNeuron.aTrans ){
				var oSynapseOut = oCurNeuron.aTrans[j];
				if( oSynapseOut.oTo == null )  continue;  // Pseudoneuron (výstupní nebo tak nìco)
				// Pokud neuron ještì nemá spoèten dError, pøeskoèíme ho, a necháme ho ještì ve frontì na zpracování. 
				if( !setDoneNeurons.has(oSynapseOut.oTo) ){
					if(_dw) _dw.Write("-- Skipping - has synapse to non-ready neuron."); ///
					break for_aoCurNeurons;
				}
			}
			
			setDoneNeurons.put(oCurNeuron);     // Pøidáme zpracovávaný neuron mezi hotové. 
			setNextNeurons.remove(oCurNeuron);  // Odstraníme zpracovávaný neuron z fronty na zpracování.
			// Neurony bez vstupù pøeskoèíme - to jsou vstupní pseudoneurony s hodnotami 
			if( oCurNeuron.aRecep.length != 0 ){
				aoNeuronsOrder.push(oCurNeuron);    // Uložíme zpracovávaný neuron do poøadí.   
			}
			
			
	
				//if(_dw) _dw.Write("- Following: [ "+(oCurNeuron.aRecep)+" ]"); ///
		
			// Pro všechny pøedcházející neurony... 
			for( var j in oCurNeuron.aRecep ){
				var oFromNeuron = oCurNeuron.aRecep[j].oFrom;
				if( oFromNeuron == null )  continue;
				
				// Pokud už není hotový, 
				if( !setDoneNeurons.has(oFromNeuron) ){						
					// pøidáme ho do fronty na výpoèet v dalším kole. 
					setNextNeurons.put(oFromNeuron);
				}
			}
			if(_dw) _dw.Write("+ Traversed "+(oCurNeuron.toStringFull())+""); ///
			
		}// for( var i in aoCurNeurons )			
		}catch(e){ _dw.Write("... Exception " + e); throw e; }
		
		// V setNextNeurons máme množinu neuronù na další kolo backpropagation. 
		aoCurNeurons = setNextNeurons.getMembers();
		//setNextNeurons.clear();     // Neurony se odstraòují, když jsou spoètené. 
	
	}// while()
	
	if(_dw) _dw.Write("."); ///
	if(_dw) _dw.Write("Traversing finished."); ///
	
	return this.aoNeuronsOrder = aoNeuronsOrder;
}



// Serialization 
cNeuralNet.prototype.Serialize = function(){
	var sSaveString = "";
	
	sSaveString += "@neurons\n";
	sSaveString += "# id : dValue : dBias : fFunc [ : oNeuronTo.id / dWeight ]*\n";
	
	for( var i in this.aoNeuronsOrder ){
		var oN = this.aoNeuronsOrder[i];
		// id, dValue, dBias, fFunc, 
		sSaveString += oN.id+":"+oN.dValue+":"+oN.dBias+":"+oN.fFunc.ID+"";
		for( var j in oN.aTrans ){
			// dWeight, oFrom, oTo
			var oS = oN.aTrans[j];
			if( null == oS.oTo ) continue; // Nìjaká pseudosynapse - asi výstupní vrstva 
			sSaveString += ":"+(oS.oTo ? oS.oTo.id : "null")+"/"+oS.dWeight+"";
		}
		sSaveString += "\n";
	}
	
	sSaveString += "@input";
	for( var i in this.aoInputNeurons ){ sSaveString += " "+this.aoInputNeurons[i].id; }
	sSaveString += "\n";
	
	sSaveString += "@output";
	for( var i in this.aoOutputNeurons ){ sSaveString += " "+this.aoOutputNeurons[i].id; }
	sSaveString += "\n";
	
	sSaveString += "@cycles "+this.bContainsCycles+"\n";
	
	return sSaveString;
}

cNeuralNet.prototype.Unserialize = function(sSaveString){
	var asLines = sSaveString.split("\n");
	
	// Výsledky 
	var aoNeurons = new Array();
	var aoInputNeurons = new Array();
	var aoOutputNeurons = new Array();
	var aoPendingSynapses = new Array();
	var sNetType = null;

	// 0 - nothing; 1 - neurons 
	var iMode = 0;
	
	// Pro všechny øádky 
	for( var i in asLines ){
		var sLine = asLines[i];
		if("#" == sLine.charAt(0)) continue;

		var asReResult = sLine.match( /^@(\w+)(\s+(.*))?/ );
		//if("@" == sLine.charAt(0)){
		if(null != asReResult){
			var sKeywordParams = asReResult[3];
			iMode = 0;
			var aoIONeurons = aoInputNeurons;
			//if("neurons" == sLine.substring()){
			switch(asReResult[1]){
				case "neurons": iMode = 1; break;
				case "nettype":
					sNetType = sKeywordParams;
					break;
				case "output":                   // Abych nemusel psát znova ten samej kód, udìláme fintu. 
					aoIONeurons = aoOutputNeurons; // aoIONeurons je buï aoO... nebo aoI..., podle keywordu.
				case "input":
					var saNeuronIDs = sKeywordParams;
					var asNeuronIDs = saNeuronIDs.split(" ");
					for( var iInpNeuIdx in asNeuronIDs ){
						var iInpNeuID = parseInt(asNeuronIDs[iInpNeuIdx]);
						if( !aoNeurons[iInpNeuID] )
							throw new Exception("Undefined neuron: ID = "+iInpNeuID+"");
						aoIONeurons.push( aoNeurons[iInpNeuID] );
					}
					break;
				
					break;
				case "cycles":
					switch(sKeywordParams){
						case "false": this.bContainsCycles = false; break;
						case "true":  this.bContainsCycles = true;  break;
						default:      this.bContainsCycles = null;  break;
					}
					break;
			}
		}
		// Na zaèátku není "@" 
		else if(iMode == 1){
			// id : dValue : dBias : fFunc [ : oNeuronTo.id / dWeight ]* 
			var asParts = sLine.split(":");
			if( asParts.length < 4 )
				throw new Exception("cNeuralNet::Unserialize(): Neuron has to be defined as \"id : dValue : dBias : fFunc [ : oNeuronTo.id / dWeight ]*\"");
    	                       // iID, dValue, dBias, sFuncID 
			var oNeuron = new cNeuron(parseInt(asParts[0]), parseFloat(asParts[1]), parseFloat(asParts[2]), (asParts[3]));
			aoNeurons[oNeuron.id] = oNeuron;
			
			for( var iTrans = 4; iTrans < asParts.length; iTrans++ ){
				// oNeuronTo.id / dWeight
				var asSynapse = asParts[iTrans].split("/");
				var iToId = parseInt(asSynapse[0]);
				var dWeight = parseFloat(asSynapse[1]);

				// Pokud není navazující neuron ještì vytvoøený, dáme si spojení do fronty pro neuron s daným ID. 
				if( !aoNeurons[iToId] ){
					//throw new Exception("No such neuron ID");
					if( !aoPendingSynapses[iToId] ) aoPendingSynapses[iToId] = new Array();
					aoPendingSynapses[iToId].push( { oFrom: oNeuron, dWeight: dWeight } );
				}
				// Jinak tu synapsi vytvoøíme.
				else
					this.ConnectFromTo(oNeuron, aoNeurons[iToId], dWeight);
					
				// Pokud na tento neuron již èekají nìjaké pøíchozí synapse, vytvoøíme.
				if( aoPendingSynapses[oNeuron.id] /* && "object" == typeof aoPendingSynapses[oNeuron.id] */ ){
					for( var iSynIndex in aoPendingSynapses[oNeuron.id] )
						this.ConnectFromTo(
							aoPendingSynapses[oNeuron.id][iSynIndex].oFrom,
							oNeuron,
							aoPendingSynapses[oNeuron.id][iSynIndex].dWeight );
				}
			}
		}// Na zaèátku není "@" - else if(iMode == 1)
		
	}// Pro všechny øádky - for( var i in asLines )
	
	this.aoNeuronsOrder = aoNeurons;
	
}





/**************************************************************
  Trida pro adaptaci vstupù                                    
	- aby nebylo nutné hrabat se pøímo v síti                    
**************************************************************/
function cNeuralNetIOAdapter(oNeuralNet){
	this.aoInputSynapses  = new Array(/*oNeuralNet.aoInputNeurons.length*/);
	this.aoOutputSynapses = new Array(/*oNeuralNet.aoOutputNeurons.length*/);
	this.oNeuralNet       = oNeuralNet;
	
	// Pro všechny vstupní neurony sítì... 
	for(var i in oNeuralNet.aoInputNeurons){
		// ...vytvoøíme pseudosynapse, 
		var oNewPseudoSynapse = new cSynapse(new cNeuron(null, 1.0)/*null*/, oNeuralNet.aoInputNeurons[i], 1.0);
		// navážeme je na neurony, 
		oNeuralNet.aoInputNeurons[i].AddRecep(oNewPseudoSynapse);
		// a pøidáme je do pole v tomto adaptéru. 
		this.aoInputSynapses.push(oNewPseudoSynapse);
	}
	
	// Pro všechny výstupní neurony sítì... 
	for(var i in oNeuralNet.aoOutputNeurons){
		// ...vytvoøíme pseudosynapse, 
		var oNewPseudoSynapse = new cSynapse(oNeuralNet.aoOutputNeurons[i], null);
		// navážeme je na neurony, 
		oNeuralNet.aoOutputNeurons[i].AddTrans(oNewPseudoSynapse);
		// a pøidáme je do pole v tomto adaptéru. 
		this.aoOutputSynapses.push(oNewPseudoSynapse);
	}
	//alert("Out Neu: "+oNeuralNet.aoOutputNeurons); ///
	//alert("Out Syn: "+this.aoOutputSynapses); ///
}

// Nastavíme synapsím hodnoty 
cNeuralNetIOAdapter.prototype.SetInputValues = function(adValues){
	if(adValues.length < this.aoInputSynapses.length)
		return false;
		
	for( var i in this.aoInputSynapses ){
		// Synapse vychází z neuronu s hodnotou 1.0. Vstup upravujeme zmìnou váhy. 
		this.aoInputSynapses[i].SetWeight(adValues[i]);
	}
	return true;
}

// Pøeèteme hodnoty na výstupních synapsích 
cNeuralNetIOAdapter.prototype.GetOutputValues = function(){
	var adValues = new Array(this.aoOutputSynapses.length);
		
	for( var i in this.aoOutputSynapses ){
		adValues[i] = this.aoOutputSynapses[i].GetInput();
	}
	return adValues;
}

// Seèteme hodnoty na výstupu - pro ohodnocení chyby 
cNeuralNetIOAdapter.prototype.GetOutputSum = function(){
	var dSum = 0;
	for( var i in this.aoOutputSynapses ){
		dSum += this.aoOutputSynapses[i].GetInput();
	}
	return dSum;
}




/*var iNeurons = 100000;
	window.status = "Generating net with "+iNeurons+" neurons...";
	net = new cNeuralNet(iNeurons);
	window.status = "Done";*/
