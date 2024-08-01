{ pkgs, lib, config, inputs, ... }:

{
  # https://devenv.sh/packages/
  packages = [ 
    pkgs.cmake
    pkgs.git
    pkgs.nodejs_20
    pkgs.rustup
  ];
}
