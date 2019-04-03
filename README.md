Leaflet measure control
=======================

Adds a button below the map's zoom controls that allows you to activate an interactive mode to measure distances on the map.

Initialise control
 
- Add CSS and JS

```
	<link rel="stylesheet" href="leaflet.measure/leaflet.measure.css" />
	<script src="leaflet.measure/leaflet.measure.js"></script>
```

- Add Measure Control
 * as an option when creating map

```
	var map = L.map("map", { measureControl: true });
```

 * or after map instantiation 

```
	var measureControl = new L.Control.Measure({
		position: 'topleft',
		measureUnit: 'km'
		measureUnitPrecision: 1
	});
	measureControl.addTo(map);
```

## Demos
* [simpleExample](http://kartenkarsten.github.io/leaflet.measure/demo/example.html)
* [demo](http://kartenkarsten.github.io/leaflet.measure/demo/index.html) with 
[hashComponent](https://github.com/kartenkarsten/hashComponent) to store drawn lines in URL.
