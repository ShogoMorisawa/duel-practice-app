ENV["BUNDLE_GEMFILE"] ||= File.expand_path("../Gemfile", __dir__)

require "bundler/setup" # Set up gems listed in the Gemfile.
# bootsnapをRenderでのデプロイ時にスキップする
require "bootsnap/setup" unless ENV["RENDER"] # Speed up boot time by caching expensive operations.
