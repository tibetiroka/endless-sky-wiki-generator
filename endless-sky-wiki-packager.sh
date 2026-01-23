#!/usr/bin/env bash

function check_command() {
  local c

	for c in "$@"; do
		if ! command -v "$c" >/dev/null 2>&1; then
			echo "Command $c not found" 1>&2
			exit 1
		fi
	done
}

function compress() {
	if [ "$#" == 2 ]; then
		gzip --stdout --best --keep "$1" > "$2"
	elif [ "$#" == 1 ];  then
		gzip --stdout --best --keep > "$1"
	else
		echo "Unknown compression options" >&2
		exit 1
	fi
}

function compress_each() {
  local file
  local output

	IFS=$'\n' files=( $(find "$1" -type f) )
	for file in "${files[@]}"
	do
		output="$2/$(realpath -m --relative-to="$1" "$file")"
		mkdir -p "$(realpath -m "$output/..")"
    	compress "$file" "$output"
	done
}

function compress_bulk() {
  local dir

	dir=$(pwd)
	cd "$1"
	shopt -s dotglob
	tar --create --to-stdout -- * | compress "$2"
	cd "$dir"
}

check_command gzip tar rm find mkdir echo realpath shopt pwd cd

if [ "$#" != "4" ]; then
	echo "Incorrect number of parameters" 1>&2
	exit 1
fi

generated_dir="$1"
index_dir="$2"
assets_dir="$3"
output="$4"

mkdir -p "$output/index"
mkdir -p "$output/data"

compress_each "$index_dir/entries" "$output/index/entries"
compress_each "$index_dir/references" "$output/index/references"

compress_each "$generated_dir" "$output/data"

compress_bulk "$generated_dir/system/data" "$output/data/system/all_systems"

if [ -d "$output/assets" ]; then
	rm -rf "$output/assets"
fi
mv "$assets_dir" "$output/assets"