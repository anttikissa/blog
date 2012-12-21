#!/bin/sh

cd $(dirname $0)

export BLOG_ENV=dev

while ./server/run.js; do true; done

