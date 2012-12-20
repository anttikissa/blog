#!/bin/bash

BLOG_ENV=dev

while ./server/run.js --restart; do true; done

