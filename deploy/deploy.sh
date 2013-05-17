#!/bin/sh

# Ugly deploy script.

# PLEASE NOTE that you must run 'useradd blog' remotely before running this.

set -ex

TARGETHOST=antti@sykari.net
NAME=blog

cd $(dirname $0)/..

ssh $TARGETHOST sudo mkdir -p /opt/apps
ssh $TARGETHOST sudo mkdir -p /opt/apps/previous
ssh $TARGETHOST sudo chown antti.wheel /opt/apps
ssh $TARGETHOST sudo rm -rf /opt/apps/previous/$NAME
ssh $TARGETHOST sudo mv /opt/apps/$NAME /opt/apps/previous/$NAME
ssh $TARGETHOST mkdir -p /opt/apps/$NAME
rsync -r --exclude .git --exclude-from=.gitignore . $TARGETHOST:/opt/apps/$NAME
ssh $TARGETHOST sudo chown blog.blog -R /opt/apps/$NAME
ssh $TARGETHOST sudo cp -i /opt/apps/$NAME/deploy/$NAME.conf /etc/init/
ssh $TARGETHOST "sudo stop $NAME; sudo start $NAME"

