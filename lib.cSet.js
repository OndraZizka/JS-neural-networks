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
Class cSet was written by Ondra Zizka.
                                                                                                    
Portions created by jslib team are Copyright (C) 2000 jslib team.  All Rights Reserved.
Contributor(s): Rajeev J Sebastian <rajeev_jsv@yahoo.com)> (original author)
*************************************/



// Stores a set of values. 
function cSet(){
  this._array = new Array();
}

cSet.prototype = {
	_iterind: 0,
	_array: [],
	
	// Empty the set. 
	clear: function(){ this._array = new Array(); },
	
	// If item is not a member, add it. 
	put: function(key){
		if( key == null ) return this;
		
		var ind = -1;
		for(var i = 0; i < this._array.length; i++ )
		  if( this._array[i] == key ){
		    ind = i; break;
		}
		
		if( ind == -1 ){
		  this._array.push(key);
		}
		return this;
	},
	
	// Test whether the item is a member of this set. 
	has: function(key){
		for(var i = 0; i < this._array.length; i++ )
		  if( this._array[i] == key ) return true;
		return null;
	},
	
	// Remove item from the set. 
	remove: function(key){
		for(var i = 0; i < this._array.length; i++ )
		  if( this._array[i] == key ){
		    this._array.splice(i,1);
		  }
	},
	
	// Get an array of members. 
	getMembers: function(){
		var aoMembers = new Array();
		for(var i = 0; i < this._array.length; i++ )
		  aoMembers.push(this._array[i]);
		return aoMembers;
	},
	
	// Get the size of this set. 
	getSize: function(){  return this._array.length; },
	
	// Object related 
	toString: function(){ return "cSet: " + this._array.length; },
	
	
	// Iterator related 
	// Iterates over each member. 
	resetIterator: function(){ this._iterind = 0; },
	hasNext: function(){ return ( this._iterind < this._array.length ); },
	next: function(){ return this._array[this._iterind++]; }
}