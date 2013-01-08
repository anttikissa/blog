#!/bin/sh

cd $(dirname $0)

export BLOG_ENV=dev

while ./test && ./server/run.js; do true; done

