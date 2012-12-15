# -*- encoding: utf-8 -*-
lib = File.expand_path('../lib', __FILE__)
$LOAD_PATH.unshift(lib) unless $LOAD_PATH.include?(lib)
require 'rails-leaflet-measure/version'

Gem::Specification.new do |gem|
  gem.name          = "rails-leaflet-measure"
  gem.version       = Rails::Leaflet::Measure::VERSION
  gem.authors       = ["Lamont Granquist"]
  gem.email         = ["lamont@scriptkiddie.org"]
  gem.description   = %q{Rails gem for leaflet-measure plugin}
  gem.summary       = %q{Rails gem for leaflet-measure plugin}
  gem.homepage      = "https://github.com/lamont-granquist/rails-leaflet-measure"

  gem.files         = `git ls-files`.split($/)
  gem.executables   = gem.files.grep(%r{^bin/}).map{ |f| File.basename(f) }
  gem.test_files    = gem.files.grep(%r{^(test|spec|features)/})
  gem.require_paths = ["lib"]

  gem.add_dependency "leaflet-rails"
end
