/***************************************************************
  Debug Window  
***************************************************************/
var _dw;
function DebugWindow(){
	this.win = null;
}
DebugWindow.prototype.Open = function(){
	//DumpObjectEx(window.screen);
	var iLeft = window.screen.width - 500;
	var iHei = window.screen.height;
	this.win = window.open('', '_debug_window' , "width=500, height="+iHei+", left="+iLeft+", top=10, resizable=yes, scrollbars=yes");
	this.win.document.getElementsByTagName("head")[0].innerHTML += ("<style> body { font-family: Verdana, sans-serif; font-size: 10px; } </style>\r\n");
	//this.win.document.open();
}
DebugWindow.prototype.Finish = function(){
	//this.win.document.close();
}
DebugWindow.prototype.Clear = function(){
	this.win.document.body.innerHTML = "";
}
DebugWindow.prototype.Write = 
DebugWindow.prototype.Dump = function(sMessage){
	if(this.win == null) return false;
	this.win.focus();
	this.win.document.body.innerHTML += ("<div>"+sMessage+"</div>\r\n");
}
DebugWindow.prototype.WritePlain = function(sMessage){
	if(this.win == null) return false;
	this.win.focus();
	this.win.document.body.innerHTML += (sMessage);
}