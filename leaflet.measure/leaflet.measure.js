L.Control.Measure = L.Control.extend({
	options: {
		position: 'topleft'
	},

	onAdd: function (map) {
		var className = 'leaflet-control-zoom',
		    container = L.DomUtil.create('div', className);

		this._createButton('Measure', 'leaflet-control-measure', container, this._toogleMeasure, this);

		return container;
	},

	_createButton: function (title, className, container, fn, context) {
		var link = L.DomUtil.create('a', className, container);
		link.href = '#';
		link.title = title;

		L.DomEvent
			.on(link, 'click', L.DomEvent.stopPropagation)
			.on(link, 'click', L.DomEvent.preventDefault)
			.on(link, 'click', fn, context)
			.on(link, 'dblclick', L.DomEvent.stopPropagation);

		return link;
	},

	_toogleMeasure: function () {
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

		L.DomEvent.on(this._map, 'mousemove', this._mouseMove, this);
		L.DomEvent.on(this._map, 'click', this._mouseClick, this);

		if(!this._layerPaint) {
			this._layerPaint = L.layerGroup().addTo(this._map);	
		}

		if(!this._points) {
			this._points = [];
		}
	},

	_stopMeasuring: function() {
		this._map._container.style.cursor = this._oldCursor;

		L.DomEvent.off(this._map, 'mousemove', this._mouseMove, this);
		L.DomEvent.off(this._map, 'click', this._mouseClick, this);

		this._layerPaint.clearLayers();
		
		this._restartPath();
	},

	_mouseMove: function(e) {
		if(!e.latlng || !this._lastPoint) {
			return;
		}
		
		if(!this._layerPaintPathTemp) {
			this._layerPaintPathTemp = L.polyline([this._lastPoint, e.latlng], { 
				color: 'black',
				weight: 1,
				clickable: false
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
		if(!e.latlng) {
			return;
		}

		if(this._lastCircle) {
			this._layerPaint.removeLayer(this._lastCircle);
		}

		this._lastCircle = new L.CircleMarker(e.latlng, { 
			color: 'red', 
			opacity: 1, 
			weight: 1, 
			fill: true, 
			fillOpacity: 1, 
			clickable: this._lastCircle ? true : false
		}).setRadius(3).addTo(this._layerPaint);

		this._lastCircle.on('click', function() { this._finishPath(); }, this);

		if(this._lastPoint && this._tooltip) {
			if(!this._distance) {
				this._distance = 0;
			}

			var distance = e.latlng.distanceTo(this._lastPoint);
			this._updateTooltipDistance(this._distance + distance, distance);

			this._distance += distance;
		}
		this._createTooltip(e.latlng);

		if(!this._lastPoint) {
			this._lastPoint = e.latlng;
			return;
		}

		if(!this._layerPaintPath) {
			this._layerPaintPath = L.polyline([this._lastPoint, e.latlng], { 
				color: 'red',
				clickable: false
			}).addTo(this._layerPaint);
			
			this._lastPoint = e.latlng;

			return;
		}

		this._lastPoint = e.latlng;
		this._layerPaintPath.addLatLng(e.latlng);
		this._createTooltip(e.latlng);
	},

	_finishPath: function() {
		this._layerPaint.removeLayer(this._lastCircle);
		this._layerPaint.removeLayer(this._tooltip);
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
		var text = '<div class="leaflet-measure-tooltip-total">' + this._round(total) + ' nm</div>';
		if(total != difference) {
			text += '<div class="leaflet-measure-tooltip-difference">(+' + this._round(difference) + ' nm)</div>';
		}

		this._tooltip._icon.innerHTML = text;
	},

	_round: function(val) {
		return Math.round((val / 1852) * 10) / 10;
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
