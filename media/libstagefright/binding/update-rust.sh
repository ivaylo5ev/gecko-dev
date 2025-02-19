#!/bin/sh
# Script to update mp4parse-rust sources to latest upstream

# Default version.
VER=v0.5.1

# Accept version or commit from the command line.
if test -n "$1"; then
  VER=$1
fi

echo "Fetching sources..."
rm -rf _upstream
git clone https://github.com/mozilla/mp4parse-rust _upstream/mp4parse
pushd _upstream/mp4parse
git checkout ${VER}
echo "Verifying sources..."
pushd mp4parse
cargo test
popd
echo "Constructing C api header..."
pushd mp4parse_capi
cargo build
echo "Verifying sources..."
cargo test
popd
popd
rm -rf mp4parse
mkdir -p mp4parse/src
cp _upstream/mp4parse/mp4parse/Cargo.toml mp4parse/
cp _upstream/mp4parse/mp4parse/src/*.rs mp4parse/src/
rm -rf mp4parse_capi
mkdir -p mp4parse_capi/src
cp _upstream/mp4parse/mp4parse_capi/Cargo.toml mp4parse_capi/
cp _upstream/mp4parse/mp4parse_capi/build.rs mp4parse_capi/
cp _upstream/mp4parse/mp4parse_capi/include/mp4parse.h include/
cp _upstream/mp4parse/mp4parse_capi/src/*.rs mp4parse_capi/src/

# TODO: download deps from crates.io.

git clone https://github.com/BurntSushi/byteorder _upstream/byteorder
pushd _upstream/byteorder
git checkout 0.5.3
popd
rm -rf mp4parse/src/byteorder
mkdir mp4parse/src/byteorder
cp _upstream/byteorder/Cargo.toml byteorder/
cp _upstream/byteorder/src/lib.rs byteorder/src/
cp _upstream/byteorder/src/new.rs byteorder/src/

echo "Applying patches..."
patch -p4 < mp4parse-cargo.patch

echo "Cleaning up..."
rm -rf _upstream

echo "Updated to ${VER}."
