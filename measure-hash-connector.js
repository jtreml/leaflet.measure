
L.MeasureControlConnector = function(map, storage, measure) {

	if (map && storage && measure) {
		this.init(map, storage, measure);
	}
};

L.MeasureControlConnector.formatHash = function(path, precision) {
	console.log("format",path);

	var latLngStringArray = new Array(path.points.length);
	for (var j=0; j<path.points.length; j++) {
		latLngStringArray[j] = path.points[j].lat.toFixed(precision)+ ","+ path.points[j].lng.toFixed(precision);
	}
	var dataString = latLngStringArray.join(";");
	return dataString;
};

L.MeasureControlConnector.parseHash = function(data) {
	console.log("parse hash part");

	var rawPaths = data.split("|");
	var paths = new Array(rawPaths.length); 
	for (var i=0; i<rawPaths.length; i++){
		// parse path latlng;latlng;...
		var rawCoordinates = rawPaths[i].split(";");
		var lonLatArray = new Array(rawCoordinates.length);
		for (var j=0; j<rawCoordinates.length; j++) {
			//parse Cordinate lat,lon
			var point = String(rawCoordinates[j]).split(",");
			lonLatArray[j] = new L.LatLng(point[0],point[1]);
		}
		paths[i] = {points: lonLatArray};
	};
	return paths;
};

L.MeasureControlConnector.prototype = {
	map: null,
	storage: null,
	measure: null,
	idx:null,
	lastHash: null,
	partStrings: new Array(),

	applingHash: false,
	formatHash: L.MeasureControlConnector.formatHash,
	parseHash: L.MeasureControlConnector.parseHash,

	init: function(map, storage, measure) {
		this.map = map;
		this.storage = storage;
		this.measure = measure;

		// reset the hash
		this.lastHash = null;
		// register to be called after hash changed
		this.idx = this.storage.registerHashPartConnector(this);

		if (!this.isListening) {
			this.startListening();
		}
	},

	onFinishedPath: function(e) {
		if (this.applingHash) {
			return false;
		}
		var zoom = this.map.getZoom();
		var precision = Math.max(0, Math.ceil(Math.log(zoom) / Math.LN2));
		var part = this.formatHash(e, precision);
		this.partStrings.push(part);
		var dataString = this.partStrings.join("|");

		if (this.storage) {
			this.storage.updateHashPart({idx:this.idx,data:dataString});
		}
	},

	onMeasureStart: function(e) {
	},
	onMeasureStop: function(e) {
		this.partStrings= new Array();
		if (this.storage) {
			this.storage.updateHashPart({idx:this.idx,data:""});
		}
	},

	applyHash: function(hash) {
		if (hash == "") return;
		var paths = this.parseHash(hash);
		if (this.partStrings.length==0){
			this.partStrings.push(hash.split('|'));
		}
		this.applingHash = true;
		//apply points
		this.measure.clearLines();
		for (var i=0; i<paths.length;i++) {
			this.measure.displayLine(paths[i].points);
		}
		this.applingHash = false;
	},


	isListening: false,
	startListening: function() {
		map.on('measure:finishedpath', this.onFinishedPath, this);
		map.on('measure:measurestart', this.onMeasureStart, this);
		map.on('measure:measurestop', this.onMeasureStop, this);
		this.isListening = true;
	},
	stopListening: function() {
		map.off('measure:finishedpath', this.onFinishedPath, this);
		map.off('measure:measurestart', this.onMeasureStart, this);
		map.off('measure:measurestop', this.onMeasureStop, this);
		this.isListening = false;
	}
};
L.measureControlConnector = function(map) {
	return new L.MeasureControlConnector(map);
};
