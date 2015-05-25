L.Control.Measure = L.Control.extend({
	options: {
		position: 'topleft',
        measureUnit: 'm'
	},

	onAdd: function (map) {
		var className = 'leaflet-control-zoom leaflet-bar leaflet-control',
		    container = L.DomUtil.create('div', className);

		this._createButton('&#8674;', 'Measure', 'leaflet-control-measure leaflet-bar-part leaflet-bar-part-top-and-bottom', container, this._toggleMeasure, this);

		return container;
	},
	
	// creates a line without user interaction
	displayLine: function(latLngs) {
		if (!this._measuring) {
			this._toggleMeasure();
			//this._startMeasuring();
		}

		for (index = 0; index < latLngs.length; ++index) {
			var e = {latlng: latLngs[index]};
			this._mouseClick(e);
		}
		this._finishPath();
	},

	// stops measure and clears lines
	clearLines: function() {
		if (this._measuring) {
			this._toggleMeasure();
		}
	},

	_createButton: function (html, title, className, container, fn, context) {
		var link = L.DomUtil.create('a', className, container);
		link.innerHTML = html;
		link.href = '#';
		link.title = title;

		L.DomEvent
			.on(link, 'click', L.DomEvent.stopPropagation)
			.on(link, 'click', L.DomEvent.preventDefault)
			.on(link, 'click', fn, context)
			.on(link, 'dblclick', L.DomEvent.stopPropagation);

		return link;
	},

	_toggleMeasure: function () {
		this._measuring = !this._measuring;

		if(this._measuring) {
			L.DomUtil.addClass(this._container, 'leaflet-control-measure-on');
			this._startMeasuring();
		} else {
			L.DomUtil.removeClass(this._container, 'leaflet-control-measure-on');
			this._stopMeasuring();
		}
	},

	_startMeasuring: function() {
		this._oldCursor = this._map._container.style.cursor;
		this._map._container.style.cursor = 'crosshair';

		this._doubleClickZoom = this._map.doubleClickZoom.enabled();
		this._map.doubleClickZoom.disable();

		L.DomEvent
			.on(this._map, 'mousemove', this._mouseMove, this)
			.on(this._map, 'click', this._mouseClick, this)
			.on(this._map, 'dblclick', this._finishPath, this)
			.on(document, 'keydown', this._onKeyDown, this);
      
		this._map.fire('measure:measurestart', { layerType: this.type });

		if(!this._layerPaint) {
			this._layerPaint = L.layerGroup().addTo(this._map);	
		}

		if(!this._points) {
			this._points = [];
		}
	},

	_stopMeasuring: function() {
		this._map._container.style.cursor = this._oldCursor;

		L.DomEvent
			.off(document, 'keydown', this._onKeyDown, this)
			.off(this._map, 'mousemove', this._mouseMove, this)
			.off(this._map, 'click', this._mouseClick, this)
			.off(this._map, 'dblclick', this._mouseClick, this);

    	this._map.fire('measure:measurestop', { layerType: this.type });

		if(this._doubleClickZoom) {
			this._map.doubleClickZoom.enable();
		}

		if(this._layerPaint) {
			this._layerPaint.clearLayers();
		}
		
		this._restartPath();
	},

	_mouseMove: function(e) {
		if(!e.latlng || !this._lastPoint) {
			return;
		}
		
		if(!this._layerPaintPathTemp) {
			this._layerPaintPathTemp = L.polyline([this._lastPoint, e.latlng], { 
				color: 'black',
				weight: 1.5,
				clickable: false,
				dashArray: '6,3'
			}).addTo(this._layerPaint);
		} else {
			this._layerPaintPathTemp.spliceLatLngs(0, 2, this._lastPoint, e.latlng);
		}

		if(this._tooltip) {
			if(!this._distance) {
				this._distance = 0;
			}

			this._updateTooltipPosition(e.latlng);

			var distance = e.latlng.distanceTo(this._lastPoint);
			this._updateTooltipDistance(this._distance + distance, distance);
		}
	},

	_mouseClick: function(e) {
		// Skip if no coordinates
		if(!e.latlng) {
			return;
		}
		
		this._points.push(e.latlng);

		// If we have a tooltip, update the distance and create a new tooltip, leaving the old one exactly where it is (i.e. where the user has clicked)
		if(this._lastPoint && this._tooltip) {
			if(!this._distance) {
				this._distance = 0;
			}

			this._updateTooltipPosition(e.latlng);

			var distance = e.latlng.distanceTo(this._lastPoint);
			this._updateTooltipDistance(this._distance + distance, distance);

			this._distance += distance;
		}
		this._createTooltip(e.latlng);
		

		// If this is already the second click, add the location to the fix path (create one first if we don't have one)
		if(this._lastPoint && !this._layerPaintPath) {
			this._layerPaintPath = L.polyline([this._lastPoint], { 
				color: 'black',
				weight: 2,
				clickable: false
			}).addTo(this._layerPaint);
		}

		if(this._layerPaintPath) {
			this._layerPaintPath.addLatLng(e.latlng);
		}

		// Upate the end marker to the current location
		if(this._lastCircle) {
			this._layerPaint.removeLayer(this._lastCircle);
		}

		this._lastCircle = new L.CircleMarker(e.latlng, { 
			color: 'black', 
			opacity: 1, 
			weight: 1, 
			fill: true, 
			fillOpacity: 1,
			radius:2,
			clickable: this._lastCircle ? true : false
		}).addTo(this._layerPaint);
		
		this._lastCircle.on('click', function() { this._finishPath(); }, this);

		// Save current location as last location
		this._lastPoint = e.latlng;
	},

	_finishPath: function() {
		// Remove the last end marker as well as the last (moving tooltip)
		if(this._lastCircle) {
			this._layerPaint.removeLayer(this._lastCircle);
		}
		if(this._tooltip) {
			this._layerPaint.removeLayer(this._tooltip);
		}
		if(this._layerPaint && this._layerPaintPathTemp) {
			this._layerPaint.removeLayer(this._layerPaintPathTemp);
		}

		this._map.fire('measure:finishedpath', { layerType: this.type , points: this._points, measureUnit: this.options.measureUnit});

		//clear _points
		if (this._points) {
			this._points.length=0;
		}

		// Reset everything
		this._restartPath();
	},

	_restartPath: function() {
		this._distance = 0;
		this._tooltip = undefined;
		this._lastCircle = undefined;
		this._lastPoint = undefined;
		this._layerPaintPath = undefined;
		this._layerPaintPathTemp = undefined;
	},
	
	_createTooltip: function(position) {
		var icon = L.divIcon({
			className: 'leaflet-measure-tooltip',
			iconAnchor: [-5, -5]
		});
		this._tooltip = L.marker(position, { 
			icon: icon,
			clickable: false
		}).addTo(this._layerPaint);
	},

	_updateTooltipPosition: function(position) {
		this._tooltip.setLatLng(position);
	},

	_updateTooltipDistance: function(total, difference) {
		var totalRound;
		var differenceRound;
		var measureUnit = this.options.measureUnit;

		//extensible option for multiple units
		switch(measureUnit){
			case "nm":  
				total *= 0.00053996;
				difference	*= 0.00053996;
				break;
			case "ft":
				total *= 3.2808;
				difference	*= 3.2808;
				break;
			case "yd":
				total *=  1.0936;
				difference	*=  1.0936;
				break;
			case "mi":
				total *=  0.00062137;
				difference	*=  0.00062137;
				break;
			case "km":
				total /=  1000;
				difference	/=  1000;
				break;
			case "m":
				total /=1;
				difference != 1;
				break;
			default:
				console.error("Unit: "+measureUnit+" is not supportet by Leaflet.Measure");
		}

		totalRound = Math.round(total, 2);
		differenceRound = Math.round(difference, 2);

		var text = '<div class="leaflet-measure-tooltip-total">' + totalRound + measureUnit + '</div>';
		if (differenceRound > 0 && totalRound != differenceRound) {
			text += '<div class="leaflet-measure-tooltip-difference">(+' + differenceRound + measureUnit + ')</div>';
		}

		this._tooltip._icon.innerHTML = text;
	},

	_onKeyDown: function (e) {
		if(e.keyCode == 27) {
			// If not in path exit measuring mode, else just finish path
			if(!this._lastPoint) {
				this._toggleMeasure();
			} else {
				this._finishPath();
			}
		}
	}
});

L.Map.mergeOptions({
	measureControl: false
});

L.Map.addInitHook(function () {
	if (this.options.measureControl) {
		this.measureControl = new L.Control.Measure();
		this.addControl(this.measureControl);
	}
});

L.control.measure = function (options) {
	return new L.Control.Measure(options);
};
