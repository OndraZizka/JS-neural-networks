/*** -*- Mode: Javascript; tab-width: 2;
The contents of this file are subject to the Mozilla Public
License Version 1.1 (the "License"); you may not use this file
except in compliance with the License. You may obtain a copy of
the License at http://www.mozilla.org/MPL/
                                                                                                    
Software distributed under the License is distributed on an "AS
IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
implied. See the License for the specific language governing
rights and limitations under the License.
                                                                                                    
The Original Code is jslib code.
The Initial Developer of the Original Code is jslib team.
                                                                                                    
Portions created by jslib team are
Copyright (C) 2000 jslib team.  All
Rights Reserved.
                                                                                                    
Contributor(s): Rajeev J Sebastian <rajeev_jsv@yahoo.com)> (original author)
                                                                                                    
*************************************/


function Parameter(k, v) {
  this.key = k;
  this.value = v;
}

Parameter.prototype = {
  key:null,
  value:null
}


// Stores a set of keys and associated values. 
function cDictionary(){
  this._array = new Array();
}

cDictionary.prototype = {
  _array: null,
  _iterind: 0,

  // If key exists, will replace current value with value arg. 
  put: function(key,value){
    if( key ==null || value == null ) return this;

    var ind = -1;
    for(var i = 0; i < this._array.length; i++ )
      if( this._array[i].key == key ){
        ind = i; break;
			}

    if( ind == -1 ){
      var p = new Parameter(key,value);
      this._array.push(p);
    }else{
      this._array[ind].value = value;
    }
    return this;
  },

  get: function(key){
    for(var i = 0; i < this._array.length; i++ )
      if( this._array[i].key == key ) return this._array[i].value;
    return null;
  },

  remove: function(key){
    for(var i = 0; i < this._array.length; i++ )
      if( this._array[i].key == key ){
        this._array.splice(i,1);
      }
  },

  keys: function(){
    var list = new Array();
    for(var i = 0; i < this._array.length; i++ )
      list.push(this._array[i].key);
    return list;
  },

  //checks if dict has a key, and if it does, sets value to
  //the value in dict
  hasKey: function(key, value){
    value = null;
    for(var i = 0; i < this._array.length; i++ )
      if( this._array[i].key == key ){
        value = this._array[i].value;
        return true;
      }
    return false;
  },

  get size(){  return _array.length; },

  //object related 
  toString: function(){
    return "cDictionary: " + _array.length;
  },


  //iterator related 
  //iterates over each Parameter
  resetIterator: function(){ this._iterind = 0; },
  hasNext: function(){ return ( this._iterind < this._array.length ); },
	next: function(key, value){ return this._array[this._iterind++]; }
}
