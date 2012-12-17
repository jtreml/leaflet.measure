# Rails-leaflet-measure

Rails gem for easily using https://github.com/jtreml/leaflet.measure

## Installation

Add this line to your application's Gemfile:

    gem 'rails-leaflet-measure', :git => "git://github.com/lamont-granquist/rails-leaflet-measure.git"

And then execute:

    $ bundle

Add to your application.js file:

     //= require leaflet.measure

Add to your application.css file:

    *= require leaflet.measure

Add to your leaflet map's javascript:

    map = new L.map('map', {
      measureControl: true
    })

## Usage

TODO: Write usage instructions here

## Contributing

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request
