/*
Collection of useful functions and objects for running JavaScript-based
tasks.

Copyright Mark Ho August 2013

Update: Feb 2014

dependencies:
jQuery
Underscore.js
recorder.js

*/
//prevent conflict between jquery and other libraries
var $j = jQuery.noConflict();
var psyFun = {};


/*
 *
 *
 *
 * extensions to Underscore.js
 *
 *
 *
 *
 */
_.mixin({
	//replicates a list some number of times
	replist : function (list, rep_num) {
		var new_list = [];
		for (var i = 0; i < rep_num; i++) {
			for (var j = 0; j < list.length; j++) {
				new_list.push(_.clone(list[j]));
			}
		}
		return new_list;
	},

	//shuffles a list in place - same as fisheryates algorithm below
	shuffleInPlace : function ( myArray ) {
	  var i = myArray.length;
	  if ( i == 0 ) return false;
	  while ( --i ) {
	     var j = Math.floor( Math.random() * ( i + 1 ) );
	     var tempi = myArray[i];
	     var tempj = myArray[j];
	     myArray[i] = tempj;
	     myArray[j] = tempi;
	   }
	},

	//reshapes a nested 2D array
	reshape : function(oldArray, rows, cols) {
		var allElements = _.flatten(oldArray);
		var toReturn = [];
		if (allElements.length != rows*cols) {
			throw "reshape error: old array and new array are different sizes";
		}
		allElements.reverse();
		for (var r = 0; r < rows; r++) {
			var temp = [];
			for (var c = 0; c < cols; c++) {
				temp.push(allElements.pop());
			}
			toReturn.push(temp);
		}
		return toReturn;
	},

	//generates a locally random sequence according to three parameters:
	// elements: list of elements to be locally randomized
	// numElements: number of each element in a repitition
	// repetitions: number of repititions of the randomized sequence
	//can only handle shallow copies
	genLocallyRandomSequence : function (elements, proportions, repetitions) {
		var toReturn = [];

		if (elements.length != proportions.length) {
			throw "generate local random sequence error: number of elements and proportions do not match";
		}
		var templateSeq = [];
		for (var i = 0; i < elements.length; i++) {
			var numEl = proportions[i];
			var element = elements[i];
			for (var j = 0; j < numEl; j++) {
				templateSeq.push(element);
			}
		}

		for (var r = 0; r < repetitions; r++) {
			var tempRand = _.clone(templateSeq);
			_.shuffleInPlace(tempRand);
			toReturn.push(tempRand);
		}

		return _.flatten(toReturn);
	},

	//returns if an element is in an array
	isIn : function (element, myArray) {
		return (myArray.indexOf(element) > -1);
	},

	//returns a hash of frequencies of elements in an array
	getFreq : function (myArray) {
		var toReturn = {};
		for (var i = 0; i < myArray.length; i++) {
			if (typeof(toReturn[myArray[i]]) === "undefined") {
				toReturn[myArray[i]] = 1;
			}
			else {
				toReturn[myArray[i]]++;
			}
		}
		return toReturn;
	},

	//counterbalances several factors some number of times
	// takes in a dictionary with arrays as values
	// it does not shuffle things
	cartesianCounterbalance : function(factors, repeat) {
		var repeat = (typeof repeat === "undefined") ? 1 : repeat;

		var factorKeys = _.keys(factors);
		var toReturn = [];

		for (var r = 0; r < repeat; r++) {
			var subReturn = _.reduce(factorKeys, function (oldMemo, factorKey) {
				var levels = factors[factorKey];
				var newMemo = [];
				for (var l = 0; l < levels.length; l++) {
					for (var m = 0; m < oldMemo.length; m++) {
						var temp = _.extend({}, oldMemo[m]);
						temp[factorKey] = _.cloneDeep(levels[l]);
						newMemo.push(temp);
					}
				}
				return newMemo;
			}, [{}]);

			toReturn = _.flatten([toReturn,subReturn]);
		}


		return toReturn;
	},

	permute : function (input) {
		var set =[];
		function p (arr, data) {
			var cur, memo = data || [];
			for (var i = 0; i < arr.length; i++) {
				cur = _.cloneDeep(arr.splice(i, 1)[0]);
				if (arr.length === 0) set.push(memo.concat([cur]));
				p(arr.slice(), memo.concat([cur]));
				arr.splice(i, 0, cur);
			}
			return set;
		}
		return p(input);
	},

	numberWithCommas : function(x) {
    	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	},

	moneyWithCommas : function(x) {
		if (x < 0) {
			x = Math.abs(x);
			return "-$"+x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		}
		return "$"+x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

	}
});

/*
 *
 *
 *
 *
 *
 *
 *
 */

//returns the first index that an element ele appears in the list
psyFun.getIndex = function (ele, list) {
	for (var i = 0; i < list.length; i++) {
		if (list[i] == ele) {return i;}
	}
	return -1;
}

//pad a number num with leading zeros so it has a size of size
// if size < digits(num) then just return num
psyFun.zerospad = function (num, size) {
	if (num.toString().length > size) {
		return num.toString();
	}
	size = (typeof size === "undefined") ? 3 : size;
	var s = new Array();
	for (var i = 0; i < size; i++) {s.push('0');}
	s.push(num.toString());
	s = s.join('');
    return s.substr(s.length-size);
}

//chooses a random element from an array to return given probabilistic weights for elements
//weights defaults to uniform selection
psyFun.randChoose = function (myArray, weights) {
	//default is to set it up intensionally
	if (typeof weights === "undefined") {
		weights = new Array();
		for (var i = 0; i < myArray.length; i++) {
			weights.push(1);
		}
	}

	if (weights.length != myArray.length) {
		throw "Error: choice array and weight array are of different lengths";
	}

	//creates an array of indices based on the weights array and randomly chooses one
	var weightArray = new Array();
	for (var i = 0; i < weights.length; i ++) {
		for (var j = 0; j < weights[i]; j++) {
			weightArray.push(i);
		}
	}

	var randNum = weightArray[Math.floor(Math.random()*weightArray.length)];
	return myArray[randNum];
}

//preload image
psyFun.preloadImage = function (url)
{
    var img=new Image();
    img.src=url;
}

//gets parameters that have been passed via the URL
psyFun.getURLParam = function (name) {
		name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
		var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
		    results = regex.exec(location.search);
		return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
	}
