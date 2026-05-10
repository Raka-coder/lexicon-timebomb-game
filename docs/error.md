stage-0
COPY .nixpacks/nixpkgs-31fb21469e34b6b5c7be77b9a35bae43d0c598e9.nix .nixpacks/nixpkgs-31fb21469e34b6b5c7be77b9a35bae43d0c598e9.nix
397ms

stage-0
RUN nix-env -if .nixpacks/nixpkgs-31fb21469e34b6b5c7be77b9a35bae43d0c598e9.nix && nix-collect-garbage -d
34s
unpacking 'https://github.com/NixOS/nixpkgs/archive/31fb21469e34b6b5c7be77b9a35bae43d0c598e9.tar.gz' into the Git cache...
unpacking 'https://github.com/railwayapp/nix-npm-overlay/archive/main.tar.gz' into the Git cache...
installing '31fb21469e34b6b5c7be77b9a35bae43d0c598e9-env'
Build Failed: build daemon returned an error < failed to solve: process "/bin/bash -ol pipefail -c nix-env -if .nixpacks/nixpkgs-31fb21469e34b6b5c7be77b9a35bae43d0c598e9.nix && nix-collect-garbage -d" did not complete successfully: exit code: 1 >