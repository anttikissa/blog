#!/bin/sh

cd $(dirname $0)

while true; do
	./server/run.js
	echo "Server stopped, return code $?."
	sleep 1
	echo "Restarting..."
done
